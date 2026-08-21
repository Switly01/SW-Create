ALTER TABLE sw_users ADD COLUMN email_changed_at INTEGER;

ALTER TABLE sw_sessions ADD COLUMN latitude REAL;
ALTER TABLE sw_sessions ADD COLUMN longitude REAL;

ALTER TABLE sw_support_tickets ADD COLUMN external_email_id TEXT;
ALTER TABLE sw_support_tickets ADD COLUMN email_delivery_status TEXT NOT NULL DEFAULT 'pending';

CREATE TABLE IF NOT EXISTS sw_email_codes (
  id TEXT PRIMARY KEY NOT NULL,
  user_id TEXT,
  email TEXT NOT NULL,
  purpose TEXT NOT NULL,
  code_hash TEXT NOT NULL,
  expires_at INTEGER NOT NULL,
  attempts INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL,
  used_at INTEGER
);
CREATE INDEX IF NOT EXISTS idx_sw_email_codes_lookup
  ON sw_email_codes(email, purpose, created_at DESC);

CREATE TABLE IF NOT EXISTS sw_notification_reads (
  user_id TEXT NOT NULL,
  notification_id TEXT NOT NULL,
  read_at INTEGER NOT NULL,
  PRIMARY KEY (user_id, notification_id),
  FOREIGN KEY (user_id) REFERENCES sw_users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS sw_support_webhook_events (
  event_id TEXT PRIMARY KEY NOT NULL,
  created_at INTEGER NOT NULL
);
