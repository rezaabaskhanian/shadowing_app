/**
 * تحلیل‌گر ساختار عروضی، ریتم و پیوستگی گفتار (Prosody, Stress & Connected Speech)
 * بر اساس راهنمای استاندارد شادوئینگ:
 * ۱. استرس جمله (Sentence Stress): تفکیک کلمات حامل بار معنایی (Content Words) از کلمات دستوری (Function Words)
 * ۲. پیوستگی گفتار (Connected Speech / Liaison): اتصال صامت پایانی به مصوت آغازین کلمه بعد (‿)
 * ۳. اوج و فرود لحن (Intonation Contour): خیزان (↑) یا افتان (↓) بر اساس نوع ساختار جمله
 * ۴. مکث‌های تنفس (Thought Group Pauses): نشانه‌گذاری نقاط مکث طبیعی (/)
 */

// کلمات گرامری و کمکی ضعیف (Function Words) که در انگلیسی بدون استرس و کوتاه (Weak form) تلفظ می‌شوند:
const UNSTRESSED_FUNCTION_WORDS = new Set([
  // حروف تعریف
  'a', 'an', 'the',
  // ضمایر فاعلی و مفعولی
  'i', 'you', 'he', 'she', 'it', 'we', 'they', 'me', 'him', 'her', 'us', 'them',
  // ضمایر ملکی
  'my', 'your', 'his', 'its', 'our', 'their',
  // حروف اضافه کوتاه
  'to', 'at', 'of', 'in', 'on', 'for', 'from', 'with', 'by', 'as', 'into', 'onto',
  // افعال کمکی مثبت ضعیف (در حالت منفی مثل don't استرس دارند)
  'is', 'am', 'are', 'was', 'were', 'be', 'been', 'being',
  'do', 'does', 'did',
  'have', 'has', 'had',
  'can', 'could', 'will', 'would', 'shall', 'should', 'may', 'might', 'must',
  // حروف ربط
  'and', 'but', 'or', 'so', 'if', 'than', 'that', 'though',
]);

const VOWELS = new Set(['a', 'e', 'i', 'o', 'u', 'A', 'E', 'I', 'O', 'U']);

export interface ProsodyToken {
  /** متن خام کلمه */
  raw: string;
  /** کلمه تمیز شده */
  cleanWord: string;
  /** آیا یک کلمه است یا نشانه نگارشی */
  isWord: boolean;
  /** آیا کلمه دارای استرس و تکیه است؟ (Content Word) */
  isStressed: boolean;
  /** آیا این کلمه با کلمه بعدی پیوند آوایی (Connected Speech) دارد؟ */
  linksToNext: boolean;
  /** آیا بعد از این کلمه یک مکث طبیعی قرار دارد؟ */
  hasPauseAfter: boolean;
  /** پیشوند یا پسوند علائم نگارشی */
  prefixPunct: string;
  suffixPunct: string;
}

export interface ProsodyAnalysis {
  tokens: ProsodyToken[];
  /** نوع لحن در انتهای جمله: خیزان (↑) یا افتان (↓) */
  intonation: 'rising' | 'falling';
  /** علامت لحن جهت نمایش بصری */
  intonationSymbol: '↑' | '↓';
  /** توضیح کوتاه آموزشی لحن جمله برای زبان‌آموز */
  intonationDescFa: string;
}

/**
 * تشخیص نوع لحن (Intonation) در انتهای جمله:
 * - سوالات بله/خیر و درخواست‌های مودبانه: لحن خیزان (Rising ↑)
 * - جملات خبری، امری و سوالات Wh-دار: لحن افتان (Falling ↓)
 */
function detectIntonation(sentence: string): { type: 'rising' | 'falling'; symbol: '↑' | '↓'; desc: string } {
  const trimmed = sentence.trim();
  const isQuestion = trimmed.endsWith('?');

  if (!isQuestion) {
    return {
      type: 'falling',
      symbol: '↓',
      desc: 'لحن افتان (Falling): در پایان جملات خبری صدا با اطمینان فرو می‌نشیند.',
    };
  }

  // بررسی سوال Wh-دار یا بله/خیر
  const firstWordMatch = trimmed.match(/^[a-zA-Z]+/);
  const firstWord = firstWordMatch ? firstWordMatch[0].toLowerCase() : '';

  const whWords = ['what', 'where', 'when', 'why', 'who', 'whom', 'whose', 'which', 'how'];
  if (whWords.includes(firstWord)) {
    return {
      type: 'falling',
      symbol: '↓',
      desc: 'لحن افتان (Falling): در سوالات با کلمات پرسشی Wh- لحن در پایان جمله ملایم فرود می‌آید.',
    };
  }

  // سوالات بله/خیر با فعل کمکی
  return {
    type: 'rising',
    symbol: '↑',
    desc: 'لحن خیزان (Rising): در سوالات بله/خیر و درخواست‌ها تُن صدا در پایان بالا می‌رود.',
  };
}

