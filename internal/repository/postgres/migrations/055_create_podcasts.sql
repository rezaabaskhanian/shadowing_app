-- +migrate Up
-- «پادکست»: گفتگوی کوتاه دو مجری درباره‌ی یک موضوع یا یکی از صحنه‌های اپ،
-- با متن هم‌زمان، ترجمه و لغت‌های مهم. متن با AI ساخته می‌شود و صدا در
-- پس‌زمینه با TTS (هر مجری یک صدا) ساخته و به یک mp3 وصل می‌شود — ببینید
-- podcastservice.

CREATE TABLE IF NOT EXISTS podcasts (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title            TEXT NOT NULL,
    description_fa   TEXT NOT NULL DEFAULT '',
    level            TEXT NOT NULL DEFAULT 'beginner'
                     CHECK (level IN ('beginner', 'intermediate', 'advanced')),
    scene_id         UUID REFERENCES scenes(id) ON DELETE SET NULL,
    -- لغت‌های مهم: [{"word": "...", "meaning_fa": "..."}]
    vocabulary       JSONB NOT NULL DEFAULT '[]'::jsonb,
    -- صدای هر مجری: {"Emma": "Kore", "Sam": "Puck"}
    voices           JSONB NOT NULL DEFAULT '{}'::jsonb,
    audio_url        TEXT NOT NULL DEFAULT '',
    audio_status     TEXT NOT NULL DEFAULT 'none'
                     CHECK (audio_status IN ('none', 'generating', 'ready', 'failed')),
    audio_error      TEXT NOT NULL DEFAULT '',
    duration_seconds INT NOT NULL DEFAULT 0,
    position         INT NOT NULL DEFAULT 0,
    is_active        BOOLEAN NOT NULL DEFAULT FALSE,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_podcasts_active_position ON podcasts (is_active, position);

-- جمله‌های پادکست؛ start_ms/end_ms بعد از ساخت صدا پر می‌شوند (برای متن هم‌زمان).
CREATE TABLE IF NOT EXISTS podcast_lines (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    podcast_id     UUID NOT NULL REFERENCES podcasts(id) ON DELETE CASCADE,
    position       INT NOT NULL DEFAULT 0,
    speaker        TEXT NOT NULL,
    text           TEXT NOT NULL,
    translation_fa TEXT NOT NULL DEFAULT '',
    start_ms       INT NOT NULL DEFAULT 0,
    end_ms         INT NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_podcast_lines_podcast ON podcast_lines (podcast_id, position);

-- +migrate Down
DROP TABLE IF EXISTS podcast_lines;
DROP TABLE IF EXISTS podcasts;
