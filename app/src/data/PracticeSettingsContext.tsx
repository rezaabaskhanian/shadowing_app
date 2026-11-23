import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
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

/**
 * سبک تمرین شادوئینگ:
 *  - smart_flow: جریان پیوسته و هوشمند (شنیدن ➔ اکو و سایه‌زنی ➔ نمره آنی و جمله بعدی در یک چرخه روان)
 *  - classic_steps: روش سنتی با تب‌های ۴گانه دستی (Listen / Shadow / Record / Compare)
 */
export type PracticeFlowMode = 'smart_flow' | 'classic_steps';
export const DEFAULT_FLOW_MODE: PracticeFlowMode = 'smart_flow';

/** پالت رنگ‌های مجاز برای هایلایتِ کلمه‌به‌کلمه؛ کاربر از پروفایل انتخاب می‌کند. */
export const HIGHLIGHT_COLOR_OPTIONS: string[] = [
  COLORS.primary, // نارنجی (پیش‌فرض)
  COLORS.tertiary, // green
  COLORS.secondary, // gold
  '#ba1a1a', // red
  '#1F2937', // charcoal
  '#0891b2', // teal
];
export const DEFAULT_HIGHLIGHT_COLOR: string = COLORS.primary;

const STORAGE_KEY = 'practice_repeats_per_step';
const TEXT_DISPLAY_MODE_KEY = 'practice_text_display_mode';
const HIGHLIGHT_COLOR_KEY = 'practice_highlight_color';
const FLOW_MODE_KEY = 'practice_flow_mode';
const PROSODY_GUIDE_KEY = 'practice_show_prosody_guide';

interface PracticeSettingsContextType {
  repeatsPerStep: RepeatsPerStep;
  setRepeatsPerStep: (value: RepeatsPerStep) => void;
  textDisplayMode: TextDisplayMode;
  setTextDisplayMode: (value: TextDisplayMode) => void;
  highlightColor: string;
  setHighlightColor: (value: string) => void;
  flowMode: PracticeFlowMode;
  setFlowMode: (value: PracticeFlowMode) => void;
  showProsodyGuide: boolean;
  setShowProsodyGuide: (value: boolean) => void;
}

const PracticeSettingsContext = createContext<PracticeSettingsContextType>({
  repeatsPerStep: DEFAULT_REPEATS,
  setRepeatsPerStep: () => {},
  textDisplayMode: DEFAULT_TEXT_DISPLAY_MODE,
  setTextDisplayMode: () => {},
  highlightColor: DEFAULT_HIGHLIGHT_COLOR,
  setHighlightColor: () => {},
  flowMode: DEFAULT_FLOW_MODE,
  setFlowMode: () => {},
  showProsodyGuide: true,
  setShowProsodyGuide: () => {},
});

export const PracticeSettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [repeatsPerStep, setRepeatsPerStepState] = useState<RepeatsPerStep>(DEFAULT_REPEATS);
  const [textDisplayMode, setTextDisplayModeState] = useState<TextDisplayMode>(DEFAULT_TEXT_DISPLAY_MODE);
  const [highlightColor, setHighlightColorState] = useState<string>(DEFAULT_HIGHLIGHT_COLOR);
  const [flowMode, setFlowModeState] = useState<PracticeFlowMode>(DEFAULT_FLOW_MODE);
  const [showProsodyGuide, setShowProsodyGuideState] = useState<boolean>(true);

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

    AsyncStorage.getItem(PROSODY_GUIDE_KEY)
      .then((raw) => {
        if (raw !== null) {
          setShowProsodyGuideState(raw === 'true');
        }
      })
      .catch(() => {});

    // پیش‌فرض باز شدن اپلیکیشن همیشه روی سایه‌زنی هوشمند باشد
    AsyncStorage.getItem(FLOW_MODE_KEY)
      .then((raw) => {
        if (raw === 'smart_flow') {
          setFlowModeState('smart_flow');
        } else {
          // پیش‌فرض در شروع همیشه سایه‌زنی هوشمند است
          setFlowModeState('smart_flow');
          AsyncStorage.setItem(FLOW_MODE_KEY, 'smart_flow').catch(() => {});
        }
      })
      .catch(() => {
        setFlowModeState('smart_flow');
      });
  }, []);

  const setRepeatsPerStep = useCallback((value: RepeatsPerStep) => {
    setRepeatsPerStepState(value);
    AsyncStorage.setItem(STORAGE_KEY, String(value)).catch(() => {});
  }, []);

  const setTextDisplayMode = useCallback((value: TextDisplayMode) => {
    setTextDisplayModeState(value);
    AsyncStorage.setItem(TEXT_DISPLAY_MODE_KEY, value).catch(() => {});
  }, []);

  const setHighlightColor = useCallback((value: string) => {
    setHighlightColorState(value);
    AsyncStorage.setItem(HIGHLIGHT_COLOR_KEY, value).catch(() => {});
  }, []);

  const setFlowMode = useCallback((value: PracticeFlowMode) => {
    setFlowModeState(value);
    AsyncStorage.setItem(FLOW_MODE_KEY, value).catch(() => {});
  }, []);

  const setShowProsodyGuide = useCallback((value: boolean) => {
    setShowProsodyGuideState(value);
    AsyncStorage.setItem(PROSODY_GUIDE_KEY, String(value)).catch(() => {});
  }, []);

  const value = useMemo<PracticeSettingsContextType>(
    () => ({
      repeatsPerStep,
      setRepeatsPerStep,
      textDisplayMode,
      setTextDisplayMode,
      highlightColor,
      setHighlightColor,
      flowMode,
      setFlowMode,
      showProsodyGuide,
      setShowProsodyGuide,
    }),
    [
      repeatsPerStep,
      setRepeatsPerStep,
      textDisplayMode,
      setTextDisplayMode,
      highlightColor,
      setHighlightColor,
      flowMode,
      setFlowMode,
      showProsodyGuide,
      setShowProsodyGuide,
    ]
  );

  return (
    <PracticeSettingsContext.Provider value={value}>
      {children}
    </PracticeSettingsContext.Provider>
  );
};

export const usePracticeSettings = () => useContext(PracticeSettingsContext);
