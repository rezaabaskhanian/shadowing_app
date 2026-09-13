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
