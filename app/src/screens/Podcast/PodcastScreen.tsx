import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Image, ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import TrackPlayer, { Event, State } from 'react-native-track-player';
import { Pause, Play, RotateCcw, RotateCw, X } from 'lucide-react-native';

import { COLORS, SPACING, BORDER_RADIUS } from '../../theme/colors';
import { FONT_FAMILY, TEXT_STYLES } from '../../theme/typography';
import { SHADOWS } from '../../theme/elevation';
import { useLanguage } from '../../data/i18n';
import { absUrl } from '../../api/config';
import { getPodcast, type Podcast } from '../../api/podcasts';
import { ensureTrackPlayerSetup } from '../../services/audio/trackPlayerSetup';
import { track } from '../../services/analytics';
import { formatDuration } from './PodcastListScreen';

const RATES = [0.75, 1, 1.25];
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

  // رویدادهای پلیر: موقعیت برای متن هم‌زمان، وضعیت برای دکمه‌ی پخش.
  useEffect(() => {
    const progressSub = TrackPlayer.addEventListener(Event.PlaybackProgressUpdated, (d) => {
      setPositionMs(Math.round(d.position * 1000));
    });
    const stateSub = TrackPlayer.addEventListener(Event.PlaybackState, (d) => {
      setPlaying(d.state === State.Playing);
    });
    const endedSub = TrackPlayer.addEventListener(Event.PlaybackQueueEnded, () => setPlaying(false));
    return () => {
      progressSub.remove();
      stateSub.remove();
      endedSub.remove();
    };
  }, []);

  // تب‌ها بعد از خروج mount می‌مانند؛ پادکست نباید در پس‌زمینه ادامه دهد.
  useFocusEffect(
    useCallback(
      () => () => {
        TrackPlayer.pause().catch(() => {});
      },
      []
    )
  );

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
    if (podcast && positionMs >= podcast.duration_seconds * 1000 - 300) await TrackPlayer.seekTo(0);
    await TrackPlayer.play();
  };

  const seekBy = async (deltaSeconds: number) => {
    const { position } = await TrackPlayer.getProgress();
    await TrackPlayer.seekTo(Math.max(0, position + deltaSeconds));
  };

  const seekToLine = async (startMs: number) => {
    if (!ready) return;
    await TrackPlayer.seekTo(startMs / 1000);
    setPositionMs(startMs);
    if (!playing) await TrackPlayer.play();
  };

  const changeRate = async (r: number) => {
    setRate(r);
    await TrackPlayer.setRate(r).catch(() => {});
  };

  const lines = podcast?.lines ?? [];
  const activeIdx = lines.findIndex((l) => positionMs >= l.start_ms && positionMs < l.end_ms + 350);

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
        {!!podcast.cover_url && (
          <Image source={{ uri: absUrl(podcast.cover_url) }} style={styles.cover} resizeMode="cover" />
        )}
        {!!podcast.description_fa && <Text style={styles.desc}>{podcast.description_fa}</Text>}

        <View style={styles.switchRow}>
          <Text style={styles.switchLabel}>{t('podcastShowTranslation')}</Text>
          <Switch value={showTranslation} onValueChange={setShowTranslation} trackColor={{ true: COLORS.primary }} />
        </View>

        {lines.map((l, i) => {
          const isActive = i === activeIdx;
          return (
            <TouchableOpacity
              key={l.id ?? i}
              onLayout={(e) => {
                lineY.current[i] = e.nativeEvent.layout.y;
              }}
              style={[styles.line, isActive && styles.lineActive]}
              onPress={() => seekToLine(l.start_ms)}
              activeOpacity={0.8}
            >
              <Text style={[styles.speaker, i % 2 === 1 && styles.speakerAlt]}>{l.speaker}</Text>
              <Text style={[styles.lineText, isActive && styles.lineTextActive]}>{l.text}</Text>
              {showTranslation && !!l.translation_fa && <Text style={styles.translation}>{l.translation_fa}</Text>}
            </TouchableOpacity>
          );
        })}

        {podcast.vocabulary.length > 0 && (
          <View style={styles.vocabCard}>
            <Text style={styles.vocabTitle}>{t('podcastVocabulary')}</Text>
            {podcast.vocabulary.map((v, i) => (
              <View key={i} style={styles.vocabRow}>
                <Text style={styles.vocabWord}>{v.word}</Text>
                <Text style={styles.vocabMeaning}>{v.meaning_fa}</Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      <View style={[styles.player, { paddingBottom: insets.bottom + SPACING.m }]}>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
        </View>
        <View style={styles.timeRow}>
          <Text style={styles.time}>{formatDuration(positionMs / 1000)}</Text>
          <Text style={styles.time}>{formatDuration(podcast.duration_seconds)}</Text>
        </View>
        <View style={styles.controls}>
          <TouchableOpacity onPress={() => seekBy(-10)} disabled={!ready} activeOpacity={0.8}>
            <RotateCcw size={26} color={COLORS.text} />
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
          <TouchableOpacity onPress={() => seekBy(10)} disabled={!ready} activeOpacity={0.8}>
            <RotateCw size={26} color={COLORS.text} />
          </TouchableOpacity>
        </View>
        <View style={styles.rates}>
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
    borderRadius: BORDER_RADIUS.m,
    padding: SPACING.s,
    gap: 2,
  },
  lineActive: {
    backgroundColor: COLORS.primaryLight,
  },
  speaker: {
    fontFamily: FONT_FAMILY.semiBold,
    fontSize: 12,
    color: COLORS.primary,
  },
  speakerAlt: {
    color: COLORS.secondary,
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
  vocabRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: SPACING.s,
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
    gap: SPACING.xl,
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
