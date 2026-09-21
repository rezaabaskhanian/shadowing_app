-- +migrate Up
-- اصطلاح/عبارت (idiom / phrase) اختیاریِ هر دیالوگ: آرایه‌ی JSON از
-- {phrase, meaning}. خالی = برای آن جمله چیزی نشان داده نمی‌شود.
ALTER TABLE dialogues
  ADD COLUMN IF NOT EXISTS phrases JSONB NOT NULL DEFAULT '[]'::jsonb;

-- +migrate Down
ALTER TABLE dialogues DROP COLUMN IF EXISTS phrases;
