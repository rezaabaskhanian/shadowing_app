-- +migrate Up
-- تنظیم جدید: کاربر باید صریحاً رضایت بدهد تا وقتی یک روز تمرین نکرده (ولی
-- هنوز استریکش نشکسته) پوش یادآوری بگیرد. پیش‌فرض خاموش، هم‌سو با بقیه‌ی
-- تنظیمات نوتیفیکیشن.
ALTER TABLE user_notification_settings
    ADD COLUMN IF NOT EXISTS streak_reminder_enabled BOOLEAN NOT NULL DEFAULT false;

-- +migrate Down
ALTER TABLE user_notification_settings DROP COLUMN IF EXISTS streak_reminder_enabled;
