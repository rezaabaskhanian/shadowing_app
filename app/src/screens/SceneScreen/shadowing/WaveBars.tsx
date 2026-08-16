import React from 'react';
import { StyleSheet, View } from 'react-native';

/** ردیف میله‌های تزئینیِ waveform؛ وقتی `active` است بلندی‌شان متغیر است. */
export const WaveBars: React.FC<{ active: boolean; color: string }> = ({ active, color }) => (
  <View style={styles.waveformRow}>
    {Array.from({ length: 24 }).map((_, idx) => (
      <View
        key={idx}
        style={[styles.waveBar, { height: active ? 8 + ((idx * 7) % 20) : 8, backgroundColor: color }]}
      />
    ))}
  </View>
);

const styles = StyleSheet.create({
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
});
