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
)

// WhisperClient - کلاینت سرویس تشخیص گفتار (سایدکار whisper-service)
type WhisperClient struct {
	baseURL string
	http    *http.Client
}

// TranscriptionResult - پاسخ سرویس تشخیص گفتار
type TranscriptionResult struct {
	Text     string      `json:"text"`
	Words    []HeardWord `json:"-"`
	Language string      `json:"language"`
	Duration float64     `json:"duration"`
}

// whisperResponse شکل خام JSON سرویس پایتونی
type whisperResponse struct {
	Text  string `json:"text"`
	Words []struct {
		Word        string  `json:"word"`
		Start       float64 `json:"start"`
		End         float64 `json:"end"`
		Probability float64 `json:"probability"`
	} `json:"words"`
	Language string  `json:"language"`
	Duration float64 `json:"duration"`
}

// NewWhisperClient - baseURL مثلاً http://localhost:9000
func NewWhisperClient(baseURL string) *WhisperClient {
	return &WhisperClient{
		baseURL: strings.TrimRight(baseURL, "/"),
		// کلیپ‌ها کوتاه‌اند ولی اولین درخواست بعد از بالا آمدن کانتینر ممکن
		// است منتظر لود شدن مدل بماند، برای همین تایم‌اوت سخاوتمندانه است.
		http: &http.Client{Timeout: 90 * time.Second},
	}
}

// Healthy می‌گوید سرویس تشخیص گفتار در دسترس هست یا نه.
func (c *WhisperClient) Healthy(ctx context.Context) bool {
	ctx, cancel := context.WithTimeout(ctx, 3*time.Second)
	defer cancel()

	req, err := http.NewRequestWithContext(ctx, http.MethodGet, c.baseURL+"/health", nil)
	if err != nil {
		return false
	}
	resp, err := c.http.Do(req)
	if err != nil {
		return false
	}
	defer resp.Body.Close()
	io.Copy(io.Discard, resp.Body)

	return resp.StatusCode == http.StatusOK
}

// Transcribe فایل صوتی را به سرویس می‌فرستد و متن + زمان‌بندی کلمه‌ها را
// می‌گیرد. targetText فقط به‌عنوان راهنمای واژگان به مدل داده می‌شود.
func (c *WhisperClient) Transcribe(ctx context.Context, audioPath, targetText string) (*TranscriptionResult, error) {
	file, err := os.Open(audioPath)
	if err != nil {
		return nil, fmt.Errorf("open audio: %w", err)
	}
	defer file.Close()

	var body bytes.Buffer
	writer := multipart.NewWriter(&body)

	part, err := writer.CreateFormFile("audio", filepath.Base(audioPath))
	if err != nil {
		return nil, fmt.Errorf("build request: %w", err)
	}
	if _, err := io.Copy(part, file); err != nil {
		return nil, fmt.Errorf("copy audio: %w", err)
	}
	if err := writer.WriteField("target_text", targetText); err != nil {
		return nil, fmt.Errorf("build request: %w", err)
	}
	if err := writer.WriteField("language", "en"); err != nil {
		return nil, fmt.Errorf("build request: %w", err)
	}
	if err := writer.Close(); err != nil {
		return nil, fmt.Errorf("build request: %w", err)
	}

	req, err := http.NewRequestWithContext(ctx, http.MethodPost, c.baseURL+"/transcribe", &body)
	if err != nil {
		return nil, fmt.Errorf("build request: %w", err)
	}
	req.Header.Set("Content-Type", writer.FormDataContentType())

	resp, err := c.http.Do(req)
	if err != nil {
		return nil, fmt.Errorf("call stt service: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		msg, _ := io.ReadAll(io.LimitReader(resp.Body, 512))
		return nil, fmt.Errorf("stt service returned %d: %s", resp.StatusCode, strings.TrimSpace(string(msg)))
	}

	var raw whisperResponse
	if err := json.NewDecoder(resp.Body).Decode(&raw); err != nil {
		return nil, fmt.Errorf("decode stt response: %w", err)
	}

	words := make([]HeardWord, 0, len(raw.Words))
	for _, w := range raw.Words {
		words = append(words, HeardWord{
			Word:        w.Word,
			Start:       w.Start,
			End:         w.End,
			Probability: w.Probability,
		})
	}

	return &TranscriptionResult{
		Text:     raw.Text,
		Words:    words,
		Language: raw.Language,
		Duration: raw.Duration,
	}, nil
}
