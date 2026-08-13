package adminhandler

import (
	"net/http"
	"strings"

	"shadowing-backend/internal/pkg/claims"

	"github.com/labstack/echo/v4"
)

// NotificationStats آمار تعداد کاربرانی که هر نوع نوتیفیکیشن را فعال کرده‌اند
// به‌همراه تعداد کل کاربران را برمی‌گرداند (برای پنل ادمین).
func (h Handler) NotificationStats(c echo.Context) error {
	dailyReminder, contentNotif, total, err := h.notificationSvc.Stats(c.Request().Context())
	if err != nil {
		return c.JSON(http.StatusInternalServerError, echo.Map{"message": "خطا در خواندن آمار نوتیفیکیشن"})
	}

	return c.JSON(http.StatusOK, echo.Map{
		"total_users":           total,
		"daily_reminder_opt_in": dailyReminder,
		"content_notif_opt_in":  contentNotif,
		"fcm_configured":        h.notificationSvc.PushEnabled(),
	})
}

type broadcastRequest struct {
	Title string `json:"title"`
	Body  string `json:"body"`
}

// SendBroadcast یک پیام همگانی به همه‌ی کاربرانی که نوتیفیکیشن محتوایی را فعال
// کرده‌اند می‌فرستد.
func (h Handler) SendBroadcast(c echo.Context) error {
	var req broadcastRequest
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, echo.Map{"message": "درخواست نامعتبر"})
	}
	if strings.TrimSpace(req.Title) == "" || strings.TrimSpace(req.Body) == "" {
		return c.JSON(http.StatusBadRequest, echo.Map{"message": "عنوان و متن پیام نمی‌توانند خالی باشند"})
	}

	createdBy := ""
	if userClaims, err := claims.GetClaims(c); err == nil {
		createdBy = userClaims.UserID
	}

	sent, err := h.notificationSvc.Broadcast(c.Request().Context(), req.Title, req.Body, createdBy)
	if err != nil {
		return c.JSON(http.StatusBadGateway, echo.Map{"message": err.Error()})
	}

	return c.JSON(http.StatusOK, echo.Map{"sent_count": sent, "message": "پیام همگانی ارسال شد"})
}

// ListBroadcasts تاریخچه‌ی پیام‌های همگانی ارسال‌شده را برمی‌گرداند.
func (h Handler) ListBroadcasts(c echo.Context) error {
	broadcasts, err := h.notificationSvc.ListBroadcasts(c.Request().Context(), 20)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, echo.Map{"message": "خطا در خواندن تاریخچه"})
	}
	return c.JSON(http.StatusOK, echo.Map{"broadcasts": broadcasts})
}
