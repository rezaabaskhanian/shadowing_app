package assessmenthandler

import (
	"encoding/json"
	"fmt"
	"net/http"
	"strconv"

	"shadowing-backend/internal/pkg/claims"
	"shadowing-backend/internal/pkg/errorhandling"
	"shadowing-backend/internal/pkg/upload"
	"shadowing-backend/internal/service/assessment/dto"

	"github.com/labstack/echo/v4"
)

// GetTestV2 - آیتم‌های تست تعیین سطح نسخه‌ی ۲ (لغت، شنیدن، تکرار، معرفی اختیاری)
func (h *Handler) GetTestV2(c echo.Context) error {
	response, err := h.assessmentSvc.GetTestV2(c.Request().Context())
	if err != nil {
		return errorhandling.ErrorHandling(err, c)
	}
	return c.JSON(http.StatusOK, response)
}

// SubmitTestV2 - ارسال تست نسخه‌ی ۲ در یک درخواست multipart: فیلد answers
// (JSON پاسخ‌های لغت و شنیدن) و صداهای اندیس‌دار item_id_0/duration_0/audio_0
// برای جمله‌های تکرار و معرفی خود.
func (h *Handler) SubmitTestV2(c echo.Context) error {
	userClaims, err := claims.GetClaims(c)
	if err != nil {
		return c.JSON(http.StatusUnauthorized, map[string]string{
			"error":   "unauthorized",
			"message": "احراز هویت نامعتبر است",
		})
	}

	var answers dto.SubmitV2Answers
	if err := json.Unmarshal([]byte(c.FormValue("answers")), &answers); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{
			"error":   "answers_invalid",
			"message": "فیلد answers نامعتبر است",
		})
	}

	var audio []dto.SubmitItem
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
		audio = append(audio, dto.SubmitItem{ItemID: itemID, LocalAudioPath: localPath, Duration: duration})
	}

	response, err := h.assessmentSvc.SubmitTestV2(c.Request().Context(), userClaims.UserID, answers, audio)
	if err != nil {
		return errorhandling.ErrorHandling(err, c)
	}
	return c.JSON(http.StatusOK, response)
}
