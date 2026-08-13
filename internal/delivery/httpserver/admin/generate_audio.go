package adminhandler

import (
	"net/http"
	"os"
	"path/filepath"
	"strings"

	"github.com/google/uuid"
	"github.com/labstack/echo/v4"
)

type generateAudioRequest struct {
	Text    string `json:"text"`
	VoiceID string `json:"voice_id"`
}

// GenerateAudio متن یک دیالوگ را با ElevenLabs به صدا تبدیل و در uploads ذخیره می‌کند
// و آدرس آن را برمی‌گرداند (دقیقاً مشابه خروجی UploadAudio، برای جایگزینی آپلود دستی).
func (h Handler) GenerateAudio(c echo.Context) error {
	if !h.ttsSvc.Enabled() {
		return c.JSON(http.StatusServiceUnavailable, echo.Map{
			"message": "کلید ELEVENLABS_API_KEY تنظیم نشده است",
		})
	}

	var req generateAudioRequest
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, echo.Map{"message": "درخواست نامعتبر"})
	}
	if strings.TrimSpace(req.Text) == "" {
		return c.JSON(http.StatusBadRequest, echo.Map{"message": "متن دیالوگ خالی است"})
	}

	audio, err := h.ttsSvc.GenerateSpeech(c.Request().Context(), req.Text, req.VoiceID)
	if err != nil {
		return c.JSON(http.StatusBadGateway, echo.Map{"message": err.Error()})
	}

	if err := os.MkdirAll(h.uploadDir, 0o755); err != nil {
		return c.JSON(http.StatusInternalServerError, echo.Map{"message": "خطا در آماده‌سازی محل ذخیره‌سازی"})
	}

	filename := uuid.NewString() + ".mp3"
	dstPath := filepath.Join(h.uploadDir, filename)
	if err := os.WriteFile(dstPath, audio, 0o644); err != nil {
		return c.JSON(http.StatusInternalServerError, echo.Map{"message": "خطا در ذخیره فایل صوتی"})
	}

	url := strings.TrimRight(h.publicPath, "/") + "/" + filename
	return c.JSON(http.StatusCreated, map[string]string{
		"url":      url,
		"filename": filename,
		"message":  "صدا با هوش مصنوعی ساخته شد",
	})
}
