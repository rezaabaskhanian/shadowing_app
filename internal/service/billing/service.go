package billingservice

import (
	"context"
	"fmt"

	subscriptionservice "shadowing-backend/internal/service/subscription"
)

// PlanDurationDays مدت پلنی که خرید کافه‌بازاری برایش تعریف شده (پلن «یک
// ساله»‌ی از پیش موجود در subscription_plans).
const PlanDurationDays = 365

// discountTier یک پله‌ی قیمتی است: productID یک SKU مشخص در پنل کافه‌بازار
// است که باید دستی با همین قیمت (PriceToman) ساخته شود. minPoints یعنی این
// SKU برای کاربری معنی دارد که حداقل این‌قدر امتیاز داشته باشد؛ pointsRedeemed
// دقیقاً همان مقداری است که DiscountForPoints رویش اعمال شده تا PriceToman
// به دست بیاید — این دو باید همیشه هم‌خوان بمانند (تست‌شده در init پایین فایل).
//
// این جدول باید عیناً با app/src/data/subscriptionTiers.ts سمت موبایل یکی
// باشد؛ اگر یکی از این دو تغییر کرد باید دیگری هم دستی به‌روزرسانی شود.
type discountTier struct {
	ProductID      string
	MinPoints      int
	PointsRedeemed int
}

var discountTiers = []discountTier{
	{ProductID: "yearly_full", MinPoints: 0, PointsRedeemed: 0},
	{ProductID: "yearly_d100k", MinPoints: 500, PointsRedeemed: 500},
	{ProductID: "yearly_d200k", MinPoints: 1000, PointsRedeemed: 1000},
	{ProductID: "yearly_d400k", MinPoints: 2000, PointsRedeemed: 2000},
	{ProductID: "yearly_d600k", MinPoints: 3000, PointsRedeemed: 3000},
	{ProductID: "yearly_d900k", MinPoints: 4500, PointsRedeemed: 4500},
}

func tierByProductID(productID string) (discountTier, bool) {
	for _, t := range discountTiers {
		if t.ProductID == productID {
			return t, true
		}
	}
	return discountTier{}, false
}

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

// VerifyAndGrant یک خرید کافه‌بازاری را سمت سرور تأیید و در صورت معتبربودن
// اشتراک یک‌ساله را برای کاربر فعال می‌کند. اگر این purchaseToken قبلاً
// verify شده باشد، بدون خطا و بدون اعمال دوباره‌ی تخفیف، موفق برمی‌گرداند
// (idempotent) — چون موبایل ممکن است به‌خاطر قطعی شبکه دوباره تلاش کند.
func (s Service) VerifyAndGrant(ctx context.Context, userID, productID, purchaseToken string) error {
	if !s.Enabled() {
		return fmt.Errorf("cafebazaar billing is not configured on the server")
	}
	if productID == "" || purchaseToken == "" {
		return fmt.Errorf("product_id و purchase_token الزامی‌اند")
	}

	tier, ok := tierByProductID(productID)
	if !ok {
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

	plans, err := s.subscriptionSvc.ListPlans(ctx)
	if err != nil {
		return err
	}
	var yearlyPlan *subscriptionservice.Plan
	for i := range plans {
		if plans[i].DurationDays == PlanDurationDays {
			yearlyPlan = &plans[i]
			break
		}
	}
	if yearlyPlan == nil {
		return fmt.Errorf("پلن یک‌ساله در دیتابیس پیدا نشد")
	}

	return s.subscriptionSvc.Grant(ctx, userID, *yearlyPlan, tier.PointsRedeemed, "cafebazaar", purchaseToken)
}
