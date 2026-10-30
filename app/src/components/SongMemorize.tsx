import React, { useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View, type TextStyle } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { COLORS } from '../theme/colors';
import { FONT_FAMILY } from '../theme/typography';

/**
 * حالت «حفظ کردن» آهنگ: چهار مرحله — متن کامل، ۵۰٪ کلمه‌ها پنهان، ۷۰٪ پنهان، و
 * «از حفظ» (هیچ کلمه‌ای دیده نمی‌شود و هر خط فقط یک نوار است که هم‌زمان با خواندنش
 * پر می‌شود). کلمه‌های پنهان با لمس دیده می‌شوند.
 */
export type MemorizeLevel = 0 | 50 | 70 | 100;
export const MEMORIZE_LEVELS: MemorizeLevel[] = [0, 50, 70, 100];

// کلمه‌های کوچک دستوری دیرتر پنهان می‌شوند تا مرحله‌ی نصف، حفظ کلمه‌های پرمعنی باشد نه حدس حرف تعریف.
const FUNCTION_WORDS = new Set(
  (
    'a an the and or but so if of to in on at by for with from as is am are was were be been ' +
    "i you he she it we they me him her us them my your his its our their this that these those " +
    "oh ooh yeah la da do don't i'm i'll it's you're we're 'cause"
  ).split(' '),
);

