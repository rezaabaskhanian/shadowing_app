import { authFetch } from './client';

export interface QuizQuestion {
  dialogue_id: string;
  prompt: string;
  options: string[];
}

export interface QuizAnswer {
  dialogue_id: string;
  selected_text: string;
}

export interface QuizResult {
  correct: number;
  total: number;
  xp_awarded: number;
}

// کوئیز درک شنیداریِ یک صحنه — کاملاً از روی دیالوگ‌های واقعی همان صحنه
// (و صحنه‌های دیگر برای گزینه‌های غلط) روی بک‌اند ساخته می‌شود.
export async function fetchSceneQuiz(sceneId: string): Promise<QuizQuestion[]> {
  const res = await authFetch(`/v1/scenes/${sceneId}/quiz`, { method: 'GET' });
  if (!res.ok) throw new Error('failed to fetch quiz');
  const data = (await res.json()) as QuizQuestion[] | null;
  return data || [];
}

// نمره‌دهی سمت سرور انجام می‌شود (نه کلاینت) چون گزینه‌ها هر بار تصادفی‌اند.
export async function submitSceneQuiz(sceneId: string, answers: QuizAnswer[]): Promise<QuizResult> {
  const res = await authFetch(`/v1/scenes/${sceneId}/quiz/submit`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ answers }),
  });
  if (!res.ok) throw new Error('failed to submit quiz');
  return (await res.json()) as QuizResult;
}
