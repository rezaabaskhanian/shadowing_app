import { Platform } from 'react-native';

// آدرس بک‌اند Go.
// روی امولاتور اندروید، localhost میزبان با 10.0.2.2 در دسترس است؛
// روی شبیه‌ساز iOS همان localhost کار می‌کند.
// در صورت اجرا روی دستگاه واقعی، IP سیستم خود را جایگزین کنید.
export const API_BASE = Platform.select({
  android: 'http://10.0.2.2:8088',
  ios: 'http://localhost:8088',
  default: 'http://localhost:8088',
}) as string;

// تبدیل مسیر نسبی (مثل /uploads/x.png) به URL کامل.
export function absUrl(path?: string | null): string {
  if (!path) return '';
  if (/^https?:\/\//i.test(path)) return path;
  return `${API_BASE}${path.startsWith('/') ? '' : '/'}${path}`;
}
