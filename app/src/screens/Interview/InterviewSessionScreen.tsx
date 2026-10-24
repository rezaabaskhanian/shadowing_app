import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CircleX, Lock, Mic, RotateCcw, Square, Trophy, Volume2, X } from 'lucide-react-native';

import { COLORS, SPACING, BORDER_RADIUS, hexToRgba } from '../../theme/colors';
import { FONT_FAMILY, TEXT_STYLES } from '../../theme/typography';
import { SHADOWS } from '../../theme/elevation';
import { useLanguage } from '../../data/i18n';
import { AudioPlayer } from '../../components/AudioPlayer';
import { ensureMicPermission } from '../../services/micPermission';
import { ForbiddenError } from '../../api/client';
import { getAIUsageStatus } from '../../api/aiUsage';
import {
  finishInterview,
  getInterviewSet,
  startInterview,
  submitInterviewAnswer,
  type InterviewAnswerResult,
  type InterviewReport,
  type InterviewSet,
} from '../../api/interviews';
import { useRecordingLimit } from '../../hooks/useRecordingLimit';
import { track } from '../../services/analytics';
import { RiseIn } from '../../components/RiseIn';
import { absUrl } from '../../api/config';
import { ACCENT_CYCLE, PromptHero, levelColor } from '../../components/ContentVisuals';
import { INTERVIEW_KIND_META } from './InterviewListScreen';

type Phase =
  | 'loading'
  | 'intro'
  | 'listening'
  | 'prep'
  | 'recording'
  | 'analyzing'
  | 'feedback'
  | 'finishing'
  | 'report'
  | 'locked'
  | 'error';
type ActionCommand = 'none' | 'play_original' | 'start_record' | 'stop_record';

/** کمتر از این جوابی برای بررسی نیست — با minAnswerSeconds در بک‌اند یکی است. */
const MIN_ANSWER_SECONDS = 5;

const scoreColor = (score: number) => {
  if (score >= 75) return COLORS.success;
  if (score >= 50) return COLORS.warning;
  return COLORS.error;
};

/**
 * یک مصاحبه‌ی شبیه‌سازی‌شده: برای هر سؤال، صدای مصاحبه‌گر پخش می‌شود، چند ثانیه
 * وقت آماده‌شدن (برنامه‌ریزی قبل از گفتن روانی را بالا می‌برد)، بعد جواب ضبط و
 * بررسی می‌شود. «دوباره جواب بده» همان سؤال را تکرار می‌کند (تکرار تکلیف)، و
 * گزارش آخر بهترین تلاشِ هر سؤال را با جواب نمونه نشان می‌دهد.
 */
