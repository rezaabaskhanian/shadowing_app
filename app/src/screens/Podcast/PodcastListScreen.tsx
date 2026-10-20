import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Clock, Headphones, X } from 'lucide-react-native';

import { COLORS, SPACING, BORDER_RADIUS } from '../../theme/colors';
import { FONT_FAMILY, TEXT_STYLES } from '../../theme/typography';
import { SHADOWS } from '../../theme/elevation';
import { useLanguage } from '../../data/i18n';
import { absUrl } from '../../api/config';
import { getPodcasts, type Podcast } from '../../api/podcasts';

const LEVEL_META: Record<string, { labelKey: string; bg: string }> = {
  starter: { labelKey: 'levelStarter', bg: COLORS.levelStarterBg },
  beginner: { labelKey: 'levelBeginner', bg: COLORS.levelBeginnerBg },
  intermediate: { labelKey: 'levelIntermediate', bg: COLORS.levelIntermediateBg },
  advanced: { labelKey: 'levelAdvanced', bg: COLORS.levelAdvancedBg },
  proficient: { labelKey: 'levelProficient', bg: COLORS.levelProficientBg },
};

export const formatDuration = (seconds: number) => {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
};

/** لیست پادکست‌ها؛ ورودی از منوی کناری. */
export const PodcastListScreen: React.FC = () => {
  const { t } = useLanguage();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const [allPodcasts, setPodcasts] = useState<Podcast[] | null>(null);
  const [error, setError] = useState(false);
  // درسی / منتخب؛ از خانه با «همه»ی هر بخش، همان نوع از قبل انتخاب است.
  const [kind, setKind] = useState<'all' | 'lesson' | 'featured'>(route.params?.kind ?? 'all');
  React.useEffect(() => {
    if (route.params?.kind) setKind(route.params.kind);
  }, [route.params?.kind]);
  const hasFeatured = !!allPodcasts?.some((p) => p.kind === 'featured');
  const podcasts =
    allPodcasts && kind !== 'all'
      ? allPodcasts.filter((p) => (p.kind === 'featured' ? 'featured' : 'lesson') === kind)
      : allPodcasts;

  const load = useCallback(() => {
    setError(false);
    getPodcasts()
      .then(setPodcasts)
      .catch(() => setError(true));
  }, []);

  useFocusEffect(load);

  return (
    <View style={[styles.container, { paddingTop: insets.top + SPACING.s }]}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.closeBtn} onPress={() => navigation.goBack()} activeOpacity={0.8}>
          <X size={20} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('podcastTitle')}</Text>
        <Text style={styles.headerSub}>{t('podcastSubtitle')}</Text>
      </View>

      {hasFeatured && (
        <View style={styles.tabs}>
          {(
            [
              ['all', 'podcastFilterAll'],
              ['lesson', 'podcastFilterLessons'],
              ['featured', 'podcastFilterFeatured'],
            ] as const
          ).map(([id, key]) => (
            <TouchableOpacity
              key={id}
              style={[styles.tab, kind === id && styles.tabActive]}
              onPress={() => setKind(id)}
              activeOpacity={0.8}
            >
              <Text style={[styles.tabText, kind === id && styles.tabTextActive]}>{t(key)}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {podcasts === null && !error && (
        <View style={styles.center}>
          <ActivityIndicator color={COLORS.primary} />
        </View>
      )}
      {error && (
        <View style={styles.center}>
          <Text style={styles.mutedText}>{t('podcastLoadError')}</Text>
          <TouchableOpacity onPress={load} activeOpacity={0.8}>
            <Text style={styles.linkText}>{t('topicSpeakingRetry')}</Text>
          </TouchableOpacity>
        </View>
      )}
      {podcasts && podcasts.length === 0 && (
        <View style={styles.center}>
          <Text style={styles.mutedText}>{t('podcastEmpty')}</Text>
        </View>
      )}

      {podcasts && podcasts.length > 0 && (
        <ScrollView
          contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + SPACING.l }]}
          showsVerticalScrollIndicator={false}
        >
          {podcasts.map((p) => {
            const level = LEVEL_META[p.level] ?? LEVEL_META.beginner;
            return (
              <TouchableOpacity
                key={p.id}
                style={styles.card}
                activeOpacity={0.85}
                onPress={() => navigation.navigate('Podcast', { podcastId: p.id, openedAt: Date.now() })}
              >
                <View style={styles.cardIcon}>
                  {p.cover_url ? (
                    <Image source={{ uri: absUrl(p.cover_url) }} style={styles.cardCover} />
                  ) : (
                    <Headphones size={22} color={COLORS.primary} />
                  )}
                </View>
                <View style={styles.cardBody}>
                  <Text style={styles.cardTitle}>{p.title}</Text>
                  {!!p.description_fa && (
                    <Text style={styles.cardDesc} numberOfLines={2}>
                      {p.description_fa}
                    </Text>
                  )}
                  <View style={styles.metaRow}>
                    <View style={[styles.badge, { backgroundColor: level.bg }]}>
                      <Text style={styles.badgeText}>{t(level.labelKey)}</Text>
                    </View>
                    <View style={styles.metaItem}>
                      <Clock size={13} color={COLORS.muted} />
                      <Text style={styles.metaText}>{formatDuration(p.duration_seconds)}</Text>
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  tabs: {
    flexDirection: 'row',
    gap: SPACING.s,
    marginBottom: SPACING.m,
    justifyContent: 'center',
  },
  tab: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  tabActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  tabText: {
    color: COLORS.textSecondary,
    fontFamily: FONT_FAMILY.semiBold,
    fontSize: 13,
  },
  tabTextActive: {
    color: COLORS.white,
  },
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    paddingHorizontal: SPACING.l,
  },
  header: {
    alignItems: 'center',
    marginBottom: SPACING.m,
  },
  closeBtn: {
    alignSelf: 'flex-start',
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.s,
  },
  headerTitle: {
    ...TEXT_STYLES.headlineSm,
    color: COLORS.text,
  },
  headerSub: {
    ...TEXT_STYLES.bodyMd,
    color: COLORS.textSecondary,
    marginTop: 4,
    textAlign: 'center',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.s,
  },
  mutedText: {
    ...TEXT_STYLES.bodyMd,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  linkText: {
    ...TEXT_STYLES.labelMd,
    color: COLORS.primary,
    fontFamily: FONT_FAMILY.semiBold,
  },
  list: {
    gap: SPACING.m,
  },
  card: {
    flexDirection: 'row',
    gap: SPACING.m,
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.l,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.m,
    ...SHADOWS.level1,
  },
  cardIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  cardCover: {
    width: '100%',
    height: '100%',
  },
  cardBody: {
    flex: 1,
  },
  cardTitle: {
    fontFamily: FONT_FAMILY.bold,
    fontSize: 16,
    color: COLORS.text,
  },
  cardDesc: {
    ...TEXT_STYLES.labelMd,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.s,
    marginTop: SPACING.s,
  },
  badge: {
    borderRadius: BORDER_RADIUS.s,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  badgeText: {
    fontFamily: FONT_FAMILY.semiBold,
    fontSize: 11,
    color: COLORS.text,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    ...TEXT_STYLES.labelSm,
    color: COLORS.muted,
  },
});
