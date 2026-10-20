import { authFetch, jsonOrThrow } from './client';

/**
 * «مسیر آموزشی» اختیاری (بک‌اند: pathservice): مسیر هر سطح ← هفته‌ها ← جلسه‌ها
 * ← قدم‌ها، و یک Checkpoint آخر هر هفته. جلسه‌ها با انجام دادن باز می‌شوند.
 */

export type PathItemKind =
  | 'scene'
  | 'podcast'
  | 'video_clip'
  | 'speaking_topic'
  | 'writing'
  | 'leitner_review'
  | 'weak_lines'
  | 'checkpoint'
  | 'habit_mission'
  | 'dictation'
  | 'self_intro'
  | 'verb'
  | 'idioms';

export interface PathItem {
  key: string;
  kind: PathItemKind;
  ref_id?: string;
  title?: string;
  required: boolean;
  minutes?: number;
  note_fa?: string;
  done: boolean;
}

export interface PathSession {
  no: number;
  title_fa: string;
  items: PathItem[];
  done: boolean;
  unlocked: boolean;
}

export interface PathWeek {
  id: string;
  position: number;
  title_fa: string;
  goal_fa: string;
  can_do: string[];
  sessions: PathSession[];
  is_free: boolean;
  /** سطح تقریبی CEFR هفته (A1، A2، …)؛ نبودنش یعنی برچسب نشان داده نشود. */
  cefr?: string;
  unlocked: boolean;
  done: boolean;
  checkpoint_done: boolean;
  best_score?: number;
}

export interface LearningPath {
  id: string;
  level: string;
  title_fa: string;
  description_fa: string;
  goal_fa: string;
  weeks?: PathWeek[];
}

export interface PathNextStep {
  week_id: string;
  week_position: number;
  week_title_fa: string;
  session_no: number;
  session_title_fa: string;
  is_checkpoint: boolean;
}

export interface PathSummary extends LearningPath {
  weeks_total: number;
  weeks_done: number;
  started: boolean;
  next?: PathNextStep;
}

export async function getPaths(): Promise<PathSummary[]> {
  const res = await authFetch('/v1/paths', { method: 'GET' });
  return ((await jsonOrThrow(res)) as PathSummary[]) || [];
}

export async function getPath(level: string): Promise<LearningPath> {
  const res = await authFetch(`/v1/paths/${encodeURIComponent(level)}`, { method: 'GET' });
  return (await jsonOrThrow(res)) as LearningPath;
}

export async function completePathItem(weekId: string, key: string): Promise<void> {
  const res = await authFetch(`/v1/paths/weeks/${weekId}/items/${encodeURIComponent(key)}/complete`, {
    method: 'POST',
  });
  await jsonOrThrow(res);
}

// ---------- قبل و بعد ----------

export type SelfIntroStage = 'before' | 'after';

/** آمار یک ضبط «قبل» یا «بعد»؛ خودِ صدا فقط روی گوشی است. */
export interface SelfIntro {
  stage: SelfIntroStage;
  transcript: string;
  duration_seconds: number;
  word_count: number;
  unique_words: number;
  created_at: string;
}

export type SelfIntros = Partial<Record<SelfIntroStage, SelfIntro>>;

export async function getSelfIntros(level: string): Promise<SelfIntros> {
  const res = await authFetch(`/v1/paths/${encodeURIComponent(level)}/self-intro`, { method: 'GET' });
  return ((await jsonOrThrow(res)) as SelfIntros) || {};
}

export async function saveSelfIntro(
  level: string,
  stage: SelfIntroStage,
  transcript: string,
  durationSeconds: number
): Promise<SelfIntros> {
  const res = await authFetch(`/v1/paths/${encodeURIComponent(level)}/self-intro/${stage}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ transcript, duration_seconds: Math.round(durationSeconds) }),
  });
  return ((await jsonOrThrow(res)) as SelfIntros) || {};
}

// ---------- Checkpoint ----------

export interface ChoiceQuestion {
  prompt_fa: string;
  options: string[];
  answer: number;
}

export interface OrderQuestion {
  words: string[];
  answer: string;
}

export interface ListeningLine {
  speaker: string;
  text: string;
  audio_url?: string;
}

export interface SayItQuestion {
  prompt_fa: string;
  target_text: string;
}

export interface RealLifeTask {
  prompt_fa: string;
  max_seconds: number;
  /** هر گروه دست‌کم یک تطابق لازم دارد (بدون حساسیت به حروف بزرگ و کوچک). */
  must_include_any: string[][];
}

export interface Checkpoint {
  title_fa?: string;
  vocabulary?: ChoiceQuestion[];
  grammar?: OrderQuestion[];
  listening?: { dialogue: ListeningLine[]; questions: ChoiceQuestion[] };
  speaking?: SayItQuestion[];
  real_life?: RealLifeTask;
}

export type CheckpointSkill = 'vocabulary' | 'grammar' | 'listening' | 'speaking' | 'real_life';

export interface CheckpointResult {
  total: number;
  scores: Partial<Record<CheckpointSkill, number>>;
  action: 'next_week' | 'next_week_with_review';
  label_fa: string;
  weak_skills: CheckpointSkill[];
}

export async function getCheckpoint(weekId: string): Promise<Checkpoint> {
  const res = await authFetch(`/v1/paths/weeks/${weekId}/checkpoint`, { method: 'GET' });
  return (await jsonOrThrow(res)) as Checkpoint;
}

export async function submitCheckpoint(
  weekId: string,
  scores: Partial<Record<CheckpointSkill, number>>
): Promise<CheckpointResult> {
  const res = await authFetch(`/v1/paths/weeks/${weekId}/checkpoint`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ scores }),
  });
  return (await jsonOrThrow(res)) as CheckpointResult;
}
