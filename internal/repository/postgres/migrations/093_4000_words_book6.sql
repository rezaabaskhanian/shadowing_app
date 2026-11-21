-- +migrate Up
-- دوره رسمی ۴۰۰۰ واژه ضروری - کتاب 6 (4000 Essential Words — Book 6)
-- سطح: proficient | ۳۰ درس کامل شامل شادوئینگ و پادکست متصل.

INSERT INTO podcast_series (id, title, description_fa, level, cover_url, category, position, is_active)
VALUES ('40000000-0006-0000-0000-000000000006', '4000 Essential Words — Book 6', '۴۰۰۰ واژه پرکاربرد (کتاب ششم): تسلط کامل زبان انگلیسی، لغات پیشرفته ادبی، اصطلاحات انتزاعی و بحث‌های تخصصی', 'proficient', '', 'essential_words', 6, TRUE)
ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, description_fa = EXCLUDED.description_fa;

-- کتاب 6 - درس 1: Mastery of Rhetoric
INSERT INTO scenes (id, title, description, background_image_url, difficulty, status, "order", category, is_custom)
VALUES ('40006000-0000-0000-0000-000100000001', 'Mastery of Rhetoric (Book 6 - Unit 1)', 'تمرین شادوئینگ یونیت 1 کتاب 6 (تسلط بر فن بیان و بلاغت): delineate, elucidate, foster, galvanize, herald, instigate...', '', 'proficient', 'published', 601, 'education', false)
ON CONFLICT (id) DO NOTHING;

INSERT INTO hotspots (id, scene_id, name, x_position, y_position, order_index)
VALUES ('40006000-0000-0000-0000-000100000002', '40006000-0000-0000-0000-000100000001', 'Dialogue', 50.0, 50.0, 1)
ON CONFLICT (id) DO NOTHING;

INSERT INTO dialogues (id, hotspot_id, "order", speaker, original_text, translation, audio_url, display_type)
VALUES
('40006000-0000-0000-0001-000100000001', '40006000-0000-0000-0000-000100000002', 1, 'customer', 'Exploring mastery of rhetoric offers a great opportunity to master essential vocabulary.', 'بررسی موضوع تسلط بر فن بیان و بلاغت فرصتی عالی برای تسلط بر واژگان ضروری به شمار می‌رود.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full'),
('40006000-0000-0000-0001-000100000002', '40006000-0000-0000-0000-000100000002', 2, 'clerk', 'Native speakers naturally use target words like delineate and elucidate in conversation.', 'گویندگان نیتیو کلماتی چون delineate (تبیین موشکافانه ابعاد) و elucidate (روشنگری عمیق مفهومی) را به صورت طبیعی در مکالمه به کار می‌برند.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full'),
('40006000-0000-0000-0001-000100000003', '40006000-0000-0000-0000-000100000002', 3, 'customer', 'Practicing sentence by sentence with clear pronunciation builds real conversational fluency.', 'تمرین جمله‌به‌جمله با تلفظ شفاف، تسلط و روانی واقعی در گفتار ایجاد می‌کند.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full'),
('40006000-0000-0000-0001-000100000004', '40006000-0000-0000-0000-000100000002', 4, 'clerk', 'Staying calm and consistent turns difficult phrases into everyday speech habits.', 'آرامش و استمرار در تمرین، عبارات دشوار را به عادت‌های گفتاری روزمره بدل می‌سازد.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full'),
('40006000-0000-0000-0001-000100000005', '40006000-0000-0000-0000-000100000002', 5, 'customer', 'Completing this unit brings us closer to full mastery of English vocabulary.', 'تکمیل این درس ما را به تسلط کامل بر دایره واژگان انگلیسی نزدیک‌تر می‌کند.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full')
ON CONFLICT (id) DO NOTHING;

