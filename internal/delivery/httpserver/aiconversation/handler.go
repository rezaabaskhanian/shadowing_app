package aiconversationhandler

import (
	aiconversationservice "shadowing-backend/internal/service/aiconversation"
	authservice "shadowing-backend/internal/service/auth"
)

type Handler struct {
	svc *aiconversationservice.Service

	authSvc authservice.Service

	authConfig authservice.Config

	uploadDir string
}

func New(svc *aiconversationservice.Service, authSvc authservice.Service, authConfig authservice.Config, uploadDir string) Handler {
	return Handler{svc: svc, authSvc: authSvc, authConfig: authConfig, uploadDir: uploadDir}
}
