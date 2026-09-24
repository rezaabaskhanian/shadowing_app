package assessmenthandler

import (
	"net/http"

	"shadowing-backend/internal/pkg/claims"
	"shadowing-backend/internal/pkg/errorhandling"
	"shadowing-backend/internal/service/assessment/dto"

	"github.com/labstack/echo/v4"
)

// GetLevel - سطح مؤثر کاربر (دستی یا از تست) و منبعش.
func (h *Handler) GetLevel(c echo.Context) error {
	userClaims, err := claims.GetClaims(c)
	if err != nil {
		return c.JSON(http.StatusUnauthorized, map[string]string{"message": "احراز هویت نامعتبر است"})
	}

	response, err := h.assessmentSvc.GetLevel(c.Request().Context(), userClaims.UserID)
	if err != nil {
		return errorhandling.ErrorHandling(err, c)
	}
	return c.JSON(http.StatusOK, response)
}

// SetLevel - کاربر سطحش را دستی انتخاب می‌کند؛ scene_level خالی = برگشت به نتیجه‌ی تست.
func (h *Handler) SetLevel(c echo.Context) error {
	userClaims, err := claims.GetClaims(c)
	if err != nil {
		return c.JSON(http.StatusUnauthorized, map[string]string{"message": "احراز هویت نامعتبر است"})
	}

	var req dto.SetLevelRequest
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"message": "درخواست نامعتبر"})
	}

	response, err := h.assessmentSvc.SetLevel(c.Request().Context(), userClaims.UserID, req.SceneLevel)
	if err != nil {
		return errorhandling.ErrorHandling(err, c)
	}
	return c.JSON(http.StatusOK, response)
}
