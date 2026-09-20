-- +migrate Up
-- سقفِ محافظتیِ روزانه‌ی توکن برای فیچرهای AI-heavy (AI Conversation، Free
-- Speech): جلوی یک کاربرِ پرمصرفِ غیرعادی (باگ کلاینت یا سوءاستفاده) را
-- می‌گیرد، نه سهمیه‌بندیِ دقیقِ اقتصادی بر اساس پلن. یک ردیف به‌ازای هر
-- کاربر-روز، جمع‌شونده با UPSERT اتمیک (نگاه کنید به internal/service/aiaccess).
-- input/output جدا نگه داشته می‌شوند (نه یک total واحد) چون قیمتِ providerها
-- برای توکنِ ورودی/خروجی معمولاً فرق می‌کند و برای محاسبه‌ی هزینه‌ی دلاریِ
-- واقعی لازم است.
CREATE TABLE IF NOT EXISTS ai_daily_usage (
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    usage_date DATE NOT NULL,
    input_tokens INTEGER NOT NULL DEFAULT 0,
    output_tokens INTEGER NOT NULL DEFAULT 0,
    PRIMARY KEY (user_id, usage_date)
);

-- +migrate Down
DROP TABLE IF EXISTS ai_daily_usage;
