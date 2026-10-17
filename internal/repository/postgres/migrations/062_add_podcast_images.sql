-- +migrate Up
-- چند عکس برای هر پادکست که هنگام پخش، آرام (محو شدن + بزرگ‌نماییِ آرام)
-- جای هم را می‌گیرند: [{"url": "...", "from_line": 3}] — from_line شماره‌ی
-- جمله‌ای (از ۱) است که عکس از آن به بعد دیده می‌شود؛ ۰ = خودکار (پخش یکنواخت).
ALTER TABLE podcasts ADD COLUMN IF NOT EXISTS images JSONB NOT NULL DEFAULT '[]'::jsonb;

-- +migrate Down
ALTER TABLE podcasts DROP COLUMN IF EXISTS images;
