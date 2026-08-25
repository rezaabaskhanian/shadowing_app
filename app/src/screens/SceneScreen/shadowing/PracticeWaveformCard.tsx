import React from 'react';
import { StyleSheet, View } from 'react-native';

import { COLORS } from '../../../theme/colors';
import type { AudioActionCommand } from '../types';
import type { EvaluationResult } from '../../../api/shadowing';
import { WaveBars } from './WaveBars';
import { CompareAudioSection } from './CompareAudioSection';

/**
 * کارت ویوفرم وسط پنل تمرین. محتوایش کاملاً به مرحله‌ی فعلی بستگی دارد:
 *  - Shadow (۱): دو موج (مرجع/کاربر) کنار هم، صرفاً تزئینی.
 *  - Compare (۳): بخش A/B واقعی + نمره‌دهی (`CompareAudioSection`).
 *  - بقیه (Listen/Record): یک ردیف موجِ عمومی با نشانگر پخش وسط.
 */
export const PracticeWaveformCard: React.FC<{
  activeStepIndex: number;
  playing: boolean;
  actionCommand: AudioActionCommand;
  hasRecordingForCurrentLine: boolean;
  onPlayOriginal: () => void;
  onPlayMyRecording: () => void;
  evaluation?: EvaluationResult;
  evalState: 'idle' | 'scoring' | 'done' | 'error';
  evalError: string | null;
  onScoreCurrentLine: () => void;
  /** موقعیتِ زنده‌ی پخشِ ضبطِ کاربر (ثانیه)، برای هایلایتِ کلمه‌به‌کلمه در Compare. */
  recordingPositionSeconds?: number;
  /** true وقتی همین حالا ضبطِ کاربر (نه صدای مرجع) در حال پخش است. */
  isPlayingRecording?: boolean;
  t: (key: string) => string;
}> = ({
  activeStepIndex,
  playing,
  actionCommand,
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
  <View style={styles.waveformCard}>
    {activeStepIndex === 1 ? (
      <>
        <WaveBars active color={COLORS.primary} />
        <View style={styles.waveformDivider} />
        <WaveBars active={actionCommand === 'start_record'} color={COLORS.secondary} />
      </>
    ) : activeStepIndex === 3 ? (
      <CompareAudioSection
        hasRecordingForCurrentLine={hasRecordingForCurrentLine}
        onPlayOriginal={onPlayOriginal}
        onPlayMyRecording={onPlayMyRecording}
        evaluation={evaluation}
        evalState={evalState}
        evalError={evalError}
        onScoreCurrentLine={onScoreCurrentLine}
        recordingPositionSeconds={recordingPositionSeconds}
        isPlayingRecording={isPlayingRecording}
        t={t}
      />
    ) : (
      <View style={styles.waveformRow}>
        {Array.from({ length: 24 }).map((_, idx) => (
          <View
            key={idx}
            style={[
              styles.waveBar,
              {
                height:
                  (activeStepIndex === 0 && playing) ||
                  (activeStepIndex === 2 && actionCommand === 'start_record')
                    ? 8 + ((idx * 7) % 20)
                    : 8,
                backgroundColor: COLORS.primary,
              },
            ]}
          />
        ))}
        <View style={styles.waveformPlayhead} />
      </View>
    )}
  </View>
);

const styles = StyleSheet.create({
  waveformCard: {
    width: '100%',
    backgroundColor: COLORS.backgroundSoft,
    borderRadius: 18,
    paddingVertical: 12,
    paddingHorizontal: 10,
    marginVertical: 10,
  },
  waveformRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    width: '100%',
    height: 28,
    marginVertical: 4,
  },
  waveBar: {
    width: 3,
    borderRadius: 1.5,
  },
  waveformPlayhead: {
    position: 'absolute',
    top: 4,
    bottom: 4,
    left: '50%',
    width: 2,
    borderRadius: 1,
    backgroundColor: COLORS.primary,
  },
  waveformDivider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: 4,
  },
});
