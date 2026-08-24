-- +migrate Up

-- دسته‌بندی صحنه (مثلاً «shop»، «travel»، ...) — متن آزاد، توسط ادمین تعیین می‌شود
ALTER TABLE scenes ADD COLUMN IF NOT EXISTS category VARCHAR(100);
CREATE INDEX IF NOT EXISTS idx_scenes_category ON scenes(category);

-- پیشنهادات و انتقادات کاربران (از درج drawer اپ موبایل)
CREATE TABLE IF NOT EXISTS feedbacks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_feedbacks_user_id ON feedbacks(user_id);
CREATE INDEX IF NOT EXISTS idx_feedbacks_created_at ON feedbacks(created_at);

-- +migrate Down
DROP TABLE IF EXISTS feedbacks;
ALTER TABLE scenes DROP COLUMN IF EXISTS category;