/**
 * آیا حرف پایانی یک صامت و حرف آغازین کلمه بعدی یک مصوت است؟
 * (قاعده اصلی اتصال پیوسته صامت به مصوت C -> V)
 */
function checkLinking(currentWord: string, nextWord: string): boolean {
  if (!currentWord || !nextWord) return false;
  const cleanCurr = currentWord.replace(/[^a-zA-Z]/g, '').toLowerCase();
  const cleanNext = nextWord.replace(/[^a-zA-Z]/g, '').toLowerCase();
  if (cleanCurr.length === 0 || cleanNext.length === 0) return false;

  const lastChar = cleanCurr[cleanCurr.length - 1];
  const firstChar = cleanNext[0];

  // صامت بودن حرف آخر کلمه اول و مصوت بودن حرف اول کلمه دوم
  const isLastConsonant = !VOWELS.has(lastChar);
  const isNextVowel = VOWELS.has(firstChar);

  // استثنائات رایج: اگر آخر کلمه e ناخوانا باشد (مانند make it -> صامت k به مصوت i وصل می‌شود)
  if (cleanCurr.endsWith('e') && cleanCurr.length > 2) {
    const secondLast = cleanCurr[cleanCurr.length - 2];
    if (!VOWELS.has(secondLast) && isNextVowel) {
      return true;
    }
  }

  return isLastConsonant && isNextVowel;
}

/**
 * تجزیه و تحلیل کامل متن جمله برای ساخت نقشه عروضی شادوئینگ
 */
export function analyzeProsody(sentence: string): ProsodyAnalysis {
  if (!sentence || !sentence.trim()) {
    return {
      tokens: [],
      intonation: 'falling',
      intonationSymbol: '↓',
      intonationDescFa: '',
    };
  }

  const intonationInfo = detectIntonation(sentence);
  const rawParts = sentence.trim().split(/\s+/);

  const parsedWords: Array<{
    raw: string;
    clean: string;
    prefix: string;
    suffix: string;
    hasCommaOrDash: boolean;
  }> = [];

  for (const part of rawParts) {
    const match = part.match(/^([^a-zA-Z0-9]*)([a-zA-Z0-9'’-]*)([^a-zA-Z0-9]*)$/);
    if (match) {
      const prefix = match[1] || '';
      const clean = match[2] || '';
      const suffix = match[3] || '';
      const hasCommaOrDash = suffix.includes(',') || suffix.includes(';') || suffix.includes('—') || suffix.includes('-');
      parsedWords.push({
        raw: part,
        clean,
        prefix,
        suffix,
        hasCommaOrDash,
      });
    } else {
      parsedWords.push({
        raw: part,
        clean: part,
        prefix: '',
        suffix: '',
        hasCommaOrDash: false,
      });
    }
  }

  const tokens: ProsodyToken[] = [];

  for (let i = 0; i < parsedWords.length; i++) {
    const cur = parsedWords[i];
    const next = i + 1 < parsedWords.length ? parsedWords[i + 1] : null;
    const lowerClean = cur.clean.toLowerCase();

    // تعیین استرس (کلمات محتوایی استرس دارند، مگر کلمات گرامری ضعیف)
    // توجه: منفی‌ها (don't, can't, not) همیشه استرس دارند
    const isNegation = lowerClean.endsWith("n't") || lowerClean === 'not' || lowerClean === 'never';
    const isFunctionWord = UNSTRESSED_FUNCTION_WORDS.has(lowerClean);
    const isStressed = cur.clean.length > 0 && (!isFunctionWord || isNegation);

    // بررسی پیوند کلمات (Connected Speech)
    let linksToNext = false;
    if (next && !cur.hasCommaOrDash) {
      linksToNext = checkLinking(cur.clean, next.clean);
    }

    // بررسی مکث طبیعی (Thought Group Pause)
    // بعد از کاما یا قبل از حروف ربط در جملات طولانی
    const hasPauseAfter = cur.hasCommaOrDash;

    tokens.push({
      raw: cur.raw,
      cleanWord: cur.clean,
      isWord: cur.clean.length > 0,
      isStressed,
      linksToNext,
      hasPauseAfter,
      prefixPunct: cur.prefix,
      suffixPunct: cur.suffix,
    });
  }

  return {
    tokens,
    intonation: intonationInfo.type,
    intonationSymbol: intonationInfo.symbol,
    intonationDescFa: intonationInfo.desc,
  };
}
