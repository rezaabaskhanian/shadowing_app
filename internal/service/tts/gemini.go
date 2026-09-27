package ttsservice

import (
	"bytes"
	"context"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"io"
	"log/slog"
	"net/http"
	"net/url"
	"strings"

	"shadowing-backend/internal/pkg/outboundhttp"
	"shadowing-backend/internal/pkg/richerror"
	settingsservice "shadowing-backend/internal/service/settings"
)

// defaultGeminiTTSModel مدل پیش‌فرض Gemini TTS است (GA، کیفیت استودیویی).
// برای سرعت/هزینه‌ی کمتر می‌شود GEMINI_TTS_MODEL را روی
// gemini-3.8-flash-lite-tts گذاشت؛ schema درخواست یکی است.
const defaultGeminiTTSModel = "gemini-3.8-flash-tts"

// defaultGeminiVoice یک صدای زنِ واضح و خنثی از صداهای آماده‌ی Gemini است؛
// اگر GEMINI_TTS_VOICE تنظیم نشده باشد از همین استفاده می‌شود.
const defaultGeminiVoice = "Kore"

const geminiEndpoint = "https://generativelanguage.googleapis.com/v1beta/models/"

// geminiVoices صداهای آماده‌ی (prebuilt) Gemini TTS هستند. Gemini برخلاف
// ElevenLabs endpoint لیست صدا ندارد، پس لیست ثابت است؛ جنسیت برای آیکون
// مرد/زن در پنل است.
var geminiVoices = []Voice{
	{VoiceID: "Kore", Name: "Kore — Firm", Gender: "female"},
	{VoiceID: "Zephyr", Name: "Zephyr — Bright", Gender: "female"},
	{VoiceID: "Leda", Name: "Leda — Youthful", Gender: "female"},
	{VoiceID: "Aoede", Name: "Aoede — Breezy", Gender: "female"},
	{VoiceID: "Callirrhoe", Name: "Callirrhoe — Easy-going", Gender: "female"},
	{VoiceID: "Autonoe", Name: "Autonoe — Bright", Gender: "female"},
	{VoiceID: "Despina", Name: "Despina — Smooth", Gender: "female"},
	{VoiceID: "Erinome", Name: "Erinome — Clear", Gender: "female"},
	{VoiceID: "Laomedeia", Name: "Laomedeia — Upbeat", Gender: "female"},
	{VoiceID: "Achernar", Name: "Achernar — Soft", Gender: "female"},
	{VoiceID: "Gacrux", Name: "Gacrux — Mature", Gender: "female"},
	{VoiceID: "Pulcherrima", Name: "Pulcherrima — Forward", Gender: "female"},
	{VoiceID: "Vindemiatrix", Name: "Vindemiatrix — Gentle", Gender: "female"},
	{VoiceID: "Sulafat", Name: "Sulafat — Warm", Gender: "female"},
	{VoiceID: "Puck", Name: "Puck — Upbeat", Gender: "male"},
	{VoiceID: "Charon", Name: "Charon — Informative", Gender: "male"},
	{VoiceID: "Fenrir", Name: "Fenrir — Excitable", Gender: "male"},
	{VoiceID: "Orus", Name: "Orus — Firm", Gender: "male"},
	{VoiceID: "Enceladus", Name: "Enceladus — Breathy", Gender: "male"},
	{VoiceID: "Iapetus", Name: "Iapetus — Clear", Gender: "male"},
	{VoiceID: "Umbriel", Name: "Umbriel — Easy-going", Gender: "male"},
	{VoiceID: "Algieba", Name: "Algieba — Smooth", Gender: "male"},
	{VoiceID: "Algenib", Name: "Algenib — Gravelly", Gender: "male"},
	{VoiceID: "Rasalgethi", Name: "Rasalgethi — Informative", Gender: "male"},
	{VoiceID: "Alnilam", Name: "Alnilam — Firm", Gender: "male"},
	{VoiceID: "Schedar", Name: "Schedar — Even", Gender: "male"},
	{VoiceID: "Achird", Name: "Achird — Friendly", Gender: "male"},
	{VoiceID: "Zubenelgenubi", Name: "Zubenelgenubi — Casual", Gender: "male"},
	{VoiceID: "Sadachbia", Name: "Sadachbia — Lively", Gender: "male"},
	{VoiceID: "Sadaltager", Name: "Sadaltager — Knowledgeable", Gender: "male"},
}

