import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { AlignLeft, Eye, EyeOff, MessageCircle, Sparkles } from 'lucide-react-native';

import { COLORS } from '../../../theme/colors';
import { FONT_FAMILY } from '../../../theme/typography';
import type { DialogueItem } from '../../../data/scenarios';
import type { TextDisplayMode } from '../../../data/PracticeSettingsContext';
import { DialogueSentenceContent } from './DialogueSentenceContent';
import { DialogueVocabChips } from './DialogueVocabChips';
import { DialoguePhrases } from './DialoguePhrases';
import { DialogueVerbTags } from './DialogueVerbTags';

/**
 * جعبه‌ی متن جمله: خودِ جمله (مخفی یا هایلایت‌شده — فقط وقتی textDisplayMode
 * روی «card» است، وگرنه همین جمله داخل حباب بالای شخصیت است)، ترجمه، دکمه‌ی
 * نمایش/مخفی، چیپ‌های لغت، بنرهای مخصوص هر مرحله، و دکمه‌ی جابه‌جایی حباب/کارت.
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
  /** موقعیتِ زنده‌ی پخشِ صدای مرجع (ثانیه)، برای هایلایتِ کلمه‌به‌کلمه. */
  masterPositionSeconds?: number;
  textDisplayMode: TextDisplayMode;
  onChangeTextDisplayMode: (mode: TextDisplayMode) => void;
  /** رنگ اختصاصیِ مرحله‌ی فعلی، برای دکمه‌ها/بنرهای فعالِ همین جعبه. */
  accentColor: string;
  accentLightColor: string;
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
  t,
}) => (
  <View style={styles.dialogueBox}>
    {/* جمله یا این‌جا یا داخل حباب بالای شخصیت است، هرگز هر دو با هم؛ این
        دکمه انتخاب می‌کند کدام‌یک. */}
    <View style={styles.displayModeRow}>
      <TouchableOpacity
        style={[styles.displayModeBtn, textDisplayMode === 'bubble' && { backgroundColor: accentLightColor }]}
        onPress={() => onChangeTextDisplayMode('bubble')}
      >
        <MessageCircle
          size={13}
          color={textDisplayMode === 'bubble' ? accentColor : COLORS.muted}
        />
        <Text
          style={[styles.displayModeBtnText, textDisplayMode === 'bubble' && { color: accentColor }]}
        >
          {t('textInBubble')}
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.displayModeBtn, textDisplayMode === 'card' && { backgroundColor: accentLightColor }]}
        onPress={() => onChangeTextDisplayMode('card')}
      >
        <AlignLeft size={13} color={textDisplayMode === 'card' ? accentColor : COLORS.muted} />
        <Text style={[styles.displayModeBtnText, textDisplayMode === 'card' && { color: accentColor }]}>
          {t('textInCard')}
        </Text>
      </TouchableOpacity>
    </View>

    {textDisplayMode === 'card' && (
      <DialogueSentenceContent
        activeStepIndex={activeStepIndex}
        currentDialogue={currentDialogue}
        textRevealed={textRevealed}
        masterPositionSeconds={masterPositionSeconds}
      />
    )}
    <Text style={styles.translationText}>{currentDialogue.translation}</Text>

    {activeStepIndex === 2 && (
      <TouchableOpacity style={[styles.revealBtn, { backgroundColor: accentLightColor }]} onPress={onToggleRevealText}>
        {textRevealed ? (
          <EyeOff size={13} color={accentColor} />
        ) : (
          <Eye size={13} color={accentColor} />
        )}
        <Text style={[styles.revealBtnText, { color: accentColor }]}>{textRevealed ? t('hideText') : t('showText')}</Text>
      </TouchableOpacity>
    )}
    {activeStepIndex === 2 && !textRevealed && (
      <Text style={styles.noXpHint}>{t('showTextNoXpHint')}</Text>
    )}

    {/* لغت‌های همین جمله؛ با زدن روی هرکدام به جعبه‌ی لایتنر می‌رود.
        در مرحله‌ی ضبط نمایش داده نمی‌شود تا حواس کاربر از حفظ‌گویی پرت نشود. */}
    {activeStepIndex !== 2 && (
      <DialogueVocabChips
        words={currentDialogue.words}
        onOpenLeitner={onOpenLeitner}
        accentColor={accentColor}
        accentLightColor={accentLightColor}
        t={t}
      />
    )}

    {/* اصطلاح/عبارت‌های همین جمله — فقط اگر ادمین چیزی گذاشته باشد؛ خالی = هیچ نمایشی */}
    {activeStepIndex !== 2 && (
      <DialoguePhrases phrases={currentDialogue.phrases} accentColor={accentColor} t={t} />
    )}

    {/* فعل چندمعنایی این جمله (مثلاً «get این‌جا یعنی رسیدن») — به صفحه‌ی فعل می‌رود */}
    {activeStepIndex !== 2 && (
      <DialogueVerbTags
        dialogueId={currentDialogue.dialogueId}
        accentColor={accentColor}
        accentLightColor={accentLightColor}
        t={t}
      />
    )}

    {activeStepIndex === 1 && (
      <View style={[styles.shadowBannerPill, { backgroundColor: accentLightColor }]}>
        <Sparkles size={14} color={accentColor} />
        <Text style={[styles.shadowBannerText, { color: accentColor }]}>{t('repeatAlongBanner')}</Text>
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
  displayModeRow: {
    flexDirection: 'row',
    alignSelf: 'center',
    gap: 6,
    marginBottom: 8,
  },
  displayModeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 999,
    backgroundColor: COLORS.surfaceLight,
  },
  displayModeBtnText: {
    color: COLORS.muted,
    fontFamily: FONT_FAMILY.semiBold,
    fontSize: 10,
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
  },
  revealBtnText: {
    fontFamily: FONT_FAMILY.semiBold,
    fontSize: 11,
  },
  noXpHint: {
    marginTop: 4,
    alignSelf: 'center',
    color: COLORS.muted,
    fontFamily: FONT_FAMILY.regular,
    fontSize: 10,
  },
  shadowBannerPill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    marginBottom: 8,
  },
  shadowBannerText: {
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
