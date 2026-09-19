package aiservice

import "context"

// RelevanceResult - نتیجه‌ی بررسی اینکه آیا پاسخ آزاد کاربر واقعاً به سوال
// پاسخ داده یا نه. عمداً نمره‌ی عددی ندارد چون هیچ متن مرجعی برای مقایسه‌ی
// تلفظ/دقت وجود ندارد؛ فقط یک قضاوت کیفی + یک بازخورد کوتاه و عملی.
type RelevanceResult struct {
	Answered string `json:"answered"` // "yes" | "partial" | "no"
	Feedback string `json:"feedback"`
}

// relevanceSystemPrompt هم برای Claude، هم Gemini و هم DeepSeek استفاده می‌شود
// تا خروجی هر سه provider دقیقاً با یک اسکیمای JSON مطابقت داشته باشد.
const relevanceSystemPrompt = `You evaluate a spoken answer in a speaking-assessment app.
You are given a question/prompt the user was asked to speak about, and a transcript of what they actually said (from speech-to-text, may contain minor recognition errors).

Judge only whether they actually addressed the question — do NOT grade pronunciation, grammar, or vocabulary (no reference audio exists to compare against).

Rules:
- Output ONLY a single valid JSON object. No markdown, no code fences, no commentary.
- Match this exact schema:
{
  "answered": "yes" | "partial" | "no",
  "feedback": string (one short, actionable, encouraging sentence in English — never a bare score, e.g. "Try mentioning what size drink you'd like next time.")
}
- If the transcript is empty or unintelligible, use "no" with a gentle feedback sentence.`

// CheckAnswerRelevance پاسخ آزاد کاربر را با ارائه‌دهنده‌ی فعال بررسی می‌کند.
func (s Service) CheckAnswerRelevance(ctx context.Context, question, transcript string) (RelevanceResult, error) {
	var result RelevanceResult
	err := withLimit(ctx, func() error {
		var err error
		result, err = s.activeProvider().checkRelevance(ctx, question, transcript)
		return err
	})
	return result, err
}
