import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Check, Layers, Plus } from 'lucide-react-native';

import { COLORS } from '../../../theme/colors';
import { FONT_FAMILY } from '../../../theme/typography';
import { useVocab } from '../../../data/VocabContext';
import type { WordEntry } from '../../../data/scenarios';

/**
 * لغت‌های همین جمله (که از API می‌آیند) را زیر جمله نشان می‌دهد: هر چیپ شامل
 * خود واژه و معنی‌اش است و با زدن روی آن، واژه به جعبه‌ی لایتنر اضافه (یا در
 * صورت وجود، از آن حذف) می‌شود.
 */
export const DialogueVocabChips: React.FC<{
  words?: WordEntry[];
  onOpenLeitner: () => void;
  /** رنگ اختصاصیِ مرحله‌ی فعلی. */
  accentColor: string;
  accentLightColor: string;
  rtl?: boolean;
  t: (key: string) => string;
}> = ({ words, onOpenLeitner, accentColor, accentLightColor, rtl = false, t }) => {
  const row = rtl && styles.rowReverse;
  const { has, add, remove, box } = useVocab();

  if (!words || words.length === 0) return null;

  return (
    <View style={styles.vocabBlock}>
      <View style={[styles.vocabChipsRow, row]}>
        {words.map((w, idx) => {
          const added = has(w.word);
          return (
            <TouchableOpacity
              key={`${w.word}-${idx}`}
              activeOpacity={0.8}
              style={[styles.vocabChip, row, added ? styles.vocabChipAdded : null]}
              onPress={() => (added ? remove(w.word) : add(w))}
            >
              {added ? (
                <Check size={13} color={COLORS.tertiary} />
              ) : (
                <Plus size={13} color={accentColor} />
              )}
              <Text style={[styles.vocabChipWord, added ? styles.vocabChipWordAdded : null]}>
                {w.word}
              </Text>
              <Text style={styles.vocabChipMeaning}>{w.meaning}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* میان‌بر به جعبه‌ی لایتنر (جایگزین لینکی که در WordsSheet بود) */}
      <TouchableOpacity style={[styles.leitnerBoxLink, row, { backgroundColor: accentLightColor }]} onPress={onOpenLeitner}>
        <Layers size={14} color={accentColor} />
        <Text style={[styles.leitnerBoxLinkText, { color: accentColor }]}>
          {t('leitnerBoxTitle')} ({box.length})
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  rowReverse: { flexDirection: 'row-reverse' },
  vocabBlock: {
    alignItems: 'center',
    alignSelf: 'stretch',
  },
  leitnerBoxLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginBottom: 10,
  },
  leitnerBoxLinkText: {
    fontFamily: FONT_FAMILY.semiBold,
    fontSize: 12,
  },
  vocabChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
    marginTop: 2,
    marginBottom: 10,
  },
  vocabChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#EFECE6',
    borderWidth: 1,
    borderColor: '#E4E0D8',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  vocabChipAdded: {
    backgroundColor: COLORS.tertiaryLight,
    borderColor: COLORS.tertiary,
  },
  vocabChipWord: {
    color: COLORS.text,
    fontFamily: FONT_FAMILY.bold,
    fontSize: 13,
  },
  vocabChipWordAdded: {
    color: COLORS.tertiary,
  },
  vocabChipMeaning: {
    color: COLORS.textSecondary,
    fontFamily: FONT_FAMILY.regular,
    fontSize: 12,
  },
});
