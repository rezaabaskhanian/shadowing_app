package adminhandler

import (
	"errors"
	"net/http"
	"strings"

	"shadowing-backend/internal/pkg/claims"
	notificationservice "shadowing-backend/internal/service/notification"

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
	// Target: "opted_in" (پیش‌فرض)، "all" یا "phone".
	Target string `json:"target"`
	Phone  string `json:"phone"`
}

// faDigits ارقام فارسی/عربی شماره‌ی واردشده در پنل را به لاتین برمی‌گرداند.
var faDigits = strings.NewReplacer(
	"۰", "0", "۱", "1", "۲", "2", "۳", "3", "۴", "4", "۵", "5", "۶", "6", "۷", "7", "۸", "8", "۹", "9",
	"٠", "0", "١", "1", "٢", "2", "٣", "3", "٤", "4", "٥", "5", "٦", "6", "٧", "7", "٨", "8", "٩", "9",
)

// normalizePhone شماره را به شکل ذخیره‌شده در users (۰۹xxxxxxxxx) درمی‌آورد.
func normalizePhone(raw string) string {
	p := faDigits.Replace(strings.TrimSpace(raw))
	p = strings.NewReplacer(" ", "", "-", "").Replace(p)
	switch {
	case strings.HasPrefix(p, "+98"):
		p = "0" + p[3:]
	case strings.HasPrefix(p, "0098"):
		p = "0" + p[4:]
	case strings.HasPrefix(p, "98") && len(p) == 12:
		p = "0" + p[2:]
	case strings.HasPrefix(p, "9") && len(p) == 10:
		p = "0" + p
	}
	return p
}

// SendBroadcast پیام پنل ادمین را می‌فرستد: به کاربرانی که نوتیف محتوایی را
// روشن کرده‌اند، به همه‌ی دستگاه‌ها، یا به دستگاه‌های یک کاربر با شماره تلفن.
func (h Handler) SendBroadcast(c echo.Context) error {
	var req broadcastRequest
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, echo.Map{"message": "درخواست نامعتبر"})
	}
	if strings.TrimSpace(req.Title) == "" || strings.TrimSpace(req.Body) == "" {
		return c.JSON(http.StatusBadRequest, echo.Map{"message": "عنوان و متن پیام نمی‌توانند خالی باشند"})
	}

	phone := ""
	if req.Target == notificationservice.TargetPhone {
		phone = normalizePhone(req.Phone)
		if len(phone) != 11 || !strings.HasPrefix(phone, "09") {
			return c.JSON(http.StatusBadRequest, echo.Map{"message": "شماره تلفن معتبر نیست (مثلاً 09121234567)"})
		}
	}

	createdBy := ""
	if userClaims, err := claims.GetClaims(c); err == nil {
		createdBy = userClaims.UserID
	}

	res, err := h.notificationSvc.Broadcast(c.Request().Context(), req.Target, phone, req.Title, req.Body, createdBy)
	if errors.Is(err, notificationservice.ErrUserNotFound) || errors.Is(err, notificationservice.ErrNoDevice) {
		return c.JSON(http.StatusNotFound, echo.Map{"message": err.Error()})
	}
	if err != nil {
		return c.JSON(http.StatusBadGateway, echo.Map{"message": err.Error()})
	}

	return c.JSON(http.StatusOK, echo.Map{
		"sent_count":   res.SentCount,
		"device_count": res.DeviceCount,
		"message":      "پیام ارسال شد",
	})
}

// ListBroadcasts تاریخچه‌ی پیام‌های همگانی ارسال‌شده را برمی‌گرداند.
func (h Handler) ListBroadcasts(c echo.Context) error {
	broadcasts, err := h.notificationSvc.ListBroadcasts(c.Request().Context(), 20)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, echo.Map{"message": "خطا در خواندن تاریخچه"})
	}
	return c.JSON(http.StatusOK, echo.Map{"broadcasts": broadcasts})
}
