import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { COLORS } from '../theme/colors';

// جایگزین موقتِ SceneListCard تا وقتی دیتای واقعی صحنه‌ها از سرور برسد؛
// شکل و ابعادش عیناً با کارت واقعی یکی است تا هنگام جایگزینی جهشی در
// چیدمان دیده نشود.
export function SceneListCardSkeleton() {
  const pulse = useSharedValue(0.5);

  useEffect(() => {
    pulse.value = withRepeat(
      withTiming(1, { duration: 700, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
  }, [pulse]);

  const animatedStyle = useAnimatedStyle(() => ({ opacity: pulse.value }));

  return (
    <Animated.View style={[styles.card, animatedStyle]}>
      <View style={styles.badge} />
      <View style={styles.bottomRow}>
        <View style={styles.title} />
        <View style={styles.time} />
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    height: 170,
    borderRadius: 24,
    marginBottom: 14,
    backgroundColor: COLORS.surfaceHigh,
    overflow: 'hidden',
  },
  badge: {
    position: 'absolute',
    top: 14,
    right: 14,
    width: 70,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.surfaceHighest,
  },
  bottomRow: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 14,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  title: {
    width: '55%',
    height: 18,
    borderRadius: 6,
    backgroundColor: COLORS.surfaceHighest,
  },
  time: {
    width: 44,
    height: 14,
    borderRadius: 6,
    backgroundColor: COLORS.surfaceHighest,
  },
});
