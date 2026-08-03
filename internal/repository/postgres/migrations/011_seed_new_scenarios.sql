-- +migrate Up

-- ============================================
-- 1. Scene: Clothes Shopping (خرید لباس)
-- ============================================
INSERT INTO scenes (id, title, description, background_image_url, difficulty, status, "order")
VALUES (
  '770e8400-e29b-41d4-a716-446655440000',
  'Clothes Shopping',
  'Practice buying clothes, asking about sizes, materials, prices, and restocking.',
  'http://localhost:8088/uploads/clothes_shopping.png',
  'beginner',
  'published',
  3
) ON CONFLICT (id) DO NOTHING;

INSERT INTO hotspots (id, scene_id, name, x_position, y_position, order_index)
VALUES 
('770e8400-e29b-41d4-a716-446655440001', '770e8400-e29b-41d4-a716-446655440000', 'Racks & Displays', 45.0, 55.0, 1),
('770e8400-e29b-41d4-a716-446655440002', '770e8400-e29b-41d4-a716-446655440000', 'Fitting Room & Counter', 78.0, 50.0, 2)
ON CONFLICT (id) DO NOTHING;

INSERT INTO dialogues (id, hotspot_id, "order", speaker, original_text, translation, audio_url, display_type, partial_hint, wait_duration)
VALUES
('770e8400-e29b-41d4-a716-446655440101', '770e8400-e29b-41d4-a716-446655440001', 1, 'customer', 'Hi, how much is this jacket?', 'سلام، این کاپشن چند است؟', '/uploads/cafe/c1.mp3', 'full', '', 5),
('770e8400-e29b-41d4-a716-446655440102', '770e8400-e29b-41d4-a716-446655440001', 2, 'clerk', 'It''s ninety dollars.', 'نود دلار است.', '/uploads/cafe/c2.mp3', 'full', '', 5),
('770e8400-e29b-41d4-a716-446655440103', '770e8400-e29b-41d4-a716-446655440001', 3, 'customer', 'Oh, that''s too expensive! Do you have any discount?', 'اوه، خیلی گرونه! تخفیف دارید؟', '/uploads/cafe/c3.mp3', 'full', '', 5),
('770e8400-e29b-41d4-a716-446655440104', '770e8400-e29b-41d4-a716-446655440001', 4, 'clerk', 'What size and material is this shirt?', 'سایز و جنس این پیراهن چیست؟', '/uploads/cafe/c4.mp3', 'full', '', 5),
('770e8400-e29b-41d4-a716-446655440105', '770e8400-e29b-41d4-a716-446655440001', 5, 'clerk', 'It''s medium size and 100% cotton.', 'سایز متوسط و ۱۰۰٪ پنبه است.', '/uploads/cafe/c5.mp3', 'full', '', 5),
('770e8400-e29b-41d4-a716-446655440201', '770e8400-e29b-41d4-a716-446655440002', 1, 'clerk', 'Is it too tight, just right, or too loose on you?', 'برات تنگه، اندازه‌ست یا گشاد؟', '/uploads/cafe/p1.mp3', 'full', '', 5),
('770e8400-e29b-41d4-a716-446655440202', '770e8400-e29b-41d4-a716-446655440002', 2, 'customer', 'It feels a bit tight around the shoulders.', 'دور شانه‌ها کمی تنگ است.', '/uploads/cafe/p2.mp3', 'full', '', 5),
('770e8400-e29b-41d4-a716-446655440203', '770e8400-e29b-41d4-a716-446655440002', 3, 'customer', 'Do you have a large size in stock?', 'سایز بزرگ‌تر موجود دارید؟', '/uploads/cafe/p3.mp3', 'full', '', 5),
('770e8400-e29b-41d4-a716-446655440204', '770e8400-e29b-41d4-a716-446655440002', 4, 'clerk', 'We are currently out of stock for size large.', 'در حال حاضر سایز بزرگ موجود نیست.', '/uploads/cafe/p4.mp3', 'full', '', 5),
('770e8400-e29b-41d4-a716-446655440205', '770e8400-e29b-41d4-a716-446655440002', 5, 'customer', 'When will you restock size large?', 'کی سایز بزرگ را موجود می‌کنید؟', '/uploads/cafe/c6.mp3', 'full', '', 5)
ON CONFLICT (id) DO NOTHING;

