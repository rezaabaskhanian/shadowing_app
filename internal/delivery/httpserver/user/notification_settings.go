package userhandler

import (
	"net/http"

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
	DailyReminderEnabled bool   `json:"daily_reminder_enabled"`
	DailyReminderTime    string `json:"daily_reminder_time"`
	ContentNotifEnabled  bool   `json:"content_notif_enabled"`
	ContentSource        string `json:"content_source"`
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
	if req.DailyReminderTime == "" {
		req.DailyReminderTime = "20:00"
	}

	err = h.notificationSvc.UpsertSettings(c.Request().Context(), notificationservice.Settings{
		UserID:               userClaims.UserID,
		DailyReminderEnabled: req.DailyReminderEnabled,
		DailyReminderTime:    req.DailyReminderTime,
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
