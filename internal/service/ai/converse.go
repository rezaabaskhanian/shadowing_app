package aiservice

import "context"

// ConversationTurn - یک نوبتِ قبلیِ گفتگو (برای ساختِ تاریخچه‌ی چندنوبتی).
type ConversationTurn struct {
	Role string // "user" یا "assistant"
	Text string
}

// ConversationResult - پاسخ AI در نقشِ شخصیتِ صحنه + سیگنال پایانِ گفتگو.
type ConversationResult struct {
	Reply     string `json:"reply"`
	ShouldEnd bool   `json:"should_end"`
}

// conversationSystemPromptTemplate هم برای Claude، هم Gemini و هم DeepSeek
// استفاده می‌شود. turnNumber/maxTurns/wrapUpFromTurn به‌جای وابستگی به
// aiconversation (که یک پکیجِ domain است و aiservice نباید به آن وابسته
// شود) به‌صورت آرگومانِ ساده به Converse پاس داده می‌شوند.
const conversationSystemPromptTemplate = `You are roleplaying as a character inside an English-speaking practice scenario for a language learner.

Scene title: "%s"
Scene description: %s
Scene category: %s

Infer a suitable character to play from the scene above (e.g. a coffee-shop scene -> play the barista; a doctor's-visit scene -> play the doctor) and stay fully in character for the whole conversation. Never break character and never mention you are an AI.

Rules:
- Keep replies short and natural, like real spoken dialogue (1-3 sentences).
- Keep vocabulary and grammar approachable for a language learner.
- This is turn %d of a conversation capped at %d user turns.
- From turn %d onward, start naturally wrapping up (say goodbye / conclude the interaction) and set "should_end": true.
- If the conversation history is empty, this call is to open the conversation: greet the learner in character and ask an opening question relevant to the scene; do not set should_end.
- Output ONLY a single valid JSON object, no markdown, no commentary:
{"reply": string, "should_end": boolean}`

// Converse یک نوبتِ گفتگوی آزاد را با ارائه‌دهنده‌ی فعال پاسخ می‌دهد.
func (s Service) Converse(ctx context.Context, sceneTitle, sceneDescription, sceneCategory string, history []ConversationTurn, turnNumber, maxTurns, wrapUpFromTurn int) (ConversationResult, error) {
	return s.activeProvider().converse(ctx, sceneTitle, sceneDescription, sceneCategory, history, turnNumber, maxTurns, wrapUpFromTurn)
}
