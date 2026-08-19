package userhandler

import (
	authservice "shadowing-backend/internal/service/auth"
	notificationservice "shadowing-backend/internal/service/notification"
	otpservice "shadowing-backend/internal/service/otp"
	userservice "shadowing-backend/internal/service/user"
)

type Handler struct {
	userSvc         userservice.Service
	authSvc         authservice.Service
	notificationSvc notificationservice.Service
	otpSvc          otpservice.Service

	authConfig authservice.Config
}

func New(
	userSvc userservice.Service,
	authSvc authservice.Service,
	notificationSvc notificationservice.Service,
	otpSvc otpservice.Service,
	authConfig authservice.Config,
	authSingKey string,
) Handler {
	return Handler{userSvc: userSvc, authSvc: authSvc, notificationSvc: notificationSvc, otpSvc: otpSvc, authConfig: authConfig}
}
