-- internal/repository/postgres/migrations/087_add_custom_scenes_user_id.sql
-- +migrate Up

ALTER TABLE scenes ADD COLUMN IF NOT EXISTS created_by_user_id UUID REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE scenes ADD COLUMN IF NOT EXISTS is_custom BOOLEAN DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_scenes_created_by_user_id ON scenes(created_by_user_id);
CREATE INDEX IF NOT EXISTS idx_scenes_is_custom ON scenes(is_custom);

-- +migrate Down

DROP INDEX IF EXISTS idx_scenes_is_custom;
DROP INDEX IF EXISTS idx_scenes_created_by_user_id;

ALTER TABLE scenes DROP COLUMN IF EXISTS is_custom;
ALTER TABLE scenes DROP COLUMN IF EXISTS created_by_user_id;

