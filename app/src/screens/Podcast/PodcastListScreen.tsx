import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ChevronLeft,
  ChevronRight,
  Clock,
  Headphones,
  Lock,
  Play,
  RotateCcw,
  Sparkles,
  X,
} from 'lucide-react-native';

import { COLORS, SPACING, BORDER_RADIUS, hexToRgba } from '../../theme/colors';
import { FONT_FAMILY, TEXT_STYLES } from '../../theme/typography';
import { useLanguage } from '../../data/i18n';
import { absUrl } from '../../api/config';
import { getPodcasts, atOrBelowLevel, type Podcast } from '../../api/podcasts';
import { getMyLevel } from '../../api/assessment';
import { getSubscriptionStatus } from '../../api/billing';
import { useAuth } from '../../data/AuthContext';

const LEVEL_META: Record<string, { labelKey: string; color: string; bg: string }> = {
  starter: { labelKey: 'levelStarter', color: '#059669', bg: '#ECFDF5' },
  beginner: { labelKey: 'levelBeginner', color: '#2563EB', bg: '#EFF6FF' },
  intermediate: { labelKey: 'levelIntermediate', color: '#D97706', bg: '#FFFBEB' },
  advanced: { labelKey: 'levelAdvanced', color: '#7C3AED', bg: '#F5F3FF' },
  proficient: { labelKey: 'levelProficient', color: '#DC2626', bg: '#FEF2F2' },
};

export const formatDuration = (seconds: number) => {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
};

const FREE_PODCASTS_COUNT = 4;

/**
 * لیست مدرن و انسانی پادکست‌های لینگوفلو
 * مطابق با هویت دیزاین سیستم جدید (Ivory background, Coral accents, Editorial cards)
 */
