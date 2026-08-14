const SESSION_COOKIE = "__Host-sw_session";
const SESSION_TTL = 60 * 60 * 24 * 30;
const OAUTH_STATE_TTL = 10 * 60;
const ACCOUNT_URL = "https://swcreate.com/account/";
const GOOGLE_OAUTH = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN = "https://oauth2.googleapis.com/token";
const GOOGLE_USERINFO = "https://openidconnect.googleapis.com/v1/userinfo";
const KICK_OAUTH = "https://id.kick.com";
const KICK_API = "https://api.kick.com/public/v1";
const ALLOWED_ORIGINS = new Set([
  "https://swcreate.com",
  "https://www.swcreate.com",
  "https://switly01.github.io",
  "http://localhost:5173",
  "http://127.0.0.1:5173",
]);

function hex(bytes) {
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

function randomHex(size) {
  const bytes = new Uint8Array(size);
  crypto.getRandomValues(bytes);
  return hex(bytes);
}

async function sha256(value) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return hex(new Uint8Array(digest));
}

function base64Url(bytes) {
  return btoa(String.fromCharCode(...bytes)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

async function sha256Base64Url(value) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return base64Url(new Uint8Array(digest));
}

function redirect(location, cookie) {
  const headers = new Headers({ location, "cache-control": "no-store", "referrer-policy": "no-referrer" });
  if (cookie) headers.append("set-cookie", cookie);
  return new Response(null, { status: 302, headers });
}

function accountRedirect(params = {}, cookie) {
  const target = new URL(ACCOUNT_URL);
  Object.entries(params).forEach(([key, value]) => target.searchParams.set(key, String(value)));
  return redirect(target.toString(), cookie);
}

async function passwordDigest(password, salt, pepper) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(`${password}${pepper}`),
    "PBKDF2",
    false,
    ["deriveBits"],
  );
  const result = await crypto.subtle.deriveBits(
    { name: "PBKDF2", hash: "SHA-256", salt: new TextEncoder().encode(salt), iterations: 100_000 },
    key,
    256,
  );
  return hex(new Uint8Array(result));
}

function safeEqual(left, right) {
  if (left.length !== right.length) return false;
  let difference = 0;
  for (let index = 0; index < left.length; index += 1) difference |= left.charCodeAt(index) ^ right.charCodeAt(index);
  return difference === 0;
}

function corsHeaders(request) {
  const origin = request.headers.get("origin");
  const headers = new Headers({
    "cache-control": "no-store",
    "content-type": "application/json; charset=utf-8",
    "x-content-type-options": "nosniff",
    "referrer-policy": "no-referrer",
    vary: "Origin",
  });
  if (origin && ALLOWED_ORIGINS.has(origin)) {
    headers.set("access-control-allow-origin", origin);
    headers.set("access-control-allow-credentials", "true");
    headers.set("access-control-allow-methods", "GET,POST,PUT,OPTIONS");
    headers.set("access-control-allow-headers", "Content-Type");
  }
  return headers;
}

function json(request, body, status = 200, cookie) {
  const headers = corsHeaders(request);
  if (cookie) headers.append("set-cookie", cookie);
  return new Response(JSON.stringify(body), { status, headers });
}

function validOrigin(request) {
  const origin = request.headers.get("origin");
  return Boolean(origin && ALLOWED_ORIGINS.has(origin));
}

function readCookie(request, name) {
  const source = request.headers.get("cookie") || "";
  for (const part of source.split(";")) {
    const [key, ...rest] = part.trim().split("=");
    if (key === name) return decodeURIComponent(rest.join("="));
  }
  return null;
}

function sessionCookie(token) {
  return `${SESSION_COOKIE}=${encodeURIComponent(token)}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${SESSION_TTL}`;
}

function clearSessionCookie() {
  return `${SESSION_COOKIE}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`;
}

async function parseBody(request) {
  const length = Number(request.headers.get("content-length") || 0);
  if (length > 16_384) throw new Error("PAYLOAD_TOO_LARGE");
  return request.json();
}

