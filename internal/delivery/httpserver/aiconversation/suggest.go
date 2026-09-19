package aiconversationhandler

import (
	"net/http"

	"shadowing-backend/internal/pkg/claims"
	"shadowing-backend/internal/pkg/errorhandling"
	"shadowing-backend/internal/service/aiconversation/dto"

	"github.com/labstack/echo/v4"
)

// Suggest - پیشنهاد جواب (۲ جمله‌ی انگلیسی + ترجمه‌ی فارسی) به آخرین پیامِ AI
func (h *Handler) Suggest(c echo.Context) error {
	userClaims, err := claims.GetClaims(c)
	if err != nil {
		return c.JSON(http.StatusUnauthorized, map[string]string{
			"error":   "unauthorized",
			"message": "احراز هویت نامعتبر است",
		})
	}

	var req dto.SuggestRequest
	if err := c.Bind(&req); err != nil || req.ConversationID == "" {
		return c.JSON(http.StatusBadRequest, map[string]string{
			"error":   "conversation_id_required",
			"message": "conversation_id ارسال نشده است",
		})
	}

	response, err := h.svc.Suggest(c.Request().Context(), userClaims.UserID, req.ConversationID)
	if err != nil {
		return errorhandling.ErrorHandling(err, c)
	}
	return c.JSON(http.StatusOK, response)
}

// SuggestAudio - صدای یک جمله‌ی پیشنهادی (فقط با درخواستِ پخش ساخته می‌شود)
func (h *Handler) SuggestAudio(c echo.Context) error {
	userClaims, err := claims.GetClaims(c)
	if err != nil {
		return c.JSON(http.StatusUnauthorized, map[string]string{
			"error":   "unauthorized",
			"message": "احراز هویت نامعتبر است",
		})
	}

	var req dto.SuggestAudioRequest
	if err := c.Bind(&req); err != nil || req.HintID == "" {
		return c.JSON(http.StatusBadRequest, map[string]string{
			"error":   "hint_id_required",
			"message": "hint_id ارسال نشده است",
		})
	}

	response, err := h.svc.SuggestAudio(c.Request().Context(), userClaims.UserID, req.HintID, req.Index)
	if err != nil {
		return errorhandling.ErrorHandling(err, c)
	}
	return c.JSON(http.StatusOK, response)
}
