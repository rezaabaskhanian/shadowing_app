-- internal/repository/postgres/migrations/003_add_progress_tables.sql
-- +migrate Up

-- جدول پیشرفت کاربر در سناریوها
CREATE TABLE IF NOT EXISTS user_scene_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    scene_id UUID NOT NULL REFERENCES scenes(id) ON DELETE CASCADE,
    progress_percentage INT DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
    completed_at TIMESTAMP,
    last_accessed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, scene_id)
);

-- جدول ضبط‌های کاربر برای دیالوگ‌ها
CREATE TABLE IF NOT EXISTS user_recordings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    dialogue_id UUID NOT NULL REFERENCES dialogues(id) ON DELETE CASCADE,
    recording_url TEXT NOT NULL,
    score DECIMAL(5,2) CHECK (score >= 0 AND score <= 100),
    feedback TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ایندکس‌ها
CREATE INDEX idx_user_scene_progress_user_id ON user_scene_progress(user_id);
CREATE INDEX idx_user_scene_progress_scene_id ON user_scene_progress(scene_id);
CREATE INDEX idx_user_recordings_user_id ON user_recordings(user_id);
CREATE INDEX idx_user_recordings_dialogue_id ON user_recordings(dialogue_id);

-- +migrate Down
DROP TABLE IF EXISTS user_recordings;
DROP TABLE IF EXISTS user_scene_progress;