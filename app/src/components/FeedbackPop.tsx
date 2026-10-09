import React, { useCallback, useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS } from '../theme/colors';
import { FONT_FAMILY } from '../theme/typography';
import { Celebration } from './Celebration';

export type FeedbackKind = 'correct' | 'wrong';

interface PopState {
  kind: FeedbackKind;
  title: string;
  subtitle?: string;
  id: number;
}

// انیمیشنِ Lottie تیک/ضربدر حدود ۱.۳ ثانیه طول می‌کشد؛ کارت تا تمام شدنش بماند.
const VISIBLE_MS = 1700;

/**
 * بازخوردِ درست/غلط که از پایینِ صفحه با فنر بالا می‌آید (Reanimated) و خودش
 * محو می‌شود. استفاده:
 *   const feedback = useFeedbackPop();
 *   feedback.show('correct', 'آفرین!');
 *   ... {feedback.element}
 * `bottomOffset` برای صفحه‌هایی که نوارِ پایینِ شناور دارند.
 */
export const useFeedbackPop = (bottomOffset = 0) => {
  const [pop, setPop] = useState<PopState | null>(null);
  const counter = useRef(0);
  const show = useCallback((kind: FeedbackKind, title: string, subtitle?: string) => {
    counter.current += 1;
    setPop({ kind, title, subtitle, id: counter.current });
  }, []);
  const element = pop ? (
    <FeedbackPopView key={pop.id} {...pop} bottomOffset={bottomOffset} onHidden={() => setPop(null)} />
  ) : null;
  return { show, element };
};

const FeedbackPopView: React.FC<PopState & { bottomOffset: number; onHidden: () => void }> = ({
  kind,
  title,
  subtitle,
  bottomOffset,
  onHidden,
}) => {
  const insets = useSafeAreaInsets();
  const y = useSharedValue(140);
  const shake = useSharedValue(0);
  const hiddenRef = useRef(onHidden);
  hiddenRef.current = onHidden;
  const done = useCallback(() => hiddenRef.current(), []);

  useEffect(() => {
    y.value = withSequence(
      withSpring(0, { damping: 13, stiffness: 180 }),
      withDelay(VISIBLE_MS, withTiming(160, { duration: 220 }, (finished) => finished && runOnJS(done)()))
    );
    if (kind === 'wrong') {
      shake.value = withDelay(
        180,
        withSequence(
          withTiming(-8, { duration: 50 }),
          withTiming(8, { duration: 70 }),
          withTiming(-6, { duration: 70 }),
          withTiming(6, { duration: 70 }),
          withTiming(0, { duration: 50 })
        )
      );
    }
  }, [kind, y, shake, done]);

  const style = useAnimatedStyle(() => ({
    opacity: y.value > 120 ? 0 : 1,
    transform: [{ translateY: y.value }, { translateX: shake.value }],
  }));

  const isCorrect = kind === 'correct';
  return (
    <View pointerEvents="none" style={[StyleSheet.absoluteFill, styles.layer]}>
      <Animated.View
        style={[
          styles.card,
          { bottom: insets.bottom + 24 + bottomOffset },
          isCorrect ? styles.cardCorrect : styles.cardWrong,
          style,
        ]}
      >
        <Celebration kind={kind} size={56} />
        <View style={styles.texts}>
          <Text style={styles.title}>{title}</Text>
          {!!subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
        </View>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  layer: {
    justifyContent: 'flex-end',
    zIndex: 50,
    elevation: 50,
  },
  card: {
    position: 'absolute',
    left: 20,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
  },
  cardCorrect: {
    backgroundColor: '#E8F7EF',
    borderColor: COLORS.success,
  },
  cardWrong: {
    backgroundColor: '#FDECEC',
    borderColor: COLORS.error,
  },
  texts: {
    flex: 1,
  },
  title: {
    color: COLORS.text,
    fontFamily: FONT_FAMILY.bold,
    fontSize: 16,
  },
  subtitle: {
    color: COLORS.textSecondary,
    fontFamily: FONT_FAMILY.medium,
    fontSize: 13,
    marginTop: 2,
  },
});