const bare = (w: string) => w.toLowerCase().replace(/[^a-z']/g, '');

/** عدد شبه‌تصادفی ثابت از یک رشته؛ تا کلمه‌های پنهانِ هر خط هر بار همان‌ها باشند. */
const hash = (s: string) => {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
};

/** اندیس کلمه‌هایی از این خط که در این مرحله پنهان می‌شوند. */
export const hiddenWordIndexes = (words: string[], level: MemorizeLevel, seed: string): Set<number> => {
  if (level === 0) return new Set();
  const playable = words.map((w, i) => ({ i, w: bare(w) })).filter((x) => x.w.length > 0);
  if (level === 100) return new Set(playable.map((x) => x.i));
  const count = Math.round((playable.length * level) / 100);
  // اول کلمه‌های پرمعنی، بعد دستوری؛ داخل هر گروه ترتیب ثابت از روی hash.
  const ranked = [...playable].sort((a, b) => {
    const fa = FUNCTION_WORDS.has(a.w) ? 1 : 0;
    const fb = FUNCTION_WORDS.has(b.w) ? 1 : 0;
    if (fa !== fb) return fa - fb;
    return hash(`${seed}:${a.i}`) - hash(`${seed}:${b.i}`);
  });
  return new Set(ranked.slice(0, count).map((x) => x.i));
};

const storeKey = (songId: string) => `song_memorize_level:${songId}`;

/** مرحله‌ی انتخاب‌شده‌ی هر آهنگ روی گوشی می‌ماند. */
export const useMemorizeLevel = (songId?: string) => {
  const [level, setLevelState] = useState<MemorizeLevel>(0);
  useEffect(() => {
    if (!songId) return;
    AsyncStorage.getItem(storeKey(songId))
      .then((v) => {
        const n = Number(v);
        if (MEMORIZE_LEVELS.includes(n as MemorizeLevel)) setLevelState(n as MemorizeLevel);
      })
      .catch(() => {});
  }, [songId]);
  const setLevel = (l: MemorizeLevel) => {
    setLevelState(l);
    if (songId) AsyncStorage.setItem(storeKey(songId), String(l)).catch(() => {});
  };
  return [level, setLevel] as const;
};

/** انتخابگر چهار مرحله‌ای بالای متن. */
export const MemorizePicker: React.FC<{
  level: MemorizeLevel;
  onChange: (l: MemorizeLevel) => void;
  labels: Record<MemorizeLevel, string>;
  title: string;
  accent: string;
  rtl: boolean;
}> = ({ level, onChange, labels, title, accent, rtl }) => (
  <View style={styles.picker}>
    <Text style={[styles.pickerTitle, { textAlign: rtl ? 'right' : 'left' }]}>{title}</Text>
    <View style={[styles.segments, rtl && styles.rowReverse]}>
      {MEMORIZE_LEVELS.map((l) => {
        const on = l === level;
        return (
          <TouchableOpacity
            key={l}
            style={[styles.segment, on && { backgroundColor: accent }]}
            onPress={() => onChange(l)}
            activeOpacity={0.85}
            accessibilityState={{ selected: on }}
          >
            <Text style={[styles.segmentText, on && styles.segmentTextOn]}>{labels[l]}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  </View>
);

/** خطِ آهنگ با کلمه‌های پنهان (مراحل ۵۰٪ و ۷۰٪)؛ لمس هر جای خالی، همان کلمه را نشان می‌دهد. */
export const MaskedLine: React.FC<{
  text: string;
  hidden: Set<number>;
  textStyle: TextStyle;
  accent: string;
}> = ({ text, hidden, textStyle, accent }) => {
  const [revealed, setRevealed] = useState<Set<number>>(new Set());
  const words = useMemo(() => text.split(/\s+/).filter(Boolean), [text]);
  return (
    <Text style={textStyle}>
      {words.map((w, i) => {
        const masked = hidden.has(i) && !revealed.has(i);
        const sep = i < words.length - 1 ? ' ' : '';
        if (!hidden.has(i)) return <Text key={i}>{w + sep}</Text>;
        return (
          <Text key={i}>
            <Text
              style={masked ? [styles.blank, { color: accent, backgroundColor: `${accent}1A` }] : { color: accent }}
              onPress={() => setRevealed((prev) => new Set(prev).add(i))}
              suppressHighlighting
            >
              {masked ? ' ' + '_'.repeat(Math.max(3, bare(w).length)) + ' ' : w}
            </Text>
            {sep}
          </Text>
        );
      })}
    </Text>
  );
};

/**
 * مرحله‌ی «از حفظ»: به‌جای متن، یک نوار به اندازه‌ی طول خط. وقتی خط شروع می‌شود، نوار
 * هم‌زمان با آهنگ پر می‌شود؛ حدود یک ثانیه قبل از شروع، نقطه‌ی «آماده باش» چشمک می‌زند.
 */
export const HiddenLineBar: React.FC<{
  startMs: number;
  endMs: number;
  positionMs: SharedValue<number>;
  active: boolean;
  upcoming: boolean;
  accent: string;
  lengthRatio: number;
  rtl: boolean;
}> = ({ startMs, endMs, positionMs, active, upcoming, accent, lengthRatio, rtl }) => {
  const fill = useAnimatedStyle(() => {
    const span = Math.max(1, endMs - startMs);
    const p = Math.min(1, Math.max(0, (positionMs.value - startMs) / span));
    return { width: `${p * 100}%` };
  });
  const blink = useSharedValue(1);
  useEffect(() => {
    blink.value = upcoming ? withRepeat(withTiming(0.2, { duration: 350 }), -1, true) : withTiming(1);
  }, [upcoming, blink]);
  const blinkStyle = useAnimatedStyle(() => ({ opacity: blink.value }));

  return (
    <View style={[styles.barRow, rtl && styles.rowReverse]}>
      <Animated.View
        style={[styles.cueDot, { backgroundColor: upcoming || active ? COLORS.primary : 'transparent' }, blinkStyle]}
      />
      <View style={[styles.barTrack, { width: `${Math.round(lengthRatio * 100)}%` }, active && { backgroundColor: `${accent}26` }]}>
        <Animated.View style={[styles.barFill, { backgroundColor: accent }, fill]} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  rowReverse: { flexDirection: 'row-reverse' },
  picker: { gap: 8 },
  pickerTitle: { fontFamily: FONT_FAMILY.bold, fontSize: 13, color: COLORS.text },
  segments: { flexDirection: 'row', gap: 4, padding: 4, borderRadius: 14, backgroundColor: '#F2F2F5' },
  segment: { flex: 1, alignItems: 'center', paddingVertical: 8, borderRadius: 10 },
  segmentText: { fontFamily: FONT_FAMILY.semiBold, fontSize: 12, color: COLORS.textSecondary },
  segmentTextOn: { color: COLORS.white, fontFamily: FONT_FAMILY.bold },
  blank: { fontFamily: FONT_FAMILY.bold, borderRadius: 4 },
  barRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 10 },
  cueDot: { width: 10, height: 10, borderRadius: 5 },
  barTrack: { height: 10, borderRadius: 5, backgroundColor: '#ECEEF2', overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 5 },
});
