import type { ChatGPTUser } from "@/app/chatgpt-auth";
import type { SwAccount } from "@/app/account/AccountClient";

type RuntimeEnv = { DB?: D1Database };

async function database(): Promise<D1Database> {
  const { env } = await import("cloudflare:workers");
  const db = (env as unknown as RuntimeEnv).DB;
  if (!db) throw new Error("SW Create D1 bağlantısı bulunamadı.");
  return db;
}

function initialDisplayName(user: ChatGPTUser): string {
  const candidate = user.fullName?.trim() || user.email.split("@")[0] || "SW User";
  return candidate.slice(0, 48);
}

export async function loadSwAccount(user: ChatGPTUser): Promise<SwAccount> {
  const db = await database();
  const now = Math.floor(Date.now() / 1000);

  await db.batch([
    db.prepare(`INSERT INTO sw_identity_profiles (user_id, email, display_name, identity_name, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?)
      ON CONFLICT(user_id) DO UPDATE SET email = excluded.email, identity_name = excluded.identity_name, updated_at = excluded.updated_at`)
      .bind(user.userId, user.email, initialDisplayName(user), user.fullName, now, now),
    db.prepare("INSERT OR IGNORE INTO sw_products (id, name, slug, status, created_at) VALUES ('play-streamers', 'Play Streamers', 'play-streamers', 'active', ?)").bind(now),
    db.prepare("INSERT OR IGNORE INTO sw_products (id, name, slug, status, created_at) VALUES ('play-connect', 'Play Connect', 'play-connect', 'active', ?)").bind(now),
    db.prepare("INSERT OR IGNORE INTO sw_entitlements (id, user_id, product_id, tier, source, starts_at, created_at, updated_at) VALUES (?, ?, 'play-streamers', 'free', 'sw-identity', ?, ?, ?)").bind(crypto.randomUUID(), user.userId, now, now, now),
    db.prepare("INSERT OR IGNORE INTO sw_entitlements (id, user_id, product_id, tier, source, starts_at, created_at, updated_at) VALUES (?, ?, 'play-connect', 'free', 'sw-identity', ?, ?, ?)").bind(crypto.randomUUID(), user.userId, now, now, now),
  ]);

  const profile = await db.prepare(`SELECT user_id AS userId, email, display_name AS displayName, created_at AS createdAt
    FROM sw_identity_profiles WHERE user_id = ? LIMIT 1`).bind(user.userId).first<SwAccount["profile"]>();
  if (!profile) throw new Error("SW profili oluşturulamadı.");

  const result = await db.prepare(`SELECT p.name AS product, p.slug AS slug, e.tier AS tier
    FROM sw_entitlements e JOIN sw_products p ON p.id = e.product_id
    WHERE e.user_id = ? AND p.status = 'active' AND (e.expires_at IS NULL OR e.expires_at > ?)
    ORDER BY p.name ASC`).bind(user.userId, now).all<SwAccount["entitlements"][number]>();

  return { profile, entitlements: result.results || [] };
}

export async function updateSwProfile(user: ChatGPTUser, displayName: string) {
  const normalized = displayName.trim().replace(/\s+/g, " ");
  if (normalized.length < 2 || normalized.length > 48) {
    throw new Error("Görünen ad 2–48 karakter olmalı.");
  }

  await loadSwAccount(user);
  const now = Math.floor(Date.now() / 1000);
  const db = await database();
  await db.prepare("UPDATE sw_identity_profiles SET display_name = ?, updated_at = ? WHERE user_id = ?")
    .bind(normalized, now, user.userId).run();

  return { displayName: normalized };
}
