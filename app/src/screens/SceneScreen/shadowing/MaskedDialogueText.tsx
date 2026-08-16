import React from 'react';
import { StyleSheet, Text } from 'react-native';

import { COLORS } from '../../../theme/colors';
import { FONT_FAMILY } from '../../../theme/typography';

/**
 * متن جمله در حالت مخفی: به‌جای هر کلمه چند خط تیره با همان طول تقریبی.
 *
 * کاملاً حذفش نمی‌کنیم چون کاربر باید بداند جمله چند کلمه است و هر کلمه چقدر
 * بلند است — این همان چیزی است که یادآوری از حافظه را ممکن می‌کند بدون اینکه
 * جواب را لو بدهد.
 */
export const MaskedDialogueText: React.FC<{ text: string }> = ({ text }) => (
  <Text style={styles.maskedText}>
    {text
      .split(/\s+/)
      .filter(Boolean)
      .map((w) => '_'.repeat(Math.min(w.replace(/[^A-Za-z']/g, '').length || 2, 9)))
      .join('  ')}
  </Text>
);

const styles = StyleSheet.create({
  maskedText: {
    color: COLORS.border,
    fontFamily: FONT_FAMILY.bold,
    fontSize: 18,
    letterSpacing: 1,
    textAlign: 'center',
    writingDirection: 'ltr',
  },
});
