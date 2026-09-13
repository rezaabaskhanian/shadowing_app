import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Award, CircleCheck, CircleX, TriangleAlert } from 'lucide-react-native';

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

  return (
    <View
      style={[
        styles.container,
        { paddingTop: insets.top + SPACING.l, paddingBottom: insets.bottom + SPACING.l },
      ]}
    >
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={styles.levelCard}>
          <Award size={40} color={COLORS.primary} />
          <Text style={styles.levelLabel}>{t('placementResultTitle')}</Text>
          <Text style={styles.levelValue}>{result.level}</Text>
          {result.is_estimated && (
            <Text style={styles.estimatedNote}>{t('placementResultEstimatedNote')}</Text>
          )}
        </View>

        <View style={styles.scoreRow}>
          <View style={styles.scoreChip}>
            <Text style={styles.scoreValue}>{Math.round(result.overall_score)}</Text>
            <Text style={styles.scoreLabel}>{t('scoreOverall')}</Text>
          </View>
          <View style={styles.scoreChip}>
            <Text style={styles.scoreValue}>{Math.round(result.pronunciation_score)}</Text>
            <Text style={styles.scoreLabel}>{t('scorePronunciation')}</Text>
          </View>
          <View style={styles.scoreChip}>
            <Text style={styles.scoreValue}>{Math.round(result.fluency_score)}</Text>
            <Text style={styles.scoreLabel}>{t('scoreFluency')}</Text>
          </View>
        </View>

        {freeSpeechResults.length > 0 && (
          <View style={styles.freeSpeechSection}>
            <Text style={styles.sectionTitle}>{t('placementFreeSpeechSectionTitle')}</Text>
            {freeSpeechResults.map((item) => {
              const { Icon, color, labelKey } = relevanceMeta(item.relevance_answered);
              return (
                <View key={item.item_id} style={styles.freeSpeechCard}>
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
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.l,
    marginTop: SPACING.m,
    ...SHADOWS.level1,
  },
  levelLabel: {
    ...TEXT_STYLES.labelMd,
    color: COLORS.textSecondary,
    marginTop: SPACING.s,
  },
  levelValue: {
    ...TEXT_STYLES.displayLg,
    color: COLORS.primary,
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
    alignItems: 'center',
  },
  scoreValue: {
    ...TEXT_STYLES.headlineSm,
    color: COLORS.text,
  },
  scoreLabel: {
    ...TEXT_STYLES.labelSm,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
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
