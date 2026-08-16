import TrackPlayer, { Event } from 'react-native-track-player';

/**
 * سرویس پخش برای TrackPlayer — یک الزام اندروید است (بدون ثبت این سرویس،
 * `setupPlayer` روی برخی دستگاه‌ها شکست می‌خورد یا سرویس پس‌زمینه بالا
 * نمی‌آید).
 *
 * این اپ music player نیست و کنترل لاک‌اسکرین/بلوتوث نمی‌خواهد، پس فقط
 * رویدادهای remote را به دستورهای ساده‌ی play/pause/stop وصل می‌کنیم — همین
 * برای اینکه سرویس معتبر باشد کافی است.
 */
export async function PlaybackService(): Promise<void> {
  TrackPlayer.addEventListener(Event.RemotePlay, () => TrackPlayer.play());
  TrackPlayer.addEventListener(Event.RemotePause, () => TrackPlayer.pause());
  TrackPlayer.addEventListener(Event.RemoteStop, () => TrackPlayer.stop());
}
