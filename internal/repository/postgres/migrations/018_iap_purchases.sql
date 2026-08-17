-- +migrate Up

-- ثبت اینکه یک اشتراک از کدوم درگاه (مثلاً 'cafebazaar') و با کدوم
-- purchaseToken فعال شده. purchase_token باید یکتا باشه تا یک خرید کافه‌بازاری
-- دوبار verify نشه و دوبار اشتراک/تخفیف امتیاز اعمال نشه.
ALTER TABLE user_subscriptions
  ADD COLUMN IF NOT EXISTS provider TEXT,
  ADD COLUMN IF NOT EXISTS purchase_token TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS idx_user_subscriptions_purchase_token
  ON user_subscriptions(purchase_token)
  WHERE purchase_token IS NOT NULL;

-- +migrate Down

DROP INDEX IF EXISTS idx_user_subscriptions_purchase_token;

ALTER TABLE user_subscriptions
  DROP COLUMN IF EXISTS provider,
  DROP COLUMN IF EXISTS purchase_token;
