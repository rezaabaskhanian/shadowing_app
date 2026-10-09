import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Mic, Square, Volume2, X } from 'lucide-react-native';

import { COLORS, SPACING, BORDER_RADIUS } from '../../theme/colors';
import { FONT_FAMILY, TEXT_STYLES } from '../../theme/typography';
import { SHADOWS } from '../../theme/elevation';
import { useLanguage } from '../../data/i18n';
import { AudioPlayer } from '../../components/AudioPlayer';
import { ensureMicPermission } from '../../services/micPermission';
import { absUrl } from '../../api/config';
import { evaluateRecording } from '../../api/shadowing';
import { completeCourseLesson, getCourseLesson, type CourseLesson } from '../../api/course';
import { useRecordingLimit } from '../../hooks/useRecordingLimit';
import { track } from '../../services/analytics';
import { Stars } from './CourseHomeScreen';
import Animated, { FadeInUp, ZoomIn } from 'react-native-reanimated';
import { Celebration } from '../../components/Celebration';

type Phase = 'intro' | 'card' | 'done';
type CardState = 'listen' | 'recording' | 'scoring' | 'feedback';
type Command = 'none' | 'play_original' | 'start_record' | 'stop_record';

/** هر کارت حداکثر چند کلمه است؛ ضبط بیشتر از این لازم نیست. */
const MAX_RECORD_SECONDS = 8;

/** نمره‌ی تلفظ → ستاره‌ی کارت. مهربان: هدف این دوره اعتمادبه‌نفس است. */
const starsFor = (score: number) => (score >= 80 ? 3 : score >= 60 ? 2 : 1);

/**
 * یک درس از «دوره‌ی شروع»: برای هر کارت اول صدایش خودکار پخش می‌شود، بعد
 * کاربر «حالا تو بگو» را می‌زند و تکرار می‌کند و ستاره و یک جمله‌ی تشویقی
 * می‌گیرد. اگر نمره کم بود می‌تواند دوباره بگوید؛ بهترین نمره‌ی هر کارت حساب
 * می‌شود. آخر درس جشن کوچک + ستاره‌ی درس.
 */
