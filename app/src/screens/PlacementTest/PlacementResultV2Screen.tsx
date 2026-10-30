import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, ArrowRight, BookOpen, Clock, Mic, TrendingUp, Volume2 } from 'lucide-react-native';

import { COLORS, SPACING } from '../../theme/colors';
import { FONT_FAMILY } from '../../theme/typography';
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

  const rr = language === 'fa' ? styles.rowReverse : null;
  return (
    <View style={styles.screen}>
    <ScrollView
      style={styles.flex1}
      contentContainerStyle={[styles.container, { paddingTop: insets.top + SPACING.l, paddingBottom: SPACING.l }]}
    >
      <View style={styles.badgeChip}>
        <Text style={styles.badgeChipText}>★ {t('placementV2ResultBadge')}</Text>
      </View>
      <Text style={styles.title}>{t('placementV2ResultTitle')}</Text>

      {/* فهمیدن و صحبت: دو کارت هم‌اندازه با سطح بزرگ */}
      <View style={[styles.row, rr]}>
        <View style={[styles.levelCard, styles.levelBlue]}>
          <View style={[styles.levelIcon, { backgroundColor: '#E8EEFD' }]}>
            <Volume2 size={20} color="#3B6EF0" />
          </View>
          <Text style={styles.levelLabel}>{t('placementV2Comprehension')}</Text>
          <Text style={[styles.levelValue, { color: '#3B6EF0' }]}>{result.comprehension_level}</Text>
        </View>
        <View style={[styles.levelCard, styles.levelOrange]}>
          <View style={[styles.levelIcon, { backgroundColor: '#FDEBE4' }]}>
            <Mic size={20} color={COLORS.primary} />
          </View>
          <Text style={styles.levelLabel}>{t('placementV2Speaking')}</Text>
          <Text style={[styles.levelValue, { color: COLORS.primary }]}>
            {result.speaking_measured ? result.speaking_level : '—'}
          </Text>
        </View>
      </View>

      {result.vocab_valid && (
        <View style={[styles.infoCard, rr]}>
          <View style={styles.infoIcon}>
            <BookOpen size={18} color="#C98A12" />
          </View>
          <Text style={styles.infoText}>{t('placementV2VocabSize').replace('{n}', num(result.vocab_size))}</Text>
        </View>
      )}

      {prev && (
        <View style={[styles.infoCard, rr, styles.infoGood]}>
          <View style={[styles.infoIcon, { backgroundColor: '#E3F4EB' }]}>
            <TrendingUp size={18} color={COLORS.success} />
          </View>
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
        <View style={styles.startChip}>
          <Text style={styles.startChipText}>{t('placementV2StartAt')}</Text>
        </View>
        <Text style={styles.startValue}>
          {startLabel} • {result.level}
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
    </ScrollView>
    <View style={[styles.footer, { paddingBottom: insets.bottom + SPACING.m }]}>
      <View style={[styles.retestRow, rr]}>
        <Clock size={13} color={COLORS.muted} />
        <Text style={styles.retestNote}>{t('placementV2RetestNote')}</Text>
      </View>
      <TouchableOpacity style={[styles.continueBtn, rr]} onPress={onContinue} activeOpacity={0.85}>
        <Text style={styles.continueBtnText}>{t('placementV2StartPathBtn')}</Text>
        {language === 'fa' ? <ArrowLeft size={18} color={COLORS.white} /> : <ArrowRight size={18} color={COLORS.white} />}
      </TouchableOpacity>
    </View>
    </View>
  );
};

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#FBFAF7' },
  flex1: { flex: 1 },
  rowReverse: { flexDirection: 'row-reverse' },
  container: { paddingHorizontal: SPACING.l, gap: 14, alignItems: 'stretch' },
  badgeChip: { alignSelf: 'center', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12, backgroundColor: '#F2F0EC' },
  badgeChipText: { fontFamily: FONT_FAMILY.semiBold, fontSize: 11, color: COLORS.textSecondary },
  title: { fontFamily: FONT_FAMILY.bold, fontSize: 24, color: COLORS.text, textAlign: 'center', marginBottom: 6 },
  row: { flexDirection: 'row', gap: 12 },
  levelCard: { flex: 1, alignItems: 'center', gap: 6, paddingVertical: 18, borderRadius: 20, borderWidth: 1.5, backgroundColor: COLORS.white },
  levelBlue: { borderColor: '#C9D8FA' },
  levelOrange: { borderColor: '#F6CDB9' },
  levelIcon: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  levelLabel: { fontFamily: FONT_FAMILY.medium, fontSize: 12, color: COLORS.textSecondary },
  levelValue: { fontFamily: FONT_FAMILY.bold, fontSize: 30 },
  infoCard: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 16, borderWidth: 1, borderColor: '#F3E7C8', backgroundColor: '#FFFCF3' },
  infoGood: { borderColor: '#CDEBDA', backgroundColor: '#F2FAF5' },
  infoIcon: { width: 36, height: 36, borderRadius: 10, backgroundColor: '#FBF0D2', alignItems: 'center', justifyContent: 'center' },
  infoText: { flex: 1, fontFamily: FONT_FAMILY.medium, fontSize: 13, lineHeight: 21, color: COLORS.text, textAlign: 'right' },
  startCard: { alignItems: 'center', gap: 8, padding: 18, borderRadius: 20, borderWidth: 1, borderColor: '#F6DDD0', backgroundColor: '#FFF5F0' },
  startChip: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 10, backgroundColor: '#FDE3D6' },
  startChipText: { fontFamily: FONT_FAMILY.semiBold, fontSize: 11, color: '#C2410C' },
  startValue: { fontFamily: FONT_FAMILY.bold, fontSize: 20, color: COLORS.primary },
  startWhy: { fontFamily: FONT_FAMILY.regular, fontSize: 12, lineHeight: 20, color: COLORS.textSecondary, textAlign: 'center' },
  footer: { paddingHorizontal: SPACING.l, paddingTop: SPACING.s, gap: 12 },
  retestRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  retestNote: { fontFamily: FONT_FAMILY.regular, fontSize: 11, color: COLORS.muted },
  continueBtn: { flexDirection: 'row', gap: 10, height: 54, borderRadius: 16, backgroundColor: '#E2643A', alignItems: 'center', justifyContent: 'center', borderBottomWidth: 3, borderBottomColor: '#B8481F' },
  continueBtnText: { fontFamily: FONT_FAMILY.bold, fontSize: 15, color: COLORS.white },
});
