import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

export interface NotificationItem {
  id: string;
  type: 'leitner' | 'sentence' | 'reminder';
  title: string;
  body: string;
  translation?: string;
  sourceLabel?: string;
}

/** ساعت یادآوری با فرمت "HH:MM" (۲۴ساعته) — کاربر خودش انتخابش می‌کند. */
export type ReminderTime = string;

/** حداکثر تعداد ساعت‌های یادآوری؛ باید با maxReminderTimes در بک‌اند یکی باشد. */
export const MAX_REMINDER_TIMES = 12;
export type ContentSource = 'leitner' | 'sentences' | 'mixed';

interface NotificationContextType {
  studyReminderEnabled: boolean;
  setStudyReminderEnabled: (val: boolean) => void;
  studyReminderTimes: ReminderTime[];
  addStudyReminderTime: (time: ReminderTime) => boolean;
  removeStudyReminderTime: (time: ReminderTime) => void;
  contentNotificationEnabled: boolean;
  setContentNotificationEnabled: (val: boolean) => void;
  contentSource: ContentSource;
  setContentSource: (source: ContentSource) => void;
  activeBanner: NotificationItem | null;
  dismissBanner: () => void;
  // آیتم واقعی (کلمه‌ی لایتنر یا جمله‌ی صحنه) را کالر می‌سازد — این کانتکست
  // بالاتر از ScenesProvider/VocabProvider است و به داده‌ی واقعی آن‌ها دسترسی
  // ندارد، پس نباید خودش داده‌ی نمونه/جعلی تولید کند.
  triggerTestNotification: (item: NotificationItem) => void;
}

const NotificationContext = createContext<NotificationContextType>({
  // پیش‌فرض هر دو نوتیفیکیشن خاموش است؛ کاربر باید خودش روشنشان کند.
  studyReminderEnabled: false,
  setStudyReminderEnabled: () => {},
  studyReminderTimes: [],
  addStudyReminderTime: () => false,
  removeStudyReminderTime: () => {},
  contentNotificationEnabled: false,
  setContentNotificationEnabled: () => {},
  contentSource: 'mixed',
  setContentSource: () => {},
  activeBanner: null,
  dismissBanner: () => {},
  triggerTestNotification: () => {},
});

