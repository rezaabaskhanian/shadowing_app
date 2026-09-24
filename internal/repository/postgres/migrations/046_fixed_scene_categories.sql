-- +migrate Up
-- دسته‌بندی صحنه‌ها از متن آزاد به لیست ثابت scene.Category می‌رود
-- (internal/domain/learning/scene/category.go): migration, career, education,
-- daily, travel, social. نگاشت زیر با مالک محصول تأیید شده (2026-09-24).

-- استثناها: صحنه‌هایی که با دسته‌ی قبلی‌شان جور نیستند، جداگانه جابه‌جا می‌شوند.
UPDATE scenes SET category = 'education' WHERE title IN ('Meeting at the University', 'University Presentation');
UPDATE scenes SET category = 'social'    WHERE title = 'Music Festival Chat';
UPDATE scenes SET category = 'travel'    WHERE title = 'Countryside Weekend Getaway';
UPDATE scenes SET category = 'daily'     WHERE title = 'Supermarket Shopping';

-- بقیه بر اساس دسته‌ی قبلی. کاراکترهای غیرلاتین حذف می‌شوند چون دسته‌ی
-- «Workplace» در دیتابیس یک اِعراب عربیِ نامرئی (U+064C) در ابتدایش دارد.
UPDATE scenes SET category = CASE lower(trim(regexp_replace(category, '[^A-Za-z& ]', '', 'g')))
    WHEN 'migration'               THEN 'migration'
    WHEN 'workplace'               THEN 'career'
    WHEN 'education'               THEN 'education'
    WHEN 'entertainment & social'  THEN 'social'
    WHEN 'transportation & travel' THEN 'travel'
    WHEN 'travel'                  THEN 'travel'
    -- Cafes & Restaurants, Daily Conversation, Daily Life, Health & Fitness,
    -- Shopping & Stores, Visiting the Doctor و هر مقدار پیش‌بینی‌نشده‌ی دیگر
    ELSE 'daily'
END
WHERE category NOT IN ('migration', 'career', 'education', 'daily', 'travel', 'social')
   OR category IS NULL;

-- از این به بعد خودِ دیتابیس هم فقط همین شش مقدار را می‌پذیرد.
ALTER TABLE scenes ADD CONSTRAINT scenes_category_check
    CHECK (category IN ('migration', 'career', 'education', 'daily', 'travel', 'social'));

-- +migrate Down
-- مقدارهای متن آزاد قبلی قابل بازگردانی نیستند؛ فقط قید برداشته می‌شود.
ALTER TABLE scenes DROP CONSTRAINT IF EXISTS scenes_category_check;