async function rateLimit(env, request, action, limit, windowSeconds) {
  const now = Math.floor(Date.now() / 1000);
  const ip = request.headers.get("cf-connecting-ip") || "unknown";
  const key = await sha256(`${action}:${ip}:${env.AUTH_PEPPER}`);
  await env.DB.prepare(`
    INSERT INTO sw_rate_limits (rate_key, count, reset_at)
    VALUES (?, 1, ?)
    ON CONFLICT(rate_key) DO UPDATE SET
      count = CASE WHEN reset_at <= ? THEN 1 ELSE count + 1 END,
      reset_at = CASE WHEN reset_at <= ? THEN excluded.reset_at ELSE reset_at END
  `).bind(key, now + windowSeconds, now, now).run();
  const row = await env.DB.prepare("SELECT count, reset_at FROM sw_rate_limits WHERE rate_key = ?").bind(key).first();
  if (row && row.reset_at > now && row.count > limit) throw new Error("RATE_LIMIT");
}

async function createSession(env, userId) {
  const token = randomHex(32);
  const tokenHash = await sha256(token);
  const now = Math.floor(Date.now() / 1000);
  await env.DB.prepare("INSERT INTO sw_sessions (id, user_id, token_hash, expires_at, created_at, last_seen_at) VALUES (?, ?, ?, ?, ?, ?)")
    .bind(crypto.randomUUID(), userId, tokenHash, now + SESSION_TTL, now, now).run();
  return token;
}

async function currentUser(env, request) {
  const token = readCookie(request, SESSION_COOKIE);
  if (!token) return null;
  const tokenHash = await sha256(token);
  const now = Math.floor(Date.now() / 1000);
  const user = await env.DB.prepare(`
    SELECT u.id, u.email, u.display_name AS displayName, u.created_at AS createdAt, s.id AS sessionId
    FROM sw_sessions s
    JOIN sw_users u ON u.id = s.user_id
    WHERE s.token_hash = ? AND s.expires_at > ?
    LIMIT 1
  `).bind(tokenHash, now).first();
  if (!user) return null;
  await env.DB.prepare("UPDATE sw_sessions SET last_seen_at = ? WHERE id = ?").bind(now, user.sessionId).run();
  return user;
}

async function accountPayload(env, user) {
  const now = Math.floor(Date.now() / 1000);
  const rows = await env.DB.prepare(`
    SELECT p.name AS product, p.slug AS slug, e.tier AS tier
    FROM sw_entitlements e
    JOIN sw_products p ON p.id = e.product_id
    WHERE e.user_id = ? AND (e.expires_at IS NULL OR e.expires_at > ?)
    ORDER BY p.name ASC
  `).bind(user.id, now).all();
  return {
    user: { id: user.id, email: user.email, displayName: user.displayName, createdAt: user.createdAt },
    entitlements: rows.results || [],
  };
}

async function publicStats(env, request) {
  const now = Math.floor(Date.now() / 1000);
  const activeSince = now - (15 * 60);
  const [accounts, active] = await Promise.all([
    env.DB.prepare("SELECT COUNT(*) AS total FROM sw_users").first(),
    env.DB.prepare("SELECT COUNT(DISTINCT user_id) AS total FROM sw_sessions WHERE expires_at > ? AND last_seen_at >= ?")
      .bind(now, activeSince).first(),
  ]);
  const headers = corsHeaders(request);
  headers.set("cache-control", "public, max-age=30, s-maxage=30");
  return new Response(JSON.stringify({
    registeredAccounts: Number(accounts?.total || 0),
    activeUsers: Number(active?.total || 0),
  }), { status: 200, headers });
}

async function register(env, request) {
  await rateLimit(env, request, "register", 6, 60 * 60);
  const body = await parseBody(request);
  const email = String(body.email || "").trim().toLowerCase();
  const displayName = String(body.displayName || "").trim();
  const password = String(body.password || "");
  if (!/^\S+@\S+\.\S+$/.test(email) || email.length > 254) return json(request, { error: "Geçerli bir e-posta adresi gir." }, 400);
  if (displayName.length < 2 || displayName.length > 48) return json(request, { error: "Görünen ad 2–48 karakter olmalı." }, 400);
  if (password.length < 10 || password.length > 200) return json(request, { error: "Şifre en az 10 karakter olmalı." }, 400);
  const exists = await env.DB.prepare("SELECT id FROM sw_users WHERE email = ? LIMIT 1").bind(email).first();
  if (exists) return json(request, { error: "Bu e-posta zaten bir SW hesabına bağlı." }, 409);

  const now = Math.floor(Date.now() / 1000);
  const userId = crypto.randomUUID();
  const salt = randomHex(18);
  const digest = await passwordDigest(password, salt, env.AUTH_PEPPER);
  await env.DB.batch([
    env.DB.prepare("INSERT INTO sw_users (id, email, display_name, password_hash, password_salt, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)").bind(userId, email, displayName, digest, salt, now, now),
    env.DB.prepare("INSERT OR IGNORE INTO sw_products (id, name, slug, status, created_at) VALUES ('play-streamers', 'Play Streamers', 'play-streamers', 'active', ?)").bind(now),
    env.DB.prepare("INSERT OR IGNORE INTO sw_products (id, name, slug, status, created_at) VALUES ('play-connect', 'Play Connect', 'play-connect', 'active', ?)").bind(now),
    env.DB.prepare("INSERT INTO sw_entitlements (id, user_id, product_id, tier, source, starts_at, created_at, updated_at) VALUES (?, ?, 'play-streamers', 'free', 'registration', ?, ?, ?)").bind(crypto.randomUUID(), userId, now, now, now),
    env.DB.prepare("INSERT INTO sw_entitlements (id, user_id, product_id, tier, source, starts_at, created_at, updated_at) VALUES (?, ?, 'play-connect', 'free', 'registration', ?, ?, ?)").bind(crypto.randomUUID(), userId, now, now, now),
  ]);
  const token = await createSession(env, userId);
  return json(request, await accountPayload(env, { id: userId, email, displayName, createdAt: now }), 201, sessionCookie(token));
}

