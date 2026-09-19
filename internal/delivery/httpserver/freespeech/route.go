package freespeechhandler

import (
	"shadowing-backend/internal/delivery/middlware"

	"github.com/labstack/echo/v4"
)

func (h Handler) SetFreeSpeechRoutes(e *echo.Echo) {

	group := e.Group("/v1/free-speech")

	group.POST("/analyze", h.Analyze, middlware.Auth(h.authSvc, h.authConfig))
	group.POST("/transcribe", h.Transcribe, middlware.Auth(h.authSvc, h.authConfig))
	group.POST("/feedback", h.Feedback, middlware.Auth(h.authSvc, h.authConfig))

}