export const PodcastListScreen: React.FC = () => {
  const { t, language } = useLanguage();
  const rtl = language === 'fa';
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { user } = useAuth();

  const [isSubscribed, setIsSubscribed] = useState(false);
  const [allPodcasts, setPodcasts] = useState<Podcast[] | null>(null);
  const [error, setError] = useState(false);

  // درسی / منتخب؛ از پارامترهای ورودی مسیر یا پیش‌فرض «همه»
  const [kind, setKind] = useState<'all' | 'lesson' | 'featured'>(route.params?.kind ?? 'all');
  React.useEffect(() => {
    if (route.params?.kind) setKind(route.params.kind);
  }, [route.params?.kind]);

  const hasFeatured = !!allPodcasts?.some((p) => p.kind === 'featured');

  // فقط سطح کاربر و پایین‌تر
  const [myLevel, setMyLevel] = useState<string | null>(null);
  const scoped = allPodcasts ? atOrBelowLevel(allPodcasts, myLevel) : allPodcasts;

  // ترتیب‌بندی: هم‌سطح کاربر اول، بعد سطوح پایین‌تر
  const levelRank = (l: string) =>
    ['starter', 'beginner', 'intermediate', 'advanced', 'proficient'].indexOf(l);

  const podcasts = (
    scoped && kind !== 'all'
      ? scoped.filter((p) => (p.kind === 'featured' ? 'featured' : 'lesson') === kind)
      : scoped
  )
    ?.slice()
    .sort((a, b) => levelRank(b.level) - levelRank(a.level));

  const [savedProgress, setSavedProgress] = useState<Record<string, number>>({});

  const load = useCallback(() => {
    setError(false);
    if (user?.role === 'admin') {
      setIsSubscribed(true);
    } else {
      getSubscriptionStatus()
        .then((s) => setIsSubscribed(!!s?.active))
        .catch(() => setIsSubscribed(false));
    }
    getPodcasts()
      .then(async (list) => {
        setPodcasts(list);
        if (list && list.length > 0) {
          const keys = list.map((p) => `@podcast_pos_${p.id}`);
          const entries = await AsyncStorage.getMany(keys).catch(() => ({}));
          const progressMap: Record<string, number> = {};
          for (const [k, v] of Object.entries(entries)) {
            if (v) {
              const pId = k.replace('@podcast_pos_', '');
              const ms = parseInt(v, 10);
              if (ms > 3000) {
                progressMap[pId] = ms;
              }
            }
          }
          setSavedProgress(progressMap);
        }
      })
      .catch(() => setError(true));
    getMyLevel()
      .then((l) => setMyLevel(l.scene_level))
      .catch(() => {});
  }, [user?.role]);

  useFocusEffect(load);

  const ChevronIcon = rtl ? ChevronLeft : ChevronRight;

  const renderPodcastItem = useCallback(
    ({ item: p, index }: { item: Podcast; index: number }) => {
      const level = LEVEL_META[p.level] ?? LEVEL_META.beginner;
      const isLocked = !isSubscribed && index >= FREE_PODCASTS_COUNT;
      const hasCover = !!p.cover_url;
      const progressMs = savedProgress[p.id];
      const hasProgress = !isLocked && progressMs && progressMs > 3000 && progressMs < (p.duration_seconds - 5) * 1000;
      const progressPct = hasProgress
        ? Math.min(100, Math.max(0, (progressMs / (p.duration_seconds * 1000)) * 100))
        : 0;

      return (
        <TouchableOpacity
          key={p.id}
          style={styles.card}
          activeOpacity={0.9}
          onPress={() =>
            isLocked
              ? navigation.navigate('Paywall')
              : navigation.navigate('Podcast', { podcastId: p.id, openedAt: Date.now() })
          }
        >
          {/* بنر تصویری با کاور عکاسی باکیفیت */}
          <View style={styles.bannerWrap}>
            {hasCover ? (
              <Image
                source={{ uri: absUrl(p.cover_url!) }}
                style={styles.bannerImage}
                resizeMode="cover"
              />
            ) : (
              <View style={[styles.bannerPlaceholder, { backgroundColor: level.bg }]}>
                <Headphones size={42} color={level.color} />
              </View>
            )}

            {/* گرادینت تیره ملایم روی تصویر برای خوانایی */}
            <View style={styles.bannerOverlay} />

            {/* پچ نشانگر سطح در بالای تصویر */}
            <View style={[styles.badgeTopRow, rtl && styles.rowReverse]}>
              <View style={[styles.levelPill, { backgroundColor: level.bg, borderColor: level.color }]}>
                <Text style={[styles.levelPillText, { color: level.color }]}>
                  {t(level.labelKey)}
                </Text>
              </View>

              {isLocked ? (
                <View style={styles.lockedBadge}>
                  <Lock size={12} color={COLORS.white} />
                  <Text style={styles.lockedBadgeText}>
                    {rtl ? 'اشتراک ویژه' : 'Premium'}
                  </Text>
                </View>
              ) : hasProgress ? (
                <View style={styles.resumePill}>
                  <RotateCcw size={10} color={COLORS.white} />
                  <Text style={styles.resumePillText}>
                    {t('podcastResumeBadge').replace('{time}', formatDuration(Math.round(progressMs / 1000)))}
                  </Text>
                </View>
              ) : (
                <View style={styles.durationPill}>
                  <Clock size={11} color={COLORS.white} />
                  <Text style={styles.durationText}>{formatDuration(p.duration_seconds)}</Text>
                </View>
              )}
            </View>

            {/* نوار پیشرفت ادامه پخش در لبه پایین تصویر */}
            {hasProgress && (
              <View style={styles.cardProgressBarTrack}>
                <View style={[styles.cardProgressBarFill, { width: `${progressPct}%` }]} />
              </View>
            )}

            {/* دکمه شناور پخش در مرکز / راست بنر */}
            <View style={[styles.playButtonOverlay, isLocked && styles.playButtonLocked]}>
              {isLocked ? (
                <Lock size={20} color={COLORS.white} />
              ) : (
                <Play size={20} color={COLORS.white} fill={COLORS.white} style={{ marginLeft: 2 }} />
              )}
            </View>
          </View>

          {/* بدنه و توضیحات کارت */}
          <View style={styles.cardBody}>
            <View style={[styles.titleRow, rtl && styles.rowReverse]}>
              <Text style={[styles.cardTitle, { textAlign: rtl ? 'right' : 'left' }]} numberOfLines={1}>
                {p.title}
              </Text>
            </View>

            {!!p.description_fa && (
              <Text
                style={[styles.cardSubtitle, { textAlign: rtl ? 'right' : 'left' }]}
                numberOfLines={2}
              >
                {p.description_fa}
              </Text>
            )}

            <View style={[styles.cardFooter, rtl && styles.rowReverse]}>
              <View style={[styles.metaItem, rtl && styles.rowReverse]}>
                <Sparkles size={14} color={COLORS.primary} />
                <Text style={styles.metaText}>
                  {rtl
                    ? `${p.lines?.length || p.line_count || 12} جمله مکالمه`
                    : `${p.lines?.length || p.line_count || 12} dialogue lines`}
                </Text>
              </View>

              <View style={[styles.actionRow, rtl && styles.rowReverse]}>
                <Text style={styles.actionText}>
                  {isLocked
                    ? rtl ? 'باز کردن' : 'Unlock'
                    : hasProgress
                    ? rtl ? 'ادامه پادکست' : 'Resume'
                    : rtl ? 'شنیدن پادکست' : 'Listen'}
                </Text>
                <ChevronIcon size={14} color={COLORS.primary} />
              </View>
            </View>
          </View>
        </TouchableOpacity>
      );
    },
    [isSubscribed, savedProgress, rtl, t, navigation, ChevronIcon]
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top + SPACING.s }]}>
      {/* سربرگ مدرن با دکمه بازگشت و عنوان شفاف */}
      <View style={[styles.header, rtl && styles.rowReverse]}>
        <TouchableOpacity
          style={styles.closeBtn}
          onPress={() => navigation.goBack()}
          activeOpacity={0.8}
          accessibilityLabel={t('podcastBack')}
        >
          <X size={20} color={COLORS.text} />
        </TouchableOpacity>

        <View style={styles.titleWrap}>
          <Text style={styles.title}>{t('podcastTitle')}</Text>
          {podcasts && podcasts.length > 0 && (
            <View style={styles.countBadge}>
              <Text style={styles.countText}>
                {rtl ? `${podcasts.length} قسمت` : `${podcasts.length} episodes`}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.headerSpacer} />
      </View>

      {/* تب‌های فیلتر با استایل پیل‌های گرم */}
      {hasFeatured && (
        <View style={[styles.tabs, rtl && styles.rowReverse]}>
          {(
            [
              ['all', 'podcastFilterAll'],
              ['lesson', 'podcastFilterLessons'],
              ['featured', 'podcastFilterFeatured'],
            ] as const
          ).map(([id, key]) => {
            const isActive = kind === id;
            return (
              <TouchableOpacity
                key={id}
                style={[styles.tab, isActive && styles.tabActive]}
                onPress={() => setKind(id)}
                activeOpacity={0.8}
              >
                <Text style={[styles.tabText, isActive && styles.tabTextActive]}>{t(key)}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      )}

      {/* وضعیت لودینگ */}
      {podcasts === null && !error && (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>{rtl ? 'در حال دریافت پادکست‌ها...' : 'Loading podcasts...'}</Text>
        </View>
      )}

      {/* وضعیت خطا */}
      {error && (
        <View style={styles.center}>
          <Text style={styles.mutedText}>{t('podcastLoadError')}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={load} activeOpacity={0.85}>
            <RotateCcw size={16} color={COLORS.white} />
            <Text style={styles.retryBtnText}>{t('topicSpeakingRetry')}</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* وضعیت لیست خالی */}
      {podcasts && podcasts.length === 0 && (
        <View style={styles.center}>
          <Headphones size={48} color="#D0C8B8" />
          <Text style={styles.mutedText}>{t('podcastEmpty')}</Text>
        </View>
      )}

      {/* لیست کارت‌های اختصاصی پادکست با FlatList بهینه و سریع */}
      {podcasts && podcasts.length > 0 && (
        <FlatList
          data={podcasts}
          renderItem={renderPodcastItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + SPACING.xl }]}
          showsVerticalScrollIndicator={false}
          initialNumToRender={6}
          maxToRenderPerBatch={6}
          windowSize={5}
          removeClippedSubviews={Platform.OS === 'android'}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FDFBF7',
    paddingHorizontal: SPACING.l,
  },
  rowReverse: {
    flexDirection: 'row-reverse',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.m,
  },
  closeBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.white,
    borderWidth: 1.5,
    borderColor: '#F0EBE3',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#2C2014',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  titleWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontFamily: FONT_FAMILY.bold,
    fontSize: 20,
    color: '#191C21',
    letterSpacing: -0.3,
  },
  countBadge: {
    backgroundColor: '#FFF3ED',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    marginTop: 2,
  },
  countText: {
    fontFamily: FONT_FAMILY.semiBold,
    fontSize: 11,
    color: '#FF6422',
  },
  headerSpacer: {
    width: 40,
  },
  tabs: {
    flexDirection: 'row',
    gap: SPACING.s,
    marginBottom: SPACING.l,
    justifyContent: 'center',
  },
  tab: {
    paddingHorizontal: 18,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: '#F0EBE3',
  },
  tabActive: {
    backgroundColor: '#FFF3ED',
    borderColor: '#FF6422',
  },
  tabText: {
    color: '#697082',
    fontFamily: FONT_FAMILY.semiBold,
    fontSize: 13,
  },
  tabTextActive: {
    color: '#FF6422',
    fontFamily: FONT_FAMILY.bold,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.m,
  },
  loadingText: {
    fontFamily: FONT_FAMILY.medium,
    fontSize: 13,
    color: '#8E95A5',
  },
  mutedText: {
    fontFamily: FONT_FAMILY.medium,
    fontSize: 14,
    color: '#697082',
    textAlign: 'center',
  },
  retryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FF6422',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    marginTop: 6,
  },
  retryBtnText: {
    fontFamily: FONT_FAMILY.semiBold,
    fontSize: 13,
    color: COLORS.white,
  },
  list: {
    gap: SPACING.l,
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    borderWidth: 1.2,
    borderColor: '#F0EBE3',
    overflow: 'hidden',
    shadowColor: '#2C2014',
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  bannerWrap: {
    height: 154,
    width: '100%',
    position: 'relative',
    backgroundColor: '#FAF5EE',
  },
  bannerImage: {
    width: '100%',
    height: '100%',
  },
  bannerPlaceholder: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bannerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(20, 24, 34, 0.28)',
  },
  badgeTopRow: {
    position: 'absolute',
    top: 12,
    left: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  levelPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    borderWidth: 1,
  },
  levelPillText: {
    fontFamily: FONT_FAMILY.bold,
    fontSize: 11,
  },
  lockedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FF6422',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 10,
  },
  lockedBadgeText: {
    fontFamily: FONT_FAMILY.bold,
    fontSize: 11,
    color: COLORS.white,
  },
  durationPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 10,
  },
  durationText: {
    fontFamily: FONT_FAMILY.medium,
    fontSize: 11,
    color: COLORS.white,
  },
  resumePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FF6422',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 10,
  },
  resumePillText: {
    fontFamily: FONT_FAMILY.bold,
    fontSize: 10.5,
    color: COLORS.white,
  },
  cardProgressBarTrack: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 3.5,
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
  },
  cardProgressBarFill: {
    height: '100%',
    backgroundColor: '#FF6422',
    borderRadius: 2,
  },
  playButtonOverlay: {
    position: 'absolute',
    bottom: 12,
    right: 14,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FF6422',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#FF6422',
    shadowOpacity: 0.35,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
  },
  playButtonLocked: {
    backgroundColor: '#191C21',
  },
  cardBody: {
    padding: 16,
    gap: 8,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardTitle: {
    flex: 1,
    fontFamily: FONT_FAMILY.bold,
    fontSize: 16,
    color: '#191C21',
    lineHeight: 23,
  },
  cardSubtitle: {
    fontFamily: FONT_FAMILY.regular,
    fontSize: 13,
    color: '#697082',
    lineHeight: 20,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F6F2EC',
    marginTop: 4,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  metaText: {
    fontFamily: FONT_FAMILY.medium,
    fontSize: 12,
    color: '#8E95A5',
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  actionText: {
    fontFamily: FONT_FAMILY.bold,
    fontSize: 12.5,
    color: '#FF6422',
  },
});
