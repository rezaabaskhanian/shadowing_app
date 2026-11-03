import React, { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, BookOpen, ChevronLeft, Clapperboard, Clapperboard as ClapIcon, Film, Headphones, Lock, Mic, Play, Search, Trophy, Tv, Users, X } from 'lucide-react-native';
import { GradientFill } from '../../components/GradientFill';

import { COLORS, SPACING } from '../../theme/colors';
import { FONT_FAMILY, TEXT_STYLES } from '../../theme/typography';
import { useLanguage } from '../../data/i18n';
import { absUrl } from '../../api/config';
import { getVideoClips, type ClipLevel, type VideoClipListItem } from '../../api/videoClips';
import { SCENE_CATEGORY_LABEL_KEY } from '../../data/scenarios';
import { getSubscriptionStatus } from '../../api/billing';
import { useAuth } from '../../data/AuthContext';

type SourceFilter = 'all' | 'flow' | 'movie';
const SOURCE_TABS: { id: SourceFilter; labelKey: string }[] = [
  { id: 'all', labelKey: 'videoClipsFilterAll' },
  { id: 'flow', labelKey: 'videoClipsFilterFlow' },
  { id: 'movie', labelKey: 'videoClipsFilterMovie' },
];

const LEVEL_META: Record<ClipLevel, { labelKey: string; bg: string }> = {
  beginner: { labelKey: 'levelBeginner', bg: COLORS.levelBeginnerBg },
  intermediate: { labelKey: 'levelIntermediate', bg: COLORS.levelIntermediateBg },
  advanced: { labelKey: 'levelAdvanced', bg: COLORS.levelAdvancedBg },
  proficient: { labelKey: 'levelProficient', bg: COLORS.levelProficientBg },
};

const MAIN_LEVEL_TABS: { id: ClipLevel | ''; label: string; color: string }[] = [
  { id: '', label: 'همه سطح‌ها', color: COLORS.textSecondary },
  { id: 'beginner', label: 'مبتدی', color: COLORS.levelBeginnerBg },
  { id: 'intermediate', label: 'متوسط', color: COLORS.levelIntermediateBg },
  { id: 'advanced', label: 'پیشرفته', color: COLORS.levelAdvancedBg },
];

/**
 * تا وقتی هیچ کلیپی منتشر نشده: معرفی «به‌زودی» و دو تمرین جایگزین، به‌جای یک پیام خالی.
 */
const VideoComingSoon: React.FC<{ t: (k: string) => string; onGo: (route: string) => void }> = ({ t, onGo }) => (
  <ScrollView contentContainerStyle={styles.soonBody} showsVerticalScrollIndicator={false}>
    <View style={styles.soonTile}>
      <GradientFill from="#FFF1E8" to="#FDE1D2" />
      <View style={styles.soonScreen}>
        <ClapIcon size={30} color={COLORS.white} />
      </View>
      <View style={styles.soonMic}>
        <Mic size={13} color={COLORS.primary} />
      </View>
      <View style={styles.soonHd}>
        <Text style={styles.soonHdText}>HD</Text>
      </View>
    </View>
    <View style={styles.soonStatus}>
      <Film size={12} color={COLORS.textSecondary} />
      <Text style={styles.soonStatusText}>{t('videoSoonStatus')}</Text>
      <View style={styles.soonStatusDot} />
    </View>
    <Text style={styles.soonTitle}>{t('videoSoonTitle')}</Text>
    <Text style={styles.soonDesc}>{t('videoSoonDesc')}</Text>

    <View style={styles.soonTryRow}>
      <Text style={styles.soonTry}>{t('videoSoonTry')}</Text>
      <TouchableOpacity style={styles.soonOther} onPress={() => onGo('Home')} activeOpacity={0.8}>
        <ChevronLeft size={13} color={COLORS.primary} />
        <Text style={styles.soonOtherText}>{t('videoSoonOther')}</Text>
      </TouchableOpacity>
    </View>
    <View style={styles.soonCards}>
      {[
        { route: 'StoryList', Icon: BookOpen, title: 'videoSoonStory', sub: 'videoSoonStorySub' },
        { route: 'PodcastList', Icon: Headphones, title: 'videoSoonPodcast', sub: 'videoSoonPodcastSub' },
      ].map((c) => (
        <TouchableOpacity key={c.route} style={styles.soonCard} onPress={() => onGo(c.route)} activeOpacity={0.85}>
          <View style={styles.soonCardTop}>
            <View style={styles.soonActive}>
              <Text style={styles.soonActiveText}>{t('videoSoonActive')}</Text>
            </View>
            <View style={styles.soonCardIcon}>
              <c.Icon size={16} color={COLORS.primary} />
            </View>
          </View>
          <Text style={styles.soonCardTitle}>{t(c.title)}</Text>
          <Text style={styles.soonCardSub}>{t(c.sub)}</Text>
        </TouchableOpacity>
      ))}
    </View>

    <TouchableOpacity style={styles.soonCta} onPress={() => onGo('Home')} activeOpacity={0.85}>
      <GradientFill from="#F07A4A" to="#E8572F" horizontal />
      <View style={styles.soonCtaInner}>
        <Text style={styles.soonCtaText}>{t('videoSoonCta')}</Text>
        <ArrowLeft size={18} color={COLORS.white} />
      </View>
    </TouchableOpacity>
  </ScrollView>
);

