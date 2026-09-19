-- +migrate Up
-- مصرف توکنِ واقعیِ هر فراخوانیِ converse() (که تا الان اصلاً ذخیره نمی‌شد)
-- حالا هم روی خودِ نوبت (برای گزارش/دیباگِ دقیق هر نوبت) و هم به‌صورت
-- تجمیعی روی گفتگو (برای گزارش هزینه/سقف‌گذاریِ سریع بدون SUM روی turns)
-- ذخیره می‌شود. نوبت‌های user توکن ندارند (input_tokens/output_tokens آن‌ها
-- NULL می‌ماند) چون converse() فقط برای پاسخِ assistant صدا زده می‌شود.
ALTER TABLE ai_conversation_turns ADD COLUMN IF NOT EXISTS input_tokens INT;
ALTER TABLE ai_conversation_turns ADD COLUMN IF NOT EXISTS output_tokens INT;

ALTER TABLE ai_conversations ADD COLUMN IF NOT EXISTS total_input_tokens INT NOT NULL DEFAULT 0;
ALTER TABLE ai_conversations ADD COLUMN IF NOT EXISTS total_output_tokens INT NOT NULL DEFAULT 0;

-- +migrate Down
ALTER TABLE ai_conversations DROP COLUMN IF EXISTS total_output_tokens;
ALTER TABLE ai_conversations DROP COLUMN IF EXISTS total_input_tokens;
ALTER TABLE ai_conversation_turns DROP COLUMN IF EXISTS output_tokens;
ALTER TABLE ai_conversation_turns DROP COLUMN IF EXISTS input_tokens;
