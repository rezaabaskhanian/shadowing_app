import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

// جعبه‌ی لایتنر ساده با ۵ سطح و زمان‌بندی مرور. در AsyncStorage ذخیره می‌شود
// تا با بستن/باز کردن اپ باقی بماند.
export const MAX_LEVEL = 5;
const STORAGE_KEY = '@leitner_box_v1';

const DAY = 24 * 60 * 60 * 1000;
// فاصله‌ی مرور بر اساس سطح (روز): هرچه سطح بالاتر، دیرتر دوباره پرسیده می‌شود
const LEVEL_INTERVAL_DAYS: Record<number, number> = { 1: 1, 2: 2, 3: 4, 4: 7, 5: 15 };

// موعد مرور بعدی برای یک سطح مشخص
export function nextReviewFor(level: number): number {
  const days = LEVEL_INTERVAL_DAYS[level] ?? 1;
  return Date.now() + days * DAY;
}

// آیا این واژه امروز سررسیده است؟
export function isDue(w: BoxWord): boolean {
  return (w.nextReview ?? 0) <= Date.now();
}

// برچسب موعد مرور بعدی (دوزبانه)
export function dueLabel(w: BoxWord, lang: 'en' | 'fa' = 'en'): string {
  const diff = (w.nextReview ?? 0) - Date.now();
  if (diff <= 0) return lang === 'fa' ? 'سررسیده' : 'Due now';
  const days = Math.ceil(diff / DAY);
  if (days === 1) return lang === 'fa' ? 'فردا' : 'Tomorrow';
  return lang === 'fa' ? `${days} روز دیگر` : `In ${days} days`;
}

export interface BoxWord {
  word: string;
  meaning: string;
  level: number; // 1..MAX_LEVEL
  addedAt: number;
  nextReview: number; // زمان (ms) موعد مرور بعدی
}

interface VocabContextValue {
  box: BoxWord[];
  has: (word: string) => boolean;
  add: (entry: { word: string; meaning: string }) => void;
  remove: (word: string) => void;
  promote: (word: string) => void; // بلد بودم → یک سطح بالاتر + موعد دیرتر
  demote: (word: string) => void; // بلد نبودم → برگشت به سطح ۱ + مرور زودتر
}

const VocabContext = createContext<VocabContextValue>({
  box: [],
  has: () => false,
  add: () => {},
  remove: () => {},
  promote: () => {},
  demote: () => {},
});

const key = (w: string) => w.trim().toLowerCase();

export const VocabProvider = ({ children }: { children: React.ReactNode }) => {
  const [box, setBox] = useState<BoxWord[]>([]);
  const loaded = useRef(false);

  // بارگذاری جعبه از حافظه‌ی دائمی هنگام شروع
  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) {
            // مهاجرت داده‌ی قدیمی که nextReview ندارد → سررسیده در نظر گرفته شود
            setBox(
              parsed.map((b: BoxWord) => ({
                ...b,
                nextReview: b.nextReview ?? Date.now(),
              }))
            );
          }
        }
      } catch {
        // اگر خواندن ناموفق بود، با جعبه‌ی خالی ادامه می‌دهیم
      } finally {
        loaded.current = true;
      }
    })();
  }, []);

  // ذخیره‌ی خودکار در هر تغییر (بعد از بارگذاری اولیه)
  useEffect(() => {
    if (!loaded.current) return;
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(box)).catch(() => {});
  }, [box]);

  const has = useCallback(
    (word: string) => box.some((b) => b.word === key(word)),
    [box]
  );

  const add = useCallback((entry: { word: string; meaning: string }) => {
    const w = key(entry.word);
    setBox((prev) => {
      if (prev.some((b) => b.word === w)) return prev;
      return [
        {
          word: w,
          meaning: entry.meaning,
          level: 1,
          addedAt: Date.now(),
          nextReview: Date.now(), // تازه‌اضافه‌شده → همین حالا سررسیده
        },
        ...prev,
      ];
    });
  }, []);

  const remove = useCallback((word: string) => {
    const w = key(word);
    setBox((prev) => prev.filter((b) => b.word !== w));
  }, []);

  const promote = useCallback((word: string) => {
    const w = key(word);
    setBox((prev) =>
      prev.map((b) => {
        if (b.word !== w) return b;
        const level = Math.min(MAX_LEVEL, b.level + 1);
        return { ...b, level, nextReview: nextReviewFor(level) };
      })
    );
  }, []);

  const demote = useCallback((word: string) => {
    const w = key(word);
    setBox((prev) =>
      prev.map((b) =>
        b.word === w ? { ...b, level: 1, nextReview: nextReviewFor(1) } : b
      )
    );
  }, []);

  const value = useMemo(
    () => ({ box, has, add, remove, promote, demote }),
    [box, has, add, remove, promote, demote]
  );

  return <VocabContext.Provider value={value}>{children}</VocabContext.Provider>;
};

export const useVocab = () => useContext(VocabContext);
