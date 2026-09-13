package assessmenthandler

import (
	assessmentservice "shadowing-backend/internal/service/assessment"
	authservice "shadowing-backend/internal/service/auth"
)

type Handler struct {
	assessmentSvc *assessmentservice.Service

	authSvc authservice.Service

	authConfig authservice.Config

	uploadDir string
}

func New(assessmentSvc *assessmentservice.Service, authSvc authservice.Service, authConfig authservice.Config, uploadDir string) Handler {
	return Handler{assessmentSvc: assessmentSvc, authSvc: authSvc, authConfig: authConfig, uploadDir: uploadDir}
}
