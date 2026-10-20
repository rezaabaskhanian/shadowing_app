import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { Check, Plus } from 'lucide-react-native';

import { COLORS } from '../../../theme/colors';
import { FONT_FAMILY } from '../../../theme/typography';
import type { PhraseEntry } from '../../../data/scenarios';
import { listIdioms, matchIdioms } from '../../../api/idioms';
import { useVocab } from '../../../data/VocabContext';

export const idiomKeys = { list: ['idioms'] as const };

/**
 * اصطلاح/عبارت‌های همین جمله: هم آن‌هایی که ادمین برای جمله گذاشته، هم
 * اصطلاح‌های کتابخانه که خودکار در متن جمله پیدا می‌شوند. هر کدام با یک لمس
 * به لایتنر می‌رود. اگر هیچ‌کدام نباشد هیچ‌چیز (حتی عنوان) رندر نمی‌شود.
 */
export const DialoguePhrases: React.FC<{
  phrases?: PhraseEntry[];
  sentence?: string;
  accentColor: string;
  t: (key: string) => string;
}> = ({ phrases, sentence, accentColor, t }) => {
  const { has, add } = useVocab();
  const { data: idioms } = useQuery({ queryKey: idiomKeys.list, queryFn: listIdioms, staleTime: 60 * 60 * 1000 });

  const items: PhraseEntry[] = [...(phrases || [])];
  if (sentence && idioms?.length) {
    for (const i of matchIdioms(sentence, idioms)) {
      if (!items.some((p) => p.phrase.toLowerCase() === i.phrase.toLowerCase())) {
        items.push({ phrase: i.phrase, meaning: i.meaning_fa });
      }
    }
  }
  if (items.length === 0) return null;

  return (
    <View style={styles.block}>
      <Text style={[styles.title, { color: accentColor }]}>{t('dialoguePhrasesTitle')}</Text>
      {items.map((p, idx) => {
        const saved = has(p.phrase);
        return (
          <View key={`${p.phrase}-${idx}`} style={[styles.row, idx > 0 && styles.rowBorder]}>
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={styles.phrase}>{p.phrase}</Text>
              {!!p.meaning && <Text style={styles.meaning}>{p.meaning}</Text>}
            </View>
            <TouchableOpacity
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              disabled={saved}
              onPress={() => add({ word: p.phrase, meaning: p.meaning })}
              accessibilityLabel={t('addToLeitner')}
            >
              {saved ? <Check size={18} color={COLORS.success} /> : <Plus size={18} color={accentColor} />}
            </TouchableOpacity>
          </View>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  block: {
    alignSelf: 'stretch',
    backgroundColor: COLORS.surfaceLight,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 10,
  },
  title: {
    fontFamily: FONT_FAMILY.semiBold,
    fontSize: 12,
    marginBottom: 6,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 4,
  },
  rowBorder: {
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  phrase: {
    color: COLORS.text,
    fontFamily: FONT_FAMILY.bold,
    fontSize: 14,
  },
  meaning: {
    color: COLORS.textSecondary,
    fontFamily: FONT_FAMILY.regular,
    fontSize: 13,
  },
});
