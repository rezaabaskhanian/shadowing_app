import React, { useEffect, useRef } from 'react';
import { Animated, Easing, Image, StyleSheet, Text, View } from 'react-native';
import { MessageCircle } from 'lucide-react-native';
import Svg, { Defs, LinearGradient as SvgLinearGradient, Stop, Rect, Circle } from 'react-native-svg';
import { COLORS } from '../theme/colors';
import { FONT_FAMILY } from '../theme/typography';

const appLogoMark = require('../assets/brand/app-logo-mark.png');

// پس‌زمینه‌ی تیره + گرادیان بنفش/فیروزه‌ای مطابق لوگوی جدید اپ؛ فقط همین
// صفحه از این پالت استفاده می‌کند، نه کل اپ (که همچنان تم روشن دارد).
const BG_TOP = '#0c0c32';
const BG_BOTTOM = '#3d1763';
const WAVE_FROM = '#b355e2';
const WAVE_TO = '#63c9ea';

function mixHex(from: string, to: string, t: number) {
  const parse = (hex: string) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
  const [r1, g1, b1] = parse(from);
  const [r2, g2, b2] = parse(to);
  const r = Math.round(r1 + (r2 - r1) * t);
  const g = Math.round(g1 + (g2 - g1) * t);
  const b = Math.round(b1 + (b2 - b1) * t);
  return `rgb(${r}, ${g}, ${b})`;
}

const WAVE_BAR_COUNT = 28;
const waveBarColors = Array.from({ length: WAVE_BAR_COUNT }).map((_, i) =>
  mixHex(WAVE_FROM, WAVE_TO, i / (WAVE_BAR_COUNT - 1))
);

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
      duration: 1800,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [progress, pulse]);

  const scale = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.1],
  });

  const progressWidth = progress.interpolate({
    inputRange: [0, 1],
    outputRange: ['18%', '100%'],
  });

  return (
    <View style={styles.container}>
      <Svg style={StyleSheet.absoluteFill} width="100%" height="100%">
        <Defs>
          <SvgLinearGradient id="bgGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <Stop offset="0%" stopColor={BG_TOP} />
            <Stop offset="100%" stopColor={BG_BOTTOM} />
          </SvgLinearGradient>
        </Defs>
        <Rect x={0} y={0} width="100%" height="100%" fill="url(#bgGrad)" />
      </Svg>

      <View style={styles.statusSpacer} />

      <View style={styles.heroCopy}>
        <Text style={styles.title}>LingoFlow</Text>
        <Text style={styles.subtitle}>Speak English{'\n'}Naturally</Text>
      </View>

      <View style={styles.logoWrap}>
        <Image source={appLogoMark} style={styles.logo} resizeMode="contain" />
      </View>

      <View style={styles.voiceArea}>
        <View style={styles.wave}>
          {waveBarColors.map((color, index) => (
            <View
              key={index}
              style={[styles.waveBar, { height: 8 + ((index * 9) % 34), backgroundColor: color }]}
            />
          ))}
        </View>
        <Animated.View style={[styles.voiceButtonWrap, { transform: [{ scale }] }]}>
          <Svg width={92} height={92}>
            <Defs>
              <SvgLinearGradient id="btnGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <Stop offset="0%" stopColor={WAVE_FROM} />
                <Stop offset="100%" stopColor={WAVE_TO} />
              </SvgLinearGradient>
            </Defs>
            <Circle cx={46} cy={46} r={43} fill="url(#btnGrad)" stroke="rgba(255, 255, 255, 0.18)" strokeWidth={5} />
          </Svg>
          <View style={styles.voiceButtonIcon}>
            <MessageCircle color={COLORS.white} size={30} fill={COLORS.white} />
          </View>
        </Animated.View>
      </View>

      <View style={styles.footer}>
        <Text style={styles.loadingText}>Loading your learning journey...</Text>
        <View style={styles.progressTrack}>
          <Animated.View style={[styles.progressFill, { width: progressWidth }]} />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BG_TOP,
    paddingHorizontal: 30,
    paddingTop: 52,
    paddingBottom: 54,
  },
  statusSpacer: {
    height: 1,
  },
  heroCopy: {
    alignItems: 'center',
    marginTop: 72,
  },
  title: {
    color: COLORS.white,
    fontFamily: FONT_FAMILY.bold,
    fontSize: 56,
    textAlign: 'center',
  },
  subtitle: {
    color: COLORS.white,
    fontFamily: FONT_FAMILY.semiBold,
    fontSize: 24,
    lineHeight: 31,
    textAlign: 'center',
    marginTop: 8,
  },
  logoWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 28,
  },
  logo: {
    width: 220,
    height: 220,
  },
  voiceArea: {
    position: 'absolute',
    left: 30,
    right: 30,
    bottom: 150,
    height: 92,
    alignItems: 'center',
    justifyContent: 'center',
  },
  wave: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  waveBar: {
    width: 3,
    borderRadius: 4,
    opacity: 0.9,
  },
  voiceButtonWrap: {
    width: 92,
    height: 92,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: WAVE_FROM,
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.58,
    shadowRadius: 24,
    elevation: 12,
  },
  voiceButtonIcon: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footer: {
    marginTop: 'auto',
  },
  loadingText: {
    color: COLORS.white,
    fontSize: 15,
    textAlign: 'center',
    marginBottom: 20,
  },
  progressTrack: {
    height: 5,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 8,
    backgroundColor: COLORS.primary,
  },
});
