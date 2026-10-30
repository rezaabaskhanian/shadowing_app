import React, { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { ArrowLeft, Check, ChevronLeft, ChevronRight, RotateCcw, Sparkles, Star, X } from 'lucide-react-native';

import { COLORS } from '../../theme/colors';
import { FONT_FAMILY } from '../../theme/typography';
import { useLanguage } from '../../data/i18n';
import { GradientFill } from '../../components/GradientFill';
import { fetchSceneQuiz, submitSceneQuiz, type QuizAnswer, type QuizQuestion, type QuizResult } from '../../api/quiz';

const toFa = (v: number | string) => String(v).replace(/\d/g, (d) => '۰۱۲۳۴۵۶۷۸۹'[Number(d)]);

// یک انتخاب برای هر سوال: متن گزینه‌ای که کاربر لمس کرده.
type AnswerMap = Record<string, string>;

export const QuizScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { t, language } = useLanguage();
  const rtl = language === 'fa';
  const num = (v: number | string) => (rtl ? toFa(v) : String(v));
  const row = rtl && styles.rowReverse;
  const { scenarioId } = route.params || {};

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  // با هر بار «تلاش دوباره» یک واحد زیاد می‌شود تا افکتِ دریافتِ کوئیز دوباره اجرا شود.
  const [reloadKey, setReloadKey] = useState(0);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<AnswerMap>({});
  const [pickedThisStep, setPickedThisStep] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<QuizResult | null>(null);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setLoadError(false);
    fetchSceneQuiz(scenarioId)
      .then((q) => {
        if (alive) setQuestions(q);
      })
      .catch(() => {
        if (alive) setLoadError(true);
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [scenarioId, reloadKey]);

  const current = questions[step];
  const isLast = step === questions.length - 1;

  // انتخاب تا زدنِ «ادامه» قابل تغییر است؛ درست/غلطِ هر سوال را فقط سرور می‌داند
  // (گزینه‌ها تصادفی‌اند)، پس اینجا فقط «پاسخ ثبت شد» نشان می‌دهیم.
  const choose = (option: string) => {
    if (submitting) return;
    setPickedThisStep(option);
  };

  const goNext = async () => {
    if (!pickedThisStep || submitting) return;
    const nextAnswers = { ...answers, [current.dialogue_id]: pickedThisStep };
    setAnswers(nextAnswers);
    if (!isLast) {
      setPickedThisStep(null);
      setStep((s) => s + 1);
      return;
    }
    setSubmitting(true);
    const payload: QuizAnswer[] = Object.entries(nextAnswers).map(([dialogue_id, selected_text]) => ({
      dialogue_id,
      selected_text,
    }));
    try {
      const r = await submitSceneQuiz(scenarioId, payload);
      setResult(r);
    } catch {
      setResult({ correct: 0, total: payload.length });
    } finally {
      setSubmitting(false);
    }
  };

  const restart = () => {
    setResult(null);
    setAnswers({});
    setPickedThisStep(null);
    setStep(0);
    setReloadKey((k) => k + 1);
  };

  const BackIcon = rtl ? ChevronRight : ChevronLeft;

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={COLORS.primary} size="large" />
      </View>
    );
  }

  if (loadError || questions.length === 0) {
    return (
      <View style={styles.screen}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <ArrowLeft color={COLORS.text} size={22} />
        </TouchableOpacity>
        <View style={styles.center}>
          {loadError ? (
            <>
              <Text style={styles.emptyText}>{t('quizLoadError')}</Text>
              <TouchableOpacity
                style={styles.doneBtn}
                activeOpacity={0.85}
                onPress={() => setReloadKey((k) => k + 1)}
              >
                <Text style={styles.doneBtnText}>{t('quizRetry')}</Text>
              </TouchableOpacity>
            </>
          ) : (
            <Text style={styles.emptyText}>{t('quizUnavailable')}</Text>
          )}
        </View>
      </View>
    );
  }

  if (result) {
    const pct = result.total > 0 ? Math.round((result.correct / result.total) * 100) : 0;
    const titleKey = pct >= 80 ? 'quizResultHighTitle' : pct >= 50 ? 'quizResultMidTitle' : 'quizResultLowTitle';
    const good = result.correct > 0;
    return (
      <View style={styles.screen}>
        <View style={styles.resultWrap}>
          <View style={styles.resultBadge}>
            <GradientFill from="#F07A4A" to="#E8572F" />
            <Sparkles color={COLORS.white} size={34} />
          </View>
          <Text style={styles.resultScore}>
            {result.correct}/{result.total}
          </Text>
          <View style={styles.pctChip}>
            <Text style={styles.pctChipText}>{t('quizSuccessPct').replace('{n}', num(pct))}</Text>
          </View>
          <Text style={styles.resultTitle}>{t(titleKey)}</Text>
          <Text style={styles.resultSub}>{t('quizResultSub')}</Text>

          <View style={[styles.statsRow, row]}>
            <View style={[styles.statCard, row]}>
              <View style={[styles.statIcon, good ? styles.statIconGood : styles.statIconBad]}>
                {good ? <Check size={16} color={COLORS.tertiary} /> : <X size={16} color="#E53935" />}
              </View>
              <View style={rtl ? styles.alignEnd : null}>
                <Text style={styles.statLabel}>{t('quizCorrectLabel')}</Text>
                <Text style={styles.statValue}>{t('quizQuestionsN').replace('{n}', num(result.correct))}</Text>
              </View>
            </View>
            <View style={[styles.statCard, row]}>
              <View style={[styles.statIcon, styles.statIconStar]}>
                <Star size={16} color="#F5A623" fill="#F5A623" />
              </View>
              <View style={rtl ? styles.alignEnd : null}>
                <Text style={styles.statLabel}>{t('quizTotalLabel')}</Text>
                <Text style={styles.statValue}>{t('quizQuestionsN').replace('{n}', num(result.total))}</Text>
              </View>
            </View>
          </View>

          <TouchableOpacity style={styles.primaryBtn} activeOpacity={0.85} onPress={() => navigation.goBack()}>
            <GradientFill from="#F07A4A" to="#E8572F" horizontal />
            <Text style={styles.primaryBtnText}>{t('quizDone')}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.retryLink, row]} onPress={restart}>
            <RotateCcw size={14} color={COLORS.textSecondary} />
            <Text style={styles.retryLinkText}>{t('quizRetryLesson')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const progress = (step + (pickedThisStep ? 1 : 0)) / questions.length;

  return (
    <View style={styles.screen}>
      <View style={[styles.topRow, !rtl && styles.rowReverse]}>
        <View style={styles.stepPill}>
          <Text style={styles.stepPillText}>
            {num(step + 1)} / {num(questions.length)}
          </Text>
        </View>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <BackIcon color={COLORS.text} size={20} />
        </TouchableOpacity>
      </View>

      <View style={[styles.progressTrack, rtl && styles.progressTrackRtl]}>
        <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={[styles.kicker, rtl && styles.textRight]}>{t('quizPromptKicker')}</Text>
        <Text style={[styles.prompt, rtl && styles.textRight]}>{current.prompt}</Text>

        {current.options.map((opt) => {
          const isPicked = pickedThisStep === opt;
          return (
            <TouchableOpacity
              key={opt}
              activeOpacity={0.85}
              disabled={submitting}
              onPress={() => choose(opt)}
              style={[styles.optionCard, isPicked && styles.optionCardPicked]}
            >
              {isPicked ? (
                <View style={styles.optionIcon}>
                  <Check color={COLORS.white} size={14} />
                </View>
              ) : (
                <View style={styles.optionRadio} />
              )}
              <Text style={[styles.optionText, isPicked && styles.optionTextPicked]}>{opt}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {pickedThisStep ? (
        <View style={styles.footerCard}>
          <View style={[styles.footerStatus, row]}>
            <Text style={styles.footerSaved}>{t('quizAnswerSaved')}</Text>
            <View style={[styles.footerReady, row]}>
              <View style={styles.footerDot} />
              <Text style={styles.footerReadyText}>{t('quizReadyNext')}</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.primaryBtn} activeOpacity={0.85} onPress={goNext} disabled={submitting}>
            <GradientFill from="#F07A4A" to="#E8572F" horizontal />
            {submitting ? (
              <ActivityIndicator color={COLORS.white} />
            ) : (
              <View style={[styles.btnInner, row]}>
                <Text style={styles.primaryBtnText}>{t('quizContinue')}</Text>
                {rtl ? <ArrowLeft size={18} color={COLORS.white} /> : null}
              </View>
            )}
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.footerPlain}>
          <View style={[styles.disabledBtn, row]}>
            <Text style={styles.disabledBtnText}>{t('quizCheckAnswer')}</Text>
            <Check size={16} color="#A9A6A0" />
          </View>
        </View>
      )}
    </View>
  );
};

const CARD_BG = '#F3F1EC';

const styles = StyleSheet.create({
  rowReverse: { flexDirection: 'row-reverse' },
  textRight: { textAlign: 'right' },
  alignEnd: { alignItems: 'flex-end' },
  screen: {
    flex: 1,
    backgroundColor: '#FAF8F4',
    paddingTop: 48,
    paddingHorizontal: 20,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 18,
  },
  stepPill: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: '#EEEBE5',
  },
  stepPillText: { color: COLORS.textSecondary, fontFamily: FONT_FAMILY.semiBold, fontSize: 13 },
  backButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#EEEBE5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: '#ECE9E3',
    overflow: 'hidden',
    marginBottom: 28,
    flexDirection: 'row',
  },
  // در فارسی نوار از راست پر می‌شود.
  progressTrackRtl: { flexDirection: 'row-reverse' },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: 3,
  },
  content: {
    paddingBottom: 24,
  },
  kicker: {
    color: COLORS.muted,
    fontFamily: FONT_FAMILY.semiBold,
    fontSize: 12,
    marginBottom: 8,
  },
  prompt: {
    color: COLORS.text,
    fontFamily: FONT_FAMILY.bold,
    fontSize: 24,
    marginBottom: 24,
    lineHeight: 34,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: CARD_BG,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: CARD_BG,
    paddingHorizontal: 18,
    paddingVertical: 18,
    marginBottom: 14,
  },
  optionCardPicked: {
    borderColor: COLORS.primary,
    backgroundColor: '#FDF0EC',
  },
  optionText: {
    flex: 1,
    color: COLORS.text,
    fontFamily: FONT_FAMILY.semiBold,
    fontSize: 15,
    textAlign: 'right',
    writingDirection: 'ltr',
  },
  optionTextPicked: {
    color: COLORS.primary,
    fontFamily: FONT_FAMILY.bold,
  },
  optionRadio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: '#CFCBC3',
  },
  optionIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footerPlain: {
    paddingTop: 14,
    paddingBottom: 28,
    borderTopWidth: 1,
    borderTopColor: '#EEEBE5',
  },
  disabledBtn: {
    height: 54,
    borderRadius: 18,
    backgroundColor: '#E9E7E3',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  disabledBtnText: { color: '#A9A6A0', fontFamily: FONT_FAMILY.bold, fontSize: 15 },
  footerCard: {
    marginHorizontal: -20,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 28,
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    elevation: 10,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: -3 },
  },
  footerStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  footerSaved: { color: COLORS.textSecondary, fontFamily: FONT_FAMILY.medium, fontSize: 12 },
  footerReady: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  footerDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: COLORS.primary },
  footerReadyText: { color: COLORS.primary, fontFamily: FONT_FAMILY.semiBold, fontSize: 12 },
  primaryBtn: {
    alignSelf: 'stretch',
    height: 54,
    borderRadius: 18,
    overflow: 'hidden',
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
    shadowColor: COLORS.primary,
    shadowOpacity: 0.35,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
  },
  btnInner: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  primaryBtnText: { color: COLORS.white, fontFamily: FONT_FAMILY.bold, fontSize: 16 },
  emptyText: {
    color: COLORS.muted,
    fontFamily: FONT_FAMILY.regular,
    fontSize: 15,
    textAlign: 'center',
    paddingHorizontal: 30,
  },
  resultWrap: {
    alignItems: 'center',
    paddingTop: 24,
  },
  resultBadge: {
    width: 88,
    height: 88,
    borderRadius: 44,
    overflow: 'hidden',
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  resultScore: {
    color: COLORS.text,
    fontFamily: FONT_FAMILY.bold,
    fontSize: 44,
  },
  pctChip: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: COLORS.primaryLight,
    marginTop: 2,
    marginBottom: 16,
  },
  pctChipText: { color: COLORS.primary, fontFamily: FONT_FAMILY.bold, fontSize: 12 },
  resultTitle: {
    color: COLORS.text,
    fontFamily: FONT_FAMILY.bold,
    fontSize: 17,
    textAlign: 'center',
  },
  resultSub: {
    color: COLORS.muted,
    fontFamily: FONT_FAMILY.regular,
    fontSize: 12,
    textAlign: 'center',
    marginTop: 6,
    marginBottom: 22,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    alignSelf: 'stretch',
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.white,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#EEEBE5',
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  statIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statIconGood: { backgroundColor: COLORS.tertiaryLight },
  statIconBad: { backgroundColor: 'rgba(229, 57, 53, 0.10)' },
  statIconStar: { backgroundColor: 'rgba(245, 166, 35, 0.14)' },
  statLabel: { color: COLORS.muted, fontFamily: FONT_FAMILY.regular, fontSize: 11 },
  statValue: { color: COLORS.text, fontFamily: FONT_FAMILY.bold, fontSize: 13, marginTop: 2 },
  retryLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 18,
  },
  retryLinkText: { color: COLORS.textSecondary, fontFamily: FONT_FAMILY.medium, fontSize: 12 },
  doneBtn: {
    marginTop: 32,
    backgroundColor: COLORS.primary,
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 40,
  },
  doneBtnText: {
    color: COLORS.white,
    fontFamily: FONT_FAMILY.semiBold,
    fontSize: 15,
  },
});
