// آدرس بک‌اند Go. فعلاً هم در dev هم در production روی سرور واقعی می‌زند —
// برای تست با بک‌اند لوکال، DEV_LAN_IP را زیر کامنت‌گشایی و API_BASE را به
// آن سوییچ کن.
const PROD_API_BASE = 'https://api.lingoflow.ir';

// const DEV_LAN_IP = '192.168.43.238'; // ipconfig getifaddr en0

export const API_BASE = PROD_API_BASE;

// نسخه‌ی اپ برای آنالیتیکس (ماندگاری به تفکیک نسخه در پنل ادمین). باید با
// APP_VERSION_NAME در android/gradle.properties یکی باشد — هر بار نسخه بالا
// می‌رود، هر دو را با هم عوض کنید.
export const APP_VERSION = '1.0.0';

// کلید عمومی RSA پرداخت درون‌برنامه‌ای، از پنل توسعه‌دهندگان کافه‌بازار.
// عمومی است و قرار گرفتنش داخل اپ امن است؛ Poolakey با آن امضای خریدها را چک می‌کند.
export const CAFEBAZAAR_RSA_KEY =
  'MIHNMA0GCSqGSIb3DQEBAQUAA4G7ADCBtwKBrwCtKPzCq8h/cr1rruwqaE498nu6axfnC1OSBHbcbUWzJy0oW9xoZxy821I1hxE3F0WJhyuTQbnRNvXXSc6SEAcbHK1EI+Pa+QSlYGv+hpMh2/tXWeGv/kaksnCf5Q/6XGyKo0MHzfl7UO4ht9FZUqq5gWPktKimFWLZG4NHTWntJpHpBU2IDwPVWLp+oRbMQOdg/9QE4RZ7TElogBLQt8pwg9hvE7l+Tu8GFOpKGn8CAwEAAQ==';

// تبدیل مسیر نسبی (مثل /uploads/x.png) به URL کامل.
export function absUrl(path?: string | null): string {
  if (!path) return '';
  if (/^https?:\/\//i.test(path)) return path;
  return `${API_BASE}${path.startsWith('/') ? '' : '/'}${path}`;
}
