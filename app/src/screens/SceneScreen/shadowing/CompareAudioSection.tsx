import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Play, Sparkles } from 'lucide-react-native';

import { COLORS } from '../../../theme/colors';
import { FONT_FAMILY } from '../../../theme/typography';
import type { EvaluationResult } from '../../../api/shadowing';
import { WaveBars } from './WaveBars';
import { PronunciationFeedback } from './PronunciationFeedback';

/**
 * محتوای مرحله‌ی مقایسه: دو صدا (مرجع/خودت) هرکدام جدا قابل پخش، دکمه‌ی
 * نمره‌دهی دستی، و کارت نتیجه.
 *
 * نمره‌دهی دستی است — تا کاربر دکمه را نزند، صدایش جایی نمی‌رود. شرط نمایش
 * دکمه از روی خودِ نتیجه‌ی همین جمله است نه یک وضعیت سراسری، وگرنه
 * نمره‌گرفتنِ جمله‌ی قبلی دکمه‌ی این یکی را پنهان می‌کرد.
 */
export const CompareAudioSection: React.FC<{
  hasRecordingForCurrentLine: boolean;
  onPlayOriginal: () => void;
  onPlayMyRecording: () => void;
  evaluation?: EvaluationResult;
  evalState: 'idle' | 'scoring' | 'done' | 'error';
  evalError: string | null;
  onScoreCurrentLine: () => void;
  /** موقعیتِ زنده‌ی پخشِ ضبطِ کاربر (ثانیه)، برای هایلایتِ کلمه‌به‌کلمه. */
  recordingPositionSeconds?: number;
  /** true وقتی همین حالا ضبطِ کاربر در حال پخش است. */
  isPlayingRecording?: boolean;
  t: (key: string) => string;
}> = ({
  hasRecordingForCurrentLine,
  onPlayOriginal,
  onPlayMyRecording,
  evaluation,
  evalState,
  evalError,
  onScoreCurrentLine,
  recordingPositionSeconds,
  isPlayingRecording,
  t,
}) => (
  <>
    <TouchableOpacity style={styles.abRow} onPress={onPlayOriginal}>
      <View style={styles.abPlayCircle}>
        <Play size={14} color={COLORS.white} fill={COLORS.white} />
      </View>
      <View style={styles.abRowBody}>
        <Text style={styles.compareLabel}>{t('masterAudio')}</Text>
        <WaveBars active color={COLORS.primary} />
      </View>
    </TouchableOpacity>

    <TouchableOpacity
      style={[styles.abRow, hasRecordingForCurrentLine ? null : styles.abRowDisabled]}
      disabled={!hasRecordingForCurrentLine}
      onPress={onPlayMyRecording}
    >
      <View style={[styles.abPlayCircle, styles.abPlayCircleMine]}>
        <Play size={14} color={COLORS.white} fill={COLORS.white} />
      </View>
      <View style={styles.abRowBody}>
        <Text style={styles.compareLabel}>{t('yourRecording')}</Text>
        {hasRecordingForCurrentLine ? (
          <WaveBars active color={COLORS.secondary} />
        ) : (
          <Text style={styles.abEmptyHint}>{t('noRecordingForLine')}</Text>
        )}
      </View>
    </TouchableOpacity>

    {hasRecordingForCurrentLine && !evaluation && evalState !== 'scoring' && (
      <TouchableOpacity style={styles.scoreBtn} onPress={onScoreCurrentLine}>
        <Sparkles size={14} color={COLORS.white} />
        <Text style={styles.scoreBtnText}>{t('checkPronunciation')}</Text>
      </TouchableOpacity>
    )}

    {(evaluation || evalState === 'scoring' || evalState === 'error') && (
      <PronunciationFeedback
        evaluation={evaluation}
        evalState={evalState}
        evalError={evalError}
        onRetry={onScoreCurrentLine}
        recordingPositionSeconds={recordingPositionSeconds}
        isPlayingRecording={isPlayingRecording}
        t={t}
      />
    )}
  </>
);

const styles = StyleSheet.create({
  abRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
  },
  abRowDisabled: {
    opacity: 0.5,
  },
  abRowBody: {
    flex: 1,
  },
  abPlayCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
  },
  abPlayCircleMine: {
    backgroundColor: COLORS.secondaryContainer,
  },
  abEmptyHint: {
    color: COLORS.muted,
    fontFamily: FONT_FAMILY.regular,
    fontSize: 11,
  },
  compareLabel: {
    color: COLORS.textSecondary,
    fontFamily: FONT_FAMILY.semiBold,
    fontSize: 12,
    marginBottom: 4,
  },
  scoreBtn: {
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: COLORS.primary,
  },
  scoreBtnText: {
    color: COLORS.white,
    fontFamily: FONT_FAMILY.semiBold,
    fontSize: 13,
  },
});
