const SESSION_COOKIE = "__Host-sw_session";
const SESSION_TTL = 60 * 60 * 24 * 30;
const OAUTH_STATE_TTL = 10 * 60;
const SW_IDENTITY_VERSION = "1.1.0";
const TOTP_PERIOD_SECONDS = 30;
const TOTP_DIGITS = 6;
const TOTP_SETUP_TTL = 10 * 60;
const TOTP_CHALLENGE_TTL = 5 * 60;
const TOTP_MAX_ATTEMPTS = 5;
const TOTP_RECOVERY_CODE_COUNT = 8;
const ACCOUNT_URL = "https://swcreate.com/account/";
const GOOGLE_OAUTH = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN = "https://oauth2.googleapis.com/token";
const GOOGLE_USERINFO = "https://openidconnect.googleapis.com/v1/userinfo";
const KICK_OAUTH = "https://id.kick.com";
const KICK_API = "https://api.kick.com/public/v1";
const ALLOWED_ORIGINS = new Set([
  "https://swcreate.com",
  "https://www.swcreate.com",
  "https://pstreamers.com",
  "https://www.pstreamers.com",
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
    "cross-origin-resource-policy": "same-site",
    "permissions-policy": "camera=(), microphone=(), geolocation=()",
    "strict-transport-security": "max-age=31536000; includeSubDomains",
    "x-frame-options": "DENY",
    "x-content-type-options": "nosniff",
    "x-sw-identity": `SW Identity v${SW_IDENTITY_VERSION}`,
    "x-sw-flow-id": requestFlowId(request),
    "referrer-policy": "no-referrer",
    vary: "Origin",
  });
  if (origin && ALLOWED_ORIGINS.has(origin)) {
    headers.set("access-control-allow-origin", origin);
    headers.set("access-control-allow-credentials", "true");
    headers.set("access-control-allow-methods", "GET,POST,PUT,OPTIONS");
    headers.set("access-control-allow-headers", "Content-Type, X-SW-Flow-ID");
    headers.set("access-control-expose-headers", "X-SW-Identity, X-SW-Flow-ID");
  }
  return headers;
}

const flowIds = new WeakMap();
function requestFlowId(request) {
  if (flowIds.has(request)) return flowIds.get(request);
  const supplied = String(request.headers.get("x-sw-flow-id") || "").trim();
  const value = /^[a-f0-9-]{20,64}$/i.test(supplied) ? supplied : crypto.randomUUID();
  flowIds.set(request, value);
  return value;
}

function activityCorsHeaders(request) {
  const origin = request.headers.get("origin") || "";
  const headers = corsHeaders(request);
  if (origin.startsWith("chrome-extension://") || origin.startsWith("moz-extension://")) {
    headers.set("access-control-allow-origin", origin);
    headers.set("access-control-allow-methods", "POST,OPTIONS");
    headers.set("access-control-allow-headers", "Content-Type");
  }
  return headers;
}

