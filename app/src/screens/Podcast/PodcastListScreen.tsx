import React, { useCallback, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Headphones, Play, X } from 'lucide-react-native';

import { COLORS, SPACING, BORDER_RADIUS } from '../../theme/colors';
import { FONT_FAMILY, TEXT_STYLES } from '../../theme/typography';
import { useLanguage } from '../../data/i18n';
import { absUrl } from '../../api/config';
import { getPodcasts, atOrBelowLevel, type Podcast } from '../../api/podcasts';
import { BannerCard, ListHero } from '../../components/ContentVisuals';
import { getMyLevel } from '../../api/assessment';

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
  // فقط سطح کاربر و پایین‌تر (درسی و منتخب)؛ سطح بالاتر هرگز.
  const [myLevel, setMyLevel] = useState<string | null>(null);
  const scoped = allPodcasts ? atOrBelowLevel(allPodcasts, myLevel) : allPodcasts;
  const podcasts =
    scoped && kind !== 'all'
      ? scoped.filter((p) => (p.kind === 'featured' ? 'featured' : 'lesson') === kind)
      : scoped;

  const load = useCallback(() => {
    setError(false);
    getPodcasts()
      .then(setPodcasts)
      .catch(() => setError(true));
    getMyLevel()
      .then((l) => setMyLevel(l.scene_level))
      .catch(() => {});
  }, []);

  useFocusEffect(load);

  return (
    <View style={[styles.container, { paddingTop: insets.top + SPACING.s }]}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.closeBtn} onPress={() => navigation.goBack()} activeOpacity={0.8}>
          <X size={20} color={COLORS.text} />
        </TouchableOpacity>
        <ListHero
          icon={<Headphones size={26} color={COLORS.white} />}
          color={COLORS.pink}
          title={t('podcastTitle')}
          subtitle={t('podcastSubtitle')}
        />
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
              <BannerCard
                key={p.id}
                image={p.cover_url ? { uri: absUrl(p.cover_url) } : null}
                accent={level.bg}
                icon={<Play size={18} color={COLORS.white} fill={COLORS.white} />}
                title={p.title}
                subtitle={p.description_fa}
                badgeLabel={t(level.labelKey)}
                cornerLabel={`🎧 ${formatDuration(p.duration_seconds)}`}
                onPress={() => navigation.navigate('Podcast', { podcastId: p.id, openedAt: Date.now() })}
              />
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
});
