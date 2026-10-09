-- +migrate Up
-- «دوره‌ی شروع» برای مبتدی‌مبتدی‌ها (به سبک آموزش به بچه‌ها ولی صحبت‌محور):
-- فصل ← درس ← کارت (کلمه/عبارت/جمله‌ی کوتاه با ایموجی/تصویر، معنی فارسی و
-- صدا). کاربر هر کارت را گوش می‌دهد و تکرار می‌کند، ستاره می‌گیرد و درس‌ها به
-- ترتیب باز می‌شوند — ببینید courseservice.

CREATE TABLE IF NOT EXISTS course_units (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title_fa       TEXT NOT NULL,
    title_en       TEXT NOT NULL DEFAULT '',
    emoji          TEXT NOT NULL DEFAULT '',
    description_fa TEXT NOT NULL DEFAULT '',
    position       INT NOT NULL DEFAULT 0,
    is_active      BOOLEAN NOT NULL DEFAULT TRUE,
    created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS course_lessons (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    unit_id    UUID NOT NULL REFERENCES course_units(id) ON DELETE CASCADE,
    title_fa   TEXT NOT NULL,
    title_en   TEXT NOT NULL DEFAULT '',
    emoji      TEXT NOT NULL DEFAULT '',
    goal_fa    TEXT NOT NULL DEFAULT '',  -- «بعد از این درس می‌توانی ...»
    position   INT NOT NULL DEFAULT 0,
    is_active  BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_course_lessons_unit ON course_lessons (unit_id, position);

-- با هر ذخیره‌ی درس، کارت‌ها کامل از نو نوشته می‌شوند (پیشرفت به درس وصل است نه کارت).
CREATE TABLE IF NOT EXISTS course_items (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lesson_id  UUID NOT NULL REFERENCES course_lessons(id) ON DELETE CASCADE,
    position   INT NOT NULL DEFAULT 0,
    text_en    TEXT NOT NULL,
    meaning_fa TEXT NOT NULL DEFAULT '',
    emoji      TEXT NOT NULL DEFAULT '',
    image_url  TEXT NOT NULL DEFAULT '',
    audio_url  TEXT NOT NULL DEFAULT '',
    tip_fa     TEXT NOT NULL DEFAULT ''   -- نکته‌ی تلفظ یا کاربرد به فارسی
);

CREATE INDEX IF NOT EXISTS idx_course_items_lesson ON course_items (lesson_id, position);

CREATE TABLE IF NOT EXISTS course_progress (
    user_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    lesson_id    UUID NOT NULL REFERENCES course_lessons(id) ON DELETE CASCADE,
    stars        INT NOT NULL DEFAULT 0 CHECK (stars BETWEEN 0 AND 3),
    best_score   INT NOT NULL DEFAULT 0,
    completed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (user_id, lesson_id)
);

-- +migrate Down
DROP TABLE IF EXISTS course_progress;
DROP TABLE IF EXISTS course_items;
DROP TABLE IF EXISTS course_lessons;
DROP TABLE IF EXISTS course_units;
