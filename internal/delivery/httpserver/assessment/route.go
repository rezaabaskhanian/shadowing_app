package assessmenthandler

import (
	"shadowing-backend/internal/delivery/middlware"

	"github.com/labstack/echo/v4"
)

func (h Handler) SetAssessmentRoutes(e *echo.Echo) {

	group := e.Group("/v1/assessment")

	group.GET("/test", h.GetTest, middlware.Auth(h.authSvc, h.authConfig))
	group.POST("/submit", h.SubmitAssessment, middlware.Auth(h.authSvc, h.authConfig))
	group.GET("/profile", h.GetProfile, middlware.Auth(h.authSvc, h.authConfig))
	group.GET("/level", h.GetLevel, middlware.Auth(h.authSvc, h.authConfig))
	group.PUT("/level", h.SetLevel, middlware.Auth(h.authSvc, h.authConfig))

	// نسخه‌ی ۲ (لغت + شنیدن + تکرار)؛ نسخه‌ی ۱ برای اپ‌های قدیمی می‌ماند.
	group.GET("/v2/test", h.GetTestV2, middlware.Auth(h.authSvc, h.authConfig))
	group.POST("/v2/submit", h.SubmitTestV2, middlware.Auth(h.authSvc, h.authConfig))

}
