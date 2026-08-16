import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Eye, EyeOff, Sparkles } from 'lucide-react-native';

import { COLORS } from '../../../theme/colors';
import { FONT_FAMILY } from '../../../theme/typography';
import type { DialogueItem } from '../../../data/scenarios';
import { HighlightedDialogueText } from './HighlightedDialogueText';
import { MaskedDialogueText } from './MaskedDialogueText';
import { DialogueVocabChips } from './DialogueVocabChips';

/**
 * جعبه‌ی متن جمله: خودِ جمله (مخفی یا هایلایت‌شده)، ترجمه، دکمه‌ی نمایش/مخفی،
 * چیپ‌های لغت، و بنرهای مخصوص هر مرحله (Shadow / Compare).
 *
 * در مرحله‌ی ضبط (activeStepIndex === 2) متن پیش‌فرض مخفی است تا کاربر از
 * حفظ بگوید — با متنِ جلوی چشم، دارد می‌خواند نه شدوئینگ می‌کند. ترجمه مخفی
 * نمی‌شود چون معنی را یادآوری می‌کند بدون اینکه تلفظ را لو بدهد.
 */
export const DialogueSentenceBox: React.FC<{
  activeStepIndex: number;
  currentDialogue: DialogueItem;
  textRevealed: boolean;
  onToggleRevealText: () => void;
  onOpenLeitner: () => void;
  t: (key: string) => string;
}> = ({ activeStepIndex, currentDialogue, textRevealed, onToggleRevealText, onOpenLeitner, t }) => (
  <View style={styles.dialogueBox}>
    {activeStepIndex === 2 && !textRevealed ? (
      <MaskedDialogueText text={currentDialogue.dialogue || 'Great. Can I pay by card?'} />
    ) : (
      <HighlightedDialogueText
        text={currentDialogue.dialogue || 'Great. Can I pay by card?'}
        words={currentDialogue.words}
      />
    )}
    <Text style={styles.translationText}>{currentDialogue.translation}</Text>

    {activeStepIndex === 2 && (
      <TouchableOpacity style={styles.revealBtn} onPress={onToggleRevealText}>
        {textRevealed ? (
          <EyeOff size={13} color={COLORS.primary} />
        ) : (
          <Eye size={13} color={COLORS.primary} />
        )}
        <Text style={styles.revealBtnText}>{textRevealed ? t('hideText') : t('showText')}</Text>
      </TouchableOpacity>
    )}

    {/* لغت‌های همین جمله؛ با زدن روی هرکدام به جعبه‌ی لایتنر می‌رود */}
    <DialogueVocabChips words={currentDialogue.words} onOpenLeitner={onOpenLeitner} t={t} />

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
);

const styles = StyleSheet.create({
  dialogueBox: {
    alignItems: 'center',
    marginBottom: 10,
  },
  translationText: {
    color: COLORS.textSecondary,
    fontFamily: FONT_FAMILY.regular,
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 8,
  },
  revealBtn: {
    marginTop: 8,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: 999,
    backgroundColor: COLORS.primaryLight,
  },
  revealBtnText: {
    color: COLORS.primary,
    fontFamily: FONT_FAMILY.semiBold,
    fontSize: 11,
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
});
