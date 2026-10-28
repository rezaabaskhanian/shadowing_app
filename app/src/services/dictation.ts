// مقایسه‌ی متنِ نوشته‌شده‌ی کاربر با جمله‌ی اصلی، مشترک بین دیکته‌ی مسیر و دیکته‌ی پادکست.

const CONTRACTIONS: Record<string, string> = {
  "i'm": 'i am', "you're": 'you are', "he's": 'he is', "she's": 'she is', "it's": 'it is',
  "we're": 'we are', "they're": 'they are', "that's": 'that is', "what's": 'what is',
  "where's": 'where is', "how's": 'how is', "who's": 'who is', "there's": 'there is',
  "here's": 'here is', "isn't": 'is not', "aren't": 'are not', "don't": 'do not',
  "doesn't": 'does not', "can't": 'can not', cannot: 'can not', "i'd": 'i would',
  "let's": 'let us', "i've": 'i have', "you'll": 'you will', "i'll": 'i will',
};

const NUMBERS = [
  'zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten',
  'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen', 'twenty',
];

/** متن را به کلمه‌های قابل مقایسه تبدیل می‌کند: حروف کوچک، بدون علامت، اختصارها باز، عدد به حروف. */
export function tokens(text: string): string[] {
  const words = text
    .toLowerCase()
    .replace(/[’‘`]/g, "'")
    .replace(/[^a-z0-9'\s-]/g, ' ')
    .replace(/-/g, ' ')
    .split(/\s+/)
    .filter(Boolean);
  const out: string[] = [];
  for (const w of words) {
    const expanded = CONTRACTIONS[w] ?? (/^\d+$/.test(w) && NUMBERS[Number(w)] ? NUMBERS[Number(w)] : w);
    out.push(...expanded.split(' '));
  }
  return out;
}

/** کلمه‌های پاسخ که به ترتیب درست با جمله‌ی اصلی جورند (LCS). */
export function matchAnswer(target: string[], answer: string[]): boolean[] {
  const n = target.length;
  const m = answer.length;
  const dp = Array.from({ length: n + 1 }, () => new Array<number>(m + 1).fill(0));
  for (let i = n - 1; i >= 0; i--) {
    for (let j = m - 1; j >= 0; j--) {
      dp[i][j] = target[i] === answer[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
    }
  }
  const ok = new Array<boolean>(m).fill(false);
  let i = 0;
  let j = 0;
  while (i < n && j < m) {
    if (target[i] === answer[j]) {
      ok[j] = true;
      i++;
      j++;
    } else if (dp[i + 1][j] >= dp[i][j + 1]) i++;
    else j++;
  }
  return ok;
}

/**
 * مثل matchAnswer ولی هر دو طرف را برمی‌گرداند: کدام کلمه‌های جمله‌ی اصلی پیدا شدند
 * (برای نشان دادن جاافتاده‌ها) و کدام کلمه‌های نوشته‌ی کاربر درست بودند.
 */
export function matchBoth(target: string[], answer: string[]): { targetOk: boolean[]; answerOk: boolean[] } {
  const n = target.length;
  const m = answer.length;
  const dp = Array.from({ length: n + 1 }, () => new Array<number>(m + 1).fill(0));
  for (let i = n - 1; i >= 0; i--) {
    for (let j = m - 1; j >= 0; j--) {
      dp[i][j] = target[i] === answer[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
    }
  }
  const targetOk = new Array<boolean>(n).fill(false);
  const answerOk = new Array<boolean>(m).fill(false);
  let i = 0;
  let j = 0;
  while (i < n && j < m) {
    if (target[i] === answer[j]) {
      targetOk[i] = true;
      answerOk[j] = true;
      i++;
      j++;
    } else if (dp[i + 1][j] >= dp[i][j + 1]) i++;
    else j++;
  }
  return { targetOk, answerOk };
}
