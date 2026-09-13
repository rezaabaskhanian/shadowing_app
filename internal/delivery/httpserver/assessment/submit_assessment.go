package assessmenthandler

import (
	"fmt"
	"net/http"
	"strconv"

	"shadowing-backend/internal/pkg/claims"
	"shadowing-backend/internal/pkg/errorhandling"
	"shadowing-backend/internal/pkg/upload"
	"shadowing-backend/internal/service/assessment/dto"

	"github.com/labstack/echo/v4"
)

// SubmitAssessment - ارسال هر سه آیتم تست تعیین سطح در یک درخواست multipart:
// فیلدهای اندیس‌دار item_id_0/duration_0/audio_0، item_id_1/... . برخلاف
// مسیر shadowing، ورودی JSON-only اینجا پشتیبانی نمی‌شود — هدف این تست دقیقاً
// نمره‌ی صادقانه از روی صدای واقعی است.
func (h *Handler) SubmitAssessment(c echo.Context) error {
	userClaims, err := claims.GetClaims(c)
	if err != nil {
		return c.JSON(http.StatusUnauthorized, map[string]string{
			"error":   "unauthorized",
			"message": "احراز هویت نامعتبر است",
		})
	}

	var items []dto.SubmitItem
	for i := 0; ; i++ {
		fileHeader, ferr := c.FormFile(fmt.Sprintf("audio_%d", i))
		if ferr != nil {
			break
		}
		itemID := c.FormValue(fmt.Sprintf("item_id_%d", i))
		if itemID == "" {
			return c.JSON(http.StatusBadRequest, map[string]string{
				"error":   "item_id_required",
				"message": fmt.Sprintf("item_id_%d ارسال نشده است", i),
			})
		}
		duration, _ := strconv.Atoi(c.FormValue(fmt.Sprintf("duration_%d", i)))

		localPath, uerr := upload.SaveRecording(fileHeader, h.uploadDir)
		if uerr != nil {
			return errorhandling.ErrorHandling(uerr, c)
		}

		items = append(items, dto.SubmitItem{
			ItemID:         itemID,
			LocalAudioPath: localPath,
			Duration:       duration,
		})
	}

	if len(items) == 0 {
		return c.JSON(http.StatusBadRequest, map[string]string{
			"error":   "audio_required",
			"message": "هیچ فایل صوتی‌ای ارسال نشده است (فیلدهای audio_0, audio_1, ...)",
		})
	}

	response, err := h.assessmentSvc.SubmitAssessment(c.Request().Context(), userClaims.UserID, items)
	if err != nil {
		return errorhandling.ErrorHandling(err, c)
	}
	return c.JSON(http.StatusOK, response)
}
