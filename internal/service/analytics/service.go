// Package analyticsservice رویدادهای آنالیتیکس اپ موبایل را اعتبارسنجی و ثبت
// می‌کند و برای صفحه‌ی «آمار» پنل ادمین خلاصه می‌کند (الگو از اپ Wallpaper).
package analyticsservice

import (
	"context"
	"regexp"
	"strings"

	"shadowing-backend/internal/pkg/richerror"
	postgresappevent "shadowing-backend/internal/repository/postgres/appevent"
)

// رویدادهای مجاز. اندپوینت ثبت عمومی است، پس فقط همین نام‌ها پذیرفته می‌شوند
// تا جدول با رویدادهای دلبخواه پر نشود. برای رویداد جدید، اینجا و در
// app/src/services/analytics.ts هر دو اضافه کنید.
const (
	EventAppOpen    = "app_open"
	EventScreenView = "screen_view"

	EventOnboardingCompleted = "onboarding_completed"
	EventSignedIn            = "signed_in"
	EventPlacementCompleted  = "placement_completed"
	EventSceneOpened         = "scene_opened"
	EventShadowRecorded      = "shadow_recorded"
	EventSceneCompleted      = "scene_completed"
	EventPaywallViewed       = "paywall_viewed"
	EventPaywallTapped       = "paywall_tapped"
	EventPurchaseCompleted   = "purchase_completed"
	EventAIConversationStart = "ai_conversation_started"
	EventTopicSpeakingDone   = "topic_speaking_submitted"
	EventVideoClipOpened     = "video_clip_opened"
	EventVideoClipQuizDone   = "video_clip_quiz_done"
	EventVideoClipPerformed  = "video_clip_performed"
	EventWritingSubmitted    = "writing_submitted"
	EventCourseLessonDone    = "course_lesson_completed"
	EventPodcastPlayed       = "podcast_played"
	// «نسخه‌ی من» از پادکست: شروع ضبط جمله‌ها / پخش نسخه‌ی ضبط‌شده.
	EventPodcastMyVersionStarted = "podcast_my_version_started"
	EventPodcastMyVersionPlayed  = "podcast_my_version_played"
	EventFreeSpeechSubmitted     = "free_speech_submitted"
	EventTokenTopupViewed        = "token_topup_viewed"
	EventTokenTopupPurchased     = "token_topup_purchased"
	// مسیر آموزشی: باز کردن یک قدم (target = نوع قدم) و ثبت Checkpoint هفته.
	EventPathItemOpened = "path_item_opened"
	EventCheckpointDone = "checkpoint_done"
	EventPathSelfIntro  = "path_self_intro"
	// انتخاب نقطه‌ی شروع مسیر (target = test / manual / continue).
	EventPathStartChoice = "path_start_choice"
	// ضربه روی کارت «تست دوباره» (۲۸ روز بعد از آخرین تست).
	EventRetestCardTap = "retest_card_tap"
	// مسیر هدف‌محور: ساخته شدن برنامه (target = goal) و باز کردن یک موقعیت.
	EventGoalPlanCreated   = "goal_plan_created"
	EventGoalSituationOpen = "goal_situation_open"
	EventGoalExtraOpen     = "goal_extra_open"
	EventGoalMapOpen       = "goal_map_open"
	EventGoalMapSpot       = "goal_map_spot"
	EventSongOpened        = "song_opened"
	EventSongSingRecorded  = "song_sing_recorded"
	// نقش‌آفرینی: شروع گفتگو روی یک سناریو (target = شناسه‌ی سناریو).
	EventRoleplayStarted = "roleplay_started"
)

var validEvents = map[string]bool{
	EventAppOpen: true, EventScreenView: true,
	EventOnboardingCompleted: true, EventSignedIn: true, EventPlacementCompleted: true,
	EventSceneOpened: true, EventShadowRecorded: true, EventSceneCompleted: true,
	EventPaywallViewed: true, EventPaywallTapped: true, EventPurchaseCompleted: true,
	EventAIConversationStart: true, EventRoleplayStarted: true, EventFreeSpeechSubmitted: true, EventTopicSpeakingDone: true,
	EventVideoClipOpened: true, EventVideoClipQuizDone: true, EventVideoClipPerformed: true,
	EventWritingSubmitted: true, EventCourseLessonDone: true, EventPodcastPlayed: true,
	EventPodcastMyVersionStarted: true, EventPodcastMyVersionPlayed: true,
	EventTokenTopupViewed: true, EventTokenTopupPurchased: true,
	EventPathItemOpened: true, EventCheckpointDone: true, EventPathSelfIntro: true,
	EventPathStartChoice:   true,
	EventRetestCardTap:     true,
	EventGoalPlanCreated:   true,
	EventGoalSituationOpen: true,
	EventGoalExtraOpen:     true,
	EventGoalMapOpen:       true,
	EventGoalMapSpot:       true,
	EventSongOpened:        true,
	EventSongSingRecorded:  true,
}

