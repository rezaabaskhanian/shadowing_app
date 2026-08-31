package userhandler

import (
	"net/http"
	"sort"
	"strings"
	"time"

	"shadowing-backend/internal/pkg/claims"
	notificationservice "shadowing-backend/internal/service/notification"

	"github.com/labstack/echo/v4"
)

// GetNotificationSettings تنظیمات نوتیفیکیشن کاربر جاری را برمی‌گرداند.
func (h Handler) GetNotificationSettings(c echo.Context) error {
	userClaims, err := claims.GetClaims(c)
	if err != nil {
		return c.JSON(http.StatusUnauthorized, echo.Map{"message": "احراز هویت ناموفق"})
	}

	settings, err := h.notificationSvc.GetSettings(c.Request().Context(), userClaims.UserID)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, echo.Map{"message": "خطا در خواندن تنظیمات نوتیفیکیشن"})
	}

	return c.JSON(http.StatusOK, settings)
}

type updateNotificationSettingsRequest struct {
	DailyReminderEnabled bool     `json:"daily_reminder_enabled"`
	DailyReminderTimes   []string `json:"daily_reminder_times"`
	ContentNotifEnabled  bool     `json:"content_notif_enabled"`
	ContentSource        string   `json:"content_source"`
}

// maxReminderTimes سقف تعداد ساعت‌های یادآوری روزانه‌ی یک کاربر؛ چون هر ساعت
// روی خود دستگاه یک trigger جداگانه‌ی notifee می‌سازد، بی‌سقف بودن یعنی
// امکان ساخت صدها نوتیفیکیشن زمان‌بندی‌شده.
const maxReminderTimes = 12

// normalizeReminderTimes ساعت‌ها را به فرمت HH:MM اعتبارسنجی می‌کند، تکراری‌ها
// را حذف و مرتب می‌کند. ورودی نامعتبر بی‌صدا کنار گذاشته می‌شود تا یک ساعت خراب
// کل ذخیره‌ی تنظیمات را شکست ندهد.
func normalizeReminderTimes(times []string) []string {
	seen := make(map[string]struct{}, len(times))
	out := make([]string, 0, len(times))
	for _, raw := range times {
		t, err := time.Parse("15:04", strings.TrimSpace(raw))
		if err != nil {
			continue
		}
		hhmm := t.Format("15:04")
		if _, dup := seen[hhmm]; dup {
			continue
		}
		seen[hhmm] = struct{}{}
		out = append(out, hhmm)
		if len(out) == maxReminderTimes {
			break
		}
	}
	sort.Strings(out)
	return out
}

// UpdateNotificationSettings تنظیمات نوتیفیکیشن کاربر جاری را ذخیره می‌کند.
func (h Handler) UpdateNotificationSettings(c echo.Context) error {
	userClaims, err := claims.GetClaims(c)
	if err != nil {
		return c.JSON(http.StatusUnauthorized, echo.Map{"message": "احراز هویت ناموفق"})
	}

	var req updateNotificationSettingsRequest
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, echo.Map{"message": "درخواست نامعتبر"})
	}
	if req.ContentSource != "leitner" && req.ContentSource != "sentences" && req.ContentSource != "mixed" {
		req.ContentSource = "mixed"
	}

	times := normalizeReminderTimes(req.DailyReminderTimes)
	// یادآوری روزانه بدون هیچ ساعتی معنایی ندارد؛ خاموش حساب می‌شود.
	dailyEnabled := req.DailyReminderEnabled && len(times) > 0

	err = h.notificationSvc.UpsertSettings(c.Request().Context(), notificationservice.Settings{
		UserID:               userClaims.UserID,
		DailyReminderEnabled: dailyEnabled,
		DailyReminderTimes:   times,
		ContentNotifEnabled:  req.ContentNotifEnabled,
		ContentSource:        req.ContentSource,
	})
	if err != nil {
		return c.JSON(http.StatusInternalServerError, echo.Map{"message": "خطا در ذخیره تنظیمات نوتیفیکیشن"})
	}

	return c.JSON(http.StatusOK, echo.Map{"message": "ذخیره شد"})
}

type registerDeviceTokenRequest struct {
	Token    string `json:"token"`
	Platform string `json:"platform"`
}

// RegisterDeviceToken توکن FCM دستگاه کاربر جاری را برای ارسال پوش ثبت می‌کند.
func (h Handler) RegisterDeviceToken(c echo.Context) error {
	userClaims, err := claims.GetClaims(c)
	if err != nil {
		return c.JSON(http.StatusUnauthorized, echo.Map{"message": "احراز هویت ناموفق"})
	}

	var req registerDeviceTokenRequest
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, echo.Map{"message": "درخواست نامعتبر"})
	}
	if req.Token == "" || (req.Platform != "ios" && req.Platform != "android") {
		return c.JSON(http.StatusBadRequest, echo.Map{"message": "توکن یا پلتفرم نامعتبر است"})
	}

	if err := h.notificationSvc.RegisterDeviceToken(c.Request().Context(), userClaims.UserID, req.Token, req.Platform); err != nil {
		return c.JSON(http.StatusInternalServerError, echo.Map{"message": "خطا در ثبت توکن دستگاه"})
	}

	return c.JSON(http.StatusOK, echo.Map{"message": "ثبت شد"})
}
