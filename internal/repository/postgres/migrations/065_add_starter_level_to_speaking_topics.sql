-- +migrate Up
-- موضوع‌های «صحبت هدایت‌شده» برای مسیر قدم اول (starter): جمله‌های کوتاه با
-- سؤال‌های راهنما و عبارت‌های آماده — ببینید pathservice و topicspeakingservice.
ALTER TABLE speaking_topics DROP CONSTRAINT IF EXISTS speaking_topics_level_check;
ALTER TABLE speaking_topics ADD CONSTRAINT speaking_topics_level_check
    CHECK (level IN ('starter', 'beginner', 'intermediate', 'advanced'));

-- +migrate Down
UPDATE speaking_topics SET level = 'beginner' WHERE level = 'starter';
ALTER TABLE speaking_topics DROP CONSTRAINT IF EXISTS speaking_topics_level_check;
ALTER TABLE speaking_topics ADD CONSTRAINT speaking_topics_level_check
    CHECK (level IN ('beginner', 'intermediate', 'advanced'));
