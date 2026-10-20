import { authFetch, jsonOrThrow } from './client';

/** «پادکست»: گفتگوی کوتاه دو مجری با متن هم‌زمان (بک‌اند: podcastservice). */

export interface PodcastLine {
  id?: string;
  position: number;
  speaker: string;
  text: string;
  translation_fa: string;
  start_ms: number;
  end_ms: number;
}

export interface Podcast {
  id: string;
  title: string;
  description_fa: string;
  level: 'starter' | 'beginner' | 'intermediate' | 'advanced' | 'proficient';
  /** صحنه‌ای که پادکست درباره‌ی آن است (بعد از تمام شدن صحنه پیشنهاد می‌شود). */
  scene_id?: string;
  /** lesson = درسی، featured = منتخب (موضوع آزاد، بی‌ربط به درس‌ها). */
  kind?: 'lesson' | 'featured';
  audio_url: string;
  duration_seconds: number;
  /** تصویرِ پادکست، وگرنه تصویرِ صحنه‌ی مرتبط؛ خالی = بدون عکس. */
  cover_url?: string;
  /** عکس‌های اسلایدشوی هنگام پخش؛ from_line = جمله‌ای (از ۱) که عکس از آن دیده می‌شود، ۰ = خودکار. */
  images?: { url: string; from_line: number }[];
  line_count: number;
  vocabulary: { word: string; meaning_fa: string }[];
  lines: PodcastLine[];
}

export async function getPodcasts(): Promise<Podcast[]> {
  const res = await authFetch('/v1/podcasts', { method: 'GET' });
  return ((await jsonOrThrow(res)) as Podcast[]) || [];
}

export async function getPodcast(id: string): Promise<Podcast> {
  const res = await authFetch(`/v1/podcasts/${id}`, { method: 'GET' });
  return (await jsonOrThrow(res)) as Podcast;
}

const LEVEL_ORDER: Podcast['level'][] = ['starter', 'beginner', 'intermediate', 'advanced', 'proficient'];

/**
 * پادکست‌های منتخب برای سطح کاربر و یک سطح بالاتر (مثل اصطلاحات در لایتنر)؛
 * پادکست درسی دست نمی‌خورد. اگر چیزی برای این سطح‌ها نبود، همه برمی‌گردد.
 */
export function featuredForLevel(list: Podcast[], level?: string | null): Podcast[] {
  const i = LEVEL_ORDER.indexOf(level as Podcast['level']);
  if (i < 0) return list;
  const allowed = new Set(LEVEL_ORDER.slice(i, i + 2));
  const mine = list.filter((p) => p.kind !== 'featured' || allowed.has(p.level));
  return mine.some((p) => p.kind === 'featured') || !list.some((p) => p.kind === 'featured') ? mine : list;
}
