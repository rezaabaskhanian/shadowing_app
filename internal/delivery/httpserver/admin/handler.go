package adminhandler

import (
	aiservice "shadowing-backend/internal/service/ai"
	authservice "shadowing-backend/internal/service/auth"
	landingservice "shadowing-backend/internal/service/landing"
	learningservice "shadowing-backend/internal/service/learning"
	notificationservice "shadowing-backend/internal/service/notification"
	settingsservice "shadowing-backend/internal/service/settings"
	submissionservice "shadowing-backend/internal/service/submission"
	subscriptionservice "shadowing-backend/internal/service/subscription"
	topicsuggestionservice "shadowing-backend/internal/service/topicsuggestion"
	ttsservice "shadowing-backend/internal/service/tts"
	userservice "shadowing-backend/internal/service/user"
)

// Handler پنل ادمین را سرویس‌دهی می‌کند: آپلود تصویر/صدا و مدیریت صحنه‌ها/هات‌اسپات‌ها/دیالوگ‌ها
type Handler struct {
	learningSvc        learningservice.Service
	aiSvc              aiservice.Service
	ttsSvc             ttsservice.Service
	settingsSvc        *settingsservice.Service
	notificationSvc    notificationservice.Service
	submissionSvc      submissionservice.Service
	subscriptionSvc    subscriptionservice.Service
	topicSuggestionSvc topicsuggestionservice.Service
	userSvc            userservice.Service
	landingSvc         landingservice.Service

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
	ttsSvc ttsservice.Service,
	settingsSvc *settingsservice.Service,
	notificationSvc notificationservice.Service,
	submissionSvc submissionservice.Service,
	subscriptionSvc subscriptionservice.Service,
	topicSuggestionSvc topicsuggestionservice.Service,
	userSvc userservice.Service,
	landingSvc landingservice.Service,
	authSvc authservice.Service,
	authConfig authservice.Config,
	uploadDir, publicPath string,
) Handler {
	return Handler{
		learningSvc:        learningSvc,
		aiSvc:              aiSvc,
		ttsSvc:             ttsSvc,
		settingsSvc:        settingsSvc,
		notificationSvc:    notificationSvc,
		submissionSvc:      submissionSvc,
		subscriptionSvc:    subscriptionSvc,
		topicSuggestionSvc: topicSuggestionSvc,
		userSvc:            userSvc,
		landingSvc:         landingSvc,
		authSvc:            authSvc,
		authConfig:         authConfig,
		uploadDir:          uploadDir,
		publicPath:         publicPath,
	}
}
