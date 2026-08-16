import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Check } from 'lucide-react-native';

import { COLORS } from '../../../theme/colors';
import { FONT_FAMILY } from '../../../theme/typography';

type StepKey = 'tabListen' | 'tabShadow' | 'tabRecord' | 'tabCompare';
const STEP_TABS: { num: 1 | 2 | 3 | 4; key: StepKey }[] = [
  { num: 1, key: 'tabListen' },
  { num: 2, key: 'tabShadow' },
  { num: 3, key: 'tabRecord' },
  { num: 4, key: 'tabCompare' },
];

/**
 * نوار تب‌های پیوسته‌ی ۴مرحله. در فارسی برعکس نمایش داده می‌شود (RTL) چون
 * ترتیب چیدمان بصری باید با جهت متن رابط هماهنگ باشد، ولی `activeStepIndex`
 * که به بیرون می‌رود همیشه بر همان شماره‌گذاری منطقی ۰..۳ است.
 */
export const StepTabs: React.FC<{
  language: string;
  activeStepIndex: number;
  completedSteps: number[];
  onChangeStep: (stepIdx: number) => void;
  t: (key: string) => string;
}> = ({ language, activeStepIndex, completedSteps, onChangeStep, t }) => {
  const orderedStepTabs = language === 'fa' ? [...STEP_TABS].reverse() : STEP_TABS;

  return (
    <View style={styles.segmentedTabsRow}>
      {orderedStepTabs.map((st) => {
        const stepIdx = st.num - 1;
        const active = activeStepIndex === stepIdx;
        const done = completedSteps.includes(stepIdx);
        return (
          <TouchableOpacity
            key={st.num}
            activeOpacity={0.7}
            style={styles.segmentedTab}
            onPress={() => onChangeStep(stepIdx)}
          >
            <View style={styles.segmentedTabLabelRow}>
              {done && <Check size={12} color={COLORS.tertiary} />}
              <Text style={[styles.segmentedTabText, active ? styles.segmentedTabTextActive : null]}>
                {t(st.key)}
              </Text>
            </View>
            {active && <View style={styles.segmentedTabIndicator} />}
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  segmentedTabsRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    marginBottom: 14,
  },
  segmentedTab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentedTabLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  segmentedTabText: {
    color: COLORS.textSecondary,
    fontFamily: FONT_FAMILY.semiBold,
    fontSize: 12,
  },
  segmentedTabTextActive: {
    color: COLORS.primary,
    fontFamily: FONT_FAMILY.bold,
  },
  segmentedTabIndicator: {
    marginTop: 6,
    height: 3,
    width: '70%',
    borderRadius: 2,
    backgroundColor: COLORS.primary,
  },
});
