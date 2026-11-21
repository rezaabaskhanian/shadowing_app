-- +migrate Up
-- دوره رسمی «۴۰۰۰ واژه ضروری زبان انگلیسی» (4000 Essential English Words):
-- ۶ کتاب در ۶ سطح استاندارد، به همراه ۲۰ یونیت اول کتاب ۱ (مجموع ۴۰۰ واژه کاربردی).

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
-- کتاب اول - درس 1: The Laboratory Experiment (یونیت 1)
--------------------------------------------------------------------------------
INSERT INTO scenes (id, title, description, background_image_url, difficulty, status, "order", category, is_custom)
VALUES (
    '40001000-0000-0000-0000-000100000001',
    'The Laboratory Experiment (Unit 1)',
    'تمرین شادوئینگ واژگان ضروری یونیت 1 کتاب ۴۰۰۰ واژه: afraid, agree, angry, arrive, attack, bottom, clever, cruel...',
    '',
    'beginner',
    'published',
    101,
    'education',
    false
) ON CONFLICT (id) DO NOTHING;

INSERT INTO hotspots (id, scene_id, name, x_position, y_position, order_index)
VALUES (
    '40001000-0000-0000-0000-000100000002',
    '40001000-0000-0000-0000-000100000001',
    'Dialogue',
    50.0,
    50.0,
    1
) ON CONFLICT (id) DO NOTHING;

