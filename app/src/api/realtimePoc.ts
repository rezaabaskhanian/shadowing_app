import { authFetch, jsonOrThrow } from './client';

/**
 * PoC موقتِ معماری Realtime Voice (Gemini Live) — نگاه کنید به
 * PRODUCTION_CHECKLIST.md بخش «تصمیمِ معماریِ آینده». این فقط توکنِ کوتاه‌عمر
 * را از بک‌اند می‌گیرد؛ خودِ استریمِ صدا مستقیم بین اپ و Gemini انجام می‌شود.
 */
export interface RealtimeTokenResult {
  token: string;
  model: string;
  expire_at: string;
}

export async function fetchRealtimeToken(): Promise<RealtimeTokenResult> {
  const res = await authFetch('/v1/realtime-poc/token', { method: 'POST' });
  return (await jsonOrThrow(res)) as RealtimeTokenResult;
}
