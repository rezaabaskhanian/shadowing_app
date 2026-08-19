import React, { createContext, useContext, useEffect, useState } from 'react';

export interface NotificationItem {
  id: string;
  type: 'leitner' | 'sentence' | 'reminder';
  title: string;
  body: string;
  translation?: string;
  sourceLabel?: string;
}

export type ReminderTime = '09:00' | '14:00' | '20:00';
export type ContentSource = 'leitner' | 'sentences' | 'mixed';

interface NotificationContextType {
  studyReminderEnabled: boolean;
  setStudyReminderEnabled: (val: boolean) => void;
  studyReminderTime: ReminderTime;
  setStudyReminderTime: (time: ReminderTime) => void;
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
  studyReminderEnabled: true,
  setStudyReminderEnabled: () => {},
  studyReminderTime: '20:00',
  setStudyReminderTime: () => {},
  contentNotificationEnabled: true,
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
  const [studyReminderEnabled, setStudyReminderEnabledState] = useState(true);
  const [studyReminderTime, setStudyReminderTimeState] = useState<ReminderTime>('20:00');
  const [contentNotificationEnabled, setContentNotificationEnabledState] = useState(true);
  const [contentSource, setContentSourceState] = useState<ContentSource>('mixed');
  const [activeBanner, setActiveBanner] = useState<NotificationItem | null>(null);

  // بارگذاری تنظیمات واقعی از بک‌اند + ثبت توکن FCM، فقط وقتی کاربر لاگین کرده
  useEffect(() => {
    if (!isAuthenticated) return;
    (async () => {
      try {
        const settings = await notifApi.getNotificationSettings();
        setStudyReminderEnabledState(settings.daily_reminder_enabled);
        setStudyReminderTimeState(settings.daily_reminder_time as ReminderTime);
        setContentNotificationEnabledState(settings.content_notif_enabled);
        setContentSourceState(settings.content_source);
        if (settings.daily_reminder_enabled) {
          NativeNotificationService.scheduleDailyReminder(settings.daily_reminder_time as ReminderTime);
        }
      } catch (err) {
        console.warn('[NotificationContext] failed to load notification settings:', err);
      }
    })();
    PushNotificationService.init();
  }, [isAuthenticated]);

  const persist = (overrides: Partial<notifApi.NotificationSettings>) => {
    notifApi
      .updateNotificationSettings({
        daily_reminder_enabled: studyReminderEnabled,
        daily_reminder_time: studyReminderTime,
        content_notif_enabled: contentNotificationEnabled,
        content_source: contentSource,
        ...overrides,
      })
      .catch((err) => console.warn('[NotificationContext] failed to save settings:', err));
  };

  const setStudyReminderEnabled = (val: boolean) => {
    setStudyReminderEnabledState(val);
    if (val) NativeNotificationService.scheduleDailyReminder(studyReminderTime);
    persist({ daily_reminder_enabled: val });
  };

  const setStudyReminderTime = (time: ReminderTime) => {
    setStudyReminderTimeState(time);
    if (studyReminderEnabled) {
      NativeNotificationService.scheduleDailyReminder(time);
    }
    persist({ daily_reminder_time: time });
  };

  const setContentNotificationEnabled = (val: boolean) => {
    setContentNotificationEnabledState(val);
    persist({ content_notif_enabled: val });
  };

  const setContentSource = (source: ContentSource) => {
    setContentSourceState(source);
    persist({ content_source: source });
  };

  const dismissBanner = () => {
    setActiveBanner(null);
  };

  const triggerTestNotification = (item: NotificationItem) => {
    // Set in-app active banner
    setActiveBanner(item);

    // Also trigger native OS notification display
    NativeNotificationService.displayNotification(item);
  };

  return (
    <NotificationContext.Provider
      value={{
        studyReminderEnabled,
        setStudyReminderEnabled,
        studyReminderTime,
        setStudyReminderTime,
        contentNotificationEnabled,
        setContentNotificationEnabled,
        contentSource,
        setContentSource,
        activeBanner,
        dismissBanner,
        triggerTestNotification,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => useContext(NotificationContext);
