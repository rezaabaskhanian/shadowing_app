import React from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';

/**
 * بخش‌های نتیجه (اشتباه‌ها، عبارت‌ها، ...) یکی‌یکی با فنر از پایین بالا می‌آیند.
 * `i` ترتیب است و تأخیرِ هر بخش را تعیین می‌کند.
 */
export const RiseIn: React.FC<{ i?: number; style?: StyleProp<ViewStyle>; children: React.ReactNode }> = ({
  i = 0,
  style,
  children,
}) => (
  <Animated.View entering={FadeInUp.delay(Math.min(i, 10) * 110).springify().damping(15)} style={style}>
    {children}
  </Animated.View>
);