// FunnelSteps قدم‌های قیف اصلی محصول، به ترتیب نمایش در پنل.
var FunnelSteps = []string{
	EventAppOpen,
	EventOnboardingCompleted,
	EventSignedIn,
	EventPlacementCompleted,
	EventSceneOpened,
	EventShadowRecorded,
	EventPaywallViewed,
	EventPurchaseCompleted,
}

// قیف‌های هر قابلیت؛ درصدها نسبت به قدم اول، روی همه‌ی دستگاه‌های فعال این بازه.
var (
	PurchaseFunnelSteps  = []string{EventPaywallViewed, EventPaywallTapped, EventPurchaseCompleted}
	VideoClipFunnelSteps = []string{EventVideoClipOpened, EventVideoClipQuizDone, EventVideoClipPerformed}
	PodcastFunnelSteps   = []string{EventPodcastPlayed, EventPodcastMyVersionStarted, EventPodcastMyVersionPlayed}
)

// maxFieldLen سقف طول هر فیلد متنی؛ اندپوینت عمومی است و نباید بشود با آن
// رشته‌های بزرگ در دیتابیس نوشت.
const maxFieldLen = 64

// شناسه‌ی صفحه/هدف فقط حروف، عدد و چند علامت ساده — همان نام route یا UUID.
var safeToken = regexp.MustCompile(`^[A-Za-z0-9_.:-]*$`)

type repository interface {
	Insert(ctx context.Context, e postgresappevent.Event) error
	Daily(ctx context.Context, days int) ([]postgresappevent.DailyRow, error)
	Cohorts(ctx context.Context, days int) ([]postgresappevent.CohortRow, error)
	Screens(ctx context.Context, days int) ([]postgresappevent.ScreenRow, error)
	Events(ctx context.Context, days int) ([]postgresappevent.EventRow, error)
	Funnel(ctx context.Context, days int, steps []string) ([]postgresappevent.FunnelRow, error)
	WindowFunnel(ctx context.Context, days int, steps []string) ([]postgresappevent.FunnelRow, error)
}

type Service struct {
	repo repository
}

func New(repo repository) Service {
	return Service{repo: repo}
}

type TrackRequest struct {
	DeviceID   string `json:"device_id"`
	Event      string `json:"event"`
	AppVersion string `json:"app_version"`
	Screen     string `json:"screen"`
	Target     string `json:"target"`
}

// Track یک رویداد را ثبت می‌کند. userID از توکن (اگر کاربر وارد شده بود) می‌آید،
// نه از بدنه‌ی درخواست، تا کسی نتواند رویداد را به نام کاربر دیگری ثبت کند.
func (s Service) Track(ctx context.Context, req TrackRequest, userID string) error {
	const op = "analyticsservice.Track"

	e := postgresappevent.Event{
		DeviceID:   strings.TrimSpace(req.DeviceID),
		UserID:     userID,
		Event:      strings.TrimSpace(req.Event),
		AppVersion: strings.TrimSpace(req.AppVersion),
		Screen:     strings.TrimSpace(req.Screen),
		Target:     strings.TrimSpace(req.Target),
	}
	invalid := func(msg string) error {
		return richerror.New(op).WithMessage(msg).WithKind(richerror.KindInvalid)
	}
	if e.DeviceID == "" || len(e.DeviceID) > maxFieldLen || !safeToken.MatchString(e.DeviceID) {
		return invalid("شناسه‌ی دستگاه نامعتبر است")
	}
	if !validEvents[e.Event] {
		return invalid("رویداد نامعتبر است")
	}
	for _, f := range []string{e.AppVersion, e.Screen, e.Target} {
		if len(f) > maxFieldLen || !safeToken.MatchString(f) {
			return invalid("فیلد رویداد نامعتبر است")
		}
	}
	if e.Event == EventScreenView && e.Screen == "" {
		return invalid("نام صفحه الزامی است")
	}

	if err := s.repo.Insert(ctx, e); err != nil {
		return richerror.New(op).WithErr(err)
	}
	return nil
}

type DailyStats struct {
	Date          string `json:"date"`
	Opens         int64  `json:"opens"`
	ActiveDevices int64  `json:"active_devices"`
	NewDevices    int64  `json:"new_devices"`
	ActiveUsers   int64  `json:"active_users"`
	Shadows       int64  `json:"shadows"`
	Shadowers     int64  `json:"shadowers"`
}

// CohortStats ماندگاری کاربران جدید یک نسخه. D1Eligible/D7Eligible فقط
// کاربرانی را می‌شمارد که روز ۱/۷شان رسیده؛ درصد = Retained / Eligible.
type CohortStats struct {
	AppVersion string `json:"app_version"`
	NewDevices int64  `json:"new_devices"`
	// ShadowDay0 چند تا از این نصب‌ها روز اول در صحنه صدا ضبط کردند.
	ShadowDay0 int64 `json:"shadow_day0"`
	D1Eligible int64 `json:"d1_eligible"`
	D1Retained int64 `json:"d1_retained"`
	D7Eligible int64 `json:"d7_eligible"`
	D7Retained int64 `json:"d7_retained"`
}

