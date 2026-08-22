ALTER TABLE sw_support_messages ADD COLUMN external_email_id TEXT;
CREATE INDEX IF NOT EXISTS idx_sw_support_messages_external_email
  ON sw_support_messages(external_email_id);

CREATE TABLE IF NOT EXISTS sw_product_connections (
  user_id TEXT NOT NULL,
  product_id TEXT NOT NULL,
  connected_at INTEGER NOT NULL,
  last_used_at INTEGER NOT NULL,
  PRIMARY KEY (user_id, product_id),
  FOREIGN KEY (user_id) REFERENCES sw_users(id) ON DELETE CASCADE
);

ALTER TABLE sw_users ADD COLUMN password_login_enabled INTEGER;
