-- +migrate Up
-- کلیپ‌هایی که از قسمت‌های یک سریال بریده شده‌اند: movie_title نامِ سریال است
-- و season/episode شماره‌ی فصل و قسمت (۰ = فیلمِ سینمایی، نه سریال). اپ با
-- این‌ها تکه‌های یک سریال را به ترتیبِ قسمت نشان می‌دهد.
ALTER TABLE video_clips
    ADD COLUMN IF NOT EXISTS season  INT NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS episode INT NOT NULL DEFAULT 0;

-- +migrate Down
ALTER TABLE video_clips
    DROP COLUMN IF EXISTS episode,
    DROP COLUMN IF EXISTS season;
