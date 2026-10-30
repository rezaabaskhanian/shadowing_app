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
  rtl?: boolean;
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
  rtl = false,
  t,
}) => (
  <>
    <View style={styles.abCard}>
    <TouchableOpacity style={[styles.abRow, rtl && styles.rowReverse]} onPress={onPlayOriginal}>
      <View style={styles.abPlayCircle}>
        <Play size={18} color={COLORS.white} fill={COLORS.white} />
      </View>
      <Text style={styles.compareLabel}>{t('masterAudio')}</Text>
      <View style={styles.abRowBody}>
        <WaveBars active color={COLORS.audioOriginal} />
      </View>
    </TouchableOpacity>

    <TouchableOpacity
      style={[styles.abRow, rtl && styles.rowReverse, hasRecordingForCurrentLine ? null : styles.abRowDisabled]}
      disabled={!hasRecordingForCurrentLine}
      onPress={onPlayMyRecording}
    >
      <View style={[styles.abPlayCircle, styles.abPlayCircleMine]}>
        <Play size={18} color={COLORS.white} fill={COLORS.white} />
      </View>
      <Text style={styles.compareLabel}>{t('yourRecording')}</Text>
      <View style={styles.abRowBody}>
        {hasRecordingForCurrentLine ? (
          <WaveBars active color={COLORS.audioMine} />
        ) : (
          <Text style={styles.abEmptyHint}>{t('noRecordingForLine')}</Text>
        )}
      </View>
    </TouchableOpacity>
    </View>

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
        rtl={rtl}
        t={t}
      />
    )}
  </>
);

const styles = StyleSheet.create({
  rowReverse: { flexDirection: 'row-reverse' },
  abCard: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#EEEAE3',
    paddingHorizontal: 16,
    paddingVertical: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
  },
  abRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 8,
  },
  abRowDisabled: {
    opacity: 0.5,
  },
  abRowBody: {
    flex: 1,
  },
  abPlayCircle: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.audioOriginal,
  },
  abPlayCircleMine: {
    backgroundColor: COLORS.audioMine,
  },
  abEmptyHint: {
    color: COLORS.muted,
    fontFamily: FONT_FAMILY.regular,
    fontSize: 11,
  },
  compareLabel: {
    color: COLORS.text,
    fontFamily: FONT_FAMILY.bold,
    fontSize: 13,
  },
  scoreBtn: {
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: '#2F6B57',
  },
  scoreBtnText: {
    color: COLORS.white,
    fontFamily: FONT_FAMILY.semiBold,
    fontSize: 13,
  },
});
