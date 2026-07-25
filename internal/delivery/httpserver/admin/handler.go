package adminhandler

import (
	authservice "shadowing-backend/internal/service/auth"
	learningservice "shadowing-backend/internal/service/learning"
)

// Handler پنل ادمین را سرویس‌دهی می‌کند: آپلود تصویر/صدا و مدیریت صحنه‌ها/هات‌اسپات‌ها/دیالوگ‌ها
type Handler struct {
	learningSvc learningservice.Service

	authSvc    authservice.Service
	authConfig authservice.Config

	// uploadDir مسیر ذخیره‌سازی فایل‌های آپلودشده روی دیسک است
	uploadDir string

	// publicPath پیشوند URL عمومی که فایل‌ها با آن سرو می‌شوند (مثلاً /uploads)
	publicPath string
}

func New(
	learningSvc learningservice.Service,
	authSvc authservice.Service,
	authConfig authservice.Config,
	uploadDir, publicPath string,
) Handler {
	return Handler{
		learningSvc: learningSvc,
		authSvc:     authSvc,
		authConfig:  authConfig,
		uploadDir:   uploadDir,
		publicPath:  publicPath,
	}
}
