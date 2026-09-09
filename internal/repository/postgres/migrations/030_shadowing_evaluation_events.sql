-- +migrate Up
-- مسیر واقعی نمره‌دهی اپ (/v1/shadowing/evaluate) session-less است و صدا را
-- بلافاصله بعد از نمره‌دهی پاک می‌کند، پس نمی‌تواند از جدول shadowing_recordings
-- (که session_id/dialogue_id/audio_path را NOT NULL می‌خواهد) استفاده کند. این
-- جدول سبک، فقط برای اینکه «فعالیت هفتگی» و «تفکیک مهارت‌ها»ی صفحه‌ی خانه از
-- تمرین واقعی صحنه‌ها هم پر شوند، نه فقط از ماموریت‌های عادت زبانی.
CREATE TABLE IF NOT EXISTS shadowing_evaluation_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    -- عمداً بدون REFERENCES: بعضی صحنه‌ها داده‌ی نمونه‌ی محلی‌اند و دیالوگشان
    -- توی جدول dialogues نیست؛ یک FK اینجا insert را برای آن‌ها می‌شکست.
    dialogue_id UUID,
    pronunciation_score DECIMAL(5,2) NOT NULL DEFAULT 0,
    fluency_score DECIMAL(5,2) NOT NULL DEFAULT 0,
    duration_seconds INT NOT NULL CHECK (duration_seconds >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_shadowing_evaluation_events_user_id ON shadowing_evaluation_events(user_id);
CREATE INDEX IF NOT EXISTS idx_shadowing_evaluation_events_created_at ON shadowing_evaluation_events(created_at);

-- +migrate Down
DROP TABLE IF EXISTS shadowing_evaluation_events;
