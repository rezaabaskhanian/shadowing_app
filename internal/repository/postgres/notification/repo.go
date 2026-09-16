package postgresnotification

import (
	"context"

	"shadowing-backend/internal/pkg/richerror"

	"github.com/google/uuid"
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
	UserID                string   `json:"-"`
	DailyReminderEnabled  bool     `json:"daily_reminder_enabled"`
	DailyReminderTimes    []string `json:"daily_reminder_times"`
	ContentNotifEnabled   bool     `json:"content_notif_enabled"`
	ContentSource         string   `json:"content_source"`
	StreakReminderEnabled bool     `json:"streak_reminder_enabled"`
	VocabReminderEnabled  bool     `json:"vocab_reminder_enabled"`
	LearningGoal          string   `json:"learning_goal"`
	WeeklyDigestEnabled   bool     `json:"weekly_digest_enabled"`
}

type Broadcast struct {
	ID        string `json:"id"`
	Title     string `json:"title"`
	Body      string `json:"body"`
	SentCount int    `json:"sent_count"`
	CreatedAt string `json:"created_at"`
}

// GetSettings تنظیمات نوتیفیکیشن کاربر را برمی‌گرداند؛ اگر هنوز ردیفی ثبت نشده
// باشد، مقادیر پیش‌فرض (هر دو خاموش، بدون ساعت) را برمی‌گرداند — کاربر باید
// خودش نوتیفیکیشن را روشن کند و ساعت‌هایش را انتخاب کند.
func (r DB) GetSettings(ctx context.Context, userID string) (Settings, error) {
	const op = "postgresnotification.GetSettings"

	const query = `
		SELECT daily_reminder_enabled, daily_reminder_times, content_notif_enabled, content_source, streak_reminder_enabled, vocab_reminder_enabled, learning_goal, weekly_digest_enabled
		FROM user_notification_settings WHERE user_id = $1
	`
	s := Settings{
		UserID:                userID,
		DailyReminderEnabled:  false,
		DailyReminderTimes:    []string{},
		ContentNotifEnabled:   false,
		ContentSource:         "mixed",
		StreakReminderEnabled: false,
		VocabReminderEnabled:  false,
		LearningGoal:          "",
		WeeklyDigestEnabled:   false,
	}
	err := r.conn.QueryRow(ctx, query, userID).Scan(
		&s.DailyReminderEnabled, &s.DailyReminderTimes, &s.ContentNotifEnabled, &s.ContentSource, &s.StreakReminderEnabled, &s.VocabReminderEnabled, &s.LearningGoal, &s.WeeklyDigestEnabled,
	)
	if err != nil {
		if err == pgx.ErrNoRows {
			return s, nil
		}
		return Settings{}, richerror.New(op).WithErr(err).WithMessage("خطا در خواندن تنظیمات نوتیفیکیشن")
	}
	if s.DailyReminderTimes == nil {
		s.DailyReminderTimes = []string{}
	}
	return s, nil
}

// UpsertSettings تنظیمات نوتیفیکیشن کاربر را درج/به‌روزرسانی می‌کند.
func (r DB) UpsertSettings(ctx context.Context, s Settings) error {
	const op = "postgresnotification.UpsertSettings"

	const query = `
		INSERT INTO user_notification_settings
			(user_id, daily_reminder_enabled, daily_reminder_times, content_notif_enabled, content_source, streak_reminder_enabled, vocab_reminder_enabled, learning_goal, weekly_digest_enabled, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, now())
		ON CONFLICT (user_id) DO UPDATE SET
			daily_reminder_enabled  = EXCLUDED.daily_reminder_enabled,
			daily_reminder_times    = EXCLUDED.daily_reminder_times,
			content_notif_enabled   = EXCLUDED.content_notif_enabled,
			content_source          = EXCLUDED.content_source,
			streak_reminder_enabled = EXCLUDED.streak_reminder_enabled,
			vocab_reminder_enabled  = EXCLUDED.vocab_reminder_enabled,
			learning_goal           = EXCLUDED.learning_goal,
			weekly_digest_enabled   = EXCLUDED.weekly_digest_enabled,
			updated_at              = now()
	`
	times := s.DailyReminderTimes
	if times == nil {
		times = []string{}
	}
	_, err := r.conn.Exec(ctx, query, s.UserID, s.DailyReminderEnabled, times, s.ContentNotifEnabled, s.ContentSource, s.StreakReminderEnabled, s.VocabReminderEnabled, s.LearningGoal, s.WeeklyDigestEnabled)
	if err != nil {
		return richerror.New(op).WithErr(err).WithMessage("خطا در ذخیره تنظیمات نوتیفیکیشن")
	}
	return nil
}

