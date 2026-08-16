import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { COLORS } from '../../../theme/colors';
import { FONT_FAMILY } from '../../../theme/typography';

/** یک عدد نمره با برچسبش، برای ردیف خلاصه‌ی نتیجه. */
export const ScorePill: React.FC<{ label: string; value: number }> = ({ label, value }) => (
  <View style={styles.scorePill}>
    <Text style={styles.scorePillValue}>{Math.round(value)}</Text>
    <Text style={styles.scorePillLabel}>{label}</Text>
  </View>
);

const styles = StyleSheet.create({
  scorePill: {
    alignItems: 'center',
  },
  scorePillValue: {
    color: COLORS.primary,
    fontFamily: FONT_FAMILY.bold,
    fontSize: 20,
  },
  scorePillLabel: {
    color: COLORS.muted,
    fontFamily: FONT_FAMILY.regular,
    fontSize: 10,
  },
});