async function login(env, request) {
  await rateLimit(env, request, "login", 12, 15 * 60);
  const body = await parseBody(request);
  const email = String(body.email || "").trim().toLowerCase();
  const password = String(body.password || "");
  const user = await env.DB.prepare("SELECT id, email, display_name AS displayName, password_hash AS passwordHash, password_salt AS passwordSalt, created_at AS createdAt FROM sw_users WHERE email = ? LIMIT 1")
    .bind(email).first();
  const candidate = await passwordDigest(password || "invalid-password", user?.passwordSalt || "invalid-salt", env.AUTH_PEPPER);
  if (!user || !safeEqual(candidate, user.passwordHash)) return json(request, { error: "E-posta veya şifre hatalı." }, 401);
  const token = await createSession(env, user.id);
  return json(request, await accountPayload(env, user), 200, sessionCookie(token));
}

async function logout(env, request) {
  const token = readCookie(request, SESSION_COOKIE);
  if (token) await env.DB.prepare("DELETE FROM sw_sessions WHERE token_hash = ?").bind(await sha256(token)).run();
  return json(request, { ok: true }, 200, clearSessionCookie());
}

async function updateProfile(env, request, user) {
  const body = await parseBody(request);
  const displayName = String(body.displayName || "").trim();
  if (displayName.length < 2 || displayName.length > 48) return json(request, { error: "Görünen ad 2–48 karakter olmalı." }, 400);
  const now = Math.floor(Date.now() / 1000);
  await env.DB.prepare("UPDATE sw_users SET display_name = ?, updated_at = ? WHERE id = ?").bind(displayName, now, user.id).run();
  return json(request, await accountPayload(env, { ...user, displayName }));
}

function oauthProviderConfig(env, provider, origin) {
  if (provider === "google" && env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET) {
    return {
      clientId: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
      authorizeUrl: GOOGLE_OAUTH,
      tokenUrl: GOOGLE_TOKEN,
      redirectUri: `${origin}/api/auth/oauth/google/callback`,
      scope: "openid profile email",
    };
  }
  if (provider === "kick" && env.KICK_CLIENT_ID && env.KICK_CLIENT_SECRET) {
    return {
      clientId: env.KICK_CLIENT_ID,
      clientSecret: env.KICK_CLIENT_SECRET,
      authorizeUrl: `${KICK_OAUTH}/oauth/authorize`,
      tokenUrl: `${KICK_OAUTH}/oauth/token`,
      redirectUri: `${origin}/api/auth/oauth/kick/callback`,
      scope: "user:read",
    };
  }
  return null;
}

async function beginOAuth(env, request, provider) {
  await rateLimit(env, request, `oauth-start:${provider}`, 30, 15 * 60);
  const url = new URL(request.url);
  const config = oauthProviderConfig(env, provider, url.origin);
  if (!config) return accountRedirect({ oauth_error: "configuration" });

  const state = randomHex(32);
  const verifier = randomHex(32);
  const now = Math.floor(Date.now() / 1000);
  await env.DB.batch([
    env.DB.prepare("DELETE FROM sw_oauth_states WHERE expires_at <= ?").bind(now),
    env.DB.prepare("INSERT INTO sw_oauth_states (state, provider, code_verifier, expires_at, created_at) VALUES (?, ?, ?, ?, ?)")
      .bind(state, provider, verifier, now + OAUTH_STATE_TTL, now),
  ]);

  const target = new URL(config.authorizeUrl);
  target.searchParams.set("response_type", "code");
  target.searchParams.set("client_id", config.clientId);
  target.searchParams.set("redirect_uri", config.redirectUri);
  target.searchParams.set("scope", config.scope);
  target.searchParams.set("state", state);
  target.searchParams.set("code_challenge", await sha256Base64Url(verifier));
  target.searchParams.set("code_challenge_method", "S256");
  if (provider === "google") target.searchParams.set("prompt", "select_account");
  return redirect(target.toString());
}

