import { authFetch, jsonOrThrow } from './client';

export interface SubscriptionPlan {
  id: string;
  name: string;
  duration_days: number;
  price_toman: number;
  /** شناسه‌ی SKU در پولکی/کافه‌بازار — برای purchaseProduct لازم است. */
  product_id: string;
}

/** طرح‌های اشتراک را از سرور می‌گیرد (منبع واحد قیمت‌ها — از پنل ادمین
 * قابل‌تغییرند، اینجا هاردکد نمی‌شوند). */
export async function getSubscriptionPlans(): Promise<SubscriptionPlan[]> {
  const res = await authFetch('/v1/learning/subscription-plans', { method: 'GET' });
  const data = await jsonOrThrow(res);
  return (data.plans || []) as SubscriptionPlan[];
}

/** نرخ تبدیل امتیاز به روز اضافه روی خرید واقعی — باید با
 * PointsPerBonusDayUnit/BonusDaysPerUnit در سرویس subscription بک‌اند یکی
 * بماند. روی خرید واقعی (کافه‌بازار) تخفیف نقدی امکان‌پذیر نیست چون قیمت از
 * قبل نزد کافه‌بازار نهایی شده، برای همین امتیاز به‌جای پول به زمان اضافه
 * تبدیل می‌شود. */
export const POINTS_PER_BONUS_DAY_UNIT = 100;
export const BONUS_DAYS_PER_UNIT = 3;

/** بیشترین روز اضافه‌ای که با این‌مقدار امتیاز می‌شود گرفت (باقیمانده‌ی
 * غیرقابل‌تبدیل صرف نمی‌شود و در موجودی می‌ماند). */
export function bonusDaysForPoints(points: number): number {
  return Math.floor(points / POINTS_PER_BONUS_DAY_UNIT) * BONUS_DAYS_PER_UNIT;
}

/** خرید کافه‌بازاری را سمت سرور verify می‌کند و در صورت معتبربودن، پلن
 * متناظر productId را برای کاربر فعال می‌کند. pointsToRedeem اختیاری است —
 * امتیازی که کاربر برای روز اضافه می‌خواهد خرج کند؛ سرور به موجودی واقعی‌اش
 * محدودش می‌کند. */
export async function verifyPurchase(
  productId: string,
  purchaseToken: string,
  pointsToRedeem = 0
): Promise<void> {
  const res = await authFetch('/v1/learning/subscription/verify-purchase', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      product_id: productId,
      purchase_token: purchaseToken,
      points_to_redeem: pointsToRedeem,
    }),
  });
  await jsonOrThrow(res);
}
