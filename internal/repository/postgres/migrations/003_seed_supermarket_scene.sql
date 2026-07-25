-- +migrate Up

-- Scene: Supermarket Shopping
INSERT INTO scenes (id, title, description, background_image_url, difficulty, status, "order")
VALUES (
  '550e8400-e29b-41d4-a716-446655440000',
  'Supermarket Shopping',
  'Practice real conversations in a supermarket setting',
  'https://images.unsplash.com/photo-1542838132-92c53300491e?q=80&w=1000&auto=format&fit=crop',
  'beginner',
  'published',
  1
)
ON CONFLICT (id) DO NOTHING;

-- Hotspot 1: Canned Food Shelf
INSERT INTO hotspots (id, scene_id, name, x_position, y_position, order_index)
VALUES (
  '550e8400-e29b-41d4-a716-446655440001',
  '550e8400-e29b-41d4-a716-446655440000',
  'Canned Food Shelf',
  68.0,
  42.0,
  1
)
ON CONFLICT (id) DO NOTHING;

-- Hotspot 2: Cashier
INSERT INTO hotspots (id, scene_id, name, x_position, y_position, order_index)
VALUES (
  '550e8400-e29b-41d4-a716-446655440002',
  '550e8400-e29b-41d4-a716-446655440000',
  'Cashier',
  82.0,
  72.0,
  2
)
ON CONFLICT (id) DO NOTHING;

-- Dialogues for Hotspot 1: Canned Food Shelf
INSERT INTO dialogues (id, hotspot_id, "order", speaker, original_text, translation, audio_url, display_type, partial_hint, wait_duration)
VALUES
('550e8400-e29b-41d4-a716-446655440010', '550e8400-e29b-41d4-a716-446655440001', 1, 'customer', 'Excuse me, how much is this can of tuna?', 'ببخشید، این کنسرو تن ماهی چند است؟', 'https://voca.ro/1ixdmPCkCGOi', 'full', NULL, 5),
('550e8400-e29b-41d4-a716-446655440011', '550e8400-e29b-41d4-a716-446655440001', 2, 'clerk', 'It''s three dollars and fifty cents.', 'سه دلار و پنجاه سنت است.', 'https://voca.ro/1ixdmPCkCGOi', 'full', NULL, 5),
('550e8400-e29b-41d4-a716-446655440012', '550e8400-e29b-41d4-a716-446655440001', 3, 'customer', 'And how much is that one?', 'و آن یکی چند است؟', 'https://voca.ro/1ixdmPCkCGOi', 'full', NULL, 5),
('550e8400-e29b-41d4-a716-446655440013', '550e8400-e29b-41d4-a716-446655440001', 4, 'clerk', 'That one is five dollars.', 'آن یکی پنج دلار است.', 'https://voca.ro/1ixdmPCkCGOi', 'full', NULL, 5),
('550e8400-e29b-41d4-a716-446655440014', '550e8400-e29b-41d4-a716-446655440001', 5, 'customer', 'That''s a bit expensive.', 'کمی گران است.', 'https://voca.ro/1ixdmPCkCGOi', 'full', NULL, 5),
('550e8400-e29b-41d4-a716-446655440015', '550e8400-e29b-41d4-a716-446655440001', 6, 'clerk', 'This brand is cheaper.', 'این برند ارزان‌تر است.', 'https://voca.ro/1ixdmPCkCGOi', 'full', NULL, 5),
('550e8400-e29b-41d4-a716-446655440016', '550e8400-e29b-41d4-a716-446655440001', 7, 'customer', 'Can I pay by card?', 'می‌توانم با کارت پرداخت کنم؟', 'audio/d7.mp3', 'full', NULL, 5),
('550e8400-e29b-41d4-a716-446655440017', '550e8400-e29b-41d4-a716-446655440001', 8, 'clerk', 'Yes, card or cash is fine.', 'بله، کارت یا نقدی فرقی ندارد.', 'https://voca.ro/1ixdmPCkCGOi', 'full', NULL, 5)
ON CONFLICT (id) DO NOTHING;

-- Dialogues for Hotspot 2: Cashier
INSERT INTO dialogues (id, hotspot_id, "order", speaker, original_text, translation, audio_url, display_type, partial_hint, wait_duration)
VALUES
('550e8400-e29b-41d4-a716-446655440020', '550e8400-e29b-41d4-a716-446655440002', 1, 'clerk', 'Did you find everything you needed?', 'همه چیزهایی که لازم داشتید پیدا کردید؟', 'https://voca.ro/1ixdmPCkCGOi', 'full', NULL, 5),
('550e8400-e29b-41d4-a716-446655440021', '550e8400-e29b-41d4-a716-446655440002', 2, 'customer', 'Yes, thank you.', 'بله، ممنون.', 'https://voca.ro/1ixdmPCkCGOi', 'full', NULL, 5)
ON CONFLICT (id) DO NOTHING;

-- +migrate Down
DELETE FROM dialogues WHERE hotspot_id IN ('550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440002');
DELETE FROM hotspots WHERE scene_id = '550e8400-e29b-41d4-a716-446655440000';
DELETE FROM scenes WHERE id = '550e8400-e29b-41d4-a716-446655440000';
