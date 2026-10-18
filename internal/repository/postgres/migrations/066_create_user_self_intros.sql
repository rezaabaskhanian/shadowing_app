-- +migrate Up
-- «قبل و بعد» مسیر آموزشی: کاربر هفته‌ی اول و هفته‌ی آخر همان معرفی کوتاه را
-- ضبط می‌کند. خودِ صدا فقط روی گوشی کاربر می‌ماند؛ اینجا فقط متن رونویسی‌شده
-- و آمارش ذخیره می‌شود تا مقایسه روی هر گوشی‌ای دیده شود. ضبط دوباره جایگزین
-- ضبط قبلیِ همان مرحله می‌شود.
CREATE TABLE IF NOT EXISTS user_self_intros (
    user_id          UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    level            TEXT NOT NULL,
    stage            TEXT NOT NULL CHECK (stage IN ('before', 'after')),
    transcript       TEXT NOT NULL DEFAULT '',
    duration_seconds INT NOT NULL DEFAULT 0,
    word_count       INT NOT NULL DEFAULT 0,
    unique_words     INT NOT NULL DEFAULT 0,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (user_id, level, stage)
);

-- +migrate Down
DROP TABLE IF EXISTS user_self_intros;
