package upload

import (
	"io"
	"mime/multipart"
	"os"
	"path/filepath"
	"strings"

	"shadowing-backend/internal/pkg/richerror"

	"github.com/google/uuid"
)

var allowedRecordingExt = map[string]bool{
	".webm": true, // چیزی که وب‌ویوی اندروید می‌دهد
	".m4a":  true, // چیزی که وب‌ویوی iOS می‌دهد
	".mp4":  true,
	".ogg":  true,
	".wav":  true,
	".mp3":  true,
	".aac":  true,
}

// MaxRecordingSize - ضبط‌های تمرین چند ثانیه‌ای‌اند؛ سقف ۱۵ مگابایت خیلی
// سخاوتمندانه است و جلوی آپلود فایل‌های نامربوط را می‌گیرد.
const MaxRecordingSize = 15 << 20

// SaveRecording فایل صوتی ضبط‌شده‌ی کاربر را در یک پوشه‌ی موقت روی دیسک
// می‌نویسد و مسیرش را برمی‌گرداند.
//
// برخلاف SaveImage اینجا URL عمومی برنمی‌گردانیم و فایل هم سرو نمی‌شود:
// ضبط صدای کاربر فقط برای نمره‌دهی به سرور می‌آید و بعد از ارزیابی پاک
// می‌شود. نسخه‌ی اصلی روی گوشی خود کاربر می‌ماند.
func SaveRecording(fileHeader *multipart.FileHeader, baseDir string) (path string, err error) {
	const op = "upload.SaveRecording"

	if fileHeader.Size > MaxRecordingSize {
		return "", richerror.New(op).
			WithMessage("حجم فایل صوتی نباید بیشتر از ۱۵ مگابایت باشد").
			WithKind(richerror.KindInvalid)
	}

	ext := strings.ToLower(filepath.Ext(fileHeader.Filename))
	if ext == "" {
		// بعضی وب‌ویوها بلاب را بدون نام فایل می‌فرستند؛ ffmpeg خودش فرمت را
		// از محتوا تشخیص می‌دهد، پس پسوند پیش‌فرض مشکلی درست نمی‌کند.
		ext = ".webm"
	}
	if !allowedRecordingExt[ext] {
		return "", richerror.New(op).
			WithMessage("فرمت صوتی مجاز نیست. مجاز: webm, m4a, mp4, ogg, wav, mp3, aac").
			WithKind(richerror.KindInvalid)
	}

	dir := filepath.Join(baseDir, "recordings")
	if err := os.MkdirAll(dir, 0o755); err != nil {
		return "", richerror.New(op).WithErr(err).WithMessage("خطا در آماده‌سازی محل ذخیره‌سازی")
	}

	src, err := fileHeader.Open()
	if err != nil {
		return "", richerror.New(op).WithErr(err).WithMessage("خطا در خواندن فایل")
	}
	defer src.Close()

	dstPath := filepath.Join(dir, uuid.NewString()+ext)

	dst, err := os.Create(dstPath)
	if err != nil {
		return "", richerror.New(op).WithErr(err).WithMessage("خطا در ذخیره فایل")
	}
	defer dst.Close()

	if _, err := io.Copy(dst, src); err != nil {
		os.Remove(dstPath)
		return "", richerror.New(op).WithErr(err).WithMessage("خطا در نوشتن فایل")
	}

	return dstPath, nil
}
