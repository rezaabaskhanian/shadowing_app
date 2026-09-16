package aiconversationhandler

import (
	"net/http"

	"shadowing-backend/internal/pkg/claims"
	"shadowing-backend/internal/pkg/errorhandling"
	"shadowing-backend/internal/pkg/upload"

	"github.com/labstack/echo/v4"
)

// SendTurn - ارسال یک نوبت صوتی از کاربر (multipart: conversation_id + audio)
func (h *Handler) SendTurn(c echo.Context) error {
	userClaims, err := claims.GetClaims(c)
	if err != nil {
		return c.JSON(http.StatusUnauthorized, map[string]string{
			"error":   "unauthorized",
			"message": "احراز هویت نامعتبر است",
		})
	}

	conversationID := c.FormValue("conversation_id")
	if conversationID == "" {
		return c.JSON(http.StatusBadRequest, map[string]string{
			"error":   "conversation_id_required",
			"message": "conversation_id ارسال نشده است",
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

	response, err := h.svc.SendTurn(c.Request().Context(), userClaims.UserID, conversationID, localPath)
	if err != nil {
		return errorhandling.ErrorHandling(err, c)
	}
	return c.JSON(http.StatusOK, response)
}
