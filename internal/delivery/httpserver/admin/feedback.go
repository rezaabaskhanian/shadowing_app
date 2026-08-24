package adminhandler

import (
	"net/http"

	"github.com/labstack/echo/v4"
)

// ListFeedbacks پیام‌های «پیشنهاد و انتقاد» ثبت‌شده توسط کاربران را برای صفحه‌ی
// پنل ادمین برمی‌گرداند.
func (h Handler) ListFeedbacks(c echo.Context) error {
	list, err := h.feedbackSvc.ListAll(c.Request().Context())
	if err != nil {
		return c.JSON(http.StatusInternalServerError, echo.Map{"message": "خطا در خواندن پیام‌ها"})
	}
	return c.JSON(http.StatusOK, echo.Map{"feedbacks": list})
}
