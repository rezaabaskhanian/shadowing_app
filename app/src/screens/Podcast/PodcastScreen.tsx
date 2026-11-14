import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import TrackPlayer, { Event, State } from 'react-native-track-player';
import { useFrameCallback, useSharedValue } from 'react-native-reanimated';
import {
  ChevronLeft,
  ChevronRight,
  Eye,
  EyeOff,
  FileText,
  Headphones,
  ListMusic,
  MessageCircle,
  Mic,
  Pause,
  Play,
  Repeat1,
  RotateCcw,
  RotateCw,
  SkipBack,
  SkipForward,
  Sparkles,
  Volume2,
  X,
} from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { COLORS, SPACING, BORDER_RADIUS, hexToRgba } from '../../theme/colors';
import { FONT_FAMILY, TEXT_STYLES } from '../../theme/typography';
import { SHADOWS } from '../../theme/elevation';
import { useLanguage } from '../../data/i18n';
import { absUrl } from '../../api/config';
import { getPodcast, getPodcasts, atOrBelowLevel, type Podcast } from '../../api/podcasts';
import { getRoleplays, type Roleplay } from '../../api/conversation';
import { getMyLevel } from '../../api/assessment';
import { getSubscriptionStatus } from '../../api/billing';
import { useAuth } from '../../data/AuthContext';
import { ensureTrackPlayerSetup } from '../../services/audio/trackPlayerSetup';
import { announceNextPodcast, playPodcastCueSound } from '../../services/audio/podcastCue';
import { track } from '../../services/analytics';
import { formatDuration } from './PodcastListScreen';
import { KaraokeText } from '../../components/KaraokeText';
import { Slideshow, slideStarts } from '../../components/Slideshow';

const RATES = [0.5, 0.75, 1, 1.25];
const FREE_PODCASTS_COUNT = 4;

const SPEAKER_COLORS = ['#2563EB', '#D97706', '#7C3AED', '#059669'];
const VOCAB_COLORS = ['#FF6422', '#2563EB', '#7C3AED', '#059669', '#D97706'];
const PODCAST_TRACK_ID = 'podcast';

/**
 * صفحه پخش پیشرفته پادکست لینگوفلو با زبان بصری مدرن و گرم
 * شامل متن هم‌زمان، کارائوکه، تغییر سرعت، تکرار جمله، پخش خودکار و سناریوهای متصل
 */
