import { authFetch, jsonOrThrow } from './client';

export interface HabitActivity {
  id: string;
  code: string;
  name_en: string;
  name_fa: string;
  icon: string;
}

export interface HabitDialogueLine {
  order: number;
  speaker: string;
  original_text: string;
}

export type HabitMissionType = 'real_life';

export interface HabitMission {
  mission_id: string;
  hotspot_id: string;
  mission_type: HabitMissionType;
  status: string;
  activity: HabitActivity;
  dialogues: HabitDialogueLine[];
  estimated_duration_seconds: number;
}

export interface HabitMissionResult {
  mission_id: string;
  transcript: string;
  matched_sentences: number;
  total_sentences: number;
  matched_words: number;
  total_words: number;
  accuracy: number;
  duration_seconds: number;
  streak: number;
  total_xp: number;
  new_achievements: string[];
  message: string;
  speech_evaluated: boolean;
}

export interface HabitHistoryMission {
  mission_id: string;
  hotspot_id: string;
  mission_type: string;
  status: string;
  duration_seconds: number;
  completed_at?: string;
}

export interface HabitHistory {
  completed_count: number;
  total_duration_seconds: number;
  current_streak: number;
  missions: HabitHistoryMission[];
}

export async function listHabitActivities(): Promise<HabitActivity[]> {
  const res = await authFetch('/v1/habit/activities', { method: 'GET' });
  const data = await jsonOrThrow(res);
  return (data.activities || []) as HabitActivity[];
}

export async function getTodayMission(): Promise<HabitMission | null> {
  const res = await authFetch('/v1/habit/missions/today', { method: 'GET' });
  const data = await jsonOrThrow(res);
  return (data as HabitMission) || null;
}

export async function startMission(missionId: string): Promise<void> {
  const res = await authFetch(`/v1/habit/missions/${missionId}/start`, { method: 'POST' });
  await jsonOrThrow(res);
}

/** از پسوند فایل، mime-type مناسب برای فیلد فرم می‌سازد (مشابه api/shadowing.ts). */
const extensionForMime = (mimeType: string) => {
  if (mimeType.includes('webm')) return 'webm';
  if (mimeType.includes('ogg')) return 'ogg';
  if (mimeType.includes('wav')) return 'wav';
  if (mimeType.includes('mpeg') || mimeType.includes('mp3')) return 'mp3';
  return 'm4a';
};

export async function submitMissionSession(
  missionId: string,
  audioUri: string,
  durationSeconds: number,
  mimeType: string = 'audio/m4a'
): Promise<HabitMissionResult> {
  const uri = audioUri.startsWith('file://') ? audioUri : `file://${audioUri}`;

  const form = new FormData();
  form.append('audio', {
    uri,
    name: `habit_session.${extensionForMime(mimeType)}`,
    type: mimeType,
  } as any);
  form.append('duration', String(Math.max(1, Math.round(durationSeconds))));

  const res = await authFetch(`/v1/habit/missions/${missionId}/session`, {
    method: 'POST',
    body: form,
  });
  const data = await jsonOrThrow(res);
  return data as HabitMissionResult;
}

export async function getHabitHistory(): Promise<HabitHistory> {
  const res = await authFetch('/v1/habit/history', { method: 'GET' });
  return (await jsonOrThrow(res)) as HabitHistory;
}
