-- +migrate Up

-- product_id شناسه‌ی SKU متناظر این پلن در پنل توسعه‌دهندگان کافه‌بازار است؛
-- برای گرنت دستی ادمین می‌تواند خالی بماند، اما برای پلن‌هایی که باید از
-- طریق پولکی (Poolakey) قابل‌خرید باشند باید دقیقاً با SKU ساخته‌شده در بازار
-- یکی باشد (ببینید internal/service/billing/service.go).
ALTER TABLE subscription_plans
  ADD COLUMN IF NOT EXISTS product_id TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS idx_subscription_plans_product_id
  ON subscription_plans(product_id)
  WHERE product_id IS NOT NULL;

-- پلن‌های چهارگانه‌ی درخواستی: ماهانه/سه‌ماهه/شش‌ماهه/یک‌ساله با قیمت ثابت
-- (بدون تخفیف امتیازی). پلن‌های قبلی با همان duration_days به‌روزرسانی
-- می‌شوند تا داده‌ی خرید قبلی (user_subscriptions.plan_id) از بین نرود.
UPDATE subscription_plans
   SET name = 'یک ماهه', price_toman = 300000, product_id = 'shadowing_1m'
 WHERE duration_days = 30;

UPDATE subscription_plans
   SET name = 'سه ماهه', price_toman = 700000, product_id = 'shadowing_3m'
 WHERE duration_days = 90;

UPDATE subscription_plans
   SET name = 'یک ساله', price_toman = 2500000, product_id = 'shadowing_12m'
 WHERE duration_days = 365;

INSERT INTO subscription_plans (name, duration_days, price_toman, product_id)
SELECT 'شش ماهه', 180, 1200000, 'shadowing_6m'
WHERE NOT EXISTS (SELECT 1 FROM subscription_plans WHERE duration_days = 180);

-- اگر هیچ‌کدام از پلن‌های 30/90/365 روزه از قبل وجود نداشتند (دیتابیس تازه)،
-- همین‌جا می‌سازیمشان.
INSERT INTO subscription_plans (name, duration_days, price_toman, product_id)
SELECT 'یک ماهه', 30, 300000, 'shadowing_1m'
WHERE NOT EXISTS (SELECT 1 FROM subscription_plans WHERE duration_days = 30);

INSERT INTO subscription_plans (name, duration_days, price_toman, product_id)
SELECT 'سه ماهه', 90, 700000, 'shadowing_3m'
WHERE NOT EXISTS (SELECT 1 FROM subscription_plans WHERE duration_days = 90);

INSERT INTO subscription_plans (name, duration_days, price_toman, product_id)
SELECT 'یک ساله', 365, 2500000, 'shadowing_12m'
WHERE NOT EXISTS (SELECT 1 FROM subscription_plans WHERE duration_days = 365);

-- +migrate Down

DROP INDEX IF EXISTS idx_subscription_plans_product_id;

ALTER TABLE subscription_plans
  DROP COLUMN IF EXISTS product_id;
