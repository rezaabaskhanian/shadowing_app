package speecheval

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"mime/multipart"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"time"

	"shadowing-backend/internal/pkg/outboundhttp"
	settingsservice "shadowing-backend/internal/service/settings"
)

const (
	groqTranscribeURL = "https://api.groq.com/openai/v1/audio/transcriptions"

	// defaultGroqSTTModel مدل Whisper سریعِ Groq است؛ از پنل ادمین (GROQ_STT_MODEL)
	// قابل تغییر است، مثلاً به whisper-large-v3.
	defaultGroqSTTModel = "whisper-large-v3-turbo"

	// groqTimeout سقفِ کلِ یک فراخوانی. کلیپ‌های ما ≤ ۲۲ ثانیه‌اند و Groq معمولاً
	// زیر چند ثانیه جواب می‌دهد؛ اگر بیشتر طول کشید، به Whisperِ محلی برمی‌گردیم
	// (که خودش ~۷ ثانیه است)، نه اینکه کاربر بیشتر منتظر بماند.
	groqTimeout = 10 * time.Second
)

// GroqClient رونویسیِ خام را روی Whisperِ میزبانی‌شده‌ی Groq انجام می‌دهد. کلید و
// مدل در لحظه‌ی هر درخواست از تنظیمات (پنل ادمین یا env) خوانده می‌شوند، پس تغییرشان
// نیازی به ری‌استارت ندارد. اگر کلید ست نباشد Enabled() false است و ارزیاب مستقیم
// از Whisperِ محلی استفاده می‌کند.
type GroqClient struct {
	settings *settingsservice.Service
}

func NewGroqClient(settings *settingsservice.Service) *GroqClient {
	return &GroqClient{settings: settings}
}

func (c *GroqClient) apiKey() string {
	return strings.TrimSpace(c.settings.Get(settingsservice.KeyGroqAPIKey))
}

func (c *GroqClient) model() string {
	if m := strings.TrimSpace(c.settings.Get(settingsservice.KeyGroqSTTModel)); m != "" {
		return m
	}
	return defaultGroqSTTModel
}

// Enabled مشخص می‌کند کلید Groq ست شده است یا نه.
func (c *GroqClient) Enabled() bool {
	return c.apiKey() != ""
}

// Transcribe فایل صوتی (WAV) را به Groq می‌فرستد و فقط متن را برمی‌گرداند. ترافیک از
// پراکسیِ خروجی (AI_OUTBOUND_PROXY) عبور می‌کند، چون Groq هم مثل بقیه‌ی سرویس‌های
// AI از IP ایران قابل‌دسترس نیست.
func (c *GroqClient) Transcribe(ctx context.Context, audioPath string) (string, error) {
	key := c.apiKey()
	if key == "" {
		return "", fmt.Errorf("groq: api key not set")
	}

	file, err := os.Open(audioPath)
	if err != nil {
		return "", fmt.Errorf("groq: open audio: %w", err)
	}
	defer file.Close()

	var body bytes.Buffer
	writer := multipart.NewWriter(&body)
	part, err := writer.CreateFormFile("file", filepath.Base(audioPath))
	if err != nil {
		return "", fmt.Errorf("groq: build request: %w", err)
	}
	if _, err := io.Copy(part, file); err != nil {
		return "", fmt.Errorf("groq: copy audio: %w", err)
	}
	for k, v := range map[string]string{
		"model":           c.model(),
		"language":        "en",
		"response_format": "json",
		// temperature=0: خروجیِ قطعی‌تر و کمتر «خلاق» — رونویسی باید عین گفته‌ی کاربر
		// باشد، چون بازخوردِ گرامر روی همین متن ساخته می‌شود.
		"temperature": "0",
	} {
		if err := writer.WriteField(k, v); err != nil {
			return "", fmt.Errorf("groq: build request: %w", err)
		}
	}
	if err := writer.Close(); err != nil {
		return "", fmt.Errorf("groq: build request: %w", err)
	}

	ctx, cancel := context.WithTimeout(ctx, groqTimeout)
	defer cancel()

	req, err := http.NewRequestWithContext(ctx, http.MethodPost, groqTranscribeURL, &body)
	if err != nil {
		return "", fmt.Errorf("groq: build request: %w", err)
	}
	req.Header.Set("Authorization", "Bearer "+key)
	req.Header.Set("Content-Type", writer.FormDataContentType())

	httpClient, err := outboundhttp.Client()
	if err != nil {
		return "", fmt.Errorf("groq: outbound proxy: %w", err)
	}
	resp, err := httpClient.Do(req)
	if err != nil {
		return "", fmt.Errorf("groq: request failed: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		msg, _ := io.ReadAll(io.LimitReader(resp.Body, 300))
		return "", fmt.Errorf("groq: status %d: %s", resp.StatusCode, strings.TrimSpace(string(msg)))
	}

	var out struct {
		Text string `json:"text"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&out); err != nil {
		return "", fmt.Errorf("groq: decode response: %w", err)
	}
	return strings.TrimSpace(out.Text), nil
}