function validActivityOrigin(request, product) {
  const origin = request.headers.get("origin") || "";
  if (product === "sw-create") return origin === "https://swcreate.com" || origin === "https://www.swcreate.com" || origin === "http://localhost:5173" || origin === "http://127.0.0.1:5173";
  if (product === "play-streamers") return origin === "https://pstreamers.com" || origin === "https://www.pstreamers.com";
  if (product === "play-connect") return !origin || origin.startsWith("chrome-extension://") || origin.startsWith("moz-extension://");
  return false;
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

function sessionCookie(token, remember = false) {
  const persistence = remember ? `; Max-Age=${SESSION_TTL}` : "";
  return `${SESSION_COOKIE}=${encodeURIComponent(token)}; Path=/; HttpOnly; Secure; SameSite=Lax${persistence}`;
}

function clearSessionCookie() {
  return `${SESSION_COOKIE}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`;
}

async function parseBody(request) {
  const length = Number(request.headers.get("content-length") || 0);
  if (length > 16_384) throw new Error("PAYLOAD_TOO_LARGE");
  if (!String(request.headers.get("content-type") || "").toLowerCase().startsWith("application/json")) throw new Error("INVALID_CONTENT_TYPE");
  return request.json();
}

async function recordSecurityEvent(env, request, action, userId = null, outcome = "success") {
  const now = Math.floor(Date.now() / 1000);
  const ip = request.headers.get("cf-connecting-ip") || "unknown";
  const ipHash = await sha256(`security:${ip}:${env.AUTH_PEPPER}`);
  await env.DB.prepare(`INSERT INTO sw_security_events
    (id, user_id, action, outcome, flow_id, ip_hash, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)`)
    .bind(crypto.randomUUID(), userId, String(action).slice(0, 80), String(outcome).slice(0, 24), requestFlowId(request), ipHash, now).run()
    .catch(() => undefined);
}

async function rateLimit(env, request, action, limit, windowSeconds, subject = "") {
  const now = Math.floor(Date.now() / 1000);
  const ip = request.headers.get("cf-connecting-ip") || "unknown";
  const key = await sha256(`${action}:${ip}:${String(subject).trim().toLowerCase().slice(0, 160)}:${env.AUTH_PEPPER}`);
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

async function verifyIdentityRequest(env, request, body) {
  if (String(body.website || "").trim()) return false;
  const startedAt = Number(body.startedAt);
  const elapsed = Date.now() - startedAt;
  if (!Number.isFinite(startedAt) || elapsed < 650 || elapsed > 2 * 60 * 60 * 1000) return false;
  if (!env.TURNSTILE_SECRET_KEY) return true;

  const token = String(body.turnstileToken || "").trim();
  if (!token || token.length > 2048) return false;
  const form = new FormData();
  form.set("secret", env.TURNSTILE_SECRET_KEY);
  form.set("response", token);
  form.set("remoteip", request.headers.get("cf-connecting-ip") || "");
  form.set("idempotency_key", crypto.randomUUID());
  const response = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", { method: "POST", body: form });
  if (!response.ok) return false;
  const result = await response.json();
  const hostname = String(result.hostname || "").toLowerCase();
  const validHostname = hostname === "swcreate.com" || hostname === "www.swcreate.com" || hostname === "localhost" || hostname === "127.0.0.1";
  return result.success === true && result.action === "sw-auth" && validHostname;
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
    SELECT u.id, u.email, u.username, u.display_name AS displayName, u.birth_date AS birthDate,
      u.created_at AS createdAt, u.two_factor_enabled AS twoFactorEnabled, s.id AS sessionId
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
    user: {
      id: user.id,
      email: String(user.email || "").endsWith("@identity.swcreate.invalid") ? null : user.email,
      username: user.username || user.displayName,
      displayName: user.displayName,
      birthDate: user.birthDate || null,
      createdAt: user.createdAt,
    },
    entitlements: rows.results || [],
    security: {
      identityVersion: SW_IDENTITY_VERSION,
      twoFactorEnabled: Number(user.twoFactorEnabled || 0) === 1,
      dataFlowProtection: "verified",
    },
  };
}

async function publicStats(env, request) {
  const now = Math.floor(Date.now() / 1000);
  const activeSince = now - (15 * 60);
  const [accounts, activeSessions, activeActivity, products] = await Promise.all([
    env.DB.prepare("SELECT COUNT(*) AS total FROM sw_users").first(),
    env.DB.prepare("SELECT COUNT(DISTINCT user_id) AS total FROM sw_sessions WHERE expires_at > ? AND last_seen_at >= ?")
      .bind(now, activeSince).first(),
    env.DB.prepare("SELECT COUNT(DISTINCT visitor_hash) AS total FROM sw_product_activity WHERE last_seen_at >= ?")
      .bind(activeSince).first().catch(() => ({ total: 0 })),
    env.DB.prepare("SELECT COUNT(*) AS total FROM sw_products WHERE status = 'active'").first(),
  ]);
  const headers = corsHeaders(request);
  headers.set("cache-control", "public, max-age=30, s-maxage=30");
  return new Response(JSON.stringify({
    registeredAccounts: Number(accounts?.total || 0),
    activeUsers: Math.max(Number(activeSessions?.total || 0), Number(activeActivity?.total || 0)),
    activeProducts: Number(products?.total || 0),
  }), { status: 200, headers });
}

async function recordProductActivity(env, request) {
  await rateLimit(env, request, "sw-product-activity", 180, 15 * 60);
  const body = await parseBody(request);
  const product = String(body.product || "").trim().toLowerCase();
  const visitor = String(body.visitor || "").trim();
  if (!validActivityOrigin(request, product)) return json(request, { error: "Geçersiz ürün kaynağı." }, 403);
  if (visitor.length < 16 || visitor.length > 160) return json(request, { error: "Geçersiz etkinlik kimliği." }, 400);
  const now = Math.floor(Date.now() / 1000);
  const visitorHash = await sha256(`${product}:${visitor}:${env.AUTH_PEPPER}`);
  await env.DB.batch([
    env.DB.prepare(`
      INSERT INTO sw_product_activity (visitor_hash, product_id, first_seen_at, last_seen_at)
      VALUES (?, ?, ?, ?)
      ON CONFLICT(visitor_hash, product_id) DO UPDATE SET last_seen_at = excluded.last_seen_at
    `).bind(visitorHash, product, now, now),
    env.DB.prepare("DELETE FROM sw_product_activity WHERE last_seen_at < ?").bind(now - (7 * 24 * 60 * 60)),
  ]);
  const headers = activityCorsHeaders(request);
  return new Response(JSON.stringify({ ok: true }), { status: 200, headers });
}

async function register(env, request) {
  await rateLimit(env, request, "register", 6, 60 * 60);
  const body = await parseBody(request);
  const username = String(body.username || "").trim();
  await rateLimit(env, request, "register-account", 4, 60 * 60, username);
  if (!await verifyIdentityRequest(env, request, body)) throw new Error("BOT_CHALLENGE");
  const password = String(body.password || "");
  const passwordRepeat = String(body.passwordRepeat || "");
  const birthDate = String(body.birthDate || "").trim();
  const remember = body.remember === true;
  if (!/^[A-Za-z0-9._-]{3,32}$/.test(username)) return json(request, { error: "Kullanıcı adı 3–32 karakter olmalı; yalnızca harf, rakam, nokta, tire ve alt çizgi kullanılabilir." }, 400);
  if (password.length < 10 || password.length > 200) return json(request, { error: "Şifre en az 10 karakter olmalı." }, 400);
  if (password !== passwordRepeat) return json(request, { error: "Şifreler aynı değil." }, 400);
  const birth = new Date(`${birthDate}T00:00:00Z`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(birthDate) || Number.isNaN(birth.getTime()) || birth > new Date() || birth.getUTCFullYear() < 1900) return json(request, { error: "Geçerli bir doğum tarihi gir." }, 400);
  const exists = await env.DB.prepare("SELECT id FROM sw_users WHERE lower(username) = lower(?) LIMIT 1").bind(username).first();
  if (exists) return json(request, { error: "Bu kullanıcı adı zaten kullanılıyor." }, 409);

  const now = Math.floor(Date.now() / 1000);
  const userId = crypto.randomUUID();
  const email = `sw-${userId}@identity.swcreate.invalid`;
  const displayName = username;
  const salt = randomHex(18);
  const digest = await passwordDigest(password, salt, env.AUTH_PEPPER);
  await env.DB.batch([
    env.DB.prepare("INSERT INTO sw_users (id, email, username, display_name, birth_date, password_hash, password_salt, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)").bind(userId, email, username, displayName, birthDate, digest, salt, now, now),
    env.DB.prepare("INSERT OR IGNORE INTO sw_products (id, name, slug, status, created_at) VALUES ('play-streamers', 'Play Streamers', 'play-streamers', 'active', ?)").bind(now),
    env.DB.prepare("INSERT OR IGNORE INTO sw_products (id, name, slug, status, created_at) VALUES ('play-connect', 'Play Connect', 'play-connect', 'active', ?)").bind(now),
    env.DB.prepare("INSERT OR IGNORE INTO sw_products (id, name, slug, status, created_at) VALUES ('sw-create', 'SW Create', 'sw-create', 'active', ?)").bind(now),
    env.DB.prepare("INSERT INTO sw_entitlements (id, user_id, product_id, tier, source, starts_at, created_at, updated_at) VALUES (?, ?, 'play-streamers', 'free', 'registration', ?, ?, ?)").bind(crypto.randomUUID(), userId, now, now, now),
    env.DB.prepare("INSERT INTO sw_entitlements (id, user_id, product_id, tier, source, starts_at, created_at, updated_at) VALUES (?, ?, 'play-connect', 'free', 'registration', ?, ?, ?)").bind(crypto.randomUUID(), userId, now, now, now),
    env.DB.prepare("INSERT INTO sw_entitlements (id, user_id, product_id, tier, source, starts_at, created_at, updated_at) VALUES (?, ?, 'sw-create', 'free', 'registration', ?, ?, ?)").bind(crypto.randomUUID(), userId, now, now, now),
  ]);
  const token = await createSession(env, userId);
  await recordSecurityEvent(env, request, "account.register", userId);
  return json(request, await accountPayload(env, { id: userId, email, username, displayName, birthDate, createdAt: now, twoFactorEnabled: 0 }), 201, sessionCookie(token, remember));
}

async function login(env, request) {
  await rateLimit(env, request, "login", 12, 15 * 60);
  const body = await parseBody(request);
  const identity = String(body.identity || "").trim().toLowerCase();
  await rateLimit(env, request, "login-account", 8, 15 * 60, identity);
  if (!await verifyIdentityRequest(env, request, body)) throw new Error("BOT_CHALLENGE");
  const password = String(body.password || "");
  const remember = body.remember === true;
  const user = await env.DB.prepare("SELECT id, email, username, display_name AS displayName, birth_date AS birthDate, password_hash AS passwordHash, password_salt AS passwordSalt, created_at AS createdAt, two_factor_enabled AS twoFactorEnabled, totp_secret_ciphertext AS totpSecretCiphertext, totp_last_counter AS totpLastCounter FROM sw_users WHERE lower(email) = ? OR lower(username) = ? LIMIT 1")
    .bind(identity, identity).first();
  const candidate = await passwordDigest(password || "invalid-password", user?.passwordSalt || "invalid-salt", env.AUTH_PEPPER);
  const comparisonHash = user?.passwordHash || "0".repeat(64);
  if (!user || !safeEqual(candidate, comparisonHash)) {
    await recordSecurityEvent(env, request, "account.login", user?.id || null, "denied");
    return json(request, { error: "E-posta, kullanıcı adı veya şifre hatalı." }, 401);
  }
  if (Number(user.twoFactorEnabled) === 1 && user.totpSecretCiphertext) {
    const challenge = await createTwoFactorChallenge(env, user.id, remember);
    await recordSecurityEvent(env, request, "account.login.two_factor", user.id, "challenge");
    return json(request, challenge, 202);
  }
  const token = await createSession(env, user.id);
  await recordSecurityEvent(env, request, "account.login", user.id);
  return json(request, await accountPayload(env, user), 200, sessionCookie(token, remember));
}

function base64UrlBytes(value) {
  const normalized = String(value || "").replace(/-/g, "+").replace(/_/g, "/");
  const binary = atob(normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "="));
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

function base32Encode(bytes) {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  let output = "";
  let buffer = 0;
  let bits = 0;
  for (const byte of bytes) {
    buffer = (buffer << 8) | byte;
    bits += 8;
    while (bits >= 5) {
      output += alphabet[(buffer >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) output += alphabet[(buffer << (5 - bits)) & 31];
  return output;
}

function base32Decode(value) {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  const clean = String(value || "").toUpperCase().replace(/[^A-Z2-7]/g, "");
  let buffer = 0;
  let bits = 0;
  const output = [];
  for (const character of clean) {
    const index = alphabet.indexOf(character);
    if (index < 0) throw new Error("INVALID_TOTP_SECRET");
    buffer = (buffer << 5) | index;
    bits += 5;
    if (bits >= 8) {
      output.push((buffer >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }
  return new Uint8Array(output);
}

async function totpEncryptionKey(env) {
  if (!env.TOTP_ENCRYPTION_KEY || String(env.TOTP_ENCRYPTION_KEY).length < 32) throw new Error("TOTP_NOT_CONFIGURED");
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(String(env.TOTP_ENCRYPTION_KEY)));
  return crypto.subtle.importKey("raw", digest, { name: "AES-GCM" }, false, ["encrypt", "decrypt"]);
}

async function encryptTotpSecret(secret, env) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ciphertext = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv, additionalData: new TextEncoder().encode("sw-identity:totp:v1") },
    await totpEncryptionKey(env),
    new TextEncoder().encode(secret),
  );
  return `v1.${base64Url(iv)}.${base64Url(new Uint8Array(ciphertext))}`;
}

async function decryptTotpSecret(value, env) {
  const parts = String(value || "").split(".");
  if (parts.length !== 3 || parts[0] !== "v1") throw new Error("INVALID_TOTP_SECRET");
  const plaintext = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: base64UrlBytes(parts[1]), additionalData: new TextEncoder().encode("sw-identity:totp:v1") },
    await totpEncryptionKey(env),
    base64UrlBytes(parts[2]),
  );
  return new TextDecoder().decode(plaintext);
}

async function totpAtCounter(secret, counter) {
  const message = new Uint8Array(8);
  let remaining = BigInt(counter);
  for (let index = 7; index >= 0; index -= 1) {
    message[index] = Number(remaining & 255n);
    remaining >>= 8n;
  }
  const key = await crypto.subtle.importKey("raw", base32Decode(secret), { name: "HMAC", hash: "SHA-1" }, false, ["sign"]);
  const digest = new Uint8Array(await crypto.subtle.sign("HMAC", key, message));
  const offset = digest[digest.length - 1] & 15;
  const binary = ((digest[offset] & 127) << 24) | (digest[offset + 1] << 16) | (digest[offset + 2] << 8) | digest[offset + 3];
  return String(binary % (10 ** TOTP_DIGITS)).padStart(TOTP_DIGITS, "0");
}

async function verifyTotpCode(secret, code) {
  const counter = Math.floor(Date.now() / 1000 / TOTP_PERIOD_SECONDS);
  for (const drift of [-1, 0, 1]) {
    const candidateCounter = counter + drift;
    if (safeEqual(await totpAtCounter(secret, candidateCounter), code)) return { ok: true, counter: candidateCounter };
  }
  return { ok: false, counter: -1 };
}

function normalizeTwoFactorCode(value) {
  const raw = String(value || "").trim().toUpperCase().replace(/\s/g, "");
  if (/^\d{6}$/.test(raw)) return raw;
  const compact = raw.replace(/-/g, "");
  return /^[A-Z2-7]{8}$/.test(compact) ? compact : "";
}

function recoveryCodes() {
  return Array.from({ length: TOTP_RECOVERY_CODE_COUNT }, () => {
    const code = base32Encode(crypto.getRandomValues(new Uint8Array(5))).slice(0, 8);
    return `${code.slice(0, 4)}-${code.slice(4)}`;
  });
}

async function recoveryCodeHash(env, userId, code) {
  const normalized = String(code || "").toUpperCase().replace(/[^A-Z2-7]/g, "");
  return sha256(`recovery:${userId}:${normalized}:${env.AUTH_PEPPER}`);
}

async function verifyAndConsumeTwoFactor(env, user, code) {
  if (/^\d{6}$/.test(code)) {
    const secret = await decryptTotpSecret(user.totpSecretCiphertext, env);
    const verification = await verifyTotpCode(secret, code);
    if (!verification.ok) return { ok: false, error: "Authenticator kodu doğru değil." };
    if (verification.counter <= Number(user.totpLastCounter ?? -1)) return { ok: false, error: "Bu Authenticator kodu daha önce kullanılmış." };
    const updated = await env.DB.prepare("UPDATE sw_users SET totp_last_counter = ? WHERE id = ? AND totp_last_counter < ?")
      .bind(verification.counter, user.id, verification.counter).run();
    if (Number(updated?.meta?.changes || 0) !== 1) return { ok: false, error: "Bu Authenticator kodu daha önce kullanılmış." };
    return { ok: true };
  }
  const hash = await recoveryCodeHash(env, user.id, code);
  const recovery = await env.DB.prepare("SELECT id FROM sw_totp_recovery_codes WHERE user_id = ? AND code_hash = ? AND used_at IS NULL LIMIT 1")
    .bind(user.id, hash).first();
  if (!recovery) return { ok: false, error: "Kurtarma kodu geçersiz veya daha önce kullanılmış." };
  const consumed = await env.DB.prepare("UPDATE sw_totp_recovery_codes SET used_at = ? WHERE id = ? AND used_at IS NULL")
    .bind(Math.floor(Date.now() / 1000), recovery.id).run();
  return Number(consumed?.meta?.changes || 0) === 1 ? { ok: true } : { ok: false, error: "Kurtarma kodu daha önce kullanılmış." };
}

async function createTwoFactorChallenge(env, userId, remember) {
  const now = Math.floor(Date.now() / 1000);
  const challengeId = randomHex(32);
  await env.DB.batch([
    env.DB.prepare("DELETE FROM sw_totp_challenges WHERE expires_at <= ?").bind(now),
    env.DB.prepare("INSERT INTO sw_totp_challenges (id, user_id, remember, expires_at, attempts, created_at) VALUES (?, ?, ?, ?, 0, ?)")
      .bind(challengeId, userId, remember ? 1 : 0, now + TOTP_CHALLENGE_TTL, now),
  ]);
  return { twoFactorRequired: true, challengeId, expiresAt: new Date((now + TOTP_CHALLENGE_TTL) * 1000).toISOString() };
}

async function verifyTwoFactorLogin(env, request) {
  await rateLimit(env, request, "two-factor-login", 12, 15 * 60);
  const body = await parseBody(request);
  const challengeId = String(body.challengeId || "").trim();
  const code = normalizeTwoFactorCode(body.code);
  if (!/^[a-f0-9]{64}$/i.test(challengeId) || !code) return json(request, { error: "Geçerli doğrulama kodunu gir." }, 400);
  const now = Math.floor(Date.now() / 1000);
  const row = await env.DB.prepare(`SELECT c.id, c.user_id AS userId, c.remember, c.expires_at AS expiresAt, c.attempts,
    u.id, u.email, u.username, u.display_name AS displayName, u.birth_date AS birthDate, u.created_at AS createdAt,
    u.two_factor_enabled AS twoFactorEnabled, u.totp_secret_ciphertext AS totpSecretCiphertext, u.totp_last_counter AS totpLastCounter
    FROM sw_totp_challenges c JOIN sw_users u ON u.id = c.user_id WHERE c.id = ? LIMIT 1`).bind(challengeId).first();
  if (!row || Number(row.expiresAt) <= now || Number(row.attempts) >= TOTP_MAX_ATTEMPTS) return json(request, { error: "Doğrulama isteğinin süresi doldu. Yeniden giriş yap." }, 400);
  const verification = await verifyAndConsumeTwoFactor(env, row, code);
  if (!verification.ok) {
    await env.DB.prepare("UPDATE sw_totp_challenges SET attempts = attempts + 1 WHERE id = ?").bind(challengeId).run();
    await recordSecurityEvent(env, request, "account.login.two_factor", row.userId, "denied");
    return json(request, { error: verification.error }, 400);
  }
  await env.DB.prepare("DELETE FROM sw_totp_challenges WHERE id = ?").bind(challengeId).run();
  const token = await createSession(env, row.userId);
  await recordSecurityEvent(env, request, "account.login.two_factor", row.userId);
  return json(request, await accountPayload(env, row), 200, sessionCookie(token, Number(row.remember) === 1));
}

async function beginTotpSetup(env, request, user) {
  await rateLimit(env, request, "two-factor-setup", 5, 60 * 60, user.id);
  if (!env.TOTP_ENCRYPTION_KEY) throw new Error("TOTP_NOT_CONFIGURED");
  if (Number(user.twoFactorEnabled) === 1) return json(request, { error: "İki aşamalı doğrulama zaten açık." }, 400);
  const secret = base32Encode(crypto.getRandomValues(new Uint8Array(20)));
  const ciphertext = await encryptTotpSecret(secret, env);
  const setupId = randomHex(24);
  const now = Math.floor(Date.now() / 1000);
  await env.DB.batch([
    env.DB.prepare("DELETE FROM sw_totp_setups WHERE user_id = ? OR expires_at <= ?").bind(user.id, now),
    env.DB.prepare("INSERT INTO sw_totp_setups (id, user_id, secret_ciphertext, expires_at, attempts, created_at) VALUES (?, ?, ?, ?, 0, ?)")
      .bind(setupId, user.id, ciphertext, now + TOTP_SETUP_TTL, now),
  ]);
  const account = String(user.email || user.username || user.id).slice(0, 120);
  const issuer = "SW Identity";
  const otpauthUri = `otpauth://totp/${encodeURIComponent(`${issuer}:${account}`)}?secret=${secret}&issuer=${encodeURIComponent(issuer)}&algorithm=SHA1&digits=6&period=30`;
  await recordSecurityEvent(env, request, "two_factor.setup", user.id, "started");
  return json(request, { setupId, secret, formattedSecret: secret.match(/.{1,4}/g)?.join(" ") || secret, otpauthUri, expiresAt: new Date((now + TOTP_SETUP_TTL) * 1000).toISOString() });
}

async function confirmTotpSetup(env, request, user) {
  const body = await parseBody(request);
  const setupId = String(body.setupId || "").trim();
  const code = String(body.code || "").replace(/\s/g, "");
  if (!/^[a-f0-9]{48}$/i.test(setupId) || !/^\d{6}$/.test(code)) return json(request, { error: "Authenticator uygulamasındaki 6 haneli kodu gir." }, 400);
  const now = Math.floor(Date.now() / 1000);
  const setup = await env.DB.prepare("SELECT id, user_id AS userId, secret_ciphertext AS secretCiphertext, expires_at AS expiresAt, attempts FROM sw_totp_setups WHERE id = ? AND user_id = ? LIMIT 1")
    .bind(setupId, user.id).first();
  if (!setup || Number(setup.expiresAt) <= now || Number(setup.attempts) >= TOTP_MAX_ATTEMPTS) return json(request, { error: "Kurulumun süresi doldu. Yeniden başlat." }, 400);
  const verification = await verifyTotpCode(await decryptTotpSecret(setup.secretCiphertext, env), code);
  if (!verification.ok) {
    await env.DB.prepare("UPDATE sw_totp_setups SET attempts = attempts + 1 WHERE id = ?").bind(setup.id).run();
    return json(request, { error: "Authenticator kodu doğru değil." }, 400);
  }
  const codes = recoveryCodes();
  const statements = [
    env.DB.prepare("UPDATE sw_users SET two_factor_enabled = 1, totp_secret_ciphertext = ?, totp_last_counter = ?, updated_at = ? WHERE id = ?")
      .bind(setup.secretCiphertext, verification.counter, now, user.id),
    env.DB.prepare("DELETE FROM sw_totp_recovery_codes WHERE user_id = ?").bind(user.id),
    env.DB.prepare("DELETE FROM sw_totp_setups WHERE user_id = ?").bind(user.id),
  ];
  for (const recoveryCode of codes) statements.push(env.DB.prepare("INSERT INTO sw_totp_recovery_codes (id, user_id, code_hash, used_at, created_at) VALUES (?, ?, ?, NULL, ?)")
    .bind(crypto.randomUUID(), user.id, await recoveryCodeHash(env, user.id, recoveryCode), now));
  await env.DB.batch(statements);
  await recordSecurityEvent(env, request, "two_factor.enable", user.id);
  return json(request, { ...(await accountPayload(env, { ...user, twoFactorEnabled: 1 })), recoveryCodes: codes });
}

async function disableTotp(env, request, user) {
  const body = await parseBody(request);
  const code = normalizeTwoFactorCode(body.code);
  if (!code) return json(request, { error: "Authenticator veya kurtarma kodunu gir." }, 400);
  const privateUser = await env.DB.prepare("SELECT id, two_factor_enabled AS twoFactorEnabled, totp_secret_ciphertext AS totpSecretCiphertext, totp_last_counter AS totpLastCounter FROM sw_users WHERE id = ? LIMIT 1").bind(user.id).first();
  if (!privateUser || Number(privateUser.twoFactorEnabled) !== 1) return json(request, { error: "İki aşamalı doğrulama açık değil." }, 400);
  const verification = await verifyAndConsumeTwoFactor(env, privateUser, code);
  if (!verification.ok) return json(request, { error: verification.error }, 400);
  const now = Math.floor(Date.now() / 1000);
  await env.DB.batch([
    env.DB.prepare("UPDATE sw_users SET two_factor_enabled = 0, totp_secret_ciphertext = NULL, totp_last_counter = -1, updated_at = ? WHERE id = ?").bind(now, user.id),
    env.DB.prepare("DELETE FROM sw_totp_recovery_codes WHERE user_id = ?").bind(user.id),
    env.DB.prepare("DELETE FROM sw_totp_setups WHERE user_id = ?").bind(user.id),
    env.DB.prepare("DELETE FROM sw_totp_challenges WHERE user_id = ?").bind(user.id),
  ]);
  await recordSecurityEvent(env, request, "two_factor.disable", user.id);
  return json(request, await accountPayload(env, { ...user, twoFactorEnabled: 0 }));
}

async function logout(env, request) {
  const token = readCookie(request, SESSION_COOKIE);
  if (token) await env.DB.prepare("DELETE FROM sw_sessions WHERE token_hash = ?").bind(await sha256(token)).run();
  await recordSecurityEvent(env, request, "account.logout");
  return json(request, { ok: true }, 200, clearSessionCookie());
}

async function updateProfile(env, request, user) {
  const body = await parseBody(request);
  const username = String(body.username || "").trim();
  if (!/^[A-Za-z0-9._-]{3,32}$/.test(username)) return json(request, { error: "Kullanıcı adı 3–32 karakter olmalı." }, 400);
  const exists = await env.DB.prepare("SELECT id FROM sw_users WHERE lower(username) = lower(?) AND id != ? LIMIT 1").bind(username, user.id).first();
  if (exists) return json(request, { error: "Bu kullanıcı adı zaten kullanılıyor." }, 409);
  const now = Math.floor(Date.now() / 1000);
  await env.DB.prepare("UPDATE sw_users SET username = ?, display_name = ?, updated_at = ? WHERE id = ?").bind(username, username, now, user.id).run();
  await recordSecurityEvent(env, request, "account.profile.update", user.id);
  return json(request, await accountPayload(env, { ...user, username, displayName: username }));
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

  const mode = url.searchParams.get("mode") === "register" ? "register" : "login";
  const remember = url.searchParams.get("remember") === "1" ? "1" : "0";
  const state = `${mode}.${remember}.${randomHex(32)}`;
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
    env.DB.prepare("INSERT OR IGNORE INTO sw_products (id, name, slug, status, created_at) VALUES ('sw-create', 'SW Create', 'sw-create', 'active', ?)").bind(now),
    env.DB.prepare("INSERT OR IGNORE INTO sw_entitlements (id, user_id, product_id, tier, source, starts_at, created_at, updated_at) VALUES (?, ?, 'play-streamers', 'free', ?, ?, ?, ?)").bind(crypto.randomUUID(), userId, source, now, now, now),
    env.DB.prepare("INSERT OR IGNORE INTO sw_entitlements (id, user_id, product_id, tier, source, starts_at, created_at, updated_at) VALUES (?, ?, 'play-connect', 'free', ?, ?, ?, ?)").bind(crypto.randomUUID(), userId, source, now, now, now),
    env.DB.prepare("INSERT OR IGNORE INTO sw_entitlements (id, user_id, product_id, tier, source, starts_at, created_at, updated_at) VALUES (?, ?, 'sw-create', 'free', ?, ?, ?, ?)").bind(crypto.randomUUID(), userId, source, now, now, now),
  ]);
}

