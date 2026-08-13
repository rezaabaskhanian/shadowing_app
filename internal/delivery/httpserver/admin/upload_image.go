package adminhandler

import (
	"net/http"

	"shadowing-backend/internal/pkg/upload"

	"github.com/labstack/echo/v4"
)

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

	url, filename, err := upload.SaveImage(fileHeader, h.uploadDir, h.publicPath)
	if err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{
			"error":   "upload_failed",
			"message": err.Error(),
		})
	}

	return c.JSON(http.StatusCreated, map[string]string{
		"url":      url,
		"filename": filename,
		"message":  "تصویر با موفقیت آپلود شد",
	})
}
