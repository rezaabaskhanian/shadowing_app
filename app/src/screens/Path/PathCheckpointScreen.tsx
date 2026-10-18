import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Mic, Play, Square, X } from 'lucide-react-native';

import { COLORS, SPACING, BORDER_RADIUS } from '../../theme/colors';
import { FONT_FAMILY, TEXT_STYLES } from '../../theme/typography';
import { SHADOWS } from '../../theme/elevation';
import { useLanguage } from '../../data/i18n';
import { AudioPlayer } from '../../components/AudioPlayer';
import { ensureMicPermission } from '../../services/micPermission';
import { evaluateRecording } from '../../api/shadowing';
import { transcribeFreeSpeech } from '../../api/freespeech';
import { absUrl } from '../../api/config';
import {
  getCheckpoint,
  submitCheckpoint,
  type ChoiceQuestion,
  type Checkpoint,
  type CheckpointResult,
  type CheckpointSkill,
  type OrderQuestion,
  type RealLifeTask,
  type SayItQuestion,
} from '../../api/path';
import { useRecordingLimit } from '../../hooks/useRecordingLimit';
import { Celebration } from '../../components/Celebration';
import { track } from '../../services/analytics';

type Step =
  | { skill: 'vocabulary'; kind: 'choice'; q: ChoiceQuestion }
  | { skill: 'grammar'; kind: 'order'; q: OrderQuestion }
  | { skill: 'listening'; kind: 'listen' }
  | { skill: 'listening'; kind: 'choice'; q: ChoiceQuestion }
  | { skill: 'speaking'; kind: 'say'; q: SayItQuestion }
  | { skill: 'real_life'; kind: 'free'; q: RealLifeTask };

type Command = 'none' | 'play_original' | 'start_record' | 'stop_record';
type RecState = 'idle' | 'recording' | 'scoring';

/** نرمال‌سازی برای مقایسه‌ی جمله‌ی چیده‌شده: بدون علامت و فاصله‌ی اضافه. */
const norm = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9' ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

/** تعداد گروه‌های کلمه‌ی کلیدی که در متن گفته‌شده آمده‌اند. */
function matchedGroups(transcript: string, groups: string[][]): number {
  const text = ` ${norm(transcript)} `;
  return groups.filter((g) => g.some((w) => text.includes(` ${norm(w)} `) || text.includes(norm(w)))).length;
}

function buildSteps(cp: Checkpoint): Step[] {
  const steps: Step[] = [];
  for (const q of cp.vocabulary || []) steps.push({ skill: 'vocabulary', kind: 'choice', q });
  for (const q of cp.grammar || []) steps.push({ skill: 'grammar', kind: 'order', q });
  // شنیداری فقط وقتی همه‌ی خط‌ها صدا دارند؛ بدون صدا آزمون شنیداری معنا ندارد.
  const dialogue = cp.listening?.dialogue || [];
  if (dialogue.length > 0 && dialogue.every((l) => !!l.audio_url)) {
    steps.push({ skill: 'listening', kind: 'listen' });
    for (const q of cp.listening?.questions || []) steps.push({ skill: 'listening', kind: 'choice', q });
  }
  for (const q of cp.speaking || []) steps.push({ skill: 'speaking', kind: 'say', q });
  if (cp.real_life) steps.push({ skill: 'real_life', kind: 'free', q: cp.real_life });
  return steps;
}

/**
 * Checkpoint آخر هفته‌ی مسیر آموزشی: واژگان، چیدن کلمه، شنیداری (دیالوگ تازه)،
 * گفتاری (با ارزیاب شدوئینگ) و یک موقعیت واقعی (رونویسی + کلمه‌های کلیدی).
 * هیچ‌وقت راه را نمی‌بندد؛ آخرش نمره‌ی هر مهارت و مرورِ پیشنهادی نشان داده می‌شود.
 */
