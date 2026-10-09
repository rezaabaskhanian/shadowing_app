-- +migrate Up
-- تصویرِ کارتِ هر مورد در بخش‌های صفحه‌ی خانه (مثل تصویرِ صحنه‌ها). خالی = کارت بدون عکس.
ALTER TABLE speaking_topics ADD COLUMN IF NOT EXISTS image_url TEXT NOT NULL DEFAULT '';
ALTER TABLE writing_prompts ADD COLUMN IF NOT EXISTS image_url TEXT NOT NULL DEFAULT '';
ALTER TABLE podcasts ADD COLUMN IF NOT EXISTS image_url TEXT NOT NULL DEFAULT '';

-- دسته‌بندیِ کلیپ‌ها با همان موضوع‌های صحنه‌ها (daily, travel, ...) تا مثلاً همه‌ی
-- صحنه‌های کافه‌ی فیلم‌های مختلف کنار هم بیایند؛ movie_title نامِ فیلمِ منبع است.
ALTER TABLE video_clips ADD COLUMN IF NOT EXISTS category TEXT NOT NULL DEFAULT '';
ALTER TABLE video_clips ADD COLUMN IF NOT EXISTS movie_title TEXT NOT NULL DEFAULT '';

-- +migrate Down
ALTER TABLE speaking_topics DROP COLUMN IF EXISTS image_url;
ALTER TABLE writing_prompts DROP COLUMN IF EXISTS image_url;
ALTER TABLE podcasts DROP COLUMN IF EXISTS image_url;
ALTER TABLE video_clips DROP COLUMN IF EXISTS category;
ALTER TABLE video_clips DROP COLUMN IF EXISTS movie_title;
