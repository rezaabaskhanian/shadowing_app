-- +migrate Up
-- بازخورد گرامری فقط روی متن آزادانه‌ی کاربر معنی دارد (نه دیالوگ‌های
-- شدوئینگ که تکرار جمله‌ی مرجع‌اند) — پس فقط به همان دو جایی اضافه می‌شود که
-- از قبل رونویسی متن آزاد کاربر را نگه می‌دارند. هر دو ستون nullable هستند؛
-- اکثر جمله‌ها اصلاحی نمی‌خواهند.
ALTER TABLE assessment_submission_items ADD COLUMN IF NOT EXISTS grammar_correction TEXT;
ALTER TABLE assessment_submission_items ADD COLUMN IF NOT EXISTS grammar_explanation TEXT;
ALTER TABLE ai_conversation_turns ADD COLUMN IF NOT EXISTS grammar_correction TEXT;
ALTER TABLE ai_conversation_turns ADD COLUMN IF NOT EXISTS grammar_explanation TEXT;

-- +migrate Down
ALTER TABLE ai_conversation_turns DROP COLUMN IF EXISTS grammar_explanation;
ALTER TABLE ai_conversation_turns DROP COLUMN IF EXISTS grammar_correction;
ALTER TABLE assessment_submission_items DROP COLUMN IF EXISTS grammar_explanation;
ALTER TABLE assessment_submission_items DROP COLUMN IF EXISTS grammar_correction;