export const InterviewSessionScreen: React.FC = () => {
  const { t } = useLanguage();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const setId: string | undefined = route.params?.setId;

  const [set, setSet] = useState<InterviewSet | null>(null);
  const [phase, setPhase] = useState<Phase>('loading');
  const [index, setIndex] = useState(0);
  const [attemptId, setAttemptId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<InterviewAnswerResult | null>(null);
  const [report, setReport] = useState<InterviewReport | null>(null);
  const [errorText, setErrorText] = useState<string | null>(null);
  const [micError, setMicError] = useState<string | null>(null);
  const [showTranslation, setShowTranslation] = useState(false);
  const [showSample, setShowSample] = useState(false);
  const [prepLeft, setPrepLeft] = useState(0);
  const [hasActiveSubscription, setHasActiveSubscription] = useState(true);
  const [actionCommand, setActionCommand] = useState<ActionCommand>('none');
  const [actionNonce, setActionNonce] = useState(0);
  const stopRequestedRef = useRef(false);
  const startedAtRef = useRef(0);

  const questions = set?.questions ?? [];
  const question = questions[index];
  const isLast = index >= questions.length - 1;

  const command = (c: ActionCommand) => {
    setActionCommand(c);
    setActionNonce((n) => n + 1);
  };

  useEffect(() => {
    if (!setId) {
      setPhase('error');
      return;
    }
    getInterviewSet(setId)
      .then((s) => {
        setSet(s);
        setPhase('intro');
      })
      .catch((err) => {
        setErrorText(err instanceof Error ? err.message : null);
        setPhase('error');
      });
  }, [setId]);

  const lockOrError = useCallback(async (err: unknown) => {
    if (err instanceof ForbiddenError) {
      try {
        const s = await getAIUsageStatus();
        setHasActiveSubscription(s.has_active_subscription);
      } catch {
        setHasActiveSubscription(false);
      }
      setPhase('locked');
      return;
    }
    setErrorText(err instanceof Error ? err.message : null);
    setPhase('error');
  }, []);

  const playQuestion = useCallback(() => {
    setShowTranslation(false);
    setShowSample(false);
    setFeedback(null);
    setPhase('listening');
    command('play_original');
  }, []);

  const handleStart = useCallback(async () => {
    if (!set) return;
    try {
      const id = await startInterview(set.id);
      setAttemptId(id);
      track('interview_started', set.id);
      setIndex(0);
      playQuestion();
    } catch (err) {
      lockOrError(err);
    }
  }, [set, playQuestion, lockOrError]);

  const startPrep = useCallback(() => {
    if (!question) return;
    setActionCommand('none');
    setPrepLeft(question.prep_seconds);
    setPhase('prep');
  }, [question]);

  const startRecording = useCallback(async () => {
    setMicError(null);
    // همین‌جا از «آماده‌شدن» بیرون می‌آییم تا شمارش معکوس دوباره ضبط را شروع نکند.
    setPhase('recording');
    const granted = await ensureMicPermission();
    if (!granted) {
      setMicError(t('placementMicDenied'));
      setPhase('feedback');
      return;
    }
    command('start_record');
  }, [t]);

  // شمارش معکوس آماده‌شدن؛ در صفر، ضبط خودش شروع می‌شود.
  useEffect(() => {
    if (phase !== 'prep') return;
    if (prepLeft <= 0) {
      startRecording();
      return;
    }
    const id = setTimeout(() => setPrepLeft((s) => s - 1), 1000);
    return () => clearTimeout(id);
  }, [phase, prepLeft, startRecording]);

  const handleStopRecord = useCallback(() => {
    stopRequestedRef.current = true;
    command('stop_record');
  }, []);

  const maxSeconds = question?.answer_seconds ?? 60;
  const elapsedSeconds = useRecordingLimit(phase === 'recording', maxSeconds, () => {
    if (!stopRequestedRef.current) handleStopRecord();
  });
  const canStop = elapsedSeconds >= MIN_ANSWER_SECONDS;

  const handleRecordingStatus = useCallback(
    (status: 'recording' | 'stopped' | 'error', filePath?: string, mimeType?: string) => {
      if (status === 'recording') {
        stopRequestedRef.current = false;
        startedAtRef.current = Date.now();
        setPhase('recording');
        return;
      }
      if (status === 'error') {
        setMicError(t('placementMicDenied'));
        setActionCommand('none');
        setPrepLeft(0);
        setPhase('feedback');
        return;
      }
      if (status !== 'stopped' || !filePath || !attemptId || !question) return;
      setActionCommand('none');
      setPhase('analyzing');
      const duration = Math.min(maxSeconds, (Date.now() - startedAtRef.current) / 1000);
      submitInterviewAnswer(attemptId, question.id, filePath, duration, mimeType)
        .then((res) => {
          track('interview_answered', question.id);
          setFeedback(res);
          setPhase('feedback');
        })
        .catch(lockOrError);
    },
    [t, attemptId, question, maxSeconds, lockOrError]
  );

  const handlePlayback = useCallback(
    (status: string) => {
      // سؤال تمام شد (یا صدا ندارد): وقت آماده‌شدن شروع می‌شود.
      if (phase === 'listening' && (status === 'finished' || status === 'no_audio')) startPrep();
    },
    [phase, startPrep]
  );

  const handleNext = useCallback(() => {
    setIndex((i) => i + 1);
    playQuestion();
  }, [playQuestion]);

  const handleFinish = useCallback(async () => {
    if (!attemptId || !set) return;
    setPhase('finishing');
    try {
      const rep = await finishInterview(attemptId);
      track('interview_finished', set.id);
      setReport(rep);
      setPhase('report');
    } catch (err) {
      lockOrError(err);
    }
  }, [attemptId, set, lockOrError]);

  if (phase === 'loading') {
    return (
      <View style={[styles.container, styles.center, { paddingTop: insets.top }]}>
        <ActivityIndicator color={COLORS.primary} />
      </View>
    );
  }

  const kind = set ? INTERVIEW_KIND_META[set.kind] ?? INTERVIEW_KIND_META.job : INTERVIEW_KIND_META.job;
  const busy = phase === 'recording' || phase === 'analyzing' || phase === 'finishing';

  return (
    <View style={[styles.container, { paddingTop: insets.top + SPACING.s, paddingBottom: insets.bottom + SPACING.l }]}>
      <AudioPlayer
        uri={question?.audio_url ? absUrl(question.audio_url) : null}
        shouldPlay={false}
        actionCommand={actionCommand}
        actionNonce={actionNonce}
        recordingProfile="speech"
        onPlaybackStatusUpdate={handlePlayback}
        onRecordingStatusUpdate={handleRecordingStatus}
      />

      <View style={styles.topRow}>
        <TouchableOpacity style={styles.closeBtn} onPress={() => navigation.goBack()} disabled={busy} activeOpacity={0.8}>
          <X size={20} color={COLORS.text} />
        </TouchableOpacity>
        {!!question && phase !== 'intro' && phase !== 'report' && (
          <Text style={styles.progressText}>
            {t('interviewQuestionN').replace('{i}', String(index + 1)).replace('{n}', String(questions.length))}
          </Text>
        )}
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {phase === 'intro' && set && (
          <>
            <PromptHero
              image={set.image_url ? { uri: absUrl(set.image_url) } : null}
              accent={levelColor(set.level)}
              icon={<kind.Icon size={18} color={COLORS.white} />}
              title={set.title}
              prompt={set.description_fa || set.title_fa}
            />
            <View style={styles.card}>
              <Text style={styles.cardLabel}>
                {t(`interviewKind_${set.kind}`)} · {t('interviewQuestionCount').replace('{n}', String(questions.length))}
              </Text>
              <Text style={styles.paragraph}>{t('interviewIntroHow')}</Text>
            </View>
          </>
        )}

        {question && (phase === 'listening' || phase === 'prep' || phase === 'recording' || phase === 'analyzing' || phase === 'feedback') && (
          <>
            <View style={[styles.card, styles.questionCard]}>
              <View style={styles.questionHead}>
                <View style={[styles.avatar, { backgroundColor: kind.color }]}>
                  <kind.Icon size={18} color={COLORS.white} />
                </View>
                <Text style={[styles.questionText, styles.flex1]}>{question.text}</Text>
              </View>
              {showTranslation && !!question.translation_fa && <Text style={styles.translation}>{question.translation_fa}</Text>}
              <View style={styles.inlineRow}>
                <TouchableOpacity style={styles.smallBtn} onPress={playQuestion} disabled={busy} activeOpacity={0.8}>
                  <Volume2 size={14} color={COLORS.primary} />
                  <Text style={styles.smallBtnText}>{t('interviewReplay')}</Text>
                </TouchableOpacity>
                {!!question.translation_fa && (
                  <TouchableOpacity style={styles.smallBtn} onPress={() => setShowTranslation((v) => !v)} activeOpacity={0.8}>
                    <Text style={styles.smallBtnText}>{t('interviewShowTranslation')}</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>

            {(phase === 'prep' || phase === 'listening') && (
              <>
                {!!question.tip_fa && (
                  <View style={[styles.card, styles.tipCard]}>
                    <Text style={[styles.cardLabel, { color: COLORS.levelIntermediateBg }]}>💡 {t('interviewTip')}</Text>
                    <Text style={styles.paragraph}>{question.tip_fa}</Text>
                  </View>
                )}
                {question.key_phrases.length > 0 && (
                  <View style={styles.chips}>
                    {question.key_phrases.map((p, i) => {
                      const c = ACCENT_CYCLE[i % ACCENT_CYCLE.length];
                      return (
                        <View key={i} style={[styles.chip, { backgroundColor: hexToRgba(c, 0.1), borderColor: hexToRgba(c, 0.35) }]}>
                          <Text style={[styles.chipText, { color: c }]}>{p}</Text>
                        </View>
                      );
                    })}
                  </View>
                )}
              </>
            )}

            {phase === 'analyzing' && (
              <View style={styles.centerBlock}>
                <ActivityIndicator size="large" color={COLORS.primary} />
                <Text style={styles.mutedText}>{t('topicSpeakingAnalyzing')}</Text>
              </View>
            )}

            {phase === 'feedback' && feedback && (
              <>
                <RiseIn i={0} style={[styles.card, styles.scoreCard]}>
                  <View style={[styles.scoreCircle, { borderColor: scoreColor(feedback.score) }]}>
                    <Text style={[styles.scoreValue, { color: scoreColor(feedback.score) }]}>{feedback.score}</Text>
                    <Text style={styles.scoreLabel}>{t('topicSpeakingScore')}</Text>
                  </View>
                  <View style={styles.flex1}>
                    <Text style={styles.statsText}>
                      {t('topicSpeakingStats')
                        .replace('{words}', String(feedback.word_count))
                        .replace('{wpm}', String(feedback.words_per_minute))}
                    </Text>
                    {!!feedback.summary_fa && <Text style={styles.summary}>{feedback.summary_fa}</Text>}
                  </View>
                </RiseIn>
                {feedback.mistakes.length > 0 && (
                  <RiseIn i={1} style={styles.card}>
                    <Text style={styles.cardLabel}>{t('topicSpeakingMistakes')}</Text>
                    {feedback.mistakes.map((m, i) => (
                      <View key={i} style={[styles.fixItem, i > 0 && styles.fixDivider]}>
                        <Text style={styles.wrongText}>{m.original}</Text>
                        <Text style={styles.rightText}>{m.corrected}</Text>
                        {!!m.explanation_fa && <Text style={styles.explain}>{m.explanation_fa}</Text>}
                      </View>
                    ))}
                  </RiseIn>
                )}
                {feedback.better_phrases.length > 0 && (
                  <RiseIn i={2} style={styles.card}>
                    <Text style={styles.cardLabel}>{t('topicSpeakingBetter')}</Text>
                    {feedback.better_phrases.map((p, i) => (
                      <View key={i} style={[styles.fixItem, i > 0 && styles.fixDivider]}>
                        <Text style={styles.explain}>
                          {t('topicSpeakingInsteadOf')}: <Text style={styles.plainEn}>{p.instead_of}</Text>
                        </Text>
                        <Text style={styles.rightText}>
                          {t('topicSpeakingSay')}: {p.try}
                        </Text>
                        {!!p.note_fa && <Text style={styles.explain}>{p.note_fa}</Text>}
                      </View>
                    ))}
                  </RiseIn>
                )}
                {!!feedback.improved_version && (
                  <RiseIn i={3} style={styles.card}>
                    <Text style={styles.cardLabel}>{t('topicSpeakingImproved')}</Text>
                    <Text style={styles.paragraph}>{feedback.improved_version}</Text>
                  </RiseIn>
                )}
                {!!question.sample_answer && (
                  <RiseIn i={4} style={styles.card}>
                    <TouchableOpacity onPress={() => setShowSample((v) => !v)} activeOpacity={0.8}>
                      <Text style={[styles.cardLabel, { color: COLORS.primary }]}>⭐ {t('interviewSample')}</Text>
                    </TouchableOpacity>
                    {showSample && (
                      <>
                        <Text style={styles.paragraph}>{question.sample_answer}</Text>
                        {!!question.sample_answer_fa && <Text style={styles.translation}>{question.sample_answer_fa}</Text>}
                      </>
                    )}
                  </RiseIn>
                )}
                <RiseIn i={5} style={styles.card}>
                  <Text style={styles.cardLabel}>{t('topicSpeakingYourTalk')}</Text>
                  <Text style={[styles.paragraph, styles.mutedParagraph]}>{feedback.transcript}</Text>
                </RiseIn>
              </>
            )}
          </>
        )}

        {phase === 'finishing' && (
          <View style={styles.centerBlock}>
            <ActivityIndicator size="large" color={COLORS.primary} />
          </View>
        )}

        {phase === 'report' && report && (
          <>
            <RiseIn i={0} style={[styles.card, styles.scoreCard]}>
              <View style={[styles.scoreCircle, { borderColor: scoreColor(report.score) }]}>
                <Text style={[styles.scoreValue, { color: scoreColor(report.score) }]}>{report.score}</Text>
                <Text style={styles.scoreLabel}>{t('topicSpeakingScore')}</Text>
              </View>
              <View style={styles.flex1}>
                <Text style={styles.reportTitle}>{t('interviewReportTitle')}</Text>
                <Text style={styles.statsText}>
                  {t('interviewReportSummary').replace('{a}', String(report.answered)).replace('{n}', String(report.total))}
                </Text>
                {report.improved > 0 && (
                  <Text style={[styles.statsText, { color: COLORS.success }]}>
                    {t('interviewReportImproved').replace('{n}', String(report.improved))}
                  </Text>
                )}
              </View>
            </RiseIn>
            {report.questions.map((qr, i) => {
              const q = questions.find((x) => x.id === qr.question_id);
              return (
                <RiseIn key={qr.question_id} i={1 + i} style={styles.card}>
                  <View style={styles.inlineRow}>
                    <Trophy size={14} color={scoreColor(qr.best_score)} />
                    <Text style={styles.statsText}>
                      {t('interviewTries').replace('{n}', String(qr.tries)).replace('{s}', String(qr.best_score))}
                    </Text>
                  </View>
                  {!!q && <Text style={styles.questionTextSm}>{q.text}</Text>}
                  {!!qr.best_review?.summary_fa && <Text style={styles.summary}>{qr.best_review.summary_fa}</Text>}
                  {!!qr.sample_answer && (
                    <>
                      <Text style={[styles.cardLabel, styles.sampleLabel]}>⭐ {t('interviewSample')}</Text>
                      <Text style={styles.paragraph}>{qr.sample_answer}</Text>
                    </>
                  )}
                </RiseIn>
              );
            })}
          </>
        )}

        {phase === 'error' && (
          <View style={styles.centerBlock}>
            <CircleX size={32} color={COLORS.error} />
            <Text style={styles.errorText}>{errorText || t('interviewLoadError')}</Text>
          </View>
        )}

        {phase === 'locked' && (
          <View style={styles.centerBlock}>
            <Lock size={28} color={COLORS.textSecondary} />
            <Text style={styles.mutedText}>
              {t(hasActiveSubscription ? 'topicSpeakingLockedQuota' : 'topicSpeakingLockedNoSub')}
            </Text>
            <TouchableOpacity
              style={styles.primaryBtn}
              onPress={() => navigation.navigate(hasActiveSubscription ? 'TokenTopup' : 'Paywall')}
              activeOpacity={0.85}
            >
              <Text style={styles.primaryBtnText}>
                {t(hasActiveSubscription ? 'aiConversationBuyTokensBtn' : 'aiConversationSubscribeBtn')}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {micError && <Text style={styles.errorText}>{micError}</Text>}

      {phase === 'intro' && (
        <TouchableOpacity style={styles.primaryBtn} onPress={handleStart} disabled={questions.length === 0} activeOpacity={0.85}>
          <Text style={styles.primaryBtnText}>{t('interviewStart')}</Text>
        </TouchableOpacity>
      )}

      {phase === 'listening' && (
        <View style={styles.recordArea}>
          <Volume2 size={26} color={COLORS.primary} />
          <Text style={styles.hint}>{t('interviewListen')}</Text>
        </View>
      )}

      {(phase === 'prep' || phase === 'recording') && (
        <View style={styles.recordArea}>
          <TouchableOpacity
            style={[styles.recordBtn, phase === 'recording' && styles.recordBtnActive, phase === 'recording' && !canStop && styles.recordBtnWaiting]}
            onPress={phase === 'recording' ? handleStopRecord : startRecording}
            disabled={phase === 'recording' && !canStop}
            activeOpacity={0.85}
          >
            {phase === 'recording' ? <Square size={26} color={COLORS.white} fill={COLORS.white} /> : <Mic size={28} color={COLORS.white} />}
          </TouchableOpacity>
          {phase === 'prep' ? (
            <>
              <Text style={styles.timer}>{t('interviewPrep').replace('{s}', String(prepLeft))}</Text>
              <Text style={styles.hint}>{t('interviewAnswerNow')}</Text>
            </>
          ) : (
            <>
              <Text style={[styles.timer, { color: COLORS.error }]}>
                {t('recordTimer').replace('{elapsed}', String(elapsedSeconds)).replace('{max}', String(maxSeconds))}
              </Text>
              <Text style={styles.hint}>
                {canStop ? t('interviewStopHint') : t('interviewMinHint').replace('{min}', String(MIN_ANSWER_SECONDS))}
              </Text>
            </>
          )}
        </View>
      )}

      {phase === 'feedback' && (
        <View style={styles.bottomRow}>
          <TouchableOpacity style={[styles.secondaryBtn, styles.flex1]} onPress={startPrep} activeOpacity={0.85}>
            <RotateCcw size={16} color={COLORS.text} />
            <Text style={styles.secondaryBtnText}>{t('interviewTryAgain')}</Text>
          </TouchableOpacity>
          {feedback && (
            <TouchableOpacity style={[styles.primaryBtn, styles.flex1]} onPress={isLast ? handleFinish : handleNext} activeOpacity={0.85}>
              <Text style={styles.primaryBtnText}>{t(isLast ? 'interviewFinish' : 'interviewNext')}</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {(phase === 'report' || phase === 'error') && (
        <TouchableOpacity style={styles.secondaryBtn} onPress={() => navigation.goBack()} activeOpacity={0.85}>
          <Text style={styles.secondaryBtnText}>{t('interviewDone')}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background, paddingHorizontal: SPACING.l },
  center: { alignItems: 'center', justifyContent: 'center' },
  flex1: { flex: 1 },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressText: { ...TEXT_STYLES.labelMd, color: COLORS.textSecondary, fontFamily: FONT_FAMILY.semiBold },
  content: { flexGrow: 1, paddingVertical: SPACING.m, gap: SPACING.m },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.l,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.m,
    gap: 6,
    ...SHADOWS.level1,
  },
  questionCard: { borderColor: hexToRgba(COLORS.primary, 0.3) },
  questionHead: { flexDirection: 'row', alignItems: 'flex-start', gap: SPACING.s },
  avatar: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  questionText: { ...TEXT_STYLES.bodyLg, color: COLORS.text, fontFamily: FONT_FAMILY.semiBold },
  questionTextSm: { ...TEXT_STYLES.bodyMd, color: COLORS.text, fontFamily: FONT_FAMILY.semiBold },
  translation: { ...TEXT_STYLES.bodyMd, color: COLORS.textSecondary },
  inlineRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.s, flexWrap: 'wrap' },
  smallBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.primaryLight,
    borderRadius: BORDER_RADIUS.full,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  smallBtnText: { ...TEXT_STYLES.labelSm, color: COLORS.primary, fontFamily: FONT_FAMILY.semiBold },
  tipCard: {
    backgroundColor: hexToRgba(COLORS.levelIntermediateBg, 0.05),
    borderColor: hexToRgba(COLORS.levelIntermediateBg, 0.2),
  },
  cardLabel: { fontFamily: FONT_FAMILY.semiBold, fontSize: 13, color: COLORS.textSecondary },
  sampleLabel: { color: COLORS.primary, marginTop: 4 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: { borderRadius: BORDER_RADIUS.full, borderWidth: 1, paddingHorizontal: 10, paddingVertical: 4 },
  chipText: { ...TEXT_STYLES.labelMd },
  centerBlock: { alignItems: 'center', gap: SPACING.s, paddingVertical: SPACING.l },
  mutedText: { ...TEXT_STYLES.bodyMd, color: COLORS.textSecondary, textAlign: 'center' },
  errorText: { ...TEXT_STYLES.labelMd, color: COLORS.error, textAlign: 'center', marginBottom: SPACING.s },
  scoreCard: { flexDirection: 'row', alignItems: 'center', gap: SPACING.m },
  scoreCircle: { width: 76, height: 76, borderRadius: 38, borderWidth: 4, alignItems: 'center', justifyContent: 'center' },
  scoreValue: { fontFamily: FONT_FAMILY.bold, fontSize: 24 },
  scoreLabel: { ...TEXT_STYLES.labelSm, color: COLORS.muted },
  reportTitle: { ...TEXT_STYLES.headlineSm, color: COLORS.text },
  statsText: { ...TEXT_STYLES.labelSm, color: COLORS.muted },
  summary: { ...TEXT_STYLES.labelMd, color: COLORS.text },
  fixItem: { gap: 2, paddingVertical: 4 },
  fixDivider: { borderTopWidth: 1, borderTopColor: COLORS.border, paddingTop: SPACING.s },
  wrongText: { ...TEXT_STYLES.bodyMd, color: COLORS.error, textDecorationLine: 'line-through' },
  rightText: { ...TEXT_STYLES.bodyMd, color: COLORS.success, fontFamily: FONT_FAMILY.semiBold },
  plainEn: { color: COLORS.text },
  explain: { ...TEXT_STYLES.labelMd, color: COLORS.textSecondary },
  paragraph: { ...TEXT_STYLES.bodyMd, color: COLORS.text, lineHeight: 22 },
  mutedParagraph: { color: COLORS.textSecondary },
  recordArea: { alignItems: 'center', gap: SPACING.s, paddingTop: SPACING.s },
  recordBtn: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.level2,
  },
  recordBtnActive: { backgroundColor: COLORS.error },
  recordBtnWaiting: { opacity: 0.6 },
  timer: { ...TEXT_STYLES.labelMd, color: COLORS.primary, fontFamily: FONT_FAMILY.semiBold },
  hint: { ...TEXT_STYLES.labelMd, color: COLORS.textSecondary },
  bottomRow: { flexDirection: 'row', gap: SPACING.s, paddingTop: SPACING.s },
  primaryBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.l,
    paddingVertical: SPACING.m,
    paddingHorizontal: SPACING.l,
    alignItems: 'center',
  },
  primaryBtnText: { color: COLORS.white, fontFamily: FONT_FAMILY.bold, fontSize: 15 },
  secondaryBtn: {
    flexDirection: 'row',
    gap: 6,
    justifyContent: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.l,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingVertical: SPACING.m,
    paddingHorizontal: SPACING.l,
    alignItems: 'center',
  },
  secondaryBtnText: { color: COLORS.text, fontFamily: FONT_FAMILY.semiBold, fontSize: 15 },
});
