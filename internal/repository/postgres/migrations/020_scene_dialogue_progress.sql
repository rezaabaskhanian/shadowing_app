-- +migrate Up

-- لجرِ کدام دیالوگ‌ها برای هر کاربر واقعاً کامل شده‌اند (کلید یکتا روی
-- user_id+dialogue_id) تا وقتی کاربر یک دیالوگ را چندبار تمرین می‌کند
-- (session/reset دوباره)، پیشرفت صحنه دوباره شمارش نشود.
CREATE TABLE IF NOT EXISTS scene_dialogue_progress (
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  scene_id UUID NOT NULL,
  dialogue_id UUID NOT NULL REFERENCES dialogues(id) ON DELETE CASCADE,
  score DOUBLE PRECISION NOT NULL DEFAULT 0,
  completed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, dialogue_id)
);

CREATE INDEX IF NOT EXISTS idx_scene_dialogue_progress_user_scene
  ON scene_dialogue_progress(user_id, scene_id);

-- +migrate Down

DROP TABLE IF EXISTS scene_dialogue_progress;
