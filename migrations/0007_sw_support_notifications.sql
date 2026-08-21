CREATE TABLE IF NOT EXISTS sw_support_tickets (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  subject TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'general',
  status TEXT NOT NULL DEFAULT 'open',
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  last_reply_at INTEGER,
  FOREIGN KEY (user_id) REFERENCES sw_users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS sw_support_messages (
  id TEXT PRIMARY KEY,
  ticket_id TEXT NOT NULL,
  sender TEXT NOT NULL CHECK (sender IN ('user', 'support')),
  body TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  FOREIGN KEY (ticket_id) REFERENCES sw_support_tickets(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_sw_support_tickets_user_updated
  ON sw_support_tickets(user_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_sw_support_messages_ticket_created
  ON sw_support_messages(ticket_id, created_at ASC);
