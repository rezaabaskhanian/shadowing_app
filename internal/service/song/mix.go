package songservice

import (
	"context"
	"fmt"
	"os"
	"os/exec"
	"path"
	"path/filepath"
	"strconv"
	"strings"
	"time"

	"shadowing-backend/internal/pkg/richerror"
)

// maxMixSeconds سقف طول ضبطی که با موزیک ترکیب می‌شود (یک آهنگ کامل با کمی حاشیه).
const maxMixSeconds = 8 * 60

// voiceGain/backingGain بلندی صدای کاربر و موزیک در فایل نهایی؛ صدای کاربر کمی جلوتر.
const (
	voiceGain   = 1.6
	backingGain = 0.7
)

// MixTake صدای ضبط‌شده‌ی کاربر را روی نسخه‌ی بی‌کلامِ همان تکه از آهنگ می‌گذارد و
// یک mp3 برمی‌گرداند (چیزی روی سرور ذخیره نمی‌شود؛ فراخواننده فایل خروجی را پاک
// می‌کند). offsetMs لحظه‌ای از آهنگ است که ضبط از آن شروع شد.
func (s *Service) MixTake(ctx context.Context, songID, voicePath string, offsetMs, durationMs int) (string, error) {
	const op = "song.MixTake"
	invalid := func(msg string) (string, error) {
		return "", richerror.New(op).WithMessage(msg).WithKind(richerror.KindInvalid)
	}
	song, err := s.Get(ctx, songID)
	if err != nil {
		return "", err
	}
	if song.InstrumentalURL == "" {
		return invalid("این آهنگ نسخه‌ی بی‌کلام ندارد")
	}
	if s.store == nil {
		return invalid("ذخیره‌ساز فایل در دسترس نیست")
	}
	if offsetMs < 0 || durationMs <= 0 || durationMs > maxMixSeconds*1000 {
		return invalid("طول ضبط نامعتبر است")
	}
	backing, cleanup, err := s.store.Open(ctx, path.Base(song.InstrumentalURL))
	if err != nil {
		return "", richerror.New(op).WithErr(err).WithMessage("موزیک آهنگ پیدا نشد")
	}
	defer cleanup()

	out := filepath.Join(os.TempDir(), fmt.Sprintf("song-mix-%d.mp3", time.Now().UnixNano()))
	ctx, cancel := context.WithTimeout(ctx, 90*time.Second)
	defer cancel()
	sec := func(ms int) string { return strconv.FormatFloat(float64(ms)/1000, 'f', 3, 64) }
	filter := fmt.Sprintf("[0:a]volume=%.2f[m];[1:a]volume=%.2f[v];[m][v]amix=inputs=2:duration=shortest:normalize=0", backingGain, voiceGain)
	cmd := exec.CommandContext(ctx, "ffmpeg", "-y", "-loglevel", "error",
		"-ss", sec(offsetMs), "-t", sec(durationMs), "-i", backing,
		"-i", voicePath,
		"-filter_complex", filter,
		"-ac", "2", "-b:a", "160k", out)
	if msg, err := cmd.CombinedOutput(); err != nil {
		_ = os.Remove(out)
		return "", richerror.New(op).WithErr(fmt.Errorf("ffmpeg: %v: %s", err, strings.TrimSpace(string(msg)))).WithMessage("ساخت فایل ناموفق بود")
	}
	return out, nil
}
