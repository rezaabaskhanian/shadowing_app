import React from 'react';
import { StyleSheet, Text } from 'react-native';

import { COLORS } from '../../../theme/colors';
import { FONT_FAMILY } from '../../../theme/typography';

/**
 * متن انگلیسیِ جمله را می‌شکند تا اولین کلمه‌ی هدف (اگر وجود داشت) به‌صورت
 * پیل هایلایت‌شده رندر شود.
 */
export const HighlightedDialogueText: React.FC<{ text: string; words?: { word: string }[] }> = ({
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

const styles = StyleSheet.create({
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
});
