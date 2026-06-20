package progresshandler

import (
	"shadowing-backend/internal/delivery/middlware"

	"github.com/labstack/echo/v4"
)

func (h Handler) SetProgressRoutes(e *echo.Echo) {

	group := e.Group("/v1/progress")

	group.POST("/daily", h.AddDailyProgress, middlware.Auth(h.authSvc, h.authConfig))
	group.GET("/streak/:userID", h.GetUserStreak, middlware.Auth(h.authSvc, h.authConfig))
	group.GET("/achievements/:userID", h.GetUserAchievements, middlware.Auth(h.authSvc, h.authConfig))
	group.POST("/achievement/unlock", h.UnlockAchievement, middlware.Auth(h.authSvc, h.authConfig))
	group.GET("/summary/:userID", h.GetUserSummary, middlware.Auth(h.authSvc, h.authConfig))
	// group.PUT("/scene", h.UpdateSceneProgress, middlware.Auth(h.authSvc, h.authConfig))

}
