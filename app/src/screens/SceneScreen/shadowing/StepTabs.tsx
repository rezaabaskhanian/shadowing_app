import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Check, HelpCircle, Mic, Sparkles, Volume2 } from 'lucide-react-native';

import { COLORS } from '../../../theme/colors';
import { FONT_FAMILY } from '../../../theme/typography';
import { SHADOWS } from '../../../theme/elevation';
import type { PracticeFlowMode } from '../../../data/PracticeSettingsContext';

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

interface SmartTabItem {
  id: 'listen' | 'shadow' | 'score';
  stepIdx: number;
  label: string;
  icon: typeof Volume2;
  color: string;
}

const SMART_TABS: SmartTabItem[] = [
  { id: 'listen', stepIdx: 0, label: '۱. شنیدن کل داستان', icon: Volume2, color: '#2563EB' },
  { id: 'shadow', stepIdx: 1, label: '۲. سایه‌زنی هوشمند', icon: Mic, color: COLORS.primary },
];

/**
 * نوار بالای تمرین:
 *  - سوئیچ بین «سایه‌زنی هوشمند» (جریان پیوسته ۳ فازی) و «۴ مرحله‌ای سنتی»
 *  - در حالت هوشمند: تب‌های لمسی ۳ مرحله (شنیدن ➔ سایه و ضبط ➔ نمره AI)
 *  - در حالت سنتی: تب‌های ۴گانه Listen / Shadow / Record / Compare
 */
