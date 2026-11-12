import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ChevronLeft,
  ChevronRight,
  Clock,
  ListMusic,
  Lock,
  Mic,
  Music,
  Play,
  RotateCcw,
  Sparkles,
  X,
} from 'lucide-react-native';

import { COLORS, SPACING, BORDER_RADIUS, hexToRgba } from '../../theme/colors';
import { FONT_FAMILY, TEXT_STYLES } from '../../theme/typography';
import { SHADOWS } from '../../theme/elevation';
import { useLanguage } from '../../data/i18n';
import { absUrl } from '../../api/config';
import { atOrBelowLevel } from '../../api/podcasts';
import { getMyLevel } from '../../api/assessment';
import { getSongs, type Song } from '../../api/songs';
import { getSubscriptionStatus } from '../../api/billing';
import { useAuth } from '../../data/AuthContext';

const LEVEL_META: Record<string, { labelKey: string; color: string; bg: string }> = {
  starter: { labelKey: 'levelStarter', color: '#059669', bg: '#ECFDF5' },
  beginner: { labelKey: 'levelBeginner', color: '#2563EB', bg: '#EFF6FF' },
  intermediate: { labelKey: 'levelIntermediate', color: '#D97706', bg: '#FFFBEB' },
  advanced: { labelKey: 'levelAdvanced', color: '#7C3AED', bg: '#F5F3FF' },
  proficient: { labelKey: 'levelProficient', color: '#DC2626', bg: '#FEF2F2' },
};

const duration = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

const FREE_SONGS_COUNT = 4;

/**
 * لیست آهنگ‌ها و ترانه‌های آموزشی لینگوفلو (Editorial Redesign)
 * با هویت صوتی و استودیویی مدرن
 */
