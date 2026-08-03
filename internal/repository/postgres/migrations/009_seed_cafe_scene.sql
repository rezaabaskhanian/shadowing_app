-- +migrate Up

-- Scene: Coffee Shop
INSERT INTO scenes (id, title, description, background_image_url, difficulty, status, "order")
VALUES (
  '660e8400-e29b-41d4-a716-446655440000',
  'At the Coffee Shop',
  'Practice ordering coffee and small talk at a cafe',
  'https://images.unsplash.com/photo-1554118811-1e0d58224f24?q=80&w=1000&auto=format&fit=crop',
  'beginner',
  'published',
  2
)
ON CONFLICT (id) DO NOTHING;

-- Hotspot 1: Counter (ordering)
INSERT INTO hotspots (id, scene_id, name, x_position, y_position, order_index)
VALUES (
  '660e8400-e29b-41d4-a716-446655440001',
  '660e8400-e29b-41d4-a716-446655440000',
  'Counter',
  32.0, 55.0, 1
) ON CONFLICT (id) DO NOTHING;

-- Hotspot 2: Pickup (receiving order)
INSERT INTO hotspots (id, scene_id, name, x_position, y_position, order_index)
VALUES (
  '660e8400-e29b-41d4-a716-446655440002',
  '660e8400-e29b-41d4-a716-446655440000',
  'Pickup Counter',
  72.0, 48.0, 2
) ON CONFLICT (id) DO NOTHING;

-- Dialogues for Hotspot 1: Counter
INSERT INTO dialogues (id, hotspot_id, "order", speaker, original_text, translation, audio_url, display_type, partial_hint, wait_duration)
VALUES
('660e8400-e29b-41d4-a716-446655440101', '660e8400-e29b-41d4-a716-446655440001', 1, 'customer', 'Hi, could I get a cappuccino, please?', 'سلام، می‌تونم یه کاپوچینو بگیرم لطفاً؟', '/uploads/cafe/c1.mp3', 'full', '', 5),
('660e8400-e29b-41d4-a716-446655440102', '660e8400-e29b-41d4-a716-446655440001', 2, 'clerk', 'Of course. What size would you like?', 'البته. چه سایزی می‌خواید؟', '/uploads/cafe/c2.mp3', 'full', '', 5),
('660e8400-e29b-41d4-a716-446655440103', '660e8400-e29b-41d4-a716-446655440001', 3, 'customer', 'A medium, please.', 'متوسط، لطفاً.', '/uploads/cafe/c3.mp3', 'full', '', 5),
('660e8400-e29b-41d4-a716-446655440104', '660e8400-e29b-41d4-a716-446655440001', 4, 'clerk', 'Would you like anything to eat?', 'چیزی برای خوردن میل دارید؟', '/uploads/cafe/c4.mp3', 'full', '', 5),
('660e8400-e29b-41d4-a716-446655440105', '660e8400-e29b-41d4-a716-446655440001', 5, 'customer', 'Yes, a chocolate croissant.', 'بله، یه کروسان شکلاتی.', '/uploads/cafe/c5.mp3', 'full', '', 5),
('660e8400-e29b-41d4-a716-446655440106', '660e8400-e29b-41d4-a716-446655440001', 6, 'clerk', 'Great. That will be six dollars and fifty cents.', 'عالیه. می‌شه شش دلار و پنجاه سنت.', '/uploads/cafe/c6.mp3', 'full', '', 5),
('660e8400-e29b-41d4-a716-446655440107', '660e8400-e29b-41d4-a716-446655440001', 7, 'customer', 'Here you go. Can I pay by card?', 'بفرمایید. می‌تونم با کارت پرداخت کنم؟', '/uploads/cafe/c7.mp3', 'full', '', 5),
('660e8400-e29b-41d4-a716-446655440108', '660e8400-e29b-41d4-a716-446655440001', 8, 'clerk', 'Yes, card is fine. Thank you.', 'بله، کارت مشکلی نداره. ممنون.', '/uploads/cafe/c8.mp3', 'full', '', 5)
ON CONFLICT (id) DO NOTHING;

