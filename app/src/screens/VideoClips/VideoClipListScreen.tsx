import React, { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, BookOpen, ChevronLeft, Clapperboard, Clapperboard as ClapIcon, Film, Headphones, Mic, Play, Search, Trophy, Users, X } from 'lucide-react-native';
import { GradientFill } from '../../components/GradientFill';

import { COLORS, SPACING } from '../../theme/colors';
import { FONT_FAMILY, TEXT_STYLES } from '../../theme/typography';
import { useLanguage } from '../../data/i18n';
import { absUrl } from '../../api/config';
import { getVideoClips, type ClipLevel, type VideoClipListItem } from '../../api/videoClips';
import { SCENE_CATEGORY_LABEL_KEY } from '../../data/scenarios';

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

  React.useEffect(() => {
    if (route.params?.source) setSource(route.params.source);
    if (route.params?.movieTitle) {
      setSource('movie');
      setMovie(route.params.movieTitle);
    }
  }, [route.params?.source, route.params?.movieTitle]);

  const bySource = useMemo(
    () => (clips ?? []).filter((c) => source === 'all' || c.source === source),
    [clips, source]
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
  const visible = bySource.filter(
    (c) => (!category || c.category === category) && (!movie || (c.movie_title || '').trim() === movie)
  );

  const load = useCallback(() => {
    setError(false);
    getVideoClips()
      .then(setClips)
      .catch(() => setError(true));
  }, []);

  // برگشت از یک اجرا → بهترین امتیازها تازه شوند.
  useFocusEffect(load);

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
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsRow}>
            {SOURCE_TABS.map((tab) => {
              const active = source === tab.id;
              const count = (clips ?? []).filter((c) => tab.id === 'all' || c.source === tab.id).length;
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
        <View style={styles.center}>
          <Text style={styles.mutedText}>{t('videoClipsEmptyFilter')}</Text>
        </View>
      )}

      {visible.length > 0 && (
        <ScrollView
          contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + SPACING.l }]}
          showsVerticalScrollIndicator={false}
        >
          {(() => {
            const [first, ...rest] = visible;
            const open = (clip: VideoClipListItem) =>
              navigation.navigate('VideoClip', { clipId: clip.id, openedAt: Date.now() });
            const pickMovie = (clip: VideoClipListItem) => {
              setSource('movie');
              setCategory('');
              setMovie(clip.movie_title!.trim());
            };
            return (
              <>
                <FeaturedClip clip={first} t={t} onOpen={() => open(first)} onMovie={() => pickMovie(first)} />
                {rest.length > 0 && (
                  <Text style={styles.sectionTitle}>{t('videoClipsMoreTitle')}</Text>
                )}
                {rest.map((clip) => (
                  <CompactClip key={clip.id} clip={clip} t={t} onOpen={() => open(clip)} onMovie={() => pickMovie(clip)} />
                ))}
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
  onOpen: () => void;
  onMovie: () => void;
};

const formatDuration = (sec: number) =>
  `${String(Math.floor(sec / 60)).padStart(2, '0')}:${String(sec % 60).padStart(2, '0')}`;

const ClipPoster: React.FC<{ clip: VideoClipListItem; style: any; playSize: number }> = ({ clip, style, playSize }) => (
  <View style={[styles.poster, style]}>
    {clip.poster_url ? (
      <Image source={{ uri: absUrl(clip.poster_url) }} style={styles.posterImage} resizeMode="cover" />
    ) : clip.source === 'movie' ? (
      <Film size={28} color={COLORS.white} />
    ) : (
      <Clapperboard size={28} color={COLORS.white} />
    )}
    <View style={[styles.playCircle, { width: playSize, height: playSize, borderRadius: playSize / 2 }]}>
      <Play size={playSize * 0.38} color={COLORS.white} fill={COLORS.white} />
    </View>
    {clip.duration_seconds > 0 && (
      <View style={styles.durationBadge}>
        <Text style={styles.durationText}>{formatDuration(clip.duration_seconds)}</Text>
      </View>
    )}
  </View>
);

const ClipMeta: React.FC<{ clip: VideoClipListItem; t: (k: string) => string }> = ({ clip, t }) => {
  const level = LEVEL_META[clip.level] ?? LEVEL_META.beginner;
  return (
    <View style={styles.metaRow}>
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

const FeaturedClip: React.FC<ClipProps> = ({ clip, t, onOpen, onMovie }) => (
  <View style={styles.featured}>
    <TouchableOpacity activeOpacity={0.9} onPress={onOpen}>
      <ClipPoster clip={clip} style={styles.featuredPoster} playSize={56} />
    </TouchableOpacity>
    <ClipMeta clip={clip} t={t} />
    <Text style={styles.featuredTitle}>{clip.title}</Text>
    {clip.source === 'movie' && !!clip.movie_title && (
      <TouchableOpacity hitSlop={6} onPress={onMovie}>
        <Text style={styles.movieTitle} numberOfLines={1}>
          🎞 {clip.movie_title}
        </Text>
      </TouchableOpacity>
    )}
    {!!clip.description_fa && (
      <Text style={styles.cardDesc} numberOfLines={3}>
        {clip.description_fa}
      </Text>
    )}
    <TouchableOpacity style={styles.featuredCta} activeOpacity={0.85} onPress={onOpen}>
      <Play size={14} color={COLORS.white} fill={COLORS.white} />
      <Text style={styles.featuredCtaText}>{t('videoClipsStart')}</Text>
    </TouchableOpacity>
  </View>
);

const CompactClip: React.FC<ClipProps> = ({ clip, t, onOpen, onMovie }) => (
  <TouchableOpacity style={styles.compact} activeOpacity={0.85} onPress={onOpen}>
    <ClipPoster clip={clip} style={styles.compactPoster} playSize={32} />
    <View style={styles.compactBody}>
      <Text style={styles.compactTitle} numberOfLines={2}>
        {clip.title}
      </Text>
      {clip.source === 'movie' && !!clip.movie_title && (
        <TouchableOpacity hitSlop={6} onPress={onMovie}>
          <Text style={styles.movieTitle} numberOfLines={1}>
            🎞 {clip.movie_title}
          </Text>
        </TouchableOpacity>
      )}
      {!!clip.description_fa && (
        <Text style={styles.compactDesc} numberOfLines={1}>
          {clip.description_fa}
        </Text>
      )}
      <ClipMeta clip={clip} t={t} />
    </View>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  filters: {
    gap: SPACING.s,
    marginBottom: SPACING.m,
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
});
