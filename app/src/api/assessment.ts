import { authFetch, jsonOrThrow } from './client';

/**
 * تست تعیین سطح (Quick Check): سه آیتم رندوم از استخرهای مدیریت‌شده در پنل
 * ادمین — یک معرفی خود، یک موقعیت آزاد (هر دو فقط رونویسی + بررسی ربط با
 * هوش مصنوعی، بدون نمره‌ی عددی)، و یک جمله‌ی Shadow که نمره‌ی واقعی تلفظ
 * می‌گیرد و سطح کاربر را می‌سازد.
 */

export type AssessmentItemKind = 'shadow' | 'free_speech';
export type AssessmentItemCategory = 'intro' | 'situational';

export interface AssessmentItem {
  id: string;
  kind: AssessmentItemKind;
  category?: AssessmentItemCategory;
  prompt_text: string;
  /** فقط برای kind=shadow */
  target_text?: string;
  /** فقط برای kind=shadow */
  audio_url?: string;
  difficulty?: string;
}

export interface SpeakingProfile {
  level: string;
  overall_score: number;
  pronunciation_score: number;
  fluency_score: number;
  is_estimated: boolean;
  assessed_at?: string;
}

export interface ItemResult {
  item_id: string;
  kind: AssessmentItemKind;
  transcript?: string;
  relevance_answered?: 'yes' | 'partial' | 'no' | string;
  relevance_feedback?: string;
  /** فقط وقتی خطای گرامریِ قابل‌توجهی پیدا شده باشد پر می‌شود. */
  grammar_correction?: string;
  grammar_explanation?: string;
  pronunciation_score?: number;
  fluency_score?: number;
  overall_score?: number;
}

export interface SubmitAssessmentResult {
  level: string;
  overall_score: number;
  pronunciation_score: number;
  fluency_score: number;
  is_estimated: boolean;
  items: ItemResult[];
}

/**
 * سه آیتم تست را می‌گیرد. اگر ادمین هنوز محتوایی برای یکی از دسته‌ها
 * نساخته باشد سرور ۴۰۴ می‌دهد؛ اینجا `null` برمی‌گردانیم تا گیت موبایل
 * بی‌سروصدا رد شود، نه اینکه با خطا کاربر را معطل کند.
 */
export async function getAssessmentTest(): Promise<AssessmentItem[] | null> {
  const res = await authFetch('/v1/assessment/test', { method: 'GET' });
  if (res.status === 404) return null;
  const data = await jsonOrThrow(res);
  return (data.items || []) as AssessmentItem[];
}

/** از پسوند فایل، mime-type مناسب برای فیلد فرم می‌سازد (مطابق shadowing.ts). */
const extensionForMime = (mimeType: string) => {
  if (mimeType.includes('webm')) return 'webm';
  if (mimeType.includes('ogg')) return 'ogg';
  if (mimeType.includes('wav')) return 'wav';
  if (mimeType.includes('mpeg') || mimeType.includes('mp3')) return 'mp3';
  return 'm4a';
};

export interface SubmitAssessmentItem {
  itemId: string;
  filePath: string;
  mimeType?: string;
  duration: number;
}

/**
 * هر سه آیتم را در یک درخواست multipart می‌فرستد (فیلدهای اندیس‌دار
 * item_id_0/duration_0/audio_0, ...). اگر ارسال شکست بخورد، فایل‌های محلی
 * دست‌نخورده می‌مانند و می‌شود بدون ضبط دوباره تلاش کرد.
 */
export async function submitAssessment(
  items: SubmitAssessmentItem[]
): Promise<SubmitAssessmentResult> {
  const form = new FormData();

  items.forEach((item, i) => {
    const mimeType = item.mimeType || 'audio/m4a';
    const uri = item.filePath.startsWith('file://') ? item.filePath : `file://${item.filePath}`;
    form.append(`audio_${i}`, {
      uri,
      name: `recording_${i}.${extensionForMime(mimeType)}`,
      type: mimeType,
    } as any);
    form.append(`item_id_${i}`, item.itemId);
    form.append(`duration_${i}`, String(Math.max(1, Math.round(item.duration))));
  });

  // عمداً Content-Type ست نمی‌کنیم: باید خودِ fetch با boundary درست بسازدش.
  const res = await authFetch('/v1/assessment/submit', { method: 'POST', body: form });
  return (await jsonOrThrow(res)) as SubmitAssessmentResult;
}

/** پروفایل گفتاری کاربر؛ ۴۰۴ یعنی هنوز تست نداده (سیگنال گیت). */
export async function getSpeakingProfile(): Promise<SpeakingProfile | null> {
  const res = await authFetch('/v1/assessment/profile', { method: 'GET' });
  if (res.status === 404) return null;
  return (await jsonOrThrow(res)) as SpeakingProfile;
}

