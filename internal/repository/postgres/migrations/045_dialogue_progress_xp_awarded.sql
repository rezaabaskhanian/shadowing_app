-- +migrate Up
-- XP هر دیالوگ فقط یک‌بار و فقط وقتی داده می‌شود که کاربر در مرحله‌ی ضبط
-- متن را نمایش نداده باشد (بدون کمک). این ستون نگه می‌دارد XP آن دیالوگ
-- قبلاً داده شده یا نه — تا اگر بار اول با کمک ضبط شد، بعداً بدون کمک هنوز
-- بشود XP گرفت. رکوردهای قبلی true فرض می‌شوند (قانون قبلی XP جداگانه‌ای
-- برای دیالوگ نداشت و نباید با تکرار آن‌ها XP تازه ساخته شود).
ALTER TABLE scene_dialogue_progress
  ADD COLUMN IF NOT EXISTS xp_awarded BOOLEAN NOT NULL DEFAULT true;

-- +migrate Down
ALTER TABLE scene_dialogue_progress DROP COLUMN IF EXISTS xp_awarded;
