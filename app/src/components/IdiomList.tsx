import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { Check, Plus } from 'lucide-react-native';

import { COLORS, BORDER_RADIUS } from '../theme/colors';
import { FONT_FAMILY } from '../theme/typography';
import { useLanguage } from '../data/i18n';
import { useVocab } from '../data/VocabContext';
import { CEFR_ORDER, SCENE_LEVEL_TO_CEFR, listIdioms, type Idiom } from '../api/idioms';
import { getMyLevel } from '../api/assessment';

const PAGE_SIZE = 25;

const IdiomRow: React.FC<{
  idiom: Idiom;
  saved: boolean;
  onAdd: () => void;
}> = React.memo(({ idiom, saved, onAdd }) => (
  <View style={styles.row}>
    <View style={{ flex: 1, gap: 2 }}>
      <View style={styles.phraseRow}>
        <Text style={styles.phrase}>{idiom.phrase}</Text>
        {!!idiom.level && (
          <View style={styles.levelBadge}>
            <Text style={styles.levelBadgeText}>{idiom.level}</Text>
          </View>
        )}
      </View>
      {!!idiom.meaning_fa && <Text style={styles.meaning}>{idiom.meaning_fa}</Text>}
      {!!idiom.example_en && <Text style={styles.example}>{idiom.example_en}</Text>}
      {!!idiom.example_fa && <Text style={styles.meaning}>{idiom.example_fa}</Text>}
    </View>
    <TouchableOpacity
      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      disabled={saved}
      onPress={onAdd}
      style={styles.actionBtn}
    >
      {saved ? (
        <Check size={20} color={COLORS.success} />
      ) : (
        <Plus size={20} color={COLORS.primary} />
      )}
    </TouchableOpacity>
  </View>
));

/**
 * تب «اصطلاحات» در لایتنر به صورت FlatList و بارگذاری تدریجی (Pagination):
 * اصطلاحات به صورت دسته‌های ۲۵تایی از دیتابیس دریافت می‌شوند تا تأخیری در نمایش ایجاد نشود.
 */
