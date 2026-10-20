import { authFetch, jsonOrThrow } from './client';

/** اصطلاح/عبارت پرکاربرد از کتابخانه‌ی اصطلاحات (پنل ← اصطلاحات). */
export interface Idiom {
  id: string;
  phrase: string;
  meaning_fa: string;
  explanation_fa: string;
  example_en: string;
  example_fa: string;
  /** سطح CEFR (A1…C2)؛ خالی = بدون سطح */
  level: string;
  category: string;
}

export async function listIdioms(): Promise<Idiom[]> {
  const res = await authFetch('/v1/idioms', { method: 'GET' });
  return ((await jsonOrThrow(res)) as Idiom[]) || [];
}

export const CEFR_ORDER = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];

/** سطح صحنه‌ی کاربر ← CEFR (همان نگاشت مسیرها). */
export const SCENE_LEVEL_TO_CEFR: Record<string, string> = {
  starter: 'A1',
  beginner: 'A2',
  intermediate: 'B1',
  advanced: 'B2',
  proficient: 'C1',
};

const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** چند شکل صرفیِ ساده‌ی یک کلمه (برای فعل اول اصطلاح: cost → costs, costing, cost). */
function wordForms(w: string): string[] {
  const forms = new Set([w, `${w}s`, `${w}es`, `${w}ed`, `${w}d`, `${w}ing`]);
  if (w.endsWith('e')) forms.add(`${w.slice(0, -1)}ing`);
  if (w.endsWith('y')) {
    forms.add(`${w.slice(0, -1)}ies`);
    forms.add(`${w.slice(0, -1)}ied`);
  }
  return [...forms];
}

// جای‌خالی‌های رایج در متن اصطلاح («someone»، «one's») با یکی دو کلمه‌ی دلخواه جور می‌شوند.
const PLACEHOLDERS = new Set(['someone', 'somebody', 'something', 'sb', 'sth', "one's", "someone's", 'oneself']);

const regexCache = new Map<string, RegExp | null>();

function idiomRegex(phrase: string): RegExp | null {
  const cached = regexCache.get(phrase);
  if (cached !== undefined) return cached;
  const words = phrase
    .toLowerCase()
    .replace(/[’]/g, "'")
    .replace(/[^a-z' ]/g, ' ')
    .split(/\s+/)
    .filter(Boolean);
  if (words[0] === 'to' && words.length > 1) words.shift();
  let re: RegExp | null = null;
  if (words.length >= 2) {
    const parts = words.map((w, i) => {
      if (PLACEHOLDERS.has(w)) return "[a-z']+(?: [a-z']+)?";
      // فقط فعلِ اولِ اصطلاح صرف می‌شود؛ کلمه‌های کوتاه (a، in، on) نه.
      if (i === 0 && w.length >= 3) return `(?:${wordForms(w).map(escape).join('|')})`;
      return escape(w);
    });
    re = new RegExp(`\\b${parts.join(' ')}\\b`, 'i');
  }
  regexCache.set(phrase, re);
  return re;
}

/**
 * اصطلاح‌هایی از کتابخانه که در این جمله آمده‌اند. فقط عبارت‌های دوکلمه‌ای یا
 * بیشتر بررسی می‌شوند تا یک کلمه‌ی تنها اشتباهی «اصطلاح» حساب نشود.
 */
export function matchIdioms(sentence: string, idioms: Idiom[]): Idiom[] {
  const text = ` ${sentence.toLowerCase().replace(/[’]/g, "'").replace(/[^a-z' ]/g, ' ').replace(/\s+/g, ' ')} `;
  return idioms.filter((i) => {
    const re = idiomRegex(i.phrase);
    return re ? re.test(text) : false;
  });
}
