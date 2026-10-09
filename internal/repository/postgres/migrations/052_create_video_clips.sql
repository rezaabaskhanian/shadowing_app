-- +migrate Up
-- «تمرین با ویدیو»: کلیپ‌های کوتاه (ساخته‌شده با Google Flow یا تکه‌ای از
-- فیلم‌های معروف) با دیالوگ‌های زمان‌بندی‌شده. کاربر اول کلیپ را می‌بیند، به
-- سؤال‌های فهم جواب می‌دهد، بعد یک شخصیت را انتخاب می‌کند و کلیپ دوباره پخش
-- می‌شود؛ سر نوبت آن شخصیت صدای ویدیو قطع می‌شود و کاربر جای او حرف می‌زند —
-- ببینید videoclipservice.

CREATE TABLE IF NOT EXISTS video_clips (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title            TEXT NOT NULL,
    description_fa   TEXT NOT NULL DEFAULT '',
    source           TEXT NOT NULL DEFAULT 'flow' CHECK (source IN ('flow', 'movie')),
    video_url        TEXT NOT NULL DEFAULT '',
    poster_url       TEXT NOT NULL DEFAULT '',
    level            TEXT NOT NULL DEFAULT 'beginner'
                     CHECK (level IN ('beginner', 'intermediate', 'advanced')),
    duration_seconds INT NOT NULL DEFAULT 0,
    -- سؤال‌های فهم: [{"question_fa": "...", "options": ["..."], "answer_index": 0}]
    questions        JSONB NOT NULL DEFAULT '[]'::jsonb,
    position         INT NOT NULL DEFAULT 0,
    is_active        BOOLEAN NOT NULL DEFAULT FALSE,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_video_clips_active_position ON video_clips (is_active, position);

-- دیالوگ‌های کلیپ با زمان شروع/پایان (میلی‌ثانیه) در ویدیو. با هر ذخیره‌ی
-- کلیپ، همه‌ی خطوط از نو نوشته می‌شوند (تلاش‌ها به speaker وصل‌اند نه line id).
CREATE TABLE IF NOT EXISTS video_clip_lines (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clip_id        UUID NOT NULL REFERENCES video_clips(id) ON DELETE CASCADE,
    position       INT NOT NULL DEFAULT 0,
    speaker        TEXT NOT NULL,
    text           TEXT NOT NULL,
    translation_fa TEXT NOT NULL DEFAULT '',
    start_ms       INT NOT NULL CHECK (start_ms >= 0),
    end_ms         INT NOT NULL CHECK (end_ms > start_ms)
);

CREATE INDEX IF NOT EXISTS idx_video_clip_lines_clip ON video_clip_lines (clip_id, position);

-- هر اجرای «جای شخصیت حرف زدن» با میانگین امتیاز تلفظ خطوطش.
CREATE TABLE IF NOT EXISTS video_clip_attempts (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    clip_id    UUID NOT NULL REFERENCES video_clips(id) ON DELETE CASCADE,
    speaker    TEXT NOT NULL,
    score      INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_video_clip_attempts_user_clip ON video_clip_attempts (user_id, clip_id);

-- +migrate Down
DROP TABLE IF EXISTS video_clip_attempts;
DROP TABLE IF EXISTS video_clip_lines;
DROP TABLE IF EXISTS video_clips;
