-- +migrate Up
-- دوره رسمی ۴۰۰۰ واژه ضروری - کتاب 4 (4000 Essential Words — Book 4)
-- سطح: advanced | ۳۰ درس کامل شامل شادوئینگ و پادکست متصل.

INSERT INTO podcast_series (id, title, description_fa, level, cover_url, category, position, is_active)
VALUES ('40000000-0004-0000-0000-000000000004', '4000 Essential Words — Book 4', '۴۰۰۰ واژه پرکاربرد (کتاب چهارم): لغات نیمه‌تخصصی، تحلیل رویدادها، استدلال و مهارت‌های شغلی', 'advanced', '', 'essential_words', 4, TRUE)
ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, description_fa = EXCLUDED.description_fa;

-- کتاب 4 - درس 1: Macroeconomic Analysis
INSERT INTO scenes (id, title, description, background_image_url, difficulty, status, "order", category, is_custom)
VALUES ('40004000-0000-0000-0000-000100000001', 'Macroeconomic Analysis (Book 4 - Unit 1)', 'تمرین شادوئینگ یونیت 1 کتاب 4 (تحلیل اقتصاد کلان و تورم): differentiate, exemplify, formulate, gauge, harmonize, innovate...', '', 'advanced', 'published', 401, 'education', false)
ON CONFLICT (id) DO NOTHING;

INSERT INTO hotspots (id, scene_id, name, x_position, y_position, order_index)
VALUES ('40004000-0000-0000-0000-000100000002', '40004000-0000-0000-0000-000100000001', 'Dialogue', 50.0, 50.0, 1)
ON CONFLICT (id) DO NOTHING;

INSERT INTO dialogues (id, hotspot_id, "order", speaker, original_text, translation, audio_url, display_type)
VALUES
('40004000-0000-0000-0001-000100000001', '40004000-0000-0000-0000-000100000002', 1, 'customer', 'Exploring macroeconomic analysis offers a great opportunity to master essential vocabulary.', 'بررسی موضوع تحلیل اقتصاد کلان و تورم فرصتی عالی برای تسلط بر واژگان ضروری به شمار می‌رود.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full'),
('40004000-0000-0000-0001-000100000002', '40004000-0000-0000-0000-000100000002', 2, 'clerk', 'Native speakers naturally use target words like differentiate and exemplify in conversation.', 'گویندگان نیتیو کلماتی چون differentiate (متمایزسازی رقابتی) و exemplify (نمونه بارز بودن) را به صورت طبیعی در مکالمه به کار می‌برند.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full'),
('40004000-0000-0000-0001-000100000003', '40004000-0000-0000-0000-000100000002', 3, 'customer', 'Practicing sentence by sentence with clear pronunciation builds real conversational fluency.', 'تمرین جمله‌به‌جمله با تلفظ شفاف، تسلط و روانی واقعی در گفتار ایجاد می‌کند.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full'),
('40004000-0000-0000-0001-000100000004', '40004000-0000-0000-0000-000100000002', 4, 'clerk', 'Staying calm and consistent turns difficult phrases into everyday speech habits.', 'آرامش و استمرار در تمرین، عبارات دشوار را به عادت‌های گفتاری روزمره بدل می‌سازد.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full'),
('40004000-0000-0000-0001-000100000005', '40004000-0000-0000-0000-000100000002', 5, 'customer', 'Completing this unit brings us closer to full mastery of English vocabulary.', 'تکمیل این درس ما را به تسلط کامل بر دایره واژگان انگلیسی نزدیک‌تر می‌کند.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full')
ON CONFLICT (id) DO NOTHING;

