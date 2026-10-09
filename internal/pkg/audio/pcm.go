package audio

import (
	"bytes"
	"context"
	"fmt"
	"os/exec"
	"strconv"
	"time"
)

// pcmTimeout سقف اجرای ffmpeg برای تبدیل‌های درون‌حافظه‌ای (یک جمله‌ی TTS یا
// یک پادکست چنددقیقه‌ای).
const pcmTimeout = 2 * time.Minute

// DecodeToPCM16 هر فایل صوتی (mp3/wav/...) را به PCM خام ۱۶ بیتی تک‌کاناله با
// نرخ sampleRate تبدیل می‌کند. طول خروجی مستقیماً مدت صدا را می‌دهد
// (len/2/sampleRate ثانیه) — برای زمان‌بندی دقیق جمله‌ها در پادکست.
func DecodeToPCM16(ctx context.Context, data []byte, sampleRate int) ([]byte, error) {
	return runFFmpeg(ctx, data,
		"-hide_banner", "-loglevel", "error",
		"-i", "pipe:0",
		"-ac", "1", "-ar", strconv.Itoa(sampleRate),
		"-f", "s16le", "pipe:1",
	)
}

// EncodePCM16ToMP3 PCM خام ۱۶ بیتی تک‌کاناله را به mp3 با بیت‌ریت ثابت تبدیل
// می‌کند. بیت‌ریت ثابت عمدی است: mp3 متغیرِ بدون هدر Xing در پلیر اندروید طول
// اشتباه می‌دهد (ببینید tts.wavToMP3).
func EncodePCM16ToMP3(ctx context.Context, pcm []byte, sampleRate int) ([]byte, error) {
	return runFFmpeg(ctx, pcm,
		"-hide_banner", "-loglevel", "error",
		"-f", "s16le", "-ac", "1", "-ar", strconv.Itoa(sampleRate), "-i", "pipe:0",
		"-codec:a", "libmp3lame", "-b:a", "64k",
		"-f", "mp3", "pipe:1",
	)
}

func runFFmpeg(ctx context.Context, input []byte, args ...string) ([]byte, error) {
	if !Available() {
		return nil, fmt.Errorf("ffmpeg not found in PATH")
	}
	ctx, cancel := context.WithTimeout(ctx, pcmTimeout)
	defer cancel()
	cmd := exec.CommandContext(ctx, "ffmpeg", args...)
	cmd.Stdin = bytes.NewReader(input)
	var out, stderr bytes.Buffer
	cmd.Stdout = &out
	cmd.Stderr = &stderr
	if err := cmd.Run(); err != nil {
		return nil, fmt.Errorf("ffmpeg: %w: %s", err, stderr.String())
	}
	if out.Len() == 0 {
		return nil, fmt.Errorf("ffmpeg produced empty output")
	}
	return out.Bytes(), nil
}
