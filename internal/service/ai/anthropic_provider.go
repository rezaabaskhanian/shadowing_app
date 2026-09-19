package aiservice

import (
	"context"
	"encoding/json"
	"fmt"
	"strings"
	"sync"

	"shadowing-backend/internal/pkg/outboundhttp"
	"shadowing-backend/internal/pkg/richerror"
	settingsservice "shadowing-backend/internal/service/settings"

	"github.com/anthropics/anthropic-sdk-go"
	"github.com/anthropics/anthropic-sdk-go/option"
)

// anthropicProvider تولید محتوای صحنه با کمک مدل Claude را انجام می‌دهد.
// کلید API و مدل در لحظه‌ی هر درخواست از settings خوانده می‌شوند تا تغییر کلید
// از پنل ادمین بدون ری‌استارت سرور اعمال شود؛ کلاینت فقط وقتی کلید عوض شده بازسازی می‌شود.
type anthropicProvider struct {
	settings *settingsservice.Service

	mu          sync.Mutex
	cachedKey   string
	initialized bool
	client      anthropic.Client
}

func newAnthropicProvider(settings *settingsservice.Service) *anthropicProvider {
	return &anthropicProvider{settings: settings}
}

func (p *anthropicProvider) apiKey() string {
	return p.settings.Get(settingsservice.KeyAnthropicAPIKey)
}

func (p *anthropicProvider) model() anthropic.Model {
	model := p.settings.Get(settingsservice.KeyClaudeModel)
	if model == "" {
		return anthropic.ModelClaudeOpus4_8
	}
	return anthropic.Model(model)
}

func (p *anthropicProvider) enabled() bool {
	return p.apiKey() != ""
}

func (p *anthropicProvider) clientFor(key string) (anthropic.Client, error) {
	p.mu.Lock()
	defer p.mu.Unlock()
	if !p.initialized || key != p.cachedKey {
		httpClient, err := outboundhttp.Client()
		if err != nil {
			return anthropic.Client{}, err
		}
		p.client = anthropic.NewClient(option.WithAPIKey(key), option.WithHTTPClient(httpClient))
		p.cachedKey = key
		p.initialized = true
	}
	return p.client, nil
}

func (p *anthropicProvider) generateScene(ctx context.Context, prompt, difficulty string) (GeneratedScene, error) {
	const op = "aiservice.anthropicProvider.generateScene"

	key := p.apiKey()
	if key == "" {
		return GeneratedScene{}, richerror.New(op).WithMessage("کلید ANTHROPIC_API_KEY تنظیم نشده است")
	}

	userText := fmt.Sprintf("Situation: %s", strings.TrimSpace(prompt))
	if difficulty != "" {
		userText += fmt.Sprintf("\nDifficulty: %s", difficulty)
	}

	client, err := p.clientFor(key)
	if err != nil {
		return GeneratedScene{}, richerror.New(op).WithErr(err).
			WithMessage(fmt.Sprintf("خطا در تنظیم پراکسی خروجی: %v", err))
	}
	resp, err := client.Messages.New(ctx, anthropic.MessageNewParams{
		Model:     p.model(),
		MaxTokens: 8000,
		System: []anthropic.TextBlockParam{{
			Text: sceneSystemPrompt,
		}},
		Thinking: anthropic.ThinkingConfigParamUnion{
			OfAdaptive: &anthropic.ThinkingConfigAdaptiveParam{},
		},
		Messages: []anthropic.MessageParam{
			anthropic.NewUserMessage(anthropic.NewTextBlock(userText)),
		},
	})
	if err != nil {
		return GeneratedScene{}, richerror.New(op).WithErr(err).
			WithMessage(fmt.Sprintf("خطا در فراخوانی مدل هوش مصنوعی (Claude): %v", err))
	}

	// متن نهایی را از بلاک‌های پاسخ جمع می‌کنیم (بلاک‌های thinking نادیده گرفته می‌شوند)
	var raw strings.Builder
	for _, block := range resp.Content {
		if b, ok := block.AsAny().(anthropic.TextBlock); ok {
			raw.WriteString(b.Text)
		}
	}

	jsonStr := extractJSON(raw.String())
	var scene GeneratedScene
	if err := json.Unmarshal([]byte(jsonStr), &scene); err != nil {
		return GeneratedScene{}, richerror.New(op).WithErr(err).
			WithMessage("پاسخ مدل (Claude) قابل پردازش نبود")
	}

	if difficulty != "" {
		scene.Difficulty = difficulty
	}
	return scene, nil
}

