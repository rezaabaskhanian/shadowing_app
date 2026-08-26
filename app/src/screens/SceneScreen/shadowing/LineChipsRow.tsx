import React, { useEffect, useRef } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity } from 'react-native';

import { COLORS } from '../../../theme/colors';
import { FONT_FAMILY } from '../../../theme/typography';

const CHIP_SIZE = 30;
const CHIP_GAP = 8;
const CHIP_PITCH = CHIP_SIZE + CHIP_GAP;

/**
 * نوار افقیِ شماره‌ی جمله‌ها، همیشه بالای صفحه و بدون نیاز به اسکرول.
 *
 * قبل از این، تنها راهِ رفتن سراغ یک جمله‌ی مشخص، اسکرول‌کردنِ کل پنل تا
 * `RecordingsList` در پایین صفحه بود — برای صحنه‌های پرجمله همین یک پرش
 * ساده را به یک کار چندمرحله‌ای تبدیل می‌کرد. این نوار با یک لمس مستقیم
 * می‌پرد؛ `RecordingsList` هم می‌ماند چون برای پخشِ تکی/پخشِ همه لازم است.
 */
export const LineChipsRow: React.FC<{
  lineCount: number;
  recordedLines: number[];
  activeLineIndex: number;
  onSelectLine: (index: number) => void;
}> = ({ lineCount, recordedLines, activeLineIndex, onSelectLine }) => {
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    // چیپِ فعال را وسطِ نوار نگه می‌داریم تا با جلورفتنِ جمله‌ها (دستی یا با
    // «پخش همه») کاربر مجبور نباشد خودش این نوار را هم اسکرول کند.
    const offset = Math.max(0, activeLineIndex * CHIP_PITCH - CHIP_PITCH * 2);
    scrollRef.current?.scrollTo({ x: offset, animated: true });
  }, [activeLineIndex]);

  return (
    <ScrollView
      ref={scrollRef}
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.row}
      contentContainerStyle={styles.rowContent}
    >
      {Array.from({ length: lineCount }).map((_, idx) => {
        const recorded = recordedLines.includes(idx);
        const active = idx === activeLineIndex;
        return (
          <TouchableOpacity
            key={idx}
            style={[
              styles.chip,
              recorded ? styles.chipRecorded : null,
              active ? styles.chipActive : null,
            ]}
            onPress={() => onSelectLine(idx)}
          >
            <Text
              style={[
                styles.chipText,
                recorded ? styles.chipTextRecorded : null,
                active ? styles.chipTextActive : null,
              ]}
            >
              {idx + 1}
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  row: {
    marginBottom: 8,
  },
  rowContent: {
    flexDirection: 'row',
    gap: CHIP_GAP,
    paddingHorizontal: 2,
    paddingVertical: 2,
  },
  chip: {
    width: CHIP_SIZE,
    height: CHIP_SIZE,
    borderRadius: CHIP_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  chipRecorded: {
    backgroundColor: COLORS.tertiaryLight,
    borderColor: COLORS.tertiary,
  },
  chipActive: {
    borderColor: COLORS.primary,
    borderWidth: 2,
    backgroundColor: COLORS.primaryLight,
  },
  chipText: {
    color: COLORS.muted,
    fontFamily: FONT_FAMILY.semiBold,
    fontSize: 12,
  },
  chipTextRecorded: {
    color: COLORS.tertiary,
  },
  chipTextActive: {
    color: COLORS.primary,
  },
});
