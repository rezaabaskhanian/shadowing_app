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

// هر مرحله رنگ فعالِ خودش را دارد — نه فقط برای تنوع بصری، بلکه تا کاربر با
// یه نگاه به رنگ تب، بدون خوندن متن بفهمه کدوم مرحله‌ست: آبی (دریافتی/گوش
// دادن) → بنفشِ برند (تکرار) → نارنجی (ضبط) → سبز (همون رنگِ «تکمیل/نتیجه‌ی
// خوب» که جای دیگه‌ی اپ هم برای مقایسه/امتیاز استفاده می‌شه).
//
// آبی و نارنجیِ خودِ پالت (COLORS.info و COLORS.secondary) عمداً استفاده
// نشدند: هر دو برای بج/آیکونِ کوچیک روی پس‌زمینه‌ی خیلی کم‌رنگ طراحی شده‌اند،
// و به‌عنوان متن یا پس‌زمینه‌ی توپر با آیکونِ سفید کنتراستشان با سفید کمتر از
// حد قابل‌قبول است (آبی ~۳.۷:۱ ، نارنجی ~۲:۱). این‌جا چون هم به‌عنوان متن روی
// سفید هم پس‌زمینه‌ی توپرِ زیرِ آیکون سفید استفاده می‌شوند، از نسخه‌ی تیره‌ترِ
// همون رنگ‌ها استفاده شده (هر دو بالای ۵:۱، هم‌تراز با primary/tertiary).
const STEP_LISTEN_BLUE = '#1D4ED8';
const STEP_RECORD_ORANGE = '#C2410C';

export const STEP_ACCENT_COLOR: Record<number, string> = {
  0: STEP_LISTEN_BLUE,
  1: COLORS.primary,
  2: STEP_RECORD_ORANGE,
  3: COLORS.tertiary,
};

// نسخه‌ی کم‌رنگِ همون رنگ‌ها، برای پس‌زمینه‌ی نرم پشت دکمه‌ها/چیپ‌های فعالِ
// داخل هر مرحله (همون کاری که COLORS.primaryLight برای بنفش می‌کرد). این‌جا
// خودِ توکن‌های info/secondary مشکلی ندارند چون فقط پس‌زمینه‌ی رقیقند، نه متن.
export const STEP_ACCENT_LIGHT_COLOR: Record<number, string> = {
  0: COLORS.infoLight,
  1: COLORS.primaryLight,
  2: COLORS.secondaryLight,
  3: COLORS.tertiaryLight,
};

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
        const accentColor = STEP_ACCENT_COLOR[stepIdx] ?? COLORS.primary;
        return (
          <TouchableOpacity
            key={st.num}
            activeOpacity={0.7}
            style={styles.segmentedTab}
            onPress={() => onChangeStep(stepIdx)}
          >
            <View style={styles.segmentedTabLabelRow}>
              {done && <Check size={12} color={COLORS.tertiary} />}
              <Text
                style={[
                  styles.segmentedTabText,
                  active ? [styles.segmentedTabTextActive, { color: accentColor }] : null,
                ]}
              >
                {t(st.key)}
              </Text>
            </View>
            {active && <View style={[styles.segmentedTabIndicator, { backgroundColor: accentColor }]} />}
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
    fontFamily: FONT_FAMILY.bold,
  },
  segmentedTabIndicator: {
    marginTop: 6,
    height: 3,
    width: '70%',
    borderRadius: 2,
  },
});
