package billingservice

import (
	"context"
	"fmt"

	subscriptionservice "shadowing-backend/internal/service/subscription"
)

type Service struct {
	cafebazaar      *CafeBazaarClient
	subscriptionSvc subscriptionservice.Service
}

func New(cafebazaar *CafeBazaarClient, subscriptionSvc subscriptionservice.Service) Service {
	return Service{cafebazaar: cafebazaar, subscriptionSvc: subscriptionSvc}
}

// Enabled یعنی اتصال به کافه‌بازار پیکربندی شده (env سرور پر شده).
func (s Service) Enabled() bool {
	return s.cafebazaar != nil && s.cafebazaar.Enabled()
}

// VerifyAndGrant یک خرید کافه‌بازاری را سمت سرور تأیید و در صورت معتبربودن،
// پلنی که productID به آن مرتبط شده (subscription_plans.product_id، قابل
// تغییر از پنل ادمین) را برای کاربر فعال می‌کند. اگر این purchaseToken قبلاً
// verify شده باشد، بدون خطا موفق برمی‌گرداند (idempotent) — چون موبایل ممکن
// است به‌خاطر قطعی شبکه دوباره تلاش کند.
//
// pointsToRedeem اختیاری است — امتیازی که کاربر می‌خواهد در ازای روز اضافه
// روی مدت اشتراک خرج کند (نه تخفیف نقدی؛ توضیحش در GrantWithBonusDays است).
func (s Service) VerifyAndGrant(ctx context.Context, userID, productID, purchaseToken string, pointsToRedeem int) error {
	if !s.Enabled() {
		return fmt.Errorf("cafebazaar billing is not configured on the server")
	}
	if productID == "" || purchaseToken == "" {
		return fmt.Errorf("product_id و purchase_token الزامی‌اند")
	}

	plan, err := s.subscriptionSvc.GetPlanByProductID(ctx, productID)
	if err != nil {
		return fmt.Errorf("محصول ناشناخته: %s", productID)
	}

	used, err := s.subscriptionSvc.PurchaseTokenUsed(ctx, purchaseToken)
	if err != nil {
		return err
	}
	if used {
		// قبلاً verify و ثبت شده — دوباره اعمال نمی‌کنیم، ولی خطا هم نمی‌دهیم.
		return nil
	}

	if err := s.cafebazaar.ValidatePurchase(ctx, productID, purchaseToken); err != nil {
		return fmt.Errorf("تأیید خرید نزد کافه‌بازار ناموفق بود: %w", err)
	}

	// قیمت خرید واقعی کافه‌بازاری از قبل نزد خودِ کافه‌بازار نهایی شده (همان
	// price_toman پلن، که باید با قیمت واقعی SKU یکی باشد) و قابل تخفیف نیست؛
	// امتیاز درخواستی به‌جای تخفیف نقدی، به روز اضافه تبدیل می‌شود.
	return s.subscriptionSvc.GrantWithBonusDays(ctx, userID, plan, pointsToRedeem, "cafebazaar", purchaseToken)
}
