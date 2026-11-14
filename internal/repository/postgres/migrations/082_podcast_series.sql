-- +migrate Up
-- «مجموعه‌های پادکست» (Podcast Series):
-- هر مجموعه شامل چند قسمت پادکست مرتب‌شده (Episode 1, 2, 3, ...) با موضوع و داستان پیوسته است.
CREATE TABLE IF NOT EXISTS podcast_series (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title          TEXT NOT NULL,
    description_fa TEXT NOT NULL DEFAULT '',
    level          TEXT NOT NULL DEFAULT 'beginner',
    cover_url      TEXT NOT NULL DEFAULT '',
    category       TEXT NOT NULL DEFAULT '',
    position       INT NOT NULL DEFAULT 0,
    is_active      BOOLEAN NOT NULL DEFAULT TRUE,
    created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_podcast_series_active_pos ON podcast_series (is_active, position);

ALTER TABLE podcasts
    ADD COLUMN IF NOT EXISTS series_id  UUID REFERENCES podcast_series(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS episode_no INT NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_podcasts_series_episode ON podcasts (series_id, episode_no);

-- +migrate Down
DROP INDEX IF EXISTS idx_podcasts_series_episode;
ALTER TABLE podcasts
    DROP COLUMN IF EXISTS episode_no,
    DROP COLUMN IF EXISTS series_id;
DROP TABLE IF EXISTS podcast_series;
