-- internal/repository/postgres/migrations/002_create_scenes_tables.sql
-- +migrate Up

-- جدول سناریوها
CREATE TABLE IF NOT EXISTS scenes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    background_image_url TEXT NOT NULL,
    difficulty VARCHAR(50) NOT NULL CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
    status VARCHAR(50) DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
    "order" INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- جدول هات‌اسپات‌ها
CREATE TABLE IF NOT EXISTS hotspots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    scene_id UUID NOT NULL REFERENCES scenes(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    x_position DECIMAL(5,2) NOT NULL CHECK (x_position >= 0 AND x_position <= 100),
    y_position DECIMAL(5,2) NOT NULL CHECK (y_position >= 0 AND y_position <= 100),
    order_index INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- جدول دیالوگ‌ها
CREATE TABLE IF NOT EXISTS dialogues (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hotspot_id UUID NOT NULL REFERENCES hotspots(id) ON DELETE CASCADE,
    "order" INT NOT NULL CHECK ("order" > 0),
    speaker VARCHAR(50) NOT NULL CHECK (speaker IN ('customer', 'clerk', 'npc')),
    original_text TEXT NOT NULL,
    translation TEXT,
    audio_url TEXT,
    display_type VARCHAR(50) NOT NULL CHECK (display_type IN ('full', 'partial', 'none')),
    partial_hint TEXT,
    wait_duration INT DEFAULT 5 CHECK (wait_duration >= 1 AND wait_duration <= 30),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ایندکس‌ها برای پرفورمنس
CREATE INDEX idx_hotspots_scene_id ON hotspots(scene_id);
CREATE INDEX idx_dialogues_hotspot_id ON dialogues(hotspot_id);
CREATE INDEX idx_scenes_difficulty ON scenes(difficulty);
CREATE INDEX idx_scenes_status ON scenes(status);

-- +migrate Down
DROP TABLE IF EXISTS dialogues;
DROP TABLE IF EXISTS hotspots;
DROP TABLE IF EXISTS scenes;