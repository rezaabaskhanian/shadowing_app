-- +migrate Up
-- خرید مصرفیِ توکن (نه اشتراک): برای کاربری که سقفِ روزانه‌اش تمام شده و
-- نمی‌خواهد تا فردا صبر کند. عمداً از subscription_plans جدا است چون منطقِ
-- گرنتش فرق دارد (اعتبارِ توکن، نه روزِ اشتراک) — نگاه کنید به
-- internal/service/tokentopup و aiaccessservice.AddCredit.

CREATE TABLE IF NOT EXISTS token_topup_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    tokens INTEGER NOT NULL,
    price_toman INTEGER NOT NULL,
    product_id TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_token_topup_plans_product_id
    ON token_topup_plans(product_id)
    WHERE product_id IS NOT NULL;

-- لاگِ خریدهای واقعی، عیناً هم‌نقشِ user_subscriptions.purchase_token: هم
-- idempotency (یک purchase_token فقط یک‌بار گرنت می‌شود) هم ممیزی.
CREATE TABLE IF NOT EXISTS token_topup_purchases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    plan_id UUID NOT NULL REFERENCES token_topup_plans(id),
    tokens INTEGER NOT NULL,
    price_toman INTEGER NOT NULL,
    provider TEXT,
    purchase_token TEXT UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_token_topup_purchases_user_id ON token_topup_purchases(user_id);

-- اعتبارِ توکنِ خریداری‌شده‌ی هر کاربر — برخلافِ ai_daily_usage، این هر روز
-- صفر نمی‌شود؛ فقط با خریدِ جدید بالا و با مصرفِ فراتر از سقفِ رایگانِ روزانه
-- پایین می‌رود (نگاه کنید به aiaccessservice.CheckAllowed/RecordUsage).
CREATE TABLE IF NOT EXISTS ai_token_credits (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    balance_tokens INTEGER NOT NULL DEFAULT 0
);

-- +migrate Down
DROP TABLE IF EXISTS ai_token_credits;
DROP TABLE IF EXISTS token_topup_purchases;
DROP INDEX IF EXISTS idx_token_topup_plans_product_id;
DROP TABLE IF EXISTS token_topup_plans;
