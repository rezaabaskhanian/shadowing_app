import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { COLORS } from '../theme/colors';

const SIZE = 56;
const CYCLE_MS = 1600;

/** یک حلقه که از نقطه بزرگ می‌شود و محو می‌شود؛ offset برای حلقه‌ی دوم. */
const Ring: React.FC<{ delay: number; color: string }> = ({ delay, color }) => {
  const t = useSharedValue(0);
  useEffect(() => {
    t.value = withDelay(delay, withRepeat(withTiming(1, { duration: CYCLE_MS, easing: Easing.out(Easing.quad) }), -1));
    return () => cancelAnimation(t);
  }, [delay, t]);
  const style = useAnimatedStyle(() => ({
    opacity: 0.7 * (1 - t.value),
    transform: [{ scale: 0.3 + t.value * 0.9 }],
  }));
  return <Animated.View style={[styles.ring, { borderColor: color }, style]} />;
};

interface Props {
  x: number;
  y: number;
  /** حلقه‌ها بعد از این تأخیر ظاهر می‌شوند (مثلاً بعد از پایانِ زومِ دوربین). */
  appearDelayMs?: number;
  color?: string;
}

/**
 * پالسِ «نفس‌کشیدنِ» هات‌اسپاتِ فعال (Reanimated، روی UI thread). فقط نشانه‌ی
 * بصری است و لمس را نمی‌گیرد.
 */
export const HotspotPulse: React.FC<Props> = ({ x, y, appearDelayMs = 0, color = COLORS.white }) => {
  const appear = useSharedValue(0);
  useEffect(() => {
    appear.value = 0;
    appear.value = withDelay(appearDelayMs, withTiming(1, { duration: 250 }));
  }, [appearDelayMs, x, y, appear]);
  const wrapStyle = useAnimatedStyle(() => ({ opacity: appear.value }));

  return (
    <Animated.View pointerEvents="none" style={[styles.wrap, { left: x - SIZE / 2, top: y - SIZE / 2 }, wrapStyle]}>
      <Ring delay={0} color={color} />
      <Ring delay={CYCLE_MS / 2} color={color} />
      <View style={[styles.dot, { backgroundColor: color }]} />
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    width: SIZE,
    height: SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ring: {
    position: 'absolute',
    width: SIZE,
    height: SIZE,
    borderRadius: SIZE / 2,
    borderWidth: 2,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
});
