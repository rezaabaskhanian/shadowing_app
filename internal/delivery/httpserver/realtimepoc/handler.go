// Package realtimepochandler - PoC مجزا برای سنجش معماری Realtime Voice
// (Gemini Live) پیش از تصمیم به جایگزینیِ cascade فعلیِ گفتگوی AI
// (Whisper → LLM → TTS). عمداً از aiconversation فعلی جدا نگه داشته شده تا
// هیچ ریسکی برای مسیر production فعلی نداشته باشد. جزئیات تصمیم و شرایط
// بازبینی در PRODUCTION_CHECKLIST.md.
package realtimepochandler

import (
	authservice "shadowing-backend/internal/service/auth"
	settingsservice "shadowing-backend/internal/service/settings"
)

type Handler struct {
	settings *settingsservice.Service

	authSvc authservice.Service

	authConfig authservice.Config
}

func New(settings *settingsservice.Service, authSvc authservice.Service, authConfig authservice.Config) Handler {
	return Handler{settings: settings, authSvc: authSvc, authConfig: authConfig}
}
