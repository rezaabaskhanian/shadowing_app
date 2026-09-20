import { authFetch, jsonOrThrow } from './client';

/**
 * مصرفِ امروزِ کاربر از فیچرهای AI-heavy (AI Conversation، Free Speech) —
 * برای نوارِ مصرف و پیشنهادِ خریدِ توکن وقتی نزدیک/رسیده به سقف.
 */
export interface AIUsageStatus {
  has_active_subscription: boolean;
  used_tokens: number;
  daily_limit: number;
  remaining_tokens: number;
  /** اعتبارِ توکنِ خریداری‌شده (تاپ‌آپ) — برخلافِ remaining_tokens هر روز صفر نمی‌شود. */
  credit_balance: number;
  estimated_cost_usd: number;
}

export async function getAIUsageStatus(): Promise<AIUsageStatus> {
  const res = await authFetch('/v1/learning/ai-usage', { method: 'GET' });
  return (await jsonOrThrow(res)) as AIUsageStatus;
}

export interface TokenTopupPlan {
  id: string;
  name: string;
  tokens: number;
  price_toman: number;
  /** شناسه‌ی SKU در پولکی/کافه‌بازار — برای purchaseProduct لازم است. */
  product_id: string;
}

/** طرح‌های تاپ‌آپِ توکن را از سرور می‌گیرد (قیمت‌ها از پنل ادمین قابل‌تغییرند). */
export async function getTokenTopupPlans(): Promise<TokenTopupPlan[]> {
  const res = await authFetch('/v1/learning/token-topup-plans', { method: 'GET' });
  const data = await jsonOrThrow(res);
  return (data.plans || []) as TokenTopupPlan[];
}

/** خرید کافه‌بازاریِ تاپ‌آپ را سمت سرور verify می‌کند و در صورتِ معتبربودن،
 * توکن همان لحظه به اعتبارِ کاربر اضافه می‌شود (نه یک روزِ اشتراکِ جدید). */
export async function verifyTokenTopupPurchase(productId: string, purchaseToken: string): Promise<void> {
  const res = await authFetch('/v1/learning/token-topup/verify-purchase', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ product_id: productId, purchase_token: purchaseToken }),
  });
  await jsonOrThrow(res);
}