export const CourseLessonScreen: React.FC = () => {
  const { t } = useLanguage();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const lessonId: string | undefined = route.params?.lessonId;

  const [lesson, setLesson] = useState<CourseLesson | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [phase, setPhase] = useState<Phase>('intro');
  const [index, setIndex] = useState(0);
  const [cardState, setCardState] = useState<CardState>('listen');
  const [lastScore, setLastScore] = useState<number | null>(null);
  const [bestScores, setBestScores] = useState<Record<number, number>>({});
  const [lessonStars, setLessonStars] = useState(0);
  const [micError, setMicError] = useState(false);

  const [command, setCommand] = useState<Command>('none');
  const [nonce, setNonce] = useState(0);
  const recStartedAtRef = useRef(0);
  const stopRequestedRef = useRef(false);

  const send = (c: Command) => {
    setCommand(c);
    setNonce((n) => n + 1);
  };

  useEffect(() => {
    if (!lessonId) {
      setLoadError(true);
      return;
    }
    let active = true;
    getCourseLesson(lessonId)
      .then((l) => active && setLesson(l))
      .catch(() => active && setLoadError(true));
    return () => {
      active = false;
    };
  }, [lessonId]);

  const items = lesson?.items ?? [];
  const item = items[index];

  const playItem = useCallback(() => {
    if (item?.audio_url) send('play_original');
  }, [item]);

  // هر کارت تازه: صدایش خودکار پخش شود.
  useEffect(() => {
    if (phase !== 'card' || !item) return;
    setCardState('listen');
    setLastScore(null);
    const id = setTimeout(playItem, 350);
    return () => clearTimeout(id);
  }, [phase, index, item, playItem]);

  const startRecord = async () => {
    setMicError(false);
    if (!(await ensureMicPermission())) {
      setMicError(true);
      return;
    }
    send('start_record');
  };

  const stopRecord = useCallback(() => {
    stopRequestedRef.current = true;
    send('stop_record');
  }, []);

  useRecordingLimit(cardState === 'recording', MAX_RECORD_SECONDS, () => {
    if (!stopRequestedRef.current) stopRecord();
  });

  const handleRecordingStatus = useCallback(
    (status: 'recording' | 'stopped' | 'error', filePath?: string, mimeType?: string) => {
      if (status === 'recording') {
        stopRequestedRef.current = false;
        recStartedAtRef.current = Date.now();
        setCardState('recording');
        return;
      }
      setCommand('none');
      if (status === 'error' || !filePath || !item) {
        setMicError(status === 'error');
        setCardState('listen');
        return;
      }
      setCardState('scoring');
      const duration = Math.max(1, (Date.now() - recStartedAtRef.current) / 1000);
      const words = item.text_en.trim().split(/\s+/).length;
      evaluateRecording({
        filePath,
        mimeType,
        targetText: item.text_en,
        duration,
        expectedDuration: Math.max(1, Math.round(words * 0.5 + 0.5)),
      })
        .then((r) => Math.round(r.overall_score))
        // ارزیاب در دسترس نبود: کاربر مبتدی نباید به‌خاطر خطای ما گیر کند.
        .catch(() => 60)
        .then((score) => {
          setLastScore(score);
          setBestScores((prev) => ({ ...prev, [index]: Math.max(prev[index] ?? 0, score) }));
          setCardState('feedback');
        });
    },
    [item, index]
  );

  const next = () => {
    if (index + 1 < items.length) {
      setIndex(index + 1);
      return;
    }
    // پایان درس: میانگین بهترین نمره‌ی کارت‌ها.
    const values = items.map((_, i) => bestScores[i] ?? 0);
    const avg = values.length ? values.reduce((a, b) => a + b, 0) / values.length : 0;
    setLessonStars(starsFor(avg));
    setPhase('done');
    if (lesson) {
      track('course_lesson_completed', lesson.id);
      completeCourseLesson(lesson.id, avg)
        .then(setLessonStars)
        .catch(() => {});
    }
  };

  if (loadError) {
    return (
      <View style={[styles.container, styles.center, { paddingTop: insets.top }]}>
        <Text style={styles.mutedText}>{t('courseLoadError')}</Text>
        <TouchableOpacity onPress={() => navigation.goBack()} activeOpacity={0.8}>
          <Text style={styles.linkText}>{t('courseBackToMap')}</Text>
        </TouchableOpacity>
      </View>
    );
  }
  if (!lesson) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator color={COLORS.primary} />
      </View>
    );
  }

  const feedbackKey =
    lastScore === null ? '' : lastScore >= 80 ? 'courseFeedbackGreat' : lastScore >= 60 ? 'courseFeedbackGood' : 'courseFeedbackTry';

  return (
    <View style={[styles.container, { paddingTop: insets.top + SPACING.s, paddingBottom: insets.bottom + SPACING.l }]}>
      <AudioPlayer
        uri={item?.audio_url ? absUrl(item.audio_url) : null}
        shouldPlay={false}
        actionCommand={command}
        actionNonce={nonce}
        onRecordingStatusUpdate={handleRecordingStatus}
      />

      <View style={styles.topRow}>
        <TouchableOpacity
          style={styles.closeBtn}
          onPress={() => navigation.goBack()}
          disabled={cardState === 'recording' || cardState === 'scoring'}
          activeOpacity={0.8}
        >
          <X size={20} color={COLORS.text} />
        </TouchableOpacity>
        {phase === 'card' && (
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${((index + 1) / items.length) * 100}%` }]} />
          </View>
        )}
      </View>

      {phase === 'intro' && (
        <View style={styles.centerFill}>
          <Text style={styles.bigEmoji}>{lesson.emoji || '⭐️'}</Text>
          <Text style={styles.introTitle}>{lesson.title_fa}</Text>
          {!!lesson.title_en && <Text style={styles.introEn}>{lesson.title_en}</Text>}
          {!!lesson.goal_fa && <Text style={styles.introGoal}>{lesson.goal_fa}</Text>}
          <Text style={styles.mutedText}>{t('courseIntroHint')}</Text>
          <TouchableOpacity style={styles.primaryBtn} onPress={() => setPhase('card')} activeOpacity={0.85}>
            <Text style={styles.primaryBtnText}>{t('courseStartLesson')}</Text>
          </TouchableOpacity>
        </View>
      )}

      {phase === 'card' && item && (
        <ScrollView contentContainerStyle={styles.cardWrap} showsVerticalScrollIndicator={false}>
          <View style={styles.card}>
            {item.image_url ? (
              <Image source={{ uri: absUrl(item.image_url) }} style={styles.cardImage} resizeMode="contain" />
            ) : (
              <Text style={styles.cardEmoji}>{item.emoji || '💬'}</Text>
            )}
            <Text style={styles.cardText}>{item.text_en}</Text>
            {!!item.meaning_fa && <Text style={styles.cardMeaning}>{item.meaning_fa}</Text>}
            <TouchableOpacity
              style={styles.listenBtn}
              onPress={playItem}
              disabled={!item.audio_url || cardState === 'recording'}
              activeOpacity={0.85}
            >
              <Volume2 size={18} color={COLORS.primary} />
              <Text style={styles.listenText}>{t('courseListenAgain')}</Text>
            </TouchableOpacity>
            {!!item.tip_fa && <Text style={styles.tip}>💡 {item.tip_fa}</Text>}
          </View>

          {cardState === 'feedback' && lastScore !== null && (
            // بازخوردِ هر کارت با فنر بالا می‌آید؛ ۳ ستاره یک جشنِ کوچک هم دارد.
            <Animated.View key={`fb-${index}-${lastScore}`} entering={ZoomIn.springify().damping(10)} style={styles.feedback}>
              {starsFor(lastScore) === 3 && <Celebration kind="correct" size={64} />}
              <Stars count={starsFor(lastScore)} size={26} />
              <Text style={styles.feedbackText}>{t(feedbackKey)}</Text>
            </Animated.View>
          )}
          {cardState === 'scoring' && (
            <View style={styles.feedback}>
              <ActivityIndicator color={COLORS.primary} />
            </View>
          )}
          {micError && <Text style={styles.errorText}>{t('placementMicDenied')}</Text>}
        </ScrollView>
      )}

      {phase === 'card' && item && (
        <View style={styles.bottom}>
          {cardState === 'feedback' ? (
            <View style={styles.row}>
              <TouchableOpacity style={[styles.secondaryBtn, styles.flex]} onPress={startRecord} activeOpacity={0.85}>
                <Mic size={18} color={COLORS.text} />
                <Text style={styles.secondaryBtnText}>{t('courseSayAgain')}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.primaryBtn, styles.flex]} onPress={next} activeOpacity={0.85}>
                <Text style={styles.primaryBtnText}>
                  {t(index + 1 < items.length ? 'courseNext' : 'courseFinish')}
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.micArea}>
              <TouchableOpacity
                style={[styles.micBtn, cardState === 'recording' && styles.micBtnActive]}
                onPress={cardState === 'recording' ? stopRecord : startRecord}
                disabled={cardState === 'scoring'}
                activeOpacity={0.85}
              >
                {cardState === 'recording' ? (
                  <Square size={28} color={COLORS.white} fill={COLORS.white} />
                ) : (
                  <Mic size={32} color={COLORS.white} />
                )}
              </TouchableOpacity>
              <Text style={styles.micHint}>
                {t(cardState === 'recording' ? 'courseTapWhenDone' : 'courseNowYouSay')}
              </Text>
            </View>
          )}
        </View>
      )}

      {phase === 'done' && (
        <View style={styles.centerFill}>
          <Celebration kind="courseDone" size={180} />
          <Animated.Text entering={FadeInUp.delay(250)} style={styles.introTitle}>
            {t('courseDoneTitle')}
          </Animated.Text>
          <Animated.View entering={ZoomIn.delay(450).springify().damping(9)}>
            <Stars count={lessonStars} size={34} />
          </Animated.View>
          <Text style={styles.mutedText}>{t(lessonStars === 3 ? 'courseDonePerfect' : 'courseDoneGood')}</Text>
          <TouchableOpacity style={styles.primaryBtn} onPress={() => navigation.goBack()} activeOpacity={0.85}>
            <Text style={styles.primaryBtnText}>{t('courseBackToMap')}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => {
              setIndex(0);
              setBestScores({});
              setPhase('card');
            }}
            activeOpacity={0.8}
          >
            <Text style={styles.linkText}>{t('courseRepeatLesson')}</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    paddingHorizontal: SPACING.l,
  },
  center: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.s,
  },
  centerFill: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.m,
  },
  flex: {
    flex: 1,
  },
  row: {
    flexDirection: 'row',
    gap: SPACING.s,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.m,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressTrack: {
    flex: 1,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.surfaceHigh,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 5,
    backgroundColor: COLORS.success,
  },
  bigEmoji: {
    fontSize: 72,
  },
  introTitle: {
    ...TEXT_STYLES.headlineSm,
    color: COLORS.text,
    textAlign: 'center',
  },
  introEn: {
    ...TEXT_STYLES.bodyLg,
    color: COLORS.textSecondary,
  },
  introGoal: {
    ...TEXT_STYLES.bodyMd,
    color: COLORS.text,
    textAlign: 'center',
    backgroundColor: COLORS.successLight,
    borderRadius: BORDER_RADIUS.l,
    padding: SPACING.m,
  },
  cardWrap: {
    flexGrow: 1,
    justifyContent: 'center',
    gap: SPACING.m,
    paddingVertical: SPACING.l,
  },
  card: {
    alignItems: 'center',
    gap: SPACING.s,
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.xl,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.l,
    ...SHADOWS.level2,
  },
  cardEmoji: {
    fontSize: 84,
  },
  cardImage: {
    width: '100%',
    height: 160,
  },
  cardText: {
    fontFamily: FONT_FAMILY.bold,
    fontSize: 32,
    color: COLORS.text,
    textAlign: 'center',
  },
  cardMeaning: {
    ...TEXT_STYLES.bodyLg,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  listenBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.primaryLight,
    borderRadius: BORDER_RADIUS.full,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginTop: SPACING.s,
  },
  listenText: {
    ...TEXT_STYLES.labelMd,
    color: COLORS.primary,
    fontFamily: FONT_FAMILY.semiBold,
  },
  tip: {
    ...TEXT_STYLES.labelMd,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: SPACING.s,
  },
  feedback: {
    alignItems: 'center',
    gap: SPACING.s,
  },
  feedbackText: {
    fontFamily: FONT_FAMILY.bold,
    fontSize: 18,
    color: COLORS.text,
    textAlign: 'center',
  },
  errorText: {
    ...TEXT_STYLES.labelMd,
    color: COLORS.error,
    textAlign: 'center',
  },
  bottom: {
    paddingTop: SPACING.s,
  },
  micArea: {
    alignItems: 'center',
    gap: SPACING.s,
  },
  micBtn: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.level2,
  },
  micBtnActive: {
    backgroundColor: COLORS.error,
  },
  micHint: {
    fontFamily: FONT_FAMILY.semiBold,
    fontSize: 15,
    color: COLORS.text,
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
  primaryBtn: {
    flexDirection: 'row',
    gap: 8,
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.l,
    paddingVertical: SPACING.m,
    paddingHorizontal: SPACING.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBtnText: {
    color: COLORS.white,
    fontFamily: FONT_FAMILY.bold,
    fontSize: 16,
  },
  secondaryBtn: {
    flexDirection: 'row',
    gap: 8,
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.l,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingVertical: SPACING.m,
    paddingHorizontal: SPACING.l,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryBtnText: {
    color: COLORS.text,
    fontFamily: FONT_FAMILY.semiBold,
    fontSize: 15,
  },
});
