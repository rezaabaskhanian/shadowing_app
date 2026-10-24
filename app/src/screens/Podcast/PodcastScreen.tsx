import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Image, ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import TrackPlayer, { Event, State } from 'react-native-track-player';
import { useFrameCallback, useSharedValue } from 'react-native-reanimated';
import { Mic, Pause, Play, Repeat1, RotateCcw, RotateCw, SkipBack, SkipForward, X } from 'lucide-react-native';

import { COLORS, SPACING, BORDER_RADIUS, hexToRgba } from '../../theme/colors';
import { FONT_FAMILY, TEXT_STYLES } from '../../theme/typography';
import { SHADOWS } from '../../theme/elevation';
import { useLanguage } from '../../data/i18n';
import { absUrl } from '../../api/config';
import { getPodcast, type Podcast } from '../../api/podcasts';
import { ensureTrackPlayerSetup } from '../../services/audio/trackPlayerSetup';
import { track } from '../../services/analytics';
import { formatDuration } from './PodcastListScreen';
import { KaraokeText } from '../../components/KaraokeText';
import { Slideshow, slideStarts } from '../../components/Slideshow';

const RATES = [0.5, 0.75, 1, 1.25];
// رنگ گوینده‌ها به ترتیب ورودشان؛ گوینده‌ی دوم سمت مقابل می‌نشیند.
const SPEAKER_COLORS = [COLORS.primary, COLORS.audioMine, COLORS.pink, COLORS.levelIntermediateBg];
const VOCAB_COLORS = [COLORS.primary, COLORS.audioMine, COLORS.pink, COLORS.levelBeginnerBg, COLORS.levelIntermediateBg];
const PODCAST_TRACK_ID = 'podcast';

/**
 * پخش پادکست با متن هم‌زمان: جمله‌ی در حال پخش هایلایت می‌شود، لمس هر جمله از
 * همان‌جا پخش می‌کند، ترجمه‌ی فارسی قابل نمایش است و لغت‌های مهم پایین صفحه‌اند.
 * مستقیم از TrackPlayer استفاده می‌کند (جابه‌جایی در زمان لازم است که
 * AudioPlayer ندارد)؛ با ترک صفحه پخش متوقف می‌شود.
 */
