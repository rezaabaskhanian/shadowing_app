package learninghandler

import (
	authservice "shadowing-backend/internal/service/auth"
	learningservice "shadowing-backend/internal/service/learning"
	submissionservice "shadowing-backend/internal/service/submission"
	subscriptionservice "shadowing-backend/internal/service/subscription"
)

type Handler struct {
	learningSvc     learningservice.Service
	submissionSvc   submissionservice.Service
	subscriptionSvc subscriptionservice.Service

	authSvc authservice.Service

	authConfig authservice.Config

	// uploadDir/publicPath برای آپلود تصویر پیشنهاد صحنه توسط کاربر عادی
	uploadDir  string
	publicPath string
}

func New(
	learningSvc learningservice.Service,
	submissionSvc submissionservice.Service,
	subscriptionSvc subscriptionservice.Service,
	authSvc authservice.Service,
	authConfig authservice.Config,
	uploadDir, publicPath string,
) Handler {
	return Handler{
		learningSvc:     learningSvc,
		submissionSvc:   submissionSvc,
		subscriptionSvc: subscriptionSvc,
		authSvc:         authSvc,
		authConfig:      authConfig,
		uploadDir:       uploadDir,
		publicPath:      publicPath,
	}
}
