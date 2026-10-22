import React, { useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { Check, Plus } from 'lucide-react-native';

import { COLORS, BORDER_RADIUS } from '../theme/colors';
import { FONT_FAMILY } from '../theme/typography';
import { useLanguage } from '../data/i18n';
import { useVocab } from '../data/VocabContext';
import { CEFR_ORDER, SCENE_LEVEL_TO_CEFR, listIdioms, type Idiom } from '../api/idioms';
import { getMyLevel } from '../api/assessment';
import { idiomKeys } from '../screens/SceneScreen/shadowing/DialoguePhrases';

/**
 * تب «اصطلاحات» در لایتنر: اصطلاح‌های پرکاربرد به ترتیب سطح CEFR. پیش‌فرض فقط
 * تا یک سطح بالاتر از سطح کاربر نشان داده می‌شود تا با اصطلاح‌های خیلی
 * پیشرفته غرق نشود؛ «همه‌ی سطح‌ها» بقیه را هم باز می‌کند.
 */
export const IdiomList: React.FC<{ focusPhrases?: string[] }> = ({ focusPhrases }) => {
  const { t } = useLanguage();
  const { has, add } = useVocab();
  const [showAll, setShowAll] = useState(false);
  const { data, isLoading } = useQuery({ queryKey: idiomKeys.list, queryFn: listIdioms, staleTime: 60 * 60 * 1000 });
  const { data: myLevel } = useQuery({ queryKey: ['myLevel'], queryFn: getMyLevel });

  if (isLoading) return <ActivityIndicator color={COLORS.primary} style={{ marginTop: 40 }} />;

  const myCefr = SCENE_LEVEL_TO_CEFR[myLevel?.scene_level || 'starter'] || 'A1';
  const maxIndex = showAll ? CEFR_ORDER.length - 1 : Math.min(CEFR_ORDER.indexOf(myCefr) + 1, CEFR_ORDER.length - 1);
  const levels = CEFR_ORDER.slice(0, maxIndex + 1);

  const idioms = data || [];
  // اصطلاح‌های «این هفته» (از قدم مسیر)، بالای فهرست و مستقل از فیلتر سطح
  // با خودِ عبارت (نه شناسه) جور می‌شود چون شناسه‌ها با ایمپورت دوباره عوض می‌شوند.
  const norm = (x: string) => x.trim().toLowerCase();
  const wanted = (focusPhrases || []).map(norm);
  const focus = wanted.length ? idioms.filter((i) => wanted.includes(norm(i.phrase))) : [];
  const byLevel = (lvl: string) => idioms.filter((i) => i.level === lvl);
  const unlevelled = idioms.filter((i) => !CEFR_ORDER.includes(i.level));
  const hidden = idioms.filter((i) => CEFR_ORDER.indexOf(i.level) > maxIndex).length;

  return (
    <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
      <Text style={styles.intro}>{t('idiomsIntro')}</Text>
      {idioms.length === 0 && <Text style={styles.empty}>{t('idiomsEmpty')}</Text>}

      {focus.length > 0 && (
        <View style={{ gap: 8 }}>
          <Text style={styles.levelTitle}>{t('idiomsThisWeek')}</Text>
          {focus.map((i) => (
            <IdiomRow key={i.id} idiom={i} saved={has(i.phrase)} onAdd={() => add({ word: i.phrase, meaning: i.meaning_fa })} />
          ))}
        </View>
      )}

      {levels.map((lvl) => {
        const items = byLevel(lvl);
        if (items.length === 0) return null;
        return (
          <View key={lvl} style={{ gap: 8 }}>
            <Text style={styles.levelTitle}>
              {lvl}
              {lvl === myCefr ? ` · ${t('idiomsMyLevel')}` : ''}
            </Text>
            {items.map((i) => (
              <IdiomRow key={i.id} idiom={i} saved={has(i.phrase)} onAdd={() => add({ word: i.phrase, meaning: i.meaning_fa })} />
            ))}
          </View>
        );
      })}

      {showAll && unlevelled.length > 0 && (
        <View style={{ gap: 8 }}>
          {unlevelled.map((i) => (
            <IdiomRow key={i.id} idiom={i} saved={has(i.phrase)} onAdd={() => add({ word: i.phrase, meaning: i.meaning_fa })} />
          ))}
        </View>
      )}

      {!showAll && (hidden > 0 || unlevelled.length > 0) && (
        <TouchableOpacity onPress={() => setShowAll(true)}>
          <Text style={styles.more}>{t('idiomsShowAll')}</Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  );
};

const IdiomRow: React.FC<{ idiom: Idiom; saved: boolean; onAdd: () => void }> = ({ idiom, saved, onAdd }) => (
  <View style={styles.row}>
    <View style={{ flex: 1, gap: 2 }}>
      <Text style={styles.phrase}>{idiom.phrase}</Text>
      {!!idiom.meaning_fa && <Text style={styles.meaning}>{idiom.meaning_fa}</Text>}
      {!!idiom.example_en && <Text style={styles.example}>{idiom.example_en}</Text>}
      {!!idiom.example_fa && <Text style={styles.meaning}>{idiom.example_fa}</Text>}
    </View>
    <TouchableOpacity hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }} disabled={saved} onPress={onAdd}>
      {saved ? <Check size={20} color={COLORS.success} /> : <Plus size={20} color={COLORS.primary} />}
    </TouchableOpacity>
  </View>
);

const styles = StyleSheet.create({
  list: { gap: 14, paddingBottom: 120 },
  intro: {
    color: COLORS.textSecondary,
    fontFamily: FONT_FAMILY.regular,
    fontSize: 13,
    lineHeight: 20,
  },
  empty: {
    color: COLORS.textSecondary,
    fontFamily: FONT_FAMILY.medium,
    textAlign: 'center',
    marginTop: 30,
  },
  levelTitle: {
    color: COLORS.primary,
    fontFamily: FONT_FAMILY.bold,
    fontSize: 14,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.l,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 14,
  },
  phrase: {
    color: COLORS.text,
    fontFamily: FONT_FAMILY.bold,
    fontSize: 16,
    textAlign: 'left',
  },
  meaning: {
    color: COLORS.textSecondary,
    fontFamily: FONT_FAMILY.regular,
    fontSize: 13,
  },
  example: {
    color: COLORS.text,
    fontFamily: FONT_FAMILY.regular,
    fontSize: 13,
    textAlign: 'left',
    marginTop: 4,
  },
  more: {
    color: COLORS.primary,
    fontFamily: FONT_FAMILY.semiBold,
    textAlign: 'center',
    marginTop: 4,
  },
});
