package postgresappevent

import (
	"context"
	"time"

	"shadowing-backend/internal/pkg/richerror"

	"github.com/jackc/pgx/v5/pgxpool"
)

type DB struct {
	conn *pgxpool.Pool
}

func New(conn *pgxpool.Pool) DB {
	return DB{conn: conn}
}

// Event یک رویداد اعتبارسنجی‌شده که باید ذخیره شود (اعتبارسنجی در analyticsservice).
type Event struct {
	DeviceID   string
	UserID     string // خالی یعنی کاربر وارد نشده
	Event      string
	AppVersion string
	Screen     string
	Target     string
}

type DailyRow struct {
	Date          string
	Opens         int64
	ActiveDevices int64
	NewDevices    int64
	ActiveUsers   int64
}

type CohortRow struct {
	AppVersion string
	Devices    int64
	D1Eligible int64
	D1Retained int64
	D7Eligible int64
	D7Retained int64
}

type ScreenRow struct {
	Screen  string
	Views   int64
	Devices int64
}

type EventRow struct {
	Event   string
	Count   int64
	Devices int64
}

// FunnelRow برای هر قدم قیف: چند دستگاه از دستگاه‌های جدید این بازه به آن رسیدند.
type FunnelRow struct {
	Event   string
	Devices int64
}

// روزبندی همه‌ی آمار به وقت تهران است، نه UTC — «امروز» برای ادمین باید همان
// روزی باشد که کاربرها تجربه می‌کنند.
const tz = `'Asia/Tehran'`

// sinceDays شروع بازه‌ی `days` روز اخیر (شامل امروز) به وقت تهران؛ پارامتر $1.
const sinceDays = `(((NOW() AT TIME ZONE ` + tz + `)::date) - ($1::int - 1))::timestamp AT TIME ZONE ` + tz

func (d DB) Insert(ctx context.Context, e Event) error {
	const op = "postgresappevent.Insert"
	_, err := d.conn.Exec(ctx, `
		INSERT INTO app_events (device_id, user_id, event, app_version, screen, target)
		VALUES ($1, NULLIF($2, '')::uuid, $3, $4, NULLIF($5, ''), NULLIF($6, ''))`,
		e.DeviceID, e.UserID, e.Event, e.AppVersion, e.Screen, e.Target)
	if err != nil {
		return richerror.New(op).WithErr(err).WithMessage("failed to insert app event")
	}
	return nil
}

// Daily برای هر روز از `days` روز اخیر (شامل امروز) شمارش‌ها را برمی‌گرداند؛
// روزهای بی‌رویداد هم با صفر می‌آیند تا جدول سوراخ نداشته باشد.
func (d DB) Daily(ctx context.Context, days int) ([]DailyRow, error) {
	const op = "postgresappevent.Daily"
	rows, err := d.conn.Query(ctx, `
		WITH today AS (SELECT (NOW() AT TIME ZONE `+tz+`)::date AS d),
		ev AS (
			SELECT device_id, user_id, event, (created_at AT TIME ZONE `+tz+`)::date AS d
			FROM app_events
			WHERE created_at >= `+sinceDays+`
		),
		first_seen AS (
			SELECT device_id, MIN((created_at AT TIME ZONE `+tz+`)::date) AS d
			FROM app_events GROUP BY device_id
		)
		SELECT s.d,
			(SELECT COUNT(*) FROM ev WHERE ev.d = s.d AND ev.event = 'app_open'),
			(SELECT COUNT(DISTINCT device_id) FROM ev WHERE ev.d = s.d),
			(SELECT COUNT(*) FROM first_seen f WHERE f.d = s.d),
			(SELECT COUNT(DISTINCT user_id) FROM ev WHERE ev.d = s.d AND ev.user_id IS NOT NULL)
		FROM (
			SELECT generate_series((SELECT d FROM today) - ($1::int - 1), (SELECT d FROM today), '1 day')::date AS d
		) AS s
		ORDER BY s.d DESC`, days)
	if err != nil {
		return nil, richerror.New(op).WithErr(err).WithMessage("failed to query daily analytics")
	}
	defer rows.Close()

	out := make([]DailyRow, 0, days)
	for rows.Next() {
		var r DailyRow
		var day time.Time
		if err := rows.Scan(&day, &r.Opens, &r.ActiveDevices, &r.NewDevices, &r.ActiveUsers); err != nil {
			return nil, richerror.New(op).WithErr(err)
		}
		r.Date = day.Format("2006-01-02")
		out = append(out, r)
	}
	return out, rows.Err()
}

