package freespeechhandler

import (
	"net/http"

	"shadowing-backend/internal/pkg/claims"
	"shadowing-backend/internal/pkg/errorhandling"
	"shadowing-backend/internal/pkg/upload"

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
