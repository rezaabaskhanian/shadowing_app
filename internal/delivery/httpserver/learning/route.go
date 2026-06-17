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
}
