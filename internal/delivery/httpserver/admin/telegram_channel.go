package adminhandler

import (
	"net/http"
	"strings"

	settingsservice "shadowing-backend/internal/service/settings"

	"github.com/labstack/echo/v4"
)

type telegramChannelResponse struct {
	BotToken   settingItem `json:"bot_token"`
	ChannelID  string      `json:"channel_id"`
	Enabled    bool        `json:"enabled"`
	PostTime   string      `json:"post_time"`
	PostMode   string      `json:"post_mode"`
	CustomText string      `json:"custom_text"`
	LastDate   string      `json:"last_date"`
	LastStatus string      `json:"last_status"`
	Preview    string      `json:"preview"`
}

// GetTelegramChannel تنظیمات و پیش‌نمایش پست روزانه کانال تلگرام را برمی‌گرداند.
func (h Handler) GetTelegramChannel(c echo.Context) error {
	s := h.settingsSvc
	tok := strings.TrimSpace(s.Get(settingsservice.KeyTelegramChannelBotToken))
	if tok == "" {
		tok = strings.TrimSpace(s.Get(settingsservice.KeyTelegramBotToken))
	}

	enabledVal := strings.ToLower(strings.TrimSpace(s.Get(settingsservice.KeyTelegramChannelEnabled)))
	enabled := enabledVal == "true" || enabledVal == "1"

	postTime := strings.TrimSpace(s.Get(settingsservice.KeyTelegramChannelPostTime))
	if postTime == "" {
		postTime = "08:30"
	}

	postMode := strings.TrimSpace(s.Get(settingsservice.KeyTelegramChannelPostMode))
	if postMode == "" {
		postMode = "auto_daily"
	}

	var preview string
	if h.telegramChannelSvc != nil {
		preview = h.telegramChannelSvc.GenerateTodayPost()
	}

	return c.JSON(http.StatusOK, telegramChannelResponse{
		BotToken: settingItem{
			Set:    tok != "",
			Masked: maskSecret(tok),
		},
		ChannelID:  s.Get(settingsservice.KeyTelegramChannelID),
		Enabled:    enabled,
		PostTime:   postTime,
		PostMode:   postMode,
		CustomText: s.Get(settingsservice.KeyTelegramChannelCustomText),
		LastDate:   s.Get(settingsservice.KeyTelegramChannelLastDate),
		LastStatus: s.Get(settingsservice.KeyTelegramChannelLastStatus),
		Preview:    preview,
	})
}

// TestTelegramChannel یک پیام تستی به کانال ارسال می‌کند.
func (h Handler) TestTelegramChannel(c echo.Context) error {
	if h.telegramChannelSvc == nil {
		return c.JSON(http.StatusServiceUnavailable, echo.Map{"message": "سرویس کانال تلگرام آماده نیست"})
	}

	if err := h.telegramChannelSvc.SendTest(c.Request().Context()); err != nil {
		return c.JSON(http.StatusBadRequest, echo.Map{"message": err.Error()})
	}

	return c.JSON(http.StatusOK, echo.Map{"message": "✅ پیام تستی با موفقیت به کانال تلگرام ارسال شد"})
}

type sendChannelNowReq struct {
	Text string `json:"text"`
}

// SendTelegramChannelNow پست امروز یا متن دلخواه را بلافاصله به کانال ارسال می‌کند.
func (h Handler) SendTelegramChannelNow(c echo.Context) error {
	if h.telegramChannelSvc == nil {
		return c.JSON(http.StatusServiceUnavailable, echo.Map{"message": "سرویس کانال تلگرام آماده نیست"})
	}

	var req sendChannelNowReq
	_ = c.Bind(&req)

	if err := h.telegramChannelSvc.SendNow(c.Request().Context(), req.Text); err != nil {
		return c.JSON(http.StatusBadRequest, echo.Map{"message": err.Error()})
	}

	return c.JSON(http.StatusOK, echo.Map{"message": "✅ پست با موفقیت در کانال تلگرام منتشر شد"})
}

// PreviewTelegramChannel پیش‌نمایش پست را برمی‌گرداند.
func (h Handler) PreviewTelegramChannel(c echo.Context) error {
	if h.telegramChannelSvc == nil {
		return c.JSON(http.StatusServiceUnavailable, echo.Map{"message": "سرویس کانال تلگرام آماده نیست"})
	}

	preview := h.telegramChannelSvc.GenerateTodayPost()
	return c.JSON(http.StatusOK, echo.Map{"preview": preview})
}

