-- +migrate Up
-- صدای نکته‌ی گرامریِ صحنه (grammar_explanation) — عیناً هم‌الگوی صدای
-- دیالوگ‌ها (تولید با ElevenLabs از پنل ادمین)، برای کاربری که حوصله‌ی
-- خواندن ندارد. اختیاری؛ صحنه‌های قدیمی بدون این صدا هم درست کار می‌کنند.
ALTER TABLE scenes ADD COLUMN IF NOT EXISTS grammar_audio_url TEXT;

-- +migrate Down
ALTER TABLE scenes DROP COLUMN IF EXISTS grammar_audio_url;
