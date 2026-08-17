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
import * as leitnerApi from '../api/leitner';
import type { BackendLeitnerWord } from '../api/leitner';

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
  // id فقط برای کلمه‌هایی که از سرور همگام شده‌اند پر می‌شود؛ برای
  // promote/demote/remove روی سرور لازم است.
  id?: string;
}

function fromBackend(w: BackendLeitnerWord): BoxWord {
  return {
    id: w.id,
    word: w.word,
    meaning: w.meaning,
    level: w.level,
    addedAt: w.created_at,
    nextReview: w.next_review,
  };
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
  // برای خوندن آخرین state داخل callback هایی که deps خالی دارن (برای پایدار
  // موندن رفرنس‌شون)، بدون نیاز به اضافه‌کردن box به deps.
  const boxRef = useRef<BoxWord[]>([]);
  useEffect(() => {
    boxRef.current = box;
  }, [box]);

  // بارگذاری جعبه: اول از حافظه‌ی محلی (نمایش فوری، بدون پرش)، بعد از سرور
  // (اگر آنلاین بودیم، منبع درست همیشه سرور است). دقیقاً همان الگوی
  // offline-first که ScenesContext برای صحنه‌ها استفاده می‌کند.
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

      try {
        const words = await leitnerApi.listWords();
        setBox(words.map(fromBackend));
      } catch {
        // آفلاین یا سرور در دسترس نیست — همون داده‌ی محلی می‌مونه
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

  // همه‌ی جهش‌ها (add/remove/promote/demote) اول state لوکال را فوری
  // (optimistic) آپدیت می‌کنند — تجربه‌ی کاربر هیچ‌وقت قفل شبکه نیست — و
  // موازی درخواست سرور را هم می‌فرستند؛ اگر سرور fail شد فقط لاگ می‌شود.
  const add = useCallback((entry: { word: string; meaning: string }) => {
    const w = key(entry.word);
    if (boxRef.current.some((b) => b.word === w)) return;
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
    leitnerApi
      .addWord(w, entry.meaning)
      .then((backendWord) => {
        setBox((prev) => prev.map((b) => (b.word === w ? fromBackend(backendWord) : b)));
      })
      .catch((err) => console.warn('[VocabContext] addWord failed:', err));
  }, []);

  const remove = useCallback((word: string) => {
    const w = key(word);
    const existing = boxRef.current.find((b) => b.word === w);
    setBox((prev) => prev.filter((b) => b.word !== w));
    if (existing?.id) {
      leitnerApi.removeWord(existing.id).catch((err) => console.warn('[VocabContext] removeWord failed:', err));
    }
  }, []);

  const promote = useCallback((word: string) => {
    const w = key(word);
    const existing = boxRef.current.find((b) => b.word === w);
    setBox((prev) =>
      prev.map((b) => {
        if (b.word !== w) return b;
        const level = Math.min(MAX_LEVEL, b.level + 1);
        return { ...b, level, nextReview: nextReviewFor(level) };
      })
    );
    if (existing?.id) {
      leitnerApi.promoteWord(existing.id).catch((err) => console.warn('[VocabContext] promoteWord failed:', err));
    }
  }, []);

  const demote = useCallback((word: string) => {
    const w = key(word);
    const existing = boxRef.current.find((b) => b.word === w);
    setBox((prev) =>
      prev.map((b) =>
        b.word === w ? { ...b, level: 1, nextReview: nextReviewFor(1) } : b
      )
    );
    if (existing?.id) {
      leitnerApi.demoteWord(existing.id).catch((err) => console.warn('[VocabContext] demoteWord failed:', err));
    }
  }, []);

  const value = useMemo(
    () => ({ box, has, add, remove, promote, demote }),
    [box, has, add, remove, promote, demote]
  );

  return <VocabContext.Provider value={value}>{children}</VocabContext.Provider>;
};

export const useVocab = () => useContext(VocabContext);
