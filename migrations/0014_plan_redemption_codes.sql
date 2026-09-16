CREATE TABLE IF NOT EXISTS sw_plan_redemption_codes (
  id TEXT PRIMARY KEY NOT NULL,
  code_hash TEXT NOT NULL UNIQUE,
  code_hint TEXT NOT NULL,
  grant_plan_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'redeemed', 'disabled')),
  redemption_id TEXT,
  redeemed_by_user_id TEXT,
  redeemed_at INTEGER,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY (grant_plan_id) REFERENCES sw_plan_catalog(id),
  FOREIGN KEY (redeemed_by_user_id) REFERENCES sw_users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_sw_plan_redemption_codes_status
  ON sw_plan_redemption_codes(status, created_at);

CREATE UNIQUE INDEX IF NOT EXISTS idx_sw_plan_redemption_codes_redemption
  ON sw_plan_redemption_codes(redemption_id)
  WHERE redemption_id IS NOT NULL;

INSERT OR IGNORE INTO sw_plan_redemption_codes
  (id, code_hash, code_hint, grant_plan_id, status, created_at, updated_at)
VALUES
  ('swpp-01', 'e7cc2d453dc2d7045578c9772b73c408ba3687412ee28336d354a49d1749ee47', '…14C4D', 'sw-create-product-pro', 'active', unixepoch(), unixepoch()),
  ('swpp-02', 'effd454e5c22628f63da764462f1a1efc4e0c9206775908f57b6dac8a2d85ea1', '…C8781', 'sw-create-product-pro', 'active', unixepoch(), unixepoch()),
  ('swpp-03', '1a5b7f2bd138c05a6ec27fe9e752cbf3e8fc89e51ebb9bcf180e518e67204092', '…76ADF', 'sw-create-product-pro', 'active', unixepoch(), unixepoch()),
  ('swpp-04', '46263111068fb81c65fd9d186f85d5e0a049174854421c8a1940de3554f3482a', '…0E7DC', 'sw-create-product-pro', 'active', unixepoch(), unixepoch()),
  ('swpp-05', '9730c41ff47707c631afdd2c77a2ea63289e3acbe61d9b73d689baee7b7ef5d2', '…B326F', 'sw-create-product-pro', 'active', unixepoch(), unixepoch()),
  ('swpp-06', '00aef6b3a123d3f96f15908a2f961064022dcca3f48a8735fff1d574661c7d65', '…D66C5', 'sw-create-product-pro', 'active', unixepoch(), unixepoch()),
  ('swpp-07', 'dcca8dc47306883583ae439b94512a681984f1a209c4d2cb8ff393837bd0929c', '…8CA91', 'sw-create-product-pro', 'active', unixepoch(), unixepoch()),
  ('swpp-08', 'c11ae4554b57b1bbc602ac590a1cef65a17e2453f5bbdaa404a2795fe0808044', '…C2CFD', 'sw-create-product-pro', 'active', unixepoch(), unixepoch()),
  ('swpp-09', '34fdecaf7d5766dbe75c289ff6dc3edd6109d54bbdcfa8cc8034bb5c2cc25cc4', '…57DE9', 'sw-create-product-pro', 'active', unixepoch(), unixepoch()),
  ('swpp-10', '13416bbc1a68d97f33ae4af87f2e996ae2957dd3b2068994e4db7e86f1368ef6', '…02CF5', 'sw-create-product-pro', 'active', unixepoch(), unixepoch());

-- Product Pro is an SW-wide product benefit. Existing SW Create Product Pro
-- accounts receive the matching Play Streamers Product Pro subscription.
INSERT INTO sw_subscriptions
  (id, user_id, product_id, plan_id, status, source, starts_at, current_period_end, cancelled_at, created_at, updated_at)
SELECT lower(hex(randomblob(16))), user_id, 'play-streamers', 'play-streamers-product-pro',
  'active', 'sw-create-product-pro-bundle', starts_at, NULL, NULL, unixepoch(), unixepoch()
FROM sw_subscriptions
WHERE product_id = 'sw-create'
  AND plan_id = 'sw-create-product-pro'
  AND status = 'active'
  AND (current_period_end IS NULL OR current_period_end > unixepoch())
ON CONFLICT(user_id, product_id) DO UPDATE SET
  plan_id = 'play-streamers-product-pro',
  status = 'active',
  source = 'sw-create-product-pro-bundle',
  current_period_end = NULL,
  cancelled_at = NULL,
  updated_at = unixepoch();

