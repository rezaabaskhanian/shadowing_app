-- +migrate Up
-- سطحی که کاربر خودش دستی انتخاب کرده (از منوی «سطح من» در اپ). جدا از
-- speaking_profiles نگه داشته می‌شود تا نتیجه‌ی تست تعیین سطح دست‌نخورده بماند
-- و کاربری که هنوز تست نداده هم بتواند سطح انتخاب کند. هر جا سطح استفاده
-- می‌شود، اول این و بعد نتیجه‌ی تست خوانده می‌شود؛ دادن دوباره‌ی تست این را
-- پاک می‌کند (نتیجه‌ی تازه‌تر برنده است).
CREATE TABLE IF NOT EXISTS user_level_overrides (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    difficulty TEXT NOT NULL CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- +migrate Down
DROP TABLE IF EXISTS user_level_overrides;
