-- +migrate Up

-- خروجی نمره‌دهی واقعی تلفظ: متنی که از کاربر شنیده شده و نمره‌ی تک‌تک
-- کلمه‌های جمله‌ی هدف (برای قرمز کردن کلمه‌های ضعیف در مرحله‌ی Compare).
ALTER TABLE shadowing_recordings
  ADD COLUMN IF NOT EXISTS transcript TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS word_scores JSONB DEFAULT '[]'::jsonb,
  -- is_estimated یعنی سرویس تشخیص گفتار در دسترس نبوده و نمره فقط تخمینی
  -- از روی مدت ضبط است. بدون این ستون نمی‌شود نمره‌های واقعی و تخمینی را
  -- در گزارش‌های پیشرفت از هم جدا کرد.
  ADD COLUMN IF NOT EXISTS is_estimated BOOLEAN DEFAULT TRUE;

-- +migrate Down

ALTER TABLE shadowing_recordings
  DROP COLUMN IF EXISTS transcript,
  DROP COLUMN IF EXISTS word_scores,
  DROP COLUMN IF EXISTS is_estimated;
