import React from 'react';
import { Dimensions, NativeScrollEvent, NativeSyntheticEvent, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, ArrowRight, Eye, Mic, Sparkles } from 'lucide-react-native';
import { GradientFill } from '../components/GradientFill';

import { COLORS, SPACING } from '../theme/colors';
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
  const { t, language } = useLanguage();
  const rtl = language === 'fa';
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
      top: '#FCE6D8',
      halo: 'rgba(232, 87, 47, 0.10)',
      tile: true,
    },
    {
      Icon: Mic,
      title: t('onboardingSlide2Title'),
      sub: t('onboardingSlide2Sub'),
      bg: COLORS.infoLight,
      iconColor: '#3B6EF0',
      top: '#E6EEFC',
      halo: 'rgba(59, 110, 240, 0.10)',
      tile: false,
    },
    {
      Icon: Sparkles,
      title: t('onboardingSlide3Title'),
      sub: t('onboardingSlide3Sub'),
      bg: COLORS.tertiaryLight,
      iconColor: '#2F8A5B',
      top: '#DFF2E6',
      halo: 'rgba(47, 138, 91, 0.10)',
      tile: false,
    },
  ];
  const isLast = index === slides.length - 1;

  const handleMomentumEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const next = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
    setIndex(next);
  };

  const goTo = (i: number) => {
    scrollRef.current?.scrollTo({ x: i * SCREEN_WIDTH, animated: true });
    setIndex(i);
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
    <View style={styles.container}>
      {/* رنگ هر اسلاید نیمه‌شفاف است؛ اگر مستقیم روی container بنشیند، پس‌زمینه‌ی
          پنجره‌ی اندروید (لوگوی launch_background) از زیرش دیده می‌شود. پس container
          مات می‌ماند و رنگ اسلاید یک لایه‌ی جدا روی آن است. */}
      <View style={StyleSheet.absoluteFill}>
        <GradientFill from={slides[index].top} to="#FDFBF7" vertical />
      </View>
      <View style={[styles.topBar, { top: insets.top + SPACING.s }, !rtl && styles.rowReverse]}>
        <TouchableOpacity onPress={onDone} hitSlop={10} style={styles.topBtn}>
          <Text style={styles.skipBtnText}>{t('onboardingSkip')}</Text>
        </TouchableOpacity>
        {index === 0 ? (
          <View style={styles.brandChip}>
            <Text style={styles.brandText}>LingoFlow</Text>
            <View style={styles.brandDot} />
          </View>
        ) : (
          <TouchableOpacity onPress={() => goTo(index - 1)} hitSlop={10} style={[styles.topBtn, styles.prevBtn]}>
            {rtl ? <ArrowRight size={14} color={COLORS.muted} /> : <ArrowLeft size={14} color={COLORS.muted} />}
            <Text style={styles.prevText}>{t('onboardingPrev')}</Text>
          </TouchableOpacity>
        )}
      </View>

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
            <View style={styles.art}>
              <View style={[styles.haloOuter, { backgroundColor: slide.halo }]} />
              <View style={[styles.haloInner, { backgroundColor: slide.halo }]} />
              <View style={[styles.iconDisc, { shadowColor: slide.iconColor }]}>
                {slide.tile ? (
                  <View style={styles.iconTile}>
                    <GradientFill from="#F28A55" to="#E8572F" />
                    <slide.Icon size={40} color={COLORS.white} />
                  </View>
                ) : (
                  <slide.Icon size={40} color={slide.iconColor} />
                )}
              </View>
              {i === 0 && (
                <>
                  <View style={[styles.floatChip, styles.floatChipTop]}>
                    <Text style={styles.floatChipText}>🏨 {t('onboardingChipHotel')}</Text>
                  </View>
                  <View style={[styles.floatChip, styles.floatChipBottom]}>
                    <Text style={styles.floatChipText}>☕ {t('onboardingChipCafe')}</Text>
                  </View>
                </>
              )}
              <View style={[styles.spark, styles.sparkA, { backgroundColor: slide.iconColor }]} />
              <View style={[styles.spark, styles.sparkB, { backgroundColor: slide.iconColor }]} />
            </View>
            <Text style={styles.title}>{slide.title}</Text>
            <Text style={styles.sub}>{slide.sub}</Text>
          </View>
        ))}
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + SPACING.l }]}>
        <View style={[styles.dotsRow, rtl && styles.rowReverse]}>
          {slides.map((_, i) => (
            <View key={i} style={[styles.dot, i === index && styles.dotActive]} />
          ))}
        </View>
        <TouchableOpacity style={styles.nextBtn} onPress={handleNext} activeOpacity={0.85}>
          <GradientFill from="#F07A4A" to="#E8572F" horizontal />
          <View style={[styles.nextInner, !rtl && styles.rowReverse]}>
            {rtl ? <ArrowLeft size={18} color={COLORS.white} /> : <ArrowRight size={18} color={COLORS.white} />}
            <Text style={styles.nextBtnText}>{isLast ? t('onboardingGetStarted') : t('onboardingNext')}</Text>
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FDFBF7',
  },
  rowReverse: { flexDirection: 'row-reverse' },
  // در فارسی «رد کردن» سمت چپ و نشان برند/«قبلی» سمت راست است.
  topBar: {
    position: 'absolute',
    left: SPACING.l,
    right: SPACING.l,
    zIndex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  topBtn: { paddingVertical: SPACING.s, paddingHorizontal: 4 },
  prevBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  prevText: { color: '#716B62', fontFamily: FONT_FAMILY.medium, fontSize: 13 },
  brandChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#F0EBE3',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  brandText: { fontFamily: FONT_FAMILY.bold, fontSize: 11, color: '#FF6422' },
  brandDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#FF6422' },
  art: { width: 240, height: 220, alignItems: 'center', justifyContent: 'center', marginBottom: SPACING.l },
  haloOuter: { position: 'absolute', width: 210, height: 210, borderRadius: 105 },
  haloInner: { position: 'absolute', width: 160, height: 160, borderRadius: 80 },
  iconDisc: {
    width: 116,
    height: 116,
    borderRadius: 58,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 8,
    shadowOpacity: 0.2,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    borderWidth: 1,
    borderColor: '#F0EBE3',
  },
  iconTile: {
    width: 84,
    height: 84,
    borderRadius: 22,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  floatChip: {
    position: 'absolute',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#F0EBE3',
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  floatChipTop: { top: 16, left: 6 },
  floatChipBottom: { bottom: 20, right: 0 },
  floatChipText: { fontFamily: FONT_FAMILY.semiBold, fontSize: 12, color: '#1A1D26' },
  spark: { position: 'absolute', width: 6, height: 6, borderRadius: 3, opacity: 0.45 },
  sparkA: { top: 30, right: 36 },
  sparkB: { bottom: 40, left: 30 },
  skipBtnText: {
    color: '#716B62',
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
    backgroundColor: '#FFF0EA',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.l,
  },
  title: {
    fontFamily: FONT_FAMILY.bold,
    fontSize: 24,
    color: '#1A1D26',
    textAlign: 'center',
    marginBottom: SPACING.s,
  },
  sub: {
    fontFamily: FONT_FAMILY.regular,
    fontSize: 14,
    lineHeight: 23,
    color: '#716B62',
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
    backgroundColor: '#EBE6DC',
  },
  dotActive: {
    width: 22,
    backgroundColor: '#FF6422',
  },
  nextBtn: {
    height: 54,
    backgroundColor: '#FF6422',
    borderRadius: 18,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 5,
    shadowColor: '#FF6422',
    shadowOpacity: 0.3,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  nextInner: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  nextBtnText: {
    color: '#FFFFFF',
    fontFamily: FONT_FAMILY.bold,
    fontSize: 16,
  },
});