UPDATE dialogues SET words = '[{"word":"expensive","meaning":"گران"},{"word":"discount","meaning":"تخفیف"}]' WHERE id = '770e8400-e29b-41d4-a716-446655440103';
UPDATE dialogues SET words = '[{"word":"size","meaning":"سایز"},{"word":"material","meaning":"جنس، پارچه"}]' WHERE id = '770e8400-e29b-41d4-a716-446655440104';
UPDATE dialogues SET words = '[{"word":"tight","meaning":"تنگ"},{"word":"loose","meaning":"گشاد"}]' WHERE id = '770e8400-e29b-41d4-a716-446655440201';
UPDATE dialogues SET words = '[{"word":"restock","meaning":"موجود کردن مجدد"}]' WHERE id = '770e8400-e29b-41d4-a716-446655440205';

-- ============================================
-- 2. Scene: Hotel Booking & Stay (اقامت در هتل)
-- ============================================
INSERT INTO scenes (id, title, description, background_image_url, difficulty, status, "order")
VALUES (
  '880e8400-e29b-41d4-a716-446655440000',
  'Hotel Booking & Stay',
  'Practice checking in, asking for room views, amenities, and buffet hours.',
  'http://localhost:8088/uploads/hotel_reception.png',
  'intermediate',
  'published',
  4
) ON CONFLICT (id) DO NOTHING;

INSERT INTO hotspots (id, scene_id, name, x_position, y_position, order_index)
VALUES 
('880e8400-e29b-41d4-a716-446655440001', '880e8400-e29b-41d4-a716-446655440000', 'Reception Desk', 25.0, 65.0, 1),
('880e8400-e29b-41d4-a716-446655440002', '880e8400-e29b-41d4-a716-446655440000', 'Concierge & Information', 82.0, 65.0, 2)
ON CONFLICT (id) DO NOTHING;

INSERT INTO dialogues (id, hotspot_id, "order", speaker, original_text, translation, audio_url, display_type, partial_hint, wait_duration)
VALUES
('880e8400-e29b-41d4-a716-446655440101', '880e8400-e29b-41d4-a716-446655440001', 1, 'customer', 'Hello, I had previously reserved a room.', 'سلام، من قبلاً اتاق رزرو کرده بودم.', '/uploads/cafe/c1.mp3', 'full', '', 5),
('880e8400-e29b-41d4-a716-446655440102', '880e8400-e29b-41d4-a716-446655440001', 2, 'receptionist', 'Welcome! Let me check your booking details.', 'خوش آمدید! اجازه دهید جزئیات رزرو را بررسی کنم.', '/uploads/cafe/c2.mp3', 'full', '', 5),
('880e8400-e29b-41d4-a716-446655440103', '880e8400-e29b-41d4-a716-446655440001', 3, 'customer', 'How much is it per night?', 'شبی چند هست؟', '/uploads/cafe/c3.mp3', 'full', '', 5),
('880e8400-e29b-41d4-a716-446655440104', '880e8400-e29b-41d4-a716-446655440001', 4, 'receptionist', 'It is one hundred and twenty dollars per night.', 'شبی یکصد و بیست دلار است.', '/uploads/cafe/c4.mp3', 'full', '', 5),
('880e8400-e29b-41d4-a716-446655440105', '880e8400-e29b-41d4-a716-446655440001', 5, 'customer', 'What amenities does it have?', 'چه امکاناتی داره؟', '/uploads/cafe/c5.mp3', 'full', '', 5),
('880e8400-e29b-41d4-a716-446655440201', '880e8400-e29b-41d4-a716-446655440002', 1, 'receptionist', 'It has free Wi-Fi, TV, mini-bar, and room service.', 'دارای وای‌فای رایگان، تلویزیون، مینی‌بار و روم سرویس است.', '/uploads/cafe/p1.mp3', 'full', '', 5),
('880e8400-e29b-41d4-a716-446655440202', '880e8400-e29b-41d4-a716-446655440002', 2, 'customer', 'Do you have a room with a mountain, sea, or forest view?', 'اتاق رو به کوه یا دریا یا جنگل دارین؟', '/uploads/cafe/p2.mp3', 'full', '', 5),
('880e8400-e29b-41d4-a716-446655440203', '880e8400-e29b-41d4-a716-446655440002', 3, 'receptionist', 'Yes, we have a sea view room available.', 'بله، اتاق رو به دریا موجود داریم.', '/uploads/cafe/p3.mp3', 'full', '', 5),
('880e8400-e29b-41d4-a716-446655440204', '880e8400-e29b-41d4-a716-446655440002', 4, 'customer', 'Until when is the buffet open?', 'بوفه تا کی بازه؟', '/uploads/cafe/p4.mp3', 'full', '', 5),
('880e8400-e29b-41d4-a716-446655440205', '880e8400-e29b-41d4-a716-446655440002', 5, 'receptionist', 'The breakfast buffet is open until 10:30 AM.', 'بوفه صبحانه تا ساعت ۱۰:۳۰ صبح باز است.', '/uploads/cafe/c7.mp3', 'full', '', 5)
ON CONFLICT (id) DO NOTHING;

