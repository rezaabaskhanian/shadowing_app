import type React from 'react';
import { useEffect, useRef } from 'react';
import * as RNFS from '@dr.pogodin/react-native-fs';
import TrackPlayer, { Event, State } from 'react-native-track-player';
import Sound from 'react-native-nitro-sound';

import { ensureTrackPlayerSetup } from '../services/audio/trackPlayerSetup';

/**
 * موتور صدای اپ: دو مسیر کاملاً جدا با دو کتابخانه‌ی native.
 *
 *  - صدای مرجع (سرور) → `react-native-track-player`. این کتابخانه برای پخش
 *    ساخته شده و مستقیم از URL شبکه می‌خواند؛ چون یک ماژول native است نه
 *    وب‌ویو، محدودیت origin/mixed-content که قبلاً کل این کامپوننت را پیچیده
 *    کرده بود اصلاً وجود ندارد.
 *  - ضبط صدای کاربر و پخش دوباره‌ی آن → `react-native-nitro-sound`. برخلاف
 *    نسخه‌ی قبلی (MediaRecorder داخل وب‌ویو که خروجی‌اش دیتا-یو‌آر‌ال بود)،
 *    این کتابخانه مستقیم روی دیسک می‌نویسد و مسیر فایل را برمی‌گرداند — دیگر
 *    نیازی به تبدیل base64 نیست.
 *
 * این کامپوننت هیچ UI ای رندر نمی‌کند؛ فقط state بیرونی را به دستور واقعی
 * ترجمه می‌کند، شبیه یک ref imperitive که با props کنترل می‌شود.
 */

interface AudioPlayerProps {
  /** آدرس صدای مرجع (از سرور). */
  uri: string | null;
  shouldPlay: boolean;
  playbackRate?: number;
  onPlaybackStatusUpdate?: (
    status: 'loading' | 'playing' | 'paused' | 'finished' | 'error' | 'no_audio'
  ) => void;
  /**
   * موقعیتِ زنده‌ی پخش (ثانیه)، برای هایلایتِ کلمه‌به‌کلمه‌ی هم‌زمان با صدا.
   * source مشخص می‌کند این موقعیت مال صدای مرجع است یا پخشِ دوباره‌ی ضبط.
   */
  onProgress?: (positionSeconds: number, source: 'original' | 'recording') => void;
  /**
   * پایان پخشِ صدای ضبط‌شده‌ی کاربر (جدا از صدای اصلی). برای پخش پشت‌سرهمِ
   * چند ضبط لازم است تا بدانیم کِی نوبت بعدی است.
   */
  onRecordedPlaybackEnd?: () => void;
  onRecordingStatusUpdate?: (
    status: 'recording' | 'stopped' | 'error',
    filePath?: string,
    mimeType?: string
  ) => void;
  /**
   * دستور فعلی. تفاوت `play_original` و `resume` عمدی است: اولی یعنی «از اول
   * پخش کن» و دومی یعنی «از همان‌جا ادامه بده». بدون این تفکیک، پلیر باید از
   * روی داده حدس می‌زد و مکث را با تکرار اشتباه می‌گرفت.
   */
  actionCommand?:
    | 'none'
    | 'start_record'
    | 'stop_record'
    | 'play_recording'
    | 'play_original'
    | 'resume';
  /**
   * مسیر فایلِ ضبطی که دستور `play_recording` باید پخشش کند. اگر خالی باشد
   * یعنی برای این جمله هنوز ضبطی نیست.
   */
  loadedRecordingPath?: string | null;
  /**
   * با هر بار تغییر این عدد، دستور فعلی دوباره اجرا می‌شود. برای وقتی لازم
   * است همان صدا دوباره از اول پخش شود (مثلاً شروع دوباره‌ی دور تکرار) بدون
   * اینکه uri یا actionCommand عوض شوند.
   */
  actionNonce?: number;
}

/** آدرس مرجع TrackPlayer، برای تشخیص «همین صداست یا صدای جدید». */
const MASTER_TRACK_ID = 'master';

