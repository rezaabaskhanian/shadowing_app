-- +migrate Up
-- رویدادهای آنالیتیکس اپ موبایل (append-only): باز شدن اپ، دیدن صفحه‌ها و
-- قدم‌های اصلی مسیر کاربر (اینترو → تعیین سطح → صحنه → ضبط → پی‌وال → خرید).
-- آمار روزانه، ماندگاری D1/D7 به تفکیک نسخه، پرکاربردترین صفحه‌ها و قیف از
-- روی همین جدول در پنل ادمین حساب می‌شود — ببینید analyticsservice.
--
-- device_id کلید اصلی شمارش است، چون نصب و اولین قدم‌ها قبل از ورود کاربر
-- اتفاق می‌افتد؛ user_id فقط وقتی کاربر وارد شده باشد پر می‌شود.
-- created_at عمداً TIMESTAMPTZ است تا روزبندی به وقت تهران مستقل از تایم‌زون سرور باشد.
CREATE TABLE IF NOT EXISTS app_events (
    id           BIGSERIAL PRIMARY KEY,
    device_id    TEXT NOT NULL,
    user_id      UUID REFERENCES users(id) ON DELETE SET NULL,
    event        TEXT NOT NULL,
    app_version  TEXT NOT NULL DEFAULT '',
    screen       TEXT,
    target       TEXT,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_app_events_created_at ON app_events (created_at);
CREATE INDEX IF NOT EXISTS idx_app_events_device_created ON app_events (device_id, created_at);
CREATE INDEX IF NOT EXISTS idx_app_events_event_created ON app_events (event, created_at);

-- +migrate Down
DROP TABLE IF EXISTS app_events;
