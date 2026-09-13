-- +migrate Up
-- Speaking Assessment (placement test): سه آیتم (intro/situational/shadow) از
-- استخرهای مدیریت‌شده در پنل ادمین به‌صورت رندوم انتخاب می‌شوند. فقط آیتم
-- shadow نمره واقعی (Pronunciation/Fluency) می‌گیرد و Level را تعیین می‌کند؛
-- آیتم‌های free_speech فقط رونویسی + بررسی ربط توسط AI می‌شوند، بدون نمره‌ی
-- ساختگی.
CREATE TABLE IF NOT EXISTS assessment_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    kind VARCHAR(20) NOT NULL CHECK (kind IN ('shadow', 'free_speech')),
    -- فقط برای kind=free_speech معنا دارد؛ برای shadow نادیده گرفته می‌شود.
    category VARCHAR(20) NOT NULL DEFAULT 'situational' CHECK (category IN ('intro', 'situational')),
    prompt_text TEXT NOT NULL,
    target_text TEXT,
    audio_url TEXT,
    difficulty VARCHAR(20) CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_assessment_items_kind_category_active
    ON assessment_items(kind, category, is_active);

CREATE TRIGGER update_assessment_items_updated_at
    BEFORE UPDATE ON assessment_items
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TABLE IF NOT EXISTS speaking_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    level VARCHAR(10) NOT NULL,
    overall_score FLOAT NOT NULL,
    pronunciation_score FLOAT NOT NULL,
    fluency_score FLOAT NOT NULL,
    is_estimated BOOLEAN NOT NULL DEFAULT false,
    assessed_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER update_speaking_profiles_updated_at
    BEFORE UPDATE ON speaking_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- لاگ متنی هر آیتم ارسالی (بدون صدا، مطابق قاعده‌ی کلی پروژه که صدای کاربر
-- روی سرور نگه‌داری نمی‌شود) تا نتیجه‌ی تست بعداً هم قابل نمایش باشد.
CREATE TABLE IF NOT EXISTS assessment_submission_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    item_id UUID NOT NULL REFERENCES assessment_items(id) ON DELETE CASCADE,
    transcript TEXT,
    relevance_answered VARCHAR(10),
    relevance_feedback TEXT,
    pronunciation_score FLOAT,
    fluency_score FLOAT,
    overall_score FLOAT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_assessment_submission_items_user_id
    ON assessment_submission_items(user_id);

-- +migrate Down
DROP TABLE IF EXISTS assessment_submission_items;
DROP TRIGGER IF EXISTS update_speaking_profiles_updated_at ON speaking_profiles;
DROP TABLE IF EXISTS speaking_profiles;
DROP TRIGGER IF EXISTS update_assessment_items_updated_at ON assessment_items;
DROP TABLE IF EXISTS assessment_items;
