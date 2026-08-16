package shadowinghandler

import (
	"shadowing-backend/internal/delivery/middlware"

	"github.com/labstack/echo/v4"
)

func (h Handler) SetShadowingRoutes(e *echo.Echo) {
	// گروه اصلی
	g := e.Group("/v1/shadowing", middlware.Auth(h.authSvc, h.authConfig))

	// روت‌ها
	g.POST("/session", h.StartSession)
	g.GET("/session/:id/step", h.GetCurrentStep)
	g.POST("/session/:id/recording", h.SubmitRecording)
	g.GET("/session/:id/status", h.GetSessionStatus)
	g.POST("/session/:id/reset", h.ResetSession)

	// نمره‌دهی تلفظ بدون جلسه — اپ در مرحله‌های ضبط/مقایسه از این استفاده
	// می‌کند تا بتواند هر جمله را هرچندبار که کاربر خواست ارزیابی کند.
	g.POST("/evaluate", h.EvaluateRecording)
}
