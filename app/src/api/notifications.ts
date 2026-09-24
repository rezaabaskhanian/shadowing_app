import { authFetch, jsonOrThrow } from './client';

/** ساعت یادآوری با فرمت "HH:MM" (۲۴ساعته). */
export type ReminderTime = string;
export type ContentSource = 'leitner' | 'sentences' | 'mixed';
/** هدف یادگیریِ اختیاری کاربر — رشته‌ی خالی یعنی هنوز انتخاب نکرده. فقط
 * برای اولویت‌دهیِ نرم به انتخاب صحنه در Today's Mission استفاده می‌شود. */
export type LearningGoal = '' | 'Migration' | 'Travel' | 'Work' | 'Daily Life' | 'Study';

export interface NotificationSettings {
  daily_reminder_enabled: boolean;
  daily_reminder_times: ReminderTime[];
  content_notif_enabled: boolean;
  content_source: ContentSource;
  /** پوش یادآوری وقتی امروز هنوز تمرین نکرده‌ای ولی استریکت هنوز نشکسته. */
  streak_reminder_enabled: boolean;
  /** پوش یادآوری وقتی کلمه‌ای در جعبه‌ی لایتنرت سررسیده شده. */
  vocab_reminder_enabled: boolean;
  learning_goal: LearningGoal;
  /** خلاصه‌ی هفتگیِ پیشرفت گفتاری — فقط وقتی هفته‌ی قبل واقعاً تمرین داشته باشی. */
  weekly_digest_enabled: boolean;
}

export async function getNotificationSettings(): Promise<NotificationSettings> {
  const res = await authFetch('/v1/users/notification-settings', { method: 'GET' });
  return jsonOrThrow(res) as Promise<NotificationSettings>;
}

export async function updateNotificationSettings(
  settings: NotificationSettings
): Promise<void> {
  const res = await authFetch('/v1/users/notification-settings', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(settings),
  });
  await jsonOrThrow(res);
}

export async function registerDeviceToken(
  token: string,
  platform: 'ios' | 'android'
): Promise<void> {
  const res = await authFetch('/v1/users/device-token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token, platform }),
  });
  await jsonOrThrow(res);
}
