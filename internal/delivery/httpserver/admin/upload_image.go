package adminhandler

import (
	"io"
	"net/http"
	"os"
	"path/filepath"
	"strings"

	"github.com/google/uuid"
	"github.com/labstack/echo/v4"
)

// پسوندهای مجاز برای تصویر پس‌زمینه صحنه
var allowedImageExt = map[string]bool{
	".png":  true,
	".jpg":  true,
	".jpeg": true,
	".webp": true,
	".gif":  true,
}

const maxImageSize = 10 << 20 // 10MB

// UploadImage یک تصویر را دریافت، روی دیسک ذخیره و URL عمومی آن را برمی‌گرداند.
// فیلد فرم: "image" (multipart/form-data)
func (h Handler) UploadImage(c echo.Context) error {

	fileHeader, err := c.FormFile("image")
	if err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{
			"error":   "image_required",
			"message": "فایل تصویر ارسال نشده است (فیلد image)",
		})
	}

	if fileHeader.Size > maxImageSize {
		return c.JSON(http.StatusBadRequest, map[string]string{
			"error":   "file_too_large",
			"message": "حجم تصویر نباید بیشتر از ۱۰ مگابایت باشد",
		})
	}

	ext := strings.ToLower(filepath.Ext(fileHeader.Filename))
	if !allowedImageExt[ext] {
		return c.JSON(http.StatusBadRequest, map[string]string{
			"error":   "invalid_image_type",
			"message": "فرمت تصویر مجاز نیست. مجاز: png, jpg, jpeg, webp, gif",
		})
	}

	// اطمینان از وجود پوشه‌ی آپلود
	if err := os.MkdirAll(h.uploadDir, 0o755); err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{
			"error":   "storage_error",
			"message": "خطا در آماده‌سازی محل ذخیره‌سازی",
		})
	}

	src, err := fileHeader.Open()
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{
			"error":   "read_error",
			"message": "خطا در خواندن فایل",
		})
	}
	defer src.Close()

	// نام یکتا برای جلوگیری از تداخل
	filename := uuid.NewString() + ext
	dstPath := filepath.Join(h.uploadDir, filename)

	dst, err := os.Create(dstPath)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{
			"error":   "storage_error",
			"message": "خطا در ذخیره فایل",
		})
	}
	defer dst.Close()

	if _, err := io.Copy(dst, src); err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{
			"error":   "storage_error",
			"message": "خطا در نوشتن فایل",
		})
	}

	// URL عمومی: مثلاً /uploads/<uuid>.png
	url := strings.TrimRight(h.publicPath, "/") + "/" + filename

	return c.JSON(http.StatusCreated, map[string]string{
		"url":      url,
		"filename": filename,
		"message":  "تصویر با موفقیت آپلود شد",
	})
}
