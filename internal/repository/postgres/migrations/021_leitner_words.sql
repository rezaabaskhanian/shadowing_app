-- +migrate Up

-- همگام‌سازی بک‌اند لایتنر: قبلاً کاملاً لوکال (AsyncStorage) بود؛ این جدول
-- همان مدل داده‌ی موبایل (word/meaning/level/nextReview) را سمت سرور نگه
-- می‌دارد.
CREATE TABLE IF NOT EXISTS leitner_words (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  word TEXT NOT NULL,
  meaning TEXT NOT NULL,
  level INT NOT NULL DEFAULT 1 CHECK (level BETWEEN 1 AND 5),
  next_review TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, word)
);

CREATE INDEX IF NOT EXISTS idx_leitner_words_user_id ON leitner_words(user_id);

-- +migrate Down

DROP TABLE IF EXISTS leitner_words;
