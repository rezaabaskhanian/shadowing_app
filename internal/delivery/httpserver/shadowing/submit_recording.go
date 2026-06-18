package shadowinghandler

import (
	"net/http"
	"shadowing-backend/internal/pkg/errorhandling"
	"shadowing-backend/internal/service/shadowing/dto"

	"github.com/labstack/echo/v4"
)

// SubmitRecording - ارسال ضبط برای مرحله فعلی
// @Summary ارسال ضبط صدا برای مرحله تمرین
// @Description ضبط کاربر را برای مرحله فعلی ذخیره می‌کند
// @Tags Shadowing
// @Accept json
// @Produce json
// @Param id path string true "شناسه جلسه"
// @Param request body dto.SubmitRecordingRequest true "اطلاعات ضبط"
// @Success 200 {object} dto.SubmitRecordingResponse
// @Failure 400 {object} map[string]string
// @Failure 404 {object} map[string]string
// @Failure 500 {object} map[string]string
// @Router /api/v1/shadowing/session/{id}/recording [post]
func (h *Handler) SubmitRecording(c echo.Context) error {
	const op = "shadowinghandler.SubmitRecording"

	sessionID := c.Param("id")
	if sessionID == "" {
		return c.JSON(http.StatusBadRequest, map[string]string{
			"error":   "session_id_required",
			"message": "شناسه جلسه الزامی است",
		})
	}

	var req dto.SubmitRecordingRequest
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{
			"error":   "invalid_request",
			"message": "درخواست نامعتبر است",
		})
	}

	// اعتبارسنجی
	if req.AudioPath == "" {
		return c.JSON(http.StatusBadRequest, map[string]string{
			"error":   "audio_path_required",
			"message": "مسیر فایل صوتی الزامی است",
		})
	}
	if req.Duration <= 0 {
		return c.JSON(http.StatusBadRequest, map[string]string{
			"error":   "invalid_duration",
			"message": "مدت زمان ضبط باید بیشتر از صفر باشد",
		})
	}

	// تنظیم SessionID در درخواست
	req.SessionID = sessionID

	response, err := h.ShadowingSvc.SubmitRecording(c.Request().Context(), req)
	if err != nil {
		errorhandling.ErrorHandling(err, c)
	}

	return c.JSON(http.StatusOK, response)
}
