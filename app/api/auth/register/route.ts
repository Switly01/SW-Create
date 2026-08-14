import { authJson, createSession, createSessionCookie, getDb, newSalt, passwordDigest, validateWriteOrigin } from "@/lib/auth";

export async function POST(request: Request) {
  if (!validateWriteOrigin(request)) return authJson({ error: "Geçersiz istek kaynağı." }, 403);
  try {
    const body = await request.json() as { email?: string; password?: string; displayName?: string };
    const email = String(body.email || "").trim().toLowerCase();
    const displayName = String(body.displayName || "").trim();
    const password = String(body.password || "");
    if (!/^\S+@\S+\.\S+$/.test(email)) return authJson({ error: "Geçerli bir e-posta adresi gir." }, 400);
    if (displayName.length < 2 || displayName.length > 48) return authJson({ error: "Görünen ad 2–48 karakter olmalı." }, 400);
    if (password.length < 10 || password.length > 200) return authJson({ error: "Şifre en az 10 karakter olmalı." }, 400);
    const exists = await getDb().prepare("SELECT id FROM sw_users WHERE email = ? LIMIT 1").bind(email).first();
    if (exists) return authJson({ error: "Bu e-posta zaten bir SW hesabına bağlı." }, 409);
    const now = Math.floor(Date.now() / 1000);
    const userId = crypto.randomUUID();
    const salt = newSalt();
    const digest = await passwordDigest(password, salt);
    await getDb().batch([
      getDb().prepare("INSERT INTO sw_users (id, email, display_name, password_hash, password_salt, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)").bind(userId, email, displayName, digest, salt, now, now),
      getDb().prepare("INSERT OR IGNORE INTO sw_products (id, name, slug, status, created_at) VALUES ('play-streamers', 'Play Streamers', 'play-streamers', 'active', ?)").bind(now),
      getDb().prepare("INSERT OR IGNORE INTO sw_products (id, name, slug, status, created_at) VALUES ('play-connect', 'Play Connect', 'play-connect', 'active', ?)").bind(now),
      getDb().prepare("INSERT INTO sw_entitlements (id, user_id, product_id, tier, source, starts_at, created_at, updated_at) VALUES (?, ?, 'play-streamers', 'free', 'registration', ?, ?, ?)").bind(crypto.randomUUID(), userId, now, now, now),
      getDb().prepare("INSERT INTO sw_entitlements (id, user_id, product_id, tier, source, starts_at, created_at, updated_at) VALUES (?, ?, 'play-connect', 'free', 'registration', ?, ?, ?)").bind(crypto.randomUUID(), userId, now, now, now),
    ]);
    const token = await createSession(userId);
    return authJson({ user: { id: userId, email, displayName }, entitlements: [{ product: "Play Connect", tier: "free" }, { product: "Play Streamers", tier: "free" }] }, 201, createSessionCookie(token));
  } catch (error) {
    console.error("SW register error", error);
    return authJson({ error: "Hesap şu anda oluşturulamadı. Biraz sonra yeniden dene." }, 500);
  }
}
