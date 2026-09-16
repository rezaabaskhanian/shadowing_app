-- +migrate Up
-- Advanced Personalization part B (PRODUCT_SPECـCHAT_GPT.md section 36): یک
-- تنظیم اختیاری تازه، عیناً هم‌سو با الگوی content_source — کاربر می‌تواند
-- از Drawer/Settings یک هدف یادگیری (مثلاً Travel/Work/Daily Life/Study)
-- انتخاب کند. رشته‌ی خالی یعنی هنوز چیزی انتخاب نکرده؛ این تنظیم فقط برای
-- اولویت‌دهیِ نرم به انتخاب صحنه در Today's Mission استفاده می‌شود، هرگز
-- برای فیلتر سخت.
ALTER TABLE user_notification_settings
    ADD COLUMN IF NOT EXISTS learning_goal TEXT NOT NULL DEFAULT '';

-- +migrate Down
ALTER TABLE user_notification_settings DROP COLUMN IF EXISTS learning_goal;
