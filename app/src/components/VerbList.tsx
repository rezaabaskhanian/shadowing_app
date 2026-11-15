import React, { useCallback, useMemo } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useInfiniteQuery } from '@tanstack/react-query';
import { ChevronRight, Layers } from 'lucide-react-native';

import { COLORS, BORDER_RADIUS } from '../theme/colors';
import { FONT_FAMILY } from '../theme/typography';
import { useLanguage } from '../data/i18n';
import { listVerbs, type VerbListItem } from '../api/verbs';

export const verbKeys = {
  list: ['verbs'] as const,
  detail: (id: string) => ['verbs', id] as const,
};

const PAGE_SIZE = 20;

const VerbRow: React.FC<{
  item: VerbListItem;
  onPress: () => void;
  learnedOfText: string;
}> = React.memo(({ item, onPress, learnedOfText }) => {
  const percent = item.meaning_count > 0 ? (item.learned_count / item.meaning_count) * 100 : 0;
  return (
    <TouchableOpacity
      style={styles.row}
      activeOpacity={0.85}
      onPress={onPress}
    >
      <View style={styles.iconWrap}>
        <Layers size={18} color={COLORS.primary} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.lemma}>{item.lemma}</Text>
        <Text style={styles.sub}>
          {learnedOfText
            .replace('{learned}', String(item.learned_count))
            .replace('{total}', String(item.meaning_count))}
        </Text>
        <View style={styles.track}>
          <View style={[styles.fill, { width: `${percent}%` }]} />
        </View>
      </View>
      <ChevronRight size={18} color={COLORS.muted} />
    </TouchableOpacity>
  );
});

/** لیست افعال چندمعنایی به صورت FlatList و صفحه‌بندی‌شده برای بارگذاری بهینه */
export const VerbList = () => {
  const navigation = useNavigation<any>();
  const { t } = useLanguage();

  const {
    data,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    refetch,
    isRefetching,
  } = useInfiniteQuery({
    queryKey: verbKeys.list,
    queryFn: ({ pageParam = 0 }) => listVerbs({ limit: PAGE_SIZE, offset: pageParam }),
    getNextPageParam: (lastPage, allPages) => {
      if (!lastPage || lastPage.length < PAGE_SIZE) return undefined;
      return allPages.length * PAGE_SIZE;
    },
    initialPageParam: 0,
    staleTime: 5 * 60 * 1000,
  });

  const verbs = useMemo(() => {
    return data?.pages.flatMap((page) => page) ?? [];
  }, [data]);

  const handleEndReached = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const learnedOfText = t('verbLearnedOf');

  const renderItem = useCallback(
    ({ item }: { item: VerbListItem }) => (
      <VerbRow
        item={item}
        onPress={() => navigation.navigate('VerbDetail', { verbId: item.id })}
        learnedOfText={learnedOfText}
      />
    ),
    [navigation, learnedOfText]
  );

  const keyExtractor = useCallback((item: VerbListItem) => item.id, []);

  if (isLoading && verbs.length === 0) {
    return <ActivityIndicator color={COLORS.primary} style={{ marginTop: 40 }} />;
  }

  return (
    <FlatList
      data={verbs}
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
      ListHeaderComponent={<Text style={styles.intro}>{t('verbsIntro')}</Text>}
      ListEmptyComponent={
        !isLoading ? <Text style={styles.empty}>{t('verbsEmpty')}</Text> : null
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
