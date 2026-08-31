import { NotificationItem, ReminderTime } from '../data/NotificationContext';
import { translate } from '../data/i18n';
import { getDeviceLanguage } from '../utils/deviceLanguage';

// پیشوند شناسه‌ی نوتیفیکیشن‌های یادآوری روزانه. هر ساعت یک trigger جدا دارد و
// با همین پیشوند شناخته می‌شود تا موقع به‌روزرسانی فقط همین‌ها لغو شوند و
// نوتیفیکیشن‌های دیگر (مثل بنر محتوایی) دست‌نخورده بمانند.
const REMINDER_ID_PREFIX = 'daily-reminder-';

let notifeeModule: any = null;
try {
  notifeeModule = require('@notifee/react-native').default;
} catch (e) {
  // Notifee package will be loaded when installed
  notifeeModule = null;
}

export class NativeNotificationService {
  /**
   * Request system notification permission from OS
   */
  static async requestPermission(): Promise<boolean> {
    if (!notifeeModule) return false;
    try {
      const settings = await notifeeModule.requestPermission();
      return settings.authorizationStatus >= 1;
    } catch (err) {
      console.warn('[NativeNotificationService] Permission error:', err);
      return false;
    }
  }

  /**
   * Display a local system notification banner on the device
   */
  static async displayNotification(item: NotificationItem): Promise<void> {
    if (!notifeeModule) {
      console.log('[NativeNotificationService] (Fallback Mode) Displaying notification:', item.title);
      return;
    }

    try {
      // Create channel for Android
      const channelId = await notifeeModule.createChannel({
        id: 'shadowtalk_channel',
        name: 'LingoFlow Practice & Reminders',
        importance: 4, // High importance for system banners
        sound: 'default',
      });

      // Display system notification
      await notifeeModule.displayNotification({
        title: item.title,
        body: item.translation ? `${item.body}\n${item.translation}` : item.body,
        android: {
          channelId,
          smallIcon: 'ic_launcher',
          color: '#3525cd',
          pressAction: {
            id: 'default',
          },
        },
        ios: {
          sound: 'default',
        },
      });
    } catch (err) {
      console.warn('[NativeNotificationService] displayNotification failed:', err);
    }
  }

  /**
   * Schedule daily study reminders at every time the user picked.
   *
   * متن نوتیف با زبانِ دستگاه ساخته می‌شود (فارسی → فارسی، بقیه → انگلیسی)،
   * نه با زبان انتخابی داخل اپ. یادآوری فقط همین‌جا (روی خود گوشی) زمان‌بندی
   * می‌شود؛ سرور دیگر پوش یادآوری نمی‌فرستد، برای همین دیگر دو نوتیف تکراری
   * با دو زبان مختلف نمی‌آید.
   */
  static async scheduleDailyReminders(times: ReminderTime[]): Promise<void> {
    if (!notifeeModule) {
      console.log('[NativeNotificationService] Daily reminders set for', times.join(', '));
      return;
    }

    try {
      await this.cancelDailyReminders();
      if (times.length === 0) return;

      const lang = getDeviceLanguage();
      const title = translate(lang, 'notifDailyReminderTitle');
      const body = translate(lang, 'notifDailyReminderBody');

      const channelId = await notifeeModule.createChannel({
        id: 'shadowtalk_reminders',
        name: 'Daily Study Reminders',
        importance: 4,
      });

      for (const time of times) {
        const timestamp = nextOccurrence(time);
        if (timestamp === null) continue;

        await notifeeModule.createTriggerNotification(
          {
            id: REMINDER_ID_PREFIX + time,
            title,
            body,
            android: {
              channelId,
              smallIcon: 'ic_launcher',
              color: '#3525cd',
              pressAction: { id: 'default' },
            },
            ios: { sound: 'default' },
          },
          {
            type: 0, // Timestamp trigger
            timestamp,
            repeatFrequency: 1, // Daily repeat
          }
        );
      }
    } catch (err) {
      console.warn('[NativeNotificationService] scheduleDailyReminders failed:', err);
    }
  }

  /** لغو همه‌ی یادآوری‌های روزانه (بدون دست‌زدن به بقیه‌ی نوتیفیکیشن‌ها). */
  static async cancelDailyReminders(): Promise<void> {
    if (!notifeeModule) return;

    try {
      const triggerIds: string[] = (await notifeeModule.getTriggerNotificationIds()) || [];
      const reminderIds = triggerIds.filter((id) => id.startsWith(REMINDER_ID_PREFIX));
      if (reminderIds.length > 0) {
        await notifeeModule.cancelTriggerNotifications(reminderIds);
      }
    } catch (err) {
      console.warn('[NativeNotificationService] cancelDailyReminders failed:', err);
    }
  }
}

/**
 * nextOccurrence نزدیک‌ترین زمانِ آینده برای یک ساعت "HH:MM" را برمی‌گرداند؛
 * اگر آن ساعتِ امروز گذشته باشد، فردا در نظر گرفته می‌شود. ورودی نامعتبر
 * null می‌دهد تا یک ساعتِ خراب باعث خطای زمان‌بندی بقیه نشود.
 */
function nextOccurrence(time: string): number | null {
  const match = /^(\d{1,2}):(\d{2})$/.exec(time.trim());
  if (!match) return null;

  const hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  if (hours > 23 || minutes > 59) return null;

  const date = new Date();
  date.setHours(hours, minutes, 0, 0);
  if (date.getTime() <= Date.now()) {
    date.setDate(date.getDate() + 1);
  }
  return date.getTime();
}
