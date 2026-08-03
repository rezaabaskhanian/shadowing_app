-- internal/repository/postgres/migrations/008_allow_custom_speakers.sql
-- +migrate Up
ALTER TABLE dialogues DROP CONSTRAINT IF EXISTS dialogues_speaker_check;

-- +migrate Down
-- optional: rollback does nothing
