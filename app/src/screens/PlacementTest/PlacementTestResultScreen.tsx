import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Award, CircleCheck, CircleX, Mic, TriangleAlert, Zap } from 'lucide-react-native';

import { COLORS, SPACING, BORDER_RADIUS } from '../../theme/colors';
import { FONT_FAMILY, TEXT_STYLES } from '../../theme/typography';
import { SHADOWS } from '../../theme/elevation';
import { useLanguage } from '../../data/i18n';
import type { AssessmentItem, ItemResult, SubmitAssessmentResult } from '../../api/assessment';

interface PlacementTestResultScreenProps {
  result: SubmitAssessmentResult;
  items: AssessmentItem[];
  onContinue: () => void;
}

/** آیکن/رنگِ بازخورد ربط‌داشتن پاسخ آزاد با موضوع سؤال. */
const relevanceMeta = (answered: ItemResult['relevance_answered']) => {
  if (answered === 'yes') {
    return { Icon: CircleCheck, color: COLORS.success, labelKey: 'placementRelevanceYes' };
  }
  if (answered === 'partial') {
    return { Icon: TriangleAlert, color: COLORS.warning, labelKey: 'placementRelevancePartial' };
  }
  return { Icon: CircleX, color: COLORS.muted, labelKey: 'placementRelevanceNo' };
};

/** نگاشتِ سطح CEFR به همان سه‌تایی beginner/intermediate/advanced که رمپِ
 * رنگیِ بج‌های سطح صحنه‌ها هم استفاده می‌کند — مطابق
 * difficultyForLevel در internal/service/mission/get_today.go سمت بک‌اند،
 * تا رنگِ «سطح گفتاری» همون معنایی رو بده که جای دیگه‌ی اپ می‌ده. */
const levelMeta = (level: string) => {
  if (level === 'B1') return { color: COLORS.levelIntermediateBg, bg: COLORS.infoLight };
  if (level === 'B2' || level === 'C1') return { color: COLORS.levelAdvancedBg, bg: COLORS.primaryLight };
  return { color: COLORS.levelBeginnerBg, bg: COLORS.tertiaryLight }; // A1, A2 یا نامشخص
};

/** رنگِ عددِ نمره بر اساس بازه — بازخورد سریعِ چشمی، نه فقط رقم خشک. */
const scoreColor = (value: number) => {
  if (value >= 80) return COLORS.success;
  if (value >= 50) return COLORS.warning;
  return COLORS.error;
};

const SCORE_META = [
  { key: 'overall', Icon: Award, labelKey: 'scoreOverall' },
  { key: 'pronunciation', Icon: Mic, labelKey: 'scorePronunciation' },
  { key: 'fluency', Icon: Zap, labelKey: 'scoreFluency' },
] as const;

/**
 * نتیجه‌ی نهایی: سطح گفتاری بزرگ در بالا، ریزنمره‌ی آیتم Shadow، و برای هر
 * آیتمِ گفتار آزاد فقط بازخورد کیفیِ ربط‌داشتن پاسخ (بدون نمره‌ی عددیِ ساختگی).
 */
