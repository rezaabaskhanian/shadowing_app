-- +migrate Up
-- تست تعیین سطح نسخه‌ی ۲ (سند document_placement/placement_design.md): سه
-- بخش جدید کنار آیتم‌های قبلی —
--   vocab_yesno   : «این کلمه را می‌شناسی؟» از لایه‌های بسامدی (band 1..5)،
--                   همراه کلمه‌های ساختگی (is_pseudo) برای گرفتن حدس.
--   listen_choice : یک جمله پخش می‌شود و کاربر از options معنی درست را
--                   انتخاب می‌کند (correct_index).
--   imitation     : تکرار جمله‌ی بلندشونده؛ نمره = دقت کلمه، نه لهجه.
-- آیتم‌های قبلی (shadow / free_speech) برای نسخه‌های قدیمی اپ دست‌نخورده می‌مانند.
ALTER TABLE assessment_items DROP CONSTRAINT IF EXISTS assessment_items_kind_check;
ALTER TABLE assessment_items ADD CONSTRAINT assessment_items_kind_check
    CHECK (kind IN ('shadow', 'free_speech', 'vocab_yesno', 'listen_choice', 'imitation'));

ALTER TABLE assessment_items
    ADD COLUMN IF NOT EXISTS cefr VARCHAR(2) NOT NULL DEFAULT ''
        CHECK (cefr IN ('', 'A1', 'A2', 'B1', 'B2', 'C1')),
    ADD COLUMN IF NOT EXISTS band SMALLINT NOT NULL DEFAULT 0 CHECK (band BETWEEN 0 AND 5),
    ADD COLUMN IF NOT EXISTS is_pseudo BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN IF NOT EXISTS options JSONB NOT NULL DEFAULT '[]'::jsonb,
    ADD COLUMN IF NOT EXISTS correct_index SMALLINT NOT NULL DEFAULT -1;

CREATE INDEX IF NOT EXISTS idx_assessment_items_kind_active ON assessment_items(kind, is_active);

-- نتیجه‌ی دوبخشی تست جدید روی همان پروفایل؛ level همچنان «سطح شروع مسیر» است.
ALTER TABLE speaking_profiles
    ADD COLUMN IF NOT EXISTS test_version SMALLINT NOT NULL DEFAULT 1,
    ADD COLUMN IF NOT EXISTS comprehension_level VARCHAR(2) NOT NULL DEFAULT '',
    ADD COLUMN IF NOT EXISTS speaking_level VARCHAR(2) NOT NULL DEFAULT '',
    ADD COLUMN IF NOT EXISTS listening_level VARCHAR(2) NOT NULL DEFAULT '',
    ADD COLUMN IF NOT EXISTS vocab_level VARCHAR(2) NOT NULL DEFAULT '',
    ADD COLUMN IF NOT EXISTS vocab_size INT NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS vocab_valid BOOLEAN NOT NULL DEFAULT true;

-- تاریخچه‌ی نتیجه‌ها برای «ببین چقدر پیشرفت کردی» (تست دوباره بعد از ۲۸ روز).
CREATE TABLE IF NOT EXISTS placement_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    level VARCHAR(2) NOT NULL,
    comprehension_level VARCHAR(2) NOT NULL DEFAULT '',
    speaking_level VARCHAR(2) NOT NULL DEFAULT '',
    listening_level VARCHAR(2) NOT NULL DEFAULT '',
    vocab_level VARCHAR(2) NOT NULL DEFAULT '',
    vocab_size INT NOT NULL DEFAULT 0,
    vocab_valid BOOLEAN NOT NULL DEFAULT true,
    imitation_accuracy FLOAT NOT NULL DEFAULT 0,
    assessed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_placement_results_user ON placement_results(user_id, assessed_at DESC);

-- +migrate Down
DROP TABLE IF EXISTS placement_results;
ALTER TABLE speaking_profiles
    DROP COLUMN IF EXISTS vocab_valid,
    DROP COLUMN IF EXISTS vocab_size,
    DROP COLUMN IF EXISTS vocab_level,
    DROP COLUMN IF EXISTS listening_level,
    DROP COLUMN IF EXISTS speaking_level,
    DROP COLUMN IF EXISTS comprehension_level,
    DROP COLUMN IF EXISTS test_version;
DROP INDEX IF EXISTS idx_assessment_items_kind_active;
DELETE FROM assessment_items WHERE kind IN ('vocab_yesno', 'listen_choice', 'imitation');
ALTER TABLE assessment_items
    DROP COLUMN IF EXISTS correct_index,
    DROP COLUMN IF EXISTS options,
    DROP COLUMN IF EXISTS is_pseudo,
    DROP COLUMN IF EXISTS band,
    DROP COLUMN IF EXISTS cefr;
ALTER TABLE assessment_items DROP CONSTRAINT IF EXISTS assessment_items_kind_check;
ALTER TABLE assessment_items ADD CONSTRAINT assessment_items_kind_check
    CHECK (kind IN ('shadow', 'free_speech'));
