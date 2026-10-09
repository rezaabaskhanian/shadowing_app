import { authFetch, jsonOrThrow } from './client';

/**
 * «تمرین با ویدیو»: کلیپ‌های کوتاه (ساخته‌شده با Google Flow یا تکه‌ای از
 * فیلم‌های معروف) با دیالوگ‌های زمان‌بندی‌شده (بک‌اند: videoclipservice).
 */

export type ClipLevel = 'beginner' | 'intermediate' | 'advanced';

export interface VideoClipLine {
  id?: string;
  position: number;
  speaker: string;
  text: string;
  translation_fa: string;
  start_ms: number;
  end_ms: number;
}

export interface VideoClipQuestion {
  question_fa: string;
  options: string[];
  answer_index: number;
}

export interface VideoClip {
  id: string;
  title: string;
  description_fa: string;
  source: 'flow' | 'movie' | string;
  video_url: string;
  poster_url: string;
  level: ClipLevel;
  duration_seconds: number;
  questions: VideoClipQuestion[];
  lines: VideoClipLine[];
}

export interface VideoClipListItem extends VideoClip {
  speaker_count: number;
  attempts: number;
  best_score: number;
}

export async function getVideoClips(): Promise<VideoClipListItem[]> {
  const res = await authFetch('/v1/video-clips', { method: 'GET' });
  return ((await jsonOrThrow(res)) as VideoClipListItem[]) || [];
}

export async function getVideoClip(id: string): Promise<VideoClip> {
  const res = await authFetch(`/v1/video-clips/${id}`, { method: 'GET' });
  return (await jsonOrThrow(res)) as VideoClip;
}

export async function recordVideoClipAttempt(id: string, speaker: string, score: number): Promise<void> {
  const res = await authFetch(`/v1/video-clips/${id}/attempts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ speaker, score: Math.round(score) }),
  });
  await jsonOrThrow(res);
}
