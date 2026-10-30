import React, { useEffect, useRef } from 'react';
import { Animated, Easing, Image, StyleSheet, Text, View } from 'react-native';
import { GradientFill } from '../components/GradientFill';
import { COLORS } from '../theme/colors';
import { FONT_FAMILY } from '../theme/typography';

const appLogoMark = require('../assets/brand/app-logo-mark.png');

export const SplashScreen = () => {
  const pulse = useRef(new Animated.Value(0)).current;
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 850,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0,
          duration: 850,
          easing: Easing.in(Easing.quad),
          useNativeDriver: true,
        }),
      ]),
    ).start();

    Animated.timing(progress, {
      toValue: 1,
      duration: 2900,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [progress, pulse]);

  // هاله‌های دورِ لوگو آرام بزرگ‌وکوچک می‌شوند؛ خودِ لوگو ثابت می‌ماند.
  const haloScale = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.08],
  });
  const haloOpacity = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [0.7, 1],
  });

  const progressWidth = progress.interpolate({
    inputRange: [0, 1],
    outputRange: ['18%', '100%'],
  });

  // این صفحه پیش از بالا آمدنِ LanguageProvider دیده می‌شود؛ متن‌ها فارسی‌اند
  // چون زبان پیش‌فرض اپ فارسی است.
  return (
    <View style={styles.container}>
      <GradientFill from="#FFF7F2" to="#F6F1FB" />

      <View style={styles.middleArea}>
        <View style={styles.logoStage}>
          <Animated.View
            style={[styles.haloOuter, { opacity: haloOpacity, transform: [{ scale: haloScale }] }]}
          />
          <Animated.View style={[styles.haloInner, { transform: [{ scale: haloScale }] }]} />
          <View style={styles.logoTile}>
            <Image source={appLogoMark} style={styles.logo} resizeMode="contain" />
          </View>
        </View>

        <Text style={styles.title}>
          Lingo <Text style={styles.titleAccent}>Flow</Text>
        </Text>
        <View style={styles.chip}>
          <Text style={styles.chipText}>یادگیری هوشمند مکالمه‌ی روان</Text>
          <View style={styles.chipDot} />
        </View>
        <Text style={styles.subtitle}>تمرین شدوئینگ با صحنه‌های واقعی و بازخورد تلفظ</Text>
      </View>

      <View style={styles.footer}>
        <View style={styles.progressTrack}>
          <Animated.View style={[styles.progressFill, { width: progressWidth }]} />
        </View>
        <Text style={styles.loadingText}>در حال آماده‌سازی درس‌ها…</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.backgroundSoft,
    paddingHorizontal: 30,
    paddingTop: 52,
    paddingBottom: 54,
  },
  middleArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoStage: {
    width: 260,
    height: 260,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  haloOuter: {
    position: 'absolute',
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: 'rgba(232, 87, 47, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(232, 87, 47, 0.10)',
  },
  haloInner: {
    position: 'absolute',
    width: 190,
    height: 190,
    borderRadius: 95,
    backgroundColor: 'rgba(232, 87, 47, 0.08)',
  },
  logoTile: {
    width: 128,
    height: 128,
    borderRadius: 34,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: 128,
    height: 128,
  },
  title: {
    color: COLORS.text,
    fontFamily: FONT_FAMILY.bold,
    fontSize: 40,
    textAlign: 'center',
  },
  titleAccent: {
    color: COLORS.primary,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.primaryLight,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 4,
    marginTop: 8,
  },
  chipDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: COLORS.primary },
  chipText: {
    color: COLORS.primaryDark,
    fontFamily: FONT_FAMILY.semiBold,
    fontSize: 12,
  },
  subtitle: {
    color: COLORS.textSecondary,
    fontFamily: FONT_FAMILY.regular,
    fontSize: 13,
    lineHeight: 22,
    textAlign: 'center',
    marginTop: 14,
    paddingHorizontal: 12,
  },
  footer: {
    marginTop: 'auto',
  },
  progressTrack: {
    height: 5,
    borderRadius: 8,
    backgroundColor: COLORS.borderLight,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 8,
    backgroundColor: COLORS.primary,
  },
  loadingText: {
    color: COLORS.muted,
    fontFamily: FONT_FAMILY.regular,
    fontSize: 12,
    textAlign: 'center',
    marginTop: 12,
  },
});
