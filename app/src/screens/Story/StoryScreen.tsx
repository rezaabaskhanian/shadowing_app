import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Image, ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import TrackPlayer, { Event, State } from 'react-native-track-player';
import { useFrameCallback, useSharedValue } from 'react-native-reanimated';
import { BookOpen, ChevronLeft, Gauge, Headphones, Pause, Play, X } from 'lucide-react-native';

import { COLORS, SPACING, BORDER_RADIUS, hexToRgba } from '../../theme/colors';
import { FONT_FAMILY, TEXT_STYLES } from '../../theme/typography';
import { SHADOWS } from '../../theme/elevation';
import { useLanguage } from '../../data/i18n';
import { absUrl } from '../../api/config';
import { getPodcast, getStories, type Podcast } from '../../api/podcasts';
import { ensureTrackPlayerSetup } from '../../services/audio/trackPlayerSetup';
import { markChapterRead, recordReadingSpeed, type ReadingSpeed } from '../../services/storyProgress';
import { track } from '../../services/analytics';
import { KaraokeText } from '../../components/KaraokeText';
import { ACCENT_CYCLE, levelColor } from '../../components/ContentVisuals';

const STORY_TRACK_ID = 'story';
const RATES = [0.75, 1];
// بدون عکس، متن هر چند جمله یک بند جدا می‌شود تا دیوار متن نباشد.
const SENTENCES_PER_PARAGRAPH = 4;
// A1–A2 اول با صدا می‌خوانند (خواندن همراه با شنیدن)؛ از B1 اول بی‌صدا، بعد گوش دادن —
// و فقط همین سطح‌ها سرعت خواندنِ بی‌صدا را می‌بینند.
const LISTEN_FIRST_LEVELS = ['starter', 'beginner'];

/**
 * خواندنِ یک فصل از داستان (بخش خواندن): متن‌محور، با «خواندن همراه با شنیدن»
 * (صدای TTS و هایلایت کلمه‌به‌کلمه). لمس هر جمله از همان‌جا پخش می‌کند و نگه
 * داشتنش ترجمه را نشان می‌دهد. در سطح‌های پایین عکس‌ها بین بندها می‌آیند.
 * آخر فصل: لغت‌ها، سؤال‌های فهم و رفتن به فصل بعد.
 */
