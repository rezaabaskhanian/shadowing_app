package missionhandler

import (
	"shadowing-backend/internal/delivery/middlware"

	"github.com/labstack/echo/v4"
)

func (h Handler) SetMissionRoutes(e *echo.Echo) {

	group := e.Group("/v1/mission")

	group.GET("/today", h.GetTodaysMission, middlware.Auth(h.authSvc, h.authConfig))

}