// geminiProvider صدای هر متن را با Gemini TTS (generateContent با خروجی AUDIO)
// می‌سازد. از همان GEMINI_API_KEY ارائه‌دهنده‌ی متنی استفاده می‌کند.
type geminiProvider struct {
	settings *settingsservice.Service
}

func newGeminiProvider(settings *settingsservice.Service) geminiProvider {
	return geminiProvider{settings: settings}
}

func (p geminiProvider) apiKey() string {
	return p.settings.Get(settingsservice.KeyGeminiAPIKey)
}

func (p geminiProvider) model() string {
	if v := p.settings.Get(settingsservice.KeyGeminiTTSModel); v != "" {
		return v
	}
	return defaultGeminiTTSModel
}

func (p geminiProvider) voice() string {
	if v := p.settings.Get(settingsservice.KeyGeminiTTSVoice); v != "" {
		return v
	}
	return defaultGeminiVoice
}

func (p geminiProvider) enabled() bool {
	return p.apiKey() != ""
}

func (p geminiProvider) missingKeyMessage() string {
	return "کلید GEMINI_API_KEY تنظیم نشده است"
}

// paceInstruction سرعت عددی پنل را به دستور متنی تبدیل می‌کند؛ Gemini TTS
// پارامتر عددیِ سرعت ندارد و سرعت را از دستورِ زبانِ طبیعی می‌گیرد.
func paceInstruction(speed float64) string {
	switch {
	case speed == 0:
		return ""
	case speed <= 0.8:
		return " at a slow, careful pace"
	case speed < 0.95:
		return " slightly slower than normal"
	case speed > 1.1:
		return " slightly faster than normal"
	default:
		return ""
	}
}

// buildPrompt متن را داخل یک دستور کوتاه می‌پیچد. بدون دستور، مدل روی متن‌های
// خیلی کوتاه گاهی به‌جای خواندن، سعی می‌کند «جواب» بدهد و خطا برمی‌گرداند.
func buildPrompt(text string, speed float64) string {
	return fmt.Sprintf("Read the following text aloud clearly and naturally%s:\n%s", paceInstruction(speed), text)
}

