import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { RotateCcw } from 'lucide-react-native';

import { COLORS } from '../../../theme/colors';
import { FONT_FAMILY } from '../../../theme/typography';
import type { EvaluationResult } from '../../../api/shadowing';
import { ScorePill } from './ScorePill';
import { ScoredDialogueText } from './ScoredDialogueText';
import { feedbackCardStyles } from './sharedStyles';

/**
 * کارت نتیجه‌ی نمره‌دهی در مرحله‌ی مقایسه.
 *
 * سه حالت غیرعادی را جدا مدیریت می‌کند، چون هر کدام معنی متفاوتی برای کاربر
 * دارند: در حال محاسبه / شکست شبکه / نمره‌ی تخمینی (سرویس تشخیص گفتار در
 * دسترس نبوده — در این حالت عمداً هیچ کلمه‌ای رنگ نمی‌شود، وگرنه بازخورد
 * ساختگی داده‌ایم).
 */
export const PronunciationFeedback: React.FC<{
  evaluation?: EvaluationResult;
  evalState: 'idle' | 'scoring' | 'done' | 'error';
  evalError: string | null;
  onRetry?: () => void;
  t: (key: string) => string;
}> = ({ evaluation, evalState, evalError, onRetry, t }) => {
  if (evalState === 'scoring') {
    return (
      <View style={feedbackCardStyles.feedbackCard}>
        <Text style={feedbackCardStyles.feedbackHint}>{t('scoringInProgress')}</Text>
      </View>
    );
  }

  if (evalState === 'error') {
    return (
      <View style={[feedbackCardStyles.feedbackCard, feedbackCardStyles.feedbackCardError]}>
        <Text style={feedbackCardStyles.feedbackErrorText} numberOfLines={2}>
          {evalError || t('scoringFailed')}
        </Text>
        {!!onRetry && (
          <TouchableOpacity style={styles.retryBtn} onPress={onRetry}>
            <RotateCcw size={12} color={COLORS.primary} />
            <Text style={styles.retryBtnText}>{t('tryAgain')}</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }

  if (!evaluation) {
    return (
      <View style={feedbackCardStyles.feedbackCard}>
        <Text style={feedbackCardStyles.feedbackHint}>{t('recordToSeeScore')}</Text>
      </View>
    );
  }

  if (evaluation.is_estimated) {
    return (
      <View style={feedbackCardStyles.feedbackCard}>
        <View style={styles.scoreRow}>
          <ScorePill label={t('scoreOverall')} value={evaluation.overall_score} />
          <ScorePill label={t('scorePronunciation')} value={evaluation.pronunciation_score} />
          <ScorePill label={t('scoreFluency')} value={evaluation.fluency_score} />
        </View>
        <Text style={feedbackCardStyles.feedbackHint}>{t('scoreEstimatedNote')}</Text>
      </View>
    );
  }

  return (
    <View style={feedbackCardStyles.feedbackCard}>
      <View style={styles.scoreRow}>
        <ScorePill label={t('scoreOverall')} value={evaluation.overall_score} />
        <ScorePill label={t('scorePronunciation')} value={evaluation.pronunciation_score} />
        <ScorePill label={t('scoreFluency')} value={evaluation.fluency_score} />
      </View>

      {!!evaluation.words?.length && <ScoredDialogueText words={evaluation.words} />}

      {!!evaluation.transcript && (
        <Text style={styles.transcriptText} numberOfLines={2}>
          {t('weHeard')} «{evaluation.transcript}»
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  scoreRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 10,
  },
  transcriptText: {
    marginTop: 8,
    color: COLORS.textSecondary,
    fontFamily: FONT_FAMILY.regular,
    fontSize: 11,
    textAlign: 'center',
  },
  retryBtn: {
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
  },
  retryBtnText: {
    color: COLORS.primary,
    fontFamily: FONT_FAMILY.semiBold,
    fontSize: 11,
  },
});
