-- +migrate Up
-- سطح CEFR هر معنای فعل (A1…C1، بر پایه‌ی English Vocabulary Profile)، تا
-- معنای سطح بالاتر زودتر از موعد به زبان‌آموز نشان داده نشود. خالی = نامشخص.
ALTER TABLE verb_meanings ADD COLUMN IF NOT EXISTS level TEXT NOT NULL DEFAULT '';
ALTER TABLE verb_meanings DROP CONSTRAINT IF EXISTS verb_meanings_level_check;
ALTER TABLE verb_meanings ADD CONSTRAINT verb_meanings_level_check
    CHECK (level IN ('', 'A1', 'A2', 'B1', 'B2', 'C1', 'C2'));

-- +migrate Down
ALTER TABLE verb_meanings DROP CONSTRAINT IF EXISTS verb_meanings_level_check;
ALTER TABLE verb_meanings DROP COLUMN IF EXISTS level;
