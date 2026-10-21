package ttsservice

import (
	"bytes"
	"context"
	"encoding/binary"
	"encoding/json"
	"fmt"
	"io"
	"log/slog"
	"net/http"
	"os/exec"
	"strconv"
	"strings"
	"time"
	"unicode/utf8"

	"shadowing-backend/internal/pkg/outboundhttp"
	"shadowing-backend/internal/pkg/richerror"
	settingsservice "shadowing-backend/internal/service/settings"
)

// Groq با مدل Orpheus (Canopy Labs) صدا می‌سازد؛ API سازگار با OpenAI است و
// api.groq.com از قبل در رله‌ی خروجی (deploy/relay-worker.js) مجاز است. از همان
// GROQ_API_KEY تشخیص گفتار استفاده می‌کند.
const (
	defaultGroqTTSModel = "canopylabs/orpheus-v1-english"
	groqSpeechEndpoint  = "https://api.groq.com/openai/v1/audio/speech"
	// groqMaxChars سقف طول ورودی هر درخواست Orpheus است (حدود ۲۰۰ نویسه)؛ متن
	// بلندتر جمله‌به‌جمله تکه می‌شود و صداها پشت هم چسبانده می‌شوند.
	groqMaxChars = 190
	// groqChunkGap مکث بین تکه‌ها (۱۵۰ میلی‌ثانیه).
	groqChunkGapMs = 150
	groqMaxRetries = 3
)

var groqVoices = []Voice{
	{VoiceID: "autumn", Name: "Autumn", Gender: "female"},
	{VoiceID: "diana", Name: "Diana", Gender: "female"},
	{VoiceID: "hannah", Name: "Hannah", Gender: "female"},
	{VoiceID: "austin", Name: "Austin", Gender: "male"},
	{VoiceID: "daniel", Name: "Daniel", Gender: "male"},
	{VoiceID: "troy", Name: "Troy", Gender: "male"},
}

type groqProvider struct {
	settings *settingsservice.Service
}

func newGroqProvider(settings *settingsservice.Service) groqProvider {
	return groqProvider{settings: settings}
}

func (p groqProvider) apiKey() string {
	return strings.TrimSpace(p.settings.Get(settingsservice.KeyGroqAPIKey))
}

func (p groqProvider) model() string {
	if v := strings.TrimSpace(p.settings.Get(settingsservice.KeyGroqTTSModel)); v != "" {
		return v
	}
	return defaultGroqTTSModel
}

func (p groqProvider) enabled() bool { return p.apiKey() != "" }

func (p groqProvider) missingKeyMessage() string {
	return "کلید GROQ_API_KEY تنظیم نشده است"
}

func (p groqProvider) listVoices(context.Context) ([]Voice, error) {
	out := make([]Voice, len(groqVoices))
	copy(out, groqVoices)
	return out, nil
}

// groqVoiceFor صدای Orpheus را انتخاب می‌کند. صداهای Gemini (مثل Kore و Puck که
// محتوای قبلی با آن‌ها ساخته شده) بر اساس جنسیت به یک صدای Orpheus نگاشت
// می‌شوند تا دو گوینده‌ی یک مکالمه هنوز دو جنسیت متفاوت داشته باشند.
func groqVoiceFor(voiceID string) string {
	id := strings.ToLower(strings.TrimSpace(voiceID))
	for _, v := range groqVoices {
		if v.VoiceID == id {
			return id
		}
	}
	for _, v := range geminiVoices {
		if strings.EqualFold(v.VoiceID, voiceID) {
			if v.Gender == "male" {
				return "austin"
			}
			return "hannah"
		}
	}
	return "autumn"
}

