package adminhandler

import (
	"net/http"
	"strings"

	"github.com/labstack/echo/v4"
)

type connectProxyRequest struct {
	Link string `json:"link"`
}

// ProxyStatus وضعیت اتصال پراکسی خروجی (برای Gemini/Anthropic/ElevenLabs) را برمی‌گرداند
// و آخرین لینکی که ادمین ثبت کرده را هم (برای پرکردن فرم) ضمیمه می‌کند.
func (h Handler) ProxyStatus(c echo.Context) error {
	status := h.proxySvc.Status(c.Request().Context())
	return c.JSON(http.StatusOK, echo.Map{
		"connected": status.Connected,
		"ip":        status.IP,
		"country":   status.Country,
		"org":       status.Org,
		"message":   status.Message,
		"link":      h.proxySvc.CurrentLink(),
	})
}

// ConnectProxy یک لینک vless:// جدید را می‌گیرد، کانفیگ Xray را به‌روز می‌کند و
// بعد از مکث کوتاه (تا سایدکار xray ری‌لود کند) نتیجه‌ی اتصال را برمی‌گرداند.
func (h Handler) ConnectProxy(c echo.Context) error {
	var req connectProxyRequest
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, echo.Map{"message": "درخواست نامعتبر"})
	}
	if strings.TrimSpace(req.Link) == "" {
		return c.JSON(http.StatusBadRequest, echo.Map{"message": "لینک خالی است"})
	}

	status, err := h.proxySvc.Connect(c.Request().Context(), req.Link)
	if err != nil {
		return c.JSON(http.StatusBadRequest, echo.Map{"message": err.Error()})
	}

	code := http.StatusOK
	if !status.Connected {
		code = http.StatusBadGateway
	}

	return c.JSON(code, echo.Map{
		"connected": status.Connected,
		"ip":        status.IP,
		"country":   status.Country,
		"org":       status.Org,
		"message":   status.Message,
	})
}
