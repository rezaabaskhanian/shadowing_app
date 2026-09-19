import React from 'react';
import { Dimensions, NativeScrollEvent, NativeSyntheticEvent, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Eye, Mic, Sparkles } from 'lucide-react-native';

import { COLORS, SPACING, BORDER_RADIUS } from '../theme/colors';
import { FONT_FAMILY, TEXT_STYLES } from '../theme/typography';
import { useLanguage } from '../data/i18n';

interface OnboardingScreensProps {
  onDone: () => void;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');

/**
 * والک‌ثروِ سه‌اسلایدیِ اولین بازکردنِ اپ — چرخه‌ی اصلیِ محصول (ببین/بشنو →
 * تقلید/ضبط → بازخورد/پیشرفت، بخش ۳ سند محصول) را قبل از هر چیز دیگری توضیح
 * می‌دهد. فقط یک‌بار در طول عمر نصب نمایش داده می‌شود (App.tsx با AsyncStorage
 * وضعیتش را نگه می‌دارد)؛ اینجا فقط UI است، بدون منطق دیدن/ندیدن.
 */
export const OnboardingScreens: React.FC<OnboardingScreensProps> = ({ onDone }) => {
  const { t } = useLanguage();
  const insets = useSafeAreaInsets();
  const scrollRef = React.useRef<ScrollView>(null);
  const [index, setIndex] = React.useState(0);

  const slides = [
    {
      Icon: Eye,
      title: t('onboardingSlide1Title'),
      sub: t('onboardingSlide1Sub'),
      bg: COLORS.primaryLight,
      iconColor: COLORS.primary,
    },
    {
      Icon: Mic,
      title: t('onboardingSlide2Title'),
      sub: t('onboardingSlide2Sub'),
      bg: COLORS.infoLight,
      iconColor: COLORS.info,
    },
    {
      Icon: Sparkles,
      title: t('onboardingSlide3Title'),
      sub: t('onboardingSlide3Sub'),
      bg: COLORS.tertiaryLight,
      iconColor: COLORS.tertiary,
    },
  ];
  const isLast = index === slides.length - 1;

  const handleMomentumEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const next = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
    setIndex(next);
  };

  const handleNext = () => {
    if (isLast) {
      onDone();
      return;
    }
    scrollRef.current?.scrollTo({ x: (index + 1) * SCREEN_WIDTH, animated: true });
    setIndex(index + 1);
  };

  return (
    <View style={[styles.container, { backgroundColor: slides[index].bg }]}>
      <TouchableOpacity
        style={[styles.skipBtn, { top: insets.top + SPACING.s }]}
        onPress={onDone}
        hitSlop={10}
      >
        <Text style={styles.skipBtnText}>{t('onboardingSkip')}</Text>
      </TouchableOpacity>

      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleMomentumEnd}
        scrollEventThrottle={16}
      >
        {slides.map((slide, i) => (
          <View key={i} style={[styles.slide, { width: SCREEN_WIDTH }]}>
            <View style={[styles.iconCircle, { backgroundColor: COLORS.surface }]}>
              <slide.Icon size={40} color={slide.iconColor} />
            </View>
            <Text style={styles.title}>{slide.title}</Text>
            <Text style={styles.sub}>{slide.sub}</Text>
          </View>
        ))}
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + SPACING.l }]}>
        <View style={styles.dotsRow}>
          {slides.map((_, i) => (
            <View key={i} style={[styles.dot, i === index && styles.dotActive]} />
          ))}
        </View>
        <TouchableOpacity style={styles.nextBtn} onPress={handleNext} activeOpacity={0.85}>
          <Text style={styles.nextBtnText}>{isLast ? t('onboardingGetStarted') : t('onboardingNext')}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  skipBtn: {
    position: 'absolute',
    right: SPACING.l,
    zIndex: 1,
    paddingVertical: SPACING.s,
    paddingHorizontal: SPACING.s,
  },
  skipBtnText: {
    color: COLORS.textSecondary,
    fontFamily: FONT_FAMILY.medium,
    fontSize: 14,
  },
  slide: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.xl,
  },
  iconCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.l,
  },
  title: {
    ...TEXT_STYLES.headlineMd,
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: SPACING.s,
  },
  sub: {
    ...TEXT_STYLES.bodyMd,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  footer: {
    paddingHorizontal: SPACING.l,
    gap: SPACING.l,
  },
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: SPACING.s,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.border,
  },
  dotActive: {
    width: 20,
    backgroundColor: COLORS.primary,
  },
  nextBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.l,
    paddingVertical: SPACING.m,
    alignItems: 'center',
  },
  nextBtnText: {
    color: COLORS.white,
    fontFamily: FONT_FAMILY.bold,
    fontSize: 16,
  },
});