UPDATE dialogues SET words = '[{"word":"reserved","meaning":"رزرو شده"},{"word":"previously","meaning":"قبلاً"}]' WHERE id = '880e8400-e29b-41d4-a716-446655440101';
UPDATE dialogues SET words = '[{"word":"amenities","meaning":"امکانات، تسهیلات"}]' WHERE id = '880e8400-e29b-41d4-a716-446655440105';
UPDATE dialogues SET words = '[{"word":"view","meaning":"منظره، نما"},{"word":"mountain","meaning":"کوه"},{"word":"sea","meaning":"دریا"}]' WHERE id = '880e8400-e29b-41d4-a716-446655440202';
UPDATE dialogues SET words = '[{"word":"buffet","meaning":"بوفه غذا"}]' WHERE id = '880e8400-e29b-41d4-a716-446655440204';

-- ============================================
-- 3. Scene: Driving Lesson (آموزش رانندگی)
-- ============================================
INSERT INTO scenes (id, title, description, background_image_url, difficulty, status, "order")
VALUES (
  '990e8400-e29b-41d4-a716-446655440000',
  'Driving Lesson',
  'Practice driving instructions, traffic lights, speed limits, and road signals.',
  'http://localhost:8088/uploads/driving_lesson.png',
  'intermediate',
  'published',
  5
) ON CONFLICT (id) DO NOTHING;

INSERT INTO hotspots (id, scene_id, name, x_position, y_position, order_index)
VALUES 
('990e8400-e29b-41d4-a716-446655440001', '990e8400-e29b-41d4-a716-446655440000', 'Driver Controls', 25.0, 70.0, 1),
('990e8400-e29b-41d4-a716-446655440002', '990e8400-e29b-41d4-a716-446655440000', 'Road Signals', 70.0, 35.0, 2)
ON CONFLICT (id) DO NOTHING;

INSERT INTO dialogues (id, hotspot_id, "order", speaker, original_text, translation, audio_url, display_type, partial_hint, wait_duration)
VALUES
('990e8400-e29b-41d4-a716-446655440101', '990e8400-e29b-41d4-a716-446655440001', 1, 'instructor', 'Don''t run the red light!', 'از چراغ قرمز رد نشو!', '/uploads/cafe/c1.mp3', 'full', '', 5),
('990e8400-e29b-41d4-a716-446655440102', '990e8400-e29b-41d4-a716-446655440001', 2, 'student', 'Sorry instructor, I will stop right away.', 'ببخشید مربی، سریعاً متوقف می‌شوم.', '/uploads/cafe/c2.mp3', 'full', '', 5),
('990e8400-e29b-41d4-a716-446655440103', '990e8400-e29b-41d4-a716-446655440001', 3, 'instructor', 'Keep the speed limit!', 'حد مجاز سرعت را رعایت کن!', '/uploads/cafe/c3.mp3', 'full', '', 5),
('990e8400-e29b-41d4-a716-446655440104', '990e8400-e29b-41d4-a716-446655440001', 4, 'instructor', 'Use your turn signal before turning.', 'راهنما بزن!', '/uploads/cafe/c4.mp3', 'full', '', 5),
('990e8400-e29b-41d4-a716-446655440105', '990e8400-e29b-41d4-a716-446655440001', 5, 'student', 'Got it, turning on indicator now.', 'متوجه شدم، راهنما زدم.', '/uploads/cafe/c5.mp3', 'full', '', 5),
('990e8400-e29b-41d4-a716-446655440201', '990e8400-e29b-41d4-a716-446655440002', 1, 'instructor', 'Don''t honk near the hospital!', 'نزدیک بیمارستان بوق نزن!', '/uploads/cafe/p1.mp3', 'full', '', 5),
('990e8400-e29b-41d4-a716-446655440202', '990e8400-e29b-41d4-a716-446655440002', 2, 'instructor', 'Slow down when you reach a speed bump.', 'وقتی به سرعت‌گیر می‌رسی سرعت را کاهش بده.', '/uploads/cafe/p2.mp3', 'full', '', 5),
('990e8400-e29b-41d4-a716-446655440203', '990e8400-e29b-41d4-a716-446655440002', 3, 'student', 'Understood, applying brakes gently.', 'چشم، آروم ترمز می‌گیرم.', '/uploads/cafe/p3.mp3', 'full', '', 5),
('990e8400-e29b-41d4-a716-446655440204', '990e8400-e29b-41d4-a716-446655440002', 4, 'instructor', 'Always check your rearview mirror.', 'همیشه آینه وسط را چک کن.', '/uploads/cafe/p4.mp3', 'full', '', 5),
('990e8400-e29b-41d4-a716-446655440205', '990e8400-e29b-41d4-a716-446655440002', 5, 'instructor', 'Very good control and smooth driving!', 'کنترل بسیار خوب و رانندگی نرم!', '/uploads/cafe/c8.mp3', 'full', '', 5)
ON CONFLICT (id) DO NOTHING;

