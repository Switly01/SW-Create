CREATE TABLE IF NOT EXISTS sw_file_objects (
  id TEXT PRIMARY KEY NOT NULL,
  user_id TEXT NOT NULL,
  purpose TEXT NOT NULL,
  file_name TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  size INTEGER NOT NULL,
  created_at INTEGER NOT NULL,
  FOREIGN KEY (user_id) REFERENCES sw_users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS sw_file_chunks (
  file_id TEXT NOT NULL,
  chunk_index INTEGER NOT NULL,
  data BLOB NOT NULL,
  PRIMARY KEY (file_id, chunk_index),
  FOREIGN KEY (file_id) REFERENCES sw_file_objects(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_sw_file_objects_user
  ON sw_file_objects(user_id, purpose, created_at DESC);
