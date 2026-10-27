import { authFetch, jsonOrThrow } from './client';

/** «آهنگ»: آهنگ آماده با متن خط‌به‌خطِ هم‌زمان (بک‌اند: songservice). */

export interface SongLine {
  text: string;
  translation_fa: string;
  start_ms: number;
  end_ms: number;
}

export interface Song {
  id: string;
  title: string;
  artist: string;
  description_fa: string;
  level: 'starter' | 'beginner' | 'intermediate' | 'advanced' | 'proficient';
  cover_url: string;
  audio_url: string;
  /** نسخه‌ی بی‌کلام برای «با آهنگ بخوان»؛ خالی = همان آهنگ اصلی زیر صدای کاربر. */
  instrumental_url: string;
  duration_seconds: number;
  line_count?: number;
  /** فقط در getSong پر است. */
  lines?: SongLine[];
  vocabulary?: { word: string; meaning_fa: string }[];
}

export async function getSongs(): Promise<Song[]> {
  return (await jsonOrThrow(await authFetch('/v1/songs', { method: 'GET' }))) || [];
}

export async function getSong(id: string): Promise<Song> {
  return jsonOrThrow(await authFetch(`/v1/songs/${id}`, { method: 'GET' }));
}
