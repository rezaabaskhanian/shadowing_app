import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { ChevronRight, Repeat } from 'lucide-react-native';

import { COLORS } from '../../../theme/colors';
import { FONT_FAMILY } from '../../../theme/typography';

/**
 * ردیف پیشرفت مرحله: در مرحله‌های خودکار (Listen/Shadow) شمارنده‌ی دور را
 * نشان می‌دهد، در مرحله‌های دستی (Record/Compare) فقط یادآوری می‌کند که
 * کاربر با سرعت خودش پیش می‌رود.
 *
 * سمت راست همیشه دکمه‌ی «مرحله بعد» است — راه فرار: تکرارِ خودکار پیشنهاد
 * است نه اجبار و کاربر هر لحظه می‌تواند جلو برود.
 */
export const RepeatProgressRow: React.FC<{
  autoRepeat: boolean;
  repeatCount: number;
  totalRepeats: number;
  onNextStep: () => void;
  t: (key: string) => string;
}> = ({ autoRepeat, repeatCount, totalRepeats, onNextStep, t }) => {
  // در حالت بی‌نهایت شمارنده‌ی نقطه‌ای معنی ندارد و فقط عدد دور را نشان می‌دهیم.
  const unlimited = totalRepeats === 0;

  return (
    <View style={styles.repeatRow}>
      {autoRepeat ? (
        <View style={styles.repeatCounter}>
          <Repeat size={13} color={COLORS.textSecondary} />
          <Text style={styles.repeatText}>
            {repeatCount}/{unlimited ? '∞' : totalRepeats}
          </Text>
          {!unlimited && (
            <View style={styles.repeatDotsRow}>
              {Array.from({ length: totalRepeats }).map((_, idx) => (
                <View
                  key={idx}
                  style={[styles.repeatDot, idx < repeatCount ? styles.repeatDotActive : null]}
                />
              ))}
            </View>
          )}
          <Text style={styles.repeatHintText}>
            {unlimited ? t('unlimitedRepeatHint') : t('autoRepeatHint')}
          </Text>
        </View>
      ) : (
        <Text style={styles.repeatHintText}>{t('selfPacedHint')}</Text>
      )}

      <TouchableOpacity style={styles.nextStepBtn} activeOpacity={0.8} onPress={onNextStep}>
        <Text style={styles.nextStepBtnText}>{t('nextStep')}</Text>
        <ChevronRight size={14} color={COLORS.primary} />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  repeatRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 8,
  },
  repeatCounter: {
    flexShrink: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  repeatHintText: {
    flexShrink: 1,
    color: COLORS.textSecondary,
    fontFamily: FONT_FAMILY.regular,
    fontSize: 11,
  },
  repeatText: {
    color: COLORS.textSecondary,
    fontFamily: FONT_FAMILY.semiBold,
    fontSize: 12,
  },
  repeatDotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginLeft: 2,
  },
  repeatDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.border,
  },
  repeatDotActive: {
    backgroundColor: COLORS.primary,
  },
  nextStepBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: COLORS.primaryLight,
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  nextStepBtnText: {
    color: COLORS.primary,
    fontFamily: FONT_FAMILY.semiBold,
    fontSize: 12,
  },
});
