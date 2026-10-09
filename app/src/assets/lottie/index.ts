/**
 * انیمیشن‌های Lottie اپ (فایل‌های JSON از LottieFiles / After Effects).
 *
 * برای اضافه‌کردن: فایل را کنار همین فایل بگذار و مقدارِ کلید را از null به
 * require(...) عوض کن، مثلاً:
 *   courseDone: require('./course-done.json'),
 * تا وقتی null است، کامپوننت Celebration یک انیمیشنِ جایگزین با Reanimated
 * (ایموجی) نشان می‌دهد، پس اپ بدون این فایل‌ها هم کامل کار می‌کند.
 */
export type CelebrationKind = 'courseDone' | 'streak' | 'correct' | 'wrong' | 'reviewDone';

export const LOTTIE_SOURCES: Record<CelebrationKind, any | null> = {
  // جشنِ پایانِ درسِ «قدم اول» (کانفتی / ستاره)
  courseDone: require('./course-done.json'),
  // شعله‌ی استریک
  streak: require('./streak.json'),
  // جوابِ درست (تیک)
  correct: require('./correct.json'),
  // جوابِ اشتباه (ضربدر / تکان)
  wrong: require('./wrong.json'),
  // پایانِ مرورِ کلمه‌ها در جعبه‌ی لایتنر
  reviewDone: require('./review-done.json'),
};
