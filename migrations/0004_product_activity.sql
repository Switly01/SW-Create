CREATE TABLE IF NOT EXISTS sw_product_activity (
  visitor_hash TEXT NOT NULL,
  product_id TEXT NOT NULL,
  first_seen_at INTEGER NOT NULL,
  last_seen_at INTEGER NOT NULL,
  PRIMARY KEY (visitor_hash, product_id)
);

CREATE INDEX IF NOT EXISTS idx_sw_product_activity_last_seen
  ON sw_product_activity(last_seen_at DESC);

CREATE INDEX IF NOT EXISTS idx_sw_product_activity_product_last_seen
  ON sw_product_activity(product_id, last_seen_at DESC);
