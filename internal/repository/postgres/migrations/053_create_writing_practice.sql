-- +migrate Up
-- «تمرین نوشتن»: ادمین موضوع می‌دهد، کاربر یک داستان/متن کوتاه می‌نویسد و AI
-- آن را تصحیح می‌کند (اشتباه‌ها با توضیح گرامری، ساختارها و عبارت‌های
-- پیشنهادی، نسخه‌ی بهترشده) — ببینید writingservice.

CREATE TABLE IF NOT EXISTS writing_prompts (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title           TEXT NOT NULL,                 -- عنوان انگلیسی، مثلاً "A day I will never forget"
    prompt_fa       TEXT NOT NULL DEFAULT '',      -- توضیح فارسی: درباره‌ی چه بنویسد
    guide_questions TEXT[] NOT NULL DEFAULT '{}',  -- ایده‌ها/سؤال‌های راهنما برای اینکه داستان را جلو ببرد
    useful_phrases  TEXT[] NOT NULL DEFAULT '{}',  -- ساختارها و عبارت‌هایی که بهتر است در متن بیاورد
    level           TEXT NOT NULL DEFAULT 'beginner'
                    CHECK (level IN ('beginner', 'intermediate', 'advanced')),
    min_words       INT NOT NULL DEFAULT 40 CHECK (min_words BETWEEN 10 AND 500),
    max_words       INT NOT NULL DEFAULT 150 CHECK (max_words BETWEEN 20 AND 800),
    position        INT NOT NULL DEFAULT 0,
    is_active       BOOLEAN NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_writing_prompts_active_position ON writing_prompts (is_active, position);

CREATE TABLE IF NOT EXISTS writing_attempts (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    prompt_id  UUID NOT NULL REFERENCES writing_prompts(id) ON DELETE CASCADE,
    text       TEXT NOT NULL,
    score      INT NOT NULL DEFAULT 0,
    review     JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_writing_attempts_user_prompt ON writing_attempts (user_id, prompt_id);

-- +migrate Down
DROP TABLE IF EXISTS writing_attempts;
DROP TABLE IF EXISTS writing_prompts;
