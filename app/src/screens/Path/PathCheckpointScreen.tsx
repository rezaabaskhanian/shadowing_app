import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, Check, Clock, Lock, Mic, Play, Sparkles, Square, Tag, Target, X } from 'lucide-react-native';

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
import { GradientFill } from '../../components/GradientFill';

const toFa = (v: number | string) => String(v).replace(/\d/g, (d) => '۰۱۲۳۴۵۶۷۸۹'[Number(d)]);
const ORDINAL_FA = ['', 'اول', 'دوم', 'سوم', 'چهارم', 'پنجم', 'ششم', 'هفتم', 'هشتم', 'نهم', 'دهم'];
const LETTERS = ['A', 'B', 'C', 'D', 'E'];

/** «متن اصلی (توضیح)» را به تیتر و زیرنویس جدا می‌کند. */
const splitPrompt = (p: string) => {
  const m = p.match(/^(.*?)\s*\((.+)\)\s*$/);
  return m ? { main: m[1], note: m[2] } : { main: p, note: '' };
};

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
  const { t, language } = useLanguage();
  const rtl = language === 'fa';
  const num = (v: number | string) => (rtl ? toFa(v) : String(v));
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

      <View style={[styles.topRow, rtl && styles.rowReverse]}>
        <TouchableOpacity
          style={styles.closeBtn}
          onPress={() => navigation.goBack()}
          disabled={recState !== 'idle' || submitting}
          activeOpacity={0.8}
        >
          <X size={20} color={COLORS.text} />
        </TouchableOpacity>
        {started && !result && steps.length > 0 && (
          <>
            <View style={[styles.progressTrack, rtl && styles.rowReverse]}>
              <View style={[styles.progressFill, { width: `${((index + 1) / steps.length) * 100}%` }]} />
            </View>
            <View style={styles.countPill}>
              <Text style={styles.countPillText}>
                {num(index + 1)} / {num(steps.length)}
              </Text>
            </View>
          </>
        )}
        {!started && (
          <>
            <View style={styles.flex} />
            {!!weekPosition && (
              <View style={[styles.stationChip, rtl && styles.rowReverse]}>
                <View style={styles.stationDot} />
                <Text style={styles.stationText}>{t('pathCheckpointStation').replace('{n}', num(weekPosition))}</Text>
              </View>
            )}
          </>
        )}
      </View>

      {!started && (
        <>
          <ScrollView contentContainerStyle={styles.introBody} showsVerticalScrollIndicator={false}>
            <View style={styles.flagWrap}>
              <View style={styles.flagBox}>
                <Text style={styles.bigEmoji}>🏁</Text>
              </View>
              <Sparkles size={22} color="#F5B73B" fill="#F5B73B" style={styles.sparkTop} />
              <Sparkles size={12} color="#F5B73B" fill="#F5B73B" style={styles.sparkBottom} />
            </View>
            <Text style={styles.introTitle}>
              {t('pathCheckpointHeadline').replace(
                '{n}',
                rtl ? ORDINAL_FA[weekPosition ?? 0] || num(weekPosition ?? '') : String(weekPosition ?? '')
              )}
            </Text>
            {!!weekTitle && (
              <View style={[styles.weekTag, rtl && styles.rowReverse]}>
                <Tag size={13} color={COLORS.primary} />
                <Text style={styles.weekTagText}>{weekTitle}</Text>
              </View>
            )}
            <Text style={styles.introDesc}>{t('pathCheckpointIntro2')}</Text>
            <View style={styles.infoCard}>
              {[
                {
                  Icon: Clock,
                  color: COLORS.primary,
                  bg: 'rgba(232,87,47,0.10)',
                  label: t('pathCheckpointTime'),
                  value: t('pathCheckpointTimeValue').replace('{n}', num(Math.max(2, Math.round(steps.length * 0.6)))),
                },
                {
                  Icon: Target,
                  color: '#E9A23B',
                  bg: 'rgba(233,162,59,0.14)',
                  label: t('pathCheckpointCount'),
                  value: t('pathCheckpointCountValue').replace('{n}', num(steps.length)),
                },
                {
                  Icon: Lock,
                  color: COLORS.success,
                  bg: 'rgba(46,158,107,0.12)',
                  label: t('pathCheckpointRule'),
                  value: t('pathCheckpointRuleValue'),
                  good: true,
                },
              ].map((r, i) => (
                <View key={r.label} style={[styles.infoRow, rtl && styles.rowReverse, i > 0 && styles.infoRowBorder]}>
                  <View style={[styles.infoIcon, { backgroundColor: r.bg }]}>
                    <r.Icon size={16} color={r.color} />
                  </View>
                  <Text style={[styles.infoLabel, rtl && styles.textRight]}>{r.label}</Text>
                  <View style={[styles.infoValue, r.good && styles.infoValueGood]}>
                    <Text style={[styles.infoValueText, r.good && styles.infoValueTextGood]}>{r.value}</Text>
                  </View>
                </View>
              ))}
            </View>
          </ScrollView>
          <TouchableOpacity style={styles.gradBtn} onPress={() => setStarted(true)} activeOpacity={0.85}>
            <GradientFill from="#F07A4A" to="#E8572F" horizontal />
            <View style={[styles.btnInner, rtl && styles.rowReverse]}>
              <Text style={styles.primaryBtnText}>{t('pathCheckpointStartBtn')}</Text>
              {rtl && <ArrowLeft size={18} color={COLORS.white} />}
            </View>
          </TouchableOpacity>
          <Text style={styles.footnote}>{t('pathCheckpointFootnote')}</Text>
        </>
      )}

      {started && !result && step && (
        <>
          <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
            <View style={[styles.skillChip, rtl && styles.rowReverse]}>
              <View style={styles.skillDot} />
              <Text style={styles.skill}>{skillLabel(step.skill)}</Text>
            </View>

            {step.kind === 'choice' && (
              <>
                <Text style={styles.prompt}>{splitPrompt(step.q.prompt_fa).main}</Text>
                <Text style={styles.promptSub}>
                  {[splitPrompt(step.q.prompt_fa).note, t('pathCheckpointChoiceSub')].filter(Boolean).join('، ')}
                </Text>
                {step.q.options.map((opt, i) => {
                  // جواب درست همیشه نارنجی و تیک‌دار؛ اگر کاربر غلط زد، انتخابش قرمز می‌شود.
                  const correct = answered && i === step.q.answer;
                  const wrong = answered && i === picked && i !== step.q.answer;
                  return (
                    <TouchableOpacity
                      key={i}
                      style={[styles.option, rtl && styles.rowReverse, correct && styles.optionCorrect, wrong && styles.optionWrong]}
                      onPress={() => chooseOption(step.q, i)}
                      activeOpacity={0.85}
                    >
                      <View style={[styles.letterBox, correct && styles.letterBoxOn, wrong && styles.letterBoxWrong]}>
                        <Text style={[styles.letterText, (correct || wrong) && styles.letterTextOn]}>{LETTERS[i]}</Text>
                      </View>
                      <Text style={[styles.optionText, rtl && styles.textRight]}>{opt}</Text>
                      {correct ? (
                        <View style={styles.radioOn}>
                          <Check size={13} color={COLORS.white} strokeWidth={3} />
                        </View>
                      ) : wrong ? (
                        <View style={[styles.radioOn, styles.radioWrong]}>
                          <X size={13} color={COLORS.white} strokeWidth={3} />
                        </View>
                      ) : (
                        <View style={styles.radio} />
                      )}
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
              style={[styles.gradBtn, (!answered || recState !== 'idle' || submitting) && styles.disabled]}
              onPress={next}
              disabled={!answered || recState !== 'idle' || submitting}
              activeOpacity={0.85}
            >
              <GradientFill from="#F07A4A" to="#E8572F" horizontal />
              {submitting ? (
                <ActivityIndicator color={COLORS.white} />
              ) : (
                <View style={[styles.btnInner, rtl && styles.rowReverse]}>
                  <Text style={styles.primaryBtnText}>
                    {t(index + 1 < steps.length ? 'courseNext' : 'pathCheckpointSubmit')}
                  </Text>
                  {rtl && <ArrowLeft size={18} color={COLORS.white} />}
                </View>
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
  rowReverse: { flexDirection: 'row-reverse' },
  textRight: { textAlign: 'right' },
  flex: { flex: 1 },
  container: { flex: 1, backgroundColor: '#FAF8F4', paddingHorizontal: SPACING.m },
  topRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.m },
  countPill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999, backgroundColor: '#EEEBE5' },
  countPillText: { fontFamily: FONT_FAMILY.bold, fontSize: 12, color: COLORS.textSecondary },
  stationChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: '#FFF6E2',
    borderWidth: 1,
    borderColor: '#F3E3BC',
  },
  stationDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#E9A23B' },
  stationText: { fontFamily: FONT_FAMILY.bold, fontSize: 11, color: '#9A6A12' },
  introBody: { alignItems: 'center', paddingTop: SPACING.xl, paddingBottom: SPACING.l, gap: 14 },
  flagWrap: { width: 130, height: 130, alignItems: 'center', justifyContent: 'center', marginBottom: 6 },
  flagBox: {
    width: 116,
    height: 116,
    borderRadius: 28,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 8,
    shadowColor: '#E9A23B',
    shadowOpacity: 0.25,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
  },
  sparkTop: { position: 'absolute', top: -4, right: -6 },
  sparkBottom: { position: 'absolute', bottom: 18, left: -4 },
  introTitle: { fontFamily: FONT_FAMILY.bold, fontSize: 22, color: COLORS.text, textAlign: 'center' },
  weekTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: '#FDF1EC',
    borderWidth: 1,
    borderColor: '#F6D3C6',
  },
  weekTagText: { fontFamily: FONT_FAMILY.bold, fontSize: 12, color: COLORS.primary },
  introDesc: { fontFamily: FONT_FAMILY.regular, fontSize: 13, lineHeight: 23, color: COLORS.textSecondary, textAlign: 'center' },
  infoCard: {
    alignSelf: 'stretch',
    backgroundColor: COLORS.white,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#EEEAE3',
    paddingHorizontal: 16,
    marginTop: 6,
  },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 14 },
  infoRowBorder: { borderTopWidth: 1, borderTopColor: '#F1EDE6' },
  infoIcon: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  infoLabel: { flex: 1, fontFamily: FONT_FAMILY.semiBold, fontSize: 13, color: COLORS.text },
  infoValue: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, backgroundColor: '#F1EEE8' },
  infoValueGood: { backgroundColor: 'rgba(46,158,107,0.12)' },
  infoValueText: { fontFamily: FONT_FAMILY.bold, fontSize: 11, color: COLORS.text },
  infoValueTextGood: { color: COLORS.success },
  gradBtn: {
    height: 54,
    borderRadius: 18,
    overflow: 'hidden',
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'stretch',
    elevation: 6,
    shadowColor: COLORS.primary,
    shadowOpacity: 0.35,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
  },
  btnInner: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  footnote: { fontFamily: FONT_FAMILY.regular, fontSize: 11, color: COLORS.muted, textAlign: 'center', marginTop: 8 },
  skillChip: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: '#FDEDE8',
  },
  skillDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: COLORS.primary },
  promptSub: { fontFamily: FONT_FAMILY.regular, fontSize: 13, color: COLORS.textSecondary, textAlign: 'center', marginTop: -6, marginBottom: 6 },
  letterBox: { width: 34, height: 34, borderRadius: 10, backgroundColor: '#F1EEE8', alignItems: 'center', justifyContent: 'center' },
  letterBoxOn: { backgroundColor: COLORS.primary },
  letterBoxWrong: { backgroundColor: COLORS.error },
  letterText: { fontFamily: FONT_FAMILY.bold, fontSize: 13, color: COLORS.textSecondary },
  letterTextOn: { color: COLORS.white },
  radio: { width: 22, height: 22, borderRadius: 11, borderWidth: 1.5, borderColor: '#D3CEC5' },
  radioOn: { width: 24, height: 24, borderRadius: 12, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center' },
  radioWrong: { backgroundColor: COLORS.error },
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
  skill: { fontFamily: FONT_FAMILY.bold, fontSize: 11, color: COLORS.primary },
  prompt: { fontFamily: FONT_FAMILY.bold, fontSize: 24, lineHeight: 36, color: COLORS.text, textAlign: 'center' },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: COLORS.white,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: '#EEEAE3',
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  optionCorrect: { borderColor: COLORS.primary, backgroundColor: '#FFF4EF' },
  optionWrong: { borderColor: COLORS.error, backgroundColor: COLORS.errorLight },
  optionText: { flex: 1, fontFamily: FONT_FAMILY.bold, fontSize: 16, color: COLORS.text, writingDirection: 'ltr' },
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
