package missionhandler

import (
	authservice "shadowing-backend/internal/service/auth"
	missionservice "shadowing-backend/internal/service/mission"
)

type Handler struct {
	missionSvc *missionservice.Service

	authSvc authservice.Service

	authConfig authservice.Config
}

func New(missionSvc *missionservice.Service, authSvc authservice.Service, authConfig authservice.Config) Handler {
	return Handler{missionSvc: missionSvc, authSvc: authSvc, authConfig: authConfig}
}
