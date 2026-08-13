import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { ChevronLeft, ChevronRight, Mic, Pause, Play, RotateCcw, Sparkles } from 'lucide-react-native';

import { COLORS } from '../../theme/colors';
import { FONT_FAMILY } from '../../theme/typography';
import { SHADOWS } from '../../theme/elevation';
import type { DialogueItem } from '../../data/scenarios';
import type { AudioActionCommand } from './types';

type StepKey = 'tabListen' | 'tabShadow' | 'tabRecord' | 'tabCompare';
const STEP_TABS: { num: 1 | 2 | 3 | 4; key: StepKey }[] = [
  { num: 1, key: 'tabListen' },
  { num: 2, key: 'tabShadow' },
  { num: 3, key: 'tabRecord' },
  { num: 4, key: 'tabCompare' },
];

// متن انگلیسی را می‌شکند تا اولین کلمه‌ی هدف (اگر وجود داشت) به‌صورت پیل
// هایلایت‌شده رندر شود.
const HighlightedDialogueText: React.FC<{ text: string; words?: { word: string }[] }> = ({
  text,
  words,
}) => {
  const targetWord = words && words.length > 0 ? words[0].word : null;
  if (!targetWord) return <Text style={styles.dialogueText}>{text}</Text>;

  const matchIdx = text.toLowerCase().indexOf(targetWord.toLowerCase());
  if (matchIdx === -1) return <Text style={styles.dialogueText}>{text}</Text>;

  const before = text.slice(0, matchIdx);
  const match = text.slice(matchIdx, matchIdx + targetWord.length);
  const after = text.slice(matchIdx + targetWord.length);

  return (
    <Text style={styles.dialogueText}>
      {before}
      <Text style={styles.dialogueHighlightWord}>{match}</Text>
      {after}
    </Text>
  );
};

const WaveBars: React.FC<{ active: boolean; color: string }> = ({ active, color }) => (
  <View style={styles.waveformRow}>
    {Array.from({ length: 24 }).map((_, idx) => (
      <View
        key={idx}
        style={[styles.waveBar, { height: active ? 8 + ((idx * 7) % 20) : 8, backgroundColor: color }]}
      />
    ))}
  </View>
);

interface ShadowingPracticePanelProps {
  language: string;
  t: (key: string) => string;
  activeStepIndex: number;
  onChangeStep: (stepIdx: number) => void;
  currentDialogue: DialogueItem;
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
}

/**
 * پنل تمرینِ ۴مرحله‌ای (Listen / Shadow / Record / Compare): تب‌های پیوسته،
 * متن دیالوگ با کلمه‌ی هایلایت‌شده، کارت ویوفرم، و ردیف کنترل‌های یکپارچه‌ی
 * پخش/ضبط.
 */
