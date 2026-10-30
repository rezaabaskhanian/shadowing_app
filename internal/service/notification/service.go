package notificationservice

import (
	"context"
	"errors"

	postgresrecording "shadowing-backend/internal/repository/postgres/shadowing/recording"

	postgresnotification "shadowing-backend/internal/repository/postgres/notification"
	pushservice "shadowing-backend/internal/service/push"

	"github.com/google/uuid"
)

type repository interface {
	GetSettings(ctx context.Context, userID string) (postgresnotification.Settings, error)
	UpsertSettings(ctx context.Context, s postgresnotification.Settings) error
	UpsertDeviceToken(ctx context.Context, userID, token, platform string) error
	TokensForUser(ctx context.Context, userID string) ([]string, error)
	OptedInTokens(ctx context.Context) ([]string, error)
	AllTokens(ctx context.Context) ([]string, error)
	TokensForPhone(ctx context.Context, phone string) ([]string, bool, error)
	StreakReminderTokens(ctx context.Context) ([]string, error)
	VocabReminderTokens(ctx context.Context) ([]string, error)
	WeeklyDigestOptedInUserIDs(ctx context.Context) ([]uuid.UUID, error)
	Stats(ctx context.Context) (dailyReminder, contentNotif, totalUsers int, err error)
	SaveBroadcast(ctx context.Context, title, body, createdBy string, sentCount int, target, targetPhone string) error
	ListBroadcasts(ctx context.Context, limit int) ([]postgresnotification.Broadcast, error)
}

// RecordingStatsRepository همان اینترفیسی است که progressservice برای
// Progress Over Time استفاده می‌کند — همان نمونه‌ی موجود دوباره تزریق
// می‌شود، ریپازیتوری جدیدی ساخته نمی‌شود.
type RecordingStatsRepository interface {
	AvgScoresByUser(ctx context.Context, userID uuid.UUID) (avgPronunciation, avgFluency float64, err error)
	TrendByUser(ctx context.Context, userID uuid.UUID) ([]postgresrecording.WeekTrend, error)
}

// LeitnerStatsRepository همان اینترفیسی است که progressservice برای مهارت
// Vocabulary استفاده می‌کند.
type LeitnerStatsRepository interface {
	AvgLevelByUser(ctx context.Context, userID uuid.UUID) (avgLevel float64, wordCount int, err error)
}

// GrammarStatsRepository همان اینترفیسی است که progressservice برای مهارت
// Grammar استفاده می‌کند.
type GrammarStatsRepository interface {
	CleanRate(ctx context.Context, userID uuid.UUID) (clean, total int, err error)
}

// Service منطق تنظیمات نوتیفیکیشن کاربر + ارسال پیام‌های همگانی/یادآوری روزانه
// را با ترکیب repository (Postgres) و pushservice (FCM) پیاده می‌کند.
type Service struct {
	repo      repository
	push      pushservice.Service
	recording RecordingStatsRepository
	leitner   LeitnerStatsRepository
	grammar   GrammarStatsRepository
}

func New(repo repository, push pushservice.Service, recording RecordingStatsRepository, leitner LeitnerStatsRepository, grammar GrammarStatsRepository) Service {
	return Service{repo: repo, push: push, recording: recording, leitner: leitner, grammar: grammar}
}

type Settings = postgresnotification.Settings
type Broadcast = postgresnotification.Broadcast

func (s Service) GetSettings(ctx context.Context, userID string) (Settings, error) {
	return s.repo.GetSettings(ctx, userID)
}

func (s Service) UpsertSettings(ctx context.Context, settings Settings) error {
	return s.repo.UpsertSettings(ctx, settings)
}

func (s Service) RegisterDeviceToken(ctx context.Context, userID, token, platform string) error {
	return s.repo.UpsertDeviceToken(ctx, userID, token, platform)
}

func (s Service) Stats(ctx context.Context) (dailyReminder, contentNotif, totalUsers int, err error) {
	return s.repo.Stats(ctx)
}

// PushEnabled مشخص می‌کند آیا کلید سرویس FCM تنظیم شده است یا نه.
func (s Service) PushEnabled() bool {
	return s.push.Enabled()
}

func (s Service) ListBroadcasts(ctx context.Context, limit int) ([]Broadcast, error) {
	return s.repo.ListBroadcasts(ctx, limit)
}

// گیرنده‌های پیام پنل ادمین.
const (
	TargetOptedIn = "opted_in" // فقط کسانی که نوتیف محتوایی را روشن کرده‌اند
	TargetAll     = "all"      // همه‌ی دستگاه‌های ثبت‌شده
	TargetPhone   = "phone"    // یک کاربر، با شماره تلفن
)

