package userhandler

import (
	"shadowing-backend/internal/delivery/middlware"

	"github.com/labstack/echo/v4"
)

func (h Handler) SetUserRoutes(e *echo.Echo) {

	userGroup := e.Group("v1/users")

	userGroup.GET("/profile", h.Profile, middlware.Auth(h.authSvc, h.authConfig))

	userGroup.POST("/login", h.Login)
	userGroup.POST("/register", h.Register)

	userGroup.POST("/reset-pass", h.ResetPass)

	userGroup.POST("/otp/send", h.SendOtp)
	userGroup.POST("/otp/verify", h.VerifyOtp)

	userGroup.PUT("/change-password", h.ChangePassword, middlware.Auth(h.authSvc, h.authConfig))

	userGroup.GET("/notification-settings", h.GetNotificationSettings, middlware.Auth(h.authSvc, h.authConfig))
	userGroup.PUT("/notification-settings", h.UpdateNotificationSettings, middlware.Auth(h.authSvc, h.authConfig))
	userGroup.POST("/device-token", h.RegisterDeviceToken, middlware.Auth(h.authSvc, h.authConfig))

}
