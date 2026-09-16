-- +migrate Up
-- Weekly Speaking Digest (PRODUCT_SPECـCHAT_GPT.md section 25 "More
-- sophisticated speaking reports"): یک پوشِ هفتگیِ شخصی‌سازی‌شده که داده‌ی
-- خامِ Progress Over Time + Skill Breakdown را به یک جمله‌ی actionable تبدیل
-- می‌کند. عیناً هم‌الگوی streak_reminder_enabled/vocab_reminder_enabled —
-- opt-in صریح، پیش‌فرض خاموش.
ALTER TABLE user_notification_settings
    ADD COLUMN IF NOT EXISTS weekly_digest_enabled BOOLEAN NOT NULL DEFAULT false;

-- +migrate Down
ALTER TABLE user_notification_settings DROP COLUMN IF EXISTS weekly_digest_enabled;
