import { authFetch, jsonOrThrow } from './client';
import type { TopicSpeakingResult } from './topicSpeaking';

/**
 * «مصاحبه‌ی شبیه‌سازی‌شده»: سؤال‌های صداگذاری‌شده‌ی یک مصاحبه‌ی کاری، پذیرش
 * دانشگاه یا سفارت؛ هر جواب رونویسی و بررسی می‌شود (بک‌اند: interviewservice).
 */

export type InterviewKind = 'job' | 'admission' | 'visa';

export interface InterviewQuestion {
  id: string;
  position: number;
  text: string;
  translation_fa: string;
  audio_url: string;
  prep_seconds: number;
  answer_seconds: number;
  tip_fa: string;
  sample_answer: string;
  sample_answer_fa: string;
  key_phrases: string[];
}

export interface InterviewSet {
  id: string;
  kind: InterviewKind;
  field_key: string;
  title: string;
  title_fa: string;
  description_fa: string;
  level: string;
  image_url: string;
  question_count: number;
  questions?: InterviewQuestion[];
  /** فقط در لیست: تعداد مصاحبه‌های تمام‌شده و بهترین امتیاز همین کاربر. */
  attempts?: number;
  best_score?: number;
}

/** نتیجه‌ی یک جواب: همان بررسیِ «صحبت درباره‌ی موضوع» به‌اضافه‌ی شماره‌ی تلاش. */
export interface InterviewAnswerResult extends TopicSpeakingResult {
  question_id: string;
  try_no: number;
}

export interface InterviewQuestionReport {
  question_id: string;
  tries: number;
  best_score: number;
  first_score: number;
  best_transcript: string;
  words_per_minute: number;
  best_review: InterviewAnswerResult;
  sample_answer: string;
  sample_answer_fa: string;
}

export interface InterviewReport {
  attempt_id: string;
  set_id: string;
  score: number;
  answered: number;
  total: number;
  improved: number;
  questions: InterviewQuestionReport[];
}

export async function getInterviewSets(): Promise<InterviewSet[]> {
  const res = await authFetch('/v1/interviews', { method: 'GET' });
  return ((await jsonOrThrow(res)) as InterviewSet[]) || [];
}

export async function getInterviewSet(id: string): Promise<InterviewSet> {
  const res = await authFetch(`/v1/interviews/${id}`, { method: 'GET' });
  return (await jsonOrThrow(res)) as InterviewSet;
}

export async function startInterview(setId: string): Promise<string> {
  const res = await authFetch(`/v1/interviews/${setId}/attempts`, { method: 'POST' });
  return ((await jsonOrThrow(res)) as { attempt_id: string }).attempt_id;
}

const extensionForMime = (mimeType: string) => {
  if (mimeType.includes('webm')) return 'webm';
  if (mimeType.includes('ogg')) return 'ogg';
  if (mimeType.includes('wav')) return 'wav';
  if (mimeType.includes('mpeg') || mimeType.includes('mp3')) return 'mp3';
  return 'm4a';
};

export async function submitInterviewAnswer(
  attemptId: string,
  questionId: string,
  filePath: string,
  durationSeconds: number,
  mimeType?: string
): Promise<InterviewAnswerResult> {
  const form = new FormData();
  const type = mimeType || 'audio/m4a';
  const uri = filePath.startsWith('file://') ? filePath : `file://${filePath}`;
  form.append('duration', String(Math.round(durationSeconds)));
  form.append('audio', { uri, name: `answer.${extensionForMime(type)}`, type } as any);
  const res = await authFetch(`/v1/interviews/attempts/${attemptId}/questions/${questionId}/answer`, {
    method: 'POST',
    body: form,
  });
  return (await jsonOrThrow(res)) as InterviewAnswerResult;
}

export async function finishInterview(attemptId: string): Promise<InterviewReport> {
  const res = await authFetch(`/v1/interviews/attempts/${attemptId}/finish`, { method: 'POST' });
  return (await jsonOrThrow(res)) as InterviewReport;
}
