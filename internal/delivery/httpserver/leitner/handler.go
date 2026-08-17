package leitnerhandler

import (
	authservice "shadowing-backend/internal/service/auth"
	leitnerservice "shadowing-backend/internal/service/leitner"
)

type Handler struct {
	leitnerSvc leitnerservice.Service

	authSvc    authservice.Service
	authConfig authservice.Config
}

func New(leitnerSvc leitnerservice.Service, authSvc authservice.Service, authConfig authservice.Config) Handler {
	return Handler{
		leitnerSvc: leitnerSvc,
		authSvc:    authSvc,
		authConfig: authConfig,
	}
}