INSERT INTO podcasts (id, title, description_fa, level, kind, series_id, episode_no, audio_url, audio_status, is_active, duration_seconds, position, vocabulary, scene_id)
VALUES ('40004000-0000-0000-0000-000100000003', 'Macroeconomic Analysis (Book 4 - Unit 1)', 'روایت داستانی و آموزش واژگان یونیت 1 (تحلیل اقتصاد کلان و تورم) از کتاب 4 دوره ۴۰۰۰ واژه', 'advanced', 'lesson', '40000000-0004-0000-0000-000000000004', 1, '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'ready', TRUE, 302, 1, '[{"word": "differentiate", "meaning_fa": "متمایزسازی رقابتی"}, {"word": "exemplify", "meaning_fa": "نمونه بارز بودن"}, {"word": "formulate", "meaning_fa": "تدوین منسجم"}, {"word": "gauge", "meaning_fa": "سنجش و برآورد دقیق"}, {"word": "harmonize", "meaning_fa": "هماهنگ‌سازی چندبعدی"}, {"word": "innovate", "meaning_fa": "نوآوری ارزش‌آفرین"}, {"word": "leverage", "meaning_fa": "اهرم قرار دادن مزیت"}, {"word": "mitigate", "meaning_fa": "کاهش اثرات ریسک"}, {"word": "navigate", "meaning_fa": "هدایت در شرایط عدم قطعیت"}, {"word": "orchestrate", "meaning_fa": "هماهنگی دقیق فرایندها"}, {"word": "pioneer", "meaning_fa": "پیشگامی در عرصه"}, {"word": "quantify", "meaning_fa": "محاسبه کمی دقیق"}, {"word": "reconcile", "meaning_fa": "وفاق دادن دیدگاه‌ها"}, {"word": "substantiate", "meaning_fa": "مستندسازی و اثبات"}, {"word": "synthesize", "meaning_fa": "ترکیب و تلفیق نظام‌مند"}, {"word": "underpin", "meaning_fa": "تقویت شالوده فکری"}, {"word": "yield", "meaning_fa": "بازدهی و ثمردهی بالا"}, {"word": "allocate", "meaning_fa": "تخصیص بهینه منابع"}, {"word": "benchmark", "meaning_fa": "معیار سنجش مرجع"}, {"word": "catalyze", "meaning_fa": "شتاب‌بخشی تحول"}]'::jsonb, '40004000-0000-0000-0000-000100000001')
ON CONFLICT (id) DO UPDATE SET scene_id = EXCLUDED.scene_id, vocabulary = EXCLUDED.vocabulary;

INSERT INTO podcast_lines (podcast_id, position, speaker, text, translation_fa, start_ms, end_ms)
VALUES
('40004000-0000-0000-0000-000100000003', 0, 'Alex', 'Welcome to 4000 Essential English Words, Book 4, Unit 1: Macroeconomic Analysis.', 'به درس 1 از کتاب 4 دوره ۴۰۰۰ واژه خوش آمدید: تحلیل اقتصاد کلان و تورم.', 0, 6000),
('40004000-0000-0000-0000-000100000003', 1, 'Sarah', 'Today we focus on 20 high-frequency vocabulary words used in real-life contexts.', 'امروز بر روی 20 واژه پرکاربرد در موقعیت‌های واقعی تمرکز می‌کنیم.', 6300, 13500),
('40004000-0000-0000-0000-000100000003', 2, 'Alex', 'Listen closely to the natural rhythm and pronunciation of each target phrase.', 'به ریتم طبیعی و تلفظ دقیق هر عبارت هدف خوب گوش فرا دهید.', 13800, 21000),
('40004000-0000-0000-0000-000100000003', 3, 'Sarah', 'Now head over to the shadowing section to record these sentences in your own voice!', 'حالا به بخش شادوئینگ بروید تا این جملات را با صدای خودتان تمرین و ضبط کنید!', 21400, 29000)
ON CONFLICT DO NOTHING;

-- کتاب 4 - درس 2: Corporate Governance
INSERT INTO scenes (id, title, description, background_image_url, difficulty, status, "order", category, is_custom)
VALUES ('40004000-0000-0000-0000-000200000001', 'Corporate Governance (Book 4 - Unit 2)', 'تمرین شادوئینگ یونیت 2 کتاب 4 (حاکمیت شرکتی و شفافیت): gauge, harmonize, innovate, leverage, mitigate, navigate...', '', 'advanced', 'published', 402, 'education', false)
ON CONFLICT (id) DO NOTHING;

INSERT INTO hotspots (id, scene_id, name, x_position, y_position, order_index)
VALUES ('40004000-0000-0000-0000-000200000002', '40004000-0000-0000-0000-000200000001', 'Dialogue', 50.0, 50.0, 1)
ON CONFLICT (id) DO NOTHING;

INSERT INTO dialogues (id, hotspot_id, "order", speaker, original_text, translation, audio_url, display_type)
VALUES
('40004000-0000-0000-0001-000200000001', '40004000-0000-0000-0000-000200000002', 1, 'customer', 'Exploring corporate governance offers a great opportunity to master essential vocabulary.', 'بررسی موضوع حاکمیت شرکتی و شفافیت فرصتی عالی برای تسلط بر واژگان ضروری به شمار می‌رود.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full'),
('40004000-0000-0000-0001-000200000002', '40004000-0000-0000-0000-000200000002', 2, 'clerk', 'Native speakers naturally use target words like gauge and harmonize in conversation.', 'گویندگان نیتیو کلماتی چون gauge (سنجش و برآورد دقیق) و harmonize (هماهنگ‌سازی چندبعدی) را به صورت طبیعی در مکالمه به کار می‌برند.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full'),
('40004000-0000-0000-0001-000200000003', '40004000-0000-0000-0000-000200000002', 3, 'customer', 'Practicing sentence by sentence with clear pronunciation builds real conversational fluency.', 'تمرین جمله‌به‌جمله با تلفظ شفاف، تسلط و روانی واقعی در گفتار ایجاد می‌کند.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full'),
('40004000-0000-0000-0001-000200000004', '40004000-0000-0000-0000-000200000002', 4, 'clerk', 'Staying calm and consistent turns difficult phrases into everyday speech habits.', 'آرامش و استمرار در تمرین، عبارات دشوار را به عادت‌های گفتاری روزمره بدل می‌سازد.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full'),
('40004000-0000-0000-0001-000200000005', '40004000-0000-0000-0000-000200000002', 5, 'customer', 'Completing this unit brings us closer to full mastery of English vocabulary.', 'تکمیل این درس ما را به تسلط کامل بر دایره واژگان انگلیسی نزدیک‌تر می‌کند.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full')
ON CONFLICT (id) DO NOTHING;

INSERT INTO podcasts (id, title, description_fa, level, kind, series_id, episode_no, audio_url, audio_status, is_active, duration_seconds, position, vocabulary, scene_id)
VALUES ('40004000-0000-0000-0000-000200000003', 'Corporate Governance (Book 4 - Unit 2)', 'روایت داستانی و آموزش واژگان یونیت 2 (حاکمیت شرکتی و شفافیت) از کتاب 4 دوره ۴۰۰۰ واژه', 'advanced', 'lesson', '40000000-0004-0000-0000-000000000004', 2, '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'ready', TRUE, 304, 2, '[{"word": "gauge", "meaning_fa": "سنجش و برآورد دقیق"}, {"word": "harmonize", "meaning_fa": "هماهنگ‌سازی چندبعدی"}, {"word": "innovate", "meaning_fa": "نوآوری ارزش‌آفرین"}, {"word": "leverage", "meaning_fa": "اهرم قرار دادن مزیت"}, {"word": "mitigate", "meaning_fa": "کاهش اثرات ریسک"}, {"word": "navigate", "meaning_fa": "هدایت در شرایط عدم قطعیت"}, {"word": "orchestrate", "meaning_fa": "هماهنگی دقیق فرایندها"}, {"word": "pioneer", "meaning_fa": "پیشگامی در عرصه"}, {"word": "quantify", "meaning_fa": "محاسبه کمی دقیق"}, {"word": "reconcile", "meaning_fa": "وفاق دادن دیدگاه‌ها"}, {"word": "substantiate", "meaning_fa": "مستندسازی و اثبات"}, {"word": "synthesize", "meaning_fa": "ترکیب و تلفیق نظام‌مند"}, {"word": "underpin", "meaning_fa": "تقویت شالوده فکری"}, {"word": "yield", "meaning_fa": "بازدهی و ثمردهی بالا"}, {"word": "allocate", "meaning_fa": "تخصیص بهینه منابع"}, {"word": "benchmark", "meaning_fa": "معیار سنجش مرجع"}, {"word": "catalyze", "meaning_fa": "شتاب‌بخشی تحول"}, {"word": "differentiate", "meaning_fa": "متمایزسازی رقابتی"}, {"word": "exemplify", "meaning_fa": "نمونه بارز بودن"}, {"word": "formulate", "meaning_fa": "تدوین منسجم"}]'::jsonb, '40004000-0000-0000-0000-000200000001')
ON CONFLICT (id) DO UPDATE SET scene_id = EXCLUDED.scene_id, vocabulary = EXCLUDED.vocabulary;

INSERT INTO podcast_lines (podcast_id, position, speaker, text, translation_fa, start_ms, end_ms)
VALUES
('40004000-0000-0000-0000-000200000003', 0, 'Alex', 'Welcome to 4000 Essential English Words, Book 4, Unit 2: Corporate Governance.', 'به درس 2 از کتاب 4 دوره ۴۰۰۰ واژه خوش آمدید: حاکمیت شرکتی و شفافیت.', 0, 6000),
('40004000-0000-0000-0000-000200000003', 1, 'Sarah', 'Today we focus on 20 high-frequency vocabulary words used in real-life contexts.', 'امروز بر روی 20 واژه پرکاربرد در موقعیت‌های واقعی تمرکز می‌کنیم.', 6300, 13500),
('40004000-0000-0000-0000-000200000003', 2, 'Alex', 'Listen closely to the natural rhythm and pronunciation of each target phrase.', 'به ریتم طبیعی و تلفظ دقیق هر عبارت هدف خوب گوش فرا دهید.', 13800, 21000),
('40004000-0000-0000-0000-000200000003', 3, 'Sarah', 'Now head over to the shadowing section to record these sentences in your own voice!', 'حالا به بخش شادوئینگ بروید تا این جملات را با صدای خودتان تمرین و ضبط کنید!', 21400, 29000)
ON CONFLICT DO NOTHING;

-- کتاب 4 - درس 3: Geopolitical Dynamics
INSERT INTO scenes (id, title, description, background_image_url, difficulty, status, "order", category, is_custom)
VALUES ('40004000-0000-0000-0000-000300000001', 'Geopolitical Dynamics (Book 4 - Unit 3)', 'تمرین شادوئینگ یونیت 3 کتاب 4 (تحولات ژئوپلیتیک بین‌الملل): leverage, mitigate, navigate, orchestrate, pioneer, quantify...', '', 'advanced', 'published', 403, 'education', false)
ON CONFLICT (id) DO NOTHING;

INSERT INTO hotspots (id, scene_id, name, x_position, y_position, order_index)
VALUES ('40004000-0000-0000-0000-000300000002', '40004000-0000-0000-0000-000300000001', 'Dialogue', 50.0, 50.0, 1)
ON CONFLICT (id) DO NOTHING;

INSERT INTO dialogues (id, hotspot_id, "order", speaker, original_text, translation, audio_url, display_type)
VALUES
('40004000-0000-0000-0001-000300000001', '40004000-0000-0000-0000-000300000002', 1, 'customer', 'Exploring geopolitical dynamics offers a great opportunity to master essential vocabulary.', 'بررسی موضوع تحولات ژئوپلیتیک بین‌الملل فرصتی عالی برای تسلط بر واژگان ضروری به شمار می‌رود.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full'),
('40004000-0000-0000-0001-000300000002', '40004000-0000-0000-0000-000300000002', 2, 'clerk', 'Native speakers naturally use target words like leverage and mitigate in conversation.', 'گویندگان نیتیو کلماتی چون leverage (اهرم قرار دادن مزیت) و mitigate (کاهش اثرات ریسک) را به صورت طبیعی در مکالمه به کار می‌برند.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full'),
('40004000-0000-0000-0001-000300000003', '40004000-0000-0000-0000-000300000002', 3, 'customer', 'Practicing sentence by sentence with clear pronunciation builds real conversational fluency.', 'تمرین جمله‌به‌جمله با تلفظ شفاف، تسلط و روانی واقعی در گفتار ایجاد می‌کند.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full'),
('40004000-0000-0000-0001-000300000004', '40004000-0000-0000-0000-000300000002', 4, 'clerk', 'Staying calm and consistent turns difficult phrases into everyday speech habits.', 'آرامش و استمرار در تمرین، عبارات دشوار را به عادت‌های گفتاری روزمره بدل می‌سازد.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full'),
('40004000-0000-0000-0001-000300000005', '40004000-0000-0000-0000-000300000002', 5, 'customer', 'Completing this unit brings us closer to full mastery of English vocabulary.', 'تکمیل این درس ما را به تسلط کامل بر دایره واژگان انگلیسی نزدیک‌تر می‌کند.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full')
ON CONFLICT (id) DO NOTHING;

INSERT INTO podcasts (id, title, description_fa, level, kind, series_id, episode_no, audio_url, audio_status, is_active, duration_seconds, position, vocabulary, scene_id)
VALUES ('40004000-0000-0000-0000-000300000003', 'Geopolitical Dynamics (Book 4 - Unit 3)', 'روایت داستانی و آموزش واژگان یونیت 3 (تحولات ژئوپلیتیک بین‌الملل) از کتاب 4 دوره ۴۰۰۰ واژه', 'advanced', 'lesson', '40000000-0004-0000-0000-000000000004', 3, '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'ready', TRUE, 306, 3, '[{"word": "leverage", "meaning_fa": "اهرم قرار دادن مزیت"}, {"word": "mitigate", "meaning_fa": "کاهش اثرات ریسک"}, {"word": "navigate", "meaning_fa": "هدایت در شرایط عدم قطعیت"}, {"word": "orchestrate", "meaning_fa": "هماهنگی دقیق فرایندها"}, {"word": "pioneer", "meaning_fa": "پیشگامی در عرصه"}, {"word": "quantify", "meaning_fa": "محاسبه کمی دقیق"}, {"word": "reconcile", "meaning_fa": "وفاق دادن دیدگاه‌ها"}, {"word": "substantiate", "meaning_fa": "مستندسازی و اثبات"}, {"word": "synthesize", "meaning_fa": "ترکیب و تلفیق نظام‌مند"}, {"word": "underpin", "meaning_fa": "تقویت شالوده فکری"}, {"word": "yield", "meaning_fa": "بازدهی و ثمردهی بالا"}, {"word": "allocate", "meaning_fa": "تخصیص بهینه منابع"}, {"word": "benchmark", "meaning_fa": "معیار سنجش مرجع"}, {"word": "catalyze", "meaning_fa": "شتاب‌بخشی تحول"}, {"word": "differentiate", "meaning_fa": "متمایزسازی رقابتی"}, {"word": "exemplify", "meaning_fa": "نمونه بارز بودن"}, {"word": "formulate", "meaning_fa": "تدوین منسجم"}, {"word": "gauge", "meaning_fa": "سنجش و برآورد دقیق"}, {"word": "harmonize", "meaning_fa": "هماهنگ‌سازی چندبعدی"}, {"word": "innovate", "meaning_fa": "نوآوری ارزش‌آفرین"}]'::jsonb, '40004000-0000-0000-0000-000300000001')
ON CONFLICT (id) DO UPDATE SET scene_id = EXCLUDED.scene_id, vocabulary = EXCLUDED.vocabulary;

INSERT INTO podcast_lines (podcast_id, position, speaker, text, translation_fa, start_ms, end_ms)
VALUES
('40004000-0000-0000-0000-000300000003', 0, 'Alex', 'Welcome to 4000 Essential English Words, Book 4, Unit 3: Geopolitical Dynamics.', 'به درس 3 از کتاب 4 دوره ۴۰۰۰ واژه خوش آمدید: تحولات ژئوپلیتیک بین‌الملل.', 0, 6000),
('40004000-0000-0000-0000-000300000003', 1, 'Sarah', 'Today we focus on 20 high-frequency vocabulary words used in real-life contexts.', 'امروز بر روی 20 واژه پرکاربرد در موقعیت‌های واقعی تمرکز می‌کنیم.', 6300, 13500),
('40004000-0000-0000-0000-000300000003', 2, 'Alex', 'Listen closely to the natural rhythm and pronunciation of each target phrase.', 'به ریتم طبیعی و تلفظ دقیق هر عبارت هدف خوب گوش فرا دهید.', 13800, 21000),
('40004000-0000-0000-0000-000300000003', 3, 'Sarah', 'Now head over to the shadowing section to record these sentences in your own voice!', 'حالا به بخش شادوئینگ بروید تا این جملات را با صدای خودتان تمرین و ضبط کنید!', 21400, 29000)
ON CONFLICT DO NOTHING;

-- کتاب 4 - درس 4: Biotechnology Frontiers
INSERT INTO scenes (id, title, description, background_image_url, difficulty, status, "order", category, is_custom)
VALUES ('40004000-0000-0000-0000-000400000001', 'Biotechnology Frontiers (Book 4 - Unit 4)', 'تمرین شادوئینگ یونیت 4 کتاب 4 (مرزهای زیست‌فناوری نوین): orchestrate, pioneer, quantify, reconcile, substantiate, synthesize...', '', 'advanced', 'published', 404, 'education', false)
ON CONFLICT (id) DO NOTHING;

INSERT INTO hotspots (id, scene_id, name, x_position, y_position, order_index)
VALUES ('40004000-0000-0000-0000-000400000002', '40004000-0000-0000-0000-000400000001', 'Dialogue', 50.0, 50.0, 1)
ON CONFLICT (id) DO NOTHING;

INSERT INTO dialogues (id, hotspot_id, "order", speaker, original_text, translation, audio_url, display_type)
VALUES
('40004000-0000-0000-0001-000400000001', '40004000-0000-0000-0000-000400000002', 1, 'customer', 'Exploring biotechnology frontiers offers a great opportunity to master essential vocabulary.', 'بررسی موضوع مرزهای زیست‌فناوری نوین فرصتی عالی برای تسلط بر واژگان ضروری به شمار می‌رود.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full'),
('40004000-0000-0000-0001-000400000002', '40004000-0000-0000-0000-000400000002', 2, 'clerk', 'Native speakers naturally use target words like orchestrate and pioneer in conversation.', 'گویندگان نیتیو کلماتی چون orchestrate (هماهنگی دقیق فرایندها) و pioneer (پیشگامی در عرصه) را به صورت طبیعی در مکالمه به کار می‌برند.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full'),
('40004000-0000-0000-0001-000400000003', '40004000-0000-0000-0000-000400000002', 3, 'customer', 'Practicing sentence by sentence with clear pronunciation builds real conversational fluency.', 'تمرین جمله‌به‌جمله با تلفظ شفاف، تسلط و روانی واقعی در گفتار ایجاد می‌کند.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full'),
('40004000-0000-0000-0001-000400000004', '40004000-0000-0000-0000-000400000002', 4, 'clerk', 'Staying calm and consistent turns difficult phrases into everyday speech habits.', 'آرامش و استمرار در تمرین، عبارات دشوار را به عادت‌های گفتاری روزمره بدل می‌سازد.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full'),
('40004000-0000-0000-0001-000400000005', '40004000-0000-0000-0000-000400000002', 5, 'customer', 'Completing this unit brings us closer to full mastery of English vocabulary.', 'تکمیل این درس ما را به تسلط کامل بر دایره واژگان انگلیسی نزدیک‌تر می‌کند.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full')
ON CONFLICT (id) DO NOTHING;

INSERT INTO podcasts (id, title, description_fa, level, kind, series_id, episode_no, audio_url, audio_status, is_active, duration_seconds, position, vocabulary, scene_id)
VALUES ('40004000-0000-0000-0000-000400000003', 'Biotechnology Frontiers (Book 4 - Unit 4)', 'روایت داستانی و آموزش واژگان یونیت 4 (مرزهای زیست‌فناوری نوین) از کتاب 4 دوره ۴۰۰۰ واژه', 'advanced', 'lesson', '40000000-0004-0000-0000-000000000004', 4, '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'ready', TRUE, 308, 4, '[{"word": "orchestrate", "meaning_fa": "هماهنگی دقیق فرایندها"}, {"word": "pioneer", "meaning_fa": "پیشگامی در عرصه"}, {"word": "quantify", "meaning_fa": "محاسبه کمی دقیق"}, {"word": "reconcile", "meaning_fa": "وفاق دادن دیدگاه‌ها"}, {"word": "substantiate", "meaning_fa": "مستندسازی و اثبات"}, {"word": "synthesize", "meaning_fa": "ترکیب و تلفیق نظام‌مند"}, {"word": "underpin", "meaning_fa": "تقویت شالوده فکری"}, {"word": "yield", "meaning_fa": "بازدهی و ثمردهی بالا"}, {"word": "allocate", "meaning_fa": "تخصیص بهینه منابع"}, {"word": "benchmark", "meaning_fa": "معیار سنجش مرجع"}, {"word": "catalyze", "meaning_fa": "شتاب‌بخشی تحول"}, {"word": "differentiate", "meaning_fa": "متمایزسازی رقابتی"}, {"word": "exemplify", "meaning_fa": "نمونه بارز بودن"}, {"word": "formulate", "meaning_fa": "تدوین منسجم"}, {"word": "gauge", "meaning_fa": "سنجش و برآورد دقیق"}, {"word": "harmonize", "meaning_fa": "هماهنگ‌سازی چندبعدی"}, {"word": "innovate", "meaning_fa": "نوآوری ارزش‌آفرین"}, {"word": "leverage", "meaning_fa": "اهرم قرار دادن مزیت"}, {"word": "mitigate", "meaning_fa": "کاهش اثرات ریسک"}, {"word": "navigate", "meaning_fa": "هدایت در شرایط عدم قطعیت"}]'::jsonb, '40004000-0000-0000-0000-000400000001')
ON CONFLICT (id) DO UPDATE SET scene_id = EXCLUDED.scene_id, vocabulary = EXCLUDED.vocabulary;

INSERT INTO podcast_lines (podcast_id, position, speaker, text, translation_fa, start_ms, end_ms)
VALUES
('40004000-0000-0000-0000-000400000003', 0, 'Alex', 'Welcome to 4000 Essential English Words, Book 4, Unit 4: Biotechnology Frontiers.', 'به درس 4 از کتاب 4 دوره ۴۰۰۰ واژه خوش آمدید: مرزهای زیست‌فناوری نوین.', 0, 6000),
('40004000-0000-0000-0000-000400000003', 1, 'Sarah', 'Today we focus on 20 high-frequency vocabulary words used in real-life contexts.', 'امروز بر روی 20 واژه پرکاربرد در موقعیت‌های واقعی تمرکز می‌کنیم.', 6300, 13500),
('40004000-0000-0000-0000-000400000003', 2, 'Alex', 'Listen closely to the natural rhythm and pronunciation of each target phrase.', 'به ریتم طبیعی و تلفظ دقیق هر عبارت هدف خوب گوش فرا دهید.', 13800, 21000),
('40004000-0000-0000-0000-000400000003', 3, 'Sarah', 'Now head over to the shadowing section to record these sentences in your own voice!', 'حالا به بخش شادوئینگ بروید تا این جملات را با صدای خودتان تمرین و ضبط کنید!', 21400, 29000)
ON CONFLICT DO NOTHING;

-- کتاب 4 - درس 5: Ethical Data Governance
INSERT INTO scenes (id, title, description, background_image_url, difficulty, status, "order", category, is_custom)
VALUES ('40004000-0000-0000-0000-000500000001', 'Ethical Data Governance (Book 4 - Unit 5)', 'تمرین شادوئینگ یونیت 5 کتاب 4 (حکمرانی اخلاقی داده‌ها): reconcile, substantiate, synthesize, underpin, yield, allocate...', '', 'advanced', 'published', 405, 'education', false)
ON CONFLICT (id) DO NOTHING;

INSERT INTO hotspots (id, scene_id, name, x_position, y_position, order_index)
VALUES ('40004000-0000-0000-0000-000500000002', '40004000-0000-0000-0000-000500000001', 'Dialogue', 50.0, 50.0, 1)
ON CONFLICT (id) DO NOTHING;

INSERT INTO dialogues (id, hotspot_id, "order", speaker, original_text, translation, audio_url, display_type)
VALUES
('40004000-0000-0000-0001-000500000001', '40004000-0000-0000-0000-000500000002', 1, 'customer', 'Exploring ethical data governance offers a great opportunity to master essential vocabulary.', 'بررسی موضوع حکمرانی اخلاقی داده‌ها فرصتی عالی برای تسلط بر واژگان ضروری به شمار می‌رود.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full'),
('40004000-0000-0000-0001-000500000002', '40004000-0000-0000-0000-000500000002', 2, 'clerk', 'Native speakers naturally use target words like reconcile and substantiate in conversation.', 'گویندگان نیتیو کلماتی چون reconcile (وفاق دادن دیدگاه‌ها) و substantiate (مستندسازی و اثبات) را به صورت طبیعی در مکالمه به کار می‌برند.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full'),
('40004000-0000-0000-0001-000500000003', '40004000-0000-0000-0000-000500000002', 3, 'customer', 'Practicing sentence by sentence with clear pronunciation builds real conversational fluency.', 'تمرین جمله‌به‌جمله با تلفظ شفاف، تسلط و روانی واقعی در گفتار ایجاد می‌کند.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full'),
('40004000-0000-0000-0001-000500000004', '40004000-0000-0000-0000-000500000002', 4, 'clerk', 'Staying calm and consistent turns difficult phrases into everyday speech habits.', 'آرامش و استمرار در تمرین، عبارات دشوار را به عادت‌های گفتاری روزمره بدل می‌سازد.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full'),
('40004000-0000-0000-0001-000500000005', '40004000-0000-0000-0000-000500000002', 5, 'customer', 'Completing this unit brings us closer to full mastery of English vocabulary.', 'تکمیل این درس ما را به تسلط کامل بر دایره واژگان انگلیسی نزدیک‌تر می‌کند.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full')
ON CONFLICT (id) DO NOTHING;

INSERT INTO podcasts (id, title, description_fa, level, kind, series_id, episode_no, audio_url, audio_status, is_active, duration_seconds, position, vocabulary, scene_id)
VALUES ('40004000-0000-0000-0000-000500000003', 'Ethical Data Governance (Book 4 - Unit 5)', 'روایت داستانی و آموزش واژگان یونیت 5 (حکمرانی اخلاقی داده‌ها) از کتاب 4 دوره ۴۰۰۰ واژه', 'advanced', 'lesson', '40000000-0004-0000-0000-000000000004', 5, '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'ready', TRUE, 310, 5, '[{"word": "reconcile", "meaning_fa": "وفاق دادن دیدگاه‌ها"}, {"word": "substantiate", "meaning_fa": "مستندسازی و اثبات"}, {"word": "synthesize", "meaning_fa": "ترکیب و تلفیق نظام‌مند"}, {"word": "underpin", "meaning_fa": "تقویت شالوده فکری"}, {"word": "yield", "meaning_fa": "بازدهی و ثمردهی بالا"}, {"word": "allocate", "meaning_fa": "تخصیص بهینه منابع"}, {"word": "benchmark", "meaning_fa": "معیار سنجش مرجع"}, {"word": "catalyze", "meaning_fa": "شتاب‌بخشی تحول"}, {"word": "differentiate", "meaning_fa": "متمایزسازی رقابتی"}, {"word": "exemplify", "meaning_fa": "نمونه بارز بودن"}, {"word": "formulate", "meaning_fa": "تدوین منسجم"}, {"word": "gauge", "meaning_fa": "سنجش و برآورد دقیق"}, {"word": "harmonize", "meaning_fa": "هماهنگ‌سازی چندبعدی"}, {"word": "innovate", "meaning_fa": "نوآوری ارزش‌آفرین"}, {"word": "leverage", "meaning_fa": "اهرم قرار دادن مزیت"}, {"word": "mitigate", "meaning_fa": "کاهش اثرات ریسک"}, {"word": "navigate", "meaning_fa": "هدایت در شرایط عدم قطعیت"}, {"word": "orchestrate", "meaning_fa": "هماهنگی دقیق فرایندها"}, {"word": "pioneer", "meaning_fa": "پیشگامی در عرصه"}, {"word": "quantify", "meaning_fa": "محاسبه کمی دقیق"}]'::jsonb, '40004000-0000-0000-0000-000500000001')
ON CONFLICT (id) DO UPDATE SET scene_id = EXCLUDED.scene_id, vocabulary = EXCLUDED.vocabulary;

INSERT INTO podcast_lines (podcast_id, position, speaker, text, translation_fa, start_ms, end_ms)
VALUES
('40004000-0000-0000-0000-000500000003', 0, 'Alex', 'Welcome to 4000 Essential English Words, Book 4, Unit 5: Ethical Data Governance.', 'به درس 5 از کتاب 4 دوره ۴۰۰۰ واژه خوش آمدید: حکمرانی اخلاقی داده‌ها.', 0, 6000),
('40004000-0000-0000-0000-000500000003', 1, 'Sarah', 'Today we focus on 20 high-frequency vocabulary words used in real-life contexts.', 'امروز بر روی 20 واژه پرکاربرد در موقعیت‌های واقعی تمرکز می‌کنیم.', 6300, 13500),
('40004000-0000-0000-0000-000500000003', 2, 'Alex', 'Listen closely to the natural rhythm and pronunciation of each target phrase.', 'به ریتم طبیعی و تلفظ دقیق هر عبارت هدف خوب گوش فرا دهید.', 13800, 21000),
('40004000-0000-0000-0000-000500000003', 3, 'Sarah', 'Now head over to the shadowing section to record these sentences in your own voice!', 'حالا به بخش شادوئینگ بروید تا این جملات را با صدای خودتان تمرین و ضبط کنید!', 21400, 29000)
ON CONFLICT DO NOTHING;

-- کتاب 4 - درس 6: Philosophical Argumentation
INSERT INTO scenes (id, title, description, background_image_url, difficulty, status, "order", category, is_custom)
VALUES ('40004000-0000-0000-0000-000600000001', 'Philosophical Argumentation (Book 4 - Unit 6)', 'تمرین شادوئینگ یونیت 6 کتاب 4 (استدلال فلسفی و منطق): underpin, yield, allocate, benchmark, catalyze, differentiate...', '', 'advanced', 'published', 406, 'education', false)
ON CONFLICT (id) DO NOTHING;

INSERT INTO hotspots (id, scene_id, name, x_position, y_position, order_index)
VALUES ('40004000-0000-0000-0000-000600000002', '40004000-0000-0000-0000-000600000001', 'Dialogue', 50.0, 50.0, 1)
ON CONFLICT (id) DO NOTHING;

INSERT INTO dialogues (id, hotspot_id, "order", speaker, original_text, translation, audio_url, display_type)
VALUES
('40004000-0000-0000-0001-000600000001', '40004000-0000-0000-0000-000600000002', 1, 'customer', 'Exploring philosophical argumentation offers a great opportunity to master essential vocabulary.', 'بررسی موضوع استدلال فلسفی و منطق فرصتی عالی برای تسلط بر واژگان ضروری به شمار می‌رود.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full'),
('40004000-0000-0000-0001-000600000002', '40004000-0000-0000-0000-000600000002', 2, 'clerk', 'Native speakers naturally use target words like underpin and yield in conversation.', 'گویندگان نیتیو کلماتی چون underpin (تقویت شالوده فکری) و yield (بازدهی و ثمردهی بالا) را به صورت طبیعی در مکالمه به کار می‌برند.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full'),
('40004000-0000-0000-0001-000600000003', '40004000-0000-0000-0000-000600000002', 3, 'customer', 'Practicing sentence by sentence with clear pronunciation builds real conversational fluency.', 'تمرین جمله‌به‌جمله با تلفظ شفاف، تسلط و روانی واقعی در گفتار ایجاد می‌کند.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full'),
('40004000-0000-0000-0001-000600000004', '40004000-0000-0000-0000-000600000002', 4, 'clerk', 'Staying calm and consistent turns difficult phrases into everyday speech habits.', 'آرامش و استمرار در تمرین، عبارات دشوار را به عادت‌های گفتاری روزمره بدل می‌سازد.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full'),
('40004000-0000-0000-0001-000600000005', '40004000-0000-0000-0000-000600000002', 5, 'customer', 'Completing this unit brings us closer to full mastery of English vocabulary.', 'تکمیل این درس ما را به تسلط کامل بر دایره واژگان انگلیسی نزدیک‌تر می‌کند.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full')
ON CONFLICT (id) DO NOTHING;

INSERT INTO podcasts (id, title, description_fa, level, kind, series_id, episode_no, audio_url, audio_status, is_active, duration_seconds, position, vocabulary, scene_id)
VALUES ('40004000-0000-0000-0000-000600000003', 'Philosophical Argumentation (Book 4 - Unit 6)', 'روایت داستانی و آموزش واژگان یونیت 6 (استدلال فلسفی و منطق) از کتاب 4 دوره ۴۰۰۰ واژه', 'advanced', 'lesson', '40000000-0004-0000-0000-000000000004', 6, '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'ready', TRUE, 312, 6, '[{"word": "underpin", "meaning_fa": "تقویت شالوده فکری"}, {"word": "yield", "meaning_fa": "بازدهی و ثمردهی بالا"}, {"word": "allocate", "meaning_fa": "تخصیص بهینه منابع"}, {"word": "benchmark", "meaning_fa": "معیار سنجش مرجع"}, {"word": "catalyze", "meaning_fa": "شتاب‌بخشی تحول"}, {"word": "differentiate", "meaning_fa": "متمایزسازی رقابتی"}, {"word": "exemplify", "meaning_fa": "نمونه بارز بودن"}, {"word": "formulate", "meaning_fa": "تدوین منسجم"}, {"word": "gauge", "meaning_fa": "سنجش و برآورد دقیق"}, {"word": "harmonize", "meaning_fa": "هماهنگ‌سازی چندبعدی"}, {"word": "innovate", "meaning_fa": "نوآوری ارزش‌آفرین"}, {"word": "leverage", "meaning_fa": "اهرم قرار دادن مزیت"}, {"word": "mitigate", "meaning_fa": "کاهش اثرات ریسک"}, {"word": "navigate", "meaning_fa": "هدایت در شرایط عدم قطعیت"}, {"word": "orchestrate", "meaning_fa": "هماهنگی دقیق فرایندها"}, {"word": "pioneer", "meaning_fa": "پیشگامی در عرصه"}, {"word": "quantify", "meaning_fa": "محاسبه کمی دقیق"}, {"word": "reconcile", "meaning_fa": "وفاق دادن دیدگاه‌ها"}, {"word": "substantiate", "meaning_fa": "مستندسازی و اثبات"}, {"word": "synthesize", "meaning_fa": "ترکیب و تلفیق نظام‌مند"}]'::jsonb, '40004000-0000-0000-0000-000600000001')
ON CONFLICT (id) DO UPDATE SET scene_id = EXCLUDED.scene_id, vocabulary = EXCLUDED.vocabulary;

INSERT INTO podcast_lines (podcast_id, position, speaker, text, translation_fa, start_ms, end_ms)
VALUES
('40004000-0000-0000-0000-000600000003', 0, 'Alex', 'Welcome to 4000 Essential English Words, Book 4, Unit 6: Philosophical Argumentation.', 'به درس 6 از کتاب 4 دوره ۴۰۰۰ واژه خوش آمدید: استدلال فلسفی و منطق.', 0, 6000),
('40004000-0000-0000-0000-000600000003', 1, 'Sarah', 'Today we focus on 20 high-frequency vocabulary words used in real-life contexts.', 'امروز بر روی 20 واژه پرکاربرد در موقعیت‌های واقعی تمرکز می‌کنیم.', 6300, 13500),
('40004000-0000-0000-0000-000600000003', 2, 'Alex', 'Listen closely to the natural rhythm and pronunciation of each target phrase.', 'به ریتم طبیعی و تلفظ دقیق هر عبارت هدف خوب گوش فرا دهید.', 13800, 21000),
('40004000-0000-0000-0000-000600000003', 3, 'Sarah', 'Now head over to the shadowing section to record these sentences in your own voice!', 'حالا به بخش شادوئینگ بروید تا این جملات را با صدای خودتان تمرین و ضبط کنید!', 21400, 29000)
ON CONFLICT DO NOTHING;

-- کتاب 4 - درس 7: Climate Resilience Strategies
INSERT INTO scenes (id, title, description, background_image_url, difficulty, status, "order", category, is_custom)
VALUES ('40004000-0000-0000-0000-000700000001', 'Climate Resilience Strategies (Book 4 - Unit 7)', 'تمرین شادوئینگ یونیت 7 کتاب 4 (راهبردهای تاب‌آوری اقلیمی): benchmark, catalyze, differentiate, exemplify, formulate, gauge...', '', 'advanced', 'published', 407, 'education', false)
ON CONFLICT (id) DO NOTHING;

INSERT INTO hotspots (id, scene_id, name, x_position, y_position, order_index)
VALUES ('40004000-0000-0000-0000-000700000002', '40004000-0000-0000-0000-000700000001', 'Dialogue', 50.0, 50.0, 1)
ON CONFLICT (id) DO NOTHING;

INSERT INTO dialogues (id, hotspot_id, "order", speaker, original_text, translation, audio_url, display_type)
VALUES
('40004000-0000-0000-0001-000700000001', '40004000-0000-0000-0000-000700000002', 1, 'customer', 'Exploring climate resilience strategies offers a great opportunity to master essential vocabulary.', 'بررسی موضوع راهبردهای تاب‌آوری اقلیمی فرصتی عالی برای تسلط بر واژگان ضروری به شمار می‌رود.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full'),
('40004000-0000-0000-0001-000700000002', '40004000-0000-0000-0000-000700000002', 2, 'clerk', 'Native speakers naturally use target words like benchmark and catalyze in conversation.', 'گویندگان نیتیو کلماتی چون benchmark (معیار سنجش مرجع) و catalyze (شتاب‌بخشی تحول) را به صورت طبیعی در مکالمه به کار می‌برند.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full'),
('40004000-0000-0000-0001-000700000003', '40004000-0000-0000-0000-000700000002', 3, 'customer', 'Practicing sentence by sentence with clear pronunciation builds real conversational fluency.', 'تمرین جمله‌به‌جمله با تلفظ شفاف، تسلط و روانی واقعی در گفتار ایجاد می‌کند.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full'),
('40004000-0000-0000-0001-000700000004', '40004000-0000-0000-0000-000700000002', 4, 'clerk', 'Staying calm and consistent turns difficult phrases into everyday speech habits.', 'آرامش و استمرار در تمرین، عبارات دشوار را به عادت‌های گفتاری روزمره بدل می‌سازد.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full'),
('40004000-0000-0000-0001-000700000005', '40004000-0000-0000-0000-000700000002', 5, 'customer', 'Completing this unit brings us closer to full mastery of English vocabulary.', 'تکمیل این درس ما را به تسلط کامل بر دایره واژگان انگلیسی نزدیک‌تر می‌کند.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full')
ON CONFLICT (id) DO NOTHING;

INSERT INTO podcasts (id, title, description_fa, level, kind, series_id, episode_no, audio_url, audio_status, is_active, duration_seconds, position, vocabulary, scene_id)
VALUES ('40004000-0000-0000-0000-000700000003', 'Climate Resilience Strategies (Book 4 - Unit 7)', 'روایت داستانی و آموزش واژگان یونیت 7 (راهبردهای تاب‌آوری اقلیمی) از کتاب 4 دوره ۴۰۰۰ واژه', 'advanced', 'lesson', '40000000-0004-0000-0000-000000000004', 7, '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'ready', TRUE, 314, 7, '[{"word": "benchmark", "meaning_fa": "معیار سنجش مرجع"}, {"word": "catalyze", "meaning_fa": "شتاب‌بخشی تحول"}, {"word": "differentiate", "meaning_fa": "متمایزسازی رقابتی"}, {"word": "exemplify", "meaning_fa": "نمونه بارز بودن"}, {"word": "formulate", "meaning_fa": "تدوین منسجم"}, {"word": "gauge", "meaning_fa": "سنجش و برآورد دقیق"}, {"word": "harmonize", "meaning_fa": "هماهنگ‌سازی چندبعدی"}, {"word": "innovate", "meaning_fa": "نوآوری ارزش‌آفرین"}, {"word": "leverage", "meaning_fa": "اهرم قرار دادن مزیت"}, {"word": "mitigate", "meaning_fa": "کاهش اثرات ریسک"}, {"word": "navigate", "meaning_fa": "هدایت در شرایط عدم قطعیت"}, {"word": "orchestrate", "meaning_fa": "هماهنگی دقیق فرایندها"}, {"word": "pioneer", "meaning_fa": "پیشگامی در عرصه"}, {"word": "quantify", "meaning_fa": "محاسبه کمی دقیق"}, {"word": "reconcile", "meaning_fa": "وفاق دادن دیدگاه‌ها"}, {"word": "substantiate", "meaning_fa": "مستندسازی و اثبات"}, {"word": "synthesize", "meaning_fa": "ترکیب و تلفیق نظام‌مند"}, {"word": "underpin", "meaning_fa": "تقویت شالوده فکری"}, {"word": "yield", "meaning_fa": "بازدهی و ثمردهی بالا"}, {"word": "allocate", "meaning_fa": "تخصیص بهینه منابع"}]'::jsonb, '40004000-0000-0000-0000-000700000001')
ON CONFLICT (id) DO UPDATE SET scene_id = EXCLUDED.scene_id, vocabulary = EXCLUDED.vocabulary;

INSERT INTO podcast_lines (podcast_id, position, speaker, text, translation_fa, start_ms, end_ms)
VALUES
('40004000-0000-0000-0000-000700000003', 0, 'Alex', 'Welcome to 4000 Essential English Words, Book 4, Unit 7: Climate Resilience Strategies.', 'به درس 7 از کتاب 4 دوره ۴۰۰۰ واژه خوش آمدید: راهبردهای تاب‌آوری اقلیمی.', 0, 6000),
('40004000-0000-0000-0000-000700000003', 1, 'Sarah', 'Today we focus on 20 high-frequency vocabulary words used in real-life contexts.', 'امروز بر روی 20 واژه پرکاربرد در موقعیت‌های واقعی تمرکز می‌کنیم.', 6300, 13500),
('40004000-0000-0000-0000-000700000003', 2, 'Alex', 'Listen closely to the natural rhythm and pronunciation of each target phrase.', 'به ریتم طبیعی و تلفظ دقیق هر عبارت هدف خوب گوش فرا دهید.', 13800, 21000),
('40004000-0000-0000-0000-000700000003', 3, 'Sarah', 'Now head over to the shadowing section to record these sentences in your own voice!', 'حالا به بخش شادوئینگ بروید تا این جملات را با صدای خودتان تمرین و ضبط کنید!', 21400, 29000)
ON CONFLICT DO NOTHING;

-- کتاب 4 - درس 8: Behavioral Neurobiology
INSERT INTO scenes (id, title, description, background_image_url, difficulty, status, "order", category, is_custom)
VALUES ('40004000-0000-0000-0000-000800000001', 'Behavioral Neurobiology (Book 4 - Unit 8)', 'تمرین شادوئینگ یونیت 8 کتاب 4 (زیست‌شناسی رفتار و مغز): exemplify, formulate, gauge, harmonize, innovate, leverage...', '', 'advanced', 'published', 408, 'education', false)
ON CONFLICT (id) DO NOTHING;

INSERT INTO hotspots (id, scene_id, name, x_position, y_position, order_index)
VALUES ('40004000-0000-0000-0000-000800000002', '40004000-0000-0000-0000-000800000001', 'Dialogue', 50.0, 50.0, 1)
ON CONFLICT (id) DO NOTHING;

INSERT INTO dialogues (id, hotspot_id, "order", speaker, original_text, translation, audio_url, display_type)
VALUES
('40004000-0000-0000-0001-000800000001', '40004000-0000-0000-0000-000800000002', 1, 'customer', 'Exploring behavioral neurobiology offers a great opportunity to master essential vocabulary.', 'بررسی موضوع زیست‌شناسی رفتار و مغز فرصتی عالی برای تسلط بر واژگان ضروری به شمار می‌رود.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full'),
('40004000-0000-0000-0001-000800000002', '40004000-0000-0000-0000-000800000002', 2, 'clerk', 'Native speakers naturally use target words like exemplify and formulate in conversation.', 'گویندگان نیتیو کلماتی چون exemplify (نمونه بارز بودن) و formulate (تدوین منسجم) را به صورت طبیعی در مکالمه به کار می‌برند.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full'),
('40004000-0000-0000-0001-000800000003', '40004000-0000-0000-0000-000800000002', 3, 'customer', 'Practicing sentence by sentence with clear pronunciation builds real conversational fluency.', 'تمرین جمله‌به‌جمله با تلفظ شفاف، تسلط و روانی واقعی در گفتار ایجاد می‌کند.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full'),
('40004000-0000-0000-0001-000800000004', '40004000-0000-0000-0000-000800000002', 4, 'clerk', 'Staying calm and consistent turns difficult phrases into everyday speech habits.', 'آرامش و استمرار در تمرین، عبارات دشوار را به عادت‌های گفتاری روزمره بدل می‌سازد.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full'),
('40004000-0000-0000-0001-000800000005', '40004000-0000-0000-0000-000800000002', 5, 'customer', 'Completing this unit brings us closer to full mastery of English vocabulary.', 'تکمیل این درس ما را به تسلط کامل بر دایره واژگان انگلیسی نزدیک‌تر می‌کند.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full')
ON CONFLICT (id) DO NOTHING;

INSERT INTO podcasts (id, title, description_fa, level, kind, series_id, episode_no, audio_url, audio_status, is_active, duration_seconds, position, vocabulary, scene_id)
VALUES ('40004000-0000-0000-0000-000800000003', 'Behavioral Neurobiology (Book 4 - Unit 8)', 'روایت داستانی و آموزش واژگان یونیت 8 (زیست‌شناسی رفتار و مغز) از کتاب 4 دوره ۴۰۰۰ واژه', 'advanced', 'lesson', '40000000-0004-0000-0000-000000000004', 8, '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'ready', TRUE, 316, 8, '[{"word": "exemplify", "meaning_fa": "نمونه بارز بودن"}, {"word": "formulate", "meaning_fa": "تدوین منسجم"}, {"word": "gauge", "meaning_fa": "سنجش و برآورد دقیق"}, {"word": "harmonize", "meaning_fa": "هماهنگ‌سازی چندبعدی"}, {"word": "innovate", "meaning_fa": "نوآوری ارزش‌آفرین"}, {"word": "leverage", "meaning_fa": "اهرم قرار دادن مزیت"}, {"word": "mitigate", "meaning_fa": "کاهش اثرات ریسک"}, {"word": "navigate", "meaning_fa": "هدایت در شرایط عدم قطعیت"}, {"word": "orchestrate", "meaning_fa": "هماهنگی دقیق فرایندها"}, {"word": "pioneer", "meaning_fa": "پیشگامی در عرصه"}, {"word": "quantify", "meaning_fa": "محاسبه کمی دقیق"}, {"word": "reconcile", "meaning_fa": "وفاق دادن دیدگاه‌ها"}, {"word": "substantiate", "meaning_fa": "مستندسازی و اثبات"}, {"word": "synthesize", "meaning_fa": "ترکیب و تلفیق نظام‌مند"}, {"word": "underpin", "meaning_fa": "تقویت شالوده فکری"}, {"word": "yield", "meaning_fa": "بازدهی و ثمردهی بالا"}, {"word": "allocate", "meaning_fa": "تخصیص بهینه منابع"}, {"word": "benchmark", "meaning_fa": "معیار سنجش مرجع"}, {"word": "catalyze", "meaning_fa": "شتاب‌بخشی تحول"}, {"word": "differentiate", "meaning_fa": "متمایزسازی رقابتی"}]'::jsonb, '40004000-0000-0000-0000-000800000001')
ON CONFLICT (id) DO UPDATE SET scene_id = EXCLUDED.scene_id, vocabulary = EXCLUDED.vocabulary;

INSERT INTO podcast_lines (podcast_id, position, speaker, text, translation_fa, start_ms, end_ms)
VALUES
('40004000-0000-0000-0000-000800000003', 0, 'Alex', 'Welcome to 4000 Essential English Words, Book 4, Unit 8: Behavioral Neurobiology.', 'به درس 8 از کتاب 4 دوره ۴۰۰۰ واژه خوش آمدید: زیست‌شناسی رفتار و مغز.', 0, 6000),
('40004000-0000-0000-0000-000800000003', 1, 'Sarah', 'Today we focus on 20 high-frequency vocabulary words used in real-life contexts.', 'امروز بر روی 20 واژه پرکاربرد در موقعیت‌های واقعی تمرکز می‌کنیم.', 6300, 13500),
('40004000-0000-0000-0000-000800000003', 2, 'Alex', 'Listen closely to the natural rhythm and pronunciation of each target phrase.', 'به ریتم طبیعی و تلفظ دقیق هر عبارت هدف خوب گوش فرا دهید.', 13800, 21000),
('40004000-0000-0000-0000-000800000003', 3, 'Sarah', 'Now head over to the shadowing section to record these sentences in your own voice!', 'حالا به بخش شادوئینگ بروید تا این جملات را با صدای خودتان تمرین و ضبط کنید!', 21400, 29000)
ON CONFLICT DO NOTHING;

-- کتاب 4 - درس 9: Autonomous Driving Systems
INSERT INTO scenes (id, title, description, background_image_url, difficulty, status, "order", category, is_custom)
VALUES ('40004000-0000-0000-0000-000900000001', 'Autonomous Driving Systems (Book 4 - Unit 9)', 'تمرین شادوئینگ یونیت 9 کتاب 4 (سامانه‌های خودران هوشمند): harmonize, innovate, leverage, mitigate, navigate, orchestrate...', '', 'advanced', 'published', 409, 'education', false)
ON CONFLICT (id) DO NOTHING;

INSERT INTO hotspots (id, scene_id, name, x_position, y_position, order_index)
VALUES ('40004000-0000-0000-0000-000900000002', '40004000-0000-0000-0000-000900000001', 'Dialogue', 50.0, 50.0, 1)
ON CONFLICT (id) DO NOTHING;

INSERT INTO dialogues (id, hotspot_id, "order", speaker, original_text, translation, audio_url, display_type)
VALUES
('40004000-0000-0000-0001-000900000001', '40004000-0000-0000-0000-000900000002', 1, 'customer', 'Exploring autonomous driving systems offers a great opportunity to master essential vocabulary.', 'بررسی موضوع سامانه‌های خودران هوشمند فرصتی عالی برای تسلط بر واژگان ضروری به شمار می‌رود.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full'),
('40004000-0000-0000-0001-000900000002', '40004000-0000-0000-0000-000900000002', 2, 'clerk', 'Native speakers naturally use target words like harmonize and innovate in conversation.', 'گویندگان نیتیو کلماتی چون harmonize (هماهنگ‌سازی چندبعدی) و innovate (نوآوری ارزش‌آفرین) را به صورت طبیعی در مکالمه به کار می‌برند.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full'),
('40004000-0000-0000-0001-000900000003', '40004000-0000-0000-0000-000900000002', 3, 'customer', 'Practicing sentence by sentence with clear pronunciation builds real conversational fluency.', 'تمرین جمله‌به‌جمله با تلفظ شفاف، تسلط و روانی واقعی در گفتار ایجاد می‌کند.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full'),
('40004000-0000-0000-0001-000900000004', '40004000-0000-0000-0000-000900000002', 4, 'clerk', 'Staying calm and consistent turns difficult phrases into everyday speech habits.', 'آرامش و استمرار در تمرین، عبارات دشوار را به عادت‌های گفتاری روزمره بدل می‌سازد.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full'),
('40004000-0000-0000-0001-000900000005', '40004000-0000-0000-0000-000900000002', 5, 'customer', 'Completing this unit brings us closer to full mastery of English vocabulary.', 'تکمیل این درس ما را به تسلط کامل بر دایره واژگان انگلیسی نزدیک‌تر می‌کند.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full')
ON CONFLICT (id) DO NOTHING;

INSERT INTO podcasts (id, title, description_fa, level, kind, series_id, episode_no, audio_url, audio_status, is_active, duration_seconds, position, vocabulary, scene_id)
VALUES ('40004000-0000-0000-0000-000900000003', 'Autonomous Driving Systems (Book 4 - Unit 9)', 'روایت داستانی و آموزش واژگان یونیت 9 (سامانه‌های خودران هوشمند) از کتاب 4 دوره ۴۰۰۰ واژه', 'advanced', 'lesson', '40000000-0004-0000-0000-000000000004', 9, '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'ready', TRUE, 318, 9, '[{"word": "harmonize", "meaning_fa": "هماهنگ‌سازی چندبعدی"}, {"word": "innovate", "meaning_fa": "نوآوری ارزش‌آفرین"}, {"word": "leverage", "meaning_fa": "اهرم قرار دادن مزیت"}, {"word": "mitigate", "meaning_fa": "کاهش اثرات ریسک"}, {"word": "navigate", "meaning_fa": "هدایت در شرایط عدم قطعیت"}, {"word": "orchestrate", "meaning_fa": "هماهنگی دقیق فرایندها"}, {"word": "pioneer", "meaning_fa": "پیشگامی در عرصه"}, {"word": "quantify", "meaning_fa": "محاسبه کمی دقیق"}, {"word": "reconcile", "meaning_fa": "وفاق دادن دیدگاه‌ها"}, {"word": "substantiate", "meaning_fa": "مستندسازی و اثبات"}, {"word": "synthesize", "meaning_fa": "ترکیب و تلفیق نظام‌مند"}, {"word": "underpin", "meaning_fa": "تقویت شالوده فکری"}, {"word": "yield", "meaning_fa": "بازدهی و ثمردهی بالا"}, {"word": "allocate", "meaning_fa": "تخصیص بهینه منابع"}, {"word": "benchmark", "meaning_fa": "معیار سنجش مرجع"}, {"word": "catalyze", "meaning_fa": "شتاب‌بخشی تحول"}, {"word": "differentiate", "meaning_fa": "متمایزسازی رقابتی"}, {"word": "exemplify", "meaning_fa": "نمونه بارز بودن"}, {"word": "formulate", "meaning_fa": "تدوین منسجم"}, {"word": "gauge", "meaning_fa": "سنجش و برآورد دقیق"}]'::jsonb, '40004000-0000-0000-0000-000900000001')
ON CONFLICT (id) DO UPDATE SET scene_id = EXCLUDED.scene_id, vocabulary = EXCLUDED.vocabulary;

INSERT INTO podcast_lines (podcast_id, position, speaker, text, translation_fa, start_ms, end_ms)
VALUES
('40004000-0000-0000-0000-000900000003', 0, 'Alex', 'Welcome to 4000 Essential English Words, Book 4, Unit 9: Autonomous Driving Systems.', 'به درس 9 از کتاب 4 دوره ۴۰۰۰ واژه خوش آمدید: سامانه‌های خودران هوشمند.', 0, 6000),
('40004000-0000-0000-0000-000900000003', 1, 'Sarah', 'Today we focus on 20 high-frequency vocabulary words used in real-life contexts.', 'امروز بر روی 20 واژه پرکاربرد در موقعیت‌های واقعی تمرکز می‌کنیم.', 6300, 13500),
('40004000-0000-0000-0000-000900000003', 2, 'Alex', 'Listen closely to the natural rhythm and pronunciation of each target phrase.', 'به ریتم طبیعی و تلفظ دقیق هر عبارت هدف خوب گوش فرا دهید.', 13800, 21000),
('40004000-0000-0000-0000-000900000003', 3, 'Sarah', 'Now head over to the shadowing section to record these sentences in your own voice!', 'حالا به بخش شادوئینگ بروید تا این جملات را با صدای خودتان تمرین و ضبط کنید!', 21400, 29000)
ON CONFLICT DO NOTHING;

-- کتاب 4 - درس 10: Central Banking Policy
INSERT INTO scenes (id, title, description, background_image_url, difficulty, status, "order", category, is_custom)
VALUES ('40004000-0000-0000-0000-001000000001', 'Central Banking Policy (Book 4 - Unit 10)', 'تمرین شادوئینگ یونیت 10 کتاب 4 (سیاست‌گذاری بانک مرکزی): mitigate, navigate, orchestrate, pioneer, quantify, reconcile...', '', 'advanced', 'published', 410, 'education', false)
ON CONFLICT (id) DO NOTHING;

INSERT INTO hotspots (id, scene_id, name, x_position, y_position, order_index)
VALUES ('40004000-0000-0000-0000-001000000002', '40004000-0000-0000-0000-001000000001', 'Dialogue', 50.0, 50.0, 1)
ON CONFLICT (id) DO NOTHING;

INSERT INTO dialogues (id, hotspot_id, "order", speaker, original_text, translation, audio_url, display_type)
VALUES
('40004000-0000-0000-0001-001000000001', '40004000-0000-0000-0000-001000000002', 1, 'customer', 'Exploring central banking policy offers a great opportunity to master essential vocabulary.', 'بررسی موضوع سیاست‌گذاری بانک مرکزی فرصتی عالی برای تسلط بر واژگان ضروری به شمار می‌رود.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full'),
('40004000-0000-0000-0001-001000000002', '40004000-0000-0000-0000-001000000002', 2, 'clerk', 'Native speakers naturally use target words like mitigate and navigate in conversation.', 'گویندگان نیتیو کلماتی چون mitigate (کاهش اثرات ریسک) و navigate (هدایت در شرایط عدم قطعیت) را به صورت طبیعی در مکالمه به کار می‌برند.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full'),
('40004000-0000-0000-0001-001000000003', '40004000-0000-0000-0000-001000000002', 3, 'customer', 'Practicing sentence by sentence with clear pronunciation builds real conversational fluency.', 'تمرین جمله‌به‌جمله با تلفظ شفاف، تسلط و روانی واقعی در گفتار ایجاد می‌کند.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full'),
('40004000-0000-0000-0001-001000000004', '40004000-0000-0000-0000-001000000002', 4, 'clerk', 'Staying calm and consistent turns difficult phrases into everyday speech habits.', 'آرامش و استمرار در تمرین، عبارات دشوار را به عادت‌های گفتاری روزمره بدل می‌سازد.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full'),
('40004000-0000-0000-0001-001000000005', '40004000-0000-0000-0000-001000000002', 5, 'customer', 'Completing this unit brings us closer to full mastery of English vocabulary.', 'تکمیل این درس ما را به تسلط کامل بر دایره واژگان انگلیسی نزدیک‌تر می‌کند.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full')
ON CONFLICT (id) DO NOTHING;

INSERT INTO podcasts (id, title, description_fa, level, kind, series_id, episode_no, audio_url, audio_status, is_active, duration_seconds, position, vocabulary, scene_id)
VALUES ('40004000-0000-0000-0000-001000000003', 'Central Banking Policy (Book 4 - Unit 10)', 'روایت داستانی و آموزش واژگان یونیت 10 (سیاست‌گذاری بانک مرکزی) از کتاب 4 دوره ۴۰۰۰ واژه', 'advanced', 'lesson', '40000000-0004-0000-0000-000000000004', 10, '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'ready', TRUE, 320, 10, '[{"word": "mitigate", "meaning_fa": "کاهش اثرات ریسک"}, {"word": "navigate", "meaning_fa": "هدایت در شرایط عدم قطعیت"}, {"word": "orchestrate", "meaning_fa": "هماهنگی دقیق فرایندها"}, {"word": "pioneer", "meaning_fa": "پیشگامی در عرصه"}, {"word": "quantify", "meaning_fa": "محاسبه کمی دقیق"}, {"word": "reconcile", "meaning_fa": "وفاق دادن دیدگاه‌ها"}, {"word": "substantiate", "meaning_fa": "مستندسازی و اثبات"}, {"word": "synthesize", "meaning_fa": "ترکیب و تلفیق نظام‌مند"}, {"word": "underpin", "meaning_fa": "تقویت شالوده فکری"}, {"word": "yield", "meaning_fa": "بازدهی و ثمردهی بالا"}, {"word": "allocate", "meaning_fa": "تخصیص بهینه منابع"}, {"word": "benchmark", "meaning_fa": "معیار سنجش مرجع"}, {"word": "catalyze", "meaning_fa": "شتاب‌بخشی تحول"}, {"word": "differentiate", "meaning_fa": "متمایزسازی رقابتی"}, {"word": "exemplify", "meaning_fa": "نمونه بارز بودن"}, {"word": "formulate", "meaning_fa": "تدوین منسجم"}, {"word": "gauge", "meaning_fa": "سنجش و برآورد دقیق"}, {"word": "harmonize", "meaning_fa": "هماهنگ‌سازی چندبعدی"}, {"word": "innovate", "meaning_fa": "نوآوری ارزش‌آفرین"}, {"word": "leverage", "meaning_fa": "اهرم قرار دادن مزیت"}]'::jsonb, '40004000-0000-0000-0000-001000000001')
ON CONFLICT (id) DO UPDATE SET scene_id = EXCLUDED.scene_id, vocabulary = EXCLUDED.vocabulary;

INSERT INTO podcast_lines (podcast_id, position, speaker, text, translation_fa, start_ms, end_ms)
VALUES
('40004000-0000-0000-0000-001000000003', 0, 'Alex', 'Welcome to 4000 Essential English Words, Book 4, Unit 10: Central Banking Policy.', 'به درس 10 از کتاب 4 دوره ۴۰۰۰ واژه خوش آمدید: سیاست‌گذاری بانک مرکزی.', 0, 6000),
('40004000-0000-0000-0000-001000000003', 1, 'Sarah', 'Today we focus on 20 high-frequency vocabulary words used in real-life contexts.', 'امروز بر روی 20 واژه پرکاربرد در موقعیت‌های واقعی تمرکز می‌کنیم.', 6300, 13500),
('40004000-0000-0000-0000-001000000003', 2, 'Alex', 'Listen closely to the natural rhythm and pronunciation of each target phrase.', 'به ریتم طبیعی و تلفظ دقیق هر عبارت هدف خوب گوش فرا دهید.', 13800, 21000),
('40004000-0000-0000-0000-001000000003', 3, 'Sarah', 'Now head over to the shadowing section to record these sentences in your own voice!', 'حالا به بخش شادوئینگ بروید تا این جملات را با صدای خودتان تمرین و ضبط کنید!', 21400, 29000)
ON CONFLICT DO NOTHING;

-- کتاب 4 - درس 11: Clinical Trial Protocols
INSERT INTO scenes (id, title, description, background_image_url, difficulty, status, "order", category, is_custom)
VALUES ('40004000-0000-0000-0000-001100000001', 'Clinical Trial Protocols (Book 4 - Unit 11)', 'تمرین شادوئینگ یونیت 11 کتاب 4 (پروتکل‌های کارآزمایی بالینی): pioneer, quantify, reconcile, substantiate, synthesize, underpin...', '', 'advanced', 'published', 411, 'education', false)
ON CONFLICT (id) DO NOTHING;

INSERT INTO hotspots (id, scene_id, name, x_position, y_position, order_index)
VALUES ('40004000-0000-0000-0000-001100000002', '40004000-0000-0000-0000-001100000001', 'Dialogue', 50.0, 50.0, 1)
ON CONFLICT (id) DO NOTHING;

INSERT INTO dialogues (id, hotspot_id, "order", speaker, original_text, translation, audio_url, display_type)
VALUES
('40004000-0000-0000-0001-001100000001', '40004000-0000-0000-0000-001100000002', 1, 'customer', 'Exploring clinical trial protocols offers a great opportunity to master essential vocabulary.', 'بررسی موضوع پروتکل‌های کارآزمایی بالینی فرصتی عالی برای تسلط بر واژگان ضروری به شمار می‌رود.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full'),
('40004000-0000-0000-0001-001100000002', '40004000-0000-0000-0000-001100000002', 2, 'clerk', 'Native speakers naturally use target words like pioneer and quantify in conversation.', 'گویندگان نیتیو کلماتی چون pioneer (پیشگامی در عرصه) و quantify (محاسبه کمی دقیق) را به صورت طبیعی در مکالمه به کار می‌برند.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full'),
('40004000-0000-0000-0001-001100000003', '40004000-0000-0000-0000-001100000002', 3, 'customer', 'Practicing sentence by sentence with clear pronunciation builds real conversational fluency.', 'تمرین جمله‌به‌جمله با تلفظ شفاف، تسلط و روانی واقعی در گفتار ایجاد می‌کند.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full'),
('40004000-0000-0000-0001-001100000004', '40004000-0000-0000-0000-001100000002', 4, 'clerk', 'Staying calm and consistent turns difficult phrases into everyday speech habits.', 'آرامش و استمرار در تمرین، عبارات دشوار را به عادت‌های گفتاری روزمره بدل می‌سازد.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full'),
('40004000-0000-0000-0001-001100000005', '40004000-0000-0000-0000-001100000002', 5, 'customer', 'Completing this unit brings us closer to full mastery of English vocabulary.', 'تکمیل این درس ما را به تسلط کامل بر دایره واژگان انگلیسی نزدیک‌تر می‌کند.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full')
ON CONFLICT (id) DO NOTHING;

INSERT INTO podcasts (id, title, description_fa, level, kind, series_id, episode_no, audio_url, audio_status, is_active, duration_seconds, position, vocabulary, scene_id)
VALUES ('40004000-0000-0000-0000-001100000003', 'Clinical Trial Protocols (Book 4 - Unit 11)', 'روایت داستانی و آموزش واژگان یونیت 11 (پروتکل‌های کارآزمایی بالینی) از کتاب 4 دوره ۴۰۰۰ واژه', 'advanced', 'lesson', '40000000-0004-0000-0000-000000000004', 11, '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'ready', TRUE, 322, 11, '[{"word": "pioneer", "meaning_fa": "پیشگامی در عرصه"}, {"word": "quantify", "meaning_fa": "محاسبه کمی دقیق"}, {"word": "reconcile", "meaning_fa": "وفاق دادن دیدگاه‌ها"}, {"word": "substantiate", "meaning_fa": "مستندسازی و اثبات"}, {"word": "synthesize", "meaning_fa": "ترکیب و تلفیق نظام‌مند"}, {"word": "underpin", "meaning_fa": "تقویت شالوده فکری"}, {"word": "yield", "meaning_fa": "بازدهی و ثمردهی بالا"}, {"word": "allocate", "meaning_fa": "تخصیص بهینه منابع"}, {"word": "benchmark", "meaning_fa": "معیار سنجش مرجع"}, {"word": "catalyze", "meaning_fa": "شتاب‌بخشی تحول"}, {"word": "differentiate", "meaning_fa": "متمایزسازی رقابتی"}, {"word": "exemplify", "meaning_fa": "نمونه بارز بودن"}, {"word": "formulate", "meaning_fa": "تدوین منسجم"}, {"word": "gauge", "meaning_fa": "سنجش و برآورد دقیق"}, {"word": "harmonize", "meaning_fa": "هماهنگ‌سازی چندبعدی"}, {"word": "innovate", "meaning_fa": "نوآوری ارزش‌آفرین"}, {"word": "leverage", "meaning_fa": "اهرم قرار دادن مزیت"}, {"word": "mitigate", "meaning_fa": "کاهش اثرات ریسک"}, {"word": "navigate", "meaning_fa": "هدایت در شرایط عدم قطعیت"}, {"word": "orchestrate", "meaning_fa": "هماهنگی دقیق فرایندها"}]'::jsonb, '40004000-0000-0000-0000-001100000001')
ON CONFLICT (id) DO UPDATE SET scene_id = EXCLUDED.scene_id, vocabulary = EXCLUDED.vocabulary;

INSERT INTO podcast_lines (podcast_id, position, speaker, text, translation_fa, start_ms, end_ms)
VALUES
('40004000-0000-0000-0000-001100000003', 0, 'Alex', 'Welcome to 4000 Essential English Words, Book 4, Unit 11: Clinical Trial Protocols.', 'به درس 11 از کتاب 4 دوره ۴۰۰۰ واژه خوش آمدید: پروتکل‌های کارآزمایی بالینی.', 0, 6000),
('40004000-0000-0000-0000-001100000003', 1, 'Sarah', 'Today we focus on 20 high-frequency vocabulary words used in real-life contexts.', 'امروز بر روی 20 واژه پرکاربرد در موقعیت‌های واقعی تمرکز می‌کنیم.', 6300, 13500),
('40004000-0000-0000-0000-001100000003', 2, 'Alex', 'Listen closely to the natural rhythm and pronunciation of each target phrase.', 'به ریتم طبیعی و تلفظ دقیق هر عبارت هدف خوب گوش فرا دهید.', 13800, 21000),
('40004000-0000-0000-0000-001100000003', 3, 'Sarah', 'Now head over to the shadowing section to record these sentences in your own voice!', 'حالا به بخش شادوئینگ بروید تا این جملات را با صدای خودتان تمرین و ضبط کنید!', 21400, 29000)
ON CONFLICT DO NOTHING;

-- کتاب 4 - درس 12: Constitutional Principles
INSERT INTO scenes (id, title, description, background_image_url, difficulty, status, "order", category, is_custom)
VALUES ('40004000-0000-0000-0000-001200000001', 'Constitutional Principles (Book 4 - Unit 12)', 'تمرین شادوئینگ یونیت 12 کتاب 4 (اصول بنیادین قانون اساسی): substantiate, synthesize, underpin, yield, allocate, benchmark...', '', 'advanced', 'published', 412, 'education', false)
ON CONFLICT (id) DO NOTHING;

INSERT INTO hotspots (id, scene_id, name, x_position, y_position, order_index)
VALUES ('40004000-0000-0000-0000-001200000002', '40004000-0000-0000-0000-001200000001', 'Dialogue', 50.0, 50.0, 1)
ON CONFLICT (id) DO NOTHING;

INSERT INTO dialogues (id, hotspot_id, "order", speaker, original_text, translation, audio_url, display_type)
VALUES
('40004000-0000-0000-0001-001200000001', '40004000-0000-0000-0000-001200000002', 1, 'customer', 'Exploring constitutional principles offers a great opportunity to master essential vocabulary.', 'بررسی موضوع اصول بنیادین قانون اساسی فرصتی عالی برای تسلط بر واژگان ضروری به شمار می‌رود.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full'),
('40004000-0000-0000-0001-001200000002', '40004000-0000-0000-0000-001200000002', 2, 'clerk', 'Native speakers naturally use target words like substantiate and synthesize in conversation.', 'گویندگان نیتیو کلماتی چون substantiate (مستندسازی و اثبات) و synthesize (ترکیب و تلفیق نظام‌مند) را به صورت طبیعی در مکالمه به کار می‌برند.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full'),
('40004000-0000-0000-0001-001200000003', '40004000-0000-0000-0000-001200000002', 3, 'customer', 'Practicing sentence by sentence with clear pronunciation builds real conversational fluency.', 'تمرین جمله‌به‌جمله با تلفظ شفاف، تسلط و روانی واقعی در گفتار ایجاد می‌کند.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full'),
('40004000-0000-0000-0001-001200000004', '40004000-0000-0000-0000-001200000002', 4, 'clerk', 'Staying calm and consistent turns difficult phrases into everyday speech habits.', 'آرامش و استمرار در تمرین، عبارات دشوار را به عادت‌های گفتاری روزمره بدل می‌سازد.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full'),
('40004000-0000-0000-0001-001200000005', '40004000-0000-0000-0000-001200000002', 5, 'customer', 'Completing this unit brings us closer to full mastery of English vocabulary.', 'تکمیل این درس ما را به تسلط کامل بر دایره واژگان انگلیسی نزدیک‌تر می‌کند.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full')
ON CONFLICT (id) DO NOTHING;

INSERT INTO podcasts (id, title, description_fa, level, kind, series_id, episode_no, audio_url, audio_status, is_active, duration_seconds, position, vocabulary, scene_id)
VALUES ('40004000-0000-0000-0000-001200000003', 'Constitutional Principles (Book 4 - Unit 12)', 'روایت داستانی و آموزش واژگان یونیت 12 (اصول بنیادین قانون اساسی) از کتاب 4 دوره ۴۰۰۰ واژه', 'advanced', 'lesson', '40000000-0004-0000-0000-000000000004', 12, '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'ready', TRUE, 324, 12, '[{"word": "substantiate", "meaning_fa": "مستندسازی و اثبات"}, {"word": "synthesize", "meaning_fa": "ترکیب و تلفیق نظام‌مند"}, {"word": "underpin", "meaning_fa": "تقویت شالوده فکری"}, {"word": "yield", "meaning_fa": "بازدهی و ثمردهی بالا"}, {"word": "allocate", "meaning_fa": "تخصیص بهینه منابع"}, {"word": "benchmark", "meaning_fa": "معیار سنجش مرجع"}, {"word": "catalyze", "meaning_fa": "شتاب‌بخشی تحول"}, {"word": "differentiate", "meaning_fa": "متمایزسازی رقابتی"}, {"word": "exemplify", "meaning_fa": "نمونه بارز بودن"}, {"word": "formulate", "meaning_fa": "تدوین منسجم"}, {"word": "gauge", "meaning_fa": "سنجش و برآورد دقیق"}, {"word": "harmonize", "meaning_fa": "هماهنگ‌سازی چندبعدی"}, {"word": "innovate", "meaning_fa": "نوآوری ارزش‌آفرین"}, {"word": "leverage", "meaning_fa": "اهرم قرار دادن مزیت"}, {"word": "mitigate", "meaning_fa": "کاهش اثرات ریسک"}, {"word": "navigate", "meaning_fa": "هدایت در شرایط عدم قطعیت"}, {"word": "orchestrate", "meaning_fa": "هماهنگی دقیق فرایندها"}, {"word": "pioneer", "meaning_fa": "پیشگامی در عرصه"}, {"word": "quantify", "meaning_fa": "محاسبه کمی دقیق"}, {"word": "reconcile", "meaning_fa": "وفاق دادن دیدگاه‌ها"}]'::jsonb, '40004000-0000-0000-0000-001200000001')
ON CONFLICT (id) DO UPDATE SET scene_id = EXCLUDED.scene_id, vocabulary = EXCLUDED.vocabulary;

INSERT INTO podcast_lines (podcast_id, position, speaker, text, translation_fa, start_ms, end_ms)
VALUES
('40004000-0000-0000-0000-001200000003', 0, 'Alex', 'Welcome to 4000 Essential English Words, Book 4, Unit 12: Constitutional Principles.', 'به درس 12 از کتاب 4 دوره ۴۰۰۰ واژه خوش آمدید: اصول بنیادین قانون اساسی.', 0, 6000),
('40004000-0000-0000-0000-001200000003', 1, 'Sarah', 'Today we focus on 20 high-frequency vocabulary words used in real-life contexts.', 'امروز بر روی 20 واژه پرکاربرد در موقعیت‌های واقعی تمرکز می‌کنیم.', 6300, 13500),
('40004000-0000-0000-0000-001200000003', 2, 'Alex', 'Listen closely to the natural rhythm and pronunciation of each target phrase.', 'به ریتم طبیعی و تلفظ دقیق هر عبارت هدف خوب گوش فرا دهید.', 13800, 21000),
('40004000-0000-0000-0000-001200000003', 3, 'Sarah', 'Now head over to the shadowing section to record these sentences in your own voice!', 'حالا به بخش شادوئینگ بروید تا این جملات را با صدای خودتان تمرین و ضبط کنید!', 21400, 29000)
ON CONFLICT DO NOTHING;

-- کتاب 4 - درس 13: Diplomatic Mediation
INSERT INTO scenes (id, title, description, background_image_url, difficulty, status, "order", category, is_custom)
VALUES ('40004000-0000-0000-0000-001300000001', 'Diplomatic Mediation (Book 4 - Unit 13)', 'تمرین شادوئینگ یونیت 13 کتاب 4 (میانجی‌گری دیپلماتیک صلح): yield, allocate, benchmark, catalyze, differentiate, exemplify...', '', 'advanced', 'published', 413, 'education', false)
ON CONFLICT (id) DO NOTHING;

INSERT INTO hotspots (id, scene_id, name, x_position, y_position, order_index)
VALUES ('40004000-0000-0000-0000-001300000002', '40004000-0000-0000-0000-001300000001', 'Dialogue', 50.0, 50.0, 1)
ON CONFLICT (id) DO NOTHING;

INSERT INTO dialogues (id, hotspot_id, "order", speaker, original_text, translation, audio_url, display_type)
VALUES
('40004000-0000-0000-0001-001300000001', '40004000-0000-0000-0000-001300000002', 1, 'customer', 'Exploring diplomatic mediation offers a great opportunity to master essential vocabulary.', 'بررسی موضوع میانجی‌گری دیپلماتیک صلح فرصتی عالی برای تسلط بر واژگان ضروری به شمار می‌رود.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full'),
('40004000-0000-0000-0001-001300000002', '40004000-0000-0000-0000-001300000002', 2, 'clerk', 'Native speakers naturally use target words like yield and allocate in conversation.', 'گویندگان نیتیو کلماتی چون yield (بازدهی و ثمردهی بالا) و allocate (تخصیص بهینه منابع) را به صورت طبیعی در مکالمه به کار می‌برند.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full'),
('40004000-0000-0000-0001-001300000003', '40004000-0000-0000-0000-001300000002', 3, 'customer', 'Practicing sentence by sentence with clear pronunciation builds real conversational fluency.', 'تمرین جمله‌به‌جمله با تلفظ شفاف، تسلط و روانی واقعی در گفتار ایجاد می‌کند.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full'),
('40004000-0000-0000-0001-001300000004', '40004000-0000-0000-0000-001300000002', 4, 'clerk', 'Staying calm and consistent turns difficult phrases into everyday speech habits.', 'آرامش و استمرار در تمرین، عبارات دشوار را به عادت‌های گفتاری روزمره بدل می‌سازد.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full'),
('40004000-0000-0000-0001-001300000005', '40004000-0000-0000-0000-001300000002', 5, 'customer', 'Completing this unit brings us closer to full mastery of English vocabulary.', 'تکمیل این درس ما را به تسلط کامل بر دایره واژگان انگلیسی نزدیک‌تر می‌کند.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full')
ON CONFLICT (id) DO NOTHING;

INSERT INTO podcasts (id, title, description_fa, level, kind, series_id, episode_no, audio_url, audio_status, is_active, duration_seconds, position, vocabulary, scene_id)
VALUES ('40004000-0000-0000-0000-001300000003', 'Diplomatic Mediation (Book 4 - Unit 13)', 'روایت داستانی و آموزش واژگان یونیت 13 (میانجی‌گری دیپلماتیک صلح) از کتاب 4 دوره ۴۰۰۰ واژه', 'advanced', 'lesson', '40000000-0004-0000-0000-000000000004', 13, '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'ready', TRUE, 326, 13, '[{"word": "yield", "meaning_fa": "بازدهی و ثمردهی بالا"}, {"word": "allocate", "meaning_fa": "تخصیص بهینه منابع"}, {"word": "benchmark", "meaning_fa": "معیار سنجش مرجع"}, {"word": "catalyze", "meaning_fa": "شتاب‌بخشی تحول"}, {"word": "differentiate", "meaning_fa": "متمایزسازی رقابتی"}, {"word": "exemplify", "meaning_fa": "نمونه بارز بودن"}, {"word": "formulate", "meaning_fa": "تدوین منسجم"}, {"word": "gauge", "meaning_fa": "سنجش و برآورد دقیق"}, {"word": "harmonize", "meaning_fa": "هماهنگ‌سازی چندبعدی"}, {"word": "innovate", "meaning_fa": "نوآوری ارزش‌آفرین"}, {"word": "leverage", "meaning_fa": "اهرم قرار دادن مزیت"}, {"word": "mitigate", "meaning_fa": "کاهش اثرات ریسک"}, {"word": "navigate", "meaning_fa": "هدایت در شرایط عدم قطعیت"}, {"word": "orchestrate", "meaning_fa": "هماهنگی دقیق فرایندها"}, {"word": "pioneer", "meaning_fa": "پیشگامی در عرصه"}, {"word": "quantify", "meaning_fa": "محاسبه کمی دقیق"}, {"word": "reconcile", "meaning_fa": "وفاق دادن دیدگاه‌ها"}, {"word": "substantiate", "meaning_fa": "مستندسازی و اثبات"}, {"word": "synthesize", "meaning_fa": "ترکیب و تلفیق نظام‌مند"}, {"word": "underpin", "meaning_fa": "تقویت شالوده فکری"}]'::jsonb, '40004000-0000-0000-0000-001300000001')
ON CONFLICT (id) DO UPDATE SET scene_id = EXCLUDED.scene_id, vocabulary = EXCLUDED.vocabulary;

INSERT INTO podcast_lines (podcast_id, position, speaker, text, translation_fa, start_ms, end_ms)
VALUES
('40004000-0000-0000-0000-001300000003', 0, 'Alex', 'Welcome to 4000 Essential English Words, Book 4, Unit 13: Diplomatic Mediation.', 'به درس 13 از کتاب 4 دوره ۴۰۰۰ واژه خوش آمدید: میانجی‌گری دیپلماتیک صلح.', 0, 6000),
('40004000-0000-0000-0000-001300000003', 1, 'Sarah', 'Today we focus on 20 high-frequency vocabulary words used in real-life contexts.', 'امروز بر روی 20 واژه پرکاربرد در موقعیت‌های واقعی تمرکز می‌کنیم.', 6300, 13500),
('40004000-0000-0000-0000-001300000003', 2, 'Alex', 'Listen closely to the natural rhythm and pronunciation of each target phrase.', 'به ریتم طبیعی و تلفظ دقیق هر عبارت هدف خوب گوش فرا دهید.', 13800, 21000),
('40004000-0000-0000-0000-001300000003', 3, 'Sarah', 'Now head over to the shadowing section to record these sentences in your own voice!', 'حالا به بخش شادوئینگ بروید تا این جملات را با صدای خودتان تمرین و ضبط کنید!', 21400, 29000)
ON CONFLICT DO NOTHING;

-- کتاب 4 - درس 14: Venture Capital Ecosystem
INSERT INTO scenes (id, title, description, background_image_url, difficulty, status, "order", category, is_custom)
VALUES ('40004000-0000-0000-0000-001400000001', 'Venture Capital Ecosystem (Book 4 - Unit 14)', 'تمرین شادوئینگ یونیت 14 کتاب 4 (اکوسیستم سرمایه‌گذاری جسورانه): catalyze, differentiate, exemplify, formulate, gauge, harmonize...', '', 'advanced', 'published', 414, 'education', false)
ON CONFLICT (id) DO NOTHING;

INSERT INTO hotspots (id, scene_id, name, x_position, y_position, order_index)
VALUES ('40004000-0000-0000-0000-001400000002', '40004000-0000-0000-0000-001400000001', 'Dialogue', 50.0, 50.0, 1)
ON CONFLICT (id) DO NOTHING;

INSERT INTO dialogues (id, hotspot_id, "order", speaker, original_text, translation, audio_url, display_type)
VALUES
('40004000-0000-0000-0001-001400000001', '40004000-0000-0000-0000-001400000002', 1, 'customer', 'Exploring venture capital ecosystem offers a great opportunity to master essential vocabulary.', 'بررسی موضوع اکوسیستم سرمایه‌گذاری جسورانه فرصتی عالی برای تسلط بر واژگان ضروری به شمار می‌رود.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full'),
('40004000-0000-0000-0001-001400000002', '40004000-0000-0000-0000-001400000002', 2, 'clerk', 'Native speakers naturally use target words like catalyze and differentiate in conversation.', 'گویندگان نیتیو کلماتی چون catalyze (شتاب‌بخشی تحول) و differentiate (متمایزسازی رقابتی) را به صورت طبیعی در مکالمه به کار می‌برند.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full'),
('40004000-0000-0000-0001-001400000003', '40004000-0000-0000-0000-001400000002', 3, 'customer', 'Practicing sentence by sentence with clear pronunciation builds real conversational fluency.', 'تمرین جمله‌به‌جمله با تلفظ شفاف، تسلط و روانی واقعی در گفتار ایجاد می‌کند.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full'),
('40004000-0000-0000-0001-001400000004', '40004000-0000-0000-0000-001400000002', 4, 'clerk', 'Staying calm and consistent turns difficult phrases into everyday speech habits.', 'آرامش و استمرار در تمرین، عبارات دشوار را به عادت‌های گفتاری روزمره بدل می‌سازد.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full'),
('40004000-0000-0000-0001-001400000005', '40004000-0000-0000-0000-001400000002', 5, 'customer', 'Completing this unit brings us closer to full mastery of English vocabulary.', 'تکمیل این درس ما را به تسلط کامل بر دایره واژگان انگلیسی نزدیک‌تر می‌کند.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full')
ON CONFLICT (id) DO NOTHING;

INSERT INTO podcasts (id, title, description_fa, level, kind, series_id, episode_no, audio_url, audio_status, is_active, duration_seconds, position, vocabulary, scene_id)
VALUES ('40004000-0000-0000-0000-001400000003', 'Venture Capital Ecosystem (Book 4 - Unit 14)', 'روایت داستانی و آموزش واژگان یونیت 14 (اکوسیستم سرمایه‌گذاری جسورانه) از کتاب 4 دوره ۴۰۰۰ واژه', 'advanced', 'lesson', '40000000-0004-0000-0000-000000000004', 14, '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'ready', TRUE, 328, 14, '[{"word": "catalyze", "meaning_fa": "شتاب‌بخشی تحول"}, {"word": "differentiate", "meaning_fa": "متمایزسازی رقابتی"}, {"word": "exemplify", "meaning_fa": "نمونه بارز بودن"}, {"word": "formulate", "meaning_fa": "تدوین منسجم"}, {"word": "gauge", "meaning_fa": "سنجش و برآورد دقیق"}, {"word": "harmonize", "meaning_fa": "هماهنگ‌سازی چندبعدی"}, {"word": "innovate", "meaning_fa": "نوآوری ارزش‌آفرین"}, {"word": "leverage", "meaning_fa": "اهرم قرار دادن مزیت"}, {"word": "mitigate", "meaning_fa": "کاهش اثرات ریسک"}, {"word": "navigate", "meaning_fa": "هدایت در شرایط عدم قطعیت"}, {"word": "orchestrate", "meaning_fa": "هماهنگی دقیق فرایندها"}, {"word": "pioneer", "meaning_fa": "پیشگامی در عرصه"}, {"word": "quantify", "meaning_fa": "محاسبه کمی دقیق"}, {"word": "reconcile", "meaning_fa": "وفاق دادن دیدگاه‌ها"}, {"word": "substantiate", "meaning_fa": "مستندسازی و اثبات"}, {"word": "synthesize", "meaning_fa": "ترکیب و تلفیق نظام‌مند"}, {"word": "underpin", "meaning_fa": "تقویت شالوده فکری"}, {"word": "yield", "meaning_fa": "بازدهی و ثمردهی بالا"}, {"word": "allocate", "meaning_fa": "تخصیص بهینه منابع"}, {"word": "benchmark", "meaning_fa": "معیار سنجش مرجع"}]'::jsonb, '40004000-0000-0000-0000-001400000001')
ON CONFLICT (id) DO UPDATE SET scene_id = EXCLUDED.scene_id, vocabulary = EXCLUDED.vocabulary;

INSERT INTO podcast_lines (podcast_id, position, speaker, text, translation_fa, start_ms, end_ms)
VALUES
('40004000-0000-0000-0000-001400000003', 0, 'Alex', 'Welcome to 4000 Essential English Words, Book 4, Unit 14: Venture Capital Ecosystem.', 'به درس 14 از کتاب 4 دوره ۴۰۰۰ واژه خوش آمدید: اکوسیستم سرمایه‌گذاری جسورانه.', 0, 6000),
('40004000-0000-0000-0000-001400000003', 1, 'Sarah', 'Today we focus on 20 high-frequency vocabulary words used in real-life contexts.', 'امروز بر روی 20 واژه پرکاربرد در موقعیت‌های واقعی تمرکز می‌کنیم.', 6300, 13500),
('40004000-0000-0000-0000-001400000003', 2, 'Alex', 'Listen closely to the natural rhythm and pronunciation of each target phrase.', 'به ریتم طبیعی و تلفظ دقیق هر عبارت هدف خوب گوش فرا دهید.', 13800, 21000),
('40004000-0000-0000-0000-001400000003', 3, 'Sarah', 'Now head over to the shadowing section to record these sentences in your own voice!', 'حالا به بخش شادوئینگ بروید تا این جملات را با صدای خودتان تمرین و ضبط کنید!', 21400, 29000)
ON CONFLICT DO NOTHING;

-- کتاب 4 - درس 15: Aerospace Engineering
INSERT INTO scenes (id, title, description, background_image_url, difficulty, status, "order", category, is_custom)
VALUES ('40004000-0000-0000-0000-001500000001', 'Aerospace Engineering (Book 4 - Unit 15)', 'تمرین شادوئینگ یونیت 15 کتاب 4 (مهندسی هوافضا و پرواز): formulate, gauge, harmonize, innovate, leverage, mitigate...', '', 'advanced', 'published', 415, 'education', false)
ON CONFLICT (id) DO NOTHING;

INSERT INTO hotspots (id, scene_id, name, x_position, y_position, order_index)
VALUES ('40004000-0000-0000-0000-001500000002', '40004000-0000-0000-0000-001500000001', 'Dialogue', 50.0, 50.0, 1)
ON CONFLICT (id) DO NOTHING;

INSERT INTO dialogues (id, hotspot_id, "order", speaker, original_text, translation, audio_url, display_type)
VALUES
('40004000-0000-0000-0001-001500000001', '40004000-0000-0000-0000-001500000002', 1, 'customer', 'Exploring aerospace engineering offers a great opportunity to master essential vocabulary.', 'بررسی موضوع مهندسی هوافضا و پرواز فرصتی عالی برای تسلط بر واژگان ضروری به شمار می‌رود.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full'),
('40004000-0000-0000-0001-001500000002', '40004000-0000-0000-0000-001500000002', 2, 'clerk', 'Native speakers naturally use target words like formulate and gauge in conversation.', 'گویندگان نیتیو کلماتی چون formulate (تدوین منسجم) و gauge (سنجش و برآورد دقیق) را به صورت طبیعی در مکالمه به کار می‌برند.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full'),
('40004000-0000-0000-0001-001500000003', '40004000-0000-0000-0000-001500000002', 3, 'customer', 'Practicing sentence by sentence with clear pronunciation builds real conversational fluency.', 'تمرین جمله‌به‌جمله با تلفظ شفاف، تسلط و روانی واقعی در گفتار ایجاد می‌کند.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full'),
('40004000-0000-0000-0001-001500000004', '40004000-0000-0000-0000-001500000002', 4, 'clerk', 'Staying calm and consistent turns difficult phrases into everyday speech habits.', 'آرامش و استمرار در تمرین، عبارات دشوار را به عادت‌های گفتاری روزمره بدل می‌سازد.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full'),
('40004000-0000-0000-0001-001500000005', '40004000-0000-0000-0000-001500000002', 5, 'customer', 'Completing this unit brings us closer to full mastery of English vocabulary.', 'تکمیل این درس ما را به تسلط کامل بر دایره واژگان انگلیسی نزدیک‌تر می‌کند.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full')
ON CONFLICT (id) DO NOTHING;

INSERT INTO podcasts (id, title, description_fa, level, kind, series_id, episode_no, audio_url, audio_status, is_active, duration_seconds, position, vocabulary, scene_id)
VALUES ('40004000-0000-0000-0000-001500000003', 'Aerospace Engineering (Book 4 - Unit 15)', 'روایت داستانی و آموزش واژگان یونیت 15 (مهندسی هوافضا و پرواز) از کتاب 4 دوره ۴۰۰۰ واژه', 'advanced', 'lesson', '40000000-0004-0000-0000-000000000004', 15, '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'ready', TRUE, 330, 15, '[{"word": "formulate", "meaning_fa": "تدوین منسجم"}, {"word": "gauge", "meaning_fa": "سنجش و برآورد دقیق"}, {"word": "harmonize", "meaning_fa": "هماهنگ‌سازی چندبعدی"}, {"word": "innovate", "meaning_fa": "نوآوری ارزش‌آفرین"}, {"word": "leverage", "meaning_fa": "اهرم قرار دادن مزیت"}, {"word": "mitigate", "meaning_fa": "کاهش اثرات ریسک"}, {"word": "navigate", "meaning_fa": "هدایت در شرایط عدم قطعیت"}, {"word": "orchestrate", "meaning_fa": "هماهنگی دقیق فرایندها"}, {"word": "pioneer", "meaning_fa": "پیشگامی در عرصه"}, {"word": "quantify", "meaning_fa": "محاسبه کمی دقیق"}, {"word": "reconcile", "meaning_fa": "وفاق دادن دیدگاه‌ها"}, {"word": "substantiate", "meaning_fa": "مستندسازی و اثبات"}, {"word": "synthesize", "meaning_fa": "ترکیب و تلفیق نظام‌مند"}, {"word": "underpin", "meaning_fa": "تقویت شالوده فکری"}, {"word": "yield", "meaning_fa": "بازدهی و ثمردهی بالا"}, {"word": "allocate", "meaning_fa": "تخصیص بهینه منابع"}, {"word": "benchmark", "meaning_fa": "معیار سنجش مرجع"}, {"word": "catalyze", "meaning_fa": "شتاب‌بخشی تحول"}, {"word": "differentiate", "meaning_fa": "متمایزسازی رقابتی"}, {"word": "exemplify", "meaning_fa": "نمونه بارز بودن"}]'::jsonb, '40004000-0000-0000-0000-001500000001')
ON CONFLICT (id) DO UPDATE SET scene_id = EXCLUDED.scene_id, vocabulary = EXCLUDED.vocabulary;

INSERT INTO podcast_lines (podcast_id, position, speaker, text, translation_fa, start_ms, end_ms)
VALUES
('40004000-0000-0000-0000-001500000003', 0, 'Alex', 'Welcome to 4000 Essential English Words, Book 4, Unit 15: Aerospace Engineering.', 'به درس 15 از کتاب 4 دوره ۴۰۰۰ واژه خوش آمدید: مهندسی هوافضا و پرواز.', 0, 6000),
('40004000-0000-0000-0000-001500000003', 1, 'Sarah', 'Today we focus on 20 high-frequency vocabulary words used in real-life contexts.', 'امروز بر روی 20 واژه پرکاربرد در موقعیت‌های واقعی تمرکز می‌کنیم.', 6300, 13500),
('40004000-0000-0000-0000-001500000003', 2, 'Alex', 'Listen closely to the natural rhythm and pronunciation of each target phrase.', 'به ریتم طبیعی و تلفظ دقیق هر عبارت هدف خوب گوش فرا دهید.', 13800, 21000),
('40004000-0000-0000-0000-001500000003', 3, 'Sarah', 'Now head over to the shadowing section to record these sentences in your own voice!', 'حالا به بخش شادوئینگ بروید تا این جملات را با صدای خودتان تمرین و ضبط کنید!', 21400, 29000)
ON CONFLICT DO NOTHING;

-- کتاب 4 - درس 16: Quantum Information Science
INSERT INTO scenes (id, title, description, background_image_url, difficulty, status, "order", category, is_custom)
VALUES ('40004000-0000-0000-0000-001600000001', 'Quantum Information Science (Book 4 - Unit 16)', 'تمرین شادوئینگ یونیت 16 کتاب 4 (مفاهیم پردازش کوانتومی): innovate, leverage, mitigate, navigate, orchestrate, pioneer...', '', 'advanced', 'published', 416, 'education', false)
ON CONFLICT (id) DO NOTHING;

INSERT INTO hotspots (id, scene_id, name, x_position, y_position, order_index)
VALUES ('40004000-0000-0000-0000-001600000002', '40004000-0000-0000-0000-001600000001', 'Dialogue', 50.0, 50.0, 1)
ON CONFLICT (id) DO NOTHING;

INSERT INTO dialogues (id, hotspot_id, "order", speaker, original_text, translation, audio_url, display_type)
VALUES
('40004000-0000-0000-0001-001600000001', '40004000-0000-0000-0000-001600000002', 1, 'customer', 'Exploring quantum information science offers a great opportunity to master essential vocabulary.', 'بررسی موضوع مفاهیم پردازش کوانتومی فرصتی عالی برای تسلط بر واژگان ضروری به شمار می‌رود.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full'),
('40004000-0000-0000-0001-001600000002', '40004000-0000-0000-0000-001600000002', 2, 'clerk', 'Native speakers naturally use target words like innovate and leverage in conversation.', 'گویندگان نیتیو کلماتی چون innovate (نوآوری ارزش‌آفرین) و leverage (اهرم قرار دادن مزیت) را به صورت طبیعی در مکالمه به کار می‌برند.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full'),
('40004000-0000-0000-0001-001600000003', '40004000-0000-0000-0000-001600000002', 3, 'customer', 'Practicing sentence by sentence with clear pronunciation builds real conversational fluency.', 'تمرین جمله‌به‌جمله با تلفظ شفاف، تسلط و روانی واقعی در گفتار ایجاد می‌کند.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full'),
('40004000-0000-0000-0001-001600000004', '40004000-0000-0000-0000-001600000002', 4, 'clerk', 'Staying calm and consistent turns difficult phrases into everyday speech habits.', 'آرامش و استمرار در تمرین، عبارات دشوار را به عادت‌های گفتاری روزمره بدل می‌سازد.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full'),
('40004000-0000-0000-0001-001600000005', '40004000-0000-0000-0000-001600000002', 5, 'customer', 'Completing this unit brings us closer to full mastery of English vocabulary.', 'تکمیل این درس ما را به تسلط کامل بر دایره واژگان انگلیسی نزدیک‌تر می‌کند.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full')
ON CONFLICT (id) DO NOTHING;

INSERT INTO podcasts (id, title, description_fa, level, kind, series_id, episode_no, audio_url, audio_status, is_active, duration_seconds, position, vocabulary, scene_id)
VALUES ('40004000-0000-0000-0000-001600000003', 'Quantum Information Science (Book 4 - Unit 16)', 'روایت داستانی و آموزش واژگان یونیت 16 (مفاهیم پردازش کوانتومی) از کتاب 4 دوره ۴۰۰۰ واژه', 'advanced', 'lesson', '40000000-0004-0000-0000-000000000004', 16, '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'ready', TRUE, 332, 16, '[{"word": "innovate", "meaning_fa": "نوآوری ارزش‌آفرین"}, {"word": "leverage", "meaning_fa": "اهرم قرار دادن مزیت"}, {"word": "mitigate", "meaning_fa": "کاهش اثرات ریسک"}, {"word": "navigate", "meaning_fa": "هدایت در شرایط عدم قطعیت"}, {"word": "orchestrate", "meaning_fa": "هماهنگی دقیق فرایندها"}, {"word": "pioneer", "meaning_fa": "پیشگامی در عرصه"}, {"word": "quantify", "meaning_fa": "محاسبه کمی دقیق"}, {"word": "reconcile", "meaning_fa": "وفاق دادن دیدگاه‌ها"}, {"word": "substantiate", "meaning_fa": "مستندسازی و اثبات"}, {"word": "synthesize", "meaning_fa": "ترکیب و تلفیق نظام‌مند"}, {"word": "underpin", "meaning_fa": "تقویت شالوده فکری"}, {"word": "yield", "meaning_fa": "بازدهی و ثمردهی بالا"}, {"word": "allocate", "meaning_fa": "تخصیص بهینه منابع"}, {"word": "benchmark", "meaning_fa": "معیار سنجش مرجع"}, {"word": "catalyze", "meaning_fa": "شتاب‌بخشی تحول"}, {"word": "differentiate", "meaning_fa": "متمایزسازی رقابتی"}, {"word": "exemplify", "meaning_fa": "نمونه بارز بودن"}, {"word": "formulate", "meaning_fa": "تدوین منسجم"}, {"word": "gauge", "meaning_fa": "سنجش و برآورد دقیق"}, {"word": "harmonize", "meaning_fa": "هماهنگ‌سازی چندبعدی"}]'::jsonb, '40004000-0000-0000-0000-001600000001')
ON CONFLICT (id) DO UPDATE SET scene_id = EXCLUDED.scene_id, vocabulary = EXCLUDED.vocabulary;

INSERT INTO podcast_lines (podcast_id, position, speaker, text, translation_fa, start_ms, end_ms)
VALUES
('40004000-0000-0000-0000-001600000003', 0, 'Alex', 'Welcome to 4000 Essential English Words, Book 4, Unit 16: Quantum Information Science.', 'به درس 16 از کتاب 4 دوره ۴۰۰۰ واژه خوش آمدید: مفاهیم پردازش کوانتومی.', 0, 6000),
('40004000-0000-0000-0000-001600000003', 1, 'Sarah', 'Today we focus on 20 high-frequency vocabulary words used in real-life contexts.', 'امروز بر روی 20 واژه پرکاربرد در موقعیت‌های واقعی تمرکز می‌کنیم.', 6300, 13500),
('40004000-0000-0000-0000-001600000003', 2, 'Alex', 'Listen closely to the natural rhythm and pronunciation of each target phrase.', 'به ریتم طبیعی و تلفظ دقیق هر عبارت هدف خوب گوش فرا دهید.', 13800, 21000),
('40004000-0000-0000-0000-001600000003', 3, 'Sarah', 'Now head over to the shadowing section to record these sentences in your own voice!', 'حالا به بخش شادوئینگ بروید تا این جملات را با صدای خودتان تمرین و ضبط کنید!', 21400, 29000)
ON CONFLICT DO NOTHING;

-- کتاب 4 - درس 17: Literary Criticism
INSERT INTO scenes (id, title, description, background_image_url, difficulty, status, "order", category, is_custom)
VALUES ('40004000-0000-0000-0000-001700000001', 'Literary Criticism (Book 4 - Unit 17)', 'تمرین شادوئینگ یونیت 17 کتاب 4 (نقد و تحلیل ادبیات جهان): navigate, orchestrate, pioneer, quantify, reconcile, substantiate...', '', 'advanced', 'published', 417, 'education', false)
ON CONFLICT (id) DO NOTHING;

INSERT INTO hotspots (id, scene_id, name, x_position, y_position, order_index)
VALUES ('40004000-0000-0000-0000-001700000002', '40004000-0000-0000-0000-001700000001', 'Dialogue', 50.0, 50.0, 1)
ON CONFLICT (id) DO NOTHING;

INSERT INTO dialogues (id, hotspot_id, "order", speaker, original_text, translation, audio_url, display_type)
VALUES
('40004000-0000-0000-0001-001700000001', '40004000-0000-0000-0000-001700000002', 1, 'customer', 'Exploring literary criticism offers a great opportunity to master essential vocabulary.', 'بررسی موضوع نقد و تحلیل ادبیات جهان فرصتی عالی برای تسلط بر واژگان ضروری به شمار می‌رود.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full'),
('40004000-0000-0000-0001-001700000002', '40004000-0000-0000-0000-001700000002', 2, 'clerk', 'Native speakers naturally use target words like navigate and orchestrate in conversation.', 'گویندگان نیتیو کلماتی چون navigate (هدایت در شرایط عدم قطعیت) و orchestrate (هماهنگی دقیق فرایندها) را به صورت طبیعی در مکالمه به کار می‌برند.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full'),
('40004000-0000-0000-0001-001700000003', '40004000-0000-0000-0000-001700000002', 3, 'customer', 'Practicing sentence by sentence with clear pronunciation builds real conversational fluency.', 'تمرین جمله‌به‌جمله با تلفظ شفاف، تسلط و روانی واقعی در گفتار ایجاد می‌کند.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full'),
('40004000-0000-0000-0001-001700000004', '40004000-0000-0000-0000-001700000002', 4, 'clerk', 'Staying calm and consistent turns difficult phrases into everyday speech habits.', 'آرامش و استمرار در تمرین، عبارات دشوار را به عادت‌های گفتاری روزمره بدل می‌سازد.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full'),
('40004000-0000-0000-0001-001700000005', '40004000-0000-0000-0000-001700000002', 5, 'customer', 'Completing this unit brings us closer to full mastery of English vocabulary.', 'تکمیل این درس ما را به تسلط کامل بر دایره واژگان انگلیسی نزدیک‌تر می‌کند.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full')
ON CONFLICT (id) DO NOTHING;

INSERT INTO podcasts (id, title, description_fa, level, kind, series_id, episode_no, audio_url, audio_status, is_active, duration_seconds, position, vocabulary, scene_id)
VALUES ('40004000-0000-0000-0000-001700000003', 'Literary Criticism (Book 4 - Unit 17)', 'روایت داستانی و آموزش واژگان یونیت 17 (نقد و تحلیل ادبیات جهان) از کتاب 4 دوره ۴۰۰۰ واژه', 'advanced', 'lesson', '40000000-0004-0000-0000-000000000004', 17, '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'ready', TRUE, 334, 17, '[{"word": "navigate", "meaning_fa": "هدایت در شرایط عدم قطعیت"}, {"word": "orchestrate", "meaning_fa": "هماهنگی دقیق فرایندها"}, {"word": "pioneer", "meaning_fa": "پیشگامی در عرصه"}, {"word": "quantify", "meaning_fa": "محاسبه کمی دقیق"}, {"word": "reconcile", "meaning_fa": "وفاق دادن دیدگاه‌ها"}, {"word": "substantiate", "meaning_fa": "مستندسازی و اثبات"}, {"word": "synthesize", "meaning_fa": "ترکیب و تلفیق نظام‌مند"}, {"word": "underpin", "meaning_fa": "تقویت شالوده فکری"}, {"word": "yield", "meaning_fa": "بازدهی و ثمردهی بالا"}, {"word": "allocate", "meaning_fa": "تخصیص بهینه منابع"}, {"word": "benchmark", "meaning_fa": "معیار سنجش مرجع"}, {"word": "catalyze", "meaning_fa": "شتاب‌بخشی تحول"}, {"word": "differentiate", "meaning_fa": "متمایزسازی رقابتی"}, {"word": "exemplify", "meaning_fa": "نمونه بارز بودن"}, {"word": "formulate", "meaning_fa": "تدوین منسجم"}, {"word": "gauge", "meaning_fa": "سنجش و برآورد دقیق"}, {"word": "harmonize", "meaning_fa": "هماهنگ‌سازی چندبعدی"}, {"word": "innovate", "meaning_fa": "نوآوری ارزش‌آفرین"}, {"word": "leverage", "meaning_fa": "اهرم قرار دادن مزیت"}, {"word": "mitigate", "meaning_fa": "کاهش اثرات ریسک"}]'::jsonb, '40004000-0000-0000-0000-001700000001')
ON CONFLICT (id) DO UPDATE SET scene_id = EXCLUDED.scene_id, vocabulary = EXCLUDED.vocabulary;

INSERT INTO podcast_lines (podcast_id, position, speaker, text, translation_fa, start_ms, end_ms)
VALUES
('40004000-0000-0000-0000-001700000003', 0, 'Alex', 'Welcome to 4000 Essential English Words, Book 4, Unit 17: Literary Criticism.', 'به درس 17 از کتاب 4 دوره ۴۰۰۰ واژه خوش آمدید: نقد و تحلیل ادبیات جهان.', 0, 6000),
('40004000-0000-0000-0000-001700000003', 1, 'Sarah', 'Today we focus on 20 high-frequency vocabulary words used in real-life contexts.', 'امروز بر روی 20 واژه پرکاربرد در موقعیت‌های واقعی تمرکز می‌کنیم.', 6300, 13500),
('40004000-0000-0000-0000-001700000003', 2, 'Alex', 'Listen closely to the natural rhythm and pronunciation of each target phrase.', 'به ریتم طبیعی و تلفظ دقیق هر عبارت هدف خوب گوش فرا دهید.', 13800, 21000),
('40004000-0000-0000-0000-001700000003', 3, 'Sarah', 'Now head over to the shadowing section to record these sentences in your own voice!', 'حالا به بخش شادوئینگ بروید تا این جملات را با صدای خودتان تمرین و ضبط کنید!', 21400, 29000)
ON CONFLICT DO NOTHING;

-- کتاب 4 - درس 18: Sociological Paradigm
INSERT INTO scenes (id, title, description, background_image_url, difficulty, status, "order", category, is_custom)
VALUES ('40004000-0000-0000-0000-001800000001', 'Sociological Paradigm (Book 4 - Unit 18)', 'تمرین شادوئینگ یونیت 18 کتاب 4 (الگوهای جامعه‌شناسی معاصر): quantify, reconcile, substantiate, synthesize, underpin, yield...', '', 'advanced', 'published', 418, 'education', false)
ON CONFLICT (id) DO NOTHING;

INSERT INTO hotspots (id, scene_id, name, x_position, y_position, order_index)
VALUES ('40004000-0000-0000-0000-001800000002', '40004000-0000-0000-0000-001800000001', 'Dialogue', 50.0, 50.0, 1)
ON CONFLICT (id) DO NOTHING;

INSERT INTO dialogues (id, hotspot_id, "order", speaker, original_text, translation, audio_url, display_type)
VALUES
('40004000-0000-0000-0001-001800000001', '40004000-0000-0000-0000-001800000002', 1, 'customer', 'Exploring sociological paradigm offers a great opportunity to master essential vocabulary.', 'بررسی موضوع الگوهای جامعه‌شناسی معاصر فرصتی عالی برای تسلط بر واژگان ضروری به شمار می‌رود.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full'),
('40004000-0000-0000-0001-001800000002', '40004000-0000-0000-0000-001800000002', 2, 'clerk', 'Native speakers naturally use target words like quantify and reconcile in conversation.', 'گویندگان نیتیو کلماتی چون quantify (محاسبه کمی دقیق) و reconcile (وفاق دادن دیدگاه‌ها) را به صورت طبیعی در مکالمه به کار می‌برند.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full'),
('40004000-0000-0000-0001-001800000003', '40004000-0000-0000-0000-001800000002', 3, 'customer', 'Practicing sentence by sentence with clear pronunciation builds real conversational fluency.', 'تمرین جمله‌به‌جمله با تلفظ شفاف، تسلط و روانی واقعی در گفتار ایجاد می‌کند.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full'),
('40004000-0000-0000-0001-001800000004', '40004000-0000-0000-0000-001800000002', 4, 'clerk', 'Staying calm and consistent turns difficult phrases into everyday speech habits.', 'آرامش و استمرار در تمرین، عبارات دشوار را به عادت‌های گفتاری روزمره بدل می‌سازد.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full'),
('40004000-0000-0000-0001-001800000005', '40004000-0000-0000-0000-001800000002', 5, 'customer', 'Completing this unit brings us closer to full mastery of English vocabulary.', 'تکمیل این درس ما را به تسلط کامل بر دایره واژگان انگلیسی نزدیک‌تر می‌کند.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full')
ON CONFLICT (id) DO NOTHING;

INSERT INTO podcasts (id, title, description_fa, level, kind, series_id, episode_no, audio_url, audio_status, is_active, duration_seconds, position, vocabulary, scene_id)
VALUES ('40004000-0000-0000-0000-001800000003', 'Sociological Paradigm (Book 4 - Unit 18)', 'روایت داستانی و آموزش واژگان یونیت 18 (الگوهای جامعه‌شناسی معاصر) از کتاب 4 دوره ۴۰۰۰ واژه', 'advanced', 'lesson', '40000000-0004-0000-0000-000000000004', 18, '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'ready', TRUE, 336, 18, '[{"word": "quantify", "meaning_fa": "محاسبه کمی دقیق"}, {"word": "reconcile", "meaning_fa": "وفاق دادن دیدگاه‌ها"}, {"word": "substantiate", "meaning_fa": "مستندسازی و اثبات"}, {"word": "synthesize", "meaning_fa": "ترکیب و تلفیق نظام‌مند"}, {"word": "underpin", "meaning_fa": "تقویت شالوده فکری"}, {"word": "yield", "meaning_fa": "بازدهی و ثمردهی بالا"}, {"word": "allocate", "meaning_fa": "تخصیص بهینه منابع"}, {"word": "benchmark", "meaning_fa": "معیار سنجش مرجع"}, {"word": "catalyze", "meaning_fa": "شتاب‌بخشی تحول"}, {"word": "differentiate", "meaning_fa": "متمایزسازی رقابتی"}, {"word": "exemplify", "meaning_fa": "نمونه بارز بودن"}, {"word": "formulate", "meaning_fa": "تدوین منسجم"}, {"word": "gauge", "meaning_fa": "سنجش و برآورد دقیق"}, {"word": "harmonize", "meaning_fa": "هماهنگ‌سازی چندبعدی"}, {"word": "innovate", "meaning_fa": "نوآوری ارزش‌آفرین"}, {"word": "leverage", "meaning_fa": "اهرم قرار دادن مزیت"}, {"word": "mitigate", "meaning_fa": "کاهش اثرات ریسک"}, {"word": "navigate", "meaning_fa": "هدایت در شرایط عدم قطعیت"}, {"word": "orchestrate", "meaning_fa": "هماهنگی دقیق فرایندها"}, {"word": "pioneer", "meaning_fa": "پیشگامی در عرصه"}]'::jsonb, '40004000-0000-0000-0000-001800000001')
ON CONFLICT (id) DO UPDATE SET scene_id = EXCLUDED.scene_id, vocabulary = EXCLUDED.vocabulary;

INSERT INTO podcast_lines (podcast_id, position, speaker, text, translation_fa, start_ms, end_ms)
VALUES
('40004000-0000-0000-0000-001800000003', 0, 'Alex', 'Welcome to 4000 Essential English Words, Book 4, Unit 18: Sociological Paradigm.', 'به درس 18 از کتاب 4 دوره ۴۰۰۰ واژه خوش آمدید: الگوهای جامعه‌شناسی معاصر.', 0, 6000),
('40004000-0000-0000-0000-001800000003', 1, 'Sarah', 'Today we focus on 20 high-frequency vocabulary words used in real-life contexts.', 'امروز بر روی 20 واژه پرکاربرد در موقعیت‌های واقعی تمرکز می‌کنیم.', 6300, 13500),
('40004000-0000-0000-0000-001800000003', 2, 'Alex', 'Listen closely to the natural rhythm and pronunciation of each target phrase.', 'به ریتم طبیعی و تلفظ دقیق هر عبارت هدف خوب گوش فرا دهید.', 13800, 21000),
('40004000-0000-0000-0000-001800000003', 3, 'Sarah', 'Now head over to the shadowing section to record these sentences in your own voice!', 'حالا به بخش شادوئینگ بروید تا این جملات را با صدای خودتان تمرین و ضبط کنید!', 21400, 29000)
ON CONFLICT DO NOTHING;

-- کتاب 4 - درس 19: Organizational Crisis Response
INSERT INTO scenes (id, title, description, background_image_url, difficulty, status, "order", category, is_custom)
VALUES ('40004000-0000-0000-0000-001900000001', 'Organizational Crisis Response (Book 4 - Unit 19)', 'تمرین شادوئینگ یونیت 19 کتاب 4 (مدیریت بحران سازمانی): synthesize, underpin, yield, allocate, benchmark, catalyze...', '', 'advanced', 'published', 419, 'education', false)
ON CONFLICT (id) DO NOTHING;

INSERT INTO hotspots (id, scene_id, name, x_position, y_position, order_index)
VALUES ('40004000-0000-0000-0000-001900000002', '40004000-0000-0000-0000-001900000001', 'Dialogue', 50.0, 50.0, 1)
ON CONFLICT (id) DO NOTHING;

INSERT INTO dialogues (id, hotspot_id, "order", speaker, original_text, translation, audio_url, display_type)
VALUES
('40004000-0000-0000-0001-001900000001', '40004000-0000-0000-0000-001900000002', 1, 'customer', 'Exploring organizational crisis response offers a great opportunity to master essential vocabulary.', 'بررسی موضوع مدیریت بحران سازمانی فرصتی عالی برای تسلط بر واژگان ضروری به شمار می‌رود.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full'),
('40004000-0000-0000-0001-001900000002', '40004000-0000-0000-0000-001900000002', 2, 'clerk', 'Native speakers naturally use target words like synthesize and underpin in conversation.', 'گویندگان نیتیو کلماتی چون synthesize (ترکیب و تلفیق نظام‌مند) و underpin (تقویت شالوده فکری) را به صورت طبیعی در مکالمه به کار می‌برند.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full'),
('40004000-0000-0000-0001-001900000003', '40004000-0000-0000-0000-001900000002', 3, 'customer', 'Practicing sentence by sentence with clear pronunciation builds real conversational fluency.', 'تمرین جمله‌به‌جمله با تلفظ شفاف، تسلط و روانی واقعی در گفتار ایجاد می‌کند.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full'),
('40004000-0000-0000-0001-001900000004', '40004000-0000-0000-0000-001900000002', 4, 'clerk', 'Staying calm and consistent turns difficult phrases into everyday speech habits.', 'آرامش و استمرار در تمرین، عبارات دشوار را به عادت‌های گفتاری روزمره بدل می‌سازد.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full'),
('40004000-0000-0000-0001-001900000005', '40004000-0000-0000-0000-001900000002', 5, 'customer', 'Completing this unit brings us closer to full mastery of English vocabulary.', 'تکمیل این درس ما را به تسلط کامل بر دایره واژگان انگلیسی نزدیک‌تر می‌کند.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full')
ON CONFLICT (id) DO NOTHING;

INSERT INTO podcasts (id, title, description_fa, level, kind, series_id, episode_no, audio_url, audio_status, is_active, duration_seconds, position, vocabulary, scene_id)
VALUES ('40004000-0000-0000-0000-001900000003', 'Organizational Crisis Response (Book 4 - Unit 19)', 'روایت داستانی و آموزش واژگان یونیت 19 (مدیریت بحران سازمانی) از کتاب 4 دوره ۴۰۰۰ واژه', 'advanced', 'lesson', '40000000-0004-0000-0000-000000000004', 19, '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'ready', TRUE, 338, 19, '[{"word": "synthesize", "meaning_fa": "ترکیب و تلفیق نظام‌مند"}, {"word": "underpin", "meaning_fa": "تقویت شالوده فکری"}, {"word": "yield", "meaning_fa": "بازدهی و ثمردهی بالا"}, {"word": "allocate", "meaning_fa": "تخصیص بهینه منابع"}, {"word": "benchmark", "meaning_fa": "معیار سنجش مرجع"}, {"word": "catalyze", "meaning_fa": "شتاب‌بخشی تحول"}, {"word": "differentiate", "meaning_fa": "متمایزسازی رقابتی"}, {"word": "exemplify", "meaning_fa": "نمونه بارز بودن"}, {"word": "formulate", "meaning_fa": "تدوین منسجم"}, {"word": "gauge", "meaning_fa": "سنجش و برآورد دقیق"}, {"word": "harmonize", "meaning_fa": "هماهنگ‌سازی چندبعدی"}, {"word": "innovate", "meaning_fa": "نوآوری ارزش‌آفرین"}, {"word": "leverage", "meaning_fa": "اهرم قرار دادن مزیت"}, {"word": "mitigate", "meaning_fa": "کاهش اثرات ریسک"}, {"word": "navigate", "meaning_fa": "هدایت در شرایط عدم قطعیت"}, {"word": "orchestrate", "meaning_fa": "هماهنگی دقیق فرایندها"}, {"word": "pioneer", "meaning_fa": "پیشگامی در عرصه"}, {"word": "quantify", "meaning_fa": "محاسبه کمی دقیق"}, {"word": "reconcile", "meaning_fa": "وفاق دادن دیدگاه‌ها"}, {"word": "substantiate", "meaning_fa": "مستندسازی و اثبات"}]'::jsonb, '40004000-0000-0000-0000-001900000001')
ON CONFLICT (id) DO UPDATE SET scene_id = EXCLUDED.scene_id, vocabulary = EXCLUDED.vocabulary;

INSERT INTO podcast_lines (podcast_id, position, speaker, text, translation_fa, start_ms, end_ms)
VALUES
('40004000-0000-0000-0000-001900000003', 0, 'Alex', 'Welcome to 4000 Essential English Words, Book 4, Unit 19: Organizational Crisis Response.', 'به درس 19 از کتاب 4 دوره ۴۰۰۰ واژه خوش آمدید: مدیریت بحران سازمانی.', 0, 6000),
('40004000-0000-0000-0000-001900000003', 1, 'Sarah', 'Today we focus on 20 high-frequency vocabulary words used in real-life contexts.', 'امروز بر روی 20 واژه پرکاربرد در موقعیت‌های واقعی تمرکز می‌کنیم.', 6300, 13500),
('40004000-0000-0000-0000-001900000003', 2, 'Alex', 'Listen closely to the natural rhythm and pronunciation of each target phrase.', 'به ریتم طبیعی و تلفظ دقیق هر عبارت هدف خوب گوش فرا دهید.', 13800, 21000),
('40004000-0000-0000-0000-001900000003', 3, 'Sarah', 'Now head over to the shadowing section to record these sentences in your own voice!', 'حالا به بخش شادوئینگ بروید تا این جملات را با صدای خودتان تمرین و ضبط کنید!', 21400, 29000)
ON CONFLICT DO NOTHING;

-- کتاب 4 - درس 20: Public Policy Assessment
INSERT INTO scenes (id, title, description, background_image_url, difficulty, status, "order", category, is_custom)
VALUES ('40004000-0000-0000-0000-002000000001', 'Public Policy Assessment (Book 4 - Unit 20)', 'تمرین شادوئینگ یونیت 20 کتاب 4 (ارزیابی سیاست‌های عمومی): allocate, benchmark, catalyze, differentiate, exemplify, formulate...', '', 'advanced', 'published', 420, 'education', false)
ON CONFLICT (id) DO NOTHING;

INSERT INTO hotspots (id, scene_id, name, x_position, y_position, order_index)
VALUES ('40004000-0000-0000-0000-002000000002', '40004000-0000-0000-0000-002000000001', 'Dialogue', 50.0, 50.0, 1)
ON CONFLICT (id) DO NOTHING;

INSERT INTO dialogues (id, hotspot_id, "order", speaker, original_text, translation, audio_url, display_type)
VALUES
('40004000-0000-0000-0001-002000000001', '40004000-0000-0000-0000-002000000002', 1, 'customer', 'Exploring public policy assessment offers a great opportunity to master essential vocabulary.', 'بررسی موضوع ارزیابی سیاست‌های عمومی فرصتی عالی برای تسلط بر واژگان ضروری به شمار می‌رود.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full'),
('40004000-0000-0000-0001-002000000002', '40004000-0000-0000-0000-002000000002', 2, 'clerk', 'Native speakers naturally use target words like allocate and benchmark in conversation.', 'گویندگان نیتیو کلماتی چون allocate (تخصیص بهینه منابع) و benchmark (معیار سنجش مرجع) را به صورت طبیعی در مکالمه به کار می‌برند.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full'),
('40004000-0000-0000-0001-002000000003', '40004000-0000-0000-0000-002000000002', 3, 'customer', 'Practicing sentence by sentence with clear pronunciation builds real conversational fluency.', 'تمرین جمله‌به‌جمله با تلفظ شفاف، تسلط و روانی واقعی در گفتار ایجاد می‌کند.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full'),
('40004000-0000-0000-0001-002000000004', '40004000-0000-0000-0000-002000000002', 4, 'clerk', 'Staying calm and consistent turns difficult phrases into everyday speech habits.', 'آرامش و استمرار در تمرین، عبارات دشوار را به عادت‌های گفتاری روزمره بدل می‌سازد.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full'),
('40004000-0000-0000-0001-002000000005', '40004000-0000-0000-0000-002000000002', 5, 'customer', 'Completing this unit brings us closer to full mastery of English vocabulary.', 'تکمیل این درس ما را به تسلط کامل بر دایره واژگان انگلیسی نزدیک‌تر می‌کند.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full')
ON CONFLICT (id) DO NOTHING;

INSERT INTO podcasts (id, title, description_fa, level, kind, series_id, episode_no, audio_url, audio_status, is_active, duration_seconds, position, vocabulary, scene_id)
VALUES ('40004000-0000-0000-0000-002000000003', 'Public Policy Assessment (Book 4 - Unit 20)', 'روایت داستانی و آموزش واژگان یونیت 20 (ارزیابی سیاست‌های عمومی) از کتاب 4 دوره ۴۰۰۰ واژه', 'advanced', 'lesson', '40000000-0004-0000-0000-000000000004', 20, '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'ready', TRUE, 340, 20, '[{"word": "allocate", "meaning_fa": "تخصیص بهینه منابع"}, {"word": "benchmark", "meaning_fa": "معیار سنجش مرجع"}, {"word": "catalyze", "meaning_fa": "شتاب‌بخشی تحول"}, {"word": "differentiate", "meaning_fa": "متمایزسازی رقابتی"}, {"word": "exemplify", "meaning_fa": "نمونه بارز بودن"}, {"word": "formulate", "meaning_fa": "تدوین منسجم"}, {"word": "gauge", "meaning_fa": "سنجش و برآورد دقیق"}, {"word": "harmonize", "meaning_fa": "هماهنگ‌سازی چندبعدی"}, {"word": "innovate", "meaning_fa": "نوآوری ارزش‌آفرین"}, {"word": "leverage", "meaning_fa": "اهرم قرار دادن مزیت"}, {"word": "mitigate", "meaning_fa": "کاهش اثرات ریسک"}, {"word": "navigate", "meaning_fa": "هدایت در شرایط عدم قطعیت"}, {"word": "orchestrate", "meaning_fa": "هماهنگی دقیق فرایندها"}, {"word": "pioneer", "meaning_fa": "پیشگامی در عرصه"}, {"word": "quantify", "meaning_fa": "محاسبه کمی دقیق"}, {"word": "reconcile", "meaning_fa": "وفاق دادن دیدگاه‌ها"}, {"word": "substantiate", "meaning_fa": "مستندسازی و اثبات"}, {"word": "synthesize", "meaning_fa": "ترکیب و تلفیق نظام‌مند"}, {"word": "underpin", "meaning_fa": "تقویت شالوده فکری"}, {"word": "yield", "meaning_fa": "بازدهی و ثمردهی بالا"}]'::jsonb, '40004000-0000-0000-0000-002000000001')
ON CONFLICT (id) DO UPDATE SET scene_id = EXCLUDED.scene_id, vocabulary = EXCLUDED.vocabulary;

INSERT INTO podcast_lines (podcast_id, position, speaker, text, translation_fa, start_ms, end_ms)
VALUES
('40004000-0000-0000-0000-002000000003', 0, 'Alex', 'Welcome to 4000 Essential English Words, Book 4, Unit 20: Public Policy Assessment.', 'به درس 20 از کتاب 4 دوره ۴۰۰۰ واژه خوش آمدید: ارزیابی سیاست‌های عمومی.', 0, 6000),
('40004000-0000-0000-0000-002000000003', 1, 'Sarah', 'Today we focus on 20 high-frequency vocabulary words used in real-life contexts.', 'امروز بر روی 20 واژه پرکاربرد در موقعیت‌های واقعی تمرکز می‌کنیم.', 6300, 13500),
('40004000-0000-0000-0000-002000000003', 2, 'Alex', 'Listen closely to the natural rhythm and pronunciation of each target phrase.', 'به ریتم طبیعی و تلفظ دقیق هر عبارت هدف خوب گوش فرا دهید.', 13800, 21000),
('40004000-0000-0000-0000-002000000003', 3, 'Sarah', 'Now head over to the shadowing section to record these sentences in your own voice!', 'حالا به بخش شادوئینگ بروید تا این جملات را با صدای خودتان تمرین و ضبط کنید!', 21400, 29000)
ON CONFLICT DO NOTHING;

-- کتاب 4 - درس 21: Industrial Robotics
INSERT INTO scenes (id, title, description, background_image_url, difficulty, status, "order", category, is_custom)
VALUES ('40004000-0000-0000-0000-002100000001', 'Industrial Robotics (Book 4 - Unit 21)', 'تمرین شادوئینگ یونیت 21 کتاب 4 (اتوماسیون و رباتیک صنعتی): differentiate, exemplify, formulate, gauge, harmonize, innovate...', '', 'advanced', 'published', 421, 'education', false)
ON CONFLICT (id) DO NOTHING;

INSERT INTO hotspots (id, scene_id, name, x_position, y_position, order_index)
VALUES ('40004000-0000-0000-0000-002100000002', '40004000-0000-0000-0000-002100000001', 'Dialogue', 50.0, 50.0, 1)
ON CONFLICT (id) DO NOTHING;

INSERT INTO dialogues (id, hotspot_id, "order", speaker, original_text, translation, audio_url, display_type)
VALUES
('40004000-0000-0000-0001-002100000001', '40004000-0000-0000-0000-002100000002', 1, 'customer', 'Exploring industrial robotics offers a great opportunity to master essential vocabulary.', 'بررسی موضوع اتوماسیون و رباتیک صنعتی فرصتی عالی برای تسلط بر واژگان ضروری به شمار می‌رود.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full'),
('40004000-0000-0000-0001-002100000002', '40004000-0000-0000-0000-002100000002', 2, 'clerk', 'Native speakers naturally use target words like differentiate and exemplify in conversation.', 'گویندگان نیتیو کلماتی چون differentiate (متمایزسازی رقابتی) و exemplify (نمونه بارز بودن) را به صورت طبیعی در مکالمه به کار می‌برند.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full'),
('40004000-0000-0000-0001-002100000003', '40004000-0000-0000-0000-002100000002', 3, 'customer', 'Practicing sentence by sentence with clear pronunciation builds real conversational fluency.', 'تمرین جمله‌به‌جمله با تلفظ شفاف، تسلط و روانی واقعی در گفتار ایجاد می‌کند.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full'),
('40004000-0000-0000-0001-002100000004', '40004000-0000-0000-0000-002100000002', 4, 'clerk', 'Staying calm and consistent turns difficult phrases into everyday speech habits.', 'آرامش و استمرار در تمرین، عبارات دشوار را به عادت‌های گفتاری روزمره بدل می‌سازد.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full'),
('40004000-0000-0000-0001-002100000005', '40004000-0000-0000-0000-002100000002', 5, 'customer', 'Completing this unit brings us closer to full mastery of English vocabulary.', 'تکمیل این درس ما را به تسلط کامل بر دایره واژگان انگلیسی نزدیک‌تر می‌کند.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full')
ON CONFLICT (id) DO NOTHING;

INSERT INTO podcasts (id, title, description_fa, level, kind, series_id, episode_no, audio_url, audio_status, is_active, duration_seconds, position, vocabulary, scene_id)
VALUES ('40004000-0000-0000-0000-002100000003', 'Industrial Robotics (Book 4 - Unit 21)', 'روایت داستانی و آموزش واژگان یونیت 21 (اتوماسیون و رباتیک صنعتی) از کتاب 4 دوره ۴۰۰۰ واژه', 'advanced', 'lesson', '40000000-0004-0000-0000-000000000004', 21, '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'ready', TRUE, 342, 21, '[{"word": "differentiate", "meaning_fa": "متمایزسازی رقابتی"}, {"word": "exemplify", "meaning_fa": "نمونه بارز بودن"}, {"word": "formulate", "meaning_fa": "تدوین منسجم"}, {"word": "gauge", "meaning_fa": "سنجش و برآورد دقیق"}, {"word": "harmonize", "meaning_fa": "هماهنگ‌سازی چندبعدی"}, {"word": "innovate", "meaning_fa": "نوآوری ارزش‌آفرین"}, {"word": "leverage", "meaning_fa": "اهرم قرار دادن مزیت"}, {"word": "mitigate", "meaning_fa": "کاهش اثرات ریسک"}, {"word": "navigate", "meaning_fa": "هدایت در شرایط عدم قطعیت"}, {"word": "orchestrate", "meaning_fa": "هماهنگی دقیق فرایندها"}, {"word": "pioneer", "meaning_fa": "پیشگامی در عرصه"}, {"word": "quantify", "meaning_fa": "محاسبه کمی دقیق"}, {"word": "reconcile", "meaning_fa": "وفاق دادن دیدگاه‌ها"}, {"word": "substantiate", "meaning_fa": "مستندسازی و اثبات"}, {"word": "synthesize", "meaning_fa": "ترکیب و تلفیق نظام‌مند"}, {"word": "underpin", "meaning_fa": "تقویت شالوده فکری"}, {"word": "yield", "meaning_fa": "بازدهی و ثمردهی بالا"}, {"word": "allocate", "meaning_fa": "تخصیص بهینه منابع"}, {"word": "benchmark", "meaning_fa": "معیار سنجش مرجع"}, {"word": "catalyze", "meaning_fa": "شتاب‌بخشی تحول"}]'::jsonb, '40004000-0000-0000-0000-002100000001')
ON CONFLICT (id) DO UPDATE SET scene_id = EXCLUDED.scene_id, vocabulary = EXCLUDED.vocabulary;

INSERT INTO podcast_lines (podcast_id, position, speaker, text, translation_fa, start_ms, end_ms)
VALUES
('40004000-0000-0000-0000-002100000003', 0, 'Alex', 'Welcome to 4000 Essential English Words, Book 4, Unit 21: Industrial Robotics.', 'به درس 21 از کتاب 4 دوره ۴۰۰۰ واژه خوش آمدید: اتوماسیون و رباتیک صنعتی.', 0, 6000),
('40004000-0000-0000-0000-002100000003', 1, 'Sarah', 'Today we focus on 20 high-frequency vocabulary words used in real-life contexts.', 'امروز بر روی 20 واژه پرکاربرد در موقعیت‌های واقعی تمرکز می‌کنیم.', 6300, 13500),
('40004000-0000-0000-0000-002100000003', 2, 'Alex', 'Listen closely to the natural rhythm and pronunciation of each target phrase.', 'به ریتم طبیعی و تلفظ دقیق هر عبارت هدف خوب گوش فرا دهید.', 13800, 21000),
('40004000-0000-0000-0000-002100000003', 3, 'Sarah', 'Now head over to the shadowing section to record these sentences in your own voice!', 'حالا به بخش شادوئینگ بروید تا این جملات را با صدای خودتان تمرین و ضبط کنید!', 21400, 29000)
ON CONFLICT DO NOTHING;

-- کتاب 4 - درس 22: Bioethics and Genetics
INSERT INTO scenes (id, title, description, background_image_url, difficulty, status, "order", category, is_custom)
VALUES ('40004000-0000-0000-0000-002200000001', 'Bioethics and Genetics (Book 4 - Unit 22)', 'تمرین شادوئینگ یونیت 22 کتاب 4 (اخلاق زیستی و ژنتیک): gauge, harmonize, innovate, leverage, mitigate, navigate...', '', 'advanced', 'published', 422, 'education', false)
ON CONFLICT (id) DO NOTHING;

INSERT INTO hotspots (id, scene_id, name, x_position, y_position, order_index)
VALUES ('40004000-0000-0000-0000-002200000002', '40004000-0000-0000-0000-002200000001', 'Dialogue', 50.0, 50.0, 1)
ON CONFLICT (id) DO NOTHING;

INSERT INTO dialogues (id, hotspot_id, "order", speaker, original_text, translation, audio_url, display_type)
VALUES
('40004000-0000-0000-0001-002200000001', '40004000-0000-0000-0000-002200000002', 1, 'customer', 'Exploring bioethics and genetics offers a great opportunity to master essential vocabulary.', 'بررسی موضوع اخلاق زیستی و ژنتیک فرصتی عالی برای تسلط بر واژگان ضروری به شمار می‌رود.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full'),
('40004000-0000-0000-0001-002200000002', '40004000-0000-0000-0000-002200000002', 2, 'clerk', 'Native speakers naturally use target words like gauge and harmonize in conversation.', 'گویندگان نیتیو کلماتی چون gauge (سنجش و برآورد دقیق) و harmonize (هماهنگ‌سازی چندبعدی) را به صورت طبیعی در مکالمه به کار می‌برند.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full'),
('40004000-0000-0000-0001-002200000003', '40004000-0000-0000-0000-002200000002', 3, 'customer', 'Practicing sentence by sentence with clear pronunciation builds real conversational fluency.', 'تمرین جمله‌به‌جمله با تلفظ شفاف، تسلط و روانی واقعی در گفتار ایجاد می‌کند.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full'),
('40004000-0000-0000-0001-002200000004', '40004000-0000-0000-0000-002200000002', 4, 'clerk', 'Staying calm and consistent turns difficult phrases into everyday speech habits.', 'آرامش و استمرار در تمرین، عبارات دشوار را به عادت‌های گفتاری روزمره بدل می‌سازد.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full'),
('40004000-0000-0000-0001-002200000005', '40004000-0000-0000-0000-002200000002', 5, 'customer', 'Completing this unit brings us closer to full mastery of English vocabulary.', 'تکمیل این درس ما را به تسلط کامل بر دایره واژگان انگلیسی نزدیک‌تر می‌کند.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full')
ON CONFLICT (id) DO NOTHING;

INSERT INTO podcasts (id, title, description_fa, level, kind, series_id, episode_no, audio_url, audio_status, is_active, duration_seconds, position, vocabulary, scene_id)
VALUES ('40004000-0000-0000-0000-002200000003', 'Bioethics and Genetics (Book 4 - Unit 22)', 'روایت داستانی و آموزش واژگان یونیت 22 (اخلاق زیستی و ژنتیک) از کتاب 4 دوره ۴۰۰۰ واژه', 'advanced', 'lesson', '40000000-0004-0000-0000-000000000004', 22, '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'ready', TRUE, 344, 22, '[{"word": "gauge", "meaning_fa": "سنجش و برآورد دقیق"}, {"word": "harmonize", "meaning_fa": "هماهنگ‌سازی چندبعدی"}, {"word": "innovate", "meaning_fa": "نوآوری ارزش‌آفرین"}, {"word": "leverage", "meaning_fa": "اهرم قرار دادن مزیت"}, {"word": "mitigate", "meaning_fa": "کاهش اثرات ریسک"}, {"word": "navigate", "meaning_fa": "هدایت در شرایط عدم قطعیت"}, {"word": "orchestrate", "meaning_fa": "هماهنگی دقیق فرایندها"}, {"word": "pioneer", "meaning_fa": "پیشگامی در عرصه"}, {"word": "quantify", "meaning_fa": "محاسبه کمی دقیق"}, {"word": "reconcile", "meaning_fa": "وفاق دادن دیدگاه‌ها"}, {"word": "substantiate", "meaning_fa": "مستندسازی و اثبات"}, {"word": "synthesize", "meaning_fa": "ترکیب و تلفیق نظام‌مند"}, {"word": "underpin", "meaning_fa": "تقویت شالوده فکری"}, {"word": "yield", "meaning_fa": "بازدهی و ثمردهی بالا"}, {"word": "allocate", "meaning_fa": "تخصیص بهینه منابع"}, {"word": "benchmark", "meaning_fa": "معیار سنجش مرجع"}, {"word": "catalyze", "meaning_fa": "شتاب‌بخشی تحول"}, {"word": "differentiate", "meaning_fa": "متمایزسازی رقابتی"}, {"word": "exemplify", "meaning_fa": "نمونه بارز بودن"}, {"word": "formulate", "meaning_fa": "تدوین منسجم"}]'::jsonb, '40004000-0000-0000-0000-002200000001')
ON CONFLICT (id) DO UPDATE SET scene_id = EXCLUDED.scene_id, vocabulary = EXCLUDED.vocabulary;

INSERT INTO podcast_lines (podcast_id, position, speaker, text, translation_fa, start_ms, end_ms)
VALUES
('40004000-0000-0000-0000-002200000003', 0, 'Alex', 'Welcome to 4000 Essential English Words, Book 4, Unit 22: Bioethics and Genetics.', 'به درس 22 از کتاب 4 دوره ۴۰۰۰ واژه خوش آمدید: اخلاق زیستی و ژنتیک.', 0, 6000),
('40004000-0000-0000-0000-002200000003', 1, 'Sarah', 'Today we focus on 20 high-frequency vocabulary words used in real-life contexts.', 'امروز بر روی 20 واژه پرکاربرد در موقعیت‌های واقعی تمرکز می‌کنیم.', 6300, 13500),
('40004000-0000-0000-0000-002200000003', 2, 'Alex', 'Listen closely to the natural rhythm and pronunciation of each target phrase.', 'به ریتم طبیعی و تلفظ دقیق هر عبارت هدف خوب گوش فرا دهید.', 13800, 21000),
('40004000-0000-0000-0000-002200000003', 3, 'Sarah', 'Now head over to the shadowing section to record these sentences in your own voice!', 'حالا به بخش شادوئینگ بروید تا این جملات را با صدای خودتان تمرین و ضبط کنید!', 21400, 29000)
ON CONFLICT DO NOTHING;

-- کتاب 4 - درس 23: Global Maritime Trade
INSERT INTO scenes (id, title, description, background_image_url, difficulty, status, "order", category, is_custom)
VALUES ('40004000-0000-0000-0000-002300000001', 'Global Maritime Trade (Book 4 - Unit 23)', 'تمرین شادوئینگ یونیت 23 کتاب 4 (تجارت دریایی بین‌المللی): leverage, mitigate, navigate, orchestrate, pioneer, quantify...', '', 'advanced', 'published', 423, 'education', false)
ON CONFLICT (id) DO NOTHING;

INSERT INTO hotspots (id, scene_id, name, x_position, y_position, order_index)
VALUES ('40004000-0000-0000-0000-002300000002', '40004000-0000-0000-0000-002300000001', 'Dialogue', 50.0, 50.0, 1)
ON CONFLICT (id) DO NOTHING;

INSERT INTO dialogues (id, hotspot_id, "order", speaker, original_text, translation, audio_url, display_type)
VALUES
('40004000-0000-0000-0001-002300000001', '40004000-0000-0000-0000-002300000002', 1, 'customer', 'Exploring global maritime trade offers a great opportunity to master essential vocabulary.', 'بررسی موضوع تجارت دریایی بین‌المللی فرصتی عالی برای تسلط بر واژگان ضروری به شمار می‌رود.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full'),
('40004000-0000-0000-0001-002300000002', '40004000-0000-0000-0000-002300000002', 2, 'clerk', 'Native speakers naturally use target words like leverage and mitigate in conversation.', 'گویندگان نیتیو کلماتی چون leverage (اهرم قرار دادن مزیت) و mitigate (کاهش اثرات ریسک) را به صورت طبیعی در مکالمه به کار می‌برند.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full'),
('40004000-0000-0000-0001-002300000003', '40004000-0000-0000-0000-002300000002', 3, 'customer', 'Practicing sentence by sentence with clear pronunciation builds real conversational fluency.', 'تمرین جمله‌به‌جمله با تلفظ شفاف، تسلط و روانی واقعی در گفتار ایجاد می‌کند.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full'),
('40004000-0000-0000-0001-002300000004', '40004000-0000-0000-0000-002300000002', 4, 'clerk', 'Staying calm and consistent turns difficult phrases into everyday speech habits.', 'آرامش و استمرار در تمرین، عبارات دشوار را به عادت‌های گفتاری روزمره بدل می‌سازد.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full'),
('40004000-0000-0000-0001-002300000005', '40004000-0000-0000-0000-002300000002', 5, 'customer', 'Completing this unit brings us closer to full mastery of English vocabulary.', 'تکمیل این درس ما را به تسلط کامل بر دایره واژگان انگلیسی نزدیک‌تر می‌کند.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full')
ON CONFLICT (id) DO NOTHING;

INSERT INTO podcasts (id, title, description_fa, level, kind, series_id, episode_no, audio_url, audio_status, is_active, duration_seconds, position, vocabulary, scene_id)
VALUES ('40004000-0000-0000-0000-002300000003', 'Global Maritime Trade (Book 4 - Unit 23)', 'روایت داستانی و آموزش واژگان یونیت 23 (تجارت دریایی بین‌المللی) از کتاب 4 دوره ۴۰۰۰ واژه', 'advanced', 'lesson', '40000000-0004-0000-0000-000000000004', 23, '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'ready', TRUE, 346, 23, '[{"word": "leverage", "meaning_fa": "اهرم قرار دادن مزیت"}, {"word": "mitigate", "meaning_fa": "کاهش اثرات ریسک"}, {"word": "navigate", "meaning_fa": "هدایت در شرایط عدم قطعیت"}, {"word": "orchestrate", "meaning_fa": "هماهنگی دقیق فرایندها"}, {"word": "pioneer", "meaning_fa": "پیشگامی در عرصه"}, {"word": "quantify", "meaning_fa": "محاسبه کمی دقیق"}, {"word": "reconcile", "meaning_fa": "وفاق دادن دیدگاه‌ها"}, {"word": "substantiate", "meaning_fa": "مستندسازی و اثبات"}, {"word": "synthesize", "meaning_fa": "ترکیب و تلفیق نظام‌مند"}, {"word": "underpin", "meaning_fa": "تقویت شالوده فکری"}, {"word": "yield", "meaning_fa": "بازدهی و ثمردهی بالا"}, {"word": "allocate", "meaning_fa": "تخصیص بهینه منابع"}, {"word": "benchmark", "meaning_fa": "معیار سنجش مرجع"}, {"word": "catalyze", "meaning_fa": "شتاب‌بخشی تحول"}, {"word": "differentiate", "meaning_fa": "متمایزسازی رقابتی"}, {"word": "exemplify", "meaning_fa": "نمونه بارز بودن"}, {"word": "formulate", "meaning_fa": "تدوین منسجم"}, {"word": "gauge", "meaning_fa": "سنجش و برآورد دقیق"}, {"word": "harmonize", "meaning_fa": "هماهنگ‌سازی چندبعدی"}, {"word": "innovate", "meaning_fa": "نوآوری ارزش‌آفرین"}]'::jsonb, '40004000-0000-0000-0000-002300000001')
ON CONFLICT (id) DO UPDATE SET scene_id = EXCLUDED.scene_id, vocabulary = EXCLUDED.vocabulary;

INSERT INTO podcast_lines (podcast_id, position, speaker, text, translation_fa, start_ms, end_ms)
VALUES
('40004000-0000-0000-0000-002300000003', 0, 'Alex', 'Welcome to 4000 Essential English Words, Book 4, Unit 23: Global Maritime Trade.', 'به درس 23 از کتاب 4 دوره ۴۰۰۰ واژه خوش آمدید: تجارت دریایی بین‌المللی.', 0, 6000),
('40004000-0000-0000-0000-002300000003', 1, 'Sarah', 'Today we focus on 20 high-frequency vocabulary words used in real-life contexts.', 'امروز بر روی 20 واژه پرکاربرد در موقعیت‌های واقعی تمرکز می‌کنیم.', 6300, 13500),
('40004000-0000-0000-0000-002300000003', 2, 'Alex', 'Listen closely to the natural rhythm and pronunciation of each target phrase.', 'به ریتم طبیعی و تلفظ دقیق هر عبارت هدف خوب گوش فرا دهید.', 13800, 21000),
('40004000-0000-0000-0000-002300000003', 3, 'Sarah', 'Now head over to the shadowing section to record these sentences in your own voice!', 'حالا به بخش شادوئینگ بروید تا این جملات را با صدای خودتان تمرین و ضبط کنید!', 21400, 29000)
ON CONFLICT DO NOTHING;

-- کتاب 4 - درس 24: Clean Infrastructure Finance
INSERT INTO scenes (id, title, description, background_image_url, difficulty, status, "order", category, is_custom)
VALUES ('40004000-0000-0000-0000-002400000001', 'Clean Infrastructure Finance (Book 4 - Unit 24)', 'تمرین شادوئینگ یونیت 24 کتاب 4 (تامین مالی زیرساخت سبز): orchestrate, pioneer, quantify, reconcile, substantiate, synthesize...', '', 'advanced', 'published', 424, 'education', false)
ON CONFLICT (id) DO NOTHING;

INSERT INTO hotspots (id, scene_id, name, x_position, y_position, order_index)
VALUES ('40004000-0000-0000-0000-002400000002', '40004000-0000-0000-0000-002400000001', 'Dialogue', 50.0, 50.0, 1)
ON CONFLICT (id) DO NOTHING;

INSERT INTO dialogues (id, hotspot_id, "order", speaker, original_text, translation, audio_url, display_type)
VALUES
('40004000-0000-0000-0001-002400000001', '40004000-0000-0000-0000-002400000002', 1, 'customer', 'Exploring clean infrastructure finance offers a great opportunity to master essential vocabulary.', 'بررسی موضوع تامین مالی زیرساخت سبز فرصتی عالی برای تسلط بر واژگان ضروری به شمار می‌رود.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full'),
('40004000-0000-0000-0001-002400000002', '40004000-0000-0000-0000-002400000002', 2, 'clerk', 'Native speakers naturally use target words like orchestrate and pioneer in conversation.', 'گویندگان نیتیو کلماتی چون orchestrate (هماهنگی دقیق فرایندها) و pioneer (پیشگامی در عرصه) را به صورت طبیعی در مکالمه به کار می‌برند.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full'),
('40004000-0000-0000-0001-002400000003', '40004000-0000-0000-0000-002400000002', 3, 'customer', 'Practicing sentence by sentence with clear pronunciation builds real conversational fluency.', 'تمرین جمله‌به‌جمله با تلفظ شفاف، تسلط و روانی واقعی در گفتار ایجاد می‌کند.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full'),
('40004000-0000-0000-0001-002400000004', '40004000-0000-0000-0000-002400000002', 4, 'clerk', 'Staying calm and consistent turns difficult phrases into everyday speech habits.', 'آرامش و استمرار در تمرین، عبارات دشوار را به عادت‌های گفتاری روزمره بدل می‌سازد.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full'),
('40004000-0000-0000-0001-002400000005', '40004000-0000-0000-0000-002400000002', 5, 'customer', 'Completing this unit brings us closer to full mastery of English vocabulary.', 'تکمیل این درس ما را به تسلط کامل بر دایره واژگان انگلیسی نزدیک‌تر می‌کند.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full')
ON CONFLICT (id) DO NOTHING;

INSERT INTO podcasts (id, title, description_fa, level, kind, series_id, episode_no, audio_url, audio_status, is_active, duration_seconds, position, vocabulary, scene_id)
VALUES ('40004000-0000-0000-0000-002400000003', 'Clean Infrastructure Finance (Book 4 - Unit 24)', 'روایت داستانی و آموزش واژگان یونیت 24 (تامین مالی زیرساخت سبز) از کتاب 4 دوره ۴۰۰۰ واژه', 'advanced', 'lesson', '40000000-0004-0000-0000-000000000004', 24, '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'ready', TRUE, 348, 24, '[{"word": "orchestrate", "meaning_fa": "هماهنگی دقیق فرایندها"}, {"word": "pioneer", "meaning_fa": "پیشگامی در عرصه"}, {"word": "quantify", "meaning_fa": "محاسبه کمی دقیق"}, {"word": "reconcile", "meaning_fa": "وفاق دادن دیدگاه‌ها"}, {"word": "substantiate", "meaning_fa": "مستندسازی و اثبات"}, {"word": "synthesize", "meaning_fa": "ترکیب و تلفیق نظام‌مند"}, {"word": "underpin", "meaning_fa": "تقویت شالوده فکری"}, {"word": "yield", "meaning_fa": "بازدهی و ثمردهی بالا"}, {"word": "allocate", "meaning_fa": "تخصیص بهینه منابع"}, {"word": "benchmark", "meaning_fa": "معیار سنجش مرجع"}, {"word": "catalyze", "meaning_fa": "شتاب‌بخشی تحول"}, {"word": "differentiate", "meaning_fa": "متمایزسازی رقابتی"}, {"word": "exemplify", "meaning_fa": "نمونه بارز بودن"}, {"word": "formulate", "meaning_fa": "تدوین منسجم"}, {"word": "gauge", "meaning_fa": "سنجش و برآورد دقیق"}, {"word": "harmonize", "meaning_fa": "هماهنگ‌سازی چندبعدی"}, {"word": "innovate", "meaning_fa": "نوآوری ارزش‌آفرین"}, {"word": "leverage", "meaning_fa": "اهرم قرار دادن مزیت"}, {"word": "mitigate", "meaning_fa": "کاهش اثرات ریسک"}, {"word": "navigate", "meaning_fa": "هدایت در شرایط عدم قطعیت"}]'::jsonb, '40004000-0000-0000-0000-002400000001')
ON CONFLICT (id) DO UPDATE SET scene_id = EXCLUDED.scene_id, vocabulary = EXCLUDED.vocabulary;

INSERT INTO podcast_lines (podcast_id, position, speaker, text, translation_fa, start_ms, end_ms)
VALUES
('40004000-0000-0000-0000-002400000003', 0, 'Alex', 'Welcome to 4000 Essential English Words, Book 4, Unit 24: Clean Infrastructure Finance.', 'به درس 24 از کتاب 4 دوره ۴۰۰۰ واژه خوش آمدید: تامین مالی زیرساخت سبز.', 0, 6000),
('40004000-0000-0000-0000-002400000003', 1, 'Sarah', 'Today we focus on 20 high-frequency vocabulary words used in real-life contexts.', 'امروز بر روی 20 واژه پرکاربرد در موقعیت‌های واقعی تمرکز می‌کنیم.', 6300, 13500),
('40004000-0000-0000-0000-002400000003', 2, 'Alex', 'Listen closely to the natural rhythm and pronunciation of each target phrase.', 'به ریتم طبیعی و تلفظ دقیق هر عبارت هدف خوب گوش فرا دهید.', 13800, 21000),
('40004000-0000-0000-0000-002400000003', 3, 'Sarah', 'Now head over to the shadowing section to record these sentences in your own voice!', 'حالا به بخش شادوئینگ بروید تا این جملات را با صدای خودتان تمرین و ضبط کنید!', 21400, 29000)
ON CONFLICT DO NOTHING;

-- کتاب 4 - درس 25: Forensic Science Standards
INSERT INTO scenes (id, title, description, background_image_url, difficulty, status, "order", category, is_custom)
VALUES ('40004000-0000-0000-0000-002500000001', 'Forensic Science Standards (Book 4 - Unit 25)', 'تمرین شادوئینگ یونیت 25 کتاب 4 (استانداردهای جرم‌شناسی علمی): reconcile, substantiate, synthesize, underpin, yield, allocate...', '', 'advanced', 'published', 425, 'education', false)
ON CONFLICT (id) DO NOTHING;

INSERT INTO hotspots (id, scene_id, name, x_position, y_position, order_index)
VALUES ('40004000-0000-0000-0000-002500000002', '40004000-0000-0000-0000-002500000001', 'Dialogue', 50.0, 50.0, 1)
ON CONFLICT (id) DO NOTHING;

INSERT INTO dialogues (id, hotspot_id, "order", speaker, original_text, translation, audio_url, display_type)
VALUES
('40004000-0000-0000-0001-002500000001', '40004000-0000-0000-0000-002500000002', 1, 'customer', 'Exploring forensic science standards offers a great opportunity to master essential vocabulary.', 'بررسی موضوع استانداردهای جرم‌شناسی علمی فرصتی عالی برای تسلط بر واژگان ضروری به شمار می‌رود.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full'),
('40004000-0000-0000-0001-002500000002', '40004000-0000-0000-0000-002500000002', 2, 'clerk', 'Native speakers naturally use target words like reconcile and substantiate in conversation.', 'گویندگان نیتیو کلماتی چون reconcile (وفاق دادن دیدگاه‌ها) و substantiate (مستندسازی و اثبات) را به صورت طبیعی در مکالمه به کار می‌برند.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full'),
('40004000-0000-0000-0001-002500000003', '40004000-0000-0000-0000-002500000002', 3, 'customer', 'Practicing sentence by sentence with clear pronunciation builds real conversational fluency.', 'تمرین جمله‌به‌جمله با تلفظ شفاف، تسلط و روانی واقعی در گفتار ایجاد می‌کند.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full'),
('40004000-0000-0000-0001-002500000004', '40004000-0000-0000-0000-002500000002', 4, 'clerk', 'Staying calm and consistent turns difficult phrases into everyday speech habits.', 'آرامش و استمرار در تمرین، عبارات دشوار را به عادت‌های گفتاری روزمره بدل می‌سازد.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full'),
('40004000-0000-0000-0001-002500000005', '40004000-0000-0000-0000-002500000002', 5, 'customer', 'Completing this unit brings us closer to full mastery of English vocabulary.', 'تکمیل این درس ما را به تسلط کامل بر دایره واژگان انگلیسی نزدیک‌تر می‌کند.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full')
ON CONFLICT (id) DO NOTHING;

INSERT INTO podcasts (id, title, description_fa, level, kind, series_id, episode_no, audio_url, audio_status, is_active, duration_seconds, position, vocabulary, scene_id)
VALUES ('40004000-0000-0000-0000-002500000003', 'Forensic Science Standards (Book 4 - Unit 25)', 'روایت داستانی و آموزش واژگان یونیت 25 (استانداردهای جرم‌شناسی علمی) از کتاب 4 دوره ۴۰۰۰ واژه', 'advanced', 'lesson', '40000000-0004-0000-0000-000000000004', 25, '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'ready', TRUE, 350, 25, '[{"word": "reconcile", "meaning_fa": "وفاق دادن دیدگاه‌ها"}, {"word": "substantiate", "meaning_fa": "مستندسازی و اثبات"}, {"word": "synthesize", "meaning_fa": "ترکیب و تلفیق نظام‌مند"}, {"word": "underpin", "meaning_fa": "تقویت شالوده فکری"}, {"word": "yield", "meaning_fa": "بازدهی و ثمردهی بالا"}, {"word": "allocate", "meaning_fa": "تخصیص بهینه منابع"}, {"word": "benchmark", "meaning_fa": "معیار سنجش مرجع"}, {"word": "catalyze", "meaning_fa": "شتاب‌بخشی تحول"}, {"word": "differentiate", "meaning_fa": "متمایزسازی رقابتی"}, {"word": "exemplify", "meaning_fa": "نمونه بارز بودن"}, {"word": "formulate", "meaning_fa": "تدوین منسجم"}, {"word": "gauge", "meaning_fa": "سنجش و برآورد دقیق"}, {"word": "harmonize", "meaning_fa": "هماهنگ‌سازی چندبعدی"}, {"word": "innovate", "meaning_fa": "نوآوری ارزش‌آفرین"}, {"word": "leverage", "meaning_fa": "اهرم قرار دادن مزیت"}, {"word": "mitigate", "meaning_fa": "کاهش اثرات ریسک"}, {"word": "navigate", "meaning_fa": "هدایت در شرایط عدم قطعیت"}, {"word": "orchestrate", "meaning_fa": "هماهنگی دقیق فرایندها"}, {"word": "pioneer", "meaning_fa": "پیشگامی در عرصه"}, {"word": "quantify", "meaning_fa": "محاسبه کمی دقیق"}]'::jsonb, '40004000-0000-0000-0000-002500000001')
ON CONFLICT (id) DO UPDATE SET scene_id = EXCLUDED.scene_id, vocabulary = EXCLUDED.vocabulary;

INSERT INTO podcast_lines (podcast_id, position, speaker, text, translation_fa, start_ms, end_ms)
VALUES
('40004000-0000-0000-0000-002500000003', 0, 'Alex', 'Welcome to 4000 Essential English Words, Book 4, Unit 25: Forensic Science Standards.', 'به درس 25 از کتاب 4 دوره ۴۰۰۰ واژه خوش آمدید: استانداردهای جرم‌شناسی علمی.', 0, 6000),
('40004000-0000-0000-0000-002500000003', 1, 'Sarah', 'Today we focus on 20 high-frequency vocabulary words used in real-life contexts.', 'امروز بر روی 20 واژه پرکاربرد در موقعیت‌های واقعی تمرکز می‌کنیم.', 6300, 13500),
('40004000-0000-0000-0000-002500000003', 2, 'Alex', 'Listen closely to the natural rhythm and pronunciation of each target phrase.', 'به ریتم طبیعی و تلفظ دقیق هر عبارت هدف خوب گوش فرا دهید.', 13800, 21000),
('40004000-0000-0000-0000-002500000003', 3, 'Sarah', 'Now head over to the shadowing section to record these sentences in your own voice!', 'حالا به بخش شادوئینگ بروید تا این جملات را با صدای خودتان تمرین و ضبط کنید!', 21400, 29000)
ON CONFLICT DO NOTHING;

-- کتاب 4 - درس 26: Decision Theory Analytics
INSERT INTO scenes (id, title, description, background_image_url, difficulty, status, "order", category, is_custom)
VALUES ('40004000-0000-0000-0000-002600000001', 'Decision Theory Analytics (Book 4 - Unit 26)', 'تمرین شادوئینگ یونیت 26 کتاب 4 (تحلیل نظریه تصمیم‌گیری): underpin, yield, allocate, benchmark, catalyze, differentiate...', '', 'advanced', 'published', 426, 'education', false)
ON CONFLICT (id) DO NOTHING;

INSERT INTO hotspots (id, scene_id, name, x_position, y_position, order_index)
VALUES ('40004000-0000-0000-0000-002600000002', '40004000-0000-0000-0000-002600000001', 'Dialogue', 50.0, 50.0, 1)
ON CONFLICT (id) DO NOTHING;

INSERT INTO dialogues (id, hotspot_id, "order", speaker, original_text, translation, audio_url, display_type)
VALUES
('40004000-0000-0000-0001-002600000001', '40004000-0000-0000-0000-002600000002', 1, 'customer', 'Exploring decision theory analytics offers a great opportunity to master essential vocabulary.', 'بررسی موضوع تحلیل نظریه تصمیم‌گیری فرصتی عالی برای تسلط بر واژگان ضروری به شمار می‌رود.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full'),
('40004000-0000-0000-0001-002600000002', '40004000-0000-0000-0000-002600000002', 2, 'clerk', 'Native speakers naturally use target words like underpin and yield in conversation.', 'گویندگان نیتیو کلماتی چون underpin (تقویت شالوده فکری) و yield (بازدهی و ثمردهی بالا) را به صورت طبیعی در مکالمه به کار می‌برند.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full'),
('40004000-0000-0000-0001-002600000003', '40004000-0000-0000-0000-002600000002', 3, 'customer', 'Practicing sentence by sentence with clear pronunciation builds real conversational fluency.', 'تمرین جمله‌به‌جمله با تلفظ شفاف، تسلط و روانی واقعی در گفتار ایجاد می‌کند.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full'),
('40004000-0000-0000-0001-002600000004', '40004000-0000-0000-0000-002600000002', 4, 'clerk', 'Staying calm and consistent turns difficult phrases into everyday speech habits.', 'آرامش و استمرار در تمرین، عبارات دشوار را به عادت‌های گفتاری روزمره بدل می‌سازد.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full'),
('40004000-0000-0000-0001-002600000005', '40004000-0000-0000-0000-002600000002', 5, 'customer', 'Completing this unit brings us closer to full mastery of English vocabulary.', 'تکمیل این درس ما را به تسلط کامل بر دایره واژگان انگلیسی نزدیک‌تر می‌کند.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full')
ON CONFLICT (id) DO NOTHING;

INSERT INTO podcasts (id, title, description_fa, level, kind, series_id, episode_no, audio_url, audio_status, is_active, duration_seconds, position, vocabulary, scene_id)
VALUES ('40004000-0000-0000-0000-002600000003', 'Decision Theory Analytics (Book 4 - Unit 26)', 'روایت داستانی و آموزش واژگان یونیت 26 (تحلیل نظریه تصمیم‌گیری) از کتاب 4 دوره ۴۰۰۰ واژه', 'advanced', 'lesson', '40000000-0004-0000-0000-000000000004', 26, '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'ready', TRUE, 352, 26, '[{"word": "underpin", "meaning_fa": "تقویت شالوده فکری"}, {"word": "yield", "meaning_fa": "بازدهی و ثمردهی بالا"}, {"word": "allocate", "meaning_fa": "تخصیص بهینه منابع"}, {"word": "benchmark", "meaning_fa": "معیار سنجش مرجع"}, {"word": "catalyze", "meaning_fa": "شتاب‌بخشی تحول"}, {"word": "differentiate", "meaning_fa": "متمایزسازی رقابتی"}, {"word": "exemplify", "meaning_fa": "نمونه بارز بودن"}, {"word": "formulate", "meaning_fa": "تدوین منسجم"}, {"word": "gauge", "meaning_fa": "سنجش و برآورد دقیق"}, {"word": "harmonize", "meaning_fa": "هماهنگ‌سازی چندبعدی"}, {"word": "innovate", "meaning_fa": "نوآوری ارزش‌آفرین"}, {"word": "leverage", "meaning_fa": "اهرم قرار دادن مزیت"}, {"word": "mitigate", "meaning_fa": "کاهش اثرات ریسک"}, {"word": "navigate", "meaning_fa": "هدایت در شرایط عدم قطعیت"}, {"word": "orchestrate", "meaning_fa": "هماهنگی دقیق فرایندها"}, {"word": "pioneer", "meaning_fa": "پیشگامی در عرصه"}, {"word": "quantify", "meaning_fa": "محاسبه کمی دقیق"}, {"word": "reconcile", "meaning_fa": "وفاق دادن دیدگاه‌ها"}, {"word": "substantiate", "meaning_fa": "مستندسازی و اثبات"}, {"word": "synthesize", "meaning_fa": "ترکیب و تلفیق نظام‌مند"}]'::jsonb, '40004000-0000-0000-0000-002600000001')
ON CONFLICT (id) DO UPDATE SET scene_id = EXCLUDED.scene_id, vocabulary = EXCLUDED.vocabulary;

INSERT INTO podcast_lines (podcast_id, position, speaker, text, translation_fa, start_ms, end_ms)
VALUES
('40004000-0000-0000-0000-002600000003', 0, 'Alex', 'Welcome to 4000 Essential English Words, Book 4, Unit 26: Decision Theory Analytics.', 'به درس 26 از کتاب 4 دوره ۴۰۰۰ واژه خوش آمدید: تحلیل نظریه تصمیم‌گیری.', 0, 6000),
('40004000-0000-0000-0000-002600000003', 1, 'Sarah', 'Today we focus on 20 high-frequency vocabulary words used in real-life contexts.', 'امروز بر روی 20 واژه پرکاربرد در موقعیت‌های واقعی تمرکز می‌کنیم.', 6300, 13500),
('40004000-0000-0000-0000-002600000003', 2, 'Alex', 'Listen closely to the natural rhythm and pronunciation of each target phrase.', 'به ریتم طبیعی و تلفظ دقیق هر عبارت هدف خوب گوش فرا دهید.', 13800, 21000),
('40004000-0000-0000-0000-002600000003', 3, 'Sarah', 'Now head over to the shadowing section to record these sentences in your own voice!', 'حالا به بخش شادوئینگ بروید تا این جملات را با صدای خودتان تمرین و ضبط کنید!', 21400, 29000)
ON CONFLICT DO NOTHING;

-- کتاب 4 - درس 27: Mergers and Acquisitions
INSERT INTO scenes (id, title, description, background_image_url, difficulty, status, "order", category, is_custom)
VALUES ('40004000-0000-0000-0000-002700000001', 'Mergers and Acquisitions (Book 4 - Unit 27)', 'تمرین شادوئینگ یونیت 27 کتاب 4 (ادغام و تملیک شرکت‌ها): benchmark, catalyze, differentiate, exemplify, formulate, gauge...', '', 'advanced', 'published', 427, 'education', false)
ON CONFLICT (id) DO NOTHING;

INSERT INTO hotspots (id, scene_id, name, x_position, y_position, order_index)
VALUES ('40004000-0000-0000-0000-002700000002', '40004000-0000-0000-0000-002700000001', 'Dialogue', 50.0, 50.0, 1)
ON CONFLICT (id) DO NOTHING;

INSERT INTO dialogues (id, hotspot_id, "order", speaker, original_text, translation, audio_url, display_type)
VALUES
('40004000-0000-0000-0001-002700000001', '40004000-0000-0000-0000-002700000002', 1, 'customer', 'Exploring mergers and acquisitions offers a great opportunity to master essential vocabulary.', 'بررسی موضوع ادغام و تملیک شرکت‌ها فرصتی عالی برای تسلط بر واژگان ضروری به شمار می‌رود.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full'),
('40004000-0000-0000-0001-002700000002', '40004000-0000-0000-0000-002700000002', 2, 'clerk', 'Native speakers naturally use target words like benchmark and catalyze in conversation.', 'گویندگان نیتیو کلماتی چون benchmark (معیار سنجش مرجع) و catalyze (شتاب‌بخشی تحول) را به صورت طبیعی در مکالمه به کار می‌برند.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full'),
('40004000-0000-0000-0001-002700000003', '40004000-0000-0000-0000-002700000002', 3, 'customer', 'Practicing sentence by sentence with clear pronunciation builds real conversational fluency.', 'تمرین جمله‌به‌جمله با تلفظ شفاف، تسلط و روانی واقعی در گفتار ایجاد می‌کند.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full'),
('40004000-0000-0000-0001-002700000004', '40004000-0000-0000-0000-002700000002', 4, 'clerk', 'Staying calm and consistent turns difficult phrases into everyday speech habits.', 'آرامش و استمرار در تمرین، عبارات دشوار را به عادت‌های گفتاری روزمره بدل می‌سازد.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full'),
('40004000-0000-0000-0001-002700000005', '40004000-0000-0000-0000-002700000002', 5, 'customer', 'Completing this unit brings us closer to full mastery of English vocabulary.', 'تکمیل این درس ما را به تسلط کامل بر دایره واژگان انگلیسی نزدیک‌تر می‌کند.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full')
ON CONFLICT (id) DO NOTHING;

INSERT INTO podcasts (id, title, description_fa, level, kind, series_id, episode_no, audio_url, audio_status, is_active, duration_seconds, position, vocabulary, scene_id)
VALUES ('40004000-0000-0000-0000-002700000003', 'Mergers and Acquisitions (Book 4 - Unit 27)', 'روایت داستانی و آموزش واژگان یونیت 27 (ادغام و تملیک شرکت‌ها) از کتاب 4 دوره ۴۰۰۰ واژه', 'advanced', 'lesson', '40000000-0004-0000-0000-000000000004', 27, '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'ready', TRUE, 354, 27, '[{"word": "benchmark", "meaning_fa": "معیار سنجش مرجع"}, {"word": "catalyze", "meaning_fa": "شتاب‌بخشی تحول"}, {"word": "differentiate", "meaning_fa": "متمایزسازی رقابتی"}, {"word": "exemplify", "meaning_fa": "نمونه بارز بودن"}, {"word": "formulate", "meaning_fa": "تدوین منسجم"}, {"word": "gauge", "meaning_fa": "سنجش و برآورد دقیق"}, {"word": "harmonize", "meaning_fa": "هماهنگ‌سازی چندبعدی"}, {"word": "innovate", "meaning_fa": "نوآوری ارزش‌آفرین"}, {"word": "leverage", "meaning_fa": "اهرم قرار دادن مزیت"}, {"word": "mitigate", "meaning_fa": "کاهش اثرات ریسک"}, {"word": "navigate", "meaning_fa": "هدایت در شرایط عدم قطعیت"}, {"word": "orchestrate", "meaning_fa": "هماهنگی دقیق فرایندها"}, {"word": "pioneer", "meaning_fa": "پیشگامی در عرصه"}, {"word": "quantify", "meaning_fa": "محاسبه کمی دقیق"}, {"word": "reconcile", "meaning_fa": "وفاق دادن دیدگاه‌ها"}, {"word": "substantiate", "meaning_fa": "مستندسازی و اثبات"}, {"word": "synthesize", "meaning_fa": "ترکیب و تلفیق نظام‌مند"}, {"word": "underpin", "meaning_fa": "تقویت شالوده فکری"}, {"word": "yield", "meaning_fa": "بازدهی و ثمردهی بالا"}, {"word": "allocate", "meaning_fa": "تخصیص بهینه منابع"}]'::jsonb, '40004000-0000-0000-0000-002700000001')
ON CONFLICT (id) DO UPDATE SET scene_id = EXCLUDED.scene_id, vocabulary = EXCLUDED.vocabulary;

INSERT INTO podcast_lines (podcast_id, position, speaker, text, translation_fa, start_ms, end_ms)
VALUES
('40004000-0000-0000-0000-002700000003', 0, 'Alex', 'Welcome to 4000 Essential English Words, Book 4, Unit 27: Mergers and Acquisitions.', 'به درس 27 از کتاب 4 دوره ۴۰۰۰ واژه خوش آمدید: ادغام و تملیک شرکت‌ها.', 0, 6000),
('40004000-0000-0000-0000-002700000003', 1, 'Sarah', 'Today we focus on 20 high-frequency vocabulary words used in real-life contexts.', 'امروز بر روی 20 واژه پرکاربرد در موقعیت‌های واقعی تمرکز می‌کنیم.', 6300, 13500),
('40004000-0000-0000-0000-002700000003', 2, 'Alex', 'Listen closely to the natural rhythm and pronunciation of each target phrase.', 'به ریتم طبیعی و تلفظ دقیق هر عبارت هدف خوب گوش فرا دهید.', 13800, 21000),
('40004000-0000-0000-0000-002700000003', 3, 'Sarah', 'Now head over to the shadowing section to record these sentences in your own voice!', 'حالا به بخش شادوئینگ بروید تا این جملات را با صدای خودتان تمرین و ضبط کنید!', 21400, 29000)
ON CONFLICT DO NOTHING;

-- کتاب 4 - درس 28: Urban Mobility Transition
INSERT INTO scenes (id, title, description, background_image_url, difficulty, status, "order", category, is_custom)
VALUES ('40004000-0000-0000-0000-002800000001', 'Urban Mobility Transition (Book 4 - Unit 28)', 'تمرین شادوئینگ یونیت 28 کتاب 4 (حمل‌ونقل پاک شهری): exemplify, formulate, gauge, harmonize, innovate, leverage...', '', 'advanced', 'published', 428, 'education', false)
ON CONFLICT (id) DO NOTHING;

INSERT INTO hotspots (id, scene_id, name, x_position, y_position, order_index)
VALUES ('40004000-0000-0000-0000-002800000002', '40004000-0000-0000-0000-002800000001', 'Dialogue', 50.0, 50.0, 1)
ON CONFLICT (id) DO NOTHING;

INSERT INTO dialogues (id, hotspot_id, "order", speaker, original_text, translation, audio_url, display_type)
VALUES
('40004000-0000-0000-0001-002800000001', '40004000-0000-0000-0000-002800000002', 1, 'customer', 'Exploring urban mobility transition offers a great opportunity to master essential vocabulary.', 'بررسی موضوع حمل‌ونقل پاک شهری فرصتی عالی برای تسلط بر واژگان ضروری به شمار می‌رود.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full'),
('40004000-0000-0000-0001-002800000002', '40004000-0000-0000-0000-002800000002', 2, 'clerk', 'Native speakers naturally use target words like exemplify and formulate in conversation.', 'گویندگان نیتیو کلماتی چون exemplify (نمونه بارز بودن) و formulate (تدوین منسجم) را به صورت طبیعی در مکالمه به کار می‌برند.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full'),
('40004000-0000-0000-0001-002800000003', '40004000-0000-0000-0000-002800000002', 3, 'customer', 'Practicing sentence by sentence with clear pronunciation builds real conversational fluency.', 'تمرین جمله‌به‌جمله با تلفظ شفاف، تسلط و روانی واقعی در گفتار ایجاد می‌کند.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full'),
('40004000-0000-0000-0001-002800000004', '40004000-0000-0000-0000-002800000002', 4, 'clerk', 'Staying calm and consistent turns difficult phrases into everyday speech habits.', 'آرامش و استمرار در تمرین، عبارات دشوار را به عادت‌های گفتاری روزمره بدل می‌سازد.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full'),
('40004000-0000-0000-0001-002800000005', '40004000-0000-0000-0000-002800000002', 5, 'customer', 'Completing this unit brings us closer to full mastery of English vocabulary.', 'تکمیل این درس ما را به تسلط کامل بر دایره واژگان انگلیسی نزدیک‌تر می‌کند.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full')
ON CONFLICT (id) DO NOTHING;

INSERT INTO podcasts (id, title, description_fa, level, kind, series_id, episode_no, audio_url, audio_status, is_active, duration_seconds, position, vocabulary, scene_id)
VALUES ('40004000-0000-0000-0000-002800000003', 'Urban Mobility Transition (Book 4 - Unit 28)', 'روایت داستانی و آموزش واژگان یونیت 28 (حمل‌ونقل پاک شهری) از کتاب 4 دوره ۴۰۰۰ واژه', 'advanced', 'lesson', '40000000-0004-0000-0000-000000000004', 28, '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'ready', TRUE, 356, 28, '[{"word": "exemplify", "meaning_fa": "نمونه بارز بودن"}, {"word": "formulate", "meaning_fa": "تدوین منسجم"}, {"word": "gauge", "meaning_fa": "سنجش و برآورد دقیق"}, {"word": "harmonize", "meaning_fa": "هماهنگ‌سازی چندبعدی"}, {"word": "innovate", "meaning_fa": "نوآوری ارزش‌آفرین"}, {"word": "leverage", "meaning_fa": "اهرم قرار دادن مزیت"}, {"word": "mitigate", "meaning_fa": "کاهش اثرات ریسک"}, {"word": "navigate", "meaning_fa": "هدایت در شرایط عدم قطعیت"}, {"word": "orchestrate", "meaning_fa": "هماهنگی دقیق فرایندها"}, {"word": "pioneer", "meaning_fa": "پیشگامی در عرصه"}, {"word": "quantify", "meaning_fa": "محاسبه کمی دقیق"}, {"word": "reconcile", "meaning_fa": "وفاق دادن دیدگاه‌ها"}, {"word": "substantiate", "meaning_fa": "مستندسازی و اثبات"}, {"word": "synthesize", "meaning_fa": "ترکیب و تلفیق نظام‌مند"}, {"word": "underpin", "meaning_fa": "تقویت شالوده فکری"}, {"word": "yield", "meaning_fa": "بازدهی و ثمردهی بالا"}, {"word": "allocate", "meaning_fa": "تخصیص بهینه منابع"}, {"word": "benchmark", "meaning_fa": "معیار سنجش مرجع"}, {"word": "catalyze", "meaning_fa": "شتاب‌بخشی تحول"}, {"word": "differentiate", "meaning_fa": "متمایزسازی رقابتی"}]'::jsonb, '40004000-0000-0000-0000-002800000001')
ON CONFLICT (id) DO UPDATE SET scene_id = EXCLUDED.scene_id, vocabulary = EXCLUDED.vocabulary;

INSERT INTO podcast_lines (podcast_id, position, speaker, text, translation_fa, start_ms, end_ms)
VALUES
('40004000-0000-0000-0000-002800000003', 0, 'Alex', 'Welcome to 4000 Essential English Words, Book 4, Unit 28: Urban Mobility Transition.', 'به درس 28 از کتاب 4 دوره ۴۰۰۰ واژه خوش آمدید: حمل‌ونقل پاک شهری.', 0, 6000),
('40004000-0000-0000-0000-002800000003', 1, 'Sarah', 'Today we focus on 20 high-frequency vocabulary words used in real-life contexts.', 'امروز بر روی 20 واژه پرکاربرد در موقعیت‌های واقعی تمرکز می‌کنیم.', 6300, 13500),
('40004000-0000-0000-0000-002800000003', 2, 'Alex', 'Listen closely to the natural rhythm and pronunciation of each target phrase.', 'به ریتم طبیعی و تلفظ دقیق هر عبارت هدف خوب گوش فرا دهید.', 13800, 21000),
('40004000-0000-0000-0000-002800000003', 3, 'Sarah', 'Now head over to the shadowing section to record these sentences in your own voice!', 'حالا به بخش شادوئینگ بروید تا این جملات را با صدای خودتان تمرین و ضبط کنید!', 21400, 29000)
ON CONFLICT DO NOTHING;

-- کتاب 4 - درس 29: Crisis Communications
INSERT INTO scenes (id, title, description, background_image_url, difficulty, status, "order", category, is_custom)
VALUES ('40004000-0000-0000-0000-002900000001', 'Crisis Communications (Book 4 - Unit 29)', 'تمرین شادوئینگ یونیت 29 کتاب 4 (ارتباطات استراتژیک در بحران): harmonize, innovate, leverage, mitigate, navigate, orchestrate...', '', 'advanced', 'published', 429, 'education', false)
ON CONFLICT (id) DO NOTHING;

INSERT INTO hotspots (id, scene_id, name, x_position, y_position, order_index)
VALUES ('40004000-0000-0000-0000-002900000002', '40004000-0000-0000-0000-002900000001', 'Dialogue', 50.0, 50.0, 1)
ON CONFLICT (id) DO NOTHING;

INSERT INTO dialogues (id, hotspot_id, "order", speaker, original_text, translation, audio_url, display_type)
VALUES
('40004000-0000-0000-0001-002900000001', '40004000-0000-0000-0000-002900000002', 1, 'customer', 'Exploring crisis communications offers a great opportunity to master essential vocabulary.', 'بررسی موضوع ارتباطات استراتژیک در بحران فرصتی عالی برای تسلط بر واژگان ضروری به شمار می‌رود.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full'),
('40004000-0000-0000-0001-002900000002', '40004000-0000-0000-0000-002900000002', 2, 'clerk', 'Native speakers naturally use target words like harmonize and innovate in conversation.', 'گویندگان نیتیو کلماتی چون harmonize (هماهنگ‌سازی چندبعدی) و innovate (نوآوری ارزش‌آفرین) را به صورت طبیعی در مکالمه به کار می‌برند.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full'),
('40004000-0000-0000-0001-002900000003', '40004000-0000-0000-0000-002900000002', 3, 'customer', 'Practicing sentence by sentence with clear pronunciation builds real conversational fluency.', 'تمرین جمله‌به‌جمله با تلفظ شفاف، تسلط و روانی واقعی در گفتار ایجاد می‌کند.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full'),
('40004000-0000-0000-0001-002900000004', '40004000-0000-0000-0000-002900000002', 4, 'clerk', 'Staying calm and consistent turns difficult phrases into everyday speech habits.', 'آرامش و استمرار در تمرین، عبارات دشوار را به عادت‌های گفتاری روزمره بدل می‌سازد.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full'),
('40004000-0000-0000-0001-002900000005', '40004000-0000-0000-0000-002900000002', 5, 'customer', 'Completing this unit brings us closer to full mastery of English vocabulary.', 'تکمیل این درس ما را به تسلط کامل بر دایره واژگان انگلیسی نزدیک‌تر می‌کند.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full')
ON CONFLICT (id) DO NOTHING;

INSERT INTO podcasts (id, title, description_fa, level, kind, series_id, episode_no, audio_url, audio_status, is_active, duration_seconds, position, vocabulary, scene_id)
VALUES ('40004000-0000-0000-0000-002900000003', 'Crisis Communications (Book 4 - Unit 29)', 'روایت داستانی و آموزش واژگان یونیت 29 (ارتباطات استراتژیک در بحران) از کتاب 4 دوره ۴۰۰۰ واژه', 'advanced', 'lesson', '40000000-0004-0000-0000-000000000004', 29, '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'ready', TRUE, 358, 29, '[{"word": "harmonize", "meaning_fa": "هماهنگ‌سازی چندبعدی"}, {"word": "innovate", "meaning_fa": "نوآوری ارزش‌آفرین"}, {"word": "leverage", "meaning_fa": "اهرم قرار دادن مزیت"}, {"word": "mitigate", "meaning_fa": "کاهش اثرات ریسک"}, {"word": "navigate", "meaning_fa": "هدایت در شرایط عدم قطعیت"}, {"word": "orchestrate", "meaning_fa": "هماهنگی دقیق فرایندها"}, {"word": "pioneer", "meaning_fa": "پیشگامی در عرصه"}, {"word": "quantify", "meaning_fa": "محاسبه کمی دقیق"}, {"word": "reconcile", "meaning_fa": "وفاق دادن دیدگاه‌ها"}, {"word": "substantiate", "meaning_fa": "مستندسازی و اثبات"}, {"word": "synthesize", "meaning_fa": "ترکیب و تلفیق نظام‌مند"}, {"word": "underpin", "meaning_fa": "تقویت شالوده فکری"}, {"word": "yield", "meaning_fa": "بازدهی و ثمردهی بالا"}, {"word": "allocate", "meaning_fa": "تخصیص بهینه منابع"}, {"word": "benchmark", "meaning_fa": "معیار سنجش مرجع"}, {"word": "catalyze", "meaning_fa": "شتاب‌بخشی تحول"}, {"word": "differentiate", "meaning_fa": "متمایزسازی رقابتی"}, {"word": "exemplify", "meaning_fa": "نمونه بارز بودن"}, {"word": "formulate", "meaning_fa": "تدوین منسجم"}, {"word": "gauge", "meaning_fa": "سنجش و برآورد دقیق"}]'::jsonb, '40004000-0000-0000-0000-002900000001')
ON CONFLICT (id) DO UPDATE SET scene_id = EXCLUDED.scene_id, vocabulary = EXCLUDED.vocabulary;

INSERT INTO podcast_lines (podcast_id, position, speaker, text, translation_fa, start_ms, end_ms)
VALUES
('40004000-0000-0000-0000-002900000003', 0, 'Alex', 'Welcome to 4000 Essential English Words, Book 4, Unit 29: Crisis Communications.', 'به درس 29 از کتاب 4 دوره ۴۰۰۰ واژه خوش آمدید: ارتباطات استراتژیک در بحران.', 0, 6000),
('40004000-0000-0000-0000-002900000003', 1, 'Sarah', 'Today we focus on 20 high-frequency vocabulary words used in real-life contexts.', 'امروز بر روی 20 واژه پرکاربرد در موقعیت‌های واقعی تمرکز می‌کنیم.', 6300, 13500),
('40004000-0000-0000-0000-002900000003', 2, 'Alex', 'Listen closely to the natural rhythm and pronunciation of each target phrase.', 'به ریتم طبیعی و تلفظ دقیق هر عبارت هدف خوب گوش فرا دهید.', 13800, 21000),
('40004000-0000-0000-0000-002900000003', 3, 'Sarah', 'Now head over to the shadowing section to record these sentences in your own voice!', 'حالا به بخش شادوئینگ بروید تا این جملات را با صدای خودتان تمرین و ضبط کنید!', 21400, 29000)
ON CONFLICT DO NOTHING;

-- کتاب 4 - درس 30: Disruptive Market Models
INSERT INTO scenes (id, title, description, background_image_url, difficulty, status, "order", category, is_custom)
VALUES ('40004000-0000-0000-0000-003000000001', 'Disruptive Market Models (Book 4 - Unit 30)', 'تمرین شادوئینگ یونیت 30 کتاب 4 (مدل‌های تحول‌آفرین بازار): mitigate, navigate, orchestrate, pioneer, quantify, reconcile...', '', 'advanced', 'published', 430, 'education', false)
ON CONFLICT (id) DO NOTHING;

INSERT INTO hotspots (id, scene_id, name, x_position, y_position, order_index)
VALUES ('40004000-0000-0000-0000-003000000002', '40004000-0000-0000-0000-003000000001', 'Dialogue', 50.0, 50.0, 1)
ON CONFLICT (id) DO NOTHING;

INSERT INTO dialogues (id, hotspot_id, "order", speaker, original_text, translation, audio_url, display_type)
VALUES
('40004000-0000-0000-0001-003000000001', '40004000-0000-0000-0000-003000000002', 1, 'customer', 'Exploring disruptive market models offers a great opportunity to master essential vocabulary.', 'بررسی موضوع مدل‌های تحول‌آفرین بازار فرصتی عالی برای تسلط بر واژگان ضروری به شمار می‌رود.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full'),
('40004000-0000-0000-0001-003000000002', '40004000-0000-0000-0000-003000000002', 2, 'clerk', 'Native speakers naturally use target words like mitigate and navigate in conversation.', 'گویندگان نیتیو کلماتی چون mitigate (کاهش اثرات ریسک) و navigate (هدایت در شرایط عدم قطعیت) را به صورت طبیعی در مکالمه به کار می‌برند.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full'),
('40004000-0000-0000-0001-003000000003', '40004000-0000-0000-0000-003000000002', 3, 'customer', 'Practicing sentence by sentence with clear pronunciation builds real conversational fluency.', 'تمرین جمله‌به‌جمله با تلفظ شفاف، تسلط و روانی واقعی در گفتار ایجاد می‌کند.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full'),
('40004000-0000-0000-0001-003000000004', '40004000-0000-0000-0000-003000000002', 4, 'clerk', 'Staying calm and consistent turns difficult phrases into everyday speech habits.', 'آرامش و استمرار در تمرین، عبارات دشوار را به عادت‌های گفتاری روزمره بدل می‌سازد.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full'),
('40004000-0000-0000-0001-003000000005', '40004000-0000-0000-0000-003000000002', 5, 'customer', 'Completing this unit brings us closer to full mastery of English vocabulary.', 'تکمیل این درس ما را به تسلط کامل بر دایره واژگان انگلیسی نزدیک‌تر می‌کند.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full')
ON CONFLICT (id) DO NOTHING;

INSERT INTO podcasts (id, title, description_fa, level, kind, series_id, episode_no, audio_url, audio_status, is_active, duration_seconds, position, vocabulary, scene_id)
VALUES ('40004000-0000-0000-0000-003000000003', 'Disruptive Market Models (Book 4 - Unit 30)', 'روایت داستانی و آموزش واژگان یونیت 30 (مدل‌های تحول‌آفرین بازار) از کتاب 4 دوره ۴۰۰۰ واژه', 'advanced', 'lesson', '40000000-0004-0000-0000-000000000004', 30, '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'ready', TRUE, 360, 30, '[{"word": "mitigate", "meaning_fa": "کاهش اثرات ریسک"}, {"word": "navigate", "meaning_fa": "هدایت در شرایط عدم قطعیت"}, {"word": "orchestrate", "meaning_fa": "هماهنگی دقیق فرایندها"}, {"word": "pioneer", "meaning_fa": "پیشگامی در عرصه"}, {"word": "quantify", "meaning_fa": "محاسبه کمی دقیق"}, {"word": "reconcile", "meaning_fa": "وفاق دادن دیدگاه‌ها"}, {"word": "substantiate", "meaning_fa": "مستندسازی و اثبات"}, {"word": "synthesize", "meaning_fa": "ترکیب و تلفیق نظام‌مند"}, {"word": "underpin", "meaning_fa": "تقویت شالوده فکری"}, {"word": "yield", "meaning_fa": "بازدهی و ثمردهی بالا"}, {"word": "allocate", "meaning_fa": "تخصیص بهینه منابع"}, {"word": "benchmark", "meaning_fa": "معیار سنجش مرجع"}, {"word": "catalyze", "meaning_fa": "شتاب‌بخشی تحول"}, {"word": "differentiate", "meaning_fa": "متمایزسازی رقابتی"}, {"word": "exemplify", "meaning_fa": "نمونه بارز بودن"}, {"word": "formulate", "meaning_fa": "تدوین منسجم"}, {"word": "gauge", "meaning_fa": "سنجش و برآورد دقیق"}, {"word": "harmonize", "meaning_fa": "هماهنگ‌سازی چندبعدی"}, {"word": "innovate", "meaning_fa": "نوآوری ارزش‌آفرین"}, {"word": "leverage", "meaning_fa": "اهرم قرار دادن مزیت"}]'::jsonb, '40004000-0000-0000-0000-003000000001')
ON CONFLICT (id) DO UPDATE SET scene_id = EXCLUDED.scene_id, vocabulary = EXCLUDED.vocabulary;

INSERT INTO podcast_lines (podcast_id, position, speaker, text, translation_fa, start_ms, end_ms)
VALUES
('40004000-0000-0000-0000-003000000003', 0, 'Alex', 'Welcome to 4000 Essential English Words, Book 4, Unit 30: Disruptive Market Models.', 'به درس 30 از کتاب 4 دوره ۴۰۰۰ واژه خوش آمدید: مدل‌های تحول‌آفرین بازار.', 0, 6000),
('40004000-0000-0000-0000-003000000003', 1, 'Sarah', 'Today we focus on 20 high-frequency vocabulary words used in real-life contexts.', 'امروز بر روی 20 واژه پرکاربرد در موقعیت‌های واقعی تمرکز می‌کنیم.', 6300, 13500),
('40004000-0000-0000-0000-003000000003', 2, 'Alex', 'Listen closely to the natural rhythm and pronunciation of each target phrase.', 'به ریتم طبیعی و تلفظ دقیق هر عبارت هدف خوب گوش فرا دهید.', 13800, 21000),
('40004000-0000-0000-0000-003000000003', 3, 'Sarah', 'Now head over to the shadowing section to record these sentences in your own voice!', 'حالا به بخش شادوئینگ بروید تا این جملات را با صدای خودتان تمرین و ضبط کنید!', 21400, 29000)
ON CONFLICT DO NOTHING;

-- +migrate Down
DELETE FROM podcast_lines WHERE podcast_id LIKE '40004000-0000-0000-0000-%';
DELETE FROM podcasts WHERE id LIKE '40004000-0000-0000-0000-%';
DELETE FROM dialogues WHERE hotspot_id LIKE '40004000-0000-0000-0000-%';
DELETE FROM hotspots WHERE id LIKE '40004000-0000-0000-0000-%';
DELETE FROM scenes WHERE id LIKE '40004000-0000-0000-0000-%';
