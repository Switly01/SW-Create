ALTER TABLE sw_users ADD COLUMN two_factor_enabled INTEGER NOT NULL DEFAULT 0;
ALTER TABLE sw_users ADD COLUMN totp_secret_ciphertext TEXT;
ALTER TABLE sw_users ADD COLUMN totp_last_counter INTEGER NOT NULL DEFAULT -1;

CREATE TABLE sw_totp_setups (
  id TEXT PRIMARY KEY NOT NULL,
  user_id TEXT NOT NULL,
  secret_ciphertext TEXT NOT NULL,
  expires_at INTEGER NOT NULL,
  attempts INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL
);
CREATE INDEX idx_sw_totp_setups_user ON sw_totp_setups(user_id, expires_at);

CREATE TABLE sw_totp_challenges (
  id TEXT PRIMARY KEY NOT NULL,
  user_id TEXT NOT NULL,
  remember INTEGER NOT NULL DEFAULT 0,
  expires_at INTEGER NOT NULL,
  attempts INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL
);
CREATE INDEX idx_sw_totp_challenges_expiry ON sw_totp_challenges(expires_at);

CREATE TABLE sw_totp_recovery_codes (
  id TEXT PRIMARY KEY NOT NULL,
  user_id TEXT NOT NULL,
  code_hash TEXT NOT NULL,
  used_at INTEGER,
  created_at INTEGER NOT NULL
);
CREATE UNIQUE INDEX idx_sw_totp_recovery_hash ON sw_totp_recovery_codes(user_id, code_hash);

CREATE TABLE sw_security_events (
  id TEXT PRIMARY KEY NOT NULL,
  user_id TEXT,
  action TEXT NOT NULL,
  outcome TEXT NOT NULL,
  flow_id TEXT NOT NULL,
  ip_hash TEXT NOT NULL,
  created_at INTEGER NOT NULL
);
CREATE INDEX idx_sw_security_events_user ON sw_security_events(user_id, created_at DESC);
CREATE INDEX idx_sw_security_events_expiry ON sw_security_events(created_at);
