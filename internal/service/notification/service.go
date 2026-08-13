package notificationservice

import (
	"context"

	postgresnotification "shadowing-backend/internal/repository/postgres/notification"
	pushservice "shadowing-backend/internal/service/push"
)

type repository interface {
	GetSettings(ctx context.Context, userID string) (postgresnotification.Settings, error)
	UpsertSettings(ctx context.Context, s postgresnotification.Settings) error
	DueUsers(ctx context.Context, hhmm string) ([]string, error)
	UpsertDeviceToken(ctx context.Context, userID, token, platform string) error
	TokensForUser(ctx context.Context, userID string) ([]string, error)
	OptedInTokens(ctx context.Context) ([]string, error)
	Stats(ctx context.Context) (dailyReminder, contentNotif, totalUsers int, err error)
	SaveBroadcast(ctx context.Context, title, body, createdBy string, sentCount int) error
	ListBroadcasts(ctx context.Context, limit int) ([]postgresnotification.Broadcast, error)
}

// Service منطق تنظیمات نوتیفیکیشن کاربر + ارسال پیام‌های همگانی/یادآوری روزانه
// را با ترکیب repository (Postgres) و pushservice (FCM) پیاده می‌کند.
type Service struct {
	repo repository
	push pushservice.Service
}

func New(repo repository, push pushservice.Service) Service {
	return Service{repo: repo, push: push}
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

// Broadcast یک پیام را به همه‌ی کاربرانی که نوتیفیکیشن محتوایی را فعال کرده‌اند
// می‌فرستد و آن را برای تاریخچه ذخیره می‌کند.
func (s Service) Broadcast(ctx context.Context, title, body, createdBy string) (int, error) {
	tokens, err := s.repo.OptedInTokens(ctx)
	if err != nil {
		return 0, err
	}
	sent := 0
	if s.push.Enabled() && len(tokens) > 0 {
		sent, err = s.push.SendToTokens(ctx, tokens, title, body)
		if err != nil {
			return 0, err
		}
	}
	if err := s.repo.SaveBroadcast(ctx, title, body, createdBy, sent); err != nil {
		return sent, err
	}
	return sent, nil
}

// SendDueReminders برای هر کاربری که یادآوری روزانه‌اش برای ساعت hhmm (فرمت
// "HH:MM") فعال است، یک نوتیفیکیشن عمومی می‌فرستد. توسط زمان‌بند سرور (هر
// دقیقه) صدا زده می‌شود.
func (s Service) SendDueReminders(ctx context.Context, hhmm string) (int, error) {
	if !s.push.Enabled() {
		return 0, nil
	}
	userIDs, err := s.repo.DueUsers(ctx, hhmm)
	if err != nil {
		return 0, err
	}

	const title = "🔥 وقت تمرینه!"
	const body = "چند دقیقه تمرین کن تا استریکت از بین نره."

	sentTotal := 0
	for _, userID := range userIDs {
		tokens, err := s.repo.TokensForUser(ctx, userID)
		if err != nil || len(tokens) == 0 {
			continue
		}
		sent, err := s.push.SendToTokens(ctx, tokens, title, body)
		if err != nil {
			continue
		}
		sentTotal += sent
	}
	return sentTotal, nil
}
