// واژه‌نامه‌ی ساده‌ی انگلیسی→فارسی برای نمایش معنی واژه‌های داخل دیالوگ‌ها.
// کلیدها همیشه با حروف کوچک ذخیره می‌شوند.
// (بعداً می‌توان این معانی را از بک‌اند هم گرفت؛ فعلاً به‌صورت محلی است.)

export interface VocabEntry {
  word: string;
  meaning: string;
}

const GLOSSARY: Record<string, string> = {
  // کافه
  cappuccino: 'کاپوچینو',
  coffee: 'قهوه',
  size: 'اندازه، سایز',
  small: 'کوچک',
  medium: 'متوسط',
  large: 'بزرگ',
  croissant: 'کروسان',
  chocolate: 'شکلاتی، شکلات',
  smells: 'بو می‌دهد',
  smell: 'بو',
  wonderful: 'فوق‌العاده',
  enjoy: 'لذت بردن',

  // خرید و پرداخت
  dollar: 'دلار',
  dollars: 'دلار',
  cents: 'سنت',
  card: 'کارت بانکی',
  cash: 'پول نقد',
  pay: 'پرداخت کردن',
  price: 'قیمت',
  expensive: 'گران',
  cheap: 'ارزان',
  cheaper: 'ارزان‌تر',
  brand: 'برند، نشان تجاری',

  // سوپرمارکت
  tuna: 'تن ماهی',
  can: 'قوطی/کنسرو (یا: توانستن)',
  everything: 'همه چیز',
  need: 'نیاز داشتن',
  needed: 'لازم داشت',
  find: 'پیدا کردن',
  found: 'پیدا کرد',

  // عمومی و پرکاربرد
  excuse: 'ببخشید',
  please: 'لطفاً',
  thank: 'تشکر کردن',
  thanks: 'ممنون',
  here: 'اینجا، بفرمایید',
  would: 'می‌خواهید (فعل کمکی)',
  could: 'می‌توانم (فعل کمکی)',
  like: 'دوست داشتن، میل داشتن',
  anything: 'هر چیزی',
  eat: 'خوردن',
  get: 'گرفتن',
  great: 'عالی',
  nice: 'خوب، دلپذیر',
  fine: 'خوب، مشکلی نیست',
  day: 'روز',
  much: 'چقدر، مقدار زیاد',
};

const STOPWORDS = new Set([
  'a', 'an', 'the', 'is', 'am', 'are', 'was', 'were', 'be', 'to', 'of', 'in',
  'on', 'at', 'and', 'or', 'but', 'i', 'you', 'he', 'she', 'it', 'we', 'they',
  'my', 'your', 'me', 'do', 'does', 'did', 'for', 'by', 'with', 'this', 'that',
  'yes', 'no', 'ok', 'okay', 'how', 'what', 'will', 'have', 'has',
]);

// معنی یک واژه (اگر در واژه‌نامه باشد)
export function lookupMeaning(word: string): string | undefined {
  return GLOSSARY[word.trim().toLowerCase()];
}

// استخراج واژه‌های معنادار یک جمله‌ی دیالوگ که برایشان معنی داریم
export function getDialogueWords(text: string): VocabEntry[] {
  const seen = new Set<string>();
  const out: VocabEntry[] = [];

  const tokens = (text || '')
    .toLowerCase()
    .replace(/[^a-z'\s-]/g, ' ')
    .split(/\s+/);

  for (const raw of tokens) {
    const w = raw.replace(/^['-]+|['-]+$/g, '');
    if (w.length < 2) continue;
    if (STOPWORDS.has(w)) continue;
    if (seen.has(w)) continue;

    const meaning = GLOSSARY[w];
    if (!meaning) continue; // فقط واژه‌هایی که معنی داریم را نشان می‌دهیم

    seen.add(w);
    out.push({ word: w, meaning });
  }

  return out;
}
