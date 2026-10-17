import React, { useEffect } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, {
  Easing,
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

const FADE_MS = 1100;
/** بزرگ‌نماییِ آرامِ عکسِ فعال (مثل مستندها)؛ در این مدت تا ZOOM_TO بزرگ می‌شود. */
const ZOOM_MS = 14000;
const ZOOM_TO = 1.08;

const Slide: React.FC<{ uri: string; active: boolean; playing: boolean }> = ({ uri, active, playing }) => {
  const opacity = useSharedValue(active ? 1 : 0);
  const scale = useSharedValue(1);

  useEffect(() => {
    opacity.value = withTiming(active ? 1 : 0, { duration: FADE_MS, easing: Easing.inOut(Easing.quad) });
    // عکسی که تازه فعال می‌شود از اندازه‌ی عادی شروع می‌کند.
    if (active) scale.value = 1;
  }, [active, opacity, scale]);

  useEffect(() => {
    if (active && playing) {
      // ادامه از همان اندازه‌ی فعلی تا ZOOM_TO؛ مدت به نسبتِ راهِ باقی‌مانده.
      const remaining = Math.max(0, (ZOOM_TO - scale.value) / (ZOOM_TO - 1));
      scale.value = withTiming(ZOOM_TO, { duration: ZOOM_MS * remaining, easing: Easing.linear });
    } else {
      cancelAnimation(scale);
    }
  }, [active, playing, scale]);

  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  return <Animated.Image source={{ uri }} style={[StyleSheet.absoluteFill, style]} resizeMode="cover" />;
};

interface Props {
  uris: string[];
  activeIndex: number;
  /** فقط وقتی پخش در جریان است عکس آرام بزرگ می‌شود؛ با مکث، حرکت هم می‌ایستد. */
  playing: boolean;
  style?: StyleProp<ViewStyle>;
}

/**
 * اسلایدشوی آرام: عکس فعال با محو شدن جای قبلی را می‌گیرد و هنگام پخش کمی
 * بزرگ می‌شود. همه‌ی عکس‌ها روی هم رندر می‌شوند (فقط opacity عوض می‌شود) تا
 * عوض شدن بدون پرش و بارگذاری دوباره باشد.
 */
export const Slideshow: React.FC<Props> = ({ uris, activeIndex, playing, style }) => (
  <View style={[styles.frame, style]}>
    {uris.map((uri, i) => (
      <Slide key={`${uri}-${i}`} uri={uri} active={i === activeIndex} playing={playing} />
    ))}
  </View>
);

/**
 * شروع هر عکس (اندیس جمله): from_line (از ۱) اگر داده شده، وگرنه یکنواخت بین
 * جمله‌ها بر اساس ترتیب عکس. خروجی به ترتیب شروع مرتب است.
 */
export const slideStarts = (images: { from_line: number }[], lineCount: number) =>
  images
    .map((img, k) => ({
      index: k,
      start: img.from_line > 0 ? img.from_line - 1 : Math.floor((k * lineCount) / Math.max(1, images.length)),
    }))
    .sort((a, b) => a.start - b.start);

const styles = StyleSheet.create({
  frame: {
    overflow: 'hidden',
  },
});
