import React, { createContext, useContext, useEffect, useState } from 'react';
import { SCENARIOS } from './scenarios';

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
  triggerTestNotification: (overrideSource?: ContentSource) => void;
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

// Sample pool of sentences from scenarios for fallback
const SAMPLE_SENTENCES = [
  { text: 'Excuse me, do you work here?', translation: 'ببخشید، شما اینجا کار می‌کنید؟', scene: 'Supermarket' },
  { text: 'I would like a hot cappuccino with milk, please.', translation: 'یک کاپوچینوی داغ با شیر می‌خواهم، لطفاً.', scene: 'Coffee Shop' },
  { text: 'Where can I find organic green apples?', translation: 'سیب‌های سبز ارگانیک را کجا می‌توانم پیدا کنم؟', scene: 'Supermarket' },
  { text: 'Could you give me the wifi password?', translation: 'می‌توانید رمز وای‌فای را به من بدهید؟', scene: 'Cafe' },
  { text: 'How much is this tuna can on sale?', translation: 'قیمت این تن ماهی در تخفیف چقدر است؟', scene: 'Supermarket' },
];

const SAMPLE_LEITNER_WORDS = [
  { word: 'Hotspot', translation: 'موقعیت حساس / نقطه تمرکز', level: 'Level 2' },
  { word: 'Shadowing', translation: 'تمرین سایه‌زنی و تکرار همزمان', level: 'Level 3' },
  { word: 'Cappuccino', translation: 'قهوه اسپرسو با کف شیر', level: 'Level 1' },
  { word: 'Organic', translation: 'ارگانیک و طبیعی', level: 'Level 4' },
  { word: 'Fluency', translation: 'روانی کلام و صحبت روان', level: 'Level 2' },
];

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

  const triggerTestNotification = (overrideSource?: ContentSource) => {
    const source = overrideSource || contentSource;
    let selectedType: 'leitner' | 'sentence' = 'sentence';

    if (source === 'leitner') {
      selectedType = 'leitner';
    } else if (source === 'sentences') {
      selectedType = 'sentence';
    } else {
      selectedType = Math.random() > 0.5 ? 'leitner' : 'sentence';
    }

    let notificationItem: NotificationItem;

    if (selectedType === 'leitner') {
      const randomWord = SAMPLE_LEITNER_WORDS[Math.floor(Math.random() * SAMPLE_LEITNER_WORDS.length)];
      notificationItem = {
        id: Date.now().toString(),
        type: 'leitner',
        title: `📚 Leitner Word Review (${randomWord.level})`,
        body: `${randomWord.word}`,
        translation: randomWord.translation,
        sourceLabel: 'Leitner Box',
      };
    } else {
      const randomSentence = SAMPLE_SENTENCES[Math.floor(Math.random() * SAMPLE_SENTENCES.length)];
      notificationItem = {
        id: Date.now().toString(),
        type: 'sentence',
        title: `🎙 Lesson Shadowing (${randomSentence.scene})`,
        body: `"${randomSentence.text}"`,
        translation: randomSentence.translation,
        sourceLabel: 'Lesson Scenario',
      };
    }

    // Set in-app active banner
    setActiveBanner(notificationItem);

    // Also trigger native OS notification display
    NativeNotificationService.displayNotification(notificationItem);
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
