import { NotificationItem, ReminderTime, ContentSource } from '../data/NotificationContext';

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
   * Schedule daily study reminder at selected time
   */
  static async scheduleDailyReminder(time: ReminderTime): Promise<void> {
    if (!notifeeModule) {
      console.log(`[NativeNotificationService] Daily reminder set for ${time}`);
      return;
    }

    try {
      await notifeeModule.cancelAllNotifications();

      const [hoursStr, minutesStr] = time.split(':');
      const hours = parseInt(hoursStr, 10);
      const minutes = parseInt(minutesStr, 10);

      const now = new Date();
      const date = new Date();
      date.setHours(hours, minutes, 0, 0);

      if (date.getTime() <= now.getTime()) {
        date.setDate(date.getDate() + 1);
      }

      const channelId = await notifeeModule.createChannel({
        id: 'shadowtalk_reminders',
        name: 'Daily Study Reminders',
        importance: 4,
      });

      // Register timestamp trigger
      await notifeeModule.createTriggerNotification(
        {
          title: '🔥 Time to Shadow! Keep your streak active',
          body: 'Practice 5 minutes of natural conversations now.',
          android: {
            channelId,
            color: '#3525cd',
          },
        },
        {
          type: 0, // Timestamp trigger
          timestamp: date.getTime(),
          repeatFrequency: 1, // Daily repeat
        }
      );
    } catch (err) {
      console.warn('[NativeNotificationService] scheduleDailyReminder failed:', err);
    }
  }
}
