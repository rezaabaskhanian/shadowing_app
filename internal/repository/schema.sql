-- ============================================
-- دامین User
-- ============================================

-- نوع‌های سفارشی (Enums)
CREATE TYPE user_role AS ENUM ('user', 'helper', 'admin');
CREATE TYPE scene_difficulty AS ENUM ('beginner', 'intermediate', 'advanced');
CREATE TYPE scene_status AS ENUM ('draft', 'published', 'archived');
CREATE TYPE speaker_type AS ENUM ('customer', 'clerk', 'npc');
CREATE TYPE display_type AS ENUM ('full', 'partial', 'none');

-- ============================================
-- جدول Users
-- ============================================
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nickname TEXT NOT NULL,
    password_hash TEXT NOT NULL,
    phone TEXT NOT NULL UNIQUE,
    role user_role NOT NULL DEFAULT 'user',
    is_premium BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================
-- دامین Learning (Scene, Hotspot, Dialogue)
-- ============================================

-- جدول Scenes (سناریوها)
CREATE TABLE scenes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    background_image_url TEXT NOT NULL,
    difficulty scene_difficulty NOT NULL,
    status scene_status NOT NULL DEFAULT 'draft',
    "order" INT DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- جدول Hotspots (نقاط قابل کلیک)
CREATE TABLE hotspots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    scene_id UUID NOT NULL REFERENCES scenes(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    x_position DECIMAL(5,2) NOT NULL CHECK (x_position >= 0 AND x_position <= 100),
    y_position DECIMAL(5,2) NOT NULL CHECK (y_position >= 0 AND y_position <= 100),
    order_index INT DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- جدول Dialogues (دیالوگ‌ها)
CREATE TABLE dialogues (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hotspot_id UUID NOT NULL REFERENCES hotspots(id) ON DELETE CASCADE,
    "order" INT NOT NULL CHECK ("order" > 0),
    speaker speaker_type NOT NULL,
    original_text TEXT NOT NULL,
    translation TEXT,
    audio_url TEXT,
    display_type display_type NOT NULL DEFAULT 'full',
    partial_hint TEXT,
    wait_duration INT DEFAULT 5 CHECK (wait_duration >= 1 AND wait_duration <= 30),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================
-- دامین Progress (پیشرفت کاربر)
-- ============================================

-- جدول پیشرفت کاربر در سناریوها
CREATE TABLE user_scene_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    scene_id UUID NOT NULL REFERENCES scenes(id) ON DELETE CASCADE,
    progress_percentage INT DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
    completed_at TIMESTAMPTZ,
    last_accessed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(user_id, scene_id)
);

-- جدول ضبط‌های کاربر برای دیالوگ‌ها
CREATE TABLE user_recordings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    dialogue_id UUID NOT NULL REFERENCES dialogues(id) ON DELETE CASCADE,
    recording_url TEXT NOT NULL,
    score DECIMAL(5,2) CHECK (score >= 0 AND score <= 100),
    feedback TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================
-- ایندکس‌ها (برای بهبود عملکرد)
-- ============================================

-- Users
CREATE INDEX idx_users_phone ON users(phone);
CREATE INDEX idx_users_role ON users(role);

-- Scenes
CREATE INDEX idx_scenes_difficulty ON scenes(difficulty);
CREATE INDEX idx_scenes_status ON scenes(status);
CREATE INDEX idx_scenes_order ON scenes("order");

-- Hotspots
CREATE INDEX idx_hotspots_scene_id ON hotspots(scene_id);
CREATE INDEX idx_hotspots_order ON hotspots(order_index);

-- Dialogues
CREATE INDEX idx_dialogues_hotspot_id ON dialogues(hotspot_id);
CREATE INDEX idx_dialogues_order ON dialogues("order");

-- Progress
CREATE INDEX idx_user_scene_progress_user_id ON user_scene_progress(user_id);
CREATE INDEX idx_user_scene_progress_scene_id ON user_scene_progress(scene_id);

-- Recordings
CREATE INDEX idx_user_recordings_user_id ON user_recordings(user_id);
CREATE INDEX idx_user_recordings_dialogue_id ON user_recordings(dialogue_id);

-- ============================================
-- تابع به‌روزرسانی خودکار updated_at
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- اعمال تریگر برای همه جداول
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_scenes_updated_at BEFORE UPDATE ON scenes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_hotspots_updated_at BEFORE UPDATE ON hotspots FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_dialogues_updated_at BEFORE UPDATE ON dialogues FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_scene_progress_updated_at BEFORE UPDATE ON user_scene_progress FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();