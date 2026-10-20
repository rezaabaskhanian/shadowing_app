import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BookOpen, Ear, Mic, TrendingUp } from 'lucide-react-native';

import { COLORS, SPACING, BORDER_RADIUS } from '../../theme/colors';
import { FONT_FAMILY, TEXT_STYLES } from '../../theme/typography';
import { SHADOWS } from '../../theme/elevation';
import { useLanguage } from '../../data/i18n';
import type { SubmitAssessmentV2Result } from '../../api/assessment';

const SCENE_LEVEL_KEY: Record<string, string> = {
  starter: 'levelStarter',
  beginner: 'levelBeginner',
  intermediate: 'levelIntermediate',
  advanced: 'levelAdvanced',
  proficient: 'levelProficient',
};

const faDigits = (n: number) => String(n).replace(/\d/g, (d) => '۰۱۲۳۴۵۶۷۸۹'[Number(d)]);

interface Props {
  result: SubmitAssessmentV2Result;
  onContinue: () => void;
}

/**
 * نتیجه‌ی دوبخشی تست نسخه‌ی ۲: «فهمیدن» و «صحبت»، دامنه‌ی لغت تخمینی، سطح
 * شروع مسیر و دلیلش، و اگر قبلاً تست داده، مقایسه با نتیجه‌ی قبلی.
 */
export const PlacementResultV2Screen: React.FC<Props> = ({ result, onContinue }) => {
  const { t, language } = useLanguage();
  const insets = useSafeAreaInsets();
  const num = (n: number) => (language === 'fa' ? faDigits(n) : String(n));

  const startLabel = t(SCENE_LEVEL_KEY[result.scene_level] || 'levelBeginner');
  const droppedForSpeaking =
    result.speaking_measured && result.level !== result.comprehension_level;

  const prev = result.previous;
  const vocabGain = prev ? result.vocab_size - prev.vocab_size : 0;

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: COLORS.background }}
      contentContainerStyle={[styles.container, { paddingTop: insets.top + SPACING.l, paddingBottom: insets.bottom + SPACING.l }]}
    >
      <Text style={styles.title}>{t('placementV2ResultTitle')}</Text>

      <View style={styles.row}>
        <View style={[styles.levelCard, { borderColor: COLORS.info }]}>
          <Ear size={22} color={COLORS.info} />
          <Text style={styles.levelLabel}>{t('placementV2Comprehension')}</Text>
          <Text style={[styles.levelValue, { color: COLORS.info }]}>{result.comprehension_level}</Text>
        </View>
        <View style={[styles.levelCard, { borderColor: COLORS.primary }]}>
          <Mic size={22} color={COLORS.primary} />
          <Text style={styles.levelLabel}>{t('placementV2Speaking')}</Text>
          <Text style={[styles.levelValue, { color: COLORS.primary }]}>
            {result.speaking_measured ? result.speaking_level : '—'}
          </Text>
        </View>
      </View>

      {result.vocab_valid && (
        <View style={styles.infoCard}>
          <BookOpen size={20} color={COLORS.secondary} />
          <Text style={styles.infoText}>
            {t('placementV2VocabSize').replace('{n}', num(result.vocab_size))}
          </Text>
        </View>
      )}

      {prev && (
        <View style={[styles.infoCard, { borderColor: COLORS.success }]}>
          <TrendingUp size={20} color={COLORS.success} />
          <Text style={styles.infoText}>
            {t('placementV2Progress')
              .replace('{before}', num(prev.vocab_size))
              .replace('{after}', num(result.vocab_size))
              .replace('{prevLevel}', prev.comprehension_level || prev.level)
              .replace('{level}', result.comprehension_level)}
            {vocabGain > 0 ? ` (+${num(vocabGain)})` : ''}
          </Text>
        </View>
      )}

      <View style={styles.startCard}>
        <Text style={styles.startLabel}>{t('placementV2StartAt')}</Text>
        <Text style={styles.startValue}>
          {startLabel} · {result.level}
        </Text>
        <Text style={styles.startWhy}>
          {droppedForSpeaking ? t('placementV2WhySpeaking') : t('placementV2WhyComprehension')}
        </Text>
        {!result.speaking_measured && <Text style={styles.startWhy}>{t('placementV2SpeakingUnmeasured')}</Text>}
        {!result.vocab_valid && <Text style={styles.startWhy}>{t('placementV2VocabInvalid')}</Text>}
      </View>

      {result.intro?.grammar_correction ? (
        <View style={styles.infoCard}>
          <Text style={styles.infoText}>
            {t('placementV2IntroFeedback')}
            {'\n'}
            {result.intro.grammar_correction}
          </Text>
        </View>
      ) : null}

      <Text style={styles.retestNote}>{t('placementV2RetestNote')}</Text>

      <TouchableOpacity style={styles.continueBtn} onPress={onContinue} activeOpacity={0.85}>
        <Text style={styles.continueBtnText}>{t('placementV2StartPathBtn')}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: SPACING.l,
    gap: SPACING.m,
  },
  title: {
    ...TEXT_STYLES.headlineSm,
    color: COLORS.text,
    textAlign: 'center',
  },
  row: {
    flexDirection: 'row',
    gap: SPACING.m,
  },
  levelCard: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.l,
    borderWidth: 1.5,
    paddingVertical: SPACING.l,
    ...SHADOWS.level1,
  },
  levelLabel: {
    ...TEXT_STYLES.labelMd,
    color: COLORS.textSecondary,
  },
  levelValue: {
    fontFamily: FONT_FAMILY.bold,
    fontSize: 30,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.s,
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.l,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.m,
  },
  infoText: {
    ...TEXT_STYLES.bodyMd,
    color: COLORS.text,
    flex: 1,
    lineHeight: 24,
  },
  startCard: {
    backgroundColor: COLORS.primaryLight,
    borderRadius: BORDER_RADIUS.l,
    padding: SPACING.l,
    alignItems: 'center',
    gap: SPACING.xs,
  },
  startLabel: {
    ...TEXT_STYLES.labelMd,
    color: COLORS.primary,
  },
  startValue: {
    fontFamily: FONT_FAMILY.bold,
    fontSize: 22,
    color: COLORS.primary,
  },
  startWhy: {
    ...TEXT_STYLES.labelSm,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  retestNote: {
    ...TEXT_STYLES.labelSm,
    color: COLORS.muted,
    textAlign: 'center',
  },
  continueBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.l,
    paddingVertical: SPACING.m,
    alignItems: 'center',
  },
  continueBtnText: {
    color: COLORS.white,
    fontFamily: FONT_FAMILY.bold,
    fontSize: 16,
  },
});