export const StepTabs: React.FC<{
  language: string;
  activeStepIndex: number;
  completedSteps: number[];
  onChangeStep: (stepIdx: number) => void;
  flowMode?: PracticeFlowMode;
  onChangeFlowMode?: (mode: PracticeFlowMode) => void;
  smartPhase?: 'listen' | 'shadow' | 'score';
  onOpenGuide?: () => void;
  t: (key: string) => string;
}> = ({
  language,
  activeStepIndex,
  completedSteps,
  onChangeStep,
  flowMode = 'smart_flow',
  onChangeFlowMode,
  smartPhase = 'listen',
  onOpenGuide,
  t,
}) => {
  const isRtl = language === 'fa';
  const orderedStepTabs = isRtl ? [...STEP_TABS].reverse() : STEP_TABS;
  const orderedSmartTabs = isRtl ? [...SMART_TABS].reverse() : SMART_TABS;

  return (
    <View style={styles.wrapper}>
      {/* سوییچر سبک تمرین (هوشمند vs ۴ مرحله‌ای) + دکمه راهنما */}
      <View style={[styles.modeToggleHeader, isRtl && styles.rowReverse]}>
        <View style={styles.modeToggleGroup}>
          <TouchableOpacity
            activeOpacity={0.8}
            style={[
              styles.modePill,
              flowMode === 'smart_flow' && styles.modePillActiveSmart,
            ]}
            onPress={() => onChangeFlowMode?.('smart_flow')}
          >
            <Sparkles
              size={12}
              color={flowMode === 'smart_flow' ? '#059669' : '#8E95A5'}
            />
            <Text
              style={[
                styles.modePillText,
                flowMode === 'smart_flow' && styles.modePillTextActiveSmart,
              ]}
            >
              سایه‌زنی هوشمند
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.8}
            style={[
              styles.modePill,
              flowMode === 'classic_steps' && styles.modePillActiveClassic,
            ]}
            onPress={() => onChangeFlowMode?.('classic_steps')}
          >
            <Text
              style={[
                styles.modePillText,
                flowMode === 'classic_steps' && styles.modePillTextActiveClassic,
              ]}
            >
              ۴ مرحله‌ای
            </Text>
          </TouchableOpacity>
        </View>

        {onOpenGuide && (
          <TouchableOpacity
            activeOpacity={0.75}
            style={[styles.guideHelpBtn, isRtl && styles.rowReverse]}
            onPress={onOpenGuide}
          >
            <HelpCircle size={14} color="#6B7280" />
            <Text style={styles.guideHelpText}>{isRtl ? 'راهنما' : 'Guide'}</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* محتوای تب‌ها بر اساس حالت انتخاب‌شده */}
      {flowMode === 'smart_flow' ? (
        <View style={styles.smartFlowContainer}>
          {orderedSmartTabs.map((tab) => {
            const active =
              (tab.id === 'listen' && (activeStepIndex === 0 || smartPhase === 'listen') && activeStepIndex !== 1 && activeStepIndex !== 2 && activeStepIndex !== 3) ||
              (tab.id === 'shadow' && (activeStepIndex === 1 || activeStepIndex === 2 || smartPhase === 'shadow') && activeStepIndex !== 3) ||
              (tab.id === 'score' && (activeStepIndex === 3 || smartPhase === 'score'));

            const Icon = tab.icon;

            return (
              <TouchableOpacity
                key={tab.id}
                activeOpacity={0.8}
                onPress={() => onChangeStep(tab.stepIdx)}
                style={[
                  styles.smartPhasePill,
                  active &&
                    (tab.id === 'listen'
                      ? styles.smartPhasePillActiveListen
                      : tab.id === 'shadow'
                      ? styles.smartPhasePillActiveShadow
                      : styles.smartPhasePillActiveScore),
                ]}
              >
                <Icon size={13} color={active ? tab.color : '#9CA3AF'} />
                <Text
                  style={[
                    styles.smartPhaseText,
                    active &&
                      (tab.id === 'listen'
                        ? styles.smartPhaseTextActiveListen
                        : tab.id === 'shadow'
                        ? styles.smartPhaseTextActiveShadow
                        : styles.smartPhaseTextActiveScore),
                  ]}
                >
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      ) : (
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
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: 12,
  },
  rowReverse: {
    flexDirection: 'row-reverse',
  },
  modeToggleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  guideHelpBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F3F4F6',
    borderRadius: 14,
    paddingVertical: 5,
    paddingHorizontal: 10,
  },
  guideHelpText: {
    fontFamily: FONT_FAMILY.bold,
    fontSize: 11,
    color: '#6B7280',
  },
  modeToggleGroup: {
    flexDirection: 'row',
    backgroundColor: '#EBE5D9',
    borderRadius: 20,
    padding: 3,
    gap: 3,
  },
  modePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: 16,
  },
  modePillActiveSmart: {
    backgroundColor: '#FFFFFF',
    ...SHADOWS.level1,
  },
  modePillActiveClassic: {
    backgroundColor: '#FFFFFF',
    ...SHADOWS.level1,
  },
  modePillText: {
    fontFamily: FONT_FAMILY.medium,
    fontSize: 11.5,
    color: '#71717A',
  },
  modePillTextActiveSmart: {
    fontFamily: FONT_FAMILY.bold,
    color: '#059669',
  },
  modePillTextActiveClassic: {
    fontFamily: FONT_FAMILY.bold,
    color: COLORS.text,
  },
  smartFlowContainer: {
    flexDirection: 'row',
    backgroundColor: '#F3EFE6',
    borderRadius: 18,
    padding: 4,
    gap: 4,
  },
  smartPhasePill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 9,
    borderRadius: 14,
    gap: 5,
  },
  smartPhasePillActiveListen: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(37, 99, 235, 0.3)',
    ...SHADOWS.level1,
  },
  smartPhasePillActiveShadow: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(255, 100, 34, 0.35)',
    ...SHADOWS.level1,
  },
  smartPhasePillActiveScore: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(5, 150, 105, 0.35)',
    ...SHADOWS.level1,
  },
  smartPhaseText: {
    fontFamily: FONT_FAMILY.medium,
    fontSize: 11.5,
    color: '#71717A',
  },
  smartPhaseTextActiveListen: {
    fontFamily: FONT_FAMILY.bold,
    color: '#2563EB',
  },
  smartPhaseTextActiveShadow: {
    fontFamily: FONT_FAMILY.bold,
    color: COLORS.primary,
  },
  smartPhaseTextActiveScore: {
    fontFamily: FONT_FAMILY.bold,
    color: '#059669',
  },
  segmentedContainer: {
    flexDirection: 'row',
    backgroundColor: '#F3EFE6',
    borderRadius: 18,
    padding: 4,
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
