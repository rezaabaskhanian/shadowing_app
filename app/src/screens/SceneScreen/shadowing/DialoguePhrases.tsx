import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { COLORS } from '../../../theme/colors';
import { FONT_FAMILY } from '../../../theme/typography';
import type { PhraseEntry } from '../../../data/scenarios';

/**
 * اصطلاح/عبارت‌های (idiom / phrase) همین جمله را نشان می‌دهد. اختیاری است:
 * اگر ادمین چیزی نگذاشته باشد هیچ‌چیز (حتی عنوان) رندر نمی‌شود.
 */
export const DialoguePhrases: React.FC<{
  phrases?: PhraseEntry[];
  accentColor: string;
  t: (key: string) => string;
}> = ({ phrases, accentColor, t }) => {
  if (!phrases || phrases.length === 0) return null;

  return (
    <View style={styles.block}>
      <Text style={[styles.title, { color: accentColor }]}>{t('dialoguePhrasesTitle')}</Text>
      {phrases.map((p, idx) => (
        <View key={`${p.phrase}-${idx}`} style={[styles.row, idx > 0 && styles.rowBorder]}>
          <Text style={styles.phrase}>{p.phrase}</Text>
          {!!p.meaning && <Text style={styles.meaning}>{p.meaning}</Text>}
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  block: {
    alignSelf: 'stretch',
    backgroundColor: COLORS.surfaceLight,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 10,
  },
  title: {
    fontFamily: FONT_FAMILY.semiBold,
    fontSize: 12,
    marginBottom: 6,
  },
  row: {
    paddingVertical: 4,
    gap: 2,
  },
  rowBorder: {
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  phrase: {
    color: COLORS.text,
    fontFamily: FONT_FAMILY.bold,
    fontSize: 14,
  },
  meaning: {
    color: COLORS.textSecondary,
    fontFamily: FONT_FAMILY.regular,
    fontSize: 13,
  },
});
