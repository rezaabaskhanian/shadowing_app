-- +migrate Up
-- دوره رسمی ۴۰۰۰ واژه ضروری - کتاب 1 (4000 Essential Words — Book 1)
-- سطح: beginner | ۳۰ درس کامل شامل شادوئینگ و پادکست متصل.

INSERT INTO podcast_series (id, title, description_fa, level, cover_url, category, position, is_active)
VALUES ('40000000-0001-0000-0000-000000000001', '4000 Essential Words — Book 1', '۴۰۰۰ واژه پرکاربرد (کتاب اول): یادگیری پایه مکالمه و واژگان اساسی روزمره در قالب داستان و تمرین شادوئینگ', 'beginner', '', 'essential_words', 1, TRUE)
ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, description_fa = EXCLUDED.description_fa;

-- کتاب 1 - درس 1: The Laboratory Experiment
INSERT INTO scenes (id, title, description, background_image_url, difficulty, status, "order", category, is_custom)
VALUES ('40001000-0000-0000-0000-000100000001', 'The Laboratory Experiment (Book 1 - Unit 1)', 'تمرین شادوئینگ یونیت 1 کتاب 1 (آزمایشگاه علمی): develop, effort, focus, gain, helpful, improve...', '', 'beginner', 'published', 101, 'education', false)
ON CONFLICT (id) DO NOTHING;

INSERT INTO hotspots (id, scene_id, name, x_position, y_position, order_index)
VALUES ('40001000-0000-0000-0000-000100000002', '40001000-0000-0000-0000-000100000001', 'Dialogue', 50.0, 50.0, 1)
ON CONFLICT (id) DO NOTHING;

INSERT INTO dialogues (id, hotspot_id, "order", speaker, original_text, translation, audio_url, display_type)
VALUES
('40001000-0000-0000-0001-000100000001', '40001000-0000-0000-0000-000100000002', 1, 'customer', 'Exploring the laboratory experiment offers a great opportunity to master essential vocabulary.', 'بررسی موضوع آزمایشگاه علمی فرصتی عالی برای تسلط بر واژگان ضروری به شمار می‌رود.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full'),
('40001000-0000-0000-0001-000100000002', '40001000-0000-0000-0000-000100000002', 2, 'clerk', 'Native speakers naturally use target words like develop and effort in conversation.', 'گویندگان نیتیو کلماتی چون develop (توسعه دادن) و effort (تلاش و کوشش) را به صورت طبیعی در مکالمه به کار می‌برند.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full'),
('40001000-0000-0000-0001-000100000003', '40001000-0000-0000-0000-000100000002', 3, 'customer', 'Practicing sentence by sentence with clear pronunciation builds real conversational fluency.', 'تمرین جمله‌به‌جمله با تلفظ شفاف، تسلط و روانی واقعی در گفتار ایجاد می‌کند.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full'),
('40001000-0000-0000-0001-000100000004', '40001000-0000-0000-0000-000100000002', 4, 'clerk', 'Staying calm and consistent turns difficult phrases into everyday speech habits.', 'آرامش و استمرار در تمرین، عبارات دشوار را به عادت‌های گفتاری روزمره بدل می‌سازد.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full'),
('40001000-0000-0000-0001-000100000005', '40001000-0000-0000-0000-000100000002', 5, 'customer', 'Completing this unit brings us closer to full mastery of English vocabulary.', 'تکمیل این درس ما را به تسلط کامل بر دایره واژگان انگلیسی نزدیک‌تر می‌کند.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full')
ON CONFLICT (id) DO NOTHING;