-- Dialogues for Hotspot 2: Pickup
INSERT INTO dialogues (id, hotspot_id, "order", speaker, original_text, translation, audio_url, display_type, partial_hint, wait_duration)
VALUES
('660e8400-e29b-41d4-a716-446655440201', '660e8400-e29b-41d4-a716-446655440002', 1, 'clerk', 'Here''s your cappuccino and croissant.', 'این هم کاپوچینو و کروسان شما.', '/uploads/cafe/p1.mp3', 'full', '', 5),
('660e8400-e29b-41d4-a716-446655440202', '660e8400-e29b-41d4-a716-446655440002', 2, 'customer', 'Thank you. It smells wonderful.', 'ممنون. بوی فوق‌العاده‌ای داره.', '/uploads/cafe/p2.mp3', 'full', '', 5),
('660e8400-e29b-41d4-a716-446655440203', '660e8400-e29b-41d4-a716-446655440002', 3, 'clerk', 'Enjoy your coffee!', 'نوش جان! از قهوه‌تون لذت ببرید.', '/uploads/cafe/p3.mp3', 'full', '', 5),
('660e8400-e29b-41d4-a716-446655440204', '660e8400-e29b-41d4-a716-446655440002', 4, 'customer', 'I will. Have a nice day!', 'حتماً. روز خوبی داشته باشید!', '/uploads/cafe/p4.mp3', 'full', '', 5)
ON CONFLICT (id) DO NOTHING;

-- Words for Cafe dialogues
UPDATE dialogues SET words = '[{"word":"cappuccino","meaning":"کاپوچینو"},{"word":"please","meaning":"لطفاً"},{"word":"could","meaning":"می‌توانم (فعل کمکی)"}]' WHERE id = '660e8400-e29b-41d4-a716-446655440101';
UPDATE dialogues SET words = '[{"word":"size","meaning":"اندازه، سایز"},{"word":"course","meaning":"البته (of course)"}]' WHERE id = '660e8400-e29b-41d4-a716-446655440102';
UPDATE dialogues SET words = '[{"word":"medium","meaning":"متوسط"}]' WHERE id = '660e8400-e29b-41d4-a716-446655440103';
UPDATE dialogues SET words = '[{"word":"anything","meaning":"هر چیزی"},{"word":"eat","meaning":"خوردن"}]' WHERE id = '660e8400-e29b-41d4-a716-446655440104';
UPDATE dialogues SET words = '[{"word":"chocolate","meaning":"شکلاتی"},{"word":"croissant","meaning":"کروسان"}]' WHERE id = '660e8400-e29b-41d4-a716-446655440105';
UPDATE dialogues SET words = '[{"word":"dollars","meaning":"دلار"},{"word":"cents","meaning":"سنت"}]' WHERE id = '660e8400-e29b-41d4-a716-446655440106';
UPDATE dialogues SET words = '[{"word":"pay","meaning":"پرداخت کردن"},{"word":"card","meaning":"کارت بانکی"}]' WHERE id = '660e8400-e29b-41d4-a716-446655440107';
UPDATE dialogues SET words = '[{"word":"card","meaning":"کارت بانکی"},{"word":"fine","meaning":"خوب، مشکلی نیست"}]' WHERE id = '660e8400-e29b-41d4-a716-446655440108';
UPDATE dialogues SET words = '[{"word":"cappuccino","meaning":"کاپوچینو"},{"word":"croissant","meaning":"کروسان"}]' WHERE id = '660e8400-e29b-41d4-a716-446655440201';
UPDATE dialogues SET words = '[{"word":"smells","meaning":"بو می‌دهد"},{"word":"wonderful","meaning":"فوق‌العاده"}]' WHERE id = '660e8400-e29b-41d4-a716-446655440202';
UPDATE dialogues SET words = '[{"word":"enjoy","meaning":"لذت بردن"},{"word":"coffee","meaning":"قهوه"}]' WHERE id = '660e8400-e29b-41d4-a716-446655440203';
UPDATE dialogues SET words = '[{"word":"nice","meaning":"خوب، دلپذیر"},{"word":"day","meaning":"روز"}]' WHERE id = '660e8400-e29b-41d4-a716-446655440204';

-- +migrate Down
DELETE FROM dialogues WHERE hotspot_id IN ('660e8400-e29b-41d4-a716-446655440001', '660e8400-e29b-41d4-a716-446655440002');
DELETE FROM hotspots WHERE scene_id = '660e8400-e29b-41d4-a716-446655440000';
DELETE FROM scenes WHERE id = '660e8400-e29b-41d4-a716-446655440000';
