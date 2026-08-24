package learninghandler

import (
	authservice "shadowing-backend/internal/service/auth"
	billingservice "shadowing-backend/internal/service/billing"
	feedbackservice "shadowing-backend/internal/service/feedback"
	learningservice "shadowing-backend/internal/service/learning"
	progressservice "shadowing-backend/internal/service/progress"
	submissionservice "shadowing-backend/internal/service/submission"
	subscriptionservice "shadowing-backend/internal/service/subscription"
	topicsuggestionservice "shadowing-backend/internal/service/topicsuggestion"
)

type Handler struct {
	learningSvc        learningservice.Service
	submissionSvc      submissionservice.Service
	subscriptionSvc    subscriptionservice.Service
	topicSuggestionSvc topicsuggestionservice.Service
	feedbackSvc        feedbackservice.Service
	billingSvc         billingservice.Service
	progressSvc        *progressservice.Service

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
	topicSuggestionSvc topicsuggestionservice.Service,
	feedbackSvc feedbackservice.Service,
	billingSvc billingservice.Service,
	progressSvc *progressservice.Service,
	authSvc authservice.Service,
	authConfig authservice.Config,
	uploadDir, publicPath string,
) Handler {
	return Handler{
		learningSvc:        learningSvc,
		submissionSvc:      submissionSvc,
		subscriptionSvc:    subscriptionSvc,
		topicSuggestionSvc: topicSuggestionSvc,
		feedbackSvc:        feedbackSvc,
		billingSvc:         billingSvc,
		progressSvc:        progressSvc,
		authSvc:            authSvc,
		authConfig:         authConfig,
		uploadDir:          uploadDir,
		publicPath:         publicPath,
	}
}
