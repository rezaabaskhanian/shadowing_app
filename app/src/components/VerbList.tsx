import React from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useQuery } from '@tanstack/react-query';
import { ChevronRight, Layers } from 'lucide-react-native';

import { COLORS, BORDER_RADIUS } from '../theme/colors';
import { FONT_FAMILY } from '../theme/typography';
import { useLanguage } from '../data/i18n';
import { listVerbs } from '../api/verbs';

export const verbKeys = {
  list: ['verbs'] as const,
  detail: (id: string) => ['verbs', id] as const,
};

/** لیست افعال چندمعنایی (تب «افعال» در صفحه‌ی لایتنر) با پیشرفت هر فعل. */
export const VerbList = () => {
  const navigation = useNavigation<any>();
  const { t } = useLanguage();
  const { data, isLoading } = useQuery({ queryKey: verbKeys.list, queryFn: listVerbs });

  if (isLoading) return <ActivityIndicator color={COLORS.primary} style={{ marginTop: 40 }} />;

  const verbs = data || [];
  return (
    <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
      <Text style={styles.intro}>{t('verbsIntro')}</Text>
      {verbs.length === 0 && <Text style={styles.empty}>{t('verbsEmpty')}</Text>}
      {verbs.map((v) => {
        const percent = v.meaning_count > 0 ? (v.learned_count / v.meaning_count) * 100 : 0;
        return (
          <TouchableOpacity
            key={v.id}
            style={styles.row}
            activeOpacity={0.85}
            onPress={() => navigation.navigate('VerbDetail', { verbId: v.id })}
          >
            <View style={styles.iconWrap}>
              <Layers size={18} color={COLORS.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.lemma}>{v.lemma}</Text>
              <Text style={styles.sub}>
                {t('verbLearnedOf')
                  .replace('{learned}', String(v.learned_count))
                  .replace('{total}', String(v.meaning_count))}
              </Text>
              <View style={styles.track}>
                <View style={[styles.fill, { width: `${percent}%` }]} />
              </View>
            </View>
            <ChevronRight size={18} color={COLORS.muted} />
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  list: {
    gap: 10,
    paddingBottom: 120,
  },
  intro: {
    color: COLORS.textSecondary,
    fontFamily: FONT_FAMILY.regular,
    fontSize: 13,
    lineHeight: 20,
    marginBottom: 4,
  },
  empty: {
    color: COLORS.textSecondary,
    fontFamily: FONT_FAMILY.medium,
    textAlign: 'center',
    marginTop: 30,
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
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lemma: {
    color: COLORS.text,
    fontFamily: FONT_FAMILY.bold,
    fontSize: 17,
    textAlign: 'left',
  },
  sub: {
    color: COLORS.textSecondary,
    fontFamily: FONT_FAMILY.regular,
    fontSize: 12,
    marginTop: 2,
  },
  track: {
    height: 5,
    borderRadius: 3,
    backgroundColor: COLORS.borderLight,
    overflow: 'hidden',
    marginTop: 8,
  },
  fill: {
    height: '100%',
    borderRadius: 3,
    backgroundColor: COLORS.tertiary,
  },
});
