-- +migrate Up

-- محتوای صفحه‌ی معرفی (landing, www.lingoflow.ir) که از پنل ادمین مدیریت
-- می‌شود: هر بخش (معرفی اپ، هر کدام از فیچرها، ارتباط با ما و...) یک ردیف
-- است با یک برچسب کوتاه برای تب‌بار، عنوان/توضیحات و چند عکس اختیاری.
CREATE TABLE IF NOT EXISTS landing_sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tab_label TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  position INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS landing_section_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  section_id UUID NOT NULL REFERENCES landing_sections(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  position INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_landing_section_images_section_id ON landing_section_images(section_id);

-- +migrate Down
DROP TABLE IF EXISTS landing_section_images;
DROP TABLE IF EXISTS landing_sections;
