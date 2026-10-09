import React, { useMemo } from 'react';
import { StyleSheet, View, type TextStyle } from 'react-native';
import Animated, { interpolateColor, useAnimatedStyle, type SharedValue } from 'react-native-reanimated';
import { COLORS } from '../theme/colors';

/**
 * زمانِ تقریبیِ هر کلمه در بازه‌ی [startMs, endMs] جمله: به نسبتِ طولِ کلمه
 * (+۲ برای فاصله/مکثِ بینِ کلمه‌ها). TTS سرعتِ تقریباً ثابتی دارد، پس همین
 * تخمین برای هایلایتِ کلمه‌به‌کلمه کافی است و زمان‌بندیِ واقعیِ کلمه لازم نیست.
 */
export const estimateWordTimings = (text: string, startMs: number, endMs: number) => {
  const words = text.split(/\s+/).filter(Boolean);
  const weights = words.map((w) => w.length + 2);
  const total = weights.reduce((a, b) => a + b, 0) || 1;
  const span = Math.max(1, endMs - startMs);
  let cursor = startMs;
  return words.map((word, i) => {
    const dur = (weights[i] / total) * span;
    const timing = { word, start: cursor, end: cursor + dur };
    cursor += dur;
    return timing;
  });
};

interface WordProps {
  word: string;
  start: number;
  end: number;
  positionMs: SharedValue<number>;
  textStyle?: TextStyle;
  baseColor: string;
  spokenColor: string;
  activeColor: string;
}

const KaraokeWord: React.FC<WordProps> = ({
  word,
  start,
  end,
  positionMs,
  textStyle,
  baseColor,
  spokenColor,
  activeColor,
}) => {
  // تمامِ محاسبه روی UI thread: هیچ re-renderِ React برای هر فریم لازم نیست.
  const animatedStyle = useAnimatedStyle(() => {
    const p = positionMs.value;
    const isActive = p >= start && p < end;
    // رنگ در ۱۲۰ms اولِ کلمه نرم از خاکستری به رنگِ فعال می‌رود.
    const fade = Math.min(1, Math.max(0, (p - start) / 120));
    const color = p >= end ? spokenColor : interpolateColor(fade, [0, 1], [baseColor, activeColor]);
    return {
      color,
      backgroundColor: isActive ? 'rgba(109, 40, 217, 0.14)' : 'transparent',
      transform: [{ scale: isActive ? 1.06 : 1 }],
    };
  });

  return <Animated.Text style={[textStyle, styles.word, animatedStyle]}>{word}</Animated.Text>;
};

interface Props {
  text: string;
  startMs: number;
  endMs: number;
  /** موقعیتِ پخش (ms) به‌صورت shared value که هر فریم به‌روز می‌شود. */
  positionMs: SharedValue<number>;
  textStyle?: TextStyle;
  baseColor?: string;
  spokenColor?: string;
  activeColor?: string;
}

/** متنِ جمله با هایلایتِ کلمه‌به‌کلمه هم‌زمان با صدا (مثل کارائوکه). */
export const KaraokeText: React.FC<Props> = ({
  text,
  startMs,
  endMs,
  positionMs,
  textStyle,
  baseColor = COLORS.textSecondary,
  spokenColor = COLORS.text,
  activeColor = COLORS.primary,
}) => {
  const timings = useMemo(() => estimateWordTimings(text, startMs, endMs), [text, startMs, endMs]);
  return (
    <View style={styles.row}>
      {timings.map((w, i) => (
        <KaraokeWord
          key={`${i}-${w.word}`}
          {...w}
          positionMs={positionMs}
          textStyle={textStyle}
          baseColor={baseColor}
          spokenColor={spokenColor}
          activeColor={activeColor}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  // متن انگلیسی است: حتی در حالت فارسیِ اپ چپ‌به‌راست بماند.
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    direction: 'ltr',
  },
  word: {
    marginRight: 4,
    paddingHorizontal: 2,
    borderRadius: 6,
  },
});
