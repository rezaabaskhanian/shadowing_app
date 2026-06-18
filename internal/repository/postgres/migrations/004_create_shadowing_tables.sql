-- +migrate Up

-- ============================================
-- جدول جلسات تمرین شادوئینگ
-- ============================================
CREATE TABLE IF NOT EXISTS shadowing_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    scene_id UUID NOT NULL REFERENCES scenes(id) ON DELETE CASCADE,
    dialogue_id UUID NOT NULL REFERENCES dialogues(id) ON DELETE CASCADE,
    status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed')),
    current_step INT NOT NULL DEFAULT 1 CHECK (current_step BETWEEN 1 AND 4),
    total_steps INT NOT NULL DEFAULT 4,
    started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    completed_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================
-- جدول مراحل تمرین
-- ============================================
CREATE TABLE IF NOT EXISTS shadowing_steps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES shadowing_sessions(id) ON DELETE CASCADE,
    dialogue_id UUID NOT NULL REFERENCES dialogues(id) ON DELETE CASCADE,
    step_type INT NOT NULL CHECK (step_type BETWEEN 1 AND 4),
    status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed')),
    display_text TEXT NOT NULL,
    translation TEXT,
    audio_url TEXT NOT NULL,
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(session_id, step_type)
);

-- ============================================
-- جدول ضبط‌های کاربر
-- ============================================
CREATE TABLE IF NOT EXISTS shadowing_recordings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    session_id UUID NOT NULL REFERENCES shadowing_sessions(id) ON DELETE CASCADE,
    dialogue_id UUID NOT NULL REFERENCES dialogues(id) ON DELETE CASCADE,
    step_type INT NOT NULL CHECK (step_type BETWEEN 1 AND 4),
    recording_type VARCHAR(20) NOT NULL CHECK (recording_type IN ('shadow', 'record')),
    audio_path TEXT NOT NULL,
    duration INT NOT NULL CHECK (duration > 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================
-- ایندکس‌ها برای بهبود عملکرد
-- ============================================
CREATE INDEX idx_shadowing_sessions_user_id ON shadowing_sessions(user_id);
CREATE INDEX idx_shadowing_sessions_dialogue_id ON shadowing_sessions(dialogue_id);
CREATE INDEX idx_shadowing_sessions_status ON shadowing_sessions(status);
CREATE INDEX idx_shadowing_steps_session_id ON shadowing_steps(session_id);
CREATE INDEX idx_shadowing_steps_status ON shadowing_steps(status);
CREATE INDEX idx_shadowing_recordings_user_id ON shadowing_recordings(user_id);
CREATE INDEX idx_shadowing_recordings_session_id ON shadowing_recordings(session_id);

-- ============================================
-- تریگر به‌روزرسانی updated_at
-- ============================================
CREATE TRIGGER update_shadowing_sessions_updated_at 
    BEFORE UPDATE ON shadowing_sessions 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_shadowing_steps_updated_at 
    BEFORE UPDATE ON shadowing_steps 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- +migrate Down
DROP TABLE IF EXISTS shadowing_recordings;
DROP TABLE IF EXISTS shadowing_steps;
DROP TABLE IF EXISTS shadowing_sessions;