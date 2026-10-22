-- +migrate Up
-- «داستان» (بخش خواندن): هر فصل یک ردیف podcasts با kind = 'story' است — همان
-- جمله‌های زمان‌دار، صدای TTS، عکس‌ها (images.from_line) و لغت‌ها، ولی در اپ
-- متن‌محور خوانده می‌شود (خواندن همراه با شنیدن). فصل‌های یک داستان با
-- series_title یکسان و chapter_no به هم وصل‌اند؛ questions سؤال‌های فهم آخر فصل:
-- [{"q": "...", "q_fa": "...", "options": ["...", "..."], "answer": 0}]
ALTER TABLE podcasts DROP CONSTRAINT IF EXISTS podcasts_kind_check;
ALTER TABLE podcasts ADD CONSTRAINT podcasts_kind_check CHECK (kind IN ('lesson', 'featured', 'story'));

ALTER TABLE podcasts
    ADD COLUMN IF NOT EXISTS series_title TEXT  NOT NULL DEFAULT '',
    ADD COLUMN IF NOT EXISTS chapter_no   INT   NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS questions    JSONB NOT NULL DEFAULT '[]'::jsonb;

-- +migrate Down
DELETE FROM podcasts WHERE kind = 'story';
ALTER TABLE podcasts DROP CONSTRAINT IF EXISTS podcasts_kind_check;
ALTER TABLE podcasts ADD CONSTRAINT podcasts_kind_check CHECK (kind IN ('lesson', 'featured'));
ALTER TABLE podcasts
    DROP COLUMN IF EXISTS questions,
    DROP COLUMN IF EXISTS chapter_no,
    DROP COLUMN IF EXISTS series_title;
