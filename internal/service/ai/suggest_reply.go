package aiservice

import (
	"context"
	"fmt"
	"strings"
)

// ReplySuggestion - یک جمله‌ی پیشنهادی برای جواب‌دادنِ کاربر به AI، همراه با
// ترجمه‌ی فارسی (بخش ۱۹ سند محصول: راهنمایی دوزبانه برای مبتدی‌ها).
type ReplySuggestion struct {
	Text          string `json:"text"`
	TranslationFA string `json:"translation_fa"`
}

// SuggestResult - پیشنهادهای جواب برای آخرین پیامِ AI.
type SuggestResult struct {
	Suggestions []ReplySuggestion `json:"suggestions"`
	Usage       TokenUsage        `json:"-"`
}

// suggestSystemPromptTemplate هم برای Claude، هم Gemini و هم DeepSeek
// استفاده می‌شود. سطحِ کاربر مستقیم داخل پرامپت می‌آید تا جمله‌ها از توانِ
// او بالاتر نباشند؛ اگر سطح نامشخص باشد، مبتدی فرض می‌شود.
const suggestSystemPromptTemplate = `You help a Persian-speaking English learner who is stuck in the middle of a spoken practice conversation and doesn't know what to say next.

Scene title: "%s"
Scene description: %s
Scene category: %s
Learner level (CEFR): %s

You will receive the conversation so far. The last line is what the character just said. Suggest what the learner could say back.

Rules:
- Give exactly 2 suggestions that both directly and naturally answer the character's last message, but with different wording or a different answer (for example one short and simple, one slightly fuller) so the learner has a real choice.
- Each suggestion is ONE short spoken sentence (max ~12 words) that a learner at the given level can actually say out loud. Use simple, common vocabulary. If the level is unknown, assume a beginner.
- Do not repeat the character's words back and do not ask the character a question unless the last message clearly invites it.
- "translation_fa" is a natural Persian translation of that sentence (meaning, not word-for-word).
- Output ONLY a single valid JSON object, no markdown, no commentary:
{"suggestions": [{"text": string, "translation_fa": string}, {"text": string, "translation_fa": string}]}`

// formatSuggestTranscript تاریخچه را به یک متنِ ساده تبدیل می‌کند که در یک
// پیامِ user فرستاده شود. عمداً به‌جای نقش‌های user/assistant استفاده شده تا
// همه‌ی ارائه‌دهنده‌ها (که برخی نیاز دارند آخرین نقش user باشد) یک‌شکل عمل کنند.
func formatSuggestTranscript(history []ConversationTurn) string {
	var b strings.Builder
	b.WriteString("Conversation so far:\n")
	for _, turn := range history {
		speaker := "Character"
		if turn.Role == "user" {
			speaker = "Learner"
		}
		fmt.Fprintf(&b, "%s: %s\n", speaker, turn.Text)
	}
	b.WriteString("\nSuggest what the learner could say next.")
	return b.String()
}

func suggestSystemPrompt(sceneTitle, sceneDescription, sceneCategory, learnerLevel string) string {
	if strings.TrimSpace(learnerLevel) == "" {
		learnerLevel = "unknown (assume beginner)"
	}
	return fmt.Sprintf(suggestSystemPromptTemplate, sceneTitle, sceneDescription, sceneCategory, learnerLevel)
}

// SuggestReplies برای آخرین پیامِ AI در گفتگو، دو جوابِ پیشنهادی (انگلیسی +
// ترجمه‌ی فارسی) با ارائه‌دهنده‌ی فعال می‌سازد. history باید به پیامِ AI ختم شود.
func (s Service) SuggestReplies(ctx context.Context, sceneTitle, sceneDescription, sceneCategory, learnerLevel string, history []ConversationTurn) (SuggestResult, error) {
	var result SuggestResult
	err := withLimit(ctx, func() error {
		var err error
		result, err = s.activeProvider().suggestReplies(ctx, sceneTitle, sceneDescription, sceneCategory, learnerLevel, history)
		return err
	})
	return result, err
}
