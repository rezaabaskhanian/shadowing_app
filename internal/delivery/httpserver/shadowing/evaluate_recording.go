package shadowinghandler

import (
	"net/http"
	"strconv"

	"shadowing-backend/internal/pkg/errorhandling"
	"shadowing-backend/internal/pkg/upload"
	"shadowing-backend/internal/service/shadowing/dto"

	"github.com/labstack/echo/v4"
)

// EvaluateRecording - نمره‌دهی تلفظ یک ضبط، بدون جلسه و بدون تغییر state.
//
// ورودی همیشه multipart/form-data است:
//
//	audio             فایل صوتی (webm/m4a/...)
//	dialogue_id       شناسه‌ی جمله؛ متن هدف از دیتابیس خوانده می‌شود
//	target_text       جایگزین dialogue_id
//	duration          مدت ضبط کاربر (ثانیه)
//	expected_duration مدت صدای مرجع (ثانیه، اختیاری)
//
// چون هیچ چیزی ذخیره نمی‌شود، کاربر می‌تواند یک جمله را هرچندبار که خواست
// دوباره ضبط و ارزیابی کند.
//
// @Summary نمره‌دهی تلفظ یک ضبط
// @Tags Shadowing
// @Accept mpfd
// @Produce json
// @Success 200 {object} dto.EvaluateRecordingResponse
// @Failure 400 {object} map[string]string
// @Router /api/v1/shadowing/evaluate [post]
func (h *Handler) EvaluateRecording(c echo.Context) error {
	fileHeader, err := c.FormFile("audio")
	if err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{
			"error":   "audio_required",
			"message": "فایل صوتی ارسال نشده است (فیلد audio)",
		})
	}

	localPath, err := upload.SaveRecording(fileHeader, h.uploadDir)
	if err != nil {
		return errorhandling.ErrorHandling(err, c)
	}

	duration, _ := strconv.Atoi(c.FormValue("duration"))
	expected, _ := strconv.Atoi(c.FormValue("expected_duration"))

	req := dto.EvaluateRecordingRequest{
		DialogueID:       c.FormValue("dialogue_id"),
		TargetText:       c.FormValue("target_text"),
		Duration:         duration,
		ExpectedDuration: expected,
		LocalAudioPath:   localPath,
	}

	response, err := h.ShadowingSvc.EvaluateRecording(c.Request().Context(), req)
	if err != nil {
		return errorhandling.ErrorHandling(err, c)
	}

	return c.JSON(http.StatusOK, response)
}