UPDATE dialogues SET words = '[{"word":"signal","meaning":"راهنما، اشاره"},{"word":"turn","meaning":"پیچیدن"}]' WHERE id = '990e8400-e29b-41d4-a716-446655440104';
UPDATE dialogues SET words = '[{"word":"honk","meaning":"بوق زدن"},{"word":"hospital","meaning":"بیمارستان"}]' WHERE id = '990e8400-e29b-41d4-a716-446655440201';
UPDATE dialogues SET words = '[{"word":"speed bump","meaning":"سرعت‌گیر"},{"word":"slow down","meaning":"کاهش سرعت"}]' WHERE id = '990e8400-e29b-41d4-a716-446655440202';

-- ============================================
-- 4. Scene: Weight Loss Consultation (کاهش وزن)
-- ============================================
INSERT INTO scenes (id, title, description, background_image_url, difficulty, status, "order")
VALUES (
  'aa0e8400-e29b-41d4-a716-446655440000',
  'Weight Loss Consultation',
  'Practice talking to a nutritionist about dieting, exercise, sweets, and healthy habits.',
  'http://localhost:8088/uploads/weight_loss.png',
  'beginner',
  'published',
  6
) ON CONFLICT (id) DO NOTHING;

INSERT INTO hotspots (id, scene_id, name, x_position, y_position, order_index)
VALUES 
('aa0e8400-e29b-41d4-a716-446655440001', 'aa0e8400-e29b-41d4-a716-446655440000', 'Consultation Table', 55.0, 55.0, 1),
('aa0e8400-e29b-41d4-a716-446655440002', 'aa0e8400-e29b-41d4-a716-446655440000', 'Scale & Wellness Plan', 18.0, 65.0, 2)
ON CONFLICT (id) DO NOTHING;

