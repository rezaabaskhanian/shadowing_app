-- +migrate Up
-- اطلاعاتِ داخلیِ منبع برای کلیپ‌های «تکه‌ای از فیلم» (فقط در پنل ادمین؛ اپ
-- نمی‌بیند): سالِ فیلم و بازه‌ی صحنه در خودِ فیلم — اگر گزارشی درباره‌ی
-- کلیپی رسید، سریع معلوم شود کدام تکه است. همین شروعِ صحنه برای جابه‌جاکردنِ
-- زمان‌های زیرنویسِ رسمیِ فیلم (.srt) هم به کار می‌رود.
-- mute_padding_ms: حاشیه‌ی قطعِ صدای ویدیو قبل و بعد از جمله‌ی کاربر در اپ.
ALTER TABLE video_clips
    ADD COLUMN IF NOT EXISTS movie_year      INT NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS movie_start_ms  INT NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS movie_end_ms    INT NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS mute_padding_ms INT NOT NULL DEFAULT 250;

-- +migrate Down
ALTER TABLE video_clips
    DROP COLUMN IF EXISTS mute_padding_ms,
    DROP COLUMN IF EXISTS movie_end_ms,
    DROP COLUMN IF EXISTS movie_start_ms,
    DROP COLUMN IF EXISTS movie_year;