export const IdiomList: React.FC<{ focusPhrases?: string[] }> = ({ focusPhrases }) => {
  const { t } = useLanguage();
  const { has, add } = useVocab();

  const { data: myLevel } = useQuery({ queryKey: ['myLevel'], queryFn: getMyLevel });
  const myCefr = SCENE_LEVEL_TO_CEFR[myLevel?.scene_level || 'starter'] || 'A1';

  const [selectedLevel, setSelectedLevel] = useState<string>('all');

  const {
    data,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    refetch,
    isRefetching,
  } = useInfiniteQuery({
    queryKey: ['idioms_paged', selectedLevel],
    queryFn: ({ pageParam = 0 }) =>
      listIdioms({
        limit: PAGE_SIZE,
        offset: pageParam,
        level: selectedLevel === 'all' ? undefined : selectedLevel,
      }),
    getNextPageParam: (lastPage, allPages) => {
      if (!lastPage || lastPage.length < PAGE_SIZE) return undefined;
      return allPages.length * PAGE_SIZE;
    },
    initialPageParam: 0,
    staleTime: 5 * 60 * 1000,
  });

  const idioms = useMemo(() => {
    return data?.pages.flatMap((page) => page) ?? [];
  }, [data]);

  const norm = (x: string) => x.trim().toLowerCase();
  const wanted = useMemo(() => (focusPhrases || []).map(norm), [focusPhrases]);

  const focusItems = useMemo(() => {
    if (!wanted.length) return [];
    return idioms.filter((i) => wanted.includes(norm(i.phrase)));
  }, [idioms, wanted]);

  const handleEndReached = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const renderItem = useCallback(
    ({ item }: { item: Idiom }) => (
      <IdiomRow
        idiom={item}
        saved={has(item.phrase)}
        onAdd={() => add({ word: item.phrase, meaning: item.meaning_fa })}
      />
    ),
    [has, add]
  );

  const keyExtractor = useCallback((item: Idiom) => item.id, []);

  const headerComponent = useMemo(() => {
    return (
      <View style={styles.headerWrap}>
        <Text style={styles.intro}>{t('idiomsIntro')}</Text>

        {/* فیلتر سطوح CEFR */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.levelFilterRow}
        >
          <TouchableOpacity
            style={[styles.levelFilterPill, selectedLevel === 'all' && styles.levelFilterPillActive]}
            onPress={() => setSelectedLevel('all')}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.levelFilterText,
                selectedLevel === 'all' && styles.levelFilterTextActive,
              ]}
            >
              {t('all')}
            </Text>
          </TouchableOpacity>

          {CEFR_ORDER.map((lvl) => {
            const isSelected = selectedLevel === lvl;
            const isUserLevel = lvl === myCefr;
            return (
              <TouchableOpacity
                key={lvl}
                style={[styles.levelFilterPill, isSelected && styles.levelFilterPillActive]}
                onPress={() => setSelectedLevel(lvl)}
                activeOpacity={0.8}
              >
                <Text style={[styles.levelFilterText, isSelected && styles.levelFilterTextActive]}>
                  {lvl}
                  {isUserLevel ? ` (${t('idiomsMyLevel')})` : ''}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* اصطلاح‌های این هفته اگر وجود داشت */}
        {focusItems.length > 0 && (
          <View style={styles.focusSection}>
            <Text style={styles.levelTitle}>{t('idiomsThisWeek')}</Text>
            {focusItems.map((i) => (
              <IdiomRow
                key={`focus-${i.id}`}
                idiom={i}
                saved={has(i.phrase)}
                onAdd={() => add({ word: i.phrase, meaning: i.meaning_fa })}
              />
            ))}
          </View>
        )}
      </View>
    );
  }, [t, selectedLevel, myCefr, focusItems, has, add]);

  if (isLoading && idioms.length === 0) {
    return <ActivityIndicator color={COLORS.primary} style={{ marginTop: 40 }} />;
  }

  return (
    <FlatList
      data={idioms}
      keyExtractor={keyExtractor}
      renderItem={renderItem}
      contentContainerStyle={styles.list}
      showsVerticalScrollIndicator={false}
      initialNumToRender={10}
      maxToRenderPerBatch={10}
      windowSize={7}
      removeClippedSubviews={true}
      onEndReached={handleEndReached}
      onEndReachedThreshold={0.4}
      refreshControl={
        <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={COLORS.primary} />
      }
      ListHeaderComponent={headerComponent}
      ListEmptyComponent={
        !isLoading ? <Text style={styles.empty}>{t('idiomsEmpty')}</Text> : null
      }
      ListFooterComponent={
        isFetchingNextPage ? (
          <ActivityIndicator color={COLORS.primary} style={{ marginVertical: 16 }} />
        ) : (
          <View style={{ height: 40 }} />
        )
      }
    />
  );
};

const styles = StyleSheet.create({
  list: {
    gap: 12,
    paddingBottom: 120,
  },
  headerWrap: {
    gap: 12,
    marginBottom: 4,
  },
  intro: {
    color: COLORS.textSecondary,
    fontFamily: FONT_FAMILY.regular,
    fontSize: 13,
    lineHeight: 20,
  },
  levelFilterRow: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 4,
  },
  levelFilterPill: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  levelFilterPillActive: {
    backgroundColor: COLORS.primaryLight,
    borderColor: COLORS.primary,
  },
  levelFilterText: {
    color: COLORS.textSecondary,
    fontFamily: FONT_FAMILY.medium,
    fontSize: 13,
  },
  levelFilterTextActive: {
    color: COLORS.primary,
    fontFamily: FONT_FAMILY.bold,
  },
  focusSection: {
    gap: 8,
    marginTop: 6,
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
  phraseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  phrase: {
    color: COLORS.text,
    fontFamily: FONT_FAMILY.bold,
    fontSize: 16,
    textAlign: 'left',
  },
  levelBadge: {
    backgroundColor: COLORS.surfaceLight,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 0.5,
    borderColor: COLORS.borderLight,
  },
  levelBadgeText: {
    color: COLORS.textSecondary,
    fontFamily: FONT_FAMILY.bold,
    fontSize: 10,
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
  actionBtn: {
    padding: 6,
  },
});
