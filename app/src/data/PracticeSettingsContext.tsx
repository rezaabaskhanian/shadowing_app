import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { COLORS } from '../theme/colors';

/**
 * تعداد دورهای خودکارِ هر مرحله‌ی تمرین (فقط مرحله‌های Listen و Shadow؛ ضبط و
 * مقایسه همیشه با سرعت خود کاربر پیش می‌روند).
 * مقدار ۰ یعنی «بی‌نهایت»: تا وقتی خود کاربر مرحله را عوض نکند تکرار می‌شود.
 */
export type RepeatsPerStep = 1 | 3 | 5 | 0;
export const REPEAT_OPTIONS: RepeatsPerStep[] = [1, 3, 5, 0];
export const DEFAULT_REPEATS: RepeatsPerStep = 3;

/**
 * جمله در حالت تمرین یا داخل حباب بالای شخصیت نشان داده می‌شود یا داخل کارت
 * پایین — هرگز هر دو با هم، چون تکرار محتوا و شلوغی بصری ایجاد می‌کند.
 */
export type TextDisplayMode = 'bubble' | 'card';
export const DEFAULT_TEXT_DISPLAY_MODE: TextDisplayMode = 'card';

/** پالت رنگ‌های مجاز برای هایلایتِ کلمه‌به‌کلمه؛ کاربر از پروفایل انتخاب می‌کند. */
export const HIGHLIGHT_COLOR_OPTIONS: string[] = [
  COLORS.primary, // indigo (پیش‌فرض)
  COLORS.tertiary, // green
  COLORS.secondary, // gold
  '#ba1a1a', // red
  '#8b5cf6', // purple
  '#0891b2', // teal
];
export const DEFAULT_HIGHLIGHT_COLOR: string = COLORS.primary;

const STORAGE_KEY = 'practice_repeats_per_step';
const TEXT_DISPLAY_MODE_KEY = 'practice_text_display_mode';
const HIGHLIGHT_COLOR_KEY = 'practice_highlight_color';

interface PracticeSettingsContextType {
  repeatsPerStep: RepeatsPerStep;
  setRepeatsPerStep: (value: RepeatsPerStep) => void;
  textDisplayMode: TextDisplayMode;
  setTextDisplayMode: (value: TextDisplayMode) => void;
  highlightColor: string;
  setHighlightColor: (value: string) => void;
}

const PracticeSettingsContext = createContext<PracticeSettingsContextType>({
  repeatsPerStep: DEFAULT_REPEATS,
  setRepeatsPerStep: () => {},
  textDisplayMode: DEFAULT_TEXT_DISPLAY_MODE,
  setTextDisplayMode: () => {},
  highlightColor: DEFAULT_HIGHLIGHT_COLOR,
  setHighlightColor: () => {},
});

export const PracticeSettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [repeatsPerStep, setRepeatsPerStepState] = useState<RepeatsPerStep>(DEFAULT_REPEATS);
  const [textDisplayMode, setTextDisplayModeState] = useState<TextDisplayMode>(DEFAULT_TEXT_DISPLAY_MODE);
  const [highlightColor, setHighlightColorState] = useState<string>(DEFAULT_HIGHLIGHT_COLOR);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        if (raw === null) return;
        const parsed = Number(raw) as RepeatsPerStep;
        if (REPEAT_OPTIONS.includes(parsed)) setRepeatsPerStepState(parsed);
      })
      .catch(() => {});

    AsyncStorage.getItem(TEXT_DISPLAY_MODE_KEY)
      .then((raw) => {
        if (raw === 'bubble' || raw === 'card') setTextDisplayModeState(raw);
      })
      .catch(() => {});

    AsyncStorage.getItem(HIGHLIGHT_COLOR_KEY)
      .then((raw) => {
        if (raw && HIGHLIGHT_COLOR_OPTIONS.includes(raw)) setHighlightColorState(raw);
      })
      .catch(() => {});
  }, []);

  const setRepeatsPerStep = (value: RepeatsPerStep) => {
    setRepeatsPerStepState(value);
    AsyncStorage.setItem(STORAGE_KEY, String(value)).catch(() => {});
  };

  const setTextDisplayMode = (value: TextDisplayMode) => {
    setTextDisplayModeState(value);
    AsyncStorage.setItem(TEXT_DISPLAY_MODE_KEY, value).catch(() => {});
  };

  const setHighlightColor = (value: string) => {
    setHighlightColorState(value);
    AsyncStorage.setItem(HIGHLIGHT_COLOR_KEY, value).catch(() => {});
  };

  return (
    <PracticeSettingsContext.Provider
      value={{
        repeatsPerStep,
        setRepeatsPerStep,
        textDisplayMode,
        setTextDisplayMode,
        highlightColor,
        setHighlightColor,
      }}
    >
      {children}
    </PracticeSettingsContext.Provider>
  );
};

export const usePracticeSettings = () => useContext(PracticeSettingsContext);
