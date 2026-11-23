import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { ChevronLeft, ChevronRight, Mic, Pause, Play, RotateCcw, Sparkles, Square, Volume2 } from 'lucide-react-native';

import { COLORS } from '../../../theme/colors';
import { FONT_FAMILY } from '../../../theme/typography';
import { SHADOWS } from '../../../theme/elevation';
import { ensureMicPermission } from '../../../services/micPermission';
import type { AudioActionCommand } from '../types';
import type { PracticeFlowMode } from '../../../data/PracticeSettingsContext';

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
  /** رنگ اختصاصیِ مرحله‌ی فعلی؛ وقتی واقعاً درحال ضبطیم، قرمزِ ثابت جایگزینش می‌شود. */
  accentColor: string;
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
  /** آیا حالت نردبان سرعت هوشمند فعال است */
  isSpeedLadder?: boolean;
  /** در فارسی ترتیب دکمه‌ها برعکس است: «قبلی» سمت راست. */
  rtl?: boolean;
  flowMode?: PracticeFlowMode;
}> = ({
  activeStepIndex,
  accentColor,
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
  isSpeedLadder,
  rtl = false,
  flowMode = 'smart_flow',
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
    <View style={[styles.controlsBar, rtl && styles.rowReverse]}>
      <TouchableOpacity style={styles.chevronBtn} onPress={onPrevDialogue}>
        <ChevronLeft size={20} color={COLORS.text} />
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.chevronBtn, isSpeedLadder && styles.speedLadderBtn]}
        onPress={toggleSpeed}
      >
        <Text style={[styles.speedPillText, isSpeedLadder && styles.speedLadderPillText]}>
          {isSpeedLadder ? `🪜 ${playbackRate}x` : `${playbackRate}x`}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        activeOpacity={0.85}
        disabled={(activeStepIndex === 2 && playing && !recording) || (flowMode === 'smart_flow' && activeStepIndex === 1 && !recording)}
        style={[
          styles.centerMicBtn,
          { backgroundColor: accentColor },
          recording ? styles.centerMicBtnActive : null,
          (activeStepIndex === 2 && playing && !recording) || (flowMode === 'smart_flow' && activeStepIndex === 1 && !recording)
            ? styles.centerMicBtnPlaying
            : null,
        ]}
        onPress={() => {
          if (activeStepIndex === 2) {
            // روش ۴ مرحله‌ای سنتی: دکمه میکروفون پایین برای شروع و پایان ضبط دستی است
            if (recording) {
              onStopRecord();
            } else if (!playing) {
              startRecord(false);
            }
          } else if (flowMode === 'smart_flow' && activeStepIndex === 1) {
            // جریان هوشمند: شروع ضبط خودکار از طریق دکمه وسط صحنه و شمارش معکوس است؛
            // دکمه پایین در صورت نیاز برای توقف دستی حین ضبط فعال است.
            if (recording) {
              onStopRecord();
            }
          } else {
            // در مرحله گوش دادن، سایه‌زنی ۴ مرحله‌ای و مقایسه، دکمه پخش و مکث است
            togglePlay();
          }
        }}
      >
        {activeStepIndex === 2 ? (
          recording ? (
            <Square size={22} color={COLORS.white} fill={COLORS.white} />
          ) : playing ? (
            <Volume2 size={24} color={COLORS.white} />
          ) : (
            <Mic size={24} color={COLORS.white} />
          )
        ) : flowMode === 'smart_flow' && activeStepIndex === 1 ? (
          recording ? (
            <Square size={22} color={COLORS.white} fill={COLORS.white} />
          ) : playing ? (
            <Volume2 size={24} color={COLORS.white} />
          ) : (
            <Sparkles size={22} color={COLORS.white} />
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
          activeStepIndex === 1
            ? (playing ? togglePlay : onReplay)
            : activeStepIndex === 2
            ? onPlayMyRecording
            : activeStepIndex === 3
              ? () => startRecord(false)
              : onReplay
        }
      >
        {activeStepIndex === 1 ? (
          playing ? (
            <Pause size={16} color={accentColor} />
          ) : (
            <Play size={16} color={accentColor} />
          )
        ) : activeStepIndex === 3 ? (
          <RotateCcw size={16} color={accentColor} />
        ) : (
          <Play size={16} color={accentColor} />
        )}
      </TouchableOpacity>

      <TouchableOpacity style={styles.chevronBtn} onPress={onNextDialogue}>
        <ChevronRight size={20} color={COLORS.text} />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  rowReverse: { flexDirection: 'row-reverse' },
  controlsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginVertical: 10,
  },
  chevronBtn: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#F0EBE3',
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.level1,
  },
  speedPillText: {
    color: '#191C21',
    fontFamily: FONT_FAMILY.bold,
    fontSize: 12.5,
  },
  speedLadderBtn: {
    borderColor: '#C7D2FE',
    backgroundColor: '#EEF2FF',
    minWidth: 54,
    paddingHorizontal: 4,
  },
  speedLadderPillText: {
    color: '#4338CA',
    fontFamily: FONT_FAMILY.bold,
    fontSize: 11,
  },
  centerMicBtn: {
    width: 70,
    height: 70,
    borderRadius: 35,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.level2,
    elevation: 6,
  },
  centerMicBtnActive: {
    backgroundColor: '#DC2626',
    shadowColor: '#DC2626',
  },
  centerMicBtnPlaying: {
    opacity: 0.75,
  },
  smallPlayBtn: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#F0EBE3',
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.level1,
  },
  smallPlayBtnDisabled: {
    opacity: 0.35,
    backgroundColor: '#FAF7F2',
  },
});
