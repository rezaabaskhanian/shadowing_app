-- +migrate Up
-- گیرنده‌ی پیام پنل ادمین: opted_in (فقط کسانی که نوتیف محتوایی را روشن کرده‌اند)،
-- all (همه‌ی دستگاه‌های ثبت‌شده) یا phone (یک کاربر؛ شماره‌اش در target_phone).
ALTER TABLE admin_broadcasts ADD COLUMN IF NOT EXISTS target TEXT NOT NULL DEFAULT 'opted_in';
ALTER TABLE admin_broadcasts ADD COLUMN IF NOT EXISTS target_phone TEXT NOT NULL DEFAULT '';

-- +migrate Down
ALTER TABLE admin_broadcasts DROP COLUMN IF EXISTS target_phone;
ALTER TABLE admin_broadcasts DROP COLUMN IF EXISTS target;