export type SceneLevel = 'starter' | 'beginner' | 'intermediate' | 'advanced' | 'proficient';

/** سطح مؤثر کاربر: انتخاب دستی، وگرنه نتیجه‌ی تست، وگرنه مبتدی. */
export interface MyLevel {
  scene_level: SceneLevel;
  source: 'manual' | 'test' | 'default';
  /** سطح حاصل از تست؛ خالی اگر تست نداده */
  test_scene_level: SceneLevel | '';
}

export async function getMyLevel(): Promise<MyLevel> {
  const res = await authFetch('/v1/assessment/level', { method: 'GET' });
  return (await jsonOrThrow(res)) as MyLevel;
}

/** انتخاب دستی سطح؛ رشته‌ی خالی = برگشت به نتیجه‌ی تست. */
export async function setMyLevel(sceneLevel: SceneLevel | ''): Promise<MyLevel> {
  const res = await authFetch('/v1/assessment/level', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ scene_level: sceneLevel }),
  });
  return (await jsonOrThrow(res)) as MyLevel;
}

// ============================================================
// تست نسخه‌ی ۲: لغت (بله/خیر) + شنیدن (۳ گزینه) + تکرار جمله‌ی بلندشونده
// (+ معرفی خود اختیاری). سند: document_placement/placement_design.md
// ============================================================

export type CefrLevel = 'A1' | 'A2' | 'B1' | 'B2' | 'C1';
export const CEFR_LEVELS: CefrLevel[] = ['A1', 'A2', 'B1', 'B2', 'C1'];

export interface VocabTestItem {
  id: string;
  word: string;
  /** لایه‌ی بسامدی ۱ تا ۵؛ برای کلمه‌ی ساختگی صفر */
  band: number;
  /** ۱ = دور اول؛ ۲ = فقط اگر کاربر لایه‌ی ۳ را خوب بداند */
  stage: number;
}

export interface ListenTestItem {
  id: string;
  cefr: CefrLevel;
  audio_url: string;
  prompt: string;
  options: string[];
  /** برای تصمیم تطبیقی در اپ؛ نمره‌ی نهایی روی سرور حساب می‌شود. */
  correct_index: number;
}

export interface ImitationTestItem {
  id: string;
  cefr: CefrLevel;
  audio_url: string;
}

export interface AssessmentTestV2 {
  vocab: VocabTestItem[];
  listening: ListenTestItem[];
  imitation: ImitationTestItem[];
  intro?: AssessmentItem;
}

export interface ImitationResult {
  item_id: string;
  cefr: CefrLevel;
  accuracy: number;
  passed: boolean;
  transcript: string;
}

export interface SubmitAssessmentV2Result {
  /** سطح شروع مسیر */
  level: CefrLevel;
  scene_level: SceneLevel;
  comprehension_level: CefrLevel;
  speaking_level: CefrLevel | '';
  listening_level: CefrLevel;
  vocab_level: CefrLevel;
  vocab_size: number;
  vocab_valid: boolean;
  speaking_measured: boolean;
  imitation: ImitationResult[];
  intro?: ItemResult;
  previous?: {
    level: string;
    comprehension_level: string;
    speaking_level: string;
    vocab_size: number;
    assessed_at: string;
  };
}

/** آیتم‌های تست نسخه‌ی ۲؛ `null` اگر محتوای آن هنوز در پنل ساخته نشده (۴۰۴). */
export async function getAssessmentTestV2(): Promise<AssessmentTestV2 | null> {
  const res = await authFetch('/v1/assessment/v2/test', { method: 'GET' });
  if (res.status === 404) return null;
  return (await jsonOrThrow(res)) as AssessmentTestV2;
}

export interface SubmitAssessmentV2Payload {
  vocab: { item_id: string; known: boolean }[];
  listening: { item_id: string; choice: number }[];
  /** جمله‌های تکرار و (اختیاری) معرفی خود */
  recordings: SubmitAssessmentItem[];
}

export async function submitAssessmentV2(payload: SubmitAssessmentV2Payload): Promise<SubmitAssessmentV2Result> {
  const form = new FormData();
  form.append('answers', JSON.stringify({ vocab: payload.vocab, listening: payload.listening }));
  payload.recordings.forEach((item, i) => {
    const mimeType = item.mimeType || 'audio/m4a';
    const uri = item.filePath.startsWith('file://') ? item.filePath : `file://${item.filePath}`;
    form.append(`audio_${i}`, {
      uri,
      name: `recording_${i}.${extensionForMime(mimeType)}`,
      type: mimeType,
    } as any);
    form.append(`item_id_${i}`, item.itemId);
    form.append(`duration_${i}`, String(Math.max(1, Math.round(item.duration))));
  });
  const res = await authFetch('/v1/assessment/v2/submit', { method: 'POST', body: form });
  return (await jsonOrThrow(res)) as SubmitAssessmentV2Result;
}
