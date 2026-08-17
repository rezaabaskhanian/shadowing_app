package progresshandler

import (
	"net/http"
	"shadowing-backend/internal/pkg/claims"
	"shadowing-backend/internal/pkg/errorhandling"

	"github.com/labstack/echo/v4"
)

// GetSkillsBreakdown - درصد مهارت‌های واقعی (تلفظ/روانی گفتار/دایره‌واژگان)
// کاربر لاگین‌شده
func (h *Handler) GetSkillsBreakdown(c echo.Context) error {
	const op = "progresshandler.GetSkillsBreakdown"

	userClaims, err := claims.GetClaims(c)
	if err != nil {
		return c.JSON(http.StatusUnauthorized, map[string]string{
			"error":   "unauthorized",
			"message": "احراز هویت نامعتبر است",
		})
	}

	response, err := h.progressSvc.GetSkillsBreakdown(c.Request().Context(), userClaims.UserID)
	if err != nil {
		return errorhandling.ErrorHandling(err, c)
	}
	return c.JSON(http.StatusOK, response)
}
