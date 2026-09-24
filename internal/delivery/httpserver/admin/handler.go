package adminhandler

import (
	"context"
	"shadowing-backend/internal/pkg/filestore"
	aiservice "shadowing-backend/internal/service/ai"
	aiaccessservice "shadowing-backend/internal/service/aiaccess"
	assessmentservice "shadowing-backend/internal/service/assessment"
	authservice "shadowing-backend/internal/service/auth"
	feedbackservice "shadowing-backend/internal/service/feedback"
	landingservice "shadowing-backend/internal/service/landing"
	learningservice "shadowing-backend/internal/service/learning"
	notificationservice "shadowing-backend/internal/service/notification"
	proxyservice "shadowing-backend/internal/service/proxy"
	settingsservice "shadowing-backend/internal/service/settings"
	submissionservice "shadowing-backend/internal/service/submission"
	subscriptionservice "shadowing-backend/internal/service/subscription"
	tokentopupservice "shadowing-backend/internal/service/tokentopup"
	topicsuggestionservice "shadowing-backend/internal/service/topicsuggestion"
	ttsservice "shadowing-backend/internal/service/tts"
	userservice "shadowing-backend/internal/service/user"
)

// Handler پنل ادمین را سرویس‌دهی می‌کند: آپلود تصویر/صدا و مدیریت صحنه‌ها/هات‌اسپات‌ها/دیالوگ‌ها
type Handler struct {
	learningSvc        learningservice.Service
	assessmentSvc      *assessmentservice.Service
	aiSvc              aiservice.Service
	aiAccessSvc        *aiaccessservice.Service
	tokenTopupSvc      tokentopupservice.Service
	ttsSvc             ttsservice.Service
	proxySvc           proxyservice.Service
	settingsSvc        *settingsservice.Service
	notificationSvc    notificationservice.Service
	submissionSvc      submissionservice.Service
	subscriptionSvc    subscriptionservice.Service
	topicSuggestionSvc topicsuggestionservice.Service
	userSvc            userservice.Service
	landingSvc         landingservice.Service
	feedbackSvc        feedbackservice.Service

	authSvc    authservice.Service
	authConfig authservice.Config

	// store محل ذخیره‌ی فایل‌های آپلودی/تولیدشده (تصویر/صدا) است — روی دیسکِ
	// محلی یا object storage، بسته به تنظیمِ OBJECT_STORAGE_* (filestore.New).
	store filestore.Store
	// verbSvc بعد از ساخت/ویرایش هر صحنه جمله‌های تازه‌اش را برای افعال
	// چندمعنایی جست‌وجو می‌کند (به صف بررسی ادمین اضافه می‌شوند).
	verbSvc sceneVerbScanner
}

type sceneVerbScanner interface {
	ScanScene(ctx context.Context, sceneID string)
}

// scanSceneVerbs در پس‌زمینه اجرا می‌شود تا ذخیره‌ی صحنه منتظر فراخوانی AI نماند.
func (h Handler) scanSceneVerbs(sceneID string) {
	if h.verbSvc == nil || sceneID == "" {
		return
	}
	go h.verbSvc.ScanScene(context.Background(), sceneID)
}

func New(
	learningSvc learningservice.Service,
	assessmentSvc *assessmentservice.Service,
	aiSvc aiservice.Service,
	aiAccessSvc *aiaccessservice.Service,
	tokenTopupSvc tokentopupservice.Service,
	ttsSvc ttsservice.Service,
	proxySvc proxyservice.Service,
	settingsSvc *settingsservice.Service,
	notificationSvc notificationservice.Service,
	submissionSvc submissionservice.Service,
	subscriptionSvc subscriptionservice.Service,
	topicSuggestionSvc topicsuggestionservice.Service,
	userSvc userservice.Service,
	landingSvc landingservice.Service,
	feedbackSvc feedbackservice.Service,
	authSvc authservice.Service,
	authConfig authservice.Config,
	store filestore.Store,
	verbSvc sceneVerbScanner,
) Handler {
	return Handler{
		learningSvc:        learningSvc,
		assessmentSvc:      assessmentSvc,
		aiSvc:              aiSvc,
		aiAccessSvc:        aiAccessSvc,
		tokenTopupSvc:      tokenTopupSvc,
		ttsSvc:             ttsSvc,
		proxySvc:           proxySvc,
		settingsSvc:        settingsSvc,
		notificationSvc:    notificationSvc,
		submissionSvc:      submissionSvc,
		subscriptionSvc:    subscriptionSvc,
		topicSuggestionSvc: topicSuggestionSvc,
		userSvc:            userSvc,
		landingSvc:         landingSvc,
		feedbackSvc:        feedbackSvc,
		authSvc:            authSvc,
		authConfig:         authConfig,
		store:              store,
		verbSvc:            verbSvc,
	}
}
