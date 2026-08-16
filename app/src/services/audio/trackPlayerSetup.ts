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

export function ensureTrackPlayerSetup(): Promise<void> {
  if (!setupPromise) {
    setupPromise = TrackPlayer.setupPlayer({
      // این اپ music player نیست؛ فقط یک صدای مرجع کوتاه در یک لحظه پخش
      // می‌شود، پس صف/کنترل‌های پیشرفته لازم نیست.
      maxCacheSize: 1024 * 10, // ۱۰ مگابایت؛ صداهای جمله چند ده کیلوبایتی‌اند
    })
      .then(() =>
        TrackPlayer.updateOptions({
          // بدون این، اندروید انتظار دارد notification/media-session کامل
          // تنظیم شده باشد؛ چون این اپ کنترل پس‌زمینه/لاک‌اسکرین نمی‌خواهد،
          // قابلیت‌ها را خالی می‌گذاریم.
          capabilities: [Capability.Play, Capability.Pause, Capability.Stop],
          notificationCapabilities: [],
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
