package userhandler

import (
	authservice "shadowing-backend/internal/service/auth"
	notificationservice "shadowing-backend/internal/service/notification"
	userservice "shadowing-backend/internal/service/user"
)

type Handler struct {
	userSvc         userservice.Service
	authSvc         authservice.Service
	notificationSvc notificationservice.Service

	authConfig authservice.Config
}

func New(
	userSvc userservice.Service,
	authSvc authservice.Service,
	notificationSvc notificationservice.Service,
	authConfig authservice.Config,
	authSingKey string,
) Handler {
	return Handler{userSvc: userSvc, authSvc: authSvc, notificationSvc: notificationSvc, authConfig: authConfig}
}