export const SongListScreen: React.FC = () => {
  const { t, language } = useLanguage();
  const rtl = language === 'fa';
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const { user } = useAuth();
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [songs, setSongs] = useState<Song[] | null>(null);
  const [error, setError] = useState(false);

  const load = useCallback(() => {
    setError(false);
    if (user?.role === 'admin') {
      setIsSubscribed(true);
    } else {
      getSubscriptionStatus()
        .then((s) => setIsSubscribed(!!s?.active))
        .catch(() => setIsSubscribed(false));
    }
    Promise.all([getSongs(), getMyLevel().catch(() => null)])
      .then(([list, lvl]) => setSongs(atOrBelowLevel(list, lvl?.scene_level)))
      .catch(() => setError(true));
  }, [user?.role]);

  useFocusEffect(load);

  const ChevronIcon = rtl ? ChevronLeft : ChevronRight;

  return (
    <View style={[styles.container, { paddingTop: insets.top + SPACING.s }]}>
      {/* سربرگ مدرن */}
      <View style={[styles.header, rtl && styles.rowReverse]}>
        <TouchableOpacity
          style={styles.closeBtn}
          onPress={() => navigation.goBack()}
          activeOpacity={0.8}
        >
          <X size={20} color={COLORS.text} />
        </TouchableOpacity>

        <View style={styles.titleWrap}>
          <Text style={styles.title}>{t('songTitle')}</Text>
          {songs && songs.length > 0 && (
            <View style={styles.countBadge}>
              <Text style={styles.countText}>
                {rtl ? `${songs.length} ترانه آموزشی` : `${songs.length} Songs`}
              </Text>
            </View>
          )}
        </View>

        {/* دکمه ضبط‌های من */}
        <TouchableOpacity
          style={styles.takesBtn}
          onPress={() => navigation.navigate('SongTakes')}
          activeOpacity={0.85}
        >
          <ListMusic size={15} color={COLORS.primary} />
          <Text style={styles.takesText}>{t('songMyTakes')}</Text>
        </TouchableOpacity>
      </View>

      {/* وضعیت لودینگ */}
      {songs === null && !error && (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>
            {rtl ? 'در حال بارگذاری ترانه‌ها...' : 'Loading songs...'}
          </Text>
        </View>
      )}

      {/* وضعیت خطا */}
      {error && (
        <View style={styles.center}>
          <Text style={styles.mutedText}>{t('songLoadError')}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={load} activeOpacity={0.85}>
            <RotateCcw size={16} color={COLORS.white} />
            <Text style={styles.retryBtnText}>{t('topicSpeakingRetry')}</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* وضعیت لیست خالی */}
      {songs && songs.length === 0 && (
        <View style={styles.center}>
          <Music size={48} color="#D0C8B8" />
          <Text style={styles.mutedText}>{t('songEmpty')}</Text>
        </View>
      )}

      {/* لیست آهنگ‌ها */}
      {songs && songs.length > 0 && (
        <ScrollView
          contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + SPACING.xl }]}
          showsVerticalScrollIndicator={false}
        >
          {songs.map((s, index) => {
            const level = LEVEL_META[s.level] ?? LEVEL_META.beginner;
            const isLocked = !isSubscribed && index >= FREE_SONGS_COUNT;
            const hasCover = !!s.cover_url;

            return (
              <TouchableOpacity
                key={s.id}
                style={styles.card}
                activeOpacity={0.9}
                onPress={() =>
                  isLocked
                    ? navigation.navigate('Paywall')
                    : navigation.navigate('Song', { songId: s.id, openedAt: Date.now() })
                }
              >
                {/* بنر کاور آرت */}
                <View style={styles.bannerWrap}>
                  {hasCover ? (
                    <Image
                      source={{ uri: absUrl(s.cover_url!) }}
                      style={styles.bannerImage}
                      resizeMode="cover"
                    />
                  ) : (
                    <View style={[styles.bannerPlaceholder, { backgroundColor: level.bg }]}>
                      <Music size={42} color={level.color} />
                    </View>
                  )}

                  {/* گرادینت تیره روی تصویر */}
                  <View style={styles.bannerOverlay} />

                  {/* سطوح و وضعیت بالای تصویر */}
                  <View style={[styles.badgeTopRow, rtl && styles.rowReverse]}>
                    <View style={[styles.levelBadge, { backgroundColor: level.bg }]}>
                      <View style={[styles.levelDot, { backgroundColor: level.color }]} />
                      <Text style={[styles.levelText, { color: level.color }]}>
                        {t(level.labelKey)}
                      </Text>
                    </View>

                    {s.duration_seconds > 0 && (
                      <View style={styles.durationBadge}>
                        <Clock size={11} color={COLORS.white} />
                        <Text style={styles.durationBadgeText}>
                          {duration(s.duration_seconds)}
                        </Text>
                      </View>
                    )}
                  </View>

                  {/* قفل اشتراک ویژه اگر فعال نباشد */}
                  {isLocked && (
                    <View style={styles.lockOverlay}>
                      <View style={styles.lockIconCircle}>
                        <Lock size={20} color={COLORS.white} />
                      </View>
                      <Text style={styles.lockText}>
                        {rtl ? 'ویژه اعضای پریمیوم' : 'Premium Only'}
                      </Text>
                    </View>
                  )}
                </View>

                {/* محتوای متنی کارت */}
                <View style={styles.bodyWrap}>
                  <View style={styles.titleRow}>
                    <Text style={styles.cardTitle} numberOfLines={1}>
                      {s.title}
                    </Text>
                  </View>

                  {!!s.artist && (
                    <Text style={styles.artistText} numberOfLines={1}>
                      {s.artist}
                    </Text>
                  )}

                  {!!s.description_fa && (
                    <Text style={[styles.cardSubtitle, rtl && styles.textRight]} numberOfLines={2}>
                      {s.description_fa}
                    </Text>
                  )}

                  {/* متادیتا: کارائوکه / هم‌خوانی */}
                  <View style={[styles.metaRow, rtl && styles.rowReverse]}>
                    {s.instrumental_url ? (
                      <View style={styles.karaokePill}>
                        <Mic size={13} color={COLORS.primary} />
                        <Text style={styles.karaokeText}>{t('songSingAlongBadge')}</Text>
                      </View>
                    ) : (
                      <View style={styles.audioPill}>
                        <Music size={13} color="#697082" />
                        <Text style={styles.audioPillText}>{rtl ? 'پخش با متن' : 'Lyrics'}</Text>
                      </View>
                    )}

                    <View style={[styles.actionBtn, rtl && styles.rowReverse]}>
                      <Text style={styles.actionBtnText}>{rtl ? 'شروع ترانه' : 'Listen'}</Text>
                      <ChevronIcon size={14} color={COLORS.primary} />
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
  container: {
    flex: 1,
    backgroundColor: '#FDFBF7',
  },
  rowReverse: {
    flexDirection: 'row-reverse',
  },
  textRight: {
    textAlign: 'right',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.l,
    paddingBottom: SPACING.m,
  },
  closeBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: '#F0EBE3',
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.level1,
  },
  titleWrap: {
    alignItems: 'center',
    gap: 4,
  },
  title: {
    fontFamily: FONT_FAMILY.bold,
    fontSize: 18,
    color: '#191C21',
  },
  countBadge: {
    backgroundColor: '#F4EFE6',
    paddingHorizontal: 10,
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.full,
  },
  countText: {
    fontFamily: FONT_FAMILY.medium,
    fontSize: 11,
    color: '#7A7265',
  },
  takesBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 38,
    paddingHorizontal: 12,
    borderRadius: 19,
    borderWidth: 1,
    borderColor: '#F0EBE3',
    backgroundColor: COLORS.white,
    ...SHADOWS.level1,
  },
  takesText: {
    fontFamily: FONT_FAMILY.bold,
    fontSize: 12,
    color: COLORS.primary,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.m,
    paddingHorizontal: SPACING.xl,
  },
  loadingText: {
    ...TEXT_STYLES.bodyMd,
    color: '#8A8175',
    fontFamily: FONT_FAMILY.medium,
  },
  mutedText: {
    ...TEXT_STYLES.bodyMd,
    color: '#8A8175',
    textAlign: 'center',
  },
  retryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.l,
    paddingVertical: 10,
    borderRadius: BORDER_RADIUS.full,
    marginTop: SPACING.s,
    ...SHADOWS.level1,
  },
  retryBtnText: {
    fontFamily: FONT_FAMILY.bold,
    fontSize: 14,
    color: COLORS.white,
  },
  list: {
    paddingHorizontal: SPACING.l,
    paddingTop: SPACING.s,
    gap: SPACING.l,
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#F0EBE3',
    overflow: 'hidden',
    ...SHADOWS.level1,
  },
  bannerWrap: {
    width: '100%',
    aspectRatio: 16 / 9,
    position: 'relative',
    backgroundColor: '#EDE7DC',
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
    backgroundColor: 'rgba(0,0,0,0.22)',
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
  levelBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.white,
  },
  levelDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  levelText: {
    fontFamily: FONT_FAMILY.bold,
    fontSize: 11,
  },
  durationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(25, 28, 33, 0.72)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: BORDER_RADIUS.full,
  },
  durationBadgeText: {
    fontFamily: FONT_FAMILY.semiBold,
    fontSize: 11,
    color: COLORS.white,
  },
  lockOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(25, 28, 33, 0.78)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  lockIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  lockText: {
    fontFamily: FONT_FAMILY.bold,
    fontSize: 13,
    color: COLORS.white,
  },
  bodyWrap: {
    padding: SPACING.l,
    gap: 6,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  cardTitle: {
    fontFamily: FONT_FAMILY.bold,
    fontSize: 17,
    color: '#191C21',
    lineHeight: 24,
    textAlign: 'left',
  },
  artistText: {
    fontFamily: FONT_FAMILY.semiBold,
    fontSize: 13,
    color: COLORS.primary,
    textAlign: 'left',
  },
  cardSubtitle: {
    fontFamily: FONT_FAMILY.regular,
    fontSize: 13,
    color: '#697082',
    lineHeight: 20,
    marginTop: 2,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 6,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F5F0E8',
  },
  karaokePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFF4EE',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: BORDER_RADIUS.m,
  },
  karaokeText: {
    fontFamily: FONT_FAMILY.semiBold,
    fontSize: 12,
    color: COLORS.primary,
  },
  audioPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F5F2EC',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: BORDER_RADIUS.m,
  },
  audioPillText: {
    fontFamily: FONT_FAMILY.medium,
    fontSize: 12,
    color: '#697082',
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  actionBtnText: {
    fontFamily: FONT_FAMILY.bold,
    fontSize: 13,
    color: COLORS.primary,
  },
});
