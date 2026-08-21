const SESSION_COOKIE = "__Host-sw_session";
const SESSION_TTL = 60 * 60 * 24 * 30;
const OAUTH_STATE_TTL = 10 * 60;
const SW_IDENTITY_VERSION = "1.4.0";
const SW_IDENTITY_RELEASED_AT = 1787328000;
const EMAIL_CODE_TTL = 10 * 60;
const EMAIL_CODE_RESEND = 40;
const SUPPORT_RECIPIENT = "swcreate.info@gmail.com";
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

function bytesToBase64(bytes) {
  let output = "";
  const chunkSize = 24 * 1024;
  for (let start = 0; start < bytes.length; start += chunkSize) {
    output += btoa(String.fromCharCode(...bytes.subarray(start, Math.min(bytes.length, start + chunkSize))));
  }
  return output;
}

function base64ToBytes(value) {
  const binary = atob(String(value || "").replaceAll("-", "+").replaceAll("_", "/").padEnd(Math.ceil(String(value || "").length / 4) * 4, "="));
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

function normalizeEmail(value) {
  const email = String(value || "").trim().toLowerCase();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : null;
}

function isPublicEmail(value) {
  const email = normalizeEmail(value);
  return Boolean(email && !email.endsWith("@identity.swcreate.invalid"));
}

function randomSixDigitCode() {
  const ceiling = 0x100000000 - (0x100000000 % 1000000);
  const values = new Uint32Array(1);
  do crypto.getRandomValues(values); while (values[0] >= ceiling);
  return String(values[0] % 1000000).padStart(6, "0");
}

function escapeHtml(value) {
  return String(value || "").replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character]);
}

async function resendEmail(env, payload) {
  if (!env.RESEND_API_KEY) throw new Error("EMAIL_NOT_CONFIGURED");
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { authorization: `Bearer ${env.RESEND_API_KEY}`, "content-type": "application/json" },
    body: JSON.stringify(payload),
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(`EMAIL_DELIVERY_${response.status}`);
  return result;
}

