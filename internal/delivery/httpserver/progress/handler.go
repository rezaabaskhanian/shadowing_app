package progresshandler

import (
	authservice "shadowing-backend/internal/service/auth"
	progressservice "shadowing-backend/internal/service/progress"
)

type Handler struct {
	progressSvc progressservice.Service

	authSvc authservice.Service

	authConfig authservice.Config
}

func New(progressSvc progressservice.Service, authSvc authservice.Service, authConfig authservice.Config) Handler {
	return Handler{progressSvc: progressSvc, authSvc: authSvc, authConfig: authConfig}
}
