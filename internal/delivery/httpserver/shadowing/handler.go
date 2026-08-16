package shadowinghandler

import (
	authservice "shadowing-backend/internal/service/auth"
	shadowingservice "shadowing-backend/internal/service/shadowing"
)

type Handler struct {
	ShadowingSvc shadowingservice.Service

	authSvc authservice.Service

	authConfig authservice.Config

	// uploadDir محل نوشتن موقت فایل ضبط‌شده‌ی کاربر تا نمره‌دهی انجام شود.
	// برخلاف تصاویر، این فایل‌ها سرو نمی‌شوند و بعد از ارزیابی پاک می‌شوند.
	uploadDir string
}

func New(ShadowingSvc shadowingservice.Service, authSvc authservice.Service, authConfig authservice.Config, uploadDir string) Handler {
	return Handler{
		ShadowingSvc: ShadowingSvc,
		authSvc:      authSvc,
		authConfig:   authConfig,
		uploadDir:    uploadDir,
	}
}
