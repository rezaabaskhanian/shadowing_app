// Package tokentopupservice خریدِ مصرفیِ توکن (نه اشتراک) را مدیریت می‌کند:
// وقتی کاربرِ مشترک به سقفِ رایگانِ روزانه‌اش می‌رسد و نمی‌خواهد تا فردا صبر
// کند، از داخل اپ یه بسته‌ی توکن می‌خرد که همان لحظه قابل‌استفاده می‌شود.
// عمداً از billingservice/subscriptionservice جدا نگه داشته شده چون منطقِ
// گرنتش فرق دارد (اعتبارِ ai_token_credits، نه روزِ اشتراک)، هرچند دقیقاً
// همان کلاینتِ Poolakey/Cafe Bazaar (ValidatePurchase) را دوباره استفاده
// می‌کند — آن endpoint از قبل برای خریدهای تک‌باره‌ی «inapp» است، نه اشتراک.
package tokentopupservice

import (
	"context"
	"fmt"

	billingservice "shadowing-backend/internal/service/billing"

	postgretokentopup "shadowing-backend/internal/repository/postgres/tokentopup"
)

// AccessGranter همان aiaccessservice.Service.AddCredit است؛ اینترفیسِ جدا تا
// این پکیج به کلِ aiaccessservice وابسته نشود.
type AccessGranter interface {
	AddCredit(ctx context.Context, userID string, tokens int) error
}

type repository interface {
	ListPlans(ctx context.Context) ([]postgretokentopup.Plan, error)
	GetPlanByProductID(ctx context.Context, productID string) (postgretokentopup.Plan, error)
	CreatePlan(ctx context.Context, name string, tokens, priceToman int, productID string) (postgretokentopup.Plan, error)
	DeletePlan(ctx context.Context, id string) error
	PurchaseTokenUsed(ctx context.Context, purchaseToken string) (bool, error)
	RecordPurchase(ctx context.Context, userID, planID string, tokens, priceToman int, provider, purchaseToken string) error
}

type Service struct {
	repo       repository
	cafebazaar *billingservice.CafeBazaarClient
	access     AccessGranter
}

func New(repo repository, cafebazaar *billingservice.CafeBazaarClient, access AccessGranter) Service {
	return Service{repo: repo, cafebazaar: cafebazaar, access: access}
}

// Enabled یعنی اتصال به کافه‌بازار پیکربندی شده — همان شرطِ billingservice،
// چون از همان کلاینت استفاده می‌کند.
func (s Service) Enabled() bool {
	return s.cafebazaar != nil && s.cafebazaar.Enabled()
}

func (s Service) ListPlans(ctx context.Context) ([]postgretokentopup.Plan, error) {
	return s.repo.ListPlans(ctx)
}

func (s Service) CreatePlan(ctx context.Context, name string, tokens, priceToman int, productID string) (postgretokentopup.Plan, error) {
	return s.repo.CreatePlan(ctx, name, tokens, priceToman, productID)
}

func (s Service) DeletePlan(ctx context.Context, id string) error {
	return s.repo.DeletePlan(ctx, id)
}

// VerifyAndGrant یک خریدِ کافه‌بازاریِ تاپ‌آپ را سمتِ سرور تایید و در صورتِ
// معتبربودن، توکنِ پلن را همان لحظه به اعتبارِ کاربر اضافه می‌کند (نه یک روزِ
// آینده، نه بعد از تاییدِ دستی). اگر این purchaseToken قبلاً verify شده باشد،
// بدون خطا موفق برمی‌گرداند (idempotent) — چون موبایل ممکن است به‌خاطرِ
// قطعیِ شبکه دوباره تلاش کند.
func (s Service) VerifyAndGrant(ctx context.Context, userID, productID, purchaseToken string) error {
	if !s.Enabled() {
		return fmt.Errorf("cafebazaar billing is not configured on the server")
	}
	if productID == "" || purchaseToken == "" {
		return fmt.Errorf("product_id و purchase_token الزامی‌اند")
	}

	plan, err := s.repo.GetPlanByProductID(ctx, productID)
	if err != nil {
		return fmt.Errorf("محصول ناشناخته: %s", productID)
	}

	used, err := s.repo.PurchaseTokenUsed(ctx, purchaseToken)
	if err != nil {
		return err
	}
	if used {
		return nil
	}

	if err := s.cafebazaar.ValidatePurchase(ctx, productID, purchaseToken); err != nil {
		return fmt.Errorf("تأیید خرید نزد کافه‌بازار ناموفق بود: %w", err)
	}

	if err := s.repo.RecordPurchase(ctx, userID, plan.ID, plan.Tokens, plan.PriceToman, "cafebazaar", purchaseToken); err != nil {
		return err
	}

	return s.access.AddCredit(ctx, userID, plan.Tokens)
}
