import { authFetch, jsonOrThrow } from './client';

/**
 * «صحبت درباره‌ی یک موضوع»: کاربر ۱ تا ۲ دقیقه درباره‌ی موضوعی که ادمین ساخته
 * صحبت می‌کند و AI صحبتش را بررسی می‌کند (بک‌اند: topicspeakingservice).
 */

export type TopicLevel = 'beginner' | 'intermediate' | 'advanced';

export interface SpeakingTopic {
  id: string;
  title: string;
  prompt_fa: string;
  guide_questions: string[];
  useful_phrases: string[];
  level: TopicLevel;
  duration_seconds: number;
  attempts: number;
  best_score: number;
}

export interface TopicSpeechMistake {
  original: string;
  corrected: string;
  explanation_fa: string;
}

export interface TopicSpeechPhrase {
  instead_of: string;
  try: string;
  note_fa: string;
}

export interface TopicSpeakingResult {
  transcript: string;
  duration_seconds: number;
  word_count: number;
  words_per_minute: number;
  on_topic: 'yes' | 'partial' | 'no' | string;
  score: number;
  summary_fa: string;
  strengths_fa: string[];
  mistakes: TopicSpeechMistake[];
  better_phrases: TopicSpeechPhrase[];
  used_phrases: string[];
  improved_version: string;
}

export async function getSpeakingTopics(): Promise<SpeakingTopic[]> {
  const res = await authFetch('/v1/topic-speaking/topics', { method: 'GET' });
  return ((await jsonOrThrow(res)) as SpeakingTopic[]) || [];
}

const extensionForMime = (mimeType: string) => {
  if (mimeType.includes('webm')) return 'webm';
  if (mimeType.includes('ogg')) return 'ogg';
  if (mimeType.includes('wav')) return 'wav';
  if (mimeType.includes('mpeg') || mimeType.includes('mp3')) return 'mp3';
  return 'm4a';
};

export async function submitTopicSpeaking(
  topicId: string,
  filePath: string,
  durationSeconds: number,
  mimeType?: string
): Promise<TopicSpeakingResult> {
  const form = new FormData();
  const type = mimeType || 'audio/m4a';
  const uri = filePath.startsWith('file://') ? filePath : `file://${filePath}`;

  form.append('duration', String(Math.round(durationSeconds)));
  form.append('audio', {
    uri,
    name: `topic.${extensionForMime(type)}`,
    type,
  } as any);

  const res = await authFetch(`/v1/topic-speaking/topics/${topicId}/attempt`, { method: 'POST', body: form });
  return (await jsonOrThrow(res)) as TopicSpeakingResult;
}
