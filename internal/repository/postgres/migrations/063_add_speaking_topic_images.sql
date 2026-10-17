-- +migrate Up
-- «داستان تصویری»: موضوعی که چند عکس دارد = کاربر از روی عکس‌ها (به ترتیب)
-- داستان تعریف می‌کند. [{"url": "...", "caption": "..."}] — caption توضیحِ
-- کوتاهِ ادمین از هر عکس است که AI برای بررسی (پوشش همه‌ی عکس‌ها) استفاده
-- می‌کند؛ خودِ عکس به AI فرستاده نمی‌شود.
ALTER TABLE speaking_topics ADD COLUMN IF NOT EXISTS images JSONB NOT NULL DEFAULT '[]'::jsonb;

-- +migrate Down
ALTER TABLE speaking_topics DROP COLUMN IF EXISTS images;
