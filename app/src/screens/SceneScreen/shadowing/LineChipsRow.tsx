import React, { useEffect, useRef } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { Lock } from 'lucide-react-native';

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
  /**
   * فقط در مرحله‌ی مقایسه true است: از اولین جمله‌ی ضبط‌نشده به بعد، حتی
   * جمله‌های ضبط‌شده‌ی جداافتاده (مثلاً ۵ وقتی ۴ ضبط نشده) قفل نشان داده
   * می‌شوند — چون انتخابشان هم مسدود است (رجوع کن به `selectLine` در
   * SceneScreen).
   */
  sequentialLockEnabled?: boolean;
  /** رنگ اختصاصیِ مرحله‌ی فعلی (Record نارنجی، Compare سبز و ...) برای چیپِ انتخاب‌شده. */
  accentColor?: string;
  /** نسخه‌ی کم‌رنگِ همون accentColor، برای پس‌زمینه‌ی نرمِ چیپِ انتخاب‌شده. */
  accentLightColor?: string;
}> = ({
  lineCount,
  recordedLines,
  activeLineIndex,
  onSelectLine,
  sequentialLockEnabled,
  accentColor = COLORS.primary,
  accentLightColor = COLORS.primaryLight,
}) => {
  const scrollRef = useRef<ScrollView>(null);

  let firstUnrecorded = lineCount;
  for (let i = 0; i < lineCount; i++) {
    if (!recordedLines.includes(i)) {
      firstUnrecorded = i;
      break;
    }
  }

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
        const locked = !!sequentialLockEnabled && idx >= firstUnrecorded;
        return (
          <TouchableOpacity
            key={idx}
            style={[
              styles.chip,
              recorded ? styles.chipRecorded : null,
              active ? [styles.chipActiveBase, { borderColor: accentColor, backgroundColor: accentLightColor }] : null,
              locked ? styles.chipLocked : null,
            ]}
            onPress={() => onSelectLine(idx)}
          >
            {locked ? (
              <Lock size={12} color={COLORS.muted} />
            ) : (
              <Text
                style={[
                  styles.chipText,
                  recorded ? styles.chipTextRecorded : null,
                  active ? { color: accentColor } : null,
                ]}
              >
                {idx + 1}
              </Text>
            )}
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
  chipActiveBase: {
    borderWidth: 2,
  },
  chipLocked: {
    backgroundColor: COLORS.surfaceLight,
    borderColor: COLORS.border,
    opacity: 0.6,
  },
  chipText: {
    color: COLORS.muted,
    fontFamily: FONT_FAMILY.semiBold,
    fontSize: 12,
  },
  chipTextRecorded: {
    color: COLORS.tertiary,
  },
});
