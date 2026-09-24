import { authFetch, jsonOrThrow } from './client';

// افعال چندمعنایی (get, take, ...): هر معنا به جمله‌های واقعی درس‌ها وصل است.

export interface VerbListItem {
  id: string;
  lemma: string;
  meaning_count: number;
  learned_count: number;
}

export interface VerbExample {
  sentence: string;
  form: string;
  translation: string;
  audio_url: string;
  scene_id: string;
  scene_title: string;
  dialogue_id: string;
}

export interface VerbMeaningView {
  id: string;
  meaning_fa: string;
  explanation_fa: string;
  practice_prompt_fa: string;
  fallback_example: string;
  examples: VerbExample[];
  seen: boolean;
  recognition_correct: number;
  recognition_target: number;
  spoken_ok: boolean;
  in_leitner: boolean;
  learned: boolean;
}

export interface VerbView {
  id: string;
  lemma: string;
  meanings: VerbMeaningView[];
}

export interface VerbSceneTag {
  dialogue_id: string;
  form: string;
  verb_id: string;
  lemma: string;
  meaning_id: string;
  meaning_fa: string;
  other_meaning_count: number;
}

export interface VerbQuizQuestion {
  meaning_id: string;
  sentence: string;
  form: string;
  audio_url: string;
  options: { meaning_id: string; meaning_fa: string }[];
}

export interface VerbSpeakResult {
  transcript: string;
  used_verb: boolean;
  correct_meaning: boolean;
  grammatical: boolean;
  feedback_fa: string;
  better_sentence: string;
  passed: boolean;
}

export interface VerbPending {
  verb_id: string;
  lemma: string;
  meaning_fa: string;
}

export async function listVerbs(): Promise<VerbListItem[]> {
  return (await jsonOrThrow(await authFetch('/v1/verbs', { method: 'GET' }))) || [];
}

export async function getVerb(id: string): Promise<VerbView> {
  return jsonOrThrow(await authFetch(`/v1/verbs/${id}`, { method: 'GET' }));
}

export async function getSceneVerbTags(sceneId: string): Promise<VerbSceneTag[]> {
  return (await jsonOrThrow(await authFetch(`/v1/verbs/scene/${sceneId}`, { method: 'GET' }))) || [];
}

export async function getPendingVerbPractice(): Promise<VerbPending | null> {
  const data = await jsonOrThrow(await authFetch('/v1/verbs/pending', { method: 'GET' }));
  return data?.pending ?? null;
}

export async function getVerbQuiz(id: string): Promise<VerbQuizQuestion[]> {
  return (await jsonOrThrow(await authFetch(`/v1/verbs/${id}/quiz`, { method: 'GET' }))) || [];
}

export async function markVerbMeaningSeen(meaningId: string): Promise<void> {
  await jsonOrThrow(await authFetch(`/v1/verbs/meanings/${meaningId}/seen`, { method: 'POST' }));
}

export async function answerVerbQuiz(
  meaningId: string,
  chosenMeaningId: string
): Promise<{ correct: boolean; correct_meaning_fa: string }> {
  return jsonOrThrow(
    await authFetch(`/v1/verbs/meanings/${meaningId}/answer`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chosen_meaning_id: chosenMeaningId }),
    })
  );
}

/** تمرین صوتی (فقط با اشتراک؛ ۴۰۳ = بدون اشتراک یا سقف روزانه‌ی AI تمام شده). */
export async function speakVerbMeaning(
  meaningId: string,
  audioPath: string,
  mimeType: string = 'audio/m4a'
): Promise<VerbSpeakResult> {
  const uri = audioPath.startsWith('file://') ? audioPath : `file://${audioPath}`;
  const ext = mimeType.includes('webm') ? 'webm' : mimeType.includes('ogg') ? 'ogg' : mimeType.includes('wav') ? 'wav' : 'm4a';
  const form = new FormData();
  form.append('audio', { uri, name: `verb_practice.${ext}`, type: mimeType } as any);
  return jsonOrThrow(await authFetch(`/v1/verbs/meanings/${meaningId}/speak`, { method: 'POST', body: form }));
}
