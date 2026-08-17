/**
 * پله‌های تخفیف اشتراک یک‌ساله بر اساس امتیاز کاربر. چون کافه‌بازار قیمت هر
 * SKU رو از قبل توی پنل ثابت تعریف می‌کنه (نمی‌شه قیمت رو موقع خرید پویا کرد)،
 * چند SKU با قیمت‌های پلکانی داریم و نزدیک‌ترین پله‌ی «کمتر یا مساوی» امتیاز
 * واقعی کاربر رو نشون می‌دیم.
 *
 * این جدول باید عیناً با internal/service/billing/service.go (discountTiers)
 * یکی بمونه — اگر یکی عوض شد، دیگری هم باید دستی به‌روزرسانی بشه.
 *
 * این ۵ SKU باید دستی توی پنل توسعه‌دهندگان کافه‌بازار ساخته بشن، با همین
 * productId ها و قیمت‌های زیر.
 */
export interface SubscriptionTier {
  productId: string;
  minPoints: number;
  priceToman: number;
}

export const YEARLY_PLAN_PRICE_TOMAN = 1_200_000;

export const SUBSCRIPTION_TIERS: SubscriptionTier[] = [
  { productId: 'yearly_full', minPoints: 0, priceToman: 1_200_000 },
  { productId: 'yearly_d100k', minPoints: 500, priceToman: 1_100_000 },
  { productId: 'yearly_d200k', minPoints: 1000, priceToman: 1_000_000 },
  { productId: 'yearly_d400k', minPoints: 2000, priceToman: 800_000 },
  { productId: 'yearly_d600k', minPoints: 3000, priceToman: 600_000 },
  { productId: 'yearly_d900k', minPoints: 4500, priceToman: 300_000 },
];

/** نزدیک‌ترین پله‌ی قابل‌استفاده برای مقدار امتیاز فعلی کاربر را برمی‌گرداند. */
export function bestTierForPoints(points: number): SubscriptionTier {
  let best = SUBSCRIPTION_TIERS[0];
  for (const tier of SUBSCRIPTION_TIERS) {
    if (points >= tier.minPoints) best = tier;
  }
  return best;
}