func (p *anthropicProvider) checkGrammar(ctx context.Context, transcript string) (GrammarResult, error) {
	const op = "aiservice.anthropicProvider.checkGrammar"

	key := p.apiKey()
	if key == "" {
		return GrammarResult{}, richerror.New(op).WithMessage("کلید ANTHROPIC_API_KEY تنظیم نشده است")
	}

	client, err := p.clientFor(key)
	if err != nil {
		return GrammarResult{}, richerror.New(op).WithErr(err).
			WithMessage(fmt.Sprintf("خطا در تنظیم پراکسی خروجی: %v", err))
	}
	resp, err := client.Messages.New(ctx, anthropic.MessageNewParams{
		Model:     p.model(),
		MaxTokens: 300,
		System: []anthropic.TextBlockParam{{
			Text: grammarSystemPrompt,
		}},
		Messages: []anthropic.MessageParam{
			anthropic.NewUserMessage(anthropic.NewTextBlock(transcript)),
		},
	})
	if err != nil {
		return GrammarResult{}, richerror.New(op).WithErr(err).
			WithMessage(fmt.Sprintf("خطا در فراخوانی مدل هوش مصنوعی (Claude): %v", err))
	}

	var raw strings.Builder
	for _, block := range resp.Content {
		if b, ok := block.AsAny().(anthropic.TextBlock); ok {
			raw.WriteString(b.Text)
		}
	}

	jsonStr := extractJSON(raw.String())
	var result GrammarResult
	if err := json.Unmarshal([]byte(jsonStr), &result); err != nil {
		return GrammarResult{}, richerror.New(op).WithErr(err).
			WithMessage("پاسخ مدل (Claude) قابل پردازش نبود")
	}
	return result, nil
}

func (p *anthropicProvider) converse(ctx context.Context, sceneTitle, sceneDescription, sceneCategory string, history []ConversationTurn, turnNumber, maxTurns, wrapUpFromTurn int) (ConversationResult, error) {
	const op = "aiservice.anthropicProvider.converse"

	key := p.apiKey()
	if key == "" {
		return ConversationResult{}, richerror.New(op).WithMessage("کلید ANTHROPIC_API_KEY تنظیم نشده است")
	}

	systemPrompt := fmt.Sprintf(conversationSystemPromptTemplate, sceneTitle, sceneDescription, sceneCategory, turnNumber, maxTurns, wrapUpFromTurn)

	client, err := p.clientFor(key)
	if err != nil {
		return ConversationResult{}, richerror.New(op).WithErr(err).
			WithMessage(fmt.Sprintf("خطا در تنظیم پراکسی خروجی: %v", err))
	}

	msgs := make([]anthropic.MessageParam, 0, len(history)+1)
	for _, turn := range history {
		if turn.Role == "assistant" {
			msgs = append(msgs, anthropic.NewAssistantMessage(anthropic.NewTextBlock(turn.Text)))
		} else {
			msgs = append(msgs, anthropic.NewUserMessage(anthropic.NewTextBlock(turn.Text)))
		}
	}
	// Anthropic Messages API نیاز به حداقل یک پیام دارد که با user شروع شود؛
	// موقع باز کردن گفتگو (تاریخچه خالی) یک پیامِ ساختگی اضافه می‌شود.
	if len(msgs) == 0 {
		msgs = append(msgs, anthropic.NewUserMessage(anthropic.NewTextBlock("(Begin the conversation in character.)")))
	}

	resp, err := client.Messages.New(ctx, anthropic.MessageNewParams{
		Model:     p.model(),
		MaxTokens: 300,
		System: []anthropic.TextBlockParam{{
			Text: systemPrompt,
		}},
		Messages: msgs,
	})
	if err != nil {
		return ConversationResult{}, richerror.New(op).WithErr(err).
			WithMessage(fmt.Sprintf("خطا در فراخوانی مدل هوش مصنوعی (Claude): %v", err))
	}

	var raw strings.Builder
	for _, block := range resp.Content {
		if b, ok := block.AsAny().(anthropic.TextBlock); ok {
			raw.WriteString(b.Text)
		}
	}

	jsonStr := extractJSON(raw.String())
	var result ConversationResult
	if err := json.Unmarshal([]byte(jsonStr), &result); err != nil {
		return ConversationResult{}, richerror.New(op).WithErr(err).
			WithMessage("پاسخ مدل (Claude) قابل پردازش نبود")
	}
	result.Usage = TokenUsage{
		InputTokens:  int(resp.Usage.InputTokens),
		OutputTokens: int(resp.Usage.OutputTokens),
	}
	return result, nil
}

