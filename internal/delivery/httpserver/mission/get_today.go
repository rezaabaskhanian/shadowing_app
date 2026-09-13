package missionhandler

import (
	"net/http"

	"shadowing-backend/internal/pkg/claims"
	"shadowing-backend/internal/pkg/errorhandling"

	"github.com/labstack/echo/v4"
)

// GetTodaysMission صحنه‌ی پیشنهادیِ امروز برای کاربرِ لاگین‌شده را برمی‌گرداند.
// اگر هیچ صحنه‌ی منتشرشده‌ای وجود نداشته باشد ۴۰۴ برمی‌گردد — موبایل این را
// سیگنالِ «بی‌صدا برگرد به حالتِ قدیمی» می‌داند.
func (h *Handler) GetTodaysMission(c echo.Context) error {
	userClaims, err := claims.GetClaims(c)
	if err != nil {
		return c.JSON(http.StatusUnauthorized, map[string]string{
			"error":   "unauthorized",
			"message": "احراز هویت نامعتبر است",
		})
	}

	response, err := h.missionSvc.GetTodaysMission(c.Request().Context(), userClaims.UserID)
	if err != nil {
		return errorhandling.ErrorHandling(err, c)
	}
	return c.JSON(http.StatusOK, response)
}
