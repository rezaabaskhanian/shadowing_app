import { authFetch, jsonOrThrow } from './client';

/**
 * «ماموریتِ امروز»: صحنه‌ی پیشنهادی بر اساسِ سطحِ گفتاریِ کاربر (اگر تست
 * تعیین سطح را داده) و مهارتِ ضعیف‌ترش. فقط متادیتای نمایشی برمی‌گرداند —
 * تصویر/عنوانِ واقعیِ صحنه از روی scene_id از ScenesContext که از قبل
 * بارگذاری شده خوانده می‌شود.
 */
export interface TodaysMission {
  scene_id: string;
  title: string;
  category?: string;
  difficulty: string;
  /** سطحِ نمایشی: یا یک CEFR واقعی (مثل "B1") یا نامِ سطحِ صحنه با حرف بزرگ. */
  level: string;
  is_estimated_level: boolean;
  focus_skill: 'pronunciation' | 'fluency' | 'speaking' | string;
  estimated_minutes: number;
}

/**
 * اگر هیچ صحنه‌ی منتشرشده‌ای وجود نداشته باشد سرور ۴۰۴ می‌دهد؛ اینجا `null`
 * برمی‌گردانیم تا Home بی‌سروصدا به کارتِ قدیمی («ادامه داستان») برگردد.
 */
export async function getTodaysMission(): Promise<TodaysMission | null> {
  const res = await authFetch('/v1/mission/today', { method: 'GET' });
  if (res.status === 404) return null;
  return (await jsonOrThrow(res)) as TodaysMission;
}
