-- +migrate Up
-- تنظیم فایل صوتی معتبر برای قسمت‌های نمونه مجموعه‌های پادکست
UPDATE podcasts
SET audio_url = '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3',
    audio_status = 'ready',
    is_active = TRUE
WHERE series_id IS NOT NULL AND (audio_url IS NULL OR audio_url = '');

-- +migrate Down
-- no-op
