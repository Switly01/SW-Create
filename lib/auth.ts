import { env } from "cloudflare:workers";

const SESSION_COOKIE = "sw_session";
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 30;

type RuntimeEnv = { DB: D1Database; AUTH_PEPPER?: string };
const runtime = env as unknown as RuntimeEnv;

export type PublicAccount = {
  user: { id: string; email: string; displayName: string };
  entitlements: Array<{ product: string; tier: string }>;
};

function bytesToHex(bytes: Uint8Array) {
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

function randomHex(size: number) {
  const bytes = new Uint8Array(size);
  crypto.getRandomValues(bytes);
  return bytesToHex(bytes);
}

export async function sha256(value: string) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return bytesToHex(new Uint8Array(digest));
}

export async function passwordDigest(password: string, salt: string) {
  if (!runtime.AUTH_PEPPER) throw new Error("SW Create kimlik doğrulama anahtarı ayarlanmamış.");
  const material = await crypto.subtle.importKey("raw", new TextEncoder().encode(password + runtime.AUTH_PEPPER), "PBKDF2", false, ["deriveBits"]);
  const result = await crypto.subtle.deriveBits({ name: "PBKDF2", hash: "SHA-256", salt: new TextEncoder().encode(salt), iterations: 180_000 }, material, 256);
  return bytesToHex(new Uint8Array(result));
}

export function safeEqual(left: string, right: string) {
  if (left.length !== right.length) return false;
  let difference = 0;
  for (let index = 0; index < left.length; index += 1) difference |= left.charCodeAt(index) ^ right.charCodeAt(index);
  return difference === 0;
}

export function getDb() {
  if (!runtime.DB) throw new Error("SW Create veritabanı bağlantısı hazır değil.");
  return runtime.DB;
}

export function validateWriteOrigin(request: Request) {
  const origin = request.headers.get("origin");
  const requestOrigin = new URL(request.url).origin;
  return !origin || origin === requestOrigin;
}

export function readSessionToken(request: Request) {
  const cookie = request.headers.get("cookie") || "";
  for (const part of cookie.split(";")) {
    const [key, ...rest] = part.trim().split("=");
    if (key === SESSION_COOKIE) return decodeURIComponent(rest.join("="));
  }
  return null;
}

export function createSessionCookie(token: string) {
  return `${SESSION_COOKIE}=${encodeURIComponent(token)}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${SESSION_TTL_SECONDS}`;
}

export function clearSessionCookie() {
  return `${SESSION_COOKIE}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`;
}

export async function createSession(userId: string) {
  const token = randomHex(32);
  const tokenHash = await sha256(token);
  const now = Math.floor(Date.now() / 1000);
  await getDb().prepare("INSERT INTO sw_sessions (id, user_id, token_hash, expires_at, created_at, last_seen_at) VALUES (?, ?, ?, ?, ?, ?)")
    .bind(crypto.randomUUID(), userId, tokenHash, now + SESSION_TTL_SECONDS, now, now).run();
  return token;
}

export async function accountFromRequest(request: Request): Promise<PublicAccount | null> {
  const token = readSessionToken(request);
  if (!token) return null;
  const tokenHash = await sha256(token);
  const now = Math.floor(Date.now() / 1000);
  const user = await getDb().prepare(`SELECT u.id, u.email, u.display_name AS displayName, s.id AS sessionId FROM sw_sessions s JOIN sw_users u ON u.id = s.user_id WHERE s.token_hash = ? AND s.expires_at > ? LIMIT 1`)
    .bind(tokenHash, now).first<{ id: string; email: string; displayName: string; sessionId: string }>();
  if (!user) return null;
  await getDb().prepare("UPDATE sw_sessions SET last_seen_at = ? WHERE id = ?").bind(now, user.sessionId).run();
  const result = await getDb().prepare(`SELECT p.name AS product, e.tier AS tier FROM sw_entitlements e JOIN sw_products p ON p.id = e.product_id WHERE e.user_id = ? AND (e.expires_at IS NULL OR e.expires_at > ?) ORDER BY p.name ASC`)
    .bind(user.id, now).all<{ product: string; tier: string }>();
  return { user: { id: user.id, email: user.email, displayName: user.displayName }, entitlements: result.results || [] };
}

export function authJson(data: unknown, status = 200, cookie?: string) {
  const headers = new Headers({ "content-type": "application/json; charset=utf-8", "cache-control": "no-store", "x-content-type-options": "nosniff" });
  if (cookie) headers.set("set-cookie", cookie);
  return new Response(JSON.stringify(data), { status, headers });
}

export function newSalt() { return randomHex(18); }
