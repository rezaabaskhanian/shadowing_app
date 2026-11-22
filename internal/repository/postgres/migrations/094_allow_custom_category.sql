-- internal/repository/postgres/migrations/094_allow_custom_category.sql
-- +migrate Up

ALTER TABLE scenes DROP CONSTRAINT IF EXISTS scenes_category_check;
ALTER TABLE scenes ADD CONSTRAINT scenes_category_check
    CHECK (category IN ('migration', 'career', 'education', 'daily', 'travel', 'social', 'custom'));

-- +migrate Down

UPDATE scenes SET category = 'daily' WHERE category = 'custom';
ALTER TABLE scenes DROP CONSTRAINT IF EXISTS scenes_category_check;
ALTER TABLE scenes ADD CONSTRAINT scenes_category_check
    CHECK (category IN ('migration', 'career', 'education', 'daily', 'travel', 'social'));
