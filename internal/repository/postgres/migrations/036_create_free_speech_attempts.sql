-- +migrate Up
-- Free Speech (PRODUCT_SPECـCHAT_GPT.md section 16 / section 25 Phase 2):
-- بعد از تمام‌شدنِ یک صحنه، کاربر می‌تواند یک بار آزاد (بدون متنِ مرجع، بدون
-- مکالمه‌ی چندنوبتی) توضیح بدهد چه اتفاقی افتاد. فقط برای لاگِ ممیزی —
-- عیناً هم‌الگوی assessment_submission_items و ai_conversation_turns، بدون
-- صفحه‌ی تاریخچه‌ی جداگانه.
CREATE TABLE IF NOT EXISTS free_speech_attempts (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    scene_id UUID NOT NULL REFERENCES scenes(id) ON DELETE CASCADE,
    transcript TEXT,
    relevance_answered TEXT,
    relevance_feedback TEXT,
    grammar_correction TEXT,
    grammar_explanation TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_free_speech_attempts_user_id ON free_speech_attempts(user_id);

-- +migrate Down
DROP TABLE IF EXISTS free_speech_attempts;
