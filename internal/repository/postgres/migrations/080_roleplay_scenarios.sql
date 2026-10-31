-- +migrate Up
-- «نقش‌آفرینی»: موقعیت‌های زندگی واقعی (دکتر، بانک، تعمیرکار…) که کاربر با یک
-- شخصیت AI تمرین می‌کند. همان موتورِ ai_conversations است، فقط موضوعِ گفتگو به‌جای
-- صحنه از این جدول می‌آید.
-- ai_role: نقشِ AI به انگلیسی (برای پرامپت). goals_fa: کارهایی که کاربر باید در
-- گفتگو انجام دهد. key_phrases: [{"en": "...", "fa": "..."}] جمله‌های کلیدی که اپ
-- نشان می‌دهد و در پایان می‌شمارد کدام را گفته. podcast_id: پادکستِ همان موقعیت.
CREATE TABLE IF NOT EXISTS roleplay_scenarios (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title        TEXT NOT NULL,
    title_fa     TEXT NOT NULL DEFAULT '',
    situation_fa TEXT NOT NULL DEFAULT '',
    ai_role      TEXT NOT NULL DEFAULT '',
    user_role_fa TEXT NOT NULL DEFAULT '',
    goals_fa     JSONB NOT NULL DEFAULT '[]'::jsonb,
    key_phrases  JSONB NOT NULL DEFAULT '[]'::jsonb,
    category     TEXT NOT NULL DEFAULT 'daily',
    level        TEXT NOT NULL DEFAULT 'beginner'
                 CHECK (level IN ('starter', 'beginner', 'intermediate', 'advanced', 'proficient')),
    podcast_id   UUID REFERENCES podcasts(id) ON DELETE SET NULL,
    position     INT  NOT NULL DEFAULT 0,
    is_active    BOOLEAN NOT NULL DEFAULT FALSE,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_roleplay_scenarios_active ON roleplay_scenarios (is_active, position);

-- گفتگو یا به صحنه وصل است یا به سناریوی نقش‌آفرینی.
ALTER TABLE ai_conversations ALTER COLUMN scene_id DROP NOT NULL;
ALTER TABLE ai_conversations ADD COLUMN IF NOT EXISTS roleplay_id UUID REFERENCES roleplay_scenarios(id) ON DELETE CASCADE;
ALTER TABLE ai_conversations ADD CONSTRAINT ai_conversations_topic_chk
    CHECK (scene_id IS NOT NULL OR roleplay_id IS NOT NULL);

-- +migrate Down
DELETE FROM ai_conversations WHERE scene_id IS NULL;
ALTER TABLE ai_conversations DROP CONSTRAINT IF EXISTS ai_conversations_topic_chk;
ALTER TABLE ai_conversations DROP COLUMN IF EXISTS roleplay_id;
ALTER TABLE ai_conversations ALTER COLUMN scene_id SET NOT NULL;
DROP TABLE IF EXISTS roleplay_scenarios;
