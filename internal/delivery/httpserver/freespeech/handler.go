package freespeechhandler

import (
	authservice "shadowing-backend/internal/service/auth"
	freespeechservice "shadowing-backend/internal/service/freespeech"
)

type Handler struct {
	svc *freespeechservice.Service

	authSvc authservice.Service

	authConfig authservice.Config

	uploadDir string
}

func New(svc *freespeechservice.Service, authSvc authservice.Service, authConfig authservice.Config, uploadDir string) Handler {
	return Handler{svc: svc, authSvc: authSvc, authConfig: authConfig, uploadDir: uploadDir}
}
