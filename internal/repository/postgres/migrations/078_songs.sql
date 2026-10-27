-- +migrate Up
-- «آهنگ»: مثل داستان، متن هم‌زمان با صدا خوانده می‌شود، ولی صدا یک آهنگ آماده است
-- (آپلودِ ادمین، نه TTS) و زمان هر خط را ادمین در پنل با «ضربه زدن هم‌زمان با آهنگ»
-- می‌گذارد. instrumental_url نسخه‌ی بی‌کلامِ همان آهنگ برای «با آهنگ بخوان» است.
-- license_note یادداشت اختیاری منبع آهنگ (فقط ادمین).
-- lines: [{"text": "...", "translation_fa": "...", "start_ms": 0, "end_ms": 0}]
CREATE TABLE IF NOT EXISTS songs (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title            TEXT NOT NULL,
    artist           TEXT NOT NULL DEFAULT '',
    description_fa   TEXT NOT NULL DEFAULT '',
    level            TEXT NOT NULL DEFAULT 'beginner'
                     CHECK (level IN ('starter', 'beginner', 'intermediate', 'advanced', 'proficient')),
    cover_url        TEXT NOT NULL DEFAULT '',
    audio_url        TEXT NOT NULL DEFAULT '',
    instrumental_url TEXT NOT NULL DEFAULT '',
    duration_seconds INT  NOT NULL DEFAULT 0,
    lines            JSONB NOT NULL DEFAULT '[]'::jsonb,
    vocabulary       JSONB NOT NULL DEFAULT '[]'::jsonb,
    license_note     TEXT NOT NULL DEFAULT '',
    position         INT  NOT NULL DEFAULT 0,
    is_active        BOOLEAN NOT NULL DEFAULT FALSE,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_songs_active ON songs (is_active, position);

-- +migrate Down
DROP TABLE IF EXISTS songs;
