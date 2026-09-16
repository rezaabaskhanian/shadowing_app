package aiservice

import "context"

// GrammarResult - اصلاح گرامری متن آزادانه‌ی کاربر (نه دیالوگ‌های شدوئینگ —
// آن‌ها تکرار یک جمله‌ی مرجع‌اند، جای اصلاح ندارند). اگر خطای گرامریِ
// قابل‌توجهی نباشد، Corrected/Explanation خالی می‌مانند.
type GrammarResult struct {
	Corrected   string `json:"corrected"`
	Explanation string `json:"explanation"`
}

// grammarSystemPrompt هم برای Claude، هم Gemini و هم DeepSeek استفاده می‌شود.
const grammarSystemPrompt = `You review a transcript of a language learner's spoken English (from speech-to-text, may contain minor recognition errors) for grammar mistakes.

Rules:
- Only flag a genuine grammar mistake (verb tense, subject-verb agreement, articles, prepositions, word order). Ignore filler words, minor disfluencies, and recognition artifacts.
- If there is one clear mistake, output the corrected full sentence and ONE short, encouraging, actionable explanation (like a teacher, not a red pen) — e.g. "Use past tense because the action happened yesterday."
- If there are multiple mistakes, fix only the most important one — never overwhelm a learner with a list.
- If the sentence is already correct (or too short/unclear to judge), leave both fields as empty strings.
- Output ONLY a single valid JSON object. No markdown, no commentary.
{"corrected": string, "explanation": string}`

// CheckGrammar متن آزادانه‌ی کاربر را با ارائه‌دهنده‌ی فعال بررسی می‌کند.
func (s Service) CheckGrammar(ctx context.Context, transcript string) (GrammarResult, error) {
	return s.activeProvider().checkGrammar(ctx, transcript)
}
