import { authFetch, jsonOrThrow } from './client';

/**
 * «دوره‌ی شروع» برای مبتدی‌مبتدی‌ها: فصل ← درس ← کارت (بک‌اند: courseservice).
 */

export interface CourseItem {
  id?: string;
  position: number;
  text_en: string;
  meaning_fa: string;
  emoji: string;
  image_url: string;
  audio_url: string;
  tip_fa: string;
}

export interface CourseLesson {
  id: string;
  unit_id: string;
  title_fa: string;
  title_en: string;
  emoji: string;
  goal_fa: string;
  position: number;
  item_count: number;
  stars: number;
  completed: boolean;
  unlocked: boolean;
  items?: CourseItem[];
}

export interface CourseUnit {
  id: string;
  title_fa: string;
  title_en: string;
  emoji: string;
  description_fa: string;
  lessons: CourseLesson[];
}

export async function getCourse(): Promise<CourseUnit[]> {
  const res = await authFetch('/v1/course', { method: 'GET' });
  return ((await jsonOrThrow(res)) as CourseUnit[]) || [];
}

export async function getCourseLesson(id: string): Promise<CourseLesson> {
  const res = await authFetch(`/v1/course/lessons/${id}`, { method: 'GET' });
  return (await jsonOrThrow(res)) as CourseLesson;
}

export async function completeCourseLesson(id: string, score: number): Promise<number> {
  const res = await authFetch(`/v1/course/lessons/${id}/complete`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ score: Math.round(score) }),
  });
  const data = (await jsonOrThrow(res)) as { stars: number };
  return data.stars;
}
