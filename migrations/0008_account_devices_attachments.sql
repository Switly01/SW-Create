ALTER TABLE sw_users ADD COLUMN profile_avatar_type TEXT NOT NULL DEFAULT 'preset';
ALTER TABLE sw_users ADD COLUMN profile_avatar_value TEXT NOT NULL DEFAULT 'orbit-cyan';

ALTER TABLE sw_sessions ADD COLUMN user_agent TEXT;
ALTER TABLE sw_sessions ADD COLUMN ip_hash TEXT;
ALTER TABLE sw_sessions ADD COLUMN city TEXT;
ALTER TABLE sw_sessions ADD COLUMN region TEXT;
ALTER TABLE sw_sessions ADD COLUMN country TEXT;

CREATE TABLE IF NOT EXISTS sw_support_attachments (
  id TEXT PRIMARY KEY NOT NULL,
  ticket_id TEXT NOT NULL,
  message_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  object_key TEXT NOT NULL UNIQUE,
  file_name TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  size INTEGER NOT NULL,
  created_at INTEGER NOT NULL,
  FOREIGN KEY (ticket_id) REFERENCES sw_support_tickets(id) ON DELETE CASCADE,
  FOREIGN KEY (message_id) REFERENCES sw_support_messages(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES sw_users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_sw_support_attachments_ticket
  ON sw_support_attachments(ticket_id, created_at ASC);
CREATE INDEX IF NOT EXISTS idx_sw_support_attachments_message
  ON sw_support_attachments(message_id, created_at ASC);
