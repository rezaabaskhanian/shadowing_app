-- +migrate Up

ALTER TABLE shadowing_recordings 
  ADD COLUMN IF NOT EXISTS pronunciation_score DECIMAL(5,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS fluency_score DECIMAL(5,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS overall_score DECIMAL(5,2) DEFAULT 0;

ALTER TABLE scene_progress 
  ADD COLUMN IF NOT EXISTS avg_pronunciation_score DECIMAL(5,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS avg_fluency_score DECIMAL(5,2) DEFAULT 0;

-- +migrate Down

ALTER TABLE shadowing_recordings 
  DROP COLUMN IF EXISTS pronunciation_score,
  DROP COLUMN IF EXISTS fluency_score,
  DROP COLUMN IF EXISTS overall_score;

ALTER TABLE scene_progress 
  DROP COLUMN IF EXISTS avg_pronunciation_score,
  DROP COLUMN IF EXISTS avg_fluency_score;
