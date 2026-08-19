// آدرس بک‌اند Go. فعلاً هم در dev هم در production روی سرور واقعی می‌زند —
// برای تست با بک‌اند لوکال، DEV_LAN_IP را زیر کامنت‌گشایی و API_BASE را به
// آن سوییچ کن.
const PROD_API_BASE = 'https://api.lingoflow.ir';

// const DEV_LAN_IP = '192.168.43.238'; // ipconfig getifaddr en0

export const API_BASE = PROD_API_BASE;

// TODO: کلید RSA واقعی رو از پنل توسعه‌دهندگان کافه‌بازار (بخش «تنظیمات پرداخت»
// همین اپ) بگیر و اینجا جایگزین کن — بدون این کلید واقعی، خرید Poolakey کار
// نمی‌کنه (SDK موقع connect خطا می‌ده).
export const CAFEBAZAAR_RSA_KEY = '';

// تبدیل مسیر نسبی (مثل /uploads/x.png) به URL کامل.
export function absUrl(path?: string | null): string {
  if (!path) return '';
  if (/^https?:\/\//i.test(path)) return path;
  return `${API_BASE}${path.startsWith('/') ? '' : '/'}${path}`;
}
