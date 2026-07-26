-- +migrate Up
-- واژه‌های هر دیالوگ (انگلیسی + معنی) به‌صورت JSON روی خود دیالوگ ذخیره می‌شوند.
-- نمونه: [{"word":"cappuccino","meaning":"کاپوچینو"}, ...]
ALTER TABLE dialogues
  ADD COLUMN IF NOT EXISTS words JSONB NOT NULL DEFAULT '[]'::jsonb;

-- +migrate Down
ALTER TABLE dialogues DROP COLUMN IF EXISTS words;