/** لیست کلیپ‌های «تمرین با ویدیو»؛ ورودی از منوی کناری. */
export const VideoClipListScreen: React.FC = () => {
  const { t } = useLanguage();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const [clips, setClips] = useState<VideoClipListItem[] | null>(null);
  const [error, setError] = useState(false);
  // از خانه با «همه»ی بخشِ «ساخته‌ی ما» یا «از فیلم‌ها» می‌شود مستقیم با همان فیلتر آمد.
  const [source, setSource] = useState<SourceFilter>(route.params?.source ?? 'all');
  const [category, setCategory] = useState('');
  // دنبال‌کردنِ یک فیلم: همه‌ی تکه‌های همان فیلم به ترتیبِ ادمین (position).
  const [movie, setMovie] = useState(route.params?.movieTitle ?? '');
  const [level, setLevel] = useState<ClipLevel | ''>('');
  const { user } = useAuth();
  const [isSubscribed, setIsSubscribed] = useState(false);

  const load = useCallback(() => {
    setError(false);
    getVideoClips()
      .then(setClips)
      .catch(() => setError(true));
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
      if (user?.role === 'admin') {
        setIsSubscribed(true);
        return;
      }
      getSubscriptionStatus()
        .then((s) => setIsSubscribed(!!s?.active))
        .catch(() => setIsSubscribed(false));
    }, [load, user?.role])
  );

  React.useEffect(() => {
    if (route.params?.source) setSource(route.params.source);
    if (route.params?.movieTitle) {
      setSource('movie');
      setMovie(route.params.movieTitle);
    }
  }, [route.params?.source, route.params?.movieTitle]);

  // یکدست‌سازی سطح تمام قسمت‌های هر سریال:
  // طبق اصل آموزشی، وقتی یک سریال برای یک سطح است (مثلاً مبتدی یا پیشرفته)،
  // تمام قسمت‌های آن سریال تا آخر همان سطح یکپارچه را خواهند داشت.
  const normalizedClips = useMemo(() => {
    if (!clips) return null;
    const seriesLevelMap: Record<string, ClipLevel> = {};
    clips.forEach((c) => {
      if (c.source === 'movie' && c.movie_title) {
        const title = c.movie_title.trim();
        if (!seriesLevelMap[title]) {
          seriesLevelMap[title] = c.level || 'beginner';
        }
      }
    });

    return clips.map((c) => {
      if (c.source === 'movie' && c.movie_title) {
        const title = c.movie_title.trim();
        const sLevel = seriesLevelMap[title];
        if (sLevel && c.level !== sLevel) {
          return { ...c, level: sLevel };
        }
      }
      return c;
    });
  }, [clips]);

  const bySource = useMemo(
    () => (normalizedClips ?? []).filter((c) => source === 'all' || c.source === source),
    [normalizedClips, source]
  );
  // فقط دسته‌هایی که واقعاً کلیپ دارند چیپ می‌گیرند.
  const categories = useMemo(
    () => Object.keys(SCENE_CATEGORY_LABEL_KEY).filter((k) => bySource.some((c) => c.category === k)),
    [bySource]
  );
  // فیلتر فیلم فقط در تبِ «از فیلم‌ها» و فقط وقتی بیش از یک فیلم داریم معنا دارد.
  const movies = useMemo(
    () =>
      source === 'movie'
        ? Array.from(new Set(bySource.map((c) => (c.movie_title || '').trim()).filter(Boolean)))
        : [],
    [bySource, source]
  );
  // فقط سطح‌هایی که واقعاً کلیپ دارند چیپ می‌گیرند.
  const availableLevels = useMemo(
    () => (Object.keys(LEVEL_META) as ClipLevel[]).filter((l) => bySource.some((c) => c.level === l)),
    [bySource]
  );
  const filtered = bySource.filter(
    (c) => (!category || c.category === category) && (!movie || (c.movie_title || '').trim() === movie) && (!level || c.level === level)
  );
  // سریالِ انتخاب‌شده به ترتیبِ فصل و قسمت می‌آید (sort پایدار است، پس داخل هر قسمت ترتیبِ ادمین می‌ماند).
  const visible = movie ? [...filtered].sort(episodeOrder) : filtered;

  // محاسبه ایندکس هر کلیپ درون سطح خود برای محدودیت ۴ کلیپ رایگان در هر سطح
  const levelIndexMap = useMemo(() => {
    const map = new Map<string, number>();
    const countByLevel: Record<string, number> = {};
    (normalizedClips ?? []).forEach((c) => {
      const lvl = c.level || 'beginner';
      const idx = countByLevel[lvl] || 0;
      map.set(c.id, idx);
      countByLevel[lvl] = idx + 1;
    });
    return map;
  }, [normalizedClips]);

  const isClipLocked = useCallback(
    (clip: VideoClipListItem) => {
      if (isSubscribed) return false;
      const idx = levelIndexMap.get(clip.id) ?? 0;
      return idx >= 4;
    },
    [isSubscribed, levelIndexMap]
  );

  // دسته‌بندی و لیست سریال‌ها برای ویترین (سطح هر سریال یکتا و یکپارچه است)
  const seriesList = useMemo(() => {
    const movieClips = (normalizedClips ?? []).filter((c) => c.source === 'movie' && !!c.movie_title);
    const groups: Record<string, VideoClipListItem[]> = {};
    movieClips.forEach((c) => {
      const title = c.movie_title!.trim();
      if (!groups[title]) groups[title] = [];
      groups[title].push(c);
    });
    return Object.keys(groups).map((title) => {
      const sClips = groups[title].sort(episodeOrder);
      const seriesLevel = sClips[0]?.level || 'beginner';
      return {
        title,
        posterUrl: sClips.find((c) => c.poster_url)?.poster_url,
        clipCount: sClips.length,
        clips: sClips,
        level: seriesLevel,
      };
    });
  }, [normalizedClips]);

  const filteredSeriesList = useMemo(() => {
    if (!level) return seriesList;
    return seriesList.filter((s) => s.level === level);
  }, [seriesList, level]);

  const flowClips = useMemo(
    () => (normalizedClips ?? []).filter((c) => c.source !== 'movie'),
    [normalizedClips]
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top + SPACING.s }]}>
      <View style={styles.topRow}>
        <View style={styles.tagChip}>
          <Text style={styles.tagChipText}>{t('videoSoonTag')}</Text>
          <View style={styles.tagDot} />
        </View>
        <TouchableOpacity style={styles.closeBtn} onPress={() => navigation.goBack()} activeOpacity={0.8}>
          <X size={20} color={COLORS.text} />
        </TouchableOpacity>
      </View>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{t('videoClipsTitle')}</Text>
        <Text style={styles.headerSub}>{clips && clips.length === 0 ? t('videoSoonSub') : t('videoClipsSubtitle')}</Text>
      </View>

      {clips === null && !error && (
        <View style={styles.center}>
          <ActivityIndicator color={COLORS.primary} />
        </View>
      )}

      {error && (
        <View style={styles.center}>
          <Text style={styles.mutedText}>{t('videoClipsLoadError')}</Text>
          <TouchableOpacity onPress={load} activeOpacity={0.8}>
            <Text style={styles.linkText}>{t('topicSpeakingRetry')}</Text>
          </TouchableOpacity>
        </View>
      )}

      {clips && clips.length === 0 && <VideoComingSoon t={t} onGo={(r) => navigation.navigate(r)} />}

      {clips && clips.length > 0 && (
        <View style={styles.filters}>
          {/* تب‌های اصلی سطح‌بندی (مبتدی، متوسط، پیشرفته) */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsRow}>
            {MAIN_LEVEL_TABS.map((tab) => {
              const active = level === tab.id;
              const count = (normalizedClips ?? []).filter((c) => (tab.id ? c.level === tab.id : true)).length;
              return (
                <TouchableOpacity
                  key={tab.id || 'all-levels'}
                  style={[
                    styles.levelFilterTab,
                    active && styles.levelFilterTabActive,
                    active && tab.id ? { borderColor: tab.color, backgroundColor: tab.color + '14' } : null,
                  ]}
                  activeOpacity={0.8}
                  onPress={() => setLevel(tab.id)}
                >
                  {tab.id ? (
                    <View style={[styles.levelFilterDot, { backgroundColor: tab.color }]} />
                  ) : null}
                  <Text
                    style={[
                      styles.levelFilterText,
                      active && styles.levelFilterTextActive,
                      active && tab.id ? { color: tab.color } : null,
                    ]}
                  >
                    {tab.label}
                  </Text>
                  {count > 0 ? (
                    <View style={[styles.countBubble, active && styles.countBubbleActive]}>
                      <Text style={[styles.countText, active && styles.countTextActive]}>
                        {count.toLocaleString('fa-IR')}
                      </Text>
                    </View>
                  ) : (
                    <View style={[styles.countBubble, { backgroundColor: '#F0EFEA' }]}>
                      <Text style={[styles.countText, { color: COLORS.muted }]}>به‌زودی</Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* تب‌های دسته‌بندی منبع (همه / از فیلم‌ها / ساخته‌ی ما) */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsRow}>
            {SOURCE_TABS.map((tab) => {
              const active = source === tab.id;
              const count = (normalizedClips ?? []).filter(
                (c) => (tab.id === 'all' || c.source === tab.id) && (!level || c.level === level)
              ).length;
              return (
                <TouchableOpacity
                  key={tab.id}
                  style={[styles.sourceTab, active && styles.sourceTabActive]}
                  activeOpacity={0.8}
                  onPress={() => {
                    setSource(tab.id);
                    setCategory('');
                    setMovie('');
                  }}
                >
                  <Text style={[styles.sourceTabText, active && styles.sourceTabTextActive]}>{t(tab.labelKey)}</Text>
                  <View style={[styles.countBubble, active && styles.countBubbleActive]}>
                    <Text style={[styles.countText, active && styles.countTextActive]}>
                      {count.toLocaleString('fa-IR')}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {movies.length > 1 && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsRow}>
              {['', ...movies].map((m) => (
                <TouchableOpacity
                  key={m || 'all-movies'}
                  style={[styles.chip, movie === m && styles.chipActive]}
                  activeOpacity={0.8}
                  onPress={() => setMovie(m)}
                >
                  <Text style={[styles.chipText, movie === m && styles.chipTextActive]}>
                    {m ? `🎞 ${m}` : t('videoClipsAllMovies')}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}

          {categories.length > 0 && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsRow}>
              {['', ...categories].map((k) => (
                <TouchableOpacity
                  key={k || 'all'}
                  style={[styles.chip, category === k && styles.chipActive]}
                  activeOpacity={0.8}
                  onPress={() => setCategory(k)}
                >
                  <Text style={[styles.chipText, category === k && styles.chipTextActive]}>
                    {k ? t(SCENE_CATEGORY_LABEL_KEY[k]) : t('videoClipsFilterAll')}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}
        </View>
      )}

      {clips && clips.length > 0 && visible.length === 0 && (
        <View style={styles.emptyContainer}>
          {level ? (
            <View style={styles.emptyLevelBlock}>
              <View style={[styles.emptyLevelBadge, { backgroundColor: (LEVEL_META[level]?.bg ?? COLORS.primary) + '15' }]}>
                <Film size={28} color={LEVEL_META[level]?.bg ?? COLORS.primary} />
              </View>
              <Text style={styles.emptyLevelTitle}>
                ویدیوهای سطح {t(LEVEL_META[level]?.labelKey ?? '')} به‌زودی
              </Text>
              <Text style={styles.emptyLevelDesc}>
                سریال‌ها و تمرین‌های ویدیویی سطح {t(LEVEL_META[level]?.labelKey ?? '')} در حال آماده‌سازی هستند و به‌زودی به این بخش اضافه می‌شوند.
              </Text>
              <TouchableOpacity
                style={styles.emptyLevelBtn}
                activeOpacity={0.85}
                onPress={() => setLevel('')}
              >
                <Text style={styles.emptyLevelBtnText}>مشاهده همه ویدیوها</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.center}>
              <Text style={styles.mutedText}>{t('videoClipsEmptyFilter')}</Text>
            </View>
          )}
        </View>
      )}

      {visible.length > 0 && (
        <ScrollView
          contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + SPACING.l }]}
          showsVerticalScrollIndicator={false}
        >
          {(() => {
            const open = (clip: VideoClipListItem) => {
              if (isClipLocked(clip)) {
                navigation.navigate('Paywall');
                return;
              }
              navigation.navigate('VideoClip', { clipId: clip.id, openedAt: Date.now() });
            };
            const pickMovie = (title: string) => {
              setSource('movie');
              setCategory('');
              setMovie(title.trim());
            };

            // حالت ۱: کاربر یک سریال خاص را انتخاب کرده و دارد قسمت‌های آن را می‌بیند
            if (movie) {
              const [first, ...rest] = visible;
              return (
                <>
                  <View style={styles.seriesBanner}>
                    <View style={styles.seriesBannerRight}>
                      <Text style={styles.seriesBannerTitle}>🎬 سریال {movie}</Text>
                      <Text style={styles.seriesBannerCount}>
                        {visible.length.toLocaleString('fa-IR')} قسمت برای تمرین
                      </Text>
                    </View>
                    <TouchableOpacity
                      style={styles.seriesClearBtn}
                      activeOpacity={0.8}
                      onPress={() => setMovie('')}
                    >
                      <X size={14} color={COLORS.primary} />
                      <Text style={styles.seriesClearBtnText}>همه سریال‌ها</Text>
                    </TouchableOpacity>
                  </View>

                  {first && (
                    <FeaturedClip
                      clip={first}
                      t={t}
                      isLocked={isClipLocked(first)}
                      onOpen={() => open(first)}
                      onMovie={() => pickMovie(first.movie_title || '')}
                    />
                  )}
                  {rest.length > 0 && (
                    <Text style={styles.sectionTitle}>{t('videoClipsMoreTitle')}</Text>
                  )}
                  {rest.map((clip) => (
                    <CompactClip
                      key={clip.id}
                      clip={clip}
                      t={t}
                      isLocked={isClipLocked(clip)}
                      onOpen={() => open(clip)}
                      onMovie={() => pickMovie(clip.movie_title || '')}
                    />
                  ))}
                </>
              );
            }

            // حالت ۲: کاربر در صفحه اصلی است (ویترین سریال‌ها و قفسه‌های افقی هر سریال)
            return (
              <>
                {/* بخش کارت‌های ویترین انتخاب سریال */}
                {filteredSeriesList.length > 0 && (source === 'all' || source === 'movie') && (
                  <View style={styles.showcaseBlock}>
                    <View style={styles.showcaseHeader}>
                      <Text style={styles.showcaseTitle}>🍿 ویترین سریال‌ها</Text>
                      <Text style={styles.showcaseSubtitle}>
                        یک سریال را انتخاب کنید تا قسمت‌های آن نمایش داده شود
                      </Text>
                    </View>
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      contentContainerStyle={styles.seriesRow}
                    >
                      {filteredSeriesList.map((s) => (
                        <SeriesShowcaseCard
                          key={s.title}
                          series={s}
                          t={t}
                          onSelect={() => pickMovie(s.title)}
                        />
                      ))}
                    </ScrollView>
                  </View>
                )}

                {/* قفسه‌های افقی به تفکیک هر سریال */}
                {(source === 'all' || source === 'movie') &&
                  filteredSeriesList.map((s) => {
                    const sClips = level ? s.clips.filter((c) => c.level === level) : s.clips;
                    if (sClips.length === 0) return null;
                    return (
                      <View key={`shelf-${s.title}`} style={styles.shelfBlock}>
                        <View style={styles.shelfHeaderRow}>
                          <View style={styles.shelfTitleContainer}>
                            <Text style={styles.shelfSectionTitle}>🎬 {s.title}</Text>
                            <View style={[styles.shelfLevelPill, { backgroundColor: LEVEL_META[s.level]?.bg ?? COLORS.primary }]}>
                              <Text style={styles.shelfLevelPillText}>
                                {t(LEVEL_META[s.level]?.labelKey ?? 'levelBeginner')}
                              </Text>
                            </View>
                            <View style={styles.shelfCountPill}>
                              <Text style={styles.shelfCountPillText}>
                                {sClips.length.toLocaleString('fa-IR')} قسمت
                              </Text>
                            </View>
                          </View>
                          <TouchableOpacity
                            style={styles.shelfActionBtn}
                            activeOpacity={0.8}
                            onPress={() => pickMovie(s.title)}
                          >
                            <Text style={styles.shelfActionText}>مشاهده همه</Text>
                            <ChevronLeft size={14} color={COLORS.primary} />
                          </TouchableOpacity>
                        </View>
                        <ScrollView
                          horizontal
                          showsHorizontalScrollIndicator={false}
                          contentContainerStyle={styles.shelfScrollRow}
                        >
                          {sClips.map((clip) => (
                            <ShelfClipCard
                              key={clip.id}
                              clip={clip}
                              t={t}
                              isLocked={isClipLocked(clip)}
                              onOpen={() => open(clip)}
                            />
                          ))}
                        </ScrollView>
                      </View>
                    );
                  })}

                {/* قفسه ویدیوهای Flow (ساخته ما) */}
                {flowClips.filter((c) => !level || c.level === level).length > 0 && (source === 'all' || source === 'flow') && (
                  <View style={styles.shelfBlock}>
                    <View style={styles.shelfHeaderRow}>
                      <View style={styles.shelfTitleContainer}>
                        <Text style={styles.shelfSectionTitle}>📽 ویدیوهای ساخته ما (Flow)</Text>
                        <View style={styles.shelfCountPill}>
                          <Text style={styles.shelfCountPillText}>
                            {flowClips.filter((c) => !level || c.level === level).length.toLocaleString('fa-IR')}
                          </Text>
                        </View>
                      </View>
                      {source !== 'flow' && (
                        <TouchableOpacity
                          style={styles.shelfActionBtn}
                          activeOpacity={0.8}
                          onPress={() => setSource('flow')}
                        >
                          <Text style={styles.shelfActionText}>مشاهده همه</Text>
                          <ChevronLeft size={14} color={COLORS.primary} />
                        </TouchableOpacity>
                      )}
                    </View>
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      contentContainerStyle={styles.shelfScrollRow}
                    >
                      {flowClips
                        .filter((c) => !level || c.level === level)
                        .map((clip) => (
                          <ShelfClipCard
                            key={clip.id}
                            clip={clip}
                            t={t}
                            isLocked={isClipLocked(clip)}
                            onOpen={() => open(clip)}
                          />
                        ))}
                    </ScrollView>
                  </View>
                )}

                {/* کارت پیشنهاد فیلم جدید */}
                <View style={styles.suggestCard}>
                  <View style={styles.suggestIcon}>
                    <Search size={20} color={COLORS.primary} />
                  </View>
                  <Text style={styles.suggestTitle}>{t('videoClipsSuggestTitle')}</Text>
                  <Text style={styles.suggestSub}>{t('videoClipsSuggestSub')}</Text>
                  <TouchableOpacity
                    style={styles.suggestBtn}
                    activeOpacity={0.85}
                    onPress={() => navigation.navigate('ContactUs')}
                  >
                    <Text style={styles.suggestBtnText}>{t('videoClipsSuggestBtn')}</Text>
                    <ArrowLeft size={16} color={COLORS.white} />
                  </TouchableOpacity>
                </View>
              </>
            );
          })()}
        </ScrollView>
      )}
    </View>
  );
};

type ClipProps = {
  clip: VideoClipListItem;
  t: (k: string) => string;
  isLocked?: boolean;
  onOpen: () => void;
  onMovie: () => void;
};

const episodeOrder = (a: VideoClipListItem, b: VideoClipListItem) =>
  (a.season || 0) - (b.season || 0) || (a.episode || 0) - (b.episode || 0);

/** « · S1 E3» برای تکه‌های سریال؛ فیلم چیزی نمی‌گیرد. */
const episodeLabel = (clip: VideoClipListItem) =>
  clip.episode ? ` · S${clip.season || 1} E${clip.episode}` : '';

const formatDuration = (sec: number) =>
  `${String(Math.floor(sec / 60)).padStart(2, '0')}:${String(sec % 60).padStart(2, '0')}`;

const ClipPoster: React.FC<{
  clip: VideoClipListItem;
  style: any;
  playSize: number;
  isLocked?: boolean;
}> = ({ clip, style, playSize, isLocked }) => (
  <View style={[styles.poster, style]}>
    {clip.poster_url ? (
      <Image source={{ uri: absUrl(clip.poster_url) }} style={styles.posterImage} resizeMode="cover" />
    ) : clip.source === 'movie' ? (
      <Film size={28} color={COLORS.white} />
    ) : (
      <Clapperboard size={28} color={COLORS.white} />
    )}
    <View
      style={[
        styles.playCircle,
        { width: playSize, height: playSize, borderRadius: playSize / 2 },
        isLocked && styles.playCircleLocked,
      ]}
    >
      {isLocked ? (
        <Lock size={playSize * 0.42} color={COLORS.white} />
      ) : (
        <Play size={playSize * 0.38} color={COLORS.white} fill={COLORS.white} />
      )}
    </View>
    {isLocked && (
      <View style={styles.lockBadgeOverlay}>
        <Lock size={11} color={COLORS.white} />
        <Text style={styles.lockBadgeOverlayText}>قفل</Text>
      </View>
    )}
    {clip.duration_seconds > 0 && (
      <View style={styles.durationBadge}>
        <Text style={styles.durationText}>{formatDuration(clip.duration_seconds)}</Text>
      </View>
    )}
  </View>
);

const ClipMeta: React.FC<{ clip: VideoClipListItem; t: (k: string) => string; isLocked?: boolean }> = ({
  clip,
  t,
  isLocked,
}) => {
  const level = LEVEL_META[clip.level] ?? LEVEL_META.beginner;
  return (
    <View style={styles.metaRow}>
      {isLocked && (
        <View style={styles.lockedMetaChip}>
          <Lock size={10} color={COLORS.white} />
          <Text style={styles.lockedMetaChipText}>اشتراک</Text>
        </View>
      )}
      <View style={[styles.levelChip, { borderColor: level.bg }]}>
        <Text style={[styles.levelChipText, { color: level.bg }]}>{t(level.labelKey)}</Text>
      </View>
      <View style={styles.sourceChip}>
        <Text style={styles.sourceChipText}>
          {t(clip.source === 'movie' ? 'videoClipsSourceMovie' : 'videoClipsSourceFlow')}
        </Text>
      </View>
      <View style={styles.metaItem}>
        <Users size={12} color={COLORS.muted} />
        <Text style={styles.metaText}>{t('videoClipsCharacters').replace('{n}', String(clip.speaker_count))}</Text>
      </View>
      {clip.attempts > 0 && (
        <View style={styles.metaItem}>
          <Trophy size={12} color={COLORS.warning} />
          <Text style={styles.metaText}>{t('topicSpeakingBest').replace('{score}', String(clip.best_score))}</Text>
        </View>
      )}
    </View>
  );
};

const FeaturedClip: React.FC<ClipProps> = ({ clip, t, isLocked, onOpen, onMovie }) => (
  <View style={styles.featured}>
    <TouchableOpacity activeOpacity={0.9} onPress={onOpen}>
      <ClipPoster clip={clip} style={styles.featuredPoster} playSize={56} isLocked={isLocked} />
    </TouchableOpacity>
    <ClipMeta clip={clip} t={t} isLocked={isLocked} />
    <Text style={styles.featuredTitle}>{clip.title}</Text>
    {clip.source === 'movie' && !!clip.movie_title && (
      <TouchableOpacity hitSlop={6} onPress={onMovie}>
        <Text style={styles.movieTitle} numberOfLines={1}>
          🎞 {clip.movie_title}
          {episodeLabel(clip)}
        </Text>
      </TouchableOpacity>
    )}
    {!!clip.description_fa && (
      <Text style={styles.cardDesc} numberOfLines={3}>
        {clip.description_fa}
      </Text>
    )}
    <TouchableOpacity
      style={[styles.featuredCta, isLocked && styles.featuredCtaLocked]}
      activeOpacity={0.85}
      onPress={onOpen}
    >
      {isLocked ? (
        <Lock size={14} color={COLORS.white} />
      ) : (
        <Play size={14} color={COLORS.white} fill={COLORS.white} />
      )}
      <Text style={styles.featuredCtaText}>
        {isLocked ? 'قفل است · ارتقا به اشتراک ویژه' : t('videoClipsStart')}
      </Text>
    </TouchableOpacity>
  </View>
);

const CompactClip: React.FC<ClipProps> = ({ clip, t, isLocked, onOpen, onMovie }) => (
  <TouchableOpacity style={styles.compact} activeOpacity={0.85} onPress={onOpen}>
    <ClipPoster clip={clip} style={styles.compactPoster} playSize={32} isLocked={isLocked} />
    <View style={styles.compactBody}>
      <Text style={styles.compactTitle} numberOfLines={2}>
        {clip.title}
      </Text>
      {clip.source === 'movie' && !!clip.movie_title && (
        <TouchableOpacity hitSlop={6} onPress={onMovie}>
          <Text style={styles.movieTitle} numberOfLines={1}>
            🎞 {clip.movie_title}
            {episodeLabel(clip)}
          </Text>
        </TouchableOpacity>
      )}
      {!!clip.description_fa && (
        <Text style={styles.compactDesc} numberOfLines={1}>
          {clip.description_fa}
        </Text>
      )}
      <ClipMeta clip={clip} t={t} isLocked={isLocked} />
    </View>
  </TouchableOpacity>
);

/** کارت یک کلیپ در ویترین قفسه‌ی افقی */
const ShelfClipCard: React.FC<{
  clip: VideoClipListItem;
  t: (k: string) => string;
  isLocked?: boolean;
  onOpen: () => void;
}> = ({ clip, t, isLocked, onOpen }) => {
  const level = LEVEL_META[clip.level] ?? LEVEL_META.beginner;
  return (
    <TouchableOpacity style={styles.shelfCard} activeOpacity={0.88} onPress={onOpen}>
      <View style={styles.shelfPosterWrapper}>
        <ClipPoster clip={clip} style={styles.shelfPoster} playSize={34} isLocked={isLocked} />
      </View>
      <Text style={styles.shelfCardTitle} numberOfLines={2}>
        {clip.title}
      </Text>
      <View style={styles.shelfMetaRow}>
        <View style={[styles.levelDot, { backgroundColor: level.bg }]} />
        <Text style={styles.shelfMetaText}>
          {t(level.labelKey)}
          {episodeLabel(clip)}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

/** کارت بزرگ معرفی یک سریال در ویترین بالای صفحه */
const SeriesShowcaseCard: React.FC<{
  series: {
    title: string;
    posterUrl?: string;
    clipCount: number;
    level: ClipLevel;
  };
  t: (k: string) => string;
  onSelect: () => void;
}> = ({ series, t, onSelect }) => {
  const meta = LEVEL_META[series.level] ?? LEVEL_META.beginner;
  return (
    <TouchableOpacity style={styles.seriesCard} activeOpacity={0.88} onPress={onSelect}>
      <View style={styles.seriesPosterWrapper}>
        {series.posterUrl ? (
          <Image source={{ uri: absUrl(series.posterUrl) }} style={styles.seriesPosterImg} resizeMode="cover" />
        ) : (
          <View style={[styles.seriesPosterImg, styles.seriesPosterPlaceholder]}>
            <Film size={32} color={COLORS.white} />
          </View>
        )}
        <View style={styles.seriesEpisodeCountBadge}>
          <Text style={styles.seriesEpisodeCountText}>
            {series.clipCount.toLocaleString('fa-IR')} قسمت
          </Text>
        </View>
      </View>
      <Text style={styles.seriesCardTitle} numberOfLines={1}>{series.title}</Text>
      <View style={styles.seriesLevelsRow}>
        <View style={[styles.seriesLevelDot, { backgroundColor: meta.bg }]} />
        <Text style={styles.seriesLevelsText}>
          {t(meta.labelKey)}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  filters: {
    gap: SPACING.s,
    marginBottom: SPACING.m,
  },
  levelFilterTab: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 999,
    backgroundColor: COLORS.white,
    borderWidth: 1.5,
    borderColor: '#EEEAE3',
  },
  levelFilterTabActive: {
    borderColor: COLORS.primary,
    backgroundColor: '#FFF8F4',
  },
  levelFilterDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  levelFilterText: {
    fontFamily: FONT_FAMILY.medium,
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  levelFilterTextActive: {
    fontFamily: FONT_FAMILY.bold,
    color: COLORS.text,
  },
  sourceTab: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 999,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: '#EEEAE3',
  },
  sourceTabActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  countBubble: {
    minWidth: 20,
    paddingHorizontal: 5,
    borderRadius: 10,
    backgroundColor: COLORS.surfaceLight,
    alignItems: 'center',
  },
  countBubbleActive: { backgroundColor: 'rgba(255,255,255,0.25)' },
  countText: { fontFamily: FONT_FAMILY.bold, fontSize: 10, color: COLORS.textSecondary },
  countTextActive: { color: COLORS.white },
  sourceTabText: {
    fontFamily: FONT_FAMILY.semiBold,
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  sourceTabTextActive: {
    color: COLORS.white,
  },
  chipsRow: {
    flexDirection: 'row-reverse',
    gap: SPACING.s,
    flexGrow: 1,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: '#EEEAE3',
    flexDirection: 'row',
    alignItems: 'center',
  },
  chipActive: {
    backgroundColor: COLORS.primaryLight,
    borderColor: COLORS.primary,
  },
  chipText: {
    fontFamily: FONT_FAMILY.medium,
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  chipTextActive: {
    color: COLORS.primary,
  },
  levelDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    marginEnd: 4,
  },
  movieTitle: {
    ...TEXT_STYLES.labelSm,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: SPACING.s },
  tagChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: '#FFF3E6',
    borderWidth: 1,
    borderColor: '#F6DCC0',
  },
  tagChipText: { fontFamily: FONT_FAMILY.bold, fontSize: 10, color: '#B5651D' },
  tagDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#E9A23B' },
  soonBody: { alignItems: 'center', paddingTop: SPACING.l, paddingBottom: SPACING.xl, gap: 10 },
  soonTile: {
    width: 120,
    height: 120,
    borderRadius: 28,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#F6D3C6',
  },
  soonScreen: {
    width: 64,
    height: 50,
    borderRadius: 12,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  soonMic: {
    position: 'absolute',
    top: 22,
    right: 18,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  soonHd: { position: 'absolute', bottom: 24, left: 18, paddingHorizontal: 6, paddingVertical: 1, borderRadius: 6, backgroundColor: COLORS.success },
  soonHdText: { fontFamily: FONT_FAMILY.bold, fontSize: 9, color: COLORS.white },
  soonStatus: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: '#EEEAE3',
    marginTop: 6,
  },
  soonStatusDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: COLORS.success },
  soonStatusText: { fontFamily: FONT_FAMILY.semiBold, fontSize: 10, color: COLORS.textSecondary },
  soonTitle: { fontFamily: FONT_FAMILY.bold, fontSize: 16, color: COLORS.text, textAlign: 'center' },
  soonDesc: { fontFamily: FONT_FAMILY.regular, fontSize: 12, lineHeight: 21, color: COLORS.muted, textAlign: 'center' },
  soonTryRow: { alignSelf: 'stretch', flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between', marginTop: SPACING.l },
  soonTry: { fontFamily: FONT_FAMILY.bold, fontSize: 12, color: COLORS.text },
  soonOther: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  soonOtherText: { fontFamily: FONT_FAMILY.semiBold, fontSize: 11, color: COLORS.primary },
  soonCards: { alignSelf: 'stretch', flexDirection: 'row-reverse', gap: 10 },
  soonCard: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#EEEAE3',
    padding: 12,
    alignItems: 'flex-end',
    gap: 4,
  },
  soonCardTop: { alignSelf: 'stretch', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
  soonCardIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: 'rgba(232,87,47,0.10)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  soonActive: { paddingHorizontal: 7, paddingVertical: 1, borderRadius: 6, backgroundColor: 'rgba(46,158,107,0.12)' },
  soonActiveText: { fontFamily: FONT_FAMILY.bold, fontSize: 9, color: COLORS.success },
  soonCardTitle: { fontFamily: FONT_FAMILY.bold, fontSize: 12, color: COLORS.text },
  soonCardSub: { fontFamily: FONT_FAMILY.regular, fontSize: 10, color: COLORS.muted, textAlign: 'right' },
  soonCta: {
    alignSelf: 'stretch',
    height: 52,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: SPACING.l,
    elevation: 6,
    shadowColor: COLORS.primary,
    shadowOpacity: 0.35,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
  },
  soonCtaInner: { flexDirection: 'row-reverse', alignItems: 'center', gap: 8 },
  soonCtaText: { fontFamily: FONT_FAMILY.bold, fontSize: 14, color: COLORS.white },
  container: {
    flex: 1,
    backgroundColor: '#FAF8F4',
    paddingHorizontal: SPACING.l,
  },
  header: {
    alignItems: 'flex-end',
    marginBottom: SPACING.m,
  },
  closeBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: '#EEEAE3',
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
    textAlign: 'right',
    marginTop: 4,
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
  emptyContainer: {
    paddingVertical: SPACING.l,
  },
  emptyLevelBlock: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 36,
    paddingHorizontal: 20,
    backgroundColor: COLORS.white,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#EEEAE3',
    marginVertical: 12,
  },
  emptyLevelBadge: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  emptyLevelTitle: {
    fontFamily: FONT_FAMILY.bold,
    fontSize: 15,
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  emptyLevelDesc: {
    fontFamily: FONT_FAMILY.regular,
    fontSize: 13,
    lineHeight: 22,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: 18,
  },
  emptyLevelBtn: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: COLORS.primary,
  },
  emptyLevelBtnText: {
    fontFamily: FONT_FAMILY.bold,
    fontSize: 12,
    color: COLORS.white,
  },
  linkText: {
    ...TEXT_STYLES.labelMd,
    color: COLORS.primary,
    fontFamily: FONT_FAMILY.semiBold,
  },
  list: {
    gap: 12,
  },
  sectionTitle: {
    fontFamily: FONT_FAMILY.bold,
    fontSize: 14,
    color: COLORS.text,
    textAlign: 'right',
    marginTop: 8,
  },
  featured: {
    backgroundColor: COLORS.white,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#EEEAE3',
    padding: 12,
    gap: 8,
  },
  poster: {
    backgroundColor: COLORS.text,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  posterImage: {
    ...StyleSheet.absoluteFill,
  },
  featuredPoster: {
    height: 180,
    borderRadius: 18,
  },
  playCircle: {
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.35)',
  },
  durationBadge: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  durationText: { fontFamily: FONT_FAMILY.bold, fontSize: 10, color: COLORS.white },
  featuredTitle: {
    fontFamily: FONT_FAMILY.bold,
    fontSize: 17,
    color: COLORS.text,
    textAlign: 'right',
  },
  cardDesc: {
    ...TEXT_STYLES.labelMd,
    color: COLORS.textSecondary,
    textAlign: 'right',
    lineHeight: 21,
  },
  featuredCta: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 48,
    borderRadius: 14,
    backgroundColor: COLORS.primary,
    marginTop: 4,
  },
  featuredCtaText: { fontFamily: FONT_FAMILY.bold, fontSize: 14, color: COLORS.white },
  compact: {
    flexDirection: 'row-reverse',
    gap: 12,
    backgroundColor: COLORS.white,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#EEEAE3',
    padding: 10,
  },
  compactPoster: {
    width: 92,
    height: 92,
    borderRadius: 14,
  },
  compactBody: { flex: 1, gap: 3, justifyContent: 'center' },
  compactTitle: { fontFamily: FONT_FAMILY.bold, fontSize: 14, color: COLORS.text, textAlign: 'right' },
  compactDesc: { ...TEXT_STYLES.labelSm, color: COLORS.muted, textAlign: 'right' },
  metaRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
  },
  levelChip: {
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 1,
  },
  levelChipText: { fontFamily: FONT_FAMILY.semiBold, fontSize: 10 },
  sourceChip: {
    borderRadius: 999,
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  sourceChipText: { fontFamily: FONT_FAMILY.semiBold, fontSize: 10, color: COLORS.primaryDark },
  metaItem: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 3,
  },
  metaText: {
    ...TEXT_STYLES.labelSm,
    fontSize: 11,
    color: COLORS.muted,
  },
  suggestCard: {
    alignItems: 'center',
    backgroundColor: '#FFF6F2',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(232,87,47,0.18)',
    padding: 18,
    gap: 6,
    marginTop: 8,
  },
  suggestIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  suggestTitle: { fontFamily: FONT_FAMILY.bold, fontSize: 14, color: COLORS.text },
  suggestSub: { ...TEXT_STYLES.labelSm, color: COLORS.textSecondary, textAlign: 'center', lineHeight: 19 },
  suggestBtn: {
    alignSelf: 'stretch',
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 44,
    borderRadius: 14,
    backgroundColor: COLORS.primary,
    marginTop: 8,
  },
  suggestBtnText: { fontFamily: FONT_FAMILY.bold, fontSize: 13, color: COLORS.white },
  playCircleLocked: {
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  lockBadgeOverlay: {
    position: 'absolute',
    top: 8,
    start: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 8,
  },
  lockBadgeOverlayText: {
    fontFamily: FONT_FAMILY.bold,
    fontSize: 10,
    color: COLORS.white,
  },
  lockedMetaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  lockedMetaChipText: {
    fontFamily: FONT_FAMILY.bold,
    fontSize: 10,
    color: COLORS.white,
  },
  featuredCtaLocked: {
    backgroundColor: COLORS.primary,
  },
  seriesBanner: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFF7F2',
    borderWidth: 1,
    borderColor: '#FCD7C7',
    borderRadius: 18,
    padding: 14,
    marginBottom: SPACING.m,
  },
  seriesBannerRight: {
    flex: 1,
    alignItems: 'flex-end',
  },
  seriesBannerTitle: {
    fontFamily: FONT_FAMILY.bold,
    fontSize: 16,
    color: COLORS.text,
  },
  seriesBannerCount: {
    fontFamily: FONT_FAMILY.regular,
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  seriesClearBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: '#FCD7C7',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  seriesClearBtnText: {
    fontFamily: FONT_FAMILY.medium,
    fontSize: 12,
    color: COLORS.primary,
  },
  showcaseBlock: {
    marginBottom: SPACING.l,
  },
  showcaseHeader: {
    marginBottom: SPACING.s,
  },
  showcaseTitle: {
    fontFamily: FONT_FAMILY.bold,
    fontSize: 16,
    color: COLORS.text,
    textAlign: 'right',
  },
  showcaseSubtitle: {
    fontFamily: FONT_FAMILY.regular,
    fontSize: 12,
    color: COLORS.muted,
    textAlign: 'right',
    marginTop: 2,
  },
  seriesRow: {
    flexDirection: 'row-reverse',
    gap: 12,
    paddingVertical: 4,
  },
  seriesCard: {
    width: 140,
    backgroundColor: COLORS.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#EEEAE3',
    overflow: 'hidden',
    padding: 8,
  },
  seriesPosterWrapper: {
    width: '100%',
    height: 160,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#1A1D26',
  },
  seriesPosterImg: {
    width: '100%',
    height: '100%',
  },
  seriesPosterPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  seriesEpisodeCountBadge: {
    position: 'absolute',
    bottom: 6,
    end: 6,
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  seriesEpisodeCountText: {
    fontFamily: FONT_FAMILY.bold,
    fontSize: 10,
    color: COLORS.white,
  },
  seriesCardTitle: {
    fontFamily: FONT_FAMILY.bold,
    fontSize: 13,
    color: COLORS.text,
    textAlign: 'right',
    marginTop: 8,
  },
  seriesLevelsRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  seriesLevelDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  seriesLevelsText: {
    fontFamily: FONT_FAMILY.regular,
    fontSize: 11,
    color: COLORS.muted,
  },
  shelfBlock: {
    marginBottom: SPACING.l,
  },
  shelfHeaderRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.s,
  },
  shelfTitleContainer: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 8,
  },
  shelfSectionTitle: {
    fontFamily: FONT_FAMILY.bold,
    fontSize: 16,
    color: COLORS.text,
  },
  shelfLevelPill: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 8,
  },
  shelfLevelPillText: {
    fontFamily: FONT_FAMILY.bold,
    fontSize: 10,
    color: COLORS.white,
  },
  shelfCountPill: {
    backgroundColor: COLORS.surfaceLight,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 8,
  },
  shelfCountPillText: {
    fontFamily: FONT_FAMILY.medium,
    fontSize: 11,
    color: COLORS.textSecondary,
  },
  shelfActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  shelfActionText: {
    fontFamily: FONT_FAMILY.medium,
    fontSize: 12,
    color: COLORS.primary,
  },
  shelfScrollRow: {
    flexDirection: 'row-reverse',
    gap: 12,
    paddingVertical: 4,
  },
  shelfCard: {
    width: 160,
  },
  shelfPosterWrapper: {
    width: 160,
    height: 100,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
  },
  shelfPoster: {
    width: 160,
    height: 100,
  },
  shelfCardTitle: {
    fontFamily: FONT_FAMILY.semiBold,
    fontSize: 13,
    color: COLORS.text,
    textAlign: 'right',
    marginTop: 6,
  },
  shelfMetaRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 4,
    marginTop: 3,
  },
  shelfMetaText: {
    fontFamily: FONT_FAMILY.regular,
    fontSize: 11,
    color: COLORS.muted,
  },
});
