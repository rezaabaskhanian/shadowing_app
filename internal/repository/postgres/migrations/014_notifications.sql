-- +migrate Up
CREATE TABLE IF NOT EXISTS user_notification_settings (
    user_id                   UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    daily_reminder_enabled    BOOLEAN NOT NULL DEFAULT true,
    daily_reminder_time       TEXT NOT NULL DEFAULT '20:00',
    content_notif_enabled     BOOLEAN NOT NULL DEFAULT true,
    content_source            TEXT NOT NULL DEFAULT 'mixed' CHECK (content_source IN ('leitner', 'sentences', 'mixed')),
    updated_at                TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS device_push_tokens (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token        TEXT NOT NULL UNIQUE,
    platform     TEXT NOT NULL CHECK (platform IN ('ios', 'android')),
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
    last_seen_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_device_push_tokens_user_id ON device_push_tokens(user_id);

CREATE TABLE IF NOT EXISTS admin_broadcasts (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title      TEXT NOT NULL,
    body       TEXT NOT NULL,
    target     TEXT NOT NULL DEFAULT 'all',
    sent_count INT NOT NULL DEFAULT 0,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- +migrate Down
DROP TABLE IF EXISTS admin_broadcasts;
DROP TABLE IF EXISTS device_push_tokens;
DROP TABLE IF EXISTS user_notification_settings;
