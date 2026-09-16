package aiconversationhandler

import (
	"net/http"

	"shadowing-backend/internal/pkg/claims"
	"shadowing-backend/internal/pkg/errorhandling"
	"shadowing-backend/internal/service/aiconversation/dto"

	"github.com/labstack/echo/v4"
)

// Start - شروع یک گفتگوی آزاد بعد از تمام‌شدنِ یک صحنه
func (h *Handler) Start(c echo.Context) error {
	userClaims, err := claims.GetClaims(c)
	if err != nil {
		return c.JSON(http.StatusUnauthorized, map[string]string{
			"error":   "unauthorized",
			"message": "احراز هویت نامعتبر است",
		})
	}

	var req dto.StartConversationRequest
	if err := c.Bind(&req); err != nil || req.SceneID == "" {
		return c.JSON(http.StatusBadRequest, map[string]string{
			"error":   "invalid_input",
			"message": "scene_id ارسال نشده است",
		})
	}

	response, err := h.svc.StartConversation(c.Request().Context(), userClaims.UserID, req.SceneID)
	if err != nil {
		return errorhandling.ErrorHandling(err, c)
	}
	return c.JSON(http.StatusOK, response)
}
