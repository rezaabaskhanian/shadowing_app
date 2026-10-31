package aiconversationhandler

import (
	"shadowing-backend/internal/delivery/middlware"

	"github.com/labstack/echo/v4"
)

func (h Handler) SetAIConversationRoutes(e *echo.Echo) {

	group := e.Group("/v1/ai-conversation")

	group.POST("/start", h.Start, middlware.Auth(h.authSvc, h.authConfig))
	group.POST("/turn", h.SendTurn, middlware.Auth(h.authSvc, h.authConfig))
	group.POST("/suggest", h.Suggest, middlware.Auth(h.authSvc, h.authConfig))
	group.GET("/roleplays", h.ListRoleplays, middlware.Auth(h.authSvc, h.authConfig))

	admin := e.Group("/v1/admin/roleplays", middlware.Auth(h.authSvc, h.authConfig), middlware.AdminOnly)
	admin.GET("", h.AdminListRoleplays)
	admin.POST("", h.AdminCreateRoleplay)
	admin.GET("/:id", h.AdminGetRoleplay)
	admin.PUT("/:id", h.AdminUpdateRoleplay)
	admin.DELETE("/:id", h.AdminDeleteRoleplay)

}
