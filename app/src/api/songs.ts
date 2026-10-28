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

/**
 * ضبط کاربر را روی موزیک بی‌کلامِ همان تکه می‌گذارد و mp3 (base64) برمی‌گرداند.
 * صدای کاربر روی سرور ذخیره نمی‌شود.
 */
export async function mixTake(params: {
  songId: string;
  filePath: string;
  offsetMs: number;
  durationMs: number;
}): Promise<string> {
  const uri = params.filePath.startsWith('file://') ? params.filePath : `file://${params.filePath}`;
  const form = new FormData();
  form.append('audio', { uri, name: 'take.m4a', type: 'audio/m4a' } as any);
  form.append('offset_ms', String(Math.round(params.offsetMs)));
  form.append('duration_ms', String(Math.round(params.durationMs)));
  const res = await authFetch(`/v1/songs/${params.songId}/mix`, { method: 'POST', body: form });
  const data = (await jsonOrThrow(res)) as { data: string };
  return data.data;
}
