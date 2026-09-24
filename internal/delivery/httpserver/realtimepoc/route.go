package realtimepochandler

import (
	"shadowing-backend/internal/delivery/middlware"

	"github.com/labstack/echo/v4"
)

// SetRealtimePoCRoutes - روت‌های موقتِ PoC. جدا از /v1/ai-conversation نگه
// داشته شده تا بعد از جمع‌بندی تصمیم (تثبیت روی Realtime یا برگشت به cascade)
// بدون اثر جانبی حذف یا ادغام شود. فقط ادمین: صدا مستقیم بین اپ و Gemini
// رد و بدل می‌شود و سقف مصرف/اشتراک روی آن اعمال نمی‌شود.
func (h Handler) SetRealtimePoCRoutes(e *echo.Echo) {
	group := e.Group("/v1/realtime-poc")
	group.POST("/token", h.IssueToken, middlware.Auth(h.authSvc, h.authConfig), middlware.AdminOnly)
}
