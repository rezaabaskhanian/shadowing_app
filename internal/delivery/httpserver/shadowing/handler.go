package shadowinghandler

import shadowingservice "shadowing-backend/internal/service/shadowing"

type Handler struct {
	ShadowingSvc shadowingservice.Service
}

func New(ShadowingSvc shadowingservice.Service) Handler {
	return Handler{ShadowingSvc: ShadowingSvc}
}
