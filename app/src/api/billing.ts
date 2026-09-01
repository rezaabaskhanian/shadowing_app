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

/** خرید کافه‌بازاری را سمت سرور verify می‌کند و در صورت معتبربودن، پلن
 * متناظر productId را برای کاربر فعال می‌کند. */
export async function verifyPurchase(productId: string, purchaseToken: string): Promise<void> {
  const res = await authFetch('/v1/learning/subscription/verify-purchase', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ product_id: productId, purchase_token: purchaseToken }),
  });
  await jsonOrThrow(res);
}
