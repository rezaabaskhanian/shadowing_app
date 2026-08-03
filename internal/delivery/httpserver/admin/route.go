package adminhandler

import (
	"shadowing-backend/internal/delivery/middlware"

	"github.com/labstack/echo/v4"
)

// SetAdminRoutes روت‌های API پنل ادمین را ثبت می‌کند.
//
// همه‌ی روت‌ها پشت احراز هویت JWT + نقش «admin» هستند:
// ابتدا Auth توکن را اعتبارسنجی می‌کند، سپس AdminOnly نقش را بررسی می‌کند.
func (h Handler) SetAdminRoutes(e *echo.Echo) {
	g := e.Group("/v1/admin",
		middlware.Auth(h.authSvc, h.authConfig),
		middlware.AdminOnly,
	)

	// آپلود فایل‌ها
	g.POST("/upload", h.UploadImage)       // تصویر پس‌زمینه صحنه
	g.POST("/upload-audio", h.UploadAudio) // صدای دیالوگ

	// تولید محتوای صحنه با هوش مصنوعی (مکملِ ساخت دستی؛ چیزی ذخیره نمی‌کند)
	g.POST("/generate-scene", h.GenerateScene)

	// مدیریت صحنه‌ها، هات‌اسپات‌ها و دیالوگ‌ها
	g.POST("/scenes", h.CreateScene)
	g.GET("/scenes", h.ListScenes)
	g.GET("/scenes/:sceneID", h.GetScene)
	g.PUT("/scenes/:sceneID", h.UpdateScene)
	g.DELETE("/scenes/:sceneID", h.DeleteScene)
}