type ScreenStats struct {
	Screen  string `json:"screen"`
	Views   int64  `json:"views"`
	Devices int64  `json:"devices"`
}

type EventStats struct {
	Event   string `json:"event"`
	Count   int64  `json:"count"`
	Devices int64  `json:"devices"`
}

type FunnelStep struct {
	Event   string `json:"event"`
	Devices int64  `json:"devices"`
}

type Summary struct {
	Days     int           `json:"days"`
	Daily    []DailyStats  `json:"daily"`
	Versions []CohortStats `json:"versions"`
	Screens  []ScreenStats `json:"screens"`
	Events   []EventStats  `json:"events"`
	Funnel   []FunnelStep  `json:"funnel"`
	// Shadowers / NonShadowers: ماندگاری نصب‌هایی که روز اول صدا ضبط کردند در
	// برابر بقیه — جواب مستقیم «آیا تمرین روز اول کاربر را نگه می‌دارد؟».
	Shadowers    CohortStats  `json:"shadowers"`
	NonShadowers CohortStats  `json:"non_shadowers"`
	Purchase     []FunnelStep `json:"purchase"`
	VideoClip    []FunnelStep `json:"video_clip"`
	Podcast      []FunnelStep `json:"podcast"`
}

const (
	defaultDays = 30
	maxDays     = 180
)

func (s Service) Summary(ctx context.Context, days int) (Summary, error) {
	const op = "analyticsservice.Summary"
	if days <= 0 {
		days = defaultDays
	}
	if days > maxDays {
		days = maxDays
	}

	daily, err := s.repo.Daily(ctx, days)
	if err != nil {
		return Summary{}, richerror.New(op).WithErr(err)
	}
	cohorts, err := s.repo.Cohorts(ctx, days)
	if err != nil {
		return Summary{}, richerror.New(op).WithErr(err)
	}
	screens, err := s.repo.Screens(ctx, days)
	if err != nil {
		return Summary{}, richerror.New(op).WithErr(err)
	}
	events, err := s.repo.Events(ctx, days)
	if err != nil {
		return Summary{}, richerror.New(op).WithErr(err)
	}
	funnel, err := s.repo.Funnel(ctx, days, FunnelSteps)
	if err != nil {
		return Summary{}, richerror.New(op).WithErr(err)
	}
	windowFunnels := make([][]FunnelStep, 0, 3)
	for _, steps := range [][]string{PurchaseFunnelSteps, VideoClipFunnelSteps, PodcastFunnelSteps} {
		rows, err := s.repo.WindowFunnel(ctx, days, steps)
		if err != nil {
			return Summary{}, richerror.New(op).WithErr(err)
		}
		windowFunnels = append(windowFunnels, toFunnel(rows))
	}

	res := Summary{
		Days:     days,
		Daily:    make([]DailyStats, 0, len(daily)),
		Versions: make([]CohortStats, 0, len(cohorts)),
		Screens:  make([]ScreenStats, 0, len(screens)),
		Events:   make([]EventStats, 0, len(events)),
		Funnel:   toFunnel(funnel),

		Purchase:  windowFunnels[0],
		VideoClip: windowFunnels[1],
		Podcast:   windowFunnels[2],
	}
	for _, r := range daily {
		res.Daily = append(res.Daily, DailyStats(r))
	}
	// ردیف‌های repo به ازای (نسخه، ضبط روز اول) هستند؛ اینجا یک بار به ازای
	// نسخه و یک بار به ازای «ضبط کرد / نکرد» جمعشان می‌کنیم. ترتیب نسخه‌ها از
	// ORDER BY همان کوئری می‌آید.
	byVersion := map[string]int{}
	for _, r := range cohorts {
		i, ok := byVersion[r.AppVersion]
		if !ok {
			i = len(res.Versions)
			byVersion[r.AppVersion] = i
			res.Versions = append(res.Versions, CohortStats{AppVersion: r.AppVersion})
		}
		addCohort(&res.Versions[i], r)
		if r.ShadowDay0 {
			addCohort(&res.Shadowers, r)
		} else {
			addCohort(&res.NonShadowers, r)
		}
	}
	for _, r := range screens {
		res.Screens = append(res.Screens, ScreenStats(r))
	}
	for _, r := range events {
		res.Events = append(res.Events, EventStats(r))
	}
	return res, nil
}

func addCohort(dst *CohortStats, r postgresappevent.CohortRow) {
	dst.NewDevices += r.Devices
	if r.ShadowDay0 {
		dst.ShadowDay0 += r.Devices
	}
	dst.D1Eligible += r.D1Eligible
	dst.D1Retained += r.D1Retained
	dst.D7Eligible += r.D7Eligible
	dst.D7Retained += r.D7Retained
}

func toFunnel(rows []postgresappevent.FunnelRow) []FunnelStep {
	out := make([]FunnelStep, 0, len(rows))
	for _, r := range rows {
		out = append(out, FunnelStep(r))
	}
	return out
}
