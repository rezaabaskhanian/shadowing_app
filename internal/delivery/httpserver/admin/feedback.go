package adminhandler

import (
	"net/http"

	"shadowing-backend/internal/pkg/adminnotice"
	"shadowing-backend/internal/pkg/errorhandling"

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

// ReplyFeedback جواب ادمین به یک پیام پیشنهاد/انتقاد را از پنل ثبت و با نوتیف
// به کاربر می‌فرستد (همان کاری که Reply در ربات تلگرام/بله می‌کند).
func (h Handler) ReplyFeedback(c echo.Context) error {
	var req struct {
		Reply string `json:"reply"`
	}
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, echo.Map{"message": "درخواست نامعتبر"})
	}
	pushed, err := h.feedbackSvc.Reply(c.Request().Context(), adminnotice.KindFeedback, c.Param("id"), "", req.Reply)
	if err != nil {
		return errorhandling.ErrorHandling(err, c)
	}
	return c.JSON(http.StatusOK, echo.Map{"pushed": pushed})
}

// TestAdminBot یک پیام آزمایشی به ربات‌های تلگرام/بله‌ی تنظیم‌شده می‌فرستد.
func (h Handler) TestAdminBot(c echo.Context) error {
	if h.adminBot == nil {
		return c.JSON(http.StatusServiceUnavailable, echo.Map{"message": "ربات راه‌اندازی نشده"})
	}
	return c.JSON(http.StatusOK, echo.Map{"results": h.adminBot.Test(c.Request().Context())})
}
