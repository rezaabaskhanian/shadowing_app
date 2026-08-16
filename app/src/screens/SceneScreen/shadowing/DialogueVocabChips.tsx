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
  t: (key: string) => string;
}> = ({ words, onOpenLeitner, t }) => {
  const { has, add, remove, box } = useVocab();

  if (!words || words.length === 0) return null;

  return (
    <View style={styles.vocabBlock}>
      <View style={styles.vocabChipsRow}>
        {words.map((w, idx) => {
          const added = has(w.word);
          return (
            <TouchableOpacity
              key={`${w.word}-${idx}`}
              activeOpacity={0.8}
              style={[styles.vocabChip, added ? styles.vocabChipAdded : null]}
              onPress={() => (added ? remove(w.word) : add(w))}
            >
              {added ? (
                <Check size={13} color={COLORS.tertiary} />
              ) : (
                <Plus size={13} color={COLORS.primary} />
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
      <TouchableOpacity style={styles.leitnerBoxLink} onPress={onOpenLeitner}>
        <Layers size={14} color={COLORS.primary} />
        <Text style={styles.leitnerBoxLinkText}>
          {t('leitnerBoxTitle')} ({box.length})
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  vocabBlock: {
    alignItems: 'center',
    alignSelf: 'stretch',
  },
  leitnerBoxLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.primaryLight,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginBottom: 10,
  },
  leitnerBoxLinkText: {
    color: COLORS.primary,
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
    backgroundColor: COLORS.surfaceLight,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 6,
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
