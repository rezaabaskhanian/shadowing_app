package aiservice

import (
	"context"
	"strings"

	settingsservice "shadowing-backend/internal/service/settings"
)

// provider رابط مشترک بین ارائه‌دهنده‌های مختلف هوش مصنوعی (Claude, Gemini) است.
type provider interface {
	generateScene(ctx context.Context, prompt, difficulty string) (GeneratedScene, error)
	enabled() bool
}

// Service تولید محتوای صحنه با کمک یک مدل هوش مصنوعی را انجام می‌دهد.
// ارائه‌دهنده‌ی فعال از تنظیمات (AI_PROVIDER در پنل ادمین یا .env) خوانده می‌شود:
// anthropic (پیش‌فرض) یا gemini. چون هر دو provider کلید/مدل را در لحظه‌ی هر
// درخواست از settings می‌خوانند، تغییر از پنل ادمین بدون ری‌استارت سرور اعمال می‌شود.
type Service struct {
	settings  *settingsservice.Service
	anthropic *anthropicProvider
	gemini    *geminiProvider
}

func New(settings *settingsservice.Service) Service {
	return Service{
		settings:  settings,
		anthropic: newAnthropicProvider(settings),
		gemini:    newGeminiProvider(settings),
	}
}

func (s Service) activeProvider() provider {
	if strings.ToLower(strings.TrimSpace(s.settings.Get(settingsservice.KeyAIProvider))) == "gemini" {
		return s.gemini
	}
	return s.anthropic
}

// Enabled مشخص می‌کند آیا کلید API ارائه‌دهنده‌ی فعال تنظیم شده است یا نه.
func (s Service) Enabled() bool {
	return s.activeProvider().enabled()
}

// GenerateScene محتوای یک صحنه را با ارائه‌دهنده‌ی فعال تولید می‌کند.
func (s Service) GenerateScene(ctx context.Context, prompt, difficulty string) (GeneratedScene, error) {
	return s.activeProvider().generateScene(ctx, prompt, difficulty)
}
