package httpserver

import (
	"shadowing-backend/internal/config"
	adminhandler "shadowing-backend/internal/delivery/httpserver/admin"
	habithandler "shadowing-backend/internal/delivery/httpserver/habit"
	leitnerhandler "shadowing-backend/internal/delivery/httpserver/leitner"

	learninghandler "shadowing-backend/internal/delivery/httpserver/learning"
	progresshandler "shadowing-backend/internal/delivery/httpserver/progress"
	shadowinghandler "shadowing-backend/internal/delivery/httpserver/shadowing"
	userhandler "shadowing-backend/internal/delivery/httpserver/user"

	// adminservice "shadowing-backend/internal/service/admin"

	aiservice "shadowing-backend/internal/service/ai"
	authservice "shadowing-backend/internal/service/auth"
	billingservice "shadowing-backend/internal/service/billing"
	habitservice "shadowing-backend/internal/service/habit"
	learningservice "shadowing-backend/internal/service/learning"
	leitnerservice "shadowing-backend/internal/service/leitner"
	notificationservice "shadowing-backend/internal/service/notification"
	progressservice "shadowing-backend/internal/service/progress"
	settingsservice "shadowing-backend/internal/service/settings"
	shadowingservice "shadowing-backend/internal/service/shadowing"
	submissionservice "shadowing-backend/internal/service/submission"
	subscriptionservice "shadowing-backend/internal/service/subscription"
	topicsuggestionservice "shadowing-backend/internal/service/topicsuggestion"
	ttsservice "shadowing-backend/internal/service/tts"

	"fmt"
	userservice "shadowing-backend/internal/service/user"

	"github.com/labstack/echo/v4"
	"github.com/labstack/echo/v4/middleware"
)

// مسیر ذخیره‌سازی فایل‌های آپلودشده و پیشوند عمومی سرو آن‌ها
const (
	uploadDir     = "uploads"
	uploadURLPath = "/uploads"
)

type Service struct {
	cfg         config.Config
	userHandler userhandler.Handler

	learningHandler learninghandler.Handler

	shadowingHandler shadowinghandler.Handler

	progressHndler progresshandler.Handler

	adminHandler adminhandler.Handler

	habitHandler habithandler.Handler

	leitnerHandler leitnerhandler.Handler
}

func New(cfg config.Config, userSvc userservice.Service,
	authSvc authservice.Service, authConfig authservice.Config,
	learningSvc learningservice.Service,
	shadowingSvc shadowingservice.Service,
	progressSvc progressservice.Service,
	settingsSvc *settingsservice.Service,
	notificationSvc notificationservice.Service,
	submissionSvc submissionservice.Service,
	subscriptionSvc subscriptionservice.Service,
	topicSuggestionSvc topicsuggestionservice.Service,
	habitSvc habitservice.Service,
	billingSvc billingservice.Service,
	leitnerSvc leitnerservice.Service,

) Service {

	return Service{cfg: cfg,
		userHandler: userhandler.New(userSvc, authSvc, notificationSvc, authConfig, cfg.Auth.SignKey),
		learningHandler: learninghandler.New(
			learningSvc, submissionSvc, subscriptionSvc, topicSuggestionSvc, billingSvc, &progressSvc, authSvc, authConfig, uploadDir, uploadURLPath,
		),

		shadowingHandler: shadowinghandler.New(shadowingSvc, authSvc, authConfig, uploadDir),

		progressHndler: progresshandler.New(progressSvc, authSvc, authConfig),

		adminHandler: adminhandler.New(
			learningSvc,
			aiservice.New(settingsSvc),
			ttsservice.New(settingsSvc),
			settingsSvc,
			notificationSvc,
			submissionSvc,
			subscriptionSvc,
			topicSuggestionSvc,
			userSvc,
			authSvc, authConfig, uploadDir, uploadURLPath,
		),

		habitHandler: habithandler.New(habitSvc, authSvc, authConfig, uploadDir),

		leitnerHandler: leitnerhandler.New(leitnerSvc, authSvc, authConfig),
	}
}

func (s Service) Server() {

	e := echo.New()

	// for debug error

	e.Use(middleware.CORSWithConfig(middleware.CORSConfig{
		AllowOrigins: []string{
			"http://localhost:3000",
			"http://localhost:3001",
		},
		AllowMethods: []string{
			echo.GET,
			echo.POST,
			echo.PUT,
			echo.DELETE,
			echo.OPTIONS,
		},
		AllowHeaders: []string{
			echo.HeaderOrigin,
			echo.HeaderContentType,
			echo.HeaderAccept,
			echo.HeaderAuthorization,
		},
		AllowCredentials: true,
	}))

	e.Use(middleware.Logger())

	e.Use(middleware.Recover())

	// e.GET("/Health", s.health)

	s.userHandler.SetUserRoutes(e)
	s.learningHandler.SetLearningRoutes(e)

	// روت‌های عمومی صحنه برای اپ موبایل (فقط خواندن)
	s.learningHandler.SetPublicSceneRoutes(e)

	s.shadowingHandler.SetShadowingRoutes(e)

	s.progressHndler.SetProgressRoutes(e)

	s.adminHandler.SetAdminRoutes(e)

	s.habitHandler.SetHabitRoutes(e)

	s.leitnerHandler.SetLeitnerRoutes(e)

	// سرو استاتیک فایل‌های آپلودشده (تصاویر و صداها، مثلاً /uploads/xxx.png)
	e.Static(uploadURLPath, uploadDir)

	e.Logger.Fatal(e.Start(fmt.Sprintf(":%d", s.cfg.HttpServer.Port)))

}
