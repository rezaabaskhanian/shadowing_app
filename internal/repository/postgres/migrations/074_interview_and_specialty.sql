-- +migrate Up
-- «مصاحبه‌ی شبیه‌سازی‌شده» و «زبان تخصصی». فعلاً فقط زیرساخت است؛ هر دو پشت
-- کلیدهای FEATURE_INTERVIEW_ENABLED و FEATURE_ESP_ENABLED در تنظیمات پنل‌اند و
-- محتوا بعداً کم‌کم اضافه می‌شود.

-- رشته‌ها (پزشکی، فناوری اطلاعات، …). key شناسه‌ی خوانا و ثابت است.
CREATE TABLE IF NOT EXISTS specialty_fields (
    key        TEXT PRIMARY KEY,
    title_fa   TEXT NOT NULL,
    title_en   TEXT NOT NULL DEFAULT '',
    icon       TEXT NOT NULL DEFAULT '',
    min_level  TEXT NOT NULL DEFAULT 'intermediate',
    position   INT  NOT NULL DEFAULT 0,
    is_active  BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- لغت‌های هر رشته (به لایتنر اضافه‌شدنی).
CREATE TABLE IF NOT EXISTS field_words (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    field_key  TEXT NOT NULL REFERENCES specialty_fields(key) ON DELETE CASCADE ON UPDATE CASCADE,
    word       TEXT NOT NULL,
    meaning_fa TEXT NOT NULL DEFAULT '',
    example    TEXT NOT NULL DEFAULT '',
    example_fa TEXT NOT NULL DEFAULT '',
    level      TEXT NOT NULL DEFAULT 'intermediate',
    audio_url  TEXT NOT NULL DEFAULT '',
    position   INT  NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_field_words_field ON field_words(field_key, position);

-- محتوای موجود فقط برچسب رشته می‌گیرد؛ محتوای جدا ساخته نمی‌شود.
ALTER TABLE scenes           ADD COLUMN IF NOT EXISTS field_key TEXT NOT NULL DEFAULT '';
ALTER TABLE podcasts         ADD COLUMN IF NOT EXISTS field_key TEXT NOT NULL DEFAULT '';
ALTER TABLE speaking_topics  ADD COLUMN IF NOT EXISTS field_key TEXT NOT NULL DEFAULT '';
ALTER TABLE writing_prompts  ADD COLUMN IF NOT EXISTS field_key TEXT NOT NULL DEFAULT '';

-- یک مجموعه‌ی مصاحبه: kind = job | admission | visa.
CREATE TABLE IF NOT EXISTS interview_sets (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    kind              TEXT NOT NULL CHECK (kind IN ('job', 'admission', 'visa')),
    field_key         TEXT NOT NULL DEFAULT '',
    title             TEXT NOT NULL,
    title_fa          TEXT NOT NULL DEFAULT '',
    description_fa    TEXT NOT NULL DEFAULT '',
    level             TEXT NOT NULL DEFAULT 'intermediate',
    image_url         TEXT NOT NULL DEFAULT '',
    interviewer_voice TEXT NOT NULL DEFAULT '',
    position          INT  NOT NULL DEFAULT 0,
    is_active         BOOLEAN NOT NULL DEFAULT FALSE,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- سؤال‌های هر مجموعه. key_phrases: ["…", "…"] عبارت‌های پیشنهادی برای جواب.
CREATE TABLE IF NOT EXISTS interview_questions (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    set_id           UUID NOT NULL REFERENCES interview_sets(id) ON DELETE CASCADE,
    position         INT  NOT NULL DEFAULT 0,
    text             TEXT NOT NULL,
    translation_fa   TEXT NOT NULL DEFAULT '',
    audio_url        TEXT NOT NULL DEFAULT '',
    prep_seconds     INT  NOT NULL DEFAULT 10,
    answer_seconds   INT  NOT NULL DEFAULT 60,
    tip_fa           TEXT NOT NULL DEFAULT '',
    sample_answer    TEXT NOT NULL DEFAULT '',
    sample_answer_fa TEXT NOT NULL DEFAULT '',
    key_phrases      JSONB NOT NULL DEFAULT '[]'::jsonb
);
CREATE INDEX IF NOT EXISTS idx_interview_questions_set ON interview_questions(set_id, position);

-- یک بار انجام دادن مصاحبه توسط کاربر. report: خلاصه‌ی آخر (JSON).
CREATE TABLE IF NOT EXISTS interview_attempts (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    set_id      UUID NOT NULL REFERENCES interview_sets(id) ON DELETE CASCADE,
    started_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    finished_at TIMESTAMPTZ,
    score       INT NOT NULL DEFAULT 0,
    report      JSONB NOT NULL DEFAULT '{}'::jsonb
);
CREATE INDEX IF NOT EXISTS idx_interview_attempts_user ON interview_attempts(user_id, set_id);

-- جواب هر سؤال؛ try_no برای «یک بار دیگر» (تکرار تکلیف). فایل صدا نگه داشته نمی‌شود.
CREATE TABLE IF NOT EXISTS interview_answers (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    attempt_id       UUID NOT NULL REFERENCES interview_attempts(id) ON DELETE CASCADE,
    question_id      UUID NOT NULL REFERENCES interview_questions(id) ON DELETE CASCADE,
    try_no           INT  NOT NULL DEFAULT 1,
    transcript       TEXT NOT NULL DEFAULT '',
    duration_seconds INT  NOT NULL DEFAULT 0,
    score            INT  NOT NULL DEFAULT 0,
    review           JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_interview_answers_attempt ON interview_answers(attempt_id, question_id);

-- +migrate Down
DROP TABLE IF EXISTS interview_answers;
DROP TABLE IF EXISTS interview_attempts;
DROP TABLE IF EXISTS interview_questions;
DROP TABLE IF EXISTS interview_sets;
ALTER TABLE writing_prompts DROP COLUMN IF EXISTS field_key;
ALTER TABLE speaking_topics DROP COLUMN IF EXISTS field_key;
ALTER TABLE podcasts        DROP COLUMN IF EXISTS field_key;
ALTER TABLE scenes          DROP COLUMN IF EXISTS field_key;
DROP TABLE IF EXISTS field_words;
DROP TABLE IF EXISTS specialty_fields;
