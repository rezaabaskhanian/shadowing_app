import { authFetch, jsonOrThrow } from './client';

/**
 * نمره‌دهی تلفظ: صدای ضبط‌شده‌ی کاربر را به بک‌اند می‌فرستد و نمره‌ی کلمه‌به‌کلمه
 * می‌گیرد.
 *
 * بک‌اند فایل را بعد از نمره‌دهی پاک می‌کند و چیزی ذخیره نمی‌شود؛ نسخه‌ی اصلی
 * ضبط روی خودِ گوشی می‌ماند ([[RecordingsService]]). به همین دلیل هم می‌شود
 * یک جمله را هرچندبار که کاربر خواست دوباره ارزیابی کرد.
 */

/** وضعیت هر کلمه؛ مبنای رنگ‌آمیزی در مرحله‌ی مقایسه. */
export type WordStatus = 'ok' | 'weak' | 'missing';

export interface WordScore {
  word: string;
  index: number;
  /** ۰ تا ۱۰۰ */
  score: number;
  status: WordStatus;
  /** چیزی که واقعاً شنیده شده؛ برای کلمه‌های گفته‌نشده خالی است. */
  heard?: string;
}

export interface EvaluationResult {
  /** متنی که نمره بر اساس آن حساب شده. */
  target_text: string;
  pronunciation_score: number;
  fluency_score: number;
  overall_score: number;
  /** متنی که از کاربر شنیده شده. */
  transcript?: string;
  words?: WordScore[];
  /**
   * true یعنی سرویس تشخیص گفتار در دسترس نبوده و نمره فقط از روی مدت ضبط
   * تخمین زده شده. در این حالت `words` خالی است و UI نباید کلمه‌ای را قرمز
   * کند — وگرنه به کاربر بازخورد ساختگی داده‌ایم.
   */
  is_estimated: boolean;
}

/** از پسوند فایل، mime-type مناسب برای فیلد فرم می‌سازد. */
const extensionForMime = (mimeType: string) => {
  if (mimeType.includes('webm')) return 'webm';
  if (mimeType.includes('ogg')) return 'ogg';
  if (mimeType.includes('wav')) return 'wav';
  if (mimeType.includes('mpeg') || mimeType.includes('mp3')) return 'mp3';
  return 'm4a';
};

export async function evaluateRecording(params: {
  /**
   * مسیر فایل صوتی روی دیسک (مثلاً از `RecordingMeta.path`). React Native
   * فرم‌دیتا فایل را به‌صورت `{uri, name, type}` می‌خواهد و خودش مستقیم از
   * روی مسیر می‌خواند؛ نیازی به خواندن دستی و base64 کردن نیست.
   */
  filePath: string;
  mimeType?: string;
  /** شناسه‌ی جمله؛ بک‌اند متن هدف را از دیتابیس می‌خواند. */
  dialogueId?: string;
  /** جایگزین dialogueId وقتی جمله در دیتابیس نیست (مثلاً داده‌ی نمونه). */
  targetText?: string;
  /** مدت ضبط کاربر به ثانیه. */
  duration: number;
  /** مدت صدای مرجع به ثانیه. */
  expectedDuration?: number;
}): Promise<EvaluationResult> {
  const mimeType = params.mimeType || 'audio/m4a';

  // شبکه‌ی React Native فایل محلی را فقط با اسکیم `file://` می‌شناسد.
  const uri = params.filePath.startsWith('file://')
    ? params.filePath
    : `file://${params.filePath}`;

  const form = new FormData();
  form.append('audio', {
    uri,
    name: `recording.${extensionForMime(mimeType)}`,
    type: mimeType,
  } as any);

  if (params.dialogueId) form.append('dialogue_id', params.dialogueId);
  if (params.targetText) form.append('target_text', params.targetText);
  form.append('duration', String(Math.max(1, Math.round(params.duration))));
  if (params.expectedDuration) {
    form.append('expected_duration', String(Math.round(params.expectedDuration)));
  }

  // عمداً Content-Type ست نمی‌کنیم: باید خودِ fetch آن را با boundary درست
  // بسازد، و دست‌کاری‌اش باعث می‌شود سرور نتواند فرم را پارس کند.
  const res = await authFetch('/v1/shadowing/evaluate', { method: 'POST', body: form });
  return (await jsonOrThrow(res)) as EvaluationResult;
}
