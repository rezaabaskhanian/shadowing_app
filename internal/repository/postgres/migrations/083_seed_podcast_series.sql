-- +migrate Up
-- ۳ مجموعه آزمایشی پادکست سریالی (A2, B1, B2) به همراه قسمت‌ها و دیالوگ‌ها

INSERT INTO podcast_series (id, title, description_fa, level, cover_url, category, position, is_active)
VALUES
('a1111111-1111-1111-1111-111111111111', 'Everyday Life in the City', 'داستان‌های کوتاه و کاربردی از زندگی روزمره در شهر، سفارش قهوه در کافه و پیدا کردن مسیر قطار', 'beginner', '', 'lifestyle', 1, TRUE),
('b2222222-2222-2222-2222-222222222222', 'The Journey Abroad', 'سفر به یک کشور جدید، مکالمات فرودگاه، تحویل بار و اقامت در هتل', 'intermediate', '', 'travel', 2, TRUE),
('c3333333-3333-3333-3333-333333333333', 'My First Week at Work', 'روایت ورود به محیط کار بین‌المللی، آشنایی با اعضای تیم و شرکت در جلسات کاری', 'advanced', '', 'career', 3, TRUE)
ON CONFLICT (id) DO NOTHING;

-- قسمت‌های مجموعه ۱: Everyday Life in the City (A2)
INSERT INTO podcasts (id, title, description_fa, level, kind, series_id, episode_no, audio_status, is_active, duration_seconds, position, vocabulary)
VALUES
('a1111111-1111-1111-1111-000000000001', 'Morning Coffee Routine', 'نحوه سفارش قهوه دلخواه و گپ کوتاه صبحگاهی با باریستا', 'beginner', 'lesson', 'a1111111-1111-1111-1111-111111111111', 1, 'ready', TRUE, 240, 1, '[{"word":"routine","meaning_fa":"برنامه روزمره"},{"word":"order","meaning_fa":"سفارش دادن"},{"word":"roast","meaning_fa":"برشته کاری قهوه"}]'::jsonb),
('a1111111-1111-1111-1111-000000000002', 'Finding the Right Train', 'پرسیدن مسیر در ایستگاه قطار، خرید بلیط و پیدا کردن سکوی حرکت', 'beginner', 'lesson', 'a1111111-1111-1111-1111-111111111111', 2, 'ready', TRUE, 270, 2, '[{"word":"platform","meaning_fa":"سکو"},{"word":"commute","meaning_fa":"رفت و آمد روزانه"},{"word":"transfer","meaning_fa":"تعویض خط قطار"}]'::jsonb),
('a1111111-1111-1111-1111-000000000003', 'Shopping at the Local Market', 'خرید خوراکی‌های تازه، پرسیدن قیمت و پرداخت حساب در بازار محلی', 'beginner', 'lesson', 'a1111111-1111-1111-1111-111111111111', 3, 'ready', TRUE, 300, 3, '[{"word":"fresh","meaning_fa":"تازه"},{"word":"discount","meaning_fa":"تخفیف"},{"word":"receipt","meaning_fa":"رسید خرید"}]'::jsonb)
ON CONFLICT (id) DO NOTHING;

-- قسمت‌های مجموعه ۲: The Journey Abroad (B1)
INSERT INTO podcasts (id, title, description_fa, level, kind, series_id, episode_no, audio_status, is_active, duration_seconds, position, vocabulary)
VALUES
('b2222222-2222-2222-2222-000000000001', 'Preparing for the Journey', 'بستن چمدان، بررسی مدارک و برنامه‌ریزی برای پرواز', 'intermediate', 'featured', 'b2222222-2222-2222-2222-222222222222', 1, 'ready', TRUE, 300, 1, '[{"word":"itinerary","meaning_fa":"برنامه سفر"},{"word":"luggage","meaning_fa":"چمدان و بار سفر"},{"word":"validity","meaning_fa":"اعتبار مدرک"}]'::jsonb),
('b2222222-2222-2222-2222-000000000002', 'At the Airport & Boarding', 'تحویل چمدان، عبور از گیت بازرسی و سوار شدن به هواپیما', 'intermediate', 'featured', 'b2222222-2222-2222-2222-222222222222', 2, 'ready', TRUE, 300, 2, '[{"word":"boarding pass","meaning_fa":"کارت پرواز"},{"word":"security checkpoint","meaning_fa":"گیت بازرسی"},{"word":"gate","meaning_fa":"دروازه خروجی پرواز"}]'::jsonb),
('b2222222-2222-2222-2222-000000000003', 'Checking into the Hotel', 'رسیدن به مقصد، تحویل گرفتن اتاق و پرسیدن خدمات هتل', 'intermediate', 'featured', 'b2222222-2222-2222-2222-222222222222', 3, 'ready', TRUE, 320, 3, '[{"word":"reservation","meaning_fa":"رزرو قبلی"},{"word":"amenities","meaning_fa":"امکانات رفاهی"},{"word":"reception","meaning_fa":"پذیرش هتل"}]'::jsonb)
ON CONFLICT (id) DO NOTHING;

