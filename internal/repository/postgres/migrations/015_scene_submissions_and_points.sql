-- +migrate Up
ALTER TABLE users ADD COLUMN IF NOT EXISTS points INT NOT NULL DEFAULT 0;

CREATE TABLE IF NOT EXISTS scene_submissions (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id        UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    image_url      TEXT,
    situation_text TEXT NOT NULL,
    dialogue_json  JSONB NOT NULL DEFAULT '[]',
    status         TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    admin_note     TEXT,
    points_awarded INT,
    scene_id       UUID REFERENCES scenes(id) ON DELETE SET NULL,
    reviewed_by    UUID REFERENCES users(id) ON DELETE SET NULL,
    reviewed_at    TIMESTAMPTZ,
    created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_scene_submissions_user_id ON scene_submissions(user_id);
CREATE INDEX IF NOT EXISTS idx_scene_submissions_status ON scene_submissions(status);

CREATE TABLE IF NOT EXISTS point_transactions (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    delta         INT NOT NULL,
    reason        TEXT NOT NULL,
    submission_id UUID REFERENCES scene_submissions(id) ON DELETE SET NULL,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_point_transactions_user_id ON point_transactions(user_id);

CREATE TABLE IF NOT EXISTS subscription_plans (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name          TEXT NOT NULL,
    duration_days INT NOT NULL,
    price_toman   INT NOT NULL,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS user_subscriptions (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    plan_id         UUID NOT NULL REFERENCES subscription_plans(id) ON DELETE RESTRICT,
    points_redeemed INT NOT NULL DEFAULT 0,
    discount_toman  INT NOT NULL DEFAULT 0,
    status          TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'expired')),
    started_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    expires_at      TIMESTAMPTZ NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user_id ON user_subscriptions(user_id);

INSERT INTO subscription_plans (name, duration_days, price_toman)
SELECT * FROM (VALUES
    ('یک ماهه', 30, 150000),
    ('سه ماهه', 90, 390000),
    ('یک ساله', 365, 1200000)
) AS seed(name, duration_days, price_toman)
WHERE NOT EXISTS (SELECT 1 FROM subscription_plans);

-- +migrate Down
DROP TABLE IF EXISTS user_subscriptions;
DROP TABLE IF EXISTS subscription_plans;
DROP TABLE IF EXISTS point_transactions;
DROP TABLE IF EXISTS scene_submissions;
ALTER TABLE users DROP COLUMN IF EXISTS points;
