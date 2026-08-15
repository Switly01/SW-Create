INSERT OR IGNORE INTO sw_products (id, name, slug, status, created_at)
VALUES ('sw-create', 'SW Create', 'sw-create', 'active', unixepoch());

INSERT OR IGNORE INTO sw_entitlements
  (id, user_id, product_id, tier, source, starts_at, created_at, updated_at)
SELECT
  lower(hex(randomblob(16))),
  id,
  'sw-create',
  'free',
  'system-migration',
  unixepoch(),
  unixepoch(),
  unixepoch()
FROM sw_users;
