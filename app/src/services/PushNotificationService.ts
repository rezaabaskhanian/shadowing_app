import { Platform } from 'react-native';
import { registerDeviceToken } from '../api/notifications';
import { NativeNotificationService } from './NativeNotificationService';

let messaging: any = null;
try {
  messaging = require('@react-native-firebase/messaging').default;
} catch (e) {
  // بسته وقتی نصب و پیکربندی (google-services.json / GoogleService-Info.plist) شود فعال می‌شود
  messaging = null;
}

const platform = (): 'ios' | 'android' => (Platform.OS === 'ios' ? 'ios' : 'android');

// PushNotificationService مجوز نوتیفیکیشن سیستم را می‌گیرد، توکن FCM دستگاه را
// به بک‌اند ثبت می‌کند و پیام‌های Push دریافتی وقتی اپ باز است را نمایش می‌دهد.
// اگر @react-native-firebase/messaging نصب/پیکربندی نشده باشد، بی‌صدا غیرفعال
// می‌ماند (یادآوری محلی از طریق NativeNotificationService همچنان کار می‌کند).
export class PushNotificationService {
  static async init(): Promise<void> {
    if (!messaging) {
      console.log('[PushNotificationService] Firebase messaging not installed — skipping push registration.');
      return;
    }

    try {
      const authStatus = await messaging().requestPermission();
      const enabled =
        authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
        authStatus === messaging.AuthorizationStatus.PROVISIONAL;
      if (!enabled) return;

      const token = await messaging().getToken();
      if (token) {
        await registerDeviceToken(token, platform()).catch((err) => {
          console.warn('[PushNotificationService] registerDeviceToken failed:', err);
        });
      }

      messaging().onTokenRefresh(async (newToken: string) => {
        await registerDeviceToken(newToken, platform()).catch(() => {});
      });

      messaging().onMessage(async (remoteMessage: any) => {
        const title = remoteMessage?.notification?.title;
        const body = remoteMessage?.notification?.body;
        if (!title && !body) return;
        await NativeNotificationService.displayNotification({
          id: Date.now().toString(),
          type: 'reminder',
          title: title || '',
          body: body || '',
        });
      });
    } catch (err) {
      console.warn('[PushNotificationService] init failed:', err);
    }
  }
}
