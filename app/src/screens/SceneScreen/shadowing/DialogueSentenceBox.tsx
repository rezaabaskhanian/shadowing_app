import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { AlignLeft, Eye, EyeOff, MessageCircle, Sparkles, User } from 'lucide-react-native';

import { COLORS, BORDER_RADIUS } from '../../../theme/colors';
import { FONT_FAMILY } from '../../../theme/typography';
import { SHADOWS } from '../../../theme/elevation';
import type { DialogueItem } from '../../../data/scenarios';
import type { TextDisplayMode } from '../../../data/PracticeSettingsContext';
import { DialogueSentenceContent } from './DialogueSentenceContent';
import { DialogueVocabChips } from './DialogueVocabChips';
import { DialoguePhrases } from './DialoguePhrases';
import { DialogueVerbTags } from './DialogueVerbTags';

/**
 * جعبه‌ی متن دیالوگ در استودیوی شدویینگ (Editorial Polish)
 * با فرمت کارت کتابی، سربرگ نام شخصیت، ترجمه گرم، دکمه آشکارسازی و لایتنر
 */
export const DialogueSentenceBox: React.FC<{
  activeStepIndex: number;
  currentDialogue: DialogueItem;
  textRevealed: boolean;
  onToggleRevealText: () => void;
  onOpenLeitner: () => void;
  masterPositionSeconds?: number;
  textDisplayMode: TextDisplayMode;
  onChangeTextDisplayMode: (mode: TextDisplayMode) => void;
  accentColor: string;
  accentLightColor: string;
  rtl?: boolean;
  t: (key: string) => string;
}> = ({
  activeStepIndex,
  currentDialogue,
  textRevealed,
  onToggleRevealText,
  onOpenLeitner,
  masterPositionSeconds,
  textDisplayMode,
  onChangeTextDisplayMode,
  accentColor,
  accentLightColor,
  rtl = false,
  t,
}) => {
  const speakerName = currentDialogue.speaker || '';

  return (
    <View style={styles.cardContainer}>
      {/* سربرگ کارت: نام گوینده + سوئیچ حالت حباب/کارت */}
      <View style={[styles.headerRow, rtl && styles.rowReverse]}>
        {speakerName ? (
          <View style={[styles.speakerBadge, rtl && styles.rowReverse]}>
            <View style={[styles.speakerDot, { backgroundColor: accentColor }]} />
            <Text style={styles.speakerText}>{speakerName}</Text>
          </View>
        ) : (
          <View style={{ width: 1 }} />
        )}

        <View style={[styles.displayModeRow, rtl && styles.rowReverse]}>
          <TouchableOpacity
            style={[styles.displayModeBtn, textDisplayMode === 'bubble' && styles.displayModeBtnOn]}
            onPress={() => onChangeTextDisplayMode('bubble')}
            activeOpacity={0.8}
          >
            <MessageCircle
              size={12}
              color={textDisplayMode === 'bubble' ? accentColor : '#8E95A5'}
            />
            <Text
              style={[styles.displayModeBtnText, textDisplayMode === 'bubble' && { color: accentColor }]}
            >
              {t('textInBubble')}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.displayModeBtn, textDisplayMode === 'card' && styles.displayModeBtnOn]}
            onPress={() => onChangeTextDisplayMode('card')}
            activeOpacity={0.8}
          >
            <AlignLeft size={12} color={textDisplayMode === 'card' ? accentColor : '#8E95A5'} />
            <Text
              style={[styles.displayModeBtnText, textDisplayMode === 'card' && { color: accentColor }]}
            >
              {t('textInCard')}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* محتوای جمله انگلیسی */}
      {textDisplayMode === 'card' && (
        <View style={styles.sentenceWrap}>
          <DialogueSentenceContent
            activeStepIndex={activeStepIndex}
            currentDialogue={currentDialogue}
            textRevealed={textRevealed}
            masterPositionSeconds={masterPositionSeconds}
          />
        </View>
      )}

      {/* ترجمه فارسی */}
      {!!currentDialogue.translation && (
        <Text
          style={[
            styles.translationText,
            activeStepIndex === 2 && !textRevealed && styles.translationRecall,
          ]}
        >
          {currentDialogue.translation}
        </Text>
      )}

      {/* دکمه آشکارسازی در مرحله ضبط */}
      {activeStepIndex === 2 && (
        <TouchableOpacity
          style={[styles.revealBtn, { backgroundColor: accentLightColor }]}
          onPress={onToggleRevealText}
          activeOpacity={0.85}
        >
          {textRevealed ? (
            <EyeOff size={14} color={accentColor} />
          ) : (
            <Eye size={14} color={accentColor} />
          )}
          <Text style={[styles.revealBtnText, { color: accentColor }]}>
            {textRevealed ? t('hideText') : t('showText')}
          </Text>
        </TouchableOpacity>
      )}
      {activeStepIndex === 2 && !textRevealed && (
        <Text style={styles.noXpHint}>{t('showTextNoXpHint')}</Text>
      )}

      {/* واژگان کلیدی دیالوگ */}
      {activeStepIndex !== 2 && (
        <DialogueVocabChips
          words={currentDialogue.words}
          onOpenLeitner={onOpenLeitner}
          accentColor={accentColor}
          accentLightColor={accentLightColor}
          rtl={rtl}
          t={t}
        />
      )}

      {/* اصطلاحات دیالوگ */}
      {activeStepIndex !== 2 && (
        <DialoguePhrases
          phrases={currentDialogue.phrases}
          sentence={currentDialogue.dialogue}
          accentColor={accentColor}
          t={t}
        />
      )}

      {/* افعال چندمعنایی */}
      {activeStepIndex !== 2 && (
        <DialogueVerbTags
          dialogueId={currentDialogue.dialogueId}
          accentColor={accentColor}
          accentLightColor={accentLightColor}
          t={t}
        />
      )}

      {/* بنر راهنمای شدویینگ هم‌زمان در مرحله ۲ */}
      {activeStepIndex === 1 && (
        <View style={[styles.shadowBannerPill, { backgroundColor: accentLightColor }]}>
          <Sparkles size={14} color={accentColor} />
          <Text style={[styles.shadowBannerText, { color: accentColor }]}>
            {t('repeatAlongBanner')}
          </Text>
        </View>
      )}

      {/* بررسی واژه ویژه در مرحله مقایسه */}
      {activeStepIndex === 3 && currentDialogue.words && currentDialogue.words.length > 0 && (
        <View style={styles.checkWordChip}>
          <Text style={styles.checkWordChipText}>
            {t('checkWordPrefix')} '{currentDialogue.words[0].word}'
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#F0EBE3',
    padding: 18,
    marginBottom: 12,
    ...SHADOWS.level1,
  },
  rowReverse: {
    flexDirection: 'row-reverse',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  speakerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FAF7F2',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: BORDER_RADIUS.full,
    borderWidth: 1,
    borderColor: '#F0EBE3',
  },
  speakerDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  speakerText: {
    fontFamily: FONT_FAMILY.bold,
    fontSize: 12,
    color: '#191C21',
  },
  displayModeRow: {
    flexDirection: 'row',
    backgroundColor: '#F3EFE6',
    borderRadius: BORDER_RADIUS.full,
    padding: 2,
    gap: 2,
  },
  displayModeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: BORDER_RADIUS.full,
  },
  displayModeBtnOn: {
    backgroundColor: '#FFFFFF',
    ...SHADOWS.level1,
  },
  displayModeBtnText: {
    fontFamily: FONT_FAMILY.medium,
    fontSize: 11,
    color: '#8E95A5',
  },
  sentenceWrap: {
    marginVertical: 4,
    alignItems: 'center',
  },
  translationText: {
    color: '#697082',
    fontFamily: FONT_FAMILY.regular,
    fontSize: 15,
    lineHeight: 23,
    textAlign: 'center',
    marginTop: 6,
    marginBottom: 10,
  },
  translationRecall: {
    color: '#191C21',
    fontFamily: FONT_FAMILY.bold,
    fontSize: 20,
    marginTop: 6,
    marginBottom: 10,
  },
  revealBtn: {
    marginTop: 8,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 18,
    borderRadius: BORDER_RADIUS.full,
  },
  revealBtnText: {
    fontFamily: FONT_FAMILY.bold,
    fontSize: 12.5,
  },
  noXpHint: {
    marginTop: 4,
    alignSelf: 'center',
    color: '#9CA3AF',
    fontFamily: FONT_FAMILY.regular,
    fontSize: 11,
  },
  shadowBannerPill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: BORDER_RADIUS.full,
    marginTop: 8,
  },
  shadowBannerText: {
    fontFamily: FONT_FAMILY.semiBold,
    fontSize: 12,
  },
  checkWordChip: {
    alignSelf: 'center',
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FEE2E2',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginTop: 8,
  },
  checkWordChipText: {
    color: '#DC2626',
    fontFamily: FONT_FAMILY.semiBold,
    fontSize: 12,
  },
});
