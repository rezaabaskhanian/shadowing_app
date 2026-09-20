package postgresaiaccess

import (
	"context"
	"time"

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

// AddAndGetTotal مصرفِ جدید را به مجموعِ همان کاربر-روز اضافه می‌کند و مجموعِ
// توکنِ به‌روزشده (ورودی+خروجی) را برمی‌گرداند — یک UPSERT اتمیک، تا دو
// درخواستِ هم‌زمانِ یک کاربر (مثلاً converse و grammar check یک turn) مصرفِ
// همدیگر را rewrite نکنند.
func (r DB) AddAndGetTotal(ctx context.Context, userID string, day time.Time, inputTokens, outputTokens int) (int, error) {
	const op = "postgresaiaccess.AddAndGetTotal"

	const query = `
		INSERT INTO ai_daily_usage (user_id, usage_date, input_tokens, output_tokens)
		VALUES ($1, $2, $3, $4)
		ON CONFLICT (user_id, usage_date)
		DO UPDATE SET input_tokens = ai_daily_usage.input_tokens + EXCLUDED.input_tokens,
		              output_tokens = ai_daily_usage.output_tokens + EXCLUDED.output_tokens
		RETURNING input_tokens + output_tokens
	`
	var total int
	if err := r.conn.QueryRow(ctx, query, userID, day, inputTokens, outputTokens).Scan(&total); err != nil {
		return 0, richerror.New(op).WithErr(err).WithMessage("failed to record AI usage")
	}
	return total, nil
}

// GetUsage توکنِ ورودی/خروجیِ مصرف‌شده‌ی یک کاربر در یک روزِ مشخص را
// برمی‌گرداند (صفر/صفر اگر هنوز ردیفی برای آن روز نباشد).
func (r DB) GetUsage(ctx context.Context, userID string, day time.Time) (inputTokens, outputTokens int, err error) {
	const op = "postgresaiaccess.GetUsage"

	const query = `SELECT input_tokens, output_tokens FROM ai_daily_usage WHERE user_id = $1 AND usage_date = $2`
	err = r.conn.QueryRow(ctx, query, userID, day).Scan(&inputTokens, &outputTokens)
	if err != nil {
		if err == pgx.ErrNoRows {
			return 0, 0, nil
		}
		return 0, 0, richerror.New(op).WithErr(err).WithMessage("failed to read AI usage")
	}
	return inputTokens, outputTokens, nil
}

// DailyUsage - جمعِ توکنِ همه‌ی کاربرها در یک روز (برای گزارشِ هزینه‌ی ادمین).
type DailyUsage struct {
	Date         string `json:"date"`
	InputTokens  int    `json:"input_tokens"`
	OutputTokens int    `json:"output_tokens"`
}

// UsageStats - عیناً هم‌الگوی postgressubscription.RevenueStats: مجموعِ کل،
// مجموعِ بازه‌ی days روز اخیر، و شکستِ روزانه‌ی همان بازه.
type UsageStats struct {
	TotalInputTokens   int
	TotalOutputTokens  int
	PeriodInputTokens  int
	PeriodOutputTokens int
	Daily              []DailyUsage
}

// Stats آمارِ مصرفِ توکنِ همه‌ی کاربرها را حساب می‌کند — برای گزارشِ هزینه‌ی
// واقعی در پنل ادمین (نگاه کنید به aiaccessservice.Report).
func (r DB) Stats(ctx context.Context, days int) (UsageStats, error) {
	const op = "postgresaiaccess.Stats"
	var stats UsageStats

	err := r.conn.QueryRow(ctx, `
		SELECT COALESCE(SUM(input_tokens), 0), COALESCE(SUM(output_tokens), 0) FROM ai_daily_usage
	`).Scan(&stats.TotalInputTokens, &stats.TotalOutputTokens)
	if err != nil {
		return stats, richerror.New(op).WithErr(err).WithMessage("خطا در محاسبه‌ی مصرف کل")
	}

	err = r.conn.QueryRow(ctx, `
		SELECT COALESCE(SUM(input_tokens), 0), COALESCE(SUM(output_tokens), 0) FROM ai_daily_usage
		WHERE usage_date >= CURRENT_DATE - make_interval(days => $1)
	`, days).Scan(&stats.PeriodInputTokens, &stats.PeriodOutputTokens)
	if err != nil {
		return stats, richerror.New(op).WithErr(err).WithMessage("خطا در محاسبه‌ی مصرف دوره")
	}

	rows, err := r.conn.Query(ctx, `
		SELECT usage_date::text, COALESCE(SUM(input_tokens), 0), COALESCE(SUM(output_tokens), 0)
		FROM ai_daily_usage
		WHERE usage_date >= CURRENT_DATE - make_interval(days => $1)
		GROUP BY usage_date
		ORDER BY usage_date
	`, days)
	if err != nil {
		return stats, richerror.New(op).WithErr(err).WithMessage("خطا در محاسبه‌ی مصرف روزانه")
	}
	defer rows.Close()

	for rows.Next() {
		var d DailyUsage
		if err := rows.Scan(&d.Date, &d.InputTokens, &d.OutputTokens); err != nil {
			return stats, richerror.New(op).WithErr(err).WithMessage("خطا در خواندنِ مصرف روزانه")
		}
		stats.Daily = append(stats.Daily, d)
	}
	if err := rows.Err(); err != nil {
		return stats, richerror.New(op).WithErr(err).WithMessage("خطا در خواندنِ مصرف روزانه")
	}

	return stats, nil
}

// GetCredit موجودیِ اعتبارِ توکنِ خریداری‌شده‌ی یک کاربر را برمی‌گرداند (صفر
// اگر هیچ‌وقت چیزی نخریده). این اعتبار برخلافِ ai_daily_usage هرگز خودکار
// صفر نمی‌شود، فقط با خرید بالا و با مصرفِ فراتر از سقفِ رایگان پایین می‌رود.
func (r DB) GetCredit(ctx context.Context, userID string) (int, error) {
	const op = "postgresaiaccess.GetCredit"

	var balance int
	err := r.conn.QueryRow(ctx, `SELECT balance_tokens FROM ai_token_credits WHERE user_id = $1`, userID).Scan(&balance)
	if err != nil {
		if err == pgx.ErrNoRows {
			return 0, nil
		}
		return 0, richerror.New(op).WithErr(err).WithMessage("failed to read token credit")
	}
	return balance, nil
}

// AddCredit موجودیِ اعتبار را بعد از یک خریدِ تاییدشده بالا می‌برد (UPSERT اتمیک).
func (r DB) AddCredit(ctx context.Context, userID string, tokens int) (int, error) {
	const op = "postgresaiaccess.AddCredit"

	const query = `
		INSERT INTO ai_token_credits (user_id, balance_tokens)
		VALUES ($1, $2)
		ON CONFLICT (user_id) DO UPDATE SET balance_tokens = ai_token_credits.balance_tokens + EXCLUDED.balance_tokens
		RETURNING balance_tokens
	`
	var balance int
	if err := r.conn.QueryRow(ctx, query, userID, tokens).Scan(&balance); err != nil {
		return 0, richerror.New(op).WithErr(err).WithMessage("failed to add token credit")
	}
	return balance, nil
}

// DecrementCredit موجودیِ اعتبار را کم می‌کند، هیچ‌وقت زیرِ صفر نمی‌رود
// (GREATEST) — تا مصرفِ هم‌زمانِ چند call یک کاربر موجودی را منفی نکند.
func (r DB) DecrementCredit(ctx context.Context, userID string, tokens int) error {
	const op = "postgresaiaccess.DecrementCredit"

	const query = `
		INSERT INTO ai_token_credits (user_id, balance_tokens)
		VALUES ($1, 0)
		ON CONFLICT (user_id) DO UPDATE SET balance_tokens = GREATEST(ai_token_credits.balance_tokens - $2, 0)
	`
	if _, err := r.conn.Exec(ctx, query, userID, tokens); err != nil {
		return richerror.New(op).WithErr(err).WithMessage("failed to decrement token credit")
	}
	return nil
}
