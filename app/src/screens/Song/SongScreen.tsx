import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Image, ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import TrackPlayer, { Event, State } from 'react-native-track-player';
import Sound from 'react-native-nitro-sound';
import * as RNFS from '@dr.pogodin/react-native-fs';
import { useFrameCallback, useSharedValue } from 'react-native-reanimated';
import { Download, Headphones, ListMusic, Mic, Music, Pause, Play, RotateCcw, RotateCw, SkipBack, SkipForward, Square, X } from 'lucide-react-native';
import { GradientFill } from '../../components/GradientFill';
import { formatDuration } from '../Podcast/PodcastListScreen';

import { COLORS, SPACING, hexToRgba } from '../../theme/colors';
import { FONT_FAMILY, TEXT_STYLES } from '../../theme/typography';
import { useLanguage } from '../../data/i18n';
import { absUrl } from '../../api/config';
import { getSong, type Song } from '../../api/songs';
import { ensureTrackPlayerSetup } from '../../services/audio/trackPlayerSetup';
import { ensureMicPermission } from '../../services/micPermission';
import { addTake, exportTake, getTake, type SongTake } from '../../services/songTakes';
import { track } from '../../services/analytics';
import { KaraokeText } from '../../components/KaraokeText';
import { levelColor } from '../../components/ContentVisuals';
import {
  HiddenLineBar,
  MaskedLine,
  MemorizePicker,
  hiddenWordIndexes,
  useMemorizeLevel,
  type MemorizeLevel,
} from '../../components/SongMemorize';

const SONG_TRACK_ID = 'song';

// play() زودتر از شروع واقعی صدا برمی‌گردد (آهنگ هنوز از شبکه بافر می‌شود)؛ تا وقتی
// واقعاً پخش نشده، ضبط یا پخش صدای کاربر را شروع نمی‌کنیم وگرنه از موزیک جلو می‌افتد.
async function waitUntilPlaying(timeoutMs = 15000): Promise<boolean> {
  const until = Date.now() + timeoutMs;
  while (Date.now() < until) {
    const { state } = await TrackPlayer.getPlaybackState();
    if (state === State.Playing) return true;
    if (state === State.Error) return false;
    await new Promise<void>((r) => setTimeout(r, 80));
  }
  return false;
}
// صدای خود کاربر روی موزیک: موزیک کمی آرام‌تر تا صدایش شنیده شود.
const BACKING_VOLUME_ON_REPLAY = 0.6;

type Mode = 'listen' | 'sing';
// مراحل «با آهنگ بخوان»: آماده، در حال ضبط، ضبط تمام شده، در حال پخشِ نسخه‌ی خودم.
type SingStep = 'idle' | 'recording' | 'recorded' | 'replaying';

/**
 * صفحه‌ی آهنگ، دو حالت:
 * - «گوش بده و بخوان»: مثل داستان، متن خط‌به‌خط و کلمه‌به‌کلمه هم‌زمان با آهنگ روشن
 *   می‌شود؛ لمس یک خط پخش را از همان‌جا شروع می‌کند و ترجمه با لمس طولانی باز می‌شود.
 * - «با آهنگ بخوان»: نسخه‌ی بی‌کلام (اگر نباشد خود آهنگ) پخش می‌شود، متن جلوی کاربر
 *   روشن می‌شود و صدایش ضبط می‌شود؛ آخر کار صدای خودش را همراه همان موزیک می‌شنود.
 *   ضبط فقط روی گوشی می‌ماند.
 */
