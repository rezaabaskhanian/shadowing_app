import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import LottieView from 'lottie-react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { LOTTIE_SOURCES, type CelebrationKind } from '../assets/lottie';

// جایگزینِ Reanimated برای وقتی فایلِ Lottie هنوز اضافه نشده.
const FALLBACK: Record<CelebrationKind, { main: string; sparks: string[]; loop?: boolean }> = {
  courseDone: { main: '🏆', sparks: ['⭐', '🎉', '✨', '⭐', '🎊', '✨'] },
  streak: { main: '🔥', sparks: ['✨', '🔥', '✨'], loop: true },
  correct: { main: '✅', sparks: ['✨', '⭐', '✨'] },
  wrong: { main: '🙈', sparks: [] },
  reviewDone: { main: '🎉', sparks: ['⭐', '✨', '📚', '✨', '⭐'] },
};

/** یک ایموجیِ کوچک که از وسط به بیرون پرتاب و محو می‌شود. */
const Spark: React.FC<{ emoji: string; angle: number; delay: number; distance: number }> = ({
  emoji,
  angle,
  delay,
  distance,
}) => {
  const t = useSharedValue(0);
  useEffect(() => {
    t.value = withDelay(delay, withTiming(1, { duration: 900, easing: Easing.out(Easing.cubic) }));
  }, [delay, t]);
  const style = useAnimatedStyle(() => ({
    opacity: t.value < 0.7 ? 1 : 1 - (t.value - 0.7) / 0.3,
    transform: [
      { translateX: Math.cos(angle) * distance * t.value },
      { translateY: Math.sin(angle) * distance * t.value },
      { scale: 0.4 + t.value * 0.8 },
    ],
  }));
  return <Animated.Text style={[styles.spark, style]}>{emoji}</Animated.Text>;
};

interface Props {
  kind: CelebrationKind;
  size?: number;
  /** برای Lottie: تکرار شود یا نه (پیش‌فرض از نوعِ انیمیشن). */
  loop?: boolean;
}

/**
 * انیمیشنِ جشن/بازخورد. اگر فایلِ Lottie برای این نوع ثبت شده باشد (assets/lottie)
 * همان پخش می‌شود؛ وگرنه نسخه‌ی Reanimated با ایموجی.
 */
export const Celebration: React.FC<Props> = ({ kind, size = 140, loop }) => {
  const source = LOTTIE_SOURCES[kind];
  const fallback = FALLBACK[kind];
  const shouldLoop = loop ?? !!fallback.loop;

  const pop = useSharedValue(0);
  const wobble = useSharedValue(0);
  useEffect(() => {
    if (source) return;
    pop.value = withSpring(1, { damping: 7, stiffness: 140 });
    if (kind === 'wrong') {
      wobble.value = withSequence(
        withTiming(-1, { duration: 60 }),
        withRepeat(withTiming(1, { duration: 90 }), 4, true),
        withTiming(0, { duration: 60 })
      );
    } else if (shouldLoop) {
      wobble.value = withRepeat(withTiming(1, { duration: 700, easing: Easing.inOut(Easing.sin) }), -1, true);
    }
  }, [kind, source, shouldLoop, pop, wobble]);

  const mainStyle = useAnimatedStyle(() =>
    kind === 'wrong'
      ? { transform: [{ scale: pop.value }, { translateX: wobble.value * 8 }] }
      : { transform: [{ scale: pop.value * (1 + wobble.value * 0.08) }, { rotate: `${wobble.value * 4}deg` }] }
  );

  if (source) {
    return <LottieView source={source} autoPlay loop={shouldLoop} style={{ width: size, height: size }} />;
  }

  return (
    <View style={[styles.wrap, { width: size, height: size }]} pointerEvents="none">
      {fallback.sparks.map((emoji, i) => (
        <Spark
          key={i}
          emoji={emoji}
          angle={(i / fallback.sparks.length) * Math.PI * 2 - Math.PI / 2}
          delay={120 + i * 40}
          distance={size * 0.45}
        />
      ))}
      <Animated.View style={mainStyle}>
        <Text style={{ fontSize: size * 0.42 }}>{fallback.main}</Text>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  spark: {
    position: 'absolute',
    fontSize: 20,
  },
});
