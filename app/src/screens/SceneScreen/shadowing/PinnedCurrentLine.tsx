import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { COLORS } from '../../../theme/colors';
import { FONT_FAMILY } from '../../../theme/typography';
import type { DialogueItem } from '../../../data/scenarios';
import { MaskedDialogueText } from './MaskedDialogueText';

/**
 * جمله‌ی جاری، چسبیده به بالای نوار کنترل/دکمه‌ی ضبط.
 *
 * فقط در مرحله‌ی ضبط لازم است: چون لیست جمله‌ها (`RecordingsList`) می‌تواند
 * طولانی شود و جعبه‌ی اصلی جمله را از دید ببرد، این کپی‌ی کوچک همیشه پیدا
 * می‌ماند — بدون اسکرول کاربر می‌داند دقیقاً چه چیزی را باید ضبط کند.
 */
export const PinnedCurrentLine: React.FC<{
  currentDialogue: DialogueItem;
  textRevealed: boolean;
}> = ({ currentDialogue, textRevealed }) => (
  <View style={styles.wrap}>
    {textRevealed ? (
      <Text style={styles.text} numberOfLines={2}>
        “{currentDialogue.dialogue}”
      </Text>
    ) : (
      <MaskedDialogueText text={currentDialogue.dialogue || ''} />
    )}
  </View>
);

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    paddingTop: 6,
    paddingBottom: 2,
  },
  text: {
    color: COLORS.text,
    fontFamily: FONT_FAMILY.semiBold,
    fontSize: 15,
    lineHeight: 20,
    textAlign: 'center',
    writingDirection: 'ltr',
  },
});
