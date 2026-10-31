import { authFetch, jsonOrThrow } from './client';

/**
 * گفتگوی آزاد صوتی با AI بعد از تمام‌شدنِ یک صحنه — شخصیتی متناسب با
 * موقعیتِ همان صحنه (مثلاً باریستا برای صحنه‌ی کافه)، حداکثر ۸ نوبتِ کاربر.
 */

export type ConversationRole = 'user' | 'assistant';

export interface ConversationTurnDTO {
  role: ConversationRole;
  text: string;
  /** ترجمه‌ی فارسیِ text (پشتِ دکمه‌ی «ترجمه»)؛ ممکن است نباشد. */
  text_fa?: string;
  audio_url?: string;
}

export interface StartConversationResult {
  conversation_id: string;
  scene_title: string;
  opening_turn: ConversationTurnDTO;
  max_user_turns: number;
  max_hints: number;
}

export interface SendTurnResult {
  user_transcript: string;
  assistant_text: string;
  assistant_text_fa?: string;
  assistant_audio_url?: string;
  /** فقط وقتی خطای گرامریِ قابل‌توجهی در نوبتِ کاربر پیدا شده باشد پر می‌شوند. */
  user_grammar_correction?: string;
  user_grammar_explanation?: string;
  turn_number: number;
  max_user_turns: number;
  is_ended: boolean;
}

/** گفتگو یا روی یک صحنه است یا روی یک سناریوی «نقش‌آفرینی». */
export type ConversationTopic = { sceneId: string } | { roleplayId: string };

export async function startConversation(topic: ConversationTopic): Promise<StartConversationResult> {
  const res = await authFetch('/v1/ai-conversation/start', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify('roleplayId' in topic ? { roleplay_id: topic.roleplayId } : { scene_id: topic.sceneId }),
  });
  return (await jsonOrThrow(res)) as StartConversationResult;
}

export interface RoleplayKeyPhrase {
  en: string;
  fa: string;
}

/** سناریوی «نقش‌آفرینی»: موقعیت زندگی واقعی که کاربر با AI تمرین می‌کند. */
export interface Roleplay {
  id: string;
  title: string;
  title_fa: string;
  situation_fa: string;
  user_role_fa: string;
  goals_fa: string[];
  key_phrases: RoleplayKeyPhrase[];
  category: string;
  level: string;
  podcast_id?: string;
}

export async function getRoleplays(): Promise<Roleplay[]> {
  const res = await authFetch('/v1/ai-conversation/roleplays', { method: 'GET' });
  return ((await jsonOrThrow(res)) as Roleplay[]) || [];
}

const normalizeWords = (text: string) =>
  text
    .toLowerCase()
    .replace(/[’']/g, "'")
    // «I've» و «I have» یکی حساب شوند (رونویسی گاهی شکل کامل را می‌نویسد).
    .replace(/won't/g, 'will not')
    .replace(/can't/g, 'can not')
    .replace(/n't\b/g, ' not')
    .replace(/'ve\b/g, ' have')
    .replace(/'re\b/g, ' are')
    .replace(/'m\b/g, ' am')
    .replace(/'ll\b/g, ' will')
    .replace(/'d\b/g, ' would')
    .replace(/[^a-z0-9' ]+/g, ' ')
    .split(/\s+/)
    .filter(Boolean);

/**
 * آیا کاربر این جمله‌ی کلیدی را (تقریباً) گفته؟ گزینه‌ها با «/» جدا شده‌اند؛ برای
 * هر گزینه اگر دست‌کم ۸۰٪ کلمه‌هایش در یکی از نوبت‌های کاربر بیاید، گفته شده.
 * رونویسی گفتار دقیق نیست، پس تطبیق کامل لازم نیست.
 */
export function phraseUsed(phrase: string, userTexts: string[]): boolean {
  const turns = userTexts.map((txt) => new Set(normalizeWords(txt)));
  return phrase.split('/').some((alt) => {
    const words = normalizeWords(alt);
    if (words.length === 0) return false;
    return turns.some((set) => words.filter((w) => set.has(w)).length / words.length >= 0.8);
  });
}

/** از پسوند فایل، mime-type مناسب برای فیلد فرم می‌سازد (مطابق assessment.ts). */
const extensionForMime = (mimeType: string) => {
  if (mimeType.includes('webm')) return 'webm';
  if (mimeType.includes('ogg')) return 'ogg';
  if (mimeType.includes('wav')) return 'wav';
  if (mimeType.includes('mpeg') || mimeType.includes('mp3')) return 'mp3';
  return 'm4a';
};

/**
 * یک نوبتِ صوتیِ کاربر را می‌فرستد. اگر رونویسی سمتِ سرور شکست بخورد یا
 * چیزی نگیرد، سرور ۴۰۰ می‌دهد و این نوبت شمرده نمی‌شود — کاربر می‌تواند
 * دوباره ضبط کند.
 */
export async function sendConversationTurn(
  conversationId: string,
  filePath: string,
  mimeType?: string
): Promise<SendTurnResult> {
  const form = new FormData();
  const type = mimeType || 'audio/m4a';
  const uri = filePath.startsWith('file://') ? filePath : `file://${filePath}`;

  form.append('conversation_id', conversationId);
  form.append('audio', {
    uri,
    name: `turn.${extensionForMime(type)}`,
    type,
  } as any);

  const res = await authFetch('/v1/ai-conversation/turn', { method: 'POST', body: form });
  return (await jsonOrThrow(res)) as SendTurnResult;
}

export interface ConversationSuggestion {
  text: string;
  translation_fa: string;
}

export interface SuggestResult {
  hint_id: string;
  suggestions: ConversationSuggestion[];
  hints_used: number;
  max_hints: number;
}

/**
 * پیشنهادِ جواب به آخرین پیامِ AI (۲ جمله‌ی انگلیسی + ترجمه‌ی فارسی). سقفِ
 * تعدادِ پیشنهاد در هر گفتگو سمتِ سرور اعمال می‌شود؛ زدنِ دوباره روی همان نوبت
 * همان نتیجه را برمی‌گرداند و از سقف کم نمی‌کند.
 */
export async function getConversationSuggestions(conversationId: string): Promise<SuggestResult> {
  const res = await authFetch('/v1/ai-conversation/suggest', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ conversation_id: conversationId }),
  });
  return (await jsonOrThrow(res)) as SuggestResult;
}
