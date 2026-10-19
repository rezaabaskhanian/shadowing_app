-- +migrate Up
-- سطح تقریبی CEFR هر هفته‌ی مسیر (مثلاً A1 یا A2) برای نشان دادن پیشرفت به
-- کاربر: برچسب هفته و پیام «سطح A1 را کامل کردی» وقتی سطح هفته‌ی بعد عوض شود.
-- خالی یعنی برچسب نشان داده نمی‌شود.
ALTER TABLE path_weeks ADD COLUMN IF NOT EXISTS cefr TEXT NOT NULL DEFAULT '';

-- +migrate Down
ALTER TABLE path_weeks DROP COLUMN IF EXISTS cefr;
