package learninghandler

import (
	"net/http"

	"shadowing-backend/internal/pkg/claims"

	"github.com/labstack/echo/v4"
)

// GetAIUsage مصرفِ امروزِ کاربر از فیچرهای AI-heavy (AI Conversation، Free
// Speech) را برمی‌گرداند — برای نمایشِ نوارِ مصرف/پیشنهادِ خرید توکن در اپ.
// کاربرِ بدون اشتراکِ فعال هم می‌تواند این را بخواند (خطا نمی‌گیرد، فقط
// has_active_subscription=false)، تا اپ بتواند پیامِ درستِ «برای استفاده
// مشترک شو» را نشان بدهد، نه یک خطای گنگ.
func (h Handler) GetAIUsage(c echo.Context) error {
	userClaims, err := claims.GetClaims(c)
	if err != nil {
		return c.JSON(http.StatusUnauthorized, echo.Map{"message": "احراز هویت ناموفق"})
	}

	status, err := h.aiAccessSvc.Status(c.Request().Context(), userClaims.UserID)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, echo.Map{"message": "خطا در خواندن مصرف"})
	}

	return c.JSON(http.StatusOK, status)
}
