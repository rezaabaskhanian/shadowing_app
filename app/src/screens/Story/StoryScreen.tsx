import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Image, ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import TrackPlayer, { Event, State } from 'react-native-track-player';
import { useFrameCallback, useSharedValue } from 'react-native-reanimated';
import { BookOpen, ChevronLeft, Gauge, Headphones, Lock, Pause, Play, X } from 'lucide-react-native';

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
// «اول بخوان، بعد گوش بده»: صدا تا جواب دادن به سؤال‌ها بسته است تا کاربر واقعاً
// بخواند و سرعت خواندنش اندازه گرفته شود. فقط A1–A2 می‌توانند با «خواندن همراه
// صدا» زودتر بازش کنند (وصل کردن نوشتار به تلفظ)؛ پیش‌فرض برای همه خاموش است.
const READ_ALONG_LEVELS = ['starter', 'beginner'];

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
  // A1–A2: کاربر خودش «خواندن همراه صدا» را روشن کرده.
  const [readAlong, setReadAlong] = useState(false);
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

  const questions = story?.questions ?? [];
  const allAnswered = questions.length > 0 && questions.every((_, i) => answers[i] !== undefined);
  const correct = questions.filter((q, i) => answers[i] === q.answer).length;
  // صدا بعد از جواب دادن به سؤال‌ها باز می‌شود (فصل بی‌سؤال: از اول باز).
  const audioOpen = readAlong || allAnswered || questions.length === 0;

  const togglePlay = async () => {
    if (!ready || !story || !audioOpen) return;
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
    if (!ready || !audioOpen) return;
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

  const canReadAlong = READ_ALONG_LEVELS.includes(story?.level ?? 'starter');
  const wordCount = lines.reduce((n, l) => n + l.text.split(/\s+/).filter(Boolean).length, 0);

  // اولین جواب = پایانِ خواندن؛ سرعت فقط اگر بی‌صدا خوانده باشد.
  const answer = (qi: number, oi: number) => {
    if (Object.keys(answers).length === 0 && !listenedBeforeQuizRef.current && readStartRef.current) {
      const seconds = (Date.now() - readStartRef.current) / 1000;
      recordReadingSpeed(wordCount, seconds).then((r) => r && setSpeed(r));
    }
    setAnswers((prev) => ({ ...prev, [qi]: oi }));
  };

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

  const handleClose = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      navigation.navigate('StoryList');
    }
  };

  const finishWithoutQuestions = () => {
    markChapterRead(story.id);
    if (nextChapter) navigation.navigate('Story', { storyId: nextChapter.id, openedAt: Date.now() });
    else handleClose();
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top + SPACING.s }]}>
      {/* سربرگ مدرن داستان */}
      <View style={[styles.topRow, rtl && styles.rowReverse]}>
        <TouchableOpacity style={styles.closeBtn} onPress={handleClose} activeOpacity={0.8}>
          <X size={20} color={COLORS.text} />
        </TouchableOpacity>
        <View style={[styles.flex, rtl ? styles.alignEnd : styles.alignStart]}>
          <Text style={styles.topTitle} numberOfLines={1}>
            {story.series_title || story.title}
          </Text>
          <View style={[styles.chapterPill, rtl && styles.rowReverse]}>
            <Text style={styles.chapterPillText}>
              {t('storyChapterN').replace('{n}', String(story.chapter_no || 1))} · {story.title}
            </Text>
          </View>
        </View>
        <View style={styles.headerSpacer} />
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
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* کاور عکاسی داستان */}
        <View style={styles.cover}>
          {!!story.cover_url ? (
            <Image source={{ uri: absUrl(story.cover_url) }} style={styles.coverImage} resizeMode="cover" />
          ) : (
            <View style={styles.coverPlaceholder}>
              <BookOpen size={44} color={COLORS.primary} />
            </View>
          )}
          <View style={styles.coverScrim} />
          <View style={[styles.coverBadge, rtl ? { right: 12 } : { left: 12 }]}>
            <Text style={styles.coverBadgeText}>{story.series_title || story.title}</Text>
          </View>
        </View>

        {/* خلاصه داستان - سبک یادداشت کتاب */}
        {!!story.description_fa && (
          <View style={styles.recapCard}>
            <View style={[styles.recapHeader, rtl && styles.rowReverse]}>
              <BookOpen size={15} color={COLORS.primary} />
              <Text style={styles.recapLabel}>خلاصه این بخش</Text>
            </View>
            <Text style={[styles.recapText, styles.textRight]}>{story.description_fa}</Text>
          </View>
        )}

        {/* راهنمای مطالعه مربی */}
        <View style={[styles.guideCard, rtl && styles.rowReverse]}>
          <View style={styles.guideIconWrap}>
            {readAlong ? <Headphones size={18} color="#2563EB" /> : <BookOpen size={18} color="#059669" />}
          </View>
          <View style={[styles.flex, rtl ? styles.alignEnd : styles.alignStart]}>
            <Text style={[styles.guideTitle, styles.textRight]}>
              {readAlong ? t('storyGuideListenTitle') : t('storyGuideSilentTitle')}
            </Text>
            <Text style={[styles.guideText, styles.textRight]}>
              {readAlong ? t('storyGuideListenText') : t('storyGuideSilentText')}
            </Text>
            {canReadAlong && !allAnswered && (
              <View style={[styles.switchInline, rtl && styles.rowReverse, { marginTop: 8 }]}>
                <Text style={styles.switchLabel}>{t('storyReadAlongToggle')}</Text>
                <Switch
                  value={readAlong}
                  onValueChange={(v) => {
                    setReadAlong(v);
                    if (!v) TrackPlayer.pause().catch(() => {});
                  }}
                  trackColor={{ true: COLORS.primary }}
                />
              </View>
            )}
          </View>
        </View>

        {/* نوار ابزار تنظیمات ترجمه */}
        <View style={styles.toolbarCard}>
          <View style={[styles.switchInline, rtl && styles.rowReverse]}>
            <Text style={styles.switchLabel}>{t('podcastShowTranslation')}</Text>
            <Switch
              value={showAllTranslations}
              onValueChange={setShowAllTranslations}
              trackColor={{ true: COLORS.primary }}
            />
          </View>
          <Text style={[styles.hint, styles.textRight]}>
            {audioOpen ? t('storyReadHint') : t('storyReadHintSilent')}
          </Text>
        </View>

        {/* صفحه اصلی کتاب - سفید با حاشیه‌های استاندارد و متون چپ‌چین */}
        <View
          style={styles.bookPaper}
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
                  style={[styles.sentence, isActive && styles.sentenceActive]}
                  onPress={() => (audioOpen ? playFrom(l.start_ms) : toggleTranslation(i))}
                  onLongPress={() => toggleTranslation(i)}
                  activeOpacity={0.75}
                >
                  {isActive ? (
                    <KaraokeText
                      text={l.text}
                      startMs={l.start_ms}
                      endMs={l.end_ms}
                      positionMs={positionSV}
                      textStyle={StyleSheet.flatten([styles.sentenceText, styles.sentenceTextActive])}
                    />
                  ) : (
                    <Text style={styles.sentenceText}>{l.text}</Text>
                  )}
                  {showFa && !!l.translation_fa && (
                    <View style={styles.translationContainer}>
                      <Text style={styles.translationText}>{l.translation_fa}</Text>
                    </View>
                  )}
                </TouchableOpacity>
              </View>
            );
          })}
        </View>

        {/* واژگان کلیدی داستان */}
        {story.vocabulary.length > 0 && (
          <View style={styles.vocabBlock}>
            <View style={[styles.sectionHeaderRow, rtl && styles.rowReverse]}>
              <Text style={styles.sectionHeaderTitle}>✨ {t('podcastVocabulary')}</Text>
              <Text style={styles.sectionHeaderSub}>
                {story.vocabulary.length} واژه منتخب
              </Text>
            </View>
            <View style={styles.vocabChips}>
              {story.vocabulary.map((v, i) => {
                return (
                  <View key={i} style={styles.vocabChip}>
                    <Text style={styles.vocabChipWord}>{v.word}</Text>
                    <Text style={styles.vocabChipMeaning}>{v.meaning_fa}</Text>
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {/* آزمون درک مطلب */}
        {questions.length > 0 && (
          <View style={styles.quizBlock}>
            <View style={[styles.sectionHeaderRow, rtl && styles.rowReverse]}>
              <Text style={styles.sectionHeaderTitle}>💡 {t('storyQuestionsTitle')}</Text>
              <Text style={styles.sectionHeaderSub}>
                {questions.length} سوال تستی
              </Text>
            </View>
            {questions.map((q, qi) => {
              const picked = answers[qi];
              return (
                <View key={qi} style={styles.quizCard}>
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
                        <View style={[
                          styles.optionRadio,
                          answered && isRight && styles.optionRadioRight,
                          answered && isPicked && !isRight && styles.optionRadioWrong,
                        ]}>
                          <Text style={[
                            styles.optionRadioLetter,
                            answered && (isRight || isPicked) && styles.optionRadioLetterActive,
                          ]}>
                            {String.fromCharCode(65 + oi)}
                          </Text>
                        </View>
                        <Text style={[
                          styles.optionText,
                          answered && isRight && styles.optionTextRight,
                          answered && isPicked && !isRight && styles.optionTextWrong,
                        ]}>{opt}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              );
            })}
            {!!speed && (
              <View style={styles.speedCard}>
                <Gauge size={22} color={COLORS.primary} />
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
              <View style={styles.result}>
                <Text style={styles.resultText}>
                  {t('storyQuizResult').replace('{c}', String(correct)).replace('{n}', String(questions.length))}
                </Text>
              </View>
            )}
          </View>
        )}

        {(allAnswered || questions.length === 0) && (
          <TouchableOpacity
            style={styles.nextBtn}
            onPress={() =>
              questions.length === 0
                ? finishWithoutQuestions()
                : nextChapter
                ? navigation.navigate('Story', { storyId: nextChapter.id, openedAt: Date.now() })
                : handleClose()
            }
            activeOpacity={0.85}
          >
            <Text style={styles.nextBtnText}>{nextChapter ? t('storyNextChapter') : t('storyFinish')}</Text>
            <ChevronLeft size={18} color={COLORS.white} />
          </TouchableOpacity>
        )}
      </ScrollView>

      {/* نوار پلیر صوتی شناور پایین */}
      <View style={[styles.player, { paddingBottom: insets.bottom + SPACING.s }]}>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${progress * 100}%`, backgroundColor: COLORS.primary }]} />
        </View>
        <View style={[styles.playerRow, rr]}>
          <TouchableOpacity
            style={[styles.playBtn, { backgroundColor: audioOpen ? COLORS.primary : '#E5E0D6' }]}
            onPress={togglePlay}
            disabled={!ready || !audioOpen}
            activeOpacity={0.85}
          >
            {!audioOpen ? (
              <Lock size={20} color="#7A7265" />
            ) : !ready ? (
              <ActivityIndicator color={COLORS.white} />
            ) : playing ? (
              <Pause size={22} color={COLORS.white} fill={COLORS.white} />
            ) : (
              <Play size={22} color={COLORS.white} fill={COLORS.white} />
            )}
          </TouchableOpacity>
          <View style={[styles.flex, rtl ? styles.alignEnd : styles.alignStart]}>
            <Text style={styles.playerLabel}>{audioOpen ? t('storyListenAlong') : t('storyAudioLocked')}</Text>
            <Text style={styles.playerSub}>{audioOpen ? t('storyPlayerSub') : t('storyAudioLockedSub')}</Text>
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
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FDFBF7',
  },
  center: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.s,
  },
  flex: {
    flex: 1,
  },
  rowReverse: {
    flexDirection: 'row-reverse',
  },
  textRight: {
    textAlign: 'right',
  },
  textLeft: {
    textAlign: 'left',
  },
  alignEnd: {
    alignItems: 'flex-end',
  },
  alignStart: {
    alignItems: 'flex-start',
  },
  mutedText: {
    ...TEXT_STYLES.bodyMd,
    color: '#7A7265',
    textAlign: 'center',
  },
  linkText: {
    ...TEXT_STYLES.labelMd,
    color: COLORS.primary,
    fontFamily: FONT_FAMILY.semiBold,
  },

  // ---- هدر مدرن بالای صفحه ----
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.l,
    paddingBottom: SPACING.m,
  },
  closeBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: '#F0EBE3',
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.level1,
  },
  topTitle: {
    fontFamily: FONT_FAMILY.bold,
    fontSize: 16,
    color: '#191C21',
  },
  chapterPill: {
    marginTop: 2,
    backgroundColor: '#FFF4EE',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.full,
  },
  chapterPillText: {
    fontFamily: FONT_FAMILY.semiBold,
    fontSize: 11,
    color: COLORS.primary,
  },
  headerSpacer: {
    width: 40,
  },

  // ---- محتوای اسکرول ----
  content: {
    paddingHorizontal: SPACING.l,
    paddingBottom: 130,
    gap: SPACING.m,
  },

  // ---- کاور عکاسی داستان ----
  cover: {
    width: '100%',
    aspectRatio: 16 / 9,
    borderRadius: 22,
    overflow: 'hidden',
    backgroundColor: '#EDE7DC',
    position: 'relative',
    borderWidth: 1,
    borderColor: '#F0EBE3',
    ...SHADOWS.level1,
  },
  coverImage: {
    width: '100%',
    height: '100%',
  },
  coverPlaceholder: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  coverScrim: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.18)',
  },
  coverBadge: {
    position: 'absolute',
    bottom: 12,
    backgroundColor: 'rgba(25,28,33,0.72)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: BORDER_RADIUS.full,
  },
  coverBadgeText: {
    fontFamily: FONT_FAMILY.bold,
    fontSize: 11,
    color: COLORS.white,
  },

  // ---- کارت خلاصه داستان ----
  recapCard: {
    backgroundColor: COLORS.white,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#F0EBE3',
    padding: SPACING.m,
    gap: 6,
    ...SHADOWS.level1,
  },
  recapHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  recapLabel: {
    fontFamily: FONT_FAMILY.bold,
    fontSize: 12,
    color: COLORS.primary,
  },
  recapText: {
    fontFamily: FONT_FAMILY.regular,
    fontSize: 13,
    lineHeight: 22,
    color: '#4A453E',
  },

  // ---- کارت راهنمای مطالعه ----
  guideCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    backgroundColor: '#FFFDF9',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#EDE6DC',
    padding: SPACING.m,
  },
  guideIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F5EFE6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  guideTitle: {
    fontFamily: FONT_FAMILY.bold,
    fontSize: 13,
    color: '#191C21',
  },
  guideText: {
    fontFamily: FONT_FAMILY.regular,
    fontSize: 12,
    lineHeight: 19,
    color: '#697082',
    marginTop: 2,
  },

  // ---- نوار ابزار تنظیمات ترجمه ----
  toolbarCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#F0EBE3',
    paddingHorizontal: SPACING.m,
    paddingVertical: 10,
  },
  switchInline: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  switchLabel: {
    fontFamily: FONT_FAMILY.medium,
    fontSize: 12,
    color: '#4B5565',
  },
  hint: {
    fontFamily: FONT_FAMILY.regular,
    fontSize: 11,
    color: '#9CA3AF',
    flex: 1,
  },

  // ---- صفحه اصلی کتاب (Book Paper) ----
  bookPaper: {
    backgroundColor: COLORS.white,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#F0EBE3',
    padding: SPACING.l,
    gap: 8,
    ...SHADOWS.level1,
  },
  paragraphGap: {
    height: SPACING.m,
  },
  inlineImage: {
    width: '100%',
    aspectRatio: 16 / 9,
    borderRadius: 18,
    marginVertical: SPACING.m,
  },
  sentence: {
    borderRadius: 12,
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  sentenceActive: {
    backgroundColor: '#FFF4EE',
    borderLeftWidth: 3,
    borderLeftColor: COLORS.primary,
  },
  sentenceText: {
    fontFamily: FONT_FAMILY.regular,
    fontSize: 18,
    lineHeight: 32,
    color: '#191C21',
    textAlign: 'left',
    writingDirection: 'ltr',
    letterSpacing: 0.15,
  },
  sentenceTextActive: {
    fontFamily: FONT_FAMILY.semiBold,
    color: '#0F172A',
  },
  translationContainer: {
    marginTop: 4,
    paddingTop: 4,
    borderTopWidth: 1,
    borderTopColor: '#F5EFE6',
  },
  translationText: {
    fontFamily: FONT_FAMILY.regular,
    fontSize: 13,
    lineHeight: 22,
    color: '#7A7265',
    textAlign: 'right',
  },

  // ---- واژگان کلیدی ----
  vocabBlock: {
    backgroundColor: COLORS.white,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#F0EBE3',
    padding: SPACING.l,
    gap: SPACING.m,
    ...SHADOWS.level1,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionHeaderTitle: {
    fontFamily: FONT_FAMILY.bold,
    fontSize: 15,
    color: '#191C21',
  },
  sectionHeaderSub: {
    fontFamily: FONT_FAMILY.medium,
    fontSize: 11,
    color: '#7A7265',
  },
  vocabChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  vocabChip: {
    backgroundColor: '#FFF8F4',
    borderWidth: 1,
    borderColor: '#F7DCCE',
    borderRadius: BORDER_RADIUS.full,
    paddingHorizontal: 12,
    paddingVertical: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  vocabChipWord: {
    fontFamily: FONT_FAMILY.bold,
    fontSize: 13,
    color: COLORS.primary,
  },
  vocabChipMeaning: {
    fontFamily: FONT_FAMILY.regular,
    fontSize: 12,
    color: '#697082',
  },

  // ---- کوئیز درک مطلب ----
  quizBlock: {
    backgroundColor: COLORS.white,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#F0EBE3',
    padding: SPACING.l,
    gap: SPACING.l,
    ...SHADOWS.level1,
  },
  quizCard: {
    gap: 8,
  },
  questionText: {
    fontFamily: FONT_FAMILY.bold,
    fontSize: 15,
    color: '#191C21',
    textAlign: 'left',
    lineHeight: 22,
  },
  questionFa: {
    fontFamily: FONT_FAMILY.regular,
    fontSize: 12,
    color: '#7A7265',
    textAlign: 'right',
    lineHeight: 18,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: '#E8E2D8',
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: SPACING.m,
    backgroundColor: '#FFFDF9',
  },
  optionRight: {
    backgroundColor: '#ECFDF5',
    borderColor: '#059669',
  },
  optionWrong: {
    backgroundColor: '#FEF2F2',
    borderColor: '#DC2626',
  },
  optionRadio: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#D0C8B8',
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionRadioRight: {
    backgroundColor: '#059669',
    borderColor: '#059669',
  },
  optionRadioWrong: {
    backgroundColor: '#DC2626',
    borderColor: '#DC2626',
  },
  optionRadioLetter: {
    fontFamily: FONT_FAMILY.bold,
    fontSize: 12,
    color: '#7A7265',
  },
  optionRadioLetterActive: {
    color: COLORS.white,
  },
  optionText: {
    ...TEXT_STYLES.bodyMd,
    color: '#191C21',
    textAlign: 'left',
    flex: 1,
  },
  optionTextRight: {
    color: '#065F46',
    fontFamily: FONT_FAMILY.semiBold,
  },
  optionTextWrong: {
    color: '#991B1B',
    fontFamily: FONT_FAMILY.semiBold,
  },
  speedCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.m,
    borderWidth: 1,
    borderColor: '#F0EBE3',
    borderRadius: 18,
    backgroundColor: '#FFFBF7',
    padding: SPACING.m,
  },
  speedValue: {
    fontFamily: FONT_FAMILY.bold,
    fontSize: 16,
    color: '#191C21',
  },
  speedCompare: {
    ...TEXT_STYLES.labelMd,
    color: '#7A7265',
  },
  result: {
    borderRadius: 16,
    padding: SPACING.m,
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  resultText: {
    fontFamily: FONT_FAMILY.bold,
    fontSize: 15,
    color: '#065F46',
  },
  nextBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 18,
    paddingVertical: 15,
    backgroundColor: COLORS.primary,
    ...SHADOWS.level2,
  },
  nextBtnText: {
    color: COLORS.white,
    fontFamily: FONT_FAMILY.bold,
    fontSize: 16,
  },

  // ---- پلیر شناور پایین صفحه ----
  player: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    backgroundColor: COLORS.white,
    paddingHorizontal: SPACING.l,
    paddingTop: 12,
    gap: 10,
    borderTopWidth: 1,
    borderColor: '#F0EBE3',
    ...SHADOWS.level2,
    elevation: 8,
  },
  progressTrack: {
    height: 4,
    borderRadius: 2,
    backgroundColor: '#F0EBE3',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
  },
  playerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.m,
  },
  playBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.level2,
  },
  playerLabel: {
    fontFamily: FONT_FAMILY.bold,
    fontSize: 14,
    color: '#191C21',
  },
  playerSub: {
    fontFamily: FONT_FAMILY.regular,
    fontSize: 11,
    color: '#7A7265',
    marginTop: 2,
  },
  rates: {
    flexDirection: 'row',
    gap: 6,
  },
  rateBtn: {
    borderRadius: BORDER_RADIUS.full,
    borderWidth: 1,
    borderColor: '#E8E2D8',
    backgroundColor: '#FAF8F4',
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  rateBtnActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  rateText: {
    ...TEXT_STYLES.labelMd,
    color: '#7A7265',
  },
  rateTextActive: {
    color: COLORS.white,
  },
});