-- Keep the legacy entitlement view aligned with the active plan catalog.
UPDATE sw_entitlements
SET tier = COALESCE((
      SELECT c.tier
      FROM sw_subscriptions s
      JOIN sw_plan_catalog c ON c.id = s.plan_id
      WHERE s.user_id = sw_entitlements.user_id
        AND s.product_id = sw_entitlements.product_id
        AND s.status = 'active'
        AND (s.current_period_end IS NULL OR s.current_period_end > unixepoch())
      LIMIT 1
    ), tier),
    source = CASE
      WHEN EXISTS (
        SELECT 1 FROM sw_subscriptions s
        WHERE s.user_id = sw_entitlements.user_id
          AND s.product_id = sw_entitlements.product_id
          AND s.status = 'active'
          AND (s.current_period_end IS NULL OR s.current_period_end > unixepoch())
      ) THEN 'subscription-sync'
      ELSE source
    END,
    expires_at = NULL,
    updated_at = unixepoch()
WHERE product_id IN ('sw-create', 'play-streamers')
  AND EXISTS (
    SELECT 1 FROM sw_subscriptions s
    WHERE s.user_id = sw_entitlements.user_id
      AND s.product_id = sw_entitlements.product_id
      AND s.status = 'active'
      AND (s.current_period_end IS NULL OR s.current_period_end > unixepoch())
  );

-- Any future SW Create Product Pro grant automatically carries the matching
-- Play Streamers Product Pro grant, even if it is created outside code redemption.
CREATE TRIGGER IF NOT EXISTS sw_product_pro_bundle_after_insert
AFTER INSERT ON sw_subscriptions
WHEN NEW.product_id = 'sw-create'
  AND NEW.plan_id = 'sw-create-product-pro'
  AND NEW.status = 'active'
BEGIN
  INSERT INTO sw_subscriptions
    (id, user_id, product_id, plan_id, status, source, starts_at, current_period_end, cancelled_at, created_at, updated_at)
  VALUES
    (lower(hex(randomblob(16))), NEW.user_id, 'play-streamers', 'play-streamers-product-pro', 'active', 'sw-create-product-pro-bundle', NEW.starts_at, NULL, NULL, unixepoch(), unixepoch())
  ON CONFLICT(user_id, product_id) DO UPDATE SET
    plan_id = 'play-streamers-product-pro', status = 'active', source = 'sw-create-product-pro-bundle',
    starts_at = excluded.starts_at, current_period_end = NULL, cancelled_at = NULL, updated_at = unixepoch();

  INSERT INTO sw_entitlements
    (id, user_id, product_id, tier, source, starts_at, expires_at, created_at, updated_at)
  VALUES
    (lower(hex(randomblob(16))), NEW.user_id, 'sw-create', 'product-pro', 'subscription-sync', NEW.starts_at, NULL, unixepoch(), unixepoch()),
    (lower(hex(randomblob(16))), NEW.user_id, 'play-streamers', 'product-pro', 'sw-create-product-pro-bundle', NEW.starts_at, NULL, unixepoch(), unixepoch())
  ON CONFLICT(user_id, product_id) DO UPDATE SET
    tier = 'product-pro', source = excluded.source, starts_at = excluded.starts_at,
    expires_at = NULL, updated_at = unixepoch();
END;

CREATE TRIGGER IF NOT EXISTS sw_product_pro_bundle_after_update
AFTER UPDATE OF plan_id, status, current_period_end ON sw_subscriptions
WHEN NEW.product_id = 'sw-create'
  AND NEW.plan_id = 'sw-create-product-pro'
  AND NEW.status = 'active'
BEGIN
  INSERT INTO sw_subscriptions
    (id, user_id, product_id, plan_id, status, source, starts_at, current_period_end, cancelled_at, created_at, updated_at)
  VALUES
    (lower(hex(randomblob(16))), NEW.user_id, 'play-streamers', 'play-streamers-product-pro', 'active', 'sw-create-product-pro-bundle', NEW.starts_at, NULL, NULL, unixepoch(), unixepoch())
  ON CONFLICT(user_id, product_id) DO UPDATE SET
    plan_id = 'play-streamers-product-pro', status = 'active', source = 'sw-create-product-pro-bundle',
    starts_at = excluded.starts_at, current_period_end = NULL, cancelled_at = NULL, updated_at = unixepoch();

  INSERT INTO sw_entitlements
    (id, user_id, product_id, tier, source, starts_at, expires_at, created_at, updated_at)
  VALUES
    (lower(hex(randomblob(16))), NEW.user_id, 'sw-create', 'product-pro', 'subscription-sync', NEW.starts_at, NULL, unixepoch(), unixepoch()),
    (lower(hex(randomblob(16))), NEW.user_id, 'play-streamers', 'product-pro', 'sw-create-product-pro-bundle', NEW.starts_at, NULL, unixepoch(), unixepoch())
  ON CONFLICT(user_id, product_id) DO UPDATE SET
    tier = 'product-pro', source = excluded.source, starts_at = excluded.starts_at,
    expires_at = NULL, updated_at = unixepoch();
END;
