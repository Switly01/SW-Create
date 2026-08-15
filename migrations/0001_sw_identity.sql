CREATE TABLE IF NOT EXISTS sw_users (
  id TEXT PRIMARY KEY NOT NULL,
  email TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  password_salt TEXT NOT NULL,
  email_verified_at INTEGER,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS sw_sessions (
  id TEXT PRIMARY KEY NOT NULL,
  user_id TEXT NOT NULL,
  token_hash TEXT NOT NULL UNIQUE,
  expires_at INTEGER NOT NULL,
  created_at INTEGER NOT NULL,
  last_seen_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS sw_sessions_user_idx ON sw_sessions (user_id, expires_at);

CREATE TABLE IF NOT EXISTS sw_products (
  id TEXT PRIMARY KEY NOT NULL,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'active',
  created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS sw_entitlements (
  id TEXT PRIMARY KEY NOT NULL,
  user_id TEXT NOT NULL,
  product_id TEXT NOT NULL,
  tier TEXT NOT NULL DEFAULT 'free',
  source TEXT NOT NULL DEFAULT 'system',
  starts_at INTEGER NOT NULL,
  expires_at INTEGER,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  UNIQUE (user_id, product_id)
);

CREATE TABLE IF NOT EXISTS sw_rate_limits (
  rate_key TEXT PRIMARY KEY NOT NULL,
  count INTEGER NOT NULL,
  reset_at INTEGER NOT NULL
);

INSERT OR IGNORE INTO sw_products (id, name, slug, status, created_at)
VALUES ('play-streamers', 'Play Streamers', 'play-streamers', 'active', unixepoch());
INSERT OR IGNORE INTO sw_products (id, name, slug, status, created_at)
VALUES ('play-connect', 'Play Connect', 'play-connect', 'active', unixepoch());
INSERT OR IGNORE INTO sw_products (id, name, slug, status, created_at)
VALUES ('sw-create', 'SW Create', 'sw-create', 'active', unixepoch());
