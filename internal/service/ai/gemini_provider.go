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

	"google.golang.org/genai"
)

// geminiProvider تولید محتوای صحنه با کمک مدل Gemini را انجام می‌دهد.
// کلید API و مدل در لحظه‌ی هر درخواست از settings خوانده می‌شوند تا تغییر کلید
// از پنل ادمین بدون ری‌استارت سرور اعمال شود؛ کلاینت فقط وقتی کلید عوض شده بازسازی می‌شود.
type geminiProvider struct {
	settings *settingsservice.Service

	mu          sync.Mutex
	cachedKey   string
	initialized bool
	client      *genai.Client
}

func newGeminiProvider(settings *settingsservice.Service) *geminiProvider {
	return &geminiProvider{settings: settings}
}

func (p *geminiProvider) apiKey() string {
	return p.settings.Get(settingsservice.KeyGeminiAPIKey)
}

func (p *geminiProvider) model() string {
	model := p.settings.Get(settingsservice.KeyGeminiModel)
	if model == "" {
		return "gemini-flash-latest"
	}
	return model
}

func (p *geminiProvider) enabled() bool {
	return p.apiKey() != ""
}

func (p *geminiProvider) clientFor(ctx context.Context, key string) (*genai.Client, error) {
	p.mu.Lock()
	defer p.mu.Unlock()
	if p.initialized && key == p.cachedKey {
		return p.client, nil
	}
	httpClient, err := outboundhttp.Client()
	if err != nil {
		return nil, err
	}

	client, err := genai.NewClient(ctx, &genai.ClientConfig{
		APIKey:     key,
		Backend:    genai.BackendGeminiAPI,
		HTTPClient: httpClient,
	})
	if err != nil {
		return nil, err
	}
	p.client = client
	p.cachedKey = key
	p.initialized = true
	return p.client, nil
}

func (p *geminiProvider) generateScene(ctx context.Context, prompt, difficulty string) (GeneratedScene, error) {
	const op = "aiservice.geminiProvider.generateScene"

	key := p.apiKey()
	if key == "" {
		return GeneratedScene{}, richerror.New(op).WithMessage("کلید GEMINI_API_KEY تنظیم نشده است")
	}

	client, err := p.clientFor(ctx, key)
	if err != nil {
		return GeneratedScene{}, richerror.New(op).WithErr(err).
			WithMessage(fmt.Sprintf("خطا در ساخت کلاینت Gemini: %v", err))
	}

	userText := fmt.Sprintf("Situation: %s", strings.TrimSpace(prompt))
	if difficulty != "" {
		userText += fmt.Sprintf("\nDifficulty: %s", difficulty)
	}

	resp, err := client.Models.GenerateContent(
		ctx,
		p.model(),
		genai.Text(userText),
		&genai.GenerateContentConfig{
			SystemInstruction: genai.NewContentFromText(sceneSystemPrompt, genai.RoleUser),
			ResponseMIMEType:  "application/json",
		},
	)
	if err != nil {
		return GeneratedScene{}, richerror.New(op).WithErr(err).
			WithMessage(fmt.Sprintf("خطا در فراخوانی مدل هوش مصنوعی (Gemini): %v", err))
	}

	jsonStr := extractJSON(resp.Text())
	var scene GeneratedScene
	if err := json.Unmarshal([]byte(jsonStr), &scene); err != nil {
		return GeneratedScene{}, richerror.New(op).WithErr(err).
			WithMessage("پاسخ مدل (Gemini) قابل پردازش نبود")
	}

	if difficulty != "" {
		scene.Difficulty = difficulty
	}
	return scene, nil
}
