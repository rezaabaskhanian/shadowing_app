/**
 * آنالیتیکس اپ، فرستاده‌شده به بک‌اند خودمان (POST /v1/events — ببینید
 * analyticsservice در بک‌اند) و خلاصه‌شده در صفحه‌ی «آمار» پنل ادمین.
 * الگو از اپ Wallpaper.
 *
 * Fire-and-forget: رویدادِ گم‌شده (آفلاین، سرور پایین) هرگز نباید روی خود اپ
 * اثر بگذارد، پس هیچ تابعی اینجا خطا پرتاب نمی‌کند و کسی منتظرش نمی‌ماند.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE, APP_VERSION } from '../api/config';
import { getToken } from '../api/client';

/** رویدادهای مجاز — باید با validEvents در بک‌اند یکی باشد. */
export type AnalyticsEvent =
  | 'onboarding_completed'
  | 'signed_in'
  | 'placement_completed'
  | 'scene_opened'
  | 'shadow_recorded'
  | 'scene_completed'
  | 'paywall_viewed'
  | 'purchase_completed'
  | 'ai_conversation_started'
  | 'free_speech_submitted'
  | 'topic_speaking_submitted'
  | 'video_clip_opened'
  | 'video_clip_quiz_done'
  | 'video_clip_performed'
  | 'writing_submitted'
  | 'course_lesson_completed'
  | 'podcast_played'
  | 'token_topup_viewed'
  | 'token_topup_purchased';

const DEVICE_ID_KEY = 'analytics:deviceId';
const LAST_OPEN_KEY = 'analytics:lastAppOpenAt';
/** بازگشت به اپ با فاصله‌ی کمتر از این، همان جلسه حساب می‌شود (نه باز شدن تازه). */
const OPEN_SESSION_GAP_MS = 30 * 60 * 1000;

let deviceIdPromise: Promise<string> | null = null;

/**
 * شناسه‌ی تصادفیِ ماندگارِ این نصب. به هیچ اطلاعات واقعی دستگاه وابسته نیست؛
 * با حذف اپ یا پاک کردن داده‌ها عوض می‌شود — همان «نصب جدید».
 */
function getDeviceId(): Promise<string> {
  if (!deviceIdPromise) {
    deviceIdPromise = (async () => {
      try {
        const saved = await AsyncStorage.getItem(DEVICE_ID_KEY);
        if (saved) return saved;
      } catch {
        // ادامه با شناسه‌ی تازه
      }
      const id = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
      AsyncStorage.setItem(DEVICE_ID_KEY, id).catch(() => {});
      return id;
    })();
  }
  return deviceIdPromise;
}

async function send(event: string, extra: { screen?: string; target?: string } = {}): Promise<void> {
  try {
    const [deviceId, token] = await Promise.all([getDeviceId(), getToken().catch(() => null)]);
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    // اگر کاربر وارد شده، رویداد به حسابش هم وصل می‌شود؛ توکن منقضی هم مشکلی
    // ندارد، سرور فقط بدون user_id ثبتش می‌کند.
    if (token) headers.Authorization = `Bearer ${token}`;
    await fetch(`${API_BASE}/v1/events`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ device_id: deviceId, app_version: APP_VERSION, event, ...extra }),
    });
  } catch {
    // آفلاین یا سرور پایین — رویداد فقط گم می‌شود.
  }
}

/** باز شدن اپ (اجرای اول یا برگشت بعد از ۳۰ دقیقه دوری). */
export async function trackAppOpen(): Promise<void> {
  try {
    const last = Number(await AsyncStorage.getItem(LAST_OPEN_KEY));
    if (Number.isFinite(last) && Date.now() - last < OPEN_SESSION_GAP_MS) return;
    await AsyncStorage.setItem(LAST_OPEN_KEY, String(Date.now()));
  } catch {
    // حافظه در دسترس نیست — باز هم بفرست؛ یک باز شدنِ اضافه بهتر از گم‌شدن است.
  }
  send('app_open');
}

/** دیدن یک صفحه؛ screen همان نام route در ناوبری است. */
export function trackScreen(screen: string): void {
  send('screen_view', { screen });
}

/** یک قدم از مسیر کاربر؛ target اختیاری است (مثلاً شناسه‌ی صحنه یا محصول). */
export function track(event: AnalyticsEvent, target?: string): void {
  send(event, target ? { target } : {});
}