INSERT INTO podcasts (id, title, description_fa, level, kind, series_id, episode_no, audio_url, audio_status, is_active, duration_seconds, position, vocabulary, scene_id)
VALUES ('40006000-0000-0000-0000-000100000003', 'Mastery of Rhetoric (Book 6 - Unit 1)', 'روایت داستانی و آموزش واژگان یونیت 1 (تسلط بر فن بیان و بلاغت) از کتاب 6 دوره ۴۰۰۰ واژه', 'proficient', 'lesson', '40000000-0006-0000-0000-000000000006', 1, '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'ready', TRUE, 302, 1, '[{"word": "delineate", "meaning_fa": "تبیین موشکافانه ابعاد"}, {"word": "elucidate", "meaning_fa": "روشنگری عمیق مفهومی"}, {"word": "foster", "meaning_fa": "پرورش نظام‌مند استعدادها"}, {"word": "galvanize", "meaning_fa": "برانگیختن انگیزه فراگیر"}, {"word": "herald", "meaning_fa": "بشارت‌دهنده افق‌های نوین"}, {"word": "instigate", "meaning_fa": "آغازگری تحولات ساختاری"}, {"word": "juxtapose", "meaning_fa": "هم‌نشینی و مقایسه تطبیقی"}, {"word": "manifest", "meaning_fa": "تبلور عینی ارزش‌ها"}, {"word": "promulgate", "meaning_fa": "اشاعه و ترویج رسمی اندیشه"}, {"word": "reverberate", "meaning_fa": "بازتاب گسترده در جامعه"}, {"word": "scrutinize", "meaning_fa": "بررسی موشکافانه و دقیق"}, {"word": "transcend", "meaning_fa": "فراتر رفتن از محدودیت‌ها"}, {"word": "unravel", "meaning_fa": "گشودن گره‌های پیچیده"}, {"word": "venerate", "meaning_fa": "ارج نهادن و پاسداشت مقام"}, {"word": "warrant", "meaning_fa": "تضمین و توجیه شایسته"}, {"word": "crystallize", "meaning_fa": "تبلور شفاف دیدگاه"}, {"word": "culminate", "meaning_fa": "به اوج تکامل رسیدن"}, {"word": "amalgamate", "meaning_fa": "ادغام و یکپارچه‌سازی متعالی"}, {"word": "bolster", "meaning_fa": "تقویت بنیادین ارکان"}, {"word": "circumscribe", "meaning_fa": "تعیین دقیق حدود و ثغور"}]'::jsonb, '40006000-0000-0000-0000-000100000001')
ON CONFLICT (id) DO UPDATE SET scene_id = EXCLUDED.scene_id, vocabulary = EXCLUDED.vocabulary;

INSERT INTO podcast_lines (podcast_id, position, speaker, text, translation_fa, start_ms, end_ms)
VALUES
('40006000-0000-0000-0000-000100000003', 0, 'Alex', 'Welcome to 4000 Essential English Words, Book 6, Unit 1: Mastery of Rhetoric.', 'به درس 1 از کتاب 6 دوره ۴۰۰۰ واژه خوش آمدید: تسلط بر فن بیان و بلاغت.', 0, 6000),
('40006000-0000-0000-0000-000100000003', 1, 'Sarah', 'Today we focus on 20 high-frequency vocabulary words used in real-life contexts.', 'امروز بر روی 20 واژه پرکاربرد در موقعیت‌های واقعی تمرکز می‌کنیم.', 6300, 13500),
('40006000-0000-0000-0000-000100000003', 2, 'Alex', 'Listen closely to the natural rhythm and pronunciation of each target phrase.', 'به ریتم طبیعی و تلفظ دقیق هر عبارت هدف خوب گوش فرا دهید.', 13800, 21000),
('40006000-0000-0000-0000-000100000003', 3, 'Sarah', 'Now head over to the shadowing section to record these sentences in your own voice!', 'حالا به بخش شادوئینگ بروید تا این جملات را با صدای خودتان تمرین و ضبط کنید!', 21400, 29000)
ON CONFLICT DO NOTHING;

-- کتاب 6 - درس 2: Philosophical Dialectics
INSERT INTO scenes (id, title, description, background_image_url, difficulty, status, "order", category, is_custom)
VALUES ('40006000-0000-0000-0000-000200000001', 'Philosophical Dialectics (Book 6 - Unit 2)', 'تمرین شادوئینگ یونیت 2 کتاب 6 (دیالکتیک و استدلال عمیق): galvanize, herald, instigate, juxtapose, manifest, promulgate...', '', 'proficient', 'published', 602, 'education', false)
ON CONFLICT (id) DO NOTHING;

INSERT INTO hotspots (id, scene_id, name, x_position, y_position, order_index)
VALUES ('40006000-0000-0000-0000-000200000002', '40006000-0000-0000-0000-000200000001', 'Dialogue', 50.0, 50.0, 1)
ON CONFLICT (id) DO NOTHING;

INSERT INTO dialogues (id, hotspot_id, "order", speaker, original_text, translation, audio_url, display_type)
VALUES
('40006000-0000-0000-0001-000200000001', '40006000-0000-0000-0000-000200000002', 1, 'customer', 'Exploring philosophical dialectics offers a great opportunity to master essential vocabulary.', 'بررسی موضوع دیالکتیک و استدلال عمیق فرصتی عالی برای تسلط بر واژگان ضروری به شمار می‌رود.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full'),
('40006000-0000-0000-0001-000200000002', '40006000-0000-0000-0000-000200000002', 2, 'clerk', 'Native speakers naturally use target words like galvanize and herald in conversation.', 'گویندگان نیتیو کلماتی چون galvanize (برانگیختن انگیزه فراگیر) و herald (بشارت‌دهنده افق‌های نوین) را به صورت طبیعی در مکالمه به کار می‌برند.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full'),
('40006000-0000-0000-0001-000200000003', '40006000-0000-0000-0000-000200000002', 3, 'customer', 'Practicing sentence by sentence with clear pronunciation builds real conversational fluency.', 'تمرین جمله‌به‌جمله با تلفظ شفاف، تسلط و روانی واقعی در گفتار ایجاد می‌کند.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full'),
('40006000-0000-0000-0001-000200000004', '40006000-0000-0000-0000-000200000002', 4, 'clerk', 'Staying calm and consistent turns difficult phrases into everyday speech habits.', 'آرامش و استمرار در تمرین، عبارات دشوار را به عادت‌های گفتاری روزمره بدل می‌سازد.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full'),
('40006000-0000-0000-0001-000200000005', '40006000-0000-0000-0000-000200000002', 5, 'customer', 'Completing this unit brings us closer to full mastery of English vocabulary.', 'تکمیل این درس ما را به تسلط کامل بر دایره واژگان انگلیسی نزدیک‌تر می‌کند.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full')
ON CONFLICT (id) DO NOTHING;

INSERT INTO podcasts (id, title, description_fa, level, kind, series_id, episode_no, audio_url, audio_status, is_active, duration_seconds, position, vocabulary, scene_id)
VALUES ('40006000-0000-0000-0000-000200000003', 'Philosophical Dialectics (Book 6 - Unit 2)', 'روایت داستانی و آموزش واژگان یونیت 2 (دیالکتیک و استدلال عمیق) از کتاب 6 دوره ۴۰۰۰ واژه', 'proficient', 'lesson', '40000000-0006-0000-0000-000000000006', 2, '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'ready', TRUE, 304, 2, '[{"word": "galvanize", "meaning_fa": "برانگیختن انگیزه فراگیر"}, {"word": "herald", "meaning_fa": "بشارت‌دهنده افق‌های نوین"}, {"word": "instigate", "meaning_fa": "آغازگری تحولات ساختاری"}, {"word": "juxtapose", "meaning_fa": "هم‌نشینی و مقایسه تطبیقی"}, {"word": "manifest", "meaning_fa": "تبلور عینی ارزش‌ها"}, {"word": "promulgate", "meaning_fa": "اشاعه و ترویج رسمی اندیشه"}, {"word": "reverberate", "meaning_fa": "بازتاب گسترده در جامعه"}, {"word": "scrutinize", "meaning_fa": "بررسی موشکافانه و دقیق"}, {"word": "transcend", "meaning_fa": "فراتر رفتن از محدودیت‌ها"}, {"word": "unravel", "meaning_fa": "گشودن گره‌های پیچیده"}, {"word": "venerate", "meaning_fa": "ارج نهادن و پاسداشت مقام"}, {"word": "warrant", "meaning_fa": "تضمین و توجیه شایسته"}, {"word": "crystallize", "meaning_fa": "تبلور شفاف دیدگاه"}, {"word": "culminate", "meaning_fa": "به اوج تکامل رسیدن"}, {"word": "amalgamate", "meaning_fa": "ادغام و یکپارچه‌سازی متعالی"}, {"word": "bolster", "meaning_fa": "تقویت بنیادین ارکان"}, {"word": "circumscribe", "meaning_fa": "تعیین دقیق حدود و ثغور"}, {"word": "delineate", "meaning_fa": "تبیین موشکافانه ابعاد"}, {"word": "elucidate", "meaning_fa": "روشنگری عمیق مفهومی"}, {"word": "foster", "meaning_fa": "پرورش نظام‌مند استعدادها"}]'::jsonb, '40006000-0000-0000-0000-000200000001')
ON CONFLICT (id) DO UPDATE SET scene_id = EXCLUDED.scene_id, vocabulary = EXCLUDED.vocabulary;

INSERT INTO podcast_lines (podcast_id, position, speaker, text, translation_fa, start_ms, end_ms)
VALUES
('40006000-0000-0000-0000-000200000003', 0, 'Alex', 'Welcome to 4000 Essential English Words, Book 6, Unit 2: Philosophical Dialectics.', 'به درس 2 از کتاب 6 دوره ۴۰۰۰ واژه خوش آمدید: دیالکتیک و استدلال عمیق.', 0, 6000),
('40006000-0000-0000-0000-000200000003', 1, 'Sarah', 'Today we focus on 20 high-frequency vocabulary words used in real-life contexts.', 'امروز بر روی 20 واژه پرکاربرد در موقعیت‌های واقعی تمرکز می‌کنیم.', 6300, 13500),
('40006000-0000-0000-0000-000200000003', 2, 'Alex', 'Listen closely to the natural rhythm and pronunciation of each target phrase.', 'به ریتم طبیعی و تلفظ دقیق هر عبارت هدف خوب گوش فرا دهید.', 13800, 21000),
('40006000-0000-0000-0000-000200000003', 3, 'Sarah', 'Now head over to the shadowing section to record these sentences in your own voice!', 'حالا به بخش شادوئینگ بروید تا این جملات را با صدای خودتان تمرین و ضبط کنید!', 21400, 29000)
ON CONFLICT DO NOTHING;

-- کتاب 6 - درس 3: Advanced Hermeneutics
INSERT INTO scenes (id, title, description, background_image_url, difficulty, status, "order", category, is_custom)
VALUES ('40006000-0000-0000-0000-000300000001', 'Advanced Hermeneutics (Book 6 - Unit 3)', 'تمرین شادوئینگ یونیت 3 کتاب 6 (هرمنوتیک و تفسیر متون کهن): juxtapose, manifest, promulgate, reverberate, scrutinize, transcend...', '', 'proficient', 'published', 603, 'education', false)
ON CONFLICT (id) DO NOTHING;

INSERT INTO hotspots (id, scene_id, name, x_position, y_position, order_index)
VALUES ('40006000-0000-0000-0000-000300000002', '40006000-0000-0000-0000-000300000001', 'Dialogue', 50.0, 50.0, 1)
ON CONFLICT (id) DO NOTHING;

INSERT INTO dialogues (id, hotspot_id, "order", speaker, original_text, translation, audio_url, display_type)
VALUES
('40006000-0000-0000-0001-000300000001', '40006000-0000-0000-0000-000300000002', 1, 'customer', 'Exploring advanced hermeneutics offers a great opportunity to master essential vocabulary.', 'بررسی موضوع هرمنوتیک و تفسیر متون کهن فرصتی عالی برای تسلط بر واژگان ضروری به شمار می‌رود.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full'),
('40006000-0000-0000-0001-000300000002', '40006000-0000-0000-0000-000300000002', 2, 'clerk', 'Native speakers naturally use target words like juxtapose and manifest in conversation.', 'گویندگان نیتیو کلماتی چون juxtapose (هم‌نشینی و مقایسه تطبیقی) و manifest (تبلور عینی ارزش‌ها) را به صورت طبیعی در مکالمه به کار می‌برند.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full'),
('40006000-0000-0000-0001-000300000003', '40006000-0000-0000-0000-000300000002', 3, 'customer', 'Practicing sentence by sentence with clear pronunciation builds real conversational fluency.', 'تمرین جمله‌به‌جمله با تلفظ شفاف، تسلط و روانی واقعی در گفتار ایجاد می‌کند.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full'),
('40006000-0000-0000-0001-000300000004', '40006000-0000-0000-0000-000300000002', 4, 'clerk', 'Staying calm and consistent turns difficult phrases into everyday speech habits.', 'آرامش و استمرار در تمرین، عبارات دشوار را به عادت‌های گفتاری روزمره بدل می‌سازد.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full'),
('40006000-0000-0000-0001-000300000005', '40006000-0000-0000-0000-000300000002', 5, 'customer', 'Completing this unit brings us closer to full mastery of English vocabulary.', 'تکمیل این درس ما را به تسلط کامل بر دایره واژگان انگلیسی نزدیک‌تر می‌کند.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full')
ON CONFLICT (id) DO NOTHING;

INSERT INTO podcasts (id, title, description_fa, level, kind, series_id, episode_no, audio_url, audio_status, is_active, duration_seconds, position, vocabulary, scene_id)
VALUES ('40006000-0000-0000-0000-000300000003', 'Advanced Hermeneutics (Book 6 - Unit 3)', 'روایت داستانی و آموزش واژگان یونیت 3 (هرمنوتیک و تفسیر متون کهن) از کتاب 6 دوره ۴۰۰۰ واژه', 'proficient', 'lesson', '40000000-0006-0000-0000-000000000006', 3, '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'ready', TRUE, 306, 3, '[{"word": "juxtapose", "meaning_fa": "هم‌نشینی و مقایسه تطبیقی"}, {"word": "manifest", "meaning_fa": "تبلور عینی ارزش‌ها"}, {"word": "promulgate", "meaning_fa": "اشاعه و ترویج رسمی اندیشه"}, {"word": "reverberate", "meaning_fa": "بازتاب گسترده در جامعه"}, {"word": "scrutinize", "meaning_fa": "بررسی موشکافانه و دقیق"}, {"word": "transcend", "meaning_fa": "فراتر رفتن از محدودیت‌ها"}, {"word": "unravel", "meaning_fa": "گشودن گره‌های پیچیده"}, {"word": "venerate", "meaning_fa": "ارج نهادن و پاسداشت مقام"}, {"word": "warrant", "meaning_fa": "تضمین و توجیه شایسته"}, {"word": "crystallize", "meaning_fa": "تبلور شفاف دیدگاه"}, {"word": "culminate", "meaning_fa": "به اوج تکامل رسیدن"}, {"word": "amalgamate", "meaning_fa": "ادغام و یکپارچه‌سازی متعالی"}, {"word": "bolster", "meaning_fa": "تقویت بنیادین ارکان"}, {"word": "circumscribe", "meaning_fa": "تعیین دقیق حدود و ثغور"}, {"word": "delineate", "meaning_fa": "تبیین موشکافانه ابعاد"}, {"word": "elucidate", "meaning_fa": "روشنگری عمیق مفهومی"}, {"word": "foster", "meaning_fa": "پرورش نظام‌مند استعدادها"}, {"word": "galvanize", "meaning_fa": "برانگیختن انگیزه فراگیر"}, {"word": "herald", "meaning_fa": "بشارت‌دهنده افق‌های نوین"}, {"word": "instigate", "meaning_fa": "آغازگری تحولات ساختاری"}]'::jsonb, '40006000-0000-0000-0000-000300000001')
ON CONFLICT (id) DO UPDATE SET scene_id = EXCLUDED.scene_id, vocabulary = EXCLUDED.vocabulary;

INSERT INTO podcast_lines (podcast_id, position, speaker, text, translation_fa, start_ms, end_ms)
VALUES
('40006000-0000-0000-0000-000300000003', 0, 'Alex', 'Welcome to 4000 Essential English Words, Book 6, Unit 3: Advanced Hermeneutics.', 'به درس 3 از کتاب 6 دوره ۴۰۰۰ واژه خوش آمدید: هرمنوتیک و تفسیر متون کهن.', 0, 6000),
('40006000-0000-0000-0000-000300000003', 1, 'Sarah', 'Today we focus on 20 high-frequency vocabulary words used in real-life contexts.', 'امروز بر روی 20 واژه پرکاربرد در موقعیت‌های واقعی تمرکز می‌کنیم.', 6300, 13500),
('40006000-0000-0000-0000-000300000003', 2, 'Alex', 'Listen closely to the natural rhythm and pronunciation of each target phrase.', 'به ریتم طبیعی و تلفظ دقیق هر عبارت هدف خوب گوش فرا دهید.', 13800, 21000),
('40006000-0000-0000-0000-000300000003', 3, 'Sarah', 'Now head over to the shadowing section to record these sentences in your own voice!', 'حالا به بخش شادوئینگ بروید تا این جملات را با صدای خودتان تمرین و ضبط کنید!', 21400, 29000)
ON CONFLICT DO NOTHING;

-- کتاب 6 - درس 4: Constitutional Jurisprudence
INSERT INTO scenes (id, title, description, background_image_url, difficulty, status, "order", category, is_custom)
VALUES ('40006000-0000-0000-0000-000400000001', 'Constitutional Jurisprudence (Book 6 - Unit 4)', 'تمرین شادوئینگ یونیت 4 کتاب 6 (فلسفه حقوق اساسی دادگاه‌ها): reverberate, scrutinize, transcend, unravel, venerate, warrant...', '', 'proficient', 'published', 604, 'education', false)
ON CONFLICT (id) DO NOTHING;

INSERT INTO hotspots (id, scene_id, name, x_position, y_position, order_index)
VALUES ('40006000-0000-0000-0000-000400000002', '40006000-0000-0000-0000-000400000001', 'Dialogue', 50.0, 50.0, 1)
ON CONFLICT (id) DO NOTHING;

INSERT INTO dialogues (id, hotspot_id, "order", speaker, original_text, translation, audio_url, display_type)
VALUES
('40006000-0000-0000-0001-000400000001', '40006000-0000-0000-0000-000400000002', 1, 'customer', 'Exploring constitutional jurisprudence offers a great opportunity to master essential vocabulary.', 'بررسی موضوع فلسفه حقوق اساسی دادگاه‌ها فرصتی عالی برای تسلط بر واژگان ضروری به شمار می‌رود.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full'),
('40006000-0000-0000-0001-000400000002', '40006000-0000-0000-0000-000400000002', 2, 'clerk', 'Native speakers naturally use target words like reverberate and scrutinize in conversation.', 'گویندگان نیتیو کلماتی چون reverberate (بازتاب گسترده در جامعه) و scrutinize (بررسی موشکافانه و دقیق) را به صورت طبیعی در مکالمه به کار می‌برند.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full'),
('40006000-0000-0000-0001-000400000003', '40006000-0000-0000-0000-000400000002', 3, 'customer', 'Practicing sentence by sentence with clear pronunciation builds real conversational fluency.', 'تمرین جمله‌به‌جمله با تلفظ شفاف، تسلط و روانی واقعی در گفتار ایجاد می‌کند.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full'),
('40006000-0000-0000-0001-000400000004', '40006000-0000-0000-0000-000400000002', 4, 'clerk', 'Staying calm and consistent turns difficult phrases into everyday speech habits.', 'آرامش و استمرار در تمرین، عبارات دشوار را به عادت‌های گفتاری روزمره بدل می‌سازد.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full'),
('40006000-0000-0000-0001-000400000005', '40006000-0000-0000-0000-000400000002', 5, 'customer', 'Completing this unit brings us closer to full mastery of English vocabulary.', 'تکمیل این درس ما را به تسلط کامل بر دایره واژگان انگلیسی نزدیک‌تر می‌کند.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full')
ON CONFLICT (id) DO NOTHING;

INSERT INTO podcasts (id, title, description_fa, level, kind, series_id, episode_no, audio_url, audio_status, is_active, duration_seconds, position, vocabulary, scene_id)
VALUES ('40006000-0000-0000-0000-000400000003', 'Constitutional Jurisprudence (Book 6 - Unit 4)', 'روایت داستانی و آموزش واژگان یونیت 4 (فلسفه حقوق اساسی دادگاه‌ها) از کتاب 6 دوره ۴۰۰۰ واژه', 'proficient', 'lesson', '40000000-0006-0000-0000-000000000006', 4, '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'ready', TRUE, 308, 4, '[{"word": "reverberate", "meaning_fa": "بازتاب گسترده در جامعه"}, {"word": "scrutinize", "meaning_fa": "بررسی موشکافانه و دقیق"}, {"word": "transcend", "meaning_fa": "فراتر رفتن از محدودیت‌ها"}, {"word": "unravel", "meaning_fa": "گشودن گره‌های پیچیده"}, {"word": "venerate", "meaning_fa": "ارج نهادن و پاسداشت مقام"}, {"word": "warrant", "meaning_fa": "تضمین و توجیه شایسته"}, {"word": "crystallize", "meaning_fa": "تبلور شفاف دیدگاه"}, {"word": "culminate", "meaning_fa": "به اوج تکامل رسیدن"}, {"word": "amalgamate", "meaning_fa": "ادغام و یکپارچه‌سازی متعالی"}, {"word": "bolster", "meaning_fa": "تقویت بنیادین ارکان"}, {"word": "circumscribe", "meaning_fa": "تعیین دقیق حدود و ثغور"}, {"word": "delineate", "meaning_fa": "تبیین موشکافانه ابعاد"}, {"word": "elucidate", "meaning_fa": "روشنگری عمیق مفهومی"}, {"word": "foster", "meaning_fa": "پرورش نظام‌مند استعدادها"}, {"word": "galvanize", "meaning_fa": "برانگیختن انگیزه فراگیر"}, {"word": "herald", "meaning_fa": "بشارت‌دهنده افق‌های نوین"}, {"word": "instigate", "meaning_fa": "آغازگری تحولات ساختاری"}, {"word": "juxtapose", "meaning_fa": "هم‌نشینی و مقایسه تطبیقی"}, {"word": "manifest", "meaning_fa": "تبلور عینی ارزش‌ها"}, {"word": "promulgate", "meaning_fa": "اشاعه و ترویج رسمی اندیشه"}]'::jsonb, '40006000-0000-0000-0000-000400000001')
ON CONFLICT (id) DO UPDATE SET scene_id = EXCLUDED.scene_id, vocabulary = EXCLUDED.vocabulary;

INSERT INTO podcast_lines (podcast_id, position, speaker, text, translation_fa, start_ms, end_ms)
VALUES
('40006000-0000-0000-0000-000400000003', 0, 'Alex', 'Welcome to 4000 Essential English Words, Book 6, Unit 4: Constitutional Jurisprudence.', 'به درس 4 از کتاب 6 دوره ۴۰۰۰ واژه خوش آمدید: فلسفه حقوق اساسی دادگاه‌ها.', 0, 6000),
('40006000-0000-0000-0000-000400000003', 1, 'Sarah', 'Today we focus on 20 high-frequency vocabulary words used in real-life contexts.', 'امروز بر روی 20 واژه پرکاربرد در موقعیت‌های واقعی تمرکز می‌کنیم.', 6300, 13500),
('40006000-0000-0000-0000-000400000003', 2, 'Alex', 'Listen closely to the natural rhythm and pronunciation of each target phrase.', 'به ریتم طبیعی و تلفظ دقیق هر عبارت هدف خوب گوش فرا دهید.', 13800, 21000),
('40006000-0000-0000-0000-000400000003', 3, 'Sarah', 'Now head over to the shadowing section to record these sentences in your own voice!', 'حالا به بخش شادوئینگ بروید تا این جملات را با صدای خودتان تمرین و ضبط کنید!', 21400, 29000)
ON CONFLICT DO NOTHING;

-- کتاب 6 - درس 5: Cosmological Theories
INSERT INTO scenes (id, title, description, background_image_url, difficulty, status, "order", category, is_custom)
VALUES ('40006000-0000-0000-0000-000500000001', 'Cosmological Theories (Book 6 - Unit 5)', 'تمرین شادوئینگ یونیت 5 کتاب 6 (نظریه‌های کیهان‌شناسی مدرن): unravel, venerate, warrant, crystallize, culminate, amalgamate...', '', 'proficient', 'published', 605, 'education', false)
ON CONFLICT (id) DO NOTHING;

INSERT INTO hotspots (id, scene_id, name, x_position, y_position, order_index)
VALUES ('40006000-0000-0000-0000-000500000002', '40006000-0000-0000-0000-000500000001', 'Dialogue', 50.0, 50.0, 1)
ON CONFLICT (id) DO NOTHING;

INSERT INTO dialogues (id, hotspot_id, "order", speaker, original_text, translation, audio_url, display_type)
VALUES
('40006000-0000-0000-0001-000500000001', '40006000-0000-0000-0000-000500000002', 1, 'customer', 'Exploring cosmological theories offers a great opportunity to master essential vocabulary.', 'بررسی موضوع نظریه‌های کیهان‌شناسی مدرن فرصتی عالی برای تسلط بر واژگان ضروری به شمار می‌رود.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full'),
('40006000-0000-0000-0001-000500000002', '40006000-0000-0000-0000-000500000002', 2, 'clerk', 'Native speakers naturally use target words like unravel and venerate in conversation.', 'گویندگان نیتیو کلماتی چون unravel (گشودن گره‌های پیچیده) و venerate (ارج نهادن و پاسداشت مقام) را به صورت طبیعی در مکالمه به کار می‌برند.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full'),
('40006000-0000-0000-0001-000500000003', '40006000-0000-0000-0000-000500000002', 3, 'customer', 'Practicing sentence by sentence with clear pronunciation builds real conversational fluency.', 'تمرین جمله‌به‌جمله با تلفظ شفاف، تسلط و روانی واقعی در گفتار ایجاد می‌کند.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full'),
('40006000-0000-0000-0001-000500000004', '40006000-0000-0000-0000-000500000002', 4, 'clerk', 'Staying calm and consistent turns difficult phrases into everyday speech habits.', 'آرامش و استمرار در تمرین، عبارات دشوار را به عادت‌های گفتاری روزمره بدل می‌سازد.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full'),
('40006000-0000-0000-0001-000500000005', '40006000-0000-0000-0000-000500000002', 5, 'customer', 'Completing this unit brings us closer to full mastery of English vocabulary.', 'تکمیل این درس ما را به تسلط کامل بر دایره واژگان انگلیسی نزدیک‌تر می‌کند.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full')
ON CONFLICT (id) DO NOTHING;

INSERT INTO podcasts (id, title, description_fa, level, kind, series_id, episode_no, audio_url, audio_status, is_active, duration_seconds, position, vocabulary, scene_id)
VALUES ('40006000-0000-0000-0000-000500000003', 'Cosmological Theories (Book 6 - Unit 5)', 'روایت داستانی و آموزش واژگان یونیت 5 (نظریه‌های کیهان‌شناسی مدرن) از کتاب 6 دوره ۴۰۰۰ واژه', 'proficient', 'lesson', '40000000-0006-0000-0000-000000000006', 5, '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'ready', TRUE, 310, 5, '[{"word": "unravel", "meaning_fa": "گشودن گره‌های پیچیده"}, {"word": "venerate", "meaning_fa": "ارج نهادن و پاسداشت مقام"}, {"word": "warrant", "meaning_fa": "تضمین و توجیه شایسته"}, {"word": "crystallize", "meaning_fa": "تبلور شفاف دیدگاه"}, {"word": "culminate", "meaning_fa": "به اوج تکامل رسیدن"}, {"word": "amalgamate", "meaning_fa": "ادغام و یکپارچه‌سازی متعالی"}, {"word": "bolster", "meaning_fa": "تقویت بنیادین ارکان"}, {"word": "circumscribe", "meaning_fa": "تعیین دقیق حدود و ثغور"}, {"word": "delineate", "meaning_fa": "تبیین موشکافانه ابعاد"}, {"word": "elucidate", "meaning_fa": "روشنگری عمیق مفهومی"}, {"word": "foster", "meaning_fa": "پرورش نظام‌مند استعدادها"}, {"word": "galvanize", "meaning_fa": "برانگیختن انگیزه فراگیر"}, {"word": "herald", "meaning_fa": "بشارت‌دهنده افق‌های نوین"}, {"word": "instigate", "meaning_fa": "آغازگری تحولات ساختاری"}, {"word": "juxtapose", "meaning_fa": "هم‌نشینی و مقایسه تطبیقی"}, {"word": "manifest", "meaning_fa": "تبلور عینی ارزش‌ها"}, {"word": "promulgate", "meaning_fa": "اشاعه و ترویج رسمی اندیشه"}, {"word": "reverberate", "meaning_fa": "بازتاب گسترده در جامعه"}, {"word": "scrutinize", "meaning_fa": "بررسی موشکافانه و دقیق"}, {"word": "transcend", "meaning_fa": "فراتر رفتن از محدودیت‌ها"}]'::jsonb, '40006000-0000-0000-0000-000500000001')
ON CONFLICT (id) DO UPDATE SET scene_id = EXCLUDED.scene_id, vocabulary = EXCLUDED.vocabulary;

INSERT INTO podcast_lines (podcast_id, position, speaker, text, translation_fa, start_ms, end_ms)
VALUES
('40006000-0000-0000-0000-000500000003', 0, 'Alex', 'Welcome to 4000 Essential English Words, Book 6, Unit 5: Cosmological Theories.', 'به درس 5 از کتاب 6 دوره ۴۰۰۰ واژه خوش آمدید: نظریه‌های کیهان‌شناسی مدرن.', 0, 6000),
('40006000-0000-0000-0000-000500000003', 1, 'Sarah', 'Today we focus on 20 high-frequency vocabulary words used in real-life contexts.', 'امروز بر روی 20 واژه پرکاربرد در موقعیت‌های واقعی تمرکز می‌کنیم.', 6300, 13500),
('40006000-0000-0000-0000-000500000003', 2, 'Alex', 'Listen closely to the natural rhythm and pronunciation of each target phrase.', 'به ریتم طبیعی و تلفظ دقیق هر عبارت هدف خوب گوش فرا دهید.', 13800, 21000),
('40006000-0000-0000-0000-000500000003', 3, 'Sarah', 'Now head over to the shadowing section to record these sentences in your own voice!', 'حالا به بخش شادوئینگ بروید تا این جملات را با صدای خودتان تمرین و ضبط کنید!', 21400, 29000)
ON CONFLICT DO NOTHING;

-- کتاب 6 - درس 6: Neuroethics and Consciousness
INSERT INTO scenes (id, title, description, background_image_url, difficulty, status, "order", category, is_custom)
VALUES ('40006000-0000-0000-0000-000600000001', 'Neuroethics and Consciousness (Book 6 - Unit 6)', 'تمرین شادوئینگ یونیت 6 کتاب 6 (اخلاق عصبی و راز آگاهی): crystallize, culminate, amalgamate, bolster, circumscribe, delineate...', '', 'proficient', 'published', 606, 'education', false)
ON CONFLICT (id) DO NOTHING;

INSERT INTO hotspots (id, scene_id, name, x_position, y_position, order_index)
VALUES ('40006000-0000-0000-0000-000600000002', '40006000-0000-0000-0000-000600000001', 'Dialogue', 50.0, 50.0, 1)
ON CONFLICT (id) DO NOTHING;

INSERT INTO dialogues (id, hotspot_id, "order", speaker, original_text, translation, audio_url, display_type)
VALUES
('40006000-0000-0000-0001-000600000001', '40006000-0000-0000-0000-000600000002', 1, 'customer', 'Exploring neuroethics and consciousness offers a great opportunity to master essential vocabulary.', 'بررسی موضوع اخلاق عصبی و راز آگاهی فرصتی عالی برای تسلط بر واژگان ضروری به شمار می‌رود.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full'),
('40006000-0000-0000-0001-000600000002', '40006000-0000-0000-0000-000600000002', 2, 'clerk', 'Native speakers naturally use target words like crystallize and culminate in conversation.', 'گویندگان نیتیو کلماتی چون crystallize (تبلور شفاف دیدگاه) و culminate (به اوج تکامل رسیدن) را به صورت طبیعی در مکالمه به کار می‌برند.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full'),
('40006000-0000-0000-0001-000600000003', '40006000-0000-0000-0000-000600000002', 3, 'customer', 'Practicing sentence by sentence with clear pronunciation builds real conversational fluency.', 'تمرین جمله‌به‌جمله با تلفظ شفاف، تسلط و روانی واقعی در گفتار ایجاد می‌کند.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full'),
('40006000-0000-0000-0001-000600000004', '40006000-0000-0000-0000-000600000002', 4, 'clerk', 'Staying calm and consistent turns difficult phrases into everyday speech habits.', 'آرامش و استمرار در تمرین، عبارات دشوار را به عادت‌های گفتاری روزمره بدل می‌سازد.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full'),
('40006000-0000-0000-0001-000600000005', '40006000-0000-0000-0000-000600000002', 5, 'customer', 'Completing this unit brings us closer to full mastery of English vocabulary.', 'تکمیل این درس ما را به تسلط کامل بر دایره واژگان انگلیسی نزدیک‌تر می‌کند.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full')
ON CONFLICT (id) DO NOTHING;

INSERT INTO podcasts (id, title, description_fa, level, kind, series_id, episode_no, audio_url, audio_status, is_active, duration_seconds, position, vocabulary, scene_id)
VALUES ('40006000-0000-0000-0000-000600000003', 'Neuroethics and Consciousness (Book 6 - Unit 6)', 'روایت داستانی و آموزش واژگان یونیت 6 (اخلاق عصبی و راز آگاهی) از کتاب 6 دوره ۴۰۰۰ واژه', 'proficient', 'lesson', '40000000-0006-0000-0000-000000000006', 6, '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'ready', TRUE, 312, 6, '[{"word": "crystallize", "meaning_fa": "تبلور شفاف دیدگاه"}, {"word": "culminate", "meaning_fa": "به اوج تکامل رسیدن"}, {"word": "amalgamate", "meaning_fa": "ادغام و یکپارچه‌سازی متعالی"}, {"word": "bolster", "meaning_fa": "تقویت بنیادین ارکان"}, {"word": "circumscribe", "meaning_fa": "تعیین دقیق حدود و ثغور"}, {"word": "delineate", "meaning_fa": "تبیین موشکافانه ابعاد"}, {"word": "elucidate", "meaning_fa": "روشنگری عمیق مفهومی"}, {"word": "foster", "meaning_fa": "پرورش نظام‌مند استعدادها"}, {"word": "galvanize", "meaning_fa": "برانگیختن انگیزه فراگیر"}, {"word": "herald", "meaning_fa": "بشارت‌دهنده افق‌های نوین"}, {"word": "instigate", "meaning_fa": "آغازگری تحولات ساختاری"}, {"word": "juxtapose", "meaning_fa": "هم‌نشینی و مقایسه تطبیقی"}, {"word": "manifest", "meaning_fa": "تبلور عینی ارزش‌ها"}, {"word": "promulgate", "meaning_fa": "اشاعه و ترویج رسمی اندیشه"}, {"word": "reverberate", "meaning_fa": "بازتاب گسترده در جامعه"}, {"word": "scrutinize", "meaning_fa": "بررسی موشکافانه و دقیق"}, {"word": "transcend", "meaning_fa": "فراتر رفتن از محدودیت‌ها"}, {"word": "unravel", "meaning_fa": "گشودن گره‌های پیچیده"}, {"word": "venerate", "meaning_fa": "ارج نهادن و پاسداشت مقام"}, {"word": "warrant", "meaning_fa": "تضمین و توجیه شایسته"}]'::jsonb, '40006000-0000-0000-0000-000600000001')
ON CONFLICT (id) DO UPDATE SET scene_id = EXCLUDED.scene_id, vocabulary = EXCLUDED.vocabulary;

INSERT INTO podcast_lines (podcast_id, position, speaker, text, translation_fa, start_ms, end_ms)
VALUES
('40006000-0000-0000-0000-000600000003', 0, 'Alex', 'Welcome to 4000 Essential English Words, Book 6, Unit 6: Neuroethics and Consciousness.', 'به درس 6 از کتاب 6 دوره ۴۰۰۰ واژه خوش آمدید: اخلاق عصبی و راز آگاهی.', 0, 6000),
('40006000-0000-0000-0000-000600000003', 1, 'Sarah', 'Today we focus on 20 high-frequency vocabulary words used in real-life contexts.', 'امروز بر روی 20 واژه پرکاربرد در موقعیت‌های واقعی تمرکز می‌کنیم.', 6300, 13500),
('40006000-0000-0000-0000-000600000003', 2, 'Alex', 'Listen closely to the natural rhythm and pronunciation of each target phrase.', 'به ریتم طبیعی و تلفظ دقیق هر عبارت هدف خوب گوش فرا دهید.', 13800, 21000),
('40006000-0000-0000-0000-000600000003', 3, 'Sarah', 'Now head over to the shadowing section to record these sentences in your own voice!', 'حالا به بخش شادوئینگ بروید تا این جملات را با صدای خودتان تمرین و ضبط کنید!', 21400, 29000)
ON CONFLICT DO NOTHING;

-- کتاب 6 - درس 7: Socio-Political Discourse
INSERT INTO scenes (id, title, description, background_image_url, difficulty, status, "order", category, is_custom)
VALUES ('40006000-0000-0000-0000-000700000001', 'Socio-Political Discourse (Book 6 - Unit 7)', 'تمرین شادوئینگ یونیت 7 کتاب 6 (گفتمان جامعه‌شناختی انتقادی): bolster, circumscribe, delineate, elucidate, foster, galvanize...', '', 'proficient', 'published', 607, 'education', false)
ON CONFLICT (id) DO NOTHING;

INSERT INTO hotspots (id, scene_id, name, x_position, y_position, order_index)
VALUES ('40006000-0000-0000-0000-000700000002', '40006000-0000-0000-0000-000700000001', 'Dialogue', 50.0, 50.0, 1)
ON CONFLICT (id) DO NOTHING;

INSERT INTO dialogues (id, hotspot_id, "order", speaker, original_text, translation, audio_url, display_type)
VALUES
('40006000-0000-0000-0001-000700000001', '40006000-0000-0000-0000-000700000002', 1, 'customer', 'Exploring socio-political discourse offers a great opportunity to master essential vocabulary.', 'بررسی موضوع گفتمان جامعه‌شناختی انتقادی فرصتی عالی برای تسلط بر واژگان ضروری به شمار می‌رود.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full'),
('40006000-0000-0000-0001-000700000002', '40006000-0000-0000-0000-000700000002', 2, 'clerk', 'Native speakers naturally use target words like bolster and circumscribe in conversation.', 'گویندگان نیتیو کلماتی چون bolster (تقویت بنیادین ارکان) و circumscribe (تعیین دقیق حدود و ثغور) را به صورت طبیعی در مکالمه به کار می‌برند.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full'),
('40006000-0000-0000-0001-000700000003', '40006000-0000-0000-0000-000700000002', 3, 'customer', 'Practicing sentence by sentence with clear pronunciation builds real conversational fluency.', 'تمرین جمله‌به‌جمله با تلفظ شفاف، تسلط و روانی واقعی در گفتار ایجاد می‌کند.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full'),
('40006000-0000-0000-0001-000700000004', '40006000-0000-0000-0000-000700000002', 4, 'clerk', 'Staying calm and consistent turns difficult phrases into everyday speech habits.', 'آرامش و استمرار در تمرین، عبارات دشوار را به عادت‌های گفتاری روزمره بدل می‌سازد.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full'),
('40006000-0000-0000-0001-000700000005', '40006000-0000-0000-0000-000700000002', 5, 'customer', 'Completing this unit brings us closer to full mastery of English vocabulary.', 'تکمیل این درس ما را به تسلط کامل بر دایره واژگان انگلیسی نزدیک‌تر می‌کند.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full')
ON CONFLICT (id) DO NOTHING;

INSERT INTO podcasts (id, title, description_fa, level, kind, series_id, episode_no, audio_url, audio_status, is_active, duration_seconds, position, vocabulary, scene_id)
VALUES ('40006000-0000-0000-0000-000700000003', 'Socio-Political Discourse (Book 6 - Unit 7)', 'روایت داستانی و آموزش واژگان یونیت 7 (گفتمان جامعه‌شناختی انتقادی) از کتاب 6 دوره ۴۰۰۰ واژه', 'proficient', 'lesson', '40000000-0006-0000-0000-000000000006', 7, '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'ready', TRUE, 314, 7, '[{"word": "bolster", "meaning_fa": "تقویت بنیادین ارکان"}, {"word": "circumscribe", "meaning_fa": "تعیین دقیق حدود و ثغور"}, {"word": "delineate", "meaning_fa": "تبیین موشکافانه ابعاد"}, {"word": "elucidate", "meaning_fa": "روشنگری عمیق مفهومی"}, {"word": "foster", "meaning_fa": "پرورش نظام‌مند استعدادها"}, {"word": "galvanize", "meaning_fa": "برانگیختن انگیزه فراگیر"}, {"word": "herald", "meaning_fa": "بشارت‌دهنده افق‌های نوین"}, {"word": "instigate", "meaning_fa": "آغازگری تحولات ساختاری"}, {"word": "juxtapose", "meaning_fa": "هم‌نشینی و مقایسه تطبیقی"}, {"word": "manifest", "meaning_fa": "تبلور عینی ارزش‌ها"}, {"word": "promulgate", "meaning_fa": "اشاعه و ترویج رسمی اندیشه"}, {"word": "reverberate", "meaning_fa": "بازتاب گسترده در جامعه"}, {"word": "scrutinize", "meaning_fa": "بررسی موشکافانه و دقیق"}, {"word": "transcend", "meaning_fa": "فراتر رفتن از محدودیت‌ها"}, {"word": "unravel", "meaning_fa": "گشودن گره‌های پیچیده"}, {"word": "venerate", "meaning_fa": "ارج نهادن و پاسداشت مقام"}, {"word": "warrant", "meaning_fa": "تضمین و توجیه شایسته"}, {"word": "crystallize", "meaning_fa": "تبلور شفاف دیدگاه"}, {"word": "culminate", "meaning_fa": "به اوج تکامل رسیدن"}, {"word": "amalgamate", "meaning_fa": "ادغام و یکپارچه‌سازی متعالی"}]'::jsonb, '40006000-0000-0000-0000-000700000001')
ON CONFLICT (id) DO UPDATE SET scene_id = EXCLUDED.scene_id, vocabulary = EXCLUDED.vocabulary;

INSERT INTO podcast_lines (podcast_id, position, speaker, text, translation_fa, start_ms, end_ms)
VALUES
('40006000-0000-0000-0000-000700000003', 0, 'Alex', 'Welcome to 4000 Essential English Words, Book 6, Unit 7: Socio-Political Discourse.', 'به درس 7 از کتاب 6 دوره ۴۰۰۰ واژه خوش آمدید: گفتمان جامعه‌شناختی انتقادی.', 0, 6000),
('40006000-0000-0000-0000-000700000003', 1, 'Sarah', 'Today we focus on 20 high-frequency vocabulary words used in real-life contexts.', 'امروز بر روی 20 واژه پرکاربرد در موقعیت‌های واقعی تمرکز می‌کنیم.', 6300, 13500),
('40006000-0000-0000-0000-000700000003', 2, 'Alex', 'Listen closely to the natural rhythm and pronunciation of each target phrase.', 'به ریتم طبیعی و تلفظ دقیق هر عبارت هدف خوب گوش فرا دهید.', 13800, 21000),
('40006000-0000-0000-0000-000700000003', 3, 'Sarah', 'Now head over to the shadowing section to record these sentences in your own voice!', 'حالا به بخش شادوئینگ بروید تا این جملات را با صدای خودتان تمرین و ضبط کنید!', 21400, 29000)
ON CONFLICT DO NOTHING;

-- کتاب 6 - درس 8: Economic Equilibrium
INSERT INTO scenes (id, title, description, background_image_url, difficulty, status, "order", category, is_custom)
VALUES ('40006000-0000-0000-0000-000800000001', 'Economic Equilibrium (Book 6 - Unit 8)', 'تمرین شادوئینگ یونیت 8 کتاب 6 (تعادل عمومی در اقتصاد کلان): elucidate, foster, galvanize, herald, instigate, juxtapose...', '', 'proficient', 'published', 608, 'education', false)
ON CONFLICT (id) DO NOTHING;

INSERT INTO hotspots (id, scene_id, name, x_position, y_position, order_index)
VALUES ('40006000-0000-0000-0000-000800000002', '40006000-0000-0000-0000-000800000001', 'Dialogue', 50.0, 50.0, 1)
ON CONFLICT (id) DO NOTHING;

INSERT INTO dialogues (id, hotspot_id, "order", speaker, original_text, translation, audio_url, display_type)
VALUES
('40006000-0000-0000-0001-000800000001', '40006000-0000-0000-0000-000800000002', 1, 'customer', 'Exploring economic equilibrium offers a great opportunity to master essential vocabulary.', 'بررسی موضوع تعادل عمومی در اقتصاد کلان فرصتی عالی برای تسلط بر واژگان ضروری به شمار می‌رود.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full'),
('40006000-0000-0000-0001-000800000002', '40006000-0000-0000-0000-000800000002', 2, 'clerk', 'Native speakers naturally use target words like elucidate and foster in conversation.', 'گویندگان نیتیو کلماتی چون elucidate (روشنگری عمیق مفهومی) و foster (پرورش نظام‌مند استعدادها) را به صورت طبیعی در مکالمه به کار می‌برند.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full'),
('40006000-0000-0000-0001-000800000003', '40006000-0000-0000-0000-000800000002', 3, 'customer', 'Practicing sentence by sentence with clear pronunciation builds real conversational fluency.', 'تمرین جمله‌به‌جمله با تلفظ شفاف، تسلط و روانی واقعی در گفتار ایجاد می‌کند.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full'),
('40006000-0000-0000-0001-000800000004', '40006000-0000-0000-0000-000800000002', 4, 'clerk', 'Staying calm and consistent turns difficult phrases into everyday speech habits.', 'آرامش و استمرار در تمرین، عبارات دشوار را به عادت‌های گفتاری روزمره بدل می‌سازد.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full'),
('40006000-0000-0000-0001-000800000005', '40006000-0000-0000-0000-000800000002', 5, 'customer', 'Completing this unit brings us closer to full mastery of English vocabulary.', 'تکمیل این درس ما را به تسلط کامل بر دایره واژگان انگلیسی نزدیک‌تر می‌کند.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full')
ON CONFLICT (id) DO NOTHING;

INSERT INTO podcasts (id, title, description_fa, level, kind, series_id, episode_no, audio_url, audio_status, is_active, duration_seconds, position, vocabulary, scene_id)
VALUES ('40006000-0000-0000-0000-000800000003', 'Economic Equilibrium (Book 6 - Unit 8)', 'روایت داستانی و آموزش واژگان یونیت 8 (تعادل عمومی در اقتصاد کلان) از کتاب 6 دوره ۴۰۰۰ واژه', 'proficient', 'lesson', '40000000-0006-0000-0000-000000000006', 8, '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'ready', TRUE, 316, 8, '[{"word": "elucidate", "meaning_fa": "روشنگری عمیق مفهومی"}, {"word": "foster", "meaning_fa": "پرورش نظام‌مند استعدادها"}, {"word": "galvanize", "meaning_fa": "برانگیختن انگیزه فراگیر"}, {"word": "herald", "meaning_fa": "بشارت‌دهنده افق‌های نوین"}, {"word": "instigate", "meaning_fa": "آغازگری تحولات ساختاری"}, {"word": "juxtapose", "meaning_fa": "هم‌نشینی و مقایسه تطبیقی"}, {"word": "manifest", "meaning_fa": "تبلور عینی ارزش‌ها"}, {"word": "promulgate", "meaning_fa": "اشاعه و ترویج رسمی اندیشه"}, {"word": "reverberate", "meaning_fa": "بازتاب گسترده در جامعه"}, {"word": "scrutinize", "meaning_fa": "بررسی موشکافانه و دقیق"}, {"word": "transcend", "meaning_fa": "فراتر رفتن از محدودیت‌ها"}, {"word": "unravel", "meaning_fa": "گشودن گره‌های پیچیده"}, {"word": "venerate", "meaning_fa": "ارج نهادن و پاسداشت مقام"}, {"word": "warrant", "meaning_fa": "تضمین و توجیه شایسته"}, {"word": "crystallize", "meaning_fa": "تبلور شفاف دیدگاه"}, {"word": "culminate", "meaning_fa": "به اوج تکامل رسیدن"}, {"word": "amalgamate", "meaning_fa": "ادغام و یکپارچه‌سازی متعالی"}, {"word": "bolster", "meaning_fa": "تقویت بنیادین ارکان"}, {"word": "circumscribe", "meaning_fa": "تعیین دقیق حدود و ثغور"}, {"word": "delineate", "meaning_fa": "تبیین موشکافانه ابعاد"}]'::jsonb, '40006000-0000-0000-0000-000800000001')
ON CONFLICT (id) DO UPDATE SET scene_id = EXCLUDED.scene_id, vocabulary = EXCLUDED.vocabulary;

INSERT INTO podcast_lines (podcast_id, position, speaker, text, translation_fa, start_ms, end_ms)
VALUES
('40006000-0000-0000-0000-000800000003', 0, 'Alex', 'Welcome to 4000 Essential English Words, Book 6, Unit 8: Economic Equilibrium.', 'به درس 8 از کتاب 6 دوره ۴۰۰۰ واژه خوش آمدید: تعادل عمومی در اقتصاد کلان.', 0, 6000),
('40006000-0000-0000-0000-000800000003', 1, 'Sarah', 'Today we focus on 20 high-frequency vocabulary words used in real-life contexts.', 'امروز بر روی 20 واژه پرکاربرد در موقعیت‌های واقعی تمرکز می‌کنیم.', 6300, 13500),
('40006000-0000-0000-0000-000800000003', 2, 'Alex', 'Listen closely to the natural rhythm and pronunciation of each target phrase.', 'به ریتم طبیعی و تلفظ دقیق هر عبارت هدف خوب گوش فرا دهید.', 13800, 21000),
('40006000-0000-0000-0000-000800000003', 3, 'Sarah', 'Now head over to the shadowing section to record these sentences in your own voice!', 'حالا به بخش شادوئینگ بروید تا این جملات را با صدای خودتان تمرین و ضبط کنید!', 21400, 29000)
ON CONFLICT DO NOTHING;

-- کتاب 6 - درس 9: Diplomatic Statecraft
INSERT INTO scenes (id, title, description, background_image_url, difficulty, status, "order", category, is_custom)
VALUES ('40006000-0000-0000-0000-000900000001', 'Diplomatic Statecraft (Book 6 - Unit 9)', 'تمرین شادوئینگ یونیت 9 کتاب 6 (هنر کشورداری و دیپلماسی ارشد): herald, instigate, juxtapose, manifest, promulgate, reverberate...', '', 'proficient', 'published', 609, 'education', false)
ON CONFLICT (id) DO NOTHING;

INSERT INTO hotspots (id, scene_id, name, x_position, y_position, order_index)
VALUES ('40006000-0000-0000-0000-000900000002', '40006000-0000-0000-0000-000900000001', 'Dialogue', 50.0, 50.0, 1)
ON CONFLICT (id) DO NOTHING;

INSERT INTO dialogues (id, hotspot_id, "order", speaker, original_text, translation, audio_url, display_type)
VALUES
('40006000-0000-0000-0001-000900000001', '40006000-0000-0000-0000-000900000002', 1, 'customer', 'Exploring diplomatic statecraft offers a great opportunity to master essential vocabulary.', 'بررسی موضوع هنر کشورداری و دیپلماسی ارشد فرصتی عالی برای تسلط بر واژگان ضروری به شمار می‌رود.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full'),
('40006000-0000-0000-0001-000900000002', '40006000-0000-0000-0000-000900000002', 2, 'clerk', 'Native speakers naturally use target words like herald and instigate in conversation.', 'گویندگان نیتیو کلماتی چون herald (بشارت‌دهنده افق‌های نوین) و instigate (آغازگری تحولات ساختاری) را به صورت طبیعی در مکالمه به کار می‌برند.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full'),
('40006000-0000-0000-0001-000900000003', '40006000-0000-0000-0000-000900000002', 3, 'customer', 'Practicing sentence by sentence with clear pronunciation builds real conversational fluency.', 'تمرین جمله‌به‌جمله با تلفظ شفاف، تسلط و روانی واقعی در گفتار ایجاد می‌کند.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full'),
('40006000-0000-0000-0001-000900000004', '40006000-0000-0000-0000-000900000002', 4, 'clerk', 'Staying calm and consistent turns difficult phrases into everyday speech habits.', 'آرامش و استمرار در تمرین، عبارات دشوار را به عادت‌های گفتاری روزمره بدل می‌سازد.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full'),
('40006000-0000-0000-0001-000900000005', '40006000-0000-0000-0000-000900000002', 5, 'customer', 'Completing this unit brings us closer to full mastery of English vocabulary.', 'تکمیل این درس ما را به تسلط کامل بر دایره واژگان انگلیسی نزدیک‌تر می‌کند.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full')
ON CONFLICT (id) DO NOTHING;

INSERT INTO podcasts (id, title, description_fa, level, kind, series_id, episode_no, audio_url, audio_status, is_active, duration_seconds, position, vocabulary, scene_id)
VALUES ('40006000-0000-0000-0000-000900000003', 'Diplomatic Statecraft (Book 6 - Unit 9)', 'روایت داستانی و آموزش واژگان یونیت 9 (هنر کشورداری و دیپلماسی ارشد) از کتاب 6 دوره ۴۰۰۰ واژه', 'proficient', 'lesson', '40000000-0006-0000-0000-000000000006', 9, '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'ready', TRUE, 318, 9, '[{"word": "herald", "meaning_fa": "بشارت‌دهنده افق‌های نوین"}, {"word": "instigate", "meaning_fa": "آغازگری تحولات ساختاری"}, {"word": "juxtapose", "meaning_fa": "هم‌نشینی و مقایسه تطبیقی"}, {"word": "manifest", "meaning_fa": "تبلور عینی ارزش‌ها"}, {"word": "promulgate", "meaning_fa": "اشاعه و ترویج رسمی اندیشه"}, {"word": "reverberate", "meaning_fa": "بازتاب گسترده در جامعه"}, {"word": "scrutinize", "meaning_fa": "بررسی موشکافانه و دقیق"}, {"word": "transcend", "meaning_fa": "فراتر رفتن از محدودیت‌ها"}, {"word": "unravel", "meaning_fa": "گشودن گره‌های پیچیده"}, {"word": "venerate", "meaning_fa": "ارج نهادن و پاسداشت مقام"}, {"word": "warrant", "meaning_fa": "تضمین و توجیه شایسته"}, {"word": "crystallize", "meaning_fa": "تبلور شفاف دیدگاه"}, {"word": "culminate", "meaning_fa": "به اوج تکامل رسیدن"}, {"word": "amalgamate", "meaning_fa": "ادغام و یکپارچه‌سازی متعالی"}, {"word": "bolster", "meaning_fa": "تقویت بنیادین ارکان"}, {"word": "circumscribe", "meaning_fa": "تعیین دقیق حدود و ثغور"}, {"word": "delineate", "meaning_fa": "تبیین موشکافانه ابعاد"}, {"word": "elucidate", "meaning_fa": "روشنگری عمیق مفهومی"}, {"word": "foster", "meaning_fa": "پرورش نظام‌مند استعدادها"}, {"word": "galvanize", "meaning_fa": "برانگیختن انگیزه فراگیر"}]'::jsonb, '40006000-0000-0000-0000-000900000001')
ON CONFLICT (id) DO UPDATE SET scene_id = EXCLUDED.scene_id, vocabulary = EXCLUDED.vocabulary;

INSERT INTO podcast_lines (podcast_id, position, speaker, text, translation_fa, start_ms, end_ms)
VALUES
('40006000-0000-0000-0000-000900000003', 0, 'Alex', 'Welcome to 4000 Essential English Words, Book 6, Unit 9: Diplomatic Statecraft.', 'به درس 9 از کتاب 6 دوره ۴۰۰۰ واژه خوش آمدید: هنر کشورداری و دیپلماسی ارشد.', 0, 6000),
('40006000-0000-0000-0000-000900000003', 1, 'Sarah', 'Today we focus on 20 high-frequency vocabulary words used in real-life contexts.', 'امروز بر روی 20 واژه پرکاربرد در موقعیت‌های واقعی تمرکز می‌کنیم.', 6300, 13500),
('40006000-0000-0000-0000-000900000003', 2, 'Alex', 'Listen closely to the natural rhythm and pronunciation of each target phrase.', 'به ریتم طبیعی و تلفظ دقیق هر عبارت هدف خوب گوش فرا دهید.', 13800, 21000),
('40006000-0000-0000-0000-000900000003', 3, 'Sarah', 'Now head over to the shadowing section to record these sentences in your own voice!', 'حالا به بخش شادوئینگ بروید تا این جملات را با صدای خودتان تمرین و ضبط کنید!', 21400, 29000)
ON CONFLICT DO NOTHING;

-- کتاب 6 - درس 10: Aesthetic Philosophy
INSERT INTO scenes (id, title, description, background_image_url, difficulty, status, "order", category, is_custom)
VALUES ('40006000-0000-0000-0000-001000000001', 'Aesthetic Philosophy (Book 6 - Unit 10)', 'تمرین شادوئینگ یونیت 10 کتاب 6 (فلسفه هنر و زیبایی‌شناسی): manifest, promulgate, reverberate, scrutinize, transcend, unravel...', '', 'proficient', 'published', 610, 'education', false)
ON CONFLICT (id) DO NOTHING;

INSERT INTO hotspots (id, scene_id, name, x_position, y_position, order_index)
VALUES ('40006000-0000-0000-0000-001000000002', '40006000-0000-0000-0000-001000000001', 'Dialogue', 50.0, 50.0, 1)
ON CONFLICT (id) DO NOTHING;

INSERT INTO dialogues (id, hotspot_id, "order", speaker, original_text, translation, audio_url, display_type)
VALUES
('40006000-0000-0000-0001-001000000001', '40006000-0000-0000-0000-001000000002', 1, 'customer', 'Exploring aesthetic philosophy offers a great opportunity to master essential vocabulary.', 'بررسی موضوع فلسفه هنر و زیبایی‌شناسی فرصتی عالی برای تسلط بر واژگان ضروری به شمار می‌رود.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full'),
('40006000-0000-0000-0001-001000000002', '40006000-0000-0000-0000-001000000002', 2, 'clerk', 'Native speakers naturally use target words like manifest and promulgate in conversation.', 'گویندگان نیتیو کلماتی چون manifest (تبلور عینی ارزش‌ها) و promulgate (اشاعه و ترویج رسمی اندیشه) را به صورت طبیعی در مکالمه به کار می‌برند.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full'),
('40006000-0000-0000-0001-001000000003', '40006000-0000-0000-0000-001000000002', 3, 'customer', 'Practicing sentence by sentence with clear pronunciation builds real conversational fluency.', 'تمرین جمله‌به‌جمله با تلفظ شفاف، تسلط و روانی واقعی در گفتار ایجاد می‌کند.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full'),
('40006000-0000-0000-0001-001000000004', '40006000-0000-0000-0000-001000000002', 4, 'clerk', 'Staying calm and consistent turns difficult phrases into everyday speech habits.', 'آرامش و استمرار در تمرین، عبارات دشوار را به عادت‌های گفتاری روزمره بدل می‌سازد.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full'),
('40006000-0000-0000-0001-001000000005', '40006000-0000-0000-0000-001000000002', 5, 'customer', 'Completing this unit brings us closer to full mastery of English vocabulary.', 'تکمیل این درس ما را به تسلط کامل بر دایره واژگان انگلیسی نزدیک‌تر می‌کند.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full')
ON CONFLICT (id) DO NOTHING;

INSERT INTO podcasts (id, title, description_fa, level, kind, series_id, episode_no, audio_url, audio_status, is_active, duration_seconds, position, vocabulary, scene_id)
VALUES ('40006000-0000-0000-0000-001000000003', 'Aesthetic Philosophy (Book 6 - Unit 10)', 'روایت داستانی و آموزش واژگان یونیت 10 (فلسفه هنر و زیبایی‌شناسی) از کتاب 6 دوره ۴۰۰۰ واژه', 'proficient', 'lesson', '40000000-0006-0000-0000-000000000006', 10, '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'ready', TRUE, 320, 10, '[{"word": "manifest", "meaning_fa": "تبلور عینی ارزش‌ها"}, {"word": "promulgate", "meaning_fa": "اشاعه و ترویج رسمی اندیشه"}, {"word": "reverberate", "meaning_fa": "بازتاب گسترده در جامعه"}, {"word": "scrutinize", "meaning_fa": "بررسی موشکافانه و دقیق"}, {"word": "transcend", "meaning_fa": "فراتر رفتن از محدودیت‌ها"}, {"word": "unravel", "meaning_fa": "گشودن گره‌های پیچیده"}, {"word": "venerate", "meaning_fa": "ارج نهادن و پاسداشت مقام"}, {"word": "warrant", "meaning_fa": "تضمین و توجیه شایسته"}, {"word": "crystallize", "meaning_fa": "تبلور شفاف دیدگاه"}, {"word": "culminate", "meaning_fa": "به اوج تکامل رسیدن"}, {"word": "amalgamate", "meaning_fa": "ادغام و یکپارچه‌سازی متعالی"}, {"word": "bolster", "meaning_fa": "تقویت بنیادین ارکان"}, {"word": "circumscribe", "meaning_fa": "تعیین دقیق حدود و ثغور"}, {"word": "delineate", "meaning_fa": "تبیین موشکافانه ابعاد"}, {"word": "elucidate", "meaning_fa": "روشنگری عمیق مفهومی"}, {"word": "foster", "meaning_fa": "پرورش نظام‌مند استعدادها"}, {"word": "galvanize", "meaning_fa": "برانگیختن انگیزه فراگیر"}, {"word": "herald", "meaning_fa": "بشارت‌دهنده افق‌های نوین"}, {"word": "instigate", "meaning_fa": "آغازگری تحولات ساختاری"}, {"word": "juxtapose", "meaning_fa": "هم‌نشینی و مقایسه تطبیقی"}]'::jsonb, '40006000-0000-0000-0000-001000000001')
ON CONFLICT (id) DO UPDATE SET scene_id = EXCLUDED.scene_id, vocabulary = EXCLUDED.vocabulary;

INSERT INTO podcast_lines (podcast_id, position, speaker, text, translation_fa, start_ms, end_ms)
VALUES
('40006000-0000-0000-0000-001000000003', 0, 'Alex', 'Welcome to 4000 Essential English Words, Book 6, Unit 10: Aesthetic Philosophy.', 'به درس 10 از کتاب 6 دوره ۴۰۰۰ واژه خوش آمدید: فلسفه هنر و زیبایی‌شناسی.', 0, 6000),
('40006000-0000-0000-0000-001000000003', 1, 'Sarah', 'Today we focus on 20 high-frequency vocabulary words used in real-life contexts.', 'امروز بر روی 20 واژه پرکاربرد در موقعیت‌های واقعی تمرکز می‌کنیم.', 6300, 13500),
('40006000-0000-0000-0000-001000000003', 2, 'Alex', 'Listen closely to the natural rhythm and pronunciation of each target phrase.', 'به ریتم طبیعی و تلفظ دقیق هر عبارت هدف خوب گوش فرا دهید.', 13800, 21000),
('40006000-0000-0000-0000-001000000003', 3, 'Sarah', 'Now head over to the shadowing section to record these sentences in your own voice!', 'حالا به بخش شادوئینگ بروید تا این جملات را با صدای خودتان تمرین و ضبط کنید!', 21400, 29000)
ON CONFLICT DO NOTHING;

-- کتاب 6 - درس 11: Linguistic Anthropology
INSERT INTO scenes (id, title, description, background_image_url, difficulty, status, "order", category, is_custom)
VALUES ('40006000-0000-0000-0000-001100000001', 'Linguistic Anthropology (Book 6 - Unit 11)', 'تمرین شادوئینگ یونیت 11 کتاب 6 (انسان‌شناسی زبان و فرهنگ): scrutinize, transcend, unravel, venerate, warrant, crystallize...', '', 'proficient', 'published', 611, 'education', false)
ON CONFLICT (id) DO NOTHING;

INSERT INTO hotspots (id, scene_id, name, x_position, y_position, order_index)
VALUES ('40006000-0000-0000-0000-001100000002', '40006000-0000-0000-0000-001100000001', 'Dialogue', 50.0, 50.0, 1)
ON CONFLICT (id) DO NOTHING;

INSERT INTO dialogues (id, hotspot_id, "order", speaker, original_text, translation, audio_url, display_type)
VALUES
('40006000-0000-0000-0001-001100000001', '40006000-0000-0000-0000-001100000002', 1, 'customer', 'Exploring linguistic anthropology offers a great opportunity to master essential vocabulary.', 'بررسی موضوع انسان‌شناسی زبان و فرهنگ فرصتی عالی برای تسلط بر واژگان ضروری به شمار می‌رود.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full'),
('40006000-0000-0000-0001-001100000002', '40006000-0000-0000-0000-001100000002', 2, 'clerk', 'Native speakers naturally use target words like scrutinize and transcend in conversation.', 'گویندگان نیتیو کلماتی چون scrutinize (بررسی موشکافانه و دقیق) و transcend (فراتر رفتن از محدودیت‌ها) را به صورت طبیعی در مکالمه به کار می‌برند.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full'),
('40006000-0000-0000-0001-001100000003', '40006000-0000-0000-0000-001100000002', 3, 'customer', 'Practicing sentence by sentence with clear pronunciation builds real conversational fluency.', 'تمرین جمله‌به‌جمله با تلفظ شفاف، تسلط و روانی واقعی در گفتار ایجاد می‌کند.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full'),
('40006000-0000-0000-0001-001100000004', '40006000-0000-0000-0000-001100000002', 4, 'clerk', 'Staying calm and consistent turns difficult phrases into everyday speech habits.', 'آرامش و استمرار در تمرین، عبارات دشوار را به عادت‌های گفتاری روزمره بدل می‌سازد.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full'),
('40006000-0000-0000-0001-001100000005', '40006000-0000-0000-0000-001100000002', 5, 'customer', 'Completing this unit brings us closer to full mastery of English vocabulary.', 'تکمیل این درس ما را به تسلط کامل بر دایره واژگان انگلیسی نزدیک‌تر می‌کند.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full')
ON CONFLICT (id) DO NOTHING;

INSERT INTO podcasts (id, title, description_fa, level, kind, series_id, episode_no, audio_url, audio_status, is_active, duration_seconds, position, vocabulary, scene_id)
VALUES ('40006000-0000-0000-0000-001100000003', 'Linguistic Anthropology (Book 6 - Unit 11)', 'روایت داستانی و آموزش واژگان یونیت 11 (انسان‌شناسی زبان و فرهنگ) از کتاب 6 دوره ۴۰۰۰ واژه', 'proficient', 'lesson', '40000000-0006-0000-0000-000000000006', 11, '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'ready', TRUE, 322, 11, '[{"word": "scrutinize", "meaning_fa": "بررسی موشکافانه و دقیق"}, {"word": "transcend", "meaning_fa": "فراتر رفتن از محدودیت‌ها"}, {"word": "unravel", "meaning_fa": "گشودن گره‌های پیچیده"}, {"word": "venerate", "meaning_fa": "ارج نهادن و پاسداشت مقام"}, {"word": "warrant", "meaning_fa": "تضمین و توجیه شایسته"}, {"word": "crystallize", "meaning_fa": "تبلور شفاف دیدگاه"}, {"word": "culminate", "meaning_fa": "به اوج تکامل رسیدن"}, {"word": "amalgamate", "meaning_fa": "ادغام و یکپارچه‌سازی متعالی"}, {"word": "bolster", "meaning_fa": "تقویت بنیادین ارکان"}, {"word": "circumscribe", "meaning_fa": "تعیین دقیق حدود و ثغور"}, {"word": "delineate", "meaning_fa": "تبیین موشکافانه ابعاد"}, {"word": "elucidate", "meaning_fa": "روشنگری عمیق مفهومی"}, {"word": "foster", "meaning_fa": "پرورش نظام‌مند استعدادها"}, {"word": "galvanize", "meaning_fa": "برانگیختن انگیزه فراگیر"}, {"word": "herald", "meaning_fa": "بشارت‌دهنده افق‌های نوین"}, {"word": "instigate", "meaning_fa": "آغازگری تحولات ساختاری"}, {"word": "juxtapose", "meaning_fa": "هم‌نشینی و مقایسه تطبیقی"}, {"word": "manifest", "meaning_fa": "تبلور عینی ارزش‌ها"}, {"word": "promulgate", "meaning_fa": "اشاعه و ترویج رسمی اندیشه"}, {"word": "reverberate", "meaning_fa": "بازتاب گسترده در جامعه"}]'::jsonb, '40006000-0000-0000-0000-001100000001')
ON CONFLICT (id) DO UPDATE SET scene_id = EXCLUDED.scene_id, vocabulary = EXCLUDED.vocabulary;

INSERT INTO podcast_lines (podcast_id, position, speaker, text, translation_fa, start_ms, end_ms)
VALUES
('40006000-0000-0000-0000-001100000003', 0, 'Alex', 'Welcome to 4000 Essential English Words, Book 6, Unit 11: Linguistic Anthropology.', 'به درس 11 از کتاب 6 دوره ۴۰۰۰ واژه خوش آمدید: انسان‌شناسی زبان و فرهنگ.', 0, 6000),
('40006000-0000-0000-0000-001100000003', 1, 'Sarah', 'Today we focus on 20 high-frequency vocabulary words used in real-life contexts.', 'امروز بر روی 20 واژه پرکاربرد در موقعیت‌های واقعی تمرکز می‌کنیم.', 6300, 13500),
('40006000-0000-0000-0000-001100000003', 2, 'Alex', 'Listen closely to the natural rhythm and pronunciation of each target phrase.', 'به ریتم طبیعی و تلفظ دقیق هر عبارت هدف خوب گوش فرا دهید.', 13800, 21000),
('40006000-0000-0000-0000-001100000003', 3, 'Sarah', 'Now head over to the shadowing section to record these sentences in your own voice!', 'حالا به بخش شادوئینگ بروید تا این جملات را با صدای خودتان تمرین و ضبط کنید!', 21400, 29000)
ON CONFLICT DO NOTHING;

-- کتاب 6 - درس 12: Mathematical Logic Systems
INSERT INTO scenes (id, title, description, background_image_url, difficulty, status, "order", category, is_custom)
VALUES ('40006000-0000-0000-0000-001200000001', 'Mathematical Logic Systems (Book 6 - Unit 12)', 'تمرین شادوئینگ یونیت 12 کتاب 6 (سیستم‌های منطق ریاضی صوری): venerate, warrant, crystallize, culminate, amalgamate, bolster...', '', 'proficient', 'published', 612, 'education', false)
ON CONFLICT (id) DO NOTHING;

INSERT INTO hotspots (id, scene_id, name, x_position, y_position, order_index)
VALUES ('40006000-0000-0000-0000-001200000002', '40006000-0000-0000-0000-001200000001', 'Dialogue', 50.0, 50.0, 1)
ON CONFLICT (id) DO NOTHING;

INSERT INTO dialogues (id, hotspot_id, "order", speaker, original_text, translation, audio_url, display_type)
VALUES
('40006000-0000-0000-0001-001200000001', '40006000-0000-0000-0000-001200000002', 1, 'customer', 'Exploring mathematical logic systems offers a great opportunity to master essential vocabulary.', 'بررسی موضوع سیستم‌های منطق ریاضی صوری فرصتی عالی برای تسلط بر واژگان ضروری به شمار می‌رود.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full'),
('40006000-0000-0000-0001-001200000002', '40006000-0000-0000-0000-001200000002', 2, 'clerk', 'Native speakers naturally use target words like venerate and warrant in conversation.', 'گویندگان نیتیو کلماتی چون venerate (ارج نهادن و پاسداشت مقام) و warrant (تضمین و توجیه شایسته) را به صورت طبیعی در مکالمه به کار می‌برند.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full'),
('40006000-0000-0000-0001-001200000003', '40006000-0000-0000-0000-001200000002', 3, 'customer', 'Practicing sentence by sentence with clear pronunciation builds real conversational fluency.', 'تمرین جمله‌به‌جمله با تلفظ شفاف، تسلط و روانی واقعی در گفتار ایجاد می‌کند.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full'),
('40006000-0000-0000-0001-001200000004', '40006000-0000-0000-0000-001200000002', 4, 'clerk', 'Staying calm and consistent turns difficult phrases into everyday speech habits.', 'آرامش و استمرار در تمرین، عبارات دشوار را به عادت‌های گفتاری روزمره بدل می‌سازد.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full'),
('40006000-0000-0000-0001-001200000005', '40006000-0000-0000-0000-001200000002', 5, 'customer', 'Completing this unit brings us closer to full mastery of English vocabulary.', 'تکمیل این درس ما را به تسلط کامل بر دایره واژگان انگلیسی نزدیک‌تر می‌کند.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full')
ON CONFLICT (id) DO NOTHING;

INSERT INTO podcasts (id, title, description_fa, level, kind, series_id, episode_no, audio_url, audio_status, is_active, duration_seconds, position, vocabulary, scene_id)
VALUES ('40006000-0000-0000-0000-001200000003', 'Mathematical Logic Systems (Book 6 - Unit 12)', 'روایت داستانی و آموزش واژگان یونیت 12 (سیستم‌های منطق ریاضی صوری) از کتاب 6 دوره ۴۰۰۰ واژه', 'proficient', 'lesson', '40000000-0006-0000-0000-000000000006', 12, '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'ready', TRUE, 324, 12, '[{"word": "venerate", "meaning_fa": "ارج نهادن و پاسداشت مقام"}, {"word": "warrant", "meaning_fa": "تضمین و توجیه شایسته"}, {"word": "crystallize", "meaning_fa": "تبلور شفاف دیدگاه"}, {"word": "culminate", "meaning_fa": "به اوج تکامل رسیدن"}, {"word": "amalgamate", "meaning_fa": "ادغام و یکپارچه‌سازی متعالی"}, {"word": "bolster", "meaning_fa": "تقویت بنیادین ارکان"}, {"word": "circumscribe", "meaning_fa": "تعیین دقیق حدود و ثغور"}, {"word": "delineate", "meaning_fa": "تبیین موشکافانه ابعاد"}, {"word": "elucidate", "meaning_fa": "روشنگری عمیق مفهومی"}, {"word": "foster", "meaning_fa": "پرورش نظام‌مند استعدادها"}, {"word": "galvanize", "meaning_fa": "برانگیختن انگیزه فراگیر"}, {"word": "herald", "meaning_fa": "بشارت‌دهنده افق‌های نوین"}, {"word": "instigate", "meaning_fa": "آغازگری تحولات ساختاری"}, {"word": "juxtapose", "meaning_fa": "هم‌نشینی و مقایسه تطبیقی"}, {"word": "manifest", "meaning_fa": "تبلور عینی ارزش‌ها"}, {"word": "promulgate", "meaning_fa": "اشاعه و ترویج رسمی اندیشه"}, {"word": "reverberate", "meaning_fa": "بازتاب گسترده در جامعه"}, {"word": "scrutinize", "meaning_fa": "بررسی موشکافانه و دقیق"}, {"word": "transcend", "meaning_fa": "فراتر رفتن از محدودیت‌ها"}, {"word": "unravel", "meaning_fa": "گشودن گره‌های پیچیده"}]'::jsonb, '40006000-0000-0000-0000-001200000001')
ON CONFLICT (id) DO UPDATE SET scene_id = EXCLUDED.scene_id, vocabulary = EXCLUDED.vocabulary;

INSERT INTO podcast_lines (podcast_id, position, speaker, text, translation_fa, start_ms, end_ms)
VALUES
('40006000-0000-0000-0000-001200000003', 0, 'Alex', 'Welcome to 4000 Essential English Words, Book 6, Unit 12: Mathematical Logic Systems.', 'به درس 12 از کتاب 6 دوره ۴۰۰۰ واژه خوش آمدید: سیستم‌های منطق ریاضی صوری.', 0, 6000),
('40006000-0000-0000-0000-001200000003', 1, 'Sarah', 'Today we focus on 20 high-frequency vocabulary words used in real-life contexts.', 'امروز بر روی 20 واژه پرکاربرد در موقعیت‌های واقعی تمرکز می‌کنیم.', 6300, 13500),
('40006000-0000-0000-0000-001200000003', 2, 'Alex', 'Listen closely to the natural rhythm and pronunciation of each target phrase.', 'به ریتم طبیعی و تلفظ دقیق هر عبارت هدف خوب گوش فرا دهید.', 13800, 21000),
('40006000-0000-0000-0000-001200000003', 3, 'Sarah', 'Now head over to the shadowing section to record these sentences in your own voice!', 'حالا به بخش شادوئینگ بروید تا این جملات را با صدای خودتان تمرین و ضبط کنید!', 21400, 29000)
ON CONFLICT DO NOTHING;

-- کتاب 6 - درس 13: Strategic Foresight Analysis
INSERT INTO scenes (id, title, description, background_image_url, difficulty, status, "order", category, is_custom)
VALUES ('40006000-0000-0000-0000-001300000001', 'Strategic Foresight Analysis (Book 6 - Unit 13)', 'تمرین شادوئینگ یونیت 13 کتاب 6 (آینده‌پژوهی راهبردی سازمان‌ها): culminate, amalgamate, bolster, circumscribe, delineate, elucidate...', '', 'proficient', 'published', 613, 'education', false)
ON CONFLICT (id) DO NOTHING;

INSERT INTO hotspots (id, scene_id, name, x_position, y_position, order_index)
VALUES ('40006000-0000-0000-0000-001300000002', '40006000-0000-0000-0000-001300000001', 'Dialogue', 50.0, 50.0, 1)
ON CONFLICT (id) DO NOTHING;

INSERT INTO dialogues (id, hotspot_id, "order", speaker, original_text, translation, audio_url, display_type)
VALUES
('40006000-0000-0000-0001-001300000001', '40006000-0000-0000-0000-001300000002', 1, 'customer', 'Exploring strategic foresight analysis offers a great opportunity to master essential vocabulary.', 'بررسی موضوع آینده‌پژوهی راهبردی سازمان‌ها فرصتی عالی برای تسلط بر واژگان ضروری به شمار می‌رود.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full'),
('40006000-0000-0000-0001-001300000002', '40006000-0000-0000-0000-001300000002', 2, 'clerk', 'Native speakers naturally use target words like culminate and amalgamate in conversation.', 'گویندگان نیتیو کلماتی چون culminate (به اوج تکامل رسیدن) و amalgamate (ادغام و یکپارچه‌سازی متعالی) را به صورت طبیعی در مکالمه به کار می‌برند.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full'),
('40006000-0000-0000-0001-001300000003', '40006000-0000-0000-0000-001300000002', 3, 'customer', 'Practicing sentence by sentence with clear pronunciation builds real conversational fluency.', 'تمرین جمله‌به‌جمله با تلفظ شفاف، تسلط و روانی واقعی در گفتار ایجاد می‌کند.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full'),
('40006000-0000-0000-0001-001300000004', '40006000-0000-0000-0000-001300000002', 4, 'clerk', 'Staying calm and consistent turns difficult phrases into everyday speech habits.', 'آرامش و استمرار در تمرین، عبارات دشوار را به عادت‌های گفتاری روزمره بدل می‌سازد.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full'),
('40006000-0000-0000-0001-001300000005', '40006000-0000-0000-0000-001300000002', 5, 'customer', 'Completing this unit brings us closer to full mastery of English vocabulary.', 'تکمیل این درس ما را به تسلط کامل بر دایره واژگان انگلیسی نزدیک‌تر می‌کند.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full')
ON CONFLICT (id) DO NOTHING;

INSERT INTO podcasts (id, title, description_fa, level, kind, series_id, episode_no, audio_url, audio_status, is_active, duration_seconds, position, vocabulary, scene_id)
VALUES ('40006000-0000-0000-0000-001300000003', 'Strategic Foresight Analysis (Book 6 - Unit 13)', 'روایت داستانی و آموزش واژگان یونیت 13 (آینده‌پژوهی راهبردی سازمان‌ها) از کتاب 6 دوره ۴۰۰۰ واژه', 'proficient', 'lesson', '40000000-0006-0000-0000-000000000006', 13, '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'ready', TRUE, 326, 13, '[{"word": "culminate", "meaning_fa": "به اوج تکامل رسیدن"}, {"word": "amalgamate", "meaning_fa": "ادغام و یکپارچه‌سازی متعالی"}, {"word": "bolster", "meaning_fa": "تقویت بنیادین ارکان"}, {"word": "circumscribe", "meaning_fa": "تعیین دقیق حدود و ثغور"}, {"word": "delineate", "meaning_fa": "تبیین موشکافانه ابعاد"}, {"word": "elucidate", "meaning_fa": "روشنگری عمیق مفهومی"}, {"word": "foster", "meaning_fa": "پرورش نظام‌مند استعدادها"}, {"word": "galvanize", "meaning_fa": "برانگیختن انگیزه فراگیر"}, {"word": "herald", "meaning_fa": "بشارت‌دهنده افق‌های نوین"}, {"word": "instigate", "meaning_fa": "آغازگری تحولات ساختاری"}, {"word": "juxtapose", "meaning_fa": "هم‌نشینی و مقایسه تطبیقی"}, {"word": "manifest", "meaning_fa": "تبلور عینی ارزش‌ها"}, {"word": "promulgate", "meaning_fa": "اشاعه و ترویج رسمی اندیشه"}, {"word": "reverberate", "meaning_fa": "بازتاب گسترده در جامعه"}, {"word": "scrutinize", "meaning_fa": "بررسی موشکافانه و دقیق"}, {"word": "transcend", "meaning_fa": "فراتر رفتن از محدودیت‌ها"}, {"word": "unravel", "meaning_fa": "گشودن گره‌های پیچیده"}, {"word": "venerate", "meaning_fa": "ارج نهادن و پاسداشت مقام"}, {"word": "warrant", "meaning_fa": "تضمین و توجیه شایسته"}, {"word": "crystallize", "meaning_fa": "تبلور شفاف دیدگاه"}]'::jsonb, '40006000-0000-0000-0000-001300000001')
ON CONFLICT (id) DO UPDATE SET scene_id = EXCLUDED.scene_id, vocabulary = EXCLUDED.vocabulary;

INSERT INTO podcast_lines (podcast_id, position, speaker, text, translation_fa, start_ms, end_ms)
VALUES
('40006000-0000-0000-0000-001300000003', 0, 'Alex', 'Welcome to 4000 Essential English Words, Book 6, Unit 13: Strategic Foresight Analysis.', 'به درس 13 از کتاب 6 دوره ۴۰۰۰ واژه خوش آمدید: آینده‌پژوهی راهبردی سازمان‌ها.', 0, 6000),
('40006000-0000-0000-0000-001300000003', 1, 'Sarah', 'Today we focus on 20 high-frequency vocabulary words used in real-life contexts.', 'امروز بر روی 20 واژه پرکاربرد در موقعیت‌های واقعی تمرکز می‌کنیم.', 6300, 13500),
('40006000-0000-0000-0000-001300000003', 2, 'Alex', 'Listen closely to the natural rhythm and pronunciation of each target phrase.', 'به ریتم طبیعی و تلفظ دقیق هر عبارت هدف خوب گوش فرا دهید.', 13800, 21000),
('40006000-0000-0000-0000-001300000003', 3, 'Sarah', 'Now head over to the shadowing section to record these sentences in your own voice!', 'حالا به بخش شادوئینگ بروید تا این جملات را با صدای خودتان تمرین و ضبط کنید!', 21400, 29000)
ON CONFLICT DO NOTHING;

-- کتاب 6 - درس 14: Epistemic Uncertainty
INSERT INTO scenes (id, title, description, background_image_url, difficulty, status, "order", category, is_custom)
VALUES ('40006000-0000-0000-0000-001400000001', 'Epistemic Uncertainty (Book 6 - Unit 14)', 'تمرین شادوئینگ یونیت 14 کتاب 6 (عدم قطعیت در شناخت علمی): circumscribe, delineate, elucidate, foster, galvanize, herald...', '', 'proficient', 'published', 614, 'education', false)
ON CONFLICT (id) DO NOTHING;

INSERT INTO hotspots (id, scene_id, name, x_position, y_position, order_index)
VALUES ('40006000-0000-0000-0000-001400000002', '40006000-0000-0000-0000-001400000001', 'Dialogue', 50.0, 50.0, 1)
ON CONFLICT (id) DO NOTHING;

INSERT INTO dialogues (id, hotspot_id, "order", speaker, original_text, translation, audio_url, display_type)
VALUES
('40006000-0000-0000-0001-001400000001', '40006000-0000-0000-0000-001400000002', 1, 'customer', 'Exploring epistemic uncertainty offers a great opportunity to master essential vocabulary.', 'بررسی موضوع عدم قطعیت در شناخت علمی فرصتی عالی برای تسلط بر واژگان ضروری به شمار می‌رود.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full'),
('40006000-0000-0000-0001-001400000002', '40006000-0000-0000-0000-001400000002', 2, 'clerk', 'Native speakers naturally use target words like circumscribe and delineate in conversation.', 'گویندگان نیتیو کلماتی چون circumscribe (تعیین دقیق حدود و ثغور) و delineate (تبیین موشکافانه ابعاد) را به صورت طبیعی در مکالمه به کار می‌برند.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full'),
('40006000-0000-0000-0001-001400000003', '40006000-0000-0000-0000-001400000002', 3, 'customer', 'Practicing sentence by sentence with clear pronunciation builds real conversational fluency.', 'تمرین جمله‌به‌جمله با تلفظ شفاف، تسلط و روانی واقعی در گفتار ایجاد می‌کند.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full'),
('40006000-0000-0000-0001-001400000004', '40006000-0000-0000-0000-001400000002', 4, 'clerk', 'Staying calm and consistent turns difficult phrases into everyday speech habits.', 'آرامش و استمرار در تمرین، عبارات دشوار را به عادت‌های گفتاری روزمره بدل می‌سازد.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full'),
('40006000-0000-0000-0001-001400000005', '40006000-0000-0000-0000-001400000002', 5, 'customer', 'Completing this unit brings us closer to full mastery of English vocabulary.', 'تکمیل این درس ما را به تسلط کامل بر دایره واژگان انگلیسی نزدیک‌تر می‌کند.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full')
ON CONFLICT (id) DO NOTHING;

INSERT INTO podcasts (id, title, description_fa, level, kind, series_id, episode_no, audio_url, audio_status, is_active, duration_seconds, position, vocabulary, scene_id)
VALUES ('40006000-0000-0000-0000-001400000003', 'Epistemic Uncertainty (Book 6 - Unit 14)', 'روایت داستانی و آموزش واژگان یونیت 14 (عدم قطعیت در شناخت علمی) از کتاب 6 دوره ۴۰۰۰ واژه', 'proficient', 'lesson', '40000000-0006-0000-0000-000000000006', 14, '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'ready', TRUE, 328, 14, '[{"word": "circumscribe", "meaning_fa": "تعیین دقیق حدود و ثغور"}, {"word": "delineate", "meaning_fa": "تبیین موشکافانه ابعاد"}, {"word": "elucidate", "meaning_fa": "روشنگری عمیق مفهومی"}, {"word": "foster", "meaning_fa": "پرورش نظام‌مند استعدادها"}, {"word": "galvanize", "meaning_fa": "برانگیختن انگیزه فراگیر"}, {"word": "herald", "meaning_fa": "بشارت‌دهنده افق‌های نوین"}, {"word": "instigate", "meaning_fa": "آغازگری تحولات ساختاری"}, {"word": "juxtapose", "meaning_fa": "هم‌نشینی و مقایسه تطبیقی"}, {"word": "manifest", "meaning_fa": "تبلور عینی ارزش‌ها"}, {"word": "promulgate", "meaning_fa": "اشاعه و ترویج رسمی اندیشه"}, {"word": "reverberate", "meaning_fa": "بازتاب گسترده در جامعه"}, {"word": "scrutinize", "meaning_fa": "بررسی موشکافانه و دقیق"}, {"word": "transcend", "meaning_fa": "فراتر رفتن از محدودیت‌ها"}, {"word": "unravel", "meaning_fa": "گشودن گره‌های پیچیده"}, {"word": "venerate", "meaning_fa": "ارج نهادن و پاسداشت مقام"}, {"word": "warrant", "meaning_fa": "تضمین و توجیه شایسته"}, {"word": "crystallize", "meaning_fa": "تبلور شفاف دیدگاه"}, {"word": "culminate", "meaning_fa": "به اوج تکامل رسیدن"}, {"word": "amalgamate", "meaning_fa": "ادغام و یکپارچه‌سازی متعالی"}, {"word": "bolster", "meaning_fa": "تقویت بنیادین ارکان"}]'::jsonb, '40006000-0000-0000-0000-001400000001')
ON CONFLICT (id) DO UPDATE SET scene_id = EXCLUDED.scene_id, vocabulary = EXCLUDED.vocabulary;

INSERT INTO podcast_lines (podcast_id, position, speaker, text, translation_fa, start_ms, end_ms)
VALUES
('40006000-0000-0000-0000-001400000003', 0, 'Alex', 'Welcome to 4000 Essential English Words, Book 6, Unit 14: Epistemic Uncertainty.', 'به درس 14 از کتاب 6 دوره ۴۰۰۰ واژه خوش آمدید: عدم قطعیت در شناخت علمی.', 0, 6000),
('40006000-0000-0000-0000-001400000003', 1, 'Sarah', 'Today we focus on 20 high-frequency vocabulary words used in real-life contexts.', 'امروز بر روی 20 واژه پرکاربرد در موقعیت‌های واقعی تمرکز می‌کنیم.', 6300, 13500),
('40006000-0000-0000-0000-001400000003', 2, 'Alex', 'Listen closely to the natural rhythm and pronunciation of each target phrase.', 'به ریتم طبیعی و تلفظ دقیق هر عبارت هدف خوب گوش فرا دهید.', 13800, 21000),
('40006000-0000-0000-0000-001400000003', 3, 'Sarah', 'Now head over to the shadowing section to record these sentences in your own voice!', 'حالا به بخش شادوئینگ بروید تا این جملات را با صدای خودتان تمرین و ضبط کنید!', 21400, 29000)
ON CONFLICT DO NOTHING;

-- کتاب 6 - درس 15: Comparative Literature Canons
INSERT INTO scenes (id, title, description, background_image_url, difficulty, status, "order", category, is_custom)
VALUES ('40006000-0000-0000-0000-001500000001', 'Comparative Literature Canons (Book 6 - Unit 15)', 'تمرین شادوئینگ یونیت 15 کتاب 6 (شاهکارهای ادبیات تطبیقی): foster, galvanize, herald, instigate, juxtapose, manifest...', '', 'proficient', 'published', 615, 'education', false)
ON CONFLICT (id) DO NOTHING;

INSERT INTO hotspots (id, scene_id, name, x_position, y_position, order_index)
VALUES ('40006000-0000-0000-0000-001500000002', '40006000-0000-0000-0000-001500000001', 'Dialogue', 50.0, 50.0, 1)
ON CONFLICT (id) DO NOTHING;

INSERT INTO dialogues (id, hotspot_id, "order", speaker, original_text, translation, audio_url, display_type)
VALUES
('40006000-0000-0000-0001-001500000001', '40006000-0000-0000-0000-001500000002', 1, 'customer', 'Exploring comparative literature canons offers a great opportunity to master essential vocabulary.', 'بررسی موضوع شاهکارهای ادبیات تطبیقی فرصتی عالی برای تسلط بر واژگان ضروری به شمار می‌رود.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full'),
('40006000-0000-0000-0001-001500000002', '40006000-0000-0000-0000-001500000002', 2, 'clerk', 'Native speakers naturally use target words like foster and galvanize in conversation.', 'گویندگان نیتیو کلماتی چون foster (پرورش نظام‌مند استعدادها) و galvanize (برانگیختن انگیزه فراگیر) را به صورت طبیعی در مکالمه به کار می‌برند.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full'),
('40006000-0000-0000-0001-001500000003', '40006000-0000-0000-0000-001500000002', 3, 'customer', 'Practicing sentence by sentence with clear pronunciation builds real conversational fluency.', 'تمرین جمله‌به‌جمله با تلفظ شفاف، تسلط و روانی واقعی در گفتار ایجاد می‌کند.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full'),
('40006000-0000-0000-0001-001500000004', '40006000-0000-0000-0000-001500000002', 4, 'clerk', 'Staying calm and consistent turns difficult phrases into everyday speech habits.', 'آرامش و استمرار در تمرین، عبارات دشوار را به عادت‌های گفتاری روزمره بدل می‌سازد.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full'),
('40006000-0000-0000-0001-001500000005', '40006000-0000-0000-0000-001500000002', 5, 'customer', 'Completing this unit brings us closer to full mastery of English vocabulary.', 'تکمیل این درس ما را به تسلط کامل بر دایره واژگان انگلیسی نزدیک‌تر می‌کند.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full')
ON CONFLICT (id) DO NOTHING;

INSERT INTO podcasts (id, title, description_fa, level, kind, series_id, episode_no, audio_url, audio_status, is_active, duration_seconds, position, vocabulary, scene_id)
VALUES ('40006000-0000-0000-0000-001500000003', 'Comparative Literature Canons (Book 6 - Unit 15)', 'روایت داستانی و آموزش واژگان یونیت 15 (شاهکارهای ادبیات تطبیقی) از کتاب 6 دوره ۴۰۰۰ واژه', 'proficient', 'lesson', '40000000-0006-0000-0000-000000000006', 15, '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'ready', TRUE, 330, 15, '[{"word": "foster", "meaning_fa": "پرورش نظام‌مند استعدادها"}, {"word": "galvanize", "meaning_fa": "برانگیختن انگیزه فراگیر"}, {"word": "herald", "meaning_fa": "بشارت‌دهنده افق‌های نوین"}, {"word": "instigate", "meaning_fa": "آغازگری تحولات ساختاری"}, {"word": "juxtapose", "meaning_fa": "هم‌نشینی و مقایسه تطبیقی"}, {"word": "manifest", "meaning_fa": "تبلور عینی ارزش‌ها"}, {"word": "promulgate", "meaning_fa": "اشاعه و ترویج رسمی اندیشه"}, {"word": "reverberate", "meaning_fa": "بازتاب گسترده در جامعه"}, {"word": "scrutinize", "meaning_fa": "بررسی موشکافانه و دقیق"}, {"word": "transcend", "meaning_fa": "فراتر رفتن از محدودیت‌ها"}, {"word": "unravel", "meaning_fa": "گشودن گره‌های پیچیده"}, {"word": "venerate", "meaning_fa": "ارج نهادن و پاسداشت مقام"}, {"word": "warrant", "meaning_fa": "تضمین و توجیه شایسته"}, {"word": "crystallize", "meaning_fa": "تبلور شفاف دیدگاه"}, {"word": "culminate", "meaning_fa": "به اوج تکامل رسیدن"}, {"word": "amalgamate", "meaning_fa": "ادغام و یکپارچه‌سازی متعالی"}, {"word": "bolster", "meaning_fa": "تقویت بنیادین ارکان"}, {"word": "circumscribe", "meaning_fa": "تعیین دقیق حدود و ثغور"}, {"word": "delineate", "meaning_fa": "تبیین موشکافانه ابعاد"}, {"word": "elucidate", "meaning_fa": "روشنگری عمیق مفهومی"}]'::jsonb, '40006000-0000-0000-0000-001500000001')
ON CONFLICT (id) DO UPDATE SET scene_id = EXCLUDED.scene_id, vocabulary = EXCLUDED.vocabulary;

INSERT INTO podcast_lines (podcast_id, position, speaker, text, translation_fa, start_ms, end_ms)
VALUES
('40006000-0000-0000-0000-001500000003', 0, 'Alex', 'Welcome to 4000 Essential English Words, Book 6, Unit 15: Comparative Literature Canons.', 'به درس 15 از کتاب 6 دوره ۴۰۰۰ واژه خوش آمدید: شاهکارهای ادبیات تطبیقی.', 0, 6000),
('40006000-0000-0000-0000-001500000003', 1, 'Sarah', 'Today we focus on 20 high-frequency vocabulary words used in real-life contexts.', 'امروز بر روی 20 واژه پرکاربرد در موقعیت‌های واقعی تمرکز می‌کنیم.', 6300, 13500),
('40006000-0000-0000-0000-001500000003', 2, 'Alex', 'Listen closely to the natural rhythm and pronunciation of each target phrase.', 'به ریتم طبیعی و تلفظ دقیق هر عبارت هدف خوب گوش فرا دهید.', 13800, 21000),
('40006000-0000-0000-0000-001500000003', 3, 'Sarah', 'Now head over to the shadowing section to record these sentences in your own voice!', 'حالا به بخش شادوئینگ بروید تا این جملات را با صدای خودتان تمرین و ضبط کنید!', 21400, 29000)
ON CONFLICT DO NOTHING;

-- کتاب 6 - درس 16: Global Institutional Governance
INSERT INTO scenes (id, title, description, background_image_url, difficulty, status, "order", category, is_custom)
VALUES ('40006000-0000-0000-0000-001600000001', 'Global Institutional Governance (Book 6 - Unit 16)', 'تمرین شادوئینگ یونیت 16 کتاب 6 (حکمرانی نهادهای بین‌المللی): instigate, juxtapose, manifest, promulgate, reverberate, scrutinize...', '', 'proficient', 'published', 616, 'education', false)
ON CONFLICT (id) DO NOTHING;

INSERT INTO hotspots (id, scene_id, name, x_position, y_position, order_index)
VALUES ('40006000-0000-0000-0000-001600000002', '40006000-0000-0000-0000-001600000001', 'Dialogue', 50.0, 50.0, 1)
ON CONFLICT (id) DO NOTHING;

INSERT INTO dialogues (id, hotspot_id, "order", speaker, original_text, translation, audio_url, display_type)
VALUES
('40006000-0000-0000-0001-001600000001', '40006000-0000-0000-0000-001600000002', 1, 'customer', 'Exploring global institutional governance offers a great opportunity to master essential vocabulary.', 'بررسی موضوع حکمرانی نهادهای بین‌المللی فرصتی عالی برای تسلط بر واژگان ضروری به شمار می‌رود.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full'),
('40006000-0000-0000-0001-001600000002', '40006000-0000-0000-0000-001600000002', 2, 'clerk', 'Native speakers naturally use target words like instigate and juxtapose in conversation.', 'گویندگان نیتیو کلماتی چون instigate (آغازگری تحولات ساختاری) و juxtapose (هم‌نشینی و مقایسه تطبیقی) را به صورت طبیعی در مکالمه به کار می‌برند.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full'),
('40006000-0000-0000-0001-001600000003', '40006000-0000-0000-0000-001600000002', 3, 'customer', 'Practicing sentence by sentence with clear pronunciation builds real conversational fluency.', 'تمرین جمله‌به‌جمله با تلفظ شفاف، تسلط و روانی واقعی در گفتار ایجاد می‌کند.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full'),
('40006000-0000-0000-0001-001600000004', '40006000-0000-0000-0000-001600000002', 4, 'clerk', 'Staying calm and consistent turns difficult phrases into everyday speech habits.', 'آرامش و استمرار در تمرین، عبارات دشوار را به عادت‌های گفتاری روزمره بدل می‌سازد.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full'),
('40006000-0000-0000-0001-001600000005', '40006000-0000-0000-0000-001600000002', 5, 'customer', 'Completing this unit brings us closer to full mastery of English vocabulary.', 'تکمیل این درس ما را به تسلط کامل بر دایره واژگان انگلیسی نزدیک‌تر می‌کند.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full')
ON CONFLICT (id) DO NOTHING;

INSERT INTO podcasts (id, title, description_fa, level, kind, series_id, episode_no, audio_url, audio_status, is_active, duration_seconds, position, vocabulary, scene_id)
VALUES ('40006000-0000-0000-0000-001600000003', 'Global Institutional Governance (Book 6 - Unit 16)', 'روایت داستانی و آموزش واژگان یونیت 16 (حکمرانی نهادهای بین‌المللی) از کتاب 6 دوره ۴۰۰۰ واژه', 'proficient', 'lesson', '40000000-0006-0000-0000-000000000006', 16, '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'ready', TRUE, 332, 16, '[{"word": "instigate", "meaning_fa": "آغازگری تحولات ساختاری"}, {"word": "juxtapose", "meaning_fa": "هم‌نشینی و مقایسه تطبیقی"}, {"word": "manifest", "meaning_fa": "تبلور عینی ارزش‌ها"}, {"word": "promulgate", "meaning_fa": "اشاعه و ترویج رسمی اندیشه"}, {"word": "reverberate", "meaning_fa": "بازتاب گسترده در جامعه"}, {"word": "scrutinize", "meaning_fa": "بررسی موشکافانه و دقیق"}, {"word": "transcend", "meaning_fa": "فراتر رفتن از محدودیت‌ها"}, {"word": "unravel", "meaning_fa": "گشودن گره‌های پیچیده"}, {"word": "venerate", "meaning_fa": "ارج نهادن و پاسداشت مقام"}, {"word": "warrant", "meaning_fa": "تضمین و توجیه شایسته"}, {"word": "crystallize", "meaning_fa": "تبلور شفاف دیدگاه"}, {"word": "culminate", "meaning_fa": "به اوج تکامل رسیدن"}, {"word": "amalgamate", "meaning_fa": "ادغام و یکپارچه‌سازی متعالی"}, {"word": "bolster", "meaning_fa": "تقویت بنیادین ارکان"}, {"word": "circumscribe", "meaning_fa": "تعیین دقیق حدود و ثغور"}, {"word": "delineate", "meaning_fa": "تبیین موشکافانه ابعاد"}, {"word": "elucidate", "meaning_fa": "روشنگری عمیق مفهومی"}, {"word": "foster", "meaning_fa": "پرورش نظام‌مند استعدادها"}, {"word": "galvanize", "meaning_fa": "برانگیختن انگیزه فراگیر"}, {"word": "herald", "meaning_fa": "بشارت‌دهنده افق‌های نوین"}]'::jsonb, '40006000-0000-0000-0000-001600000001')
ON CONFLICT (id) DO UPDATE SET scene_id = EXCLUDED.scene_id, vocabulary = EXCLUDED.vocabulary;

INSERT INTO podcast_lines (podcast_id, position, speaker, text, translation_fa, start_ms, end_ms)
VALUES
('40006000-0000-0000-0000-001600000003', 0, 'Alex', 'Welcome to 4000 Essential English Words, Book 6, Unit 16: Global Institutional Governance.', 'به درس 16 از کتاب 6 دوره ۴۰۰۰ واژه خوش آمدید: حکمرانی نهادهای بین‌المللی.', 0, 6000),
('40006000-0000-0000-0000-001600000003', 1, 'Sarah', 'Today we focus on 20 high-frequency vocabulary words used in real-life contexts.', 'امروز بر روی 20 واژه پرکاربرد در موقعیت‌های واقعی تمرکز می‌کنیم.', 6300, 13500),
('40006000-0000-0000-0000-001600000003', 2, 'Alex', 'Listen closely to the natural rhythm and pronunciation of each target phrase.', 'به ریتم طبیعی و تلفظ دقیق هر عبارت هدف خوب گوش فرا دهید.', 13800, 21000),
('40006000-0000-0000-0000-001600000003', 3, 'Sarah', 'Now head over to the shadowing section to record these sentences in your own voice!', 'حالا به بخش شادوئینگ بروید تا این جملات را با صدای خودتان تمرین و ضبط کنید!', 21400, 29000)
ON CONFLICT DO NOTHING;

-- کتاب 6 - درس 17: Cognitive Linguistics Paradigms
INSERT INTO scenes (id, title, description, background_image_url, difficulty, status, "order", category, is_custom)
VALUES ('40006000-0000-0000-0000-001700000001', 'Cognitive Linguistics Paradigms (Book 6 - Unit 17)', 'تمرین شادوئینگ یونیت 17 کتاب 6 (زبان‌شناسی شناختی پیشرفته): promulgate, reverberate, scrutinize, transcend, unravel, venerate...', '', 'proficient', 'published', 617, 'education', false)
ON CONFLICT (id) DO NOTHING;

INSERT INTO hotspots (id, scene_id, name, x_position, y_position, order_index)
VALUES ('40006000-0000-0000-0000-001700000002', '40006000-0000-0000-0000-001700000001', 'Dialogue', 50.0, 50.0, 1)
ON CONFLICT (id) DO NOTHING;

INSERT INTO dialogues (id, hotspot_id, "order", speaker, original_text, translation, audio_url, display_type)
VALUES
('40006000-0000-0000-0001-001700000001', '40006000-0000-0000-0000-001700000002', 1, 'customer', 'Exploring cognitive linguistics paradigms offers a great opportunity to master essential vocabulary.', 'بررسی موضوع زبان‌شناسی شناختی پیشرفته فرصتی عالی برای تسلط بر واژگان ضروری به شمار می‌رود.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full'),
('40006000-0000-0000-0001-001700000002', '40006000-0000-0000-0000-001700000002', 2, 'clerk', 'Native speakers naturally use target words like promulgate and reverberate in conversation.', 'گویندگان نیتیو کلماتی چون promulgate (اشاعه و ترویج رسمی اندیشه) و reverberate (بازتاب گسترده در جامعه) را به صورت طبیعی در مکالمه به کار می‌برند.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full'),
('40006000-0000-0000-0001-001700000003', '40006000-0000-0000-0000-001700000002', 3, 'customer', 'Practicing sentence by sentence with clear pronunciation builds real conversational fluency.', 'تمرین جمله‌به‌جمله با تلفظ شفاف، تسلط و روانی واقعی در گفتار ایجاد می‌کند.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full'),
('40006000-0000-0000-0001-001700000004', '40006000-0000-0000-0000-001700000002', 4, 'clerk', 'Staying calm and consistent turns difficult phrases into everyday speech habits.', 'آرامش و استمرار در تمرین، عبارات دشوار را به عادت‌های گفتاری روزمره بدل می‌سازد.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full'),
('40006000-0000-0000-0001-001700000005', '40006000-0000-0000-0000-001700000002', 5, 'customer', 'Completing this unit brings us closer to full mastery of English vocabulary.', 'تکمیل این درس ما را به تسلط کامل بر دایره واژگان انگلیسی نزدیک‌تر می‌کند.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full')
ON CONFLICT (id) DO NOTHING;

INSERT INTO podcasts (id, title, description_fa, level, kind, series_id, episode_no, audio_url, audio_status, is_active, duration_seconds, position, vocabulary, scene_id)
VALUES ('40006000-0000-0000-0000-001700000003', 'Cognitive Linguistics Paradigms (Book 6 - Unit 17)', 'روایت داستانی و آموزش واژگان یونیت 17 (زبان‌شناسی شناختی پیشرفته) از کتاب 6 دوره ۴۰۰۰ واژه', 'proficient', 'lesson', '40000000-0006-0000-0000-000000000006', 17, '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'ready', TRUE, 334, 17, '[{"word": "promulgate", "meaning_fa": "اشاعه و ترویج رسمی اندیشه"}, {"word": "reverberate", "meaning_fa": "بازتاب گسترده در جامعه"}, {"word": "scrutinize", "meaning_fa": "بررسی موشکافانه و دقیق"}, {"word": "transcend", "meaning_fa": "فراتر رفتن از محدودیت‌ها"}, {"word": "unravel", "meaning_fa": "گشودن گره‌های پیچیده"}, {"word": "venerate", "meaning_fa": "ارج نهادن و پاسداشت مقام"}, {"word": "warrant", "meaning_fa": "تضمین و توجیه شایسته"}, {"word": "crystallize", "meaning_fa": "تبلور شفاف دیدگاه"}, {"word": "culminate", "meaning_fa": "به اوج تکامل رسیدن"}, {"word": "amalgamate", "meaning_fa": "ادغام و یکپارچه‌سازی متعالی"}, {"word": "bolster", "meaning_fa": "تقویت بنیادین ارکان"}, {"word": "circumscribe", "meaning_fa": "تعیین دقیق حدود و ثغور"}, {"word": "delineate", "meaning_fa": "تبیین موشکافانه ابعاد"}, {"word": "elucidate", "meaning_fa": "روشنگری عمیق مفهومی"}, {"word": "foster", "meaning_fa": "پرورش نظام‌مند استعدادها"}, {"word": "galvanize", "meaning_fa": "برانگیختن انگیزه فراگیر"}, {"word": "herald", "meaning_fa": "بشارت‌دهنده افق‌های نوین"}, {"word": "instigate", "meaning_fa": "آغازگری تحولات ساختاری"}, {"word": "juxtapose", "meaning_fa": "هم‌نشینی و مقایسه تطبیقی"}, {"word": "manifest", "meaning_fa": "تبلور عینی ارزش‌ها"}]'::jsonb, '40006000-0000-0000-0000-001700000001')
ON CONFLICT (id) DO UPDATE SET scene_id = EXCLUDED.scene_id, vocabulary = EXCLUDED.vocabulary;

INSERT INTO podcast_lines (podcast_id, position, speaker, text, translation_fa, start_ms, end_ms)
VALUES
('40006000-0000-0000-0000-001700000003', 0, 'Alex', 'Welcome to 4000 Essential English Words, Book 6, Unit 17: Cognitive Linguistics Paradigms.', 'به درس 17 از کتاب 6 دوره ۴۰۰۰ واژه خوش آمدید: زبان‌شناسی شناختی پیشرفته.', 0, 6000),
('40006000-0000-0000-0000-001700000003', 1, 'Sarah', 'Today we focus on 20 high-frequency vocabulary words used in real-life contexts.', 'امروز بر روی 20 واژه پرکاربرد در موقعیت‌های واقعی تمرکز می‌کنیم.', 6300, 13500),
('40006000-0000-0000-0000-001700000003', 2, 'Alex', 'Listen closely to the natural rhythm and pronunciation of each target phrase.', 'به ریتم طبیعی و تلفظ دقیق هر عبارت هدف خوب گوش فرا دهید.', 13800, 21000),
('40006000-0000-0000-0000-001700000003', 3, 'Sarah', 'Now head over to the shadowing section to record these sentences in your own voice!', 'حالا به بخش شادوئینگ بروید تا این جملات را با صدای خودتان تمرین و ضبط کنید!', 21400, 29000)
ON CONFLICT DO NOTHING;

-- کتاب 6 - درس 18: Bio-Evolutionary Dynamics
INSERT INTO scenes (id, title, description, background_image_url, difficulty, status, "order", category, is_custom)
VALUES ('40006000-0000-0000-0000-001800000001', 'Bio-Evolutionary Dynamics (Book 6 - Unit 18)', 'تمرین شادوئینگ یونیت 18 کتاب 6 (دینامیک فرگشت زیستی): transcend, unravel, venerate, warrant, crystallize, culminate...', '', 'proficient', 'published', 618, 'education', false)
ON CONFLICT (id) DO NOTHING;

INSERT INTO hotspots (id, scene_id, name, x_position, y_position, order_index)
VALUES ('40006000-0000-0000-0000-001800000002', '40006000-0000-0000-0000-001800000001', 'Dialogue', 50.0, 50.0, 1)
ON CONFLICT (id) DO NOTHING;

INSERT INTO dialogues (id, hotspot_id, "order", speaker, original_text, translation, audio_url, display_type)
VALUES
('40006000-0000-0000-0001-001800000001', '40006000-0000-0000-0000-001800000002', 1, 'customer', 'Exploring bio-evolutionary dynamics offers a great opportunity to master essential vocabulary.', 'بررسی موضوع دینامیک فرگشت زیستی فرصتی عالی برای تسلط بر واژگان ضروری به شمار می‌رود.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full'),
('40006000-0000-0000-0001-001800000002', '40006000-0000-0000-0000-001800000002', 2, 'clerk', 'Native speakers naturally use target words like transcend and unravel in conversation.', 'گویندگان نیتیو کلماتی چون transcend (فراتر رفتن از محدودیت‌ها) و unravel (گشودن گره‌های پیچیده) را به صورت طبیعی در مکالمه به کار می‌برند.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full'),
('40006000-0000-0000-0001-001800000003', '40006000-0000-0000-0000-001800000002', 3, 'customer', 'Practicing sentence by sentence with clear pronunciation builds real conversational fluency.', 'تمرین جمله‌به‌جمله با تلفظ شفاف، تسلط و روانی واقعی در گفتار ایجاد می‌کند.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full'),
('40006000-0000-0000-0001-001800000004', '40006000-0000-0000-0000-001800000002', 4, 'clerk', 'Staying calm and consistent turns difficult phrases into everyday speech habits.', 'آرامش و استمرار در تمرین، عبارات دشوار را به عادت‌های گفتاری روزمره بدل می‌سازد.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full'),
('40006000-0000-0000-0001-001800000005', '40006000-0000-0000-0000-001800000002', 5, 'customer', 'Completing this unit brings us closer to full mastery of English vocabulary.', 'تکمیل این درس ما را به تسلط کامل بر دایره واژگان انگلیسی نزدیک‌تر می‌کند.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full')
ON CONFLICT (id) DO NOTHING;

INSERT INTO podcasts (id, title, description_fa, level, kind, series_id, episode_no, audio_url, audio_status, is_active, duration_seconds, position, vocabulary, scene_id)
VALUES ('40006000-0000-0000-0000-001800000003', 'Bio-Evolutionary Dynamics (Book 6 - Unit 18)', 'روایت داستانی و آموزش واژگان یونیت 18 (دینامیک فرگشت زیستی) از کتاب 6 دوره ۴۰۰۰ واژه', 'proficient', 'lesson', '40000000-0006-0000-0000-000000000006', 18, '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'ready', TRUE, 336, 18, '[{"word": "transcend", "meaning_fa": "فراتر رفتن از محدودیت‌ها"}, {"word": "unravel", "meaning_fa": "گشودن گره‌های پیچیده"}, {"word": "venerate", "meaning_fa": "ارج نهادن و پاسداشت مقام"}, {"word": "warrant", "meaning_fa": "تضمین و توجیه شایسته"}, {"word": "crystallize", "meaning_fa": "تبلور شفاف دیدگاه"}, {"word": "culminate", "meaning_fa": "به اوج تکامل رسیدن"}, {"word": "amalgamate", "meaning_fa": "ادغام و یکپارچه‌سازی متعالی"}, {"word": "bolster", "meaning_fa": "تقویت بنیادین ارکان"}, {"word": "circumscribe", "meaning_fa": "تعیین دقیق حدود و ثغور"}, {"word": "delineate", "meaning_fa": "تبیین موشکافانه ابعاد"}, {"word": "elucidate", "meaning_fa": "روشنگری عمیق مفهومی"}, {"word": "foster", "meaning_fa": "پرورش نظام‌مند استعدادها"}, {"word": "galvanize", "meaning_fa": "برانگیختن انگیزه فراگیر"}, {"word": "herald", "meaning_fa": "بشارت‌دهنده افق‌های نوین"}, {"word": "instigate", "meaning_fa": "آغازگری تحولات ساختاری"}, {"word": "juxtapose", "meaning_fa": "هم‌نشینی و مقایسه تطبیقی"}, {"word": "manifest", "meaning_fa": "تبلور عینی ارزش‌ها"}, {"word": "promulgate", "meaning_fa": "اشاعه و ترویج رسمی اندیشه"}, {"word": "reverberate", "meaning_fa": "بازتاب گسترده در جامعه"}, {"word": "scrutinize", "meaning_fa": "بررسی موشکافانه و دقیق"}]'::jsonb, '40006000-0000-0000-0000-001800000001')
ON CONFLICT (id) DO UPDATE SET scene_id = EXCLUDED.scene_id, vocabulary = EXCLUDED.vocabulary;

INSERT INTO podcast_lines (podcast_id, position, speaker, text, translation_fa, start_ms, end_ms)
VALUES
('40006000-0000-0000-0000-001800000003', 0, 'Alex', 'Welcome to 4000 Essential English Words, Book 6, Unit 18: Bio-Evolutionary Dynamics.', 'به درس 18 از کتاب 6 دوره ۴۰۰۰ واژه خوش آمدید: دینامیک فرگشت زیستی.', 0, 6000),
('40006000-0000-0000-0000-001800000003', 1, 'Sarah', 'Today we focus on 20 high-frequency vocabulary words used in real-life contexts.', 'امروز بر روی 20 واژه پرکاربرد در موقعیت‌های واقعی تمرکز می‌کنیم.', 6300, 13500),
('40006000-0000-0000-0000-001800000003', 2, 'Alex', 'Listen closely to the natural rhythm and pronunciation of each target phrase.', 'به ریتم طبیعی و تلفظ دقیق هر عبارت هدف خوب گوش فرا دهید.', 13800, 21000),
('40006000-0000-0000-0000-001800000003', 3, 'Sarah', 'Now head over to the shadowing section to record these sentences in your own voice!', 'حالا به بخش شادوئینگ بروید تا این جملات را با صدای خودتان تمرین و ضبط کنید!', 21400, 29000)
ON CONFLICT DO NOTHING;

-- کتاب 6 - درس 19: Crisis Leadership Mastery
INSERT INTO scenes (id, title, description, background_image_url, difficulty, status, "order", category, is_custom)
VALUES ('40006000-0000-0000-0000-001900000001', 'Crisis Leadership Mastery (Book 6 - Unit 19)', 'تمرین شادوئینگ یونیت 19 کتاب 6 (تسلط بر رهبری در شرایط بحران): warrant, crystallize, culminate, amalgamate, bolster, circumscribe...', '', 'proficient', 'published', 619, 'education', false)
ON CONFLICT (id) DO NOTHING;

INSERT INTO hotspots (id, scene_id, name, x_position, y_position, order_index)
VALUES ('40006000-0000-0000-0000-001900000002', '40006000-0000-0000-0000-001900000001', 'Dialogue', 50.0, 50.0, 1)
ON CONFLICT (id) DO NOTHING;

INSERT INTO dialogues (id, hotspot_id, "order", speaker, original_text, translation, audio_url, display_type)
VALUES
('40006000-0000-0000-0001-001900000001', '40006000-0000-0000-0000-001900000002', 1, 'customer', 'Exploring crisis leadership mastery offers a great opportunity to master essential vocabulary.', 'بررسی موضوع تسلط بر رهبری در شرایط بحران فرصتی عالی برای تسلط بر واژگان ضروری به شمار می‌رود.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full'),
('40006000-0000-0000-0001-001900000002', '40006000-0000-0000-0000-001900000002', 2, 'clerk', 'Native speakers naturally use target words like warrant and crystallize in conversation.', 'گویندگان نیتیو کلماتی چون warrant (تضمین و توجیه شایسته) و crystallize (تبلور شفاف دیدگاه) را به صورت طبیعی در مکالمه به کار می‌برند.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full'),
('40006000-0000-0000-0001-001900000003', '40006000-0000-0000-0000-001900000002', 3, 'customer', 'Practicing sentence by sentence with clear pronunciation builds real conversational fluency.', 'تمرین جمله‌به‌جمله با تلفظ شفاف، تسلط و روانی واقعی در گفتار ایجاد می‌کند.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full'),
('40006000-0000-0000-0001-001900000004', '40006000-0000-0000-0000-001900000002', 4, 'clerk', 'Staying calm and consistent turns difficult phrases into everyday speech habits.', 'آرامش و استمرار در تمرین، عبارات دشوار را به عادت‌های گفتاری روزمره بدل می‌سازد.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full'),
('40006000-0000-0000-0001-001900000005', '40006000-0000-0000-0000-001900000002', 5, 'customer', 'Completing this unit brings us closer to full mastery of English vocabulary.', 'تکمیل این درس ما را به تسلط کامل بر دایره واژگان انگلیسی نزدیک‌تر می‌کند.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full')
ON CONFLICT (id) DO NOTHING;

INSERT INTO podcasts (id, title, description_fa, level, kind, series_id, episode_no, audio_url, audio_status, is_active, duration_seconds, position, vocabulary, scene_id)
VALUES ('40006000-0000-0000-0000-001900000003', 'Crisis Leadership Mastery (Book 6 - Unit 19)', 'روایت داستانی و آموزش واژگان یونیت 19 (تسلط بر رهبری در شرایط بحران) از کتاب 6 دوره ۴۰۰۰ واژه', 'proficient', 'lesson', '40000000-0006-0000-0000-000000000006', 19, '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'ready', TRUE, 338, 19, '[{"word": "warrant", "meaning_fa": "تضمین و توجیه شایسته"}, {"word": "crystallize", "meaning_fa": "تبلور شفاف دیدگاه"}, {"word": "culminate", "meaning_fa": "به اوج تکامل رسیدن"}, {"word": "amalgamate", "meaning_fa": "ادغام و یکپارچه‌سازی متعالی"}, {"word": "bolster", "meaning_fa": "تقویت بنیادین ارکان"}, {"word": "circumscribe", "meaning_fa": "تعیین دقیق حدود و ثغور"}, {"word": "delineate", "meaning_fa": "تبیین موشکافانه ابعاد"}, {"word": "elucidate", "meaning_fa": "روشنگری عمیق مفهومی"}, {"word": "foster", "meaning_fa": "پرورش نظام‌مند استعدادها"}, {"word": "galvanize", "meaning_fa": "برانگیختن انگیزه فراگیر"}, {"word": "herald", "meaning_fa": "بشارت‌دهنده افق‌های نوین"}, {"word": "instigate", "meaning_fa": "آغازگری تحولات ساختاری"}, {"word": "juxtapose", "meaning_fa": "هم‌نشینی و مقایسه تطبیقی"}, {"word": "manifest", "meaning_fa": "تبلور عینی ارزش‌ها"}, {"word": "promulgate", "meaning_fa": "اشاعه و ترویج رسمی اندیشه"}, {"word": "reverberate", "meaning_fa": "بازتاب گسترده در جامعه"}, {"word": "scrutinize", "meaning_fa": "بررسی موشکافانه و دقیق"}, {"word": "transcend", "meaning_fa": "فراتر رفتن از محدودیت‌ها"}, {"word": "unravel", "meaning_fa": "گشودن گره‌های پیچیده"}, {"word": "venerate", "meaning_fa": "ارج نهادن و پاسداشت مقام"}]'::jsonb, '40006000-0000-0000-0000-001900000001')
ON CONFLICT (id) DO UPDATE SET scene_id = EXCLUDED.scene_id, vocabulary = EXCLUDED.vocabulary;

INSERT INTO podcast_lines (podcast_id, position, speaker, text, translation_fa, start_ms, end_ms)
VALUES
('40006000-0000-0000-0000-001900000003', 0, 'Alex', 'Welcome to 4000 Essential English Words, Book 6, Unit 19: Crisis Leadership Mastery.', 'به درس 19 از کتاب 6 دوره ۴۰۰۰ واژه خوش آمدید: تسلط بر رهبری در شرایط بحران.', 0, 6000),
('40006000-0000-0000-0000-001900000003', 1, 'Sarah', 'Today we focus on 20 high-frequency vocabulary words used in real-life contexts.', 'امروز بر روی 20 واژه پرکاربرد در موقعیت‌های واقعی تمرکز می‌کنیم.', 6300, 13500),
('40006000-0000-0000-0000-001900000003', 2, 'Alex', 'Listen closely to the natural rhythm and pronunciation of each target phrase.', 'به ریتم طبیعی و تلفظ دقیق هر عبارت هدف خوب گوش فرا دهید.', 13800, 21000),
('40006000-0000-0000-0000-001900000003', 3, 'Sarah', 'Now head over to the shadowing section to record these sentences in your own voice!', 'حالا به بخش شادوئینگ بروید تا این جملات را با صدای خودتان تمرین و ضبط کنید!', 21400, 29000)
ON CONFLICT DO NOTHING;

-- کتاب 6 - درس 20: Advanced Strategic Synthesis
INSERT INTO scenes (id, title, description, background_image_url, difficulty, status, "order", category, is_custom)
VALUES ('40006000-0000-0000-0000-002000000001', 'Advanced Strategic Synthesis (Book 6 - Unit 20)', 'تمرین شادوئینگ یونیت 20 کتاب 6 (سنتز راهبردی چندرشته‌ای): amalgamate, bolster, circumscribe, delineate, elucidate, foster...', '', 'proficient', 'published', 620, 'education', false)
ON CONFLICT (id) DO NOTHING;

INSERT INTO hotspots (id, scene_id, name, x_position, y_position, order_index)
VALUES ('40006000-0000-0000-0000-002000000002', '40006000-0000-0000-0000-002000000001', 'Dialogue', 50.0, 50.0, 1)
ON CONFLICT (id) DO NOTHING;

INSERT INTO dialogues (id, hotspot_id, "order", speaker, original_text, translation, audio_url, display_type)
VALUES
('40006000-0000-0000-0001-002000000001', '40006000-0000-0000-0000-002000000002', 1, 'customer', 'Exploring advanced strategic synthesis offers a great opportunity to master essential vocabulary.', 'بررسی موضوع سنتز راهبردی چندرشته‌ای فرصتی عالی برای تسلط بر واژگان ضروری به شمار می‌رود.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full'),
('40006000-0000-0000-0001-002000000002', '40006000-0000-0000-0000-002000000002', 2, 'clerk', 'Native speakers naturally use target words like amalgamate and bolster in conversation.', 'گویندگان نیتیو کلماتی چون amalgamate (ادغام و یکپارچه‌سازی متعالی) و bolster (تقویت بنیادین ارکان) را به صورت طبیعی در مکالمه به کار می‌برند.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full'),
('40006000-0000-0000-0001-002000000003', '40006000-0000-0000-0000-002000000002', 3, 'customer', 'Practicing sentence by sentence with clear pronunciation builds real conversational fluency.', 'تمرین جمله‌به‌جمله با تلفظ شفاف، تسلط و روانی واقعی در گفتار ایجاد می‌کند.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full'),
('40006000-0000-0000-0001-002000000004', '40006000-0000-0000-0000-002000000002', 4, 'clerk', 'Staying calm and consistent turns difficult phrases into everyday speech habits.', 'آرامش و استمرار در تمرین، عبارات دشوار را به عادت‌های گفتاری روزمره بدل می‌سازد.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full'),
('40006000-0000-0000-0001-002000000005', '40006000-0000-0000-0000-002000000002', 5, 'customer', 'Completing this unit brings us closer to full mastery of English vocabulary.', 'تکمیل این درس ما را به تسلط کامل بر دایره واژگان انگلیسی نزدیک‌تر می‌کند.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full')
ON CONFLICT (id) DO NOTHING;

INSERT INTO podcasts (id, title, description_fa, level, kind, series_id, episode_no, audio_url, audio_status, is_active, duration_seconds, position, vocabulary, scene_id)
VALUES ('40006000-0000-0000-0000-002000000003', 'Advanced Strategic Synthesis (Book 6 - Unit 20)', 'روایت داستانی و آموزش واژگان یونیت 20 (سنتز راهبردی چندرشته‌ای) از کتاب 6 دوره ۴۰۰۰ واژه', 'proficient', 'lesson', '40000000-0006-0000-0000-000000000006', 20, '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'ready', TRUE, 340, 20, '[{"word": "amalgamate", "meaning_fa": "ادغام و یکپارچه‌سازی متعالی"}, {"word": "bolster", "meaning_fa": "تقویت بنیادین ارکان"}, {"word": "circumscribe", "meaning_fa": "تعیین دقیق حدود و ثغور"}, {"word": "delineate", "meaning_fa": "تبیین موشکافانه ابعاد"}, {"word": "elucidate", "meaning_fa": "روشنگری عمیق مفهومی"}, {"word": "foster", "meaning_fa": "پرورش نظام‌مند استعدادها"}, {"word": "galvanize", "meaning_fa": "برانگیختن انگیزه فراگیر"}, {"word": "herald", "meaning_fa": "بشارت‌دهنده افق‌های نوین"}, {"word": "instigate", "meaning_fa": "آغازگری تحولات ساختاری"}, {"word": "juxtapose", "meaning_fa": "هم‌نشینی و مقایسه تطبیقی"}, {"word": "manifest", "meaning_fa": "تبلور عینی ارزش‌ها"}, {"word": "promulgate", "meaning_fa": "اشاعه و ترویج رسمی اندیشه"}, {"word": "reverberate", "meaning_fa": "بازتاب گسترده در جامعه"}, {"word": "scrutinize", "meaning_fa": "بررسی موشکافانه و دقیق"}, {"word": "transcend", "meaning_fa": "فراتر رفتن از محدودیت‌ها"}, {"word": "unravel", "meaning_fa": "گشودن گره‌های پیچیده"}, {"word": "venerate", "meaning_fa": "ارج نهادن و پاسداشت مقام"}, {"word": "warrant", "meaning_fa": "تضمین و توجیه شایسته"}, {"word": "crystallize", "meaning_fa": "تبلور شفاف دیدگاه"}, {"word": "culminate", "meaning_fa": "به اوج تکامل رسیدن"}]'::jsonb, '40006000-0000-0000-0000-002000000001')
ON CONFLICT (id) DO UPDATE SET scene_id = EXCLUDED.scene_id, vocabulary = EXCLUDED.vocabulary;

INSERT INTO podcast_lines (podcast_id, position, speaker, text, translation_fa, start_ms, end_ms)
VALUES
('40006000-0000-0000-0000-002000000003', 0, 'Alex', 'Welcome to 4000 Essential English Words, Book 6, Unit 20: Advanced Strategic Synthesis.', 'به درس 20 از کتاب 6 دوره ۴۰۰۰ واژه خوش آمدید: سنتز راهبردی چندرشته‌ای.', 0, 6000),
('40006000-0000-0000-0000-002000000003', 1, 'Sarah', 'Today we focus on 20 high-frequency vocabulary words used in real-life contexts.', 'امروز بر روی 20 واژه پرکاربرد در موقعیت‌های واقعی تمرکز می‌کنیم.', 6300, 13500),
('40006000-0000-0000-0000-002000000003', 2, 'Alex', 'Listen closely to the natural rhythm and pronunciation of each target phrase.', 'به ریتم طبیعی و تلفظ دقیق هر عبارت هدف خوب گوش فرا دهید.', 13800, 21000),
('40006000-0000-0000-0000-002000000003', 3, 'Sarah', 'Now head over to the shadowing section to record these sentences in your own voice!', 'حالا به بخش شادوئینگ بروید تا این جملات را با صدای خودتان تمرین و ضبط کنید!', 21400, 29000)
ON CONFLICT DO NOTHING;

-- کتاب 6 - درس 21: Computational Semantics
INSERT INTO scenes (id, title, description, background_image_url, difficulty, status, "order", category, is_custom)
VALUES ('40006000-0000-0000-0000-002100000001', 'Computational Semantics (Book 6 - Unit 21)', 'تمرین شادوئینگ یونیت 21 کتاب 6 (معناشناسی محاسباتی هوشمند): delineate, elucidate, foster, galvanize, herald, instigate...', '', 'proficient', 'published', 621, 'education', false)
ON CONFLICT (id) DO NOTHING;

INSERT INTO hotspots (id, scene_id, name, x_position, y_position, order_index)
VALUES ('40006000-0000-0000-0000-002100000002', '40006000-0000-0000-0000-002100000001', 'Dialogue', 50.0, 50.0, 1)
ON CONFLICT (id) DO NOTHING;

INSERT INTO dialogues (id, hotspot_id, "order", speaker, original_text, translation, audio_url, display_type)
VALUES
('40006000-0000-0000-0001-002100000001', '40006000-0000-0000-0000-002100000002', 1, 'customer', 'Exploring computational semantics offers a great opportunity to master essential vocabulary.', 'بررسی موضوع معناشناسی محاسباتی هوشمند فرصتی عالی برای تسلط بر واژگان ضروری به شمار می‌رود.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full'),
('40006000-0000-0000-0001-002100000002', '40006000-0000-0000-0000-002100000002', 2, 'clerk', 'Native speakers naturally use target words like delineate and elucidate in conversation.', 'گویندگان نیتیو کلماتی چون delineate (تبیین موشکافانه ابعاد) و elucidate (روشنگری عمیق مفهومی) را به صورت طبیعی در مکالمه به کار می‌برند.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full'),
('40006000-0000-0000-0001-002100000003', '40006000-0000-0000-0000-002100000002', 3, 'customer', 'Practicing sentence by sentence with clear pronunciation builds real conversational fluency.', 'تمرین جمله‌به‌جمله با تلفظ شفاف، تسلط و روانی واقعی در گفتار ایجاد می‌کند.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full'),
('40006000-0000-0000-0001-002100000004', '40006000-0000-0000-0000-002100000002', 4, 'clerk', 'Staying calm and consistent turns difficult phrases into everyday speech habits.', 'آرامش و استمرار در تمرین، عبارات دشوار را به عادت‌های گفتاری روزمره بدل می‌سازد.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full'),
('40006000-0000-0000-0001-002100000005', '40006000-0000-0000-0000-002100000002', 5, 'customer', 'Completing this unit brings us closer to full mastery of English vocabulary.', 'تکمیل این درس ما را به تسلط کامل بر دایره واژگان انگلیسی نزدیک‌تر می‌کند.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full')
ON CONFLICT (id) DO NOTHING;

INSERT INTO podcasts (id, title, description_fa, level, kind, series_id, episode_no, audio_url, audio_status, is_active, duration_seconds, position, vocabulary, scene_id)
VALUES ('40006000-0000-0000-0000-002100000003', 'Computational Semantics (Book 6 - Unit 21)', 'روایت داستانی و آموزش واژگان یونیت 21 (معناشناسی محاسباتی هوشمند) از کتاب 6 دوره ۴۰۰۰ واژه', 'proficient', 'lesson', '40000000-0006-0000-0000-000000000006', 21, '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'ready', TRUE, 342, 21, '[{"word": "delineate", "meaning_fa": "تبیین موشکافانه ابعاد"}, {"word": "elucidate", "meaning_fa": "روشنگری عمیق مفهومی"}, {"word": "foster", "meaning_fa": "پرورش نظام‌مند استعدادها"}, {"word": "galvanize", "meaning_fa": "برانگیختن انگیزه فراگیر"}, {"word": "herald", "meaning_fa": "بشارت‌دهنده افق‌های نوین"}, {"word": "instigate", "meaning_fa": "آغازگری تحولات ساختاری"}, {"word": "juxtapose", "meaning_fa": "هم‌نشینی و مقایسه تطبیقی"}, {"word": "manifest", "meaning_fa": "تبلور عینی ارزش‌ها"}, {"word": "promulgate", "meaning_fa": "اشاعه و ترویج رسمی اندیشه"}, {"word": "reverberate", "meaning_fa": "بازتاب گسترده در جامعه"}, {"word": "scrutinize", "meaning_fa": "بررسی موشکافانه و دقیق"}, {"word": "transcend", "meaning_fa": "فراتر رفتن از محدودیت‌ها"}, {"word": "unravel", "meaning_fa": "گشودن گره‌های پیچیده"}, {"word": "venerate", "meaning_fa": "ارج نهادن و پاسداشت مقام"}, {"word": "warrant", "meaning_fa": "تضمین و توجیه شایسته"}, {"word": "crystallize", "meaning_fa": "تبلور شفاف دیدگاه"}, {"word": "culminate", "meaning_fa": "به اوج تکامل رسیدن"}, {"word": "amalgamate", "meaning_fa": "ادغام و یکپارچه‌سازی متعالی"}, {"word": "bolster", "meaning_fa": "تقویت بنیادین ارکان"}, {"word": "circumscribe", "meaning_fa": "تعیین دقیق حدود و ثغور"}]'::jsonb, '40006000-0000-0000-0000-002100000001')
ON CONFLICT (id) DO UPDATE SET scene_id = EXCLUDED.scene_id, vocabulary = EXCLUDED.vocabulary;

INSERT INTO podcast_lines (podcast_id, position, speaker, text, translation_fa, start_ms, end_ms)
VALUES
('40006000-0000-0000-0000-002100000003', 0, 'Alex', 'Welcome to 4000 Essential English Words, Book 6, Unit 21: Computational Semantics.', 'به درس 21 از کتاب 6 دوره ۴۰۰۰ واژه خوش آمدید: معناشناسی محاسباتی هوشمند.', 0, 6000),
('40006000-0000-0000-0000-002100000003', 1, 'Sarah', 'Today we focus on 20 high-frequency vocabulary words used in real-life contexts.', 'امروز بر روی 20 واژه پرکاربرد در موقعیت‌های واقعی تمرکز می‌کنیم.', 6300, 13500),
('40006000-0000-0000-0000-002100000003', 2, 'Alex', 'Listen closely to the natural rhythm and pronunciation of each target phrase.', 'به ریتم طبیعی و تلفظ دقیق هر عبارت هدف خوب گوش فرا دهید.', 13800, 21000),
('40006000-0000-0000-0000-002100000003', 3, 'Sarah', 'Now head over to the shadowing section to record these sentences in your own voice!', 'حالا به بخش شادوئینگ بروید تا این جملات را با صدای خودتان تمرین و ضبط کنید!', 21400, 29000)
ON CONFLICT DO NOTHING;

-- کتاب 6 - درس 22: Civilizational History Insights
INSERT INTO scenes (id, title, description, background_image_url, difficulty, status, "order", category, is_custom)
VALUES ('40006000-0000-0000-0000-002200000001', 'Civilizational History Insights (Book 6 - Unit 22)', 'تمرین شادوئینگ یونیت 22 کتاب 6 (تاریخ تمدن و تحول جوامع): galvanize, herald, instigate, juxtapose, manifest, promulgate...', '', 'proficient', 'published', 622, 'education', false)
ON CONFLICT (id) DO NOTHING;

INSERT INTO hotspots (id, scene_id, name, x_position, y_position, order_index)
VALUES ('40006000-0000-0000-0000-002200000002', '40006000-0000-0000-0000-002200000001', 'Dialogue', 50.0, 50.0, 1)
ON CONFLICT (id) DO NOTHING;

INSERT INTO dialogues (id, hotspot_id, "order", speaker, original_text, translation, audio_url, display_type)
VALUES
('40006000-0000-0000-0001-002200000001', '40006000-0000-0000-0000-002200000002', 1, 'customer', 'Exploring civilizational history insights offers a great opportunity to master essential vocabulary.', 'بررسی موضوع تاریخ تمدن و تحول جوامع فرصتی عالی برای تسلط بر واژگان ضروری به شمار می‌رود.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full'),
('40006000-0000-0000-0001-002200000002', '40006000-0000-0000-0000-002200000002', 2, 'clerk', 'Native speakers naturally use target words like galvanize and herald in conversation.', 'گویندگان نیتیو کلماتی چون galvanize (برانگیختن انگیزه فراگیر) و herald (بشارت‌دهنده افق‌های نوین) را به صورت طبیعی در مکالمه به کار می‌برند.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full'),
('40006000-0000-0000-0001-002200000003', '40006000-0000-0000-0000-002200000002', 3, 'customer', 'Practicing sentence by sentence with clear pronunciation builds real conversational fluency.', 'تمرین جمله‌به‌جمله با تلفظ شفاف، تسلط و روانی واقعی در گفتار ایجاد می‌کند.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full'),
('40006000-0000-0000-0001-002200000004', '40006000-0000-0000-0000-002200000002', 4, 'clerk', 'Staying calm and consistent turns difficult phrases into everyday speech habits.', 'آرامش و استمرار در تمرین، عبارات دشوار را به عادت‌های گفتاری روزمره بدل می‌سازد.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full'),
('40006000-0000-0000-0001-002200000005', '40006000-0000-0000-0000-002200000002', 5, 'customer', 'Completing this unit brings us closer to full mastery of English vocabulary.', 'تکمیل این درس ما را به تسلط کامل بر دایره واژگان انگلیسی نزدیک‌تر می‌کند.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full')
ON CONFLICT (id) DO NOTHING;

INSERT INTO podcasts (id, title, description_fa, level, kind, series_id, episode_no, audio_url, audio_status, is_active, duration_seconds, position, vocabulary, scene_id)
VALUES ('40006000-0000-0000-0000-002200000003', 'Civilizational History Insights (Book 6 - Unit 22)', 'روایت داستانی و آموزش واژگان یونیت 22 (تاریخ تمدن و تحول جوامع) از کتاب 6 دوره ۴۰۰۰ واژه', 'proficient', 'lesson', '40000000-0006-0000-0000-000000000006', 22, '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'ready', TRUE, 344, 22, '[{"word": "galvanize", "meaning_fa": "برانگیختن انگیزه فراگیر"}, {"word": "herald", "meaning_fa": "بشارت‌دهنده افق‌های نوین"}, {"word": "instigate", "meaning_fa": "آغازگری تحولات ساختاری"}, {"word": "juxtapose", "meaning_fa": "هم‌نشینی و مقایسه تطبیقی"}, {"word": "manifest", "meaning_fa": "تبلور عینی ارزش‌ها"}, {"word": "promulgate", "meaning_fa": "اشاعه و ترویج رسمی اندیشه"}, {"word": "reverberate", "meaning_fa": "بازتاب گسترده در جامعه"}, {"word": "scrutinize", "meaning_fa": "بررسی موشکافانه و دقیق"}, {"word": "transcend", "meaning_fa": "فراتر رفتن از محدودیت‌ها"}, {"word": "unravel", "meaning_fa": "گشودن گره‌های پیچیده"}, {"word": "venerate", "meaning_fa": "ارج نهادن و پاسداشت مقام"}, {"word": "warrant", "meaning_fa": "تضمین و توجیه شایسته"}, {"word": "crystallize", "meaning_fa": "تبلور شفاف دیدگاه"}, {"word": "culminate", "meaning_fa": "به اوج تکامل رسیدن"}, {"word": "amalgamate", "meaning_fa": "ادغام و یکپارچه‌سازی متعالی"}, {"word": "bolster", "meaning_fa": "تقویت بنیادین ارکان"}, {"word": "circumscribe", "meaning_fa": "تعیین دقیق حدود و ثغور"}, {"word": "delineate", "meaning_fa": "تبیین موشکافانه ابعاد"}, {"word": "elucidate", "meaning_fa": "روشنگری عمیق مفهومی"}, {"word": "foster", "meaning_fa": "پرورش نظام‌مند استعدادها"}]'::jsonb, '40006000-0000-0000-0000-002200000001')
ON CONFLICT (id) DO UPDATE SET scene_id = EXCLUDED.scene_id, vocabulary = EXCLUDED.vocabulary;

INSERT INTO podcast_lines (podcast_id, position, speaker, text, translation_fa, start_ms, end_ms)
VALUES
('40006000-0000-0000-0000-002200000003', 0, 'Alex', 'Welcome to 4000 Essential English Words, Book 6, Unit 22: Civilizational History Insights.', 'به درس 22 از کتاب 6 دوره ۴۰۰۰ واژه خوش آمدید: تاریخ تمدن و تحول جوامع.', 0, 6000),
('40006000-0000-0000-0000-002200000003', 1, 'Sarah', 'Today we focus on 20 high-frequency vocabulary words used in real-life contexts.', 'امروز بر روی 20 واژه پرکاربرد در موقعیت‌های واقعی تمرکز می‌کنیم.', 6300, 13500),
('40006000-0000-0000-0000-002200000003', 2, 'Alex', 'Listen closely to the natural rhythm and pronunciation of each target phrase.', 'به ریتم طبیعی و تلفظ دقیق هر عبارت هدف خوب گوش فرا دهید.', 13800, 21000),
('40006000-0000-0000-0000-002200000003', 3, 'Sarah', 'Now head over to the shadowing section to record these sentences in your own voice!', 'حالا به بخش شادوئینگ بروید تا این جملات را با صدای خودتان تمرین و ضبط کنید!', 21400, 29000)
ON CONFLICT DO NOTHING;

-- کتاب 6 - درس 23: Ethical Governance Frameworks
INSERT INTO scenes (id, title, description, background_image_url, difficulty, status, "order", category, is_custom)
VALUES ('40006000-0000-0000-0000-002300000001', 'Ethical Governance Frameworks (Book 6 - Unit 23)', 'تمرین شادوئینگ یونیت 23 کتاب 6 (چارچوب‌های اخلاقی حکمرانی): juxtapose, manifest, promulgate, reverberate, scrutinize, transcend...', '', 'proficient', 'published', 623, 'education', false)
ON CONFLICT (id) DO NOTHING;

INSERT INTO hotspots (id, scene_id, name, x_position, y_position, order_index)
VALUES ('40006000-0000-0000-0000-002300000002', '40006000-0000-0000-0000-002300000001', 'Dialogue', 50.0, 50.0, 1)
ON CONFLICT (id) DO NOTHING;

INSERT INTO dialogues (id, hotspot_id, "order", speaker, original_text, translation, audio_url, display_type)
VALUES
('40006000-0000-0000-0001-002300000001', '40006000-0000-0000-0000-002300000002', 1, 'customer', 'Exploring ethical governance frameworks offers a great opportunity to master essential vocabulary.', 'بررسی موضوع چارچوب‌های اخلاقی حکمرانی فرصتی عالی برای تسلط بر واژگان ضروری به شمار می‌رود.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full'),
('40006000-0000-0000-0001-002300000002', '40006000-0000-0000-0000-002300000002', 2, 'clerk', 'Native speakers naturally use target words like juxtapose and manifest in conversation.', 'گویندگان نیتیو کلماتی چون juxtapose (هم‌نشینی و مقایسه تطبیقی) و manifest (تبلور عینی ارزش‌ها) را به صورت طبیعی در مکالمه به کار می‌برند.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full'),
('40006000-0000-0000-0001-002300000003', '40006000-0000-0000-0000-002300000002', 3, 'customer', 'Practicing sentence by sentence with clear pronunciation builds real conversational fluency.', 'تمرین جمله‌به‌جمله با تلفظ شفاف، تسلط و روانی واقعی در گفتار ایجاد می‌کند.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full'),
('40006000-0000-0000-0001-002300000004', '40006000-0000-0000-0000-002300000002', 4, 'clerk', 'Staying calm and consistent turns difficult phrases into everyday speech habits.', 'آرامش و استمرار در تمرین، عبارات دشوار را به عادت‌های گفتاری روزمره بدل می‌سازد.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full'),
('40006000-0000-0000-0001-002300000005', '40006000-0000-0000-0000-002300000002', 5, 'customer', 'Completing this unit brings us closer to full mastery of English vocabulary.', 'تکمیل این درس ما را به تسلط کامل بر دایره واژگان انگلیسی نزدیک‌تر می‌کند.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full')
ON CONFLICT (id) DO NOTHING;

INSERT INTO podcasts (id, title, description_fa, level, kind, series_id, episode_no, audio_url, audio_status, is_active, duration_seconds, position, vocabulary, scene_id)
VALUES ('40006000-0000-0000-0000-002300000003', 'Ethical Governance Frameworks (Book 6 - Unit 23)', 'روایت داستانی و آموزش واژگان یونیت 23 (چارچوب‌های اخلاقی حکمرانی) از کتاب 6 دوره ۴۰۰۰ واژه', 'proficient', 'lesson', '40000000-0006-0000-0000-000000000006', 23, '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'ready', TRUE, 346, 23, '[{"word": "juxtapose", "meaning_fa": "هم‌نشینی و مقایسه تطبیقی"}, {"word": "manifest", "meaning_fa": "تبلور عینی ارزش‌ها"}, {"word": "promulgate", "meaning_fa": "اشاعه و ترویج رسمی اندیشه"}, {"word": "reverberate", "meaning_fa": "بازتاب گسترده در جامعه"}, {"word": "scrutinize", "meaning_fa": "بررسی موشکافانه و دقیق"}, {"word": "transcend", "meaning_fa": "فراتر رفتن از محدودیت‌ها"}, {"word": "unravel", "meaning_fa": "گشودن گره‌های پیچیده"}, {"word": "venerate", "meaning_fa": "ارج نهادن و پاسداشت مقام"}, {"word": "warrant", "meaning_fa": "تضمین و توجیه شایسته"}, {"word": "crystallize", "meaning_fa": "تبلور شفاف دیدگاه"}, {"word": "culminate", "meaning_fa": "به اوج تکامل رسیدن"}, {"word": "amalgamate", "meaning_fa": "ادغام و یکپارچه‌سازی متعالی"}, {"word": "bolster", "meaning_fa": "تقویت بنیادین ارکان"}, {"word": "circumscribe", "meaning_fa": "تعیین دقیق حدود و ثغور"}, {"word": "delineate", "meaning_fa": "تبیین موشکافانه ابعاد"}, {"word": "elucidate", "meaning_fa": "روشنگری عمیق مفهومی"}, {"word": "foster", "meaning_fa": "پرورش نظام‌مند استعدادها"}, {"word": "galvanize", "meaning_fa": "برانگیختن انگیزه فراگیر"}, {"word": "herald", "meaning_fa": "بشارت‌دهنده افق‌های نوین"}, {"word": "instigate", "meaning_fa": "آغازگری تحولات ساختاری"}]'::jsonb, '40006000-0000-0000-0000-002300000001')
ON CONFLICT (id) DO UPDATE SET scene_id = EXCLUDED.scene_id, vocabulary = EXCLUDED.vocabulary;

INSERT INTO podcast_lines (podcast_id, position, speaker, text, translation_fa, start_ms, end_ms)
VALUES
('40006000-0000-0000-0000-002300000003', 0, 'Alex', 'Welcome to 4000 Essential English Words, Book 6, Unit 23: Ethical Governance Frameworks.', 'به درس 23 از کتاب 6 دوره ۴۰۰۰ واژه خوش آمدید: چارچوب‌های اخلاقی حکمرانی.', 0, 6000),
('40006000-0000-0000-0000-002300000003', 1, 'Sarah', 'Today we focus on 20 high-frequency vocabulary words used in real-life contexts.', 'امروز بر روی 20 واژه پرکاربرد در موقعیت‌های واقعی تمرکز می‌کنیم.', 6300, 13500),
('40006000-0000-0000-0000-002300000003', 2, 'Alex', 'Listen closely to the natural rhythm and pronunciation of each target phrase.', 'به ریتم طبیعی و تلفظ دقیق هر عبارت هدف خوب گوش فرا دهید.', 13800, 21000),
('40006000-0000-0000-0000-002300000003', 3, 'Sarah', 'Now head over to the shadowing section to record these sentences in your own voice!', 'حالا به بخش شادوئینگ بروید تا این جملات را با صدای خودتان تمرین و ضبط کنید!', 21400, 29000)
ON CONFLICT DO NOTHING;

-- کتاب 6 - درس 24: Planetary Biosphere Stewardship
INSERT INTO scenes (id, title, description, background_image_url, difficulty, status, "order", category, is_custom)
VALUES ('40006000-0000-0000-0000-002400000001', 'Planetary Biosphere Stewardship (Book 6 - Unit 24)', 'تمرین شادوئینگ یونیت 24 کتاب 6 (نگهبانی از زیست‌کره سیاره): reverberate, scrutinize, transcend, unravel, venerate, warrant...', '', 'proficient', 'published', 624, 'education', false)
ON CONFLICT (id) DO NOTHING;

INSERT INTO hotspots (id, scene_id, name, x_position, y_position, order_index)
VALUES ('40006000-0000-0000-0000-002400000002', '40006000-0000-0000-0000-002400000001', 'Dialogue', 50.0, 50.0, 1)
ON CONFLICT (id) DO NOTHING;

INSERT INTO dialogues (id, hotspot_id, "order", speaker, original_text, translation, audio_url, display_type)
VALUES
('40006000-0000-0000-0001-002400000001', '40006000-0000-0000-0000-002400000002', 1, 'customer', 'Exploring planetary biosphere stewardship offers a great opportunity to master essential vocabulary.', 'بررسی موضوع نگهبانی از زیست‌کره سیاره فرصتی عالی برای تسلط بر واژگان ضروری به شمار می‌رود.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full'),
('40006000-0000-0000-0001-002400000002', '40006000-0000-0000-0000-002400000002', 2, 'clerk', 'Native speakers naturally use target words like reverberate and scrutinize in conversation.', 'گویندگان نیتیو کلماتی چون reverberate (بازتاب گسترده در جامعه) و scrutinize (بررسی موشکافانه و دقیق) را به صورت طبیعی در مکالمه به کار می‌برند.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full'),
('40006000-0000-0000-0001-002400000003', '40006000-0000-0000-0000-002400000002', 3, 'customer', 'Practicing sentence by sentence with clear pronunciation builds real conversational fluency.', 'تمرین جمله‌به‌جمله با تلفظ شفاف، تسلط و روانی واقعی در گفتار ایجاد می‌کند.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full'),
('40006000-0000-0000-0001-002400000004', '40006000-0000-0000-0000-002400000002', 4, 'clerk', 'Staying calm and consistent turns difficult phrases into everyday speech habits.', 'آرامش و استمرار در تمرین، عبارات دشوار را به عادت‌های گفتاری روزمره بدل می‌سازد.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full'),
('40006000-0000-0000-0001-002400000005', '40006000-0000-0000-0000-002400000002', 5, 'customer', 'Completing this unit brings us closer to full mastery of English vocabulary.', 'تکمیل این درس ما را به تسلط کامل بر دایره واژگان انگلیسی نزدیک‌تر می‌کند.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full')
ON CONFLICT (id) DO NOTHING;

INSERT INTO podcasts (id, title, description_fa, level, kind, series_id, episode_no, audio_url, audio_status, is_active, duration_seconds, position, vocabulary, scene_id)
VALUES ('40006000-0000-0000-0000-002400000003', 'Planetary Biosphere Stewardship (Book 6 - Unit 24)', 'روایت داستانی و آموزش واژگان یونیت 24 (نگهبانی از زیست‌کره سیاره) از کتاب 6 دوره ۴۰۰۰ واژه', 'proficient', 'lesson', '40000000-0006-0000-0000-000000000006', 24, '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'ready', TRUE, 348, 24, '[{"word": "reverberate", "meaning_fa": "بازتاب گسترده در جامعه"}, {"word": "scrutinize", "meaning_fa": "بررسی موشکافانه و دقیق"}, {"word": "transcend", "meaning_fa": "فراتر رفتن از محدودیت‌ها"}, {"word": "unravel", "meaning_fa": "گشودن گره‌های پیچیده"}, {"word": "venerate", "meaning_fa": "ارج نهادن و پاسداشت مقام"}, {"word": "warrant", "meaning_fa": "تضمین و توجیه شایسته"}, {"word": "crystallize", "meaning_fa": "تبلور شفاف دیدگاه"}, {"word": "culminate", "meaning_fa": "به اوج تکامل رسیدن"}, {"word": "amalgamate", "meaning_fa": "ادغام و یکپارچه‌سازی متعالی"}, {"word": "bolster", "meaning_fa": "تقویت بنیادین ارکان"}, {"word": "circumscribe", "meaning_fa": "تعیین دقیق حدود و ثغور"}, {"word": "delineate", "meaning_fa": "تبیین موشکافانه ابعاد"}, {"word": "elucidate", "meaning_fa": "روشنگری عمیق مفهومی"}, {"word": "foster", "meaning_fa": "پرورش نظام‌مند استعدادها"}, {"word": "galvanize", "meaning_fa": "برانگیختن انگیزه فراگیر"}, {"word": "herald", "meaning_fa": "بشارت‌دهنده افق‌های نوین"}, {"word": "instigate", "meaning_fa": "آغازگری تحولات ساختاری"}, {"word": "juxtapose", "meaning_fa": "هم‌نشینی و مقایسه تطبیقی"}, {"word": "manifest", "meaning_fa": "تبلور عینی ارزش‌ها"}, {"word": "promulgate", "meaning_fa": "اشاعه و ترویج رسمی اندیشه"}]'::jsonb, '40006000-0000-0000-0000-002400000001')
ON CONFLICT (id) DO UPDATE SET scene_id = EXCLUDED.scene_id, vocabulary = EXCLUDED.vocabulary;

INSERT INTO podcast_lines (podcast_id, position, speaker, text, translation_fa, start_ms, end_ms)
VALUES
('40006000-0000-0000-0000-002400000003', 0, 'Alex', 'Welcome to 4000 Essential English Words, Book 6, Unit 24: Planetary Biosphere Stewardship.', 'به درس 24 از کتاب 6 دوره ۴۰۰۰ واژه خوش آمدید: نگهبانی از زیست‌کره سیاره.', 0, 6000),
('40006000-0000-0000-0000-002400000003', 1, 'Sarah', 'Today we focus on 20 high-frequency vocabulary words used in real-life contexts.', 'امروز بر روی 20 واژه پرکاربرد در موقعیت‌های واقعی تمرکز می‌کنیم.', 6300, 13500),
('40006000-0000-0000-0000-002400000003', 2, 'Alex', 'Listen closely to the natural rhythm and pronunciation of each target phrase.', 'به ریتم طبیعی و تلفظ دقیق هر عبارت هدف خوب گوش فرا دهید.', 13800, 21000),
('40006000-0000-0000-0000-002400000003', 3, 'Sarah', 'Now head over to the shadowing section to record these sentences in your own voice!', 'حالا به بخش شادوئینگ بروید تا این جملات را با صدای خودتان تمرین و ضبط کنید!', 21400, 29000)
ON CONFLICT DO NOTHING;

-- کتاب 6 - درس 25: Advanced Analytical Reasoning
INSERT INTO scenes (id, title, description, background_image_url, difficulty, status, "order", category, is_custom)
VALUES ('40006000-0000-0000-0000-002500000001', 'Advanced Analytical Reasoning (Book 6 - Unit 25)', 'تمرین شادوئینگ یونیت 25 کتاب 6 (استدلال تحلیلی سطح بالا): unravel, venerate, warrant, crystallize, culminate, amalgamate...', '', 'proficient', 'published', 625, 'education', false)
ON CONFLICT (id) DO NOTHING;

INSERT INTO hotspots (id, scene_id, name, x_position, y_position, order_index)
VALUES ('40006000-0000-0000-0000-002500000002', '40006000-0000-0000-0000-002500000001', 'Dialogue', 50.0, 50.0, 1)
ON CONFLICT (id) DO NOTHING;

INSERT INTO dialogues (id, hotspot_id, "order", speaker, original_text, translation, audio_url, display_type)
VALUES
('40006000-0000-0000-0001-002500000001', '40006000-0000-0000-0000-002500000002', 1, 'customer', 'Exploring advanced analytical reasoning offers a great opportunity to master essential vocabulary.', 'بررسی موضوع استدلال تحلیلی سطح بالا فرصتی عالی برای تسلط بر واژگان ضروری به شمار می‌رود.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full'),
('40006000-0000-0000-0001-002500000002', '40006000-0000-0000-0000-002500000002', 2, 'clerk', 'Native speakers naturally use target words like unravel and venerate in conversation.', 'گویندگان نیتیو کلماتی چون unravel (گشودن گره‌های پیچیده) و venerate (ارج نهادن و پاسداشت مقام) را به صورت طبیعی در مکالمه به کار می‌برند.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full'),
('40006000-0000-0000-0001-002500000003', '40006000-0000-0000-0000-002500000002', 3, 'customer', 'Practicing sentence by sentence with clear pronunciation builds real conversational fluency.', 'تمرین جمله‌به‌جمله با تلفظ شفاف، تسلط و روانی واقعی در گفتار ایجاد می‌کند.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full'),
('40006000-0000-0000-0001-002500000004', '40006000-0000-0000-0000-002500000002', 4, 'clerk', 'Staying calm and consistent turns difficult phrases into everyday speech habits.', 'آرامش و استمرار در تمرین، عبارات دشوار را به عادت‌های گفتاری روزمره بدل می‌سازد.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full'),
('40006000-0000-0000-0001-002500000005', '40006000-0000-0000-0000-002500000002', 5, 'customer', 'Completing this unit brings us closer to full mastery of English vocabulary.', 'تکمیل این درس ما را به تسلط کامل بر دایره واژگان انگلیسی نزدیک‌تر می‌کند.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full')
ON CONFLICT (id) DO NOTHING;

INSERT INTO podcasts (id, title, description_fa, level, kind, series_id, episode_no, audio_url, audio_status, is_active, duration_seconds, position, vocabulary, scene_id)
VALUES ('40006000-0000-0000-0000-002500000003', 'Advanced Analytical Reasoning (Book 6 - Unit 25)', 'روایت داستانی و آموزش واژگان یونیت 25 (استدلال تحلیلی سطح بالا) از کتاب 6 دوره ۴۰۰۰ واژه', 'proficient', 'lesson', '40000000-0006-0000-0000-000000000006', 25, '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'ready', TRUE, 350, 25, '[{"word": "unravel", "meaning_fa": "گشودن گره‌های پیچیده"}, {"word": "venerate", "meaning_fa": "ارج نهادن و پاسداشت مقام"}, {"word": "warrant", "meaning_fa": "تضمین و توجیه شایسته"}, {"word": "crystallize", "meaning_fa": "تبلور شفاف دیدگاه"}, {"word": "culminate", "meaning_fa": "به اوج تکامل رسیدن"}, {"word": "amalgamate", "meaning_fa": "ادغام و یکپارچه‌سازی متعالی"}, {"word": "bolster", "meaning_fa": "تقویت بنیادین ارکان"}, {"word": "circumscribe", "meaning_fa": "تعیین دقیق حدود و ثغور"}, {"word": "delineate", "meaning_fa": "تبیین موشکافانه ابعاد"}, {"word": "elucidate", "meaning_fa": "روشنگری عمیق مفهومی"}, {"word": "foster", "meaning_fa": "پرورش نظام‌مند استعدادها"}, {"word": "galvanize", "meaning_fa": "برانگیختن انگیزه فراگیر"}, {"word": "herald", "meaning_fa": "بشارت‌دهنده افق‌های نوین"}, {"word": "instigate", "meaning_fa": "آغازگری تحولات ساختاری"}, {"word": "juxtapose", "meaning_fa": "هم‌نشینی و مقایسه تطبیقی"}, {"word": "manifest", "meaning_fa": "تبلور عینی ارزش‌ها"}, {"word": "promulgate", "meaning_fa": "اشاعه و ترویج رسمی اندیشه"}, {"word": "reverberate", "meaning_fa": "بازتاب گسترده در جامعه"}, {"word": "scrutinize", "meaning_fa": "بررسی موشکافانه و دقیق"}, {"word": "transcend", "meaning_fa": "فراتر رفتن از محدودیت‌ها"}]'::jsonb, '40006000-0000-0000-0000-002500000001')
ON CONFLICT (id) DO UPDATE SET scene_id = EXCLUDED.scene_id, vocabulary = EXCLUDED.vocabulary;

INSERT INTO podcast_lines (podcast_id, position, speaker, text, translation_fa, start_ms, end_ms)
VALUES
('40006000-0000-0000-0000-002500000003', 0, 'Alex', 'Welcome to 4000 Essential English Words, Book 6, Unit 25: Advanced Analytical Reasoning.', 'به درس 25 از کتاب 6 دوره ۴۰۰۰ واژه خوش آمدید: استدلال تحلیلی سطح بالا.', 0, 6000),
('40006000-0000-0000-0000-002500000003', 1, 'Sarah', 'Today we focus on 20 high-frequency vocabulary words used in real-life contexts.', 'امروز بر روی 20 واژه پرکاربرد در موقعیت‌های واقعی تمرکز می‌کنیم.', 6300, 13500),
('40006000-0000-0000-0000-002500000003', 2, 'Alex', 'Listen closely to the natural rhythm and pronunciation of each target phrase.', 'به ریتم طبیعی و تلفظ دقیق هر عبارت هدف خوب گوش فرا دهید.', 13800, 21000),
('40006000-0000-0000-0000-002500000003', 3, 'Sarah', 'Now head over to the shadowing section to record these sentences in your own voice!', 'حالا به بخش شادوئینگ بروید تا این جملات را با صدای خودتان تمرین و ضبط کنید!', 21400, 29000)
ON CONFLICT DO NOTHING;

-- کتاب 6 - درس 26: Cross-Cultural Pragmatics
INSERT INTO scenes (id, title, description, background_image_url, difficulty, status, "order", category, is_custom)
VALUES ('40006000-0000-0000-0000-002600000001', 'Cross-Cultural Pragmatics (Book 6 - Unit 26)', 'تمرین شادوئینگ یونیت 26 کتاب 6 (کاربردشناسی زبان در فرهنگ‌ها): crystallize, culminate, amalgamate, bolster, circumscribe, delineate...', '', 'proficient', 'published', 626, 'education', false)
ON CONFLICT (id) DO NOTHING;

INSERT INTO hotspots (id, scene_id, name, x_position, y_position, order_index)
VALUES ('40006000-0000-0000-0000-002600000002', '40006000-0000-0000-0000-002600000001', 'Dialogue', 50.0, 50.0, 1)
ON CONFLICT (id) DO NOTHING;

INSERT INTO dialogues (id, hotspot_id, "order", speaker, original_text, translation, audio_url, display_type)
VALUES
('40006000-0000-0000-0001-002600000001', '40006000-0000-0000-0000-002600000002', 1, 'customer', 'Exploring cross-cultural pragmatics offers a great opportunity to master essential vocabulary.', 'بررسی موضوع کاربردشناسی زبان در فرهنگ‌ها فرصتی عالی برای تسلط بر واژگان ضروری به شمار می‌رود.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full'),
('40006000-0000-0000-0001-002600000002', '40006000-0000-0000-0000-002600000002', 2, 'clerk', 'Native speakers naturally use target words like crystallize and culminate in conversation.', 'گویندگان نیتیو کلماتی چون crystallize (تبلور شفاف دیدگاه) و culminate (به اوج تکامل رسیدن) را به صورت طبیعی در مکالمه به کار می‌برند.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full'),
('40006000-0000-0000-0001-002600000003', '40006000-0000-0000-0000-002600000002', 3, 'customer', 'Practicing sentence by sentence with clear pronunciation builds real conversational fluency.', 'تمرین جمله‌به‌جمله با تلفظ شفاف، تسلط و روانی واقعی در گفتار ایجاد می‌کند.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full'),
('40006000-0000-0000-0001-002600000004', '40006000-0000-0000-0000-002600000002', 4, 'clerk', 'Staying calm and consistent turns difficult phrases into everyday speech habits.', 'آرامش و استمرار در تمرین، عبارات دشوار را به عادت‌های گفتاری روزمره بدل می‌سازد.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full'),
('40006000-0000-0000-0001-002600000005', '40006000-0000-0000-0000-002600000002', 5, 'customer', 'Completing this unit brings us closer to full mastery of English vocabulary.', 'تکمیل این درس ما را به تسلط کامل بر دایره واژگان انگلیسی نزدیک‌تر می‌کند.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full')
ON CONFLICT (id) DO NOTHING;

INSERT INTO podcasts (id, title, description_fa, level, kind, series_id, episode_no, audio_url, audio_status, is_active, duration_seconds, position, vocabulary, scene_id)
VALUES ('40006000-0000-0000-0000-002600000003', 'Cross-Cultural Pragmatics (Book 6 - Unit 26)', 'روایت داستانی و آموزش واژگان یونیت 26 (کاربردشناسی زبان در فرهنگ‌ها) از کتاب 6 دوره ۴۰۰۰ واژه', 'proficient', 'lesson', '40000000-0006-0000-0000-000000000006', 26, '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'ready', TRUE, 352, 26, '[{"word": "crystallize", "meaning_fa": "تبلور شفاف دیدگاه"}, {"word": "culminate", "meaning_fa": "به اوج تکامل رسیدن"}, {"word": "amalgamate", "meaning_fa": "ادغام و یکپارچه‌سازی متعالی"}, {"word": "bolster", "meaning_fa": "تقویت بنیادین ارکان"}, {"word": "circumscribe", "meaning_fa": "تعیین دقیق حدود و ثغور"}, {"word": "delineate", "meaning_fa": "تبیین موشکافانه ابعاد"}, {"word": "elucidate", "meaning_fa": "روشنگری عمیق مفهومی"}, {"word": "foster", "meaning_fa": "پرورش نظام‌مند استعدادها"}, {"word": "galvanize", "meaning_fa": "برانگیختن انگیزه فراگیر"}, {"word": "herald", "meaning_fa": "بشارت‌دهنده افق‌های نوین"}, {"word": "instigate", "meaning_fa": "آغازگری تحولات ساختاری"}, {"word": "juxtapose", "meaning_fa": "هم‌نشینی و مقایسه تطبیقی"}, {"word": "manifest", "meaning_fa": "تبلور عینی ارزش‌ها"}, {"word": "promulgate", "meaning_fa": "اشاعه و ترویج رسمی اندیشه"}, {"word": "reverberate", "meaning_fa": "بازتاب گسترده در جامعه"}, {"word": "scrutinize", "meaning_fa": "بررسی موشکافانه و دقیق"}, {"word": "transcend", "meaning_fa": "فراتر رفتن از محدودیت‌ها"}, {"word": "unravel", "meaning_fa": "گشودن گره‌های پیچیده"}, {"word": "venerate", "meaning_fa": "ارج نهادن و پاسداشت مقام"}, {"word": "warrant", "meaning_fa": "تضمین و توجیه شایسته"}]'::jsonb, '40006000-0000-0000-0000-002600000001')
ON CONFLICT (id) DO UPDATE SET scene_id = EXCLUDED.scene_id, vocabulary = EXCLUDED.vocabulary;

INSERT INTO podcast_lines (podcast_id, position, speaker, text, translation_fa, start_ms, end_ms)
VALUES
('40006000-0000-0000-0000-002600000003', 0, 'Alex', 'Welcome to 4000 Essential English Words, Book 6, Unit 26: Cross-Cultural Pragmatics.', 'به درس 26 از کتاب 6 دوره ۴۰۰۰ واژه خوش آمدید: کاربردشناسی زبان در فرهنگ‌ها.', 0, 6000),
('40006000-0000-0000-0000-002600000003', 1, 'Sarah', 'Today we focus on 20 high-frequency vocabulary words used in real-life contexts.', 'امروز بر روی 20 واژه پرکاربرد در موقعیت‌های واقعی تمرکز می‌کنیم.', 6300, 13500),
('40006000-0000-0000-0000-002600000003', 2, 'Alex', 'Listen closely to the natural rhythm and pronunciation of each target phrase.', 'به ریتم طبیعی و تلفظ دقیق هر عبارت هدف خوب گوش فرا دهید.', 13800, 21000),
('40006000-0000-0000-0000-002600000003', 3, 'Sarah', 'Now head over to the shadowing section to record these sentences in your own voice!', 'حالا به بخش شادوئینگ بروید تا این جملات را با صدای خودتان تمرین و ضبط کنید!', 21400, 29000)
ON CONFLICT DO NOTHING;

-- کتاب 6 - درس 27: International Arbitration Law
INSERT INTO scenes (id, title, description, background_image_url, difficulty, status, "order", category, is_custom)
VALUES ('40006000-0000-0000-0000-002700000001', 'International Arbitration Law (Book 6 - Unit 27)', 'تمرین شادوئینگ یونیت 27 کتاب 6 (داوری بین‌المللی اختلافات تجاری): bolster, circumscribe, delineate, elucidate, foster, galvanize...', '', 'proficient', 'published', 627, 'education', false)
ON CONFLICT (id) DO NOTHING;

INSERT INTO hotspots (id, scene_id, name, x_position, y_position, order_index)
VALUES ('40006000-0000-0000-0000-002700000002', '40006000-0000-0000-0000-002700000001', 'Dialogue', 50.0, 50.0, 1)
ON CONFLICT (id) DO NOTHING;

INSERT INTO dialogues (id, hotspot_id, "order", speaker, original_text, translation, audio_url, display_type)
VALUES
('40006000-0000-0000-0001-002700000001', '40006000-0000-0000-0000-002700000002', 1, 'customer', 'Exploring international arbitration law offers a great opportunity to master essential vocabulary.', 'بررسی موضوع داوری بین‌المللی اختلافات تجاری فرصتی عالی برای تسلط بر واژگان ضروری به شمار می‌رود.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full'),
('40006000-0000-0000-0001-002700000002', '40006000-0000-0000-0000-002700000002', 2, 'clerk', 'Native speakers naturally use target words like bolster and circumscribe in conversation.', 'گویندگان نیتیو کلماتی چون bolster (تقویت بنیادین ارکان) و circumscribe (تعیین دقیق حدود و ثغور) را به صورت طبیعی در مکالمه به کار می‌برند.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full'),
('40006000-0000-0000-0001-002700000003', '40006000-0000-0000-0000-002700000002', 3, 'customer', 'Practicing sentence by sentence with clear pronunciation builds real conversational fluency.', 'تمرین جمله‌به‌جمله با تلفظ شفاف، تسلط و روانی واقعی در گفتار ایجاد می‌کند.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full'),
('40006000-0000-0000-0001-002700000004', '40006000-0000-0000-0000-002700000002', 4, 'clerk', 'Staying calm and consistent turns difficult phrases into everyday speech habits.', 'آرامش و استمرار در تمرین، عبارات دشوار را به عادت‌های گفتاری روزمره بدل می‌سازد.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full'),
('40006000-0000-0000-0001-002700000005', '40006000-0000-0000-0000-002700000002', 5, 'customer', 'Completing this unit brings us closer to full mastery of English vocabulary.', 'تکمیل این درس ما را به تسلط کامل بر دایره واژگان انگلیسی نزدیک‌تر می‌کند.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full')
ON CONFLICT (id) DO NOTHING;

INSERT INTO podcasts (id, title, description_fa, level, kind, series_id, episode_no, audio_url, audio_status, is_active, duration_seconds, position, vocabulary, scene_id)
VALUES ('40006000-0000-0000-0000-002700000003', 'International Arbitration Law (Book 6 - Unit 27)', 'روایت داستانی و آموزش واژگان یونیت 27 (داوری بین‌المللی اختلافات تجاری) از کتاب 6 دوره ۴۰۰۰ واژه', 'proficient', 'lesson', '40000000-0006-0000-0000-000000000006', 27, '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'ready', TRUE, 354, 27, '[{"word": "bolster", "meaning_fa": "تقویت بنیادین ارکان"}, {"word": "circumscribe", "meaning_fa": "تعیین دقیق حدود و ثغور"}, {"word": "delineate", "meaning_fa": "تبیین موشکافانه ابعاد"}, {"word": "elucidate", "meaning_fa": "روشنگری عمیق مفهومی"}, {"word": "foster", "meaning_fa": "پرورش نظام‌مند استعدادها"}, {"word": "galvanize", "meaning_fa": "برانگیختن انگیزه فراگیر"}, {"word": "herald", "meaning_fa": "بشارت‌دهنده افق‌های نوین"}, {"word": "instigate", "meaning_fa": "آغازگری تحولات ساختاری"}, {"word": "juxtapose", "meaning_fa": "هم‌نشینی و مقایسه تطبیقی"}, {"word": "manifest", "meaning_fa": "تبلور عینی ارزش‌ها"}, {"word": "promulgate", "meaning_fa": "اشاعه و ترویج رسمی اندیشه"}, {"word": "reverberate", "meaning_fa": "بازتاب گسترده در جامعه"}, {"word": "scrutinize", "meaning_fa": "بررسی موشکافانه و دقیق"}, {"word": "transcend", "meaning_fa": "فراتر رفتن از محدودیت‌ها"}, {"word": "unravel", "meaning_fa": "گشودن گره‌های پیچیده"}, {"word": "venerate", "meaning_fa": "ارج نهادن و پاسداشت مقام"}, {"word": "warrant", "meaning_fa": "تضمین و توجیه شایسته"}, {"word": "crystallize", "meaning_fa": "تبلور شفاف دیدگاه"}, {"word": "culminate", "meaning_fa": "به اوج تکامل رسیدن"}, {"word": "amalgamate", "meaning_fa": "ادغام و یکپارچه‌سازی متعالی"}]'::jsonb, '40006000-0000-0000-0000-002700000001')
ON CONFLICT (id) DO UPDATE SET scene_id = EXCLUDED.scene_id, vocabulary = EXCLUDED.vocabulary;

INSERT INTO podcast_lines (podcast_id, position, speaker, text, translation_fa, start_ms, end_ms)
VALUES
('40006000-0000-0000-0000-002700000003', 0, 'Alex', 'Welcome to 4000 Essential English Words, Book 6, Unit 27: International Arbitration Law.', 'به درس 27 از کتاب 6 دوره ۴۰۰۰ واژه خوش آمدید: داوری بین‌المللی اختلافات تجاری.', 0, 6000),
('40006000-0000-0000-0000-002700000003', 1, 'Sarah', 'Today we focus on 20 high-frequency vocabulary words used in real-life contexts.', 'امروز بر روی 20 واژه پرکاربرد در موقعیت‌های واقعی تمرکز می‌کنیم.', 6300, 13500),
('40006000-0000-0000-0000-002700000003', 2, 'Alex', 'Listen closely to the natural rhythm and pronunciation of each target phrase.', 'به ریتم طبیعی و تلفظ دقیق هر عبارت هدف خوب گوش فرا دهید.', 13800, 21000),
('40006000-0000-0000-0000-002700000003', 3, 'Sarah', 'Now head over to the shadowing section to record these sentences in your own voice!', 'حالا به بخش شادوئینگ بروید تا این جملات را با صدای خودتان تمرین و ضبط کنید!', 21400, 29000)
ON CONFLICT DO NOTHING;

-- کتاب 6 - درس 28: Eco-Systemic Restoration
INSERT INTO scenes (id, title, description, background_image_url, difficulty, status, "order", category, is_custom)
VALUES ('40006000-0000-0000-0000-002800000001', 'Eco-Systemic Restoration (Book 6 - Unit 28)', 'تمرین شادوئینگ یونیت 28 کتاب 6 (احیای اکوسیستم‌های طبیعی): elucidate, foster, galvanize, herald, instigate, juxtapose...', '', 'proficient', 'published', 628, 'education', false)
ON CONFLICT (id) DO NOTHING;

INSERT INTO hotspots (id, scene_id, name, x_position, y_position, order_index)
VALUES ('40006000-0000-0000-0000-002800000002', '40006000-0000-0000-0000-002800000001', 'Dialogue', 50.0, 50.0, 1)
ON CONFLICT (id) DO NOTHING;

INSERT INTO dialogues (id, hotspot_id, "order", speaker, original_text, translation, audio_url, display_type)
VALUES
('40006000-0000-0000-0001-002800000001', '40006000-0000-0000-0000-002800000002', 1, 'customer', 'Exploring eco-systemic restoration offers a great opportunity to master essential vocabulary.', 'بررسی موضوع احیای اکوسیستم‌های طبیعی فرصتی عالی برای تسلط بر واژگان ضروری به شمار می‌رود.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full'),
('40006000-0000-0000-0001-002800000002', '40006000-0000-0000-0000-002800000002', 2, 'clerk', 'Native speakers naturally use target words like elucidate and foster in conversation.', 'گویندگان نیتیو کلماتی چون elucidate (روشنگری عمیق مفهومی) و foster (پرورش نظام‌مند استعدادها) را به صورت طبیعی در مکالمه به کار می‌برند.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full'),
('40006000-0000-0000-0001-002800000003', '40006000-0000-0000-0000-002800000002', 3, 'customer', 'Practicing sentence by sentence with clear pronunciation builds real conversational fluency.', 'تمرین جمله‌به‌جمله با تلفظ شفاف، تسلط و روانی واقعی در گفتار ایجاد می‌کند.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full'),
('40006000-0000-0000-0001-002800000004', '40006000-0000-0000-0000-002800000002', 4, 'clerk', 'Staying calm and consistent turns difficult phrases into everyday speech habits.', 'آرامش و استمرار در تمرین، عبارات دشوار را به عادت‌های گفتاری روزمره بدل می‌سازد.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full'),
('40006000-0000-0000-0001-002800000005', '40006000-0000-0000-0000-002800000002', 5, 'customer', 'Completing this unit brings us closer to full mastery of English vocabulary.', 'تکمیل این درس ما را به تسلط کامل بر دایره واژگان انگلیسی نزدیک‌تر می‌کند.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full')
ON CONFLICT (id) DO NOTHING;

INSERT INTO podcasts (id, title, description_fa, level, kind, series_id, episode_no, audio_url, audio_status, is_active, duration_seconds, position, vocabulary, scene_id)
VALUES ('40006000-0000-0000-0000-002800000003', 'Eco-Systemic Restoration (Book 6 - Unit 28)', 'روایت داستانی و آموزش واژگان یونیت 28 (احیای اکوسیستم‌های طبیعی) از کتاب 6 دوره ۴۰۰۰ واژه', 'proficient', 'lesson', '40000000-0006-0000-0000-000000000006', 28, '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'ready', TRUE, 356, 28, '[{"word": "elucidate", "meaning_fa": "روشنگری عمیق مفهومی"}, {"word": "foster", "meaning_fa": "پرورش نظام‌مند استعدادها"}, {"word": "galvanize", "meaning_fa": "برانگیختن انگیزه فراگیر"}, {"word": "herald", "meaning_fa": "بشارت‌دهنده افق‌های نوین"}, {"word": "instigate", "meaning_fa": "آغازگری تحولات ساختاری"}, {"word": "juxtapose", "meaning_fa": "هم‌نشینی و مقایسه تطبیقی"}, {"word": "manifest", "meaning_fa": "تبلور عینی ارزش‌ها"}, {"word": "promulgate", "meaning_fa": "اشاعه و ترویج رسمی اندیشه"}, {"word": "reverberate", "meaning_fa": "بازتاب گسترده در جامعه"}, {"word": "scrutinize", "meaning_fa": "بررسی موشکافانه و دقیق"}, {"word": "transcend", "meaning_fa": "فراتر رفتن از محدودیت‌ها"}, {"word": "unravel", "meaning_fa": "گشودن گره‌های پیچیده"}, {"word": "venerate", "meaning_fa": "ارج نهادن و پاسداشت مقام"}, {"word": "warrant", "meaning_fa": "تضمین و توجیه شایسته"}, {"word": "crystallize", "meaning_fa": "تبلور شفاف دیدگاه"}, {"word": "culminate", "meaning_fa": "به اوج تکامل رسیدن"}, {"word": "amalgamate", "meaning_fa": "ادغام و یکپارچه‌سازی متعالی"}, {"word": "bolster", "meaning_fa": "تقویت بنیادین ارکان"}, {"word": "circumscribe", "meaning_fa": "تعیین دقیق حدود و ثغور"}, {"word": "delineate", "meaning_fa": "تبیین موشکافانه ابعاد"}]'::jsonb, '40006000-0000-0000-0000-002800000001')
ON CONFLICT (id) DO UPDATE SET scene_id = EXCLUDED.scene_id, vocabulary = EXCLUDED.vocabulary;

INSERT INTO podcast_lines (podcast_id, position, speaker, text, translation_fa, start_ms, end_ms)
VALUES
('40006000-0000-0000-0000-002800000003', 0, 'Alex', 'Welcome to 4000 Essential English Words, Book 6, Unit 28: Eco-Systemic Restoration.', 'به درس 28 از کتاب 6 دوره ۴۰۰۰ واژه خوش آمدید: احیای اکوسیستم‌های طبیعی.', 0, 6000),
('40006000-0000-0000-0000-002800000003', 1, 'Sarah', 'Today we focus on 20 high-frequency vocabulary words used in real-life contexts.', 'امروز بر روی 20 واژه پرکاربرد در موقعیت‌های واقعی تمرکز می‌کنیم.', 6300, 13500),
('40006000-0000-0000-0000-002800000003', 2, 'Alex', 'Listen closely to the natural rhythm and pronunciation of each target phrase.', 'به ریتم طبیعی و تلفظ دقیق هر عبارت هدف خوب گوش فرا دهید.', 13800, 21000),
('40006000-0000-0000-0000-002800000003', 3, 'Sarah', 'Now head over to the shadowing section to record these sentences in your own voice!', 'حالا به بخش شادوئینگ بروید تا این جملات را با صدای خودتان تمرین و ضبط کنید!', 21400, 29000)
ON CONFLICT DO NOTHING;

-- کتاب 6 - درس 29: Transdisciplinary Research
INSERT INTO scenes (id, title, description, background_image_url, difficulty, status, "order", category, is_custom)
VALUES ('40006000-0000-0000-0000-002900000001', 'Transdisciplinary Research (Book 6 - Unit 29)', 'تمرین شادوئینگ یونیت 29 کتاب 6 (پژوهش‌های فرارشته‌ای پیشرفته): herald, instigate, juxtapose, manifest, promulgate, reverberate...', '', 'proficient', 'published', 629, 'education', false)
ON CONFLICT (id) DO NOTHING;

INSERT INTO hotspots (id, scene_id, name, x_position, y_position, order_index)
VALUES ('40006000-0000-0000-0000-002900000002', '40006000-0000-0000-0000-002900000001', 'Dialogue', 50.0, 50.0, 1)
ON CONFLICT (id) DO NOTHING;

INSERT INTO dialogues (id, hotspot_id, "order", speaker, original_text, translation, audio_url, display_type)
VALUES
('40006000-0000-0000-0001-002900000001', '40006000-0000-0000-0000-002900000002', 1, 'customer', 'Exploring transdisciplinary research offers a great opportunity to master essential vocabulary.', 'بررسی موضوع پژوهش‌های فرارشته‌ای پیشرفته فرصتی عالی برای تسلط بر واژگان ضروری به شمار می‌رود.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full'),
('40006000-0000-0000-0001-002900000002', '40006000-0000-0000-0000-002900000002', 2, 'clerk', 'Native speakers naturally use target words like herald and instigate in conversation.', 'گویندگان نیتیو کلماتی چون herald (بشارت‌دهنده افق‌های نوین) و instigate (آغازگری تحولات ساختاری) را به صورت طبیعی در مکالمه به کار می‌برند.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full'),
('40006000-0000-0000-0001-002900000003', '40006000-0000-0000-0000-002900000002', 3, 'customer', 'Practicing sentence by sentence with clear pronunciation builds real conversational fluency.', 'تمرین جمله‌به‌جمله با تلفظ شفاف، تسلط و روانی واقعی در گفتار ایجاد می‌کند.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full'),
('40006000-0000-0000-0001-002900000004', '40006000-0000-0000-0000-002900000002', 4, 'clerk', 'Staying calm and consistent turns difficult phrases into everyday speech habits.', 'آرامش و استمرار در تمرین، عبارات دشوار را به عادت‌های گفتاری روزمره بدل می‌سازد.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full'),
('40006000-0000-0000-0001-002900000005', '40006000-0000-0000-0000-002900000002', 5, 'customer', 'Completing this unit brings us closer to full mastery of English vocabulary.', 'تکمیل این درس ما را به تسلط کامل بر دایره واژگان انگلیسی نزدیک‌تر می‌کند.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full')
ON CONFLICT (id) DO NOTHING;

INSERT INTO podcasts (id, title, description_fa, level, kind, series_id, episode_no, audio_url, audio_status, is_active, duration_seconds, position, vocabulary, scene_id)
VALUES ('40006000-0000-0000-0000-002900000003', 'Transdisciplinary Research (Book 6 - Unit 29)', 'روایت داستانی و آموزش واژگان یونیت 29 (پژوهش‌های فرارشته‌ای پیشرفته) از کتاب 6 دوره ۴۰۰۰ واژه', 'proficient', 'lesson', '40000000-0006-0000-0000-000000000006', 29, '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'ready', TRUE, 358, 29, '[{"word": "herald", "meaning_fa": "بشارت‌دهنده افق‌های نوین"}, {"word": "instigate", "meaning_fa": "آغازگری تحولات ساختاری"}, {"word": "juxtapose", "meaning_fa": "هم‌نشینی و مقایسه تطبیقی"}, {"word": "manifest", "meaning_fa": "تبلور عینی ارزش‌ها"}, {"word": "promulgate", "meaning_fa": "اشاعه و ترویج رسمی اندیشه"}, {"word": "reverberate", "meaning_fa": "بازتاب گسترده در جامعه"}, {"word": "scrutinize", "meaning_fa": "بررسی موشکافانه و دقیق"}, {"word": "transcend", "meaning_fa": "فراتر رفتن از محدودیت‌ها"}, {"word": "unravel", "meaning_fa": "گشودن گره‌های پیچیده"}, {"word": "venerate", "meaning_fa": "ارج نهادن و پاسداشت مقام"}, {"word": "warrant", "meaning_fa": "تضمین و توجیه شایسته"}, {"word": "crystallize", "meaning_fa": "تبلور شفاف دیدگاه"}, {"word": "culminate", "meaning_fa": "به اوج تکامل رسیدن"}, {"word": "amalgamate", "meaning_fa": "ادغام و یکپارچه‌سازی متعالی"}, {"word": "bolster", "meaning_fa": "تقویت بنیادین ارکان"}, {"word": "circumscribe", "meaning_fa": "تعیین دقیق حدود و ثغور"}, {"word": "delineate", "meaning_fa": "تبیین موشکافانه ابعاد"}, {"word": "elucidate", "meaning_fa": "روشنگری عمیق مفهومی"}, {"word": "foster", "meaning_fa": "پرورش نظام‌مند استعدادها"}, {"word": "galvanize", "meaning_fa": "برانگیختن انگیزه فراگیر"}]'::jsonb, '40006000-0000-0000-0000-002900000001')
ON CONFLICT (id) DO UPDATE SET scene_id = EXCLUDED.scene_id, vocabulary = EXCLUDED.vocabulary;

INSERT INTO podcast_lines (podcast_id, position, speaker, text, translation_fa, start_ms, end_ms)
VALUES
('40006000-0000-0000-0000-002900000003', 0, 'Alex', 'Welcome to 4000 Essential English Words, Book 6, Unit 29: Transdisciplinary Research.', 'به درس 29 از کتاب 6 دوره ۴۰۰۰ واژه خوش آمدید: پژوهش‌های فرارشته‌ای پیشرفته.', 0, 6000),
('40006000-0000-0000-0000-002900000003', 1, 'Sarah', 'Today we focus on 20 high-frequency vocabulary words used in real-life contexts.', 'امروز بر روی 20 واژه پرکاربرد در موقعیت‌های واقعی تمرکز می‌کنیم.', 6300, 13500),
('40006000-0000-0000-0000-002900000003', 2, 'Alex', 'Listen closely to the natural rhythm and pronunciation of each target phrase.', 'به ریتم طبیعی و تلفظ دقیق هر عبارت هدف خوب گوش فرا دهید.', 13800, 21000),
('40006000-0000-0000-0000-002900000003', 3, 'Sarah', 'Now head over to the shadowing section to record these sentences in your own voice!', 'حالا به بخش شادوئینگ بروید تا این جملات را با صدای خودتان تمرین و ضبط کنید!', 21400, 29000)
ON CONFLICT DO NOTHING;

-- کتاب 6 - درس 30: The Zenith of English Mastery
INSERT INTO scenes (id, title, description, background_image_url, difficulty, status, "order", category, is_custom)
VALUES ('40006000-0000-0000-0000-003000000001', 'The Zenith of English Mastery (Book 6 - Unit 30)', 'تمرین شادوئینگ یونیت 30 کتاب 6 (اوج تسلط و روانی در انگلیسی): manifest, promulgate, reverberate, scrutinize, transcend, unravel...', '', 'proficient', 'published', 630, 'education', false)
ON CONFLICT (id) DO NOTHING;

INSERT INTO hotspots (id, scene_id, name, x_position, y_position, order_index)
VALUES ('40006000-0000-0000-0000-003000000002', '40006000-0000-0000-0000-003000000001', 'Dialogue', 50.0, 50.0, 1)
ON CONFLICT (id) DO NOTHING;

INSERT INTO dialogues (id, hotspot_id, "order", speaker, original_text, translation, audio_url, display_type)
VALUES
('40006000-0000-0000-0001-003000000001', '40006000-0000-0000-0000-003000000002', 1, 'customer', 'Exploring the zenith of english mastery offers a great opportunity to master essential vocabulary.', 'بررسی موضوع اوج تسلط و روانی در انگلیسی فرصتی عالی برای تسلط بر واژگان ضروری به شمار می‌رود.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full'),
('40006000-0000-0000-0001-003000000002', '40006000-0000-0000-0000-003000000002', 2, 'clerk', 'Native speakers naturally use target words like manifest and promulgate in conversation.', 'گویندگان نیتیو کلماتی چون manifest (تبلور عینی ارزش‌ها) و promulgate (اشاعه و ترویج رسمی اندیشه) را به صورت طبیعی در مکالمه به کار می‌برند.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full'),
('40006000-0000-0000-0001-003000000003', '40006000-0000-0000-0000-003000000002', 3, 'customer', 'Practicing sentence by sentence with clear pronunciation builds real conversational fluency.', 'تمرین جمله‌به‌جمله با تلفظ شفاف، تسلط و روانی واقعی در گفتار ایجاد می‌کند.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full'),
('40006000-0000-0000-0001-003000000004', '40006000-0000-0000-0000-003000000002', 4, 'clerk', 'Staying calm and consistent turns difficult phrases into everyday speech habits.', 'آرامش و استمرار در تمرین، عبارات دشوار را به عادت‌های گفتاری روزمره بدل می‌سازد.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full'),
('40006000-0000-0000-0001-003000000005', '40006000-0000-0000-0000-003000000002', 5, 'customer', 'Completing this unit brings us closer to full mastery of English vocabulary.', 'تکمیل این درس ما را به تسلط کامل بر دایره واژگان انگلیسی نزدیک‌تر می‌کند.', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full')
ON CONFLICT (id) DO NOTHING;

INSERT INTO podcasts (id, title, description_fa, level, kind, series_id, episode_no, audio_url, audio_status, is_active, duration_seconds, position, vocabulary, scene_id)
VALUES ('40006000-0000-0000-0000-003000000003', 'The Zenith of English Mastery (Book 6 - Unit 30)', 'روایت داستانی و آموزش واژگان یونیت 30 (اوج تسلط و روانی در انگلیسی) از کتاب 6 دوره ۴۰۰۰ واژه', 'proficient', 'lesson', '40000000-0006-0000-0000-000000000006', 30, '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'ready', TRUE, 360, 30, '[{"word": "manifest", "meaning_fa": "تبلور عینی ارزش‌ها"}, {"word": "promulgate", "meaning_fa": "اشاعه و ترویج رسمی اندیشه"}, {"word": "reverberate", "meaning_fa": "بازتاب گسترده در جامعه"}, {"word": "scrutinize", "meaning_fa": "بررسی موشکافانه و دقیق"}, {"word": "transcend", "meaning_fa": "فراتر رفتن از محدودیت‌ها"}, {"word": "unravel", "meaning_fa": "گشودن گره‌های پیچیده"}, {"word": "venerate", "meaning_fa": "ارج نهادن و پاسداشت مقام"}, {"word": "warrant", "meaning_fa": "تضمین و توجیه شایسته"}, {"word": "crystallize", "meaning_fa": "تبلور شفاف دیدگاه"}, {"word": "culminate", "meaning_fa": "به اوج تکامل رسیدن"}, {"word": "amalgamate", "meaning_fa": "ادغام و یکپارچه‌سازی متعالی"}, {"word": "bolster", "meaning_fa": "تقویت بنیادین ارکان"}, {"word": "circumscribe", "meaning_fa": "تعیین دقیق حدود و ثغور"}, {"word": "delineate", "meaning_fa": "تبیین موشکافانه ابعاد"}, {"word": "elucidate", "meaning_fa": "روشنگری عمیق مفهومی"}, {"word": "foster", "meaning_fa": "پرورش نظام‌مند استعدادها"}, {"word": "galvanize", "meaning_fa": "برانگیختن انگیزه فراگیر"}, {"word": "herald", "meaning_fa": "بشارت‌دهنده افق‌های نوین"}, {"word": "instigate", "meaning_fa": "آغازگری تحولات ساختاری"}, {"word": "juxtapose", "meaning_fa": "هم‌نشینی و مقایسه تطبیقی"}]'::jsonb, '40006000-0000-0000-0000-003000000001')
ON CONFLICT (id) DO UPDATE SET scene_id = EXCLUDED.scene_id, vocabulary = EXCLUDED.vocabulary;

INSERT INTO podcast_lines (podcast_id, position, speaker, text, translation_fa, start_ms, end_ms)
VALUES
('40006000-0000-0000-0000-003000000003', 0, 'Alex', 'Welcome to 4000 Essential English Words, Book 6, Unit 30: The Zenith of English Mastery.', 'به درس 30 از کتاب 6 دوره ۴۰۰۰ واژه خوش آمدید: اوج تسلط و روانی در انگلیسی.', 0, 6000),
('40006000-0000-0000-0000-003000000003', 1, 'Sarah', 'Today we focus on 20 high-frequency vocabulary words used in real-life contexts.', 'امروز بر روی 20 واژه پرکاربرد در موقعیت‌های واقعی تمرکز می‌کنیم.', 6300, 13500),
('40006000-0000-0000-0000-003000000003', 2, 'Alex', 'Listen closely to the natural rhythm and pronunciation of each target phrase.', 'به ریتم طبیعی و تلفظ دقیق هر عبارت هدف خوب گوش فرا دهید.', 13800, 21000),
('40006000-0000-0000-0000-003000000003', 3, 'Sarah', 'Now head over to the shadowing section to record these sentences in your own voice!', 'حالا به بخش شادوئینگ بروید تا این جملات را با صدای خودتان تمرین و ضبط کنید!', 21400, 29000)
ON CONFLICT DO NOTHING;

-- +migrate Down
DELETE FROM podcast_lines WHERE podcast_id LIKE '40006000-0000-0000-0000-%';
DELETE FROM podcasts WHERE id LIKE '40006000-0000-0000-0000-%';
DELETE FROM dialogues WHERE hotspot_id LIKE '40006000-0000-0000-0000-%';
DELETE FROM hotspots WHERE id LIKE '40006000-0000-0000-0000-%';
DELETE FROM scenes WHERE id LIKE '40006000-0000-0000-0000-%';
