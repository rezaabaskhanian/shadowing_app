-- +migrate Up

DELETE FROM dialogues WHERE hotspot_id IN (
  SELECT id FROM hotspots WHERE scene_id IN (
    '550e8400-e29b-41d4-a716-446655440000',
    '660e8400-e29b-41d4-a716-446655440000'
  )
);

DELETE FROM hotspots WHERE scene_id IN (
  '550e8400-e29b-41d4-a716-446655440000',
  '660e8400-e29b-41d4-a716-446655440000'
);

DELETE FROM scenes WHERE id IN (
  '550e8400-e29b-41d4-a716-446655440000',
  '660e8400-e29b-41d4-a716-446655440000'
);

-- +migrate Down
-- No restore needed
