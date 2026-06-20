package shadowinghandler

import (
	authservice "shadowing-backend/internal/service/auth"
	shadowingservice "shadowing-backend/internal/service/shadowing"
)

type Handler struct {
	ShadowingSvc shadowingservice.Service

	authSvc authservice.Service

	authConfig authservice.Config
}

func New(ShadowingSvc shadowingservice.Service, authSvc authservice.Service, authConfig authservice.Config) Handler {
	return Handler{ShadowingSvc: ShadowingSvc, authSvc: authSvc, authConfig: authConfig}
}
