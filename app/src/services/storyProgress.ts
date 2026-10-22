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