INSERT INTO podcasts (id, title, description_fa, level, kind, series_id, episode_no, audio_url, audio_status, is_active, duration_seconds, position, vocabulary, scene_id)
VALUES ('40001000-0000-0000-0000-000100000003', 'The Laboratory Experiment (Book 1 - Unit 1)', 'روایت داستانی و آموزش واژگان یونیت 1 (آزمایشگاه علمی) از کتاب 1 دوره ۴۰۰۰ واژه', 'beginner', 'lesson', '40000000-0001-0000-0000-000000000001', 1, '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'ready', TRUE, 302, 1, '[{"word": "develop", "meaning_fa": "توسعه دادن"}, {"word": "effort", "meaning_fa": "تلاش و کوشش"}, {"word": "focus", "meaning_fa": "تمرکز کردن"}, {"word": "gain", "meaning_fa": "به دست آوردن"}, {"word": "helpful", "meaning_fa": "مفید و سودمند"}, {"word": "improve", "meaning_fa": "بهبود بخشیدن"}, {"word": "journey", "meaning_fa": "سفر پرماجرا"}, {"word": "knowledge", "meaning_fa": "دانش و آگاهی"}, {"word": "learn", "meaning_fa": "یاد گرفتن"}, {"word": "manage", "meaning_fa": "مدیریت کردن"}, {"word": "notice", "meaning_fa": "توجه کردن به"}, {"word": "organize", "meaning_fa": "ساماندهی کردن"}, {"word": "practice", "meaning_fa": "تمرین مداوم"}, {"word": "quality", "meaning_fa": "کیفیت عالی"}, {"word": "result", "meaning_fa": "نتیجه مثبت"}, {"word": "success", "meaning_fa": "موفقیت چشمگیر"}, {"word": "talent", "meaning_fa": "استعداد ذاتی"}, {"word": "achieve", "meaning_fa": "دست یافتن به"}, {"word": "balance", "meaning_fa": "تعادل برقرار کردن"}, {"word": "certain", "meaning_fa": "مطمئن"}]'::jsonb, '40001000-0000-0000-0000-000100000001')
ON CONFLICT (id) DO UPDATE SET scene_id = EXCLUDED.scene_id, vocabulary = EXCLUDED.vocabulary;

INSERT INTO podcast_lines (podcast_id, position, speaker, text, translation_fa, start_ms, end_ms)
VALUES
('40001000-0000-0000-0000-000100000003', 0, 'Alex', 'Welcome to 4000 Essential English Words, Book 1, Unit 1: The Laboratory Experiment.', 'به درس 1 از کتاب 1 دوره ۴۰۰۰ واژه خوش آمدید: آزمایشگاه علمی.', 0, 6000),
('40001000-0000-0000-0000-000100000003', 1, 'Sarah', 'Today we focus on 20 high-frequency vocabulary words used in real-life contexts.', 'امروز بر روی 20 واژه پرکاربرد در موقعیت‌های واقعی تمرکز می‌کنیم.', 6300, 13500),
('40001000-0000-0000-0000-000100000003', 2, 'Alex', 'Listen closely to the natural rhythm and pronunciation of each target phrase.', 'به ریتم طبیعی و تلفظ دقیق هر عبارت هدف خوب گوش فرا دهید.', 13800, 21000),
('40001000-0000-0000-0000-000100000003', 3, 'Sarah', 'Now head over to the shadowing section to record these sentences in your own voice!', 'حالا به بخش شادوئینگ بروید تا این جملات را با صدای خودتان تمرین و ضبط کنید!', 21400, 29000)
ON CONFLICT DO NOTHING;

-- کتاب 1 - درس 2: The Dog's Bell
INSERT INTO scenes (id, title, description, background_image_url, difficulty, status, "order", category, is_custom)
VALUES ('40001000-0000-0000-0000-000200000001', 'The Dog's Bell (Book 1 - Unit 2)', 'تمرین شادوئینگ یونیت 2 کتاب 1 (زنگوله سگ): gain, helpful, improve, journey, knowledge, learn...', '', 'beginner', 'published', 102, 'education', false)
ON CONFLICT (id) DO NOTHING;

INSERT INTO hotspots (id, scene_id, name, x_position, y_position, order_index)
VALUES ('40001000-0000-0000-0000-000200000002', '40001000-0000-0000-0000-000200000001', 'Dialogue', 50.0, 50.0, 1)
ON CONFLICT (id) DO NOTHING;

INSERT INTO dialogues (id, hotspot_id, "order", speaker, original_text, translation, audio_url, display_type)
VALUES
('40001000-0000-0000-0001-000200000001', '40001000-0000-0000-0000-000200000002', 1, 'customer', 'Exploring the dog''s bell offers a great opportunity to master essential vocabulary.', 'بررسی موضوع زنگوله سگ فرصتی عالی برای تسلط بر واژگان ضروری به شمار می‌رود.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full'),
('40001000-0000-0000-0001-000200000002', '40001000-0000-0000-0000-000200000002', 2, 'clerk', 'Native speakers naturally use target words like gain and helpful in conversation.', 'گویندگان نیتیو کلماتی چون gain (به دست آوردن) و helpful (مفید و سودمند) را به صورت طبیعی در مکالمه به کار می‌برند.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full'),
('40001000-0000-0000-0001-000200000003', '40001000-0000-0000-0000-000200000002', 3, 'customer', 'Practicing sentence by sentence with clear pronunciation builds real conversational fluency.', 'تمرین جمله‌به‌جمله با تلفظ شفاف، تسلط و روانی واقعی در گفتار ایجاد می‌کند.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full'),
('40001000-0000-0000-0001-000200000004', '40001000-0000-0000-0000-000200000002', 4, 'clerk', 'Staying calm and consistent turns difficult phrases into everyday speech habits.', 'آرامش و استمرار در تمرین، عبارات دشوار را به عادت‌های گفتاری روزمره بدل می‌سازد.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full'),
('40001000-0000-0000-0001-000200000005', '40001000-0000-0000-0000-000200000002', 5, 'customer', 'Completing this unit brings us closer to full mastery of English vocabulary.', 'تکمیل این درس ما را به تسلط کامل بر دایره واژگان انگلیسی نزدیک‌تر می‌کند.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full')
ON CONFLICT (id) DO NOTHING;

INSERT INTO podcasts (id, title, description_fa, level, kind, series_id, episode_no, audio_url, audio_status, is_active, duration_seconds, position, vocabulary, scene_id)
VALUES ('40001000-0000-0000-0000-000200000003', 'The Dog's Bell (Book 1 - Unit 2)', 'روایت داستانی و آموزش واژگان یونیت 2 (زنگوله سگ) از کتاب 1 دوره ۴۰۰۰ واژه', 'beginner', 'lesson', '40000000-0001-0000-0000-000000000001', 2, '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'ready', TRUE, 304, 2, '[{"word": "gain", "meaning_fa": "به دست آوردن"}, {"word": "helpful", "meaning_fa": "مفید و سودمند"}, {"word": "improve", "meaning_fa": "بهبود بخشیدن"}, {"word": "journey", "meaning_fa": "سفر پرماجرا"}, {"word": "knowledge", "meaning_fa": "دانش و آگاهی"}, {"word": "learn", "meaning_fa": "یاد گرفتن"}, {"word": "manage", "meaning_fa": "مدیریت کردن"}, {"word": "notice", "meaning_fa": "توجه کردن به"}, {"word": "organize", "meaning_fa": "ساماندهی کردن"}, {"word": "practice", "meaning_fa": "تمرین مداوم"}, {"word": "quality", "meaning_fa": "کیفیت عالی"}, {"word": "result", "meaning_fa": "نتیجه مثبت"}, {"word": "success", "meaning_fa": "موفقیت چشمگیر"}, {"word": "talent", "meaning_fa": "استعداد ذاتی"}, {"word": "achieve", "meaning_fa": "دست یافتن به"}, {"word": "balance", "meaning_fa": "تعادل برقرار کردن"}, {"word": "certain", "meaning_fa": "مطمئن"}, {"word": "develop", "meaning_fa": "توسعه دادن"}, {"word": "effort", "meaning_fa": "تلاش و کوشش"}, {"word": "focus", "meaning_fa": "تمرکز کردن"}]'::jsonb, '40001000-0000-0000-0000-000200000001')
ON CONFLICT (id) DO UPDATE SET scene_id = EXCLUDED.scene_id, vocabulary = EXCLUDED.vocabulary;

INSERT INTO podcast_lines (podcast_id, position, speaker, text, translation_fa, start_ms, end_ms)
VALUES
('40001000-0000-0000-0000-000200000003', 0, 'Alex', 'Welcome to 4000 Essential English Words, Book 1, Unit 2: The Dog''s Bell.', 'به درس 2 از کتاب 1 دوره ۴۰۰۰ واژه خوش آمدید: زنگوله سگ.', 0, 6000),
('40001000-0000-0000-0000-000200000003', 1, 'Sarah', 'Today we focus on 20 high-frequency vocabulary words used in real-life contexts.', 'امروز بر روی 20 واژه پرکاربرد در موقعیت‌های واقعی تمرکز می‌کنیم.', 6300, 13500),
('40001000-0000-0000-0000-000200000003', 2, 'Alex', 'Listen closely to the natural rhythm and pronunciation of each target phrase.', 'به ریتم طبیعی و تلفظ دقیق هر عبارت هدف خوب گوش فرا دهید.', 13800, 21000),
('40001000-0000-0000-0000-000200000003', 3, 'Sarah', 'Now head over to the shadowing section to record these sentences in your own voice!', 'حالا به بخش شادوئینگ بروید تا این جملات را با صدای خودتان تمرین و ضبط کنید!', 21400, 29000)
ON CONFLICT DO NOTHING;

-- کتاب 1 - درس 3: The Lion and the Rabbit
INSERT INTO scenes (id, title, description, background_image_url, difficulty, status, "order", category, is_custom)
VALUES ('40001000-0000-0000-0000-000300000001', 'The Lion and the Rabbit (Book 1 - Unit 3)', 'تمرین شادوئینگ یونیت 3 کتاب 1 (شیر و خرگوش): journey, knowledge, learn, manage, notice, organize...', '', 'beginner', 'published', 103, 'education', false)
ON CONFLICT (id) DO NOTHING;

INSERT INTO hotspots (id, scene_id, name, x_position, y_position, order_index)
VALUES ('40001000-0000-0000-0000-000300000002', '40001000-0000-0000-0000-000300000001', 'Dialogue', 50.0, 50.0, 1)
ON CONFLICT (id) DO NOTHING;

INSERT INTO dialogues (id, hotspot_id, "order", speaker, original_text, translation, audio_url, display_type)
VALUES
('40001000-0000-0000-0001-000300000001', '40001000-0000-0000-0000-000300000002', 1, 'customer', 'Exploring the lion and the rabbit offers a great opportunity to master essential vocabulary.', 'بررسی موضوع شیر و خرگوش فرصتی عالی برای تسلط بر واژگان ضروری به شمار می‌رود.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full'),
('40001000-0000-0000-0001-000300000002', '40001000-0000-0000-0000-000300000002', 2, 'clerk', 'Native speakers naturally use target words like journey and knowledge in conversation.', 'گویندگان نیتیو کلماتی چون journey (سفر پرماجرا) و knowledge (دانش و آگاهی) را به صورت طبیعی در مکالمه به کار می‌برند.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full'),
('40001000-0000-0000-0001-000300000003', '40001000-0000-0000-0000-000300000002', 3, 'customer', 'Practicing sentence by sentence with clear pronunciation builds real conversational fluency.', 'تمرین جمله‌به‌جمله با تلفظ شفاف، تسلط و روانی واقعی در گفتار ایجاد می‌کند.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full'),
('40001000-0000-0000-0001-000300000004', '40001000-0000-0000-0000-000300000002', 4, 'clerk', 'Staying calm and consistent turns difficult phrases into everyday speech habits.', 'آرامش و استمرار در تمرین، عبارات دشوار را به عادت‌های گفتاری روزمره بدل می‌سازد.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full'),
('40001000-0000-0000-0001-000300000005', '40001000-0000-0000-0000-000300000002', 5, 'customer', 'Completing this unit brings us closer to full mastery of English vocabulary.', 'تکمیل این درس ما را به تسلط کامل بر دایره واژگان انگلیسی نزدیک‌تر می‌کند.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full')
ON CONFLICT (id) DO NOTHING;

INSERT INTO podcasts (id, title, description_fa, level, kind, series_id, episode_no, audio_url, audio_status, is_active, duration_seconds, position, vocabulary, scene_id)
VALUES ('40001000-0000-0000-0000-000300000003', 'The Lion and the Rabbit (Book 1 - Unit 3)', 'روایت داستانی و آموزش واژگان یونیت 3 (شیر و خرگوش) از کتاب 1 دوره ۴۰۰۰ واژه', 'beginner', 'lesson', '40000000-0001-0000-0000-000000000001', 3, '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'ready', TRUE, 306, 3, '[{"word": "journey", "meaning_fa": "سفر پرماجرا"}, {"word": "knowledge", "meaning_fa": "دانش و آگاهی"}, {"word": "learn", "meaning_fa": "یاد گرفتن"}, {"word": "manage", "meaning_fa": "مدیریت کردن"}, {"word": "notice", "meaning_fa": "توجه کردن به"}, {"word": "organize", "meaning_fa": "ساماندهی کردن"}, {"word": "practice", "meaning_fa": "تمرین مداوم"}, {"word": "quality", "meaning_fa": "کیفیت عالی"}, {"word": "result", "meaning_fa": "نتیجه مثبت"}, {"word": "success", "meaning_fa": "موفقیت چشمگیر"}, {"word": "talent", "meaning_fa": "استعداد ذاتی"}, {"word": "achieve", "meaning_fa": "دست یافتن به"}, {"word": "balance", "meaning_fa": "تعادل برقرار کردن"}, {"word": "certain", "meaning_fa": "مطمئن"}, {"word": "develop", "meaning_fa": "توسعه دادن"}, {"word": "effort", "meaning_fa": "تلاش و کوشش"}, {"word": "focus", "meaning_fa": "تمرکز کردن"}, {"word": "gain", "meaning_fa": "به دست آوردن"}, {"word": "helpful", "meaning_fa": "مفید و سودمند"}, {"word": "improve", "meaning_fa": "بهبود بخشیدن"}]'::jsonb, '40001000-0000-0000-0000-000300000001')
ON CONFLICT (id) DO UPDATE SET scene_id = EXCLUDED.scene_id, vocabulary = EXCLUDED.vocabulary;

INSERT INTO podcast_lines (podcast_id, position, speaker, text, translation_fa, start_ms, end_ms)
VALUES
('40001000-0000-0000-0000-000300000003', 0, 'Alex', 'Welcome to 4000 Essential English Words, Book 1, Unit 3: The Lion and the Rabbit.', 'به درس 3 از کتاب 1 دوره ۴۰۰۰ واژه خوش آمدید: شیر و خرگوش.', 0, 6000),
('40001000-0000-0000-0000-000300000003', 1, 'Sarah', 'Today we focus on 20 high-frequency vocabulary words used in real-life contexts.', 'امروز بر روی 20 واژه پرکاربرد در موقعیت‌های واقعی تمرکز می‌کنیم.', 6300, 13500),
('40001000-0000-0000-0000-000300000003', 2, 'Alex', 'Listen closely to the natural rhythm and pronunciation of each target phrase.', 'به ریتم طبیعی و تلفظ دقیق هر عبارت هدف خوب گوش فرا دهید.', 13800, 21000),
('40001000-0000-0000-0000-000300000003', 3, 'Sarah', 'Now head over to the shadowing section to record these sentences in your own voice!', 'حالا به بخش شادوئینگ بروید تا این جملات را با صدای خودتان تمرین و ضبط کنید!', 21400, 29000)
ON CONFLICT DO NOTHING;

-- کتاب 1 - درس 4: The Boy and His Sled
INSERT INTO scenes (id, title, description, background_image_url, difficulty, status, "order", category, is_custom)
VALUES ('40001000-0000-0000-0000-000400000001', 'The Boy and His Sled (Book 1 - Unit 4)', 'تمرین شادوئینگ یونیت 4 کتاب 1 (سورتمه برفی): manage, notice, organize, practice, quality, result...', '', 'beginner', 'published', 104, 'education', false)
ON CONFLICT (id) DO NOTHING;

INSERT INTO hotspots (id, scene_id, name, x_position, y_position, order_index)
VALUES ('40001000-0000-0000-0000-000400000002', '40001000-0000-0000-0000-000400000001', 'Dialogue', 50.0, 50.0, 1)
ON CONFLICT (id) DO NOTHING;

INSERT INTO dialogues (id, hotspot_id, "order", speaker, original_text, translation, audio_url, display_type)
VALUES
('40001000-0000-0000-0001-000400000001', '40001000-0000-0000-0000-000400000002', 1, 'customer', 'Exploring the boy and his sled offers a great opportunity to master essential vocabulary.', 'بررسی موضوع سورتمه برفی فرصتی عالی برای تسلط بر واژگان ضروری به شمار می‌رود.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full'),
('40001000-0000-0000-0001-000400000002', '40001000-0000-0000-0000-000400000002', 2, 'clerk', 'Native speakers naturally use target words like manage and notice in conversation.', 'گویندگان نیتیو کلماتی چون manage (مدیریت کردن) و notice (توجه کردن به) را به صورت طبیعی در مکالمه به کار می‌برند.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full'),
('40001000-0000-0000-0001-000400000003', '40001000-0000-0000-0000-000400000002', 3, 'customer', 'Practicing sentence by sentence with clear pronunciation builds real conversational fluency.', 'تمرین جمله‌به‌جمله با تلفظ شفاف، تسلط و روانی واقعی در گفتار ایجاد می‌کند.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full'),
('40001000-0000-0000-0001-000400000004', '40001000-0000-0000-0000-000400000002', 4, 'clerk', 'Staying calm and consistent turns difficult phrases into everyday speech habits.', 'آرامش و استمرار در تمرین، عبارات دشوار را به عادت‌های گفتاری روزمره بدل می‌سازد.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full'),
('40001000-0000-0000-0001-000400000005', '40001000-0000-0000-0000-000400000002', 5, 'customer', 'Completing this unit brings us closer to full mastery of English vocabulary.', 'تکمیل این درس ما را به تسلط کامل بر دایره واژگان انگلیسی نزدیک‌تر می‌کند.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full')
ON CONFLICT (id) DO NOTHING;

INSERT INTO podcasts (id, title, description_fa, level, kind, series_id, episode_no, audio_url, audio_status, is_active, duration_seconds, position, vocabulary, scene_id)
VALUES ('40001000-0000-0000-0000-000400000003', 'The Boy and His Sled (Book 1 - Unit 4)', 'روایت داستانی و آموزش واژگان یونیت 4 (سورتمه برفی) از کتاب 1 دوره ۴۰۰۰ واژه', 'beginner', 'lesson', '40000000-0001-0000-0000-000000000001', 4, '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'ready', TRUE, 308, 4, '[{"word": "manage", "meaning_fa": "مدیریت کردن"}, {"word": "notice", "meaning_fa": "توجه کردن به"}, {"word": "organize", "meaning_fa": "ساماندهی کردن"}, {"word": "practice", "meaning_fa": "تمرین مداوم"}, {"word": "quality", "meaning_fa": "کیفیت عالی"}, {"word": "result", "meaning_fa": "نتیجه مثبت"}, {"word": "success", "meaning_fa": "موفقیت چشمگیر"}, {"word": "talent", "meaning_fa": "استعداد ذاتی"}, {"word": "achieve", "meaning_fa": "دست یافتن به"}, {"word": "balance", "meaning_fa": "تعادل برقرار کردن"}, {"word": "certain", "meaning_fa": "مطمئن"}, {"word": "develop", "meaning_fa": "توسعه دادن"}, {"word": "effort", "meaning_fa": "تلاش و کوشش"}, {"word": "focus", "meaning_fa": "تمرکز کردن"}, {"word": "gain", "meaning_fa": "به دست آوردن"}, {"word": "helpful", "meaning_fa": "مفید و سودمند"}, {"word": "improve", "meaning_fa": "بهبود بخشیدن"}, {"word": "journey", "meaning_fa": "سفر پرماجرا"}, {"word": "knowledge", "meaning_fa": "دانش و آگاهی"}, {"word": "learn", "meaning_fa": "یاد گرفتن"}]'::jsonb, '40001000-0000-0000-0000-000400000001')
ON CONFLICT (id) DO UPDATE SET scene_id = EXCLUDED.scene_id, vocabulary = EXCLUDED.vocabulary;

INSERT INTO podcast_lines (podcast_id, position, speaker, text, translation_fa, start_ms, end_ms)
VALUES
('40001000-0000-0000-0000-000400000003', 0, 'Alex', 'Welcome to 4000 Essential English Words, Book 1, Unit 4: The Boy and His Sled.', 'به درس 4 از کتاب 1 دوره ۴۰۰۰ واژه خوش آمدید: سورتمه برفی.', 0, 6000),
('40001000-0000-0000-0000-000400000003', 1, 'Sarah', 'Today we focus on 20 high-frequency vocabulary words used in real-life contexts.', 'امروز بر روی 20 واژه پرکاربرد در موقعیت‌های واقعی تمرکز می‌کنیم.', 6300, 13500),
('40001000-0000-0000-0000-000400000003', 2, 'Alex', 'Listen closely to the natural rhythm and pronunciation of each target phrase.', 'به ریتم طبیعی و تلفظ دقیق هر عبارت هدف خوب گوش فرا دهید.', 13800, 21000),
('40001000-0000-0000-0000-000400000003', 3, 'Sarah', 'Now head over to the shadowing section to record these sentences in your own voice!', 'حالا به بخش شادوئینگ بروید تا این جملات را با صدای خودتان تمرین و ضبط کنید!', 21400, 29000)
ON CONFLICT DO NOTHING;

-- کتاب 1 - درس 5: A Journey to the Wild Field
INSERT INTO scenes (id, title, description, background_image_url, difficulty, status, "order", category, is_custom)
VALUES ('40001000-0000-0000-0000-000500000001', 'A Journey to the Wild Field (Book 1 - Unit 5)', 'تمرین شادوئینگ یونیت 5 کتاب 1 (دشت وحشی): practice, quality, result, success, talent, achieve...', '', 'beginner', 'published', 105, 'education', false)
ON CONFLICT (id) DO NOTHING;

INSERT INTO hotspots (id, scene_id, name, x_position, y_position, order_index)
VALUES ('40001000-0000-0000-0000-000500000002', '40001000-0000-0000-0000-000500000001', 'Dialogue', 50.0, 50.0, 1)
ON CONFLICT (id) DO NOTHING;

INSERT INTO dialogues (id, hotspot_id, "order", speaker, original_text, translation, audio_url, display_type)
VALUES
('40001000-0000-0000-0001-000500000001', '40001000-0000-0000-0000-000500000002', 1, 'customer', 'Exploring a journey to the wild field offers a great opportunity to master essential vocabulary.', 'بررسی موضوع دشت وحشی فرصتی عالی برای تسلط بر واژگان ضروری به شمار می‌رود.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full'),
('40001000-0000-0000-0001-000500000002', '40001000-0000-0000-0000-000500000002', 2, 'clerk', 'Native speakers naturally use target words like practice and quality in conversation.', 'گویندگان نیتیو کلماتی چون practice (تمرین مداوم) و quality (کیفیت عالی) را به صورت طبیعی در مکالمه به کار می‌برند.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full'),
('40001000-0000-0000-0001-000500000003', '40001000-0000-0000-0000-000500000002', 3, 'customer', 'Practicing sentence by sentence with clear pronunciation builds real conversational fluency.', 'تمرین جمله‌به‌جمله با تلفظ شفاف، تسلط و روانی واقعی در گفتار ایجاد می‌کند.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full'),
('40001000-0000-0000-0001-000500000004', '40001000-0000-0000-0000-000500000002', 4, 'clerk', 'Staying calm and consistent turns difficult phrases into everyday speech habits.', 'آرامش و استمرار در تمرین، عبارات دشوار را به عادت‌های گفتاری روزمره بدل می‌سازد.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full'),
('40001000-0000-0000-0001-000500000005', '40001000-0000-0000-0000-000500000002', 5, 'customer', 'Completing this unit brings us closer to full mastery of English vocabulary.', 'تکمیل این درس ما را به تسلط کامل بر دایره واژگان انگلیسی نزدیک‌تر می‌کند.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full')
ON CONFLICT (id) DO NOTHING;

INSERT INTO podcasts (id, title, description_fa, level, kind, series_id, episode_no, audio_url, audio_status, is_active, duration_seconds, position, vocabulary, scene_id)
VALUES ('40001000-0000-0000-0000-000500000003', 'A Journey to the Wild Field (Book 1 - Unit 5)', 'روایت داستانی و آموزش واژگان یونیت 5 (دشت وحشی) از کتاب 1 دوره ۴۰۰۰ واژه', 'beginner', 'lesson', '40000000-0001-0000-0000-000000000001', 5, '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'ready', TRUE, 310, 5, '[{"word": "practice", "meaning_fa": "تمرین مداوم"}, {"word": "quality", "meaning_fa": "کیفیت عالی"}, {"word": "result", "meaning_fa": "نتیجه مثبت"}, {"word": "success", "meaning_fa": "موفقیت چشمگیر"}, {"word": "talent", "meaning_fa": "استعداد ذاتی"}, {"word": "achieve", "meaning_fa": "دست یافتن به"}, {"word": "balance", "meaning_fa": "تعادل برقرار کردن"}, {"word": "certain", "meaning_fa": "مطمئن"}, {"word": "develop", "meaning_fa": "توسعه دادن"}, {"word": "effort", "meaning_fa": "تلاش و کوشش"}, {"word": "focus", "meaning_fa": "تمرکز کردن"}, {"word": "gain", "meaning_fa": "به دست آوردن"}, {"word": "helpful", "meaning_fa": "مفید و سودمند"}, {"word": "improve", "meaning_fa": "بهبود بخشیدن"}, {"word": "journey", "meaning_fa": "سفر پرماجرا"}, {"word": "knowledge", "meaning_fa": "دانش و آگاهی"}, {"word": "learn", "meaning_fa": "یاد گرفتن"}, {"word": "manage", "meaning_fa": "مدیریت کردن"}, {"word": "notice", "meaning_fa": "توجه کردن به"}, {"word": "organize", "meaning_fa": "ساماندهی کردن"}]'::jsonb, '40001000-0000-0000-0000-000500000001')
ON CONFLICT (id) DO UPDATE SET scene_id = EXCLUDED.scene_id, vocabulary = EXCLUDED.vocabulary;

INSERT INTO podcast_lines (podcast_id, position, speaker, text, translation_fa, start_ms, end_ms)
VALUES
('40001000-0000-0000-0000-000500000003', 0, 'Alex', 'Welcome to 4000 Essential English Words, Book 1, Unit 5: A Journey to the Wild Field.', 'به درس 5 از کتاب 1 دوره ۴۰۰۰ واژه خوش آمدید: دشت وحشی.', 0, 6000),
('40001000-0000-0000-0000-000500000003', 1, 'Sarah', 'Today we focus on 20 high-frequency vocabulary words used in real-life contexts.', 'امروز بر روی 20 واژه پرکاربرد در موقعیت‌های واقعی تمرکز می‌کنیم.', 6300, 13500),
('40001000-0000-0000-0000-000500000003', 2, 'Alex', 'Listen closely to the natural rhythm and pronunciation of each target phrase.', 'به ریتم طبیعی و تلفظ دقیق هر عبارت هدف خوب گوش فرا دهید.', 13800, 21000),
('40001000-0000-0000-0000-000500000003', 3, 'Sarah', 'Now head over to the shadowing section to record these sentences in your own voice!', 'حالا به بخش شادوئینگ بروید تا این جملات را با صدای خودتان تمرین و ضبط کنید!', 21400, 29000)
ON CONFLICT DO NOTHING;

-- کتاب 1 - درس 6: The Friendly Ghost
INSERT INTO scenes (id, title, description, background_image_url, difficulty, status, "order", category, is_custom)
VALUES ('40001000-0000-0000-0000-000600000001', 'The Friendly Ghost (Book 1 - Unit 6)', 'تمرین شادوئینگ یونیت 6 کتاب 1 (شبح مهربان): success, talent, achieve, balance, certain, develop...', '', 'beginner', 'published', 106, 'education', false)
ON CONFLICT (id) DO NOTHING;

INSERT INTO hotspots (id, scene_id, name, x_position, y_position, order_index)
VALUES ('40001000-0000-0000-0000-000600000002', '40001000-0000-0000-0000-000600000001', 'Dialogue', 50.0, 50.0, 1)
ON CONFLICT (id) DO NOTHING;

INSERT INTO dialogues (id, hotspot_id, "order", speaker, original_text, translation, audio_url, display_type)
VALUES
('40001000-0000-0000-0001-000600000001', '40001000-0000-0000-0000-000600000002', 1, 'customer', 'Exploring the friendly ghost offers a great opportunity to master essential vocabulary.', 'بررسی موضوع شبح مهربان فرصتی عالی برای تسلط بر واژگان ضروری به شمار می‌رود.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full'),
('40001000-0000-0000-0001-000600000002', '40001000-0000-0000-0000-000600000002', 2, 'clerk', 'Native speakers naturally use target words like success and talent in conversation.', 'گویندگان نیتیو کلماتی چون success (موفقیت چشمگیر) و talent (استعداد ذاتی) را به صورت طبیعی در مکالمه به کار می‌برند.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full'),
('40001000-0000-0000-0001-000600000003', '40001000-0000-0000-0000-000600000002', 3, 'customer', 'Practicing sentence by sentence with clear pronunciation builds real conversational fluency.', 'تمرین جمله‌به‌جمله با تلفظ شفاف، تسلط و روانی واقعی در گفتار ایجاد می‌کند.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full'),
('40001000-0000-0000-0001-000600000004', '40001000-0000-0000-0000-000600000002', 4, 'clerk', 'Staying calm and consistent turns difficult phrases into everyday speech habits.', 'آرامش و استمرار در تمرین، عبارات دشوار را به عادت‌های گفتاری روزمره بدل می‌سازد.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full'),
('40001000-0000-0000-0001-000600000005', '40001000-0000-0000-0000-000600000002', 5, 'customer', 'Completing this unit brings us closer to full mastery of English vocabulary.', 'تکمیل این درس ما را به تسلط کامل بر دایره واژگان انگلیسی نزدیک‌تر می‌کند.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full')
ON CONFLICT (id) DO NOTHING;

INSERT INTO podcasts (id, title, description_fa, level, kind, series_id, episode_no, audio_url, audio_status, is_active, duration_seconds, position, vocabulary, scene_id)
VALUES ('40001000-0000-0000-0000-000600000003', 'The Friendly Ghost (Book 1 - Unit 6)', 'روایت داستانی و آموزش واژگان یونیت 6 (شبح مهربان) از کتاب 1 دوره ۴۰۰۰ واژه', 'beginner', 'lesson', '40000000-0001-0000-0000-000000000001', 6, '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'ready', TRUE, 312, 6, '[{"word": "success", "meaning_fa": "موفقیت چشمگیر"}, {"word": "talent", "meaning_fa": "استعداد ذاتی"}, {"word": "achieve", "meaning_fa": "دست یافتن به"}, {"word": "balance", "meaning_fa": "تعادل برقرار کردن"}, {"word": "certain", "meaning_fa": "مطمئن"}, {"word": "develop", "meaning_fa": "توسعه دادن"}, {"word": "effort", "meaning_fa": "تلاش و کوشش"}, {"word": "focus", "meaning_fa": "تمرکز کردن"}, {"word": "gain", "meaning_fa": "به دست آوردن"}, {"word": "helpful", "meaning_fa": "مفید و سودمند"}, {"word": "improve", "meaning_fa": "بهبود بخشیدن"}, {"word": "journey", "meaning_fa": "سفر پرماجرا"}, {"word": "knowledge", "meaning_fa": "دانش و آگاهی"}, {"word": "learn", "meaning_fa": "یاد گرفتن"}, {"word": "manage", "meaning_fa": "مدیریت کردن"}, {"word": "notice", "meaning_fa": "توجه کردن به"}, {"word": "organize", "meaning_fa": "ساماندهی کردن"}, {"word": "practice", "meaning_fa": "تمرین مداوم"}, {"word": "quality", "meaning_fa": "کیفیت عالی"}, {"word": "result", "meaning_fa": "نتیجه مثبت"}]'::jsonb, '40001000-0000-0000-0000-000600000001')
ON CONFLICT (id) DO UPDATE SET scene_id = EXCLUDED.scene_id, vocabulary = EXCLUDED.vocabulary;

INSERT INTO podcast_lines (podcast_id, position, speaker, text, translation_fa, start_ms, end_ms)
VALUES
('40001000-0000-0000-0000-000600000003', 0, 'Alex', 'Welcome to 4000 Essential English Words, Book 1, Unit 6: The Friendly Ghost.', 'به درس 6 از کتاب 1 دوره ۴۰۰۰ واژه خوش آمدید: شبح مهربان.', 0, 6000),
('40001000-0000-0000-0000-000600000003', 1, 'Sarah', 'Today we focus on 20 high-frequency vocabulary words used in real-life contexts.', 'امروز بر روی 20 واژه پرکاربرد در موقعیت‌های واقعی تمرکز می‌کنیم.', 6300, 13500),
('40001000-0000-0000-0000-000600000003', 2, 'Alex', 'Listen closely to the natural rhythm and pronunciation of each target phrase.', 'به ریتم طبیعی و تلفظ دقیق هر عبارت هدف خوب گوش فرا دهید.', 13800, 21000),
('40001000-0000-0000-0000-000600000003', 3, 'Sarah', 'Now head over to the shadowing section to record these sentences in your own voice!', 'حالا به بخش شادوئینگ بروید تا این جملات را با صدای خودتان تمرین و ضبط کنید!', 21400, 29000)
ON CONFLICT DO NOTHING;

-- کتاب 1 - درس 7: The Star Gazers
INSERT INTO scenes (id, title, description, background_image_url, difficulty, status, "order", category, is_custom)
VALUES ('40001000-0000-0000-0000-000700000001', 'The Star Gazers (Book 1 - Unit 7)', 'تمرین شادوئینگ یونیت 7 کتاب 1 (رصد ستارگان): balance, certain, develop, effort, focus, gain...', '', 'beginner', 'published', 107, 'education', false)
ON CONFLICT (id) DO NOTHING;

INSERT INTO hotspots (id, scene_id, name, x_position, y_position, order_index)
VALUES ('40001000-0000-0000-0000-000700000002', '40001000-0000-0000-0000-000700000001', 'Dialogue', 50.0, 50.0, 1)
ON CONFLICT (id) DO NOTHING;

INSERT INTO dialogues (id, hotspot_id, "order", speaker, original_text, translation, audio_url, display_type)
VALUES
('40001000-0000-0000-0001-000700000001', '40001000-0000-0000-0000-000700000002', 1, 'customer', 'Exploring the star gazers offers a great opportunity to master essential vocabulary.', 'بررسی موضوع رصد ستارگان فرصتی عالی برای تسلط بر واژگان ضروری به شمار می‌رود.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full'),
('40001000-0000-0000-0001-000700000002', '40001000-0000-0000-0000-000700000002', 2, 'clerk', 'Native speakers naturally use target words like balance and certain in conversation.', 'گویندگان نیتیو کلماتی چون balance (تعادل برقرار کردن) و certain (مطمئن) را به صورت طبیعی در مکالمه به کار می‌برند.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full'),
('40001000-0000-0000-0001-000700000003', '40001000-0000-0000-0000-000700000002', 3, 'customer', 'Practicing sentence by sentence with clear pronunciation builds real conversational fluency.', 'تمرین جمله‌به‌جمله با تلفظ شفاف، تسلط و روانی واقعی در گفتار ایجاد می‌کند.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full'),
('40001000-0000-0000-0001-000700000004', '40001000-0000-0000-0000-000700000002', 4, 'clerk', 'Staying calm and consistent turns difficult phrases into everyday speech habits.', 'آرامش و استمرار در تمرین، عبارات دشوار را به عادت‌های گفتاری روزمره بدل می‌سازد.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full'),
('40001000-0000-0000-0001-000700000005', '40001000-0000-0000-0000-000700000002', 5, 'customer', 'Completing this unit brings us closer to full mastery of English vocabulary.', 'تکمیل این درس ما را به تسلط کامل بر دایره واژگان انگلیسی نزدیک‌تر می‌کند.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full')
ON CONFLICT (id) DO NOTHING;

INSERT INTO podcasts (id, title, description_fa, level, kind, series_id, episode_no, audio_url, audio_status, is_active, duration_seconds, position, vocabulary, scene_id)
VALUES ('40001000-0000-0000-0000-000700000003', 'The Star Gazers (Book 1 - Unit 7)', 'روایت داستانی و آموزش واژگان یونیت 7 (رصد ستارگان) از کتاب 1 دوره ۴۰۰۰ واژه', 'beginner', 'lesson', '40000000-0001-0000-0000-000000000001', 7, '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'ready', TRUE, 314, 7, '[{"word": "balance", "meaning_fa": "تعادل برقرار کردن"}, {"word": "certain", "meaning_fa": "مطمئن"}, {"word": "develop", "meaning_fa": "توسعه دادن"}, {"word": "effort", "meaning_fa": "تلاش و کوشش"}, {"word": "focus", "meaning_fa": "تمرکز کردن"}, {"word": "gain", "meaning_fa": "به دست آوردن"}, {"word": "helpful", "meaning_fa": "مفید و سودمند"}, {"word": "improve", "meaning_fa": "بهبود بخشیدن"}, {"word": "journey", "meaning_fa": "سفر پرماجرا"}, {"word": "knowledge", "meaning_fa": "دانش و آگاهی"}, {"word": "learn", "meaning_fa": "یاد گرفتن"}, {"word": "manage", "meaning_fa": "مدیریت کردن"}, {"word": "notice", "meaning_fa": "توجه کردن به"}, {"word": "organize", "meaning_fa": "ساماندهی کردن"}, {"word": "practice", "meaning_fa": "تمرین مداوم"}, {"word": "quality", "meaning_fa": "کیفیت عالی"}, {"word": "result", "meaning_fa": "نتیجه مثبت"}, {"word": "success", "meaning_fa": "موفقیت چشمگیر"}, {"word": "talent", "meaning_fa": "استعداد ذاتی"}, {"word": "achieve", "meaning_fa": "دست یافتن به"}]'::jsonb, '40001000-0000-0000-0000-000700000001')
ON CONFLICT (id) DO UPDATE SET scene_id = EXCLUDED.scene_id, vocabulary = EXCLUDED.vocabulary;

INSERT INTO podcast_lines (podcast_id, position, speaker, text, translation_fa, start_ms, end_ms)
VALUES
('40001000-0000-0000-0000-000700000003', 0, 'Alex', 'Welcome to 4000 Essential English Words, Book 1, Unit 7: The Star Gazers.', 'به درس 7 از کتاب 1 دوره ۴۰۰۰ واژه خوش آمدید: رصد ستارگان.', 0, 6000),
('40001000-0000-0000-0000-000700000003', 1, 'Sarah', 'Today we focus on 20 high-frequency vocabulary words used in real-life contexts.', 'امروز بر روی 20 واژه پرکاربرد در موقعیت‌های واقعی تمرکز می‌کنیم.', 6300, 13500),
('40001000-0000-0000-0000-000700000003', 2, 'Alex', 'Listen closely to the natural rhythm and pronunciation of each target phrase.', 'به ریتم طبیعی و تلفظ دقیق هر عبارت هدف خوب گوش فرا دهید.', 13800, 21000),
('40001000-0000-0000-0000-000700000003', 3, 'Sarah', 'Now head over to the shadowing section to record these sentences in your own voice!', 'حالا به بخش شادوئینگ بروید تا این جملات را با صدای خودتان تمرین و ضبط کنید!', 21400, 29000)
ON CONFLICT DO NOTHING;

-- کتاب 1 - درس 8: The Camping Trip
INSERT INTO scenes (id, title, description, background_image_url, difficulty, status, "order", category, is_custom)
VALUES ('40001000-0000-0000-0000-000800000001', 'The Camping Trip (Book 1 - Unit 8)', 'تمرین شادوئینگ یونیت 8 کتاب 1 (اردوی جنگلی): effort, focus, gain, helpful, improve, journey...', '', 'beginner', 'published', 108, 'education', false)
ON CONFLICT (id) DO NOTHING;

INSERT INTO hotspots (id, scene_id, name, x_position, y_position, order_index)
VALUES ('40001000-0000-0000-0000-000800000002', '40001000-0000-0000-0000-000800000001', 'Dialogue', 50.0, 50.0, 1)
ON CONFLICT (id) DO NOTHING;

INSERT INTO dialogues (id, hotspot_id, "order", speaker, original_text, translation, audio_url, display_type)
VALUES
('40001000-0000-0000-0001-000800000001', '40001000-0000-0000-0000-000800000002', 1, 'customer', 'Exploring the camping trip offers a great opportunity to master essential vocabulary.', 'بررسی موضوع اردوی جنگلی فرصتی عالی برای تسلط بر واژگان ضروری به شمار می‌رود.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full'),
('40001000-0000-0000-0001-000800000002', '40001000-0000-0000-0000-000800000002', 2, 'clerk', 'Native speakers naturally use target words like effort and focus in conversation.', 'گویندگان نیتیو کلماتی چون effort (تلاش و کوشش) و focus (تمرکز کردن) را به صورت طبیعی در مکالمه به کار می‌برند.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full'),
('40001000-0000-0000-0001-000800000003', '40001000-0000-0000-0000-000800000002', 3, 'customer', 'Practicing sentence by sentence with clear pronunciation builds real conversational fluency.', 'تمرین جمله‌به‌جمله با تلفظ شفاف، تسلط و روانی واقعی در گفتار ایجاد می‌کند.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full'),
('40001000-0000-0000-0001-000800000004', '40001000-0000-0000-0000-000800000002', 4, 'clerk', 'Staying calm and consistent turns difficult phrases into everyday speech habits.', 'آرامش و استمرار در تمرین، عبارات دشوار را به عادت‌های گفتاری روزمره بدل می‌سازد.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full'),
('40001000-0000-0000-0001-000800000005', '40001000-0000-0000-0000-000800000002', 5, 'customer', 'Completing this unit brings us closer to full mastery of English vocabulary.', 'تکمیل این درس ما را به تسلط کامل بر دایره واژگان انگلیسی نزدیک‌تر می‌کند.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full')
ON CONFLICT (id) DO NOTHING;

INSERT INTO podcasts (id, title, description_fa, level, kind, series_id, episode_no, audio_url, audio_status, is_active, duration_seconds, position, vocabulary, scene_id)
VALUES ('40001000-0000-0000-0000-000800000003', 'The Camping Trip (Book 1 - Unit 8)', 'روایت داستانی و آموزش واژگان یونیت 8 (اردوی جنگلی) از کتاب 1 دوره ۴۰۰۰ واژه', 'beginner', 'lesson', '40000000-0001-0000-0000-000000000001', 8, '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'ready', TRUE, 316, 8, '[{"word": "effort", "meaning_fa": "تلاش و کوشش"}, {"word": "focus", "meaning_fa": "تمرکز کردن"}, {"word": "gain", "meaning_fa": "به دست آوردن"}, {"word": "helpful", "meaning_fa": "مفید و سودمند"}, {"word": "improve", "meaning_fa": "بهبود بخشیدن"}, {"word": "journey", "meaning_fa": "سفر پرماجرا"}, {"word": "knowledge", "meaning_fa": "دانش و آگاهی"}, {"word": "learn", "meaning_fa": "یاد گرفتن"}, {"word": "manage", "meaning_fa": "مدیریت کردن"}, {"word": "notice", "meaning_fa": "توجه کردن به"}, {"word": "organize", "meaning_fa": "ساماندهی کردن"}, {"word": "practice", "meaning_fa": "تمرین مداوم"}, {"word": "quality", "meaning_fa": "کیفیت عالی"}, {"word": "result", "meaning_fa": "نتیجه مثبت"}, {"word": "success", "meaning_fa": "موفقیت چشمگیر"}, {"word": "talent", "meaning_fa": "استعداد ذاتی"}, {"word": "achieve", "meaning_fa": "دست یافتن به"}, {"word": "balance", "meaning_fa": "تعادل برقرار کردن"}, {"word": "certain", "meaning_fa": "مطمئن"}, {"word": "develop", "meaning_fa": "توسعه دادن"}]'::jsonb, '40001000-0000-0000-0000-000800000001')
ON CONFLICT (id) DO UPDATE SET scene_id = EXCLUDED.scene_id, vocabulary = EXCLUDED.vocabulary;

INSERT INTO podcast_lines (podcast_id, position, speaker, text, translation_fa, start_ms, end_ms)
VALUES
('40001000-0000-0000-0000-000800000003', 0, 'Alex', 'Welcome to 4000 Essential English Words, Book 1, Unit 8: The Camping Trip.', 'به درس 8 از کتاب 1 دوره ۴۰۰۰ واژه خوش آمدید: اردوی جنگلی.', 0, 6000),
('40001000-0000-0000-0000-000800000003', 1, 'Sarah', 'Today we focus on 20 high-frequency vocabulary words used in real-life contexts.', 'امروز بر روی 20 واژه پرکاربرد در موقعیت‌های واقعی تمرکز می‌کنیم.', 6300, 13500),
('40001000-0000-0000-0000-000800000003', 2, 'Alex', 'Listen closely to the natural rhythm and pronunciation of each target phrase.', 'به ریتم طبیعی و تلفظ دقیق هر عبارت هدف خوب گوش فرا دهید.', 13800, 21000),
('40001000-0000-0000-0000-000800000003', 3, 'Sarah', 'Now head over to the shadowing section to record these sentences in your own voice!', 'حالا به بخش شادوئینگ بروید تا این جملات را با صدای خودتان تمرین و ضبط کنید!', 21400, 29000)
ON CONFLICT DO NOTHING;

-- کتاب 1 - درس 9: The Ocean Rescue
INSERT INTO scenes (id, title, description, background_image_url, difficulty, status, "order", category, is_custom)
VALUES ('40001000-0000-0000-0000-000900000001', 'The Ocean Rescue (Book 1 - Unit 9)', 'تمرین شادوئینگ یونیت 9 کتاب 1 (نجات ساحلی): helpful, improve, journey, knowledge, learn, manage...', '', 'beginner', 'published', 109, 'education', false)
ON CONFLICT (id) DO NOTHING;

INSERT INTO hotspots (id, scene_id, name, x_position, y_position, order_index)
VALUES ('40001000-0000-0000-0000-000900000002', '40001000-0000-0000-0000-000900000001', 'Dialogue', 50.0, 50.0, 1)
ON CONFLICT (id) DO NOTHING;

INSERT INTO dialogues (id, hotspot_id, "order", speaker, original_text, translation, audio_url, display_type)
VALUES
('40001000-0000-0000-0001-000900000001', '40001000-0000-0000-0000-000900000002', 1, 'customer', 'Exploring the ocean rescue offers a great opportunity to master essential vocabulary.', 'بررسی موضوع نجات ساحلی فرصتی عالی برای تسلط بر واژگان ضروری به شمار می‌رود.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full'),
('40001000-0000-0000-0001-000900000002', '40001000-0000-0000-0000-000900000002', 2, 'clerk', 'Native speakers naturally use target words like helpful and improve in conversation.', 'گویندگان نیتیو کلماتی چون helpful (مفید و سودمند) و improve (بهبود بخشیدن) را به صورت طبیعی در مکالمه به کار می‌برند.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full'),
('40001000-0000-0000-0001-000900000003', '40001000-0000-0000-0000-000900000002', 3, 'customer', 'Practicing sentence by sentence with clear pronunciation builds real conversational fluency.', 'تمرین جمله‌به‌جمله با تلفظ شفاف، تسلط و روانی واقعی در گفتار ایجاد می‌کند.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full'),
('40001000-0000-0000-0001-000900000004', '40001000-0000-0000-0000-000900000002', 4, 'clerk', 'Staying calm and consistent turns difficult phrases into everyday speech habits.', 'آرامش و استمرار در تمرین، عبارات دشوار را به عادت‌های گفتاری روزمره بدل می‌سازد.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full'),
('40001000-0000-0000-0001-000900000005', '40001000-0000-0000-0000-000900000002', 5, 'customer', 'Completing this unit brings us closer to full mastery of English vocabulary.', 'تکمیل این درس ما را به تسلط کامل بر دایره واژگان انگلیسی نزدیک‌تر می‌کند.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full')
ON CONFLICT (id) DO NOTHING;

INSERT INTO podcasts (id, title, description_fa, level, kind, series_id, episode_no, audio_url, audio_status, is_active, duration_seconds, position, vocabulary, scene_id)
VALUES ('40001000-0000-0000-0000-000900000003', 'The Ocean Rescue (Book 1 - Unit 9)', 'روایت داستانی و آموزش واژگان یونیت 9 (نجات ساحلی) از کتاب 1 دوره ۴۰۰۰ واژه', 'beginner', 'lesson', '40000000-0001-0000-0000-000000000001', 9, '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'ready', TRUE, 318, 9, '[{"word": "helpful", "meaning_fa": "مفید و سودمند"}, {"word": "improve", "meaning_fa": "بهبود بخشیدن"}, {"word": "journey", "meaning_fa": "سفر پرماجرا"}, {"word": "knowledge", "meaning_fa": "دانش و آگاهی"}, {"word": "learn", "meaning_fa": "یاد گرفتن"}, {"word": "manage", "meaning_fa": "مدیریت کردن"}, {"word": "notice", "meaning_fa": "توجه کردن به"}, {"word": "organize", "meaning_fa": "ساماندهی کردن"}, {"word": "practice", "meaning_fa": "تمرین مداوم"}, {"word": "quality", "meaning_fa": "کیفیت عالی"}, {"word": "result", "meaning_fa": "نتیجه مثبت"}, {"word": "success", "meaning_fa": "موفقیت چشمگیر"}, {"word": "talent", "meaning_fa": "استعداد ذاتی"}, {"word": "achieve", "meaning_fa": "دست یافتن به"}, {"word": "balance", "meaning_fa": "تعادل برقرار کردن"}, {"word": "certain", "meaning_fa": "مطمئن"}, {"word": "develop", "meaning_fa": "توسعه دادن"}, {"word": "effort", "meaning_fa": "تلاش و کوشش"}, {"word": "focus", "meaning_fa": "تمرکز کردن"}, {"word": "gain", "meaning_fa": "به دست آوردن"}]'::jsonb, '40001000-0000-0000-0000-000900000001')
ON CONFLICT (id) DO UPDATE SET scene_id = EXCLUDED.scene_id, vocabulary = EXCLUDED.vocabulary;

INSERT INTO podcast_lines (podcast_id, position, speaker, text, translation_fa, start_ms, end_ms)
VALUES
('40001000-0000-0000-0000-000900000003', 0, 'Alex', 'Welcome to 4000 Essential English Words, Book 1, Unit 9: The Ocean Rescue.', 'به درس 9 از کتاب 1 دوره ۴۰۰۰ واژه خوش آمدید: نجات ساحلی.', 0, 6000),
('40001000-0000-0000-0000-000900000003', 1, 'Sarah', 'Today we focus on 20 high-frequency vocabulary words used in real-life contexts.', 'امروز بر روی 20 واژه پرکاربرد در موقعیت‌های واقعی تمرکز می‌کنیم.', 6300, 13500),
('40001000-0000-0000-0000-000900000003', 2, 'Alex', 'Listen closely to the natural rhythm and pronunciation of each target phrase.', 'به ریتم طبیعی و تلفظ دقیق هر عبارت هدف خوب گوش فرا دهید.', 13800, 21000),
('40001000-0000-0000-0000-000900000003', 3, 'Sarah', 'Now head over to the shadowing section to record these sentences in your own voice!', 'حالا به بخش شادوئینگ بروید تا این جملات را با صدای خودتان تمرین و ضبط کنید!', 21400, 29000)
ON CONFLICT DO NOTHING;

-- کتاب 1 - درس 10: The Forest Guardian
INSERT INTO scenes (id, title, description, background_image_url, difficulty, status, "order", category, is_custom)
VALUES ('40001000-0000-0000-0000-001000000001', 'The Forest Guardian (Book 1 - Unit 10)', 'تمرین شادوئینگ یونیت 10 کتاب 1 (محیط‌بان جنگل): knowledge, learn, manage, notice, organize, practice...', '', 'beginner', 'published', 110, 'education', false)
ON CONFLICT (id) DO NOTHING;

INSERT INTO hotspots (id, scene_id, name, x_position, y_position, order_index)
VALUES ('40001000-0000-0000-0000-001000000002', '40001000-0000-0000-0000-001000000001', 'Dialogue', 50.0, 50.0, 1)
ON CONFLICT (id) DO NOTHING;

INSERT INTO dialogues (id, hotspot_id, "order", speaker, original_text, translation, audio_url, display_type)
VALUES
('40001000-0000-0000-0001-001000000001', '40001000-0000-0000-0000-001000000002', 1, 'customer', 'Exploring the forest guardian offers a great opportunity to master essential vocabulary.', 'بررسی موضوع محیط‌بان جنگل فرصتی عالی برای تسلط بر واژگان ضروری به شمار می‌رود.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full'),
('40001000-0000-0000-0001-001000000002', '40001000-0000-0000-0000-001000000002', 2, 'clerk', 'Native speakers naturally use target words like knowledge and learn in conversation.', 'گویندگان نیتیو کلماتی چون knowledge (دانش و آگاهی) و learn (یاد گرفتن) را به صورت طبیعی در مکالمه به کار می‌برند.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full'),
('40001000-0000-0000-0001-001000000003', '40001000-0000-0000-0000-001000000002', 3, 'customer', 'Practicing sentence by sentence with clear pronunciation builds real conversational fluency.', 'تمرین جمله‌به‌جمله با تلفظ شفاف، تسلط و روانی واقعی در گفتار ایجاد می‌کند.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full'),
('40001000-0000-0000-0001-001000000004', '40001000-0000-0000-0000-001000000002', 4, 'clerk', 'Staying calm and consistent turns difficult phrases into everyday speech habits.', 'آرامش و استمرار در تمرین، عبارات دشوار را به عادت‌های گفتاری روزمره بدل می‌سازد.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full'),
('40001000-0000-0000-0001-001000000005', '40001000-0000-0000-0000-001000000002', 5, 'customer', 'Completing this unit brings us closer to full mastery of English vocabulary.', 'تکمیل این درس ما را به تسلط کامل بر دایره واژگان انگلیسی نزدیک‌تر می‌کند.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full')
ON CONFLICT (id) DO NOTHING;

INSERT INTO podcasts (id, title, description_fa, level, kind, series_id, episode_no, audio_url, audio_status, is_active, duration_seconds, position, vocabulary, scene_id)
VALUES ('40001000-0000-0000-0000-001000000003', 'The Forest Guardian (Book 1 - Unit 10)', 'روایت داستانی و آموزش واژگان یونیت 10 (محیط‌بان جنگل) از کتاب 1 دوره ۴۰۰۰ واژه', 'beginner', 'lesson', '40000000-0001-0000-0000-000000000001', 10, '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'ready', TRUE, 320, 10, '[{"word": "knowledge", "meaning_fa": "دانش و آگاهی"}, {"word": "learn", "meaning_fa": "یاد گرفتن"}, {"word": "manage", "meaning_fa": "مدیریت کردن"}, {"word": "notice", "meaning_fa": "توجه کردن به"}, {"word": "organize", "meaning_fa": "ساماندهی کردن"}, {"word": "practice", "meaning_fa": "تمرین مداوم"}, {"word": "quality", "meaning_fa": "کیفیت عالی"}, {"word": "result", "meaning_fa": "نتیجه مثبت"}, {"word": "success", "meaning_fa": "موفقیت چشمگیر"}, {"word": "talent", "meaning_fa": "استعداد ذاتی"}, {"word": "achieve", "meaning_fa": "دست یافتن به"}, {"word": "balance", "meaning_fa": "تعادل برقرار کردن"}, {"word": "certain", "meaning_fa": "مطمئن"}, {"word": "develop", "meaning_fa": "توسعه دادن"}, {"word": "effort", "meaning_fa": "تلاش و کوشش"}, {"word": "focus", "meaning_fa": "تمرکز کردن"}, {"word": "gain", "meaning_fa": "به دست آوردن"}, {"word": "helpful", "meaning_fa": "مفید و سودمند"}, {"word": "improve", "meaning_fa": "بهبود بخشیدن"}, {"word": "journey", "meaning_fa": "سفر پرماجرا"}]'::jsonb, '40001000-0000-0000-0000-001000000001')
ON CONFLICT (id) DO UPDATE SET scene_id = EXCLUDED.scene_id, vocabulary = EXCLUDED.vocabulary;

INSERT INTO podcast_lines (podcast_id, position, speaker, text, translation_fa, start_ms, end_ms)
VALUES
('40001000-0000-0000-0000-001000000003', 0, 'Alex', 'Welcome to 4000 Essential English Words, Book 1, Unit 10: The Forest Guardian.', 'به درس 10 از کتاب 1 دوره ۴۰۰۰ واژه خوش آمدید: محیط‌بان جنگل.', 0, 6000),
('40001000-0000-0000-0000-001000000003', 1, 'Sarah', 'Today we focus on 20 high-frequency vocabulary words used in real-life contexts.', 'امروز بر روی 20 واژه پرکاربرد در موقعیت‌های واقعی تمرکز می‌کنیم.', 6300, 13500),
('40001000-0000-0000-0000-001000000003', 2, 'Alex', 'Listen closely to the natural rhythm and pronunciation of each target phrase.', 'به ریتم طبیعی و تلفظ دقیق هر عبارت هدف خوب گوش فرا دهید.', 13800, 21000),
('40001000-0000-0000-0000-001000000003', 3, 'Sarah', 'Now head over to the shadowing section to record these sentences in your own voice!', 'حالا به بخش شادوئینگ بروید تا این جملات را با صدای خودتان تمرین و ضبط کنید!', 21400, 29000)
ON CONFLICT DO NOTHING;

-- کتاب 1 - درس 11: The River Crossing
INSERT INTO scenes (id, title, description, background_image_url, difficulty, status, "order", category, is_custom)
VALUES ('40001000-0000-0000-0000-001100000001', 'The River Crossing (Book 1 - Unit 11)', 'تمرین شادوئینگ یونیت 11 کتاب 1 (گذر از رودخانه): notice, organize, practice, quality, result, success...', '', 'beginner', 'published', 111, 'education', false)
ON CONFLICT (id) DO NOTHING;

INSERT INTO hotspots (id, scene_id, name, x_position, y_position, order_index)
VALUES ('40001000-0000-0000-0000-001100000002', '40001000-0000-0000-0000-001100000001', 'Dialogue', 50.0, 50.0, 1)
ON CONFLICT (id) DO NOTHING;

INSERT INTO dialogues (id, hotspot_id, "order", speaker, original_text, translation, audio_url, display_type)
VALUES
('40001000-0000-0000-0001-001100000001', '40001000-0000-0000-0000-001100000002', 1, 'customer', 'Exploring the river crossing offers a great opportunity to master essential vocabulary.', 'بررسی موضوع گذر از رودخانه فرصتی عالی برای تسلط بر واژگان ضروری به شمار می‌رود.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full'),
('40001000-0000-0000-0001-001100000002', '40001000-0000-0000-0000-001100000002', 2, 'clerk', 'Native speakers naturally use target words like notice and organize in conversation.', 'گویندگان نیتیو کلماتی چون notice (توجه کردن به) و organize (ساماندهی کردن) را به صورت طبیعی در مکالمه به کار می‌برند.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full'),
('40001000-0000-0000-0001-001100000003', '40001000-0000-0000-0000-001100000002', 3, 'customer', 'Practicing sentence by sentence with clear pronunciation builds real conversational fluency.', 'تمرین جمله‌به‌جمله با تلفظ شفاف، تسلط و روانی واقعی در گفتار ایجاد می‌کند.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full'),
('40001000-0000-0000-0001-001100000004', '40001000-0000-0000-0000-001100000002', 4, 'clerk', 'Staying calm and consistent turns difficult phrases into everyday speech habits.', 'آرامش و استمرار در تمرین، عبارات دشوار را به عادت‌های گفتاری روزمره بدل می‌سازد.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full'),
('40001000-0000-0000-0001-001100000005', '40001000-0000-0000-0000-001100000002', 5, 'customer', 'Completing this unit brings us closer to full mastery of English vocabulary.', 'تکمیل این درس ما را به تسلط کامل بر دایره واژگان انگلیسی نزدیک‌تر می‌کند.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full')
ON CONFLICT (id) DO NOTHING;

INSERT INTO podcasts (id, title, description_fa, level, kind, series_id, episode_no, audio_url, audio_status, is_active, duration_seconds, position, vocabulary, scene_id)
VALUES ('40001000-0000-0000-0000-001100000003', 'The River Crossing (Book 1 - Unit 11)', 'روایت داستانی و آموزش واژگان یونیت 11 (گذر از رودخانه) از کتاب 1 دوره ۴۰۰۰ واژه', 'beginner', 'lesson', '40000000-0001-0000-0000-000000000001', 11, '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'ready', TRUE, 322, 11, '[{"word": "notice", "meaning_fa": "توجه کردن به"}, {"word": "organize", "meaning_fa": "ساماندهی کردن"}, {"word": "practice", "meaning_fa": "تمرین مداوم"}, {"word": "quality", "meaning_fa": "کیفیت عالی"}, {"word": "result", "meaning_fa": "نتیجه مثبت"}, {"word": "success", "meaning_fa": "موفقیت چشمگیر"}, {"word": "talent", "meaning_fa": "استعداد ذاتی"}, {"word": "achieve", "meaning_fa": "دست یافتن به"}, {"word": "balance", "meaning_fa": "تعادل برقرار کردن"}, {"word": "certain", "meaning_fa": "مطمئن"}, {"word": "develop", "meaning_fa": "توسعه دادن"}, {"word": "effort", "meaning_fa": "تلاش و کوشش"}, {"word": "focus", "meaning_fa": "تمرکز کردن"}, {"word": "gain", "meaning_fa": "به دست آوردن"}, {"word": "helpful", "meaning_fa": "مفید و سودمند"}, {"word": "improve", "meaning_fa": "بهبود بخشیدن"}, {"word": "journey", "meaning_fa": "سفر پرماجرا"}, {"word": "knowledge", "meaning_fa": "دانش و آگاهی"}, {"word": "learn", "meaning_fa": "یاد گرفتن"}, {"word": "manage", "meaning_fa": "مدیریت کردن"}]'::jsonb, '40001000-0000-0000-0000-001100000001')
ON CONFLICT (id) DO UPDATE SET scene_id = EXCLUDED.scene_id, vocabulary = EXCLUDED.vocabulary;

INSERT INTO podcast_lines (podcast_id, position, speaker, text, translation_fa, start_ms, end_ms)
VALUES
('40001000-0000-0000-0000-001100000003', 0, 'Alex', 'Welcome to 4000 Essential English Words, Book 1, Unit 11: The River Crossing.', 'به درس 11 از کتاب 1 دوره ۴۰۰۰ واژه خوش آمدید: گذر از رودخانه.', 0, 6000),
('40001000-0000-0000-0000-001100000003', 1, 'Sarah', 'Today we focus on 20 high-frequency vocabulary words used in real-life contexts.', 'امروز بر روی 20 واژه پرکاربرد در موقعیت‌های واقعی تمرکز می‌کنیم.', 6300, 13500),
('40001000-0000-0000-0000-001100000003', 2, 'Alex', 'Listen closely to the natural rhythm and pronunciation of each target phrase.', 'به ریتم طبیعی و تلفظ دقیق هر عبارت هدف خوب گوش فرا دهید.', 13800, 21000),
('40001000-0000-0000-0000-001100000003', 3, 'Sarah', 'Now head over to the shadowing section to record these sentences in your own voice!', 'حالا به بخش شادوئینگ بروید تا این جملات را با صدای خودتان تمرین و ضبط کنید!', 21400, 29000)
ON CONFLICT DO NOTHING;

-- کتاب 1 - درس 12: The Village Bakery
INSERT INTO scenes (id, title, description, background_image_url, difficulty, status, "order", category, is_custom)
VALUES ('40001000-0000-0000-0000-001200000001', 'The Village Bakery (Book 1 - Unit 12)', 'تمرین شادوئینگ یونیت 12 کتاب 1 (نانوایی محله): quality, result, success, talent, achieve, balance...', '', 'beginner', 'published', 112, 'education', false)
ON CONFLICT (id) DO NOTHING;

INSERT INTO hotspots (id, scene_id, name, x_position, y_position, order_index)
VALUES ('40001000-0000-0000-0000-001200000002', '40001000-0000-0000-0000-001200000001', 'Dialogue', 50.0, 50.0, 1)
ON CONFLICT (id) DO NOTHING;

INSERT INTO dialogues (id, hotspot_id, "order", speaker, original_text, translation, audio_url, display_type)
VALUES
('40001000-0000-0000-0001-001200000001', '40001000-0000-0000-0000-001200000002', 1, 'customer', 'Exploring the village bakery offers a great opportunity to master essential vocabulary.', 'بررسی موضوع نانوایی محله فرصتی عالی برای تسلط بر واژگان ضروری به شمار می‌رود.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full'),
('40001000-0000-0000-0001-001200000002', '40001000-0000-0000-0000-001200000002', 2, 'clerk', 'Native speakers naturally use target words like quality and result in conversation.', 'گویندگان نیتیو کلماتی چون quality (کیفیت عالی) و result (نتیجه مثبت) را به صورت طبیعی در مکالمه به کار می‌برند.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full'),
('40001000-0000-0000-0001-001200000003', '40001000-0000-0000-0000-001200000002', 3, 'customer', 'Practicing sentence by sentence with clear pronunciation builds real conversational fluency.', 'تمرین جمله‌به‌جمله با تلفظ شفاف، تسلط و روانی واقعی در گفتار ایجاد می‌کند.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full'),
('40001000-0000-0000-0001-001200000004', '40001000-0000-0000-0000-001200000002', 4, 'clerk', 'Staying calm and consistent turns difficult phrases into everyday speech habits.', 'آرامش و استمرار در تمرین، عبارات دشوار را به عادت‌های گفتاری روزمره بدل می‌سازد.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full'),
('40001000-0000-0000-0001-001200000005', '40001000-0000-0000-0000-001200000002', 5, 'customer', 'Completing this unit brings us closer to full mastery of English vocabulary.', 'تکمیل این درس ما را به تسلط کامل بر دایره واژگان انگلیسی نزدیک‌تر می‌کند.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full')
ON CONFLICT (id) DO NOTHING;

INSERT INTO podcasts (id, title, description_fa, level, kind, series_id, episode_no, audio_url, audio_status, is_active, duration_seconds, position, vocabulary, scene_id)
VALUES ('40001000-0000-0000-0000-001200000003', 'The Village Bakery (Book 1 - Unit 12)', 'روایت داستانی و آموزش واژگان یونیت 12 (نانوایی محله) از کتاب 1 دوره ۴۰۰۰ واژه', 'beginner', 'lesson', '40000000-0001-0000-0000-000000000001', 12, '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'ready', TRUE, 324, 12, '[{"word": "quality", "meaning_fa": "کیفیت عالی"}, {"word": "result", "meaning_fa": "نتیجه مثبت"}, {"word": "success", "meaning_fa": "موفقیت چشمگیر"}, {"word": "talent", "meaning_fa": "استعداد ذاتی"}, {"word": "achieve", "meaning_fa": "دست یافتن به"}, {"word": "balance", "meaning_fa": "تعادل برقرار کردن"}, {"word": "certain", "meaning_fa": "مطمئن"}, {"word": "develop", "meaning_fa": "توسعه دادن"}, {"word": "effort", "meaning_fa": "تلاش و کوشش"}, {"word": "focus", "meaning_fa": "تمرکز کردن"}, {"word": "gain", "meaning_fa": "به دست آوردن"}, {"word": "helpful", "meaning_fa": "مفید و سودمند"}, {"word": "improve", "meaning_fa": "بهبود بخشیدن"}, {"word": "journey", "meaning_fa": "سفر پرماجرا"}, {"word": "knowledge", "meaning_fa": "دانش و آگاهی"}, {"word": "learn", "meaning_fa": "یاد گرفتن"}, {"word": "manage", "meaning_fa": "مدیریت کردن"}, {"word": "notice", "meaning_fa": "توجه کردن به"}, {"word": "organize", "meaning_fa": "ساماندهی کردن"}, {"word": "practice", "meaning_fa": "تمرین مداوم"}]'::jsonb, '40001000-0000-0000-0000-001200000001')
ON CONFLICT (id) DO UPDATE SET scene_id = EXCLUDED.scene_id, vocabulary = EXCLUDED.vocabulary;

INSERT INTO podcast_lines (podcast_id, position, speaker, text, translation_fa, start_ms, end_ms)
VALUES
('40001000-0000-0000-0000-001200000003', 0, 'Alex', 'Welcome to 4000 Essential English Words, Book 1, Unit 12: The Village Bakery.', 'به درس 12 از کتاب 1 دوره ۴۰۰۰ واژه خوش آمدید: نانوایی محله.', 0, 6000),
('40001000-0000-0000-0000-001200000003', 1, 'Sarah', 'Today we focus on 20 high-frequency vocabulary words used in real-life contexts.', 'امروز بر روی 20 واژه پرکاربرد در موقعیت‌های واقعی تمرکز می‌کنیم.', 6300, 13500),
('40001000-0000-0000-0000-001200000003', 2, 'Alex', 'Listen closely to the natural rhythm and pronunciation of each target phrase.', 'به ریتم طبیعی و تلفظ دقیق هر عبارت هدف خوب گوش فرا دهید.', 13800, 21000),
('40001000-0000-0000-0000-001200000003', 3, 'Sarah', 'Now head over to the shadowing section to record these sentences in your own voice!', 'حالا به بخش شادوئینگ بروید تا این جملات را با صدای خودتان تمرین و ضبط کنید!', 21400, 29000)
ON CONFLICT DO NOTHING;

-- کتاب 1 - درس 13: The Harvest Feast
INSERT INTO scenes (id, title, description, background_image_url, difficulty, status, "order", category, is_custom)
VALUES ('40001000-0000-0000-0000-001300000001', 'The Harvest Feast (Book 1 - Unit 13)', 'تمرین شادوئینگ یونیت 13 کتاب 1 (جشن خرمن): talent, achieve, balance, certain, develop, effort...', '', 'beginner', 'published', 113, 'education', false)
ON CONFLICT (id) DO NOTHING;

INSERT INTO hotspots (id, scene_id, name, x_position, y_position, order_index)
VALUES ('40001000-0000-0000-0000-001300000002', '40001000-0000-0000-0000-001300000001', 'Dialogue', 50.0, 50.0, 1)
ON CONFLICT (id) DO NOTHING;

INSERT INTO dialogues (id, hotspot_id, "order", speaker, original_text, translation, audio_url, display_type)
VALUES
('40001000-0000-0000-0001-001300000001', '40001000-0000-0000-0000-001300000002', 1, 'customer', 'Exploring the harvest feast offers a great opportunity to master essential vocabulary.', 'بررسی موضوع جشن خرمن فرصتی عالی برای تسلط بر واژگان ضروری به شمار می‌رود.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full'),
('40001000-0000-0000-0001-001300000002', '40001000-0000-0000-0000-001300000002', 2, 'clerk', 'Native speakers naturally use target words like talent and achieve in conversation.', 'گویندگان نیتیو کلماتی چون talent (استعداد ذاتی) و achieve (دست یافتن به) را به صورت طبیعی در مکالمه به کار می‌برند.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full'),
('40001000-0000-0000-0001-001300000003', '40001000-0000-0000-0000-001300000002', 3, 'customer', 'Practicing sentence by sentence with clear pronunciation builds real conversational fluency.', 'تمرین جمله‌به‌جمله با تلفظ شفاف، تسلط و روانی واقعی در گفتار ایجاد می‌کند.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full'),
('40001000-0000-0000-0001-001300000004', '40001000-0000-0000-0000-001300000002', 4, 'clerk', 'Staying calm and consistent turns difficult phrases into everyday speech habits.', 'آرامش و استمرار در تمرین، عبارات دشوار را به عادت‌های گفتاری روزمره بدل می‌سازد.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full'),
('40001000-0000-0000-0001-001300000005', '40001000-0000-0000-0000-001300000002', 5, 'customer', 'Completing this unit brings us closer to full mastery of English vocabulary.', 'تکمیل این درس ما را به تسلط کامل بر دایره واژگان انگلیسی نزدیک‌تر می‌کند.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full')
ON CONFLICT (id) DO NOTHING;

INSERT INTO podcasts (id, title, description_fa, level, kind, series_id, episode_no, audio_url, audio_status, is_active, duration_seconds, position, vocabulary, scene_id)
VALUES ('40001000-0000-0000-0000-001300000003', 'The Harvest Feast (Book 1 - Unit 13)', 'روایت داستانی و آموزش واژگان یونیت 13 (جشن خرمن) از کتاب 1 دوره ۴۰۰۰ واژه', 'beginner', 'lesson', '40000000-0001-0000-0000-000000000001', 13, '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'ready', TRUE, 326, 13, '[{"word": "talent", "meaning_fa": "استعداد ذاتی"}, {"word": "achieve", "meaning_fa": "دست یافتن به"}, {"word": "balance", "meaning_fa": "تعادل برقرار کردن"}, {"word": "certain", "meaning_fa": "مطمئن"}, {"word": "develop", "meaning_fa": "توسعه دادن"}, {"word": "effort", "meaning_fa": "تلاش و کوشش"}, {"word": "focus", "meaning_fa": "تمرکز کردن"}, {"word": "gain", "meaning_fa": "به دست آوردن"}, {"word": "helpful", "meaning_fa": "مفید و سودمند"}, {"word": "improve", "meaning_fa": "بهبود بخشیدن"}, {"word": "journey", "meaning_fa": "سفر پرماجرا"}, {"word": "knowledge", "meaning_fa": "دانش و آگاهی"}, {"word": "learn", "meaning_fa": "یاد گرفتن"}, {"word": "manage", "meaning_fa": "مدیریت کردن"}, {"word": "notice", "meaning_fa": "توجه کردن به"}, {"word": "organize", "meaning_fa": "ساماندهی کردن"}, {"word": "practice", "meaning_fa": "تمرین مداوم"}, {"word": "quality", "meaning_fa": "کیفیت عالی"}, {"word": "result", "meaning_fa": "نتیجه مثبت"}, {"word": "success", "meaning_fa": "موفقیت چشمگیر"}]'::jsonb, '40001000-0000-0000-0000-001300000001')
ON CONFLICT (id) DO UPDATE SET scene_id = EXCLUDED.scene_id, vocabulary = EXCLUDED.vocabulary;

INSERT INTO podcast_lines (podcast_id, position, speaker, text, translation_fa, start_ms, end_ms)
VALUES
('40001000-0000-0000-0000-001300000003', 0, 'Alex', 'Welcome to 4000 Essential English Words, Book 1, Unit 13: The Harvest Feast.', 'به درس 13 از کتاب 1 دوره ۴۰۰۰ واژه خوش آمدید: جشن خرمن.', 0, 6000),
('40001000-0000-0000-0000-001300000003', 1, 'Sarah', 'Today we focus on 20 high-frequency vocabulary words used in real-life contexts.', 'امروز بر روی 20 واژه پرکاربرد در موقعیت‌های واقعی تمرکز می‌کنیم.', 6300, 13500),
('40001000-0000-0000-0000-001300000003', 2, 'Alex', 'Listen closely to the natural rhythm and pronunciation of each target phrase.', 'به ریتم طبیعی و تلفظ دقیق هر عبارت هدف خوب گوش فرا دهید.', 13800, 21000),
('40001000-0000-0000-0000-001300000003', 3, 'Sarah', 'Now head over to the shadowing section to record these sentences in your own voice!', 'حالا به بخش شادوئینگ بروید تا این جملات را با صدای خودتان تمرین و ضبط کنید!', 21400, 29000)
ON CONFLICT DO NOTHING;

-- کتاب 1 - درس 14: The Young Inventor
INSERT INTO scenes (id, title, description, background_image_url, difficulty, status, "order", category, is_custom)
VALUES ('40001000-0000-0000-0000-001400000001', 'The Young Inventor (Book 1 - Unit 14)', 'تمرین شادوئینگ یونیت 14 کتاب 1 (مخترع جوان): certain, develop, effort, focus, gain, helpful...', '', 'beginner', 'published', 114, 'education', false)
ON CONFLICT (id) DO NOTHING;

INSERT INTO hotspots (id, scene_id, name, x_position, y_position, order_index)
VALUES ('40001000-0000-0000-0000-001400000002', '40001000-0000-0000-0000-001400000001', 'Dialogue', 50.0, 50.0, 1)
ON CONFLICT (id) DO NOTHING;

INSERT INTO dialogues (id, hotspot_id, "order", speaker, original_text, translation, audio_url, display_type)
VALUES
('40001000-0000-0000-0001-001400000001', '40001000-0000-0000-0000-001400000002', 1, 'customer', 'Exploring the young inventor offers a great opportunity to master essential vocabulary.', 'بررسی موضوع مخترع جوان فرصتی عالی برای تسلط بر واژگان ضروری به شمار می‌رود.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full'),
('40001000-0000-0000-0001-001400000002', '40001000-0000-0000-0000-001400000002', 2, 'clerk', 'Native speakers naturally use target words like certain and develop in conversation.', 'گویندگان نیتیو کلماتی چون certain (مطمئن) و develop (توسعه دادن) را به صورت طبیعی در مکالمه به کار می‌برند.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full'),
('40001000-0000-0000-0001-001400000003', '40001000-0000-0000-0000-001400000002', 3, 'customer', 'Practicing sentence by sentence with clear pronunciation builds real conversational fluency.', 'تمرین جمله‌به‌جمله با تلفظ شفاف، تسلط و روانی واقعی در گفتار ایجاد می‌کند.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full'),
('40001000-0000-0000-0001-001400000004', '40001000-0000-0000-0000-001400000002', 4, 'clerk', 'Staying calm and consistent turns difficult phrases into everyday speech habits.', 'آرامش و استمرار در تمرین، عبارات دشوار را به عادت‌های گفتاری روزمره بدل می‌سازد.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full'),
('40001000-0000-0000-0001-001400000005', '40001000-0000-0000-0000-001400000002', 5, 'customer', 'Completing this unit brings us closer to full mastery of English vocabulary.', 'تکمیل این درس ما را به تسلط کامل بر دایره واژگان انگلیسی نزدیک‌تر می‌کند.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full')
ON CONFLICT (id) DO NOTHING;

INSERT INTO podcasts (id, title, description_fa, level, kind, series_id, episode_no, audio_url, audio_status, is_active, duration_seconds, position, vocabulary, scene_id)
VALUES ('40001000-0000-0000-0000-001400000003', 'The Young Inventor (Book 1 - Unit 14)', 'روایت داستانی و آموزش واژگان یونیت 14 (مخترع جوان) از کتاب 1 دوره ۴۰۰۰ واژه', 'beginner', 'lesson', '40000000-0001-0000-0000-000000000001', 14, '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'ready', TRUE, 328, 14, '[{"word": "certain", "meaning_fa": "مطمئن"}, {"word": "develop", "meaning_fa": "توسعه دادن"}, {"word": "effort", "meaning_fa": "تلاش و کوشش"}, {"word": "focus", "meaning_fa": "تمرکز کردن"}, {"word": "gain", "meaning_fa": "به دست آوردن"}, {"word": "helpful", "meaning_fa": "مفید و سودمند"}, {"word": "improve", "meaning_fa": "بهبود بخشیدن"}, {"word": "journey", "meaning_fa": "سفر پرماجرا"}, {"word": "knowledge", "meaning_fa": "دانش و آگاهی"}, {"word": "learn", "meaning_fa": "یاد گرفتن"}, {"word": "manage", "meaning_fa": "مدیریت کردن"}, {"word": "notice", "meaning_fa": "توجه کردن به"}, {"word": "organize", "meaning_fa": "ساماندهی کردن"}, {"word": "practice", "meaning_fa": "تمرین مداوم"}, {"word": "quality", "meaning_fa": "کیفیت عالی"}, {"word": "result", "meaning_fa": "نتیجه مثبت"}, {"word": "success", "meaning_fa": "موفقیت چشمگیر"}, {"word": "talent", "meaning_fa": "استعداد ذاتی"}, {"word": "achieve", "meaning_fa": "دست یافتن به"}, {"word": "balance", "meaning_fa": "تعادل برقرار کردن"}]'::jsonb, '40001000-0000-0000-0000-001400000001')
ON CONFLICT (id) DO UPDATE SET scene_id = EXCLUDED.scene_id, vocabulary = EXCLUDED.vocabulary;

INSERT INTO podcast_lines (podcast_id, position, speaker, text, translation_fa, start_ms, end_ms)
VALUES
('40001000-0000-0000-0000-001400000003', 0, 'Alex', 'Welcome to 4000 Essential English Words, Book 1, Unit 14: The Young Inventor.', 'به درس 14 از کتاب 1 دوره ۴۰۰۰ واژه خوش آمدید: مخترع جوان.', 0, 6000),
('40001000-0000-0000-0000-001400000003', 1, 'Sarah', 'Today we focus on 20 high-frequency vocabulary words used in real-life contexts.', 'امروز بر روی 20 واژه پرکاربرد در موقعیت‌های واقعی تمرکز می‌کنیم.', 6300, 13500),
('40001000-0000-0000-0000-001400000003', 2, 'Alex', 'Listen closely to the natural rhythm and pronunciation of each target phrase.', 'به ریتم طبیعی و تلفظ دقیق هر عبارت هدف خوب گوش فرا دهید.', 13800, 21000),
('40001000-0000-0000-0000-001400000003', 3, 'Sarah', 'Now head over to the shadowing section to record these sentences in your own voice!', 'حالا به بخش شادوئینگ بروید تا این جملات را با صدای خودتان تمرین و ضبط کنید!', 21400, 29000)
ON CONFLICT DO NOTHING;

-- کتاب 1 - درس 15: The Mountain Marathon
INSERT INTO scenes (id, title, description, background_image_url, difficulty, status, "order", category, is_custom)
VALUES ('40001000-0000-0000-0000-001500000001', 'The Mountain Marathon (Book 1 - Unit 15)', 'تمرین شادوئینگ یونیت 15 کتاب 1 (ماراتن کوهستان): focus, gain, helpful, improve, journey, knowledge...', '', 'beginner', 'published', 115, 'education', false)
ON CONFLICT (id) DO NOTHING;

INSERT INTO hotspots (id, scene_id, name, x_position, y_position, order_index)
VALUES ('40001000-0000-0000-0000-001500000002', '40001000-0000-0000-0000-001500000001', 'Dialogue', 50.0, 50.0, 1)
ON CONFLICT (id) DO NOTHING;

INSERT INTO dialogues (id, hotspot_id, "order", speaker, original_text, translation, audio_url, display_type)
VALUES
('40001000-0000-0000-0001-001500000001', '40001000-0000-0000-0000-001500000002', 1, 'customer', 'Exploring the mountain marathon offers a great opportunity to master essential vocabulary.', 'بررسی موضوع ماراتن کوهستان فرصتی عالی برای تسلط بر واژگان ضروری به شمار می‌رود.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full'),
('40001000-0000-0000-0001-001500000002', '40001000-0000-0000-0000-001500000002', 2, 'clerk', 'Native speakers naturally use target words like focus and gain in conversation.', 'گویندگان نیتیو کلماتی چون focus (تمرکز کردن) و gain (به دست آوردن) را به صورت طبیعی در مکالمه به کار می‌برند.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full'),
('40001000-0000-0000-0001-001500000003', '40001000-0000-0000-0000-001500000002', 3, 'customer', 'Practicing sentence by sentence with clear pronunciation builds real conversational fluency.', 'تمرین جمله‌به‌جمله با تلفظ شفاف، تسلط و روانی واقعی در گفتار ایجاد می‌کند.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full'),
('40001000-0000-0000-0001-001500000004', '40001000-0000-0000-0000-001500000002', 4, 'clerk', 'Staying calm and consistent turns difficult phrases into everyday speech habits.', 'آرامش و استمرار در تمرین، عبارات دشوار را به عادت‌های گفتاری روزمره بدل می‌سازد.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full'),
('40001000-0000-0000-0001-001500000005', '40001000-0000-0000-0000-001500000002', 5, 'customer', 'Completing this unit brings us closer to full mastery of English vocabulary.', 'تکمیل این درس ما را به تسلط کامل بر دایره واژگان انگلیسی نزدیک‌تر می‌کند.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full')
ON CONFLICT (id) DO NOTHING;

INSERT INTO podcasts (id, title, description_fa, level, kind, series_id, episode_no, audio_url, audio_status, is_active, duration_seconds, position, vocabulary, scene_id)
VALUES ('40001000-0000-0000-0000-001500000003', 'The Mountain Marathon (Book 1 - Unit 15)', 'روایت داستانی و آموزش واژگان یونیت 15 (ماراتن کوهستان) از کتاب 1 دوره ۴۰۰۰ واژه', 'beginner', 'lesson', '40000000-0001-0000-0000-000000000001', 15, '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'ready', TRUE, 330, 15, '[{"word": "focus", "meaning_fa": "تمرکز کردن"}, {"word": "gain", "meaning_fa": "به دست آوردن"}, {"word": "helpful", "meaning_fa": "مفید و سودمند"}, {"word": "improve", "meaning_fa": "بهبود بخشیدن"}, {"word": "journey", "meaning_fa": "سفر پرماجرا"}, {"word": "knowledge", "meaning_fa": "دانش و آگاهی"}, {"word": "learn", "meaning_fa": "یاد گرفتن"}, {"word": "manage", "meaning_fa": "مدیریت کردن"}, {"word": "notice", "meaning_fa": "توجه کردن به"}, {"word": "organize", "meaning_fa": "ساماندهی کردن"}, {"word": "practice", "meaning_fa": "تمرین مداوم"}, {"word": "quality", "meaning_fa": "کیفیت عالی"}, {"word": "result", "meaning_fa": "نتیجه مثبت"}, {"word": "success", "meaning_fa": "موفقیت چشمگیر"}, {"word": "talent", "meaning_fa": "استعداد ذاتی"}, {"word": "achieve", "meaning_fa": "دست یافتن به"}, {"word": "balance", "meaning_fa": "تعادل برقرار کردن"}, {"word": "certain", "meaning_fa": "مطمئن"}, {"word": "develop", "meaning_fa": "توسعه دادن"}, {"word": "effort", "meaning_fa": "تلاش و کوشش"}]'::jsonb, '40001000-0000-0000-0000-001500000001')
ON CONFLICT (id) DO UPDATE SET scene_id = EXCLUDED.scene_id, vocabulary = EXCLUDED.vocabulary;

INSERT INTO podcast_lines (podcast_id, position, speaker, text, translation_fa, start_ms, end_ms)
VALUES
('40001000-0000-0000-0000-001500000003', 0, 'Alex', 'Welcome to 4000 Essential English Words, Book 1, Unit 15: The Mountain Marathon.', 'به درس 15 از کتاب 1 دوره ۴۰۰۰ واژه خوش آمدید: ماراتن کوهستان.', 0, 6000),
('40001000-0000-0000-0000-001500000003', 1, 'Sarah', 'Today we focus on 20 high-frequency vocabulary words used in real-life contexts.', 'امروز بر روی 20 واژه پرکاربرد در موقعیت‌های واقعی تمرکز می‌کنیم.', 6300, 13500),
('40001000-0000-0000-0000-001500000003', 2, 'Alex', 'Listen closely to the natural rhythm and pronunciation of each target phrase.', 'به ریتم طبیعی و تلفظ دقیق هر عبارت هدف خوب گوش فرا دهید.', 13800, 21000),
('40001000-0000-0000-0000-001500000003', 3, 'Sarah', 'Now head over to the shadowing section to record these sentences in your own voice!', 'حالا به بخش شادوئینگ بروید تا این جملات را با صدای خودتان تمرین و ضبط کنید!', 21400, 29000)
ON CONFLICT DO NOTHING;

-- کتاب 1 - درس 16: The Historic Theater
INSERT INTO scenes (id, title, description, background_image_url, difficulty, status, "order", category, is_custom)
VALUES ('40001000-0000-0000-0000-001600000001', 'The Historic Theater (Book 1 - Unit 16)', 'تمرین شادوئینگ یونیت 16 کتاب 1 (تماشاخانه تاریخی): improve, journey, knowledge, learn, manage, notice...', '', 'beginner', 'published', 116, 'education', false)
ON CONFLICT (id) DO NOTHING;

INSERT INTO hotspots (id, scene_id, name, x_position, y_position, order_index)
VALUES ('40001000-0000-0000-0000-001600000002', '40001000-0000-0000-0000-001600000001', 'Dialogue', 50.0, 50.0, 1)
ON CONFLICT (id) DO NOTHING;

INSERT INTO dialogues (id, hotspot_id, "order", speaker, original_text, translation, audio_url, display_type)
VALUES
('40001000-0000-0000-0001-001600000001', '40001000-0000-0000-0000-001600000002', 1, 'customer', 'Exploring the historic theater offers a great opportunity to master essential vocabulary.', 'بررسی موضوع تماشاخانه تاریخی فرصتی عالی برای تسلط بر واژگان ضروری به شمار می‌رود.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full'),
('40001000-0000-0000-0001-001600000002', '40001000-0000-0000-0000-001600000002', 2, 'clerk', 'Native speakers naturally use target words like improve and journey in conversation.', 'گویندگان نیتیو کلماتی چون improve (بهبود بخشیدن) و journey (سفر پرماجرا) را به صورت طبیعی در مکالمه به کار می‌برند.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full'),
('40001000-0000-0000-0001-001600000003', '40001000-0000-0000-0000-001600000002', 3, 'customer', 'Practicing sentence by sentence with clear pronunciation builds real conversational fluency.', 'تمرین جمله‌به‌جمله با تلفظ شفاف، تسلط و روانی واقعی در گفتار ایجاد می‌کند.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full'),
('40001000-0000-0000-0001-001600000004', '40001000-0000-0000-0000-001600000002', 4, 'clerk', 'Staying calm and consistent turns difficult phrases into everyday speech habits.', 'آرامش و استمرار در تمرین، عبارات دشوار را به عادت‌های گفتاری روزمره بدل می‌سازد.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full'),
('40001000-0000-0000-0001-001600000005', '40001000-0000-0000-0000-001600000002', 5, 'customer', 'Completing this unit brings us closer to full mastery of English vocabulary.', 'تکمیل این درس ما را به تسلط کامل بر دایره واژگان انگلیسی نزدیک‌تر می‌کند.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full')
ON CONFLICT (id) DO NOTHING;

INSERT INTO podcasts (id, title, description_fa, level, kind, series_id, episode_no, audio_url, audio_status, is_active, duration_seconds, position, vocabulary, scene_id)
VALUES ('40001000-0000-0000-0000-001600000003', 'The Historic Theater (Book 1 - Unit 16)', 'روایت داستانی و آموزش واژگان یونیت 16 (تماشاخانه تاریخی) از کتاب 1 دوره ۴۰۰۰ واژه', 'beginner', 'lesson', '40000000-0001-0000-0000-000000000001', 16, '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'ready', TRUE, 332, 16, '[{"word": "improve", "meaning_fa": "بهبود بخشیدن"}, {"word": "journey", "meaning_fa": "سفر پرماجرا"}, {"word": "knowledge", "meaning_fa": "دانش و آگاهی"}, {"word": "learn", "meaning_fa": "یاد گرفتن"}, {"word": "manage", "meaning_fa": "مدیریت کردن"}, {"word": "notice", "meaning_fa": "توجه کردن به"}, {"word": "organize", "meaning_fa": "ساماندهی کردن"}, {"word": "practice", "meaning_fa": "تمرین مداوم"}, {"word": "quality", "meaning_fa": "کیفیت عالی"}, {"word": "result", "meaning_fa": "نتیجه مثبت"}, {"word": "success", "meaning_fa": "موفقیت چشمگیر"}, {"word": "talent", "meaning_fa": "استعداد ذاتی"}, {"word": "achieve", "meaning_fa": "دست یافتن به"}, {"word": "balance", "meaning_fa": "تعادل برقرار کردن"}, {"word": "certain", "meaning_fa": "مطمئن"}, {"word": "develop", "meaning_fa": "توسعه دادن"}, {"word": "effort", "meaning_fa": "تلاش و کوشش"}, {"word": "focus", "meaning_fa": "تمرکز کردن"}, {"word": "gain", "meaning_fa": "به دست آوردن"}, {"word": "helpful", "meaning_fa": "مفید و سودمند"}]'::jsonb, '40001000-0000-0000-0000-001600000001')
ON CONFLICT (id) DO UPDATE SET scene_id = EXCLUDED.scene_id, vocabulary = EXCLUDED.vocabulary;

INSERT INTO podcast_lines (podcast_id, position, speaker, text, translation_fa, start_ms, end_ms)
VALUES
('40001000-0000-0000-0000-001600000003', 0, 'Alex', 'Welcome to 4000 Essential English Words, Book 1, Unit 16: The Historic Theater.', 'به درس 16 از کتاب 1 دوره ۴۰۰۰ واژه خوش آمدید: تماشاخانه تاریخی.', 0, 6000),
('40001000-0000-0000-0000-001600000003', 1, 'Sarah', 'Today we focus on 20 high-frequency vocabulary words used in real-life contexts.', 'امروز بر روی 20 واژه پرکاربرد در موقعیت‌های واقعی تمرکز می‌کنیم.', 6300, 13500),
('40001000-0000-0000-0000-001600000003', 2, 'Alex', 'Listen closely to the natural rhythm and pronunciation of each target phrase.', 'به ریتم طبیعی و تلفظ دقیق هر عبارت هدف خوب گوش فرا دهید.', 13800, 21000),
('40001000-0000-0000-0000-001600000003', 3, 'Sarah', 'Now head over to the shadowing section to record these sentences in your own voice!', 'حالا به بخش شادوئینگ بروید تا این جملات را با صدای خودتان تمرین و ضبط کنید!', 21400, 29000)
ON CONFLICT DO NOTHING;

-- کتاب 1 - درس 17: The Cultural Gathering
INSERT INTO scenes (id, title, description, background_image_url, difficulty, status, "order", category, is_custom)
VALUES ('40001000-0000-0000-0000-001700000001', 'The Cultural Gathering (Book 1 - Unit 17)', 'تمرین شادوئینگ یونیت 17 کتاب 1 (گردهمایی فرهنگی): learn, manage, notice, organize, practice, quality...', '', 'beginner', 'published', 117, 'education', false)
ON CONFLICT (id) DO NOTHING;

INSERT INTO hotspots (id, scene_id, name, x_position, y_position, order_index)
VALUES ('40001000-0000-0000-0000-001700000002', '40001000-0000-0000-0000-001700000001', 'Dialogue', 50.0, 50.0, 1)
ON CONFLICT (id) DO NOTHING;

INSERT INTO dialogues (id, hotspot_id, "order", speaker, original_text, translation, audio_url, display_type)
VALUES
('40001000-0000-0000-0001-001700000001', '40001000-0000-0000-0000-001700000002', 1, 'customer', 'Exploring the cultural gathering offers a great opportunity to master essential vocabulary.', 'بررسی موضوع گردهمایی فرهنگی فرصتی عالی برای تسلط بر واژگان ضروری به شمار می‌رود.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full'),
('40001000-0000-0000-0001-001700000002', '40001000-0000-0000-0000-001700000002', 2, 'clerk', 'Native speakers naturally use target words like learn and manage in conversation.', 'گویندگان نیتیو کلماتی چون learn (یاد گرفتن) و manage (مدیریت کردن) را به صورت طبیعی در مکالمه به کار می‌برند.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full'),
('40001000-0000-0000-0001-001700000003', '40001000-0000-0000-0000-001700000002', 3, 'customer', 'Practicing sentence by sentence with clear pronunciation builds real conversational fluency.', 'تمرین جمله‌به‌جمله با تلفظ شفاف، تسلط و روانی واقعی در گفتار ایجاد می‌کند.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full'),
('40001000-0000-0000-0001-001700000004', '40001000-0000-0000-0000-001700000002', 4, 'clerk', 'Staying calm and consistent turns difficult phrases into everyday speech habits.', 'آرامش و استمرار در تمرین، عبارات دشوار را به عادت‌های گفتاری روزمره بدل می‌سازد.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full'),
('40001000-0000-0000-0001-001700000005', '40001000-0000-0000-0000-001700000002', 5, 'customer', 'Completing this unit brings us closer to full mastery of English vocabulary.', 'تکمیل این درس ما را به تسلط کامل بر دایره واژگان انگلیسی نزدیک‌تر می‌کند.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full')
ON CONFLICT (id) DO NOTHING;

INSERT INTO podcasts (id, title, description_fa, level, kind, series_id, episode_no, audio_url, audio_status, is_active, duration_seconds, position, vocabulary, scene_id)
VALUES ('40001000-0000-0000-0000-001700000003', 'The Cultural Gathering (Book 1 - Unit 17)', 'روایت داستانی و آموزش واژگان یونیت 17 (گردهمایی فرهنگی) از کتاب 1 دوره ۴۰۰۰ واژه', 'beginner', 'lesson', '40000000-0001-0000-0000-000000000001', 17, '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'ready', TRUE, 334, 17, '[{"word": "learn", "meaning_fa": "یاد گرفتن"}, {"word": "manage", "meaning_fa": "مدیریت کردن"}, {"word": "notice", "meaning_fa": "توجه کردن به"}, {"word": "organize", "meaning_fa": "ساماندهی کردن"}, {"word": "practice", "meaning_fa": "تمرین مداوم"}, {"word": "quality", "meaning_fa": "کیفیت عالی"}, {"word": "result", "meaning_fa": "نتیجه مثبت"}, {"word": "success", "meaning_fa": "موفقیت چشمگیر"}, {"word": "talent", "meaning_fa": "استعداد ذاتی"}, {"word": "achieve", "meaning_fa": "دست یافتن به"}, {"word": "balance", "meaning_fa": "تعادل برقرار کردن"}, {"word": "certain", "meaning_fa": "مطمئن"}, {"word": "develop", "meaning_fa": "توسعه دادن"}, {"word": "effort", "meaning_fa": "تلاش و کوشش"}, {"word": "focus", "meaning_fa": "تمرکز کردن"}, {"word": "gain", "meaning_fa": "به دست آوردن"}, {"word": "helpful", "meaning_fa": "مفید و سودمند"}, {"word": "improve", "meaning_fa": "بهبود بخشیدن"}, {"word": "journey", "meaning_fa": "سفر پرماجرا"}, {"word": "knowledge", "meaning_fa": "دانش و آگاهی"}]'::jsonb, '40001000-0000-0000-0000-001700000001')
ON CONFLICT (id) DO UPDATE SET scene_id = EXCLUDED.scene_id, vocabulary = EXCLUDED.vocabulary;

INSERT INTO podcast_lines (podcast_id, position, speaker, text, translation_fa, start_ms, end_ms)
VALUES
('40001000-0000-0000-0000-001700000003', 0, 'Alex', 'Welcome to 4000 Essential English Words, Book 1, Unit 17: The Cultural Gathering.', 'به درس 17 از کتاب 1 دوره ۴۰۰۰ واژه خوش آمدید: گردهمایی فرهنگی.', 0, 6000),
('40001000-0000-0000-0000-001700000003', 1, 'Sarah', 'Today we focus on 20 high-frequency vocabulary words used in real-life contexts.', 'امروز بر روی 20 واژه پرکاربرد در موقعیت‌های واقعی تمرکز می‌کنیم.', 6300, 13500),
('40001000-0000-0000-0000-001700000003', 2, 'Alex', 'Listen closely to the natural rhythm and pronunciation of each target phrase.', 'به ریتم طبیعی و تلفظ دقیق هر عبارت هدف خوب گوش فرا دهید.', 13800, 21000),
('40001000-0000-0000-0000-001700000003', 3, 'Sarah', 'Now head over to the shadowing section to record these sentences in your own voice!', 'حالا به بخش شادوئینگ بروید تا این جملات را با صدای خودتان تمرین و ضبط کنید!', 21400, 29000)
ON CONFLICT DO NOTHING;

-- کتاب 1 - درس 18: The Clinic Volunteers
INSERT INTO scenes (id, title, description, background_image_url, difficulty, status, "order", category, is_custom)
VALUES ('40001000-0000-0000-0000-001800000001', 'The Clinic Volunteers (Book 1 - Unit 18)', 'تمرین شادوئینگ یونیت 18 کتاب 1 (داوطلبان درمانگاه): organize, practice, quality, result, success, talent...', '', 'beginner', 'published', 118, 'education', false)
ON CONFLICT (id) DO NOTHING;

INSERT INTO hotspots (id, scene_id, name, x_position, y_position, order_index)
VALUES ('40001000-0000-0000-0000-001800000002', '40001000-0000-0000-0000-001800000001', 'Dialogue', 50.0, 50.0, 1)
ON CONFLICT (id) DO NOTHING;

INSERT INTO dialogues (id, hotspot_id, "order", speaker, original_text, translation, audio_url, display_type)
VALUES
('40001000-0000-0000-0001-001800000001', '40001000-0000-0000-0000-001800000002', 1, 'customer', 'Exploring the clinic volunteers offers a great opportunity to master essential vocabulary.', 'بررسی موضوع داوطلبان درمانگاه فرصتی عالی برای تسلط بر واژگان ضروری به شمار می‌رود.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full'),
('40001000-0000-0000-0001-001800000002', '40001000-0000-0000-0000-001800000002', 2, 'clerk', 'Native speakers naturally use target words like organize and practice in conversation.', 'گویندگان نیتیو کلماتی چون organize (ساماندهی کردن) و practice (تمرین مداوم) را به صورت طبیعی در مکالمه به کار می‌برند.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full'),
('40001000-0000-0000-0001-001800000003', '40001000-0000-0000-0000-001800000002', 3, 'customer', 'Practicing sentence by sentence with clear pronunciation builds real conversational fluency.', 'تمرین جمله‌به‌جمله با تلفظ شفاف، تسلط و روانی واقعی در گفتار ایجاد می‌کند.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full'),
('40001000-0000-0000-0001-001800000004', '40001000-0000-0000-0000-001800000002', 4, 'clerk', 'Staying calm and consistent turns difficult phrases into everyday speech habits.', 'آرامش و استمرار در تمرین، عبارات دشوار را به عادت‌های گفتاری روزمره بدل می‌سازد.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full'),
('40001000-0000-0000-0001-001800000005', '40001000-0000-0000-0000-001800000002', 5, 'customer', 'Completing this unit brings us closer to full mastery of English vocabulary.', 'تکمیل این درس ما را به تسلط کامل بر دایره واژگان انگلیسی نزدیک‌تر می‌کند.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full')
ON CONFLICT (id) DO NOTHING;

INSERT INTO podcasts (id, title, description_fa, level, kind, series_id, episode_no, audio_url, audio_status, is_active, duration_seconds, position, vocabulary, scene_id)
VALUES ('40001000-0000-0000-0000-001800000003', 'The Clinic Volunteers (Book 1 - Unit 18)', 'روایت داستانی و آموزش واژگان یونیت 18 (داوطلبان درمانگاه) از کتاب 1 دوره ۴۰۰۰ واژه', 'beginner', 'lesson', '40000000-0001-0000-0000-000000000001', 18, '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'ready', TRUE, 336, 18, '[{"word": "organize", "meaning_fa": "ساماندهی کردن"}, {"word": "practice", "meaning_fa": "تمرین مداوم"}, {"word": "quality", "meaning_fa": "کیفیت عالی"}, {"word": "result", "meaning_fa": "نتیجه مثبت"}, {"word": "success", "meaning_fa": "موفقیت چشمگیر"}, {"word": "talent", "meaning_fa": "استعداد ذاتی"}, {"word": "achieve", "meaning_fa": "دست یافتن به"}, {"word": "balance", "meaning_fa": "تعادل برقرار کردن"}, {"word": "certain", "meaning_fa": "مطمئن"}, {"word": "develop", "meaning_fa": "توسعه دادن"}, {"word": "effort", "meaning_fa": "تلاش و کوشش"}, {"word": "focus", "meaning_fa": "تمرکز کردن"}, {"word": "gain", "meaning_fa": "به دست آوردن"}, {"word": "helpful", "meaning_fa": "مفید و سودمند"}, {"word": "improve", "meaning_fa": "بهبود بخشیدن"}, {"word": "journey", "meaning_fa": "سفر پرماجرا"}, {"word": "knowledge", "meaning_fa": "دانش و آگاهی"}, {"word": "learn", "meaning_fa": "یاد گرفتن"}, {"word": "manage", "meaning_fa": "مدیریت کردن"}, {"word": "notice", "meaning_fa": "توجه کردن به"}]'::jsonb, '40001000-0000-0000-0000-001800000001')
ON CONFLICT (id) DO UPDATE SET scene_id = EXCLUDED.scene_id, vocabulary = EXCLUDED.vocabulary;

INSERT INTO podcast_lines (podcast_id, position, speaker, text, translation_fa, start_ms, end_ms)
VALUES
('40001000-0000-0000-0000-001800000003', 0, 'Alex', 'Welcome to 4000 Essential English Words, Book 1, Unit 18: The Clinic Volunteers.', 'به درس 18 از کتاب 1 دوره ۴۰۰۰ واژه خوش آمدید: داوطلبان درمانگاه.', 0, 6000),
('40001000-0000-0000-0000-001800000003', 1, 'Sarah', 'Today we focus on 20 high-frequency vocabulary words used in real-life contexts.', 'امروز بر روی 20 واژه پرکاربرد در موقعیت‌های واقعی تمرکز می‌کنیم.', 6300, 13500),
('40001000-0000-0000-0000-001800000003', 2, 'Alex', 'Listen closely to the natural rhythm and pronunciation of each target phrase.', 'به ریتم طبیعی و تلفظ دقیق هر عبارت هدف خوب گوش فرا دهید.', 13800, 21000),
('40001000-0000-0000-0000-001800000003', 3, 'Sarah', 'Now head over to the shadowing section to record these sentences in your own voice!', 'حالا به بخش شادوئینگ بروید تا این جملات را با صدای خودتان تمرین و ضبط کنید!', 21400, 29000)
ON CONFLICT DO NOTHING;

-- کتاب 1 - درس 19: The Airport Departure
INSERT INTO scenes (id, title, description, background_image_url, difficulty, status, "order", category, is_custom)
VALUES ('40001000-0000-0000-0000-001900000001', 'The Airport Departure (Book 1 - Unit 19)', 'تمرین شادوئینگ یونیت 19 کتاب 1 (ترمینال فرودگاه): result, success, talent, achieve, balance, certain...', '', 'beginner', 'published', 119, 'education', false)
ON CONFLICT (id) DO NOTHING;

INSERT INTO hotspots (id, scene_id, name, x_position, y_position, order_index)
VALUES ('40001000-0000-0000-0000-001900000002', '40001000-0000-0000-0000-001900000001', 'Dialogue', 50.0, 50.0, 1)
ON CONFLICT (id) DO NOTHING;

INSERT INTO dialogues (id, hotspot_id, "order", speaker, original_text, translation, audio_url, display_type)
VALUES
('40001000-0000-0000-0001-001900000001', '40001000-0000-0000-0000-001900000002', 1, 'customer', 'Exploring the airport departure offers a great opportunity to master essential vocabulary.', 'بررسی موضوع ترمینال فرودگاه فرصتی عالی برای تسلط بر واژگان ضروری به شمار می‌رود.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full'),
('40001000-0000-0000-0001-001900000002', '40001000-0000-0000-0000-001900000002', 2, 'clerk', 'Native speakers naturally use target words like result and success in conversation.', 'گویندگان نیتیو کلماتی چون result (نتیجه مثبت) و success (موفقیت چشمگیر) را به صورت طبیعی در مکالمه به کار می‌برند.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full'),
('40001000-0000-0000-0001-001900000003', '40001000-0000-0000-0000-001900000002', 3, 'customer', 'Practicing sentence by sentence with clear pronunciation builds real conversational fluency.', 'تمرین جمله‌به‌جمله با تلفظ شفاف، تسلط و روانی واقعی در گفتار ایجاد می‌کند.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full'),
('40001000-0000-0000-0001-001900000004', '40001000-0000-0000-0000-001900000002', 4, 'clerk', 'Staying calm and consistent turns difficult phrases into everyday speech habits.', 'آرامش و استمرار در تمرین، عبارات دشوار را به عادت‌های گفتاری روزمره بدل می‌سازد.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full'),
('40001000-0000-0000-0001-001900000005', '40001000-0000-0000-0000-001900000002', 5, 'customer', 'Completing this unit brings us closer to full mastery of English vocabulary.', 'تکمیل این درس ما را به تسلط کامل بر دایره واژگان انگلیسی نزدیک‌تر می‌کند.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full')
ON CONFLICT (id) DO NOTHING;

INSERT INTO podcasts (id, title, description_fa, level, kind, series_id, episode_no, audio_url, audio_status, is_active, duration_seconds, position, vocabulary, scene_id)
VALUES ('40001000-0000-0000-0000-001900000003', 'The Airport Departure (Book 1 - Unit 19)', 'روایت داستانی و آموزش واژگان یونیت 19 (ترمینال فرودگاه) از کتاب 1 دوره ۴۰۰۰ واژه', 'beginner', 'lesson', '40000000-0001-0000-0000-000000000001', 19, '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'ready', TRUE, 338, 19, '[{"word": "result", "meaning_fa": "نتیجه مثبت"}, {"word": "success", "meaning_fa": "موفقیت چشمگیر"}, {"word": "talent", "meaning_fa": "استعداد ذاتی"}, {"word": "achieve", "meaning_fa": "دست یافتن به"}, {"word": "balance", "meaning_fa": "تعادل برقرار کردن"}, {"word": "certain", "meaning_fa": "مطمئن"}, {"word": "develop", "meaning_fa": "توسعه دادن"}, {"word": "effort", "meaning_fa": "تلاش و کوشش"}, {"word": "focus", "meaning_fa": "تمرکز کردن"}, {"word": "gain", "meaning_fa": "به دست آوردن"}, {"word": "helpful", "meaning_fa": "مفید و سودمند"}, {"word": "improve", "meaning_fa": "بهبود بخشیدن"}, {"word": "journey", "meaning_fa": "سفر پرماجرا"}, {"word": "knowledge", "meaning_fa": "دانش و آگاهی"}, {"word": "learn", "meaning_fa": "یاد گرفتن"}, {"word": "manage", "meaning_fa": "مدیریت کردن"}, {"word": "notice", "meaning_fa": "توجه کردن به"}, {"word": "organize", "meaning_fa": "ساماندهی کردن"}, {"word": "practice", "meaning_fa": "تمرین مداوم"}, {"word": "quality", "meaning_fa": "کیفیت عالی"}]'::jsonb, '40001000-0000-0000-0000-001900000001')
ON CONFLICT (id) DO UPDATE SET scene_id = EXCLUDED.scene_id, vocabulary = EXCLUDED.vocabulary;

INSERT INTO podcast_lines (podcast_id, position, speaker, text, translation_fa, start_ms, end_ms)
VALUES
('40001000-0000-0000-0000-001900000003', 0, 'Alex', 'Welcome to 4000 Essential English Words, Book 1, Unit 19: The Airport Departure.', 'به درس 19 از کتاب 1 دوره ۴۰۰۰ واژه خوش آمدید: ترمینال فرودگاه.', 0, 6000),
('40001000-0000-0000-0000-001900000003', 1, 'Sarah', 'Today we focus on 20 high-frequency vocabulary words used in real-life contexts.', 'امروز بر روی 20 واژه پرکاربرد در موقعیت‌های واقعی تمرکز می‌کنیم.', 6300, 13500),
('40001000-0000-0000-0000-001900000003', 2, 'Alex', 'Listen closely to the natural rhythm and pronunciation of each target phrase.', 'به ریتم طبیعی و تلفظ دقیق هر عبارت هدف خوب گوش فرا دهید.', 13800, 21000),
('40001000-0000-0000-0000-001900000003', 3, 'Sarah', 'Now head over to the shadowing section to record these sentences in your own voice!', 'حالا به بخش شادوئینگ بروید تا این جملات را با صدای خودتان تمرین و ضبط کنید!', 21400, 29000)
ON CONFLICT DO NOTHING;

-- کتاب 1 - درس 20: The Grand Festival
INSERT INTO scenes (id, title, description, background_image_url, difficulty, status, "order", category, is_custom)
VALUES ('40001000-0000-0000-0000-002000000001', 'The Grand Festival (Book 1 - Unit 20)', 'تمرین شادوئینگ یونیت 20 کتاب 1 (کارناوال بهاره): achieve, balance, certain, develop, effort, focus...', '', 'beginner', 'published', 120, 'education', false)
ON CONFLICT (id) DO NOTHING;

INSERT INTO hotspots (id, scene_id, name, x_position, y_position, order_index)
VALUES ('40001000-0000-0000-0000-002000000002', '40001000-0000-0000-0000-002000000001', 'Dialogue', 50.0, 50.0, 1)
ON CONFLICT (id) DO NOTHING;

INSERT INTO dialogues (id, hotspot_id, "order", speaker, original_text, translation, audio_url, display_type)
VALUES
('40001000-0000-0000-0001-002000000001', '40001000-0000-0000-0000-002000000002', 1, 'customer', 'Exploring the grand festival offers a great opportunity to master essential vocabulary.', 'بررسی موضوع کارناوال بهاره فرصتی عالی برای تسلط بر واژگان ضروری به شمار می‌رود.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full'),
('40001000-0000-0000-0001-002000000002', '40001000-0000-0000-0000-002000000002', 2, 'clerk', 'Native speakers naturally use target words like achieve and balance in conversation.', 'گویندگان نیتیو کلماتی چون achieve (دست یافتن به) و balance (تعادل برقرار کردن) را به صورت طبیعی در مکالمه به کار می‌برند.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full'),
('40001000-0000-0000-0001-002000000003', '40001000-0000-0000-0000-002000000002', 3, 'customer', 'Practicing sentence by sentence with clear pronunciation builds real conversational fluency.', 'تمرین جمله‌به‌جمله با تلفظ شفاف، تسلط و روانی واقعی در گفتار ایجاد می‌کند.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full'),
('40001000-0000-0000-0001-002000000004', '40001000-0000-0000-0000-002000000002', 4, 'clerk', 'Staying calm and consistent turns difficult phrases into everyday speech habits.', 'آرامش و استمرار در تمرین، عبارات دشوار را به عادت‌های گفتاری روزمره بدل می‌سازد.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full'),
('40001000-0000-0000-0001-002000000005', '40001000-0000-0000-0000-002000000002', 5, 'customer', 'Completing this unit brings us closer to full mastery of English vocabulary.', 'تکمیل این درس ما را به تسلط کامل بر دایره واژگان انگلیسی نزدیک‌تر می‌کند.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full')
ON CONFLICT (id) DO NOTHING;

INSERT INTO podcasts (id, title, description_fa, level, kind, series_id, episode_no, audio_url, audio_status, is_active, duration_seconds, position, vocabulary, scene_id)
VALUES ('40001000-0000-0000-0000-002000000003', 'The Grand Festival (Book 1 - Unit 20)', 'روایت داستانی و آموزش واژگان یونیت 20 (کارناوال بهاره) از کتاب 1 دوره ۴۰۰۰ واژه', 'beginner', 'lesson', '40000000-0001-0000-0000-000000000001', 20, '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'ready', TRUE, 340, 20, '[{"word": "achieve", "meaning_fa": "دست یافتن به"}, {"word": "balance", "meaning_fa": "تعادل برقرار کردن"}, {"word": "certain", "meaning_fa": "مطمئن"}, {"word": "develop", "meaning_fa": "توسعه دادن"}, {"word": "effort", "meaning_fa": "تلاش و کوشش"}, {"word": "focus", "meaning_fa": "تمرکز کردن"}, {"word": "gain", "meaning_fa": "به دست آوردن"}, {"word": "helpful", "meaning_fa": "مفید و سودمند"}, {"word": "improve", "meaning_fa": "بهبود بخشیدن"}, {"word": "journey", "meaning_fa": "سفر پرماجرا"}, {"word": "knowledge", "meaning_fa": "دانش و آگاهی"}, {"word": "learn", "meaning_fa": "یاد گرفتن"}, {"word": "manage", "meaning_fa": "مدیریت کردن"}, {"word": "notice", "meaning_fa": "توجه کردن به"}, {"word": "organize", "meaning_fa": "ساماندهی کردن"}, {"word": "practice", "meaning_fa": "تمرین مداوم"}, {"word": "quality", "meaning_fa": "کیفیت عالی"}, {"word": "result", "meaning_fa": "نتیجه مثبت"}, {"word": "success", "meaning_fa": "موفقیت چشمگیر"}, {"word": "talent", "meaning_fa": "استعداد ذاتی"}]'::jsonb, '40001000-0000-0000-0000-002000000001')
ON CONFLICT (id) DO UPDATE SET scene_id = EXCLUDED.scene_id, vocabulary = EXCLUDED.vocabulary;

INSERT INTO podcast_lines (podcast_id, position, speaker, text, translation_fa, start_ms, end_ms)
VALUES
('40001000-0000-0000-0000-002000000003', 0, 'Alex', 'Welcome to 4000 Essential English Words, Book 1, Unit 20: The Grand Festival.', 'به درس 20 از کتاب 1 دوره ۴۰۰۰ واژه خوش آمدید: کارناوال بهاره.', 0, 6000),
('40001000-0000-0000-0000-002000000003', 1, 'Sarah', 'Today we focus on 20 high-frequency vocabulary words used in real-life contexts.', 'امروز بر روی 20 واژه پرکاربرد در موقعیت‌های واقعی تمرکز می‌کنیم.', 6300, 13500),
('40001000-0000-0000-0000-002000000003', 2, 'Alex', 'Listen closely to the natural rhythm and pronunciation of each target phrase.', 'به ریتم طبیعی و تلفظ دقیق هر عبارت هدف خوب گوش فرا دهید.', 13800, 21000),
('40001000-0000-0000-0000-002000000003', 3, 'Sarah', 'Now head over to the shadowing section to record these sentences in your own voice!', 'حالا به بخش شادوئینگ بروید تا این جملات را با صدای خودتان تمرین و ضبط کنید!', 21400, 29000)
ON CONFLICT DO NOTHING;

-- کتاب 1 - درس 21: The City Library
INSERT INTO scenes (id, title, description, background_image_url, difficulty, status, "order", category, is_custom)
VALUES ('40001000-0000-0000-0000-002100000001', 'The City Library (Book 1 - Unit 21)', 'تمرین شادوئینگ یونیت 21 کتاب 1 (کتابخانه مرکزی): develop, effort, focus, gain, helpful, improve...', '', 'beginner', 'published', 121, 'education', false)
ON CONFLICT (id) DO NOTHING;

INSERT INTO hotspots (id, scene_id, name, x_position, y_position, order_index)
VALUES ('40001000-0000-0000-0000-002100000002', '40001000-0000-0000-0000-002100000001', 'Dialogue', 50.0, 50.0, 1)
ON CONFLICT (id) DO NOTHING;

INSERT INTO dialogues (id, hotspot_id, "order", speaker, original_text, translation, audio_url, display_type)
VALUES
('40001000-0000-0000-0001-002100000001', '40001000-0000-0000-0000-002100000002', 1, 'customer', 'Exploring the city library offers a great opportunity to master essential vocabulary.', 'بررسی موضوع کتابخانه مرکزی فرصتی عالی برای تسلط بر واژگان ضروری به شمار می‌رود.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full'),
('40001000-0000-0000-0001-002100000002', '40001000-0000-0000-0000-002100000002', 2, 'clerk', 'Native speakers naturally use target words like develop and effort in conversation.', 'گویندگان نیتیو کلماتی چون develop (توسعه دادن) و effort (تلاش و کوشش) را به صورت طبیعی در مکالمه به کار می‌برند.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full'),
('40001000-0000-0000-0001-002100000003', '40001000-0000-0000-0000-002100000002', 3, 'customer', 'Practicing sentence by sentence with clear pronunciation builds real conversational fluency.', 'تمرین جمله‌به‌جمله با تلفظ شفاف، تسلط و روانی واقعی در گفتار ایجاد می‌کند.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full'),
('40001000-0000-0000-0001-002100000004', '40001000-0000-0000-0000-002100000002', 4, 'clerk', 'Staying calm and consistent turns difficult phrases into everyday speech habits.', 'آرامش و استمرار در تمرین، عبارات دشوار را به عادت‌های گفتاری روزمره بدل می‌سازد.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full'),
('40001000-0000-0000-0001-002100000005', '40001000-0000-0000-0000-002100000002', 5, 'customer', 'Completing this unit brings us closer to full mastery of English vocabulary.', 'تکمیل این درس ما را به تسلط کامل بر دایره واژگان انگلیسی نزدیک‌تر می‌کند.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full')
ON CONFLICT (id) DO NOTHING;

INSERT INTO podcasts (id, title, description_fa, level, kind, series_id, episode_no, audio_url, audio_status, is_active, duration_seconds, position, vocabulary, scene_id)
VALUES ('40001000-0000-0000-0000-002100000003', 'The City Library (Book 1 - Unit 21)', 'روایت داستانی و آموزش واژگان یونیت 21 (کتابخانه مرکزی) از کتاب 1 دوره ۴۰۰۰ واژه', 'beginner', 'lesson', '40000000-0001-0000-0000-000000000001', 21, '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'ready', TRUE, 342, 21, '[{"word": "develop", "meaning_fa": "توسعه دادن"}, {"word": "effort", "meaning_fa": "تلاش و کوشش"}, {"word": "focus", "meaning_fa": "تمرکز کردن"}, {"word": "gain", "meaning_fa": "به دست آوردن"}, {"word": "helpful", "meaning_fa": "مفید و سودمند"}, {"word": "improve", "meaning_fa": "بهبود بخشیدن"}, {"word": "journey", "meaning_fa": "سفر پرماجرا"}, {"word": "knowledge", "meaning_fa": "دانش و آگاهی"}, {"word": "learn", "meaning_fa": "یاد گرفتن"}, {"word": "manage", "meaning_fa": "مدیریت کردن"}, {"word": "notice", "meaning_fa": "توجه کردن به"}, {"word": "organize", "meaning_fa": "ساماندهی کردن"}, {"word": "practice", "meaning_fa": "تمرین مداوم"}, {"word": "quality", "meaning_fa": "کیفیت عالی"}, {"word": "result", "meaning_fa": "نتیجه مثبت"}, {"word": "success", "meaning_fa": "موفقیت چشمگیر"}, {"word": "talent", "meaning_fa": "استعداد ذاتی"}, {"word": "achieve", "meaning_fa": "دست یافتن به"}, {"word": "balance", "meaning_fa": "تعادل برقرار کردن"}, {"word": "certain", "meaning_fa": "مطمئن"}]'::jsonb, '40001000-0000-0000-0000-002100000001')
ON CONFLICT (id) DO UPDATE SET scene_id = EXCLUDED.scene_id, vocabulary = EXCLUDED.vocabulary;

INSERT INTO podcast_lines (podcast_id, position, speaker, text, translation_fa, start_ms, end_ms)
VALUES
('40001000-0000-0000-0000-002100000003', 0, 'Alex', 'Welcome to 4000 Essential English Words, Book 1, Unit 21: The City Library.', 'به درس 21 از کتاب 1 دوره ۴۰۰۰ واژه خوش آمدید: کتابخانه مرکزی.', 0, 6000),
('40001000-0000-0000-0000-002100000003', 1, 'Sarah', 'Today we focus on 20 high-frequency vocabulary words used in real-life contexts.', 'امروز بر روی 20 واژه پرکاربرد در موقعیت‌های واقعی تمرکز می‌کنیم.', 6300, 13500),
('40001000-0000-0000-0000-002100000003', 2, 'Alex', 'Listen closely to the natural rhythm and pronunciation of each target phrase.', 'به ریتم طبیعی و تلفظ دقیق هر عبارت هدف خوب گوش فرا دهید.', 13800, 21000),
('40001000-0000-0000-0000-002100000003', 3, 'Sarah', 'Now head over to the shadowing section to record these sentences in your own voice!', 'حالا به بخش شادوئینگ بروید تا این جملات را با صدای خودتان تمرین و ضبط کنید!', 21400, 29000)
ON CONFLICT DO NOTHING;

-- کتاب 1 - درس 22: The Local Market
INSERT INTO scenes (id, title, description, background_image_url, difficulty, status, "order", category, is_custom)
VALUES ('40001000-0000-0000-0000-002200000001', 'The Local Market (Book 1 - Unit 22)', 'تمرین شادوئینگ یونیت 22 کتاب 1 (بازار محلی روز): gain, helpful, improve, journey, knowledge, learn...', '', 'beginner', 'published', 122, 'education', false)
ON CONFLICT (id) DO NOTHING;

INSERT INTO hotspots (id, scene_id, name, x_position, y_position, order_index)
VALUES ('40001000-0000-0000-0000-002200000002', '40001000-0000-0000-0000-002200000001', 'Dialogue', 50.0, 50.0, 1)
ON CONFLICT (id) DO NOTHING;

INSERT INTO dialogues (id, hotspot_id, "order", speaker, original_text, translation, audio_url, display_type)
VALUES
('40001000-0000-0000-0001-002200000001', '40001000-0000-0000-0000-002200000002', 1, 'customer', 'Exploring the local market offers a great opportunity to master essential vocabulary.', 'بررسی موضوع بازار محلی روز فرصتی عالی برای تسلط بر واژگان ضروری به شمار می‌رود.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full'),
('40001000-0000-0000-0001-002200000002', '40001000-0000-0000-0000-002200000002', 2, 'clerk', 'Native speakers naturally use target words like gain and helpful in conversation.', 'گویندگان نیتیو کلماتی چون gain (به دست آوردن) و helpful (مفید و سودمند) را به صورت طبیعی در مکالمه به کار می‌برند.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full'),
('40001000-0000-0000-0001-002200000003', '40001000-0000-0000-0000-002200000002', 3, 'customer', 'Practicing sentence by sentence with clear pronunciation builds real conversational fluency.', 'تمرین جمله‌به‌جمله با تلفظ شفاف، تسلط و روانی واقعی در گفتار ایجاد می‌کند.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full'),
('40001000-0000-0000-0001-002200000004', '40001000-0000-0000-0000-002200000002', 4, 'clerk', 'Staying calm and consistent turns difficult phrases into everyday speech habits.', 'آرامش و استمرار در تمرین، عبارات دشوار را به عادت‌های گفتاری روزمره بدل می‌سازد.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full'),
('40001000-0000-0000-0001-002200000005', '40001000-0000-0000-0000-002200000002', 5, 'customer', 'Completing this unit brings us closer to full mastery of English vocabulary.', 'تکمیل این درس ما را به تسلط کامل بر دایره واژگان انگلیسی نزدیک‌تر می‌کند.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full')
ON CONFLICT (id) DO NOTHING;

INSERT INTO podcasts (id, title, description_fa, level, kind, series_id, episode_no, audio_url, audio_status, is_active, duration_seconds, position, vocabulary, scene_id)
VALUES ('40001000-0000-0000-0000-002200000003', 'The Local Market (Book 1 - Unit 22)', 'روایت داستانی و آموزش واژگان یونیت 22 (بازار محلی روز) از کتاب 1 دوره ۴۰۰۰ واژه', 'beginner', 'lesson', '40000000-0001-0000-0000-000000000001', 22, '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'ready', TRUE, 344, 22, '[{"word": "gain", "meaning_fa": "به دست آوردن"}, {"word": "helpful", "meaning_fa": "مفید و سودمند"}, {"word": "improve", "meaning_fa": "بهبود بخشیدن"}, {"word": "journey", "meaning_fa": "سفر پرماجرا"}, {"word": "knowledge", "meaning_fa": "دانش و آگاهی"}, {"word": "learn", "meaning_fa": "یاد گرفتن"}, {"word": "manage", "meaning_fa": "مدیریت کردن"}, {"word": "notice", "meaning_fa": "توجه کردن به"}, {"word": "organize", "meaning_fa": "ساماندهی کردن"}, {"word": "practice", "meaning_fa": "تمرین مداوم"}, {"word": "quality", "meaning_fa": "کیفیت عالی"}, {"word": "result", "meaning_fa": "نتیجه مثبت"}, {"word": "success", "meaning_fa": "موفقیت چشمگیر"}, {"word": "talent", "meaning_fa": "استعداد ذاتی"}, {"word": "achieve", "meaning_fa": "دست یافتن به"}, {"word": "balance", "meaning_fa": "تعادل برقرار کردن"}, {"word": "certain", "meaning_fa": "مطمئن"}, {"word": "develop", "meaning_fa": "توسعه دادن"}, {"word": "effort", "meaning_fa": "تلاش و کوشش"}, {"word": "focus", "meaning_fa": "تمرکز کردن"}]'::jsonb, '40001000-0000-0000-0000-002200000001')
ON CONFLICT (id) DO UPDATE SET scene_id = EXCLUDED.scene_id, vocabulary = EXCLUDED.vocabulary;

INSERT INTO podcast_lines (podcast_id, position, speaker, text, translation_fa, start_ms, end_ms)
VALUES
('40001000-0000-0000-0000-002200000003', 0, 'Alex', 'Welcome to 4000 Essential English Words, Book 1, Unit 22: The Local Market.', 'به درس 22 از کتاب 1 دوره ۴۰۰۰ واژه خوش آمدید: بازار محلی روز.', 0, 6000),
('40001000-0000-0000-0000-002200000003', 1, 'Sarah', 'Today we focus on 20 high-frequency vocabulary words used in real-life contexts.', 'امروز بر روی 20 واژه پرکاربرد در موقعیت‌های واقعی تمرکز می‌کنیم.', 6300, 13500),
('40001000-0000-0000-0000-002200000003', 2, 'Alex', 'Listen closely to the natural rhythm and pronunciation of each target phrase.', 'به ریتم طبیعی و تلفظ دقیق هر عبارت هدف خوب گوش فرا دهید.', 13800, 21000),
('40001000-0000-0000-0000-002200000003', 3, 'Sarah', 'Now head over to the shadowing section to record these sentences in your own voice!', 'حالا به بخش شادوئینگ بروید تا این جملات را با صدای خودتان تمرین و ضبط کنید!', 21400, 29000)
ON CONFLICT DO NOTHING;

-- کتاب 1 - درس 23: The Art Studio
INSERT INTO scenes (id, title, description, background_image_url, difficulty, status, "order", category, is_custom)
VALUES ('40001000-0000-0000-0000-002300000001', 'The Art Studio (Book 1 - Unit 23)', 'تمرین شادوئینگ یونیت 23 کتاب 1 (کارگاه نقاشی و هنر): journey, knowledge, learn, manage, notice, organize...', '', 'beginner', 'published', 123, 'education', false)
ON CONFLICT (id) DO NOTHING;

INSERT INTO hotspots (id, scene_id, name, x_position, y_position, order_index)
VALUES ('40001000-0000-0000-0000-002300000002', '40001000-0000-0000-0000-002300000001', 'Dialogue', 50.0, 50.0, 1)
ON CONFLICT (id) DO NOTHING;

INSERT INTO dialogues (id, hotspot_id, "order", speaker, original_text, translation, audio_url, display_type)
VALUES
('40001000-0000-0000-0001-002300000001', '40001000-0000-0000-0000-002300000002', 1, 'customer', 'Exploring the art studio offers a great opportunity to master essential vocabulary.', 'بررسی موضوع کارگاه نقاشی و هنر فرصتی عالی برای تسلط بر واژگان ضروری به شمار می‌رود.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full'),
('40001000-0000-0000-0001-002300000002', '40001000-0000-0000-0000-002300000002', 2, 'clerk', 'Native speakers naturally use target words like journey and knowledge in conversation.', 'گویندگان نیتیو کلماتی چون journey (سفر پرماجرا) و knowledge (دانش و آگاهی) را به صورت طبیعی در مکالمه به کار می‌برند.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full'),
('40001000-0000-0000-0001-002300000003', '40001000-0000-0000-0000-002300000002', 3, 'customer', 'Practicing sentence by sentence with clear pronunciation builds real conversational fluency.', 'تمرین جمله‌به‌جمله با تلفظ شفاف، تسلط و روانی واقعی در گفتار ایجاد می‌کند.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full'),
('40001000-0000-0000-0001-002300000004', '40001000-0000-0000-0000-002300000002', 4, 'clerk', 'Staying calm and consistent turns difficult phrases into everyday speech habits.', 'آرامش و استمرار در تمرین، عبارات دشوار را به عادت‌های گفتاری روزمره بدل می‌سازد.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full'),
('40001000-0000-0000-0001-002300000005', '40001000-0000-0000-0000-002300000002', 5, 'customer', 'Completing this unit brings us closer to full mastery of English vocabulary.', 'تکمیل این درس ما را به تسلط کامل بر دایره واژگان انگلیسی نزدیک‌تر می‌کند.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full')
ON CONFLICT (id) DO NOTHING;

INSERT INTO podcasts (id, title, description_fa, level, kind, series_id, episode_no, audio_url, audio_status, is_active, duration_seconds, position, vocabulary, scene_id)
VALUES ('40001000-0000-0000-0000-002300000003', 'The Art Studio (Book 1 - Unit 23)', 'روایت داستانی و آموزش واژگان یونیت 23 (کارگاه نقاشی و هنر) از کتاب 1 دوره ۴۰۰۰ واژه', 'beginner', 'lesson', '40000000-0001-0000-0000-000000000001', 23, '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'ready', TRUE, 346, 23, '[{"word": "journey", "meaning_fa": "سفر پرماجرا"}, {"word": "knowledge", "meaning_fa": "دانش و آگاهی"}, {"word": "learn", "meaning_fa": "یاد گرفتن"}, {"word": "manage", "meaning_fa": "مدیریت کردن"}, {"word": "notice", "meaning_fa": "توجه کردن به"}, {"word": "organize", "meaning_fa": "ساماندهی کردن"}, {"word": "practice", "meaning_fa": "تمرین مداوم"}, {"word": "quality", "meaning_fa": "کیفیت عالی"}, {"word": "result", "meaning_fa": "نتیجه مثبت"}, {"word": "success", "meaning_fa": "موفقیت چشمگیر"}, {"word": "talent", "meaning_fa": "استعداد ذاتی"}, {"word": "achieve", "meaning_fa": "دست یافتن به"}, {"word": "balance", "meaning_fa": "تعادل برقرار کردن"}, {"word": "certain", "meaning_fa": "مطمئن"}, {"word": "develop", "meaning_fa": "توسعه دادن"}, {"word": "effort", "meaning_fa": "تلاش و کوشش"}, {"word": "focus", "meaning_fa": "تمرکز کردن"}, {"word": "gain", "meaning_fa": "به دست آوردن"}, {"word": "helpful", "meaning_fa": "مفید و سودمند"}, {"word": "improve", "meaning_fa": "بهبود بخشیدن"}]'::jsonb, '40001000-0000-0000-0000-002300000001')
ON CONFLICT (id) DO UPDATE SET scene_id = EXCLUDED.scene_id, vocabulary = EXCLUDED.vocabulary;

INSERT INTO podcast_lines (podcast_id, position, speaker, text, translation_fa, start_ms, end_ms)
VALUES
('40001000-0000-0000-0000-002300000003', 0, 'Alex', 'Welcome to 4000 Essential English Words, Book 1, Unit 23: The Art Studio.', 'به درس 23 از کتاب 1 دوره ۴۰۰۰ واژه خوش آمدید: کارگاه نقاشی و هنر.', 0, 6000),
('40001000-0000-0000-0000-002300000003', 1, 'Sarah', 'Today we focus on 20 high-frequency vocabulary words used in real-life contexts.', 'امروز بر روی 20 واژه پرکاربرد در موقعیت‌های واقعی تمرکز می‌کنیم.', 6300, 13500),
('40001000-0000-0000-0000-002300000003', 2, 'Alex', 'Listen closely to the natural rhythm and pronunciation of each target phrase.', 'به ریتم طبیعی و تلفظ دقیق هر عبارت هدف خوب گوش فرا دهید.', 13800, 21000),
('40001000-0000-0000-0000-002300000003', 3, 'Sarah', 'Now head over to the shadowing section to record these sentences in your own voice!', 'حالا به بخش شادوئینگ بروید تا این جملات را با صدای خودتان تمرین و ضبط کنید!', 21400, 29000)
ON CONFLICT DO NOTHING;

-- کتاب 1 - درس 24: The Coastal Lighthouse
INSERT INTO scenes (id, title, description, background_image_url, difficulty, status, "order", category, is_custom)
VALUES ('40001000-0000-0000-0000-002400000001', 'The Coastal Lighthouse (Book 1 - Unit 24)', 'تمرین شادوئینگ یونیت 24 کتاب 1 (فانوس دریایی ساحل): manage, notice, organize, practice, quality, result...', '', 'beginner', 'published', 124, 'education', false)
ON CONFLICT (id) DO NOTHING;

INSERT INTO hotspots (id, scene_id, name, x_position, y_position, order_index)
VALUES ('40001000-0000-0000-0000-002400000002', '40001000-0000-0000-0000-002400000001', 'Dialogue', 50.0, 50.0, 1)
ON CONFLICT (id) DO NOTHING;

INSERT INTO dialogues (id, hotspot_id, "order", speaker, original_text, translation, audio_url, display_type)
VALUES
('40001000-0000-0000-0001-002400000001', '40001000-0000-0000-0000-002400000002', 1, 'customer', 'Exploring the coastal lighthouse offers a great opportunity to master essential vocabulary.', 'بررسی موضوع فانوس دریایی ساحل فرصتی عالی برای تسلط بر واژگان ضروری به شمار می‌رود.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full'),
('40001000-0000-0000-0001-002400000002', '40001000-0000-0000-0000-002400000002', 2, 'clerk', 'Native speakers naturally use target words like manage and notice in conversation.', 'گویندگان نیتیو کلماتی چون manage (مدیریت کردن) و notice (توجه کردن به) را به صورت طبیعی در مکالمه به کار می‌برند.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full'),
('40001000-0000-0000-0001-002400000003', '40001000-0000-0000-0000-002400000002', 3, 'customer', 'Practicing sentence by sentence with clear pronunciation builds real conversational fluency.', 'تمرین جمله‌به‌جمله با تلفظ شفاف، تسلط و روانی واقعی در گفتار ایجاد می‌کند.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full'),
('40001000-0000-0000-0001-002400000004', '40001000-0000-0000-0000-002400000002', 4, 'clerk', 'Staying calm and consistent turns difficult phrases into everyday speech habits.', 'آرامش و استمرار در تمرین، عبارات دشوار را به عادت‌های گفتاری روزمره بدل می‌سازد.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full'),
('40001000-0000-0000-0001-002400000005', '40001000-0000-0000-0000-002400000002', 5, 'customer', 'Completing this unit brings us closer to full mastery of English vocabulary.', 'تکمیل این درس ما را به تسلط کامل بر دایره واژگان انگلیسی نزدیک‌تر می‌کند.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full')
ON CONFLICT (id) DO NOTHING;

INSERT INTO podcasts (id, title, description_fa, level, kind, series_id, episode_no, audio_url, audio_status, is_active, duration_seconds, position, vocabulary, scene_id)
VALUES ('40001000-0000-0000-0000-002400000003', 'The Coastal Lighthouse (Book 1 - Unit 24)', 'روایت داستانی و آموزش واژگان یونیت 24 (فانوس دریایی ساحل) از کتاب 1 دوره ۴۰۰۰ واژه', 'beginner', 'lesson', '40000000-0001-0000-0000-000000000001', 24, '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'ready', TRUE, 348, 24, '[{"word": "manage", "meaning_fa": "مدیریت کردن"}, {"word": "notice", "meaning_fa": "توجه کردن به"}, {"word": "organize", "meaning_fa": "ساماندهی کردن"}, {"word": "practice", "meaning_fa": "تمرین مداوم"}, {"word": "quality", "meaning_fa": "کیفیت عالی"}, {"word": "result", "meaning_fa": "نتیجه مثبت"}, {"word": "success", "meaning_fa": "موفقیت چشمگیر"}, {"word": "talent", "meaning_fa": "استعداد ذاتی"}, {"word": "achieve", "meaning_fa": "دست یافتن به"}, {"word": "balance", "meaning_fa": "تعادل برقرار کردن"}, {"word": "certain", "meaning_fa": "مطمئن"}, {"word": "develop", "meaning_fa": "توسعه دادن"}, {"word": "effort", "meaning_fa": "تلاش و کوشش"}, {"word": "focus", "meaning_fa": "تمرکز کردن"}, {"word": "gain", "meaning_fa": "به دست آوردن"}, {"word": "helpful", "meaning_fa": "مفید و سودمند"}, {"word": "improve", "meaning_fa": "بهبود بخشیدن"}, {"word": "journey", "meaning_fa": "سفر پرماجرا"}, {"word": "knowledge", "meaning_fa": "دانش و آگاهی"}, {"word": "learn", "meaning_fa": "یاد گرفتن"}]'::jsonb, '40001000-0000-0000-0000-002400000001')
ON CONFLICT (id) DO UPDATE SET scene_id = EXCLUDED.scene_id, vocabulary = EXCLUDED.vocabulary;

INSERT INTO podcast_lines (podcast_id, position, speaker, text, translation_fa, start_ms, end_ms)
VALUES
('40001000-0000-0000-0000-002400000003', 0, 'Alex', 'Welcome to 4000 Essential English Words, Book 1, Unit 24: The Coastal Lighthouse.', 'به درس 24 از کتاب 1 دوره ۴۰۰۰ واژه خوش آمدید: فانوس دریایی ساحل.', 0, 6000),
('40001000-0000-0000-0000-002400000003', 1, 'Sarah', 'Today we focus on 20 high-frequency vocabulary words used in real-life contexts.', 'امروز بر روی 20 واژه پرکاربرد در موقعیت‌های واقعی تمرکز می‌کنیم.', 6300, 13500),
('40001000-0000-0000-0000-002400000003', 2, 'Alex', 'Listen closely to the natural rhythm and pronunciation of each target phrase.', 'به ریتم طبیعی و تلفظ دقیق هر عبارت هدف خوب گوش فرا دهید.', 13800, 21000),
('40001000-0000-0000-0000-002400000003', 3, 'Sarah', 'Now head over to the shadowing section to record these sentences in your own voice!', 'حالا به بخش شادوئینگ بروید تا این جملات را با صدای خودتان تمرین و ضبط کنید!', 21400, 29000)
ON CONFLICT DO NOTHING;

-- کتاب 1 - درس 25: The Botanical Garden
INSERT INTO scenes (id, title, description, background_image_url, difficulty, status, "order", category, is_custom)
VALUES ('40001000-0000-0000-0000-002500000001', 'The Botanical Garden (Book 1 - Unit 25)', 'تمرین شادوئینگ یونیت 25 کتاب 1 (باغ گیاه‌شناسی): practice, quality, result, success, talent, achieve...', '', 'beginner', 'published', 125, 'education', false)
ON CONFLICT (id) DO NOTHING;

INSERT INTO hotspots (id, scene_id, name, x_position, y_position, order_index)
VALUES ('40001000-0000-0000-0000-002500000002', '40001000-0000-0000-0000-002500000001', 'Dialogue', 50.0, 50.0, 1)
ON CONFLICT (id) DO NOTHING;

INSERT INTO dialogues (id, hotspot_id, "order", speaker, original_text, translation, audio_url, display_type)
VALUES
('40001000-0000-0000-0001-002500000001', '40001000-0000-0000-0000-002500000002', 1, 'customer', 'Exploring the botanical garden offers a great opportunity to master essential vocabulary.', 'بررسی موضوع باغ گیاه‌شناسی فرصتی عالی برای تسلط بر واژگان ضروری به شمار می‌رود.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full'),
('40001000-0000-0000-0001-002500000002', '40001000-0000-0000-0000-002500000002', 2, 'clerk', 'Native speakers naturally use target words like practice and quality in conversation.', 'گویندگان نیتیو کلماتی چون practice (تمرین مداوم) و quality (کیفیت عالی) را به صورت طبیعی در مکالمه به کار می‌برند.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full'),
('40001000-0000-0000-0001-002500000003', '40001000-0000-0000-0000-002500000002', 3, 'customer', 'Practicing sentence by sentence with clear pronunciation builds real conversational fluency.', 'تمرین جمله‌به‌جمله با تلفظ شفاف، تسلط و روانی واقعی در گفتار ایجاد می‌کند.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full'),
('40001000-0000-0000-0001-002500000004', '40001000-0000-0000-0000-002500000002', 4, 'clerk', 'Staying calm and consistent turns difficult phrases into everyday speech habits.', 'آرامش و استمرار در تمرین، عبارات دشوار را به عادت‌های گفتاری روزمره بدل می‌سازد.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full'),
('40001000-0000-0000-0001-002500000005', '40001000-0000-0000-0000-002500000002', 5, 'customer', 'Completing this unit brings us closer to full mastery of English vocabulary.', 'تکمیل این درس ما را به تسلط کامل بر دایره واژگان انگلیسی نزدیک‌تر می‌کند.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full')
ON CONFLICT (id) DO NOTHING;

INSERT INTO podcasts (id, title, description_fa, level, kind, series_id, episode_no, audio_url, audio_status, is_active, duration_seconds, position, vocabulary, scene_id)
VALUES ('40001000-0000-0000-0000-002500000003', 'The Botanical Garden (Book 1 - Unit 25)', 'روایت داستانی و آموزش واژگان یونیت 25 (باغ گیاه‌شناسی) از کتاب 1 دوره ۴۰۰۰ واژه', 'beginner', 'lesson', '40000000-0001-0000-0000-000000000001', 25, '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'ready', TRUE, 350, 25, '[{"word": "practice", "meaning_fa": "تمرین مداوم"}, {"word": "quality", "meaning_fa": "کیفیت عالی"}, {"word": "result", "meaning_fa": "نتیجه مثبت"}, {"word": "success", "meaning_fa": "موفقیت چشمگیر"}, {"word": "talent", "meaning_fa": "استعداد ذاتی"}, {"word": "achieve", "meaning_fa": "دست یافتن به"}, {"word": "balance", "meaning_fa": "تعادل برقرار کردن"}, {"word": "certain", "meaning_fa": "مطمئن"}, {"word": "develop", "meaning_fa": "توسعه دادن"}, {"word": "effort", "meaning_fa": "تلاش و کوشش"}, {"word": "focus", "meaning_fa": "تمرکز کردن"}, {"word": "gain", "meaning_fa": "به دست آوردن"}, {"word": "helpful", "meaning_fa": "مفید و سودمند"}, {"word": "improve", "meaning_fa": "بهبود بخشیدن"}, {"word": "journey", "meaning_fa": "سفر پرماجرا"}, {"word": "knowledge", "meaning_fa": "دانش و آگاهی"}, {"word": "learn", "meaning_fa": "یاد گرفتن"}, {"word": "manage", "meaning_fa": "مدیریت کردن"}, {"word": "notice", "meaning_fa": "توجه کردن به"}, {"word": "organize", "meaning_fa": "ساماندهی کردن"}]'::jsonb, '40001000-0000-0000-0000-002500000001')
ON CONFLICT (id) DO UPDATE SET scene_id = EXCLUDED.scene_id, vocabulary = EXCLUDED.vocabulary;

INSERT INTO podcast_lines (podcast_id, position, speaker, text, translation_fa, start_ms, end_ms)
VALUES
('40001000-0000-0000-0000-002500000003', 0, 'Alex', 'Welcome to 4000 Essential English Words, Book 1, Unit 25: The Botanical Garden.', 'به درس 25 از کتاب 1 دوره ۴۰۰۰ واژه خوش آمدید: باغ گیاه‌شناسی.', 0, 6000),
('40001000-0000-0000-0000-002500000003', 1, 'Sarah', 'Today we focus on 20 high-frequency vocabulary words used in real-life contexts.', 'امروز بر روی 20 واژه پرکاربرد در موقعیت‌های واقعی تمرکز می‌کنیم.', 6300, 13500),
('40001000-0000-0000-0000-002500000003', 2, 'Alex', 'Listen closely to the natural rhythm and pronunciation of each target phrase.', 'به ریتم طبیعی و تلفظ دقیق هر عبارت هدف خوب گوش فرا دهید.', 13800, 21000),
('40001000-0000-0000-0000-002500000003', 3, 'Sarah', 'Now head over to the shadowing section to record these sentences in your own voice!', 'حالا به بخش شادوئینگ بروید تا این جملات را با صدای خودتان تمرین و ضبط کنید!', 21400, 29000)
ON CONFLICT DO NOTHING;

-- کتاب 1 - درس 26: The Musical Orchestra
INSERT INTO scenes (id, title, description, background_image_url, difficulty, status, "order", category, is_custom)
VALUES ('40001000-0000-0000-0000-002600000001', 'The Musical Orchestra (Book 1 - Unit 26)', 'تمرین شادوئینگ یونیت 26 کتاب 1 (ارکستر بزرگ سمفونیک): success, talent, achieve, balance, certain, develop...', '', 'beginner', 'published', 126, 'education', false)
ON CONFLICT (id) DO NOTHING;

INSERT INTO hotspots (id, scene_id, name, x_position, y_position, order_index)
VALUES ('40001000-0000-0000-0000-002600000002', '40001000-0000-0000-0000-002600000001', 'Dialogue', 50.0, 50.0, 1)
ON CONFLICT (id) DO NOTHING;

INSERT INTO dialogues (id, hotspot_id, "order", speaker, original_text, translation, audio_url, display_type)
VALUES
('40001000-0000-0000-0001-002600000001', '40001000-0000-0000-0000-002600000002', 1, 'customer', 'Exploring the musical orchestra offers a great opportunity to master essential vocabulary.', 'بررسی موضوع ارکستر بزرگ سمفونیک فرصتی عالی برای تسلط بر واژگان ضروری به شمار می‌رود.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full'),
('40001000-0000-0000-0001-002600000002', '40001000-0000-0000-0000-002600000002', 2, 'clerk', 'Native speakers naturally use target words like success and talent in conversation.', 'گویندگان نیتیو کلماتی چون success (موفقیت چشمگیر) و talent (استعداد ذاتی) را به صورت طبیعی در مکالمه به کار می‌برند.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full'),
('40001000-0000-0000-0001-002600000003', '40001000-0000-0000-0000-002600000002', 3, 'customer', 'Practicing sentence by sentence with clear pronunciation builds real conversational fluency.', 'تمرین جمله‌به‌جمله با تلفظ شفاف، تسلط و روانی واقعی در گفتار ایجاد می‌کند.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full'),
('40001000-0000-0000-0001-002600000004', '40001000-0000-0000-0000-002600000002', 4, 'clerk', 'Staying calm and consistent turns difficult phrases into everyday speech habits.', 'آرامش و استمرار در تمرین، عبارات دشوار را به عادت‌های گفتاری روزمره بدل می‌سازد.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full'),
('40001000-0000-0000-0001-002600000005', '40001000-0000-0000-0000-002600000002', 5, 'customer', 'Completing this unit brings us closer to full mastery of English vocabulary.', 'تکمیل این درس ما را به تسلط کامل بر دایره واژگان انگلیسی نزدیک‌تر می‌کند.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full')
ON CONFLICT (id) DO NOTHING;

INSERT INTO podcasts (id, title, description_fa, level, kind, series_id, episode_no, audio_url, audio_status, is_active, duration_seconds, position, vocabulary, scene_id)
VALUES ('40001000-0000-0000-0000-002600000003', 'The Musical Orchestra (Book 1 - Unit 26)', 'روایت داستانی و آموزش واژگان یونیت 26 (ارکستر بزرگ سمفونیک) از کتاب 1 دوره ۴۰۰۰ واژه', 'beginner', 'lesson', '40000000-0001-0000-0000-000000000001', 26, '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'ready', TRUE, 352, 26, '[{"word": "success", "meaning_fa": "موفقیت چشمگیر"}, {"word": "talent", "meaning_fa": "استعداد ذاتی"}, {"word": "achieve", "meaning_fa": "دست یافتن به"}, {"word": "balance", "meaning_fa": "تعادل برقرار کردن"}, {"word": "certain", "meaning_fa": "مطمئن"}, {"word": "develop", "meaning_fa": "توسعه دادن"}, {"word": "effort", "meaning_fa": "تلاش و کوشش"}, {"word": "focus", "meaning_fa": "تمرکز کردن"}, {"word": "gain", "meaning_fa": "به دست آوردن"}, {"word": "helpful", "meaning_fa": "مفید و سودمند"}, {"word": "improve", "meaning_fa": "بهبود بخشیدن"}, {"word": "journey", "meaning_fa": "سفر پرماجرا"}, {"word": "knowledge", "meaning_fa": "دانش و آگاهی"}, {"word": "learn", "meaning_fa": "یاد گرفتن"}, {"word": "manage", "meaning_fa": "مدیریت کردن"}, {"word": "notice", "meaning_fa": "توجه کردن به"}, {"word": "organize", "meaning_fa": "ساماندهی کردن"}, {"word": "practice", "meaning_fa": "تمرین مداوم"}, {"word": "quality", "meaning_fa": "کیفیت عالی"}, {"word": "result", "meaning_fa": "نتیجه مثبت"}]'::jsonb, '40001000-0000-0000-0000-002600000001')
ON CONFLICT (id) DO UPDATE SET scene_id = EXCLUDED.scene_id, vocabulary = EXCLUDED.vocabulary;

INSERT INTO podcast_lines (podcast_id, position, speaker, text, translation_fa, start_ms, end_ms)
VALUES
('40001000-0000-0000-0000-002600000003', 0, 'Alex', 'Welcome to 4000 Essential English Words, Book 1, Unit 26: The Musical Orchestra.', 'به درس 26 از کتاب 1 دوره ۴۰۰۰ واژه خوش آمدید: ارکستر بزرگ سمفونیک.', 0, 6000),
('40001000-0000-0000-0000-002600000003', 1, 'Sarah', 'Today we focus on 20 high-frequency vocabulary words used in real-life contexts.', 'امروز بر روی 20 واژه پرکاربرد در موقعیت‌های واقعی تمرکز می‌کنیم.', 6300, 13500),
('40001000-0000-0000-0000-002600000003', 2, 'Alex', 'Listen closely to the natural rhythm and pronunciation of each target phrase.', 'به ریتم طبیعی و تلفظ دقیق هر عبارت هدف خوب گوش فرا دهید.', 13800, 21000),
('40001000-0000-0000-0000-002600000003', 3, 'Sarah', 'Now head over to the shadowing section to record these sentences in your own voice!', 'حالا به بخش شادوئینگ بروید تا این جملات را با صدای خودتان تمرین و ضبط کنید!', 21400, 29000)
ON CONFLICT DO NOTHING;

-- کتاب 1 - درس 27: The Culinary Kitchen
INSERT INTO scenes (id, title, description, background_image_url, difficulty, status, "order", category, is_custom)
VALUES ('40001000-0000-0000-0000-002700000001', 'The Culinary Kitchen (Book 1 - Unit 27)', 'تمرین شادوئینگ یونیت 27 کتاب 1 (آشپزخانه بین‌المللی): balance, certain, develop, effort, focus, gain...', '', 'beginner', 'published', 127, 'education', false)
ON CONFLICT (id) DO NOTHING;

INSERT INTO hotspots (id, scene_id, name, x_position, y_position, order_index)
VALUES ('40001000-0000-0000-0000-002700000002', '40001000-0000-0000-0000-002700000001', 'Dialogue', 50.0, 50.0, 1)
ON CONFLICT (id) DO NOTHING;

INSERT INTO dialogues (id, hotspot_id, "order", speaker, original_text, translation, audio_url, display_type)
VALUES
('40001000-0000-0000-0001-002700000001', '40001000-0000-0000-0000-002700000002', 1, 'customer', 'Exploring the culinary kitchen offers a great opportunity to master essential vocabulary.', 'بررسی موضوع آشپزخانه بین‌المللی فرصتی عالی برای تسلط بر واژگان ضروری به شمار می‌رود.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full'),
('40001000-0000-0000-0001-002700000002', '40001000-0000-0000-0000-002700000002', 2, 'clerk', 'Native speakers naturally use target words like balance and certain in conversation.', 'گویندگان نیتیو کلماتی چون balance (تعادل برقرار کردن) و certain (مطمئن) را به صورت طبیعی در مکالمه به کار می‌برند.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full'),
('40001000-0000-0000-0001-002700000003', '40001000-0000-0000-0000-002700000002', 3, 'customer', 'Practicing sentence by sentence with clear pronunciation builds real conversational fluency.', 'تمرین جمله‌به‌جمله با تلفظ شفاف، تسلط و روانی واقعی در گفتار ایجاد می‌کند.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full'),
('40001000-0000-0000-0001-002700000004', '40001000-0000-0000-0000-002700000002', 4, 'clerk', 'Staying calm and consistent turns difficult phrases into everyday speech habits.', 'آرامش و استمرار در تمرین، عبارات دشوار را به عادت‌های گفتاری روزمره بدل می‌سازد.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full'),
('40001000-0000-0000-0001-002700000005', '40001000-0000-0000-0000-002700000002', 5, 'customer', 'Completing this unit brings us closer to full mastery of English vocabulary.', 'تکمیل این درس ما را به تسلط کامل بر دایره واژگان انگلیسی نزدیک‌تر می‌کند.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full')
ON CONFLICT (id) DO NOTHING;

INSERT INTO podcasts (id, title, description_fa, level, kind, series_id, episode_no, audio_url, audio_status, is_active, duration_seconds, position, vocabulary, scene_id)
VALUES ('40001000-0000-0000-0000-002700000003', 'The Culinary Kitchen (Book 1 - Unit 27)', 'روایت داستانی و آموزش واژگان یونیت 27 (آشپزخانه بین‌المللی) از کتاب 1 دوره ۴۰۰۰ واژه', 'beginner', 'lesson', '40000000-0001-0000-0000-000000000001', 27, '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'ready', TRUE, 354, 27, '[{"word": "balance", "meaning_fa": "تعادل برقرار کردن"}, {"word": "certain", "meaning_fa": "مطمئن"}, {"word": "develop", "meaning_fa": "توسعه دادن"}, {"word": "effort", "meaning_fa": "تلاش و کوشش"}, {"word": "focus", "meaning_fa": "تمرکز کردن"}, {"word": "gain", "meaning_fa": "به دست آوردن"}, {"word": "helpful", "meaning_fa": "مفید و سودمند"}, {"word": "improve", "meaning_fa": "بهبود بخشیدن"}, {"word": "journey", "meaning_fa": "سفر پرماجرا"}, {"word": "knowledge", "meaning_fa": "دانش و آگاهی"}, {"word": "learn", "meaning_fa": "یاد گرفتن"}, {"word": "manage", "meaning_fa": "مدیریت کردن"}, {"word": "notice", "meaning_fa": "توجه کردن به"}, {"word": "organize", "meaning_fa": "ساماندهی کردن"}, {"word": "practice", "meaning_fa": "تمرین مداوم"}, {"word": "quality", "meaning_fa": "کیفیت عالی"}, {"word": "result", "meaning_fa": "نتیجه مثبت"}, {"word": "success", "meaning_fa": "موفقیت چشمگیر"}, {"word": "talent", "meaning_fa": "استعداد ذاتی"}, {"word": "achieve", "meaning_fa": "دست یافتن به"}]'::jsonb, '40001000-0000-0000-0000-002700000001')
ON CONFLICT (id) DO UPDATE SET scene_id = EXCLUDED.scene_id, vocabulary = EXCLUDED.vocabulary;

INSERT INTO podcast_lines (podcast_id, position, speaker, text, translation_fa, start_ms, end_ms)
VALUES
('40001000-0000-0000-0000-002700000003', 0, 'Alex', 'Welcome to 4000 Essential English Words, Book 1, Unit 27: The Culinary Kitchen.', 'به درس 27 از کتاب 1 دوره ۴۰۰۰ واژه خوش آمدید: آشپزخانه بین‌المللی.', 0, 6000),
('40001000-0000-0000-0000-002700000003', 1, 'Sarah', 'Today we focus on 20 high-frequency vocabulary words used in real-life contexts.', 'امروز بر روی 20 واژه پرکاربرد در موقعیت‌های واقعی تمرکز می‌کنیم.', 6300, 13500),
('40001000-0000-0000-0000-002700000003', 2, 'Alex', 'Listen closely to the natural rhythm and pronunciation of each target phrase.', 'به ریتم طبیعی و تلفظ دقیق هر عبارت هدف خوب گوش فرا دهید.', 13800, 21000),
('40001000-0000-0000-0000-002700000003', 3, 'Sarah', 'Now head over to the shadowing section to record these sentences in your own voice!', 'حالا به بخش شادوئینگ بروید تا این جملات را با صدای خودتان تمرین و ضبط کنید!', 21400, 29000)
ON CONFLICT DO NOTHING;

-- کتاب 1 - درس 28: The Astronomy Observatory
INSERT INTO scenes (id, title, description, background_image_url, difficulty, status, "order", category, is_custom)
VALUES ('40001000-0000-0000-0000-002800000001', 'The Astronomy Observatory (Book 1 - Unit 28)', 'تمرین شادوئینگ یونیت 28 کتاب 1 (رصدخانه نجومی): effort, focus, gain, helpful, improve, journey...', '', 'beginner', 'published', 128, 'education', false)
ON CONFLICT (id) DO NOTHING;

INSERT INTO hotspots (id, scene_id, name, x_position, y_position, order_index)
VALUES ('40001000-0000-0000-0000-002800000002', '40001000-0000-0000-0000-002800000001', 'Dialogue', 50.0, 50.0, 1)
ON CONFLICT (id) DO NOTHING;

INSERT INTO dialogues (id, hotspot_id, "order", speaker, original_text, translation, audio_url, display_type)
VALUES
('40001000-0000-0000-0001-002800000001', '40001000-0000-0000-0000-002800000002', 1, 'customer', 'Exploring the astronomy observatory offers a great opportunity to master essential vocabulary.', 'بررسی موضوع رصدخانه نجومی فرصتی عالی برای تسلط بر واژگان ضروری به شمار می‌رود.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full'),
('40001000-0000-0000-0001-002800000002', '40001000-0000-0000-0000-002800000002', 2, 'clerk', 'Native speakers naturally use target words like effort and focus in conversation.', 'گویندگان نیتیو کلماتی چون effort (تلاش و کوشش) و focus (تمرکز کردن) را به صورت طبیعی در مکالمه به کار می‌برند.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full'),
('40001000-0000-0000-0001-002800000003', '40001000-0000-0000-0000-002800000002', 3, 'customer', 'Practicing sentence by sentence with clear pronunciation builds real conversational fluency.', 'تمرین جمله‌به‌جمله با تلفظ شفاف، تسلط و روانی واقعی در گفتار ایجاد می‌کند.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full'),
('40001000-0000-0000-0001-002800000004', '40001000-0000-0000-0000-002800000002', 4, 'clerk', 'Staying calm and consistent turns difficult phrases into everyday speech habits.', 'آرامش و استمرار در تمرین، عبارات دشوار را به عادت‌های گفتاری روزمره بدل می‌سازد.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full'),
('40001000-0000-0000-0001-002800000005', '40001000-0000-0000-0000-002800000002', 5, 'customer', 'Completing this unit brings us closer to full mastery of English vocabulary.', 'تکمیل این درس ما را به تسلط کامل بر دایره واژگان انگلیسی نزدیک‌تر می‌کند.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full')
ON CONFLICT (id) DO NOTHING;

INSERT INTO podcasts (id, title, description_fa, level, kind, series_id, episode_no, audio_url, audio_status, is_active, duration_seconds, position, vocabulary, scene_id)
VALUES ('40001000-0000-0000-0000-002800000003', 'The Astronomy Observatory (Book 1 - Unit 28)', 'روایت داستانی و آموزش واژگان یونیت 28 (رصدخانه نجومی) از کتاب 1 دوره ۴۰۰۰ واژه', 'beginner', 'lesson', '40000000-0001-0000-0000-000000000001', 28, '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'ready', TRUE, 356, 28, '[{"word": "effort", "meaning_fa": "تلاش و کوشش"}, {"word": "focus", "meaning_fa": "تمرکز کردن"}, {"word": "gain", "meaning_fa": "به دست آوردن"}, {"word": "helpful", "meaning_fa": "مفید و سودمند"}, {"word": "improve", "meaning_fa": "بهبود بخشیدن"}, {"word": "journey", "meaning_fa": "سفر پرماجرا"}, {"word": "knowledge", "meaning_fa": "دانش و آگاهی"}, {"word": "learn", "meaning_fa": "یاد گرفتن"}, {"word": "manage", "meaning_fa": "مدیریت کردن"}, {"word": "notice", "meaning_fa": "توجه کردن به"}, {"word": "organize", "meaning_fa": "ساماندهی کردن"}, {"word": "practice", "meaning_fa": "تمرین مداوم"}, {"word": "quality", "meaning_fa": "کیفیت عالی"}, {"word": "result", "meaning_fa": "نتیجه مثبت"}, {"word": "success", "meaning_fa": "موفقیت چشمگیر"}, {"word": "talent", "meaning_fa": "استعداد ذاتی"}, {"word": "achieve", "meaning_fa": "دست یافتن به"}, {"word": "balance", "meaning_fa": "تعادل برقرار کردن"}, {"word": "certain", "meaning_fa": "مطمئن"}, {"word": "develop", "meaning_fa": "توسعه دادن"}]'::jsonb, '40001000-0000-0000-0000-002800000001')
ON CONFLICT (id) DO UPDATE SET scene_id = EXCLUDED.scene_id, vocabulary = EXCLUDED.vocabulary;

INSERT INTO podcast_lines (podcast_id, position, speaker, text, translation_fa, start_ms, end_ms)
VALUES
('40001000-0000-0000-0000-002800000003', 0, 'Alex', 'Welcome to 4000 Essential English Words, Book 1, Unit 28: The Astronomy Observatory.', 'به درس 28 از کتاب 1 دوره ۴۰۰۰ واژه خوش آمدید: رصدخانه نجومی.', 0, 6000),
('40001000-0000-0000-0000-002800000003', 1, 'Sarah', 'Today we focus on 20 high-frequency vocabulary words used in real-life contexts.', 'امروز بر روی 20 واژه پرکاربرد در موقعیت‌های واقعی تمرکز می‌کنیم.', 6300, 13500),
('40001000-0000-0000-0000-002800000003', 2, 'Alex', 'Listen closely to the natural rhythm and pronunciation of each target phrase.', 'به ریتم طبیعی و تلفظ دقیق هر عبارت هدف خوب گوش فرا دهید.', 13800, 21000),
('40001000-0000-0000-0000-002800000003', 3, 'Sarah', 'Now head over to the shadowing section to record these sentences in your own voice!', 'حالا به بخش شادوئینگ بروید تا این جملات را با صدای خودتان تمرین و ضبط کنید!', 21400, 29000)
ON CONFLICT DO NOTHING;

-- کتاب 1 - درس 29: The Architectural Landmark
INSERT INTO scenes (id, title, description, background_image_url, difficulty, status, "order", category, is_custom)
VALUES ('40001000-0000-0000-0000-002900000001', 'The Architectural Landmark (Book 1 - Unit 29)', 'تمرین شادوئینگ یونیت 29 کتاب 1 (شاهکار معماری): helpful, improve, journey, knowledge, learn, manage...', '', 'beginner', 'published', 129, 'education', false)
ON CONFLICT (id) DO NOTHING;

INSERT INTO hotspots (id, scene_id, name, x_position, y_position, order_index)
VALUES ('40001000-0000-0000-0000-002900000002', '40001000-0000-0000-0000-002900000001', 'Dialogue', 50.0, 50.0, 1)
ON CONFLICT (id) DO NOTHING;

INSERT INTO dialogues (id, hotspot_id, "order", speaker, original_text, translation, audio_url, display_type)
VALUES
('40001000-0000-0000-0001-002900000001', '40001000-0000-0000-0000-002900000002', 1, 'customer', 'Exploring the architectural landmark offers a great opportunity to master essential vocabulary.', 'بررسی موضوع شاهکار معماری فرصتی عالی برای تسلط بر واژگان ضروری به شمار می‌رود.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full'),
('40001000-0000-0000-0001-002900000002', '40001000-0000-0000-0000-002900000002', 2, 'clerk', 'Native speakers naturally use target words like helpful and improve in conversation.', 'گویندگان نیتیو کلماتی چون helpful (مفید و سودمند) و improve (بهبود بخشیدن) را به صورت طبیعی در مکالمه به کار می‌برند.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full'),
('40001000-0000-0000-0001-002900000003', '40001000-0000-0000-0000-002900000002', 3, 'customer', 'Practicing sentence by sentence with clear pronunciation builds real conversational fluency.', 'تمرین جمله‌به‌جمله با تلفظ شفاف، تسلط و روانی واقعی در گفتار ایجاد می‌کند.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full'),
('40001000-0000-0000-0001-002900000004', '40001000-0000-0000-0000-002900000002', 4, 'clerk', 'Staying calm and consistent turns difficult phrases into everyday speech habits.', 'آرامش و استمرار در تمرین، عبارات دشوار را به عادت‌های گفتاری روزمره بدل می‌سازد.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full'),
('40001000-0000-0000-0001-002900000005', '40001000-0000-0000-0000-002900000002', 5, 'customer', 'Completing this unit brings us closer to full mastery of English vocabulary.', 'تکمیل این درس ما را به تسلط کامل بر دایره واژگان انگلیسی نزدیک‌تر می‌کند.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full')
ON CONFLICT (id) DO NOTHING;

INSERT INTO podcasts (id, title, description_fa, level, kind, series_id, episode_no, audio_url, audio_status, is_active, duration_seconds, position, vocabulary, scene_id)
VALUES ('40001000-0000-0000-0000-002900000003', 'The Architectural Landmark (Book 1 - Unit 29)', 'روایت داستانی و آموزش واژگان یونیت 29 (شاهکار معماری) از کتاب 1 دوره ۴۰۰۰ واژه', 'beginner', 'lesson', '40000000-0001-0000-0000-000000000001', 29, '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'ready', TRUE, 358, 29, '[{"word": "helpful", "meaning_fa": "مفید و سودمند"}, {"word": "improve", "meaning_fa": "بهبود بخشیدن"}, {"word": "journey", "meaning_fa": "سفر پرماجرا"}, {"word": "knowledge", "meaning_fa": "دانش و آگاهی"}, {"word": "learn", "meaning_fa": "یاد گرفتن"}, {"word": "manage", "meaning_fa": "مدیریت کردن"}, {"word": "notice", "meaning_fa": "توجه کردن به"}, {"word": "organize", "meaning_fa": "ساماندهی کردن"}, {"word": "practice", "meaning_fa": "تمرین مداوم"}, {"word": "quality", "meaning_fa": "کیفیت عالی"}, {"word": "result", "meaning_fa": "نتیجه مثبت"}, {"word": "success", "meaning_fa": "موفقیت چشمگیر"}, {"word": "talent", "meaning_fa": "استعداد ذاتی"}, {"word": "achieve", "meaning_fa": "دست یافتن به"}, {"word": "balance", "meaning_fa": "تعادل برقرار کردن"}, {"word": "certain", "meaning_fa": "مطمئن"}, {"word": "develop", "meaning_fa": "توسعه دادن"}, {"word": "effort", "meaning_fa": "تلاش و کوشش"}, {"word": "focus", "meaning_fa": "تمرکز کردن"}, {"word": "gain", "meaning_fa": "به دست آوردن"}]'::jsonb, '40001000-0000-0000-0000-002900000001')
ON CONFLICT (id) DO UPDATE SET scene_id = EXCLUDED.scene_id, vocabulary = EXCLUDED.vocabulary;

INSERT INTO podcast_lines (podcast_id, position, speaker, text, translation_fa, start_ms, end_ms)
VALUES
('40001000-0000-0000-0000-002900000003', 0, 'Alex', 'Welcome to 4000 Essential English Words, Book 1, Unit 29: The Architectural Landmark.', 'به درس 29 از کتاب 1 دوره ۴۰۰۰ واژه خوش آمدید: شاهکار معماری.', 0, 6000),
('40001000-0000-0000-0000-002900000003', 1, 'Sarah', 'Today we focus on 20 high-frequency vocabulary words used in real-life contexts.', 'امروز بر روی 20 واژه پرکاربرد در موقعیت‌های واقعی تمرکز می‌کنیم.', 6300, 13500),
('40001000-0000-0000-0000-002900000003', 2, 'Alex', 'Listen closely to the natural rhythm and pronunciation of each target phrase.', 'به ریتم طبیعی و تلفظ دقیق هر عبارت هدف خوب گوش فرا دهید.', 13800, 21000),
('40001000-0000-0000-0000-002900000003', 3, 'Sarah', 'Now head over to the shadowing section to record these sentences in your own voice!', 'حالا به بخش شادوئینگ بروید تا این جملات را با صدای خودتان تمرین و ضبط کنید!', 21400, 29000)
ON CONFLICT DO NOTHING;

-- کتاب 1 - درس 30: The Global Summit
INSERT INTO scenes (id, title, description, background_image_url, difficulty, status, "order", category, is_custom)
VALUES ('40001000-0000-0000-0000-003000000001', 'The Global Summit (Book 1 - Unit 30)', 'تمرین شادوئینگ یونیت 30 کتاب 1 (اجلاس جهانی همکاری): knowledge, learn, manage, notice, organize, practice...', '', 'beginner', 'published', 130, 'education', false)
ON CONFLICT (id) DO NOTHING;

INSERT INTO hotspots (id, scene_id, name, x_position, y_position, order_index)
VALUES ('40001000-0000-0000-0000-003000000002', '40001000-0000-0000-0000-003000000001', 'Dialogue', 50.0, 50.0, 1)
ON CONFLICT (id) DO NOTHING;

INSERT INTO dialogues (id, hotspot_id, "order", speaker, original_text, translation, audio_url, display_type)
VALUES
('40001000-0000-0000-0001-003000000001', '40001000-0000-0000-0000-003000000002', 1, 'customer', 'Exploring the global summit offers a great opportunity to master essential vocabulary.', 'بررسی موضوع اجلاس جهانی همکاری فرصتی عالی برای تسلط بر واژگان ضروری به شمار می‌رود.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full'),
('40001000-0000-0000-0001-003000000002', '40001000-0000-0000-0000-003000000002', 2, 'clerk', 'Native speakers naturally use target words like knowledge and learn in conversation.', 'گویندگان نیتیو کلماتی چون knowledge (دانش و آگاهی) و learn (یاد گرفتن) را به صورت طبیعی در مکالمه به کار می‌برند.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full'),
('40001000-0000-0000-0001-003000000003', '40001000-0000-0000-0000-003000000002', 3, 'customer', 'Practicing sentence by sentence with clear pronunciation builds real conversational fluency.', 'تمرین جمله‌به‌جمله با تلفظ شفاف، تسلط و روانی واقعی در گفتار ایجاد می‌کند.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full'),
('40001000-0000-0000-0001-003000000004', '40001000-0000-0000-0000-003000000002', 4, 'clerk', 'Staying calm and consistent turns difficult phrases into everyday speech habits.', 'آرامش و استمرار در تمرین، عبارات دشوار را به عادت‌های گفتاری روزمره بدل می‌سازد.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full'),
('40001000-0000-0000-0001-003000000005', '40001000-0000-0000-0000-003000000002', 5, 'customer', 'Completing this unit brings us closer to full mastery of English vocabulary.', 'تکمیل این درس ما را به تسلط کامل بر دایره واژگان انگلیسی نزدیک‌تر می‌کند.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full')
ON CONFLICT (id) DO NOTHING;

INSERT INTO podcasts (id, title, description_fa, level, kind, series_id, episode_no, audio_url, audio_status, is_active, duration_seconds, position, vocabulary, scene_id)
VALUES ('40001000-0000-0000-0000-003000000003', 'The Global Summit (Book 1 - Unit 30)', 'روایت داستانی و آموزش واژگان یونیت 30 (اجلاس جهانی همکاری) از کتاب 1 دوره ۴۰۰۰ واژه', 'beginner', 'lesson', '40000000-0001-0000-0000-000000000001', 30, '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'ready', TRUE, 360, 30, '[{"word": "knowledge", "meaning_fa": "دانش و آگاهی"}, {"word": "learn", "meaning_fa": "یاد گرفتن"}, {"word": "manage", "meaning_fa": "مدیریت کردن"}, {"word": "notice", "meaning_fa": "توجه کردن به"}, {"word": "organize", "meaning_fa": "ساماندهی کردن"}, {"word": "practice", "meaning_fa": "تمرین مداوم"}, {"word": "quality", "meaning_fa": "کیفیت عالی"}, {"word": "result", "meaning_fa": "نتیجه مثبت"}, {"word": "success", "meaning_fa": "موفقیت چشمگیر"}, {"word": "talent", "meaning_fa": "استعداد ذاتی"}, {"word": "achieve", "meaning_fa": "دست یافتن به"}, {"word": "balance", "meaning_fa": "تعادل برقرار کردن"}, {"word": "certain", "meaning_fa": "مطمئن"}, {"word": "develop", "meaning_fa": "توسعه دادن"}, {"word": "effort", "meaning_fa": "تلاش و کوشش"}, {"word": "focus", "meaning_fa": "تمرکز کردن"}, {"word": "gain", "meaning_fa": "به دست آوردن"}, {"word": "helpful", "meaning_fa": "مفید و سودمند"}, {"word": "improve", "meaning_fa": "بهبود بخشیدن"}, {"word": "journey", "meaning_fa": "سفر پرماجرا"}]'::jsonb, '40001000-0000-0000-0000-003000000001')
ON CONFLICT (id) DO UPDATE SET scene_id = EXCLUDED.scene_id, vocabulary = EXCLUDED.vocabulary;

INSERT INTO podcast_lines (podcast_id, position, speaker, text, translation_fa, start_ms, end_ms)
VALUES
('40001000-0000-0000-0000-003000000003', 0, 'Alex', 'Welcome to 4000 Essential English Words, Book 1, Unit 30: The Global Summit.', 'به درس 30 از کتاب 1 دوره ۴۰۰۰ واژه خوش آمدید: اجلاس جهانی همکاری.', 0, 6000),
('40001000-0000-0000-0000-003000000003', 1, 'Sarah', 'Today we focus on 20 high-frequency vocabulary words used in real-life contexts.', 'امروز بر روی 20 واژه پرکاربرد در موقعیت‌های واقعی تمرکز می‌کنیم.', 6300, 13500),
('40001000-0000-0000-0000-003000000003', 2, 'Alex', 'Listen closely to the natural rhythm and pronunciation of each target phrase.', 'به ریتم طبیعی و تلفظ دقیق هر عبارت هدف خوب گوش فرا دهید.', 13800, 21000),
('40001000-0000-0000-0000-003000000003', 3, 'Sarah', 'Now head over to the shadowing section to record these sentences in your own voice!', 'حالا به بخش شادوئینگ بروید تا این جملات را با صدای خودتان تمرین و ضبط کنید!', 21400, 29000)
ON CONFLICT DO NOTHING;

-- +migrate Down
DELETE FROM podcast_lines WHERE podcast_id LIKE '40001000-0000-0000-0000-%';
DELETE FROM podcasts WHERE id LIKE '40001000-0000-0000-0000-%';
DELETE FROM dialogues WHERE hotspot_id LIKE '40001000-0000-0000-0000-%';
DELETE FROM hotspots WHERE id LIKE '40001000-0000-0000-0000-%';
DELETE FROM scenes WHERE id LIKE '40001000-0000-0000-0000-%';