import { NativeNotificationService } from '../services/NativeNotificationService';
import { PushNotificationService } from '../services/PushNotificationService';
import * as notifApi from '../api/notifications';
import { useAuth } from './AuthContext';

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  // پیش‌فرض خاموش — تا وقتی کاربر خودش روشن نکرده و ساعت انتخاب نکرده، هیچ
  // یادآوری‌ای زمان‌بندی نمی‌شود.
  const [studyReminderEnabled, setStudyReminderEnabledState] = useState(false);
  const [studyReminderTimes, setStudyReminderTimesState] = useState<ReminderTime[]>([]);
  const [contentNotificationEnabled, setContentNotificationEnabledState] = useState(false);
  const [contentSource, setContentSourceState] = useState<ContentSource>('mixed');
  const [activeBanner, setActiveBanner] = useState<NotificationItem | null>(null);

  // بارگذاری تنظیمات واقعی از بک‌اند + ثبت توکن FCM، فقط وقتی کاربر لاگین کرده
  useEffect(() => {
    if (!isAuthenticated) return;
    (async () => {
      try {
        const settings = await notifApi.getNotificationSettings();
        const times = settings.daily_reminder_times ?? [];
        setStudyReminderEnabledState(settings.daily_reminder_enabled);
        setStudyReminderTimesState(times);
        setContentNotificationEnabledState(settings.content_notif_enabled);
        setContentSourceState(settings.content_source);
        // همیشه با وضعیت سرور همگام می‌شویم: اگر یادآوری خاموش است، لیست خالی
        // فرستاده می‌شود تا trigger‌های باقی‌مانده از قبل هم لغو شوند.
        NativeNotificationService.scheduleDailyReminders(
          settings.daily_reminder_enabled ? times : []
        );
      } catch (err) {
        console.warn('[NotificationContext] failed to load notification settings:', err);
      }
    })();
    PushNotificationService.init();
  }, [isAuthenticated]);

  const persist = useCallback((overrides: Partial<notifApi.NotificationSettings>) => {
    notifApi
      .updateNotificationSettings({
        daily_reminder_enabled: studyReminderEnabled,
        daily_reminder_times: studyReminderTimes,
        content_notif_enabled: contentNotificationEnabled,
        content_source: contentSource,
        ...overrides,
      })
      .catch((err) => console.warn('[NotificationContext] failed to save settings:', err));
  }, [studyReminderEnabled, studyReminderTimes, contentNotificationEnabled, contentSource]);

  const setStudyReminderEnabled = useCallback(
    (val: boolean) => {
      setStudyReminderEnabledState(val);
      NativeNotificationService.scheduleDailyReminders(val ? studyReminderTimes : []);
      persist({ daily_reminder_enabled: val });
    },
    [studyReminderTimes, persist]
  );

  /**
   * addStudyReminderTime یک ساعت جدید اضافه می‌کند. اگر تکراری باشد یا به سقف
   * رسیده باشیم false برمی‌گرداند تا صفحه‌ی تنظیمات بتواند پیام مناسب بدهد.
   */
  const addStudyReminderTime = useCallback(
    (time: ReminderTime): boolean => {
      if (studyReminderTimes.includes(time)) return false;
      if (studyReminderTimes.length >= MAX_REMINDER_TIMES) return false;

      const next = [...studyReminderTimes, time].sort();
      setStudyReminderTimesState(next);
      if (studyReminderEnabled) {
        NativeNotificationService.scheduleDailyReminders(next);
      }
      persist({ daily_reminder_times: next });
      return true;
    },
    [studyReminderTimes, studyReminderEnabled, persist]
  );

  const removeStudyReminderTime = useCallback(
    (time: ReminderTime) => {
      const next = studyReminderTimes.filter((t) => t !== time);
      setStudyReminderTimesState(next);
      if (studyReminderEnabled) {
        NativeNotificationService.scheduleDailyReminders(next);
      }
      persist({ daily_reminder_times: next });
    },
    [studyReminderTimes, studyReminderEnabled, persist]
  );

  const setContentNotificationEnabled = useCallback(
    (val: boolean) => {
      setContentNotificationEnabledState(val);
      persist({ content_notif_enabled: val });
    },
    [persist]
  );

  const setContentSource = useCallback(
    (source: ContentSource) => {
      setContentSourceState(source);
      persist({ content_source: source });
    },
    [persist]
  );

  const dismissBanner = useCallback(() => {
    setActiveBanner(null);
  }, []);

  const triggerTestNotification = useCallback((item: NotificationItem) => {
    // Set in-app active banner
    setActiveBanner(item);

    // Also trigger native OS notification display
    NativeNotificationService.displayNotification(item);
  }, []);

  const value = useMemo<NotificationContextType>(
    () => ({
      studyReminderEnabled,
      setStudyReminderEnabled,
      studyReminderTimes,
      addStudyReminderTime,
      removeStudyReminderTime,
      contentNotificationEnabled,
      setContentNotificationEnabled,
      contentSource,
      setContentSource,
      activeBanner,
      dismissBanner,
      triggerTestNotification,
    }),
    [
      studyReminderEnabled,
      setStudyReminderEnabled,
      studyReminderTimes,
      addStudyReminderTime,
      removeStudyReminderTime,
      contentNotificationEnabled,
      setContentNotificationEnabled,
      contentSource,
      setContentSource,
      activeBanner,
      dismissBanner,
      triggerTestNotification,
    ]
  );

  return (
    <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>
  );
};

export const useNotifications = () => useContext(NotificationContext);