// splitForGroq متن را در مرز جمله (یا ویرگول/فاصله) به تکه‌هایی تا maxChars می‌شکند.
func splitForGroq(text string, maxChars int) []string {
	text = strings.TrimSpace(text)
	if utf8.RuneCountInString(text) <= maxChars {
		return []string{text}
	}
	var chunks []string
	var cur strings.Builder
	flush := func() {
		if s := strings.TrimSpace(cur.String()); s != "" {
			chunks = append(chunks, s)
		}
		cur.Reset()
	}
	for _, sent := range splitSentences(text) {
		if utf8.RuneCountInString(sent) > maxChars {
			flush()
			chunks = append(chunks, hardSplit(sent, maxChars)...)
			continue
		}
		if utf8.RuneCountInString(cur.String())+1+utf8.RuneCountInString(sent) > maxChars {
			flush()
		}
		if cur.Len() > 0 {
			cur.WriteByte(' ')
		}
		cur.WriteString(sent)
	}
	flush()
	return chunks
}

func splitSentences(text string) []string {
	var out []string
	var cur strings.Builder
	runes := []rune(text)
	for i, r := range runes {
		cur.WriteRune(r)
		if (r == '.' || r == '!' || r == '?' || r == '؟') && (i+1 == len(runes) || runes[i+1] == ' ') {
			out = append(out, strings.TrimSpace(cur.String()))
			cur.Reset()
		}
	}
	if s := strings.TrimSpace(cur.String()); s != "" {
		out = append(out, s)
	}
	return out
}

// hardSplit جمله‌ی خیلی بلند را روی ویرگول یا فاصله می‌شکند.
func hardSplit(s string, maxChars int) []string {
	var out []string
	words := strings.Fields(s)
	var cur []string
	n := 0
	for _, w := range words {
		l := utf8.RuneCountInString(w)
		if n+l+1 > maxChars && len(cur) > 0 {
			out = append(out, strings.Join(cur, " "))
			cur, n = nil, 0
		}
		cur = append(cur, w)
		n += l + 1
	}
	if len(cur) > 0 {
		out = append(out, strings.Join(cur, " "))
	}
	return out
}

// wavPCM داده‌ی PCM و نرخ نمونه‌ی یک WAV (16bit mono) را بیرون می‌کشد.
func wavPCM(b []byte) (pcm []byte, sampleRate int, err error) {
	if !isWAV(b) {
		return nil, 0, fmt.Errorf("خروجی WAV نیست")
	}
	sampleRate = 24000
	pos := 12
	for pos+8 <= len(b) {
		id := string(b[pos : pos+4])
		size := int(binary.LittleEndian.Uint32(b[pos+4 : pos+8]))
		body := pos + 8
		switch id {
		case "fmt ":
			if body+8 <= len(b) {
				sampleRate = int(binary.LittleEndian.Uint32(b[body+4 : body+8]))
			}
		case "data":
			end := body + size
			if end > len(b) || size == 0 || size == 0xFFFFFFFF {
				end = len(b) // هدر بدون طول درست (استریم)
			}
			return b[body:end], sampleRate, nil
		}
		pos = body + size + size%2
	}
	return nil, 0, fmt.Errorf("بخش data در WAV پیدا نشد")
}

// joinWAVs چند WAV هم‌نرخ را با مکث کوتاه به یک WAV تبدیل می‌کند.
func joinWAVs(parts [][]byte) ([]byte, error) {
	var all []byte
	rate := 24000
	for i, w := range parts {
		pcm, r, err := wavPCM(w)
		if err != nil {
			return nil, err
		}
		if i == 0 {
			rate = r
		}
		if i > 0 {
			all = append(all, make([]byte, rate*2*groqChunkGapMs/1000)...)
		}
		all = append(all, pcm...)
	}
	return pcmToWAV(all, rate), nil
}

