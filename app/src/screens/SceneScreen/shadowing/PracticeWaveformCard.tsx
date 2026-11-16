import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Mic, Sparkles, Volume2 } from 'lucide-react-native';

import { COLORS } from '../../../theme/colors';
import { FONT_FAMILY } from '../../../theme/typography';
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
  /** رنگ اختصاصیِ مرحله‌ی فعلی؛ فقط برای موجِ عمومیِ Listen/Record استفاده می‌شود
   * (Shadow و Compare رنگ‌های معناداری از قبل دارند: صدای مرجع/خودت). */
  accentColor: string;
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
  rtl?: boolean;
  t: (key: string) => string;
}> = ({
  activeStepIndex,
  accentColor,
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
  rtl = false,
  t,
}) => (
  <View
    style={[
      styles.waveformCard,
      activeStepIndex === 0 && styles.waveformCardListen,
      activeStepIndex === 3 && styles.waveformCardCompare,
    ]}
  >
    {activeStepIndex === 1 ? (
      <View style={styles.shadowCoachWrap}>
        {/* ردیف صدای مرجع نیتیو */}
        <View style={[styles.channelRow, rtl && styles.rowReverse]}>
          <View style={[styles.channelTag, { backgroundColor: 'rgba(36, 83, 219, 0.10)' }, rtl && styles.rowReverse]}>
            <Volume2 size={13} color={COLORS.audioOriginal} />
            <Text style={[styles.channelTagText, { color: COLORS.audioOriginal }]}>{t('audioOriginal') || 'گوینده'}</Text>
          </View>
          <View style={styles.channelWave}>
            <WaveBars active={playing} color={COLORS.audioOriginal} />
          </View>
        </View>

        <View style={styles.waveformDivider} />

        {/* ردیف صدای کاربر */}
        <View style={[styles.channelRow, rtl && styles.rowReverse]}>
          <View style={[styles.channelTag, { backgroundColor: 'rgba(255, 100, 34, 0.12)' }, rtl && styles.rowReverse]}>
            <Mic size={13} color={COLORS.audioMine} />
            <Text style={[styles.channelTagText, { color: COLORS.audioMine }]}>{t('audioMine') || 'شما'}</Text>
          </View>
          <View style={styles.channelWave}>
            <WaveBars active={actionCommand === 'start_record'} color={COLORS.audioMine} />
          </View>
        </View>

        {/* نشانگر وضعیت همگام‌سازی */}
        <View style={[styles.syncStatusPill, actionCommand === 'start_record' && styles.syncStatusPillActive]}>
          <Sparkles size={13} color={actionCommand === 'start_record' ? '#EF4444' : accentColor} />
          <Text style={[styles.syncStatusText, actionCommand === 'start_record' && { color: '#B91C1C' }]}>
            {actionCommand === 'start_record'
              ? '🎙️ در حال سایه‌زنی همزمان... با لحن و ریتم گوینده ادامه دهید'
              : '🎧 گوش دهید و با دکمه میکروفون روی صدای گوینده سایه بزنید'}
          </Text>
        </View>
      </View>
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
        rtl={rtl}
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
                    : 6 + ((idx * 11) % 16),
                backgroundColor: accentColor,
              },
            ]}
          />
        ))}
      </View>
    )}
  </View>
);

const styles = StyleSheet.create({
  waveformCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#F0EBE3',
    borderRadius: 22,
    paddingVertical: 18,
    paddingHorizontal: 14,
    marginVertical: 12,
    shadowColor: '#1A1D26',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  waveformCardListen: {
    backgroundColor: '#FAF7F2',
    borderColor: '#F0EBE3',
  },
  // در مقایسه، خودِ بخش‌ها کارت‌های جدا دارند.
  waveformCardCompare: {
    backgroundColor: 'transparent',
    borderWidth: 0,
    paddingVertical: 0,
    paddingHorizontal: 0,
  },
  waveformRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    width: '100%',
    height: 36,
    marginVertical: 4,
  },
  waveBar: {
    width: 3,
    borderRadius: 1.5,
  },
  waveformDivider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: 4,
  },
  shadowCoachWrap: {
    width: '100%',
    gap: 8,
  },
  channelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    width: '100%',
  },
  rowReverse: {
    flexDirection: 'row-reverse',
  },
  channelTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    minWidth: 70,
  },
  channelTagText: {
    fontFamily: FONT_FAMILY.bold,
    fontSize: 11,
  },
  channelWave: {
    flex: 1,
  },
  syncStatusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#F7F5F0',
    borderRadius: 12,
    paddingVertical: 6,
    paddingHorizontal: 10,
    marginTop: 4,
  },
  syncStatusPillActive: {
    backgroundColor: '#FEE2E2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
  },
  syncStatusText: {
    fontFamily: FONT_FAMILY.semiBold,
    fontSize: 11.5,
    color: '#6B7280',
    textAlign: 'center',
  },
});
