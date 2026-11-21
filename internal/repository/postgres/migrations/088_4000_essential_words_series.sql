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
-- کتاب اول - درس ۱: The Laboratory Experiment (یونیت ۱)
--------------------------------------------------------------------------------
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

INSERT INTO hotspots (id, scene_id, name, x_position, y_position, order_index)
VALUES (
    '40001001-0000-0000-0000-000000000002',
    '40001001-0000-0000-0000-000000000001',
    'Dialogue',
    50.0,
    50.0,
    1
) ON CONFLICT (id) DO NOTHING;

INSERT INTO dialogues (id, hotspot_id, "order", speaker, original_text, translation, audio_url, display_type)
VALUES
('40001001-0000-0000-0001-000000000001', '40001001-0000-0000-0000-000000000002', 1, 'customer', 'Mia is a clever student who loves working in the laboratory.', 'میا دانش‌آموز باهوشی است که عاشق کار کردن در آزمایشگاه است.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full'),
('40001001-0000-0000-0001-000000000002', '40001001-0000-0000-0000-000000000002', 2, 'clerk', 'One afternoon, she arrived early to begin a special experiment.', 'یک روز بعدازظهر، او زود رسید تا یک آزمایش ویژه را شروع کند.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full'),
('40001001-0000-0000-0001-000000000003', '40001001-0000-0000-0000-000000000002', 3, 'customer', 'She was afraid that something might go wrong with the chemicals.', 'او نگران و خائف بود که مبادا با مواد شیمیایی اتفاقی بیفتد.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full'),
('40001001-0000-0000-0001-000000000004', '40001001-0000-0000-0000-000000000002', 4, 'clerk', 'Her teacher agreed to supervise and help her stay safe.', 'استادش موافقت کرد که نظارت کند و به او کمک کند در امنیت بماند.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full'),
('40001001-0000-0000-0001-000000000005', '40001001-0000-0000-0000-000000000002', 5, 'customer', 'Finally, the solution turned bright blue and the test was a success!', 'در نهایت، محلول به رنگ آبی روشن درآمد و آزمایش با موفقیت به پایان رسید!', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full')
ON CONFLICT (id) DO NOTHING;

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

INSERT INTO podcast_lines (podcast_id, position, speaker, text, translation_fa, start_ms, end_ms)
VALUES
('40001001-0000-0000-0000-000000000003', 0, 'Alex', 'Welcome to 4000 Essential English Words, Unit 1: The Laboratory Experiment.', 'به یونیت اول دوره ۴۰۰۰ واژه ضروری خوش آمدید: آزمایش آزمایشگاه.', 0, 6000),
('40001001-0000-0000-0000-000000000003', 1, 'Sarah', 'Today we follow Mia, a clever student passionate about science and chemistry.', 'امروز داستان میا را دنبال می‌کنیم، دانش‌آموز باهوشی که به علوم و شیمی علاقه زیادی دارد.', 6200, 13500),
('40001001-0000-0000-0000-000000000003', 2, 'Alex', 'When she arrived at the lab, she felt a bit afraid, but her teacher promised to keep everything safe.', 'وقتی او به آزمایشگاه رسید کمی احساس نگرانی می‌کرد، اما استادش قول داد همه چیز در امنیت باشد.', 13800, 22000),
('40001001-0000-0000-0000-000000000003', 3, 'Sarah', 'Her patience paid off, and finally her experiment turned into a wonderful success!', 'صبر او به نتیجه نشست و در نهایت آزمایش او به یک موفقیت فوق‌العاده تبدیل شد!', 22300, 30500),
('40001001-0000-0000-0000-000000000003', 4, 'Alex', 'Now let us practice shadowing these sentences to master both vocabulary and pronunciation.', 'حالا بیایید این جملات را به صورت شادوئینگ تمرین کنیم تا هم لغات و هم تلفظتان را تقویت کنید.', 30800, 38000)
ON CONFLICT DO NOTHING;

--------------------------------------------------------------------------------
-- کتاب اول - درس ۲: The Dog's Bell (یونیت ۲)
--------------------------------------------------------------------------------
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
-- کتاب اول - درس ۳: The Lion and the Rabbit (یونیت ۳)
--------------------------------------------------------------------------------
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

--------------------------------------------------------------------------------
-- کتاب اول - درس ۴: The Boy and His Sled (یونیت ۴)
--------------------------------------------------------------------------------
INSERT INTO scenes (id, title, description, background_image_url, difficulty, status, "order", category, is_custom)
VALUES (
    '40001004-0000-0000-0000-000000000001',
    'The Boy and His Sled (Unit 4)',
    'تمرین شادوئینگ واژگان ضروری یونیت چهارم کتاب ۴۰۰۰ واژه: appreciate, available, beat, bright, celebrate, determine, puddle, hill...',
    '',
    'beginner',
    'published',
    104,
    'education',
    false
) ON CONFLICT (id) DO NOTHING;

INSERT INTO hotspots (id, scene_id, name, x_position, y_position, order_index)
VALUES (
    '40001004-0000-0000-0000-000000000002',
    '40001004-0000-0000-0000-000000000001',
    'Dialogue',
    50.0,
    50.0,
    1
) ON CONFLICT (id) DO NOTHING;

INSERT INTO dialogues (id, hotspot_id, "order", speaker, original_text, translation, audio_url, display_type)
VALUES
('40001004-0000-0000-0001-000000000001', '40001004-0000-0000-0000-000000000002', 1, 'customer', 'Ethan was determined to build the fastest sled in his neighborhood.', 'ایتن مصمم بود سریع‌ترین سورتمه را در محله‌اش بسازد.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full'),
('40001004-0000-0000-0001-000000000002', '40001004-0000-0000-0000-000000000002', 2, 'clerk', 'He gathered available wood from the shed and worked all morning.', 'او چوب‌های موجود را از انباری جمع کرد و تمام صبح کار کرد.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full'),
('40001004-0000-0000-0001-000000000003', '40001004-0000-0000-0000-000000000002', 3, 'customer', 'On a bright winter day, he climbed up the steep snowy hill.', 'در یک روز زمستانی آفتابی و روشن، او از تپه برفی پرشیب بالا رفت.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full'),
('40001004-0000-0000-0001-000000000004', '40001004-0000-0000-0000-000000000002', 4, 'clerk', 'The sled flowed smoothly forward without hitting any muddy puddle.', 'سورتمه با روانی به سمت جلو حرکت کرد بدون اینکه به هیچ چاله آبی برخورد کند.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full'),
('40001004-0000-0000-0001-000000000005', '40001004-0000-0000-0000-000000000002', 5, 'customer', 'All his friends celebrated his wonderful success at the bottom.', 'تمام دوستانش موفقیت شگفت‌انگیز او را در پایین تپه جشن گرفتند.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full')
ON CONFLICT (id) DO NOTHING;

INSERT INTO podcasts (id, title, description_fa, level, kind, series_id, episode_no, audio_url, audio_status, is_active, duration_seconds, position, vocabulary, scene_id)
VALUES (
    '40001004-0000-0000-0000-000000000003',
    'The Boy and His Sled (Unit 4)',
    'داستان پرانرژی سورتمه‌سواری زمستانی و یادگیری واژگان کاربردی یونیت ۴',
    'beginner',
    'lesson',
    '40000000-0001-0000-0000-000000000001',
    4,
    '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3',
    'ready',
    TRUE,
    305,
    4,
    '[{"word":"determine","meaning_fa":"مصمم بودن و تصمیم قطعی داشتن"},{"word":"available","meaning_fa":"در دسترس و موجود"},{"word":"bright","meaning_fa":"روشن و درخشان"},{"word":"forward","meaning_fa":"رو به جلو"},{"word":"celebrate","meaning_fa":"جشن گرفتن"}]'::jsonb,
    '40001004-0000-0000-0000-000000000001'
) ON CONFLICT (id) DO UPDATE SET scene_id = EXCLUDED.scene_id, vocabulary = EXCLUDED.vocabulary;

INSERT INTO podcast_lines (podcast_id, position, speaker, text, translation_fa, start_ms, end_ms)
VALUES
('40001004-0000-0000-0000-000000000003', 0, 'Alex', 'Welcome to Unit 4: The Boy and His Sled.', 'به یونیت چهارم خوش آمدید: پسر و سورتمه‌اش.', 0, 5000),
('40001004-0000-0000-0000-000000000003', 1, 'Sarah', 'Determination can turn simple ideas into real triumphs.', 'اراده و تصمیم قطعی می‌تواند ایده‌های ساده را به موفقیت‌های واقعی بدل کند.', 5300, 12000),
('40001004-0000-0000-0000-000000000003', 2, 'Alex', 'Ethan used available materials to construct a sled and slide down the hill.', 'ایتن از وسایل موجود استفاده کرد تا سورتمه‌ای بسازد و از تپه سرازیر شود.', 12400, 20500),
('40001004-0000-0000-0000-000000000003', 3, 'Sarah', 'Listen closely to the target vocabulary and practice your pronunciation!', 'به لغات هدف با دقت گوش کنید و تلفظ خود را تقویت کنید!', 20800, 28000)
ON CONFLICT DO NOTHING;

--------------------------------------------------------------------------------
-- کتاب اول - درس ۵: A Journey to the Wild Field (یونیت ۵)
--------------------------------------------------------------------------------
INSERT INTO scenes (id, title, description, background_image_url, difficulty, status, "order", category, is_custom)
VALUES (
    '40001005-0000-0000-0000-000000000001',
    'A Journey to the Wild Field (Unit 5)',
    'تمرین شادوئینگ واژگان ضروری یونیت پنجم کتاب ۴۰۰۰ واژه: aware, belong, continue, error, experience, judgment, rare, relax...',
    '',
    'beginner',
    'published',
    105,
    'education',
    false
) ON CONFLICT (id) DO NOTHING;

INSERT INTO hotspots (id, scene_id, name, x_position, y_position, order_index)
VALUES (
    '40001005-0000-0000-0000-000000000002',
    '40001005-0000-0000-0000-000000000001',
    'Dialogue',
    50.0,
    50.0,
    1
) ON CONFLICT (id) DO NOTHING;

INSERT INTO dialogues (id, hotspot_id, "order", speaker, original_text, translation, audio_url, display_type)
VALUES
('40001005-0000-0000-0001-000000000001', '40001005-0000-0000-0000-000000000002', 1, 'customer', 'Walking in the wild field was a completely new experience for Liam.', 'قدم زدن در دشت وحشی و بکر یک تجربه کاملاً جدید برای لیام بود.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full'),
('40001005-0000-0000-0001-000000000002', '40001005-0000-0000-0000-000000000002', 2, 'clerk', 'He was aware that weather conditions could change rapidly.', 'او آگاه بود که شرایط آب و هوایی ممکن است خیلی سریع تغییر کند.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full'),
('40001005-0000-0000-0001-000000000003', '40001005-0000-0000-0000-000000000002', 3, 'customer', 'Using good judgment, he decided not to wander too far from the trail.', 'با استفاده از قضاوت درست، او تصمیم گرفت زیاد از مسیر اصلی دور نشود.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full'),
('40001005-0000-0000-0001-000000000004', '40001005-0000-0000-0000-000000000002', 4, 'clerk', 'He spotted rare colorful birds resting on the green grass.', 'او پرندگان کمیاب و رنگارنگی را دید که روی چمن‌های سبز استراحت می‌کردند.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full'),
('40001005-0000-0000-0001-000000000005', '40001005-0000-0000-0000-000000000002', 5, 'customer', 'Sitting quietly under the tree helped him truly relax and enjoy nature.', 'آرام نشستن زیر سایه درخت به او کمک کرد واقعاً آرامش پیدا کند و از طبیعت لذت ببرد.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full')
ON CONFLICT (id) DO NOTHING;

INSERT INTO podcasts (id, title, description_fa, level, kind, series_id, episode_no, audio_url, audio_status, is_active, duration_seconds, position, vocabulary, scene_id)
VALUES (
    '40001005-0000-0000-0000-000000000003',
    'A Journey to the Wild Field (Unit 5)',
    'سفر به طبیعت بکر و آموزش واژگان کاربردی تجربه و طبیعت در یونیت ۵',
    'beginner',
    'lesson',
    '40000000-0001-0000-0000-000000000001',
    5,
    '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3',
    'ready',
    TRUE,
    315,
    5,
    '[{"word":"aware","meaning_fa":"آگاه و مطلع"},{"word":"experience","meaning_fa":"تجربه"},{"word":"judgment","meaning_fa":"قضاوت و درایت"},{"word":"rare","meaning_fa":"کمیاب و نایاب"},{"word":"relax","meaning_fa":"آرامش گرفتن و استراحت کردن"}]'::jsonb,
    '40001005-0000-0000-0000-000000000001'
) ON CONFLICT (id) DO UPDATE SET scene_id = EXCLUDED.scene_id, vocabulary = EXCLUDED.vocabulary;

INSERT INTO podcast_lines (podcast_id, position, speaker, text, translation_fa, start_ms, end_ms)
VALUES
('40001005-0000-0000-0000-000000000003', 0, 'Alex', 'Welcome to Unit 5: A Journey to the Wild Field.', 'به یونیت پنجم خوش آمدید: سفر به طبیعت بکر.', 0, 5000),
('40001005-0000-0000-0000-000000000003', 1, 'Sarah', 'Connecting with nature requires awareness, respect, and sound judgment.', 'ارتباط برقرار کردن با طبیعت نیازمند هوشیاری، احترام و قضاوت درست است.', 5300, 13000),
('40001005-0000-0000-0000-000000000003', 2, 'Alex', 'Liam relaxed under the shade of trees while watching rare wildlife.', 'لیام زیر سایه درختان آرام گرفت در حالی که نظاره‌گر حیات وحش کمیاب بود.', 13400, 21500),
('40001005-0000-0000-0000-000000000003', 3, 'Sarah', 'Now head over to the shadowing section to record these sentences in your own voice!', 'حالا به بخش شادوئینگ بروید تا این جملات را با صدای خودتان تمرین و ضبط کنید!', 21800, 29000)
ON CONFLICT DO NOTHING;

--------------------------------------------------------------------------------
-- کتاب دوم - درس ۱: The Secret Recipe (یونیت ۱ از کتاب دوم - سطح B1)
--------------------------------------------------------------------------------
INSERT INTO scenes (id, title, description, background_image_url, difficulty, status, "order", category, is_custom)
VALUES (
    '40002001-0000-0000-0000-000000000001',
    'The Secret Recipe (Book 2 - Unit 1)',
    'تمرین شادوئینگ واژگان سطح متوسط کتاب دوم ۴۰۰۰ واژه: anxious, consist, desire, eager, household, pace, polite, rapidly...',
    '',
    'intermediate',
    'published',
    201,
    'education',
    false
) ON CONFLICT (id) DO NOTHING;

INSERT INTO hotspots (id, scene_id, name, x_position, y_position, order_index)
VALUES (
    '40002001-0000-0000-0000-000000000002',
    '40002001-0000-0000-0000-000000000001',
    'Dialogue',
    50.0,
    50.0,
    1
) ON CONFLICT (id) DO NOTHING;

INSERT INTO dialogues (id, hotspot_id, "order", speaker, original_text, translation, audio_url, display_type)
VALUES
('40002001-0000-0000-0001-000000000001', '40002001-0000-0000-0000-000000000002', 1, 'customer', 'Chef Lucas was eager to master his family’s famous soup recipe.', 'سرآشپز لوکاس بسیار مشتاق بود که دستور پخت سوپ معروف خانوادگی‌اش را یاد بگیرد.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full'),
('40002001-0000-0000-0001-000000000002', '40002001-0000-0000-0000-000000000002', 2, 'clerk', 'The secret recipe consisted of fresh herbs gathered at dawn.', 'دستور سرّی متشکل از سبزیجات تازه‌ای بود که در سپیده‌دم چیده می‌شدند.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full'),
('40002001-0000-0000-0001-000000000003', '40002001-0000-0000-0000-000000000002', 3, 'customer', 'Although he felt slightly anxious, he kept a steady and calm pace.', 'اگرچه کمی مضطرب بود، اما ریتم کاری آرام و یکنواختی را حفظ کرد.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full'),
('40002001-0000-0000-0001-000000000004', '40002001-0000-0000-0000-000000000002', 4, 'clerk', 'His culinary skills improved rapidly through continuous daily practice.', 'مهارت‌های آشپزی او از طریق تمرین مداوم روزانه به سرعت پیشرفت کرد.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full'),
('40002001-0000-0000-0001-000000000005', '40002001-0000-0000-0000-000000000002', 5, 'customer', 'Every guest in the household politely praised the delicious outcome.', 'تمام مهمانان در خانه با ادب و احترام از نتیجه خوشمزه آن تعریف کردند.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full')
ON CONFLICT (id) DO NOTHING;

INSERT INTO podcasts (id, title, description_fa, level, kind, series_id, episode_no, audio_url, audio_status, is_active, duration_seconds, position, vocabulary, scene_id)
VALUES (
    '40002001-0000-0000-0000-000000000003',
    'The Secret Recipe (Book 2 - Unit 1)',
    'شروع سطح دوم کتاب ۴۰۰۰ واژه با داستان سرآشپز لوکاس و واژگان سطح متوسط B1',
    'intermediate',
    'lesson',
    '40000000-0002-0000-0000-000000000002',
    1,
    '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3',
    'ready',
    TRUE,
    330,
    1,
    '[{"word":"eager","meaning_fa":"مشتاق و بی‌صبرانه مایل"},{"word":"consist","meaning_fa":"تشکیل شدن و شامل بودن"},{"word":"anxious","meaning_fa":"مضطرب و نگران"},{"word":"rapidly","meaning_fa":"به سرعت و شتابان"},{"word":"household","meaning_fa":"اهل خانه و خانواده"}]'::jsonb,
    '40002001-0000-0000-0000-000000000001'
) ON CONFLICT (id) DO UPDATE SET scene_id = EXCLUDED.scene_id, vocabulary = EXCLUDED.vocabulary;

INSERT INTO podcast_lines (podcast_id, position, speaker, text, translation_fa, start_ms, end_ms)
VALUES
('40002001-0000-0000-0000-000000000003', 0, 'Alex', 'Welcome to 4000 Essential English Words, Book 2, Unit 1: The Secret Recipe.', 'به یونیت اول از کتاب دوم دوره ۴۰۰۰ واژه ضروری خوش آمدید: دستور پخت سرّی.', 0, 6000),
('40002001-0000-0000-0000-000000000003', 1, 'Sarah', 'Today we step up to intermediate English as we join Chef Lucas in the kitchen.', 'امروز یک پله به سطح متوسط ارتقا پیدا می‌کنیم و با سرآشپز لوکاس همراه می‌شویم.', 6300, 13500),
('40002001-0000-0000-0000-000000000003', 2, 'Alex', 'He was eager to learn, and despite feeling anxious, his cooking skills grew rapidly.', 'او بسیار مشتاق یادگیری بود و علی‌رغم اضطراب اولیه، مهارت‌هایش به سرعت رشد کرد.', 13800, 22000),
('40002001-0000-0000-0000-000000000003', 3, 'Sarah', 'Listen to how intermediate vocabulary connects thoughts fluently. Let’s shadow together!', 'گوش کنید که چطور واژگان سطح متوسط افکار را روان‌تر بیان می‌کنند. بیایید با هم تمرین کنیم!', 22400, 31000)
ON CONFLICT DO NOTHING;

-- +migrate Down
DELETE FROM podcast_lines WHERE podcast_id IN (
    '40001001-0000-0000-0000-000000000003',
    '40001002-0000-0000-0000-000000000003',
    '40001003-0000-0000-0000-000000000003',
    '40001004-0000-0000-0000-000000000003',
    '40001005-0000-0000-0000-000000000003',
    '40002001-0000-0000-0000-000000000003'
);
DELETE FROM podcasts WHERE id IN (
    '40001001-0000-0000-0000-000000000003',
    '40001002-0000-0000-0000-000000000003',
    '40001003-0000-0000-0000-000000000003',
    '40001004-0000-0000-0000-000000000003',
    '40001005-0000-0000-0000-000000000003',
    '40002001-0000-0000-0000-000000000003'
);
DELETE FROM dialogues WHERE hotspot_id IN (
    '40001001-0000-0000-0000-000000000002',
    '40001002-0000-0000-0000-000000000002',
    '40001003-0000-0000-0000-000000000002',
    '40001004-0000-0000-0000-000000000002',
    '40001005-0000-0000-0000-000000000002',
    '40002001-0000-0000-0000-000000000002'
);
DELETE FROM hotspots WHERE id IN (
    '40001001-0000-0000-0000-000000000002',
    '40001002-0000-0000-0000-000000000002',
    '40001003-0000-0000-0000-000000000002',
    '40001004-0000-0000-0000-000000000002',
    '40001005-0000-0000-0000-000000000002',
    '40002001-0000-0000-0000-000000000002'
);
DELETE FROM scenes WHERE id IN (
    '40001001-0000-0000-0000-000000000001',
    '40001002-0000-0000-0000-000000000001',
    '40001003-0000-0000-0000-000000000001',
    '40001004-0000-0000-0000-000000000001',
    '40001005-0000-0000-0000-000000000001',
    '40002001-0000-0000-0000-000000000001'
);
DELETE FROM podcast_series WHERE id IN (
    '40000000-0001-0000-0000-000000000001',
    '40000000-0002-0000-0000-000000000002',
    '40000000-0003-0000-0000-000000000003',
    '40000000-0004-0000-0000-000000000004',
    '40000000-0005-0000-0000-000000000005',
    '40000000-0006-0000-0000-000000000006'
);