async function consumeOAuthState(env, provider, state) {
  const now = Math.floor(Date.now() / 1000);
  const row = await env.DB.prepare("SELECT state, provider, code_verifier AS codeVerifier, expires_at AS expiresAt FROM sw_oauth_states WHERE state = ? AND provider = ? LIMIT 1")
    .bind(state, provider).first();
  if (!row) return null;
  await env.DB.prepare("DELETE FROM sw_oauth_states WHERE state = ?").bind(state).run();
  return Number(row.expiresAt) > now ? row : null;
}

async function oauthToken(config, code, verifier) {
  const response = await fetch(config.tokenUrl, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded", accept: "application/json" },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      client_id: config.clientId,
      client_secret: config.clientSecret,
      redirect_uri: config.redirectUri,
      code_verifier: verifier,
      code,
    }),
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok || !body.access_token) throw new Error("TOKEN");
  return body.access_token;
}

async function oauthProfile(provider, accessToken) {
  const endpoint = provider === "google" ? GOOGLE_USERINFO : `${KICK_API}/users`;
  const response = await fetch(endpoint, { headers: { authorization: `Bearer ${accessToken}`, accept: "application/json" } });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error("PROFILE");
  if (provider === "google") {
    if (!body.sub || !body.email || body.email_verified === false) throw new Error("PROFILE");
    return { id: String(body.sub), email: String(body.email).trim().toLowerCase(), displayName: String(body.name || body.email.split("@")[0]).slice(0, 48) };
  }
  const source = Array.isArray(body.data) ? body.data[0] : body.data || body;
  const id = source?.user_id || source?.id;
  if (!id) throw new Error("PROFILE");
  return { id: String(id), email: null, displayName: String(source.username || source.slug || source.name || "Kick kullanıcısı").slice(0, 48) };
}

async function grantDefaultProducts(env, userId, source, now) {
  await env.DB.batch([
    env.DB.prepare("INSERT OR IGNORE INTO sw_products (id, name, slug, status, created_at) VALUES ('play-streamers', 'Play Streamers', 'play-streamers', 'active', ?)").bind(now),
    env.DB.prepare("INSERT OR IGNORE INTO sw_products (id, name, slug, status, created_at) VALUES ('play-connect', 'Play Connect', 'play-connect', 'active', ?)").bind(now),
    env.DB.prepare("INSERT OR IGNORE INTO sw_entitlements (id, user_id, product_id, tier, source, starts_at, created_at, updated_at) VALUES (?, ?, 'play-streamers', 'free', ?, ?, ?, ?)").bind(crypto.randomUUID(), userId, source, now, now, now),
    env.DB.prepare("INSERT OR IGNORE INTO sw_entitlements (id, user_id, product_id, tier, source, starts_at, created_at, updated_at) VALUES (?, ?, 'play-connect', 'free', ?, ?, ?, ?)").bind(crypto.randomUUID(), userId, source, now, now, now),
  ]);
}

async function oauthUser(env, provider, profile) {
  const now = Math.floor(Date.now() / 1000);
  let user = await env.DB.prepare(`
    SELECT u.id, u.email, u.display_name AS displayName, u.created_at AS createdAt
    FROM sw_oauth_identities i JOIN sw_users u ON u.id = i.user_id
    WHERE i.provider = ? AND i.provider_user_id = ? LIMIT 1
  `).bind(provider, profile.id).first();

  if (!user && profile.email) {
    user = await env.DB.prepare("SELECT id, email, display_name AS displayName, created_at AS createdAt FROM sw_users WHERE lower(email) = lower(?) LIMIT 1")
      .bind(profile.email).first();
  }

  if (!user) {
    const userId = crypto.randomUUID();
    const salt = randomHex(18);
    const digest = await passwordDigest(randomHex(32), salt, env.AUTH_PEPPER);
    const email = profile.email || `kick-${profile.id}-${userId.slice(0, 8)}@identity.swcreate.invalid`;
    await env.DB.prepare("INSERT INTO sw_users (id, email, display_name, password_hash, password_salt, email_verified_at, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)")
      .bind(userId, email, profile.displayName, digest, salt, profile.email ? now : null, now, now).run();
    await grantDefaultProducts(env, userId, `oauth:${provider}`, now);
    user = { id: userId, email, displayName: profile.displayName, createdAt: now };
  }

  await env.DB.prepare(`
    INSERT INTO sw_oauth_identities (id, user_id, provider, provider_user_id, provider_email, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(provider, provider_user_id) DO UPDATE SET provider_email = excluded.provider_email, updated_at = excluded.updated_at
  `).bind(crypto.randomUUID(), user.id, provider, profile.id, profile.email, now, now).run();
  return user;
}

