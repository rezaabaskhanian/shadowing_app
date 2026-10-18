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

/** جواب ادمین به یکی از تعامل‌های کاربر (پیشنهاد و انتقاد، پیشنهاد صحنه/موضوع، خرید). */
export interface SupportReply {
  id: string;
  kind: 'feedback' | 'submission' | 'topic' | 'subscription' | 'topup' | string;
  ref_id: string;
  original: string;
  reply: string;
  created_at: string;
}

export async function getMyReplies(): Promise<SupportReply[]> {
  const res = await authFetch('/v1/learning/feedback/replies', { method: 'GET' });
  const data = (await jsonOrThrow(res)) as { replies?: SupportReply[] };
  return data?.replies || [];
}
