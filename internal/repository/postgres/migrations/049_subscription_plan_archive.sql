-- +migrate Up
-- پلنی که قبلاً خریده/گرنت شده به‌خاطر FK از user_subscriptions (ON DELETE
-- RESTRICT) قابل حذف نیست؛ به‌جای حذف آرشیو می‌شود تا تاریخچه‌ی خرید بماند.
ALTER TABLE subscription_plans
  ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ;

-- SKU پلن آرشیوشده باید برای یک پلن جدید قابل استفاده‌ی مجدد باشد.
DROP INDEX IF EXISTS idx_subscription_plans_product_id;
CREATE UNIQUE INDEX IF NOT EXISTS idx_subscription_plans_product_id
  ON subscription_plans(product_id)
  WHERE product_id IS NOT NULL AND archived_at IS NULL;

-- +migrate Down

DROP INDEX IF EXISTS idx_subscription_plans_product_id;
CREATE UNIQUE INDEX IF NOT EXISTS idx_subscription_plans_product_id
  ON subscription_plans(product_id)
  WHERE product_id IS NOT NULL;

ALTER TABLE subscription_plans
  DROP COLUMN IF EXISTS archived_at;