// ErrUserNotFound و ErrNoDevice برای پیام خطای روشن در پنل وقتی گیرنده یک
// شماره‌ی خاص است.
var (
	ErrUserNotFound = errors.New("کاربری با این شماره تلفن پیدا نشد")
	ErrNoDevice     = errors.New("این کاربر هنوز دستگاهی برای نوتیف ثبت نکرده (اپ را باز نکرده یا اجازه‌ی نوتیف نداده)")
)

// BroadcastResult تعداد دستگاه‌های هدف و تعداد ارسال‌های موفق.
type BroadcastResult struct {
	DeviceCount int
	SentCount   int
}

// Broadcast پیام پنل ادمین را به گیرنده‌ی انتخاب‌شده می‌فرستد و برای تاریخچه
// ذخیره می‌کند.
func (s Service) Broadcast(ctx context.Context, target, phone, title, body, createdBy string) (BroadcastResult, error) {
	var (
		tokens []string
		err    error
	)
	switch target {
	case TargetAll:
		tokens, err = s.repo.AllTokens(ctx)
	case TargetPhone:
		var found bool
		tokens, found, err = s.repo.TokensForPhone(ctx, phone)
		if err == nil && !found {
			return BroadcastResult{}, ErrUserNotFound
		}
		if err == nil && len(tokens) == 0 {
			return BroadcastResult{}, ErrNoDevice
		}
	default:
		target = TargetOptedIn
		phone = ""
		tokens, err = s.repo.OptedInTokens(ctx)
	}
	if err != nil {
		return BroadcastResult{}, err
	}
	if target != TargetPhone {
		phone = ""
	}

	res := BroadcastResult{DeviceCount: len(tokens)}
	if s.push.Enabled() && len(tokens) > 0 {
		res.SentCount, err = s.push.SendToTokens(ctx, tokens, title, body)
		if err != nil {
			return res, err
		}
	}
	if err := s.repo.SaveBroadcast(ctx, title, body, createdBy, res.SentCount, target, phone); err != nil {
		return res, err
	}
	return res, nil
}

// SendToUser یک نوتیف اختصاصی به همه‌ی دستگاه‌های یک کاربر می‌فرستد (مثلاً جواب پشتیبانی).
func (s Service) SendToUser(ctx context.Context, userID, title, body string) (int, error) {
	if !s.push.Enabled() {
		return 0, nil
	}
	tokens, err := s.repo.TokensForUser(ctx, userID)
	if err != nil || len(tokens) == 0 {
		return 0, err
	}
	return s.push.SendToTokens(ctx, tokens, title, body)
}

// SendStreakReminders به کاربرانی که یادآوری استریک را روشن کرده‌اند و امروز
// هنوز تمرین نکرده‌اند (ولی استریکشان هنوز نشکسته) پوش یادآوری می‌فرستد.
// از یک اجرای روزانه‌ی زمان‌بندی‌شده (cmd/main.go) صدا زده می‌شود.
func (s Service) SendStreakReminders(ctx context.Context) (int, error) {
	if !s.push.Enabled() {
		return 0, nil
	}
	tokens, err := s.repo.StreakReminderTokens(ctx)
	if err != nil {
		return 0, err
	}
	if len(tokens) == 0 {
		return 0, nil
	}
	return s.push.SendToTokens(
		ctx, tokens,
		"استریکت داره از دست می‌ره! 🔥",
		"امروز هنوز تمرین نکردی — یه تمرین سریع بزن تا استریکت نشکنه.",
	)
}

// SendVocabReminders به کاربرانی که یادآوری واژگان را روشن کرده‌اند و حداقل
// یک کلمه در جعبه‌ی لایتنرشان سررسیده شده پوش یادآوری می‌فرستد. مثل
// SendStreakReminders، از یک اجرای روزانه‌ی زمان‌بندی‌شده (cmd/main.go) صدا
// زده می‌شود؛ پیام عمداً بدون عدد دقیق است (send یکجا به همه‌ی توکن‌ها با یک
// متن است، نه پیام شخصی‌سازی‌شده به‌ازای هر کاربر).
func (s Service) SendVocabReminders(ctx context.Context) (int, error) {
	if !s.push.Enabled() {
		return 0, nil
	}
	tokens, err := s.repo.VocabReminderTokens(ctx)
	if err != nil {
		return 0, err
	}
	if len(tokens) == 0 {
		return 0, nil
	}
	return s.push.SendToTokens(
		ctx, tokens,
		"وقتِ مرور واژگانه 📚",
		"چند تا کلمه تو جعبه‌ی لایتنرت سررسیده — یه نگاه سریع بنداز تا یادت نره.",
	)
}
