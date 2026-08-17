package leitnerhandler

import (
	"shadowing-backend/internal/delivery/middlware"

	"github.com/labstack/echo/v4"
)

func (h Handler) SetLeitnerRoutes(e *echo.Echo) {
	g := e.Group("/v1/leitner", middlware.Auth(h.authSvc, h.authConfig))

	g.GET("/words", h.ListWords)
	g.POST("/words", h.AddWord)
	g.POST("/words/:id/promote", h.PromoteWord)
	g.POST("/words/:id/demote", h.DemoteWord)
	g.DELETE("/words/:id", h.DeleteWord)
}