// generateSpeech متن را به صدا تبدیل می‌کند. خروجی Gemini WAV (نسخه‌ی 3.8) یا
// PCM خام (نسخه‌های قبلی) است؛ برای یکسان ماندن با فایل‌های قبلی و حجم کمتر در
// اپ موبایل، با ffmpeg به mp3 تبدیل می‌شود و اگر ffmpeg نبود همان WAV ذخیره می‌شود.
func (p geminiProvider) generateSpeech(ctx context.Context, text, voiceID string, speed float64) (Audio, error) {
	const op = "ttsservice.gemini.generateSpeech"

	key := p.apiKey()
	if key == "" {
		return Audio{}, richerror.New(op).WithMessage(p.missingKeyMessage())
	}
	if voiceID == "" {
		voiceID = p.voice()
	}
	if speed != 0 {
		speed = min(max(speed, minSpeed), maxSpeed)
	}

	payload, err := json.Marshal(map[string]any{
		"contents": []map[string]any{
			{"parts": []map[string]string{{"text": buildPrompt(text, speed)}}},
		},
		"generationConfig": map[string]any{
			"responseModalities": []string{"AUDIO"},
			"speechConfig": map[string]any{
				"voiceConfig": map[string]any{
					"prebuiltVoiceConfig": map[string]string{"voiceName": voiceID},
				},
			},
		},
	})
	if err != nil {
		return Audio{}, richerror.New(op).WithErr(err).WithMessage("خطا در ساخت درخواست Gemini TTS")
	}

	endpoint := geminiEndpoint + url.PathEscape(p.model()) + ":generateContent"
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, endpoint, bytes.NewReader(payload))
	if err != nil {
		return Audio{}, richerror.New(op).WithErr(err).WithMessage("خطا در ساخت درخواست Gemini TTS")
	}
	req.Header.Set("x-goog-api-key", key)
	req.Header.Set("Content-Type", "application/json")

	httpClient, err := outboundhttp.Client()
	if err != nil {
		return Audio{}, richerror.New(op).WithErr(err).WithMessage(fmt.Sprintf("خطا در تنظیم پراکسی خروجی: %v", err))
	}
	resp, err := httpClient.Do(req)
	if err != nil {
		return Audio{}, richerror.New(op).WithErr(err).WithMessage(fmt.Sprintf("خطا در فراخوانی Gemini TTS: %v", err))
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return Audio{}, richerror.New(op).WithErr(err).WithMessage("خطا در خواندن پاسخ Gemini TTS")
	}
	if resp.StatusCode != http.StatusOK {
		return Audio{}, richerror.New(op).WithMessage(
			fmt.Sprintf("خطا در فراخوانی Gemini TTS (%d): %s", resp.StatusCode, string(body)),
		)
	}

	var parsed struct {
		Candidates []struct {
			FinishReason string `json:"finishReason"`
			Content      struct {
				Parts []struct {
					InlineData *struct {
						MimeType string `json:"mimeType"`
						Data     string `json:"data"`
					} `json:"inlineData"`
				} `json:"parts"`
			} `json:"content"`
		} `json:"candidates"`
	}
	if err := json.Unmarshal(body, &parsed); err != nil {
		return Audio{}, richerror.New(op).WithErr(err).WithMessage("پاسخ Gemini TTS قابل پردازش نبود")
	}

	var mimeType, encoded string
	finishReason := ""
	for _, c := range parsed.Candidates {
		finishReason = c.FinishReason
		for _, part := range c.Content.Parts {
			if part.InlineData != nil && part.InlineData.Data != "" {
				mimeType, encoded = part.InlineData.MimeType, part.InlineData.Data
				break
			}
		}
		if encoded != "" {
			break
		}
	}
	if encoded == "" {
		return Audio{}, richerror.New(op).WithMessage(
			fmt.Sprintf("Gemini TTS صدایی برنگرداند (finishReason=%s)", finishReason),
		)
	}

	raw, err := base64.StdEncoding.DecodeString(encoded)
	if err != nil {
		return Audio{}, richerror.New(op).WithErr(err).WithMessage("صدای برگشتی Gemini TTS قابل decode نبود")
	}

	wav := raw
	if !isWAV(raw) {
		// مدل‌های قدیمی‌تر PCM خامِ 16bit mono برمی‌گردانند (audio/L16;rate=24000).
		wav = pcmToWAV(raw, sampleRateFromMime(mimeType, 24000))
	}

	mp3, err := wavToMP3(ctx, wav)
	if err != nil {
		slog.Warn("tts: ffmpeg mp3 conversion failed, storing wav", "err", err)
		return Audio{Data: wav, ContentType: "audio/wav", Ext: ".wav"}, nil
	}
	return Audio{Data: mp3, ContentType: "audio/mpeg", Ext: ".mp3"}, nil
}

func (p geminiProvider) listVoices(ctx context.Context) ([]Voice, error) {
	voices := make([]Voice, len(geminiVoices))
	copy(voices, geminiVoices)
	return voices, nil
}

// sampleRateFromMime نرخ نمونه را از mimeType مثل "audio/L16;codec=pcm;rate=24000" درمی‌آورد.
func sampleRateFromMime(mimeType string, fallback int) int {
	for _, part := range strings.Split(mimeType, ";") {
		k, v, ok := strings.Cut(strings.TrimSpace(part), "=")
		if ok && strings.EqualFold(k, "rate") {
			var rate int
			if _, err := fmt.Sscanf(v, "%d", &rate); err == nil && rate > 0 {
				return rate
			}
		}
	}
	return fallback
}
