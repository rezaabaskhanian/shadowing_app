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

	// بررسی پیشنهادهای موضوع کاربران
	g.GET("/topic-suggestions", h.ListTopicSuggestions)
	g.GET("/topic-suggestions/:id", h.GetTopicSuggestion)
	g.POST("/topic-suggestions/:id/approve", h.ApproveTopicSuggestion)
	g.POST("/topic-suggestions/:id/reject", h.RejectTopicSuggestion)

	// طرح‌های اشتراک و فعال‌سازی دستی
	g.GET("/subscription-plans", h.ListSubscriptionPlans)
	g.POST("/subscription-plans", h.CreateSubscriptionPlan)
	g.DELETE("/subscription-plans/:id", h.DeleteSubscriptionPlan)
	g.POST("/subscriptions/grant", h.GrantSubscription)

	// لیست کاربرها + خلاصه‌ی فعالیتشون
	g.GET("/users", h.ListUsers)

	// محتوای صفحه‌ی معرفی (landing, www.lingoflow.ir): بخش‌ها + عکس‌هاشون
	g.GET("/landing-sections", h.ListLandingSections)
	g.POST("/landing-sections", h.CreateLandingSection)
	g.PUT("/landing-sections/:id", h.UpdateLandingSection)
	g.DELETE("/landing-sections/:id", h.DeleteLandingSection)
	g.POST("/landing-sections/:id/images", h.AddLandingSectionImage)
	g.DELETE("/landing-sections/:id/images/:imageID", h.DeleteLandingSectionImage)

	// تنظیمات کلی صفحه‌ی معرفی (هیرو، دکمه‌های دانلود، بنر پایانی)
	g.GET("/landing-settings", h.GetLandingSettings)
	g.PUT("/landing-settings", h.UpdateLandingSettings)

	// آیتم‌های «چرا LingoFlow» (kind=feature) و «چطور کار می‌کنه» (kind=step)
	g.GET("/landing-highlights/:kind", h.ListLandingHighlights)
	g.POST("/landing-highlights/:kind", h.CreateLandingHighlight)
	g.PUT("/landing-highlights/:kind/:id", h.UpdateLandingHighlight)
	g.DELETE("/landing-highlights/:kind/:id", h.DeleteLandingHighlight)

	// سوالات متداول
	g.GET("/landing-faqs", h.ListLandingFAQs)
	g.POST("/landing-faqs", h.CreateLandingFAQ)
	g.PUT("/landing-faqs/:id", h.UpdateLandingFAQ)
	g.DELETE("/landing-faqs/:id", h.DeleteLandingFAQ)
}
