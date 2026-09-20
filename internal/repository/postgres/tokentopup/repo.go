package postgretokentopup

import (
	"context"
	"errors"

	"shadowing-backend/internal/pkg/richerror"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

// DB عیناً هم‌الگوی postgressubscription است — همان SKU/purchase-token pattern،
// فقط به‌جای گرنتِ روزِ اشتراک، توکن گرنت می‌کند.
type DB struct {
	conn *pgxpool.Pool
}

func New(conn *pgxpool.Pool) DB {
	return DB{conn: conn}
}

type Plan struct {
	ID         string `json:"id"`
	Name       string `json:"name"`
	Tokens     int    `json:"tokens"`
	PriceToman int    `json:"price_toman"`
	ProductID  string `json:"product_id"`
	CreatedAt  string `json:"created_at"`
}

// ListPlans همه‌ی طرح‌های تاپ‌آپ توکن را برمی‌گرداند.
func (r DB) ListPlans(ctx context.Context) ([]Plan, error) {
	const op = "postgretokentopup.ListPlans"

	rows, err := r.conn.Query(ctx, `SELECT id::text, name, tokens, price_toman, COALESCE(product_id, ''), created_at::text FROM token_topup_plans ORDER BY tokens`)
	if err != nil {
		return nil, richerror.New(op).WithErr(err).WithMessage("خطا در خواندن طرح‌های تاپ‌آپ")
	}
	defer rows.Close()

	var plans []Plan
	for rows.Next() {
		var p Plan
		if err := rows.Scan(&p.ID, &p.Name, &p.Tokens, &p.PriceToman, &p.ProductID, &p.CreatedAt); err != nil {
			return nil, richerror.New(op).WithErr(err)
		}
		plans = append(plans, p)
	}
	return plans, nil
}

// GetPlanByProductID پلنی که با یک SKU مشخص از کافه‌بازار مرتبط شده را
// برمی‌گرداند — برای اعتبارسنجی خرید Poolakey استفاده می‌شود.
func (r DB) GetPlanByProductID(ctx context.Context, productID string) (Plan, error) {
	const op = "postgretokentopup.GetPlanByProductID"

	const query = `SELECT id::text, name, tokens, price_toman, COALESCE(product_id, ''), created_at::text
		FROM token_topup_plans WHERE product_id = $1`

	var p Plan
	err := r.conn.QueryRow(ctx, query, productID).Scan(
		&p.ID, &p.Name, &p.Tokens, &p.PriceToman, &p.ProductID, &p.CreatedAt,
	)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return Plan{}, richerror.New(op).
				WithMessage("طرح تاپ‌آپ برای این محصول پیدا نشد").
				WithKind(richerror.KindNotFound)
		}
		return Plan{}, richerror.New(op).WithErr(err)
	}
	return p, nil
}

// CreatePlan یک طرحِ تاپ‌آپِ جدید می‌سازد.
func (r DB) CreatePlan(ctx context.Context, name string, tokens, priceToman int, productID string) (Plan, error) {
	const op = "postgretokentopup.CreatePlan"

	const query = `
		INSERT INTO token_topup_plans (name, tokens, price_toman, product_id)
		VALUES ($1, $2, $3, NULLIF($4, ''))
		RETURNING id::text, name, tokens, price_toman, COALESCE(product_id, ''), created_at::text
	`
	var p Plan
	err := r.conn.QueryRow(ctx, query, name, tokens, priceToman, productID).Scan(
		&p.ID, &p.Name, &p.Tokens, &p.PriceToman, &p.ProductID, &p.CreatedAt,
	)
	if err != nil {
		return Plan{}, richerror.New(op).WithErr(err).WithMessage("خطا در ساخت طرح تاپ‌آپ")
	}
	return p, nil
}

// DeletePlan یک طرح تاپ‌آپ را حذف می‌کند.
func (r DB) DeletePlan(ctx context.Context, id string) error {
	const op = "postgretokentopup.DeletePlan"

	if _, err := r.conn.Exec(ctx, `DELETE FROM token_topup_plans WHERE id = $1`, id); err != nil {
		return richerror.New(op).WithErr(err).WithMessage("خطا در حذف طرح تاپ‌آپ")
	}
	return nil
}

// PurchaseTokenUsed می‌گوید آیا این purchaseToken قبلاً verify و توکن برایش
// گرنت شده — جلوی اعمال دوباره‌ی یک خرید کافه‌بازاری را می‌گیرد (idempotency).
func (r DB) PurchaseTokenUsed(ctx context.Context, purchaseToken string) (bool, error) {
	const op = "postgretokentopup.PurchaseTokenUsed"

	var exists bool
	err := r.conn.QueryRow(ctx, `SELECT EXISTS(SELECT 1 FROM token_topup_purchases WHERE purchase_token = $1)`, purchaseToken).Scan(&exists)
	if err != nil {
		return false, richerror.New(op).WithErr(err).WithMessage("خطا در بررسی خرید")
	}
	return exists, nil
}

// RecordPurchase یک خریدِ تاییدشده را ثبت می‌کند — برای idempotency و ممیزی.
// گرنتِ واقعیِ اعتبار (aiaccessservice.AddCredit) جدا و بعد از این صدا زده می‌شود.
func (r DB) RecordPurchase(ctx context.Context, userID, planID string, tokens, priceToman int, provider, purchaseToken string) error {
	const op = "postgretokentopup.RecordPurchase"

	const query = `
		INSERT INTO token_topup_purchases (user_id, plan_id, tokens, price_toman, provider, purchase_token)
		VALUES ($1, $2, $3, $4, NULLIF($5, ''), NULLIF($6, ''))
	`
	if _, err := r.conn.Exec(ctx, query, userID, planID, tokens, priceToman, provider, purchaseToken); err != nil {
		return richerror.New(op).WithErr(err).WithMessage("خطا در ثبت خرید تاپ‌آپ")
	}
	return nil
}
