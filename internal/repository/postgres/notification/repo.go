package postgresnotification

import (
	"context"

	"shadowing-backend/internal/pkg/richerror"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type DB struct {
	conn *pgxpool.Pool
}

func New(conn *pgxpool.Pool) DB {
	return DB{conn: conn}
}

type Settings struct {
	UserID               string `json:"-"`
	DailyReminderEnabled bool   `json:"daily_reminder_enabled"`
	DailyReminderTime    string `json:"daily_reminder_time"`
	ContentNotifEnabled  bool   `json:"content_notif_enabled"`
	ContentSource        string `json:"content_source"`
}

type Broadcast struct {
	ID        string `json:"id"`
	Title     string `json:"title"`
	Body      string `json:"body"`
	SentCount int    `json:"sent_count"`
	CreatedAt string `json:"created_at"`
}

// GetSettings تنظیمات نوتیفیکیشن کاربر را برمی‌گرداند؛ اگر هنوز ردیفی ثبت نشده
// باشد، مقادیر پیش‌فرض (فعال، ساعت ۲۰:۰۰، مخلوط) را برمی‌گرداند.
func (r DB) GetSettings(ctx context.Context, userID string) (Settings, error) {
	const op = "postgresnotification.GetSettings"

	const query = `
		SELECT daily_reminder_enabled, daily_reminder_time, content_notif_enabled, content_source
		FROM user_notification_settings WHERE user_id = $1
	`
	s := Settings{
		UserID:               userID,
		DailyReminderEnabled: true,
		DailyReminderTime:    "20:00",
		ContentNotifEnabled:  true,
		ContentSource:        "mixed",
	}
	err := r.conn.QueryRow(ctx, query, userID).Scan(
		&s.DailyReminderEnabled, &s.DailyReminderTime, &s.ContentNotifEnabled, &s.ContentSource,
	)
	if err != nil {
		if err == pgx.ErrNoRows {
			return s, nil
		}
		return Settings{}, richerror.New(op).WithErr(err).WithMessage("خطا در خواندن تنظیمات نوتیفیکیشن")
	}
	return s, nil
}

// UpsertSettings تنظیمات نوتیفیکیشن کاربر را درج/به‌روزرسانی می‌کند.
func (r DB) UpsertSettings(ctx context.Context, s Settings) error {
	const op = "postgresnotification.UpsertSettings"

	const query = `
		INSERT INTO user_notification_settings
			(user_id, daily_reminder_enabled, daily_reminder_time, content_notif_enabled, content_source, updated_at)
		VALUES ($1, $2, $3, $4, $5, now())
		ON CONFLICT (user_id) DO UPDATE SET
			daily_reminder_enabled = EXCLUDED.daily_reminder_enabled,
			daily_reminder_time    = EXCLUDED.daily_reminder_time,
			content_notif_enabled  = EXCLUDED.content_notif_enabled,
			content_source         = EXCLUDED.content_source,
			updated_at             = now()
	`
	_, err := r.conn.Exec(ctx, query, s.UserID, s.DailyReminderEnabled, s.DailyReminderTime, s.ContentNotifEnabled, s.ContentSource)
	if err != nil {
		return richerror.New(op).WithErr(err).WithMessage("خطا در ذخیره تنظیمات نوتیفیکیشن")
	}
	return nil
}

// DueUsers کاربرانی که یادآوری روزانه‌شان فعال است و ساعت آن با hhmm فعلی برابر
// است را برمی‌گرداند (برای زمان‌بند سرور).
func (r DB) DueUsers(ctx context.Context, hhmm string) ([]string, error) {
	const op = "postgresnotification.DueUsers"

	// LEFT JOIN عمداً: کاربری که ردیف تنظیمات ندارد باید با پیش‌فرض‌های
	// GetSettings (فعال، ساعت ۲۰:۰۰) در نظر گرفته شود، نه حذف شود.
	const query = `
		SELECT u.id FROM users u
		LEFT JOIN user_notification_settings uns ON uns.user_id = u.id
		WHERE COALESCE(uns.daily_reminder_enabled, true) = true
		  AND COALESCE(uns.daily_reminder_time, '20:00') = $1
	`
	rows, err := r.conn.Query(ctx, query, hhmm)
	if err != nil {
		return nil, richerror.New(op).WithErr(err).WithMessage("خطا در خواندن کاربران سررسیده")
	}
	defer rows.Close()

	var ids []string
	for rows.Next() {
		var id string
		if err := rows.Scan(&id); err != nil {
			return nil, richerror.New(op).WithErr(err)
		}
		ids = append(ids, id)
	}
	return ids, nil
}

// UpsertDeviceToken توکن FCM دستگاه را ثبت/به‌روزرسانی می‌کند (هر توکن یکتاست).
func (r DB) UpsertDeviceToken(ctx context.Context, userID, token, platform string) error {
	const op = "postgresnotification.UpsertDeviceToken"

	const query = `
		INSERT INTO device_push_tokens (user_id, token, platform, created_at, last_seen_at)
		VALUES ($1, $2, $3, now(), now())
		ON CONFLICT (token) DO UPDATE SET user_id = EXCLUDED.user_id, last_seen_at = now()
	`
	_, err := r.conn.Exec(ctx, query, userID, token, platform)
	if err != nil {
		return richerror.New(op).WithErr(err).WithMessage("خطا در ثبت توکن دستگاه")
	}
	return nil
}

// TokensForUser همه‌ی توکن‌های دستگاه‌های یک کاربر را برمی‌گرداند.
func (r DB) TokensForUser(ctx context.Context, userID string) ([]string, error) {
	const op = "postgresnotification.TokensForUser"

	rows, err := r.conn.Query(ctx, `SELECT token FROM device_push_tokens WHERE user_id = $1`, userID)
	if err != nil {
		return nil, richerror.New(op).WithErr(err).WithMessage("خطا در خواندن توکن‌های کاربر")
	}
	defer rows.Close()

	var tokens []string
	for rows.Next() {
		var t string
		if err := rows.Scan(&t); err != nil {
			return nil, richerror.New(op).WithErr(err)
		}
		tokens = append(tokens, t)
	}
	return tokens, nil
}

// OptedInTokens توکن‌های همه‌ی کاربرانی که نوتیفیکیشن محتوایی را فعال کرده‌اند
// برمی‌گرداند (برای ارسال پیام همگانی از پنل ادمین).
func (r DB) OptedInTokens(ctx context.Context) ([]string, error) {
	const op = "postgresnotification.OptedInTokens"

	// LEFT JOIN عمداً: کاربری که هیچ‌وقت صفحه‌ی تنظیمات نوتیفیکیشن را باز
	// نکرده هیچ ردیفی در user_notification_settings ندارد، ولی طبق GetSettings
	// پیش‌فرضش «فعال» است — پس نبودن ردیف هم باید فعال حساب شود، نه حذف از لیست.
	const query = `
		SELECT dpt.token
		FROM device_push_tokens dpt
		LEFT JOIN user_notification_settings uns ON uns.user_id = dpt.user_id
		WHERE COALESCE(uns.content_notif_enabled, true) = true
	`
	rows, err := r.conn.Query(ctx, query)
	if err != nil {
		return nil, richerror.New(op).WithErr(err).WithMessage("خطا در خواندن توکن‌های مشترکین")
	}
	defer rows.Close()

	var tokens []string
	for rows.Next() {
		var t string
		if err := rows.Scan(&t); err != nil {
			return nil, richerror.New(op).WithErr(err)
		}
		tokens = append(tokens, t)
	}
	return tokens, nil
}

// Stats تعداد کاربرانی که هر کدام از دو نوع نوتیفیکیشن را فعال کرده‌اند برمی‌گرداند.
func (r DB) Stats(ctx context.Context) (dailyReminder, contentNotif, totalUsers int, err error) {
	const op = "postgresnotification.Stats"

	err = r.conn.QueryRow(ctx, `SELECT COUNT(*) FROM users`).Scan(&totalUsers)
	if err != nil {
		return 0, 0, 0, richerror.New(op).WithErr(err)
	}
	err = r.conn.QueryRow(ctx, `
		SELECT COUNT(*) FROM users u
		LEFT JOIN user_notification_settings uns ON uns.user_id = u.id
		WHERE COALESCE(uns.daily_reminder_enabled, true) = true
	`).Scan(&dailyReminder)
	if err != nil {
		return 0, 0, 0, richerror.New(op).WithErr(err)
	}
	err = r.conn.QueryRow(ctx, `
		SELECT COUNT(*) FROM users u
		LEFT JOIN user_notification_settings uns ON uns.user_id = u.id
		WHERE COALESCE(uns.content_notif_enabled, true) = true
	`).Scan(&contentNotif)
	if err != nil {
		return 0, 0, 0, richerror.New(op).WithErr(err)
	}
	return dailyReminder, contentNotif, totalUsers, nil
}

// SaveBroadcast یک پیام همگانی ارسال‌شده را برای تاریخچه ثبت می‌کند.
func (r DB) SaveBroadcast(ctx context.Context, title, body string, createdBy string, sentCount int) error {
	const op = "postgresnotification.SaveBroadcast"

	const query = `
		INSERT INTO admin_broadcasts (title, body, sent_count, created_by, created_at)
		VALUES ($1, $2, $3, NULLIF($4, '')::uuid, now())
	`
	_, err := r.conn.Exec(ctx, query, title, body, sentCount, createdBy)
	if err != nil {
		return richerror.New(op).WithErr(err).WithMessage("خطا در ذخیره تاریخچه پیام همگانی")
	}
	return nil
}

// ListBroadcasts آخرین پیام‌های همگانی ارسال‌شده را برمی‌گرداند.
func (r DB) ListBroadcasts(ctx context.Context, limit int) ([]Broadcast, error) {
	const op = "postgresnotification.ListBroadcasts"

	const query = `
		SELECT id::text, title, body, sent_count, created_at::text
		FROM admin_broadcasts ORDER BY created_at DESC LIMIT $1
	`
	rows, err := r.conn.Query(ctx, query, limit)
	if err != nil {
		return nil, richerror.New(op).WithErr(err).WithMessage("خطا در خواندن تاریخچه پیام‌های همگانی")
	}
	defer rows.Close()

	var list []Broadcast
	for rows.Next() {
		var b Broadcast
		if err := rows.Scan(&b.ID, &b.Title, &b.Body, &b.SentCount, &b.CreatedAt); err != nil {
			return nil, richerror.New(op).WithErr(err)
		}
		list = append(list, b)
	}
	return list, nil
}