async function oauthUser(env, provider, profile, allowCreate) {
  const now = Math.floor(Date.now() / 1000);
  let user = await env.DB.prepare(`
    SELECT u.id, u.email, u.username, u.display_name AS displayName, u.birth_date AS birthDate,
      u.created_at AS createdAt, u.two_factor_enabled AS twoFactorEnabled
    FROM sw_oauth_identities i JOIN sw_users u ON u.id = i.user_id
    WHERE i.provider = ? AND i.provider_user_id = ? LIMIT 1
  `).bind(provider, profile.id).first();

  if (!user && profile.email) {
    user = await env.DB.prepare("SELECT id, email, username, display_name AS displayName, birth_date AS birthDate, created_at AS createdAt, two_factor_enabled AS twoFactorEnabled FROM sw_users WHERE lower(email) = lower(?) LIMIT 1")
      .bind(profile.email).first();
  }

  if (!user && !allowCreate) throw new Error("ACCOUNT_MISSING");
  if (!user) {
    const userId = crypto.randomUUID();
    const salt = randomHex(18);
    const digest = await passwordDigest(randomHex(32), salt, env.AUTH_PEPPER);
    const email = profile.email || `kick-${profile.id}-${userId.slice(0, 8)}@identity.swcreate.invalid`;
    const baseUsername = String(profile.displayName || `${provider}-user`).replace(/[^A-Za-z0-9._-]/g, "").slice(0, 20) || `${provider}user`;
    const username = `${baseUsername}-${userId.slice(0, 6)}`;
    await env.DB.prepare("INSERT INTO sw_users (id, email, username, display_name, password_hash, password_salt, email_verified_at, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)")
      .bind(userId, email, username, profile.displayName, digest, salt, profile.email ? now : null, now, now).run();
    await grantDefaultProducts(env, userId, `oauth:${provider}`, now);
    user = { id: userId, email, username, displayName: profile.displayName, birthDate: null, createdAt: now, twoFactorEnabled: 0 };
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
    const [mode = "login", rememberFlag = "0"] = state.split(".");
    const user = await oauthUser(env, provider, profile, mode === "register");
    const security = await env.DB.prepare("SELECT two_factor_enabled AS twoFactorEnabled, totp_secret_ciphertext AS totpSecretCiphertext FROM sw_users WHERE id = ? LIMIT 1").bind(user.id).first();
    if (Number(security?.twoFactorEnabled) === 1 && security?.totpSecretCiphertext) {
      const challenge = await createTwoFactorChallenge(env, user.id, rememberFlag === "1");
      await recordSecurityEvent(env, request, `oauth.${provider}.two_factor`, user.id, "challenge");
      return accountRedirect({ two_factor_required: "1", challenge_id: challenge.challengeId });
    }
    const token = await createSession(env, user.id);
    await recordSecurityEvent(env, request, `oauth.${provider}`, user.id);
    return accountRedirect({ oauth: "success" }, sessionCookie(token, rememberFlag === "1"));
  } catch (error) {
    console.error("SW OAuth error", provider, error instanceof Error ? error.message : "unknown");
    if (error instanceof Error && error.message === "ACCOUNT_MISSING") return accountRedirect({ oauth_error: "account_missing" });
    return accountRedirect({ oauth_error: error instanceof Error && error.message === "PROFILE" ? "profile" : "failed" });
  }
}