export const PlacementTestResultScreen: React.FC<PlacementTestResultScreenProps> = ({
  result,
  items,
  onContinue,
}) => {
  const { t } = useLanguage();
  const insets = useSafeAreaInsets();

  const freeSpeechResults = result.items.filter((item) => item.kind === 'free_speech');
  const promptByItemId = new Map(items.map((item) => [item.id, item.prompt_text]));
  const level = levelMeta(result.level);
  const scoreValues = {
    overall: result.overall_score,
    pronunciation: result.pronunciation_score,
    fluency: result.fluency_score,
  };

  return (
    <View
      style={[
        styles.container,
        { paddingTop: insets.top + SPACING.l, paddingBottom: insets.bottom + SPACING.l },
      ]}
    >
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={[styles.levelCard, { borderColor: level.color }]}>
          <View style={[styles.levelIconWrap, { backgroundColor: level.bg }]}>
            <Award size={32} color={level.color} />
          </View>
          <Text style={styles.levelLabel}>{t('placementResultTitle')}</Text>
          <Text style={[styles.levelValue, { color: level.color }]}>{result.level}</Text>
          {result.is_estimated && (
            <Text style={styles.estimatedNote}>{t('placementResultEstimatedNote')}</Text>
          )}
        </View>

        <View style={styles.scoreRow}>
          {SCORE_META.map(({ key, Icon, labelKey }) => {
            const value = Math.round(scoreValues[key]);
            const color = scoreColor(value);
            return (
              <View key={key} style={styles.scoreChip}>
                <Icon size={16} color={color} />
                <Text style={[styles.scoreValue, { color }]}>{value}</Text>
                <Text style={styles.scoreLabel}>{t(labelKey)}</Text>
                <View style={styles.scoreBarTrack}>
                  <View style={[styles.scoreBarFill, { width: `${Math.max(0, Math.min(100, value))}%`, backgroundColor: color }]} />
                </View>
              </View>
            );
          })}
        </View>

        {freeSpeechResults.length > 0 && (
          <View style={styles.freeSpeechSection}>
            <Text style={styles.sectionTitle}>{t('placementFreeSpeechSectionTitle')}</Text>
            {freeSpeechResults.map((item) => {
              const { Icon, color, labelKey } = relevanceMeta(item.relevance_answered);
              return (
                <View key={item.item_id} style={[styles.freeSpeechCard, { borderLeftColor: color }]}>
                  <Text style={styles.freeSpeechPrompt}>
                    {promptByItemId.get(item.item_id) || ''}
                  </Text>
                  <View style={styles.relevanceRow}>
                    <Icon size={18} color={color} />
                    <Text style={[styles.relevanceLabel, { color }]}>{t(labelKey)}</Text>
                  </View>
                  {!!item.relevance_feedback && (
                    <Text style={styles.relevanceFeedback}>{item.relevance_feedback}</Text>
                  )}
                  {!!item.grammar_correction && (
                    <View style={styles.grammarTip}>
                      <Text style={styles.grammarTipLabel}>{t('grammarTipLabel')}</Text>
                      <Text style={styles.grammarTipText}>{item.grammar_correction}</Text>
                      {!!item.grammar_explanation && (
                        <Text style={styles.grammarTipExplanation}>{item.grammar_explanation}</Text>
                      )}
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>

      <TouchableOpacity style={styles.continueBtn} onPress={onContinue} activeOpacity={0.85}>
        <Text style={styles.continueBtnText}>{t('continueLabel')}</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    paddingHorizontal: SPACING.l,
  },
  scrollContent: {
    paddingBottom: SPACING.l,
  },
  levelCard: {
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.l,
    borderWidth: 2,
    padding: SPACING.l,
    marginTop: SPACING.m,
    ...SHADOWS.level1,
  },
  levelIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  levelLabel: {
    ...TEXT_STYLES.labelMd,
    color: COLORS.textSecondary,
    marginTop: SPACING.s,
  },
  levelValue: {
    ...TEXT_STYLES.displayLg,
    marginTop: SPACING.xs,
  },
  estimatedNote: {
    ...TEXT_STYLES.labelSm,
    color: COLORS.muted,
    marginTop: SPACING.s,
    textAlign: 'center',
  },
  scoreRow: {
    flexDirection: 'row',
    gap: SPACING.s,
    marginTop: SPACING.l,
  },
  scoreChip: {
    flex: 1,
    backgroundColor: COLORS.backgroundSoft,
    borderRadius: BORDER_RADIUS.m,
    paddingVertical: SPACING.m,
    paddingHorizontal: SPACING.xs,
    alignItems: 'center',
    gap: 2,
  },
  scoreValue: {
    ...TEXT_STYLES.headlineSm,
  },
  scoreLabel: {
    ...TEXT_STYLES.labelSm,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },
  scoreBarTrack: {
    alignSelf: 'stretch',
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.borderLight,
    marginHorizontal: SPACING.s,
    overflow: 'hidden',
  },
  scoreBarFill: {
    height: '100%',
    borderRadius: 2,
  },
  freeSpeechSection: {
    marginTop: SPACING.l,
    gap: SPACING.s,
  },
  sectionTitle: {
    ...TEXT_STYLES.labelMd,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },
  freeSpeechCard: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.m,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderLeftWidth: 4,
    padding: SPACING.m,
    gap: SPACING.xs,
  },
  freeSpeechPrompt: {
    ...TEXT_STYLES.bodyMd,
    color: COLORS.text,
  },
  relevanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  relevanceLabel: {
    fontFamily: FONT_FAMILY.semiBold,
    fontSize: 13,
  },
  relevanceFeedback: {
    ...TEXT_STYLES.labelMd,
    color: COLORS.textSecondary,
  },
  grammarTip: {
    marginTop: SPACING.xs,
    backgroundColor: COLORS.primaryLight,
    borderRadius: BORDER_RADIUS.m,
    padding: SPACING.s,
  },
  grammarTipLabel: {
    fontFamily: FONT_FAMILY.semiBold,
    fontSize: 12,
    color: COLORS.primary,
  },
  grammarTipText: {
    ...TEXT_STYLES.labelMd,
    color: COLORS.text,
    marginTop: 2,
  },
  grammarTipExplanation: {
    ...TEXT_STYLES.labelSm,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  continueBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.l,
    paddingVertical: SPACING.m,
    alignItems: 'center',
    marginTop: SPACING.s,
  },
  continueBtnText: {
    color: COLORS.white,
    fontFamily: FONT_FAMILY.bold,
    fontSize: 16,
  },
});
