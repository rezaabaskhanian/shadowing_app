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

	// تولید محتوای صحنه / صدای دیالوگ با هوش مصنوعی (مکملِ ساخت دستی؛ چیزی ذخیره نمی‌کند)
	g.POST("/generate-scene", h.GenerateScene)
	g.POST("/generate-audio", h.GenerateAudio)
	g.GET("/tts-voices", h.ListTTSVoices)

	// تنظیمات (کلیدهای API و ...) — قابل تغییر بدون ری‌استارت سرور
	g.GET("/settings", h.GetSettings)
	g.PUT("/settings", h.UpdateSetting)

	// نوتیفیکیشن‌ها: آمار، ارسال پیام همگانی، تاریخچه
	g.GET("/notifications/stats", h.NotificationStats)
	g.POST("/notifications/broadcast", h.SendBroadcast)
	g.GET("/notifications/broadcasts", h.ListBroadcasts)

	// مدیریت صحنه‌ها، هات‌اسپات‌ها و دیالوگ‌ها
	g.POST("/scenes", h.CreateScene)
	g.GET("/scenes", h.ListScenes)
	g.GET("/scenes/:sceneID", h.GetScene)
	g.PUT("/scenes/:sceneID", h.UpdateScene)
	g.DELETE("/scenes/:sceneID", h.DeleteScene)

	// بررسی پیشنهادهای صحنه‌ی کاربران
	g.GET("/scene-submissions", h.ListSceneSubmissions)
	g.GET("/scene-submissions/:id", h.GetSceneSubmission)
	g.POST("/scene-submissions/:id/approve", h.ApproveSceneSubmission)
	g.POST("/scene-submissions/:id/reject", h.RejectSceneSubmission)

	// طرح‌های اشتراک و فعال‌سازی دستی
	g.GET("/subscription-plans", h.ListSubscriptionPlans)
	g.POST("/subscription-plans", h.CreateSubscriptionPlan)
	g.DELETE("/subscription-plans/:id", h.DeleteSubscriptionPlan)
	g.POST("/subscriptions/grant", h.GrantSubscription)
}
