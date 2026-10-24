-- +migrate Up
-- «برنامه‌ی من» کنار موقعیت‌ها (صحنه) تمرین‌های دیگرِ همان هدف را هم نشان می‌دهد:
-- پادکست (شنیدن)، موضوع صحبت و موضوع نوشتن. ادمین برای هر هدف این‌ها را انتخاب می‌کند.
CREATE TABLE IF NOT EXISTS goal_pack_extras (
    goal     TEXT NOT NULL CHECK (goal IN ('travel', 'migration', 'study', 'work')),
    kind     TEXT NOT NULL CHECK (kind IN ('podcast', 'topic', 'writing')),
    ref_id   UUID NOT NULL,
    position INT  NOT NULL DEFAULT 0,
    PRIMARY KEY (goal, kind, ref_id)
);

-- +migrate Down
DROP TABLE IF EXISTS goal_pack_extras;
