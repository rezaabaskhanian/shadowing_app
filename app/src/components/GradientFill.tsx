import React, { useId } from 'react';
import { StyleSheet } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

/**
 * پس‌زمینه‌ی گرادیانی برای یک کادر (کارت یا دکمه) — زیر محتوا و هم‌اندازه‌ی والد.
 * والد باید overflow: 'hidden' و borderRadius خودش را داشته باشد.
 * horizontal = افقی (دکمه)، vertical = عمودی (سایه‌ی پایین عکس)، وگرنه مورب (کارت).
 */
/**
 * react-native-svg شفافیتِ داخل «rgba(...)» را نادیده می‌گیرد و رنگ را کامل می‌کشد؛
 * پس آلفا را جدا به stopOpacity می‌دهیم.
 */
const stop = (color: string) => {
  const m = color.match(/^rgba\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)\s*\)$/);
  return m
    ? { stopColor: `rgb(${m[1]},${m[2]},${m[3]})`, stopOpacity: Number(m[4]) }
    : { stopColor: color, stopOpacity: 1 };
};

export const GradientFill: React.FC<{ from: string; to: string; horizontal?: boolean; vertical?: boolean }> = ({
  from,
  to,
  horizontal = false,
  vertical = false,
}) => {
  const id = `g${useId().replace(/:/g, '')}`;
  return (
    <Svg style={StyleSheet.absoluteFill} pointerEvents="none">
      <Defs>
        <LinearGradient
          id={id}
          x1="0%"
          y1="0%"
          x2={horizontal ? '100%' : vertical ? '0%' : '30%'}
          y2={horizontal ? '0%' : '100%'}
        >
          <Stop offset="0" {...stop(from)} />
          <Stop offset="1" {...stop(to)} />
        </LinearGradient>
      </Defs>
      <Rect x="0" y="0" width="100%" height="100%" fill={`url(#${id})`} />
    </Svg>
  );
};
