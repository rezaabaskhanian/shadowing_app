package aiconversationservice

import (
	"context"
	"log/slog"
	"os"
	"path/filepath"
	"strings"

	"github.com/google/uuid"
)

// synthesize متن پاسخ AI را با ElevenLabs به صدا تبدیل می‌کند و آدرسِ عمومیِ
// فایل را برمی‌گرداند. هیچ‌وقت خطا برنمی‌گرداند — اگر کلید تنظیم نشده یا
// فراخوانی شکست بخورد، رشته‌ی خالی برمی‌گردد تا گفتگو هیچ‌وقت به خاطر TTS
// مسدود نشود (کاربر فقط پاسخ متنی را بدون صدا می‌بیند).
func (s *Service) synthesize(ctx context.Context, text string) string {
	if !s.tts.Enabled() {
		return ""
	}

	audio, err := s.tts.GenerateSpeech(ctx, text, "", 0)
	if err != nil {
		slog.Warn("aiconversation: tts generation failed", "err", err)
		return ""
	}

	dir := filepath.Join(s.uploadDir, "ai-conversation")
	if err := os.MkdirAll(dir, 0o755); err != nil {
		slog.Warn("aiconversation: failed to prepare tts upload dir", "err", err)
		return ""
	}

	filename := uuid.NewString() + ".mp3"
	if err := os.WriteFile(filepath.Join(dir, filename), audio, 0o644); err != nil {
		slog.Warn("aiconversation: failed to write tts file", "err", err)
		return ""
	}

	return strings.TrimRight(s.publicPath, "/") + "/ai-conversation/" + filename
}