export const PodcastScreen: React.FC = () => {
  const { t } = useLanguage();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const podcastId: string | undefined = route.params?.podcastId;

  const [podcast, setPodcast] = useState<Podcast | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [ready, setReady] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [positionMs, setPositionMs] = useState(0);
  const [rate, setRate] = useState(1);
  const [showTranslation, setShowTranslation] = useState(false);
  const trackedRef = useRef(false);
  // تکرار جمله: وقتی روشن است، با رسیدن به پایانِ جمله‌ی فعلی دوباره از اولش پخش می‌شود.
  const [repeatLine, setRepeatLine] = useState(false);
  const repeatRef = useRef<{ on: boolean; start: number; end: number }>({ on: false, start: 0, end: 0 });
  const [trackWidth, setTrackWidth] = useState(1);
  const scrollRef = useRef<ScrollView>(null);
  const lineY = useRef<Record<number, number>>({});
  const lastActive = useRef(-1);

  useEffect(() => {
    if (!podcastId) {
      setLoadError(true);
      return;
    }
    let active = true;
    getPodcast(podcastId)
      .then(async (p) => {
        if (!active) return;
        setPodcast(p);
        await ensureTrackPlayerSetup();
        await TrackPlayer.reset();
        await TrackPlayer.add({
          id: PODCAST_TRACK_ID,
          url: absUrl(p.audio_url),
          title: p.title,
          artwork: p.cover_url ? absUrl(p.cover_url) : undefined,
        });
        if (active) setReady(true);
      })
      .catch(() => active && setLoadError(true));
    return () => {
      active = false;
    };
  }, [podcastId]);

  // هایلایتِ کلمه‌به‌کلمه: پلیر هر ۱۰۰ms موقعیت می‌دهد؛ بینِ دو رویداد، روی UI
  // thread با سرعتِ پخش جلو می‌بریم تا حرکتِ هایلایت نرم باشد (بدون re-render).
  const positionSV = useSharedValue(0);
  const playingSV = useSharedValue(false);
  const rateSV = useSharedValue(1);
  useFrameCallback((frame) => {
    if (playingSV.value && frame.timeSincePreviousFrame) {
      positionSV.value += frame.timeSincePreviousFrame * rateSV.value;
    }
  });

  // رویدادهای پلیر: موقعیت برای متن هم‌زمان، وضعیت برای دکمه‌ی پخش.
  useEffect(() => {
    const progressSub = TrackPlayer.addEventListener(Event.PlaybackProgressUpdated, (d) => {
      const ms = Math.round(d.position * 1000);
      const rep = repeatRef.current;
      if (rep.on && rep.end > rep.start && ms >= rep.end) {
        positionSV.value = rep.start;
        setPositionMs(rep.start);
        TrackPlayer.seekTo(rep.start / 1000).catch(() => {});
        return;
      }
      positionSV.value = ms;
      setPositionMs(ms);
    });
    const stateSub = TrackPlayer.addEventListener(Event.PlaybackState, (d) => {
      playingSV.value = d.state === State.Playing;
      setPlaying(d.state === State.Playing);
    });
    const endedSub = TrackPlayer.addEventListener(Event.PlaybackQueueEnded, () => {
      playingSV.value = false;
      setPlaying(false);
    });
    return () => {
      progressSub.remove();
      stateSub.remove();
      endedSub.remove();
    };
  }, [positionSV, playingSV]);

  // تب‌ها بعد از خروج mount می‌مانند؛ پادکست نباید در پس‌زمینه ادامه دهد.
  useFocusEffect(
    useCallback(
      () => () => {
        TrackPlayer.pause().catch(() => {});
      },
      []
    )
  );

  // TrackPlayer سراسری است؛ صفحه‌ی دیگری که در پس‌زمینه mount مانده (مثل صحنه) ممکن است
  // صف را با صدای خودش عوض کرده باشد و پخش بی‌صدا شود. قبل از هر پخش، اگر track
  // پادکست در صف نیست، دوباره می‌گذاریمش و به همان جای قبلی برمی‌گردیم.
  const ensurePodcastTrack = async () => {
    if (!podcast) return;
    const active = await TrackPlayer.getActiveTrack().catch(() => undefined);
    if (active?.id === PODCAST_TRACK_ID) return;
    await TrackPlayer.reset();
    await TrackPlayer.add({
      id: PODCAST_TRACK_ID,
      url: absUrl(podcast.audio_url),
      title: podcast.title,
      artwork: podcast.cover_url ? absUrl(podcast.cover_url) : undefined,
    });
    await TrackPlayer.setRate(rate).catch(() => {});
    if (positionMs > 0) await TrackPlayer.seekTo(positionMs / 1000);
  };

  const togglePlay = async () => {
    if (!ready) return;
    if (playing) {
      await TrackPlayer.pause();
      return;
    }
    if (!trackedRef.current && podcast) {
      trackedRef.current = true;
      track('podcast_played', podcast.id);
    }
    // بعد از پایان، دوباره از اول.
    await ensurePodcastTrack();
    if (podcast && positionMs >= podcast.duration_seconds * 1000 - 300) await TrackPlayer.seekTo(0);
    await TrackPlayer.play();
  };

  const seekBy = async (deltaSeconds: number) => {
    const { position } = await TrackPlayer.getProgress();
    const target = Math.max(0, position + deltaSeconds);
    positionSV.value = target * 1000;
    await TrackPlayer.seekTo(target);
  };

  const seekToLine = async (startMs: number) => {
    if (!ready) return;
    // پرش به جمله‌ی دیگر یعنی تکرارِ جمله‌ی قبلی تمام شد.
    repeatRef.current = { on: false, start: 0, end: 0 };
    setRepeatLine(false);
    await ensurePodcastTrack();
    await TrackPlayer.seekTo(startMs / 1000);
    positionSV.value = startMs;
    setPositionMs(startMs);
    if (!playing) await TrackPlayer.play();
  };

  const changeRate = async (r: number) => {
    setRate(r);
    rateSV.value = r;
    await TrackPlayer.setRate(r).catch(() => {});
  };

  const lines = podcast?.lines ?? [];
  const speakers: string[] = [];
  lines.forEach((l) => {
    if (!speakers.includes(l.speaker)) speakers.push(l.speaker);
  });
  const speakerTone = (name: string) => {
    const idx = Math.max(0, speakers.indexOf(name));
    return { color: SPEAKER_COLORS[idx % SPEAKER_COLORS.length], alt: idx % 2 === 1 };
  };
  const activeIdx = lines.findIndex((l) => positionMs >= l.start_ms && positionMs < l.end_ms + 350);

  // جمله‌ی قبلی/بعدی: اگر بیش از یک ثانیه از جمله‌ی فعلی گذشته، «قبلی» همین جمله را از اول پخش می‌کند.
  const prevLine = () => {
    const idx = lines.findIndex((l) => positionMs >= l.start_ms && positionMs < l.end_ms + 350);
    if (idx >= 0 && positionMs - lines[idx].start_ms > 1000) return seekToLine(lines[idx].start_ms);
    const before = [...lines].reverse().find((l) => l.start_ms < positionMs - 200 && l !== lines[idx]);
    return seekToLine(before ? before.start_ms : 0);
  };
  const nextLine = () => {
    const after = lines.find((l) => l.start_ms > positionMs + 100);
    if (after) seekToLine(after.start_ms);
  };

  const toggleRepeat = () => {
    const line = lines[activeIdx];
    if (repeatLine || !line) {
      repeatRef.current = { on: false, start: 0, end: 0 };
      setRepeatLine(false);
      return;
    }
    repeatRef.current = { on: true, start: line.start_ms, end: line.end_ms + 150 };
    setRepeatLine(true);
  };

  // لمس هر جای نوار پیشرفت = پرش به همان لحظه.
  const seekToFraction = async (x: number) => {
    if (!ready || !podcast) return;
    const ms = Math.max(0, Math.min(1, x / trackWidth)) * podcast.duration_seconds * 1000;
    repeatRef.current = { on: false, start: 0, end: 0 };
    setRepeatLine(false);
    positionSV.value = ms;
    setPositionMs(ms);
    await TrackPlayer.seekTo(ms / 1000);
  };

  // جمله‌ی در حال پخش همیشه در دید بماند.
  useEffect(() => {
    if (activeIdx < 0 || activeIdx === lastActive.current) return;
    lastActive.current = activeIdx;
    const y = lineY.current[activeIdx];
    if (y !== undefined) scrollRef.current?.scrollTo({ y: Math.max(0, y - 120), animated: true });
  }, [activeIdx]);

  if (loadError) {
    return (
      <View style={[styles.container, styles.center, { paddingTop: insets.top }]}>
        <Text style={styles.mutedText}>{t('podcastLoadError')}</Text>
        <TouchableOpacity onPress={() => navigation.goBack()} activeOpacity={0.8}>
          <Text style={styles.linkText}>{t('podcastBack')}</Text>
        </TouchableOpacity>
      </View>
    );
  }
  if (!podcast) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator color={COLORS.primary} />
      </View>
    );
  }

  // اسلایدشو: عکسِ فعال = آخرین عکسی که شروعش (جمله) قبل از جمله‌ی در حال پخش است.
  const slideImages = (podcast.images || []).filter((img) => !!img.url);
  const currentLine =
    activeIdx >= 0 ? activeIdx : lines.reduce((last, l, i) => (l.start_ms <= positionMs ? i : last), 0);
  const starts = slideStarts(slideImages, lines.length);
  const activeSlide = starts.reduce((cur, s) => (s.start <= currentLine ? s.index : cur), starts[0]?.index ?? 0);

  const durationMs = Math.max(1, podcast.duration_seconds * 1000);
  const progress = Math.min(1, positionMs / durationMs);

  return (
    <View style={[styles.container, { paddingTop: insets.top + SPACING.s }]}>
      <View style={styles.topRow}>
        <TouchableOpacity style={styles.closeBtn} onPress={() => navigation.goBack()} activeOpacity={0.8}>
          <X size={20} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.topTitle} numberOfLines={1}>
          {podcast.title}
        </Text>
      </View>

      <ScrollView
        ref={scrollRef}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* تصویرِ پادکست (یا صحنه‌ی مرتبط)؛ بدون تصویر چیزی جایش نمی‌آید. */}
        {slideImages.length > 0 ? (
          <Slideshow
            uris={slideImages.map((img) => absUrl(img.url))}
            activeIndex={activeSlide}
            playing={playing}
            style={styles.cover}
          />
        ) : (
          !!podcast.cover_url && (
            <Image source={{ uri: absUrl(podcast.cover_url) }} style={styles.cover} resizeMode="cover" />
          )
        )}
        {!!podcast.description_fa && <Text style={styles.desc}>{podcast.description_fa}</Text>}

        {/* «نسخه‌ی من»: کاربر جمله‌های یک مجری را خودش ضبط می‌کند (PodcastMyVersionScreen). */}
        {lines.length > 0 && (
          <TouchableOpacity
            style={styles.myVersionBtn}
            activeOpacity={0.85}
            onPress={async () => {
              await TrackPlayer.pause().catch(() => {});
              navigation.navigate('PodcastMyVersion', { podcastId: podcast.id, openedAt: Date.now() });
            }}
          >
            <Mic size={18} color={COLORS.primary} />
            <Text style={styles.myVersionText}>{t('myVersionButton')}</Text>
          </TouchableOpacity>
        )}

        <View style={styles.switchRow}>
          <Text style={styles.switchLabel}>{t('podcastShowTranslation')}</Text>
          <Switch value={showTranslation} onValueChange={setShowTranslation} trackColor={{ true: COLORS.primary }} />
        </View>

        {lines.map((l, i) => {
          const isActive = i === activeIdx;
          // هر گوینده رنگ و سمت خودش را دارد (مثل گفتگوی چت) تا نوبتِ حرف زدن
          // با یک نگاه معلوم باشد.
          const tone = speakerTone(l.speaker);
          return (
            <TouchableOpacity
              key={l.id ?? i}
              onLayout={(e) => {
                lineY.current[i] = e.nativeEvent.layout.y;
              }}
              style={[
                styles.line,
                tone.alt && styles.lineAlt,
                { backgroundColor: hexToRgba(tone.color, isActive ? 0.16 : 0.06) },
                isActive && { borderColor: tone.color },
              ]}
              onPress={() => seekToLine(l.start_ms)}
              activeOpacity={0.8}
            >
              <View style={styles.speakerRow}>
                <View style={[styles.avatar, { backgroundColor: tone.color }]}>
                  <Text style={styles.avatarText}>{l.speaker.charAt(0).toUpperCase()}</Text>
                </View>
                <Text style={[styles.speaker, { color: tone.color }]}>{l.speaker}</Text>
              </View>
              {isActive ? (
                <KaraokeText
                  text={l.text}
                  startMs={l.start_ms}
                  endMs={l.end_ms}
                  positionMs={positionSV}
                  textStyle={StyleSheet.flatten([styles.lineText, styles.lineTextActive])}
                />
              ) : (
                <Text style={styles.lineText}>{l.text}</Text>
              )}
              {showTranslation && !!l.translation_fa && <Text style={styles.translation}>{l.translation_fa}</Text>}
            </TouchableOpacity>
          );
        })}

        {podcast.vocabulary.length > 0 && (
          <View style={styles.vocabCard}>
            <Text style={styles.vocabTitle}>{t('podcastVocabulary')}</Text>
            <View style={styles.vocabChips}>
              {podcast.vocabulary.map((v, i) => {
                const c = VOCAB_COLORS[i % VOCAB_COLORS.length];
                return (
                  <View key={i} style={[styles.vocabChip, { backgroundColor: hexToRgba(c, 0.1), borderColor: hexToRgba(c, 0.35) }]}>
                    <Text style={[styles.vocabWord, { color: c }]}>{v.word}</Text>
                    <Text style={styles.vocabMeaning}>{v.meaning_fa}</Text>
                  </View>
                );
              })}
            </View>
          </View>
        )}
      </ScrollView>

      <View style={[styles.player, { paddingBottom: insets.bottom + SPACING.m }]}>
        <TouchableOpacity
          activeOpacity={1}
          onLayout={(e) => setTrackWidth(e.nativeEvent.layout.width || 1)}
          onPress={(e) => seekToFraction(e.nativeEvent.locationX)}
          style={styles.progressHit}
        >
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
          </View>
        </TouchableOpacity>
        <View style={styles.timeRow}>
          <Text style={styles.time}>{formatDuration(positionMs / 1000)}</Text>
          <Text style={styles.time}>{formatDuration(podcast.duration_seconds)}</Text>
        </View>
        <View style={styles.controls}>
          <TouchableOpacity onPress={prevLine} disabled={!ready} activeOpacity={0.8} hitSlop={8}>
            <SkipBack size={24} color={COLORS.text} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => seekBy(-10)} disabled={!ready} activeOpacity={0.8} hitSlop={8}>
            <RotateCcw size={24} color={COLORS.text} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.playBtn} onPress={togglePlay} disabled={!ready} activeOpacity={0.85}>
            {!ready ? (
              <ActivityIndicator color={COLORS.white} />
            ) : playing ? (
              <Pause size={28} color={COLORS.white} fill={COLORS.white} />
            ) : (
              <Play size={28} color={COLORS.white} fill={COLORS.white} />
            )}
          </TouchableOpacity>
          <TouchableOpacity onPress={() => seekBy(10)} disabled={!ready} activeOpacity={0.8} hitSlop={8}>
            <RotateCw size={24} color={COLORS.text} />
          </TouchableOpacity>
          <TouchableOpacity onPress={nextLine} disabled={!ready} activeOpacity={0.8} hitSlop={8}>
            <SkipForward size={24} color={COLORS.text} />
          </TouchableOpacity>
        </View>
        <View style={styles.rates}>
          <TouchableOpacity
            style={[styles.rateBtn, repeatLine && styles.rateBtnActive]}
            onPress={toggleRepeat}
            disabled={!ready || (activeIdx < 0 && !repeatLine)}
            activeOpacity={0.85}
          >
            <Repeat1 size={14} color={repeatLine ? COLORS.white : COLORS.textSecondary} />
          </TouchableOpacity>
          {RATES.map((r) => (
            <TouchableOpacity
              key={r}
              style={[styles.rateBtn, rate === r && styles.rateBtnActive]}
              onPress={() => changeRate(r)}
              activeOpacity={0.85}
            >
              <Text style={[styles.rateText, rate === r && styles.rateTextActive]}>{r}x</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  myVersionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.full,
    paddingVertical: 10,
    marginBottom: SPACING.m,
    backgroundColor: COLORS.primaryLight,
  },
  myVersionText: {
    color: COLORS.primary,
    fontFamily: FONT_FAMILY.bold,
    fontSize: 14,
  },
  cover: {
    width: '100%',
    aspectRatio: 16 / 9,
    borderRadius: BORDER_RADIUS.l,
    backgroundColor: COLORS.surfaceLight,
    marginBottom: SPACING.m,
  },
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  center: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.s,
  },
  mutedText: {
    ...TEXT_STYLES.bodyMd,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  linkText: {
    ...TEXT_STYLES.labelMd,
    color: COLORS.primary,
    fontFamily: FONT_FAMILY.semiBold,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.s,
    paddingHorizontal: SPACING.l,
    paddingBottom: SPACING.s,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topTitle: {
    flex: 1,
    fontFamily: FONT_FAMILY.bold,
    fontSize: 16,
    color: COLORS.text,
  },
  content: {
    paddingHorizontal: SPACING.l,
    paddingBottom: SPACING.l,
    gap: SPACING.s,
  },
  desc: {
    ...TEXT_STYLES.bodyMd,
    color: COLORS.textSecondary,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  switchLabel: {
    ...TEXT_STYLES.labelMd,
    color: COLORS.text,
  },
  line: {
    borderRadius: BORDER_RADIUS.l,
    borderWidth: 1.5,
    borderColor: 'transparent',
    padding: SPACING.s,
    paddingHorizontal: SPACING.m,
    gap: 4,
    maxWidth: '90%',
    alignSelf: 'flex-start',
  },
  lineAlt: {
    alignSelf: 'flex-end',
  },
  speakerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  avatar: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: COLORS.white,
    fontFamily: FONT_FAMILY.bold,
    fontSize: 11,
  },
  speaker: {
    fontFamily: FONT_FAMILY.semiBold,
    fontSize: 12,
  },
  lineText: {
    ...TEXT_STYLES.bodyMd,
    color: COLORS.textSecondary,
  },
  lineTextActive: {
    color: COLORS.text,
    fontFamily: FONT_FAMILY.semiBold,
  },
  translation: {
    ...TEXT_STYLES.labelMd,
    color: COLORS.muted,
  },
  vocabCard: {
    marginTop: SPACING.m,
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.l,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.m,
    gap: SPACING.s,
    ...SHADOWS.level1,
  },
  vocabTitle: {
    fontFamily: FONT_FAMILY.semiBold,
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  vocabChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.s,
  },
  vocabChip: {
    borderRadius: BORDER_RADIUS.m,
    borderWidth: 1,
    paddingHorizontal: SPACING.m,
    paddingVertical: 6,
    alignItems: 'center',
  },
  vocabWord: {
    ...TEXT_STYLES.bodyMd,
    color: COLORS.text,
    fontFamily: FONT_FAMILY.semiBold,
    flexShrink: 1,
  },
  vocabMeaning: {
    ...TEXT_STYLES.bodyMd,
    color: COLORS.textSecondary,
    flexShrink: 1,
  },
  player: {
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    backgroundColor: COLORS.surface,
    paddingHorizontal: SPACING.l,
    paddingTop: SPACING.m,
    gap: SPACING.s,
  },
  progressTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.surfaceHigh,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.primary,
  },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  time: {
    ...TEXT_STYLES.labelSm,
    color: COLORS.muted,
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.l,
  },
  progressHit: {
    paddingVertical: 8,
  },
  playBtn: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.level2,
  },
  rates: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: SPACING.s,
  },
  rateBtn: {
    borderRadius: BORDER_RADIUS.full,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  rateBtnActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  rateText: {
    ...TEXT_STYLES.labelMd,
    color: COLORS.text,
  },
  rateTextActive: {
    color: COLORS.white,
  },
});
