package learninghandler

import (
	authservice "shadowing-backend/internal/service/auth"
	learningservice "shadowing-backend/internal/service/learning"
)

type Handler struct {
	learningSvc learningservice.Service

	authSvc authservice.Service

	authConfig authservice.Config
}

func New(learningSvc learningservice.Service, authSvc authservice.Service, authConfig authservice.Config) Handler {
	return Handler{
		learningSvc: learningSvc,
		authSvc:     authSvc,
		authConfig:  authConfig,
	}
}