func (p *anthropicProvider) suggestReplies(ctx context.Context, sceneTitle, sceneDescription, sceneCategory, learnerLevel string, history []ConversationTurn) (SuggestResult, error) {
	const op = "aiservice.anthropicProvider.suggestReplies"

	key := p.apiKey()
	if key == "" {
		return SuggestResult{}, richerror.New(op).WithMessage("کلید ANTHROPIC_API_KEY تنظیم نشده است")
	}

	client, err := p.clientFor(key)
	if err != nil {
		return SuggestResult{}, richerror.New(op).WithErr(err).
			WithMessage(fmt.Sprintf("خطا در تنظیم پراکسی خروجی: %v", err))
	}
	resp, err := client.Messages.New(ctx, anthropic.MessageNewParams{
		Model:     p.model(),
		MaxTokens: 500,
		System: []anthropic.TextBlockParam{{
			Text: suggestSystemPrompt(sceneTitle, sceneDescription, sceneCategory, learnerLevel),
		}},
		Messages: []anthropic.MessageParam{
			anthropic.NewUserMessage(anthropic.NewTextBlock(formatSuggestTranscript(history))),
		},
	})
	if err != nil {
		return SuggestResult{}, richerror.New(op).WithErr(err).
			WithMessage(fmt.Sprintf("خطا در فراخوانی مدل هوش مصنوعی (Claude): %v", err))
	}

	var raw strings.Builder
	for _, block := range resp.Content {
		if b, ok := block.AsAny().(anthropic.TextBlock); ok {
			raw.WriteString(b.Text)
		}
	}

	jsonStr := extractJSON(raw.String())
	var result SuggestResult
	if err := json.Unmarshal([]byte(jsonStr), &result); err != nil {
		return SuggestResult{}, richerror.New(op).WithErr(err).
			WithMessage("پاسخ مدل (Claude) قابل پردازش نبود")
	}
	result.Usage = TokenUsage{
		InputTokens:  int(resp.Usage.InputTokens),
		OutputTokens: int(resp.Usage.OutputTokens),
	}
	return result, nil
}

func (p *anthropicProvider) checkRelevance(ctx context.Context, question, transcript string) (RelevanceResult, error) {
	const op = "aiservice.anthropicProvider.checkRelevance"

	key := p.apiKey()
	if key == "" {
		return RelevanceResult{}, richerror.New(op).WithMessage("کلید ANTHROPIC_API_KEY تنظیم نشده است")
	}

	userText := fmt.Sprintf("Question: %s\nTranscript: %s", strings.TrimSpace(question), strings.TrimSpace(transcript))

	client, err := p.clientFor(key)
	if err != nil {
		return RelevanceResult{}, richerror.New(op).WithErr(err).
			WithMessage(fmt.Sprintf("خطا در تنظیم پراکسی خروجی: %v", err))
	}
	resp, err := client.Messages.New(ctx, anthropic.MessageNewParams{
		Model:     p.model(),
		MaxTokens: 1024,
		System: []anthropic.TextBlockParam{{
			Text: relevanceSystemPrompt,
		}},
		Messages: []anthropic.MessageParam{
			anthropic.NewUserMessage(anthropic.NewTextBlock(userText)),
		},
	})
	if err != nil {
		return RelevanceResult{}, richerror.New(op).WithErr(err).
			WithMessage(fmt.Sprintf("خطا در فراخوانی مدل هوش مصنوعی (Claude): %v", err))
	}

	var raw strings.Builder
	for _, block := range resp.Content {
		if b, ok := block.AsAny().(anthropic.TextBlock); ok {
			raw.WriteString(b.Text)
		}
	}

	jsonStr := extractJSON(raw.String())
	var result RelevanceResult
	if err := json.Unmarshal([]byte(jsonStr), &result); err != nil {
		return RelevanceResult{}, richerror.New(op).WithErr(err).
			WithMessage("پاسخ مدل (Claude) قابل پردازش نبود")
	}
	return result, nil
}
