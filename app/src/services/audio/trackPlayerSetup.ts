import TrackPlayer, { Capability } from 'react-native-track-player';

/**
 * راه‌اندازیِ یک‌بارِ TrackPlayer برای کل عمر اپ.
 *
 * برخلاف کامپوننت‌های React، TrackPlayer یک ماژول native سراسری است — یک بار
 * `setupPlayer` کافی است، نه یک بار به‌ازای هر جایی که صدای مرجع را پخش
 * می‌کند. این تابع idempotent است: هر جا صدا زده شود (حتی هم‌زمان از چند
 * کامپوننت)، فقط یک بار واقعاً کار انجام می‌شود و بقیه همان Promise را
 * می‌گیرند.
 */
let setupPromise: Promise<void> | null = null;

const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

/**
 * بار اولِ بعد از نصب یا Clear Data، سرویس پخش اندروید هنوز کامل بالا نیامده
 * و `setupPlayer` گاهی شکست می‌خورد؛ بدون تلاش دوباره، جمله‌ی اول هیچ‌وقت پخش
 * نمی‌شد چون تا تغییر بعدیِ جمله کسی دوباره درخواست پخش نمی‌داد. خطای «قبلاً
 * راه‌اندازی شده» هم یعنی پخش‌کننده آماده است، نه شکست.
 */
async function setupWithRetry(): Promise<void> {
  for (let attempt = 0; ; attempt++) {
    try {
      await TrackPlayer.setupPlayer({
        // این اپ music player نیست؛ فقط یک صدای مرجع کوتاه در یک لحظه پخش
        // می‌شود، پس صف/کنترل‌های پیشرفته لازم نیست.
        maxCacheSize: 1024 * 10, // ۱۰ مگابایت؛ صداهای جمله چند ده کیلوبایتی‌اند
      });
      return;
    } catch (err) {
      if (/already been initialized/i.test(String((err as Error)?.message ?? err))) return;
      if (attempt >= 2) throw err;
      await wait(400 * (attempt + 1));
    }
  }
}

export function ensureTrackPlayerSetup(): Promise<void> {
  if (!setupPromise) {
    setupPromise = setupWithRetry()
      .then(() =>
        TrackPlayer.updateOptions({
          // بدون این، اندروید انتظار دارد notification/media-session کامل
          // تنظیم شده باشد؛ چون این اپ کنترل پس‌زمینه/لاک‌اسکرین نمی‌خواهد،
          // قابلیت‌ها را خالی می‌گذاریم.
          capabilities: [Capability.Play, Capability.Pause, Capability.Stop],
          notificationCapabilities: [],
          // برای هایلایتِ کلمه‌به‌کلمه‌ی هم‌زمان با پخش لازم است؛ پیش‌فرض
          // کتابخانه (۱ ثانیه) خیلی درشت است.
          progressUpdateEventInterval: 0.1,
        })
      )
      .catch((err) => {
        // اگر setupPlayer به هر دلیلی شکست خورد (مثلاً یک‌بار قبلاً موفق شده
        // و این تلاش دوم است)، دفعه‌ی بعد دوباره امتحان می‌کنیم به‌جای اینکه
        // برای همیشه در حالت خراب بمانیم.
        setupPromise = null;
        throw err;
      });
  }
  return setupPromise;
}
