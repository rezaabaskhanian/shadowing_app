package ttsservice

import (
	"context"
	"strings"

	settingsservice "shadowing-backend/internal/service/settings"
)

// نام providerهای TTS که در تنظیم TTS_PROVIDER پذیرفته می‌شوند.
const (
	ProviderElevenLabs = "elevenlabs"
	ProviderGemini     = "gemini"
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

// Service بین providerهای TTS (ElevenLabs / Gemini) بر اساس تنظیم TTS_PROVIDER
// سوییچ می‌کند. مقدار در لحظه‌ی هر درخواست از settings خوانده می‌شود تا تغییر
// آن از پنل ادمین بدون ری‌استارت سرور اعمال شود.
type Service struct {
	settings   *settingsservice.Service
	elevenLabs provider
	gemini     provider
}

func New(settings *settingsservice.Service) Service {
	return Service{
		settings:   settings,
		elevenLabs: newElevenLabsProvider(settings),
		gemini:     newGeminiProvider(settings),
	}
}

// ProviderName نام provider فعال را برمی‌گرداند؛ پیش‌فرض elevenlabs است تا
// رفتار فعلی بدون تنظیم جدید عوض نشود.
func (s Service) ProviderName() string {
	if strings.EqualFold(strings.TrimSpace(s.settings.Get(settingsservice.KeyTTSProvider)), ProviderGemini) {
		return ProviderGemini
	}
	return ProviderElevenLabs
}

func (s Service) active() provider {
	if s.ProviderName() == ProviderGemini {
		return s.gemini
	}
	return s.elevenLabs
}

// Enabled مشخص می‌کند آیا کلید API برای provider فعال تنظیم شده است یا نه.
func (s Service) Enabled() bool {
	return s.active().enabled()
}

// MissingKeyMessage پیام خطای مناسب provider فعال وقتی کلیدش تنظیم نشده.
func (s Service) MissingKeyMessage() string {
	return s.active().missingKeyMessage()
}

// GenerateSpeech متن را با provider فعال به صدا تبدیل می‌کند.
// اگر voiceID خالی باشد از صدای پیش‌فرض تنظیمات همان provider استفاده می‌شود.
// speed سرعت گفتار است (بازه‌ی ۰.۷ تا ۱.۲؛ ۰ یعنی مقدار پیش‌فرض ۱.۰).
func (s Service) GenerateSpeech(ctx context.Context, text, voiceID string, speed float64) (Audio, error) {
	return s.active().generateSpeech(ctx, text, voiceID, speed)
}

// ListVoices صداهای در دسترسِ provider فعال را برمی‌گرداند.
func (s Service) ListVoices(ctx context.Context) ([]Voice, error) {
	return s.active().listVoices(ctx)
}
