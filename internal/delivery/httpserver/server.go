package httpserver

import (
	"os"
	"strings"

	"shadowing-backend/internal/config"
	adminhandler "shadowing-backend/internal/delivery/httpserver/admin"
	habithandler "shadowing-backend/internal/delivery/httpserver/habit"
	leitnerhandler "shadowing-backend/internal/delivery/httpserver/leitner"

	landinghandler "shadowing-backend/internal/delivery/httpserver/landing"
	learninghandler "shadowing-backend/internal/delivery/httpserver/learning"
	progresshandler "shadowing-backend/internal/delivery/httpserver/progress"
	shadowinghandler "shadowing-backend/internal/delivery/httpserver/shadowing"
	userhandler "shadowing-backend/internal/delivery/httpserver/user"

	// adminservice "shadowing-backend/internal/service/admin"

	aiservice "shadowing-backend/internal/service/ai"
	authservice "shadowing-backend/internal/service/auth"
	billingservice "shadowing-backend/internal/service/billing"
	feedbackservice "shadowing-backend/internal/service/feedback"
	habitservice "shadowing-backend/internal/service/habit"
	landingservice "shadowing-backend/internal/service/landing"
	learningservice "shadowing-backend/internal/service/learning"
	leitnerservice "shadowing-backend/internal/service/leitner"
	notificationservice "shadowing-backend/internal/service/notification"
	otpservice "shadowing-backend/internal/service/otp"
	progressservice "shadowing-backend/internal/service/progress"
	proxyservice "shadowing-backend/internal/service/proxy"
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

	landingHandler landinghandler.Handler
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
	feedbackSvc feedbackservice.Service,
	habitSvc habitservice.Service,
	billingSvc billingservice.Service,
	leitnerSvc leitnerservice.Service,
	otpSvc otpservice.Service,
	landingSvc landingservice.Service,

) Service {

	return Service{cfg: cfg,
		userHandler: userhandler.New(userSvc, authSvc, notificationSvc, otpSvc, authConfig, cfg.Auth.SignKey),
		learningHandler: learninghandler.New(
			learningSvc, submissionSvc, subscriptionSvc, topicSuggestionSvc, feedbackSvc, billingSvc, &progressSvc, authSvc, authConfig, uploadDir, uploadURLPath,
		),

		shadowingHandler: shadowinghandler.New(shadowingSvc, authSvc, authConfig, uploadDir),

		progressHndler: progresshandler.New(progressSvc, authSvc, authConfig),

		adminHandler: adminhandler.New(
			learningSvc,
			aiservice.New(settingsSvc),
			ttsservice.New(settingsSvc),
			proxyservice.New(settingsSvc),
			settingsSvc,
			notificationSvc,
			submissionSvc,
			subscriptionSvc,
			topicSuggestionSvc,
			userSvc,
			landingSvc,
			feedbackSvc,
			authSvc, authConfig, uploadDir, uploadURLPath,
		),

		habitHandler: habithandler.New(habitSvc, authSvc, authConfig, uploadDir),

		leitnerHandler: leitnerhandler.New(leitnerSvc, authSvc, authConfig),

		landingHandler: landinghandler.New(landingSvc),
	}
}

// allowedOrigins reads CORS origins from ALLOWED_ORIGINS (comma-separated),
// falling back to local dev origins when unset.
func allowedOrigins() []string {
	raw := os.Getenv("ALLOWED_ORIGINS")
	if raw == "" {
		return []string{
			"http://localhost:3000",
			"http://localhost:3001",
		}
	}

	origins := make([]string, 0)
	for _, origin := range strings.Split(raw, ",") {
		if origin = strings.TrimSpace(origin); origin != "" {
			origins = append(origins, origin)
		}
	}
	return origins
}

func (s Service) Server() {

	e := echo.New()

	// for debug error

	e.Use(middleware.CORSWithConfig(middleware.CORSConfig{
		AllowOrigins: allowedOrigins(),
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

	// محتوای عمومی صفحه‌ی معرفی (www.lingoflow.ir) — بدون احراز هویت
	s.landingHandler.SetPublicLandingRoutes(e)

	// سرو استاتیک فایل‌های آپلودشده (تصاویر و صداها، مثلاً /uploads/xxx.png)
	e.Static(uploadURLPath, uploadDir)

	e.Logger.Fatal(e.Start(fmt.Sprintf(":%d", s.cfg.HttpServer.Port)))

}
