-- +migrate Up
-- مجموعه دوره‌های رسمی «۴۰۰۰ واژه ضروری زبان انگلیسی» (4000 Essential English Words):
-- ۶ کتاب استاندارد در ۶ سطح گفتاری به همراه قسمت‌های آزمایشی، دیالوگ‌های شادوئینگ و پادکست‌های متصل.

INSERT INTO podcast_series (id, title, description_fa, level, cover_url, category, position, is_active)
VALUES
('40000000-0001-0000-0000-000000000001', '4000 Essential Words — Book 1', '۴۰۰۰ واژه پرکاربرد (کتاب اول): یادگیری پایه مکالمه و واژگان اساسی روزمره در قالب داستان و تمرین شادوئینگ', 'beginner', '', 'essential_words', 1, TRUE),
('40000000-0002-0000-0000-000000000002', '4000 Essential Words — Book 2', '۴۰۰۰ واژه پرکاربرد (کتاب دوم): توسعه دایره لغات عمومی و مکالمات کاربردی در سفر و اجتماع', 'intermediate', '', 'essential_words', 2, TRUE),
('40000000-0003-0000-0000-000000000003', '4000 Essential Words — Book 3', '۴۰۰۰ واژه پرکاربرد (کتاب سوم): واژگان کاربردی در محیط‌های کاری، روابط اجتماعی و توصیف تجربیات', 'intermediate', '', 'essential_words', 3, TRUE),
('40000000-0004-0000-0000-000000000004', '4000 Essential Words — Book 4', '۴۰۰۰ واژه پرکاربرد (کتاب چهارم): لغات نیمه‌تخصصی، تحلیل رویدادها، استدلال و مهارت‌های شغلی', 'advanced', '', 'essential_words', 4, TRUE),
('40000000-0005-0000-0000-000000000005', '4000 Essential Words — Book 5', '۴۰۰۰ واژه پرکاربرد (کتاب پنجم): واژگان آکادمیک و پیشرفته، درک متون پیچیده و تفکر نقادانه', 'advanced', '', 'essential_words', 5, TRUE),
('40000000-0006-0000-0000-000000000006', '4000 Essential Words — Book 6', '۴۰۰۰ واژه پرکاربرد (کتاب ششم): تسلط کامل زبان انگلیسی، لغات پیشرفته ادبی، اصطلاحات انتزاعی و بحث‌های تخصصی', 'proficient', '', 'essential_words', 6, TRUE)
ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, description_fa = EXCLUDED.description_fa;

--------------------------------------------------------------------------------
-- درس ۱ از کتاب اول: The Laboratory Experiment (یونیت ۱)
--------------------------------------------------------------------------------
-- ۱. ساخت صحنه شادوئینگ
INSERT INTO scenes (id, title, description, background_image_url, difficulty, status, "order", category, is_custom)
VALUES (
    '40001001-0000-0000-0000-000000000001',
    'The Laboratory Experiment (Unit 1)',
    'تمرین شادوئینگ واژگان ضروری یونیت اول کتاب ۴۰۰۰ واژه: afraid, agree, angry, arrive, clever, cruel, finally, hide, hunt, safe...',
    '',
    'beginner',
    'published',
    101,
    'education',
    false
) ON CONFLICT (id) DO NOTHING;

-- هات‌اسپات صحنه ۱
INSERT INTO hotspots (id, scene_id, name, x_position, y_position, order_index)
VALUES (
    '40001001-0000-0000-0000-000000000002',
    '40001001-0000-0000-0000-000000000001',
    'Dialogue',
    50.0,
    50.0,
    1
) ON CONFLICT (id) DO NOTHING;

