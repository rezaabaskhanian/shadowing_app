-- +migrate Up
-- یادآوری روزانه دیگر از سرور فرستاده نمی‌شود (زمان‌بند سرور حذف شد) و فقط
-- روی خود دستگاه با notifee زمان‌بندی می‌شود؛ این ستون‌ها فقط برای همگام‌سازی
-- تنظیمات بین دستگاه‌های کاربر نگهداری می‌شوند.
-- ۱) پیش‌فرض هر دو نوتیفیکیشن «خاموش» شد؛ کاربر باید خودش روشن کند.
-- ۲) به‌جای یک ساعت ثابت، کاربر می‌تواند چند ساعت دلخواه انتخاب کند.
ALTER TABLE user_notification_settings ALTER COLUMN daily_reminder_enabled SET DEFAULT false;
ALTER TABLE user_notification_settings ALTER COLUMN content_notif_enabled SET DEFAULT false;

ALTER TABLE user_notification_settings
    ADD COLUMN IF NOT EXISTS daily_reminder_times TEXT[] NOT NULL DEFAULT '{}';

-- ساعتِ تکیِ قبلی را به آرایه منتقل می‌کنیم تا تنظیمات کاربران فعلی از بین نرود.
UPDATE user_notification_settings
SET daily_reminder_times = ARRAY[daily_reminder_time]
WHERE daily_reminder_times = '{}'
  AND daily_reminder_time IS NOT NULL
  AND daily_reminder_time <> '';

ALTER TABLE user_notification_settings DROP COLUMN IF EXISTS daily_reminder_time;

-- +migrate Down
ALTER TABLE user_notification_settings
    ADD COLUMN IF NOT EXISTS daily_reminder_time TEXT NOT NULL DEFAULT '20:00';

UPDATE user_notification_settings
SET daily_reminder_time = daily_reminder_times[1]
WHERE array_length(daily_reminder_times, 1) >= 1;

ALTER TABLE user_notification_settings DROP COLUMN IF EXISTS daily_reminder_times;
ALTER TABLE user_notification_settings ALTER COLUMN daily_reminder_enabled SET DEFAULT true;
ALTER TABLE user_notification_settings ALTER COLUMN content_notif_enabled SET DEFAULT true;
