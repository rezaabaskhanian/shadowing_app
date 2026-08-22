package ttsservice

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"

	"shadowing-backend/internal/pkg/outboundhttp"
	"shadowing-backend/internal/pkg/richerror"
	settingsservice "shadowing-backend/internal/service/settings"
)

// defaultVoiceID یک صدای عمومی انگلیسی (Rachel) در ElevenLabs است که برای هر
// حساب در دسترس است؛ اگر ELEVENLABS_VOICE_ID تنظیم نشده باشد از همین استفاده می‌شود.
const defaultVoiceID = "21m00Tcm4TlvDq8ikWAM"

// بازه‌ی مجاز سرعت گفتار طبق مستندات ElevenLabs (voice_settings.speed).
const (
	defaultSpeed = 1.0
	minSpeed     = 0.7
	maxSpeed     = 1.2
)

const ttsEndpoint = "https://api.elevenlabs.io/v1/text-to-speech/"
const voicesEndpoint = "https://api.elevenlabs.io/v1/voices"

// Voice یک صدای در دسترسِ حساب ElevenLabs را نشان می‌دهد (برای انتخاب مرد/زن در پنل).
type Voice struct {
	VoiceID string `json:"voice_id"`
	Name    string `json:"name"`
	Gender  string `json:"gender"`
	Accent  string `json:"accent"`
}

// Service صدای هر متن دیالوگ را با کمک ElevenLabs Text-to-Speech API می‌سازد.
// کلید API در لحظه‌ی هر درخواست از settings خوانده می‌شود تا تغییر آن از پنل
// ادمین بدون ری‌استارت سرور اعمال شود.
type Service struct {
	settings *settingsservice.Service
}

func New(settings *settingsservice.Service) Service {
	return Service{settings: settings}
}

func (s Service) apiKey() string {
	return s.settings.Get(settingsservice.KeyElevenLabsAPIKey)
}

func (s Service) voiceID() string {
	v := s.settings.Get(settingsservice.KeyElevenLabsVoiceID)
	if v == "" {
		return defaultVoiceID
	}
	return v
}

// Enabled مشخص می‌کند آیا کلید API تنظیم شده است یا نه.
func (s Service) Enabled() bool {
	return s.apiKey() != ""
}

// GenerateSpeech متن را به صدا (فایل mp3، به‌صورت بایت) تبدیل می‌کند.
// اگر voiceID خالی باشد از صدای پیش‌فرض تنظیمات استفاده می‌شود، وگرنه همان صدای
// انتخاب‌شده (مثلاً یک صدای مرد یا زن مشخص) به کار می‌رود.
// speed سرعت گفتار را کنترل می‌کند (بازه‌ی مجاز ۰.۷ تا ۱.۲؛ ۰ یعنی مقدار پیش‌فرض ۱.۰).
func (s Service) GenerateSpeech(ctx context.Context, text, voiceID string, speed float64) ([]byte, error) {
	const op = "ttsservice.GenerateSpeech"

	key := s.apiKey()
	if key == "" {
		return nil, richerror.New(op).WithMessage("کلید ELEVENLABS_API_KEY تنظیم نشده است")
	}
	if voiceID == "" {
		voiceID = s.voiceID()
	}
	if speed == 0 {
		speed = defaultSpeed
	}
	if speed < minSpeed {
		speed = minSpeed
	}
	if speed > maxSpeed {
		speed = maxSpeed
	}

	payload, err := json.Marshal(map[string]any{
		"text":     text,
		"model_id": "eleven_multilingual_v2",
		"voice_settings": map[string]float64{
			"stability":        0.5,
			"similarity_boost": 0.75,
			"speed":            speed,
		},
	})
	if err != nil {
		return nil, richerror.New(op).WithErr(err).WithMessage("خطا در ساخت درخواست ElevenLabs")
	}

	req, err := http.NewRequestWithContext(ctx, http.MethodPost, ttsEndpoint+voiceID, bytes.NewReader(payload))
	if err != nil {
		return nil, richerror.New(op).WithErr(err).WithMessage("خطا در ساخت درخواست ElevenLabs")
	}
	req.Header.Set("xi-api-key", key)
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Accept", "audio/mpeg")

	httpClient, err := outboundhttp.Client()
	if err != nil {
		return nil, richerror.New(op).WithErr(err).WithMessage(fmt.Sprintf("خطا در تنظیم پراکسی خروجی: %v", err))
	}
	resp, err := httpClient.Do(req)
	if err != nil {
		return nil, richerror.New(op).WithErr(err).WithMessage(fmt.Sprintf("خطا در فراخوانی ElevenLabs: %v", err))
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, richerror.New(op).WithErr(err).WithMessage("خطا در خواندن پاسخ ElevenLabs")
	}

	if resp.StatusCode != http.StatusOK {
		return nil, richerror.New(op).WithMessage(
			fmt.Sprintf("خطا در فراخوانی ElevenLabs (%d): %s", resp.StatusCode, string(body)),
		)
	}

	return body, nil
}

// ListVoices صداهای در دسترسِ حساب ElevenLabs را برمی‌گرداند (برای انتخاب مرد/زن در پنل).
func (s Service) ListVoices(ctx context.Context) ([]Voice, error) {
	const op = "ttsservice.ListVoices"

	key := s.apiKey()
	if key == "" {
		return nil, richerror.New(op).WithMessage("کلید ELEVENLABS_API_KEY تنظیم نشده است")
	}

	req, err := http.NewRequestWithContext(ctx, http.MethodGet, voicesEndpoint, nil)
	if err != nil {
		return nil, richerror.New(op).WithErr(err).WithMessage("خطا در ساخت درخواست ElevenLabs")
	}
	req.Header.Set("xi-api-key", key)

	httpClient, err := outboundhttp.Client()
	if err != nil {
		return nil, richerror.New(op).WithErr(err).WithMessage(fmt.Sprintf("خطا در تنظیم پراکسی خروجی: %v", err))
	}
	resp, err := httpClient.Do(req)
	if err != nil {
		return nil, richerror.New(op).WithErr(err).WithMessage(fmt.Sprintf("خطا در فراخوانی ElevenLabs: %v", err))
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, richerror.New(op).WithErr(err).WithMessage("خطا در خواندن پاسخ ElevenLabs")
	}
	if resp.StatusCode != http.StatusOK {
		return nil, richerror.New(op).WithMessage(
			fmt.Sprintf("خطا در فراخوانی ElevenLabs (%d): %s", resp.StatusCode, string(body)),
		)
	}

	var parsed struct {
		Voices []struct {
			VoiceID string `json:"voice_id"`
			Name    string `json:"name"`
			Labels  struct {
				Gender string `json:"gender"`
				Accent string `json:"accent"`
			} `json:"labels"`
		} `json:"voices"`
	}
	if err := json.Unmarshal(body, &parsed); err != nil {
		return nil, richerror.New(op).WithErr(err).WithMessage("پاسخ لیست صداها قابل پردازش نبود")
	}

	voices := make([]Voice, 0, len(parsed.Voices))
	for _, v := range parsed.Voices {
		voices = append(voices, Voice{
			VoiceID: v.VoiceID,
			Name:    v.Name,
			Gender:  v.Labels.Gender,
			Accent:  v.Labels.Accent,
		})
	}
	return voices, nil
}
