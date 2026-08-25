-- +migrate Up
-- زمان‌بندی کلمه‌به‌کلمه‌ی صدای مرجع (از whisper-service)، برای هایلایتِ
-- هم‌زمان با پخش در اپ. اگر WHISPER_URL تنظیم نباشد یا تشخیص گفتار شکست
-- بخورد، این ستون خالی می‌ماند و اپ فقط هایلایت را نشان نمی‌دهد.
-- نمونه: [{"word":"hello","start":0.12,"end":0.48}, ...]
ALTER TABLE dialogues
  ADD COLUMN IF NOT EXISTS word_timings JSONB;

-- +migrate Down
ALTER TABLE dialogues DROP COLUMN IF EXISTS word_timings;
