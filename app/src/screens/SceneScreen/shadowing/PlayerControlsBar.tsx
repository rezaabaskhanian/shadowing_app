import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { ChevronLeft, ChevronRight, Mic, Pause, Play, RotateCcw, Square } from 'lucide-react-native';

import { COLORS } from '../../../theme/colors';
import { FONT_FAMILY } from '../../../theme/typography';
import { SHADOWS } from '../../../theme/elevation';
import { ensureMicPermission } from '../../../services/micPermission';
import type { AudioActionCommand } from '../types';

/**
 * ردیف کنترل‌های یکپارچه‌ی پایین: قبلی · سرعت · دکمه‌ی اصلی (پخش/ضبط) ·
 * دکمه‌ی فرعی · بعدی.
 *
 * دکمه‌ی اصلی و فرعی بسته به مرحله معنی‌شان عوض می‌شود:
 *  - Listen (۰): دکمه‌ی اصلی پخش/توقف، فرعی تکرار.
 *  - Shadow (۱): دکمه‌ی اصلی ضبط (کلیک برای شروع/پایان)، فرعی «تکرار».
 *  - Record (۲): دکمه‌ی اصلی ضبط (کلیک برای شروع/پایان)، فرعی «صدای خودم را بشنو».
 *  - Compare (۳): دکمه‌ی اصلی پخش/توقف، فرعی «ضبط دوباره».
 */
export const PlayerControlsBar: React.FC<{
  activeStepIndex: number;
  playing: boolean;
  actionCommand: AudioActionCommand;
  /** شروع ضبط؛ پارامتر یعنی صدای مرجع هم هم‌زمان پخش شود (مرحله‌ی شدو). */
  onStartRecord: (withReference: boolean) => void;
  onStopRecord: () => void;
  playbackRate: number;
  toggleSpeed: () => void;
  togglePlay: () => void;
  onPrevDialogue: () => void;
  onNextDialogue: () => void;
  onReplay: () => void;
  hasRecordingForCurrentLine: boolean;
  onPlayMyRecording: () => void;
}> = ({
  activeStepIndex,
  playing,
  actionCommand,
  onStartRecord,
  onStopRecord,
  playbackRate,
  toggleSpeed,
  togglePlay,
  onPrevDialogue,
  onNextDialogue,
  onReplay,
  hasRecordingForCurrentLine,
  onPlayMyRecording,
}) => {
  // مجوز میکروفن را زودتر (وقتی وارد مرحله‌ی ضبط می‌شویم) می‌گیریم تا لحظه‌ی
  // زدنِ دکمه، ensureMicPermission دیگر async/کند نباشد و ضبط بدون تأخیر
  // شروع شود.
  const micGrantedRef = React.useRef(false);
  React.useEffect(() => {
    if (activeStepIndex === 1 || activeStepIndex === 2) {
      ensureMicPermission().then((granted) => {
        micGrantedRef.current = granted;
      });
    }
  }, [activeStepIndex]);

  const recording = actionCommand === 'start_record';

  const startRecord = React.useCallback(
    (withReference: boolean) => {
      if (micGrantedRef.current) {
        onStartRecord(withReference);
        return;
      }
      ensureMicPermission().then((granted) => {
        micGrantedRef.current = granted;
        if (granted) onStartRecord(withReference);
      });
    },
    [onStartRecord]
  );

  return (
    <View style={styles.controlsBar}>
      <TouchableOpacity style={styles.chevronBtn} onPress={onPrevDialogue}>
        <ChevronLeft size={20} color={COLORS.textSecondary} />
      </TouchableOpacity>

      <TouchableOpacity style={styles.speedPillBtn} onPress={toggleSpeed}>
        <Text style={styles.speedPillText}>{playbackRate}x</Text>
      </TouchableOpacity>

      <TouchableOpacity
        activeOpacity={0.85}
        style={[styles.centerMicBtn, recording ? styles.centerMicBtnActive : null]}
        onPress={() => {
          // مرحله‌های ۱ و ۲ هر دو ضبط‌اند و یک‌جور کار می‌کنند: یک‌بار زدن شروع،
          // یک‌بار دیگر پایان. (قبلاً مرحله‌ی ۲ نگه‌داشتنی بود؛ هم با بقیه‌ی اپ
          // ناهماهنگ بود و هم نگه‌داشتنِ کوتاه باعث می‌شد stop_record زودتر از
          // start_record بنشیند.)
          if (activeStepIndex === 1 || activeStepIndex === 2) {
            if (recording) {
              onStopRecord();
            } else {
              // فقط در مرحله‌ی Shadow صدای مرجع هم‌زمان پخش می‌شود؛ در مرحله‌ی
              // Record کاربر تنها صدای خودش را ضبط می‌کند.
              startRecord(activeStepIndex === 1);
            }
          } else {
            // Steps 0 (Listen) and 3 (Compare) share a simple play/pause toggle.
            togglePlay();
          }
        }}
      >
        {activeStepIndex === 1 || activeStepIndex === 2 ? (
          recording ? (
            <Square size={22} color={COLORS.white} fill={COLORS.white} />
          ) : (
            <Mic size={24} color={COLORS.white} />
          )
        ) : playing ? (
          <Pause size={22} color={COLORS.white} fill={COLORS.white} />
        ) : (
          <Play size={22} color={COLORS.white} fill={COLORS.white} />
        )}
      </TouchableOpacity>

      <TouchableOpacity
        // در مرحله‌ی ضبط این دکمه «صدای خودم را بشنو» است و تا وقتی ضبطی
        // برای این جمله نباشد کاری ندارد؛ خاموش نشانش می‌دهیم تا کاربر
        // دنبال صدایی که وجود ندارد نگردد.
        style={[
          styles.smallPlayBtn,
          activeStepIndex === 2 && !hasRecordingForCurrentLine ? styles.smallPlayBtnDisabled : null,
        ]}
        disabled={activeStepIndex === 2 && !hasRecordingForCurrentLine}
        onPress={
          activeStepIndex === 2
            ? onPlayMyRecording
            : activeStepIndex === 3
              ? () => startRecord(false)
              : onReplay
        }
      >
        {activeStepIndex === 3 ? (
          <RotateCcw size={16} color={COLORS.primary} />
        ) : (
          <Play size={16} color={COLORS.primary} />
        )}
      </TouchableOpacity>

      <TouchableOpacity style={styles.chevronBtn} onPress={onNextDialogue}>
        <ChevronRight size={20} color={COLORS.textSecondary} />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  controlsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginVertical: 10,
  },
  chevronBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  speedPillBtn: {
    backgroundColor: COLORS.surfaceLight,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
  },
  speedPillText: {
    color: COLORS.textSecondary,
    fontFamily: FONT_FAMILY.semiBold,
    fontSize: 12,
  },
  centerMicBtn: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.level1,
  },
  centerMicBtnActive: {
    backgroundColor: COLORS.error,
  },
  smallPlayBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  smallPlayBtnDisabled: {
    opacity: 0.4,
  },
});
