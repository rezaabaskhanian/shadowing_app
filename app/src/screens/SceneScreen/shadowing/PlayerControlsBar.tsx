import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { ChevronLeft, ChevronRight, Mic, Pause, Play, RotateCcw } from 'lucide-react-native';

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
 *  - Record (۲): دکمه‌ی اصلی ضبط (نگه‌داشتن)، فرعی «صدای خودم را بشنو».
 *  - Compare (۳): دکمه‌ی اصلی پخش/توقف، فرعی «ضبط دوباره».
 */
export const PlayerControlsBar: React.FC<{
  activeStepIndex: number;
  playing: boolean;
  actionCommand: AudioActionCommand;
  setActionCommand: (cmd: AudioActionCommand) => void;
  setPlaying: (playing: boolean) => void;
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
  setActionCommand,
  setPlaying,
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
  // نگه‌داشتنِ دکمه، ensureMicPermission دیگر async/کند نباشد؛ وگرنه در یک
  // نگه‌داشتن کوتاه، onPressOut (stop_record) زودتر از resolve شدن promise
  // اجرا می‌شد و start_record دیرهنگام روی آن می‌نشست — یعنی ضبط عملاً هیچ‌وقت
  // واقعاً شروع/پایان درستی نداشت.
  const micGrantedRef = React.useRef(false);
  React.useEffect(() => {
    if (activeStepIndex === 1 || activeStepIndex === 2) {
      ensureMicPermission().then((granted) => {
        micGrantedRef.current = granted;
      });
    }
  }, [activeStepIndex]);

  const startRecord = React.useCallback(() => {
    if (micGrantedRef.current) {
      setActionCommand('start_record');
      return;
    }
    ensureMicPermission().then((granted) => {
      micGrantedRef.current = granted;
      if (granted) setActionCommand('start_record');
    });
  }, [setActionCommand]);

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
        style={[styles.centerMicBtn, actionCommand === 'start_record' ? styles.centerMicBtnActive : null]}
        onPress={() => {
          if (activeStepIndex === 1) {
            if (actionCommand === 'start_record') {
              setActionCommand('stop_record');
            } else {
              startRecord();
              setPlaying(true);
            }
          } else if (activeStepIndex === 2) {
            // این مرحله فقط با onPressIn/onPressOut (نگه‌داشتن) کار می‌کند؛
            // onPress خودش نباید کاری بکند وگرنه با togglePlay قاطی می‌شود.
          } else {
            // Steps 0 (Listen) and 3 (Compare) share a simple play/pause toggle.
            togglePlay();
          }
        }}
        onPressIn={activeStepIndex === 2 ? startRecord : undefined}
        onPressOut={activeStepIndex === 2 ? () => setActionCommand('stop_record') : undefined}
      >
        {activeStepIndex === 1 || activeStepIndex === 2 ? (
          <Mic size={24} color={COLORS.white} />
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
          activeStepIndex === 2 ? onPlayMyRecording : activeStepIndex === 3 ? startRecord : onReplay
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
