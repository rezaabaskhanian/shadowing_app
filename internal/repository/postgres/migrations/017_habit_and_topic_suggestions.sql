-- +migrate Up

CREATE TABLE IF NOT EXISTS habit_activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) NOT NULL UNIQUE,
    name_en VARCHAR(100) NOT NULL,
    name_fa VARCHAR(100) NOT NULL,
    icon VARCHAR(50),
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO habit_activities (code, name_en, name_fa, icon) VALUES
  ('making_tea', 'Making Tea', 'دم‌کردن چای', 'coffee'),
  ('making_coffee', 'Making Coffee', 'درست‌کردن قهوه', 'coffee'),
  ('watering_plants', 'Watering Plants', 'آب‌دادن به گیاهان', 'droplet'),
  ('cleaning', 'Cleaning', 'نظافت', 'brush'),
  ('walking', 'Walking', 'پیاده‌روی', 'footprints'),
  ('cooking', 'Cooking', 'آشپزی', 'utensils'),
  ('getting_ready', 'Getting Ready', 'آماده‌شدن', 'shirt'),
  ('household_tasks', 'Simple Household Tasks', 'کارهای ساده خانه', 'home')
ON CONFLICT (code) DO NOTHING;

CREATE TABLE IF NOT EXISTS habit_missions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    hotspot_id UUID NOT NULL REFERENCES hotspots(id) ON DELETE CASCADE,
    activity_id UUID NOT NULL REFERENCES habit_activities(id) ON DELETE RESTRICT,
    mission_type VARCHAR(20) NOT NULL CHECK (mission_type IN ('real_life', 'automaticity')),
    status VARCHAR(20) NOT NULL DEFAULT 'assigned' CHECK (status IN ('assigned', 'in_progress', 'completed')),
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    duration_seconds INT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_habit_missions_user_id ON habit_missions(user_id);
CREATE INDEX idx_habit_missions_status ON habit_missions(status);

CREATE TABLE IF NOT EXISTS habit_practice_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    mission_id UUID NOT NULL REFERENCES habit_missions(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    audio_path TEXT,
    transcript TEXT,
    duration_seconds INT,
    completed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_habit_practice_sessions_mission_id ON habit_practice_sessions(mission_id);

CREATE TABLE IF NOT EXISTS habit_practice_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES habit_practice_sessions(id) ON DELETE CASCADE,
    hotspot_id UUID NOT NULL REFERENCES hotspots(id) ON DELETE CASCADE,
    matched_sentences INT NOT NULL DEFAULT 0,
    total_sentences INT NOT NULL DEFAULT 0,
    matched_words INT NOT NULL DEFAULT 0,
    total_words INT NOT NULL DEFAULT 0,
    accuracy DECIMAL(5,2) NOT NULL DEFAULT 0,
    fluency_score DECIMAL(5,2),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_habit_practice_results_session_id ON habit_practice_results(session_id);

CREATE TABLE IF NOT EXISTS topic_suggestions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    topic_text TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    admin_note TEXT,
    points_awarded INT,
    scene_id UUID REFERENCES scenes(id) ON DELETE SET NULL,
    reviewed_by UUID REFERENCES users(id) ON DELETE SET NULL,
    reviewed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_topic_suggestions_user_id ON topic_suggestions(user_id);
CREATE INDEX idx_topic_suggestions_status ON topic_suggestions(status);

-- +migrate Down
DROP TABLE IF EXISTS topic_suggestions;
DROP TABLE IF EXISTS habit_practice_results;
DROP TABLE IF EXISTS habit_practice_sessions;
DROP TABLE IF EXISTS habit_missions;
DROP TABLE IF EXISTS habit_activities;
