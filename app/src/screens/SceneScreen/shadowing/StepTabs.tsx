import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Check } from 'lucide-react-native';

import { COLORS } from '../../../theme/colors';
import { FONT_FAMILY } from '../../../theme/typography';
import { SHADOWS } from '../../../theme/elevation';

type StepKey = 'tabListen' | 'tabShadow' | 'tabRecord' | 'tabCompare';
const STEP_TABS: { num: 1 | 2 | 3 | 4; key: StepKey }[] = [
  { num: 1, key: 'tabListen' },
  { num: 2, key: 'tabShadow' },
  { num: 3, key: 'tabRecord' },
  { num: 4, key: 'tabCompare' },
];

const STEP_LISTEN_BLUE = '#2453DB';
const STEP_RECORD_ORANGE = COLORS.primary;
const STEP_COMPARE_GREEN = '#059669';

export const STEP_ACCENT_COLOR: Record<number, string> = {
  0: STEP_LISTEN_BLUE,
  1: COLORS.primary,
  2: STEP_RECORD_ORANGE,
  3: STEP_COMPARE_GREEN,
};

export const STEP_ACCENT_LIGHT_COLOR: Record<number, string> = {
  0: 'rgba(36, 83, 219, 0.10)',
  1: 'rgba(255, 100, 34, 0.12)',
  2: 'rgba(255, 100, 34, 0.12)',
  3: 'rgba(5, 150, 105, 0.12)',
};

/**
 * نوار تب‌های پیوسته‌ی ۴ مرحله (Listen / Shadow / Record / Compare)
 * طراحی مدرن با پیل‌های نرم و برجسته (Segmented Pill Tabs)
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
    <View style={styles.segmentedContainer}>
      {orderedStepTabs.map((st) => {
        const stepIdx = st.num - 1;
        const active = activeStepIndex === stepIdx;
        const done = completedSteps.includes(stepIdx);
        const accentColor = STEP_ACCENT_COLOR[stepIdx] ?? COLORS.primary;

        return (
          <TouchableOpacity
            key={st.num}
            activeOpacity={0.8}
            style={[styles.segmentedTab, active && styles.segmentedTabActive]}
            onPress={() => onChangeStep(stepIdx)}
          >
            {done ? (
              <Check size={13} color="#059669" strokeWidth={2.5} />
            ) : (
              <View
                style={[
                  styles.stepDot,
                  { backgroundColor: active ? accentColor : '#C5BEB3' },
                ]}
              />
            )}
            <Text
              style={[
                styles.segmentedTabText,
                active && [styles.segmentedTabTextActive, { color: accentColor }],
              ]}
              numberOfLines={1}
            >
              {t(st.key)}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  segmentedContainer: {
    flexDirection: 'row',
    backgroundColor: '#F3EFE6',
    borderRadius: 18,
    padding: 4,
    marginBottom: 16,
    gap: 4,
  },
  segmentedTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 14,
    gap: 5,
  },
  segmentedTabActive: {
    backgroundColor: '#FFFFFF',
    ...SHADOWS.level1,
  },
  stepDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  segmentedTabText: {
    color: '#7A7265',
    fontFamily: FONT_FAMILY.medium,
    fontSize: 12.5,
  },
  segmentedTabTextActive: {
    fontFamily: FONT_FAMILY.bold,
  },
});
