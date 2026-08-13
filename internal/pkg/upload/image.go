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

var allowedImageExt = map[string]bool{
	".png":  true,
	".jpg":  true,
	".jpeg": true,
	".webp": true,
	".gif":  true,
}

const MaxImageSize = 10 << 20 // 10MB

// SaveImage یک فایل تصویر آپلودشده (multipart) را روی دیسک ذخیره می‌کند و
// URL عمومی + نام فایل را برمی‌گرداند. بین آپلود ادمین و آپلود کاربر عادی
// (پیشنهاد صحنه) مشترک است تا منطق اعتبارسنجی/ذخیره تکرار نشود.
func SaveImage(fileHeader *multipart.FileHeader, uploadDir, publicPath string) (url, filename string, err error) {
	const op = "upload.SaveImage"

	if fileHeader.Size > MaxImageSize {
		return "", "", richerror.New(op).WithMessage("حجم تصویر نباید بیشتر از ۱۰ مگابایت باشد")
	}

	ext := strings.ToLower(filepath.Ext(fileHeader.Filename))
	if !allowedImageExt[ext] {
		return "", "", richerror.New(op).WithMessage("فرمت تصویر مجاز نیست. مجاز: png, jpg, jpeg, webp, gif")
	}

	if err := os.MkdirAll(uploadDir, 0o755); err != nil {
		return "", "", richerror.New(op).WithErr(err).WithMessage("خطا در آماده‌سازی محل ذخیره‌سازی")
	}

	src, err := fileHeader.Open()
	if err != nil {
		return "", "", richerror.New(op).WithErr(err).WithMessage("خطا در خواندن فایل")
	}
	defer src.Close()

	filename = uuid.NewString() + ext
	dstPath := filepath.Join(uploadDir, filename)

	dst, err := os.Create(dstPath)
	if err != nil {
		return "", "", richerror.New(op).WithErr(err).WithMessage("خطا در ذخیره فایل")
	}
	defer dst.Close()

	if _, err := io.Copy(dst, src); err != nil {
		return "", "", richerror.New(op).WithErr(err).WithMessage("خطا در نوشتن فایل")
	}

	url = strings.TrimRight(publicPath, "/") + "/" + filename
	return url, filename, nil
}
