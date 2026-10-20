-- +migrate Up
-- سطح «proficient» (حرفه‌ای، C1): بالاتر از advanced (B2). برای صحنه‌ها، انتخاب
-- دستی سطح، و محتوای کنار مسیر (موضوع صحبت، پادکست، تمرین نوشتن، کلیپ).
ALTER TABLE scenes DROP CONSTRAINT IF EXISTS scenes_difficulty_check;
ALTER TABLE scenes ADD CONSTRAINT scenes_difficulty_check
    CHECK (difficulty IN ('starter', 'beginner', 'intermediate', 'advanced', 'proficient'));

ALTER TABLE user_level_overrides DROP CONSTRAINT IF EXISTS user_level_overrides_difficulty_check;
ALTER TABLE user_level_overrides ADD CONSTRAINT user_level_overrides_difficulty_check
    CHECK (difficulty IN ('starter', 'beginner', 'intermediate', 'advanced', 'proficient'));

ALTER TABLE speaking_topics DROP CONSTRAINT IF EXISTS speaking_topics_level_check;
ALTER TABLE speaking_topics ADD CONSTRAINT speaking_topics_level_check
    CHECK (level IN ('starter', 'beginner', 'intermediate', 'advanced', 'proficient'));

ALTER TABLE podcasts DROP CONSTRAINT IF EXISTS podcasts_level_check;
ALTER TABLE podcasts ADD CONSTRAINT podcasts_level_check
    CHECK (level IN ('starter', 'beginner', 'intermediate', 'advanced', 'proficient'));

ALTER TABLE writing_prompts DROP CONSTRAINT IF EXISTS writing_prompts_level_check;
ALTER TABLE writing_prompts ADD CONSTRAINT writing_prompts_level_check
    CHECK (level IN ('beginner', 'intermediate', 'advanced', 'proficient'));

ALTER TABLE video_clips DROP CONSTRAINT IF EXISTS video_clips_level_check;
ALTER TABLE video_clips ADD CONSTRAINT video_clips_level_check
    CHECK (level IN ('beginner', 'intermediate', 'advanced', 'proficient'));

-- صحبت طولانی C1 تا ۱۸۰ ثانیه.
ALTER TABLE speaking_topics DROP CONSTRAINT IF EXISTS speaking_topics_duration_seconds_check;
ALTER TABLE speaking_topics ADD CONSTRAINT speaking_topics_duration_seconds_check
    CHECK (duration_seconds BETWEEN 30 AND 180);

-- +migrate Down
UPDATE speaking_topics SET duration_seconds = 120 WHERE duration_seconds > 120;
ALTER TABLE speaking_topics DROP CONSTRAINT IF EXISTS speaking_topics_duration_seconds_check;
ALTER TABLE speaking_topics ADD CONSTRAINT speaking_topics_duration_seconds_check
    CHECK (duration_seconds BETWEEN 30 AND 120);

UPDATE scenes SET difficulty = 'advanced' WHERE difficulty = 'proficient';
UPDATE user_level_overrides SET difficulty = 'advanced' WHERE difficulty = 'proficient';
UPDATE speaking_topics SET level = 'advanced' WHERE level = 'proficient';
UPDATE podcasts SET level = 'advanced' WHERE level = 'proficient';
UPDATE writing_prompts SET level = 'advanced' WHERE level = 'proficient';
UPDATE video_clips SET level = 'advanced' WHERE level = 'proficient';

ALTER TABLE scenes DROP CONSTRAINT IF EXISTS scenes_difficulty_check;
ALTER TABLE scenes ADD CONSTRAINT scenes_difficulty_check
    CHECK (difficulty IN ('starter', 'beginner', 'intermediate', 'advanced'));

ALTER TABLE user_level_overrides DROP CONSTRAINT IF EXISTS user_level_overrides_difficulty_check;
ALTER TABLE user_level_overrides ADD CONSTRAINT user_level_overrides_difficulty_check
    CHECK (difficulty IN ('starter', 'beginner', 'intermediate', 'advanced'));

ALTER TABLE speaking_topics DROP CONSTRAINT IF EXISTS speaking_topics_level_check;
ALTER TABLE speaking_topics ADD CONSTRAINT speaking_topics_level_check
    CHECK (level IN ('starter', 'beginner', 'intermediate', 'advanced'));

ALTER TABLE podcasts DROP CONSTRAINT IF EXISTS podcasts_level_check;
ALTER TABLE podcasts ADD CONSTRAINT podcasts_level_check
    CHECK (level IN ('starter', 'beginner', 'intermediate', 'advanced'));

ALTER TABLE writing_prompts DROP CONSTRAINT IF EXISTS writing_prompts_level_check;
ALTER TABLE writing_prompts ADD CONSTRAINT writing_prompts_level_check
    CHECK (level IN ('beginner', 'intermediate', 'advanced'));

ALTER TABLE video_clips DROP CONSTRAINT IF EXISTS video_clips_level_check;
ALTER TABLE video_clips ADD CONSTRAINT video_clips_level_check
    CHECK (level IN ('beginner', 'intermediate', 'advanced'));
