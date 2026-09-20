package aiservice

import (
	"context"
	"strings"

	settingsservice "shadowing-backend/internal/service/settings"
)

// provider رابط مشترک بین ارائه‌دهنده‌های مختلف هوش مصنوعی (Claude, Gemini, DeepSeek) است.
type provider interface {
	generateScene(ctx context.Context, prompt, difficulty string) (GeneratedScene, error)
	checkRelevance(ctx context.Context, question, transcript string) (RelevanceResult, error)
	checkGrammar(ctx context.Context, transcript string) (GrammarResult, error)
	converse(ctx context.Context, sceneTitle, sceneDescription, sceneCategory string, history []ConversationTurn, turnNumber, maxTurns, wrapUpFromTurn int) (ConversationResult, error)
	suggestReplies(ctx context.Context, sceneTitle, sceneDescription, sceneCategory, learnerLevel string, history []ConversationTurn) (SuggestResult, error)
	enabled() bool
}

// Service تولید محتوای صحنه با کمک یک مدل هوش مصنوعی را انجام می‌دهد.
// ارائه‌دهنده‌ی فعال از تنظیمات (AI_PROVIDER در پنل ادمین یا .env) خوانده می‌شود:
// anthropic (پیش‌فرض)، gemini یا deepseek. چون هر provider کلید/مدل را در لحظه‌ی هر
// درخواست از settings می‌خواند، تغییر از پنل ادمین بدون ری‌استارت سرور اعمال می‌شود.
type Service struct {
	settings   *settingsservice.Service
	anthropic  *anthropicProvider
	gemini     *geminiProvider
	deepseek   *deepseekProvider
	openrouter *openRouterProvider
}

func New(settings *settingsservice.Service) Service {
	return Service{
		settings:   settings,
		anthropic:  newAnthropicProvider(settings),
		gemini:     newGeminiProvider(settings),
		deepseek:   newDeepSeekProvider(settings),
		openrouter: newOpenRouterProvider(settings),
	}
}

func (s Service) activeProvider() provider {
	switch strings.ToLower(strings.TrimSpace(s.settings.Get(settingsservice.KeyAIProvider))) {
	case "gemini":
		return s.gemini
	case "deepseek":
		return s.deepseek
	case "openrouter":
		return s.openrouter
	default:
		return s.anthropic
	}
}

// Enabled مشخص می‌کند آیا کلید API ارائه‌دهنده‌ی فعال تنظیم شده است یا نه.
func (s Service) Enabled() bool {
	return s.activeProvider().enabled()
}

// GenerateScene محتوای یک صحنه را با ارائه‌دهنده‌ی فعال تولید می‌کند. اگر
// grammarTopic خالی نباشد، مدل دیالوگ‌ها را طوری می‌سازد که آن نکته توشان به کار
// برود و توضیحِ فارسی + مثال‌هایی از خودِ دیالوگ‌ها هم برمی‌گرداند (GrammarNote).
func (s Service) GenerateScene(ctx context.Context, prompt, difficulty, grammarTopic string) (GeneratedScene, error) {
	grammarTopic = strings.TrimSpace(grammarTopic)
	if grammarTopic != "" {
		// ارائه‌دهنده‌ها فقط prompt را به‌عنوان متن کاربر می‌فرستند؛ موضوعِ گرامری
		// را همان‌جا، در یک خطِ مشخص که sceneSystemPrompt به آن ارجاع می‌دهد، می‌گذاریم.
		prompt = prompt + "\n" + grammarFocusPrefix + " " + grammarTopic
	}

	var result GeneratedScene
	err := withLimit(ctx, func() error {
		var err error
		result, err = s.activeProvider().generateScene(ctx, prompt, difficulty)
		return err
	})
	if err != nil {
		return result, err
	}

	if grammarTopic == "" {
		// ادمین موضوعی نداده؛ هر grammar_noteی که مدل خودسرانه اضافه کرده دور ریخته می‌شود.
		result.GrammarNote = nil
	} else {
		resolveGrammarNote(&result)
	}
	return result, nil
}
