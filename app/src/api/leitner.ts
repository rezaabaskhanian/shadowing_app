import { authFetch, jsonOrThrow } from './client';

export interface BackendLeitnerWord {
  id: string;
  word: string;
  meaning: string;
  level: number;
  next_review: number; // یونیکس میلی‌ثانیه
  created_at: number; // یونیکس میلی‌ثانیه
}

export async function listWords(): Promise<BackendLeitnerWord[]> {
  const res = await authFetch('/v1/leitner/words', { method: 'GET' });
  const data = await jsonOrThrow(res);
  return (data.words || []) as BackendLeitnerWord[];
}

/** verbMeaningId: کارتِ یک معنای مشخص از فعل‌های چندمعنایی (اختیاری). */
export async function addWord(word: string, meaning: string, verbMeaningId?: string): Promise<BackendLeitnerWord> {
  const res = await authFetch('/v1/leitner/words', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ word, meaning, verb_meaning_id: verbMeaningId || '' }),
  });
  return (await jsonOrThrow(res)) as BackendLeitnerWord;
}

/** افزودن دسته‌جمعی واژگان به جعبه لایتنر کاربر */
export async function addWordsBatch(items: { word: string; meaning: string; verbMeaningId?: string }[]): Promise<number> {
  const payload = items.map((it) => ({
    word: it.word,
    meaning: it.meaning,
    verb_meaning_id: it.verbMeaningId || '',
  }));
  const res = await authFetch('/v1/leitner/words/batch', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ items: payload }),
  });
  const data = await jsonOrThrow(res);
  return data.added_count ?? items.length;
}

export async function promoteWord(id: string): Promise<BackendLeitnerWord> {
  const res = await authFetch(`/v1/leitner/words/${id}/promote`, { method: 'POST' });
  return (await jsonOrThrow(res)) as BackendLeitnerWord;
}

export async function demoteWord(id: string): Promise<BackendLeitnerWord> {
  const res = await authFetch(`/v1/leitner/words/${id}/demote`, { method: 'POST' });
  return (await jsonOrThrow(res)) as BackendLeitnerWord;
}

export async function removeWord(id: string): Promise<void> {
  const res = await authFetch(`/v1/leitner/words/${id}`, { method: 'DELETE' });
  await jsonOrThrow(res);
}
