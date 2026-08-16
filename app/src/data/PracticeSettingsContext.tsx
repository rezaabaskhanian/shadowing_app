import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * تعداد دورهای خودکارِ هر مرحله‌ی تمرین (فقط مرحله‌های Listen و Shadow؛ ضبط و
 * مقایسه همیشه با سرعت خود کاربر پیش می‌روند).
 * مقدار ۰ یعنی «بی‌نهایت»: تا وقتی خود کاربر مرحله را عوض نکند تکرار می‌شود.
 */
export type RepeatsPerStep = 1 | 3 | 5 | 0;
export const REPEAT_OPTIONS: RepeatsPerStep[] = [1, 3, 5, 0];
export const DEFAULT_REPEATS: RepeatsPerStep = 3;

const STORAGE_KEY = 'practice_repeats_per_step';

interface PracticeSettingsContextType {
  repeatsPerStep: RepeatsPerStep;
  setRepeatsPerStep: (value: RepeatsPerStep) => void;
}

const PracticeSettingsContext = createContext<PracticeSettingsContextType>({
  repeatsPerStep: DEFAULT_REPEATS,
  setRepeatsPerStep: () => {},
});

export const PracticeSettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [repeatsPerStep, setRepeatsPerStepState] = useState<RepeatsPerStep>(DEFAULT_REPEATS);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        if (raw === null) return;
        const parsed = Number(raw) as RepeatsPerStep;
        if (REPEAT_OPTIONS.includes(parsed)) setRepeatsPerStepState(parsed);
      })
      .catch(() => {});
  }, []);

  const setRepeatsPerStep = (value: RepeatsPerStep) => {
    setRepeatsPerStepState(value);
    AsyncStorage.setItem(STORAGE_KEY, String(value)).catch(() => {});
  };

  return (
    <PracticeSettingsContext.Provider value={{ repeatsPerStep, setRepeatsPerStep }}>
      {children}
    </PracticeSettingsContext.Provider>
  );
};

export const usePracticeSettings = () => useContext(PracticeSettingsContext);