INSERT INTO dialogues (id, hotspot_id, "order", speaker, original_text, translation, audio_url, display_type, partial_hint, wait_duration)
VALUES
('aa0e8400-e29b-41d4-a716-446655440101', 'aa0e8400-e29b-41d4-a716-446655440001', 1, 'patient', 'Doctor, I want to lose weight.', 'می‌خوام وزنم را کم کنم.', '/uploads/cafe/c1.mp3', 'full', '', 5),
('aa0e8400-e29b-41d4-a716-446655440102', 'aa0e8400-e29b-41d4-a716-446655440001', 2, 'doctor', 'First rule: don''t eat fast food.', 'فست‌فود نخور.', '/uploads/cafe/c2.mp3', 'full', '', 5),
('aa0e8400-e29b-41d4-a716-446655440103', 'aa0e8400-e29b-41d4-a716-446655440001', 3, 'doctor', 'Also, don''t eat sweets.', 'شیرینی نخور.', '/uploads/cafe/c3.mp3', 'full', '', 5),
('aa0e8400-e29b-41d4-a716-446655440104', 'aa0e8400-e29b-41d4-a716-446655440001', 4, 'doctor', 'Make sure to exercise regularly.', 'ورزش کن.', '/uploads/cafe/c4.mp3', 'full', '', 5),
('aa0e8400-e29b-41d4-a716-446655440105', 'aa0e8400-e29b-41d4-a716-446655440001', 5, 'patient', 'I can''t stop eating sweets, I love them too much!', 'من نمیتونم شیرینی نخورم، خیلی دوست دارم!', '/uploads/cafe/c5.mp3', 'full', '', 5),
('aa0e8400-e29b-41d4-a716-446655440201', 'aa0e8400-e29b-41d4-a716-446655440002', 1, 'doctor', 'If you want to lose weight, you must moderate your sweets intake.', 'اگه میخای وزن کم کنی باید رعایت کنی در مصرف شیرینی.', '/uploads/cafe/p1.mp3', 'full', '', 5),
('aa0e8400-e29b-41d4-a716-446655440202', 'aa0e8400-e29b-41d4-a716-446655440002', 2, 'patient', 'Can I eat dark chocolate instead?', 'میتونم به جاش شکلات تلخ بخورم؟', '/uploads/cafe/p2.mp3', 'full', '', 5),
('aa0e8400-e29b-41d4-a716-446655440203', 'aa0e8400-e29b-41d4-a716-446655440002', 3, 'doctor', 'Yes, a small piece of dark chocolate is fine.', 'بله، یک تکه کوچک شکلات تلخ ایرادی ندارد.', '/uploads/cafe/p3.mp3', 'full', '', 5),
('aa0e8400-e29b-41d4-a716-446655440204', 'aa0e8400-e29b-41d4-a716-446655440002', 4, 'doctor', 'Drink plenty of water every day.', 'هر روز مقدار زیادی آب بنوش.', '/uploads/cafe/p4.mp3', 'full', '', 5),
('aa0e8400-e29b-41d4-a716-446655440205', 'aa0e8400-e29b-41d4-a716-446655440002', 5, 'patient', 'Thank you doctor, I will follow your plan!', 'ممنونم دکتر، رژیم شما را دنبال خواهم کرد!', '/uploads/cafe/c6.mp3', 'full', '', 5)
ON CONFLICT (id) DO NOTHING;

UPDATE dialogues SET words = '[{"word":"lose weight","meaning":"کاهش وزن"},{"word":"sweets","meaning":"شیرینی‌جات"}]' WHERE id = 'aa0e8400-e29b-41d4-a716-446655440101';
UPDATE dialogues SET words = '[{"word":"exercise","meaning":"ورزش کردن"},{"word":"regularly","meaning":"به‌طور منظم"}]' WHERE id = 'aa0e8400-e29b-41d4-a716-446655440104';
UPDATE dialogues SET words = '[{"word":"moderate","meaning":"رعایت کردن، اعتدال"},{"word":"intake","meaning":"مصرف"}]' WHERE id = 'aa0e8400-e29b-41d4-a716-446655440201';

-- +migrate Down
DELETE FROM dialogues WHERE hotspot_id IN (
  '770e8400-e29b-41d4-a716-446655440001', '770e8400-e29b-41d4-a716-446655440002',
  '880e8400-e29b-41d4-a716-446655440001', '880e8400-e29b-41d4-a716-446655440002',
  '990e8400-e29b-41d4-a716-446655440001', '990e8400-e29b-41d4-a716-446655440002',
  'aa0e8400-e29b-41d4-a716-446655440001', 'aa0e8400-e29b-41d4-a716-446655440002'
);
DELETE FROM hotspots WHERE scene_id IN (
  '770e8400-e29b-41d4-a716-446655440000',
  '880e8400-e29b-41d4-a716-446655440000',
  '990e8400-e29b-41d4-a716-446655440000',
  'aa0e8400-e29b-41d4-a716-446655440000'
);
DELETE FROM scenes WHERE id IN (
  '770e8400-e29b-41d4-a716-446655440000',
  '880e8400-e29b-41d4-a716-446655440000',
  '990e8400-e29b-41d4-a716-446655440000',
  'aa0e8400-e29b-41d4-a716-446655440000'
);