export const PathCheckpointScreen: React.FC = () => {
  const { t } = useLanguage();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const weekId: string = route.params?.weekId;
  const weekTitle: string = route.params?.weekTitle || '';
  const weekPosition: number | undefined = route.params?.weekPosition;

  const [cp, setCp] = useState<Checkpoint | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [started, setStarted] = useState(false);
  const [index, setIndex] = useState(0);
  // نمره‌ی هر قدم (0..100) به ترتیب steps.
  const [stepScores, setStepScores] = useState<Record<number, number>>({});
  const [picked, setPicked] = useState<number | null>(null);
  const [order, setOrder] = useState<number[]>([]);
  const [recState, setRecState] = useState<RecState>('idle');
  const [lastFeedback, setLastFeedback] = useState<string | null>(null);
  const [micError, setMicError] = useState(false);
  const [listenLine, setListenLine] = useState(-1);
  const [result, setResult] = useState<CheckpointResult | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [command, setCommand] = useState<Command>('none');
  const [nonce, setNonce] = useState(0);
  const recStartedAtRef = useRef(0);
  const stopRequestedRef = useRef(false);
  const send = (c: Command) => {
    setCommand(c);
    setNonce((n) => n + 1);
  };

  useEffect(() => {
    if (!weekId) {
      setLoadError(true);
      return;
    }
    let active = true;
    getCheckpoint(weekId)
      .then((c) => active && setCp(c))
      .catch(() => active && setLoadError(true));
    return () => {
      active = false;
    };
  }, [weekId]);

  const steps = useMemo(() => (cp ? buildSteps(cp) : []), [cp]);
  const step = steps[index];
  const dialogue = cp?.listening?.dialogue || [];
  const answered = stepScores[index] !== undefined;

  const setScore = (score: number) => setStepScores((prev) => ({ ...prev, [index]: score }));

  // ---------- شنیداری: پخش پشت‌سرهم خط‌ها ----------
  const playerUri =
    step?.kind === 'listen' && listenLine >= 0 && dialogue[listenLine]?.audio_url
      ? absUrl(dialogue[listenLine].audio_url as string)
      : null;

  useEffect(() => {
    if (listenLine < 0 || step?.kind !== 'listen') return;
    const id = setTimeout(() => send('play_original'), 300);
    return () => clearTimeout(id);
  }, [listenLine, step]);

  const handlePlayback = useCallback(
    (status: string) => {
      if (status !== 'finished' || listenLine < 0) return;
      if (listenLine + 1 < dialogue.length) {
        setListenLine(listenLine + 1);
      } else {
        setListenLine(-1);
        setScore(100); // «شنیدن» خودش نمره ندارد؛ فقط باید کامل گوش داده شود.
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [listenLine, dialogue.length, index]
  );

  // ---------- ضبط (گفتاری و موقعیت واقعی) ----------
  const maxSeconds = step?.kind === 'free' ? step.q.max_seconds || 20 : 10;

  const startRecord = async () => {
    setMicError(false);
    setLastFeedback(null);
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

  useRecordingLimit(recState === 'recording', maxSeconds, () => {
    if (!stopRequestedRef.current) stopRecord();
  });

  const handleRecordingStatus = useCallback(
    (status: 'recording' | 'stopped' | 'error', filePath?: string, mimeType?: string) => {
      if (status === 'recording') {
        stopRequestedRef.current = false;
        recStartedAtRef.current = Date.now();
        setRecState('recording');
        return;
      }
      setCommand('none');
      if (status === 'error' || !filePath || !step) {
        setMicError(status === 'error');
        setRecState('idle');
        return;
      }
      setRecState('scoring');
      if (step.kind === 'say') {
        const duration = Math.max(1, (Date.now() - recStartedAtRef.current) / 1000);
        const words = step.q.target_text.trim().split(/\s+/).length;
        evaluateRecording({
          filePath,
          mimeType,
          targetText: step.q.target_text,
          duration,
          expectedDuration: Math.max(1, Math.round(words * 0.5 + 0.5)),
        })
          .then((r) => Math.round(r.overall_score))
          .catch(() => 60)
          .then((score) => {
            setScore(score);
            setLastFeedback(`${score} · ${step.q.target_text}`);
            setRecState('idle');
          });
      } else if (step.kind === 'free') {
        transcribeFreeSpeech(filePath, mimeType)
          .then((text) => {
            const groups = step.q.must_include_any || [];
            const hit = matchedGroups(text, groups);
            setScore(groups.length ? Math.round((hit / groups.length) * 100) : 100);
            setLastFeedback(text || '…');
          })
          .catch(() => {
            setScore(50);
            setLastFeedback(t('pathCheckpointTranscribeError'));
          })
          .finally(() => setRecState('idle'));
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [step, index]
  );

  // ---------- پیمایش و ارسال ----------
  const finish = async () => {
    const bySkill: Partial<Record<CheckpointSkill, number[]>> = {};
    steps.forEach((s, i) => {
      if (s.kind === 'listen') return;
      (bySkill[s.skill] ||= []).push(stepScores[i] ?? 0);
    });
    const scores: Partial<Record<CheckpointSkill, number>> = {};
    (Object.keys(bySkill) as CheckpointSkill[]).forEach((k) => {
      const arr = bySkill[k] || [];
      scores[k] = Math.round(arr.reduce((a, b) => a + b, 0) / Math.max(1, arr.length));
    });
    setSubmitting(true);
    try {
      const res = await submitCheckpoint(weekId, scores);
      setResult(res);
      track('checkpoint_done', weekId);
    } catch {
      setLoadError(true);
    } finally {
      setSubmitting(false);
    }
  };

  const next = () => {
    setPicked(null);
    setOrder([]);
    setLastFeedback(null);
    if (index + 1 < steps.length) setIndex(index + 1);
    else finish();
  };

  const chooseOption = (q: ChoiceQuestion, i: number) => {
    if (answered) return;
    setPicked(i);
    setScore(i === q.answer ? 100 : 0);
  };

  const tapWord = (wi: number, q: OrderQuestion) => {
    if (answered || order.includes(wi)) return;
    const nextOrder = [...order, wi];
    setOrder(nextOrder);
    if (nextOrder.length === q.words.length) {
      const built = nextOrder.map((k) => q.words[k]).join(' ');
      setScore(norm(built) === norm(q.answer) ? 100 : 0);
    }
  };

  // ---------- رندر ----------
  if (loadError) {
    return (
      <View style={[styles.container, styles.center, { paddingTop: insets.top }]}>
        <Text style={styles.muted}>{t('pathCheckpointError')}</Text>
        <TouchableOpacity onPress={() => navigation.goBack()} activeOpacity={0.8}>
          <Text style={styles.link}>{t('pathBack')}</Text>
        </TouchableOpacity>
      </View>
    );
  }
  if (!cp) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator color={COLORS.primary} />
      </View>
    );
  }

  const skillLabel = (s: CheckpointSkill) => t(`pathSkill_${s}`);

  return (
    <View style={[styles.container, { paddingTop: insets.top + SPACING.s, paddingBottom: insets.bottom + SPACING.l }]}>
      <AudioPlayer
        uri={playerUri}
        shouldPlay={false}
        actionCommand={command}
        actionNonce={nonce}
        onPlaybackStatusUpdate={handlePlayback}
        onRecordingStatusUpdate={handleRecordingStatus}
        recordingProfile={step?.kind === 'free' ? 'speech' : 'default'}
      />

      <View style={styles.topRow}>
        <TouchableOpacity
          style={styles.closeBtn}
          onPress={() => navigation.goBack()}
          disabled={recState !== 'idle' || submitting}
          activeOpacity={0.8}
        >
          <X size={20} color={COLORS.text} />
        </TouchableOpacity>
        {started && !result && steps.length > 0 && (
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${((index + 1) / steps.length) * 100}%` }]} />
          </View>
        )}
      </View>

      {!started && (
        <View style={styles.center}>
          <Text style={styles.bigEmoji}>🏁</Text>
          <Text style={styles.title}>
            {t('pathCheckpointTitle').replace('{n}', String(weekPosition ?? ''))}
          </Text>
          {!!weekTitle && <Text style={styles.subtitle}>{weekTitle}</Text>}
          <Text style={styles.muted}>{t('pathCheckpointIntro')}</Text>
          <TouchableOpacity style={styles.primaryBtn} onPress={() => setStarted(true)} activeOpacity={0.85}>
            <Text style={styles.primaryBtnText}>{t('pathCheckpointStart')}</Text>
          </TouchableOpacity>
        </View>
      )}

      {started && !result && step && (
        <>
          <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
            <Text style={styles.skill}>{skillLabel(step.skill)}</Text>

            {step.kind === 'choice' && (
              <>
                <Text style={styles.prompt}>{step.q.prompt_fa}</Text>
                {step.q.options.map((opt, i) => {
                  const correct = answered && i === step.q.answer;
                  const wrong = answered && i === picked && i !== step.q.answer;
                  return (
                    <TouchableOpacity
                      key={i}
                      style={[styles.option, correct && styles.optionCorrect, wrong && styles.optionWrong]}
                      onPress={() => chooseOption(step.q, i)}
                      activeOpacity={0.85}
                    >
                      <Text style={styles.optionText}>{opt}</Text>
                    </TouchableOpacity>
                  );
                })}
              </>
            )}

            {step.kind === 'order' && (
              <>
                <Text style={styles.prompt}>{t('pathCheckpointOrder')}</Text>
                <View style={[styles.built, answered && (stepScores[index] ? styles.optionCorrect : styles.optionWrong)]}>
                  <Text style={styles.builtText}>{order.map((k) => step.q.words[k]).join(' ') || '…'}</Text>
                </View>
                {answered && !stepScores[index] && <Text style={styles.answer}>{step.q.answer}</Text>}
                <View style={styles.words}>
                  {step.q.words.map((w, wi) => (
                    <TouchableOpacity
                      key={wi}
                      style={[styles.word, order.includes(wi) && styles.wordUsed]}
                      onPress={() => tapWord(wi, step.q)}
                      disabled={order.includes(wi) || answered}
                      activeOpacity={0.85}
                    >
                      <Text style={styles.wordText}>{w}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
                {!answered && order.length > 0 && (
                  <TouchableOpacity onPress={() => setOrder([])} activeOpacity={0.8}>
                    <Text style={styles.link}>{t('pathCheckpointReset')}</Text>
                  </TouchableOpacity>
                )}
              </>
            )}

            {step.kind === 'listen' && (
              <View style={styles.center}>
                <Text style={styles.prompt}>{t('pathCheckpointListen')}</Text>
                <TouchableOpacity
                  style={styles.playBtn}
                  onPress={() => setListenLine(0)}
                  disabled={listenLine >= 0}
                  activeOpacity={0.85}
                >
                  {listenLine >= 0 ? <ActivityIndicator color={COLORS.white} /> : <Play size={30} color={COLORS.white} />}
                </TouchableOpacity>
                {answered && <Text style={styles.muted}>{t('pathCheckpointListenAgain')}</Text>}
              </View>
            )}

            {(step.kind === 'say' || step.kind === 'free') && (
              <>
                <Text style={styles.prompt}>{step.q.prompt_fa}</Text>
                {!!lastFeedback && <Text style={styles.feedback}>{lastFeedback}</Text>}
                {micError && <Text style={styles.error}>{t('placementMicDenied')}</Text>}
              </>
            )}
          </ScrollView>

          <View style={styles.bottom}>
            {(step.kind === 'say' || step.kind === 'free') && (
              <View style={styles.micArea}>
                <TouchableOpacity
                  style={[styles.micBtn, recState === 'recording' && styles.micBtnActive]}
                  onPress={recState === 'recording' ? stopRecord : startRecord}
                  disabled={recState === 'scoring'}
                  activeOpacity={0.85}
                >
                  {recState === 'scoring' ? (
                    <ActivityIndicator color={COLORS.white} />
                  ) : recState === 'recording' ? (
                    <Square size={26} color={COLORS.white} fill={COLORS.white} />
                  ) : (
                    <Mic size={30} color={COLORS.white} />
                  )}
                </TouchableOpacity>
              </View>
            )}
            <TouchableOpacity
              style={[styles.primaryBtn, (!answered || recState !== 'idle' || submitting) && styles.disabled]}
              onPress={next}
              disabled={!answered || recState !== 'idle' || submitting}
              activeOpacity={0.85}
            >
              {submitting ? (
                <ActivityIndicator color={COLORS.white} />
              ) : (
                <Text style={styles.primaryBtnText}>
                  {t(index + 1 < steps.length ? 'courseNext' : 'pathCheckpointSubmit')}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </>
      )}

      {result && (
        <ScrollView contentContainerStyle={styles.resultBody} showsVerticalScrollIndicator={false}>
          <Celebration kind={result.total >= 80 ? 'courseDone' : 'correct'} size={140} />
          <Text style={styles.total}>{result.total}</Text>
          <Text style={styles.title}>{result.label_fa}</Text>
          <View style={styles.skillList}>
            {(Object.keys(result.scores) as CheckpointSkill[]).map((k) => (
              <View key={k} style={styles.skillRow}>
                <Text style={styles.skillName}>{skillLabel(k)}</Text>
                <View style={styles.skillTrack}>
                  <View
                    style={[
                      styles.skillFill,
                      { width: `${result.scores[k] ?? 0}%` },
                      (result.scores[k] ?? 0) < 60 && { backgroundColor: COLORS.warning },
                    ]}
                  />
                </View>
                <Text style={styles.skillValue}>{result.scores[k]}</Text>
              </View>
            ))}
          </View>
          {result.weak_skills.length > 0 && (
            <View style={styles.reviewBox}>
              <Text style={styles.reviewTitle}>{t('pathCheckpointReviewTitle')}</Text>
              {result.weak_skills.map((k) => (
                <Text key={k} style={styles.reviewItem}>
                  • {t(`pathReview_${k}`)}
                </Text>
              ))}
            </View>
          )}
          <TouchableOpacity style={styles.primaryBtn} onPress={() => navigation.goBack()} activeOpacity={0.85}>
            <Text style={styles.primaryBtnText}>{t('pathBack')}</Text>
          </TouchableOpacity>
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background, paddingHorizontal: SPACING.m },
  topRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.m },
  closeBtn: {
    width: 40,
    height: 40,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.level1,
  },
  progressTrack: { flex: 1, height: 8, borderRadius: BORDER_RADIUS.full, backgroundColor: COLORS.surfaceHigh, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: COLORS.primary, borderRadius: BORDER_RADIUS.full },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: SPACING.m },
  bigEmoji: { fontSize: 56 },
  title: { ...TEXT_STYLES.headlineSm, color: COLORS.text, textAlign: 'center' },
  subtitle: { ...TEXT_STYLES.bodyLg, color: COLORS.textSecondary, textAlign: 'center' },
  muted: { ...TEXT_STYLES.bodyMd, color: COLORS.muted, textAlign: 'center' },
  link: { ...TEXT_STYLES.bodyMd, color: COLORS.primary, fontFamily: FONT_FAMILY.semiBold, textAlign: 'center' },
  error: { ...TEXT_STYLES.bodyMd, color: COLORS.error, textAlign: 'center' },
  body: { paddingVertical: SPACING.l, gap: SPACING.m },
  skill: { ...TEXT_STYLES.labelMd, color: COLORS.primary, fontFamily: FONT_FAMILY.semiBold, textAlign: 'center' },
  prompt: { ...TEXT_STYLES.headlineSm, color: COLORS.text, textAlign: 'center' },
  option: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.l,
    borderWidth: 2,
    borderColor: COLORS.borderLight,
    paddingVertical: SPACING.m,
    paddingHorizontal: SPACING.m,
    ...SHADOWS.level1,
  },
  optionCorrect: { borderColor: COLORS.success, backgroundColor: COLORS.successLight },
  optionWrong: { borderColor: COLORS.error, backgroundColor: COLORS.errorLight },
  optionText: { ...TEXT_STYLES.bodyLg, color: COLORS.text, textAlign: 'center' },
  built: {
    minHeight: 56,
    borderRadius: BORDER_RADIUS.l,
    borderWidth: 2,
    borderColor: COLORS.borderLight,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.s,
  },
  builtText: { ...TEXT_STYLES.bodyLg, color: COLORS.text, writingDirection: 'ltr' },
  answer: { ...TEXT_STYLES.bodyMd, color: COLORS.success, textAlign: 'center', writingDirection: 'ltr' },
  words: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: SPACING.s },
  word: {
    backgroundColor: COLORS.primaryLight,
    borderRadius: BORDER_RADIUS.full,
    paddingVertical: SPACING.s,
    paddingHorizontal: SPACING.m,
  },
  wordUsed: { opacity: 0.3 },
  wordText: { ...TEXT_STYLES.bodyLg, color: COLORS.primary },
  playBtn: {
    width: 84,
    height: 84,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.level1,
  },
  feedback: { ...TEXT_STYLES.bodyLg, color: COLORS.textSecondary, textAlign: 'center' },
  bottom: { gap: SPACING.m, paddingTop: SPACING.s },
  micArea: { alignItems: 'center' },
  micBtn: {
    width: 76,
    height: 76,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.level1,
  },
  micBtnActive: { backgroundColor: COLORS.error },
  primaryBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.full,
    paddingVertical: SPACING.m,
    paddingHorizontal: SPACING.l,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'stretch',
  },
  disabled: { opacity: 0.4 },
  primaryBtnText: { ...TEXT_STYLES.bodyMd, fontFamily: FONT_FAMILY.semiBold, color: COLORS.white },
  resultBody: { alignItems: 'center', gap: SPACING.m, paddingVertical: SPACING.l },
  total: { fontFamily: FONT_FAMILY.bold, fontSize: 48, color: COLORS.primary },
  skillList: { alignSelf: 'stretch', gap: SPACING.s },
  skillRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.s },
  skillName: { ...TEXT_STYLES.bodyMd, color: COLORS.text, width: 110 },
  skillTrack: { flex: 1, height: 8, borderRadius: BORDER_RADIUS.full, backgroundColor: COLORS.surfaceHigh, overflow: 'hidden' },
  skillFill: { height: '100%', backgroundColor: COLORS.success, borderRadius: BORDER_RADIUS.full },
  skillValue: { ...TEXT_STYLES.labelMd, color: COLORS.textSecondary, width: 32, textAlign: 'center' },
  reviewBox: { alignSelf: 'stretch', backgroundColor: COLORS.warningLight, borderRadius: BORDER_RADIUS.l, padding: SPACING.m, gap: SPACING.xs },
  reviewTitle: { ...TEXT_STYLES.bodyMd, fontFamily: FONT_FAMILY.semiBold, color: COLORS.text },
  reviewItem: { ...TEXT_STYLES.bodyMd, color: COLORS.textSecondary },
});
