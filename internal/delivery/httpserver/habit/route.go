package habithandler

import (
	"shadowing-backend/internal/delivery/middlware"

	"github.com/labstack/echo/v4"
)

func (h Handler) SetHabitRoutes(e *echo.Echo) {
	g := e.Group("/v1/habit", middlware.Auth(h.authSvc, h.authConfig))

	g.GET("/activities", h.ListActivities)
	g.GET("/missions/today", h.TodayMission)
	g.POST("/missions/:id/start", h.StartMission)
	g.POST("/missions/:id/session", h.SubmitSession)
	g.GET("/history", h.History)
}
