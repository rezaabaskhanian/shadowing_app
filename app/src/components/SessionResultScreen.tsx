import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { ArrowRight, RotateCcw } from 'lucide-react-native';
import { COLORS } from '../theme/colors';
import { FONT_FAMILY } from '../theme/typography';
import { ProgressRing } from './ProgressRing';
import { useLanguage } from '../data/i18n';
import type { EvaluationResult } from '../api/shadowing';
import { ScoredDialogueText } from '../screens/SceneScreen/shadowing/ScoredDialogueText';

/** رنگِ حلقه/تیترِ نتیجه بر اساس بازه‌ی نمره‌ی واقعی — نه یک متنِ ثابتِ
 * «عالی بود» برای هر نمره‌ای، حتی وقتی نمره ۴۱ از ۱۰۰ است. */
const scoreTier = (score: number): { color: string; titleKey: string; subKey: string } => {
  if (score >= 80) return { color: COLORS.success, titleKey: 'greatJobTitle', subKey: 'greatJobSub' };
  if (score >= 50) return { color: COLORS.warning, titleKey: 'goodJobTitle', subKey: 'goodJobSub' };
  return { color: COLORS.error, titleKey: 'needsPracticeTitle', subKey: 'needsPracticeSub' };
};

export interface SessionResultLine {
  dialogue: string;
  translation: string;
  evaluation: EvaluationResult;
}

interface SessionResultScreenProps {
  score: number;
  pronunciation: number;
  fluency: number;
  rhythm: number;
  /** هر جمله‌ای که واقعاً ضبط و نمره‌دهی شده — تحلیلِ کلمه‌به‌کلمه‌ی هرکدام
   * مستقیماً از EvaluationResultِ همان جمله می‌آید (خروجیِ واقعیِ
   * /v1/shadowing/evaluate روی صدای خودِ کاربر)، نه یک لیستِ واژگانِ ثابت. */
  lines: SessionResultLine[];
  onPracticeAgain: () => void;
  onFinishLesson: () => void;
}

export function SessionResultScreen({
  score,
  pronunciation,
  fluency,
  rhythm,
  lines,
  onPracticeAgain,
  onFinishLesson,
}: SessionResultScreenProps) {
  const { t } = useLanguage();
  const tier = scoreTier(score);

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>{t(tier.titleKey)}</Text>
        <Text style={styles.sub}>{t(tier.subKey)}</Text>

        <View style={styles.ringWrapper}>
          <ProgressRing percent={score} size={160} strokeWidth={12} color={tier.color}>
            <Text style={styles.ringScore}>{score}</Text>
            <Text style={styles.ringOutOf}>/ 100</Text>
          </ProgressRing>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{pronunciation}%</Text>
            <Text style={styles.statLabel}>{t('pronunciation')}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{fluency}%</Text>
            <Text style={styles.statLabel}>{t('fluency')}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{rhythm}%</Text>
            <Text style={styles.statLabel}>{t('rhythm')}</Text>
          </View>
        </View>

        <Text style={styles.cardTitle}>{t('sentenceAnalysis')}</Text>
        {lines.map(({ dialogue, translation, evaluation }, idx) => (
          <View key={idx} style={styles.card}>
            {evaluation.words?.length ? (
              <ScoredDialogueText words={evaluation.words} />
            ) : (
              <Text style={styles.plainSentence}>{dialogue}</Text>
            )}
            <Text style={styles.translation}>{translation}</Text>
            {!!evaluation.transcript && (
              <Text style={styles.transcriptText}>
                {t('weHeard')} «{evaluation.transcript}»
              </Text>
            )}
            {evaluation.is_estimated && (
              <Text style={styles.estimatedNote}>{t('scoreEstimatedNote')}</Text>
            )}
          </View>
        ))}

        {!!lines.length && (
          <View style={styles.legendRow}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: COLORS.error }]} />
              <Text style={styles.legendText}>{t('wordNeedsPractice')}</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: COLORS.warning }]} />
              <Text style={styles.legendText}>{t('wordGood')}</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: COLORS.tertiary }]} />
              <Text style={styles.legendText}>{t('wordExcellent')}</Text>
            </View>
          </View>
        )}

        <View style={styles.actionsRow}>
          <TouchableOpacity style={styles.secondaryBtn} onPress={onPracticeAgain}>
            <RotateCcw size={18} color={COLORS.text} />
            <Text style={styles.secondaryBtnText}>{t('practiceAgain')}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.primaryBtn} onPress={onFinishLesson}>
            <Text style={styles.primaryBtnText}>{t('finishLesson')}</Text>
            <ArrowRight size={18} color={COLORS.white} />
          </TouchableOpacity>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scroll: {
    paddingHorizontal: 24,
    paddingTop: 60,
  },
  title: {
    color: COLORS.primary,
    fontFamily: FONT_FAMILY.bold,
    fontSize: 30,
    textAlign: 'center',
  },
  sub: {
    color: COLORS.textSecondary,
    fontFamily: FONT_FAMILY.regular,
    fontSize: 14,
    textAlign: 'center',
    marginTop: 6,
    marginBottom: 24,
  },
  ringWrapper: {
    alignItems: 'center',
    marginBottom: 24,
  },
  ringScore: {
    color: COLORS.text,
    fontFamily: FONT_FAMILY.bold,
    fontSize: 40,
  },
  ringOutOf: {
    color: COLORS.textSecondary,
    fontFamily: FONT_FAMILY.regular,
    fontSize: 13,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  statValue: {
    color: COLORS.text,
    fontFamily: FONT_FAMILY.bold,
    fontSize: 20,
  },
  statLabel: {
    color: COLORS.textSecondary,
    fontFamily: FONT_FAMILY.regular,
    fontSize: 12,
    marginTop: 4,
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 20,
  },
  cardTitle: {
    color: COLORS.text,
    fontFamily: FONT_FAMILY.bold,
    fontSize: 16,
    marginBottom: 14,
  },
  plainSentence: {
    color: COLORS.text,
    fontFamily: FONT_FAMILY.semiBold,
    fontSize: 15,
    marginBottom: 8,
  },
  translation: {
    color: COLORS.textSecondary,
    fontFamily: FONT_FAMILY.regular,
    fontSize: 13,
    marginTop: 8,
  },
  transcriptText: {
    color: COLORS.muted,
    fontFamily: FONT_FAMILY.regular,
    fontSize: 12,
    fontStyle: 'italic',
    marginTop: 6,
  },
  estimatedNote: {
    color: COLORS.muted,
    fontFamily: FONT_FAMILY.regular,
    fontSize: 11,
    marginTop: 6,
  },
  legendRow: {
    flexDirection: 'row',
    gap: 14,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: 12,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    color: COLORS.textSecondary,
    fontFamily: FONT_FAMILY.regular,
    fontSize: 11,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  secondaryBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 54,
    borderRadius: 27,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  secondaryBtnText: {
    color: COLORS.text,
    fontFamily: FONT_FAMILY.semiBold,
    fontSize: 15,
  },
  primaryBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 54,
    borderRadius: 27,
    backgroundColor: COLORS.primary,
  },
  primaryBtnText: {
    color: COLORS.white,
    fontFamily: FONT_FAMILY.bold,
    fontSize: 15,
  },
});
