-- +migrate Up
-- تمرین نوشتن برای «قدم اول» (A1): تا حالا موضوع نوشتن از beginner شروع می‌شد و
-- کاربر starter در لیست نوشتن هیچ موضوعی نمی‌دید.
ALTER TABLE writing_prompts DROP CONSTRAINT IF EXISTS writing_prompts_level_check;
ALTER TABLE writing_prompts ADD CONSTRAINT writing_prompts_level_check
    CHECK (level IN ('starter', 'beginner', 'intermediate', 'advanced', 'proficient'));

-- +migrate Down
UPDATE writing_prompts SET level = 'beginner' WHERE level = 'starter';
ALTER TABLE writing_prompts DROP CONSTRAINT IF EXISTS writing_prompts_level_check;
ALTER TABLE writing_prompts ADD CONSTRAINT writing_prompts_level_check
    CHECK (level IN ('beginner', 'intermediate', 'advanced', 'proficient'));
