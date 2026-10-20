-- +migrate Up
-- مسیر هدف‌محور (سفر، مهاجرت، تحصیل، کار): بسته‌ی موقعیت‌های هر هدف و برنامه‌ی
-- کاربر (هدف + تاریخ + دقیقه در روز). طراحی: document_goal_path/goal_path_design.md.
CREATE TABLE IF NOT EXISTS goal_pack_situations (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    goal        TEXT NOT NULL CHECK (goal IN ('travel', 'migration', 'study', 'work')),
    position    INT  NOT NULL,
    priority    INT  NOT NULL DEFAULT 2 CHECK (priority BETWEEN 1 AND 3),
    title_fa    TEXT NOT NULL,
    title_en    TEXT NOT NULL DEFAULT '',
    -- صحنه‌های این موقعیت (هر سطح یکی)؛ آرایه‌ای از شناسه‌ی صحنه. خالی یعنی هنوز ساخته نشده.
    scene_ids   JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (goal, position)
);

CREATE TABLE IF NOT EXISTS user_goal_plans (
    user_id         UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    goal            TEXT NOT NULL CHECK (goal IN ('travel', 'migration', 'study', 'work')),
    target_date     DATE,
    minutes_per_day INT  NOT NULL CHECK (minutes_per_day IN (15, 30, 45, 60)),
    start_level     TEXT NOT NULL DEFAULT 'beginner',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- +migrate Down
DROP TABLE IF EXISTS user_goal_plans;
DROP TABLE IF EXISTS goal_pack_situations;
