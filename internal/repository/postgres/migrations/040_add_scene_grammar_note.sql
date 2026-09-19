-- +migrate Up
-- نکته‌ی گرامریِ اختیاریِ هر صحنه: ادمین موضوع را تایپ می‌کند (مثلاً «Present
-- Simple»)؛ AI هنگام ساخت صحنه دیالوگ‌ها را طوری می‌سازد که آن نکته توشان به کار
-- برود، یک توضیح کوتاه فارسی می‌نویسد و ۲ تا ۴ جمله‌ی خودِ صحنه را به‌عنوان مثال
-- برمی‌گرداند. فقط یک نکته‌ی کوتاه برای هر صحنه، نه درس گرامر (بخش ۱۸ سند محصول).
-- grammar_examples آرایه‌ی JSON از {text, translation} است.
ALTER TABLE scenes ADD COLUMN IF NOT EXISTS grammar_topic TEXT;
ALTER TABLE scenes ADD COLUMN IF NOT EXISTS grammar_explanation TEXT;
ALTER TABLE scenes ADD COLUMN IF NOT EXISTS grammar_examples JSONB NOT NULL DEFAULT '[]'::jsonb;

-- +migrate Down
ALTER TABLE scenes DROP COLUMN IF EXISTS grammar_examples;
ALTER TABLE scenes DROP COLUMN IF EXISTS grammar_explanation;
ALTER TABLE scenes DROP COLUMN IF EXISTS grammar_topic;