-- خطوط دیالوگ صحنه ۱
INSERT INTO dialogues (id, hotspot_id, "order", speaker, original_text, translation, audio_url, display_type)
VALUES
('40001001-0000-0000-0001-000000000001', '40001001-0000-0000-0000-000000000002', 1, 'customer', 'Mia is a clever student who loves working in the laboratory.', 'میا دانش‌آموز باهوشی است که عاشق کار کردن در آزمایشگاه است.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full'),
('40001001-0000-0000-0001-000000000002', '40001001-0000-0000-0000-000000000002', 2, 'clerk', 'One afternoon, she arrived early to begin a special experiment.', 'یک روز بعدازظهر، او زود رسید تا یک آزمایش ویژه را شروع کند.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full'),
('40001001-0000-0000-0001-000000000003', '40001001-0000-0000-0000-000000000002', 3, 'customer', 'She was afraid that something might go wrong with the chemicals.', 'او نگران و خائف بود که مبادا با مواد شیمیایی اتفاقی بیفتد.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full'),
('40001001-0000-0000-0001-000000000004', '40001001-0000-0000-0000-000000000002', 4, 'clerk', 'Her teacher agreed to supervise and help her stay safe.', 'استادش موافقت کرد که نظارت کند و به او کمک کند در امنیت بماند.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full'),
('40001001-0000-0000-0001-000000000005', '40001001-0000-0000-0000-000000000002', 5, 'customer', 'Finally, the solution turned bright blue and the test was a success!', 'در نهایت، محلول به رنگ آبی روشن درآمد و آزمایش با موفقیت به پایان رسید!', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full')
ON CONFLICT (id) DO NOTHING;

-- ۲. ساخت پادکست متصل به درس ۱
INSERT INTO podcasts (id, title, description_fa, level, kind, series_id, episode_no, audio_url, audio_status, is_active, duration_seconds, position, vocabulary, scene_id)
VALUES (
    '40001001-0000-0000-0000-000000000003',
    'The Laboratory Experiment (Unit 1)',
    'روایت جذاب داستان آزمایشگاه به همراه مرور واژگان کلیدی یونیت ۱ کتاب ۴۰۰۰ واژه ضروری',
    'beginner',
    'lesson',
    '40000000-0001-0000-0000-000000000001',
    1,
    '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3',
    'ready',
    TRUE,
    310,
    1,
    '[{"word":"clever","meaning_fa":"باهوش و زیرک"},{"word":"arrive","meaning_fa":"رسیدن به مقصد"},{"word":"afraid","meaning_fa":"ترسیده و نگران"},{"word":"agree","meaning_fa":"موافقت کردن"},{"word":"safe","meaning_fa":"امن و بی‌خطر"},{"word":"finally","meaning_fa":"سرانجام و در نهایت"}]'::jsonb,
    '40001001-0000-0000-0000-000000000001'
) ON CONFLICT (id) DO UPDATE SET scene_id = EXCLUDED.scene_id, vocabulary = EXCLUDED.vocabulary;

-- خطوط پادکست درس ۱
INSERT INTO podcast_lines (podcast_id, position, speaker, text, translation_fa, start_ms, end_ms)
VALUES
('40001001-0000-0000-0000-000000000003', 0, 'Alex', 'Welcome to 4000 Essential English Words, Unit 1: The Laboratory Experiment.', 'به یونیت اول دوره ۴۰۰۰ واژه ضروری خوش آمدید: آزمایش آزمایشگاه.', 0, 6000),
('40001001-0000-0000-0000-000000000003', 1, 'Sarah', 'Today we follow Mia, a clever student passionate about science and chemistry.', 'امروز داستان میا را دنبال می‌کنیم، دانش‌آموز باهوشی که به علوم و شیمی علاقه زیادی دارد.', 6200, 13500),
('40001001-0000-0000-0000-000000000003', 2, 'Alex', 'When she arrived at the lab, she felt a bit afraid, but her teacher promised to keep everything safe.', 'وقتی او به آزمایشگاه رسید کمی احساس نگرانی می‌کرد، اما استادش قول داد همه چیز در امنیت باشد.', 13800, 22000),
('40001001-0000-0000-0000-000000000003', 3, 'Sarah', 'Her patience paid off, and finally her experiment turned into a wonderful success!', 'صبر او به نتیجه نشست و در نهایت آزمایش او به یک موفقیت فوق‌العاده تبدیل شد!', 22300, 30500),
('40001001-0000-0000-0000-000000000003', 4, 'Alex', 'Now let us practice shadowing these sentences to master both vocabulary and pronunciation.', 'حالا بیایید این جملات را به صورت شادوئینگ تمرین کنیم تا هم لغات و هم تلفظتان را تقویت کنید.', 30800, 38000)
ON CONFLICT DO NOTHING;

--------------------------------------------------------------------------------
-- درس ۲ از کتاب اول: The Dog's Bell (یونیت ۲)
--------------------------------------------------------------------------------
-- ۱. ساخت صحنه شادوئینگ
INSERT INTO scenes (id, title, description, background_image_url, difficulty, status, "order", category, is_custom)
VALUES (
    '40001002-0000-0000-0000-000000000001',
    'The Dog’s Bell (Unit 2)',
    'تمرین شادوئینگ واژگان ضروری یونیت دوم کتاب ۴۰۰۰ واژه: appropriate, avoid, behave, calm, concern, content, habit, patient...',
    '',
    'beginner',
    'published',
    102,
    'education',
    false
) ON CONFLICT (id) DO NOTHING;

INSERT INTO hotspots (id, scene_id, name, x_position, y_position, order_index)
VALUES (
    '40001002-0000-0000-0000-000000000002',
    '40001002-0000-0000-0000-000000000001',
    'Dialogue',
    50.0,
    50.0,
    1
) ON CONFLICT (id) DO NOTHING;

INSERT INTO dialogues (id, hotspot_id, "order", speaker, original_text, translation, audio_url, display_type)
VALUES
('40001002-0000-0000-0001-000000000001', '40001002-0000-0000-0000-000000000002', 1, 'customer', 'John had a dog that did not behave well around guests.', 'جان سگی داشت که در حضور مهمان‌ها رفتار مناسبی نداشت.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full'),
('40001002-0000-0000-0001-000000000002', '40001002-0000-0000-0000-000000000002', 2, 'clerk', 'The dog had a bad habit of biting people who strolled by.', 'سگ عادت بدی داشت که به افرادی که در حال قدم زدن بودند گاز می‌گرفت.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full'),
('40001002-0000-0000-0001-000000000003', '40001002-0000-0000-0000-000000000002', 3, 'customer', 'This was a serious concern for everyone living in the village.', 'این یک نگرانی جدی برای تمام اهالی روستا بود.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full'),
('40001002-0000-0000-0001-000000000004', '40001002-0000-0000-0000-000000000002', 4, 'clerk', 'John decided to put a bell on the dog so people could avoid him.', 'جان تصمیم گرفت زنگی به گردن سگ ببندد تا مردم بتوانند از او دوری کنند.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full'),
('40001002-0000-0000-0001-000000000005', '40001002-0000-0000-0000-000000000002', 5, 'customer', 'Staying patient and calm helped John solve the issue effectively.', 'صبور و آرام ماندن به جان کمک کرد این مسئله را به شکلی موثر حل کند.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full')
ON CONFLICT (id) DO NOTHING;

-- ۲. ساخت پادکست متصل به درس ۲
INSERT INTO podcasts (id, title, description_fa, level, kind, series_id, episode_no, audio_url, audio_status, is_active, duration_seconds, position, vocabulary, scene_id)
VALUES (
    '40001002-0000-0000-0000-000000000003',
    'The Dog’s Bell (Unit 2)',
    'داستان آموزنده زنگوله سگ و یادگیری واژگان کاربردی یونیت ۲ کتاب ۴۰۰۰ واژه',
    'beginner',
    'lesson',
    '40000000-0001-0000-0000-000000000001',
    2,
    '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3',
    'ready',
    TRUE,
    290,
    2,
    '[{"word":"behave","meaning_fa":"رفتار کردن"},{"word":"habit","meaning_fa":"عادت روزمره"},{"word":"concern","meaning_fa":"نگرانی و دلواپسی"},{"word":"avoid","meaning_fa":"اجتناب کردن و دوری گزیدن"},{"word":"patient","meaning_fa":"صبور و شکیبا"},{"word":"issue","meaning_fa":"مسئله یا مشکل"}]'::jsonb,
    '40001002-0000-0000-0000-000000000001'
) ON CONFLICT (id) DO UPDATE SET scene_id = EXCLUDED.scene_id, vocabulary = EXCLUDED.vocabulary;

INSERT INTO podcast_lines (podcast_id, position, speaker, text, translation_fa, start_ms, end_ms)
VALUES
('40001002-0000-0000-0000-000000000003', 0, 'Alex', 'Welcome back to Unit 2: The Dog’s Bell.', 'به یونیت دوم خوش آمدید: زنگوله سگ.', 0, 5000),
('40001002-0000-0000-0000-000000000003', 1, 'Sarah', 'Today we explore how bad habits can cause serious concern in a community.', 'امروز بررسی می‌کنیم که چگونه عادت‌های بد می‌توانند نگرانی‌های جدی ایجاد کنند.', 5300, 12500),
('40001002-0000-0000-0000-000000000003', 2, 'Alex', 'John put a bell on his dog so neighbors could hear it and avoid danger.', 'جان زنگوله‌ای به سگش وصل کرد تا همسایه‌ها با شنیدن آن از خطر دوری کنند.', 12800, 20500),
('40001002-0000-0000-0000-000000000003', 3, 'Sarah', 'Remember, remaining calm and patient is key to solving difficult problems.', 'به یاد داشته باشید، صبور و آرام ماندن کلید حل مشکلات دشوار است.', 20800, 28000)
ON CONFLICT DO NOTHING;

--------------------------------------------------------------------------------
-- درس ۳ از کتاب اول: The Lion and the Rabbit (یونیت ۳)
--------------------------------------------------------------------------------
-- ۱. ساخت صحنه شادوئینگ
INSERT INTO scenes (id, title, description, background_image_url, difficulty, status, "order", category, is_custom)
VALUES (
    '40001003-0000-0000-0000-000000000001',
    'The Lion and the Rabbit (Unit 3)',
    'تمرین شادوئینگ واژگان ضروری یونیت سوم کتاب ۴۰۰۰ واژه: believe, capture, clear, condition, familiar, protect, solve, truth...',
    '',
    'beginner',
    'published',
    103,
    'education',
    false
) ON CONFLICT (id) DO NOTHING;

INSERT INTO hotspots (id, scene_id, name, x_position, y_position, order_index)
VALUES (
    '40001003-0000-0000-0000-000000000002',
    '40001003-0000-0000-0000-000000000001',
    'Dialogue',
    50.0,
    50.0,
    1
) ON CONFLICT (id) DO NOTHING;

INSERT INTO dialogues (id, hotspot_id, "order", speaker, original_text, translation, audio_url, display_type)
VALUES
('40001003-0000-0000-0001-000000000001', '40001003-0000-0000-0000-000000000002', 1, 'customer', 'A cruel lion lived in the forest and attacked animals every day.', 'شیر بی‌رحمی در جنگل زندگی می‌کرد و هر روز به حیوانات حمله می‌برد.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full'),
('40001003-0000-0000-0001-000000000002', '40001003-0000-0000-0000-000000000002', 2, 'clerk', 'The animals made a condition with the lion to keep the forest safe.', 'حیوانات شرطی با شیر گذاشتند تا جنگل امن بماند.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full'),
('40001003-0000-0000-0001-000000000003', '40001003-0000-0000-0000-000000000002', 3, 'customer', 'A clever rabbit solved the dangerous problem with wisdom.', 'خرگوش باهوشی این مشکل خطرناک را با خرد و درایت حل کرد.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full'),
('40001003-0000-0000-0001-000000000004', '40001003-0000-0000-0000-000000000002', 4, 'clerk', 'He tricked the lion into believing another lion was hiding in the deep well.', 'او شیر را فریب داد تا باور کند شیر دیگری در چاه عمیق پنهان شده است.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full'),
('40001003-0000-0000-0001-000000000005', '40001003-0000-0000-0000-000000000002', 5, 'customer', 'Finally, truth and intelligence protected all the animals from danger.', 'سرانجام، حقیقت و هوش و زیرکی جان همه حیوانات را از خطر نجات داد.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full')
ON CONFLICT (id) DO NOTHING;

-- ۲. ساخت پادکست متصل به درس ۳
INSERT INTO podcasts (id, title, description_fa, level, kind, series_id, episode_no, audio_url, audio_status, is_active, duration_seconds, position, vocabulary, scene_id)
VALUES (
    '40001003-0000-0000-0000-000000000003',
    'The Lion and the Rabbit (Unit 3)',
    'داستان مشهور شیر و خرگوش با تمرکز بر واژگان ضروری تفکر و راهکار یونیت ۳',
    'beginner',
    'lesson',
    '40000000-0001-0000-0000-000000000001',
    3,
    '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3',
    'ready',
    TRUE,
    320,
    3,
    '[{"word":"condition","meaning_fa":"شرط یا وضعیت"},{"word":"solve","meaning_fa":"حل کردن معما یا مشکل"},{"word":"believe","meaning_fa":"باور داشتن و اعتقاد داشتن"},{"word":"trick","meaning_fa":"حقه یا فریب دادن"},{"word":"protect","meaning_fa":"محافظت کردن"},{"word":"truth","meaning_fa":"حقیقت و واقعیت"}]'::jsonb,
    '40001003-0000-0000-0000-000000000001'
) ON CONFLICT (id) DO UPDATE SET scene_id = EXCLUDED.scene_id, vocabulary = EXCLUDED.vocabulary;

INSERT INTO podcast_lines (podcast_id, position, speaker, text, translation_fa, start_ms, end_ms)
VALUES
('40001003-0000-0000-0000-000000000003', 0, 'Alex', 'Welcome back to Unit 3: The Lion and the Rabbit.', 'به یونیت سوم خوش آمدید: شیر و خرگوش.', 0, 5000),
('40001003-0000-0000-0000-000000000003', 1, 'Sarah', 'Today we discover how brain and wit always triumph over brute strength.', 'امروز درمی‌یابیم که چگونه هوش و درایت بر قدرت فیزیکی پیروز می‌شود.', 5300, 12500),
('40001003-0000-0000-0000-000000000003', 2, 'Alex', 'The clever rabbit protected the forest by leading the fierce lion to the deep well.', 'خرگوش باهوش با هدایت کردن شیر درنده به چاه عمیق، از جنگل محافظت کرد.', 12800, 21500),
('40001003-0000-0000-0000-000000000003', 3, 'Sarah', 'Let us practice repeating these key lines together in the shadowing room!', 'بیایید با هم این جملات کلیدی را در اتاق شادوئینگ تکرار و تمرین کنیم!', 21800, 29000)
ON CONFLICT DO NOTHING;

-- +migrate Down
DELETE FROM podcast_lines WHERE podcast_id IN (
    '40001001-0000-0000-0000-000000000003',
    '40001002-0000-0000-0000-000000000003',
    '40001003-0000-0000-0000-000000000003'
);
DELETE FROM podcasts WHERE id IN (
    '40001001-0000-0000-0000-000000000003',
    '40001002-0000-0000-0000-000000000003',
    '40001003-0000-0000-0000-000000000003'
);
DELETE FROM dialogues WHERE hotspot_id IN (
    '40001001-0000-0000-0000-000000000002',
    '40001002-0000-0000-0000-000000000002',
    '40001003-0000-0000-0000-000000000002'
);
DELETE FROM hotspots WHERE id IN (
    '40001001-0000-0000-0000-000000000002',
    '40001002-0000-0000-0000-000000000002',
    '40001003-0000-0000-0000-000000000002'
);
DELETE FROM scenes WHERE id IN (
    '40001001-0000-0000-0000-000000000001',
    '40001002-0000-0000-0000-000000000001',
    '40001003-0000-0000-0000-000000000001'
);
DELETE FROM podcast_series WHERE id IN (
    '40000000-0001-0000-0000-000000000001',
    '40000000-0002-0000-0000-000000000002',
    '40000000-0003-0000-0000-000000000003',
    '40000000-0004-0000-0000-000000000004',
    '40000000-0005-0000-0000-000000000005',
    '40000000-0006-0000-0000-000000000006'
);