export const PodcastScreen: React.FC = () => {
  const { t, language } = useLanguage();
  const rtl = language === 'fa';
  const rr = rtl ? styles.rowReverse : null;
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { user } = useAuth();
  const [isSubscribed, setIsSubscribed] = useState(false);

  useEffect(() => {
    if (user?.role === 'admin') {
      setIsSubscribed(true);
    } else {
      getSubscriptionStatus()
        .then((s) => setIsSubscribed(!!s?.active))
        .catch(() => setIsSubscribed(false));
    }
  }, [user?.role]);

  const initialPodcastId: string | undefined = route.params?.podcastId;
  const [currentId, setCurrentId] = useState<string | undefined>(initialPodcastId);
  const currentIdRef = useRef<string | undefined>(initialPodcastId);
  currentIdRef.current = currentId;

  const [playlist, setPlaylist] = useState<Podcast[]>([]);
  const [autoplay, setAutoplay] = useState(false);
  const autoplayRef = useRef(false);
  autoplayRef.current = autoplay;
  const isTransitioningRef = useRef(false);

  const [podcast, setPodcast] = useState<Podcast | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [roleplay, setRoleplay] = useState<Roleplay | null>(null);
  const [ready, setReady] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [positionMs, setPositionMs] = useState(0);
  const [rate, setRate] = useState(1);
  const [showTranslation, setShowTranslation] = useState(false);
  const [showTranscript, setShowTranscript] = useState(false);
  const trackedRef = useRef(false);

  const [resumeMs, setResumeMs] = useState<number | null>(null);
  const lastSavedSec = useRef(0);
  const [repeatLine, setRepeatLine] = useState(false);
  const repeatRef = useRef<{ on: boolean; start: number; end: number }>({ on: false, start: 0, end: 0 });
  const [trackWidth, setTrackWidth] = useState(1);
  const scrollRef = useRef<ScrollView>(null);
  const lineY = useRef<Record<number, number>>({});
  const lastActive = useRef(-1);
  const podcastDurationRef = useRef(0);

  // محاسبه پادکست بعدی با بررسی دسترسی اشتراک
  const currentIndex = playlist.findIndex((p) => p.id === currentId);
  const isLastFreeEpisode = !isSubscribed && currentIndex >= FREE_PODCASTS_COUNT - 1;

  let nextPodcast: Podcast | null = null;
  if (currentIndex >= 0 && currentIndex + 1 < playlist.length) {
    const nextIndex = currentIndex + 1;
    if (!isSubscribed && nextIndex >= FREE_PODCASTS_COUNT) {
      nextPodcast = null;
    } else {
      nextPodcast = playlist[nextIndex];
    }
  } else if (isSubscribed && playlist.length > 1 && currentIndex === playlist.length - 1) {
    nextPodcast = playlist[0];
  }
  const nextPodcastRef = useRef<Podcast | null>(null);
  nextPodcastRef.current = nextPodcast;

  // موقعیت نرم رندر کلمه‌به‌کلمه روی UI thread
  const positionSV = useSharedValue(0);
  const playingSV = useSharedValue(false);
  const rateSV = useSharedValue(1);
  useFrameCallback((frame) => {
    if (playingSV.value && frame.timeSincePreviousFrame) {
      positionSV.value += frame.timeSincePreviousFrame * rateSV.value;
    }
  });

  const loadAndPlayPodcast = useCallback(
    async (id: string, autoPlayImmediately = false) => {
      if (!id) return;
      setCurrentId(id);
      currentIdRef.current = id;
      setReady(false);
      setPositionMs(0);
      positionSV.value = 0;
      lastActive.current = -1;

      try {
        getRoleplays()
          .then((list) => setRoleplay(list.find((r) => r.podcast_id === id) ?? null))
          .catch(() => {});

        const p = await getPodcast(id);
        setPodcast(p);
        podcastDurationRef.current = p.duration_seconds;

        Promise.all([getPodcasts().catch(() => []), getMyLevel().catch(() => null)])
          .then(([all, lvl]) => {
            if (p.series_id) {
              const seriesEps = all
                .filter((item) => item.series_id === p.series_id)
                .sort((a, b) => (a.episode_no || 0) - (b.episode_no || 0));
              if (seriesEps.length > 0) {
                setPlaylist(seriesEps);
                return;
              }
            }
            const scoped = atOrBelowLevel(all, lvl?.scene_level);
            const filtered = (scoped.length > 0 ? scoped : all).filter((item) =>
              p.kind === 'featured' ? item.kind === 'featured' : item.kind !== 'featured' && item.kind !== 'story'
            );
            setPlaylist(filtered);
          })
          .catch(() => {});

        await ensureTrackPlayerSetup();
        await TrackPlayer.reset();
        if (p.audio_url) {
          await TrackPlayer.add({
            id: PODCAST_TRACK_ID,
            url: absUrl(p.audio_url),
            title: p.title,
            artwork: p.cover_url ? absUrl(p.cover_url) : undefined,
            artist: 'LingoFlow',
          });
          await TrackPlayer.setRate(rate).catch(() => {});
        }

        // بررسی موقعیت ذخیره‌شده برای ادامه پخش خودکار (Resume Playback)
        const savedPosStr = await AsyncStorage.getItem(`@podcast_pos_${id}`).catch(() => null);
        const savedMs = savedPosStr ? parseInt(savedPosStr, 10) : 0;
        const canResume = savedMs > 3000 && savedMs < (p.duration_seconds - 5) * 1000;

        if (canResume) {
          setResumeMs(savedMs);
          positionSV.value = savedMs;
          setPositionMs(savedMs);
          await TrackPlayer.seekTo(savedMs / 1000).catch(() => {});
        } else {
          setResumeMs(null);
        }

        setReady(true);
        if (autoPlayImmediately) {
          trackedRef.current = true;
          track('podcast_played', p.id);
          await TrackPlayer.play();
        }
        scrollRef.current?.scrollTo({ y: 0, animated: false });
      } catch {
        setLoadError(true);
      }
    },
    [positionSV, rate]
  );

  const playNextEpisode = useCallback(async () => {
    const nextP = nextPodcastRef.current;
    if (!nextP || isTransitioningRef.current) return;
    isTransitioningRef.current = true;

    try {
      await TrackPlayer.pause().catch(() => {});
      await announceNextPodcast(nextP.title);
      await loadAndPlayPodcast(nextP.id, true);
    } catch {
      await loadAndPlayPodcast(nextP.id, true).catch(() => {});
    } finally {
      isTransitioningRef.current = false;
    }
  }, [loadAndPlayPodcast]);

  useEffect(() => {
    AsyncStorage.getItem('@podcast_autoplay_next').then((val) => {
      const enabled = val === 'true';
      setAutoplay(enabled);
      autoplayRef.current = enabled;
    });

    if (initialPodcastId) {
      loadAndPlayPodcast(initialPodcastId, false);
    } else {
      setLoadError(true);
    }
  }, [initialPodcastId, loadAndPlayPodcast]);

  const toggleAutoplay = (val: boolean) => {
    setAutoplay(val);
    autoplayRef.current = val;
    AsyncStorage.setItem('@podcast_autoplay_next', String(val)).catch(() => {});
  };

  const handleRestartPodcast = useCallback(async () => {
    setResumeMs(null);
    const currId = currentIdRef.current;
    if (currId) {
      await AsyncStorage.removeItem(`@podcast_pos_${currId}`).catch(() => {});
    }
    await TrackPlayer.seekTo(0).catch(() => {});
    positionSV.value = 0;
    setPositionMs(0);
  }, [positionSV]);

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

      // ذخیره‌سازی دوره‌ای موقعیت برای ادامه پخش (Resume Playback)
      const currentSec = Math.floor(d.position);
      if (Math.abs(currentSec - lastSavedSec.current) >= 3 && podcastDurationRef.current > 0) {
        lastSavedSec.current = currentSec;
        const currId = currentIdRef.current;
        if (currId) {
          if (d.position >= podcastDurationRef.current - 4) {
            AsyncStorage.removeItem(`@podcast_pos_${currId}`).catch(() => {});
            setResumeMs(null);
          } else if (d.position >= 3) {
            AsyncStorage.setItem(`@podcast_pos_${currId}`, String(ms)).catch(() => {});
          }
        }
      }

      if (
        podcastDurationRef.current > 0 &&
        d.position >= podcastDurationRef.current - 0.4 &&
        autoplayRef.current &&
        nextPodcastRef.current &&
        !isTransitioningRef.current
      ) {
        playNextEpisode();
      }
    });

    const stateSub = TrackPlayer.addEventListener(Event.PlaybackState, (d) => {
      const isPl = d.state === State.Playing;
      playingSV.value = isPl;
      setPlaying(isPl);

      if (d.state === State.Ended) {
        const currId = currentIdRef.current;
        if (currId) {
          AsyncStorage.removeItem(`@podcast_pos_${currId}`).catch(() => {});
        }
        setResumeMs(null);

        if (autoplayRef.current && nextPodcastRef.current && !isTransitioningRef.current) {
          playNextEpisode();
        }
      }
    });

    const endedSub = TrackPlayer.addEventListener(Event.PlaybackQueueEnded, () => {
      playingSV.value = false;
      setPlaying(false);
      const currId = currentIdRef.current;
      if (currId) {
        AsyncStorage.removeItem(`@podcast_pos_${currId}`).catch(() => {});
      }
      setResumeMs(null);

      if (autoplayRef.current && nextPodcastRef.current && !isTransitioningRef.current) {
        playNextEpisode();
      }
    });

    const nextRemoteSub = TrackPlayer.addEventListener(Event.RemoteNext, () => {
      if (nextPodcastRef.current) {
        playNextEpisode();
      }
    });

    return () => {
      progressSub.remove();
      stateSub.remove();
      endedSub.remove();
      nextRemoteSub.remove();
    };
  }, [positionSV, playingSV, playNextEpisode]);

  useFocusEffect(
    useCallback(
      () => () => {
        TrackPlayer.pause().catch(() => {});
      },
      []
    )
  );

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

  const prevLine = () => {
    const idx = lines.findIndex((l) => positionMs >= l.start_ms && positionMs < l.end_ms + 350);
    if (idx >= 0 && positionMs - lines[idx].start_ms > 1000) return seekToLine(lines[idx].start_ms);
    const before = [...lines].reverse().find((l) => l.start_ms < positionMs - 200 && l !== lines[idx]);
    return seekToLine(before ? before.start_ms : 0);
  };

  const nextLine = () => {
    const after = lines.find((l) => l.start_ms > positionMs + 100);
    if (after) {
      seekToLine(after.start_ms);
    } else if (nextPodcastRef.current) {
      playNextEpisode();
    }
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

  const seekToFraction = async (x: number) => {
    if (!ready || !podcast) return;
    const ms = Math.max(0, Math.min(1, x / trackWidth)) * podcast.duration_seconds * 1000;
    repeatRef.current = { on: false, start: 0, end: 0 };
    setRepeatLine(false);
    positionSV.value = ms;
    setPositionMs(ms);
    await TrackPlayer.seekTo(ms / 1000);
  };

  useEffect(() => {
    if (!showTranscript) return;
    if (activeIdx < 0 || activeIdx === lastActive.current) return;
    lastActive.current = activeIdx;
    // کاربر مایل است آزادانه در صفحه اسکرول کند، بنابراین اسکرول اجباری حذف شد
    // هایلایت خط فعال به صورت بصری و رنگی بدون تغییر موقعیت اسکرول ادامه می‌یابد
  }, [activeIdx, showTranscript]);

  const ChevronIcon = rtl ? ChevronLeft : ChevronRight;

  if (loadError) {
    return (
      <View style={[styles.container, styles.center, { paddingTop: insets.top }]}>
        <Text style={styles.mutedText}>{t('podcastLoadError')}</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={() => navigation.goBack()} activeOpacity={0.85}>
          <Text style={styles.retryBtnText}>{t('podcastBack')}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!podcast) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  const slideImages = (podcast.images || []).filter((img) => !!img.url);
  const currentLine =
    activeIdx >= 0 ? activeIdx : lines.reduce((last, l, i) => (l.start_ms <= positionMs ? i : last), 0);
  const starts = slideStarts(slideImages, lines.length);
  const activeSlide = starts.reduce((cur, s) => (s.start <= currentLine ? s.index : cur), starts[0]?.index ?? 0);

  const durationMs = Math.max(1, podcast.duration_seconds * 1000);
  const progress = Math.min(1, positionMs / durationMs);

  return (
    <View style={[styles.container, { paddingTop: insets.top + SPACING.s }]}>
      {/* سربرگ مدرن پلیر با دکمه بازگشت و تغییر وضعیت متن */}
      <View style={[styles.topRow, rr]}>
        <TouchableOpacity
          style={styles.circleBtn}
          onPress={() => navigation.goBack()}
          activeOpacity={0.8}
        >
          <X size={18} color="#191C21" />
        </TouchableOpacity>

        <View style={styles.topTitleWrap}>
          <Text style={styles.topTitle} numberOfLines={1}>
            {podcast.title}
          </Text>
          <Text style={styles.topSub}>{t('podcastPlayerSub')}</Text>
        </View>

        <TouchableOpacity
          style={[styles.circleBtn, showTranscript && styles.circleBtnActive]}
          onPress={() => setShowTranscript((v) => !v)}
          activeOpacity={0.8}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          {showTranscript ? (
            <EyeOff size={18} color={COLORS.primary} />
          ) : (
            <FileText size={18} color="#697082" />
          )}
        </TouchableOpacity>
      </View>

      <ScrollView
        ref={scrollRef}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 160 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* کاور عکاسی یا اسلایدشو */}
        {slideImages.length > 0 ? (
          <Slideshow
            uris={slideImages.map((img) => absUrl(img.url))}
            activeIndex={activeSlide}
            playing={playing}
            style={styles.cover}
          />
        ) : (
          !!podcast.cover_url && (
            <View style={styles.coverWrap}>
              <Image source={{ uri: absUrl(podcast.cover_url) }} style={styles.cover} resizeMode="cover" />
            </View>
          )
        )}

        {/* کارت توضیحات و تنظیمات پخش */}
        <View style={styles.infoCard}>
          {!!podcast.description_fa && (
            <Text style={[styles.desc, { textAlign: rtl ? 'right' : 'left' }]}>
              {podcast.description_fa}
            </Text>
          )}

          {/* ردیف دکمه‌های کنترل سریع متن و ترجمه */}
          <View style={[styles.optionsRow, rr]}>
            <TouchableOpacity
              style={[styles.pillBtn, !showTranscript && styles.pillBtnActive, rr]}
              onPress={() => setShowTranscript((v) => !v)}
              activeOpacity={0.8}
            >
              {showTranscript ? (
                <EyeOff size={14} color="#697082" />
              ) : (
                <FileText size={14} color={COLORS.primary} />
              )}
              <Text style={[styles.pillBtnText, !showTranscript && styles.pillBtnTextActive]}>
                {showTranscript ? t('podcastHideTranscript') : t('podcastShowTranscript')}
              </Text>
            </TouchableOpacity>

            {showTranscript && (
              <TouchableOpacity
                style={[styles.pillBtn, showTranslation && styles.pillBtnActive, rr]}
                onPress={() => setShowTranslation((v) => !v)}
                activeOpacity={0.8}
              >
                <Sparkles size={13} color={showTranslation ? COLORS.primary : '#697082'} />
                <Text style={[styles.pillBtnText, showTranslation && styles.pillBtnTextActive]}>
                  {t('podcastShowTranslation')}
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {/* ردیف پخش خودکار قسمت بعدی */}
          <View style={styles.autoplayRow}>
            {/* ردیف اصلی: عنوان و سوییچ فعال‌سازی */}
            <View style={[styles.autoplayHeaderRow, rr]}>
              <View style={[styles.autoplayTitleRow, rr]}>
                <ListMusic size={15} color={autoplay ? COLORS.primary : '#8E95A5'} />
                <Text style={styles.autoplayTitle}>{t('podcastAutoplayNext')}</Text>
              </View>
              <Switch
                value={autoplay}
                onValueChange={toggleAutoplay}
                trackColor={{ false: '#E2DDD5', true: COLORS.primary }}
                thumbColor={COLORS.white}
              />
            </View>

            {/* جزئیات و دکمه تست در ردیف مجزا هنگام فعال بودن (جلوگیری از تداخل در گوشی‌های با صفحه کوچکتر مثل J5) */}
            {autoplay && (
              <View style={[styles.autoplayDetailsRow, rr]}>
                <View style={[styles.autoplayNextInfo, { alignItems: rtl ? 'flex-end' : 'flex-start' }]}>
                  {isLastFreeEpisode ? (
                    <TouchableOpacity onPress={() => navigation.navigate('Paywall')} activeOpacity={0.8}>
                      <Text
                        style={[
                          styles.autoplayNextName,
                          styles.autoplayWarning,
                          { textAlign: rtl ? 'right' : 'left' },
                        ]}
                      >
                        {t('podcastLastFreeEpisode')}
                      </Text>
                    </TouchableOpacity>
                  ) : nextPodcast ? (
                    <Text
                      style={[styles.autoplayNextName, { textAlign: rtl ? 'right' : 'left' }]}
                      numberOfLines={1}
                      ellipsizeMode="tail"
                    >
                      {t('podcastNextEpisodeLabel').replace('{title}', nextPodcast.title)}
                    </Text>
                  ) : null}
                </View>

                <TouchableOpacity
                  style={[styles.testVoiceBtn, rr]}
                  onPress={() => announceNextPodcast(nextPodcast?.title || podcast?.title)}
                  activeOpacity={0.75}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Volume2 size={13} color={COLORS.primary} />
                  <Text style={styles.testVoiceText}>{t('podcastTestCue')}</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>

        {/* حالت فقط شنیداری (بدون متن) */}
        {!showTranscript ? (
          <View style={styles.listeningNotice}>
            <View style={styles.listeningIconWrap}>
              <Headphones size={24} color={COLORS.primary} />
            </View>
            <View style={styles.listeningTextWrap}>
              <Text style={styles.listeningNoticeTitle}>{t('podcastListeningModeTitle')}</Text>
              <Text style={styles.listeningNoticeSub}>
                {rtl
                  ? 'متن مخفی است تا تمرکز شما کاملاً بر تقویت مهارت شنیداری باشد.'
                  : 'Transcript is hidden to focus purely on listening comprehension.'}
              </Text>
            </View>
          </View>
        ) : (
          /* جملات گفتگو با هایلایت هم‌زمان کارائوکه */
          lines.map((l, i) => {
            const isActive = i === activeIdx;
            const tone = speakerTone(l.speaker);

            return (
              <TouchableOpacity
                key={l.id ?? i}
                onLayout={(e) => {
                  lineY.current[i] = e.nativeEvent.layout.y;
                }}
                style={[
                  styles.lineCard,
                  isActive && styles.lineCardActive,
                ]}
                onPress={() => seekToLine(l.start_ms)}
                activeOpacity={0.8}
              >
                <View style={[styles.speakerRow, rr]}>
                  <View style={[styles.avatar, { backgroundColor: tone.color }]}>
                    <Text style={styles.avatarText}>{l.speaker.charAt(0).toUpperCase()}</Text>
                  </View>
                  <Text
                    style={[
                      styles.speaker,
                      styles.flex1,
                      { color: tone.color, textAlign: rtl ? 'right' : 'left' },
                    ]}
                  >
                    {l.speaker}
                  </Text>
                  <Play
                    size={13}
                    color={isActive ? COLORS.primary : '#A09B90'}
                    fill={isActive ? COLORS.primary : 'transparent'}
                  />
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

                {showTranslation && !!l.translation_fa && (
                  <View style={styles.translationWrap}>
                    <Text style={[styles.translation, { textAlign: rtl ? 'right' : 'left' }]}>
                      {l.translation_fa}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })
        )}

        {/* دکمه ضبط صدای من */}
        {lines.length > 0 && (
          <TouchableOpacity
            style={styles.actionCard}
            activeOpacity={0.88}
            onPress={async () => {
              await TrackPlayer.pause().catch(() => {});
              navigation.navigate('PodcastMyVersion', { podcastId: podcast.id, openedAt: Date.now() });
            }}
          >
            <View style={[styles.actionCardInner, rr]}>
              <View style={styles.actionIconWrap}>
                <Mic size={20} color={COLORS.primary} />
              </View>
              <View style={[styles.actionCardText, { alignItems: rtl ? 'flex-end' : 'flex-start' }]}>
                <Text style={styles.actionCardTitle}>{t('myVersionButton')}</Text>
                <Text style={styles.actionCardSub}>
                  {rtl
                    ? 'مکالمه را با صدای خودتان تکرار و ضبط کنید'
                    : 'Shadow and record this dialogue in your own voice'}
                </Text>
              </View>
              <ChevronIcon size={18} color={COLORS.primary} />
            </View>
          </TouchableOpacity>
        )}

        {/* اتصال به نقش‌آفرینی هوشمند */}
        {roleplay && (
          <TouchableOpacity
            style={[styles.actionCard, { borderColor: '#2563EB' }]}
            activeOpacity={0.88}
            onPress={async () => {
              await TrackPlayer.pause().catch(() => {});
              navigation.navigate('AIConversation', {
                roleplay,
                sceneTitle: rtl ? roleplay.title_fa || roleplay.title : roleplay.title,
                openedAt: Date.now(),
              });
            }}
          >
            <View style={[styles.actionCardInner, rr]}>
              <View style={[styles.actionIconWrap, { backgroundColor: '#EFF6FF' }]}>
                <MessageCircle size={20} color="#2563EB" />
              </View>
              <View style={[styles.actionCardText, { alignItems: rtl ? 'flex-end' : 'flex-start' }]}>
                <Text style={[styles.actionCardTitle, { color: '#2563EB' }]}>{t('roleplayPractice')}</Text>
                <Text style={styles.actionCardSub}>
                  {rtl
                    ? 'گفتگوی دوطرفه در این موقعیت با مربی هوش مصنوعی'
                    : 'Practice real-life conversation with AI coach'}
                </Text>
              </View>
              <ChevronIcon size={18} color="#2563EB" />
            </View>
          </TouchableOpacity>
        )}

        {/* کارت واژگان کلیدی پادکست */}
        {podcast.vocabulary && podcast.vocabulary.length > 0 && (
          <View style={styles.vocabCard}>
            <View style={[styles.vocabTitleRow, rr]}>
              <Sparkles size={16} color={COLORS.primary} />
              <Text style={styles.vocabTitle}>{t('podcastVocabulary')}</Text>
            </View>
            <View style={styles.vocabChips}>
              {podcast.vocabulary.map((v, i) => {
                const c = VOCAB_COLORS[i % VOCAB_COLORS.length];
                return (
                  <View
                    key={i}
                    style={[
                      styles.vocabChip,
                      { backgroundColor: hexToRgba(c, 0.08), borderColor: hexToRgba(c, 0.25) },
                    ]}
                  >
                    <Text style={[styles.vocabWord, { color: c }]}>{v.word}</Text>
                    <Text style={styles.vocabMeaning}>{v.meaning_fa}</Text>
                  </View>
                );
              })}
            </View>
          </View>
        )}
      </ScrollView>

      {/* پلیر شناور و شیک پایین صفحه */}
      <View style={[styles.player, { paddingBottom: insets.bottom + SPACING.s }]}>
        {/* نوار اطلاع ادامه پخش همراه با دکمه شروع از ابتدا */}
        {resumeMs !== null && resumeMs > 3000 && (
          <View style={[styles.resumeNoticeRow, rr]}>
            <View style={[styles.resumeNoticeLeft, rr]}>
              <RotateCcw size={12} color={COLORS.primary} />
              <Text style={styles.resumeNoticeText}>
                {t('podcastResumeNotice').replace('{time}', formatDuration(Math.round(resumeMs / 1000)))}
              </Text>
            </View>
            <TouchableOpacity
              style={styles.resumeStartOverBtn}
              onPress={handleRestartPodcast}
              activeOpacity={0.75}
              hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
            >
              <Text style={styles.resumeStartOverText}>{t('podcastStartOver')}</Text>
            </TouchableOpacity>
          </View>
        )}

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
          <TouchableOpacity
            style={styles.controlIconBtn}
            onPress={prevLine}
            disabled={!ready}
            activeOpacity={0.75}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <SkipBack size={22} color="#191C21" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.controlIconBtn}
            onPress={() => seekBy(-10)}
            disabled={!ready}
            activeOpacity={0.75}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <RotateCcw size={22} color="#191C21" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.playBtn}
            onPress={togglePlay}
            disabled={!ready}
            activeOpacity={0.88}
          >
            {!ready ? (
              <ActivityIndicator color={COLORS.white} />
            ) : playing ? (
              <Pause size={28} color={COLORS.white} fill={COLORS.white} />
            ) : (
              <Play size={28} color={COLORS.white} fill={COLORS.white} style={{ marginLeft: 2 }} />
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.controlIconBtn}
            onPress={() => seekBy(10)}
            disabled={!ready}
            activeOpacity={0.75}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <RotateCw size={22} color="#191C21" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.controlIconBtn}
            onPress={nextLine}
            disabled={!ready}
            activeOpacity={0.75}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <SkipForward size={22} color="#191C21" />
          </TouchableOpacity>
        </View>

        <View style={[styles.rates, rr]}>
          <TouchableOpacity
            style={[styles.repeatBtn, repeatLine && styles.repeatBtnActive]}
            onPress={toggleRepeat}
            disabled={!ready || (activeIdx < 0 && !repeatLine)}
            activeOpacity={0.85}
          >
            <Repeat1 size={14} color={repeatLine ? COLORS.primary : '#697082'} />
            <Text style={[styles.repeatText, repeatLine && styles.repeatTextActive]}>
              {rtl ? 'تکرار جمله' : 'Loop line'}
            </Text>
          </TouchableOpacity>

          <View style={styles.ratePillsWrap}>
            {RATES.map((r) => {
              const isSelected = rate === r;
              return (
                <TouchableOpacity
                  key={r}
                  style={[styles.rateBtn, isSelected && styles.rateBtnActive]}
                  onPress={() => changeRate(r)}
                  activeOpacity={0.85}
                >
                  <Text style={[styles.rateText, isSelected && styles.rateTextActive]}>{r}x</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FDFBF7',
  },
  rowReverse: {
    flexDirection: 'row-reverse',
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.l,
    paddingBottom: SPACING.s,
  },
  circleBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.white,
    borderWidth: 1.5,
    borderColor: '#F0EBE3',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#2C2014',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  circleBtnActive: {
    backgroundColor: '#FFF3ED',
    borderColor: '#FF6422',
  },
  topTitleWrap: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  topTitle: {
    fontFamily: FONT_FAMILY.bold,
    fontSize: 16,
    color: '#191C21',
    textAlign: 'center',
  },
  topSub: {
    fontFamily: FONT_FAMILY.regular,
    fontSize: 11.5,
    color: '#8E95A5',
    marginTop: 1,
  },
  content: {
    paddingHorizontal: SPACING.l,
    paddingTop: SPACING.s,
    gap: SPACING.m,
  },
  coverWrap: {
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1.2,
    borderColor: '#F0EBE3',
    backgroundColor: '#FAF5EE',
    shadowColor: '#2C2014',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  cover: {
    width: '100%',
    aspectRatio: 21 / 9,
    borderRadius: 20,
    backgroundColor: '#FAF5EE',
  },
  infoCard: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    borderWidth: 1.2,
    borderColor: '#F0EBE3',
    padding: 16,
    gap: 12,
    shadowColor: '#2C2014',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  desc: {
    fontFamily: FONT_FAMILY.regular,
    fontSize: 13.5,
    color: '#4B5162',
    lineHeight: 21,
  },
  optionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  pillBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: '#F7F4EE',
    borderWidth: 1,
    borderColor: '#EAE4D8',
  },
  pillBtnActive: {
    backgroundColor: '#FFF3ED',
    borderColor: '#FF6422',
  },
  pillBtnText: {
    fontFamily: FONT_FAMILY.medium,
    fontSize: 12,
    color: '#697082',
  },
  pillBtnTextActive: {
    fontFamily: FONT_FAMILY.bold,
    color: '#FF6422',
  },
  autoplayRow: {
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F2EDE4',
    marginTop: 6,
    gap: 8,
  },
  autoplayHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  autoplayTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  autoplayTitle: {
    fontFamily: FONT_FAMILY.bold,
    fontSize: 12.5,
    color: '#191C21',
  },
  autoplayDetailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FAF7F2',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 7,
    gap: 8,
    width: '100%',
  },
  autoplayNextInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  autoplayNextName: {
    fontFamily: FONT_FAMILY.regular,
    fontSize: 11,
    color: '#FF6422',
  },
  autoplayWarning: {
    color: '#D97706',
    fontFamily: FONT_FAMILY.medium,
  },
  testVoiceBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 10,
    backgroundColor: '#FFF0EA',
    borderWidth: 1,
    borderColor: '#FAD8C7',
    flexShrink: 0,
  },
  testVoiceText: {
    fontFamily: FONT_FAMILY.bold,
    fontSize: 10.5,
    color: '#FF6422',
  },
  listeningNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    backgroundColor: COLORS.white,
    borderRadius: 18,
    borderWidth: 1.2,
    borderColor: '#F0EBE3',
    shadowColor: '#2C2014',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  listeningIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFF3ED',
    alignItems: 'center',
    justifyContent: 'center',
  },
  listeningTextWrap: {
    flex: 1,
    gap: 3,
  },
  listeningNoticeTitle: {
    fontFamily: FONT_FAMILY.bold,
    fontSize: 13.5,
    color: '#191C21',
  },
  listeningNoticeSub: {
    fontFamily: FONT_FAMILY.regular,
    fontSize: 12,
    color: '#697082',
    lineHeight: 18,
  },
  lineCard: {
    borderRadius: 18,
    borderWidth: 1.2,
    borderColor: '#F0EBE3',
    backgroundColor: COLORS.white,
    padding: 14,
    gap: 8,
    shadowColor: '#2C2014',
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
  },
  lineCardActive: {
    backgroundColor: '#FFF9F5',
    borderColor: '#FF6422',
    shadowColor: '#FF6422',
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 3,
  },
  speakerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F1E8',
  },
  avatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: COLORS.white,
    fontFamily: FONT_FAMILY.bold,
    fontSize: 11,
  },
  speaker: {
    fontFamily: FONT_FAMILY.bold,
    fontSize: 12.5,
  },
  flex1: {
    flex: 1,
  },
  lineText: {
    fontFamily: FONT_FAMILY.regular,
    fontSize: 15,
    color: '#191C21',
    lineHeight: 23,
  },
  lineTextActive: {
    color: '#191C21',
    fontFamily: FONT_FAMILY.semiBold,
  },
  translationWrap: {
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: '#F5F1E8',
    marginTop: 2,
  },
  translation: {
    fontFamily: FONT_FAMILY.regular,
    fontSize: 13,
    color: '#697082',
    lineHeight: 20,
  },
  actionCard: {
    backgroundColor: COLORS.white,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: '#FF6422',
    padding: 14,
    shadowColor: '#2C2014',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  actionCardInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  actionIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFF3ED',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionCardText: {
    flex: 1,
    gap: 2,
  },
  actionCardTitle: {
    fontFamily: FONT_FAMILY.bold,
    fontSize: 14,
    color: '#191C21',
  },
  actionCardSub: {
    fontFamily: FONT_FAMILY.regular,
    fontSize: 12,
    color: '#8E95A5',
  },
  vocabCard: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    borderWidth: 1.2,
    borderColor: '#F0EBE3',
    padding: 16,
    gap: 12,
    shadowColor: '#2C2014',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  vocabTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  vocabTitle: {
    fontFamily: FONT_FAMILY.bold,
    fontSize: 13.5,
    color: '#191C21',
  },
  vocabChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  vocabChip: {
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 7,
    alignItems: 'center',
  },
  vocabWord: {
    fontFamily: FONT_FAMILY.bold,
    fontSize: 13,
  },
  vocabMeaning: {
    fontFamily: FONT_FAMILY.regular,
    fontSize: 12,
    color: '#697082',
    marginTop: 2,
  },
  player: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    borderTopWidth: 1.2,
    borderColor: '#F0EBE3',
    paddingHorizontal: SPACING.l,
    paddingTop: 10,
    gap: 6,
    shadowColor: '#2C2014',
    shadowOpacity: 0.12,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: -4 },
    elevation: 12,
  },
  resumeNoticeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFF4EE',
    borderWidth: 1,
    borderColor: '#FCD7C7',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginBottom: 4,
  },
  resumeNoticeLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  resumeNoticeText: {
    fontFamily: FONT_FAMILY.medium,
    fontSize: 11.5,
    color: '#FF6422',
  },
  resumeStartOverBtn: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    backgroundColor: '#FFE5D9',
  },
  resumeStartOverText: {
    fontFamily: FONT_FAMILY.bold,
    fontSize: 10.5,
    color: '#D9480F',
  },
  progressHit: {
    paddingVertical: 8,
  },
  progressTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: '#EFEBE4',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#FF6422',
  },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 2,
  },
  time: {
    fontFamily: FONT_FAMILY.semiBold,
    fontSize: 11.5,
    color: '#8E95A5',
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
    marginVertical: 4,
  },
  controlIconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playBtn: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FF6422',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#FF6422',
    shadowOpacity: 0.38,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  rates: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 4,
  },
  repeatBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    backgroundColor: '#F5F1E8',
  },
  repeatBtnActive: {
    backgroundColor: '#FFF3ED',
    borderWidth: 1,
    borderColor: '#FF6422',
  },
  repeatText: {
    fontFamily: FONT_FAMILY.medium,
    fontSize: 11,
    color: '#697082',
  },
  repeatTextActive: {
    fontFamily: FONT_FAMILY.bold,
    color: '#FF6422',
  },
  ratePillsWrap: {
    flexDirection: 'row',
    gap: 6,
  },
  rateBtn: {
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: '#F5F1E8',
  },
  rateBtnActive: {
    backgroundColor: '#191C21',
  },
  rateText: {
    fontFamily: FONT_FAMILY.medium,
    fontSize: 12,
    color: '#697082',
  },
  rateTextActive: {
    color: COLORS.white,
    fontFamily: FONT_FAMILY.bold,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.m,
  },
  mutedText: {
    fontFamily: FONT_FAMILY.medium,
    fontSize: 14,
    color: '#697082',
    textAlign: 'center',
  },
  retryBtn: {
    backgroundColor: '#FF6422',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  retryBtnText: {
    fontFamily: FONT_FAMILY.bold,
    fontSize: 13,
    color: COLORS.white,
  },
});