export const SongScreen: React.FC = () => {
  const { t, language } = useLanguage();
  // فارسی: دکمه‌ی بستن سمت راست، زبانه‌ی «گوش بده» راست، ترجمه و توضیح راست‌چین.
  const rtl = language === 'fa';
  const rr = rtl ? styles.rowReverse : null;
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const songId: string | undefined = route.params?.songId;
  // از «ضبط‌های من»: همان ضبط آماده‌ی پخش باز می‌شود.
  const takeId: string | undefined = route.params?.takeId;

  const [song, setSong] = useState<Song | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [mode, setMode] = useState<Mode>('listen');
  const [loadedUrl, setLoadedUrl] = useState<string | null>(null);
  const [playing, setPlaying] = useState(false);
  const [positionMs, setPositionMs] = useState(0);
  const [showAllFa, setShowAllFa] = useState(false);
  const [shownFa, setShownFa] = useState<Set<number>>(new Set());
  const [singStep, setSingStep] = useState<SingStep>('idle');
  // حالت «حفظ کردن»: چند درصد کلمه‌ها پنهان باشند (برای هر آهنگ روی گوشی می‌ماند).
  const [memorize, setMemorize] = useMemorizeLevel(songId);
  const [micDenied, setMicDenied] = useState(false);
  // بین زدن دکمه و شروع واقعی موزیک (بافر شدن)؛ دکمه‌ها غیرفعال و چرخنده.
  const [starting, setStarting] = useState(false);

  // ضبطِ در حال انجام (قبل از ذخیره) و آخرین ضبط ذخیره‌شده.
  const recRef = useRef<{ path: string; offsetMs: number; startedAt: number } | null>(null);
  const takeRef = useRef<SongTake | null>(null);
  const [exporting, setExporting] = useState(false);
  const [exportedTo, setExportedTo] = useState<string | null>(null);
  const [exportFailed, setExportFailed] = useState(false);
  const singStepRef = useRef<SingStep>('idle');
  singStepRef.current = singStep;

  const scrollRef = useRef<ScrollView>(null);
  const lineY = useRef<Record<number, number>>({});
  const pageY = useRef(0);
  const scrollY = useRef(0);
  const viewH = useRef(0);
  const followRef = useRef(true);
  const lastActive = useRef(-1);

  useEffect(() => {
    if (!songId) {
      setLoadError(true);
      return;
    }
    let active = true;
    getSong(songId)
      .then((s) => {
        if (!active) return;
        setSong(s);
        track('song_opened', s.id);
      })
      .catch(() => active && setLoadError(true));
    return () => {
      active = false;
    };
  }, [songId]);

  useEffect(() => {
    if (!takeId) return;
    getTake(takeId).then((tk) => {
      if (!tk) return;
      takeRef.current = tk;
      setExportedTo(tk.exportedPath ?? null);
      setMode('sing');
      setSingStep('recorded');
    });
  }, [takeId]);

  // یک پخش‌کننده‌ی سراسری داریم؛ هر بار فقط آهنگی که این حالت لازم دارد در صف است.
  const loadTrack = useCallback(
    async (url: string) => {
      if (!song) return;
      await ensureTrackPlayerSetup();
      if (loadedUrl === url) {
        await TrackPlayer.seekTo(0);
        return;
      }
      await TrackPlayer.reset();
      await TrackPlayer.add({
        id: SONG_TRACK_ID,
        url: absUrl(url),
        title: song.title,
        artist: song.artist || undefined,
        artwork: song.cover_url ? absUrl(song.cover_url) : undefined,
      });
      setLoadedUrl(url);
    },
    [song, loadedUrl],
  );

  useEffect(() => {
    if (song) loadTrack(song.audio_url).catch(() => setLoadError(true));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [song]);

  // هایلایت نرم بین دو رویداد موقعیت (مثل داستان).
  const positionSV = useSharedValue(0);
  const playingSV = useSharedValue(false);
  useFrameCallback((frame) => {
    if (playingSV.value && frame.timeSincePreviousFrame) positionSV.value += frame.timeSincePreviousFrame;
  });

  const stopRecording = useCallback(async () => {
    await TrackPlayer.pause().catch(() => {});
    try {
      const path = await Sound.stopRecorder();
      const rec = recRef.current;
      if (rec && song) {
        // هر ضبط جدا در «ضبط‌های من» می‌ماند؛ طولش برای اینکه پخش همان‌جا تمام شود.
        takeRef.current = await addTake(path || rec.path, {
          songId: song.id,
          title: song.title,
          artist: song.artist,
          coverUrl: song.cover_url,
          offsetMs: rec.offsetMs,
          durationMs: Math.max(500, Date.now() - rec.startedAt),
        });
        setExportedTo(null);
        setExportFailed(false);
      }
      setSingStep('recorded');
      track('song_sing_recorded', song?.id);
    } catch {
      setSingStep('idle');
    }
  }, [song]);

  const stopReplay = useCallback(async () => {
    await TrackPlayer.pause().catch(() => {});
    await TrackPlayer.setVolume(1).catch(() => {});
    await Sound.stopPlayer().catch(() => {});
    setSingStep('recorded');
  }, []);
  const stopReplayRef = useRef(stopReplay);
  stopReplayRef.current = stopReplay;

  const saveToPhone = async () => {
    const tk = takeRef.current;
    if (!tk || exporting) return;
    setExporting(true);
    setExportFailed(false);
    try {
      setExportedTo(await exportTake(tk));
      track('song_take_exported', tk.songId);
    } catch {
      setExportFailed(true);
    } finally {
      setExporting(false);
    }
  };

  useEffect(() => {
    const progressSub = TrackPlayer.addEventListener(Event.PlaybackProgressUpdated, (d) => {
      const ms = Math.round(d.position * 1000);
      positionSV.value = ms;
      setPositionMs(ms);
      // نسخه‌ی خودم فقط تا جایی که کاربر خوانده پخش می‌شود، نه تا آخر آهنگ.
      const tk = takeRef.current;
      if (singStepRef.current === 'replaying' && tk && ms >= tk.offsetMs + tk.durationMs) stopReplayRef.current();
    });
    const stateSub = TrackPlayer.addEventListener(Event.PlaybackState, (d) => {
      playingSV.value = d.state === State.Playing;
      setPlaying(d.state === State.Playing);
    });
    const endedSub = TrackPlayer.addEventListener(Event.PlaybackQueueEnded, () => {
      playingSV.value = false;
      setPlaying(false);
      // آخر موزیک = آخر ضبط یا آخر پخشِ نسخه‌ی خودم.
      if (singStepRef.current === 'recording') stopRecording();
      else if (singStepRef.current === 'replaying') stopReplay();
    });
    return () => {
      progressSub.remove();
      stateSub.remove();
      endedSub.remove();
    };
  }, [positionSV, playingSV, stopRecording, stopReplay]);

  // ترک صفحه: صدا و ضبط و پخشِ ضبط همه قطع.
  useFocusEffect(
    useCallback(
      () => () => {
        TrackPlayer.pause().catch(() => {});
        TrackPlayer.setVolume(1).catch(() => {});
        Sound.stopPlayer().catch(() => {});
        if (singStepRef.current === 'recording') Sound.stopRecorder().catch(() => {});
      },
      [],
    ),
  );

  // ---------- گوش بده ----------
  const togglePlay = async () => {
    if (!song) return;
    if (playing) {
      await TrackPlayer.pause();
      return;
    }
    if (loadedUrl !== song.audio_url) await loadTrack(song.audio_url);
    if (positionMs >= song.duration_seconds * 1000 - 300) await TrackPlayer.seekTo(0);
    followRef.current = true;
    await TrackPlayer.play();
    track('song_played', song.id);
  };

  const playFrom = async (startMs: number) => {
    if (!song || mode !== 'listen') return;
    if (loadedUrl !== song.audio_url) await loadTrack(song.audio_url);
    followRef.current = true;
    await TrackPlayer.seekTo(startMs / 1000);
    positionSV.value = startMs;
    setPositionMs(startMs);
    if (!playing) await TrackPlayer.play();
  };

  // ---------- جابه‌جایی در آهنگ ----------
  const [trackWidth, setTrackWidth] = useState(1);
  const durationMs = (song?.duration_seconds ?? 0) * 1000;
  const progress = durationMs > 0 ? Math.min(1, positionMs / durationMs) : 0;
  const seekToMs = async (ms: number) => {
    if (!song || mode !== 'listen') return;
    if (loadedUrl !== song.audio_url) await loadTrack(song.audio_url);
    const target = Math.max(0, Math.min(durationMs, ms));
    followRef.current = true;
    lastActive.current = -1;
    await TrackPlayer.seekTo(target / 1000);
    positionSV.value = target;
    setPositionMs(target);
  };
  const seekBy = (sec: number) => seekToMs(positionMs + sec * 1000);
  const seekToFraction = (x: number) => seekToMs((x / trackWidth) * durationMs);
  const songLines = song?.lines ?? [];
  // خط قبلی: اگر بیش از یک ثانیه از خط فعلی گذشته، همین خط از اول.
  const prevLine = () => {
    const idx = songLines.findIndex((l) => positionMs >= l.start_ms && positionMs < l.end_ms + 250);
    if (idx >= 0 && positionMs - songLines[idx].start_ms > 1000) return seekToMs(songLines[idx].start_ms);
    const before = [...songLines].reverse().find((l) => l.start_ms < positionMs - 300 && l !== songLines[idx]);
    return seekToMs(before ? before.start_ms : 0);
  };
  const nextLine = () => {
    const after = songLines.find((l) => l.start_ms > positionMs + 100);
    if (after) seekToMs(after.start_ms);
  };

  const toggleFa = (i: number) =>
    setShownFa((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });

  // ---------- با آهنگ بخوان ----------
  const switchMode = async (m: Mode) => {
    if (m === mode || singStep === 'recording' || starting) return;
    await TrackPlayer.pause().catch(() => {});
    await Sound.stopPlayer().catch(() => {});
    await TrackPlayer.setVolume(1).catch(() => {});
    if (singStep === 'replaying') setSingStep('recorded');
    setMode(m);
    positionSV.value = 0;
    setPositionMs(0);
    lastActive.current = -1;
    scrollRef.current?.scrollTo({ y: 0, animated: true });
  };

  const startSinging = async () => {
    if (!song || !song.instrumental_url || starting) return;
    if (!(await ensureMicPermission())) {
      setMicDenied(true);
      return;
    }
    setMicDenied(false);
    setStarting(true);
    try {
      await Sound.stopPlayer().catch(() => {});
      await loadTrack(song.instrumental_url);
      await TrackPlayer.setVolume(1).catch(() => {});
      await TrackPlayer.seekTo(0);
      await TrackPlayer.play();
      if (!(await waitUntilPlaying())) return;
      const path = `${RNFS.CachesDirectoryPath}/song_rec_${Date.now()}.m4a`;
      try {
        await Sound.startRecorder(path, undefined, false);
      } catch {
        await TrackPlayer.pause().catch(() => {});
        setMicDenied(true);
        return;
      }
      // ضبط از این لحظه‌ی موزیک شروع شده؛ موقع پخش، موزیک از همین‌جا شروع می‌شود.
      const { position } = await TrackPlayer.getProgress();
      recRef.current = { path, offsetMs: Math.round(position * 1000), startedAt: Date.now() };
      followRef.current = true;
      lastActive.current = -1;
      setSingStep('recording');
      track('song_sing_started', song.id);
    } finally {
      setStarting(false);
    }
  };

  const replayMine = async () => {
    const take = takeRef.current;
    if (!take || !song?.instrumental_url || starting) return;
    setStarting(true);
    try {
      await loadTrack(song.instrumental_url);
      await TrackPlayer.setVolume(BACKING_VOLUME_ON_REPLAY).catch(() => {});
      await TrackPlayer.seekTo(take.offsetMs / 1000);
      await TrackPlayer.play();
      if (!(await waitUntilPlaying())) return;
      try {
        await Sound.startPlayer(take.path);
      } catch {
        await TrackPlayer.pause().catch(() => {});
        return;
      }
      followRef.current = true;
      lastActive.current = -1;
      setSingStep('replaying');
      track('song_sing_replayed', song.id);
    } finally {
      setStarting(false);
    }
  };

  // ---------- متن ----------
  const lines = song?.lines ?? [];
  const activeIdx =
    playing || positionMs > 0
      ? lines.findIndex((l) => positionMs >= l.start_ms && positionMs < l.end_ms + 250)
      : -1;

  // مرحله‌ی «از حفظ»: خطی که تا ~۱.۲ ثانیه‌ی دیگر شروع می‌شود، نشانه‌ی «آماده باش» می‌گیرد.
  const upcomingIdx =
    memorize === 100 && (playing || positionMs > 0)
      ? lines.findIndex((l) => positionMs >= l.start_ms - 1200 && positionMs < l.start_ms)
      : -1;
  const longestLine = Math.max(1, ...lines.map((l) => l.text.length));

  useEffect(() => {
    if (activeIdx < 0 || activeIdx === lastActive.current) return;
    lastActive.current = activeIdx;
    if (!followRef.current) return;
    const ly = lineY.current[activeIdx];
    if (ly === undefined) return;
    const y = pageY.current + ly;
    const top = scrollY.current;
    // وقت خواندن، خط فعلی همیشه بالای صفحه باشد تا خط بعدی هم دیده شود؛ وقت گوش دادن
    // فقط وقتی از دید بیرون رفت.
    const singing = singStep === 'recording' || singStep === 'replaying';
    if (singing || y < top + 40 || y > top + viewH.current - 160) {
      scrollRef.current?.scrollTo({ y: Math.max(0, y - (singing ? 120 : 160)), animated: true });
    }
  }, [activeIdx, singStep]);

  if (loadError) {
    return (
      <View style={[styles.center, { paddingTop: insets.top }]}>
        <Text style={styles.muted}>{t('songLoadError')}</Text>
        <TouchableOpacity onPress={() => navigation.goBack()} activeOpacity={0.8}>
          <Text style={styles.link}>{t('close')}</Text>
        </TouchableOpacity>
      </View>
    );
  }
  if (!song) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={COLORS.primary} />
      </View>
    );
  }

  const accent = levelColor(song.level);
  const singing = singStep === 'recording';

  return (
    <View style={[styles.container, { paddingTop: insets.top + SPACING.s }]}>
      <View style={[styles.topBar, rr]}>
        <TouchableOpacity style={styles.closeBtn} onPress={() => navigation.goBack()} activeOpacity={0.8} disabled={singing}>
          <X size={18} color={COLORS.text} />
        </TouchableOpacity>
        <View style={[styles.flex, styles.alignStart]}>
          <Text style={styles.title} numberOfLines={1}>
            {song.title}
          </Text>
          {!!song.artist && (
            <Text style={styles.artist} numberOfLines={1}>
              {song.artist}
            </Text>
          )}
        </View>
      </View>

      {/* دو حالت صفحه */}
      <View style={[styles.tabs, rr]}>
        {(['listen', 'sing'] as Mode[]).map((m) => {
          const on = mode === m;
          const Icon = m === 'listen' ? Headphones : Mic;
          return (
            <TouchableOpacity
              key={m}
              style={[styles.tab, on && { backgroundColor: accent }]}
              onPress={() => switchMode(m)}
              disabled={singing}
              activeOpacity={0.85}
            >
              <Icon size={15} color={on ? COLORS.white : COLORS.textSecondary} />
              <Text style={[styles.tabText, on && styles.tabTextOn]}>{m === 'listen' ? t('songListenTab') : t('songSingTab')}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <ScrollView
        ref={scrollRef}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        onScrollBeginDrag={() => {
          followRef.current = false;
        }}
        onScroll={(e) => {
          scrollY.current = e.nativeEvent.contentOffset.y;
        }}
        scrollEventThrottle={64}
        onLayout={(e) => {
          viewH.current = e.nativeEvent.layout.height;
        }}
      >
        {mode === 'listen' ? (
          <>
            <View style={[styles.cover, { backgroundColor: accent }]}>
              {song.cover_url ? (
                <Image source={{ uri: absUrl(song.cover_url) }} style={styles.coverImage} resizeMode="cover" />
              ) : (
                <>
                  <GradientFill from={hexToRgba(accent, 0.75)} to={accent} />
                  <View style={styles.coverIcon}>
                    <Music size={26} color={COLORS.white} />
                  </View>
                </>
              )}
              <View style={[styles.coverChip, rtl ? styles.coverChipLeft : styles.coverChipRight]}>
                <Text style={styles.coverChipText}>{t('songCoverChip')}</Text>
              </View>
            </View>
            {!!song.description_fa && <Text style={styles.desc}>{song.description_fa}</Text>}
            <View style={[styles.switchRow, rr]}>
              <View style={[styles.switchInline, rr]}>
                <Text style={styles.switchLabel}>{t('podcastShowTranslation')}</Text>
                <Switch value={showAllFa} onValueChange={setShowAllFa} trackColor={{ true: accent }} />
              </View>
              <Text style={[styles.hint, { textAlign: rtl ? 'left' : 'right' }]}>{t('songListenHint')}</Text>
            </View>
          </>
        ) : (
          <View style={[styles.singCard, rr, { backgroundColor: hexToRgba(accent, 0.08) }]}>
            <View style={[styles.singIcon, { backgroundColor: hexToRgba(accent, 0.14) }]}>
              <Music size={16} color={accent} />
            </View>
            <Text style={styles.singHint}>
              {song.instrumental_url ? t('songSingHint') : t('songNoInstrumental')}
            </Text>
          </View>
        )}
        {micDenied && <Text style={styles.error}>{t('songNoMic')}</Text>}

        <MemorizePicker
          level={memorize}
          onChange={setMemorize}
          title={t('songMemorizeTitle')}
          labels={{
            0: t('songMemorizeFull'),
            50: t('songMemorizeHalf'),
            70: t('songMemorizeMost'),
            100: t('songMemorizeAll'),
          }}
          accent={accent}
          rtl={rtl}
        />

        <View
          style={styles.page}
          onLayout={(e) => {
            pageY.current = e.nativeEvent.layout.y;
          }}
        >
          {lines.map((l, i) => {
            const isActive = i === activeIdx;
            const showFa = mode === 'listen' && (showAllFa || shownFa.has(i));
            return (
              <View
                key={i}
                onLayout={(e) => {
                  lineY.current[i] = e.nativeEvent.layout.y;
                }}
              >
                <TouchableOpacity
                  style={[styles.line, isActive && { backgroundColor: hexToRgba(accent, 0.12) }]}
                  onPress={() => playFrom(l.start_ms)}
                  onLongPress={() => toggleFa(i)}
                  disabled={mode !== 'listen'}
                  activeOpacity={0.75}
                >
                  {memorize === 100 ? (
                    <HiddenLineBar
                      startMs={l.start_ms}
                      endMs={l.end_ms}
                      positionMs={positionSV}
                      active={isActive}
                      upcoming={i === upcomingIdx}
                      accent={accent}
                      lengthRatio={0.25 + 0.75 * (l.text.length / longestLine)}
                      rtl={rtl}
                    />
                  ) : memorize > 0 ? (
                    <MaskedLine
                      text={l.text}
                      hidden={hiddenWordIndexes(l.text.split(/\s+/).filter(Boolean), memorize as MemorizeLevel, `${song.id}:${i}`)}
                      textStyle={StyleSheet.flatten([
                        styles.lineText,
                        mode === 'sing' && styles.lineTextSing,
                        isActive && styles.lineTextActive,
                      ])}
                      accent={accent}
                    />
                  ) : isActive ? (
                    <KaraokeText
                      text={l.text}
                      startMs={l.start_ms}
                      endMs={l.end_ms}
                      positionMs={positionSV}
                      textStyle={StyleSheet.flatten([styles.lineText, mode === 'sing' && styles.lineTextSing, styles.lineTextActive])}
                    />
                  ) : (
                    <Text style={[styles.lineText, mode === 'sing' && styles.lineTextSing]}>{l.text}</Text>
                  )}
                  {showFa && !!l.translation_fa && <Text style={styles.translation}>{l.translation_fa}</Text>}
                </TouchableOpacity>
              </View>
            );
          })}
        </View>
      </ScrollView>

      {/* نوار پایین */}
      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + SPACING.s }]}>
        {mode === 'listen' ? (
          // پخش‌کننده‌ی کامل مثل پادکست: نوار زمان قابل لمس، ۱۰ ثانیه عقب/جلو، خط قبلی/بعدی.
          <View style={styles.playerWrap}>
            <TouchableOpacity
              activeOpacity={1}
              onLayout={(e) => setTrackWidth(e.nativeEvent.layout.width || 1)}
              onPress={(e) => seekToFraction(e.nativeEvent.locationX)}
              style={styles.progressHit}
            >
              <View style={styles.progressTrack}>
                <View style={[styles.progressFill, { width: `${progress * 100}%`, backgroundColor: accent }]} />
                <View style={[styles.progressThumb, { backgroundColor: accent }]} />
              </View>
            </TouchableOpacity>
            <View style={styles.timeRow}>
              <Text style={styles.time}>{formatDuration(positionMs / 1000)}</Text>
              <Text style={styles.time}>{formatDuration(song.duration_seconds)}</Text>
            </View>
            <View style={styles.controls}>
              <TouchableOpacity onPress={prevLine} activeOpacity={0.8} hitSlop={8}>
                <SkipBack size={22} color={COLORS.text} />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => seekBy(-10)} activeOpacity={0.8} hitSlop={8}>
                <RotateCcw size={22} color={COLORS.text} />
              </TouchableOpacity>
              <TouchableOpacity style={[styles.mainBtn, { backgroundColor: accent }]} onPress={togglePlay} activeOpacity={0.85}>
                {playing ? <Pause size={22} color={COLORS.white} /> : <Play size={22} color={COLORS.white} fill={COLORS.white} />}
              </TouchableOpacity>
              <TouchableOpacity onPress={() => seekBy(10)} activeOpacity={0.8} hitSlop={8}>
                <RotateCw size={22} color={COLORS.text} />
              </TouchableOpacity>
              <TouchableOpacity onPress={nextLine} activeOpacity={0.8} hitSlop={8}>
                <SkipForward size={22} color={COLORS.text} />
              </TouchableOpacity>
            </View>
          </View>
        ) : starting ? (
          <View style={[styles.wideBtn, { backgroundColor: hexToRgba(accent, 0.6) }]}>
            <ActivityIndicator color={COLORS.white} />
            <Text style={styles.wideBtnText}>{t('songGettingReady')}</Text>
          </View>
        ) : singStep === 'idle' ? (
          <TouchableOpacity
            style={[styles.wideBtn, { backgroundColor: song.instrumental_url ? accent : COLORS.border }]}
            onPress={startSinging}
            disabled={!song.instrumental_url}
            activeOpacity={0.85}
          >
            <Mic size={18} color={COLORS.white} />
            <Text style={styles.wideBtnText}>{t('songStartSinging')}</Text>
          </TouchableOpacity>
        ) : singStep === 'recording' ? (
          <TouchableOpacity style={[styles.wideBtn, styles.recBtn]} onPress={stopRecording} activeOpacity={0.85}>
            <Square size={16} color={COLORS.white} fill={COLORS.white} />
            <Text style={styles.wideBtnText}>{t('songStopSinging')}</Text>
          </TouchableOpacity>
        ) : (
          <View style={[styles.row, rr]}>
            <TouchableOpacity
              style={[styles.wideBtn, styles.flex, rr, styles.mineBtn]}
              onPress={singStep === 'replaying' ? stopReplay : replayMine}
              activeOpacity={0.85}
            >
              {singStep === 'replaying' ? (
                <Pause size={18} color={COLORS.white} />
              ) : (
                <Play size={18} color={COLORS.white} fill={COLORS.white} />
              )}
              <Text style={styles.wideBtnText}>{singStep === 'replaying' ? t('songStopMine') : t('songPlayMine')}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.ghostBtn}
              onPress={async () => {
                if (singStep === 'replaying') await stopReplay();
                startSinging();
              }}
              activeOpacity={0.85}
            >
              <RotateCcw size={16} color={COLORS.text} />
              <Text style={styles.ghostBtnText}>{t('songSingAgain')}</Text>
            </TouchableOpacity>
          </View>
        )}
        {mode === 'sing' && (singStep === 'recorded' || singStep === 'replaying') && (
          <View style={[styles.row, styles.saveRow, rr]}>
            <TouchableOpacity style={[styles.ghostBtn, styles.flex]} onPress={saveToPhone} disabled={exporting} activeOpacity={0.85}>
              {exporting ? <ActivityIndicator size="small" color={COLORS.text} /> : <Download size={16} color={COLORS.text} />}
              <Text style={styles.ghostBtnText}>{exportedTo ? t('songSavedToPhone') : t('songSaveToPhone')}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.ghostBtn, styles.flex]} onPress={() => navigation.navigate('SongTakes')} activeOpacity={0.85}>
              <ListMusic size={16} color={COLORS.text} />
              <Text style={styles.ghostBtnText}>{t('songMyTakes')}</Text>
            </TouchableOpacity>
          </View>
        )}
        {exportFailed && <Text style={styles.error}>{t('songSaveFailed')}</Text>}
        {!!exportedTo && <Text style={styles.savedHint}>{t('songSavedWhere')}</Text>}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  rowReverse: { flexDirection: 'row-reverse' },
  progressThumb: { width: 14, height: 14, borderRadius: 7, marginHorizontal: -7 },
  alignStart: { alignItems: 'flex-start' },
  coverIcon: { width: 56, height: 56, borderRadius: 28, backgroundColor: 'rgba(255,255,255,0.18)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)', alignItems: 'center', justifyContent: 'center' },
  coverChip: { position: 'absolute', bottom: 10, paddingHorizontal: 10, paddingVertical: 3, borderRadius: 8, backgroundColor: 'rgba(0,0,0,0.35)' },
  coverChipLeft: { left: 10 },
  coverChipRight: { right: 10 },
  coverChipText: { fontFamily: FONT_FAMILY.semiBold, fontSize: 10, color: COLORS.white },
  singIcon: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  mineBtn: { backgroundColor: '#E2643A' },
  container: { flex: 1, backgroundColor: COLORS.white },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: SPACING.s, backgroundColor: COLORS.background },
  muted: { ...TEXT_STYLES.bodyMd, color: COLORS.textSecondary, textAlign: 'center' },
  link: { ...TEXT_STYLES.labelMd, color: COLORS.primary, fontFamily: FONT_FAMILY.semiBold },
  flex: { flex: 1 },
  topBar: { flexDirection: 'row', alignItems: 'center', gap: SPACING.s, paddingHorizontal: SPACING.l },
  closeBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: '#F2F2F5', alignItems: 'center', justifyContent: 'center' },
  title: { fontFamily: FONT_FAMILY.bold, fontSize: 17, lineHeight: 26, color: COLORS.text, textAlign: 'left' },
  artist: { fontFamily: FONT_FAMILY.regular, fontSize: 12, lineHeight: 18, color: COLORS.textSecondary, textAlign: 'left' },
  tabs: { flexDirection: 'row', gap: 6, marginHorizontal: SPACING.l, marginTop: SPACING.m, padding: 4, borderRadius: 14, backgroundColor: '#F2F2F5' },
  tab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 9, borderRadius: 11 },
  tabText: { fontFamily: FONT_FAMILY.medium, fontSize: 12, color: COLORS.textSecondary },
  tabTextOn: { color: COLORS.white, fontFamily: FONT_FAMILY.bold },
  content: { padding: SPACING.l, paddingBottom: SPACING.xl, gap: SPACING.m },
  cover: { height: 150, borderRadius: 18, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  coverImage: { width: '100%', height: '100%' },
  desc: { fontFamily: FONT_FAMILY.regular, fontSize: 13, lineHeight: 21, color: COLORS.textSecondary, textAlign: 'right' },
  switchRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: SPACING.s },
  hint: { flex: 1, fontFamily: FONT_FAMILY.regular, fontSize: 11, lineHeight: 17, color: COLORS.muted, textAlign: 'right' },
  switchInline: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  switchLabel: { fontFamily: FONT_FAMILY.medium, fontSize: 12, color: COLORS.textSecondary },
  singCard: { flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: 14, padding: 12 },
  singHint: { flex: 1, fontFamily: FONT_FAMILY.regular, fontSize: 12, lineHeight: 19, color: COLORS.textSecondary, textAlign: 'right' },
  error: { fontFamily: FONT_FAMILY.medium, fontSize: 12, color: COLORS.error, textAlign: 'center' },
  page: { gap: 4 },
  line: { borderRadius: 10, paddingHorizontal: 10, paddingVertical: 8 },
  lineText: { fontFamily: FONT_FAMILY.semiBold, fontSize: 17, lineHeight: 27, color: COLORS.text, textAlign: 'center' },
  lineTextSing: { fontSize: 20, lineHeight: 31, textAlign: 'center' },
  lineTextActive: { fontFamily: FONT_FAMILY.bold },
  translation: { fontFamily: FONT_FAMILY.regular, fontSize: 12, lineHeight: 20, color: COLORS.textSecondary, textAlign: 'center', marginTop: 2 },
  bottomBar: { paddingHorizontal: SPACING.l, paddingTop: SPACING.s, borderTopWidth: 1, borderTopColor: '#F0F0F3', backgroundColor: COLORS.white, alignItems: 'center' },
  playerWrap: { alignSelf: 'stretch', gap: 4 },
  progressHit: { paddingVertical: 8 },
  progressTrack: { flexDirection: 'row', alignItems: 'center', height: 5, borderRadius: 3, backgroundColor: '#ECEEF2' },
  progressFill: { height: '100%' },
  timeRow: { flexDirection: 'row', justifyContent: 'space-between' },
  time: { fontFamily: FONT_FAMILY.medium, fontSize: 11, color: COLORS.textSecondary },
  controls: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: SPACING.l },
  mainBtn: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center' },
  row: { flexDirection: 'row', gap: SPACING.s, alignSelf: 'stretch' },
  wideBtn: {
    alignSelf: 'stretch',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 48,
    borderRadius: 14,
  },
  recBtn: { backgroundColor: COLORS.error },
  saveRow: { marginTop: SPACING.s },
  savedHint: { fontFamily: FONT_FAMILY.regular, fontSize: 11, color: COLORS.textSecondary, textAlign: 'center', marginTop: 4 },
  wideBtnText: { fontFamily: FONT_FAMILY.bold, fontSize: 14, color: COLORS.white },
  ghostBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 48,
    paddingHorizontal: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  ghostBtnText: { fontFamily: FONT_FAMILY.bold, fontSize: 13, color: COLORS.text },
});
