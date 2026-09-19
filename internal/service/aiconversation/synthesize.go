package aiconversationservice

import (
	"context"
	"log/slog"

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

	filename := "ai-conversation/" + uuid.NewString() + ".mp3"
	url, err := s.store.Save(ctx, filename, audio, "audio/mpeg")
	if err != nil {
		slog.Warn("aiconversation: failed to store tts file", "err", err)
		return ""
	}
	return url
}
