import { authFetch, jsonOrThrow } from './client';

/** خرید کافه‌بازاری را سمت سرور verify می‌کند و در صورت معتبربودن، اشتراک
 * یک‌ساله را برای کاربر فعال می‌کند. */
export async function verifyPurchase(productId: string, purchaseToken: string): Promise<void> {
  const res = await authFetch('/v1/learning/subscription/verify-purchase', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ product_id: productId, purchase_token: purchaseToken }),
  });
  await jsonOrThrow(res);
}
