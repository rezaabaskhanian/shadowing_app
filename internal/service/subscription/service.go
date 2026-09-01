package subscriptionservice

import (
	"context"

	postgressubscription "shadowing-backend/internal/repository/postgres/subscription"
)

// PointsPerDiscountUnit و DiscountTomanPerUnit نرخ تبدیل امتیاز به تخفیف
// اشتراک را مشخص می‌کنند: هر ۱۰۰ امتیاز، ۲۰,۰۰۰ تومان تخفیف.
const (
	PointsPerDiscountUnit = 100
	DiscountTomanPerUnit  = 20000
)

// DiscountForPoints مبلغ تخفیف (تومان) قابل استفاده برای تعداد امتیاز داده‌شده
// را حساب می‌کند (باقیمانده‌ی غیرقابل‌تبدیل نادیده گرفته می‌شود).
func DiscountForPoints(points int) int {
	units := points / PointsPerDiscountUnit
	return units * DiscountTomanPerUnit
}

type repository interface {
	ListPlans(ctx context.Context) ([]postgressubscription.Plan, error)
	CreatePlan(ctx context.Context, name string, durationDays, priceToman int, productID string) (postgressubscription.Plan, error)
	GetPlanByProductID(ctx context.Context, productID string) (postgressubscription.Plan, error)
	DeletePlan(ctx context.Context, id string) error
	GrantSubscription(ctx context.Context, userID, planID string, pointsRedeemed, discountToman, durationDays int, provider, purchaseToken string) error
	HasActiveSubscription(ctx context.Context, userID string) (bool, error)
	PurchaseTokenUsed(ctx context.Context, purchaseToken string) (bool, error)
	RevenueStats(ctx context.Context, days int) (postgressubscription.RevenueStats, error)
}

type Service struct {
	repo repository
}

func New(repo repository) Service {
	return Service{repo: repo}
}

type Plan = postgressubscription.Plan

func (s Service) ListPlans(ctx context.Context) ([]Plan, error) {
	return s.repo.ListPlans(ctx)
}

func (s Service) CreatePlan(ctx context.Context, name string, durationDays, priceToman int, productID string) (Plan, error) {
	return s.repo.CreatePlan(ctx, name, durationDays, priceToman, productID)
}

// GetPlanByProductID پلن متناظر یک SKU کافه‌بازار را برمی‌گرداند — برای
// اعتبارسنجی خرید Poolakey استفاده می‌شود.
func (s Service) GetPlanByProductID(ctx context.Context, productID string) (Plan, error) {
	return s.repo.GetPlanByProductID(ctx, productID)
}

// RevenueStats آمار درآمد اشتراک‌های خریداری‌شده (نه گرنت دستی) را برمی‌گرداند.
func (s Service) RevenueStats(ctx context.Context, days int) (postgressubscription.RevenueStats, error) {
	return s.repo.RevenueStats(ctx, days)
}

func (s Service) DeletePlan(ctx context.Context, id string) error {
	return s.repo.DeletePlan(ctx, id)
}

// Grant یک اشتراک را برای کاربر فعال می‌کند؛ pointsToRedeem تعیین می‌کند چقدر
// امتیاز کاربر صرف تخفیف شود (باید از قبل توسط فراخوان اعتبارسنجی شده باشد که
// کاربر آن مقدار امتیاز را دارد). provider/purchaseToken برای گرنت دستی ادمین
// خالی می‌مانند؛ برای پرداخت واقعی (مثل کافه‌بازار) پر می‌شوند.
func (s Service) Grant(ctx context.Context, userID string, plan Plan, pointsToRedeem int, provider, purchaseToken string) error {
	discount := DiscountForPoints(pointsToRedeem)
	if discount > plan.PriceToman {
		discount = plan.PriceToman
	}
	return s.repo.GrantSubscription(ctx, userID, plan.ID, pointsToRedeem, discount, plan.DurationDays, provider, purchaseToken)
}

// HasActiveSubscription می‌گوید آیا کاربر اشتراک فعال دارد — مبنای قفل‌کردن
// صحنه‌های غیررایگان.
func (s Service) HasActiveSubscription(ctx context.Context, userID string) (bool, error) {
	return s.repo.HasActiveSubscription(ctx, userID)
}

// PurchaseTokenUsed می‌گوید آیا این purchaseToken قبلاً verify شده.
func (s Service) PurchaseTokenUsed(ctx context.Context, purchaseToken string) (bool, error) {
	return s.repo.PurchaseTokenUsed(ctx, purchaseToken)
}
