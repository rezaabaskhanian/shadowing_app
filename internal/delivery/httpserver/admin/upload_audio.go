package adminhandler

import (
	"io"
	"net/http"
	"path/filepath"
	"strings"

	"github.com/google/uuid"
	"github.com/labstack/echo/v4"
)

// پسوندهای مجاز برای فایل صوتی دیالوگ
var allowedAudioExt = map[string]bool{
	".mp3":  true,
	".wav":  true,
	".m4a":  true,
	".ogg":  true,
	".webm": true,
	".aac":  true,
}

var audioContentTypeByExt = map[string]string{
	".mp3":  "audio/mpeg",
	".wav":  "audio/wav",
	".m4a":  "audio/mp4",
	".ogg":  "audio/ogg",
	".webm": "audio/webm",
	".aac":  "audio/aac",
}

const maxAudioSize = 20 << 20 // 20MB

// UploadAudio یک فایل صوتی برای یک دیالوگ دریافت، ذخیره و URL آن را برمی‌گرداند.
// فیلد فرم: "audio" (multipart/form-data)
func (h Handler) UploadAudio(c echo.Context) error {

	fileHeader, err := c.FormFile("audio")
	if err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{
			"error":   "audio_required",
			"message": "فایل صوتی ارسال نشده است (فیلد audio)",
		})
	}

	if fileHeader.Size > maxAudioSize {
		return c.JSON(http.StatusBadRequest, map[string]string{
			"error":   "file_too_large",
			"message": "حجم فایل صوتی نباید بیشتر از ۲۰ مگابایت باشد",
		})
	}

	ext := strings.ToLower(filepath.Ext(fileHeader.Filename))
	if !allowedAudioExt[ext] {
		return c.JSON(http.StatusBadRequest, map[string]string{
			"error":   "invalid_audio_type",
			"message": "فرمت صوتی مجاز نیست. مجاز: mp3, wav, m4a, ogg, webm, aac",
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

	data, err := io.ReadAll(src)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{
			"error":   "read_error",
			"message": "خطا در خواندن فایل",
		})
	}

	filename := uuid.NewString() + ext
	url, err := h.store.Save(c.Request().Context(), filename, data, audioContentTypeByExt[ext])
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{
			"error":   "storage_error",
			"message": "خطا در ذخیره فایل",
		})
	}

	return c.JSON(http.StatusCreated, map[string]string{
		"url":      url,
		"filename": filename,
		"message":  "فایل صوتی با موفقیت آپلود شد",
	})
}
