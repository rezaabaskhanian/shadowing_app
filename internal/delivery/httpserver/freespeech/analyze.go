package freespeechhandler

import (
	"net/http"

	"shadowing-backend/internal/pkg/claims"
	"shadowing-backend/internal/pkg/errorhandling"
	"shadowing-backend/internal/pkg/upload"
	"shadowing-backend/internal/service/freespeech/dto"

	"github.com/labstack/echo/v4"
)

// Analyze - ارسال یک ضبطِ آزادِ کاربر (multipart: scene_id + audio) بعد از
// تمام‌شدنِ یک صحنه، برای رونویسی + بازخوردِ ربط + گرامر.
func (h Handler) Analyze(c echo.Context) error {
	userClaims, err := claims.GetClaims(c)
	if err != nil {
		return c.JSON(http.StatusUnauthorized, map[string]string{
			"error":   "unauthorized",
			"message": "احراز هویت نامعتبر است",
		})
	}

	sceneID := c.FormValue("scene_id")
	if sceneID == "" {
		return c.JSON(http.StatusBadRequest, map[string]string{
			"error":   "scene_id_required",
			"message": "scene_id ارسال نشده است",
		})
	}

	fileHeader, ferr := c.FormFile("audio")
	if ferr != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{
			"error":   "audio_required",
			"message": "فایل صوتی ارسال نشده است",
		})
	}

	localPath, uerr := upload.SaveRecording(fileHeader, h.uploadDir)
	if uerr != nil {
		return errorhandling.ErrorHandling(uerr, c)
	}

	response, err := h.svc.Analyze(c.Request().Context(), userClaims.UserID, sceneID, localPath)
	if err != nil {
		return errorhandling.ErrorHandling(err, c)
	}
	return c.JSON(http.StatusOK, response)
}

// Transcribe - مرحله‌ی اولِ دومرحله‌ای: ارسال ضبط (multipart: audio) و گرفتنِ
// فقط متنِ رونویسی‌شده. بازخورد جدا از /feedback می‌آید.
func (h Handler) Transcribe(c echo.Context) error {
	if _, err := claims.GetClaims(c); err != nil {
		return c.JSON(http.StatusUnauthorized, map[string]string{
			"error":   "unauthorized",
			"message": "احراز هویت نامعتبر است",
		})
	}

	fileHeader, ferr := c.FormFile("audio")
	if ferr != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{
			"error":   "audio_required",
			"message": "فایل صوتی ارسال نشده است",
		})
	}

	localPath, uerr := upload.SaveRecording(fileHeader, h.uploadDir)
	if uerr != nil {
		return errorhandling.ErrorHandling(uerr, c)
	}

	response, err := h.svc.Transcribe(c.Request().Context(), localPath)
	if err != nil {
		return errorhandling.ErrorHandling(err, c)
	}
	return c.JSON(http.StatusOK, response)
}

// Feedback - مرحله‌ی دوم: بازخوردِ ربط + گرامر برای متنِ رونویسی‌شده (JSON).
func (h Handler) Feedback(c echo.Context) error {
	userClaims, err := claims.GetClaims(c)
	if err != nil {
		return c.JSON(http.StatusUnauthorized, map[string]string{
			"error":   "unauthorized",
			"message": "احراز هویت نامعتبر است",
		})
	}

	var req dto.FeedbackRequest
	if err := c.Bind(&req); err != nil || req.SceneID == "" || req.Transcript == "" {
		return c.JSON(http.StatusBadRequest, map[string]string{
			"error":   "invalid_input",
			"message": "scene_id و transcript لازم است",
		})
	}

	response, err := h.svc.Feedback(c.Request().Context(), userClaims.UserID, req.SceneID, req.Transcript)
	if err != nil {
		return errorhandling.ErrorHandling(err, c)
	}
	return c.JSON(http.StatusOK, response)
}
