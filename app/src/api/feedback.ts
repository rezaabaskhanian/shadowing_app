import { authFetch, jsonOrThrow } from './client';

export interface Feedback {
  id: string;
  message: string;
  created_at: string;
}

export async function createFeedback(message: string): Promise<Feedback> {
  const res = await authFetch('/v1/learning/feedback', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message }),
  });
  return (await jsonOrThrow(res)) as Feedback;
}
