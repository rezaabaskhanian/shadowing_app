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
  level: 'beginner' | 'intermediate' | 'advanced';
  audio_url: string;
  duration_seconds: number;
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
