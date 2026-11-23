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

export interface ProsodyEvaluation {
  /** نمره مکث و پیوستگی گفتار (اتصال کلمات و درنگ‌های طبیعی) */
  pauseAndLinkingScore: number;
  pauseAndLinkingFeedback: string;
  /** نمره تکیه و استرس روی کلمات کلیدی محتوایی */
  stressScore: number;
  stressFeedback: string;
  /** نمره ریتم و لحن فراز و فرود جمله */
  intonationScore: number;
  intonationFeedback: string;
}

/**
 * ارزیابی سه‌گانه شادوئینگ بر اساس اصول علمی:
 * ۱. Pauses & Connected Speech: پیوستگی صامت‌ها و مصوت‌ها و عدم مکث‌های بی‌موقع
 * ۲. Sentence Stress: ادای شفاف و قوی کلمات کلیدی (Content Words)
 * ۳. Intonation: رعایت لحن بالا رونده (پرسشی) یا افتان (خبری) در انتهای جمله
 */
export function evaluateShadowingProsody(
  targetText: string,
  words?: Array<{ word: string; status: 'ok' | 'weak' | 'missing'; score: number }>,
  fluencyScore: number = 75,
  overallScore: number = 75
): ProsodyEvaluation {
  const analysis = analyzeProsody(targetText);
  const wordTokens = analysis.tokens.filter((t) => t.isWord);

  // ۱. ارزیابی تکیه و استرس (Sentence Stress)
  const stressedTokens = wordTokens.filter((t) => t.isStressed);
  let stressedOkCount = 0;
  let stressedTotal = stressedTokens.length || 1;
  const weakStressedWords: string[] = [];

  if (words && words.length > 0) {
    // تطبیق با کلمات ارزیابی شده
    words.forEach((w, idx) => {
      const token = wordTokens[idx];
      if (token && token.isStressed) {
        if (w.status === 'ok') {
          stressedOkCount++;
        } else {
          weakStressedWords.push(token.cleanWord);
        }
      }
    });
  } else {
    // اگر کلمات تفکیکی در دسترس نبود از نمره کلی تقریب می‌زنیم
    stressedOkCount = Math.round((overallScore / 100) * stressedTotal);
  }

  const stressRatio = stressedOkCount / stressedTotal;
  const stressScore = Math.min(100, Math.round(stressRatio * 70 + (overallScore || 70) * 0.3));

  let stressFeedback = 'تکیه روی کلمات کلیدی عالی و رسا بود ✨';
  if (stressScore < 60) {
    stressFeedback = weakStressedWords.length > 0
      ? `کلمات پرمعنی مثل «${weakStressedWords.slice(0, 2).join('، ')}» نیاز به تاکید و انرژی بیشتری دارند.`
      : 'کلمات کلیدی جمله را با انرژی و کشش بیشتری نسبت به کلمات کمکی ادا کنید.';
  } else if (stressScore < 80) {
    stressFeedback = 'تکیه روی اغلب کلمات مهم خوب بود، روی کلمات انتهایی بیشتر تاکید کنید.';
  }

  // ۲. ارزیابی پیوستگی و مکث (Pauses & Connected Speech)
  const linkingPairs = wordTokens.filter((t) => t.linksToNext);
  let linkingOkCount = 0;
  const linkingTotal = linkingPairs.length;

  if (words && words.length > 0 && linkingTotal > 0) {
    linkingPairs.forEach((t) => {
      const idx = wordTokens.indexOf(t);
      const currOk = words[idx]?.status === 'ok';
      const nextOk = words[idx + 1]?.status === 'ok';
      if (currOk && nextOk) linkingOkCount++;
    });
  } else {
    linkingOkCount = Math.round((fluencyScore / 100) * (linkingTotal || 1));
  }

  const linkingRatio = linkingTotal > 0 ? linkingOkCount / linkingTotal : 0.9;
  const pauseAndLinkingScore = Math.min(100, Math.round(linkingRatio * 50 + (fluencyScore || 70) * 0.5));

  let pauseAndLinkingFeedback = 'پیوستگی صداها و اتصال صامت به مصوت بسیار پیوسته و روان بود 🌊';
  if (pauseAndLinkingScore < 65) {
    pauseAndLinkingFeedback = 'از مکث بین کلماتی که به هم وصل می‌شوند (علامت ‿) خودداری کرده و آن‌ها را یکپارچه بگویید.';
  } else if (pauseAndLinkingScore < 85) {
    pauseAndLinkingFeedback = 'جریان پیوستگی کلمات خوب بود؛ به نقاط مکث طبیعی (/) در جملات دقت کنید.';
  }

  // ۳. ارزیابی ریتم و لحن پایان جمله (Intonation)
  const lastWords = words && words.length >= 2 ? words.slice(-2) : [];
  const lastWordsOk = lastWords.length === 0 || lastWords.every((w) => w.status === 'ok');
  const baseIntonation = lastWordsOk ? (overallScore * 0.6 + fluencyScore * 0.4) : (overallScore * 0.4 + fluencyScore * 0.3);
  const intonationScore = Math.min(100, Math.max(30, Math.round(baseIntonation)));

  let intonationFeedback = '';
  if (analysis.intonation === 'rising') {
    intonationFeedback = intonationScore >= 75
      ? 'لحن خیزان (↑) در انتهای این پرسش به زیبایی اجرا شد 🎵'
      : 'در سوالات بله/خیر یا لحن پرسشی، در کلمه آخر تُن صدا را بالا ببرید (↑).';
  } else {
    intonationFeedback = intonationScore >= 75
      ? 'افت مطمئن لحن (↓) در انتهای جمله کاملاً شبیه به گوینده بومی بود 👏'
      : 'در پایان جملات خبری یا امری اجازه دهید آهنگ صدا ملایم فرود بیاید (↓).';
  }

  return {
    pauseAndLinkingScore,
    pauseAndLinkingFeedback,
    stressScore,
    stressFeedback,
    intonationScore,
    intonationFeedback,
  };
}

