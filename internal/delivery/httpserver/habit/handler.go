package habithandler

import (
	authservice "shadowing-backend/internal/service/auth"
	habitservice "shadowing-backend/internal/service/habit"
)

type Handler struct {
	habitSvc habitservice.Service

	authSvc    authservice.Service
	authConfig authservice.Config

	// uploadDir محل نوشتن موقت فایل ضبط‌شده‌ی جلسه‌ی تمرین عادت.
	uploadDir string
}

func New(habitSvc habitservice.Service, authSvc authservice.Service, authConfig authservice.Config, uploadDir string) Handler {
	return Handler{
		habitSvc:   habitSvc,
		authSvc:    authSvc,
		authConfig: authConfig,
		uploadDir:  uploadDir,
	}
}
