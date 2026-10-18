-- +migrate Up
-- جواب ادمین به تعامل‌های کاربر (پیشنهاد و انتقاد، پیشنهاد صحنه/موضوع، خرید)؛
-- از ربات تلگرام/بله یا پنل ثبت می‌شود، با نوتیف به کاربر می‌رسد و در صفحه‌ی
-- «پیشنهاد و انتقاد» اپ هم نمایش داده می‌شود (اگر نوتیف نرسید، گم نشود).
CREATE TABLE IF NOT EXISTS support_replies (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    kind       TEXT NOT NULL,
    ref_id     TEXT NOT NULL DEFAULT '',
    original   TEXT NOT NULL DEFAULT '',
    reply      TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_support_replies_user ON support_replies (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_support_replies_ref ON support_replies (kind, ref_id);

-- +migrate Down
DROP TABLE IF EXISTS support_replies;
