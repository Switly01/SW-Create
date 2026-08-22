CREATE TABLE IF NOT EXISTS sw_remembered_logins (
  id TEXT PRIMARY KEY NOT NULL,
  user_id TEXT NOT NULL,
  token_hash TEXT NOT NULL UNIQUE,
  user_agent_hash TEXT NOT NULL,
  expires_at INTEGER NOT NULL,
  created_at INTEGER NOT NULL,
  last_used_at INTEGER NOT NULL,
  FOREIGN KEY (user_id) REFERENCES sw_users(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_sw_remembered_logins_user
  ON sw_remembered_logins(user_id, expires_at DESC);

ALTER TABLE sw_oauth_states ADD COLUMN link_user_id TEXT;

CREATE TABLE IF NOT EXISTS sw_product_handoffs (
  id TEXT PRIMARY KEY NOT NULL,
  user_id TEXT NOT NULL,
  product_id TEXT NOT NULL,
  code_hash TEXT NOT NULL UNIQUE,
  redirect_uri TEXT NOT NULL,
  expires_at INTEGER NOT NULL,
  created_at INTEGER NOT NULL,
  consumed_at INTEGER,
  FOREIGN KEY (user_id) REFERENCES sw_users(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_sw_product_handoffs_expiry
  ON sw_product_handoffs(expires_at, consumed_at);
