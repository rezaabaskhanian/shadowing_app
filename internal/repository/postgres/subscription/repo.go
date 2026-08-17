package postgressubscription

import (
	"context"

	"shadowing-backend/internal/pkg/richerror"

	"github.com/jackc/pgx/v5/pgxpool"
)

type DB struct {
	conn *pgxpool.Pool
}

func New(conn *pgxpool.Pool) DB {
	return DB{conn: conn}
}

type Plan struct {
	ID           string `json:"id"`
	Name         string `json:"name"`
	DurationDays int    `json:"duration_days"`
	PriceToman   int    `json:"price_toman"`
	CreatedAt    string `json:"created_at"`
}

// ListPlans همه‌ی طرح‌های اشتراک را برمی‌گرداند.
func (r DB) ListPlans(ctx context.Context) ([]Plan, error) {
	const op = "postgressubscription.ListPlans"

	rows, err := r.conn.Query(ctx, `SELECT id::text, name, duration_days, price_toman, created_at::text FROM subscription_plans ORDER BY duration_days`)
	if err != nil {
		return nil, richerror.New(op).WithErr(err).WithMessage("خطا در خواندن طرح‌های اشتراک")
	}
	defer rows.Close()

	var plans []Plan
	for rows.Next() {
		var p Plan
		if err := rows.Scan(&p.ID, &p.Name, &p.DurationDays, &p.PriceToman, &p.CreatedAt); err != nil {
			return nil, richerror.New(op).WithErr(err)
		}
		plans = append(plans, p)
	}
	return plans, nil
}

// CreatePlan یک طرح اشتراک جدید می‌سازد.
func (r DB) CreatePlan(ctx context.Context, name string, durationDays, priceToman int) (Plan, error) {
	const op = "postgressubscription.CreatePlan"

	const query = `
		INSERT INTO subscription_plans (name, duration_days, price_toman)
		VALUES ($1, $2, $3)
		RETURNING id::text, name, duration_days, price_toman, created_at::text
	`
	var p Plan
	err := r.conn.QueryRow(ctx, query, name, durationDays, priceToman).Scan(
		&p.ID, &p.Name, &p.DurationDays, &p.PriceToman, &p.CreatedAt,
	)
	if err != nil {
		return Plan{}, richerror.New(op).WithErr(err).WithMessage("خطا در ساخت طرح اشتراک")
	}
	return p, nil
}

// DeletePlan یک طرح اشتراک را حذف می‌کند.
func (r DB) DeletePlan(ctx context.Context, id string) error {
	const op = "postgressubscription.DeletePlan"

	if _, err := r.conn.Exec(ctx, `DELETE FROM subscription_plans WHERE id = $1`, id); err != nil {
		return richerror.New(op).WithErr(err).WithMessage("خطا در حذف طرح اشتراک")
	}
	return nil
}

// GrantSubscription یک اشتراک را برای کاربر فعال می‌کند؛ اگر پوینت ریدیم شود،
// از موجودی کاربر کم می‌شود. provider/purchaseToken وقتی از یک درگاه پرداخت
// واقعی (مثل کافه‌بازار) میان پر می‌شوند؛ برای گرنت دستی ادمین خالی می‌مانند.
func (r DB) GrantSubscription(ctx context.Context, userID, planID string, pointsRedeemed, discountToman, durationDays int, provider, purchaseToken string) error {
	const op = "postgressubscription.GrantSubscription"

	tx, err := r.conn.Begin(ctx)
	if err != nil {
		return richerror.New(op).WithErr(err)
	}
	defer tx.Rollback(ctx)

	const insertQuery = `
		INSERT INTO user_subscriptions (user_id, plan_id, points_redeemed, discount_toman, status, started_at, expires_at, provider, purchase_token)
		VALUES ($1, $2, $3, $4, 'active', now(), now() + make_interval(days => $5), NULLIF($6, ''), NULLIF($7, ''))
	`
	if _, err := tx.Exec(ctx, insertQuery, userID, planID, pointsRedeemed, discountToman, durationDays, provider, purchaseToken); err != nil {
		return richerror.New(op).WithErr(err).WithMessage("خطا در ثبت اشتراک")
	}

	if pointsRedeemed > 0 {
		if _, err := tx.Exec(ctx,
			`INSERT INTO point_transactions (user_id, delta, reason) VALUES ($1, $2, 'subscription_discount_redeemed')`,
			userID, -pointsRedeemed,
		); err != nil {
			return richerror.New(op).WithErr(err).WithMessage("خطا در ثبت تراکنش امتیاز")
		}
		if _, err := tx.Exec(ctx, `UPDATE users SET points = GREATEST(0, points - $2) WHERE id = $1`, userID, pointsRedeemed); err != nil {
			return richerror.New(op).WithErr(err).WithMessage("خطا در کسر موجودی امتیاز")
		}
	}

	if err := tx.Commit(ctx); err != nil {
		return richerror.New(op).WithErr(err)
	}
	return nil
}

// HasActiveSubscription می‌گوید آیا کاربر همین حالا اشتراک فعال و منقضی‌نشده
// دارد یا نه — مبنای قفل‌کردن/بازکردن صحنه‌های غیررایگان.
func (r DB) HasActiveSubscription(ctx context.Context, userID string) (bool, error) {
	const op = "postgressubscription.HasActiveSubscription"

	var exists bool
	err := r.conn.QueryRow(ctx, `
		SELECT EXISTS(
			SELECT 1 FROM user_subscriptions
			WHERE user_id = $1 AND status = 'active' AND expires_at > now()
		)
	`, userID).Scan(&exists)
	if err != nil {
		return false, richerror.New(op).WithErr(err).WithMessage("خطا در بررسی وضعیت اشتراک")
	}
	return exists, nil
}

// PurchaseTokenUsed می‌گوید آیا این purchaseToken قبلاً verify و اشتراک برایش
// ثبت شده — جلوی اعمال دوباره‌ی یک خرید کافه‌بازاری را می‌گیرد.
func (r DB) PurchaseTokenUsed(ctx context.Context, purchaseToken string) (bool, error) {
	const op = "postgressubscription.PurchaseTokenUsed"

	var exists bool
	err := r.conn.QueryRow(ctx, `
		SELECT EXISTS(SELECT 1 FROM user_subscriptions WHERE purchase_token = $1)
	`, purchaseToken).Scan(&exists)
	if err != nil {
		return false, richerror.New(op).WithErr(err).WithMessage("خطا در بررسی وضعیت خرید")
	}
	return exists, nil
}
