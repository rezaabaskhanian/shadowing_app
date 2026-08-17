package postgresactivity

import (
	"context"
	"time"

	"shadowing-backend/internal/pkg/richerror"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
)

type ActivityRepository struct {
	db *pgxpool.Pool
}

func New(db *pgxpool.Pool) *ActivityRepository {
	return &ActivityRepository{db: db}
}

// DayActivity - فعالیت یک روز (دقیقه/تعداد جلسه)
type DayActivity struct {
	Date     string
	Minutes  int
	Sessions int
}

// WeeklyActivity فعالیت ۷ روز اخیر کاربر (امروز و ۶ روز قبل) را از دو منبع
// رویداد موجود تجمیع می‌کند: ضبط‌های شدوئینگ (shadowing_recordings) و
// جلسات تمرین عادت زبانی (habit_practice_sessions). هیچ جدول تاریخچه‌ی
// جدیدی لازم نیست؛ روزهای بدون فعالیت هم با صفر برمی‌گردند تا نمودار پیوسته
// باشد.
func (r *ActivityRepository) WeeklyActivity(ctx context.Context, userID uuid.UUID) ([]DayActivity, error) {
	const op = "postgres.ActivityRepository.WeeklyActivity"

	query := `
		WITH days AS (
			SELECT generate_series(current_date - interval '6 days', current_date, interval '1 day')::date AS day
		),
		activity AS (
			SELECT date_trunc('day', created_at)::date AS day, duration AS seconds
			FROM shadowing_recordings
			WHERE user_id = $1 AND created_at >= current_date - interval '6 days'
			UNION ALL
			SELECT date_trunc('day', completed_at)::date AS day, duration_seconds AS seconds
			FROM habit_practice_sessions
			WHERE user_id = $1 AND completed_at >= current_date - interval '6 days'
		)
		SELECT days.day, COALESCE(SUM(activity.seconds), 0), COUNT(activity.seconds)
		FROM days
		LEFT JOIN activity ON activity.day = days.day
		GROUP BY days.day
		ORDER BY days.day`

	rows, err := r.db.Query(ctx, query, userID)
	if err != nil {
		return nil, richerror.New(op).WithErr(err)
	}
	defer rows.Close()

	var result []DayActivity
	for rows.Next() {
		var day time.Time
		var totalSeconds, sessions int
		if err := rows.Scan(&day, &totalSeconds, &sessions); err != nil {
			return nil, richerror.New(op).WithErr(err)
		}
		result = append(result, DayActivity{
			Date:     day.Format("2006-01-02"),
			Minutes:  totalSeconds / 60,
			Sessions: sessions,
		})
	}

	return result, nil
}