export const ShadowingPracticePanel: React.FC<ShadowingPracticePanelProps> = ({
  language,
  t,
  activeStepIndex,
  onChangeStep,
  currentDialogue,
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
}) => {
  const orderedStepTabs = language === 'fa' ? [...STEP_TABS].reverse() : STEP_TABS;

  return (
    <View>
      {/* Continuous 4-Step Segmented Tabs */}
      <View style={styles.segmentedTabsRow}>
        {orderedStepTabs.map((st) => {
          const stepIdx = st.num - 1;
          const active = activeStepIndex === stepIdx;
          return (
            <TouchableOpacity
              key={st.num}
              activeOpacity={0.7}
              style={styles.segmentedTab}
              onPress={() => onChangeStep(stepIdx)}
            >
              <Text style={[styles.segmentedTabText, active ? styles.segmentedTabTextActive : null]}>
                {t(st.key)}
              </Text>
              {active && <View style={styles.segmentedTabIndicator} />}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Dialogue Sentence with vocab-word highlight + translation */}
      <View style={styles.dialogueBox}>
        <HighlightedDialogueText
          text={currentDialogue.dialogue || 'Great. Can I pay by card?'}
          words={currentDialogue.words}
        />
        <Text style={styles.translationText}>{currentDialogue.translation}</Text>

        {activeStepIndex === 1 && (
          <View style={styles.shadowBannerPill}>
            <Sparkles size={14} color={COLORS.secondaryContainer} />
            <Text style={styles.shadowBannerText}>{t('repeatAlongBanner')}</Text>
          </View>
        )}

        {activeStepIndex === 3 && currentDialogue.words && currentDialogue.words.length > 0 && (
          <View style={styles.checkWordChip}>
            <Text style={styles.checkWordChipText}>
              {t('checkWordPrefix')} '{currentDialogue.words[0].word}'
            </Text>
          </View>
        )}
      </View>

      {/* Waveform Card with centered playhead */}
      <View style={styles.waveformCard}>
        {activeStepIndex === 1 ? (
          <>
            <WaveBars active color={COLORS.primary} />
            <View style={styles.waveformDivider} />
            <WaveBars active={actionCommand === 'start_record'} color={COLORS.secondary} />
          </>
        ) : activeStepIndex === 3 ? (
          <>
            <Text style={styles.compareLabel}>{t('masterAudio')}</Text>
            <WaveBars active color={COLORS.primary} />
            <Text style={[styles.compareLabel, { marginTop: 10 }]}>{t('yourRecording')}</Text>
            <WaveBars active color={COLORS.secondary} />
          </>
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

      {activeStepIndex === 2 && <Text style={styles.holdToRecordHint}>{t('holdToRecord')}</Text>}

      {/* Unified Player Controls: prev · speed · main action · secondary · next */}
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
                setActionCommand('start_record');
                setPlaying(true);
              }
            } else {
              // Steps 0 (Listen) and 3 (Compare) share a simple play/pause toggle.
              togglePlay();
            }
          }}
          onPressIn={activeStepIndex === 2 ? () => setActionCommand('start_record') : undefined}
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
          style={styles.smallPlayBtn}
          onPress={
            activeStepIndex === 2
              ? () => setActionCommand('play_recording')
              : activeStepIndex === 3
              ? () => setActionCommand('start_record')
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
    </View>
  );
};

const styles = StyleSheet.create({
  segmentedTabsRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    marginBottom: 14,
  },
  segmentedTab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentedTabText: {
    color: COLORS.textSecondary,
    fontFamily: FONT_FAMILY.semiBold,
    fontSize: 12,
  },
  segmentedTabTextActive: {
    color: COLORS.primary,
    fontFamily: FONT_FAMILY.bold,
  },
  segmentedTabIndicator: {
    marginTop: 6,
    height: 3,
    width: '70%',
    borderRadius: 2,
    backgroundColor: COLORS.primary,
  },
  dialogueBox: {
    alignItems: 'center',
    marginBottom: 10,
  },
  dialogueText: {
    color: COLORS.text,
    fontFamily: FONT_FAMILY.bold,
    fontSize: 20,
    lineHeight: 28,
    textAlign: 'center',
    marginBottom: 6,
  },
  dialogueHighlightWord: {
    color: COLORS.primary,
    backgroundColor: COLORS.primaryLight,
    borderRadius: 6,
    textDecorationLine: 'underline',
    textDecorationStyle: 'dashed',
    textDecorationColor: COLORS.primary,
  },
  translationText: {
    color: COLORS.textSecondary,
    fontFamily: FONT_FAMILY.regular,
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 8,
  },
  shadowBannerPill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    gap: 6,
    backgroundColor: COLORS.secondaryLight,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    marginBottom: 8,
  },
  shadowBannerText: {
    color: COLORS.secondaryContainer,
    fontFamily: FONT_FAMILY.semiBold,
    fontSize: 12,
  },
  checkWordChip: {
    alignSelf: 'center',
    backgroundColor: 'rgba(186, 26, 26, 0.10)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginBottom: 10,
  },
  checkWordChipText: {
    color: COLORS.error,
    fontFamily: FONT_FAMILY.semiBold,
    fontSize: 12,
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
  waveformCard: {
    width: '100%',
    backgroundColor: COLORS.backgroundSoft,
    borderRadius: 18,
    paddingVertical: 12,
    paddingHorizontal: 10,
    marginVertical: 10,
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
  compareLabel: {
    color: COLORS.textSecondary,
    fontFamily: FONT_FAMILY.semiBold,
    fontSize: 12,
    marginBottom: 4,
  },
  holdToRecordHint: {
    color: COLORS.textSecondary,
    fontFamily: FONT_FAMILY.regular,
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 6,
  },
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
});
