package adminhandler

import (
	aiservice "shadowing-backend/internal/service/ai"
	authservice "shadowing-backend/internal/service/auth"
	learningservice "shadowing-backend/internal/service/learning"
)

// Handler پنل ادمین را سرویس‌دهی می‌کند: آپلود تصویر/صدا و مدیریت صحنه‌ها/هات‌اسپات‌ها/دیالوگ‌ها
type Handler struct {
	learningSvc learningservice.Service
	aiSvc       aiservice.Service

	authSvc    authservice.Service
	authConfig authservice.Config

	// uploadDir مسیر ذخیره‌سازی فایل‌های آپلودشده روی دیسک است
	uploadDir string

	// publicPath پیشوند URL عمومی که فایل‌ها با آن سرو می‌شوند (مثلاً /uploads)
	publicPath string
}

func New(
	learningSvc learningservice.Service,
	aiSvc aiservice.Service,
	authSvc authservice.Service,
	authConfig authservice.Config,
	uploadDir, publicPath string,
) Handler {
	return Handler{
		learningSvc: learningSvc,
		aiSvc:       aiSvc,
		authSvc:     authSvc,
		authConfig:  authConfig,
		uploadDir:   uploadDir,
		publicPath:  publicPath,
	}
}
