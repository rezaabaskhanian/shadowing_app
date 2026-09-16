-- +migrate Up
-- AI Conversation: بعد از تمام‌شدن همه‌ی دیالوگ‌های یک صحنه، کاربر یک گفتگوی
-- آزاد صوتی نوبتی با یک شخصیت AI (برگرفته از موقعیت همان صحنه) انجام می‌دهد.
-- حداکثر ۸ نوبت کاربر (aiconversation.MaxUserTurns)، بعد پایان خودکار با
-- جمع‌بندی AI.
CREATE TABLE IF NOT EXISTS ai_conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    scene_id UUID NOT NULL REFERENCES scenes(id) ON DELETE CASCADE,
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed')),
    turn_count INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ai_conversations_user_id ON ai_conversations(user_id);

CREATE TRIGGER update_ai_conversations_updated_at
    BEFORE UPDATE ON ai_conversations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- صدای کاربر روی سرور نگه‌داری نمی‌شود (مثل قاعده‌ی کلی پروژه)؛ فقط رونویسی
-- متن ذخیره می‌شود. audio_url فقط برای نوبت‌های assistant پر می‌شود (mp3 ElevenLabs).
CREATE TABLE IF NOT EXISTS ai_conversation_turns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES ai_conversations(id) ON DELETE CASCADE,
    role VARCHAR(10) NOT NULL CHECK (role IN ('user', 'assistant')),
    text TEXT NOT NULL,
    audio_url TEXT,
    order_index INT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ai_conversation_turns_conversation_id
    ON ai_conversation_turns(conversation_id, order_index);

-- +migrate Down
DROP TABLE IF EXISTS ai_conversation_turns;
DROP TRIGGER IF EXISTS update_ai_conversations_updated_at ON ai_conversations;
DROP TABLE IF EXISTS ai_conversations;
