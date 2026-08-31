import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE } from './config';

const TOKEN_KEY = 'shadowing_user_token';
const REFRESH_TOKEN_KEY = 'shadowing_user_refresh_token';

let cachedToken: string | null | undefined;
let cachedRefreshToken: string | null | undefined;

export async function getToken(): Promise<string | null> {
  if (cachedToken !== undefined) return cachedToken;
  cachedToken = await AsyncStorage.getItem(TOKEN_KEY);
  return cachedToken;
}

export async function getRefreshToken(): Promise<string | null> {
  if (cachedRefreshToken !== undefined) return cachedRefreshToken;
  cachedRefreshToken = await AsyncStorage.getItem(REFRESH_TOKEN_KEY);
  return cachedRefreshToken;
}

/**
 * ذخیره‌ی جفت توکن. refresh token اختیاری است چون بعضی پاسخ‌ها فقط توکن
 * دسترسی می‌دهند؛ در آن حالت توکن تمدیدِ قبلی دست‌نخورده می‌ماند.
 */
export async function setToken(token: string, refreshToken?: string): Promise<void> {
  cachedToken = token;
  await AsyncStorage.setItem(TOKEN_KEY, token);
  if (refreshToken) {
    cachedRefreshToken = refreshToken;
    await AsyncStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  }
}

export async function clearToken(): Promise<void> {
  cachedToken = null;
  cachedRefreshToken = null;
  await AsyncStorage.removeItem(TOKEN_KEY);
  await AsyncStorage.removeItem(REFRESH_TOKEN_KEY);
}

// اگر چند درخواست هم‌زمان ۴۰۱ بگیرند، همه باید منتظر یک تمدید بمانند نه اینکه
// هرکدام جدا تمدید بزند — وگرنه با چرخش توکن، تمدیدهای بعدی با توکن باطل‌شده
// شکست می‌خورند و کاربر بی‌دلیل از حساب بیرون می‌افتد.
let refreshInFlight: Promise<boolean> | null = null;

/**
 * تلاش برای گرفتن توکن دسترسی تازه با refresh token.
 * خروجی true یعنی توکن تازه شد و درخواست را می‌شود دوباره فرستاد.
 */
async function refreshAccessToken(): Promise<boolean> {
  if (refreshInFlight) return refreshInFlight;

  refreshInFlight = (async () => {
    const refreshToken = await getRefreshToken();
    if (!refreshToken) return false;

    try {
      const res = await fetch(`${API_BASE}/v1/users/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh_token: refreshToken }),
      });
      if (!res.ok) {
        // توکن تمدید هم منقضی/باطل است؛ این‌بار واقعاً باید دوباره لاگین کند.
        await clearToken();
        return false;
      }
      const data = await res.json();
      const access = data?.tokens?.access_token;
      if (!access) return false;
      await setToken(access, data?.tokens?.refresh_token);
      return true;
    } catch (err) {
      // خطای شبکه ≠ توکن نامعتبر؛ توکن‌ها را پاک نمی‌کنیم تا کاربر با یک قطعی
      // موقتِ اینترنت از حساب بیرون نیفتد.
      console.warn('[client] token refresh failed:', err);
      return false;
    } finally {
      refreshInFlight = null;
    }
  })();

  return refreshInFlight;
}

export async function authFetch(path: string, opts: RequestInit = {}): Promise<Response> {
  const send = async () => {
    const token = await getToken();
    const headers = new Headers(opts.headers || {});
    if (token) headers.set('Authorization', `Bearer ${token}`);
    return fetch(`${API_BASE}${path}`, { ...opts, headers });
  };

  const res = await send();
  if (res.status !== 401) return res;

  // توکن دسترسی منقضی شده: یک بار تمدید می‌کنیم و همان درخواست را دوباره
  // می‌فرستیم. اگر تمدید هم نشد، همان پاسخ ۴۰۱ برمی‌گردد تا کالر خودش تصمیم
  // بگیرد.
  const refreshed = await refreshAccessToken();
  if (!refreshed) return res;
  return send();
}

/**
 * ۴۰۱ی که بعد از تلاش برای تمدید هم باقی مانده — یعنی نشست واقعاً تمام شده و
 * کاربر باید دوباره لاگین کند. جدا از Error معمولی است تا کالر بتواند «توکن
 * باطل شد» را از «اینترنت قطع بود» تشخیص بدهد.
 */
export class AuthExpiredError extends Error {}

export async function jsonOrThrow(res: Response) {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const message = data.message || data.error || 'خطای ناشناخته';
    if (res.status === 401) throw new AuthExpiredError(message);
    throw new Error(message);
  }
  return data;
}
