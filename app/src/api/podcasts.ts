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

export interface StoryQuestion {
  q: string;
  q_fa: string;
  options: string[];
  answer: number;
}

export interface Podcast {
  id: string;
  title: string;
  description_fa: string;
  level: 'starter' | 'beginner' | 'intermediate' | 'advanced' | 'proficient';
  /** صحنه‌ای که پادکست درباره‌ی آن است (بعد از تمام شدن صحنه پیشنهاد می‌شود). */
  scene_id?: string;
  /** lesson = درسی، featured = منتخب (موضوع آزاد، بی‌ربط به درس‌ها)، story = فصلی از داستانِ بخش خواندن. */
  kind?: 'lesson' | 'featured' | 'story';
  /** فقط story: عنوان داستان، شماره‌ی فصل و سؤال‌های فهم آخر فصل. */
  series_title?: string;
  chapter_no?: number;
  questions?: StoryQuestion[];
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

/** فصل‌های داستانِ بخش خواندن (همان ساختار پادکست با kind = story). */
export async function getStories(): Promise<Podcast[]> {
  const res = await authFetch('/v1/podcasts/stories', { method: 'GET' });
  return ((await jsonOrThrow(res)) as Podcast[]) || [];
}

export async function getPodcast(id: string): Promise<Podcast> {
  const res = await authFetch(`/v1/podcasts/${id}`, { method: 'GET' });
  return (await jsonOrThrow(res)) as Podcast;
}

const LEVEL_ORDER: Podcast['level'][] = ['starter', 'beginner', 'intermediate', 'advanced', 'proficient'];

/**
 * فقط محتوای سطح کاربر و سطح‌های پایین‌تر؛ سطح بالاتر هرگز نشان داده نمی‌شود
 * (متنِ سخت‌تر از سطح، فهم زیر ۹۵٪ و دلسردی می‌آورد). سطح نامعلوم = همه.
 */
export function atOrBelowLevel<T extends { level: string }>(list: T[], level?: string | null): T[] {
  const i = LEVEL_ORDER.indexOf(level as Podcast['level']);
  if (i < 0) return list;
  const allowed = new Set<string>(LEVEL_ORDER.slice(0, i + 1));
  return list.filter((item) => allowed.has(item.level));
}

/** پادکست‌های منتخب فقط تا سطح کاربر؛ پادکست درسی دست نمی‌خورد. */
export function featuredForLevel(list: Podcast[], level?: string | null): Podcast[] {
  const allowed = new Set(atOrBelowLevel(list.filter((p) => p.kind === 'featured'), level).map((p) => p.id));
  return list.filter((p) => p.kind !== 'featured' || allowed.has(p.id));
}
