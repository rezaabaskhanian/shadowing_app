import { authFetch, jsonOrThrow } from './client';
import type { TopicSpeechMistake, TopicSpeechPhrase } from './topicSpeaking';

/**
 * «تمرین نوشتن»: کاربر درباره‌ی موضوعی که ادمین داده یک داستان/متن کوتاه
 * می‌نویسد و AI آن را تصحیح می‌کند (بک‌اند: writingservice).
 */

export type WritingLevel = 'beginner' | 'intermediate' | 'advanced';

export interface WritingPrompt {
  id: string;
  title: string;
  prompt_fa: string;
  guide_questions: string[];
  useful_phrases: string[];
  level: WritingLevel;
  min_words: number;
  max_words: number;
  attempts: number;
  best_score: number;
}

export interface WritingStructure {
  structure: string;
  example: string;
  note_fa: string;
}

export interface WritingResult {
  word_count: number;
  on_topic: 'yes' | 'partial' | 'no' | string;
  score: number;
  summary_fa: string;
  strengths_fa: string[];
  mistakes: TopicSpeechMistake[];
  better_phrases: TopicSpeechPhrase[];
  structures: WritingStructure[];
  used_phrases: string[];
  improved_version: string;
}

export async function getWritingPrompts(): Promise<WritingPrompt[]> {
  const res = await authFetch('/v1/writing/prompts', { method: 'GET' });
  return ((await jsonOrThrow(res)) as WritingPrompt[]) || [];
}

export async function submitWriting(promptId: string, text: string): Promise<WritingResult> {
  const res = await authFetch(`/v1/writing/prompts/${promptId}/submit`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text }),
  });
  return (await jsonOrThrow(res)) as WritingResult;
}
