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

}
