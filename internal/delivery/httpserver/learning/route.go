package learninghandler

import (
	"shadowing-backend/internal/delivery/middlware"

	"github.com/labstack/echo/v4"
)

func (h Handler) SetLearningRoutes(e *echo.Echo) {
	learningGroup := e.Group("v1/learning")

	learningGroup.POST("/scene", h.CreateScene, middlware.Auth(h.authSvc, h.authConfig))
	learningGroup.DELETE("/delete/:sceneID", h.DeleteScene, middlware.Auth(h.authSvc, h.authConfig))
	learningGroup.GET("/get-scene/sceneID", h.GetScene, middlware.Auth(h.authSvc, h.authConfig))
	learningGroup.POST("/get-list", h.ListScene, middlware.Auth(h.authSvc, h.authConfig))
	learningGroup.PUT("/update-scene", h.UpdateScene, middlware.Auth(h.authSvc, h.authConfig))

	// پیشنهاد صحنه توسط کاربر عادی (بررسی و انتشار توسط ادمین)
	learningGroup.POST("/upload-image", h.UploadImage, middlware.Auth(h.authSvc, h.authConfig))
	learningGroup.POST("/scene-submissions", h.CreateSceneSubmission, middlware.Auth(h.authSvc, h.authConfig))
	learningGroup.GET("/scene-submissions/mine", h.MySceneSubmissions, middlware.Auth(h.authSvc, h.authConfig))

	// پیشنهاد موضوع/سناریو (فقط متن) توسط کاربر عادی
	learningGroup.POST("/topic-suggestions", h.CreateTopicSuggestion, middlware.Auth(h.authSvc, h.authConfig))
	learningGroup.GET("/topic-suggestions/mine", h.MyTopicSuggestions, middlware.Auth(h.authSvc, h.authConfig))

	// امتیاز و طرح‌های اشتراک
	learningGroup.GET("/points", h.MyPoints, middlware.Auth(h.authSvc, h.authConfig))
	learningGroup.GET("/subscription-plans", h.SubscriptionPlans, middlware.Auth(h.authSvc, h.authConfig))

	// تأیید خرید کافه‌بازاری (Poolakey) و فعال‌سازی اشتراک یک‌ساله
	learningGroup.POST("/subscription/verify-purchase", h.VerifyPurchase, middlware.Auth(h.authSvc, h.authConfig))
}
