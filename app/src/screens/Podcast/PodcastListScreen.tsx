import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Clock, Headphones, Play, X } from 'lucide-react-native';

import { COLORS, SPACING, BORDER_RADIUS, hexToRgba } from '../../theme/colors';
import { FONT_FAMILY, TEXT_STYLES } from '../../theme/typography';
import { SHADOWS } from '../../theme/elevation';
import { useLanguage } from '../../data/i18n';
import { absUrl } from '../../api/config';
import { getPodcasts, featuredForLevel, type Podcast } from '../../api/podcasts';
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
  // منتخب‌ها پیش‌فرض فقط سطح کاربر و یک سطح بالاتر؛ «همه‌ی سطح‌ها» بقیه را باز می‌کند.
  const [myLevel, setMyLevel] = useState<string | null>(null);
  const [allLevels, setAllLevels] = useState(false);
  const scoped = allPodcasts && !allLevels ? featuredForLevel(allPodcasts, myLevel) : allPodcasts;
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
        <View style={styles.heroIcon}>
          <Headphones size={26} color={COLORS.white} />
        </View>
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

      {hasFeatured && kind !== 'lesson' && !!myLevel && (
        <TouchableOpacity onPress={() => setAllLevels((v) => !v)} activeOpacity={0.8} style={{ alignSelf: 'center', paddingVertical: SPACING.xs }}>
          <Text style={styles.linkText}>{allLevels ? t('podcastMyLevelsOnly') : t('podcastAllLevels')}</Text>
        </TouchableOpacity>
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
                {/* بنر بالای کارت: تصویرِ پادکست؛ بدون تصویر، نوار رنگیِ همان سطح. */}
                <View style={[styles.banner, { backgroundColor: level.bg }]}>
                  {p.cover_url ? (
                    <Image source={{ uri: absUrl(p.cover_url) }} style={styles.bannerImage} resizeMode="cover" />
                  ) : (
                    <Headphones size={34} color={hexToRgba(COLORS.white, 0.9)} />
                  )}
                  <View style={styles.playBadge}>
                    <Play size={16} color={COLORS.white} fill={COLORS.white} />
                  </View>
                  <View style={styles.durationBadge}>
                    <Clock size={12} color={COLORS.white} />
                    <Text style={styles.durationText}>{formatDuration(p.duration_seconds)}</Text>
                  </View>
                </View>
                <View style={[styles.cardBody, { borderTopColor: level.bg }]}>
                  <View style={styles.titleRow}>
                    <Text style={styles.cardTitle} numberOfLines={1}>
                      {p.title}
                    </Text>
                    <View style={[styles.badge, { backgroundColor: level.bg }]}>
                      <Text style={styles.badgeText}>{t(level.labelKey)}</Text>
                    </View>
                  </View>
                  {!!p.description_fa && (
                    <Text style={styles.cardDesc} numberOfLines={2}>
                      {p.description_fa}
                    </Text>
                  )}
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
  heroIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.pink,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.s,
    ...SHADOWS.level2,
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.l,
    overflow: 'hidden',
    ...SHADOWS.level1,
  },
  banner: {
    height: 120,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bannerImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
  },
  playBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: hexToRgba(COLORS.black, 0.45),
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: hexToRgba(COLORS.white, 0.85),
  },
  durationBadge: {
    position: 'absolute',
    bottom: SPACING.s,
    right: SPACING.s,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: hexToRgba(COLORS.black, 0.55),
    borderRadius: BORDER_RADIUS.full,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  durationText: {
    ...TEXT_STYLES.labelSm,
    color: COLORS.white,
  },
  cardBody: {
    padding: SPACING.m,
    borderTopWidth: 3,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.s,
  },
  cardTitle: {
    flex: 1,
    fontFamily: FONT_FAMILY.bold,
    fontSize: 16,
    color: COLORS.text,
  },
  cardDesc: {
    ...TEXT_STYLES.labelMd,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  badge: {
    borderRadius: BORDER_RADIUS.s,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  badgeText: {
    fontFamily: FONT_FAMILY.semiBold,
    fontSize: 11,
    color: COLORS.white,
  },
});
