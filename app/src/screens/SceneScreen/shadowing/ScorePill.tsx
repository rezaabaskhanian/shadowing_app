import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { COLORS } from '../../../theme/colors';
import { FONT_FAMILY } from '../../../theme/typography';

/** رنگ نمره طبق خودِ عدد — تا این پیل واقعاً بازخورد بدهد، نه فقط یک عدد
 * همیشه بنفش کنار یک برچسب خنثی. */
const scoreColor = (value: number): string => {
  if (value >= 80) return COLORS.tertiary;
  if (value >= 50) return COLORS.warningDeep;
  return COLORS.error;
};

/** یک عدد نمره با برچسبش، برای ردیف خلاصه‌ی نتیجه. */
export const ScorePill: React.FC<{ label: string; value: number }> = ({ label, value }) => (
  <View style={styles.scorePill}>
    <Text style={[styles.scorePillValue, { color: scoreColor(value) }]}>{Math.round(value)}</Text>
    <Text style={styles.scorePillLabel}>{label}</Text>
  </View>
);

const styles = StyleSheet.create({
  scorePill: {
    alignItems: 'center',
  },
  scorePillValue: {
    fontFamily: FONT_FAMILY.bold,
    fontSize: 24,
  },
  scorePillLabel: {
    marginTop: 4,
    color: COLORS.textSecondary,
    fontFamily: FONT_FAMILY.medium,
    fontSize: 11,
  },
});
