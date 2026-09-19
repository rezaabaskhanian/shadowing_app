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
	group.POST("/suggest/audio", h.SuggestAudio, middlware.Auth(h.authSvc, h.authConfig))

}
