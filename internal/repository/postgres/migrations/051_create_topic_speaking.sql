-- +migrate Up
-- «صحبت درباره‌ی یک موضوع»: ادمین موضوع‌ها را می‌سازد، کاربر ۱ تا ۲ دقیقه
-- درباره‌ی موضوع صحبت می‌کند و AI متن رونویسی‌شده را بررسی می‌کند (ربط به
-- موضوع، اشتباه‌های گرامری، عبارت‌های بهتر، نسخه‌ی بهترشده) — ببینید
-- topicspeakingservice.

CREATE TABLE IF NOT EXISTS speaking_topics (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title            TEXT NOT NULL,                 -- عنوان انگلیسی، مثلاً "Your best trip"
    prompt_fa        TEXT NOT NULL DEFAULT '',      -- توضیح فارسی: درباره‌ی چه بگوید
    guide_questions  TEXT[] NOT NULL DEFAULT '{}',  -- سؤال‌های راهنما (انگلیسی) برای اینکه حرف کم نیاورد
    useful_phrases   TEXT[] NOT NULL DEFAULT '{}',  -- عبارت/ساختارهای پیشنهادی برای استفاده در صحبت
    level            TEXT NOT NULL DEFAULT 'beginner'
                     CHECK (level IN ('beginner', 'intermediate', 'advanced')),
    duration_seconds INT NOT NULL DEFAULT 60 CHECK (duration_seconds BETWEEN 30 AND 120),
    position         INT NOT NULL DEFAULT 0,
    is_active        BOOLEAN NOT NULL DEFAULT TRUE,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_speaking_topics_active_position ON speaking_topics (is_active, position);

-- هر تلاش کاربر با نتیجه‌ی کامل بررسی AI (JSON) — برای «بهترین امتیاز» در
-- لیست موضوع‌ها و تاریخچه‌ی بعدی.
CREATE TABLE IF NOT EXISTS topic_speaking_attempts (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id          UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    topic_id         UUID NOT NULL REFERENCES speaking_topics(id) ON DELETE CASCADE,
    transcript       TEXT NOT NULL,
    duration_seconds INT NOT NULL DEFAULT 0,
    score            INT NOT NULL DEFAULT 0,
    review           JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_topic_speaking_attempts_user_topic ON topic_speaking_attempts (user_id, topic_id);

-- +migrate Down
DROP TABLE IF EXISTS topic_speaking_attempts;
DROP TABLE IF EXISTS speaking_topics;
