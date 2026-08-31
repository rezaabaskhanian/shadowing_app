import { NativeModules, Platform } from 'react-native';

import type { Language } from '../data/i18n';

/**
 * getDeviceLanguage زبانِ خودِ سیستم‌عامل را برمی‌گرداند (نه زبانی که کاربر
 * داخل اپ انتخاب کرده). متن نوتیفیکیشن‌ها باید با این زبان ساخته شود: فارسی
 * بودن زبان گوشی یعنی نوتیف فارسی، هر چیز دیگری یعنی انگلیسی.
 *
 * عمداً بدون وابستگی به react-native-localize نوشته شده تا نیازی به نصب پکیج
 * نیتیو جدید و rebuild نباشد؛ اگر خواندن locale به هر دلیلی شکست بخورد، به
 * انگلیسی برمی‌گردد.
 */
export function getDeviceLanguage(): Language {
  return isPersianLocale(getDeviceLocale()) ? 'fa' : 'en';
}

/** getDeviceLocale شناسه‌ی locale سیستم‌عامل را می‌دهد، مثل "fa_IR" یا "en-US". */
export function getDeviceLocale(): string {
  try {
    if (Platform.OS === 'ios') {
      const settings = NativeModules.SettingsManager?.settings;
      const locale =
        settings?.AppleLocale ||
        (Array.isArray(settings?.AppleLanguages) ? settings.AppleLanguages[0] : undefined);
      if (locale) return String(locale);
    } else {
      const locale = NativeModules.I18nManager?.localeIdentifier;
      if (locale) return String(locale);
    }
  } catch (err) {
    console.warn('[deviceLanguage] failed to read device locale:', err);
  }

  // Hermes با Intl کامپایل شده؛ به‌عنوان راه دوم از آن استفاده می‌کنیم.
  try {
    const resolved = Intl?.DateTimeFormat?.().resolvedOptions?.().locale;
    if (resolved) return String(resolved);
  } catch {
    // بی‌خیال؛ پایین‌تر به انگلیسی برمی‌گردیم
  }

  return 'en';
}

/**
 * isPersianLocale فارسی بودن یک locale را تشخیص می‌دهد. علاوه بر "fa"، کدهای
 * "per"/"fas" (کدهای سه‌حرفی ISO 639-2 فارسی) هم پوشش داده می‌شوند.
 */
function isPersianLocale(locale: string): boolean {
  const lang = locale.replace('_', '-').split('-')[0].toLowerCase();
  return lang === 'fa' || lang === 'per' || lang === 'fas';
}
