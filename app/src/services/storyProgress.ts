import AsyncStorage from '@react-native-async-storage/async-storage';

import type { Podcast } from '../api/podcasts';

/**
 * پیشرفتِ بخش خواندن: کدام فصل‌ها خوانده شده‌اند (روی همین گوشی). فصل وقتی
 * «خوانده» حساب می‌شود که کاربر به سؤال‌های آخرش جواب بدهد یا تا آخر برود.
 */
const KEY = 'story_read_chapters_v1';

export async function getReadChapters(): Promise<Set<string>> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    return new Set(raw ? (JSON.parse(raw) as string[]) : []);
  } catch {
    return new Set();
  }
}

export async function markChapterRead(id: string): Promise<void> {
  const read = await getReadChapters();
  if (read.has(id)) return;
  read.add(id);
  try {
    await AsyncStorage.setItem(KEY, JSON.stringify([...read]));
  } catch {
    // ذخیره نشد؛ دفعه‌ی بعد دوباره علامت می‌خورد.
  }
}

export interface StorySeries {
  title: string;
  level: Podcast['level'];
  cover_url?: string;
  description_fa: string;
  chapters: Podcast[];
  readCount: number;
  /** اولین فصلِ نخوانده (یا فصل آخر اگر همه خوانده شده). */
  next: Podcast;
}

/** فصل‌ها را بر اساس عنوان داستان گروه می‌کند، به ترتیب شماره‌ی فصل. */
export function groupStories(chapters: Podcast[], read: Set<string>): StorySeries[] {
  const bySeries = new Map<string, Podcast[]>();
  for (const c of chapters) {
    const key = c.series_title || c.title;
    bySeries.set(key, [...(bySeries.get(key) ?? []), c]);
  }
  return [...bySeries.entries()].map(([title, list]) => {
    const sorted = [...list].sort((a, b) => (a.chapter_no ?? 0) - (b.chapter_no ?? 0));
    const readCount = sorted.filter((c) => read.has(c.id)).length;
    return {
      title,
      level: sorted[0].level,
      cover_url: sorted.find((c) => !!c.cover_url)?.cover_url,
      description_fa: sorted[0].description_fa,
      chapters: sorted,
      readCount,
      next: sorted.find((c) => !read.has(c.id)) ?? sorted[sorted.length - 1],
    };
  });
}

// ---------- سرعت خواندن بی‌صدا (B1 به بالا) ----------

const SPEED_KEY = 'story_reading_speed_v1';
const SPEED_HISTORY = 30;

export interface ReadingSpeed {
  wpm: number;
  /** میانگین چند بارِ قبلی (بدون همین بار)؛ null یعنی اولین اندازه‌گیری. */
  previousAvg: number | null;
}

/**
 * سرعت خواندن یک فصل را ثبت می‌کند و میانگین قبلی را برمی‌گرداند تا کاربر
 * پیشرفتش را ببیند. اندازه‌های غیرواقعی (ورق زدن سریع یا رها کردن صفحه) ثبت نمی‌شوند.
 */
export async function recordReadingSpeed(words: number, seconds: number): Promise<ReadingSpeed | null> {
  if (seconds < 20 || seconds > 30 * 60) return null;
  const wpm = Math.round((words / seconds) * 60);
  if (wpm < 20 || wpm > 500) return null;
  let history: number[] = [];
  try {
    const raw = await AsyncStorage.getItem(SPEED_KEY);
    history = raw ? (JSON.parse(raw) as number[]) : [];
  } catch {
    history = [];
  }
  const recent = history.slice(-5);
  const previousAvg = recent.length ? Math.round(recent.reduce((a, b) => a + b, 0) / recent.length) : null;
  try {
    await AsyncStorage.setItem(SPEED_KEY, JSON.stringify([...history, wpm].slice(-SPEED_HISTORY)));
  } catch {
    // ذخیره نشد؛ فقط مقایسه‌ی دفعه‌ی بعد از دست می‌رود.
  }
  return { wpm, previousAvg };
}
