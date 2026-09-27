package ttsservice

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"log/slog"
	"net/http"
	"strings"

	"shadowing-backend/internal/pkg/outboundhttp"
	"shadowing-backend/internal/pkg/richerror"
	settingsservice "shadowing-backend/internal/service/settings"
)

// defaultOpenRouterTTSModel همان Gemini 3.8 Flash TTS است، ولی از طریق OpenRouter
// (با اعتبار پرداختیِ OpenRouter، بدون سقف ۱۰ درخواست روزانه‌ی free tier گوگل).
const defaultOpenRouterTTSModel = "google/gemini-3.8-flash-tts"

const openRouterSpeechEndpoint = "https://openrouter.ai/api/v1/audio/speech"

// openRouterPCMSampleRate نرخ نمونه‌ی خروجی pcm در OpenRouter (Gemini و OpenAI هر دو 24kHz).
const openRouterPCMSampleRate = 24000

// openRouterProvider صدا را با endpoint سازگار با OpenAI یعنی /api/v1/audio/speech
// در OpenRouter می‌سازد. از همان OPENROUTER_API_KEY ارائه‌دهنده‌ی متنی استفاده می‌کند.
type openRouterProvider struct {
	settings *settingsservice.Service
}

func newOpenRouterProvider(settings *settingsservice.Service) openRouterProvider {
	return openRouterProvider{settings: settings}
}

func (p openRouterProvider) apiKey() string {
	return p.settings.Get(settingsservice.KeyOpenRouterAPIKey)
}

func (p openRouterProvider) model() string {
	if v := p.settings.Get(settingsservice.KeyOpenRouterTTSModel); v != "" {
		return v
	}
	return defaultOpenRouterTTSModel
}

// isGoogleModel مدل‌های Gemini روی OpenRouter را تشخیص می‌دهد؛ صداها و روش
// اعمال سرعت برای این‌ها با بقیه‌ی مدل‌ها فرق دارد.
func (p openRouterProvider) isGoogleModel() bool {
	return strings.HasPrefix(p.model(), "google/")
}

func (p openRouterProvider) defaultVoice() string {
	if p.isGoogleModel() {
		if v := p.settings.Get(settingsservice.KeyGeminiTTSVoice); v != "" {
			return v
		}
		return defaultGeminiVoice
	}
	return "alloy"
}

func (p openRouterProvider) enabled() bool {
	return p.apiKey() != ""
}

func (p openRouterProvider) missingKeyMessage() string {
	return "کلید OPENROUTER_API_KEY تنظیم نشده است"
}

// buildBody بدنه‌ی درخواست را می‌سازد. متن همیشه دست‌نخورده در input می‌رود
// (Gemini 3.8 همه‌ی input را کلمه‌به‌کلمه می‌خواند). برای مدل‌های Google
// سرعت به‌صورت speech_metadata.style در provider options می‌رود؛ برای بقیه
// (مثلاً OpenAI) پارامتر عددیِ speed فرستاده می‌شود.
func (p openRouterProvider) buildBody(text, voiceID string, speed float64, withStyle bool) map[string]any {
	body := map[string]any{
		"model":           p.model(),
		"input":           text,
		"voice":           voiceID,
		"response_format": "pcm",
	}
	if p.isGoogleModel() {
		if style := paceStyle(speed); withStyle && style != "" {
			body["provider"] = map[string]any{
				"options": map[string]any{
					"google-ai-studio": map[string]any{
						"speech_metadata": map[string]string{"style": style},
					},
				},
			}
		}
	} else if speed != 0 {
		body["speed"] = speed
	}
	return body
}

// generateSpeech خروجی pcm خام (یا WAV) را می‌گیرد، به WAV و سپس با ffmpeg به
// mp3 تبدیل می‌کند؛ اگر ffmpeg نبود همان WAV ذخیره می‌شود.
func (p openRouterProvider) generateSpeech(ctx context.Context, text, voiceID string, speed float64) (Audio, error) {
	const op = "ttsservice.openRouter.generateSpeech"

	key := p.apiKey()
	if key == "" {
		return Audio{}, richerror.New(op).WithMessage(p.missingKeyMessage())
	}
	if voiceID == "" {
		voiceID = p.defaultVoice()
	}
	if speed != 0 {
		speed = min(max(speed, minSpeed), maxSpeed)
	}

	status, body, err := p.call(ctx, key, p.buildBody(text, voiceID, speed, true))
	if err != nil {
		return Audio{}, richerror.New(op).WithErr(err).WithMessage(fmt.Sprintf("خطا در فراخوانی OpenRouter TTS: %v", err))
	}
	// اگر دستور سرعت رد شد (400)، یک بار بدون آن تلاش می‌کنیم.
	if status == http.StatusBadRequest && p.isGoogleModel() && paceStyle(speed) != "" {
		slog.Warn("tts: openrouter rejected pace style, retrying without it", "model", p.model(), "body", string(body))
		status, body, err = p.call(ctx, key, p.buildBody(text, voiceID, speed, false))
		if err != nil {
			return Audio{}, richerror.New(op).WithErr(err).WithMessage(fmt.Sprintf("خطا در فراخوانی OpenRouter TTS: %v", err))
		}
	}
	if status != http.StatusOK {
		return Audio{}, richerror.New(op).WithMessage(
			fmt.Sprintf("خطا در فراخوانی OpenRouter TTS (%d): %s", status, string(body)),
		)
	}
	if len(body) == 0 {
		return Audio{}, richerror.New(op).WithMessage("OpenRouter TTS صدایی برنگرداند")
	}

	wav := body
	if !isWAV(body) {
		wav = pcmToWAV(body, openRouterPCMSampleRate)
	}
	mp3, err := wavToMP3(ctx, wav)
	if err != nil {
		slog.Warn("tts: ffmpeg mp3 conversion failed, storing wav", "err", err)
		return Audio{Data: wav, ContentType: "audio/wav", Ext: ".wav"}, nil
	}
	return Audio{Data: mp3, ContentType: "audio/mpeg", Ext: ".mp3"}, nil
}

func (p openRouterProvider) call(ctx context.Context, key string, reqBody map[string]any) (int, []byte, error) {
	payload, err := json.Marshal(reqBody)
	if err != nil {
		return 0, nil, err
	}
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, openRouterSpeechEndpoint, bytes.NewReader(payload))
	if err != nil {
		return 0, nil, err
	}
	req.Header.Set("Authorization", "Bearer "+key)
	req.Header.Set("Content-Type", "application/json")

	httpClient, err := outboundhttp.Client()
	if err != nil {
		return 0, nil, fmt.Errorf("خطا در تنظیم پراکسی خروجی: %w", err)
	}
	resp, err := httpClient.Do(req)
	if err != nil {
		return 0, nil, err
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return 0, nil, err
	}
	return resp.StatusCode, body, nil
}

// listVoices برای مدل‌های Gemini همان لیست صداهای آماده‌ی Gemini را برمی‌گرداند؛
// برای بقیه‌ی مدل‌ها لیست خالی (پنل همان «صدای پیش‌فرض» را نشان می‌دهد).
func (p openRouterProvider) listVoices(ctx context.Context) ([]Voice, error) {
	if !p.isGoogleModel() {
		return []Voice{}, nil
	}
	voices := make([]Voice, len(geminiVoices))
	copy(voices, geminiVoices)
	return voices, nil
}
