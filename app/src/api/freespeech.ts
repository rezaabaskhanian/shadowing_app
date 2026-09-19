import { authFetch, jsonOrThrow } from './client';

/**
 * یک بار توضیحِ آزادِ کاربر بعد از تمام‌شدنِ یک صحنه — بدون متنِ مرجع، بدون
 * پاسخِ AI و بدون مکالمه‌ی چندنوبتی (بخش ۱۶ سند محصول: Free Speech).
 */

export interface AnalyzeFreeSpeechResult {
  transcript: string;
  relevance_answered: string;
  relevance_feedback: string;
  grammar_correction?: string;
  grammar_explanation?: string;
}

/** از پسوند فایل، mime-type مناسب برای فیلد فرم می‌سازد (مطابق conversation.ts). */
const extensionForMime = (mimeType: string) => {
  if (mimeType.includes('webm')) return 'webm';
  if (mimeType.includes('ogg')) return 'ogg';
  if (mimeType.includes('wav')) return 'wav';
  if (mimeType.includes('mpeg') || mimeType.includes('mp3')) return 'mp3';
  return 'm4a';
};

export async function analyzeFreeSpeech(
  sceneId: string,
  filePath: string,
  mimeType?: string
): Promise<AnalyzeFreeSpeechResult> {
  const form = new FormData();
  const type = mimeType || 'audio/m4a';
  const uri = filePath.startsWith('file://') ? filePath : `file://${filePath}`;

  form.append('scene_id', sceneId);
  form.append('audio', {
    uri,
    name: `attempt.${extensionForMime(type)}`,
    type,
  } as any);

  const res = await authFetch('/v1/free-speech/analyze', { method: 'POST', body: form });
  return (await jsonOrThrow(res)) as AnalyzeFreeSpeechResult;
}

export interface FreeSpeechFeedback {
  relevance_answered: string;
  relevance_feedback: string;
  grammar_correction?: string;
  grammar_explanation?: string;
}

/**
 * مرحله‌ی اولِ دومرحله‌ای: فقط رونویسیِ صدا. متن زود برمی‌گردد و صفحه همان لحظه
 * نشانش می‌دهد؛ بازخورد جدا از getFreeSpeechFeedback می‌آید.
 */
export async function transcribeFreeSpeech(filePath: string, mimeType?: string): Promise<string> {
  const form = new FormData();
  const type = mimeType || 'audio/m4a';
  const uri = filePath.startsWith('file://') ? filePath : `file://${filePath}`;

  form.append('audio', {
    uri,
    name: `attempt.${extensionForMime(type)}`,
    type,
  } as any);

  const res = await authFetch('/v1/free-speech/transcribe', { method: 'POST', body: form });
  const data = (await jsonOrThrow(res)) as { transcript: string };
  return data.transcript;
}

/** مرحله‌ی دوم: بازخوردِ ربط + گرامر برای متنِ رونویسی‌شده. */
export async function getFreeSpeechFeedback(sceneId: string, transcript: string): Promise<FreeSpeechFeedback> {
  const res = await authFetch('/v1/free-speech/feedback', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ scene_id: sceneId, transcript }),
  });
  return (await jsonOrThrow(res)) as FreeSpeechFeedback;
}
