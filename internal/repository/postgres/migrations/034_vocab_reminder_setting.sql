-- +migrate Up
-- Vocabulary Coach v1 (PRODUCT_SPECـCHAT_GPT.md section 36): تنظیم جدید،
-- عیناً هم‌سو با الگوی streak_reminder_enabled — کاربر باید صریحاً رضایت
-- بدهد تا وقتی کلمه‌ای در جعبه‌ی لایتنرش سررسیده شده پوش یادآوری بگیرد.
-- پیش‌فرض خاموش.
ALTER TABLE user_notification_settings
    ADD COLUMN IF NOT EXISTS vocab_reminder_enabled BOOLEAN NOT NULL DEFAULT false;

-- +migrate Down
ALTER TABLE user_notification_settings DROP COLUMN IF EXISTS vocab_reminder_enabled;