func (p groqProvider) call(ctx context.Context, key, text, voice string) ([]byte, error) {
	payload, _ := json.Marshal(map[string]any{
		"model":           p.model(),
		"input":           text,
		"voice":           voice,
		"response_format": "wav",
	})
	client, err := outboundhttp.Client()
	if err != nil {
		return nil, fmt.Errorf("خطا در تنظیم پراکسی خروجی: %w", err)
	}
	for attempt := 0; ; attempt++ {
		req, err := http.NewRequestWithContext(ctx, http.MethodPost, groqSpeechEndpoint, bytes.NewReader(payload))
		if err != nil {
			return nil, err
		}
		req.Header.Set("Authorization", "Bearer "+key)
		req.Header.Set("Content-Type", "application/json")
		resp, err := client.Do(req)
		if err != nil {
			return nil, err
		}
		body, rerr := io.ReadAll(resp.Body)
		resp.Body.Close()
		if rerr != nil {
			return nil, rerr
		}
		if resp.StatusCode == http.StatusOK {
			return body, nil
		}
		// سقف نرخ: با retry-after صبر کن و دوباره بزن.
		if resp.StatusCode == http.StatusTooManyRequests && attempt < groqMaxRetries {
			wait := 5 * time.Second
			if s, perr := strconv.ParseFloat(resp.Header.Get("retry-after"), 64); perr == nil && s > 0 {
				wait = time.Duration(s*1000) * time.Millisecond
			}
			if wait > 30*time.Second {
				wait = 30 * time.Second
			}
			slog.Warn("tts: groq rate limited, waiting", "wait", wait, "attempt", attempt+1)
			select {
			case <-time.After(wait):
				continue
			case <-ctx.Done():
				return nil, ctx.Err()
			}
		}
		return nil, fmt.Errorf("(%d): %s", resp.StatusCode, string(body))
	}
}

func (p groqProvider) generateSpeech(ctx context.Context, text, voiceID string, speed float64) (Audio, error) {
	const op = "ttsservice.groq.generateSpeech"

	key := p.apiKey()
	if key == "" {
		return Audio{}, richerror.New(op).WithMessage(p.missingKeyMessage())
	}
	if speed != 0 {
		speed = min(max(speed, minSpeed), maxSpeed)
	}
	voice := groqVoiceFor(voiceID)

	chunks := splitForGroq(text, groqMaxChars)
	parts := make([][]byte, 0, len(chunks))
	for _, c := range chunks {
		wav, err := p.call(ctx, key, c, voice)
		if err != nil {
			return Audio{}, richerror.New(op).WithErr(err).WithMessage(fmt.Sprintf("خطا در فراخوانی Groq TTS %v", err))
		}
		if len(wav) == 0 {
			return Audio{}, richerror.New(op).WithMessage("Groq TTS صدایی برنگرداند")
		}
		parts = append(parts, wav)
	}
	wav := parts[0]
	if len(parts) > 1 {
		var err error
		if wav, err = joinWAVs(parts); err != nil {
			return Audio{}, richerror.New(op).WithErr(err).WithMessage("چسباندن تکه‌های صدا ناموفق بود")
		}
	}

	mp3, err := wavToMP3Tempo(ctx, wav, speed)
	if err != nil {
		slog.Warn("tts: ffmpeg mp3 conversion failed, storing wav", "err", err)
		return Audio{Data: wav, ContentType: "audio/wav", Ext: ".wav"}, nil
	}
	return Audio{Data: mp3, ContentType: "audio/mpeg", Ext: ".mp3"}, nil
}

// wavToMP3Tempo مثل wavToMP3 است و اگر speed ≠ 0/1 باشد سرعت را با فیلتر atempo
// (بدون تغییر زیر و بمی) اعمال می‌کند؛ Orpheus پارامتر سرعت ندارد.
func wavToMP3Tempo(ctx context.Context, wav []byte, speed float64) ([]byte, error) {
	if speed == 0 || speed == 1 {
		return wavToMP3(ctx, wav)
	}
	ctx, cancel := context.WithTimeout(ctx, 30*time.Second)
	defer cancel()
	cmd := exec.CommandContext(ctx, "ffmpeg",
		"-hide_banner", "-loglevel", "error",
		"-f", "wav", "-i", "pipe:0",
		"-filter:a", fmt.Sprintf("atempo=%.3f", speed),
		"-codec:a", "libmp3lame", "-b:a", "64k",
		"-f", "mp3", "pipe:1",
	)
	cmd.Stdin = bytes.NewReader(wav)
	var out, stderr bytes.Buffer
	cmd.Stdout, cmd.Stderr = &out, &stderr
	if err := cmd.Run(); err != nil {
		return nil, fmt.Errorf("ffmpeg: %w: %s", err, stderr.String())
	}
	if out.Len() == 0 {
		return nil, fmt.Errorf("ffmpeg produced empty output")
	}
	return out.Bytes(), nil
}