// GetLearningGoal فقط هدف یادگیریِ کاربر را برمی‌گرداند (بدون بقیه‌ی
// تنظیمات نوتیفیکیشن) — برای missionservice که فقط همین یک فیلد را برای
// اولویت‌دهیِ نرم به انتخاب صحنه لازم دارد. اگر کاربر هنوز ردیفی نساخته یا
// هدفی انتخاب نکرده، رشته‌ی خالی برمی‌گردد.
func (r DB) GetLearningGoal(ctx context.Context, userID string) (string, error) {
	const op = "postgresnotification.GetLearningGoal"

	var goal string
	err := r.conn.QueryRow(ctx, `SELECT learning_goal FROM user_notification_settings WHERE user_id = $1`, userID).Scan(&goal)
	if err != nil {
		if err == pgx.ErrNoRows {
			return "", nil
		}
		return "", richerror.New(op).WithErr(err).WithMessage("خطا در خواندن هدف یادگیری")
	}
	return goal, nil
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

	// JOIN معمولی (نه LEFT): پیش‌فرض نوتیفیکیشن خاموش است، پس فقط کاربری که
	// خودش ردیف تنظیمات ساخته و content_notif_enabled را روشن کرده باید پیام
	// همگانی بگیرد؛ نبودن ردیف یعنی رضایت نداده.
	const query = `
		SELECT dpt.token
		FROM device_push_tokens dpt
		JOIN user_notification_settings uns ON uns.user_id = dpt.user_id
		WHERE uns.content_notif_enabled = true
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

// StreakReminderTokens توکن‌های کاربرانی را برمی‌گرداند که: یادآوری استریک را
// روشن کرده‌اند، استریک فعالی دارند، و آخرین تمرینشان دقیقاً «دیروز» بوده —
// یعنی امروز هنوز تمرین نکرده‌اند ولی هنوز هم فرصت دارند (استریک هنوز نشکسته).
// کسانی که امروز تمرین کرده‌اند یا استریکشان از قبل شکسته/صفر است، اینجا
// نمی‌آیند.
func (r DB) StreakReminderTokens(ctx context.Context) ([]string, error) {
	const op = "postgresnotification.StreakReminderTokens"

	const query = `
		SELECT DISTINCT dpt.token
		FROM streaks s
		JOIN user_notification_settings uns ON uns.user_id = s.user_id
		JOIN device_push_tokens dpt ON dpt.user_id = s.user_id
		WHERE uns.streak_reminder_enabled = true
		  AND s.status = 'active'
		  AND s.current > 0
		  AND s.last_date::date = (CURRENT_DATE - 1)
	`
	rows, err := r.conn.Query(ctx, query)
	if err != nil {
		return nil, richerror.New(op).WithErr(err).WithMessage("خطا در خواندن توکن‌های یادآوری استریک")
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

// VocabReminderTokens توکن‌های کاربرانی را برمی‌گرداند که یادآوری واژگان را
// روشن کرده‌اند و حداقل یک کلمه در جعبه‌ی لایتنرشان سررسیده شده (next_review
// گذشته). کاربری که جعبه‌اش خالی است یا هیچ کلمه‌ی سررسیده‌ای ندارد، اینجا
// نمی‌آید — این یادآوری فقط وقتی واقعاً کاری برای انجام‌دادن هست فرستاده می‌شود.
func (r DB) VocabReminderTokens(ctx context.Context) ([]string, error) {
	const op = "postgresnotification.VocabReminderTokens"

	const query = `
		SELECT DISTINCT dpt.token
		FROM leitner_words lw
		JOIN user_notification_settings uns ON uns.user_id = lw.user_id
		JOIN device_push_tokens dpt ON dpt.user_id = lw.user_id
		WHERE uns.vocab_reminder_enabled = true
		  AND lw.next_review <= now()
	`
	rows, err := r.conn.Query(ctx, query)
	if err != nil {
		return nil, richerror.New(op).WithErr(err).WithMessage("خطا در خواندن توکن‌های یادآوری واژگان")
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

// WeeklyDigestOptedInUserIDs شناسه‌ی کاربرانی را برمی‌گرداند که پوش هفتگی را
// روشن کرده‌اند و حداقل یک توکن دستگاه دارند — بدون توکن، محاسبه‌ی گزارش
// برای آن کاربر بی‌فایده است. برخلاف StreakReminderTokens/VocabReminderTokens
// (یک پیامِ ثابت برای همه)، پیامِ این گزارش شخصی‌سازی‌شده است، پس اینجا فقط
// شناسه‌ی کاربر برمی‌گردد؛ توکن‌های هرکدام جداگانه با TokensForUser خوانده می‌شود.
func (r DB) WeeklyDigestOptedInUserIDs(ctx context.Context) ([]uuid.UUID, error) {
	const op = "postgresnotification.WeeklyDigestOptedInUserIDs"

	const query = `
		SELECT DISTINCT uns.user_id
		FROM user_notification_settings uns
		JOIN device_push_tokens dpt ON dpt.user_id = uns.user_id
		WHERE uns.weekly_digest_enabled = true
	`
	rows, err := r.conn.Query(ctx, query)
	if err != nil {
		return nil, richerror.New(op).WithErr(err).WithMessage("خطا در خواندن مشترکین گزارش هفتگی")
	}
	defer rows.Close()

	var ids []uuid.UUID
	for rows.Next() {
		var id uuid.UUID
		if err := rows.Scan(&id); err != nil {
			return nil, richerror.New(op).WithErr(err)
		}
		ids = append(ids, id)
	}
	return ids, nil
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
		JOIN user_notification_settings uns ON uns.user_id = u.id
		WHERE uns.daily_reminder_enabled = true
	`).Scan(&dailyReminder)
	if err != nil {
		return 0, 0, 0, richerror.New(op).WithErr(err)
	}
	err = r.conn.QueryRow(ctx, `
		SELECT COUNT(*) FROM users u
		JOIN user_notification_settings uns ON uns.user_id = u.id
		WHERE uns.content_notif_enabled = true
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
