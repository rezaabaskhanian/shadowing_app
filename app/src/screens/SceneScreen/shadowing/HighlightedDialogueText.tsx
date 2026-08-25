import React, { useMemo } from 'react';
import { StyleSheet, Text } from 'react-native';

import { COLORS, hexToRgba } from '../../../theme/colors';
import { FONT_FAMILY } from '../../../theme/typography';
import type { WordTimingEntry } from '../../../data/scenarios';
import { usePracticeSettings } from '../../../data/PracticeSettingsContext';

/** آخرین کلمه‌ای که زمان شروعش رسیده؛ کلمه تا شروعِ کلمه‌ی بعدی هایلایت می‌ماند. */
function activeWordIndex(timings: WordTimingEntry[], currentTimeSeconds: number): number {
  let idx = -1;
  for (let i = 0; i < timings.length; i++) {
    if (currentTimeSeconds >= timings[i].start) idx = i;
    else break;
  }
  return idx;
}

/**
 * متن انگلیسیِ جمله را کلمه‌به‌کلمه رندر می‌کند و کلمه‌ای که همین حالا در
 * صدای مرجع گفته می‌شود را هایلایت می‌کند (از روی wordTimings و موقعیتِ
 * زنده‌ی پخش). اگر زمان‌بندی نداشتیم یا تعداد کلمه‌ها با متن جور درنیامد
 * (مثلاً صحنه‌های قدیمی)، فقط متن ساده نشان داده می‌شود.
 */
export const HighlightedDialogueText: React.FC<{
  text: string;
  wordTimings?: WordTimingEntry[];
  currentTimeSeconds?: number;
  /** برای جای‌گیری داخل حباب کوچکِ بالای شخصیت (به‌جای کارتِ پایین). */
  compact?: boolean;
}> = ({ text, wordTimings, currentTimeSeconds = 0, compact }) => {
  const { highlightColor } = usePracticeSettings();
  const tokens = useMemo(() => text.split(/(\s+)/), [text]);
  // فقط توکن‌های واقعی کلمه (نه فاصله‌ها) باید با wordTimings جفت شوند.
  const wordTokenIndexes = useMemo(
    () => tokens.map((t, i) => (t.trim() ? i : -1)).filter((i) => i !== -1),
    [tokens]
  );

  const textStyle = [styles.dialogueText, compact && styles.dialogueTextCompact];
  const highlightStyle = [
    styles.dialogueHighlightWord,
    { color: highlightColor, backgroundColor: hexToRgba(highlightColor, 0.12) },
  ];

  const canHighlight = !!wordTimings && wordTimings.length > 0 && wordTimings.length === wordTokenIndexes.length;
  if (!canHighlight) {
    return <Text style={textStyle}>{text}</Text>;
  }

  const activeIdx = activeWordIndex(wordTimings!, currentTimeSeconds);
  const activeTokenIndex = activeIdx >= 0 ? wordTokenIndexes[activeIdx] : -1;

  return (
    <Text style={textStyle}>
      {tokens.map((token, i) =>
        i === activeTokenIndex ? (
          <Text key={i} style={highlightStyle}>
            {token}
          </Text>
        ) : (
          token
        )
      )}
    </Text>
  );
};

const styles = StyleSheet.create({
  dialogueText: {
    color: COLORS.text,
    fontFamily: FONT_FAMILY.bold,
    fontSize: 20,
    lineHeight: 28,
    textAlign: 'center',
    marginBottom: 6,
  },
  dialogueTextCompact: {
    fontSize: 14,
    lineHeight: 19,
    marginBottom: 0,
  },
  dialogueHighlightWord: {
    borderRadius: 6,
    fontWeight: '800',
  },
});
