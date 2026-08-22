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