export default {
  async fetch(request, env) {
    if (!env.DB || !env.AUTH_PEPPER) return json(request, { error: "SW Identity yapılandırması tamamlanmamış." }, 503);
    const url = new URL(request.url);
    if (request.method === "OPTIONS") {
      if (url.pathname === "/api/activity/pulse") {
        return new Response(null, { status: 204, headers: activityCorsHeaders(request) });
      }
      const origin = request.headers.get("origin");
      return new Response(null, { status: origin && ALLOWED_ORIGINS.has(origin) ? 204 : 403, headers: corsHeaders(request) });
    }

    try {
      if (request.method === "GET" && url.pathname === "/api/health") return json(request, { ok: true, service: "sw-identity", version: SW_IDENTITY_VERSION, protection: env.TURNSTILE_SECRET_KEY ? "turnstile" : "passive", dataFlow: "verified", twoFactor: env.TOTP_ENCRYPTION_KEY ? "available" : "configuration-required" });
      if (request.method === "GET" && url.pathname === "/api/stats") return await publicStats(env, request);
      if (request.method === "POST" && url.pathname === "/api/activity/pulse") return await recordProductActivity(env, request);
      if (request.method === "GET" && url.pathname === "/api/auth/oauth/google/start") return await beginOAuth(env, request, "google");
      if (request.method === "GET" && url.pathname === "/api/auth/oauth/kick/start") return await beginOAuth(env, request, "kick");
      if (request.method === "GET" && url.pathname === "/api/auth/oauth/google/callback") return await finishOAuth(env, request, "google");
      if (request.method === "GET" && url.pathname === "/api/auth/oauth/kick/callback") return await finishOAuth(env, request, "kick");
      if (["POST", "PUT", "PATCH", "DELETE"].includes(request.method) && !validOrigin(request)) return json(request, { error: "Geçersiz istek kaynağı." }, 403);
      if (request.method === "POST" && url.pathname === "/api/auth/register") return await register(env, request);
      if (request.method === "POST" && url.pathname === "/api/auth/login") return await login(env, request);
      if (request.method === "POST" && url.pathname === "/api/auth/two-factor/verify") return await verifyTwoFactorLogin(env, request);
      if (request.method === "POST" && url.pathname === "/api/auth/logout") return await logout(env, request);

      const user = await currentUser(env, request);
      if (request.method === "GET" && url.pathname === "/api/account") return user ? json(request, await accountPayload(env, user)) : json(request, { error: "Oturum bulunamadı." }, 401);
      if (request.method === "PUT" && url.pathname === "/api/account/profile") return user ? await updateProfile(env, request, user) : json(request, { error: "Oturum bulunamadı." }, 401);
      if (request.method === "POST" && url.pathname === "/api/account/totp/setup") return user ? await beginTotpSetup(env, request, user) : json(request, { error: "Oturum bulunamadı." }, 401);
      if (request.method === "POST" && url.pathname === "/api/account/totp/confirm") return user ? await confirmTotpSetup(env, request, user) : json(request, { error: "Oturum bulunamadı." }, 401);
      if (request.method === "POST" && url.pathname === "/api/account/totp/disable") return user ? await disableTotp(env, request, user) : json(request, { error: "Oturum bulunamadı." }, 401);
      return json(request, { error: "İstek bulunamadı." }, 404);
    } catch (error) {
      if (error instanceof Error && error.message === "RATE_LIMIT") return json(request, { error: "Çok fazla deneme yapıldı. Biraz bekleyip yeniden dene." }, 429);
      if (error instanceof Error && error.message === "BOT_CHALLENGE") return json(request, { error: "SW Identity isteği doğrulayamadı. Sayfayı yenileyip yeniden dene." }, 403);
      if (error instanceof Error && error.message === "PAYLOAD_TOO_LARGE") return json(request, { error: "Gönderilen veri çok büyük." }, 413);
      if (error instanceof Error && error.message === "INVALID_CONTENT_TYPE") return json(request, { error: "Yalnızca güvenli JSON veri akışı kabul edilir." }, 415);
      if (error instanceof Error && error.message === "TOTP_NOT_CONFIGURED") return json(request, { error: "İki aşamalı doğrulama sunucu anahtarı henüz eklenmedi." }, 503);
      console.error("SW Identity error", error);
      return json(request, { error: "SW Identity şu anda işlemi tamamlayamadı." }, 500);
    }
  },
};
