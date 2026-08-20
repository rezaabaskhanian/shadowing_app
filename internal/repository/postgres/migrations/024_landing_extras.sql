-- +migrate Up

-- تنظیمات کلی صفحه‌ی معرفی (هیرو، دکمه‌های دانلود، بنر پایانی) — یک ردیف
-- تکی (singleton) که از پنل ادمین ویرایش می‌شود.
CREATE TABLE IF NOT EXISTS landing_settings (
  id SMALLINT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  hero_title TEXT NOT NULL DEFAULT '',
  hero_subtitle TEXT NOT NULL DEFAULT '',
  hero_image_url TEXT NOT NULL DEFAULT '',
  google_play_url TEXT NOT NULL DEFAULT '',
  bazaar_url TEXT NOT NULL DEFAULT '',
  cta_title TEXT NOT NULL DEFAULT '',
  cta_subtitle TEXT NOT NULL DEFAULT '',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO landing_settings (id) VALUES (1) ON CONFLICT (id) DO NOTHING;

-- آیتم‌های کارتی صفحه‌ی معرفی که شکل یکسانی دارند (آیکون/عنوان/توضیح):
-- kind='feature' برای نوار «چرا LingoFlow»، kind='step' برای «چطور کار می‌کنه».
CREATE TABLE IF NOT EXISTS landing_highlights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kind TEXT NOT NULL CHECK (kind IN ('feature', 'step')),
  icon TEXT NOT NULL DEFAULT '',
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  position INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_landing_highlights_kind ON landing_highlights(kind, position);

-- سوالات متداول
CREATE TABLE IF NOT EXISTS landing_faqs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question TEXT NOT NULL,
  answer TEXT NOT NULL DEFAULT '',
  position INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- +migrate Down
DROP TABLE IF EXISTS landing_faqs;
DROP TABLE IF EXISTS landing_highlights;
DROP TABLE IF EXISTS landing_settings;
