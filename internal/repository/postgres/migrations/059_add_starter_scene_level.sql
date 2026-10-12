-- +migrate Up
-- سطح «starter» (قدم اول) برای صحنه‌ها: پایه‌تر از beginner، برای کسی که
-- تازه شروع کرده (سلام و احوال‌پرسی، معرفی خود و ...). کاربر هم می‌تواند از
-- منوی «سطح من» این سطح را انتخاب کند.
ALTER TABLE scenes DROP CONSTRAINT IF EXISTS scenes_difficulty_check;
ALTER TABLE scenes ADD CONSTRAINT scenes_difficulty_check
    CHECK (difficulty IN ('starter', 'beginner', 'intermediate', 'advanced'));

ALTER TABLE user_level_overrides DROP CONSTRAINT IF EXISTS user_level_overrides_difficulty_check;
ALTER TABLE user_level_overrides ADD CONSTRAINT user_level_overrides_difficulty_check
    CHECK (difficulty IN ('starter', 'beginner', 'intermediate', 'advanced'));

-- +migrate Down
UPDATE scenes SET difficulty = 'beginner' WHERE difficulty = 'starter';
UPDATE user_level_overrides SET difficulty = 'beginner' WHERE difficulty = 'starter';

ALTER TABLE scenes DROP CONSTRAINT IF EXISTS scenes_difficulty_check;
ALTER TABLE scenes ADD CONSTRAINT scenes_difficulty_check
    CHECK (difficulty IN ('beginner', 'intermediate', 'advanced'));

ALTER TABLE user_level_overrides DROP CONSTRAINT IF EXISTS user_level_overrides_difficulty_check;
ALTER TABLE user_level_overrides ADD CONSTRAINT user_level_overrides_difficulty_check
    CHECK (difficulty IN ('beginner', 'intermediate', 'advanced'));
