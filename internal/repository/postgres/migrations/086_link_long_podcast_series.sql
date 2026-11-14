-- 086_link_long_podcast_series.sql
-- لینک کردن پادکست‌های کامل و بلند (هر قسمت بالای ۵ دقیقه و هر مجموعه بالای ۱۵ دقیقه) با صوت‌های واقعی

-- بروزرسانی عنوان و مشخصات ۳ مجموعه سریالی
UPDATE podcast_series
SET title = 'The Third Pier (پایه سوم)',
    description_fa = 'روایت جذاب مهندسی پل بزرگ، مواجهه با خطای سازه‌ای، تصمیم‌گیری‌های اخلاقی و فنی و روز افتتاح پل',
    level = 'proficient',
    category = 'engineering'
WHERE id = 'a1111111-1111-1111-1111-111111111111';

UPDATE podcast_series
SET title = 'Letters in the Wall (نامه‌های درون دیوار)',
    description_fa = 'داستان پرکشش و احساسی از پیدا شدن نامه‌های قدیمی درون دیوار، جستجو در کتاب‌فروشی و درِ آبی',
    level = 'advanced',
    category = 'mystery'
WHERE id = 'b2222222-2222-2222-2222-222222222222';

UPDATE podcast_series
SET title = 'The Last Manuscript (آخرین دست‌نوشته)',
    description_fa = 'روایتی پر از تعلیق از پیدا شدن یک نسخه خطی ارزشمند، آزمون وفاداری و جستجوی حقیقت',
    level = 'advanced',
    category = 'story'
WHERE id = 'c3333333-3333-3333-3333-333333333333';

-- جدا کردن پادکست‌های موقت قبلی
UPDATE podcasts
SET series_id = NULL, episode_no = 0, is_active = FALSE
WHERE id IN (
    'a1111111-1111-1111-1111-000000000001',
    'a1111111-1111-1111-1111-000000000002',
    'a1111111-1111-1111-1111-000000000003',
    'b2222222-2222-2222-2222-000000000001',
    'b2222222-2222-2222-2222-000000000002',
    'b2222222-2222-2222-2222-000000000003',
    'c3333333-3333-3333-3333-000000000001',
    'c3333333-3333-3333-3333-000000000002',
    'c3333333-3333-3333-3333-000000000003'
);

-- مجموعه ۱: پایه سوم (۳۷۵ + ۳۵۸ + ۳۹۴ = ۱۱۲۷ ثانیه / ۱۸.۸ دقیقه)
UPDATE podcasts
SET series_id = 'a1111111-1111-1111-1111-111111111111', episode_no = 1, is_active = TRUE
WHERE id = 'fa815cc0-7850-4ef7-88bf-499ac97b0fcb';

UPDATE podcasts
SET series_id = 'a1111111-1111-1111-1111-111111111111', episode_no = 2, is_active = TRUE
WHERE id = 'dc61bc8a-0a62-450d-8e61-6a1be6d20ca1';

UPDATE podcasts
SET series_id = 'a1111111-1111-1111-1111-111111111111', episode_no = 3, is_active = TRUE
WHERE id = 'e9b080e3-2d2e-466e-97c7-9fd46a65f350';

-- مجموعه ۲: نامه‌های درون دیوار (۳۴۲ + ۳۴۷ + ۳۸۰ = ۱۰۶۹ ثانیه / ۱۷.۸ دقیقه)
UPDATE podcasts
SET series_id = 'b2222222-2222-2222-2222-222222222222', episode_no = 1, is_active = TRUE
WHERE id = '96f988a5-eb95-4cc5-a6f3-ea9bfedee026';

UPDATE podcasts
SET series_id = 'b2222222-2222-2222-2222-222222222222', episode_no = 2, is_active = TRUE
WHERE id = 'ac929094-c3d4-4a09-96ff-79f6fcbab39a';

UPDATE podcasts
SET series_id = 'b2222222-2222-2222-2222-222222222222', episode_no = 3, is_active = TRUE
WHERE id = '54115c4b-9603-4ec9-a3c7-d179477a4eed';

-- مجموعه ۳: آخرین دست‌نوشته (۳۱۱ + ۳۰۷ + ۲۹۴ = ۹۱۲ ثانیه / ۱۵.۲ دقیقه)
UPDATE podcasts
SET series_id = 'c3333333-3333-3333-3333-333333333333', episode_no = 1, is_active = TRUE
WHERE id = '955c9919-ef4b-46a8-89e1-d239045a1897';

UPDATE podcasts
SET series_id = 'c3333333-3333-3333-3333-333333333333', episode_no = 2, is_active = TRUE
WHERE id = 'b4509e58-0407-4841-84ed-02ccc1d5ca27';

UPDATE podcasts
SET series_id = 'c3333333-3333-3333-3333-333333333333', episode_no = 3, is_active = TRUE
WHERE id = '91b83f34-fd79-420e-92ff-8c7762beaaf9';

