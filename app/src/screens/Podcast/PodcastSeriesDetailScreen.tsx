import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
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

import { COLORS, SPACING } from '../../theme/colors';
import { FONT_FAMILY } from '../../theme/typography';
import { useLanguage } from '../../data/i18n';
import { absUrl } from '../../api/config';
import {
  getPodcastSeriesDetail,
  type Podcast,
  type PodcastSeries,
} from '../../api/podcasts';
import { getSubscriptionStatus } from '../../api/billing';
import { useAuth } from '../../data/AuthContext';
import { formatDuration } from './PodcastListScreen';

const LEVEL_META: Record<string, { labelKey: string; color: string; bg: string }> = {
  starter: { labelKey: 'levelStarter', color: '#059669', bg: '#ECFDF5' },
  beginner: { labelKey: 'levelBeginner', color: '#2563EB', bg: '#EFF6FF' },
  intermediate: { labelKey: 'levelIntermediate', color: '#D97706', bg: '#FFFBEB' },
  advanced: { labelKey: 'levelAdvanced', color: '#7C3AED', bg: '#F5F3FF' },
  proficient: { labelKey: 'levelProficient', color: '#DC2626', bg: '#FEF2F2' },
};

export const PodcastSeriesDetailScreen: React.FC = () => {
  const { t, language } = useLanguage();
  const rtl = language === 'fa';
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { user } = useAuth();

  const seriesId: string | undefined = route.params?.seriesId;
  const [series, setSeries] = useState<PodcastSeries | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [savedProgress, setSavedProgress] = useState<Record<string, number>>({});

  const load = useCallback(() => {
    if (!seriesId) {
      setError(true);
      setLoading(false);
      return;
    }
    setError(false);

    if (user?.role === 'admin') {
      setIsSubscribed(true);
    } else {
      getSubscriptionStatus()
        .then((s) => setIsSubscribed(!!s?.active))
        .catch(() => setIsSubscribed(false));
    }

    getPodcastSeriesDetail(seriesId)
      .then(async (data) => {
        setSeries(data);
        if (data.episodes && data.episodes.length > 0) {
          const keys = data.episodes.map((ep) => `@podcast_pos_${ep.id}`);
          const entries = await AsyncStorage.getMany(keys).catch(() => ({}));
          const progressMap: Record<string, number> = {};
          for (const [k, v] of Object.entries(entries)) {
            if (v) {
              const pId = k.replace('@podcast_pos_', '');
              const ms = parseInt(v, 10);
              if (ms > 3000) progressMap[pId] = ms;
            }
          }
          setSavedProgress(progressMap);
        }
        setLoading(false);
      })
      .catch(() => {
        setError(true);
        setLoading(false);
      });
  }, [seriesId, user?.role]);

  useFocusEffect(load);

  const ChevronIcon = rtl ? ChevronLeft : ChevronRight;
  const levelMeta = series ? LEVEL_META[series.level] ?? LEVEL_META.beginner : LEVEL_META.beginner;

  // پیدا کردن اولین قسمتی که کاربر ناتمام گذاشته یا قسمت اول
  const firstUnfinishedEpisode = series?.episodes?.find((ep) => {
    const ms = savedProgress[ep.id] || 0;
    return ms > 3000 && ms < (ep.duration_seconds - 5) * 1000;
  }) || series?.episodes?.[0];

  const handleStartSeries = () => {
    if (!firstUnfinishedEpisode) return;
    navigation.navigate('Podcast', {
      podcastId: firstUnfinishedEpisode.id,
      openedAt: Date.now(),
    });
  };

  const renderHeader = () => {
    if (!series) return null;
    return (
      <View style={styles.headerContainer}>
        {/* تصویر کاور بزرگ مجموعه */}
        <View style={styles.coverWrapper}>
          {series.cover_url ? (
            <Image
              source={{ uri: absUrl(series.cover_url) }}
              style={styles.coverImage}
              resizeMode="cover"
            />
          ) : (
            <View style={[styles.coverPlaceholder, { backgroundColor: levelMeta.bg }]}>
              <Headphones size={64} color={levelMeta.color} />
            </View>
          )}
          <View style={styles.coverOverlay} />

          {/* نشانگر سطح و تعداد قسمت‌ها */}
          <View style={[styles.coverBadges, rtl && styles.rowReverse]}>
            <View style={[styles.levelPill, { backgroundColor: levelMeta.bg, borderColor: levelMeta.color }]}>
              <Text style={[styles.levelPillText, { color: levelMeta.color }]}>
                {t(levelMeta.labelKey)}
              </Text>
            </View>

            <View style={styles.durationBadge}>
              <Clock size={11} color={COLORS.white} />
              <Text style={styles.durationBadgeText}>
                {rtl
                  ? `${series.episodes_count || series.episodes?.length || 0} قسمت · ${Math.round((series.total_duration || 0) / 60)} دقیقه`
                  : `${series.episodes_count || series.episodes?.length || 0} eps · ${Math.round((series.total_duration || 0) / 60)} min`}
              </Text>
            </View>
          </View>
        </View>

        {/* متون و توضیحات مجموعه */}
        <View style={[styles.detailsWrap, { alignItems: rtl ? 'flex-end' : 'flex-start' }]}>
          <Text style={[styles.seriesTitle, { textAlign: rtl ? 'right' : 'left' }]}>
            {series.title}
          </Text>
          {!!series.description_fa && (
            <Text style={[styles.seriesDescription, { textAlign: rtl ? 'right' : 'left' }]}>
              {series.description_fa}
            </Text>
          )}

          {/* دکمه شروع / ادامه پخش کل مجموعه */}
          {series.episodes && series.episodes.length > 0 && (
            <TouchableOpacity
              style={[styles.startSeriesBtn, rtl && styles.rowReverse]}
              onPress={handleStartSeries}
              activeOpacity={0.88}
            >
              <Play size={18} color={COLORS.white} fill={COLORS.white} />
              <Text style={styles.startSeriesBtnText}>
                {firstUnfinishedEpisode && savedProgress[firstUnfinishedEpisode.id]
                  ? rtl
                    ? `ادامه ${firstUnfinishedEpisode.title}`
                    : `Resume ${firstUnfinishedEpisode.title}`
                  : rtl
                  ? 'شروع و پخش خودکار مجموعه'
                  : 'Start Series'}
              </Text>
            </TouchableOpacity>
          )}

          <View style={styles.divider} />
          <Text style={[styles.episodesHeaderTitle, { textAlign: rtl ? 'right' : 'left' }]}>
            {rtl ? 'قسمت‌های این مجموعه' : 'Episodes'}
          </Text>
        </View>
      </View>
    );
  };

  const renderEpisodeItem = ({ item: ep, index }: { item: Podcast; index: number }) => {
    const isLocked = !isSubscribed && index >= 2; // قسمت‌های اول نمونه رایگان
    const progressMs = savedProgress[ep.id] || 0;
    const hasProgress = !isLocked && progressMs > 3000 && progressMs < (ep.duration_seconds - 5) * 1000;
    const progressPct = hasProgress
      ? Math.min(100, Math.max(0, (progressMs / (ep.duration_seconds * 1000)) * 100))
      : 0;

    return (
      <TouchableOpacity
        style={styles.episodeCard}
        activeOpacity={0.85}
        onPress={() =>
          isLocked
            ? navigation.navigate('Paywall')
            : navigation.navigate('Podcast', { podcastId: ep.id, openedAt: Date.now() })
        }
      >
        <View style={[styles.episodeRow, rtl && styles.rowReverse]}>
          {/* شماره قسمت */}
          <View style={[styles.epNumberBadge, isLocked && styles.epNumberLocked]}>
            {isLocked ? (
              <Lock size={15} color="#8E95A5" />
            ) : (
              <Text style={styles.epNumberText}>{ep.episode_no || index + 1}</Text>
            )}
          </View>

          {/* اطلاعات قسمت */}
          <View style={[styles.epInfo, { alignItems: rtl ? 'flex-end' : 'flex-start' }]}>
            <Text
              style={[styles.epTitle, { textAlign: rtl ? 'right' : 'left' }]}
              numberOfLines={1}
            >
              {ep.title}
            </Text>

            <View style={[styles.epMetaRow, rtl && styles.rowReverse]}>
              <View style={[styles.metaItem, rtl && styles.rowReverse]}>
                <Clock size={11} color="#8E95A5" />
                <Text style={styles.metaText}>{formatDuration(ep.duration_seconds)}</Text>
              </View>

              <View style={[styles.metaItem, rtl && styles.rowReverse]}>
                <Sparkles size={11} color={COLORS.primary} />
                <Text style={styles.metaText}>
                  {rtl
                    ? `${ep.lines?.length || ep.line_count || 12} جمله`
                    : `${ep.lines?.length || ep.line_count || 12} lines`}
                </Text>
              </View>

              {hasProgress && (
                <View style={[styles.metaItem, rtl && styles.rowReverse]}>
                  <RotateCcw size={10} color="#FF6422" />
                  <Text style={[styles.metaText, { color: '#FF6422', fontFamily: FONT_FAMILY.bold }]}>
                    {formatDuration(Math.round(progressMs / 1000))}
                  </Text>
                </View>
              )}
            </View>
          </View>

          {/* آیکون پخش */}
          <View style={[styles.epPlayBtn, isLocked && styles.epPlayBtnLocked]}>
            {isLocked ? (
              <Lock size={14} color="#8E95A5" />
            ) : (
              <Play size={14} color={COLORS.primary} fill={COLORS.primary} style={{ marginLeft: 2 }} />
            )}
          </View>
        </View>

        {/* نوار باریک پیشرفت در صورت ناتمام بودن */}
        {hasProgress && (
          <View style={styles.episodeProgressBarTrack}>
            <View style={[styles.episodeProgressBarFill, { width: `${progressPct}%` }]} />
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top + SPACING.s }]}>
      {/* نوار بالای صفحه */}
      <View style={[styles.topBar, rtl && styles.rowReverse]}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
          activeOpacity={0.8}
        >
          <X size={20} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.topBarTitle}>{rtl ? 'مجموعه پادکست' : 'Podcast Series'}</Text>
        <View style={{ width: 40 }} />
      </View>

      {loading && (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      )}

      {error && (
        <View style={styles.center}>
          <Text style={styles.errorText}>{rtl ? 'مجموعه بارگذاری نشد' : 'Could not load series'}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={load} activeOpacity={0.85}>
            <RotateCcw size={15} color={COLORS.white} />
            <Text style={styles.retryBtnText}>{rtl ? 'تلاش دوباره' : 'Retry'}</Text>
          </TouchableOpacity>
        </View>
      )}

      {!loading && !error && series && (
        <FlatList
          data={series.episodes || []}
          renderItem={renderEpisodeItem}
          keyExtractor={(item) => item.id}
          ListHeaderComponent={renderHeader}
          contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + SPACING.xl }]}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FDFBF7',
  },
  rowReverse: {
    flexDirection: 'row-reverse',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.l,
    marginBottom: SPACING.m,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: '#F0EBE3',
    alignItems: 'center',
    justifyContent: 'center',
  },
  topBarTitle: {
    fontFamily: FONT_FAMILY.bold,
    fontSize: 16,
    color: '#191C21',
  },
  headerContainer: {
    marginBottom: SPACING.m,
  },
  coverWrapper: {
    height: 200,
    borderRadius: 22,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#FAF5EE',
    borderWidth: 1,
    borderColor: '#EFEBE4',
    marginBottom: SPACING.m,
  },
  coverImage: {
    width: '100%',
    height: '100%',
  },
  coverPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  coverOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
  },
  coverBadges: {
    position: 'absolute',
    top: 14,
    left: 14,
    right: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  levelPill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    borderWidth: 1,
  },
  levelPillText: {
    fontFamily: FONT_FAMILY.bold,
    fontSize: 11,
  },
  durationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  durationBadgeText: {
    fontFamily: FONT_FAMILY.medium,
    fontSize: 11,
    color: COLORS.white,
  },
  detailsWrap: {
    gap: 8,
  },
  seriesTitle: {
    fontFamily: FONT_FAMILY.bold,
    fontSize: 21,
    color: '#191C21',
    lineHeight: 30,
  },
  seriesDescription: {
    fontFamily: FONT_FAMILY.regular,
    fontSize: 13.5,
    color: '#697082',
    lineHeight: 22,
  },
  startSeriesBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#FF6422',
    borderRadius: 16,
    paddingVertical: 13,
    paddingHorizontal: 20,
    marginTop: 6,
    shadowColor: '#FF6422',
    shadowOpacity: 0.28,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  startSeriesBtnText: {
    fontFamily: FONT_FAMILY.bold,
    fontSize: 14,
    color: COLORS.white,
  },
  divider: {
    height: 1,
    backgroundColor: '#F0EBE3',
    marginVertical: 14,
    width: '100%',
  },
  episodesHeaderTitle: {
    fontFamily: FONT_FAMILY.bold,
    fontSize: 15,
    color: '#191C21',
    marginBottom: 4,
  },
  listContent: {
    paddingHorizontal: SPACING.l,
    gap: 10,
  },
  episodeCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    borderWidth: 1.2,
    borderColor: '#F0EBE3',
    padding: 12,
    overflow: 'hidden',
  },
  episodeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  epNumberBadge: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: '#FFF0EA',
    borderWidth: 1,
    borderColor: '#FAD8C7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  epNumberLocked: {
    backgroundColor: '#F2EDE4',
    borderColor: '#E5DFD4',
  },
  epNumberText: {
    fontFamily: FONT_FAMILY.bold,
    fontSize: 14,
    color: '#FF6422',
  },
  epInfo: {
    flex: 1,
    gap: 4,
  },
  epTitle: {
    fontFamily: FONT_FAMILY.bold,
    fontSize: 13.5,
    color: '#191C21',
  },
  epMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontFamily: FONT_FAMILY.regular,
    fontSize: 11,
    color: '#8E95A5',
  },
  epPlayBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#FFF4EE',
    borderWidth: 1,
    borderColor: '#FCD7C7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  epPlayBtnLocked: {
    backgroundColor: '#F5F0E8',
    borderColor: '#E8E2D6',
  },
  episodeProgressBarTrack: {
    height: 3,
    backgroundColor: '#F0EBE3',
    borderRadius: 1.5,
    marginTop: 8,
    overflow: 'hidden',
  },
  episodeProgressBarFill: {
    height: '100%',
    backgroundColor: '#FF6422',
    borderRadius: 1.5,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  errorText: {
    fontFamily: FONT_FAMILY.medium,
    fontSize: 14,
    color: '#697082',
  },
  retryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FF6422',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
  },
  retryBtnText: {
    fontFamily: FONT_FAMILY.semiBold,
    fontSize: 12,
    color: COLORS.white,
  },
});
