import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { ArrowRight, Lightbulb, RotateCcw } from 'lucide-react-native';
import { COLORS } from '../theme/colors';
import { FONT_FAMILY } from '../theme/typography';
import { ProgressRing } from './ProgressRing';
import { useLanguage } from '../data/i18n';
import type { WordEntry } from '../data/scenarios';

type WordLevel = 'excellent' | 'good' | 'practice';

const LEVEL_COLOR: Record<WordLevel, { bg: string; text: string; dot: string }> = {
  excellent: { bg: COLORS.tertiaryLight, text: COLORS.tertiary, dot: COLORS.tertiary },
  good: { bg: COLORS.secondaryLight, text: COLORS.secondaryContainer, dot: COLORS.secondary },
  practice: { bg: 'rgba(186, 26, 26, 0.10)', text: COLORS.error, dot: COLORS.error },
};

function tokenizeWithLevels(sentence: string, practiceWords: WordEntry[]): { text: string; level: WordLevel }[] {
  const practiceSet = new Set(practiceWords.map((w) => w.word.toLowerCase()));
  const tokens = sentence.split(' ').filter(Boolean);
  return tokens.map((token, idx) => {
    const clean = token.replace(/[^a-zA-Z']/g, '').toLowerCase();
    if (practiceSet.has(clean)) return { text: token, level: 'practice' as WordLevel };
    if (idx === tokens.length - 1) return { text: token, level: 'good' as WordLevel };
    return { text: token, level: 'excellent' as WordLevel };
  });
}

interface SessionResultScreenProps {
  score: number;
  pronunciation: number;
  fluency: number;
  rhythm: number;
  englishText: string;
  translation: string;
  words?: WordEntry[];
  onPracticeAgain: () => void;
  onNextLesson: () => void;
}

export function SessionResultScreen({
  score,
  pronunciation,
  fluency,
  rhythm,
  englishText,
  translation,
  words = [],
  onPracticeAgain,
  onNextLesson,
}: SessionResultScreenProps) {
  const { t } = useLanguage();
  const tokens = tokenizeWithLevels(englishText, words);

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>{t('greatJobTitle')}</Text>
        <Text style={styles.sub}>{t('greatJobSub')}</Text>

        <View style={styles.ringWrapper}>
          <ProgressRing percent={score} size={160} strokeWidth={12} color={COLORS.tertiary}>
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

        <View style={styles.card}>
          <Text style={styles.cardTitle}>{t('sentenceAnalysis')}</Text>
          <View style={styles.tokensWrap}>
            {tokens.map((tok, idx) => (
              <View
                key={idx}
                style={[styles.tokenChip, { backgroundColor: LEVEL_COLOR[tok.level].bg }]}
              >
                <Text style={[styles.tokenText, { color: LEVEL_COLOR[tok.level].text }]}>{tok.text}</Text>
              </View>
            ))}
          </View>
          <Text style={styles.translation}>{translation}</Text>

          <View style={styles.legendRow}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: LEVEL_COLOR.practice.dot }]} />
              <Text style={styles.legendText}>{t('wordNeedsPractice')}</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: LEVEL_COLOR.good.dot }]} />
              <Text style={styles.legendText}>{t('wordGood')}</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: LEVEL_COLOR.excellent.dot }]} />
              <Text style={styles.legendText}>{t('wordExcellent')}</Text>
            </View>
          </View>
        </View>

        <View style={styles.insightCard}>
          <View style={styles.insightIconCircle}>
            <Lightbulb size={18} color={COLORS.white} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.insightTitle}>{t('aiCoachInsight')}</Text>
            <Text style={styles.insightBody}>{t('aiCoachInsightBody')}</Text>
          </View>
        </View>

        <View style={styles.actionsRow}>
          <TouchableOpacity style={styles.secondaryBtn} onPress={onPracticeAgain}>
            <RotateCcw size={18} color={COLORS.text} />
            <Text style={styles.secondaryBtnText}>{t('practiceAgain')}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.primaryBtn} onPress={onNextLesson}>
            <Text style={styles.primaryBtnText}>{t('nextLesson')}</Text>
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
  tokensWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  tokenChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
  },
  tokenText: {
    fontFamily: FONT_FAMILY.semiBold,
    fontSize: 15,
  },
  translation: {
    color: COLORS.textSecondary,
    fontFamily: FONT_FAMILY.regular,
    fontSize: 13,
    marginBottom: 12,
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
  insightCard: {
    flexDirection: 'row',
    gap: 12,
    backgroundColor: COLORS.primaryLight,
    borderRadius: 20,
    padding: 16,
    marginBottom: 28,
  },
  insightIconCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  insightTitle: {
    color: COLORS.text,
    fontFamily: FONT_FAMILY.bold,
    fontSize: 14,
    marginBottom: 4,
  },
  insightBody: {
    color: COLORS.textSecondary,
    fontFamily: FONT_FAMILY.regular,
    fontSize: 13,
    lineHeight: 19,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 12,
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
