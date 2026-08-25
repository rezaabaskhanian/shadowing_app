import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { COLORS, hexToRgba } from '../../../theme/colors';
import { FONT_FAMILY } from '../../../theme/typography';
import type { WordScore } from '../../../api/shadowing';
import { usePracticeSettings } from '../../../data/PracticeSettingsContext';

/**
 * جمله‌ی هدف با رنگ‌بندی کلمه‌به‌کلمه از روی نتیجه‌ی نمره‌دهی تلفظ.
 *
 * سبز = درست ادا شده، زرد = مبهم/ناقص، قرمزِ خط‌خورده = اصلاً گفته نشده یا
 * کلمه‌ی دیگری جایش آمده. زیر هر کلمه‌ی اشتباه، چیزی که واقعاً شنیده شده
 * نوشته می‌شود تا کاربر بفهمد چه گفته.
 *
 * اگر currentTimeSeconds داده شده باشد (یعنی همین حالا ضبط دارد دوباره پخش
 * می‌شود)، کلمه‌ای که همین لحظه گفته می‌شود هم به‌صورت زنده بولد می‌شود —
 * جدا از رنگِ نمره که ثابت است.
 */
export const ScoredDialogueText: React.FC<{ words: WordScore[]; currentTimeSeconds?: number }> = ({
  words,
  currentTimeSeconds,
}) => {
  const { highlightColor } = usePracticeSettings();
  let activeIndex = -1;
  if (currentTimeSeconds !== undefined) {
    for (const w of words) {
      if (w.start !== undefined && currentTimeSeconds >= w.start) activeIndex = w.index;
      else if (w.start !== undefined) break;
    }
  }

  return (
    <View style={styles.scoredWordsWrap}>
      {words.map((w) => {
        const wrongWord = w.status === 'missing';
        const weak = w.status === 'weak';
        return (
          <View key={w.index} style={styles.scoredWordCol}>
            <Text
              style={[
                styles.scoredWord,
                wrongWord ? styles.scoredWordMissing : weak ? styles.scoredWordWeak : styles.scoredWordOk,
                w.index === activeIndex && [styles.scoredWordActive, { backgroundColor: hexToRgba(highlightColor, 0.15) }],
              ]}
            >
              {w.word}
            </Text>
            {/* فقط وقتی کلمه‌ی دیگری شنیده شده ارزش نشان‌دادن دارد؛ اگر هیچ
                چیزی گفته نشده، خالی بودنش خودش گویاست. */}
            {wrongWord && !!w.heard && <Text style={styles.scoredWordHeard}>{w.heard}</Text>}
          </View>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  scoredWordsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    // جمله‌ی هدف همیشه انگلیسی است، پس چیدمانش نباید با زبان رابط برعکس شود.
    direction: 'ltr',
  },
  scoredWordCol: {
    alignItems: 'center',
    marginHorizontal: 3,
    marginVertical: 2,
  },
  scoredWord: {
    fontFamily: FONT_FAMILY.semiBold,
    fontSize: 15,
  },
  scoredWordOk: {
    color: COLORS.tertiary,
  },
  scoredWordWeak: {
    color: COLORS.secondaryContainer,
  },
  scoredWordMissing: {
    color: COLORS.error,
    // فقط رنگ کافی نیست: کاربرانی که رنگ را تشخیص نمی‌دهند هم باید ببینند
    // کدام کلمه اشتباه بوده.
    textDecorationLine: 'line-through',
  },
  // فقط fontWeight/پس‌زمینه عوض می‌شود، نه textDecorationLine — وگرنه روی
  // کلمه‌ی «missing» جایگزینِ خط‌خوردگی می‌شد و نشانه‌ی غلط‌بودنش گم می‌شد.
  scoredWordActive: {
    fontWeight: '800',
    borderRadius: 4,
    paddingHorizontal: 2,
  },
  scoredWordHeard: {
    color: COLORS.muted,
    fontFamily: FONT_FAMILY.regular,
    fontSize: 10,
    fontStyle: 'italic',
  },
});
