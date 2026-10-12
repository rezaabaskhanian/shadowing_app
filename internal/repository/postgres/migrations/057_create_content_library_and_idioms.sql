-- +migrate Up
-- «کتابخانه‌ی محتوا»: فایل‌های JSON (مثلاً درس‌های آماده) که ادمین فقط برای
-- نگه‌داری/مرجع آپلود می‌کند. نوع JSON (نه JSONB) تا متن فایل دقیقاً همان‌طور
-- که آپلود شده (ترتیب کلیدها و ...) بماند.
CREATE TABLE IF NOT EXISTS content_resources (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title      TEXT NOT NULL,
    kind       TEXT NOT NULL DEFAULT 'lesson',
    notes      TEXT NOT NULL DEFAULT '',
    file_name  TEXT NOT NULL DEFAULT '',
    content    JSON NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_content_resources_created ON content_resources (created_at DESC);

-- «اصطلاحات» (idioms / expressions). هر عبارت (بدون حساسیت به حروف بزرگ/کوچک)
-- فقط یک‌بار ثبت می‌شود؛ وارد کردن گروهی، تکراری‌ها را به‌روز می‌کند.
CREATE TABLE IF NOT EXISTS idioms (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    phrase         TEXT NOT NULL,
    meaning_fa     TEXT NOT NULL DEFAULT '',
    explanation_fa TEXT NOT NULL DEFAULT '',
    example_en     TEXT NOT NULL DEFAULT '',
    example_fa     TEXT NOT NULL DEFAULT '',
    level          TEXT NOT NULL DEFAULT '',
    category       TEXT NOT NULL DEFAULT '',
    is_active      BOOLEAN NOT NULL DEFAULT TRUE,
    created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_idioms_phrase ON idioms (LOWER(phrase));

-- +migrate Down
DROP TABLE IF EXISTS idioms;
DROP TABLE IF EXISTS content_resources;