// Cohorts دستگاه‌هایی را که اولین بار در `days` روز اخیر دیده شده‌اند به تفکیک
// نسخه‌ی اپِ اولین رویداد گروه می‌کند و ماندگاری روز ۱ و ۷ را می‌شمارد (هر
// رویدادی در آن روز = برگشته). هر کوهورت فقط وقتی در مخرج D1/D7 حساب می‌شود
// که آن روزش واقعاً رسیده باشد.
func (d DB) Cohorts(ctx context.Context, days int) ([]CohortRow, error) {
	const op = "postgresappevent.Cohorts"
	rows, err := d.conn.Query(ctx, `
		WITH today AS (SELECT (NOW() AT TIME ZONE `+tz+`)::date AS d),
		first_seen AS (
			SELECT DISTINCT ON (device_id)
				device_id, (created_at AT TIME ZONE `+tz+`)::date AS d, app_version
			FROM app_events
			ORDER BY device_id, created_at
		),
		cohort AS (
			SELECT f.device_id, f.d, f.app_version,
				EXISTS (
					SELECT 1 FROM app_events e
					WHERE e.device_id = f.device_id
						AND e.created_at >= (f.d + 1)::timestamp AT TIME ZONE `+tz+`
						AND e.created_at < (f.d + 2)::timestamp AT TIME ZONE `+tz+`
				) AS ret1,
				EXISTS (
					SELECT 1 FROM app_events e
					WHERE e.device_id = f.device_id
						AND e.created_at >= (f.d + 7)::timestamp AT TIME ZONE `+tz+`
						AND e.created_at < (f.d + 8)::timestamp AT TIME ZONE `+tz+`
				) AS ret7
			FROM first_seen f
			WHERE f.d > (SELECT d FROM today) - $1::int
		)
		SELECT app_version,
			COUNT(*),
			COUNT(*) FILTER (WHERE d <= (SELECT d FROM today) - 1),
			COUNT(*) FILTER (WHERE d <= (SELECT d FROM today) - 1 AND ret1),
			COUNT(*) FILTER (WHERE d <= (SELECT d FROM today) - 7),
			COUNT(*) FILTER (WHERE d <= (SELECT d FROM today) - 7 AND ret7)
		FROM cohort
		GROUP BY app_version
		ORDER BY app_version DESC`, days)
	if err != nil {
		return nil, richerror.New(op).WithErr(err).WithMessage("failed to query cohorts")
	}
	defer rows.Close()

	out := make([]CohortRow, 0)
	for rows.Next() {
		var r CohortRow
		if err := rows.Scan(&r.AppVersion, &r.Devices, &r.D1Eligible, &r.D1Retained, &r.D7Eligible, &r.D7Retained); err != nil {
			return nil, richerror.New(op).WithErr(err)
		}
		out = append(out, r)
	}
	return out, rows.Err()
}

// Screens بازدید هر صفحه‌ی اپ در `days` روز اخیر، پربازدیدترین اول.
func (d DB) Screens(ctx context.Context, days int) ([]ScreenRow, error) {
	const op = "postgresappevent.Screens"
	rows, err := d.conn.Query(ctx, `
		SELECT screen, COUNT(*), COUNT(DISTINCT device_id)
		FROM app_events
		WHERE event = 'screen_view' AND screen IS NOT NULL AND created_at >= `+sinceDays+`
		GROUP BY screen
		ORDER BY 2 DESC`, days)
	if err != nil {
		return nil, richerror.New(op).WithErr(err).WithMessage("failed to query screens")
	}
	defer rows.Close()

	out := make([]ScreenRow, 0)
	for rows.Next() {
		var r ScreenRow
		if err := rows.Scan(&r.Screen, &r.Views, &r.Devices); err != nil {
			return nil, richerror.New(op).WithErr(err)
		}
		out = append(out, r)
	}
	return out, rows.Err()
}

// Events شمارش رویدادهای «کاری» (غیر از باز شدن اپ و دیدن صفحه) در `days` روز اخیر.
func (d DB) Events(ctx context.Context, days int) ([]EventRow, error) {
	const op = "postgresappevent.Events"
	rows, err := d.conn.Query(ctx, `
		SELECT event, COUNT(*), COUNT(DISTINCT device_id)
		FROM app_events
		WHERE event NOT IN ('app_open', 'screen_view') AND created_at >= `+sinceDays+`
		GROUP BY event
		ORDER BY 2 DESC`, days)
	if err != nil {
		return nil, richerror.New(op).WithErr(err).WithMessage("failed to query events")
	}
	defer rows.Close()

	out := make([]EventRow, 0)
	for rows.Next() {
		var r EventRow
		if err := rows.Scan(&r.Event, &r.Count, &r.Devices); err != nil {
			return nil, richerror.New(op).WithErr(err)
		}
		out = append(out, r)
	}
	return out, rows.Err()
}

// Funnel از دستگاه‌هایی که اولین بار در `days` روز اخیر دیده شده‌اند، می‌شمارد
// چندتا (تا امروز) به هر کدام از رویدادهای `steps` رسیده‌اند. قدم‌ها مستقل
// شمرده می‌شوند (ترتیب اجباری نیست) — برای دیدن «کجا ریزش داریم» کافی است.
func (d DB) Funnel(ctx context.Context, days int, steps []string) ([]FunnelRow, error) {
	const op = "postgresappevent.Funnel"
	rows, err := d.conn.Query(ctx, `
		WITH new_devices AS (
			SELECT device_id
			FROM app_events
			GROUP BY device_id
			HAVING MIN(created_at) >= `+sinceDays+`
		)
		SELECT s.event,
			(SELECT COUNT(DISTINCT e.device_id)
			 FROM app_events e JOIN new_devices n ON n.device_id = e.device_id
			 WHERE e.event = s.event)
		FROM unnest($2::text[]) WITH ORDINALITY AS s(event, ord)
		ORDER BY s.ord`, days, steps)
	if err != nil {
		return nil, richerror.New(op).WithErr(err).WithMessage("failed to query funnel")
	}
	defer rows.Close()

	out := make([]FunnelRow, 0, len(steps))
	for rows.Next() {
		var r FunnelRow
		if err := rows.Scan(&r.Event, &r.Devices); err != nil {
			return nil, richerror.New(op).WithErr(err)
		}
		out = append(out, r)
	}
	return out, rows.Err()
}