export const AudioPlayer: React.FC<AudioPlayerProps> = ({
  uri,
  shouldPlay,
  playbackRate = 1.0,
  onPlaybackStatusUpdate,
  onProgress,
  onRecordingStatusUpdate,
  onRecordedPlaybackEnd,
  actionCommand = 'none',
  actionNonce = 0,
  loadedRecordingPath = null,
}) => {
  // ============================================================
  // صدای مرجع — TrackPlayer
  // ============================================================

  useEffect(() => {
    ensureTrackPlayerSetup().catch((err) =>
      console.warn('[AudioPlayer] TrackPlayer setup failed:', err)
    );
  }, []);

  // `onPlaybackStatusUpdate`/`onProgress` روی هر رندرِ SceneScreen یک closure
  // تازه‌اند؛ اگر مستقیم در dependency باشند، این افکت هر بار listenerهای
  // native را جدا و دوباره وصل می‌کند. با نگه‌داشتنشان در ref، subscribe فقط
  // یک‌بار انجام می‌شود ولی همیشه به آخرین نسخه‌ی callback می‌رسد.
  const onPlaybackStatusUpdateRef = useRef(onPlaybackStatusUpdate);
  const onProgressRef = useRef(onProgress);
  const onRecordedPlaybackEndRef = useRef(onRecordedPlaybackEnd);
  useEffect(() => {
    onPlaybackStatusUpdateRef.current = onPlaybackStatusUpdate;
    onProgressRef.current = onProgress;
    onRecordedPlaybackEndRef.current = onRecordedPlaybackEnd;
  }, [onPlaybackStatusUpdate, onProgress, onRecordedPlaybackEnd]);

  // وقتی صدای مرجع عوض می‌شود (افکت پایین‌تر)، بینِ `reset()` و `add()`ی
  // خودمان، صف لحظه‌ای خالی می‌شود — این می‌تواند یک `PlaybackQueueEnded`
  // ساختگی شلیک کند که هیچ ربطی به تمام‌شدنِ واقعیِ صدا ندارد. بدون این پرچم،
  // آن رویداد به «finished» ترجمه می‌شد و مثلاً حبابِ دیالوگِ خطِ تازه (که
  // همان لحظه با «بعدی» باز شده) را دوباره می‌بست — همان چیزی که باعث می‌شد
  // حباب گاهی بیاید گاهی نه.
  const switchingTrackRef = useRef(false);


  useEffect(() => {
    const stateSub = TrackPlayer.addEventListener(Event.PlaybackState, (data) => {
      if (data.state === State.Playing) onPlaybackStatusUpdateRef.current?.('playing');
      else if (data.state === State.Paused) onPlaybackStatusUpdateRef.current?.('paused');
      else if (data.state === State.Error) onPlaybackStatusUpdateRef.current?.('error');
      else if (data.state === State.Loading || data.state === State.Buffering) {
        onPlaybackStatusUpdateRef.current?.('loading');
      }
    });
    // پایان صف = پایان صدای مرجع؛ چون همیشه فقط یک track در صف داریم.
    const endedSub = TrackPlayer.addEventListener(Event.PlaybackQueueEnded, () => {
      if (switchingTrackRef.current) return;
      onPlaybackStatusUpdateRef.current?.('finished');
    });
    const progressSub = TrackPlayer.addEventListener(Event.PlaybackProgressUpdated, (data) => {
      onProgressRef.current?.(data.position, 'original');
    });
    return () => {
      stateSub.remove();
      endedSub.remove();
      progressSub.remove();
    };
  }, []);

  // این دستورها مال ضبط/پخشِ ضبط‌اند، نه صدای مرجع؛ افکت پایین باید نادیده
  // بگیردشان تا با اجرای هم‌زمانشان به هم برخورد نکنند.
  const isRecordingCommand =
    actionCommand === 'start_record' ||
    actionCommand === 'stop_record' ||
    actionCommand === 'play_recording';

  useEffect(() => {
    if (isRecordingCommand) return;

    let cancelled = false;
    switchingTrackRef.current = true;
    (async () => {
      await ensureTrackPlayerSetup();
      if (cancelled) return;

      const wantsPlay =
        actionCommand === 'play_original' ||
        actionCommand === 'resume' ||
        (actionCommand === 'none' && shouldPlay);
      // فقط `play_original` یعنی «از اول». `resume` و مکث و تغییر سرعت نباید
      // موقعیت پخش را از دست بدهند.
      const wantsRestart = actionCommand === 'play_original';

      if (!uri) {
        await TrackPlayer.pause();
        // این جمله اصلاً صدای مرجع ندارد. باید صریحاً خبر بدهیم: چون هیچ
        // پخشی شروع نمی‌شود، هیچ‌وقت PlaybackQueueEnded («finished») هم
        // نمی‌آید و بدون این خبر، جریانِ خودکارِ «گوش دادن» روی همین جمله
        // برای همیشه می‌ماند و کاربر فکر می‌کند پخش خراب شده.
        //
        // فقط روی درخواستِ صریحِ پخش خبر می‌دهیم، نه روی حالتِ پیش‌فرضِ
        // (command='none' و shouldPlay=true) که هنوز هیچ جمله‌ای انتخاب نشده —
        // وگرنه همان لحظه‌ی اولِ باز شدن صفحه هم «صدا ندارد» اعلام می‌شد.
        if (wantsRestart || actionCommand === 'resume') {
          onPlaybackStatusUpdateRef.current?.('no_audio');
        }
        return;
      }

      // فقط وقتی صدا واقعاً عوض شده صف را از نو می‌سازیم؛ وگرنه همان track را
      // نگه می‌داریم و فقط seek/rate را به‌روز می‌کنیم — این‌طور صدا هر بار
      // با یک تلق کوتاهِ reload نمی‌پرد.
      const active = await TrackPlayer.getActiveTrack();
      if (active?.url !== uri) {
        await TrackPlayer.reset();
        await TrackPlayer.add({ id: MASTER_TRACK_ID, url: uri });
      } else if (wantsRestart) {
        await TrackPlayer.seekTo(0);
      }
      if (cancelled) return;

      await TrackPlayer.setRate(playbackRate);

      if (wantsPlay) {
        await TrackPlayer.play();
      } else {
        await TrackPlayer.pause();
      }
    })()
      .catch((err) => {
        console.warn('[AudioPlayer] master playback failed:', err);
        onPlaybackStatusUpdateRef.current?.('error');
      })
      .finally(() => {
        switchingTrackRef.current = false;
      });

    return () => {
      cancelled = true;
    };
  }, [uri, shouldPlay, actionCommand, actionNonce, playbackRate, isRecordingCommand]);

  // ============================================================
  // ضبط صدای کاربر و پخش دوباره‌ی آن — nitro-sound
  // ============================================================

  // مثل listenerهای TrackPlayer بالا، اینها هم فقط یک بار ثبت می‌شوند و از
  // طریق ref به آخرین callback می‌رسند. اگر خودِ propها در dependency باشند،
  // چون callerها آنها را درون‌خطی می‌سازند، با هر رندر (و صدای مرجع ۱۰ بار در
  // ثانیه رندر می‌سازد) این listenerها قطع و دوباره وصل می‌شوند — هم هدررفت
  // است و هم بینِ remove و add یک شکاف بی‌listener می‌ماند که می‌تواند رویداد
  // پایانِ پخش را ببلعد و صفِ «پخش همه‌ی ضبط‌ها» را وسط راه بخواباند.
  useEffect(() => {
    Sound.addPlaybackEndListener(() => {
      onRecordedPlaybackEndRef.current?.();
    });
    // فقط وقتی Sound.startPlayer در حال پخش است اتفاق می‌افتد (نه حین
    // ضبط)، پس برای هایلایتِ کلمه‌به‌کلمه‌ی پخشِ دوباره‌ی ضبط کافی است.
    Sound.addPlayBackListener((meta) => {
      onProgressRef.current?.(meta.currentPosition / 1000, 'recording');
    });
    return () => {
      Sound.removePlaybackEndListener();
      Sound.removePlayBackListener();
    };
  }, []);

  useEffect(() => {
    if (actionCommand === 'start_record') {
      let cancelled = false;
      (async () => {
        // صدای مرجع و ضبط قبلی نباید هم‌زمان با شروع ضبط پخش بمانند.
        await TrackPlayer.pause().catch(() => {});
        await Sound.stopPlayer().catch(() => {});

        // مسیر صریح می‌دهیم (نه پیش‌فرض کتابخانه) تا بدانیم دقیقاً کجاست؛
        // پسوند m4a چون هم اندروید (AAC/MPEG_4) و هم iOS به‌طور طبیعی همین
        // را تولید می‌کنند.
        const path = `${RNFS.DocumentDirectoryPath}/tmp_recording_${Date.now()}.m4a`;
        try {
          await Sound.startRecorder(path, undefined, false);
          if (!cancelled) onRecordingStatusUpdate?.('recording');
        } catch (err) {
          console.warn('[AudioPlayer] startRecorder failed:', err);
          if (!cancelled) onRecordingStatusUpdate?.('error');
        }
      })();
      return () => {
        cancelled = true;
      };
    }

    if (actionCommand === 'stop_record') {
      let cancelled = false;
      (async () => {
        try {
          const filePath = await Sound.stopRecorder();
          if (!cancelled) onRecordingStatusUpdate?.('stopped', filePath, 'audio/m4a');
        } catch (err) {
          console.warn('[AudioPlayer] stopRecorder failed:', err);
          if (!cancelled) onRecordingStatusUpdate?.('error');
        }
      })();
      return () => {
        cancelled = true;
      };
    }

    if (actionCommand === 'play_recording') {
      let cancelled = false;
      (async () => {
        if (!loadedRecordingPath) {
          // ضبطی برای این جمله نیست؛ باید خبر بدهیم وگرنه پخشِ پشت‌سرهم
          // برای همیشه منتظر پایانی می‌ماند که هرگز نمی‌آید.
          onRecordedPlaybackEnd?.();
          return;
        }
        try {
          await TrackPlayer.pause().catch(() => {});
          await Sound.stopPlayer().catch(() => {});
          await Sound.startPlayer(loadedRecordingPath);
        } catch (err) {
          // این خطا الان بی‌صدا قورت داده می‌شود (به نفعِ «پخش همه»، که باید
          // با شکستِ یک ضبط کامل متوقف نشود) — ولی مسیر فایل را هم لاگ
          // می‌کنیم تا اگر یک فایل خاص همیشه شکست می‌خورد (نه یک خطای موقت)
          // بشود از لاگ فهمید کدام فایل و چرا.
          console.warn('[AudioPlayer] playback of recording failed:', loadedRecordingPath, err);
          if (!cancelled) onRecordedPlaybackEnd?.();
        }
      })();
      return () => {
        cancelled = true;
      };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [actionCommand, actionNonce, loadedRecordingPath]);

  // این کامپوننت چیزی رندر نمی‌کند؛ کاملاً imperative است.
  return null;
};
