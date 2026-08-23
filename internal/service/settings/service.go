package settingsservice

import (
	"context"
	"os"
	"sync"
)

// کلیدهای شناخته‌شده‌ی تنظیمات قابل‌تغییر از پنل ادمین (بدون نیاز به ری‌استارت سرور).
const (
	KeyAIProvider        = "AI_PROVIDER"
	KeyAnthropicAPIKey   = "ANTHROPIC_API_KEY"
	KeyClaudeModel       = "CLAUDE_MODEL"
	KeyGeminiAPIKey      = "GEMINI_API_KEY"
	KeyGeminiModel       = "GEMINI_MODEL"
	KeyDeepSeekAPIKey    = "DEEPSEEK_API_KEY"
	KeyDeepSeekModel     = "DEEPSEEK_MODEL"
	KeyElevenLabsAPIKey  = "ELEVENLABS_API_KEY"
	KeyElevenLabsVoiceID = "ELEVENLABS_VOICE_ID"
	KeyFCMServiceAccount = "FCM_SERVICE_ACCOUNT_JSON"
)

// AllowedKeys برای اعتبارسنجی درخواست‌های به‌روزرسانی از پنل ادمین استفاده می‌شود.
var AllowedKeys = map[string]bool{
	KeyAIProvider:        true,
	KeyAnthropicAPIKey:   true,
	KeyClaudeModel:       true,
	KeyGeminiAPIKey:      true,
	KeyGeminiModel:       true,
	KeyDeepSeekAPIKey:    true,
	KeyDeepSeekModel:     true,
	KeyElevenLabsAPIKey:  true,
	KeyElevenLabsVoiceID: true,
	KeyFCMServiceAccount: true,
}

type repository interface {
	GetAll(ctx context.Context) (map[string]string, error)
	Set(ctx context.Context, key, value string) error
}

// Service مقادیر تنظیمات (مثل کلیدهای API) را از دیتابیس می‌خواند و در حافظه کش می‌کند
// تا تغییر آن‌ها از پنل ادمین بدون نیاز به ری‌استارت سرور اعمال شود. اگر مقداری در
// دیتابیس نباشد، به متغیر محیطی (.env) به همان نام فال‌بک می‌شود.
type Service struct {
	repo repository

	mu    sync.RWMutex
	cache map[string]string
}

func New(repo repository) *Service {
	return &Service{repo: repo, cache: map[string]string{}}
}

// LoadAll مقادیر ذخیره‌شده در دیتابیس را در ابتدای اجرای سرور در کش بارگذاری می‌کند.
func (s *Service) LoadAll(ctx context.Context) error {
	values, err := s.repo.GetAll(ctx)
	if err != nil {
		return err
	}
	s.mu.Lock()
	defer s.mu.Unlock()
	s.cache = values
	return nil
}

// Get مقدار یک کلید را برمی‌گرداند: اول از کش (دیتابیس)، در نبود آن از متغیر محیطی.
func (s *Service) Get(key string) string {
	s.mu.RLock()
	v, ok := s.cache[key]
	s.mu.RUnlock()
	if ok && v != "" {
		return v
	}
	return os.Getenv(key)
}

// Set مقدار یک کلید را در دیتابیس ذخیره و بلافاصله کش را به‌روز می‌کند.
func (s *Service) Set(ctx context.Context, key, value string) error {
	if err := s.repo.Set(ctx, key, value); err != nil {
		return err
	}
	s.mu.Lock()
	s.cache[key] = value
	s.mu.Unlock()
	return nil
}

// IsSet مشخص می‌کند مقدار کلید (چه از دیتابیس، چه از env) خالی نیست.
func (s *Service) IsSet(key string) bool {
	return s.Get(key) != ""
}
