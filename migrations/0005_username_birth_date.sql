ALTER TABLE sw_users ADD COLUMN username TEXT;
ALTER TABLE sw_users ADD COLUMN birth_date TEXT;

UPDATE sw_users
SET username = 'sw-' || lower(substr(replace(id, '-', ''), 1, 12))
WHERE username IS NULL OR trim(username) = '';

CREATE UNIQUE INDEX IF NOT EXISTS idx_sw_users_username_nocase
ON sw_users(lower(username));