INSERT INTO dialogues (id, hotspot_id, "order", speaker, original_text, translation, audio_url, display_type)
VALUES
('40001000-0000-0000-0001-000100000001', '40001000-0000-0000-0000-000100000002', 1, 'customer', 'Mia is a clever student who loves working in the laboratory.', 'میا دانش‌آموز باهوشی است که عاشق کار کردن در آزمایشگاه است.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full'),
('40001000-0000-0000-0001-000100000002', '40001000-0000-0000-0000-000100000002', 2, 'clerk', 'One afternoon, she arrived early to begin a special experiment.', 'یک روز بعدازظهر، او زود رسید تا یک آزمایش ویژه را شروع کند.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full'),
('40001000-0000-0000-0001-000100000003', '40001000-0000-0000-0000-000100000002', 3, 'customer', 'She was afraid that something might go wrong with the chemicals.', 'او نگران و خائف بود که مبادا با مواد شیمیایی اتفاقی بیفتد.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full'),
('40001000-0000-0000-0001-000100000004', '40001000-0000-0000-0000-000100000002', 4, 'clerk', 'Her teacher agreed to supervise and help her stay safe.', 'استادش موافقت کرد که نظارت کند و به او کمک کند در امنیت بماند.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full'),
('40001000-0000-0000-0001-000100000005', '40001000-0000-0000-0000-000100000002', 5, 'customer', 'Finally, the solution turned bright blue and the test was a success!', 'در نهایت، محلول به رنگ آبی روشن درآمد و آزمایش با موفقیت به پایان رسید!', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full')
ON CONFLICT (id) DO NOTHING;

INSERT INTO podcasts (id, title, description_fa, level, kind, series_id, episode_no, audio_url, audio_status, is_active, duration_seconds, position, vocabulary, scene_id)
VALUES (
    '40001000-0000-0000-0000-000100000003',
    'The Laboratory Experiment (Unit 1)',
    'روایت جذاب و آموزش واژگان یونیت 1 (آزمایش در آزمایشگاه) کتاب ۴۰۰۰ واژه ضروری',
    'beginner',
    'lesson',
    '40000000-0001-0000-0000-000000000001',
    1,
    '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3',
    'ready',
    TRUE,
    293,
    1,
    '[{"word": "afraid", "meaning_fa": "ترسیده و نگران"}, {"word": "agree", "meaning_fa": "موافقت کردن"}, {"word": "angry", "meaning_fa": "عصبانی"}, {"word": "arrive", "meaning_fa": "رسیدن به مقصد"}, {"word": "attack", "meaning_fa": "حمله کردن"}, {"word": "bottom", "meaning_fa": "پایین و ته"}, {"word": "clever", "meaning_fa": "باهوش و زیرک"}, {"word": "cruel", "meaning_fa": "بی‌رحم"}, {"word": "finally", "meaning_fa": "سرانجام و در نهایت"}, {"word": "hide", "meaning_fa": "پنهان شدن"}, {"word": "hunt", "meaning_fa": "شکار کردن"}, {"word": "lot", "meaning_fa": "مقدار زیاد"}, {"word": "middle", "meaning_fa": "وسط و میان"}, {"word": "moment", "meaning_fa": "لحظه"}, {"word": "promise", "meaning_fa": "قول دادن"}, {"word": "reply", "meaning_fa": "پاسخ دادن"}, {"word": "safe", "meaning_fa": "امن و بی‌خطر"}, {"word": "trick", "meaning_fa": "حیله و حقه"}, {"word": "well", "meaning_fa": "چاه آب"}, {"word": "adventure", "meaning_fa": "ماجراجویی"}]'::jsonb,
    '40001000-0000-0000-0000-000100000001'
) ON CONFLICT (id) DO UPDATE SET scene_id = EXCLUDED.scene_id, vocabulary = EXCLUDED.vocabulary;

INSERT INTO podcast_lines (podcast_id, position, speaker, text, translation_fa, start_ms, end_ms)
VALUES
('40001000-0000-0000-0000-000100000003', 0, 'Alex', 'Welcome to 4000 Essential English Words, Unit 1: The Laboratory Experiment.', 'به یونیت اول دوره ۴۰۰۰ واژه ضروری خوش آمدید: آزمایش آزمایشگاه.', 0, 6000),
('40001000-0000-0000-0000-000100000003', 1, 'Sarah', 'Today we follow Mia, a clever student passionate about science and chemistry.', 'امروز داستان میا را دنبال می‌کنیم، دانش‌آموز باهوشی که به علوم و شیمی علاقه زیادی دارد.', 6200, 13500),
('40001000-0000-0000-0000-000100000003', 2, 'Alex', 'When she arrived at the lab, she felt a bit afraid, but her teacher promised to keep everything safe.', 'وقتی او به آزمایشگاه رسید کمی احساس نگرانی می‌کرد، اما استادش قول داد همه چیز در امنیت باشد.', 13800, 22000),
('40001000-0000-0000-0000-000100000003', 3, 'Sarah', 'Her patience paid off, and finally her experiment turned into a wonderful success!', 'صبر او به نتیجه نشست و در نهایت آزمایش او به یک موفقیت فوق‌العاده تبدیل شد!', 22300, 30500),
('40001000-0000-0000-0000-000100000003', 4, 'Alex', 'Now let us practice shadowing these sentences to master both vocabulary and pronunciation.', 'حالا بیایید این جملات را به صورت شادوئینگ تمرین کنیم تا هم لغات و هم تلفظتان را تقویت کنید.', 30800, 38000)
ON CONFLICT DO NOTHING;

--------------------------------------------------------------------------------
-- کتاب اول - درس 2: The Dog's Bell (یونیت 2)
--------------------------------------------------------------------------------
INSERT INTO scenes (id, title, description, background_image_url, difficulty, status, "order", category, is_custom)
VALUES (
    '40001000-0000-0000-0000-000200000001',
    'The Dog's Bell (Unit 2)',
    'تمرین شادوئینگ واژگان ضروری یونیت 2 کتاب ۴۰۰۰ واژه: appropriate, avoid, behave, calm, concern, content, expect, frequently...',
    '',
    'beginner',
    'published',
    102,
    'education',
    false
) ON CONFLICT (id) DO NOTHING;

INSERT INTO hotspots (id, scene_id, name, x_position, y_position, order_index)
VALUES (
    '40001000-0000-0000-0000-000200000002',
    '40001000-0000-0000-0000-000200000001',
    'Dialogue',
    50.0,
    50.0,
    1
) ON CONFLICT (id) DO NOTHING;

INSERT INTO dialogues (id, hotspot_id, "order", speaker, original_text, translation, audio_url, display_type)
VALUES
('40001000-0000-0000-0001-000200000001', '40001000-0000-0000-0000-000200000002', 1, 'customer', 'John had a dog that did not behave well around guests.', 'جان سگی داشت که در حضور مهمان‌ها رفتار مناسبی نداشت.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full'),
('40001000-0000-0000-0001-000200000002', '40001000-0000-0000-0000-000200000002', 2, 'clerk', 'The dog had a bad habit of biting people who strolled by.', 'سگ عادت بدی داشت که به افرادی که در حال قدم زدن بودند گاز می‌گرفت.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full'),
('40001000-0000-0000-0001-000200000003', '40001000-0000-0000-0000-000200000002', 3, 'customer', 'This was a serious concern for everyone living in the village.', 'این یک نگرانی جدی برای تمام اهالی روستا بود.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full'),
('40001000-0000-0000-0001-000200000004', '40001000-0000-0000-0000-000200000002', 4, 'clerk', 'John decided to put a bell on the dog so people could avoid him.', 'جان تصمیم گرفت زنگی به گردن سگ ببندد تا مردم بتوانند از او دوری کنند.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full'),
('40001000-0000-0000-0001-000200000005', '40001000-0000-0000-0000-000200000002', 5, 'customer', 'Staying patient and calm helped John solve the issue effectively.', 'صبور و آرام ماندن به جان کمک کرد این مسئله را به شکلی موثر حل کند.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full')
ON CONFLICT (id) DO NOTHING;

INSERT INTO podcasts (id, title, description_fa, level, kind, series_id, episode_no, audio_url, audio_status, is_active, duration_seconds, position, vocabulary, scene_id)
VALUES (
    '40001000-0000-0000-0000-000200000003',
    'The Dog's Bell (Unit 2)',
    'روایت جذاب و آموزش واژگان یونیت 2 (زنگوله سگ) کتاب ۴۰۰۰ واژه ضروری',
    'beginner',
    'lesson',
    '40000000-0001-0000-0000-000000000001',
    2,
    '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3',
    'ready',
    TRUE,
    296,
    2,
    '[{"word": "appropriate", "meaning_fa": "مناسب و شایسته"}, {"word": "avoid", "meaning_fa": "اجتناب کردن و دوری گزیدن"}, {"word": "behave", "meaning_fa": "رفتار کردن"}, {"word": "calm", "meaning_fa": "آرام و خونسرد"}, {"word": "concern", "meaning_fa": "نگرانی و دلواپسی"}, {"word": "content", "meaning_fa": "راضی و خشنود"}, {"word": "expect", "meaning_fa": "انتظار داشتن"}, {"word": "frequently", "meaning_fa": "به طور مکرر"}, {"word": "habit", "meaning_fa": "عادت"}, {"word": "instruct", "meaning_fa": "دستور دادن و آموزش دادن"}, {"word": "issue", "meaning_fa": "مسئله یا موضوع"}, {"word": "none", "meaning_fa": "هیچ‌کدام"}, {"word": "patient", "meaning_fa": "صبور و شکیبا"}, {"word": "positive", "meaning_fa": "مثبت"}, {"word": "punish", "meaning_fa": "تنبیه کردن"}, {"word": "represent", "meaning_fa": "نمایندگی کردن"}, {"word": "shake", "meaning_fa": "لرزاندن و تکان دادن"}, {"word": "spread", "meaning_fa": "پخش شدن"}, {"word": "stroll", "meaning_fa": "قدم زدن آرام"}, {"word": "village", "meaning_fa": "روستا"}]'::jsonb,
    '40001000-0000-0000-0000-000200000001'
) ON CONFLICT (id) DO UPDATE SET scene_id = EXCLUDED.scene_id, vocabulary = EXCLUDED.vocabulary;

INSERT INTO podcast_lines (podcast_id, position, speaker, text, translation_fa, start_ms, end_ms)
VALUES
('40001000-0000-0000-0000-000200000003', 0, 'Alex', 'Welcome back to Unit 2: The Dog’s Bell.', 'به یونیت دوم خوش آمدید: زنگوله سگ.', 0, 5000),
('40001000-0000-0000-0000-000200000003', 1, 'Sarah', 'Today we explore how bad habits can cause serious concern in a community.', 'امروز بررسی می‌کنیم که چگونه عادت‌های بد می‌توانند نگرانی‌های جدی ایجاد کنند.', 5300, 12500),
('40001000-0000-0000-0000-000200000003', 2, 'Alex', 'John put a bell on his dog so neighbors could hear it and avoid danger.', 'جان زنگوله‌ای به سگش وصل کرد تا همسایه‌ها با شنیدن آن از خطر دوری کنند.', 12800, 20500),
('40001000-0000-0000-0000-000200000003', 3, 'Sarah', 'Remember, remaining calm and patient is key to solving difficult problems.', 'به یاد داشته باشید، صبور و آرام ماندن کلید حل مشکلات دشوار است.', 20800, 28000)
ON CONFLICT DO NOTHING;

--------------------------------------------------------------------------------
-- کتاب اول - درس 3: The Lion and the Rabbit (یونیت 3)
--------------------------------------------------------------------------------
INSERT INTO scenes (id, title, description, background_image_url, difficulty, status, "order", category, is_custom)
VALUES (
    '40001000-0000-0000-0000-000300000001',
    'The Lion and the Rabbit (Unit 3)',
    'تمرین شادوئینگ واژگان ضروری یونیت 3 کتاب ۴۰۰۰ واژه: believe, belong, capture, clear, condition, destroy, familiar, imagine...',
    '',
    'beginner',
    'published',
    103,
    'education',
    false
) ON CONFLICT (id) DO NOTHING;

INSERT INTO hotspots (id, scene_id, name, x_position, y_position, order_index)
VALUES (
    '40001000-0000-0000-0000-000300000002',
    '40001000-0000-0000-0000-000300000001',
    'Dialogue',
    50.0,
    50.0,
    1
) ON CONFLICT (id) DO NOTHING;

INSERT INTO dialogues (id, hotspot_id, "order", speaker, original_text, translation, audio_url, display_type)
VALUES
('40001000-0000-0000-0001-000300000001', '40001000-0000-0000-0000-000300000002', 1, 'customer', 'A cruel lion lived in the forest and attacked animals every day.', 'شیر بی‌رحمی در جنگل زندگی می‌کرد و هر روز به حیوانات حمله می‌برد.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full'),
('40001000-0000-0000-0001-000300000002', '40001000-0000-0000-0000-000300000002', 2, 'clerk', 'The animals made a condition with the lion to keep the forest safe.', 'حیوانات شرطی با شیر گذاشتند تا جنگل امن بماند.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full'),
('40001000-0000-0000-0001-000300000003', '40001000-0000-0000-0000-000300000002', 3, 'customer', 'A clever rabbit solved the dangerous problem with wisdom.', 'خرگوش باهوشی این مشکل خطرناک را با خرد و درایت حل کرد.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full'),
('40001000-0000-0000-0001-000300000004', '40001000-0000-0000-0000-000300000002', 4, 'clerk', 'He tricked the lion into believing another lion was hiding in the deep well.', 'او شیر را فریب داد تا باور کند شیر دیگری در چاه عمیق پنهان شده است.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full'),
('40001000-0000-0000-0001-000300000005', '40001000-0000-0000-0000-000300000002', 5, 'customer', 'Finally, truth and intelligence protected all the animals from danger.', 'سرانجام، حقیقت و هوش و زیرکی جان همه حیوانات را از خطر نجات داد.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full')
ON CONFLICT (id) DO NOTHING;

INSERT INTO podcasts (id, title, description_fa, level, kind, series_id, episode_no, audio_url, audio_status, is_active, duration_seconds, position, vocabulary, scene_id)
VALUES (
    '40001000-0000-0000-0000-000300000003',
    'The Lion and the Rabbit (Unit 3)',
    'روایت جذاب و آموزش واژگان یونیت 3 (شیر و خرگوش) کتاب ۴۰۰۰ واژه ضروری',
    'beginner',
    'lesson',
    '40000000-0001-0000-0000-000000000001',
    3,
    '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3',
    'ready',
    TRUE,
    299,
    3,
    '[{"word": "believe", "meaning_fa": "باور داشتن"}, {"word": "belong", "meaning_fa": "متعلق بودن"}, {"word": "capture", "meaning_fa": "به دام انداختن"}, {"word": "clear", "meaning_fa": "واضح و روشن"}, {"word": "condition", "meaning_fa": "شرط یا وضعیت"}, {"word": "destroy", "meaning_fa": "نابود کردن"}, {"word": "familiar", "meaning_fa": "آشنا"}, {"word": "imagine", "meaning_fa": "تصور کردن"}, {"word": "incident", "meaning_fa": "حادثه"}, {"word": "normal", "meaning_fa": "عادی"}, {"word": "protect", "meaning_fa": "محافظت کردن"}, {"word": "solve", "meaning_fa": "حل کردن"}, {"word": "strange", "meaning_fa": "عجیب"}, {"word": "truth", "meaning_fa": "حقیقت"}, {"word": "recognize", "meaning_fa": "تشخیص دادن"}, {"word": "forest", "meaning_fa": "جنگل"}, {"word": "wisdom", "meaning_fa": "خرد و دانایی"}, {"word": "danger", "meaning_fa": "خطر"}, {"word": "deep", "meaning_fa": "عمیق"}, {"word": "shadow", "meaning_fa": "سایه"}]'::jsonb,
    '40001000-0000-0000-0000-000300000001'
) ON CONFLICT (id) DO UPDATE SET scene_id = EXCLUDED.scene_id, vocabulary = EXCLUDED.vocabulary;

INSERT INTO podcast_lines (podcast_id, position, speaker, text, translation_fa, start_ms, end_ms)
VALUES
('40001000-0000-0000-0000-000300000003', 0, 'Alex', 'Welcome back to Unit 3: The Lion and the Rabbit.', 'به یونیت سوم خوش آمدید: شیر و خرگوش.', 0, 5000),
('40001000-0000-0000-0000-000300000003', 1, 'Sarah', 'Today we discover how brain and wit always triumph over brute strength.', 'امروز درمی‌یابیم که چگونه هوش و درایت بر قدرت فیزیکی پیروز می‌شود.', 5300, 12500),
('40001000-0000-0000-0000-000300000003', 2, 'Alex', 'The clever rabbit protected the forest by leading the fierce lion to the deep well.', 'خرگوش باهوش با هدایت کردن شیر درنده به چاه عمیق، از جنگل محافظت کرد.', 12800, 21500),
('40001000-0000-0000-0000-000300000003', 3, 'Sarah', 'Let us practice repeating these key lines together in the shadowing room!', 'بیایید با هم این جملات کلیدی را در اتاق شادوئینگ تکرار و تمرین کنیم!', 21800, 29000)
ON CONFLICT DO NOTHING;

--------------------------------------------------------------------------------
-- کتاب اول - درس 4: The Boy and His Sled (یونیت 4)
--------------------------------------------------------------------------------
INSERT INTO scenes (id, title, description, background_image_url, difficulty, status, "order", category, is_custom)
VALUES (
    '40001000-0000-0000-0000-000400000001',
    'The Boy and His Sled (Unit 4)',
    'تمرین شادوئینگ واژگان ضروری یونیت 4 کتاب ۴۰۰۰ واژه: appreciate, available, beat, bright, celebrate, determine, disappear, else...',
    '',
    'beginner',
    'published',
    104,
    'education',
    false
) ON CONFLICT (id) DO NOTHING;

INSERT INTO hotspots (id, scene_id, name, x_position, y_position, order_index)
VALUES (
    '40001000-0000-0000-0000-000400000002',
    '40001000-0000-0000-0000-000400000001',
    'Dialogue',
    50.0,
    50.0,
    1
) ON CONFLICT (id) DO NOTHING;

INSERT INTO dialogues (id, hotspot_id, "order", speaker, original_text, translation, audio_url, display_type)
VALUES
('40001000-0000-0000-0001-000400000001', '40001000-0000-0000-0000-000400000002', 1, 'customer', 'Ethan was determined to build the fastest sled in his neighborhood.', 'ایتن مصمم بود سریع‌ترین سورتمه را در محله‌اش بسازد.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full'),
('40001000-0000-0000-0001-000400000002', '40001000-0000-0000-0000-000400000002', 2, 'clerk', 'He gathered available wood from the shed and worked all morning.', 'او چوب‌های موجود را از انباری جمع کرد و تمام صبح کار کرد.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full'),
('40001000-0000-0000-0001-000400000003', '40001000-0000-0000-0000-000400000002', 3, 'customer', 'On a bright winter day, he climbed up the steep snowy hill.', 'در یک روز زمستانی آفتابی و روشن، او از تپه برفی پرشیب بالا رفت.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full'),
('40001000-0000-0000-0001-000400000004', '40001000-0000-0000-0000-000400000002', 4, 'clerk', 'The sled flowed smoothly forward without hitting any muddy puddle.', 'سورتمه با روانی به سمت جلو حرکت کرد بدون اینکه به هیچ چاله آبی برخورد کند.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full'),
('40001000-0000-0000-0001-000400000005', '40001000-0000-0000-0000-000400000002', 5, 'customer', 'All his friends celebrated his wonderful success at the bottom.', 'تمام دوستانش موفقیت شگفت‌انگیز او را در پایین تپه جشن گرفتند.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full')
ON CONFLICT (id) DO NOTHING;

INSERT INTO podcasts (id, title, description_fa, level, kind, series_id, episode_no, audio_url, audio_status, is_active, duration_seconds, position, vocabulary, scene_id)
VALUES (
    '40001000-0000-0000-0000-000400000003',
    'The Boy and His Sled (Unit 4)',
    'روایت جذاب و آموزش واژگان یونیت 4 (پسر و سورتمه‌اش) کتاب ۴۰۰۰ واژه ضروری',
    'beginner',
    'lesson',
    '40000000-0001-0000-0000-000000000001',
    4,
    '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3',
    'ready',
    TRUE,
    302,
    4,
    '[{"word": "appreciate", "meaning_fa": "قدردانی کردن"}, {"word": "available", "meaning_fa": "در دسترس و موجود"}, {"word": "beat", "meaning_fa": "شکست دادن یا تپیدن"}, {"word": "bright", "meaning_fa": "روشن و درخشان"}, {"word": "celebrate", "meaning_fa": "جشن گرفتن"}, {"word": "determine", "meaning_fa": "تصمیم قطعی داشتن"}, {"word": "disappear", "meaning_fa": "ناپدید شدن"}, {"word": "else", "meaning_fa": "دیگر"}, {"word": "fair", "meaning_fa": "عادلانه"}, {"word": "flow", "meaning_fa": "جریان داشتن"}, {"word": "forward", "meaning_fa": "رو به جلو"}, {"word": "hill", "meaning_fa": "تپه"}, {"word": "level", "meaning_fa": "سطح"}, {"word": "lone", "meaning_fa": "تنها"}, {"word": "puddle", "meaning_fa": "چاله آب"}, {"word": "response", "meaning_fa": "پاسخ"}, {"word": "season", "meaning_fa": "فصل"}, {"word": "solution", "meaning_fa": "راهکار"}, {"word": "waste", "meaning_fa": "هدر دادن"}, {"word": "whether", "meaning_fa": "خواه یا اینکه"}]'::jsonb,
    '40001000-0000-0000-0000-000400000001'
) ON CONFLICT (id) DO UPDATE SET scene_id = EXCLUDED.scene_id, vocabulary = EXCLUDED.vocabulary;

INSERT INTO podcast_lines (podcast_id, position, speaker, text, translation_fa, start_ms, end_ms)
VALUES
('40001000-0000-0000-0000-000400000003', 0, 'Alex', 'Welcome to Unit 4: The Boy and His Sled.', 'به یونیت چهارم خوش آمدید: پسر و سورتمه‌اش.', 0, 5000),
('40001000-0000-0000-0000-000400000003', 1, 'Sarah', 'Determination can turn simple ideas into real triumphs.', 'اراده و تصمیم قطعی می‌تواند ایده‌های ساده را به موفقیت‌های واقعی بدل کند.', 5300, 12000),
('40001000-0000-0000-0000-000400000003', 2, 'Alex', 'Ethan used available materials to construct a sled and slide down the hill.', 'ایتن از وسایل موجود استفاده کرد تا سورتمه‌ای بسازد و از تپه سرازیر شود.', 12400, 20500),
('40001000-0000-0000-0000-000400000003', 3, 'Sarah', 'Listen closely to the target vocabulary and practice your pronunciation!', 'به لغات هدف با دقت گوش کنید و تلفظ خود را تقویت کنید!', 20800, 28000)
ON CONFLICT DO NOTHING;

--------------------------------------------------------------------------------
-- کتاب اول - درس 5: A Journey to the Wild Field (یونیت 5)
--------------------------------------------------------------------------------
INSERT INTO scenes (id, title, description, background_image_url, difficulty, status, "order", category, is_custom)
VALUES (
    '40001000-0000-0000-0000-000500000001',
    'A Journey to the Wild Field (Unit 5)',
    'تمرین شادوئینگ واژگان ضروری یونیت 5 کتاب ۴۰۰۰ واژه: aware, badly, belong, continue, error, experience, field, hurt...',
    '',
    'beginner',
    'published',
    105,
    'education',
    false
) ON CONFLICT (id) DO NOTHING;

INSERT INTO hotspots (id, scene_id, name, x_position, y_position, order_index)
VALUES (
    '40001000-0000-0000-0000-000500000002',
    '40001000-0000-0000-0000-000500000001',
    'Dialogue',
    50.0,
    50.0,
    1
) ON CONFLICT (id) DO NOTHING;

INSERT INTO dialogues (id, hotspot_id, "order", speaker, original_text, translation, audio_url, display_type)
VALUES
('40001000-0000-0000-0001-000500000001', '40001000-0000-0000-0000-000500000002', 1, 'customer', 'Walking in the wild field was a completely new experience for Liam.', 'قدم زدن در دشت وحشی و بکر یک تجربه کاملاً جدید برای لیام بود.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full'),
('40001000-0000-0000-0001-000500000002', '40001000-0000-0000-0000-000500000002', 2, 'clerk', 'He was aware that weather conditions could change rapidly.', 'او آگاه بود که شرایط آب و هوایی ممکن است خیلی سریع تغییر کند.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full'),
('40001000-0000-0000-0001-000500000003', '40001000-0000-0000-0000-000500000002', 3, 'customer', 'Using good judgment, he decided not to wander too far from the trail.', 'با استفاده از قضاوت درست، او تصمیم گرفت زیاد از مسیر اصلی دور نشود.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full'),
('40001000-0000-0000-0001-000500000004', '40001000-0000-0000-0000-000500000002', 4, 'clerk', 'He spotted rare colorful birds resting on the green grass.', 'او پرندگان کمیاب و رنگارنگی را دید که روی چمن‌های سبز استراحت می‌کردند.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full'),
('40001000-0000-0000-0001-000500000005', '40001000-0000-0000-0000-000500000002', 5, 'customer', 'Sitting quietly under the tree helped him truly relax and enjoy nature.', 'آرام نشستن زیر سایه درخت به او کمک کرد واقعاً آرامش پیدا کند و از طبیعت لذت ببرد.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full')
ON CONFLICT (id) DO NOTHING;

INSERT INTO podcasts (id, title, description_fa, level, kind, series_id, episode_no, audio_url, audio_status, is_active, duration_seconds, position, vocabulary, scene_id)
VALUES (
    '40001000-0000-0000-0000-000500000003',
    'A Journey to the Wild Field (Unit 5)',
    'روایت جذاب و آموزش واژگان یونیت 5 (سفر به دشت وحشی) کتاب ۴۰۰۰ واژه ضروری',
    'beginner',
    'lesson',
    '40000000-0001-0000-0000-000000000001',
    5,
    '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3',
    'ready',
    TRUE,
    305,
    5,
    '[{"word": "aware", "meaning_fa": "آگاه و مطلع"}, {"word": "badly", "meaning_fa": "به شدت یا به بدی"}, {"word": "belong", "meaning_fa": "تعلق داشتن"}, {"word": "continue", "meaning_fa": "ادامه دادن"}, {"word": "error", "meaning_fa": "اشتباه"}, {"word": "experience", "meaning_fa": "تجربه"}, {"word": "field", "meaning_fa": "مزرعه یا دشت"}, {"word": "hurt", "meaning_fa": "آسیب دیدن"}, {"word": "judgment", "meaning_fa": "قضاوت و درایت"}, {"word": "likely", "meaning_fa": "محتمل"}, {"word": "normal", "meaning_fa": "عادی"}, {"word": "rare", "meaning_fa": "کمیاب و نایاب"}, {"word": "relax", "meaning_fa": "آرامش گرفتن"}, {"word": "request", "meaning_fa": "درخواست کردن"}, {"word": "reside", "meaning_fa": "سکونت داشتن"}, {"word": "result", "meaning_fa": "نتیجه"}, {"word": "roll", "meaning_fa": "غلتیدن"}, {"word": "since", "meaning_fa": "از زمانی که"}, {"word": "visible", "meaning_fa": "قابل دیدن"}, {"word": "wild", "meaning_fa": "وحشی و طبیعی"}]'::jsonb,
    '40001000-0000-0000-0000-000500000001'
) ON CONFLICT (id) DO UPDATE SET scene_id = EXCLUDED.scene_id, vocabulary = EXCLUDED.vocabulary;

INSERT INTO podcast_lines (podcast_id, position, speaker, text, translation_fa, start_ms, end_ms)
VALUES
('40001000-0000-0000-0000-000500000003', 0, 'Alex', 'Welcome to Unit 5: A Journey to the Wild Field.', 'به یونیت پنجم خوش آمدید: سفر به طبیعت بکر.', 0, 5000),
('40001000-0000-0000-0000-000500000003', 1, 'Sarah', 'Connecting with nature requires awareness, respect, and sound judgment.', 'ارتباط برقرار کردن با طبیعت نیازمند هوشیاری، احترام و قضاوت درست است.', 5300, 13000),
('40001000-0000-0000-0000-000500000003', 2, 'Alex', 'Liam relaxed under the shade of trees while watching rare wildlife.', 'لیام زیر سایه درختان آرام گرفت در حالی که نظاره‌گر حیات وحش کمیاب بود.', 13400, 21500),
('40001000-0000-0000-0000-000500000003', 3, 'Sarah', 'Now head over to the shadowing section to record these sentences in your own voice!', 'حالا به بخش شادوئینگ بروید تا این جملات را با صدای خودتان تمرین و ضبط کنید!', 21800, 29000)
ON CONFLICT DO NOTHING;

--------------------------------------------------------------------------------
-- کتاب اول - درس 6: The Friendly Ghost (یونیت 6)
--------------------------------------------------------------------------------
INSERT INTO scenes (id, title, description, background_image_url, difficulty, status, "order", category, is_custom)
VALUES (
    '40001000-0000-0000-0000-000600000001',
    'The Friendly Ghost (Unit 6)',
    'تمرین شادوئینگ واژگان ضروری یونیت 6 کتاب ۴۰۰۰ واژه: advantage, cause, choice, community, dead, distance, escape, face...',
    '',
    'beginner',
    'published',
    106,
    'education',
    false
) ON CONFLICT (id) DO NOTHING;

INSERT INTO hotspots (id, scene_id, name, x_position, y_position, order_index)
VALUES (
    '40001000-0000-0000-0000-000600000002',
    '40001000-0000-0000-0000-000600000001',
    'Dialogue',
    50.0,
    50.0,
    1
) ON CONFLICT (id) DO NOTHING;

INSERT INTO dialogues (id, hotspot_id, "order", speaker, original_text, translation, audio_url, display_type)
VALUES
('40001000-0000-0000-0001-000600000001', '40001000-0000-0000-0000-000600000002', 1, 'customer', 'The wise village elder told stories about a friendly ghost in the mountains.', 'پیر خردمند روستا داستان‌هایی درباره روحی مهربان در کوهستان تعریف می‌کرد.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full'),
('40001000-0000-0000-0001-000600000002', '40001000-0000-0000-0000-000600000002', 2, 'clerk', 'During severe winter weather, travelers faced great danger.', 'در هنگام هوای زمستانی سخت، مسافران با خطرات بزرگی روبرو می‌شدند.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full'),
('40001000-0000-0000-0001-000600000003', '40001000-0000-0000-0000-000600000002', 3, 'customer', 'A calm voice helped lost individuals survive the cold distance.', 'صدایی آرام به افراد گمشده کمک می‌کرد تا فاصله سرد را جان سالم به در ببرند.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full'),
('40001000-0000-0000-0001-000600000004', '40001000-0000-0000-0000-000600000002', 4, 'clerk', 'Everyone in the community appreciated having such a guardian.', 'تمام اهالی جامعه از داشتن چنین نگهبانی قدردانی می‌کردند.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full'),
('40001000-0000-0000-0001-000600000005', '40001000-0000-0000-0000-000600000002', 5, 'customer', 'They returned home safely with a joyful choice to celebrate.', 'آن‌ها با تصمیمی شاد برای جشن گرفتن، به سلامت به خانه بازگشتند.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full')
ON CONFLICT (id) DO NOTHING;

INSERT INTO podcasts (id, title, description_fa, level, kind, series_id, episode_no, audio_url, audio_status, is_active, duration_seconds, position, vocabulary, scene_id)
VALUES (
    '40001000-0000-0000-0000-000600000003',
    'The Friendly Ghost (Unit 6)',
    'روایت جذاب و آموزش واژگان یونیت 6 (شبح مهربان) کتاب ۴۰۰۰ واژه ضروری',
    'beginner',
    'lesson',
    '40000000-0001-0000-0000-000000000001',
    6,
    '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3',
    'ready',
    TRUE,
    308,
    6,
    '[{"word": "advantage", "meaning_fa": "مزیت"}, {"word": "cause", "meaning_fa": "علت و سبب شدن"}, {"word": "choice", "meaning_fa": "انتخاب"}, {"word": "community", "meaning_fa": "جامعه محلی"}, {"word": "dead", "meaning_fa": "مرده"}, {"word": "distance", "meaning_fa": "فاصله"}, {"word": "escape", "meaning_fa": "فرار کردن"}, {"word": "face", "meaning_fa": "روبرو شدن با"}, {"word": "follow", "meaning_fa": "پیروی کردن"}, {"word": "fright", "meaning_fa": "ترس ناگهانی"}, {"word": "ghost", "meaning_fa": "شبح یا روح"}, {"word": "individual", "meaning_fa": "فرد"}, {"word": "pet", "meaning_fa": "حیوان خانگی"}, {"word": "reach", "meaning_fa": "رسیدن به"}, {"word": "return", "meaning_fa": "بازگشتن"}, {"word": "survive", "meaning_fa": "زنده ماندن"}, {"word": "upset", "meaning_fa": "ناراحت"}, {"word": "voice", "meaning_fa": "صدا"}, {"word": "weather", "meaning_fa": "آب و هوا"}, {"word": "wise", "meaning_fa": "دانا و خردمند"}]'::jsonb,
    '40001000-0000-0000-0000-000600000001'
) ON CONFLICT (id) DO UPDATE SET scene_id = EXCLUDED.scene_id, vocabulary = EXCLUDED.vocabulary;

INSERT INTO podcast_lines (podcast_id, position, speaker, text, translation_fa, start_ms, end_ms)
VALUES
('40001000-0000-0000-0000-000600000003', 0, 'Alex', 'Welcome to Unit 6: The Friendly Ghost.', 'به یونیت ششم خوش آمدید: روح مهربان.', 0, 5000),
('40001000-0000-0000-0000-000600000003', 1, 'Sarah', 'Wisdom and community support help us face severe challenges.', 'خرد و حمایت جامعه به ما کمک می‌کند تا با چالش‌های سخت روبرو شویم.', 5300, 12000),
('40001000-0000-0000-0000-000600000003', 2, 'Alex', 'The friendly presence guided travelers across a perilous distance.', 'حضور مهربان مسافران را در مسافتی پرمخاطره هدایت کرد.', 12400, 20000),
('40001000-0000-0000-0000-000600000003', 3, 'Sarah', 'Let''s practice the vocabulary together in our shadowing session!', 'بیایید با هم واژگان را در جلسه شادوئینگ تمرین کنیم!', 20400, 27000)
ON CONFLICT DO NOTHING;

--------------------------------------------------------------------------------
-- کتاب اول - درس 7: The Star Gazers (یونیت 7)
--------------------------------------------------------------------------------
INSERT INTO scenes (id, title, description, background_image_url, difficulty, status, "order", category, is_custom)
VALUES (
    '40001000-0000-0000-0000-000700000001',
    'The Star Gazers (Unit 7)',
    'تمرین شادوئینگ واژگان ضروری یونیت 7 کتاب ۴۰۰۰ واژه: allow, announce, beside, challenge, claim, condition, contribute, difference...',
    '',
    'beginner',
    'published',
    107,
    'education',
    false
) ON CONFLICT (id) DO NOTHING;

INSERT INTO hotspots (id, scene_id, name, x_position, y_position, order_index)
VALUES (
    '40001000-0000-0000-0000-000700000002',
    '40001000-0000-0000-0000-000700000001',
    'Dialogue',
    50.0,
    50.0,
    1
) ON CONFLICT (id) DO NOTHING;

INSERT INTO dialogues (id, hotspot_id, "order", speaker, original_text, translation, audio_url, display_type)
VALUES
('40001000-0000-0000-0001-000700000001', '40001000-0000-0000-0000-000700000002', 1, 'customer', 'The astronomy expert announced a special viewing of the meteor shower.', 'متخصص ستاره‌شناسی رصد ویژه‌ای از بارش شهابی را اعلام کرد.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full'),
('40001000-0000-0000-0001-000700000002', '40001000-0000-0000-0000-000700000002', 2, 'clerk', 'Clear sky conditions allowed everyone to observe the stars beside the observatory.', 'شرایط آسمان صاف به همه اجازه داد ستارگان را در کنار رصدخانه تماشا کنند.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full'),
('40001000-0000-0000-0001-000700000003', '40001000-0000-0000-0000-000700000002', 3, 'customer', 'Each student contributed to recording the differences in brightness.', 'هر دانش‌آموز در ثبت تفاوت‌های میزان درخشندگی مشارکت کرد.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full'),
('40001000-0000-0000-0001-000700000004', '40001000-0000-0000-0000-000700000002', 4, 'clerk', 'They felt a deep sense of peace looking into the vast universe.', 'آن‌ها با نگاه به جهان پهناور احساس عمیقی از آرامش و صلح پیدا کردند.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full'),
('40001000-0000-0000-0001-000700000005', '40001000-0000-0000-0000-000700000002', 5, 'customer', 'Therefore, this scientific challenge became an unforgettable memory.', 'بنابراین، این چالش علمی به یک خاطره فراموش‌نشدنی تبدیل شد.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full')
ON CONFLICT (id) DO NOTHING;

INSERT INTO podcasts (id, title, description_fa, level, kind, series_id, episode_no, audio_url, audio_status, is_active, duration_seconds, position, vocabulary, scene_id)
VALUES (
    '40001000-0000-0000-0000-000700000003',
    'The Star Gazers (Unit 7)',
    'روایت جذاب و آموزش واژگان یونیت 7 (تماشاگران ستارگان) کتاب ۴۰۰۰ واژه ضروری',
    'beginner',
    'lesson',
    '40000000-0001-0000-0000-000000000001',
    7,
    '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3',
    'ready',
    TRUE,
    311,
    7,
    '[{"word": "allow", "meaning_fa": "اجازه دادن"}, {"word": "announce", "meaning_fa": "اعلام کردن"}, {"word": "beside", "meaning_fa": "در کنار"}, {"word": "challenge", "meaning_fa": "چالش"}, {"word": "claim", "meaning_fa": "ادعا کردن"}, {"word": "condition", "meaning_fa": "شرایط"}, {"word": "contribute", "meaning_fa": "مشارکت کردن"}, {"word": "difference", "meaning_fa": "تفاوت"}, {"word": "divide", "meaning_fa": "تقسیم کردن"}, {"word": "expert", "meaning_fa": "متخصص"}, {"word": "famous", "meaning_fa": "مشهور"}, {"word": "force", "meaning_fa": "نیرو یا وادار کردن"}, {"word": "harm", "meaning_fa": "آسیب"}, {"word": "lay", "meaning_fa": "قرار دادن"}, {"word": "peace", "meaning_fa": "آرامش و صلح"}, {"word": "prince", "meaning_fa": "شاهزاده"}, {"word": "protect", "meaning_fa": "محافظت کردن"}, {"word": "sense", "meaning_fa": "حس یا درک"}, {"word": "sudden", "meaning_fa": "ناگهانی"}, {"word": "therefore", "meaning_fa": "بنابراین"}]'::jsonb,
    '40001000-0000-0000-0000-000700000001'
) ON CONFLICT (id) DO UPDATE SET scene_id = EXCLUDED.scene_id, vocabulary = EXCLUDED.vocabulary;

INSERT INTO podcast_lines (podcast_id, position, speaker, text, translation_fa, start_ms, end_ms)
VALUES
('40001000-0000-0000-0000-000700000003', 0, 'Alex', 'Welcome to Unit 7: The Star Gazers.', 'به یونیت هفتم خوش آمدید: تماشاگران ستارگان.', 0, 5000),
('40001000-0000-0000-0000-000700000003', 1, 'Sarah', 'Looking at the stars gives us a powerful sense of wonder and perspective.', 'نگاه کردن به ستارگان حس شگفت‌انگیزی از حیرت و دیدگاه تازه به ما می‌بخشد.', 5300, 12500),
('40001000-0000-0000-0000-000700000003', 2, 'Alex', 'Clear night conditions allowed the astronomy team to make valuable observations.', 'شرایط شب صاف به تیم ستاره‌شناسی اجازه داد مشاهدات ارزشمندی ثبت کنند.', 12800, 21000),
('40001000-0000-0000-0000-000700000003', 3, 'Sarah', 'Practice using ''therefore'' and ''contribute'' fluently in your daily speech!', 'تمرین کنید تا واژگان ''بنابراین'' و ''مشارکت کردن'' را به روانی در گفتارتان به کار ببرید!', 21400, 28500)
ON CONFLICT DO NOTHING;

--------------------------------------------------------------------------------
-- کتاب اول - درس 8: The Camping Trip (یونیت 8)
--------------------------------------------------------------------------------
INSERT INTO scenes (id, title, description, background_image_url, difficulty, status, "order", category, is_custom)
VALUES (
    '40001000-0000-0000-0000-000800000001',
    'The Camping Trip (Unit 8)',
    'تمرین شادوئینگ واژگان ضروری یونیت 8 کتاب ۴۰۰۰ واژه: accept, arrange, attend, chase, contrast, encourage, familiar, grab...',
    '',
    'beginner',
    'published',
    108,
    'education',
    false
) ON CONFLICT (id) DO NOTHING;

INSERT INTO hotspots (id, scene_id, name, x_position, y_position, order_index)
VALUES (
    '40001000-0000-0000-0000-000800000002',
    '40001000-0000-0000-0000-000800000001',
    'Dialogue',
    50.0,
    50.0,
    1
) ON CONFLICT (id) DO NOTHING;

INSERT INTO dialogues (id, hotspot_id, "order", speaker, original_text, translation, audio_url, display_type)
VALUES
('40001000-0000-0000-0001-000800000001', '40001000-0000-0000-0000-000800000002', 1, 'customer', 'Our team arranged an exciting camping trip in the national park.', 'تیم ما یک سفر کمپینگ هیجان‌انگیز را در پارک ملی برنامه‌ریزی کرد.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full'),
('40001000-0000-0000-0001-000800000002', '40001000-0000-0000-0000-000800000002', 2, 'clerk', 'They accepted the proposal to hike along the scenic mountain trail.', 'آن‌ها پیشنهاد پیاده‌روی در مسیر زیبای کوهستانی را پذیرفتند.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full'),
('40001000-0000-0000-0001-000800000003', '40001000-0000-0000-0000-000800000002', 3, 'customer', 'It was necessary to set up the tents before the sun went down.', 'ضروری بود که چادرها را قبل از غروب آفتاب برپا کنند.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full'),
('40001000-0000-0000-0001-000800000004', '40001000-0000-0000-0000-000800000002', 4, 'clerk', 'The guide encouraged everyone to work together for a huge success.', 'راهنما همه را تشویق کرد تا با همکاری یکدیگر موفقیت بزرگی رقم بزنند.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full'),
('40001000-0000-0000-0001-000800000005', '40001000-0000-0000-0000-000800000002', 5, 'customer', 'Sitting around the campfire gave their journey a truly memorable purpose.', 'نشستن دور آتش کمپ به سفر آن‌ها هدفی واقعاً به‌یادماندنی بخشید.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full')
ON CONFLICT (id) DO NOTHING;

INSERT INTO podcasts (id, title, description_fa, level, kind, series_id, episode_no, audio_url, audio_status, is_active, duration_seconds, position, vocabulary, scene_id)
VALUES (
    '40001000-0000-0000-0000-000800000003',
    'The Camping Trip (Unit 8)',
    'روایت جذاب و آموزش واژگان یونیت 8 (سفر کمپینگ) کتاب ۴۰۰۰ واژه ضروری',
    'beginner',
    'lesson',
    '40000000-0001-0000-0000-000000000001',
    8,
    '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3',
    'ready',
    TRUE,
    314,
    8,
    '[{"word": "accept", "meaning_fa": "پذیرفتن"}, {"word": "arrange", "meaning_fa": "ترتیب دادن و هماهنگ کردن"}, {"word": "attend", "meaning_fa": "شرکت کردن"}, {"word": "chase", "meaning_fa": "دنبال کردن"}, {"word": "contrast", "meaning_fa": "تضاد"}, {"word": "encourage", "meaning_fa": "تشویق کردن"}, {"word": "familiar", "meaning_fa": "آشنا"}, {"word": "grab", "meaning_fa": "قاپیدن و گرفتن"}, {"word": "hang", "meaning_fa": "آویزان کردن"}, {"word": "huge", "meaning_fa": "عظیم و بسیار بزرگ"}, {"word": "necessary", "meaning_fa": "ضروری"}, {"word": "pattern", "meaning_fa": "الگو"}, {"word": "propose", "meaning_fa": "پیشنهاد دادن"}, {"word": "purpose", "meaning_fa": "هدف"}, {"word": "release", "meaning_fa": "رها کردن"}, {"word": "require", "meaning_fa": "نیاز داشتن"}, {"word": "single", "meaning_fa": "تک یا مجرد"}, {"word": "success", "meaning_fa": "موفقیت"}, {"word": "tear", "meaning_fa": "اشک یا پاره کردن"}, {"word": "theory", "meaning_fa": "نظریه"}]'::jsonb,
    '40001000-0000-0000-0000-000800000001'
) ON CONFLICT (id) DO UPDATE SET scene_id = EXCLUDED.scene_id, vocabulary = EXCLUDED.vocabulary;

INSERT INTO podcast_lines (podcast_id, position, speaker, text, translation_fa, start_ms, end_ms)
VALUES
('40001000-0000-0000-0000-000800000003', 0, 'Alex', 'Welcome to Unit 8: The Camping Trip.', 'به یونیت هشتم خوش آمدید: سفر کمپینگ.', 0, 5000),
('40001000-0000-0000-0000-000800000003', 1, 'Sarah', 'Outdoor adventures require good arrangement and strong teamwork.', 'ماجراجویی در فضای باز نیازمند هماهنگی خوب و کار تیمی قوی است.', 5300, 12000),
('40001000-0000-0000-0000-000800000003', 2, 'Alex', 'The guide encouraged the campers, turning simple tasks into great successes.', 'راهنما کمپ‌کنندگان را تشویق کرد و کارهای ساده را به موفقیت‌های بزرگ تبدیل نمود.', 12400, 20500),
('40001000-0000-0000-0000-000800000003', 3, 'Sarah', 'Shadow these sentences to speak English naturally and confidently!', 'این جملات را شادو کنید تا انگلیسی را طبیعی و با اعتمادبه‌نفس صحبت کنید!', 20800, 27500)
ON CONFLICT DO NOTHING;

--------------------------------------------------------------------------------
-- کتاب اول - درس 9: The Ocean Rescue (یونیت 9)
--------------------------------------------------------------------------------
INSERT INTO scenes (id, title, description, background_image_url, difficulty, status, "order", category, is_custom)
VALUES (
    '40001000-0000-0000-0000-000900000001',
    'The Ocean Rescue (Unit 9)',
    'تمرین شادوئینگ واژگان ضروری یونیت 9 کتاب ۴۰۰۰ واژه: against, beach, damage, discover, emotion, fix, frank, identify...',
    '',
    'beginner',
    'published',
    109,
    'education',
    false
) ON CONFLICT (id) DO NOTHING;

INSERT INTO hotspots (id, scene_id, name, x_position, y_position, order_index)
VALUES (
    '40001000-0000-0000-0000-000900000002',
    '40001000-0000-0000-0000-000900000001',
    'Dialogue',
    50.0,
    50.0,
    1
) ON CONFLICT (id) DO NOTHING;

INSERT INTO dialogues (id, hotspot_id, "order", speaker, original_text, translation, audio_url, display_type)
VALUES
('40001000-0000-0000-0001-000900000001', '40001000-0000-0000-0000-000900000002', 1, 'customer', 'While walking along the sunny beach, Noah discovered a stranded dolphin.', 'در حین قدم زدن در ساحل آفتابی، نوآ یک دلفین به گل نشسته را کشف کرد.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full'),
('40001000-0000-0000-0001-000900000002', '40001000-0000-0000-0000-000900000002', 2, 'clerk', 'Strong ocean waves had pushed the animal against the sharp rocks.', 'امواج قوی اقیانوس حیوان را به سمت صخره‌های تیز رانده بودند.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full'),
('40001000-0000-0000-0001-000900000003', '40001000-0000-0000-0000-000900000002', 3, 'customer', 'He acted quickly to prevent serious damage and injury.', 'او به سرعت وارد عمل شد تا از آسیب و جراحت جدی جلوگیری کند.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full'),
('40001000-0000-0000-0001-000900000004', '40001000-0000-0000-0000-000900000002', 4, 'clerk', 'With pleasant teamwork, the rescuers saved the dolphin back into deep water.', 'با کار تیمی دلپذیر، امدادگران دلفین را نجات داده و به آب عمیق بازگرداندند.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full'),
('40001000-0000-0000-0001-000900000005', '40001000-0000-0000-0000-000900000002', 5, 'customer', 'Everyone felt pure emotion watching the creature swim freely away.', 'همه با تماشای شنای آزادانه دلفین احساسات پاکی را تجربه کردند.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full')
ON CONFLICT (id) DO NOTHING;

INSERT INTO podcasts (id, title, description_fa, level, kind, series_id, episode_no, audio_url, audio_status, is_active, duration_seconds, position, vocabulary, scene_id)
VALUES (
    '40001000-0000-0000-0000-000900000003',
    'The Ocean Rescue (Unit 9)',
    'روایت جذاب و آموزش واژگان یونیت 9 (نجات در اقیانوس) کتاب ۴۰۰۰ واژه ضروری',
    'beginner',
    'lesson',
    '40000000-0001-0000-0000-000000000001',
    9,
    '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3',
    'ready',
    TRUE,
    317,
    9,
    '[{"word": "against", "meaning_fa": "علیه یا در برابر"}, {"word": "beach", "meaning_fa": "ساحل"}, {"word": "damage", "meaning_fa": "آسیب زدن"}, {"word": "discover", "meaning_fa": "کشف کردن"}, {"word": "emotion", "meaning_fa": "احساس"}, {"word": "fix", "meaning_fa": "تعمیر کردن"}, {"word": "frank", "meaning_fa": "صادق و رک"}, {"word": "identify", "meaning_fa": "شناسایی کردن"}, {"word": "island", "meaning_fa": "جزیره"}, {"word": "ocean", "meaning_fa": "اقیانوس"}, {"word": "perhaps", "meaning_fa": "شاید"}, {"word": "pleasant", "meaning_fa": "دلپذیر و مطبوع"}, {"word": "prevent", "meaning_fa": "جلوگیری کردن"}, {"word": "rock", "meaning_fa": "صخره و سنگ"}, {"word": "save", "meaning_fa": "نجات دادن"}, {"word": "step", "meaning_fa": "قدم برداشتن"}, {"word": "still", "meaning_fa": "هنوز یا ساکن"}, {"word": "taste", "meaning_fa": "چشیدن یا سلیقه"}, {"word": "throw", "meaning_fa": "پرتاب کردن"}, {"word": "wave", "meaning_fa": "موج"}]'::jsonb,
    '40001000-0000-0000-0000-000900000001'
) ON CONFLICT (id) DO UPDATE SET scene_id = EXCLUDED.scene_id, vocabulary = EXCLUDED.vocabulary;

INSERT INTO podcast_lines (podcast_id, position, speaker, text, translation_fa, start_ms, end_ms)
VALUES
('40001000-0000-0000-0000-000900000003', 0, 'Alex', 'Welcome to Unit 9: The Ocean Rescue.', 'به یونیت نهم خوش آمدید: نجات در اقیانوس.', 0, 5000),
('40001000-0000-0000-0000-000900000003', 1, 'Sarah', 'Compassion and quick thinking can prevent disasters and save lives.', 'دلسوزی و تفکر سریع می‌تواند از فاجعه جلوگیری کرده و جان‌ها را نجات دهد.', 5300, 12500),
('40001000-0000-0000-0000-000900000003', 2, 'Alex', 'Noah noticed the danger on the rocky beach and organized an immediate rescue.', 'نوآ متوجه خطر در ساحل صخره‌ای شد و بلافاصله عملیات نجات را ترتیب داد.', 12800, 21000),
('40001000-0000-0000-0000-000900000003', 3, 'Sarah', 'Practice these vital action verbs in our shadowing player!', 'این افعال حرکتی حیاتی را در پخش‌کننده شادوئینگ تمرین کنید!', 21400, 28000)
ON CONFLICT DO NOTHING;

--------------------------------------------------------------------------------
-- کتاب اول - درس 10: The Guardian of the Forest (یونیت 10)
--------------------------------------------------------------------------------
INSERT INTO scenes (id, title, description, background_image_url, difficulty, status, "order", category, is_custom)
VALUES (
    '40001000-0000-0000-0000-001000000001',
    'The Guardian of the Forest (Unit 10)',
    'تمرین شادوئینگ واژگان ضروری یونیت 10 کتاب ۴۰۰۰ واژه: benefit, certain, chance, effect, essential, far, focus, function...',
    '',
    'beginner',
    'published',
    110,
    'education',
    false
) ON CONFLICT (id) DO NOTHING;

INSERT INTO hotspots (id, scene_id, name, x_position, y_position, order_index)
VALUES (
    '40001000-0000-0000-0000-001000000002',
    '40001000-0000-0000-0000-001000000001',
    'Dialogue',
    50.0,
    50.0,
    1
) ON CONFLICT (id) DO NOTHING;

INSERT INTO dialogues (id, hotspot_id, "order", speaker, original_text, translation, audio_url, display_type)
VALUES
('40001000-0000-0000-0001-001000000001', '40001000-0000-0000-0000-001000000002', 1, 'customer', 'Protecting ancient trees is essential for the health of our planet.', 'محافظت از درختان کهنسال برای سلامت سیاره ما بسیار ضروری است.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full'),
('40001000-0000-0000-0001-001000000002', '40001000-0000-0000-0000-001000000002', 2, 'clerk', 'Ranger David focuses his primary effort on guarding the nature reserve.', 'محیط‌بان دیوید تمرکز اصلی‌اش را بر نگهبانی از منطقه حفاظت‌شده معطوف کرده است.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full'),
('40001000-0000-0000-0001-001000000003', '40001000-0000-0000-0000-001000000002', 3, 'customer', 'He takes immediate action whenever wild animals face any trouble.', 'او هر زمان حیوانات وحشی با دردسری روبرو شوند اقدامی فوری انجام می‌دهد.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full'),
('40001000-0000-0000-0001-001000000004', '40001000-0000-0000-0000-001000000002', 4, 'clerk', 'All animals remain safe and rest peacefully across the green grass.', 'تمام حیوانات در امنیت باقی می‌مانند و با آرامش روی چمن‌های سبز استراحت می‌کنند.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full'),
('40001000-0000-0000-0001-001000000005', '40001000-0000-0000-0000-001000000002', 5, 'customer', 'The local community is very proud of this important conservation site.', 'جامعه محلی به این پایگاه مهم حفاظت از محیط زیست بسیار مفتخر است.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full')
ON CONFLICT (id) DO NOTHING;

INSERT INTO podcasts (id, title, description_fa, level, kind, series_id, episode_no, audio_url, audio_status, is_active, duration_seconds, position, vocabulary, scene_id)
VALUES (
    '40001000-0000-0000-0000-001000000003',
    'The Guardian of the Forest (Unit 10)',
    'روایت جذاب و آموزش واژگان یونیت 10 (نگهبان جنگل) کتاب ۴۰۰۰ واژه ضروری',
    'beginner',
    'lesson',
    '40000000-0001-0000-0000-000000000001',
    10,
    '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3',
    'ready',
    TRUE,
    320,
    10,
    '[{"word": "benefit", "meaning_fa": "فایده و منفعت"}, {"word": "certain", "meaning_fa": "مطمئن یا معین"}, {"word": "chance", "meaning_fa": "فرصت یا شانس"}, {"word": "effect", "meaning_fa": "اثر و نتیجه"}, {"word": "essential", "meaning_fa": "بسیار ضروری"}, {"word": "far", "meaning_fa": "دور"}, {"word": "focus", "meaning_fa": "تمرکز کردن"}, {"word": "function", "meaning_fa": "کارکرد و نقش"}, {"word": "grass", "meaning_fa": "چمن و علف"}, {"word": "guard", "meaning_fa": "نگهبانی دادن"}, {"word": "image", "meaning_fa": "تصویر"}, {"word": "immediate", "meaning_fa": "فوری"}, {"word": "primary", "meaning_fa": "اصلی و بنیادین"}, {"word": "proud", "meaning_fa": "مفتخر"}, {"word": "remain", "meaning_fa": "باقی ماندن"}, {"word": "rest", "meaning_fa": "استراحت کردن"}, {"word": "separate", "meaning_fa": "جدا کردن"}, {"word": "site", "meaning_fa": "محل یا مکان"}, {"word": "tail", "meaning_fa": "دم"}, {"word": "trouble", "meaning_fa": "به زحمت افتادن یا دردسر"}]'::jsonb,
    '40001000-0000-0000-0000-001000000001'
) ON CONFLICT (id) DO UPDATE SET scene_id = EXCLUDED.scene_id, vocabulary = EXCLUDED.vocabulary;

INSERT INTO podcast_lines (podcast_id, position, speaker, text, translation_fa, start_ms, end_ms)
VALUES
('40001000-0000-0000-0000-001000000003', 0, 'Alex', 'Welcome to Unit 10: The Guardian of the Forest.', 'به یونیت دهم خوش آمدید: نگهبان جنگل.', 0, 5000),
('40001000-0000-0000-0000-001000000003', 1, 'Sarah', 'We have reached our tenth milestone! Let''s celebrate these 200 essential words.', 'به نقطه عطف دهم رسیدیم! بیایید این ۲۰۰ واژه اساسی را جشن بگیریم.', 5300, 12500),
('40001000-0000-0000-0000-001000000003', 2, 'Alex', 'David explained why focus and conservation are essential for future generations.', 'دیوید توضیح داد چرا تمرکز و حفاظت برای نسل‌های آینده حیاتی است.', 12800, 21000),
('40001000-0000-0000-0000-001000000003', 3, 'Sarah', 'Keep your momentum going and let''s master every line together!', 'انرژی و حرکت خود را حفظ کنید تا همه جملات را با هم مسلط شویم!', 21400, 28000)
ON CONFLICT DO NOTHING;

--------------------------------------------------------------------------------
-- کتاب اول - درس 11: The River Crossing (یونیت 11)
--------------------------------------------------------------------------------
INSERT INTO scenes (id, title, description, background_image_url, difficulty, status, "order", category, is_custom)
VALUES (
    '40001000-0000-0000-0000-001100000001',
    'The River Crossing (Unit 11)',
    'تمرین شادوئینگ واژگان ضروری یونیت 11 کتاب ۴۰۰۰ واژه: anymore, asleep, berry, collect, compete, conversation, creature, decision...',
    '',
    'beginner',
    'published',
    111,
    'education',
    false
) ON CONFLICT (id) DO NOTHING;

INSERT INTO hotspots (id, scene_id, name, x_position, y_position, order_index)
VALUES (
    '40001000-0000-0000-0000-001100000002',
    '40001000-0000-0000-0000-001100000001',
    'Dialogue',
    50.0,
    50.0,
    1
) ON CONFLICT (id) DO NOTHING;

INSERT INTO dialogues (id, hotspot_id, "order", speaker, original_text, translation, audio_url, display_type)
VALUES
('40001000-0000-0000-0001-001100000001', '40001000-0000-0000-0000-001100000002', 1, 'customer', 'The travelers had a serious conversation about crossing the wide river.', 'مسافران گفتگوی جدی درباره عبور از رودخانه پهناور داشتند.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full'),
('40001000-0000-0000-0001-001100000002', '40001000-0000-0000-0000-001100000002', 2, 'clerk', 'They prepared a solid raft using logs collected from the forest ground.', 'آن‌ها با استفاده از الوارهایی که از زمین جنگل جمع کردند، کلکی محکم آماده ساختند.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full'),
('40001000-0000-0000-0001-001100000003', '40001000-0000-0000-0000-001100000002', 3, 'customer', 'Making a wise decision allowed them to sail across safely.', 'گرفتن تصمیمی هوشمندانه به آن‌ها اجازه داد با امنیت به آن سوی آب بروند.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full'),
('40001000-0000-0000-0001-001100000004', '40001000-0000-0000-0000-001100000002', 4, 'clerk', 'No one felt afraid anymore once they reached the calm shore.', 'به محض اینکه به ساحل آرام رسیدند دیگر هیچ‌کس احساس ترس نمی‌کرد.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full'),
('40001000-0000-0000-0001-001100000005', '40001000-0000-0000-0000-001100000002', 5, 'customer', 'They spent the evening resting peacefully under the tall trees.', 'آن‌ها عصر را با آرامش به استراحت زیر درختان بلند سپری کردند.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full')
ON CONFLICT (id) DO NOTHING;

INSERT INTO podcasts (id, title, description_fa, level, kind, series_id, episode_no, audio_url, audio_status, is_active, duration_seconds, position, vocabulary, scene_id)
VALUES (
    '40001000-0000-0000-0000-001100000003',
    'The River Crossing (Unit 11)',
    'روایت جذاب و آموزش واژگان یونیت 11 (عبور از رودخانه خروشان) کتاب ۴۰۰۰ واژه ضروری',
    'beginner',
    'lesson',
    '40000000-0001-0000-0000-000000000001',
    11,
    '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3',
    'ready',
    TRUE,
    323,
    11,
    '[{"word": "anymore", "meaning_fa": "دیگر"}, {"word": "asleep", "meaning_fa": "خوابیده"}, {"word": "berry", "meaning_fa": "توت"}, {"word": "collect", "meaning_fa": "جمع‌آوری کردن"}, {"word": "compete", "meaning_fa": "رقابت کردن"}, {"word": "conversation", "meaning_fa": "گفتگو"}, {"word": "creature", "meaning_fa": "موجود زنده"}, {"word": "decision", "meaning_fa": "تصمیم"}, {"word": "either", "meaning_fa": "یا / هر کدام"}, {"word": "forest", "meaning_fa": "جنگل"}, {"word": "ground", "meaning_fa": "زمین"}, {"word": "introduce", "meaning_fa": "معرفی کردن"}, {"word": "marry", "meaning_fa": "ازدواج کردن"}, {"word": "prepare", "meaning_fa": "آماده کردن"}, {"word": "sail", "meaning_fa": "بادبان کشیدن یا قایق‌سواری"}, {"word": "serious", "meaning_fa": "جدی"}, {"word": "spend", "meaning_fa": "صرف کردن زمان یا پول"}, {"word": "strange", "meaning_fa": "عجیب"}, {"word": "truth", "meaning_fa": "حقیقت"}, {"word": "wake", "meaning_fa": "بیدار شدن"}]'::jsonb,
    '40001000-0000-0000-0000-001100000001'
) ON CONFLICT (id) DO UPDATE SET scene_id = EXCLUDED.scene_id, vocabulary = EXCLUDED.vocabulary;

INSERT INTO podcast_lines (podcast_id, position, speaker, text, translation_fa, start_ms, end_ms)
VALUES
('40001000-0000-0000-0000-001100000003', 0, 'Alex', 'Welcome to Unit 11: The River Crossing.', 'به یونیت یازدهم خوش آمدید: عبور از رودخانه.', 0, 5000),
('40001000-0000-0000-0000-001100000003', 1, 'Sarah', 'Good preparation turns risky situations into safe adventures.', 'آمادگی مناسب موقعیت‌های پرخطر را به ماجراجویی‌های ایمن بدل می‌کند.', 5300, 12000),
('40001000-0000-0000-0000-001100000003', 2, 'Alex', 'The travelers collected wood and made a wise decision to cross the river.', 'مسافران چوب جمع کردند و تصمیمی عاقلانه برای عبور از رودخانه گرفتند.', 12400, 20500),
('40001000-0000-0000-0000-001100000003', 3, 'Sarah', 'Practice your conversational timing with native speech in shadowing!', 'زمان‌بندی مکالمه خود را با گفتار نیتیو در شادوئینگ هماهنگ کنید!', 20800, 28000)
ON CONFLICT DO NOTHING;

--------------------------------------------------------------------------------
-- کتاب اول - درس 12: The Village Bakery (یونیت 12)
--------------------------------------------------------------------------------
INSERT INTO scenes (id, title, description, background_image_url, difficulty, status, "order", category, is_custom)
VALUES (
    '40001000-0000-0000-0000-001200000001',
    'The Village Bakery (Unit 12)',
    'تمرین شادوئینگ واژگان ضروری یونیت 12 کتاب ۴۰۰۰ واژه: alone, apartment, article, artist, attitude, compare, judge, magazine...',
    '',
    'beginner',
    'published',
    112,
    'education',
    false
) ON CONFLICT (id) DO NOTHING;

INSERT INTO hotspots (id, scene_id, name, x_position, y_position, order_index)
VALUES (
    '40001000-0000-0000-0000-001200000002',
    '40001000-0000-0000-0000-001200000001',
    'Dialogue',
    50.0,
    50.0,
    1
) ON CONFLICT (id) DO NOTHING;

INSERT INTO dialogues (id, hotspot_id, "order", speaker, original_text, translation, audio_url, display_type)
VALUES
('40001000-0000-0000-0001-001200000001', '40001000-0000-0000-0000-001200000002', 1, 'customer', 'Marco is a professional baker with a wonderfully positive attitude.', 'مارکو نانوایی حرفه‌ای با نگرشی فوق‌العاده مثبت است.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full'),
('40001000-0000-0000-0001-001200000002', '40001000-0000-0000-0000-001200000002', 2, 'clerk', 'He uses quality ingredients to bake fresh bread for every neighbor.', 'او از مواد اولیه باکیفیت برای پخت نان تازه برای همه همسایگان استفاده می‌کند.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full'),
('40001000-0000-0000-0001-001200000003', '40001000-0000-0000-0000-001200000002', 3, 'customer', 'Customers compare his delicious recipes to works of an artist.', 'مشتریان دستورپخت‌های خوشمزه او را با آثار یک هنرمند مقایسه می‌کنند.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full'),
('40001000-0000-0000-0001-001200000004', '40001000-0000-0000-0000-001200000002', 4, 'clerk', 'His bakery has become a beloved symbol of warmth in the community.', 'نانوایی او به نمادی دوست‌داشتنی از صمیمیت در محله تبدیل شده است.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full'),
('40001000-0000-0000-0001-001200000005', '40001000-0000-0000-0000-001200000002', 5, 'customer', 'People enjoy gathering in the cozy space for a morning meal.', 'مردم از دور هم جمع شدن در این فضای دنج برای یک وعده صبحگاهی لذت می‌برند.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full')
ON CONFLICT (id) DO NOTHING;

INSERT INTO podcasts (id, title, description_fa, level, kind, series_id, episode_no, audio_url, audio_status, is_active, duration_seconds, position, vocabulary, scene_id)
VALUES (
    '40001000-0000-0000-0000-001200000003',
    'The Village Bakery (Unit 12)',
    'روایت جذاب و آموزش واژگان یونیت 12 (نانوایی محله) کتاب ۴۰۰۰ واژه ضروری',
    'beginner',
    'lesson',
    '40000000-0001-0000-0000-000000000001',
    12,
    '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3',
    'ready',
    TRUE,
    326,
    12,
    '[{"word": "alone", "meaning_fa": "تنها"}, {"word": "apartment", "meaning_fa": "آپارتمان"}, {"word": "article", "meaning_fa": "مقاله یا کالا"}, {"word": "artist", "meaning_fa": "هنرمند"}, {"word": "attitude", "meaning_fa": "نگرش و رویکرد"}, {"word": "compare", "meaning_fa": "مقایسه کردن"}, {"word": "judge", "meaning_fa": "قضاوت کردن"}, {"word": "magazine", "meaning_fa": "مجله"}, {"word": "material", "meaning_fa": "ماده و مصالح"}, {"word": "meal", "meaning_fa": "وعده غذایی"}, {"word": "method", "meaning_fa": "روش"}, {"word": "neighbor", "meaning_fa": "همسایه"}, {"word": "professional", "meaning_fa": "حرفه‌ای"}, {"word": "profit", "meaning_fa": "سود"}, {"word": "quality", "meaning_fa": "کیفیت"}, {"word": "shape", "meaning_fa": "شکل"}, {"word": "space", "meaning_fa": "فضا"}, {"word": "stair", "meaning_fa": "پله"}, {"word": "symbol", "meaning_fa": "نماد"}, {"word": "thin", "meaning_fa": "نازک"}]'::jsonb,
    '40001000-0000-0000-0000-001200000001'
) ON CONFLICT (id) DO UPDATE SET scene_id = EXCLUDED.scene_id, vocabulary = EXCLUDED.vocabulary;

INSERT INTO podcast_lines (podcast_id, position, speaker, text, translation_fa, start_ms, end_ms)
VALUES
('40001000-0000-0000-0000-001200000003', 0, 'Alex', 'Welcome to Unit 12: The Village Bakery.', 'به یونیت دوازدهم خوش آمدید: نانوایی محله.', 0, 5000),
('40001000-0000-0000-0000-001200000003', 1, 'Sarah', 'A positive attitude and dedication to quality create great communities.', 'نگرش مثبت و توجه به کیفیت، جوامع عالی را شکل می‌دهد.', 5300, 12000),
('40001000-0000-0000-0000-001200000003', 2, 'Alex', 'Marco treats baking as an art form, bringing joy to all his neighbors.', 'مارکو نانوایی را مثل یک هنر می‌بیند و شادی را به همه همسایگان هدیه می‌دهد.', 12400, 20500),
('40001000-0000-0000-0000-001200000003', 3, 'Sarah', 'Listen to how native speakers pronounce ''professional'' and ''attitude''!', 'به نحوه تلفظ واژگان ''حرفه‌ای'' و ''نگرش'' توسط گویندگان نیتیو دقت کنید!', 20800, 28000)
ON CONFLICT DO NOTHING;

--------------------------------------------------------------------------------
-- کتاب اول - درس 13: The Harvest Feast (یونیت 13)
--------------------------------------------------------------------------------
INSERT INTO scenes (id, title, description, background_image_url, difficulty, status, "order", category, is_custom)
VALUES (
    '40001000-0000-0000-0000-001300000001',
    'The Harvest Feast (Unit 13)',
    'تمرین شادوئینگ واژگان ضروری یونیت 13 کتاب ۴۰۰۰ واژه: blood, burn, cell, contain, correct, crop, demand, equal...',
    '',
    'beginner',
    'published',
    113,
    'education',
    false
) ON CONFLICT (id) DO NOTHING;

INSERT INTO hotspots (id, scene_id, name, x_position, y_position, order_index)
VALUES (
    '40001000-0000-0000-0000-001300000002',
    '40001000-0000-0000-0000-001300000001',
    'Dialogue',
    50.0,
    50.0,
    1
) ON CONFLICT (id) DO NOTHING;

INSERT INTO dialogues (id, hotspot_id, "order", speaker, original_text, translation, audio_url, display_type)
VALUES
('40001000-0000-0000-0001-001300000001', '40001000-0000-0000-0000-001300000002', 1, 'customer', 'The farmers were responsible for raising healthy crops this season.', 'کشاورزان مسئول پرورش محصولات سالم در این فصل بودند.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full'),
('40001000-0000-0000-0001-001300000002', '40001000-0000-0000-0000-001300000002', 2, 'clerk', 'A steady increase in rain provided plenty of water for the fields.', 'افزایش مداوم باران آب فراوانی برای مزارع تامین کرد.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full'),
('40001000-0000-0000-0001-001300000003', '40001000-0000-0000-0000-001300000002', 3, 'customer', 'The rich harvest was enough to feed the whole village.', 'محصول پربار برای سیر کردن تمام اهالی روستا کافی بود.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full'),
('40001000-0000-0000-0001-001300000004', '40001000-0000-0000-0000-001300000002', 4, 'clerk', 'They shared equal portions in a spirit of true fairness and joy.', 'آن‌ها سهم‌های برابری را با روحیه انصاف و شادی واقعی تقسیم کردند.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full'),
('40001000-0000-0000-0001-001300000005', '40001000-0000-0000-0000-001300000002', 5, 'customer', 'The celebration site was filled with music and wonderful sights.', 'محل جشن پر از موسیقی و منظره‌های فوق‌العاده بود.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full')
ON CONFLICT (id) DO NOTHING;

INSERT INTO podcasts (id, title, description_fa, level, kind, series_id, episode_no, audio_url, audio_status, is_active, duration_seconds, position, vocabulary, scene_id)
VALUES (
    '40001000-0000-0000-0000-001300000003',
    'The Harvest Feast (Unit 13)',
    'روایت جذاب و آموزش واژگان یونیت 13 (جشن برداشت محصول) کتاب ۴۰۰۰ واژه ضروری',
    'beginner',
    'lesson',
    '40000000-0001-0000-0000-000000000001',
    13,
    '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3',
    'ready',
    TRUE,
    329,
    13,
    '[{"word": "blood", "meaning_fa": "خون"}, {"word": "burn", "meaning_fa": "سوزاندن"}, {"word": "cell", "meaning_fa": "سلول"}, {"word": "contain", "meaning_fa": "شامل بودن"}, {"word": "correct", "meaning_fa": "درست"}, {"word": "crop", "meaning_fa": "محصول کشاورزی"}, {"word": "demand", "meaning_fa": "تقاضا داشتن"}, {"word": "equal", "meaning_fa": "برابر"}, {"word": "feed", "meaning_fa": "غذا دادن"}, {"word": "hole", "meaning_fa": "سوراخ یا گودال"}, {"word": "increase", "meaning_fa": "افزایش یافتن"}, {"word": "lord", "meaning_fa": "ارباب یا حاکم"}, {"word": "owe", "meaning_fa": "بدهکار بودن"}, {"word": "position", "meaning_fa": "موقعیت"}, {"word": "raise", "meaning_fa": "بالا بردن یا پرورش دادن"}, {"word": "responsible", "meaning_fa": "مسئولیت‌پذیر"}, {"word": "sight", "meaning_fa": "دید و منظره"}, {"word": "spot", "meaning_fa": "نقطه یا مکان"}, {"word": "structure", "meaning_fa": "ساختار"}, {"word": "whole", "meaning_fa": "کامل و تمام"}]'::jsonb,
    '40001000-0000-0000-0000-001300000001'
) ON CONFLICT (id) DO UPDATE SET scene_id = EXCLUDED.scene_id, vocabulary = EXCLUDED.vocabulary;

INSERT INTO podcast_lines (podcast_id, position, speaker, text, translation_fa, start_ms, end_ms)
VALUES
('40001000-0000-0000-0000-001300000003', 0, 'Alex', 'Welcome to Unit 13: The Harvest Feast.', 'به یونیت سیزدهم خوش آمدید: جشن برداشت محصول.', 0, 5000),
('40001000-0000-0000-0000-001300000003', 1, 'Sarah', 'Responsibility and teamwork yield rewards that benefit everyone.', 'مسئولیت‌پذیری و کار تیمی پاداش‌هایی به بار می‌آورد که به نفع همگان است.', 5300, 12000),
('40001000-0000-0000-0000-001300000003', 2, 'Alex', 'The farmers celebrated their increased crops and shared with the whole village.', 'کشاورزان افزایش محصولاتشان را جشن گرفتند و با تمام روستا شریک شدند.', 12400, 20500),
('40001000-0000-0000-0000-001300000003', 3, 'Sarah', 'Use these core verbs in your shadowing drills to boost your fluency!', 'این افعال اصلی را در تمرینات شادوئینگ خود به کار ببرید تا روان‌تر صحبت کنید!', 20800, 28000)
ON CONFLICT DO NOTHING;

--------------------------------------------------------------------------------
-- کتاب اول - درس 14: The Young Inventor (یونیت 14)
--------------------------------------------------------------------------------
INSERT INTO scenes (id, title, description, background_image_url, difficulty, status, "order", category, is_custom)
VALUES (
    '40001000-0000-0000-0000-001400000001',
    'The Young Inventor (Unit 14)',
    'تمرین شادوئینگ واژگان ضروری یونیت 14 کتاب ۴۰۰۰ واژه: coach, control, description, direct, exam, example, limit, local...',
    '',
    'beginner',
    'published',
    114,
    'education',
    false
) ON CONFLICT (id) DO NOTHING;

INSERT INTO hotspots (id, scene_id, name, x_position, y_position, order_index)
VALUES (
    '40001000-0000-0000-0000-001400000002',
    '40001000-0000-0000-0000-001400000001',
    'Dialogue',
    50.0,
    50.0,
    1
) ON CONFLICT (id) DO NOTHING;

INSERT INTO dialogues (id, hotspot_id, "order", speaker, original_text, translation, audio_url, display_type)
VALUES
('40001000-0000-0000-0001-001400000001', '40001000-0000-0000-0000-001400000002', 1, 'customer', 'Sophia developed a novel device using modern smart technology.', 'سوفیا با استفاده از فناوری نوین هوشمند دستگاه جدیدی ساخت.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full'),
('40001000-0000-0000-0001-001400000002', '40001000-0000-0000-0000-001400000002', 2, 'clerk', 'Her science coach helped her outline the direct steps for the exam.', 'مربی علوم به او کمک کرد تا مراحل مستقیم آزمون را طرح‌ریزی کند.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full'),
('40001000-0000-0000-0001-001400000003', '40001000-0000-0000-0000-001400000002', 3, 'customer', 'She printed a clear description of how the system controls energy.', 'او شرح روشنی از نحوه کنترل انرژی توسط سیستم چاپ کرد.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full'),
('40001000-0000-0000-0001-001400000004', '40001000-0000-0000-0000-001400000002', 4, 'clerk', 'There was no limit to what her determination could achieve.', 'هیچ محدودیتی برای آنچه اراده او می‌توانست محقق کند وجود نداشت.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full'),
('40001000-0000-0000-0001-001400000005', '40001000-0000-0000-0000-001400000002', 5, 'customer', 'The local school praised her invention as an inspiring example.', 'مدرسه محلی از اختراع او به عنوان یک نمونه الهام‌بخش تقدیر کرد.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full')
ON CONFLICT (id) DO NOTHING;

INSERT INTO podcasts (id, title, description_fa, level, kind, series_id, episode_no, audio_url, audio_status, is_active, duration_seconds, position, vocabulary, scene_id)
VALUES (
    '40001000-0000-0000-0000-001400000003',
    'The Young Inventor (Unit 14)',
    'روایت جذاب و آموزش واژگان یونیت 14 (مخترع جوان) کتاب ۴۰۰۰ واژه ضروری',
    'beginner',
    'lesson',
    '40000000-0001-0000-0000-000000000001',
    14,
    '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3',
    'ready',
    TRUE,
    332,
    14,
    '[{"word": "coach", "meaning_fa": "مربی"}, {"word": "control", "meaning_fa": "کنترل کردن"}, {"word": "description", "meaning_fa": "توضیح و شرح"}, {"word": "direct", "meaning_fa": "مستقیم"}, {"word": "exam", "meaning_fa": "امتحان"}, {"word": "example", "meaning_fa": "مثال"}, {"word": "limit", "meaning_fa": "محدودیت"}, {"word": "local", "meaning_fa": "محلی"}, {"word": "magical", "meaning_fa": "جادویی"}, {"word": "mail", "meaning_fa": "نامه یا پست"}, {"word": "novel", "meaning_fa": "رمان یا نوین"}, {"word": "outline", "meaning_fa": "طرح کلی"}, {"word": "poet", "meaning_fa": "شاعر"}, {"word": "print", "meaning_fa": "چاپ کردن"}, {"word": "scene", "meaning_fa": "صحنه"}, {"word": "sheet", "meaning_fa": "برگه"}, {"word": "silly", "meaning_fa": "احمقانه یا مسخره"}, {"word": "store", "meaning_fa": "فروشگاه یا ذخیره کردن"}, {"word": "suffer", "meaning_fa": "رنج بردن"}, {"word": "technology", "meaning_fa": "فناوری و تکنولوژی"}]'::jsonb,
    '40001000-0000-0000-0000-001400000001'
) ON CONFLICT (id) DO UPDATE SET scene_id = EXCLUDED.scene_id, vocabulary = EXCLUDED.vocabulary;

INSERT INTO podcast_lines (podcast_id, position, speaker, text, translation_fa, start_ms, end_ms)
VALUES
('40001000-0000-0000-0000-001400000003', 0, 'Alex', 'Welcome to Unit 14: The Young Inventor.', 'به یونیت چهاردهم خوش آمدید: مخترع جوان.', 0, 5000),
('40001000-0000-0000-0000-001400000003', 1, 'Sarah', 'Innovation begins when curiosity meets guided practice and coaching.', 'نوآوری زمانی آغاز می‌شود که کنجکاوی با تمرین هدایت‌شده و مربیگری همراه شود.', 5300, 12000),
('40001000-0000-0000-0000-001400000003', 2, 'Alex', 'Sophia used technology to solve real problems without setting any limits.', 'سوفیا از فناوری برای حل مسائل واقعی بدون تعیین هیچ محدودیتی استفاده کرد.', 12400, 20500),
('40001000-0000-0000-0000-001400000003', 3, 'Sarah', 'Practice your sentence rhythm by mimicking our speakers line by line!', 'ریتم جملاتتان را با تقلید خط به خط گویندگان ما تقویت کنید!', 20800, 28000)
ON CONFLICT DO NOTHING;

--------------------------------------------------------------------------------
-- کتاب اول - درس 15: The Mountain Marathon (یونیت 15)
--------------------------------------------------------------------------------
INSERT INTO scenes (id, title, description, background_image_url, difficulty, status, "order", category, is_custom)
VALUES (
    '40001000-0000-0000-0000-001500000001',
    'The Mountain Marathon (Unit 15)',
    'تمرین شادوئینگ واژگان ضروری یونیت 15 کتاب ۴۰۰۰ واژه: across, breathe, characteristic, consume, excite, extreme, fear, fortunate...',
    '',
    'beginner',
    'published',
    115,
    'education',
    false
) ON CONFLICT (id) DO NOTHING;

INSERT INTO hotspots (id, scene_id, name, x_position, y_position, order_index)
VALUES (
    '40001000-0000-0000-0000-001500000002',
    '40001000-0000-0000-0000-001500000001',
    'Dialogue',
    50.0,
    50.0,
    1
) ON CONFLICT (id) DO NOTHING;

INSERT INTO dialogues (id, hotspot_id, "order", speaker, original_text, translation, audio_url, display_type)
VALUES
('40001000-0000-0000-0001-001500000001', '40001000-0000-0000-0000-001500000002', 1, 'customer', 'Lucas embraced the exciting opportunity to run in the mountain race.', 'لوکاس از فرصت هیجان‌انگیز دویدن در مسابقه کوهستانی استقبال کرد.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full'),
('40001000-0000-0000-0001-001500000002', '40001000-0000-0000-0000-001500000002', 2, 'clerk', 'He learned to breathe steadily despite the extreme cold weather.', 'او یاد گرفت با وجود سرمای بسیار شدید، به شکلی منظم نفس بکشد.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full'),
('40001000-0000-0000-0001-001500000003', '40001000-0000-0000-0000-001500000002', 3, 'customer', 'He realized that overcoming internal fear was his greatest victory.', 'او پی برد که غلبه بر ترس درونی بزرگ‌ترین پیروزی او بوده است.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full'),
('40001000-0000-0000-0001-001500000004', '40001000-0000-0000-0000-001500000002', 4, 'clerk', 'Running across the full length of the trail earned him the top prize.', 'دویدن در سراسر طول مسیر جایزه برتر را برای او به ارمغان آورد.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full'),
('40001000-0000-0000-0001-001500000005', '40001000-0000-0000-0000-001500000002', 5, 'customer', 'Spectators observed his courageous finish with deep admiration.', 'تماشاگران پایان شجاعانه او را با تحسین عمیق نظاره کردند.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full')
ON CONFLICT (id) DO NOTHING;

INSERT INTO podcasts (id, title, description_fa, level, kind, series_id, episode_no, audio_url, audio_status, is_active, duration_seconds, position, vocabulary, scene_id)
VALUES (
    '40001000-0000-0000-0000-001500000003',
    'The Mountain Marathon (Unit 15)',
    'روایت جذاب و آموزش واژگان یونیت 15 (ماراتن کوهستان) کتاب ۴۰۰۰ واژه ضروری',
    'beginner',
    'lesson',
    '40000000-0001-0000-0000-000000000001',
    15,
    '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3',
    'ready',
    TRUE,
    335,
    15,
    '[{"word": "across", "meaning_fa": "آن سوی یا در سراسر"}, {"word": "breathe", "meaning_fa": "نفس کشیدن"}, {"word": "characteristic", "meaning_fa": "ویژگی و خصیصه"}, {"word": "consume", "meaning_fa": "مصرف کردن"}, {"word": "excite", "meaning_fa": "به هیجان آوردن"}, {"word": "extreme", "meaning_fa": "بسیار شدید"}, {"word": "fear", "meaning_fa": "ترس"}, {"word": "fortunate", "meaning_fa": "خوش‌شانس"}, {"word": "happen", "meaning_fa": "اتفاق افتادن"}, {"word": "length", "meaning_fa": "طول و مسافت"}, {"word": "mistake", "meaning_fa": "اشتباه"}, {"word": "observe", "meaning_fa": "مشاهده کردن"}, {"word": "opportunity", "meaning_fa": "فرصت"}, {"word": "prize", "meaning_fa": "جایزه"}, {"word": "race", "meaning_fa": "مسابقه"}, {"word": "realize", "meaning_fa": "متوجه شدن و پی بردن"}, {"word": "respond", "meaning_fa": "پاسخ دادن"}, {"word": "risk", "meaning_fa": "خطر"}, {"word": "wonder", "meaning_fa": "شگفت‌زده شدن"}, {"word": "yet", "meaning_fa": "هنوز یا با این حال"}]'::jsonb,
    '40001000-0000-0000-0000-001500000001'
) ON CONFLICT (id) DO UPDATE SET scene_id = EXCLUDED.scene_id, vocabulary = EXCLUDED.vocabulary;

INSERT INTO podcast_lines (podcast_id, position, speaker, text, translation_fa, start_ms, end_ms)
VALUES
('40001000-0000-0000-0000-001500000003', 0, 'Alex', 'Welcome to Unit 15: The Mountain Marathon.', 'به یونیت پانزدهم خوش آمدید: ماراتن کوهستان.', 0, 5000),
('40001000-0000-0000-0000-001500000003', 1, 'Sarah', 'Pushing past extreme challenges reveals our true inner characteristics.', 'عبور از چالش‌های شدید ویژگی‌های واقعی درونی ما را آشکار می‌سازد.', 5300, 12000),
('40001000-0000-0000-0000-001500000003', 2, 'Alex', 'Lucas controlled his breathing and turned a big risk into an opportunity.', 'لوکاس تنفس خود را کنترل کرد و ریسکی بزرگ را به یک فرصت بدل ساخت.', 12400, 20500),
('40001000-0000-0000-0000-001500000003', 3, 'Sarah', 'Let''s shadow these lines to build real stamina in speaking English!', 'بیایید این جملات را شادو کنیم تا استقامت واقعی در مکالمه انگلیسی بسازیم!', 20800, 28000)
ON CONFLICT DO NOTHING;

--------------------------------------------------------------------------------
-- کتاب اول - درس 16: The Historic Theater (یونیت 16)
--------------------------------------------------------------------------------
INSERT INTO scenes (id, title, description, background_image_url, difficulty, status, "order", category, is_custom)
VALUES (
    '40001000-0000-0000-0000-001600000001',
    'The Historic Theater (Unit 16)',
    'تمرین شادوئینگ واژگان ضروری یونیت 16 کتاب ۴۰۰۰ واژه: academy, ancient, board, century, clue, concert, county, dictionary...',
    '',
    'beginner',
    'published',
    116,
    'education',
    false
) ON CONFLICT (id) DO NOTHING;

INSERT INTO hotspots (id, scene_id, name, x_position, y_position, order_index)
VALUES (
    '40001000-0000-0000-0000-001600000002',
    '40001000-0000-0000-0000-001600000001',
    'Dialogue',
    50.0,
    50.0,
    1
) ON CONFLICT (id) DO NOTHING;

INSERT INTO dialogues (id, hotspot_id, "order", speaker, original_text, translation, audio_url, display_type)
VALUES
('40001000-0000-0000-0001-001600000001', '40001000-0000-0000-0000-001600000002', 1, 'customer', 'The historic theater was built more than a century ago.', 'این تئاتر تاریخی بیش از یک قرن پیش ساخته شده بود.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full'),
('40001000-0000-0000-0001-001600000002', '40001000-0000-0000-0000-001600000002', 2, 'clerk', 'Architects studied original documents to restore its ancient beauty.', 'معماران اسناد اولیه را مطالعه کردند تا زیبایی کهن آن را احیا کنند.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full'),
('40001000-0000-0000-0001-001600000003', '40001000-0000-0000-0000-001600000002', 3, 'customer', 'They discovered a hidden room filled with cultural treasures.', 'آن‌ها اتاقی پنهان پر از گنجینه‌های فرهنگی کشف کردند.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full'),
('40001000-0000-0000-0001-001600000004', '40001000-0000-0000-0000-001600000002', 4, 'clerk', 'A famous music academy arranged a grand concert on the main stage.', 'یک آکادمی موسیقی مشهور کنسرتی باشکوه روی صحنه اصلی ترتیب داد.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full'),
('40001000-0000-0000-0001-001600000005', '40001000-0000-0000-0000-001600000002', 5, 'customer', 'The entire county celebrated the cultural wealth of their city.', 'تمام شهرستان ثروت فرهنگی شهر خود را جشن گرفتند.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full')
ON CONFLICT (id) DO NOTHING;

INSERT INTO podcasts (id, title, description_fa, level, kind, series_id, episode_no, audio_url, audio_status, is_active, duration_seconds, position, vocabulary, scene_id)
VALUES (
    '40001000-0000-0000-0000-001600000003',
    'The Historic Theater (Unit 16)',
    'روایت جذاب و آموزش واژگان یونیت 16 (تئاتر تاریخی شهر) کتاب ۴۰۰۰ واژه ضروری',
    'beginner',
    'lesson',
    '40000000-0001-0000-0000-000000000001',
    16,
    '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3',
    'ready',
    TRUE,
    338,
    16,
    '[{"word": "academy", "meaning_fa": "آکادمی یا فرهنگستان"}, {"word": "ancient", "meaning_fa": "باستانی و بسیار کهن"}, {"word": "board", "meaning_fa": "تخته یا هیئت مدیره"}, {"word": "century", "meaning_fa": "قرن"}, {"word": "clue", "meaning_fa": "سرنخ"}, {"word": "concert", "meaning_fa": "کنسرت"}, {"word": "county", "meaning_fa": "شهرستان"}, {"word": "dictionary", "meaning_fa": "فرهنگ لغت"}, {"word": "exist", "meaning_fa": "وجود داشتن"}, {"word": "flat", "meaning_fa": "مسطح یا آپارتمان"}, {"word": "gentleman", "meaning_fa": "آقای محترم"}, {"word": "hidden", "meaning_fa": "پنهان"}, {"word": "maybe", "meaning_fa": "شاید"}, {"word": "officer", "meaning_fa": "افسر یا مسئول"}, {"word": "original", "meaning_fa": "اصلی و اولیه"}, {"word": "pound", "meaning_fa": "پوند یا کوبیدن"}, {"word": "process", "meaning_fa": "فرایند"}, {"word": "publish", "meaning_fa": "منتشر کردن"}, {"word": "theater", "meaning_fa": "تئاتر و تماشاخانه"}, {"word": "wealth", "meaning_fa": "ثروت"}]'::jsonb,
    '40001000-0000-0000-0000-001600000001'
) ON CONFLICT (id) DO UPDATE SET scene_id = EXCLUDED.scene_id, vocabulary = EXCLUDED.vocabulary;

INSERT INTO podcast_lines (podcast_id, position, speaker, text, translation_fa, start_ms, end_ms)
VALUES
('40001000-0000-0000-0000-001600000003', 0, 'Alex', 'Welcome to Unit 16: The Historic Theater.', 'به یونیت شانزدهم خوش آمدید: تئاتر تاریخی.', 0, 5000),
('40001000-0000-0000-0000-001600000003', 1, 'Sarah', 'Preserving ancient culture enriches the life of the whole community.', 'حفظ فرهنگ کهن زندگی تمام جامعه را پربارتر می‌سازد.', 5300, 12000),
('40001000-0000-0000-0000-001600000003', 2, 'Alex', 'The renovation process revealed hidden treasures from the previous century.', 'فرایند بازسازی گنجینه‌های پنهانی از قرن گذشته را آشکار ساخت.', 12400, 20500),
('40001000-0000-0000-0000-001600000003', 3, 'Sarah', 'Practice your academic and descriptive vocabulary in the shadowing player!', 'واژگان توصیفی و آکادمیک خود را در پخش‌کننده شادوئینگ تمرین کنید!', 20800, 28000)
ON CONFLICT DO NOTHING;

--------------------------------------------------------------------------------
-- کتاب اول - درس 17: The Cultural Gathering (یونیت 17)
--------------------------------------------------------------------------------
INSERT INTO scenes (id, title, description, background_image_url, difficulty, status, "order", category, is_custom)
VALUES (
    '40001000-0000-0000-0000-001700000001',
    'The Cultural Gathering (Unit 17)',
    'تمرین شادوئینگ واژگان ضروری یونیت 17 کتاب ۴۰۰۰ واژه: admire, behavior, boast, culture, detail, expect, gathering, glance...',
    '',
    'beginner',
    'published',
    117,
    'education',
    false
) ON CONFLICT (id) DO NOTHING;

INSERT INTO hotspots (id, scene_id, name, x_position, y_position, order_index)
VALUES (
    '40001000-0000-0000-0000-001700000002',
    '40001000-0000-0000-0000-001700000001',
    'Dialogue',
    50.0,
    50.0,
    1
) ON CONFLICT (id) DO NOTHING;

INSERT INTO dialogues (id, hotspot_id, "order", speaker, original_text, translation, audio_url, display_type)
VALUES
('40001000-0000-0000-0001-001700000001', '40001000-0000-0000-0000-001700000002', 1, 'customer', 'The gracious hosts welcomed each guest with warm hospitality.', 'میزبانان گرانقدر با مهمان‌نوازی گرم به هر مهمان خوش‌آمد گفتند.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full'),
('40001000-0000-0000-0001-001700000002', '40001000-0000-0000-0000-001700000002', 2, 'clerk', 'They served traditional dishes representing their unique family culture.', 'آن‌ها غذاهای سنتی‌ای سرو کردند که نمایانگر فرهنگ خانوادگی منحصربه‌فردشان بود.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full'),
('40001000-0000-0000-0001-001700000003', '40001000-0000-0000-0000-001700000002', 3, 'customer', 'Guests admired the polite behavior and attention to every detail.', 'مهمانان رفتار مودبانه و توجه به تک‌تک جزئیات را تحسین کردند.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full'),
('40001000-0000-0000-0001-001700000004', '40001000-0000-0000-0000-001700000002', 4, 'clerk', 'Sharing ancient traditions created an unforgettable bond of honor.', 'به اشتراک گذاشتن سنت‌های کهن پیوندی فراموش‌نشدنی از احترام ایجاد نمود.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full'),
('40001000-0000-0000-0001-001700000005', '40001000-0000-0000-0000-001700000002', 5, 'customer', 'The pleasant gathering left a lasting positive impact on everyone.', 'این گردهمایی دلپذیر اثر مثبت ماندگاری بر همه به جا گذاشت.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full')
ON CONFLICT (id) DO NOTHING;

INSERT INTO podcasts (id, title, description_fa, level, kind, series_id, episode_no, audio_url, audio_status, is_active, duration_seconds, position, vocabulary, scene_id)
VALUES (
    '40001000-0000-0000-0000-001700000003',
    'The Cultural Gathering (Unit 17)',
    'روایت جذاب و آموزش واژگان یونیت 17 (مهمانی و آیین‌های فرهنگی) کتاب ۴۰۰۰ واژه ضروری',
    'beginner',
    'lesson',
    '40000000-0001-0000-0000-000000000001',
    17,
    '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3',
    'ready',
    TRUE,
    341,
    17,
    '[{"word": "admire", "meaning_fa": "تحسین کردن"}, {"word": "behavior", "meaning_fa": "رفتار"}, {"word": "boast", "meaning_fa": "لاف زدن"}, {"word": "culture", "meaning_fa": "فرهنگ"}, {"word": "detail", "meaning_fa": "جزئیات"}, {"word": "expect", "meaning_fa": "انتظار داشتن"}, {"word": "gathering", "meaning_fa": "گردهمایی"}, {"word": "glance", "meaning_fa": "نگاه گذرا"}, {"word": "guest", "meaning_fa": "مهمان"}, {"word": "honor", "meaning_fa": "افتخار یا احترام"}, {"word": "host", "meaning_fa": "میزبان"}, {"word": "impact", "meaning_fa": "اثرگذاری"}, {"word": "modern", "meaning_fa": "مدرن"}, {"word": "polite", "meaning_fa": "مودب"}, {"word": "serve", "meaning_fa": "سرو کردن و خدمت کردن"}, {"word": "tradition", "meaning_fa": "سنت و رسم"}, {"word": "treat", "meaning_fa": "رفتار کردن یا پذیرایی"}, {"word": "unique", "meaning_fa": "منحصربه‌فرد"}, {"word": "warm", "meaning_fa": "گرم و صمیمی"}, {"word": "value", "meaning_fa": "ارزش نهادن"}]'::jsonb,
    '40001000-0000-0000-0000-001700000001'
) ON CONFLICT (id) DO UPDATE SET scene_id = EXCLUDED.scene_id, vocabulary = EXCLUDED.vocabulary;

INSERT INTO podcast_lines (podcast_id, position, speaker, text, translation_fa, start_ms, end_ms)
VALUES
('40001000-0000-0000-0000-001700000003', 0, 'Alex', 'Welcome to Unit 17: The Cultural Gathering.', 'به یونیت هفدهم خوش آمدید: گردهمایی فرهنگی.', 0, 5000),
('40001000-0000-0000-0000-001700000003', 1, 'Sarah', 'Hospitality and polite manners are universal languages understood by all.', 'مهمان‌نوازی و ادب زبان‌هایی جهان‌شمول‌اند که همه آن را درک می‌کنند.', 5300, 12000),
('40001000-0000-0000-0000-001700000003', 2, 'Alex', 'The hosts honored their traditions while warmly welcoming modern guests.', 'میزبانان ضمن استقبال گرم از مهمانان امروزی، سنت‌های خود را گرامی داشتند.', 12400, 20500),
('40001000-0000-0000-0000-001700000003', 3, 'Sarah', 'Notice the smooth tone when pronouncing social and cultural phrases!', 'به لحن روان گویندگان هنگام تلفظ عبارات اجتماعی و فرهنگی دقت کنید!', 20800, 28000)
ON CONFLICT DO NOTHING;

--------------------------------------------------------------------------------
-- کتاب اول - درس 18: The Clinic Volunteers (یونیت 18)
--------------------------------------------------------------------------------
INSERT INTO scenes (id, title, description, background_image_url, difficulty, status, "order", category, is_custom)
VALUES (
    '40001000-0000-0000-0000-001800000001',
    'The Clinic Volunteers (Unit 18)',
    'تمرین شادوئینگ واژگان ضروری یونیت 18 کتاب ۴۰۰۰ واژه: assist, caring, clinic, comfort, condition, duty, examine, gentle...',
    '',
    'beginner',
    'published',
    118,
    'education',
    false
) ON CONFLICT (id) DO NOTHING;

INSERT INTO hotspots (id, scene_id, name, x_position, y_position, order_index)
VALUES (
    '40001000-0000-0000-0000-001800000002',
    '40001000-0000-0000-0000-001800000001',
    'Dialogue',
    50.0,
    50.0,
    1
) ON CONFLICT (id) DO NOTHING;

INSERT INTO dialogues (id, hotspot_id, "order", speaker, original_text, translation, audio_url, display_type)
VALUES
('40001000-0000-0000-0001-001800000001', '40001000-0000-0000-0000-001800000002', 1, 'customer', 'Dedicated volunteers assist the medical staff at the community clinic.', 'داوطلبان متعهد به کادر درمان در درمانگاه محلی یاری می‌رسانند.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full'),
('40001000-0000-0000-0001-001800000002', '40001000-0000-0000-0000-001800000002', 2, 'clerk', 'Dr. Hayes examined each patient with gentle and caring attention.', 'دکتر هیز هر بیمار را با توجهی مهربانانه و دلسوز معاینه کرد.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full'),
('40001000-0000-0000-0001-001800000003', '40001000-0000-0000-0000-001800000002', 3, 'customer', 'Proper medicine and rest brought immediate comfort and relief.', 'داروی مناسب و استراحت، آرامش و تسکین فوری به همراه آورد.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full'),
('40001000-0000-0000-0001-001800000004', '40001000-0000-0000-0000-001800000002', 4, 'clerk', 'The patient''s health condition improved steadily throughout the week.', 'وضعیت سلامت بیمار در طول هفته به طور مداوم بهبود یافت.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full'),
('40001000-0000-0000-0001-001800000005', '40001000-0000-0000-0000-001800000002', 5, 'customer', 'Their duty of compassionate service inspired the entire town.', 'وظیفه‌شناسی توأم با مهربانی آن‌ها الهام‌بخش کل شهر شد.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full')
ON CONFLICT (id) DO NOTHING;

INSERT INTO podcasts (id, title, description_fa, level, kind, series_id, episode_no, audio_url, audio_status, is_active, duration_seconds, position, vocabulary, scene_id)
VALUES (
    '40001000-0000-0000-0000-001800000003',
    'The Clinic Volunteers (Unit 18)',
    'روایت جذاب و آموزش واژگان یونیت 18 (داوطلبان درمانگاه محلی) کتاب ۴۰۰۰ واژه ضروری',
    'beginner',
    'lesson',
    '40000000-0001-0000-0000-000000000001',
    18,
    '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3',
    'ready',
    TRUE,
    344,
    18,
    '[{"word": "assist", "meaning_fa": "یاری رساندن"}, {"word": "caring", "meaning_fa": "دلسوز"}, {"word": "clinic", "meaning_fa": "درمانگاه یا کلینیک"}, {"word": "comfort", "meaning_fa": "آرامش دادن"}, {"word": "condition", "meaning_fa": "وضعیت بیماری"}, {"word": "duty", "meaning_fa": "وظیفه"}, {"word": "examine", "meaning_fa": "معاینه کردن"}, {"word": "gentle", "meaning_fa": "مهربان و آرام"}, {"word": "heal", "meaning_fa": "شفا یافتن"}, {"word": "health", "meaning_fa": "سلامتی"}, {"word": "improve", "meaning_fa": "بهبود یافتن"}, {"word": "medicine", "meaning_fa": "دارو یا پزشکی"}, {"word": "nurse", "meaning_fa": "پرستار"}, {"word": "patient", "meaning_fa": "بیمار"}, {"word": "recovery", "meaning_fa": "بهبودی"}, {"word": "relief", "meaning_fa": "تسکین"}, {"word": "support", "meaning_fa": "حمایت کردن"}, {"word": "symptom", "meaning_fa": "نشانه بیماری"}, {"word": "treatment", "meaning_fa": "درمان"}, {"word": "volunteer", "meaning_fa": "داوطلب"}]'::jsonb,
    '40001000-0000-0000-0000-001800000001'
) ON CONFLICT (id) DO UPDATE SET scene_id = EXCLUDED.scene_id, vocabulary = EXCLUDED.vocabulary;

INSERT INTO podcast_lines (podcast_id, position, speaker, text, translation_fa, start_ms, end_ms)
VALUES
('40001000-0000-0000-0000-001800000003', 0, 'Alex', 'Welcome to Unit 18: The Clinic Volunteers.', 'به یونیت هجدهم خوش آمدید: داوطلبان درمانگاه.', 0, 5000),
('40001000-0000-0000-0000-001800000003', 1, 'Sarah', 'Kindness, medical care, and gentle support speed up patient recovery.', 'مهربانی، مراقبت پزشکی و حمایت آرام به بهبودی بیمار شتاب می‌بخشد.', 5300, 12000),
('40001000-0000-0000-0000-001800000003', 2, 'Alex', 'The clinic volunteers performed their duties with genuine care and patience.', 'داوطلبان کلینیک وظایف خود را با مراقبت قلبی و صبر انجام دادند.', 12400, 20500),
('40001000-0000-0000-0000-001800000003', 3, 'Sarah', 'Practice your medical and health vocabulary to speak fluently on real topics!', 'واژگان سلامت و درمانی را تمرین کنید تا در موقعیت‌های واقعی روان صحبت کنید!', 20800, 28000)
ON CONFLICT DO NOTHING;

--------------------------------------------------------------------------------
-- کتاب اول - درس 19: The Airport Departure (یونیت 19)
--------------------------------------------------------------------------------
INSERT INTO scenes (id, title, description, background_image_url, difficulty, status, "order", category, is_custom)
VALUES (
    '40001000-0000-0000-0000-001900000001',
    'The Airport Departure (Unit 19)',
    'تمرین شادوئینگ واژگان ضروری یونیت 19 کتاب ۴۰۰۰ واژه: announce, boarding, counter, delay, departure, destination, flight, gate...',
    '',
    'beginner',
    'published',
    119,
    'education',
    false
) ON CONFLICT (id) DO NOTHING;

INSERT INTO hotspots (id, scene_id, name, x_position, y_position, order_index)
VALUES (
    '40001000-0000-0000-0000-001900000002',
    '40001000-0000-0000-0000-001900000001',
    'Dialogue',
    50.0,
    50.0,
    1
) ON CONFLICT (id) DO NOTHING;

INSERT INTO dialogues (id, hotspot_id, "order", speaker, original_text, translation, audio_url, display_type)
VALUES
('40001000-0000-0000-0001-001900000001', '40001000-0000-0000-0000-001900000002', 1, 'customer', 'Passengers arrived early at the international terminal for departure.', 'مسافران برای پرواز خروجی زودتر به ترمینال بین‌المللی رسیدند.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full'),
('40001000-0000-0000-0001-001900000002', '40001000-0000-0000-0000-001900000002', 2, 'clerk', 'The agent at the counter verified tickets, passports, and checked luggage.', 'متصدی باجه بلیط‌ها، پاسپورت‌ها و چمدان‌ها را بررسی کرد.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full'),
('40001000-0000-0000-0001-001900000003', '40001000-0000-0000-0000-001900000002', 3, 'customer', 'After clearing security smoothly, they proceeded toward the boarding gate.', 'پس از عبور روان از بازرسی، آن‌ها به سمت گیت سوار شدن حرکت کردند.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full'),
('40001000-0000-0000-0001-001900000004', '40001000-0000-0000-0000-001900000002', 4, 'clerk', 'The flight schedule showed no delay for their exciting destination.', 'برنامه پرواز هیچ تاخیری را برای مقصد هیجان‌انگیزشان نشان نداد.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full'),
('40001000-0000-0000-0001-001900000005', '40001000-0000-0000-0000-001900000002', 5, 'customer', 'The captain announced that the aircraft was ready for takeoff on the runway.', 'کاپیتان اعلام کرد که هواپیما برای برخاستن روی باند آماده است.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full')
ON CONFLICT (id) DO NOTHING;

INSERT INTO podcasts (id, title, description_fa, level, kind, series_id, episode_no, audio_url, audio_status, is_active, duration_seconds, position, vocabulary, scene_id)
VALUES (
    '40001000-0000-0000-0000-001900000003',
    'The Airport Departure (Unit 19)',
    'روایت جذاب و آموزش واژگان یونیت 19 (پرواز در فرودگاه بین‌المللی) کتاب ۴۰۰۰ واژه ضروری',
    'beginner',
    'lesson',
    '40000000-0001-0000-0000-000000000001',
    19,
    '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3',
    'ready',
    TRUE,
    347,
    19,
    '[{"word": "announce", "meaning_fa": "اعلام کردن"}, {"word": "boarding", "meaning_fa": "سوار شدن به هواپیما"}, {"word": "counter", "meaning_fa": "باجه پذیرش"}, {"word": "delay", "meaning_fa": "تاخیر"}, {"word": "departure", "meaning_fa": "پرواز خروجی"}, {"word": "destination", "meaning_fa": "مقصد سفر"}, {"word": "flight", "meaning_fa": "پرواز"}, {"word": "gate", "meaning_fa": "دروازه خروجی پرواز"}, {"word": "journey", "meaning_fa": "سفر"}, {"word": "luggage", "meaning_fa": "چمدان و بار سفر"}, {"word": "officer", "meaning_fa": "مامور فرودگاه"}, {"word": "passenger", "meaning_fa": "مسافر"}, {"word": "passport", "meaning_fa": "گذرنامه"}, {"word": "prepare", "meaning_fa": "آماده شدن"}, {"word": "runway", "meaning_fa": "باند فرودگاه"}, {"word": "schedule", "meaning_fa": "برنامه زمانی"}, {"word": "security", "meaning_fa": "امنیت و بازرسی"}, {"word": "terminal", "meaning_fa": "ترمینال فرودگاه"}, {"word": "ticket", "meaning_fa": "بلیط"}, {"word": "travel", "meaning_fa": "سفر کردن"}]'::jsonb,
    '40001000-0000-0000-0000-001900000001'
) ON CONFLICT (id) DO UPDATE SET scene_id = EXCLUDED.scene_id, vocabulary = EXCLUDED.vocabulary;

INSERT INTO podcast_lines (podcast_id, position, speaker, text, translation_fa, start_ms, end_ms)
VALUES
('40001000-0000-0000-0000-001900000003', 0, 'Alex', 'Welcome to Unit 19: The Airport Departure.', 'به یونیت نوزدهم خوش آمدید: پرواز در فرودگاه.', 0, 5000),
('40001000-0000-0000-0000-001900000003', 1, 'Sarah', 'Airport navigation is an essential skill for international travelers.', 'پیدا کردن مسیر در فرودگاه مهارتی حیاتی برای مسافران بین‌المللی است.', 5300, 12000),
('40001000-0000-0000-0000-001900000003', 2, 'Alex', 'Checking luggage, passing security, and boarding on schedule ensures a smooth flight.', 'تحویل بار، عبور از بازرسی و سوار شدن طبق برنامه، پروازی آرام را تضمین می‌کند.', 12400, 20500),
('40001000-0000-0000-0000-001900000003', 3, 'Sarah', 'Shadow these airport lines to feel completely at home while traveling abroad!', 'این جملات فرودگاهی را شادو کنید تا در سفرهای خارجی کاملاً مسلط باشید!', 20800, 28000)
ON CONFLICT DO NOTHING;

--------------------------------------------------------------------------------
-- کتاب اول - درس 20: The Grand Festival (یونیت 20)
--------------------------------------------------------------------------------
INSERT INTO scenes (id, title, description, background_image_url, difficulty, status, "order", category, is_custom)
VALUES (
    '40001000-0000-0000-0000-002000000001',
    'The Grand Festival (Unit 20)',
    'تمرین شادوئینگ واژگان ضروری یونیت 20 کتاب ۴۰۰۰ واژه: annual, celebration, cheer, costume, crowd, dance, decorate, excitement...',
    '',
    'beginner',
    'published',
    120,
    'education',
    false
) ON CONFLICT (id) DO NOTHING;

INSERT INTO hotspots (id, scene_id, name, x_position, y_position, order_index)
VALUES (
    '40001000-0000-0000-0000-002000000002',
    '40001000-0000-0000-0000-002000000001',
    'Dialogue',
    50.0,
    50.0,
    1
) ON CONFLICT (id) DO NOTHING;

INSERT INTO dialogues (id, hotspot_id, "order", speaker, original_text, translation, audio_url, display_type)
VALUES
('40001000-0000-0000-0001-002000000001', '40001000-0000-0000-0000-002000000002', 1, 'customer', 'The annual spring festival gathered thousands of happy citizens.', 'جشنواره سالانه بهاره هزاران شهروند شاد را گرد هم آورد.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full'),
('40001000-0000-0000-0001-002000000002', '40001000-0000-0000-0000-002000000002', 2, 'clerk', 'Streets were beautifully decorated with vibrant flowers and colorful lanterns.', 'خیابان‌ها به زیبایی با گل‌های باطراوت و فانوس‌های رنگارنگ تزیین شده بودند.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full'),
('40001000-0000-0000-0001-002000000003', '40001000-0000-0000-0000-002000000002', 3, 'customer', 'Musicians gave energetic performances on the central city stage.', 'نوازندگان اجراهای پرانرژی روی صحنه مرکزی شهر ارائه دادند.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full'),
('40001000-0000-0000-0001-002000000004', '40001000-0000-0000-0000-002000000002', 4, 'clerk', 'Spectacular fireworks lit up the night sky to the crowd''s great cheer.', 'آتش‌بازی دیدنی آسمان شب را در میان هلهله پرشور جمعیت روشن کرد.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full'),
('40001000-0000-0000-0001-002000000005', '40001000-0000-0000-0000-002000000002', 5, 'customer', 'This joyous celebration created precious lifelong memories for everyone.', 'این جشن پرنشاط خاطرات گرانبهایی را برای تمام عمر برای همه رقم زد.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full')
ON CONFLICT (id) DO NOTHING;

INSERT INTO podcasts (id, title, description_fa, level, kind, series_id, episode_no, audio_url, audio_status, is_active, duration_seconds, position, vocabulary, scene_id)
VALUES (
    '40001000-0000-0000-0000-002000000003',
    'The Grand Festival (Unit 20)',
    'روایت جذاب و آموزش واژگان یونیت 20 (جشن بزرگ بهاره) کتاب ۴۰۰۰ واژه ضروری',
    'beginner',
    'lesson',
    '40000000-0001-0000-0000-000000000001',
    20,
    '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3',
    'ready',
    TRUE,
    350,
    20,
    '[{"word": "annual", "meaning_fa": "سالانه"}, {"word": "celebration", "meaning_fa": "جشن و سرور"}, {"word": "cheer", "meaning_fa": "هلهله و تشویق"}, {"word": "costume", "meaning_fa": "لباس محلی یا نمایشی"}, {"word": "crowd", "meaning_fa": "جمعیت پرشور"}, {"word": "dance", "meaning_fa": "رقصیدن"}, {"word": "decorate", "meaning_fa": "تزیین کردن"}, {"word": "excitement", "meaning_fa": "شور و هیجان"}, {"word": "feast", "meaning_fa": "ضیافت و سفره غذا"}, {"word": "festival", "meaning_fa": "جشنواره"}, {"word": "fireworks", "meaning_fa": "آتش‌بازی"}, {"word": "gather", "meaning_fa": "گرد هم آمدن"}, {"word": "joy", "meaning_fa": "شادی و سرور"}, {"word": "memory", "meaning_fa": "خاطره"}, {"word": "musician", "meaning_fa": "نوازنده"}, {"word": "parade", "meaning_fa": "رژه"}, {"word": "performance", "meaning_fa": "اجرای هنری"}, {"word": "stage", "meaning_fa": "صحنه نمایش"}, {"word": "tradition", "meaning_fa": "سنت دیرینه"}, {"word": "vibrant", "meaning_fa": "سرزنده و پرانرژی"}]'::jsonb,
    '40001000-0000-0000-0000-002000000001'
) ON CONFLICT (id) DO UPDATE SET scene_id = EXCLUDED.scene_id, vocabulary = EXCLUDED.vocabulary;

INSERT INTO podcast_lines (podcast_id, position, speaker, text, translation_fa, start_ms, end_ms)
VALUES
('40001000-0000-0000-0000-002000000003', 0, 'Alex', 'Welcome to Unit 20: The Grand Festival! We have completed 400 essential words!', 'به یونیت بیستم خوش آمدید: جشن بزرگ! ما ۴۰۰ واژه اساسی را کامل کردیم!', 0, 6000),
('40001000-0000-0000-0000-002000000003', 1, 'Sarah', 'Congratulations on reaching 400 core vocabulary words in Book 1!', 'تبریک می‌گوییم به خاطر رسیدن به ۴۰۰ واژه کلیدی کتاب اول!', 6300, 13000),
('40001000-0000-0000-0000-002000000003', 2, 'Alex', 'Music, colorful parades, and fireworks brought the vibrant community together.', 'موسیقی، رژه‌های رنگارنگ و آتش‌بازی، جامعه پرانرژی را گرد هم آورد.', 13400, 21500),
('40001000-0000-0000-0000-002000000003', 3, 'Sarah', 'You now have a solid conversational foundation. Keep practicing your shadowing every day!', 'شما اکنون پایه‌ای قوی در مکالمه دارید. تمرین شادوئینگ روزانه خود را ادامه دهید!', 22000, 30000)
ON CONFLICT DO NOTHING;

-- +migrate Down
DELETE FROM podcast_lines WHERE podcast_id LIKE '40001000-0000-0000-0000-%';
DELETE FROM podcasts WHERE id LIKE '40001000-0000-0000-0000-%';
DELETE FROM dialogues WHERE hotspot_id LIKE '40001000-0000-0000-0000-%';
DELETE FROM hotspots WHERE id LIKE '40001000-0000-0000-0000-%';
DELETE FROM scenes WHERE id LIKE '40001000-0000-0000-0000-%';
DELETE FROM podcast_series WHERE id IN (
    '40000000-0001-0000-0000-000000000001',
    '40000000-0002-0000-0000-000000000002',
    '40000000-0003-0000-0000-000000000003',
    '40000000-0004-0000-0000-000000000004',
    '40000000-0005-0000-0000-000000000005',
    '40000000-0006-0000-0000-000000000006'
);
