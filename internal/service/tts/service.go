package ttsservice

import (
	"context"
	"fmt"
	"log/slog"
	"strings"

	settingsservice "shadowing-backend/internal/service/settings"
)

// نام providerهای TTS که در تنظیم TTS_PROVIDER پذیرفته می‌شوند.
const (
	ProviderElevenLabs = "elevenlabs"
	ProviderGemini     = "gemini"
	ProviderOpenRouter = "openrouter"
	ProviderGroq       = "groq"
)

// Voice یک صدای در دسترس را نشان می‌دهد (برای انتخاب مرد/زن در پنل).
type Voice struct {
	VoiceID string `json:"voice_id"`
	Name    string `json:"name"`
	Gender  string `json:"gender"`
	Accent  string `json:"accent"`
}

// Audio خروجیِ نهاییِ یک درخواست TTS است؛ ContentType و Ext برای ذخیره‌ی
// درست فایل لازم‌اند چون فرمت خروجی بسته به provider فرق می‌کند (mp3 یا wav).
type Audio struct {
	Data        []byte
	ContentType string
	Ext         string
}

type provider interface {
	enabled() bool
	missingKeyMessage() string
	generateSpeech(ctx context.Context, text, voiceID string, speed float64) (Audio, error)
	listVoices(ctx context.Context) ([]Voice, error)
}

// Service بین providerهای TTS (ElevenLabs / Gemini / OpenRouter / Groq) بر اساس تنظیم TTS_PROVIDER
// سوییچ می‌کند. مقدار در لحظه‌ی هر درخواست از settings خوانده می‌شود تا تغییر
// آن از پنل ادمین بدون ری‌استارت سرور اعمال شود.
type Service struct {
	settings   *settingsservice.Service
	elevenLabs provider
	gemini     provider
	openRouter provider
	groq       provider
}

func New(settings *settingsservice.Service) Service {
	return Service{
		settings:   settings,
		elevenLabs: newElevenLabsProvider(settings),
		gemini:     newGeminiProvider(settings),
		openRouter: newOpenRouterProvider(settings),
		groq:       newGroqProvider(settings),
	}
}

// ProviderName نام provider فعال را برمی‌گرداند؛ پیش‌فرض elevenlabs است تا
// رفتار فعلی بدون تنظیم جدید عوض نشود.
func (s Service) ProviderName() string {
	switch strings.ToLower(strings.TrimSpace(s.settings.Get(settingsservice.KeyTTSProvider))) {
	case ProviderGemini:
		return ProviderGemini
	case ProviderOpenRouter:
		return ProviderOpenRouter
	case ProviderGroq:
		return ProviderGroq
	default:
		return ProviderElevenLabs
	}
}

func (s Service) active() provider {
	switch s.ProviderName() {
	case ProviderGemini:
		return s.gemini
	case ProviderOpenRouter:
		return s.openRouter
	case ProviderGroq:
		return s.groq
	default:
		return s.elevenLabs
	}
}

// Enabled مشخص می‌کند آیا حداقل یک provider برای TTS فعال است یا نه.
func (s Service) Enabled() bool {
	return s.active().enabled() || s.gemini.enabled() || s.groq.enabled() || s.openRouter.enabled()
}

// MissingKeyMessage پیام خطای مناسب provider فعال وقتی کلیدش تنظیم نشده.
func (s Service) MissingKeyMessage() string {
	return s.active().missingKeyMessage()
}

// GenerateSpeech متن را با provider فعال به صدا تبدیل می‌کند و در صورت خطا به Gemini و سایر سرویس‌ها فال‌بک می‌زند.
// اگر voiceID خالی باشد از صدای پیش‌فرض تنظیمات همان provider استفاده می‌شود.
// speed سرعت گفتار است (بازه‌ی ۰.۷ تا ۱.۲؛ ۰ یعنی مقدار پیش‌فرض ۱.۰).
func (s Service) GenerateSpeech(ctx context.Context, text, voiceID string, speed float64) (Audio, error) {
	// ۱. تلاش با Provider فعال (مثلاً ElevenLabs اگر کلیدش تنظیم باشد)
	act := s.active()
	if act.enabled() {
		aud, err := act.generateSpeech(ctx, text, voiceID, speed)
		if err == nil && len(aud.Data) > 0 {
			return aud, nil
		}
		slog.Warn("tts: primary provider failed, attempting fallback", "provider", s.ProviderName(), "err", err)
	}

	// ۲. فال‌بک هوشمند به Gemini TTS (از کلید مشترک GEMINI_API_KEY استفاده می‌کند و هزینه سرور را پایین می‌آورد)
	if s.gemini.enabled() && s.ProviderName() != ProviderGemini {
		aud, err := s.gemini.generateSpeech(ctx, text, voiceID, speed)
		if err == nil && len(aud.Data) > 0 {
			return aud, nil
		}
		slog.Warn("tts: gemini fallback failed", "err", err)
	}

	// ۳. فال‌بک به Groq
	if s.groq.enabled() && s.ProviderName() != ProviderGroq {
		aud, err := s.groq.generateSpeech(ctx, text, voiceID, speed)
		if err == nil && len(aud.Data) > 0 {
			return aud, nil
		}
	}

	// ۴. فال‌بک به OpenRouter
	if s.openRouter.enabled() && s.ProviderName() != ProviderOpenRouter {
		aud, err := s.openRouter.generateSpeech(ctx, text, voiceID, speed)
		if err == nil && len(aud.Data) > 0 {
			return aud, nil
		}
	}

	return Audio{}, fmt.Errorf("all tts providers failed or disabled")
}

// ListVoices صداهای در دسترسِ provider فعال را برمی‌گرداند.
func (s Service) ListVoices(ctx context.Context) ([]Voice, error) {
	return s.active().listVoices(ctx)
}
