import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { COLORS } from '../../../theme/colors';
import { FONT_FAMILY } from '../../../theme/typography';
import type { WordScore } from '../../../api/shadowing';

/**
 * جمله‌ی هدف با رنگ‌بندی کلمه‌به‌کلمه از روی نتیجه‌ی نمره‌دهی تلفظ.
 *
 * سبز = درست ادا شده، زرد = مبهم/ناقص، قرمزِ خط‌خورده = اصلاً گفته نشده یا
 * کلمه‌ی دیگری جایش آمده. زیر هر کلمه‌ی اشتباه، چیزی که واقعاً شنیده شده
 * نوشته می‌شود تا کاربر بفهمد چه گفته.
 */
export const ScoredDialogueText: React.FC<{ words: WordScore[] }> = ({ words }) => (
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
  scoredWordHeard: {
    color: COLORS.muted,
    fontFamily: FONT_FAMILY.regular,
    fontSize: 10,
    fontStyle: 'italic',
  },
});
