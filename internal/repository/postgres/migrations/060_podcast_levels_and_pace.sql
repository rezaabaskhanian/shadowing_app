-- +migrate Up
-- سطح «starter» (قدم اول) برای پادکست‌ها، و دو تنظیمِ صدا برای هر پادکست:
--   speech_speed: سرعتِ گفتارِ TTS (۰٫۷ تا ۱٫۲؛ برای سطح‌های پایین آرام‌تر)
--   line_gap_ms: مکثِ بینِ جمله‌ها (برای مبتدی بیشتر، تا فرصتِ فکر کردن باشد)
-- پیش‌فرض‌های هر سطح در app_settings (PODCAST_LEVEL_PRESETS) — ببینید podcastservice.
ALTER TABLE podcasts DROP CONSTRAINT IF EXISTS podcasts_level_check;
ALTER TABLE podcasts ADD CONSTRAINT podcasts_level_check
    CHECK (level IN ('starter', 'beginner', 'intermediate', 'advanced'));

ALTER TABLE podcasts
    ADD COLUMN IF NOT EXISTS speech_speed REAL NOT NULL DEFAULT 1,
    ADD COLUMN IF NOT EXISTS line_gap_ms  INT  NOT NULL DEFAULT 350;

-- +migrate Down
UPDATE podcasts SET level = 'beginner' WHERE level = 'starter';
ALTER TABLE podcasts DROP CONSTRAINT IF EXISTS podcasts_level_check;
ALTER TABLE podcasts ADD CONSTRAINT podcasts_level_check
    CHECK (level IN ('beginner', 'intermediate', 'advanced'));
ALTER TABLE podcasts
    DROP COLUMN IF EXISTS line_gap_ms,
    DROP COLUMN IF EXISTS speech_speed;
