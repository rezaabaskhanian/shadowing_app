import TrackPlayer, { AppKilledPlaybackBehavior, Capability } from 'react-native-track-player';
import Sound from 'react-native-nitro-sound';

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
        maxCacheSize: 1024 * 50, // ۵۰ مگابایت کش برای پادکست‌ها و ترانه‌ها
        autoHandleInterruptions: true,
        androidWakeMode: 2, // 2 = C.WAKE_MODE_NETWORK: حفظ اتصال شبکه و WakeLock برای ادامه پخش هنگام خاموش شدن صفحه نمایش
      } as any);
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
          // قابلیت‌های کنترل پخش در نوار اعلان‌ها و لاک‌اسکرین برای ادامه پخش در پس‌زمینه و هنگام خاموش بودن صفحه
          capabilities: [
            Capability.Play,
            Capability.Pause,
            Capability.Stop,
            Capability.SkipToNext,
            Capability.SkipToPrevious,
          ],
          notificationCapabilities: [
            Capability.Play,
            Capability.Pause,
            Capability.Stop,
            Capability.SkipToNext,
            Capability.SkipToPrevious,
          ],
          // برای هایلایتِ کلمه‌به‌کلمه‌ی هم‌زمان با پخش لازم است
          progressUpdateEventInterval: 0.1,
          android: {
            appKilledPlaybackBehavior: AppKilledPlaybackBehavior.StopPlaybackAndRemoveNotification,
            stopForegroundGracePeriod: 10,
          },
        })
      )
      .catch((err) => {
        // اگر setupPlayer به هر دلیلی شکست خورد، دفعه‌ی بعد دوباره امتحان می‌کنیم
        setupPromise = null;
        throw err;
      });
  }
  return setupPromise;
}

/**
 * وقتی کاربر از اپ بیرون می‌رود:
 * برای محتوای طولانی (پادکست، ترانه، داستان) پخش نباید قطع شود تا با خاموش شدن
 * صفحه یا سوییچ بین اپ‌ها صدا ادامه داشته باشد.
 * اما صدای مرجع کوتاه (جملات شدویینگ) و ضبط صدای کاربر باید متوقف شوند.
 */
export async function stopAllAudio(): Promise<void> {
  if (setupPromise) {
    await setupPromise.catch(() => {});
    const active = await TrackPlayer.getActiveTrack().catch(() => undefined);
    const isLongFormAudio =
      active?.id === 'podcast' ||
      active?.id === 'song' ||
      active?.id === 'story';

    if (!isLongFormAudio) {
      await TrackPlayer.reset().catch(() => {});
    }
  }
  await Sound.stopPlayer().catch(() => {});
  await Sound.stopRecorder().catch(() => {});
}