export const StoryScreen: React.FC = () => {
  const { t, language } = useLanguage();
  // فارسی: عنوان راست و بستن چپ؛ راهنما و ترجمه‌ها راست‌چین.
  const rtl = language === 'fa';
  const rr = rtl ? styles.rowReverse : null;
  const ta = rtl ? styles.textRight : styles.textLeft;
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const storyId: string | undefined = route.params?.storyId;

  const [story, setStory] = useState<Podcast | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [ready, setReady] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [positionMs, setPositionMs] = useState(0);
  const [rate, setRate] = useState(1);
  const [showAllTranslations, setShowAllTranslations] = useState(false);
  const [shownTranslations, setShownTranslations] = useState<Set<number>>(new Set());
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [nextChapter, setNextChapter] = useState<Podcast | null>(null);
  // زمان‌سنجِ خواندنِ بی‌صدا: از باز شدن فصل تا اولین جواب؛ اگر قبلش صدا پخش شود، باطل.
  const readStartRef = useRef<number | null>(null);
  const listenedBeforeQuizRef = useRef(false);
  const [speed, setSpeed] = useState<ReadingSpeed | null>(null);
  const scrollRef = useRef<ScrollView>(null);
  const lineY = useRef<Record<number, number>>({});
  // y هر خط نسبت به کادر متن است، نه کل محتوای اسکرول؛ جلد و راهنمای بالای متن
  // حساب نمی‌شد و صفحه به‌جای خط به نزدیکی بالای داستان می‌پرید.
  const pageY = useRef(0);
  const scrollY = useRef(0);
  const viewH = useRef(0);
  const lastActive = useRef(-1);
  // وقتی کاربر خودش متن را می‌کشد، صفحه دیگر دنبال خطِ در حال پخش نمی‌رود
  // تا با زدن دوباره‌ی پخش یا یک خط.
  const followRef = useRef(true);
  const trackedRef = useRef(false);

  useEffect(() => {
    if (!storyId) {
      setLoadError(true);
      return;
    }
    let active = true;
    getPodcast(storyId)
      .then(async (p) => {
        if (!active) return;
        setStory(p);
        readStartRef.current = Date.now();
        track('story_opened', p.id);
        getStories()
          .then((all) => {
            const next = all
              .filter((c) => c.series_title === p.series_title && (c.chapter_no ?? 0) > (p.chapter_no ?? 0))
              .sort((a, b) => (a.chapter_no ?? 0) - (b.chapter_no ?? 0))[0];
            if (active) setNextChapter(next ?? null);
          })
          .catch(() => {});
        await ensureTrackPlayerSetup();
        await TrackPlayer.reset();
        await TrackPlayer.add({
          id: STORY_TRACK_ID,
          url: absUrl(p.audio_url),
          title: p.series_title || p.title,
          artwork: p.cover_url ? absUrl(p.cover_url) : undefined,
        });
        if (active) setReady(true);
      })
      .catch(() => active && setLoadError(true));
    return () => {
      active = false;
    };
  }, [storyId]);

  // هایلایتِ نرم بین دو رویدادِ موقعیت (مثل صفحه‌ی پادکست).
  const positionSV = useSharedValue(0);
  const playingSV = useSharedValue(false);
  const rateSV = useSharedValue(1);
  useFrameCallback((frame) => {
    if (playingSV.value && frame.timeSincePreviousFrame) {
      positionSV.value += frame.timeSincePreviousFrame * rateSV.value;
    }
  });

  useEffect(() => {
    const progressSub = TrackPlayer.addEventListener(Event.PlaybackProgressUpdated, (d) => {
      const ms = Math.round(d.position * 1000);
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

  useFocusEffect(
    useCallback(
      () => () => {
        TrackPlayer.pause().catch(() => {});
      },
      []
    )
  );

  const togglePlay = async () => {
    if (!ready || !story) return;
    if (playing) {
      await TrackPlayer.pause();
      return;
    }
    if (!trackedRef.current) {
      trackedRef.current = true;
      track('story_played', story.id);
    }
    if (Object.keys(answers).length === 0) listenedBeforeQuizRef.current = true;
    if (positionMs >= story.duration_seconds * 1000 - 300) await TrackPlayer.seekTo(0);
    followRef.current = true;
    await TrackPlayer.play();
  };

  const playFrom = async (startMs: number) => {
    if (!ready) return;
    if (Object.keys(answers).length === 0) listenedBeforeQuizRef.current = true;
    followRef.current = true;
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

  const toggleTranslation = (i: number) =>
    setShownTranslations((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });

  const lines = story?.lines ?? [];
  const activeIdx = playing || positionMs > 0
    ? lines.findIndex((l) => positionMs >= l.start_ms && positionMs < l.end_ms + 350)
    : -1;

  useEffect(() => {
    if (activeIdx < 0 || activeIdx === lastActive.current) return;
    lastActive.current = activeIdx;
    if (!followRef.current) return;
    const ly = lineY.current[activeIdx];
    if (ly === undefined) return;
    // فقط وقتی خطِ در حال پخش از دید بیرون رفته (یا به پایین صفحه رسیده) جابه‌جا
    // می‌کنیم؛ خطی که کاربر رویش زده و دیده می‌شود سر جایش می‌ماند.
    const y = pageY.current + ly;
    const top = scrollY.current;
    const bottom = top + viewH.current;
    if (y < top + 40 || y > bottom - 160) {
      scrollRef.current?.scrollTo({ y: Math.max(0, y - 160), animated: true });
    }
  }, [activeIdx]);

  const listenFirst = LISTEN_FIRST_LEVELS.includes(story?.level ?? 'starter');
  const wordCount = lines.reduce((n, l) => n + l.text.split(/\s+/).filter(Boolean).length, 0);

  // اولین جواب = پایانِ خواندن؛ سرعت فقط برای B1+ و فقط اگر بی‌صدا خوانده باشد.
  const answer = (qi: number, oi: number) => {
    if (Object.keys(answers).length === 0 && !listenFirst && !listenedBeforeQuizRef.current && readStartRef.current) {
      const seconds = (Date.now() - readStartRef.current) / 1000;
      recordReadingSpeed(wordCount, seconds).then((r) => r && setSpeed(r));
    }
    setAnswers((prev) => ({ ...prev, [qi]: oi }));
  };

  const questions = story?.questions ?? [];
  const allAnswered = questions.length > 0 && questions.every((_, i) => answers[i] !== undefined);
  const correct = questions.filter((q, i) => answers[i] === q.answer).length;

  // فصل وقتی «خوانده» است که به همه‌ی سؤال‌ها جواب داده شود (بدون سؤال: با دکمه‌ی پایان).
  useEffect(() => {
    if (story && allAnswered) {
      markChapterRead(story.id);
      track('story_quiz_done', `${story.id}:${correct}/${questions.length}`);
    }
  }, [allAnswered, story, correct, questions.length]);

  if (loadError) {
    return (
      <View style={[styles.container, styles.center, { paddingTop: insets.top }]}>
        <Text style={styles.mutedText}>{t('storyLoadError')}</Text>
        <TouchableOpacity onPress={() => navigation.goBack()} activeOpacity={0.8}>
          <Text style={styles.linkText}>{t('podcastBack')}</Text>
        </TouchableOpacity>
      </View>
    );
  }
  if (!story) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator color={COLORS.primary} />
      </View>
    );
  }

  const accent = levelColor(story.level);
  // تکه‌های متن: هر عکس (from_line از ۱) یک بند تازه شروع می‌کند؛ بدون عکس، هر چند جمله یک بند.
  const imageAt = new Map<number, string>();
  (story.images || []).forEach((img) => {
    if (img.url && img.from_line > 0) imageAt.set(img.from_line - 1, img.url);
  });
  const paragraphStart = (i: number) =>
    i > 0 && (imageAt.has(i) || (imageAt.size === 0 && i % SENTENCES_PER_PARAGRAPH === 0));

  const durationMs = Math.max(1, story.duration_seconds * 1000);
  const progress = Math.min(1, positionMs / durationMs);

  const finishWithoutQuestions = () => {
    markChapterRead(story.id);
    if (nextChapter) navigation.navigate('Story', { storyId: nextChapter.id, openedAt: Date.now() });
    else navigation.goBack();
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top + SPACING.s }]}>
      {/* طرح: بستن سمت چپ، عنوان و فصل سمت راست. */}
      <View style={styles.topRow}>
        <TouchableOpacity style={styles.closeBtn} onPress={() => navigation.goBack()} activeOpacity={0.8}>
          <X size={20} color={COLORS.text} />
        </TouchableOpacity>
        <View style={[styles.flex, rtl ? styles.alignEnd : styles.alignStart]}>
          <Text style={styles.topTitle} numberOfLines={1}>
            {story.series_title || story.title}
          </Text>
          <Text style={[styles.topSub, { color: accent }]}>
            {t('storyChapterN').replace('{n}', String(story.chapter_no || 1))} · {story.title}
          </Text>
        </View>
      </View>

      <ScrollView
        ref={scrollRef}
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
        contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={[styles.cover, { backgroundColor: accent }]}>
          {!!story.cover_url && <Image source={{ uri: absUrl(story.cover_url) }} style={styles.coverImage} resizeMode="cover" />}
          {!story.cover_url && <BookOpen size={40} color={hexToRgba(COLORS.white, 0.9)} />}
        </View>
        {!!story.description_fa && (
          <View style={[styles.recap, { borderColor: hexToRgba(accent, 0.3), backgroundColor: hexToRgba(accent, 0.06) }]}>
            <Text style={[styles.recapText, ta]}>{story.description_fa}</Text>
          </View>
        )}

        <View style={[styles.guide, rr, { backgroundColor: hexToRgba(accent, 0.08), borderColor: hexToRgba(accent, 0.22) }]}>
          <View style={[styles.guideIcon, { backgroundColor: hexToRgba(accent, 0.14) }]}>
            {listenFirst ? <Headphones size={16} color={accent} /> : <BookOpen size={16} color={accent} />}
          </View>
          <View style={[styles.flex, rtl ? styles.alignEnd : styles.alignStart]}>
            <Text style={[styles.guideTitle, ta, { color: accent }]}>
              {listenFirst ? t('storyGuideListenTitle') : t('storyGuideSilentTitle')}
            </Text>
            <Text style={[styles.guideText, ta]}>{listenFirst ? t('storyGuideListenText') : t('storyGuideSilentText')}</Text>
          </View>
        </View>

        <View style={styles.switchRow}>
          <View style={[styles.switchInline, rr]}>
            <Text style={styles.switchLabel}>{t('podcastShowTranslation')}</Text>
            <Switch value={showAllTranslations} onValueChange={setShowAllTranslations} trackColor={{ true: accent }} />
          </View>
          <Text style={[styles.hint, ta]}>{t('storyReadHint')}</Text>
        </View>

        <View
          style={styles.page}
          onLayout={(e) => {
            pageY.current = e.nativeEvent.layout.y;
          }}
        >
          {lines.map((l, i) => {
            const isActive = i === activeIdx;
            const img = imageAt.get(i);
            const showFa = showAllTranslations || shownTranslations.has(i);
            return (
              <View
                key={l.id ?? i}
                onLayout={(e) => {
                  lineY.current[i] = e.nativeEvent.layout.y;
                }}
              >
                {paragraphStart(i) && !img && <View style={styles.paragraphGap} />}
                {!!img && <Image source={{ uri: absUrl(img) }} style={styles.inlineImage} resizeMode="cover" />}
                <TouchableOpacity
                  style={[styles.sentence, isActive && { backgroundColor: hexToRgba(accent, 0.12) }]}
                  onPress={() => playFrom(l.start_ms)}
                  onLongPress={() => toggleTranslation(i)}
                  activeOpacity={0.75}
                >
                  {isActive ? (
                    <KaraokeText
                      text={l.text}
                      startMs={l.start_ms}
                      endMs={l.end_ms}
                      positionMs={positionSV}
                      textStyle={StyleSheet.flatten([styles.sentenceText, styles.sentenceTextActive, ta])}
                    />
                  ) : (
                    <Text style={[styles.sentenceText, ta]}>{l.text}</Text>
                  )}
                  {showFa && !!l.translation_fa && (
                    <Text style={[styles.translation, ta, rtl ? styles.translationBarRight : styles.translationBarLeft]}>
                      {l.translation_fa}
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            );
          })}
        </View>

        {story.vocabulary.length > 0 && (
          <View style={styles.block}>
            <Text style={[styles.blockTitle, { color: COLORS.pink }]}>✨ {t('podcastVocabulary')}</Text>
            <View style={styles.chips}>
              {story.vocabulary.map((v, i) => {
                const c = ACCENT_CYCLE[i % ACCENT_CYCLE.length];
                return (
                  <View key={i} style={[styles.chip, { backgroundColor: hexToRgba(c, 0.1), borderColor: hexToRgba(c, 0.35) }]}>
                    <Text style={[styles.chipWord, { color: c }]}>{v.word}</Text>
                    <Text style={styles.chipMeaning}>{v.meaning_fa}</Text>
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {questions.length > 0 && (
          <View style={styles.block}>
            <Text style={[styles.blockTitle, { color: COLORS.levelIntermediateBg }]}>💡 {t('storyQuestionsTitle')}</Text>
            {questions.map((q, qi) => {
              const picked = answers[qi];
              return (
                <View key={qi} style={styles.question}>
                  <Text style={styles.questionText}>
                    {qi + 1}. {q.q}
                  </Text>
                  {!!q.q_fa && <Text style={styles.questionFa}>{q.q_fa}</Text>}
                  {q.options.map((opt, oi) => {
                    const answered = picked !== undefined;
                    const isRight = oi === q.answer;
                    const isPicked = oi === picked;
                    return (
                      <TouchableOpacity
                        key={oi}
                        disabled={answered}
                        onPress={() => answer(qi, oi)}
                        activeOpacity={0.8}
                        style={[
                          styles.option,
                          answered && isRight && styles.optionRight,
                          answered && isPicked && !isRight && styles.optionWrong,
                        ]}
                      >
                        <Text style={styles.optionText}>{opt}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              );
            })}
            {!!speed && (
              <View style={[styles.speedCard, { borderColor: hexToRgba(accent, 0.35) }]}>
                <Gauge size={22} color={accent} />
                <View style={styles.flex}>
                  <Text style={styles.speedValue}>
                    {t('storySpeedValue').replace('{wpm}', String(speed.wpm))}
                  </Text>
                  <Text style={styles.speedCompare}>
                    {speed.previousAvg === null
                      ? t('storySpeedFirst')
                      : speed.wpm >= speed.previousAvg
                      ? t('storySpeedUp').replace('{avg}', String(speed.previousAvg))
                      : t('storySpeedDown').replace('{avg}', String(speed.previousAvg))}
                  </Text>
                </View>
              </View>
            )}
            {allAnswered && (
              <View style={[styles.result, { backgroundColor: hexToRgba(accent, 0.1) }]}>
                <Text style={styles.resultText}>
                  {t('storyQuizResult').replace('{c}', String(correct)).replace('{n}', String(questions.length))}
                </Text>
              </View>
            )}
          </View>
        )}

        {(allAnswered || questions.length === 0) && (
          <TouchableOpacity
            style={[styles.nextBtn, { backgroundColor: accent }]}
            onPress={() =>
              questions.length === 0
                ? finishWithoutQuestions()
                : nextChapter
                ? navigation.navigate('Story', { storyId: nextChapter.id, openedAt: Date.now() })
                : navigation.goBack()
            }
            activeOpacity={0.85}
          >
            <Text style={styles.nextBtnText}>{nextChapter ? t('storyNextChapter') : t('storyFinish')}</Text>
            <ChevronLeft size={18} color={COLORS.white} />
          </TouchableOpacity>
        )}
      </ScrollView>

      <View style={[styles.player, { paddingBottom: insets.bottom + SPACING.s }]}>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${progress * 100}%`, backgroundColor: accent }]} />
        </View>
        <View style={[styles.playerRow, rr]}>
          <TouchableOpacity
            style={[styles.playBtn, { backgroundColor: accent }]}
            onPress={togglePlay}
            disabled={!ready}
            activeOpacity={0.85}
          >
            {!ready ? (
              <ActivityIndicator color={COLORS.white} />
            ) : playing ? (
              <Pause size={22} color={COLORS.white} fill={COLORS.white} />
            ) : (
              <Play size={22} color={COLORS.white} fill={COLORS.white} />
            )}
          </TouchableOpacity>
          <View style={[styles.flex, rtl ? styles.alignEnd : styles.alignStart]}>
            <Text style={styles.playerLabel}>{t('storyListenAlong')}</Text>
            <Text style={styles.playerSub}>{t('storyPlayerSub')}</Text>
          </View>
          <View style={styles.rates}>
            {RATES.map((r) => (
              <TouchableOpacity
                key={r}
                style={[styles.rateBtn, rate === r && { backgroundColor: accent, borderColor: accent }]}
                onPress={() => changeRate(r)}
                activeOpacity={0.85}
              >
                <Text style={[styles.rateText, rate === r && styles.rateTextActive]}>{r}x</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  rowReverse: { flexDirection: 'row-reverse' },
  textRight: { textAlign: 'right' },
  textLeft: { textAlign: 'left' },
  alignEnd: { alignItems: 'flex-end' },
  alignStart: { alignItems: 'flex-start' },
  guideIcon: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  translationBarRight: { borderRightWidth: 2, borderRightColor: '#E5E0D6', paddingRight: 8 },
  translationBarLeft: { borderLeftWidth: 2, borderLeftColor: '#E5E0D6', paddingLeft: 8 },
  playerSub: { fontFamily: FONT_FAMILY.regular, fontSize: 11, color: COLORS.muted },
  container: { flex: 1, backgroundColor: '#FAF8F4' },
  center: { alignItems: 'center', justifyContent: 'center', gap: SPACING.s },
  flex: { flex: 1 },
  mutedText: { ...TEXT_STYLES.bodyMd, color: COLORS.textSecondary, textAlign: 'center' },
  linkText: { ...TEXT_STYLES.labelMd, color: COLORS.primary, fontFamily: FONT_FAMILY.semiBold },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.s,
    paddingHorizontal: SPACING.l,
    paddingBottom: SPACING.s,
  },
  closeBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: '#EFECE6', alignItems: 'center', justifyContent: 'center' },
  topTitle: { fontFamily: FONT_FAMILY.bold, fontSize: 16, color: COLORS.text, textAlign: 'left' },
  topSub: { ...TEXT_STYLES.labelSm, fontFamily: FONT_FAMILY.semiBold },
  content: { paddingHorizontal: SPACING.l, paddingBottom: SPACING.xl, gap: SPACING.m },
  cover: { width: '100%', aspectRatio: 16 / 9, borderRadius: 18, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  coverImage: { position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' },
  recap: { borderRadius: 16, borderWidth: 1, padding: SPACING.m },
  recapText: { ...TEXT_STYLES.bodyMd, color: COLORS.text },
  switchRow: { gap: SPACING.xs },
  guide: { flexDirection: 'row', alignItems: 'flex-start', gap: SPACING.s, borderRadius: 16, borderWidth: 1, padding: SPACING.m },
  guideTitle: { fontFamily: FONT_FAMILY.bold, fontSize: 14 },
  guideText: { ...TEXT_STYLES.labelMd, color: COLORS.text, marginTop: 2 },
  speedCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.m,
    borderWidth: 1,
    borderRadius: BORDER_RADIUS.m,
    padding: SPACING.m,
  },
  speedValue: { fontFamily: FONT_FAMILY.bold, fontSize: 16, color: COLORS.text },
  speedCompare: { ...TEXT_STYLES.labelMd, color: COLORS.textSecondary },
  switchInline: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  switchLabel: { ...TEXT_STYLES.labelMd, color: COLORS.text },
  hint: { ...TEXT_STYLES.labelSm, color: COLORS.muted },
  page: { backgroundColor: COLORS.white, borderRadius: 18, borderWidth: 1, borderColor: '#EEEAE2', padding: SPACING.m },
  paragraphGap: { height: SPACING.m },
  inlineImage: {
    width: '100%',
    aspectRatio: 16 / 9,
    borderRadius: BORDER_RADIUS.m,
    marginVertical: SPACING.s,
  },
  sentence: { borderRadius: BORDER_RADIUS.s, paddingVertical: 4, paddingHorizontal: 6 },
  sentenceText: { fontFamily: FONT_FAMILY.regular, fontSize: 17, lineHeight: 28, color: COLORS.text, writingDirection: 'ltr' },
  sentenceTextActive: { fontFamily: FONT_FAMILY.semiBold },
  translation: { ...TEXT_STYLES.labelMd, color: COLORS.textSecondary, marginTop: 2 },
  block: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.l,
    padding: SPACING.m,
    gap: SPACING.s,
    ...SHADOWS.level1,
  },
  blockTitle: { fontFamily: FONT_FAMILY.bold, fontSize: 14 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.s },
  chip: { borderRadius: BORDER_RADIUS.m, borderWidth: 1, paddingHorizontal: SPACING.m, paddingVertical: 6, alignItems: 'center' },
  chipWord: { fontFamily: FONT_FAMILY.semiBold, fontSize: 15 },
  chipMeaning: { ...TEXT_STYLES.labelSm, color: COLORS.textSecondary },
  question: { gap: 6, marginTop: SPACING.xs },
  questionText: { fontFamily: FONT_FAMILY.semiBold, fontSize: 15, color: COLORS.text, textAlign: 'left' },
  questionFa: { ...TEXT_STYLES.labelSm, color: COLORS.muted },
  option: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.m,
    paddingVertical: 10,
    paddingHorizontal: SPACING.m,
    backgroundColor: COLORS.background,
  },
  optionRight: { backgroundColor: COLORS.successLight, borderColor: COLORS.success },
  optionWrong: { backgroundColor: COLORS.errorLight, borderColor: COLORS.error },
  optionText: { ...TEXT_STYLES.bodyMd, color: COLORS.text, textAlign: 'left' },
  result: { borderRadius: BORDER_RADIUS.m, padding: SPACING.m, alignItems: 'center' },
  resultText: { fontFamily: FONT_FAMILY.bold, fontSize: 15, color: COLORS.text },
  nextBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderRadius: BORDER_RADIUS.l,
    paddingVertical: SPACING.m,
    ...SHADOWS.level2,
  },
  nextBtnText: { color: COLORS.white, fontFamily: FONT_FAMILY.bold, fontSize: 16 },
  player: { borderTopLeftRadius: 22, borderTopRightRadius: 22, backgroundColor: COLORS.white, paddingHorizontal: SPACING.l, paddingTop: SPACING.s, gap: SPACING.s, shadowColor: '#1A1D26', shadowOpacity: 0.06, shadowRadius: 12, shadowOffset: { width: 0, height: -3 }, elevation: 6 },
  progressTrack: { height: 4, borderRadius: 2, backgroundColor: COLORS.surfaceHigh, overflow: 'hidden' },
  progressFill: { height: '100%' },
  playerRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.m },
  playBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.level2,
  },
  playerLabel: { fontFamily: FONT_FAMILY.bold, fontSize: 13, color: COLORS.text },
  rates: { flexDirection: 'row', gap: SPACING.xs },
  rateBtn: {
    borderRadius: BORDER_RADIUS.full,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  rateText: { ...TEXT_STYLES.labelMd, color: COLORS.text },
  rateTextActive: { color: COLORS.white },
});
