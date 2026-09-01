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
func (s Service) VerifyAndGrant(ctx context.Context, userID, productID, purchaseToken string) error {
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

	// خریدهای واقعی کافه‌بازاری دیگر تخفیف امتیازی ندارند — قیمت همان
	// price_toman پلن است (باید با قیمت واقعی SKU در پنل کافه‌بازار یکی باشد).
	return s.subscriptionSvc.Grant(ctx, userID, plan, 0, "cafebazaar", purchaseToken)
}
