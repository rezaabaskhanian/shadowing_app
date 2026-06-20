-- +migrate Up

-- ============================================
-- جدول Streak (استریک روزانه)
-- ============================================
CREATE TABLE IF NOT EXISTS streaks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    current INT NOT NULL DEFAULT 0,
    longest INT NOT NULL DEFAULT 0,
    last_date TIMESTAMPTZ NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'active',
    freezes INT NOT NULL DEFAULT 2,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(user_id)
);

-- ============================================
-- جدول Achievements (دستاوردها)
-- ============================================
CREATE TABLE IF NOT EXISTS achievements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL,
    rarity VARCHAR(20) NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    icon VARCHAR(10) NOT NULL,
    xp INT NOT NULL DEFAULT 0,
    unlocked_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(user_id, type)
);

-- ============================================
-- جدول SceneProgress (پیشرفت در سناریوها)
-- ============================================
CREATE TABLE IF NOT EXISTS scene_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    scene_id UUID NOT NULL REFERENCES scenes(id) ON DELETE CASCADE,
    progress_percentage INT NOT NULL DEFAULT 0 CHECK (progress_percentage BETWEEN 0 AND 100),
    completed_dialogues INT NOT NULL DEFAULT 0,
    total_dialogues INT NOT NULL DEFAULT 0,
    score DECIMAL(5,2) NOT NULL DEFAULT 0,
    xp INT NOT NULL DEFAULT 0,
    is_completed BOOLEAN NOT NULL DEFAULT FALSE,
    last_accessed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(user_id, scene_id)
);

-- ============================================
-- ایندکس‌ها
-- ============================================
CREATE INDEX idx_streaks_user_id ON streaks(user_id);
CREATE INDEX idx_achievements_user_id ON achievements(user_id);
CREATE INDEX idx_scene_progress_user_id ON scene_progress(user_id);
CREATE INDEX idx_scene_progress_scene_id ON scene_progress(scene_id);
CREATE INDEX idx_scene_progress_completed ON scene_progress(is_completed);

-- ============================================
-- تریگرها
-- ============================================
CREATE TRIGGER update_streaks_updated_at 
    BEFORE UPDATE ON streaks 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_scene_progress_updated_at 
    BEFORE UPDATE ON scene_progress 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- +migrate Down
DROP TABLE IF EXISTS scene_progress;
DROP TABLE IF EXISTS achievements;
DROP TABLE IF EXISTS streaks;