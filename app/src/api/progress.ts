import { authFetch, jsonOrThrow } from './client';

export interface UserStreak {
  current_streak: number;
  longest_streak: number;
  freezes: number;
  status: 'active' | 'broken' | string;
  next_milestone: number;
}

export interface UserSummary {
  streak: number;
  total_xp: number;
  level: number;
  level_name: string;
  total_achievements: number;
  completed_scenes: number;
  total_scenes: number;
  overall_progress: number;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary' | string;
  xp: number;
  unlocked_at: string;
}

export async function getUserStreak(userId: string): Promise<UserStreak> {
  const res = await authFetch(`/v1/progress/streak/${userId}`, { method: 'GET' });
  return (await jsonOrThrow(res)) as UserStreak;
}

export async function getUserSummary(userId: string): Promise<UserSummary> {
  const res = await authFetch(`/v1/progress/summary/${userId}`, { method: 'GET' });
  return (await jsonOrThrow(res)) as UserSummary;
}

export async function getUserAchievements(userId: string): Promise<Achievement[]> {
  const res = await authFetch(`/v1/progress/achievements/${userId}`, { method: 'GET' });
  const data = await jsonOrThrow(res);
  return (data.achievements || []) as Achievement[];
}

export interface DayActivity {
  date: string; // "2006-01-02"
  minutes: number;
  sessions: number;
}

export async function getWeeklyActivity(): Promise<DayActivity[]> {
  const res = await authFetch('/v1/progress/weekly-activity', { method: 'GET' });
  const data = await jsonOrThrow(res);
  return (data.days || []) as DayActivity[];
}

export interface SkillsBreakdown {
  pronunciation: number;
  fluency: number;
  vocabulary: number;
  grammar: number;
}

export async function getSkillsBreakdown(): Promise<SkillsBreakdown> {
  const res = await authFetch('/v1/progress/skills', { method: 'GET' });
  return (await jsonOrThrow(res)) as SkillsBreakdown;
}

export interface WeekTrend {
  week_start: string; // "2006-01-02"
  speaking: number; // 0-100
  sessions: number;
}

export async function getProgressTrend(): Promise<WeekTrend[]> {
  const res = await authFetch('/v1/progress/trend', { method: 'GET' });
  const data = await jsonOrThrow(res);
  return (data.weeks || []) as WeekTrend[];
}

export interface SceneProgressUpdate {
  scene_id: string;
  progress: number;
  is_completed: boolean;
  total_xp: number;
}

/**
 * ثبت یک جمله‌ی کامل‌شده (ضبط + نمره‌ی مقایسه) برای پیشرفت صحنه.
 *
 * مسیر نمره‌دهیِ اپ (/v1/shadowing/evaluate) بدون session است و خودش پیشرفت
 * صحنه را ثبت نمی‌کند، برای همین صحنه بدون این فراخوانی هیچ‌وقت در لیست خانه
 * تیک نمی‌خورد. سمت سرور idempotent است، پس تکرارش بی‌خطر است.
 */
export async function recordDialogueProgress(params: {
  sceneId: string;
  dialogueId: string;
  score: number;
  /** متن این جمله در مرحله‌ی ضبط نمایش داده شده؛ در این صورت XP جمله داده نمی‌شود. */
  textRevealed?: boolean;
}): Promise<SceneProgressUpdate> {
  const res = await authFetch('/v1/progress/dialogue', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      scene_id: params.sceneId,
      dialogue_id: params.dialogueId,
      score: params.score,
      text_revealed: !!params.textRevealed,
    }),
  });
  return (await jsonOrThrow(res)) as SceneProgressUpdate;
}
