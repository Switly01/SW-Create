ALTER TABLE sw_support_tickets ADD COLUMN ticket_number TEXT;

UPDATE sw_support_tickets
SET ticket_number = 'SW-' || upper(substr(replace(id, '-', ''), 1, 10))
WHERE ticket_number IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_sw_support_tickets_number
  ON sw_support_tickets(ticket_number);

CREATE TABLE IF NOT EXISTS sw_plan_catalog (
  id TEXT PRIMARY KEY NOT NULL,
  product_id TEXT NOT NULL,
  name TEXT NOT NULL,
  tier TEXT NOT NULL,
  description TEXT NOT NULL,
  billing_mode TEXT NOT NULL CHECK (billing_mode IN ('free', 'paid')),
  availability TEXT NOT NULL CHECK (availability IN ('active', 'coming_soon', 'retired')),
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  UNIQUE (product_id, tier),
  FOREIGN KEY (product_id) REFERENCES sw_products(id)
);

CREATE TABLE IF NOT EXISTS sw_subscriptions (
  id TEXT PRIMARY KEY NOT NULL,
  user_id TEXT NOT NULL,
  product_id TEXT NOT NULL,
  plan_id TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('active', 'paused', 'cancelled', 'expired')),
  source TEXT NOT NULL,
  starts_at INTEGER NOT NULL,
  current_period_end INTEGER,
  cancelled_at INTEGER,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  UNIQUE (user_id, product_id),
  FOREIGN KEY (user_id) REFERENCES sw_users(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES sw_products(id),
  FOREIGN KEY (plan_id) REFERENCES sw_plan_catalog(id)
);

CREATE INDEX IF NOT EXISTS idx_sw_plan_catalog_product_sort
  ON sw_plan_catalog(product_id, sort_order);

CREATE INDEX IF NOT EXISTS idx_sw_subscriptions_user_status
  ON sw_subscriptions(user_id, status);

INSERT OR IGNORE INTO sw_plan_catalog
  (id, product_id, name, tier, description, billing_mode, availability, sort_order, created_at, updated_at)
VALUES
  ('sw-create-free', 'sw-create', 'SW Create Free Edition', 'free', 'SW Identity, hesap merkezi, destek ve temel SW Create araçları.', 'free', 'active', 10, unixepoch(), unixepoch()),
  ('sw-create-pro', 'sw-create', 'SW Create Pro Edition', 'pro', 'Gelişmiş üretim araçları ve daha geniş ürün erişimi için hazırlanan plan.', 'paid', 'coming_soon', 20, unixepoch(), unixepoch()),
  ('sw-create-product-pro', 'sw-create', 'SW Create Product Pro Edition', 'product-pro', 'SW Create ürün ailesinin profesyonel özelliklerini tek planda birleştiren katman.', 'paid', 'coming_soon', 30, unixepoch(), unixepoch()),
  ('play-streamers-free', 'play-streamers', 'Play Streamers Free', 'free', 'Temel yayıncı paneli ve SW Identity bağlantısı.', 'free', 'active', 10, unixepoch(), unixepoch()),
  ('play-streamers-pro', 'play-streamers', 'Play Streamers Pro', 'pro', 'Gelişmiş yayın, kanal ve topluluk araçları için hazırlanan plan.', 'paid', 'coming_soon', 20, unixepoch(), unixepoch()),
  ('play-streamers-product-pro', 'play-streamers', 'Play Streamers Product Pro', 'product-pro', 'Play Streamers ürün ağının profesyonel özelliklerini birleştiren katman.', 'paid', 'coming_soon', 30, unixepoch(), unixepoch());

INSERT OR IGNORE INTO sw_subscriptions
  (id, user_id, product_id, plan_id, status, source, starts_at, created_at, updated_at)
SELECT lower(hex(randomblob(16))), id, 'sw-create', 'sw-create-free', 'active', 'system-migration', unixepoch(), unixepoch(), unixepoch()
FROM sw_users;

INSERT OR IGNORE INTO sw_subscriptions
  (id, user_id, product_id, plan_id, status, source, starts_at, created_at, updated_at)
SELECT lower(hex(randomblob(16))), id, 'play-streamers', 'play-streamers-free', 'active', 'system-migration', unixepoch(), unixepoch(), unixepoch()
FROM sw_users;
