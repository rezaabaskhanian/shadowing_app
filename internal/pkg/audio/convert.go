// Package audio کارهای سطح‌پایین روی فایل‌های صوتی ضبط‌شده‌ی کاربر را انجام
// می‌دهد. فعلاً فقط تبدیل فرمت، که پیش‌نیاز نمره‌دهی تلفظ است.
package audio

import (
	"context"
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
	"time"
)

// convertTimeout سقف زمان اجرای ffmpeg. کلیپ‌های ما چند ثانیه‌ای هستند، پس
// اگر ffmpeg بیش از این طول بکشد یعنی چیزی گیر کرده و بهتر است بمیرد تا
// اینکه درخواست کاربر برای همیشه منتظر بماند.
const convertTimeout = 30 * time.Second

// Available می‌گوید آیا ffmpeg روی این ماشین نصب است یا نه. سرویس نمره‌دهی از
// این استفاده می‌کند تا وقتی ffmpeg نیست به‌جای خطا به حالت تخمینی برگردد.
func Available() bool {
	_, err := exec.LookPath("ffmpeg")
	return err == nil
}

// ToWAV16kMono فایل صوتی ورودی (webm/opus, m4a, mp3, ...) را به WAV تک‌کاناله‌ی
// ۱۶ کیلوهرتز تبدیل می‌کند — فرمتی که مدل‌های تشخیص گفتار انتظار دارند.
//
// خروجی در یک فایل موقت نوشته می‌شود و مسیرش برگردانده می‌شود؛ پاک کردنش با
// فراخواننده است.
func ToWAV16kMono(ctx context.Context, srcPath string) (string, error) {
	if !Available() {
		return "", fmt.Errorf("ffmpeg not found in PATH")
	}

	if _, err := os.Stat(srcPath); err != nil {
		return "", fmt.Errorf("source audio not readable: %w", err)
	}

	// اگر ورودی از قبل WAV است باز هم از ffmpeg رد می‌شود، چون نرخ نمونه‌برداری
	// و تعداد کانالش معلوم نیست و ممکن است ۴۴.۱ کیلوهرتز استریو باشد.
	dstPath := filepath.Join(
		os.TempDir(),
		fmt.Sprintf("stt-%d-%s.wav", time.Now().UnixNano(), strings.TrimSuffix(filepath.Base(srcPath), filepath.Ext(srcPath))),
	)

	ctx, cancel := context.WithTimeout(ctx, convertTimeout)
	defer cancel()

	cmd := exec.CommandContext(ctx, "ffmpeg",
		"-nostdin",
		"-y",
		"-i", srcPath,
		"-ac", "1", // تک‌کاناله
		"-ar", "16000", // ۱۶ کیلوهرتز
		"-c:a", "pcm_s16le", // PCM ۱۶ بیتی
		"-f", "wav",
		dstPath,
	)

	// خروجی خطای ffmpeg را نگه می‌داریم چون بدون آن دیباگ کردن فایل خرابِ
	// آمده از وب‌ویو تقریباً غیرممکن است.
	var stderr strings.Builder
	cmd.Stderr = &stderr

	if err := cmd.Run(); err != nil {
		os.Remove(dstPath)
		return "", fmt.Errorf("ffmpeg failed: %w (%s)", err, lastLines(stderr.String(), 3))
	}

	return dstPath, nil
}

// lastLines چند خط آخر خروجی ffmpeg را برمی‌گرداند؛ خروجی کامل چند ده خط بنر
// و اطلاعات build است که در لاگ فقط شلوغی می‌سازد.
func lastLines(s string, n int) string {
	lines := strings.Split(strings.TrimSpace(s), "\n")
	if len(lines) > n {
		lines = lines[len(lines)-n:]
	}
	return strings.Join(lines, " | ")
}
