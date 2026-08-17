-- +migrate Up

-- قفل‌بودن یک صحنه دیگر خودکار (بر اساس order) نیست؛ ادمین مستقیماً از
-- پنل ادمین برای هر صحنه تعیین می‌کند رایگان باشد یا نیاز به اشتراک فعال داشته باشد.
ALTER TABLE scenes
  ADD COLUMN IF NOT EXISTS is_locked BOOLEAN NOT NULL DEFAULT false;

-- +migrate Down

ALTER TABLE scenes
  DROP COLUMN IF EXISTS is_locked;