async function finishOAuth(env, request, provider) {
  const url = new URL(request.url);
  if (url.searchParams.get("error")) return accountRedirect({ oauth_error: "cancelled" });
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  if (!code || !state) return accountRedirect({ oauth_error: "failed" });
  const savedState = await consumeOAuthState(env, provider, state);
  if (!savedState) return accountRedirect({ oauth_error: "expired" });
  const config = oauthProviderConfig(env, provider, url.origin);
  if (!config) return accountRedirect({ oauth_error: "configuration" });
  try {
    const accessToken = await oauthToken(config, code, savedState.codeVerifier);
    const profile = await oauthProfile(provider, accessToken);
    const user = await oauthUser(env, provider, profile);
    const token = await createSession(env, user.id);
    return accountRedirect({ oauth: "success" }, sessionCookie(token));
  } catch (error) {
    console.error("SW OAuth error", provider, error instanceof Error ? error.message : "unknown");
    return accountRedirect({ oauth_error: error instanceof Error && error.message === "PROFILE" ? "profile" : "failed" });
  }
}

export default {
  async fetch(request, env) {
    if (!env.DB || !env.AUTH_PEPPER) return json(request, { error: "SW Identity yapılandırması tamamlanmamış." }, 503);
    if (request.method === "OPTIONS") {
      const origin = request.headers.get("origin");
      return new Response(null, { status: origin && ALLOWED_ORIGINS.has(origin) ? 204 : 403, headers: corsHeaders(request) });
    }

    const url = new URL(request.url);
    try {
      if (request.method === "GET" && url.pathname === "/api/health") return json(request, { ok: true, service: "sw-identity" });
      if (request.method === "GET" && url.pathname === "/api/stats") return await publicStats(env, request);
      if (request.method === "GET" && url.pathname === "/api/auth/oauth/google/start") return await beginOAuth(env, request, "google");
      if (request.method === "GET" && url.pathname === "/api/auth/oauth/kick/start") return await beginOAuth(env, request, "kick");
      if (request.method === "GET" && url.pathname === "/api/auth/oauth/google/callback") return await finishOAuth(env, request, "google");
      if (request.method === "GET" && url.pathname === "/api/auth/oauth/kick/callback") return await finishOAuth(env, request, "kick");
      if (["POST", "PUT", "PATCH", "DELETE"].includes(request.method) && !validOrigin(request)) return json(request, { error: "Geçersiz istek kaynağı." }, 403);
      if (request.method === "POST" && url.pathname === "/api/auth/register") return await register(env, request);
      if (request.method === "POST" && url.pathname === "/api/auth/login") return await login(env, request);
      if (request.method === "POST" && url.pathname === "/api/auth/logout") return await logout(env, request);

      const user = await currentUser(env, request);
      if (request.method === "GET" && url.pathname === "/api/account") return user ? json(request, await accountPayload(env, user)) : json(request, { error: "Oturum bulunamadı." }, 401);
      if (request.method === "PUT" && url.pathname === "/api/account/profile") return user ? await updateProfile(env, request, user) : json(request, { error: "Oturum bulunamadı." }, 401);
      return json(request, { error: "İstek bulunamadı." }, 404);
    } catch (error) {
      if (error instanceof Error && error.message === "RATE_LIMIT") return json(request, { error: "Çok fazla deneme yapıldı. Biraz bekleyip yeniden dene." }, 429);
      if (error instanceof Error && error.message === "PAYLOAD_TOO_LARGE") return json(request, { error: "Gönderilen veri çok büyük." }, 413);
      console.error("SW Identity error", error);
      return json(request, { error: "SW Identity şu anda işlemi tamamlayamadı." }, 500);
    }
  },
};
