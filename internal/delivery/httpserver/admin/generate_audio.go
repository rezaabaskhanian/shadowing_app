package adminhandler

import (
	"net/http"
	"strings"

	"github.com/google/uuid"
	"github.com/labstack/echo/v4"
)

type generateAudioRequest struct {
	Text    string  `json:"text"`
	VoiceID string  `json:"voice_id"`
	Speed   float64 `json:"speed"`
}

// GenerateAudio متن یک دیالوگ را با provider فعال TTS (ElevenLabs یا Gemini) به صدا تبدیل و در uploads ذخیره می‌کند
// و آدرس آن را برمی‌گرداند (دقیقاً مشابه خروجی UploadAudio، برای جایگزینی آپلود دستی).
func (h Handler) GenerateAudio(c echo.Context) error {
	if !h.ttsSvc.Enabled() {
		return c.JSON(http.StatusServiceUnavailable, echo.Map{
			"message": h.ttsSvc.MissingKeyMessage(),
		})
	}

	var req generateAudioRequest
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, echo.Map{"message": "درخواست نامعتبر"})
	}
	if strings.TrimSpace(req.Text) == "" {
		return c.JSON(http.StatusBadRequest, echo.Map{"message": "متن دیالوگ خالی است"})
	}

	audio, err := h.ttsSvc.GenerateSpeech(c.Request().Context(), req.Text, req.VoiceID, req.Speed)
	if err != nil {
		return c.JSON(http.StatusBadGateway, echo.Map{"message": err.Error()})
	}

	filename := uuid.NewString() + audio.Ext
	url, err := h.store.Save(c.Request().Context(), filename, audio.Data, audio.ContentType)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, echo.Map{"message": "خطا در ذخیره فایل صوتی"})
	}

	return c.JSON(http.StatusCreated, map[string]string{
		"url":      url,
		"filename": filename,
		"message":  "صدا با هوش مصنوعی ساخته شد",
	})
}