-- قسمت‌های مجموعه ۳: My First Week at Work (B2)
INSERT INTO podcasts (id, title, description_fa, level, kind, series_id, episode_no, audio_status, is_active, duration_seconds, position, vocabulary)
VALUES
('c3333333-3333-3333-3333-000000000001', 'The First Day at the Office', 'ورود به شرکت، معارفه اولیه و آشنایی با فرهنگ کاری سازمان', 'advanced', 'lesson', 'c3333333-3333-3333-3333-333333333333', 1, 'ready', TRUE, 330, 1, '[{"word":"onboarding","meaning_fa":"فرایند آشناسازی نیروی جدید"},{"word":"orientation","meaning_fa":"جلسه توجیهی"},{"word":"workplace culture","meaning_fa":"فرهنگ محیط کار"}]'::jsonb),
('c3333333-3333-3333-3333-000000000002', 'Meeting the Team & Collaboration', 'گفتگو با همکاران درباره پروژه‌های مشترک و هماهنگی وظایف', 'advanced', 'lesson', 'c3333333-3333-3333-3333-333333333333', 2, 'ready', TRUE, 340, 2, '[{"word":"cross-functional","meaning_fa":"چندوظیفه‌ای و بین‌تیمی"},{"word":"milestone","meaning_fa":"فاز کلیدی پروژه"},{"word":"alignment","meaning_fa":"هم‌راستایی اهداف"}]'::jsonb),
('c3333333-3333-3333-3333-000000000003', 'A Challenging Project Meeting', 'ارائه دیدگاه‌ها در یک جلسه کاری چالشی و مدیریت بازخوردها', 'advanced', 'lesson', 'c3333333-3333-3333-3333-333333333333', 3, 'ready', TRUE, 360, 3, '[{"word":"constructive feedback","meaning_fa":"بازخورد سازنده"},{"word":"deliverable","meaning_fa":"خروجی قابل تحویل"},{"word":"action items","meaning_fa":"اقدامات لازم بعدی"}]'::jsonb)
ON CONFLICT (id) DO NOTHING;

-- جمله‌های نمونه قسمت ۱ از مجموعه ۲ (The Journey Abroad - Preparing)
INSERT INTO podcast_lines (podcast_id, position, speaker, text, translation_fa, start_ms, end_ms)
VALUES
('b2222222-2222-2222-2222-000000000001', 0, 'Alex', 'Welcome back everyone. Today we are diving into our new mini-series: The Journey Abroad.', 'به برنامه خوش آمدید همگی. امروز وارد مینی‌سریال جدیدمان می‌شویم: سفر به خارج.', 0, 6000),
('b2222222-2222-2222-2222-000000000001', 1, 'Sarah', 'I am super excited! Preparing for a big trip can feel overwhelming if you do not plan ahead.', 'خیلی هیجان‌زده‌ام! اگر از قبل برنامه‌ریزی نکنید، آماده شدن برای یک سفر بزرگ ممکن است کلافه‌کننده باشد.', 6200, 13000),
('b2222222-2222-2222-2222-000000000001', 2, 'Alex', 'Exactly. The golden rule is always packing light and double-checking your passport validity.', 'دقیقاً. قانون طلایی همیشه سبک سفر کردن و دوبار چک کردن اعتبار پاسپورت است.', 13200, 20500),
('b2222222-2222-2222-2222-000000000001', 3, 'Sarah', 'And don not forget to keep a digital copy of your itinerary accessible on your phone offline.', 'و فراموش نکنید که یک نسخه دیجیتال از برنامه سفرتان را به صورت آفلاین در گوشی نگه دارید.', 20800, 28000),
('b2222222-2222-2222-2222-000000000001', 4, 'Alex', 'Great tip. In our next episode, we will follow the traveler right into the bustling airport terminal!', 'نکته عالی بود. در قسمت بعد همراه مسافر مستقیم وارد ترمینال شلوغ فرودگاه می‌شویم!', 28300, 36000)
ON CONFLICT DO NOTHING;

-- +migrate Down
DELETE FROM podcast_lines WHERE podcast_id IN (
    'a1111111-1111-1111-1111-000000000001', 'a1111111-1111-1111-1111-000000000002', 'a1111111-1111-1111-1111-000000000003',
    'b2222222-2222-2222-2222-000000000001', 'b2222222-2222-2222-2222-000000000002', 'b2222222-2222-2222-2222-000000000003',
    'c3333333-3333-3333-3333-000000000001', 'c3333333-3333-3333-3333-000000000002', 'c3333333-3333-3333-3333-000000000003'
);
DELETE FROM podcasts WHERE series_id IN (
    'a1111111-1111-1111-1111-111111111111',
    'b2222222-2222-2222-2222-222222222222',
    'c3333333-3333-3333-3333-333333333333'
);
DELETE FROM podcast_series WHERE id IN (
    'a1111111-1111-1111-1111-111111111111',
    'b2222222-2222-2222-2222-222222222222',
    'c3333333-3333-3333-3333-333333333333'
);

