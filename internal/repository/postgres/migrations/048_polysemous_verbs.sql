-- +migrate Up
-- افعال چندمعنایی (get, take, ...): هر فعل چند معنا دارد و هر معنا به
-- جمله‌های واقعی درس‌ها وصل می‌شود. امتیاز (XP) عمداً ندارد.

CREATE TABLE IF NOT EXISTS verbs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lemma TEXT NOT NULL UNIQUE,
    -- همه‌ی شکل‌های صرفی که در جست‌وجوی دیالوگ‌ها دنبالشان می‌گردیم
    forms TEXT[] NOT NULL DEFAULT '{}',
    sort_order INT NOT NULL DEFAULT 0,
    is_published BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS verb_meanings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    verb_id UUID NOT NULL REFERENCES verbs(id) ON DELETE CASCADE,
    meaning_fa TEXT NOT NULL,
    explanation_fa TEXT NOT NULL DEFAULT '',
    -- مثال پشتیبان وقتی هنوز هیچ جمله‌ی تأییدشده‌ای از درس‌ها ندارد
    fallback_example TEXT NOT NULL DEFAULT '',
    -- موقعیت فارسی برای تمرین صوتی («به دوستت بگو سرما خورده‌ای.»)
    practice_prompt_fa TEXT NOT NULL DEFAULT '',
    sort_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_verb_meanings_verb ON verb_meanings(verb_id);

-- جمله‌ای از یک درس که فعل در آن آمده. عمداً به dialogues.id وصل نیست:
-- ویرایش صحنه همه‌ی دیالوگ‌ها را با شناسه‌ی تازه از نو می‌سازد، پس با
-- (scene_id, sentence) نگه داشته و هنگام خواندن با متن دیالوگ جفت می‌شود؛
-- تأیید ادمین با ویرایش صحنه از بین نمی‌رود.
CREATE TABLE IF NOT EXISTS verb_occurrences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    verb_id UUID NOT NULL REFERENCES verbs(id) ON DELETE CASCADE,
    meaning_id UUID REFERENCES verb_meanings(id) ON DELETE SET NULL,
    scene_id UUID NOT NULL REFERENCES scenes(id) ON DELETE CASCADE,
    sentence TEXT NOT NULL,
    matched_form TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'suggested' CHECK (status IN ('suggested', 'approved', 'rejected')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (verb_id, scene_id, sentence)
);
CREATE INDEX IF NOT EXISTS idx_verb_occurrences_scene ON verb_occurrences(scene_id);

CREATE TABLE IF NOT EXISTS user_verb_progress (
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    meaning_id UUID NOT NULL REFERENCES verb_meanings(id) ON DELETE CASCADE,
    seen_at TIMESTAMPTZ,
    -- جواب درست آزمون تشخیص، حداکثر یکی در هر روز شمرده می‌شود
    recognition_correct INT NOT NULL DEFAULT 0,
    last_recognition_date DATE,
    spoken_ok BOOLEAN NOT NULL DEFAULT false,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (user_id, meaning_id)
);

-- کارت لایتنرِ یک معنای مشخص (جلو: جمله‌ی مثال، پشت: معنا).
ALTER TABLE leitner_words
    ADD COLUMN IF NOT EXISTS verb_meaning_id UUID REFERENCES verb_meanings(id) ON DELETE SET NULL;

-- ۱۶ فعل اول، منتشرنشده و بدون معنا؛ ادمین معناها را (با کمک AI) در پنل می‌سازد.
INSERT INTO verbs (lemma, forms, sort_order) VALUES
    ('get',    '{get,gets,got,gotten,getting}', 1),
    ('take',   '{take,takes,took,taken,taking}', 2),
    ('make',   '{make,makes,made,making}', 3),
    ('go',     '{go,goes,went,gone,going}', 4),
    ('come',   '{come,comes,came,coming}', 5),
    ('have',   '{have,has,had,having}', 6),
    ('put',    '{put,puts,putting}', 7),
    ('run',    '{run,runs,ran,running}', 8),
    ('turn',   '{turn,turns,turned,turning}', 9),
    ('keep',   '{keep,keeps,kept,keeping}', 10),
    ('work',   '{work,works,worked,working}', 11),
    ('break',  '{break,breaks,broke,broken,breaking}', 12),
    ('look',   '{look,looks,looked,looking}', 13),
    ('hold',   '{hold,holds,held,holding}', 14),
    ('see',    '{see,sees,saw,seen,seeing}', 15),
    ('follow', '{follow,follows,followed,following}', 16)
ON CONFLICT (lemma) DO NOTHING;

-- +migrate Down
ALTER TABLE leitner_words DROP COLUMN IF EXISTS verb_meaning_id;
DROP TABLE IF EXISTS user_verb_progress;
DROP TABLE IF EXISTS verb_occurrences;
DROP TABLE IF EXISTS verb_meanings;
DROP TABLE IF EXISTS verbs;
