-- +migrate Up
-- پیشنهاد جواب (Hint) در گفتگوی آزاد با AI: وقتی کاربر نمی‌داند به سؤال AI چه
-- بگوید، دکمه‌ی «پیشنهاد» ۲ جمله‌ی انگلیسی + ترجمه‌ی فارسی می‌دهد. هر
-- گفتگو حداکثر aiconversation.MaxHints پیشنهاد دارد و سقف سمتِ سرور اعمال
-- می‌شود. برای هر نوبتِ AI فقط یک ردیف وجود دارد (UNIQUE) تا زدنِ دوباره‌ی
-- دکمه روی همان نوبت، هم هزینه‌ی LLM نداشته باشد و هم از سقف کم نکند.
-- suggestions یک آرایه‌ی JSON از {text, translation_fa, audio_url?} است؛
-- audio_url وقتی پر می‌شود که کاربر دکمه‌ی پخش همان جمله را بزند (ساخت
-- تنبل‌ِ صدا، برای صرفه‌جویی در هزینه‌ی ElevenLabs).
CREATE TABLE IF NOT EXISTS ai_conversation_hints (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES ai_conversations(id) ON DELETE CASCADE,
    turn_index INT NOT NULL,
    suggestions JSONB NOT NULL,
    input_tokens INT,
    output_tokens INT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (conversation_id, turn_index)
);

-- +migrate Down
DROP TABLE IF EXISTS ai_conversation_hints;
