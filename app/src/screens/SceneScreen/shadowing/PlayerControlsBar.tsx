import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Mic, Pause, Play, RotateCcw, SkipBack, SkipForward, Sparkles, Square, Volume2 } from 'lucide-react-native';

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
  // مجوز میکروفن را از همان لحظه ورود به تمرین می‌گیریم تا ضبط در صفحه اول بدون تأخیر شروع شود.
  const micGrantedRef = React.useRef(false);
  React.useEffect(() => {
    if (activeStepIndex === 0 || activeStepIndex === 1 || activeStepIndex === 2) {
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
      {/* سرعت پخش (سمت چپ، متقارن با میکروفون) */}
      <TouchableOpacity
        activeOpacity={0.8}
        style={[styles.outerPillBtn, isSpeedLadder && styles.speedLadderBtn]}
        onPress={toggleSpeed}
      >
        <Text style={[styles.speedPillText, isSpeedLadder && styles.speedLadderPillText]}>
          {isSpeedLadder ? `🪜 ${playbackRate}x` : `${playbackRate}x`}
        </Text>
      </TouchableOpacity>

      {/* جمله قبلی */}
      <TouchableOpacity style={styles.transportBtn} onPress={onPrevDialogue} activeOpacity={0.75}>
        <SkipBack size={20} color={COLORS.text} fill={COLORS.text} />
      </TouchableOpacity>

      {/* دکمه اصلی وسط (پخش / مکث / توقف ضبط) */}
      <TouchableOpacity
        activeOpacity={0.85}
        disabled={(activeStepIndex === 2 && playing && !recording) || (flowMode === 'smart_flow' && activeStepIndex === 1 && !recording)}
        style={[
          styles.centerPlayBtn,
          { backgroundColor: accentColor },
          recording ? styles.centerMicBtnActive : null,
          (activeStepIndex === 2 && playing && !recording) || (flowMode === 'smart_flow' && activeStepIndex === 1 && !recording)
            ? styles.centerMicBtnPlaying
            : null,
        ]}
        onPress={() => {
          if (recording) {
            onStopRecord();
          } else if (activeStepIndex === 2) {
            if (!playing) {
              startRecord(false);
            }
          } else if (flowMode === 'smart_flow' && activeStepIndex === 1) {
            // جریان هوشمند: شروع ضبط خودکار از طریق دکمه تایید صحنه
          } else {
            togglePlay();
          }
        }}
      >
        {recording ? (
          <Square size={22} color={COLORS.white} fill={COLORS.white} />
        ) : activeStepIndex === 2 ? (
          playing ? (
            <Volume2 size={24} color={COLORS.white} />
          ) : (
            <Mic size={24} color={COLORS.white} />
          )
        ) : flowMode === 'smart_flow' && activeStepIndex === 1 ? (
          playing ? (
            <Volume2 size={24} color={COLORS.white} />
          ) : (
            <Sparkles size={22} color={COLORS.white} />
          )
        ) : playing ? (
          <Pause size={24} color={COLORS.white} fill={COLORS.white} />
        ) : (
          <Play size={24} color={COLORS.white} fill={COLORS.white} style={{ marginLeft: 2 }} />
        )}
      </TouchableOpacity>

      {/* جمله بعدی */}
      <TouchableOpacity style={styles.transportBtn} onPress={onNextDialogue} activeOpacity={0.75}>
        <SkipForward size={20} color={COLORS.text} fill={COLORS.text} />
      </TouchableOpacity>

      {/* دکمه میکروفون / اکشن سریع (سمت راست، متقارن با سرعت) */}
      <TouchableOpacity
        style={[
          styles.outerPillBtn,
          activeStepIndex === 0 && !recording ? styles.micActionBtn : null,
          activeStepIndex === 0 && recording ? styles.micRecordingBtn : null,
          activeStepIndex === 2 && !hasRecordingForCurrentLine ? styles.smallPlayBtnDisabled : null,
        ]}
        disabled={activeStepIndex === 2 && !hasRecordingForCurrentLine}
        activeOpacity={0.8}
        onPress={
          activeStepIndex === 0
            ? () => (recording ? onStopRecord() : startRecord(false))
            : activeStepIndex === 1
            ? (playing ? togglePlay : onReplay)
            : activeStepIndex === 2
            ? onPlayMyRecording
            : activeStepIndex === 3
              ? () => startRecord(false)
              : onReplay
        }
      >
        {activeStepIndex === 0 ? (
          recording ? (
            <Square size={16} color="#DC2626" fill="#DC2626" />
          ) : (
            <Mic size={19} color={COLORS.primary} />
          )
        ) : activeStepIndex === 1 ? (
          playing ? (
            <Pause size={17} color={accentColor} />
          ) : (
            <RotateCcw size={17} color={accentColor} />
          )
        ) : activeStepIndex === 3 ? (
          <RotateCcw size={17} color={accentColor} />
        ) : (
          <Play size={17} color={accentColor} />
        )}
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  controlsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 6,
    marginVertical: 8,
  },
  outerPillBtn: {
    minWidth: 52,
    height: 40,
    paddingHorizontal: 10,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EDE7DD',
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.level1,
  },
  transportBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FAF7F2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  speedPillText: {
    color: '#191C21',
    fontFamily: FONT_FAMILY.bold,
    fontSize: 12,
  },
  speedLadderBtn: {
    borderColor: '#C7D2FE',
    backgroundColor: '#EEF2FF',
  },
  speedLadderPillText: {
    color: '#4338CA',
    fontFamily: FONT_FAMILY.bold,
    fontSize: 11.5,
  },
  centerPlayBtn: {
    width: 64,
    height: 64,
    borderRadius: 32,
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
  micActionBtn: {
    backgroundColor: '#FFF5F0',
    borderColor: COLORS.primary,
  },
  micRecordingBtn: {
    backgroundColor: '#FEF2F2',
    borderColor: '#DC2626',
  },
  smallPlayBtnDisabled: {
    opacity: 0.35,
    backgroundColor: '#FAF7F2',
  },
});