function identityEmailHtml(title, message, code = "") {
  return `<!doctype html><html><body style="margin:0;background:#070a10;color:#f3efdf;font-family:Arial,sans-serif"><main style="max-width:560px;margin:auto;padding:42px"><div style="color:#03e0d1;font-size:12px;font-weight:900;letter-spacing:.16em">SW IDENTITY v${SW_IDENTITY_VERSION}</div><h1 style="font-size:34px;margin:18px 0 12px">${escapeHtml(title)}</h1><p style="color:#a8afba;line-height:1.65">${escapeHtml(message)}</p>${code ? `<div style="margin:28px 0;padding:20px;border:1px solid #03e0d1;border-radius:14px;background:#0b1320;color:#ecff3c;font-size:34px;font-weight:900;letter-spacing:.22em;text-align:center">${code}</div>` : ""}<p style="color:#69717e;font-size:12px;line-height:1.6">Bu mesaj SW Identity güvenlik veri akışı tarafından gönderildi. İsteği sen yapmadıysan kodu paylaşma.</p></main></body></html>`;
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
    headers.set("access-control-allow-methods", "GET,POST,PUT,DELETE,OPTIONS");
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

async function createSession(env, userId, request) {
  const token = randomHex(32);
  const tokenHash = await sha256(token);
  const now = Math.floor(Date.now() / 1000);
  const ip = request?.headers.get("cf-connecting-ip") || "unknown";
  const ipHash = await sha256(`session:${ip}:${env.AUTH_PEPPER}`);
  const cf = request?.cf || {};
  await env.DB.prepare(`INSERT INTO sw_sessions
    (id, user_id, token_hash, expires_at, created_at, last_seen_at, user_agent, ip_hash, city, region, country, latitude, longitude)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
    .bind(crypto.randomUUID(), userId, tokenHash, now + SESSION_TTL, now, now,
      String(request?.headers.get("user-agent") || "").slice(0, 400), ipHash,
      String(cf.city || "").slice(0, 100) || null, String(cf.region || "").slice(0, 100) || null,
      String(cf.country || "").slice(0, 10) || null,
      Number.isFinite(Number(cf.latitude)) ? Number(cf.latitude) : null,
      Number.isFinite(Number(cf.longitude)) ? Number(cf.longitude) : null).run();
  return token;
}

async function currentUser(env, request) {
  const token = readCookie(request, SESSION_COOKIE);
  if (!token) return null;
  const tokenHash = await sha256(token);
  const now = Math.floor(Date.now() / 1000);
  const user = await env.DB.prepare(`
    SELECT u.id, u.email, u.username, u.display_name AS displayName, u.birth_date AS birthDate,
      u.created_at AS createdAt, u.two_factor_enabled AS twoFactorEnabled,
      u.profile_avatar_type AS profileAvatarType, u.profile_avatar_value AS profileAvatarValue,
      s.id AS sessionId
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
  const identities = await env.DB.prepare("SELECT provider FROM sw_oauth_identities WHERE user_id = ?")
    .bind(user.id).all();
  const connectedProviders = new Set((identities.results || []).map((item) => String(item.provider)));
  const entitlementSlugs = new Set((rows.results || []).map((item) => String(item.slug)));
  return {
    user: {
      id: user.id,
      email: String(user.email || "").endsWith("@identity.swcreate.invalid") ? null : user.email,
      username: user.username || user.displayName,
      displayName: user.displayName,
      birthDate: user.birthDate || null,
      createdAt: user.createdAt,
      avatar: {
        type: user.profileAvatarType === "custom" ? "custom" : "preset",
        value: user.profileAvatarValue || "orbit-cyan",
        url: user.profileAvatarType === "custom" ? "/api/account/avatar" : null,
      },
    },
    entitlements: rows.results || [],
    security: {
      identityVersion: SW_IDENTITY_VERSION,
      twoFactorEnabled: Number(user.twoFactorEnabled || 0) === 1,
      dataFlowProtection: "verified",
    },
    connections: [
      { provider: "sw-create", label: "SW Create", connected: true, detail: "Merkezi SW Identity hesabı" },
      { provider: "play-streamers", label: "Play Streamers", connected: entitlementSlugs.has("play-streamers"), detail: entitlementSlugs.has("play-streamers") ? "Ürün erişimi bağlı" : "Henüz ürün erişimi yok" },
      { provider: "google", label: "Google", connected: connectedProviders.has("google"), detail: connectedProviders.has("google") ? "Giriş sağlayıcısı bağlı" : "Bağlı değil" },
      { provider: "kick", label: "Kick", connected: connectedProviders.has("kick"), detail: connectedProviders.has("kick") ? "Giriş sağlayıcısı bağlı" : "Bağlı değil" },
    ],
  };
}

function cleanSupportText(value, minimum, maximum) {
  const text = String(value || "").replace(/\r\n/g, "\n").trim();
  return text.length >= minimum && text.length <= maximum ? text : null;
}

async function emailCodeHash(env, email, purpose, code) {
  return sha256(`sw-email-code:${normalizeEmail(email)}:${purpose}:${code}:${env.AUTH_PEPPER}`);
}

async function issueEmailCode(env, { userId = null, email, purpose }) {
  const normalized = normalizeEmail(email);
  if (!normalized) throw new Error("INVALID_EMAIL");
  const now = Math.floor(Date.now() / 1000);
  const recent = await env.DB.prepare(`SELECT created_at AS createdAt FROM sw_email_codes
    WHERE lower(email) = lower(?) AND purpose = ? ORDER BY created_at DESC LIMIT 1`).bind(normalized, purpose).first();
  if (recent && now - Number(recent.createdAt) < EMAIL_CODE_RESEND) throw new Error("EMAIL_CODE_COOLDOWN");
  const code = randomSixDigitCode();
  const titles = { email_change: "E-posta adresini doğrula", password_change: "Şifre değişikliğini doğrula", password_reset: "Şifreni sıfırla", account_delete: "Hesap silme isteğini doğrula" };
  const descriptions = { email_change: "Yeni e-posta adresini SW hesabına bağlamak için bu kodu kullan.", password_change: "SW hesabının şifresini değiştirmek için bu kodu kullan.", password_reset: "SW hesabının şifresini sıfırlamak için bu kodu kullan.", account_delete: "SW hesabını kalıcı olarak silmek için bu kodu kullan." };
  await resendEmail(env, {
    from: env.RESEND_FROM_EMAIL || "SW Identity <noreply@swcreate.com>",
    to: [normalized],
    subject: `SW Identity doğrulama kodun: ${code}`,
    text: `${descriptions[purpose] || "SW Identity işlemini doğrula"}\n\nKod: ${code}\n\nKod 10 dakika geçerlidir.`,
    html: identityEmailHtml(titles[purpose] || "SW Identity doğrulaması", descriptions[purpose] || "İşlemi doğrulamak için kodu kullan.", code),
  });
  await env.DB.batch([
    env.DB.prepare("UPDATE sw_email_codes SET used_at = ? WHERE lower(email) = lower(?) AND purpose = ? AND used_at IS NULL").bind(now, normalized, purpose),
    env.DB.prepare(`INSERT INTO sw_email_codes
      (id, user_id, email, purpose, code_hash, expires_at, attempts, created_at, used_at)
      VALUES (?, ?, ?, ?, ?, ?, 0, ?, NULL)`).bind(crypto.randomUUID(), userId, normalized, purpose, await emailCodeHash(env, normalized, purpose, code), now + EMAIL_CODE_TTL, now),
  ]);
  return { email: normalized, expiresAt: now + EMAIL_CODE_TTL };
}

async function consumeEmailCode(env, { userId = null, email, purpose, code }) {
  const normalized = normalizeEmail(email);
  const cleanCode = String(code || "").replace(/\s/g, "");
  if (!normalized || !/^\d{6}$/.test(cleanCode)) return false;
  const now = Math.floor(Date.now() / 1000);
  const row = await env.DB.prepare(`SELECT id, user_id AS userId, code_hash AS codeHash, expires_at AS expiresAt, attempts
    FROM sw_email_codes WHERE lower(email) = lower(?) AND purpose = ? AND used_at IS NULL
    ORDER BY created_at DESC LIMIT 1`).bind(normalized, purpose).first();
  if (!row || Number(row.expiresAt) <= now || Number(row.attempts) >= 5 || (userId && row.userId !== userId)) return false;
  const valid = safeEqual(await emailCodeHash(env, normalized, purpose, cleanCode), String(row.codeHash));
  if (!valid) {
    await env.DB.prepare("UPDATE sw_email_codes SET attempts = attempts + 1 WHERE id = ?").bind(row.id).run();
    return false;
  }
  await env.DB.prepare("UPDATE sw_email_codes SET used_at = ? WHERE id = ?").bind(now, row.id).run();
  return true;
}

async function supportEmailAttachments(env, userId, ticketId) {
  const rows = await env.DB.prepare(`SELECT a.object_key AS objectKey, a.file_name AS fileName, a.mime_type AS mimeType
    FROM sw_support_attachments a WHERE a.ticket_id = ? AND a.user_id = ? ORDER BY a.created_at ASC`).bind(ticketId, userId).all();
  const attachments = [];
  for (const row of rows.results || []) {
    const stored = await readPrivateFile(env, row.objectKey, userId, "support");
    if (stored) attachments.push({ filename: row.fileName, content: bytesToBase64(stored.bytes), content_type: row.mimeType });
  }
  return attachments;
}

async function sendSupportTicketEmail(env, request, user, ticketId) {
  await rateLimit(env, request, "support.email", 5, 10 * 60, user.id);
  const ticket = await env.DB.prepare(`SELECT id, subject, category, email_delivery_status AS mailStatus
    FROM sw_support_tickets WHERE id = ? AND user_id = ? LIMIT 1`).bind(ticketId, user.id).first();
  if (!ticket) return json(request, { error: "Destek talebi bulunamadı." }, 404);
  if (ticket.mailStatus === "sent") return json(request, { ok: true, alreadySent: true });
  if (!env.RESEND_API_KEY || !env.SUPPORT_INBOUND_DOMAIN || !env.RESEND_WEBHOOK_SECRET) {
    await env.DB.prepare("UPDATE sw_support_tickets SET email_delivery_status = 'failed' WHERE id = ?").bind(ticket.id).run();
    throw new Error("SUPPORT_EMAIL_NOT_CONFIGURED");
  }
  const message = await env.DB.prepare(`SELECT body FROM sw_support_messages
    WHERE ticket_id = ? AND sender = 'user' ORDER BY created_at ASC LIMIT 1`).bind(ticketId).first();
  const categoryNames = { technical: "Teknik sorun", account: "Hesap ve güvenlik", plans: "Planlar ve ürünler", feedback: "Öneri", other: "Diğer" };
  const replyDomain = String(env.SUPPORT_INBOUND_DOMAIN).replace(/^@/, "").trim().toLowerCase();
  const replyTo = `support+${ticket.id}@${replyDomain}`;
  try {
    const delivery = await resendEmail(env, {
      from: env.RESEND_FROM_EMAIL || "SW Create Destek <noreply@swcreate.com>",
      to: [env.SUPPORT_EMAIL_RECIPIENT || SUPPORT_RECIPIENT],
      reply_to: replyTo,
      subject: `[SW Create Talep ${ticket.id}] ${ticket.subject}`,
      text: `Gönderen: @${user.username || user.displayName}\nE-posta: ${isPublicEmail(user.email) ? user.email : "Bağlı değil"}\nKategori: ${categoryNames[ticket.category] || ticket.category}\n\n${message?.body || ""}`,
      html: identityEmailHtml(`Yeni destek talebi: ${ticket.subject}`, `Gönderen: @${user.username || user.displayName}\nKategori: ${categoryNames[ticket.category] || ticket.category}\n\n${message?.body || ""}`),
      attachments: await supportEmailAttachments(env, user.id, ticket.id),
    });
    await env.DB.prepare("UPDATE sw_support_tickets SET external_email_id = ?, email_delivery_status = 'sent' WHERE id = ?")
      .bind(String(delivery.id || ""), ticket.id).run();
    await recordSecurityEvent(env, request, "support.email.sent", user.id);
    const [updated] = await supportTicketPayload(env, user.id, ticket.id);
    return json(request, { ok: true, ticket: updated });
  } catch (error) {
    await env.DB.prepare("UPDATE sw_support_tickets SET email_delivery_status = 'failed' WHERE id = ?").bind(ticket.id).run();
    throw error;
  }
}

function supportTicketIdFromEmail(value) {
  const match = String(value || "").match(/(?:support\+|SW Create Talep\s+)([a-f0-9-]{36})/i);
  return match ? match[1] : null;
}

function normalizeMailbox(value) {
  const match = String(value || "").match(/<([^<>]+)>/);
  return normalizeEmail(match ? match[1] : value);
}

function cleanSupportReply(value) {
  const lines = String(value || "").replace(/\r\n?/g, "\n").split("\n");
  const kept = [];
  for (const line of lines) {
    if (/^>/.test(line) || /^On .+ wrote:$/i.test(line) || /^[-_]{2,}\s*(Original Message|İletilen ileti)/i.test(line)) break;
    kept.push(line);
  }
  return kept.join("\n").trim().slice(0, 4000) || "SW Destek talebini yanıtladı.";
}

async function verifyResendWebhook(rawBody, headers, secret) {
  const id = String(headers.get("svix-id") || "");
  const timestamp = String(headers.get("svix-timestamp") || "");
  const timestampNumber = Number(timestamp);
  const signatures = String(headers.get("svix-signature") || "").split(/\s+/).filter(Boolean);
  if (!id || !Number.isFinite(timestampNumber) || Math.abs(Math.floor(Date.now() / 1000) - timestampNumber) > 300) return false;
  try {
    const rawSecret = String(secret || "").replace(/^whsec_/, "");
    const key = await crypto.subtle.importKey("raw", base64ToBytes(rawSecret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
    const digest = bytesToBase64(new Uint8Array(await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(`${id}.${timestamp}.${rawBody}`))));
    return signatures.some((item) => item.startsWith("v1,") && safeEqual(item.slice(3), digest));
  } catch { return false; }
}

async function receiveSupportEmail(env, request) {
  if (!env.RESEND_WEBHOOK_SECRET || !env.RESEND_API_KEY) return json(request, { error: "E-posta webhook yapılandırması eksik." }, 503);
  const rawBody = await request.text();
  if (!(await verifyResendWebhook(rawBody, request.headers, env.RESEND_WEBHOOK_SECRET))) return json(request, { error: "Webhook imzası geçersiz." }, 401);
  const event = JSON.parse(rawBody);
  if (event?.type !== "email.received") return json(request, { ok: true, ignored: true });
  const eventId = String(request.headers.get("svix-id") || "").slice(0, 180);
  if (await env.DB.prepare("SELECT event_id FROM sw_support_webhook_events WHERE event_id = ?").bind(eventId).first()) return json(request, { ok: true, duplicate: true });
  const sender = normalizeMailbox(event?.data?.from);
  const allowedSenders = new Set([normalizeEmail(env.SUPPORT_EMAIL_RECIPIENT || SUPPORT_RECIPIENT), ...String(env.SUPPORT_REPLY_SENDERS || "").split(",").map(normalizeEmail).filter(Boolean)]);
  if (!sender || !allowedSenders.has(sender)) return json(request, { ok: true, ignored: true });
  const recipients = Array.isArray(event?.data?.to) ? event.data.to : [];
  const ticketId = recipients.map(supportTicketIdFromEmail).find(Boolean) || supportTicketIdFromEmail(event?.data?.subject);
  const ticket = ticketId ? await env.DB.prepare("SELECT id FROM sw_support_tickets WHERE id = ? LIMIT 1").bind(ticketId).first() : null;
  if (!ticket) return json(request, { ok: true, ignored: true });
  const emailId = String(event?.data?.email_id || "");
  const response = await fetch(`https://api.resend.com/emails/receiving/${encodeURIComponent(emailId)}`, { headers: { authorization: `Bearer ${env.RESEND_API_KEY}`, accept: "application/json" } });
  const email = await response.json().catch(() => ({}));
  if (!response.ok) return json(request, { error: "Gelen e-posta okunamadı." }, 502);
  const body = cleanSupportReply(email.text || String(email.html || "").replace(/<[^>]+>/g, " "));
  const now = Math.floor(Date.now() / 1000);
  await env.DB.batch([
    env.DB.prepare("INSERT INTO sw_support_messages (id, ticket_id, sender, body, created_at) VALUES (?, ?, 'support', ?, ?)").bind(crypto.randomUUID(), ticket.id, body, now),
    env.DB.prepare("UPDATE sw_support_tickets SET status = 'answered', updated_at = ?, last_reply_at = ? WHERE id = ?").bind(now, now, ticket.id),
    env.DB.prepare("INSERT INTO sw_support_webhook_events (event_id, created_at) VALUES (?, ?)").bind(eventId, now),
  ]);
  return json(request, { ok: true });
}

async function supportTicketPayload(env, userId, ticketId = null) {
  const filter = ticketId ? "AND id = ?" : "";
  const query = `SELECT id, subject, category, status, created_at AS createdAt,
      updated_at AS updatedAt, last_reply_at AS lastReplyAt,
      email_delivery_status AS mailStatus
    FROM sw_support_tickets WHERE user_id = ? ${filter}
    ORDER BY updated_at DESC LIMIT 50`;
  const statement = env.DB.prepare(query);
  const rows = ticketId ? await statement.bind(userId, ticketId).all() : await statement.bind(userId).all();
  const tickets = rows.results || [];
  if (!tickets.length) return [];
  const placeholders = tickets.map(() => "?").join(",");
  const messages = await env.DB.prepare(`SELECT id, ticket_id AS ticketId, sender, body, created_at AS createdAt
    FROM sw_support_messages WHERE ticket_id IN (${placeholders}) ORDER BY created_at ASC`)
    .bind(...tickets.map((ticket) => ticket.id)).all();
  const attachments = await env.DB.prepare(`SELECT id, message_id AS messageId, file_name AS fileName,
      mime_type AS mimeType, size FROM sw_support_attachments
    WHERE ticket_id IN (${placeholders}) ORDER BY created_at ASC`)
    .bind(...tickets.map((ticket) => ticket.id)).all().catch(() => ({ results: [] }));
  const attachmentGroups = new Map();
  for (const attachment of attachments.results || []) {
    if (!attachmentGroups.has(attachment.messageId)) attachmentGroups.set(attachment.messageId, []);
    attachmentGroups.get(attachment.messageId).push({ ...attachment, url: `/api/support/attachments/${attachment.id}` });
  }
  const grouped = new Map(tickets.map((ticket) => [ticket.id, []]));
  for (const message of messages.results || []) grouped.get(message.ticketId)?.push({ id: message.id, sender: message.sender, body: message.body, createdAt: message.createdAt, attachments: attachmentGroups.get(message.id) || [] });
  return tickets.map((ticket) => ({ ...ticket, messages: grouped.get(ticket.id) || [] }));
}

async function listSupportTickets(env, request, user) {
  return json(request, { tickets: await supportTicketPayload(env, user.id) });
}

async function createSupportTicket(env, request, user) {
  await rateLimit(env, request, "support.create", 4, 60, user.id);
  const body = await parseBody(request);
  const subject = cleanSupportText(body.subject, 4, 100);
  const message = cleanSupportText(body.message, 10, 2000);
  const category = ["technical", "account", "plans", "feedback", "other"].includes(String(body.category)) ? String(body.category) : "technical";
  if (!subject || !message) return json(request, { error: "Konu veya mesaj uzunluğu geçerli değil." }, 400);
  const now = Math.floor(Date.now() / 1000);
  const ticketId = crypto.randomUUID();
  await env.DB.batch([
    env.DB.prepare(`INSERT INTO sw_support_tickets
      (id, user_id, subject, category, status, created_at, updated_at)
      VALUES (?, ?, ?, ?, 'open', ?, ?)`).bind(ticketId, user.id, subject, category, now, now),
    env.DB.prepare(`INSERT INTO sw_support_messages
      (id, ticket_id, sender, body, created_at) VALUES (?, ?, 'user', ?, ?)`)
      .bind(crypto.randomUUID(), ticketId, message, now),
  ]);
  await recordSecurityEvent(env, request, "support.ticket.create", user.id);
  const [ticket] = await supportTicketPayload(env, user.id, ticketId);
  return json(request, { ok: true, ticket }, 201);
}

async function addSupportMessage(env, request, user, ticketId) {
  await rateLimit(env, request, "support.message", 10, 60, user.id);
  const body = await parseBody(request);
  const message = cleanSupportText(body.message, 4, 2000);
  if (!message) return json(request, { error: "Mesaj uzunluğu geçerli değil." }, 400);
  const ticket = await env.DB.prepare("SELECT id FROM sw_support_tickets WHERE id = ? AND user_id = ? LIMIT 1").bind(ticketId, user.id).first();
  if (!ticket) return json(request, { error: "Destek talebi bulunamadı." }, 404);
  const now = Math.floor(Date.now() / 1000);
  await env.DB.batch([
    env.DB.prepare("INSERT INTO sw_support_messages (id, ticket_id, sender, body, created_at) VALUES (?, ?, 'user', ?, ?)").bind(crypto.randomUUID(), ticketId, message, now),
    env.DB.prepare("UPDATE sw_support_tickets SET status = 'open', updated_at = ? WHERE id = ?").bind(now, ticketId),
  ]);
  await recordSecurityEvent(env, request, "support.ticket.message", user.id);
  const [updated] = await supportTicketPayload(env, user.id, ticketId);
  return json(request, { ok: true, ticket: updated });
}

function safeFileName(value) {
  const cleaned = String(value || "file").replace(/[\u0000-\u001f\u007f<>:"/\\|?*]+/g, "-").trim().slice(0, 140);
  return cleaned || "file";
}

async function storePrivateFile(env, userId, purpose, file) {
  const id = crypto.randomUUID();
  const now = Math.floor(Date.now() / 1000);
  const bytes = new Uint8Array(await file.arrayBuffer());
  const chunkSize = 256 * 1024;
  const statements = [env.DB.prepare(`INSERT INTO sw_file_objects
    (id, user_id, purpose, file_name, mime_type, size, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)`).bind(id, userId, purpose, safeFileName(file.name), file.type, file.size, now)];
  for (let offset = 0, index = 0; offset < bytes.length; offset += chunkSize, index += 1) {
    const chunk = bytes.slice(offset, Math.min(offset + chunkSize, bytes.length));
    statements.push(env.DB.prepare("INSERT INTO sw_file_chunks (file_id, chunk_index, data) VALUES (?, ?, ?)").bind(id, index, chunk.buffer));
  }
  await env.DB.batch(statements);
  return { id, fileName: safeFileName(file.name), mimeType: file.type, size: file.size };
}

async function deletePrivateFile(env, fileId) {
  if (!fileId) return;
  await env.DB.batch([
    env.DB.prepare("DELETE FROM sw_file_chunks WHERE file_id = ?").bind(fileId),
    env.DB.prepare("DELETE FROM sw_file_objects WHERE id = ?").bind(fileId),
  ]).catch(() => undefined);
}

async function readPrivateFile(env, fileId, userId, purpose) {
  const meta = await env.DB.prepare(`SELECT id, file_name AS fileName, mime_type AS mimeType, size
    FROM sw_file_objects WHERE id = ? AND user_id = ? AND purpose = ? LIMIT 1`).bind(fileId, userId, purpose).first();
  if (!meta) return null;
  const rows = await env.DB.prepare("SELECT data FROM sw_file_chunks WHERE file_id = ? ORDER BY chunk_index ASC").bind(fileId).all();
  const output = new Uint8Array(Number(meta.size));
  let offset = 0;
  for (const row of rows.results || []) {
    const chunk = row.data instanceof ArrayBuffer ? new Uint8Array(row.data) : new Uint8Array(row.data || []);
    output.set(chunk, offset); offset += chunk.byteLength;
  }
  if (offset !== output.byteLength) return null;
  return { ...meta, bytes: output };
}

async function uploadSupportAttachment(env, request, user, ticketId) {
  await rateLimit(env, request, "support.upload", 20, 60, user.id);
  const ticket = await env.DB.prepare("SELECT id FROM sw_support_tickets WHERE id = ? AND user_id = ? LIMIT 1").bind(ticketId, user.id).first();
  if (!ticket) return json(request, { error: "Destek talebi bulunamadı." }, 404);
  const form = await request.formData();
  const file = form.get("file");
  const messageId = String(form.get("messageId") || "").trim();
  if (!(file instanceof File) || !messageId) return json(request, { error: "Dosya veya mesaj bilgisi eksik." }, 400);
  const message = await env.DB.prepare("SELECT id FROM sw_support_messages WHERE id = ? AND ticket_id = ? LIMIT 1").bind(messageId, ticketId).first();
  if (!message) return json(request, { error: "Destek mesajı bulunamadı." }, 404);
  const allowedTypes = new Set(["image/jpeg", "image/png", "image/webp", "image/gif", "application/pdf", "text/plain", "application/zip", "application/x-zip-compressed"]);
  if (!allowedTypes.has(file.type)) return json(request, { error: "Bu dosya türü desteklenmiyor." }, 415);
  if (file.size <= 0 || file.size > 10 * 1024 * 1024) return json(request, { error: "Dosya en fazla 10 MB olabilir." }, 413);
  const usage = await env.DB.prepare("SELECT COUNT(*) AS count, COALESCE(SUM(size), 0) AS total FROM sw_support_attachments WHERE ticket_id = ?").bind(ticketId).first();
  if (Number(usage?.count || 0) >= 10 || Number(usage?.total || 0) + file.size > 25 * 1024 * 1024) return json(request, { error: "Bir talepte en fazla 10 dosya ve toplam 25 MB kullanılabilir." }, 413);
  const id = crypto.randomUUID();
  const stored = await storePrivateFile(env, user.id, "support", file);
  try {
    const now = Math.floor(Date.now() / 1000);
    await env.DB.prepare(`INSERT INTO sw_support_attachments
      (id, ticket_id, message_id, user_id, object_key, file_name, mime_type, size, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`)
      .bind(id, ticketId, messageId, user.id, stored.id, stored.fileName, stored.mimeType, stored.size, now).run();
    await env.DB.prepare("UPDATE sw_support_tickets SET updated_at = ? WHERE id = ?").bind(now, ticketId).run();
  } catch (error) {
    await deletePrivateFile(env, stored.id);
    throw error;
  }
  await recordSecurityEvent(env, request, "support.attachment.upload", user.id);
  const [updated] = await supportTicketPayload(env, user.id, ticketId);
  return json(request, { ok: true, ticket: updated }, 201);
}

async function serveSupportAttachment(env, request, user, attachmentId) {
  const attachment = await env.DB.prepare(`SELECT a.object_key AS objectKey, a.file_name AS fileName, a.mime_type AS mimeType
    FROM sw_support_attachments a JOIN sw_support_tickets t ON t.id = a.ticket_id
    WHERE a.id = ? AND t.user_id = ? LIMIT 1`).bind(attachmentId, user.id).first();
  if (!attachment) return json(request, { error: "Dosya bulunamadı." }, 404);
  const object = await readPrivateFile(env, attachment.objectKey, user.id, "support");
  if (!object) return json(request, { error: "Dosya bulunamadı." }, 404);
  const headers = corsHeaders(request);
  headers.set("content-type", attachment.mimeType || object.mimeType || "application/octet-stream");
  headers.set("content-disposition", `inline; filename*=UTF-8''${encodeURIComponent(attachment.fileName)}`);
  headers.set("content-length", String(object.size));
  return new Response(object.bytes, { headers });
}

async function replySupportInternally(env, request) {
  const authorization = request.headers.get("authorization") || "";
  if (!env.SUPPORT_ADMIN_KEY || authorization !== `Bearer ${env.SUPPORT_ADMIN_KEY}`) return json(request, { error: "Yetkisiz destek işlemi." }, 401);
  const body = await parseBody(request);
  const ticketId = String(body.ticketId || "").trim();
  const message = cleanSupportText(body.message, 4, 2000);
  const ticket = ticketId ? await env.DB.prepare("SELECT id FROM sw_support_tickets WHERE id = ? LIMIT 1").bind(ticketId).first() : null;
  if (!ticket || !message) return json(request, { error: "Destek talebi veya yanıt geçerli değil." }, 400);
  const now = Math.floor(Date.now() / 1000);
  await env.DB.batch([
    env.DB.prepare("INSERT INTO sw_support_messages (id, ticket_id, sender, body, created_at) VALUES (?, ?, 'support', ?, ?)").bind(crypto.randomUUID(), ticketId, message, now),
    env.DB.prepare("UPDATE sw_support_tickets SET status = 'answered', updated_at = ?, last_reply_at = ? WHERE id = ?").bind(now, now, ticketId),
  ]);
  return json(request, { ok: true });
}

async function notificationSync(env, request, user) {
  const rows = await env.DB.prepare(`SELECT id, subject, created_at AS createdAt, last_reply_at AS lastReplyAt
    FROM sw_support_tickets WHERE user_id = ? ORDER BY updated_at DESC LIMIT 30`).bind(user.id).all();
  const notifications = [{
    id: `release:${SW_IDENTITY_VERSION}`,
    type: "release",
    title: `SW Identity v${SW_IDENTITY_VERSION}`,
    body: "E-posta doğrulamalı güvenlik, destek posta köprüsü, bağlı platformlar ve haritalı cihaz görünümü yayında.",
    target: "updates",
    createdAt: SW_IDENTITY_RELEASED_AT,
  }];
  for (const ticket of rows.results || []) {
    notifications.push({ id: `support:submitted:${ticket.id}`, type: "support-submitted", title: "Destek talebin alındı", body: ticket.subject, target: "support", ticketId: ticket.id, createdAt: ticket.createdAt });
    if (ticket.lastReplyAt) notifications.push({ id: `support:answered:${ticket.id}:${ticket.lastReplyAt}`, type: "support-answered", title: "SW Destek yanıtladı", body: ticket.subject, target: "support", ticketId: ticket.id, createdAt: ticket.lastReplyAt });
  }
  notifications.sort((left, right) => right.createdAt - left.createdAt);
  const readRows = await env.DB.prepare("SELECT notification_id AS id FROM sw_notification_reads WHERE user_id = ?")
    .bind(user.id).all();
  const readIds = new Set((readRows.results || []).map((row) => String(row.id)));
  return json(request, { version: SW_IDENTITY_VERSION, notifications: notifications.slice(0, 50).map((item) => ({ ...item, read: readIds.has(item.id) })) });
}

async function markNotificationsRead(env, request, user) {
  const body = await parseBody(request);
  const ids = Array.isArray(body.ids) ? body.ids.map((id) => String(id)).filter((id) => id.length >= 4 && id.length <= 220).slice(0, 50) : [];
  if (!ids.length) return json(request, { error: "Okundu olarak işaretlenecek bildirim bulunamadı." }, 400);
  const now = Math.floor(Date.now() / 1000);
  await env.DB.batch(ids.map((id) => env.DB.prepare(`INSERT INTO sw_notification_reads (user_id, notification_id, read_at)
    VALUES (?, ?, ?) ON CONFLICT(user_id, notification_id) DO UPDATE SET read_at = excluded.read_at`).bind(user.id, id, now)));
  return json(request, { ok: true, ids });
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
  const token = await createSession(env, userId, request);
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
  const token = await createSession(env, user.id, request);
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
  const token = await createSession(env, row.userId, request);
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
  const avatarPreset = String(body.avatarPreset || "").trim();
  const allowedAvatars = new Set(["orbit-cyan", "signal-acid", "core-cobalt", "flare-coral", "node-violet", "identity-paper"]);
  if (!/^[A-Za-z0-9._-]{3,32}$/.test(username)) return json(request, { error: "Kullanıcı adı 3–32 karakter olmalı." }, 400);
  if (avatarPreset && !allowedAvatars.has(avatarPreset)) return json(request, { error: "Profil görseli geçerli değil." }, 400);
  const exists = await env.DB.prepare("SELECT id FROM sw_users WHERE lower(username) = lower(?) AND id != ? LIMIT 1").bind(username, user.id).first();
  if (exists) return json(request, { error: "Bu kullanıcı adı zaten kullanılıyor." }, 409);
  const now = Math.floor(Date.now() / 1000);
  if (avatarPreset) {
    if (user.profileAvatarType === "custom" && user.profileAvatarValue) await deletePrivateFile(env, user.profileAvatarValue);
    await env.DB.prepare("UPDATE sw_users SET username = ?, display_name = ?, profile_avatar_type = 'preset', profile_avatar_value = ?, updated_at = ? WHERE id = ?").bind(username, username, avatarPreset, now, user.id).run();
  } else {
    await env.DB.prepare("UPDATE sw_users SET username = ?, display_name = ?, updated_at = ? WHERE id = ?").bind(username, username, now, user.id).run();
  }
  await recordSecurityEvent(env, request, "account.profile.update", user.id);
  return json(request, await accountPayload(env, { ...user, username, displayName: username, ...(avatarPreset ? { profileAvatarType: "preset", profileAvatarValue: avatarPreset } : {}) }));
}

async function uploadProfileAvatar(env, request, user) {
  await rateLimit(env, request, "account.avatar", 8, 10 * 60, user.id);
  const form = await request.formData();
  const file = form.get("file");
  if (!(file instanceof File) || !["image/jpeg", "image/png", "image/webp"].includes(file.type)) return json(request, { error: "JPG, PNG veya WebP görsel seç." }, 415);
  if (file.size <= 0 || file.size > 5 * 1024 * 1024) return json(request, { error: "Profil görseli en fazla 5 MB olabilir." }, 413);
  const stored = await storePrivateFile(env, user.id, "profile", file);
  const oldKey = user.profileAvatarType === "custom" ? user.profileAvatarValue : null;
  const now = Math.floor(Date.now() / 1000);
  await env.DB.prepare("UPDATE sw_users SET profile_avatar_type = 'custom', profile_avatar_value = ?, updated_at = ? WHERE id = ?").bind(stored.id, now, user.id).run();
  if (oldKey) await deletePrivateFile(env, oldKey);
  await recordSecurityEvent(env, request, "account.avatar.upload", user.id);
  return json(request, await accountPayload(env, { ...user, profileAvatarType: "custom", profileAvatarValue: stored.id }));
}

async function serveProfileAvatar(env, request, user) {
  if (user.profileAvatarType !== "custom" || !user.profileAvatarValue) return json(request, { error: "Özel profil görseli bulunamadı." }, 404);
  const object = await readPrivateFile(env, user.profileAvatarValue, user.id, "profile");
  if (!object) return json(request, { error: "Profil görseli bulunamadı." }, 404);
  const headers = corsHeaders(request);
  headers.set("content-type", object.mimeType || "image/webp");
  headers.set("content-length", String(object.size));
  headers.set("cache-control", "private, max-age=300");
  return new Response(object.bytes, { headers });
}

async function privateSecurityUser(env, userId) {
  return env.DB.prepare(`SELECT id, email, password_hash AS passwordHash, password_salt AS passwordSalt,
    two_factor_enabled AS twoFactorEnabled, totp_secret_ciphertext AS totpSecretCiphertext,
    totp_last_counter AS totpLastCounter FROM sw_users WHERE id = ? LIMIT 1`).bind(userId).first();
}

async function currentPasswordMatches(env, userId, password) {
  const privateUser = await privateSecurityUser(env, userId);
  const candidate = await passwordDigest(String(password || "invalid"), privateUser?.passwordSalt || "invalid", env.AUTH_PEPPER);
  return { privateUser, valid: Boolean(privateUser && safeEqual(candidate, privateUser.passwordHash)) };
}

async function requestSecurityChallenge(env, request, user) {
  await rateLimit(env, request, "security.challenge", 5, 10 * 60, user.id);
  const body = await parseBody(request);
  const action = String(body.action || "");
  if (!["email_change", "password_change", "account_delete"].includes(action)) return json(request, { error: "Güvenlik işlemi geçerli değil." }, 400);
  const passwordCheck = await currentPasswordMatches(env, user.id, body.currentPassword);
  if (!passwordCheck.valid) return json(request, { error: "Mevcut şifre doğru değil." }, 401);
  let email = passwordCheck.privateUser.email;
  if (action === "email_change") {
    email = normalizeEmail(body.newEmail);
    if (!email) return json(request, { error: "Geçerli bir yeni e-posta adresi gir." }, 400);
    const duplicate = await env.DB.prepare("SELECT id FROM sw_users WHERE lower(email) = lower(?) AND id != ? LIMIT 1").bind(email, user.id).first();
    if (duplicate) return json(request, { error: "Bu e-posta adresi başka bir hesapta kullanılıyor." }, 409);
  }
  if (Number(passwordCheck.privateUser.twoFactorEnabled) === 1) {
    return json(request, { ok: true, method: "totp", message: "İşlemi Authenticator kodunla doğrula." });
  }
  if (!isPublicEmail(email)) return json(request, { error: "Bu işlem için önce doğrulanabilir bir e-posta adresi gerekiyor." }, 400);
  const challenge = await issueEmailCode(env, { userId: user.id, email, purpose: action });
  return json(request, { ok: true, method: "email", email: challenge.email, expiresAt: challenge.expiresAt });
}

async function verifySensitiveAction(env, privateUser, purpose, email, code) {
  if (Number(privateUser.twoFactorEnabled) === 1) {
    const normalized = normalizeTwoFactorCode(code);
    if (!normalized) return false;
    return (await verifyAndConsumeTwoFactor(env, privateUser, normalized)).ok;
  }
  return consumeEmailCode(env, { userId: privateUser.id, email, purpose, code });
}

async function updateEmail(env, request, user) {
  await rateLimit(env, request, "account.email", 5, 10 * 60, user.id);
  const body = await parseBody(request);
  const newEmail = normalizeEmail(body.newEmail);
  if (!newEmail) return json(request, { error: "Geçerli bir yeni e-posta adresi gir." }, 400);
  const passwordCheck = await currentPasswordMatches(env, user.id, body.currentPassword);
  if (!passwordCheck.valid) return json(request, { error: "Mevcut şifre doğru değil." }, 401);
  const duplicate = await env.DB.prepare("SELECT id FROM sw_users WHERE lower(email) = lower(?) AND id != ? LIMIT 1").bind(newEmail, user.id).first();
  if (duplicate) return json(request, { error: "Bu e-posta adresi başka bir hesapta kullanılıyor." }, 409);
  if (!(await verifySensitiveAction(env, passwordCheck.privateUser, "email_change", newEmail, body.code))) return json(request, { error: "Güvenlik kodu doğru değil veya süresi dolmuş." }, 400);
  const now = Math.floor(Date.now() / 1000);
  await env.DB.batch([
    env.DB.prepare("UPDATE sw_users SET email = ?, email_verified_at = ?, email_changed_at = ?, updated_at = ? WHERE id = ?").bind(newEmail, now, now, now, user.id),
    env.DB.prepare("DELETE FROM sw_sessions WHERE user_id = ? AND id != ?").bind(user.id, user.sessionId),
  ]);
  await recordSecurityEvent(env, request, "account.email.update", user.id);
  return json(request, await accountPayload(env, { ...user, email: newEmail }));
}

async function updatePassword(env, request, user) {
  await rateLimit(env, request, "account.password", 5, 10 * 60, user.id);
  const body = await parseBody(request);
  const newPassword = String(body.newPassword || "");
  const repeat = String(body.newPasswordRepeat || "");
  if (newPassword.length < 10 || newPassword.length > 200) return json(request, { error: "Yeni şifre en az 10 karakter olmalı." }, 400);
  if (newPassword !== repeat) return json(request, { error: "Yeni şifreler aynı değil." }, 400);
  const passwordCheck = await currentPasswordMatches(env, user.id, body.currentPassword);
  if (!passwordCheck.valid) return json(request, { error: "Mevcut şifre doğru değil." }, 401);
  if (!(await verifySensitiveAction(env, passwordCheck.privateUser, "password_change", passwordCheck.privateUser.email, body.code))) return json(request, { error: "Güvenlik kodu doğru değil veya süresi dolmuş." }, 400);
  const salt = randomHex(18);
  const digest = await passwordDigest(newPassword, salt, env.AUTH_PEPPER);
  const now = Math.floor(Date.now() / 1000);
  await env.DB.batch([
    env.DB.prepare("UPDATE sw_users SET password_hash = ?, password_salt = ?, updated_at = ? WHERE id = ?").bind(digest, salt, now, user.id),
    env.DB.prepare("DELETE FROM sw_sessions WHERE user_id = ? AND id != ?").bind(user.id, user.sessionId),
  ]);
  await recordSecurityEvent(env, request, "account.password.update", user.id);
  return json(request, { ok: true });
}

async function requestForgotPassword(env, request) {
  await rateLimit(env, request, "password.forgot", 4, 10 * 60, "public");
  const body = await parseBody(request);
  const email = normalizeEmail(body.email);
  const user = email ? await env.DB.prepare("SELECT id, email FROM sw_users WHERE lower(email) = lower(?) LIMIT 1").bind(email).first() : null;
  if (user && isPublicEmail(user.email)) await issueEmailCode(env, { userId: user.id, email: user.email, purpose: "password_reset" }).catch(() => undefined);
  return json(request, { ok: true, message: "Adres bir SW hesabına bağlıysa doğrulama kodu gönderildi." });
}

async function resetForgotPassword(env, request) {
  await rateLimit(env, request, "password.reset", 5, 10 * 60, "public");
  const body = await parseBody(request);
  const email = normalizeEmail(body.email);
  const newPassword = String(body.newPassword || "");
  if (!email || newPassword.length < 10 || newPassword !== String(body.newPasswordRepeat || "")) return json(request, { error: "E-posta ve yeni şifre bilgilerini kontrol et." }, 400);
  const user = await env.DB.prepare("SELECT id FROM sw_users WHERE lower(email) = lower(?) LIMIT 1").bind(email).first();
  if (!user || !(await consumeEmailCode(env, { userId: user.id, email, purpose: "password_reset", code: body.code }))) return json(request, { error: "Kod doğru değil veya süresi dolmuş." }, 400);
  const salt = randomHex(18);
  const digest = await passwordDigest(newPassword, salt, env.AUTH_PEPPER);
  const now = Math.floor(Date.now() / 1000);
  await env.DB.batch([
    env.DB.prepare("UPDATE sw_users SET password_hash = ?, password_salt = ?, updated_at = ? WHERE id = ?").bind(digest, salt, now, user.id),
    env.DB.prepare("DELETE FROM sw_sessions WHERE user_id = ?").bind(user.id),
  ]);
  await recordSecurityEvent(env, request, "account.password.reset", user.id);
  return json(request, { ok: true });
}

async function deleteAccount(env, request, user) {
  await rateLimit(env, request, "account.delete", 3, 60 * 60, user.id);
  const body = await parseBody(request);
  const passwordCheck = await currentPasswordMatches(env, user.id, body.currentPassword);
  if (!passwordCheck.valid) return json(request, { error: "Mevcut şifre doğru değil." }, 401);
  if (!(await verifySensitiveAction(env, passwordCheck.privateUser, "account_delete", passwordCheck.privateUser.email, body.code))) return json(request, { error: "Güvenlik kodu doğru değil veya süresi dolmuş." }, 400);
  await env.DB.batch([
    env.DB.prepare("DELETE FROM sw_file_chunks WHERE file_id IN (SELECT id FROM sw_file_objects WHERE user_id = ?)").bind(user.id),
    env.DB.prepare("DELETE FROM sw_support_attachments WHERE user_id = ?").bind(user.id),
    env.DB.prepare("DELETE FROM sw_support_messages WHERE ticket_id IN (SELECT id FROM sw_support_tickets WHERE user_id = ?)").bind(user.id),
    env.DB.prepare("DELETE FROM sw_support_tickets WHERE user_id = ?").bind(user.id),
    env.DB.prepare("DELETE FROM sw_file_objects WHERE user_id = ?").bind(user.id),
    env.DB.prepare("DELETE FROM sw_notification_reads WHERE user_id = ?").bind(user.id),
    env.DB.prepare("DELETE FROM sw_email_codes WHERE user_id = ?").bind(user.id),
    env.DB.prepare("DELETE FROM sw_oauth_identities WHERE user_id = ?").bind(user.id),
    env.DB.prepare("DELETE FROM sw_entitlements WHERE user_id = ?").bind(user.id),
    env.DB.prepare("DELETE FROM sw_totp_recovery_codes WHERE user_id = ?").bind(user.id),
    env.DB.prepare("DELETE FROM sw_totp_setups WHERE user_id = ?").bind(user.id),
    env.DB.prepare("DELETE FROM sw_totp_challenges WHERE user_id = ?").bind(user.id),
    env.DB.prepare("DELETE FROM sw_sessions WHERE user_id = ?").bind(user.id),
    env.DB.prepare("DELETE FROM sw_security_events WHERE user_id = ?").bind(user.id),
    env.DB.prepare("DELETE FROM sw_users WHERE id = ?").bind(user.id),
  ]);
  return json(request, { ok: true, deleted: true }, 200, clearSessionCookie());
}

async function listDevices(env, request, user) {
  const now = Math.floor(Date.now() / 1000);
  const rows = await env.DB.prepare(`SELECT id, user_agent AS userAgent, created_at AS createdAt,
      last_seen_at AS lastSeenAt, expires_at AS expiresAt, city, region, country, latitude, longitude
    FROM sw_sessions WHERE user_id = ? AND expires_at > ? ORDER BY last_seen_at DESC LIMIT 30`).bind(user.id, now).all();
  return json(request, { devices: (rows.results || []).map((row) => ({ id: row.id, current: row.id === user.sessionId, userAgent: row.userAgent || "", createdAt: row.createdAt, lastSeenAt: row.lastSeenAt, expiresAt: row.expiresAt, location: { city: row.city || null, region: row.region || null, country: row.country || null, latitude: Number.isFinite(Number(row.latitude)) ? Number(row.latitude) : null, longitude: Number.isFinite(Number(row.longitude)) ? Number(row.longitude) : null } })) });
}

async function revokeDevice(env, request, user, sessionId) {
  const target = await env.DB.prepare("SELECT id FROM sw_sessions WHERE id = ? AND user_id = ? LIMIT 1").bind(sessionId, user.id).first();
  if (!target) return json(request, { error: "Oturum bulunamadı." }, 404);
  await env.DB.prepare("DELETE FROM sw_sessions WHERE id = ? AND user_id = ?").bind(sessionId, user.id).run();
  await recordSecurityEvent(env, request, "account.device.revoke", user.id);
  return json(request, { ok: true, current: sessionId === user.sessionId }, 200, sessionId === user.sessionId ? clearSessionCookie() : undefined);
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
    const token = await createSession(env, user.id, request);
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
      if (request.method === "GET" && url.pathname === "/api/health") return json(request, { ok: true, service: "sw-identity", version: SW_IDENTITY_VERSION, protection: env.TURNSTILE_SECRET_KEY ? "turnstile" : "passive", dataFlow: "verified", twoFactor: env.TOTP_ENCRYPTION_KEY ? "available" : "configuration-required", mail: env.RESEND_API_KEY && env.RESEND_WEBHOOK_SECRET && env.SUPPORT_INBOUND_DOMAIN ? "available" : "configuration-required" });
      if (request.method === "GET" && url.pathname === "/api/stats") return await publicStats(env, request);
      if (request.method === "POST" && url.pathname === "/api/activity/pulse") return await recordProductActivity(env, request);
      if (request.method === "GET" && url.pathname === "/api/auth/oauth/google/start") return await beginOAuth(env, request, "google");
      if (request.method === "GET" && url.pathname === "/api/auth/oauth/kick/start") return await beginOAuth(env, request, "kick");
      if (request.method === "GET" && url.pathname === "/api/auth/oauth/google/callback") return await finishOAuth(env, request, "google");
      if (request.method === "GET" && url.pathname === "/api/auth/oauth/kick/callback") return await finishOAuth(env, request, "kick");
      if (request.method === "POST" && url.pathname === "/api/internal/support/reply") return await replySupportInternally(env, request);
      if (request.method === "POST" && url.pathname === "/api/webhooks/resend") return await receiveSupportEmail(env, request);
      if (["POST", "PUT", "PATCH", "DELETE"].includes(request.method) && !validOrigin(request)) return json(request, { error: "Geçersiz istek kaynağı." }, 403);
      if (request.method === "POST" && url.pathname === "/api/auth/register") return await register(env, request);
      if (request.method === "POST" && url.pathname === "/api/auth/login") return await login(env, request);
      if (request.method === "POST" && url.pathname === "/api/auth/two-factor/verify") return await verifyTwoFactorLogin(env, request);
      if (request.method === "POST" && url.pathname === "/api/auth/password/forgot") return await requestForgotPassword(env, request);
      if (request.method === "POST" && url.pathname === "/api/auth/password/reset") return await resetForgotPassword(env, request);
      if (request.method === "POST" && url.pathname === "/api/auth/logout") return await logout(env, request);

      const user = await currentUser(env, request);
      if (request.method === "GET" && url.pathname === "/api/account") return user ? json(request, await accountPayload(env, user)) : json(request, { error: "Oturum bulunamadı." }, 401);
      if (request.method === "GET" && url.pathname === "/api/account/avatar") return user ? await serveProfileAvatar(env, request, user) : json(request, { error: "Oturum bulunamadı." }, 401);
      if (request.method === "POST" && url.pathname === "/api/account/avatar") return user ? await uploadProfileAvatar(env, request, user) : json(request, { error: "Oturum bulunamadı." }, 401);
      if (request.method === "POST" && url.pathname === "/api/account/password") return user ? await updatePassword(env, request, user) : json(request, { error: "Oturum bulunamadı." }, 401);
      if (request.method === "POST" && url.pathname === "/api/account/security/challenge") return user ? await requestSecurityChallenge(env, request, user) : json(request, { error: "Oturum bulunamadı." }, 401);
      if (request.method === "POST" && url.pathname === "/api/account/email") return user ? await updateEmail(env, request, user) : json(request, { error: "Oturum bulunamadı." }, 401);
      if (request.method === "POST" && url.pathname === "/api/account/delete") return user ? await deleteAccount(env, request, user) : json(request, { error: "Oturum bulunamadı." }, 401);
      if (request.method === "GET" && url.pathname === "/api/account/devices") return user ? await listDevices(env, request, user) : json(request, { error: "Oturum bulunamadı." }, 401);
      const deviceMatch = url.pathname.match(/^\/api\/account\/devices\/([a-f0-9-]{36})$/i);
      if (request.method === "DELETE" && deviceMatch) return user ? await revokeDevice(env, request, user, deviceMatch[1]) : json(request, { error: "Oturum bulunamadı." }, 401);
      if (request.method === "GET" && url.pathname === "/api/support/tickets") return user ? await listSupportTickets(env, request, user) : json(request, { error: "Oturum bulunamadı." }, 401);
      if (request.method === "POST" && url.pathname === "/api/support/tickets") return user ? await createSupportTicket(env, request, user) : json(request, { error: "Oturum bulunamadı." }, 401);
      const supportSendMatch = url.pathname.match(/^\/api\/support\/tickets\/([a-f0-9-]{36})\/send$/i);
      if (request.method === "POST" && supportSendMatch) return user ? await sendSupportTicketEmail(env, request, user, supportSendMatch[1]) : json(request, { error: "Oturum bulunamadı." }, 401);
      const supportMessageMatch = url.pathname.match(/^\/api\/support\/tickets\/([a-f0-9-]{36})\/messages$/i);
      if (request.method === "POST" && supportMessageMatch) return user ? await addSupportMessage(env, request, user, supportMessageMatch[1]) : json(request, { error: "Oturum bulunamadı." }, 401);
      const supportUploadMatch = url.pathname.match(/^\/api\/support\/tickets\/([a-f0-9-]{36})\/attachments$/i);
      if (request.method === "POST" && supportUploadMatch) return user ? await uploadSupportAttachment(env, request, user, supportUploadMatch[1]) : json(request, { error: "Oturum bulunamadı." }, 401);
      const supportAttachmentMatch = url.pathname.match(/^\/api\/support\/attachments\/([a-f0-9-]{36})$/i);
      if (request.method === "GET" && supportAttachmentMatch) return user ? await serveSupportAttachment(env, request, user, supportAttachmentMatch[1]) : json(request, { error: "Oturum bulunamadı." }, 401);
      if (request.method === "GET" && url.pathname === "/api/notifications/sync") return user ? await notificationSync(env, request, user) : json(request, { error: "Oturum bulunamadı." }, 401);
      if (request.method === "POST" && url.pathname === "/api/notifications/read") return user ? await markNotificationsRead(env, request, user) : json(request, { error: "Oturum bulunamadı." }, 401);
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
      if (error instanceof Error && ["EMAIL_NOT_CONFIGURED", "SUPPORT_EMAIL_NOT_CONFIGURED"].includes(error.message)) return json(request, { error: "SW Identity e-posta sistemi henüz yapılandırılmadı." }, 503);
      if (error instanceof Error && error.message === "EMAIL_CODE_COOLDOWN") return json(request, { error: "Yeni kod istemeden önce 40 saniye bekle." }, 429);
      if (error instanceof Error && error.message === "INVALID_EMAIL") return json(request, { error: "Geçerli bir e-posta adresi gir." }, 400);
      console.error("SW Identity error", error);
      return json(request, { error: "SW Identity şu anda işlemi tamamlayamadı." }, 500);
    }
  },
};
