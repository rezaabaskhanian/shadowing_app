-- +migrate Up
-- «مسیر آموزشی»: یک لایه‌ی راهنمای اختیاری روی محتوای موجود. هر سطح یک مسیر
-- دارد ← چند هفته ← هر هفته چند جلسه ← هر جلسه چند قدم (ارجاع به صحنه، پادکست،
-- مرور لایتنر، ...) + یک Checkpoint آخر هفته. جلسه‌ها با انجام دادن باز می‌شوند،
-- نه با گذشت روز، و Checkpoint هیچ‌وقت راه را نمی‌بندد — ببینید pathservice.
CREATE TABLE IF NOT EXISTS learning_paths (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    level          TEXT NOT NULL UNIQUE,
    title_fa       TEXT NOT NULL,
    description_fa TEXT NOT NULL DEFAULT '',
    goal_fa        TEXT NOT NULL DEFAULT '',
    position       INT NOT NULL DEFAULT 0,
    is_active      BOOLEAN NOT NULL DEFAULT false,
    created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- sessions: [{"no":1,"title_fa":"...","items":[{"key":"...","kind":"scene","ref_id":"...","title":"...","required":true}]}]
-- checkpoint: محتوای آزمون هفته (واژگان، چیدن کلمه، شنیداری، گفتاری، موقعیت واقعی).
CREATE TABLE IF NOT EXISTS path_weeks (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    path_id    UUID NOT NULL REFERENCES learning_paths(id) ON DELETE CASCADE,
    position   INT NOT NULL,
    title_fa   TEXT NOT NULL,
    goal_fa    TEXT NOT NULL DEFAULT '',
    can_do     JSONB NOT NULL DEFAULT '[]'::jsonb,
    sessions   JSONB NOT NULL DEFAULT '[]'::jsonb,
    checkpoint JSONB NOT NULL DEFAULT '{}'::jsonb,
    is_free    BOOLEAN NOT NULL DEFAULT false,
    UNIQUE (path_id, position)
);

-- قدم‌هایی که کاربر تمام کرده (صحنه‌ها جدا از scene_progress.is_completed هم حساب می‌شوند).
CREATE TABLE IF NOT EXISTS user_path_items (
    user_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    week_id      UUID NOT NULL REFERENCES path_weeks(id) ON DELETE CASCADE,
    item_key     TEXT NOT NULL,
    completed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (user_id, week_id, item_key)
);

-- هر بار Checkpoint دادن یک ردیف؛ نمره‌ی هر مهارت جدا (0 تا 100).
CREATE TABLE IF NOT EXISTS user_checkpoint_results (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    week_id    UUID NOT NULL REFERENCES path_weeks(id) ON DELETE CASCADE,
    scores     JSONB NOT NULL DEFAULT '{}'::jsonb,
    total      INT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_user_checkpoint_results_user_week ON user_checkpoint_results (user_id, week_id);

-- +migrate Down
DROP TABLE IF EXISTS user_checkpoint_results;
DROP TABLE IF EXISTS user_path_items;
DROP TABLE IF EXISTS path_weeks;
DROP TABLE IF EXISTS learning_paths;
