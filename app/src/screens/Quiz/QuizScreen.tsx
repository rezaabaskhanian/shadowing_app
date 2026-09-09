import React, { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { ArrowLeft, Check, Sparkles } from 'lucide-react-native';

import { COLORS } from '../../theme/colors';
import { FONT_FAMILY } from '../../theme/typography';
import { useLanguage } from '../../data/i18n';
import { fetchSceneQuiz, submitSceneQuiz, type QuizAnswer, type QuizQuestion, type QuizResult } from '../../api/quiz';

// یک انتخاب برای هر سوال: متن گزینه‌ای که کاربر لمس کرده.
type AnswerMap = Record<string, string>;

export const QuizScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { t } = useLanguage();
  const { scenarioId } = route.params || {};

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<AnswerMap>({});
  const [pickedThisStep, setPickedThisStep] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<QuizResult | null>(null);

  useEffect(() => {
    let alive = true;
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
  }, [scenarioId]);

  const current = questions[step];
  const isLast = step === questions.length - 1;

  const choose = (option: string) => {
    if (pickedThisStep) return;
    setPickedThisStep(option);
    const nextAnswers = { ...answers, [current.dialogue_id]: option };
    setAnswers(nextAnswers);

    setTimeout(async () => {
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
        setResult({ correct: 0, total: payload.length, xp_awarded: 0 });
      } finally {
        setSubmitting(false);
      }
    }, 550);
  };

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
          <Text style={styles.emptyText}>{t('quizUnavailable')}</Text>
        </View>
      </View>
    );
  }

  if (result) {
    const pct = result.total > 0 ? Math.round((result.correct / result.total) * 100) : 0;
    return (
      <View style={styles.screen}>
        <View style={styles.center}>
          <View style={styles.resultBadge}>
            <Sparkles color={COLORS.white} size={32} />
          </View>
          <Text style={styles.resultScore}>{result.correct}/{result.total}</Text>
          <Text style={styles.resultPct}>{pct}%</Text>
          {result.xp_awarded > 0 && (
            <Text style={styles.resultXP}>+{result.xp_awarded} XP</Text>
          )}
          <TouchableOpacity
            style={styles.doneBtn}
            activeOpacity={0.85}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.doneBtnText}>{t('quizDone')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <View style={styles.topRow}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <ArrowLeft color={COLORS.text} size={22} />
        </TouchableOpacity>
        <Text style={styles.progressText}>{step + 1} / {questions.length}</Text>
      </View>

      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${((step + (pickedThisStep ? 1 : 0)) / questions.length) * 100}%` }]} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.kicker}>{t('quizPromptKicker')}</Text>
        <Text style={styles.prompt}>{current.prompt}</Text>

        {current.options.map((opt) => {
          const isPicked = pickedThisStep === opt;
          return (
            <TouchableOpacity
              key={opt}
              activeOpacity={0.85}
              disabled={!!pickedThisStep || submitting}
              onPress={() => choose(opt)}
              style={[styles.optionCard, isPicked && styles.optionCardPicked]}
            >
              <Text style={[styles.optionText, isPicked && styles.optionTextPicked]}>{opt}</Text>
              {isPicked && (
                <View style={styles.optionIcon}>
                  <Check color={COLORS.white} size={16} />
                </View>
              )}
            </TouchableOpacity>
          );
        })}

        {submitting && (
          <View style={styles.submittingRow}>
            <ActivityIndicator color={COLORS.primary} size="small" />
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.background,
    paddingTop: 54,
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
    marginBottom: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressText: {
    color: COLORS.textSecondary,
    fontFamily: FONT_FAMILY.semiBold,
    fontSize: 13,
  },
  progressTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.borderLight,
    overflow: 'hidden',
    marginBottom: 24,
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: 3,
  },
  content: {
    paddingBottom: 60,
  },
  kicker: {
    color: COLORS.muted,
    fontFamily: FONT_FAMILY.semiBold,
    fontSize: 12,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  prompt: {
    color: COLORS.text,
    fontFamily: FONT_FAMILY.bold,
    fontSize: 22,
    marginBottom: 24,
    lineHeight: 30,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    paddingHorizontal: 16,
    paddingVertical: 16,
    marginBottom: 12,
  },
  optionCardPicked: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primaryLight,
  },
  optionText: {
    flex: 1,
    color: COLORS.text,
    fontFamily: FONT_FAMILY.medium,
    fontSize: 15,
    textAlign: 'left',
  },
  optionTextPicked: {
    color: COLORS.primaryDark,
    fontFamily: FONT_FAMILY.semiBold,
  },
  optionIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 10,
  },
  submittingRow: {
    alignItems: 'center',
    marginTop: 20,
  },
  emptyText: {
    color: COLORS.muted,
    fontFamily: FONT_FAMILY.regular,
    fontSize: 15,
    textAlign: 'center',
    paddingHorizontal: 30,
  },
  resultBadge: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  resultScore: {
    color: COLORS.text,
    fontFamily: FONT_FAMILY.bold,
    fontSize: 36,
  },
  resultPct: {
    color: COLORS.textSecondary,
    fontFamily: FONT_FAMILY.medium,
    fontSize: 15,
    marginTop: 4,
  },
  resultXP: {
    color: COLORS.secondary,
    fontFamily: FONT_FAMILY.bold,
    fontSize: 16,
    marginTop: 12,
  },
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
