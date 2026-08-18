import { Platform } from 'react-native';

// آدرس بک‌اند Go.
// در حالت dev روی امولاتور، 10.0.2.2/localhost کار می‌کند؛ روی گوشی واقعی باید IP لپ‌تاپ در همون شبکه وای‌فای باشد.
// این IP را با IP فعلی سیستم خودتان (ipconfig getifaddr en0) به‌روز نگه دارید.
const DEV_LAN_IP = '192.168.43.238';

const PROD_API_BASE = 'https://api.lingoflow.ir';

export const API_BASE = __DEV__
  ? (Platform.select({
      android: `http://${DEV_LAN_IP}:8088`,
      ios: `http://${DEV_LAN_IP}:8088`,
      default: `http://localhost:8088`,
    }) as string)
  : PROD_API_BASE;

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
