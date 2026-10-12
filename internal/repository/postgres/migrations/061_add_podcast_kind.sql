-- +migrate Up
-- نوعِ پادکست: «lesson» (درسی — درباره‌ی صحنه/موضوعِ درس‌ها) یا «featured»
-- (منتخب — موضوعِ آزاد و جذاب مثل داستان، فرهنگ، نکته‌های جالب، بدون ربط به
-- درس‌ها). در اپ دو بخشِ جدا دارند.
ALTER TABLE podcasts
    ADD COLUMN IF NOT EXISTS kind TEXT NOT NULL DEFAULT 'lesson'
    CHECK (kind IN ('lesson', 'featured'));

-- +migrate Down
ALTER TABLE podcasts DROP COLUMN IF EXISTS kind;
