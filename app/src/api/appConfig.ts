import { API_BASE } from './config';

/**
 * کلیدهای روشن/خاموشِ بخش‌های تازه که ادمین در پنل تنظیم می‌کند. اپ با این‌ها
 * تصمیم می‌گیرد ورودیِ بخش را نشان بدهد یا نه، پس بخشی که در این نسخه ساخته شده
 * ولی هنوز محتوا ندارد، بعداً بدون نسخه‌ی جدید روشن می‌شود.
 */
export interface AppFeatures {
  interview: boolean;
  specialty: boolean;
}

let cached: AppFeatures = { interview: false, specialty: false };
let fetchedAt = 0;
const TTL_MS = 5 * 60 * 1000;

/** خطای شبکه = همان مقدار قبلی (پیش‌فرض: همه خاموش). */
export async function getAppFeatures(): Promise<AppFeatures> {
  if (Date.now() - fetchedAt < TTL_MS) return cached;
  try {
    const res = await fetch(`${API_BASE}/v1/app-config`);
    if (res.ok) {
      const data = await res.json();
      cached = { interview: !!data?.features?.interview, specialty: !!data?.features?.specialty };
      fetchedAt = Date.now();
    }
  } catch {
    // آفلاین: منو با مقدار قبلی می‌ماند.
  }
  return cached;
}
