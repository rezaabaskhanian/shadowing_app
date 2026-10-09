import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Clapperboard, Clock, Film, Trophy, Users, X } from 'lucide-react-native';

import { COLORS, SPACING, BORDER_RADIUS } from '../../theme/colors';
import { FONT_FAMILY, TEXT_STYLES } from '../../theme/typography';
import { SHADOWS } from '../../theme/elevation';
import { useLanguage } from '../../data/i18n';
import { absUrl } from '../../api/config';
import { getVideoClips, type ClipLevel, type VideoClipListItem } from '../../api/videoClips';

const LEVEL_META: Record<ClipLevel, { labelKey: string; bg: string }> = {
  beginner: { labelKey: 'levelBeginner', bg: COLORS.levelBeginnerBg },
  intermediate: { labelKey: 'levelIntermediate', bg: COLORS.levelIntermediateBg },
  advanced: { labelKey: 'levelAdvanced', bg: COLORS.levelAdvancedBg },
};

/** لیست کلیپ‌های «تمرین با ویدیو»؛ ورودی از منوی کناری. */
export const VideoClipListScreen: React.FC = () => {
  const { t } = useLanguage();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const [clips, setClips] = useState<VideoClipListItem[] | null>(null);
  const [error, setError] = useState(false);

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
      <View style={styles.header}>
        <TouchableOpacity style={styles.closeBtn} onPress={() => navigation.goBack()} activeOpacity={0.8}>
          <X size={20} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('videoClipsTitle')}</Text>
        <Text style={styles.headerSub}>{t('videoClipsSubtitle')}</Text>
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

      {clips && clips.length === 0 && (
        <View style={styles.center}>
          <Text style={styles.mutedText}>{t('videoClipsEmpty')}</Text>
        </View>
      )}

      {clips && clips.length > 0 && (
        <ScrollView
          contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + SPACING.l }]}
          showsVerticalScrollIndicator={false}
        >
          {clips.map((clip) => {
            const level = LEVEL_META[clip.level] ?? LEVEL_META.beginner;
            const isMovie = clip.source === 'movie';
            return (
              <TouchableOpacity
                key={clip.id}
                style={styles.card}
                activeOpacity={0.85}
                onPress={() => navigation.navigate('VideoClip', { clipId: clip.id, openedAt: Date.now() })}
              >
                <View style={styles.poster}>
                  {clip.poster_url ? (
                    <Image source={{ uri: absUrl(clip.poster_url) }} style={styles.posterImage} resizeMode="cover" />
                  ) : isMovie ? (
                    <Film size={32} color={COLORS.white} />
                  ) : (
                    <Clapperboard size={32} color={COLORS.white} />
                  )}
                  <View style={styles.sourceBadge}>
                    <Text style={styles.sourceBadgeText}>
                      {t(isMovie ? 'videoClipsSourceMovie' : 'videoClipsSourceFlow')}
                    </Text>
                  </View>
                </View>
                <View style={styles.cardBody}>
                  <Text style={styles.cardTitle}>{clip.title}</Text>
                  {!!clip.description_fa && (
                    <Text style={styles.cardDesc} numberOfLines={2}>
                      {clip.description_fa}
                    </Text>
                  )}
                  <View style={styles.metaRow}>
                    <View style={[styles.badge, { backgroundColor: level.bg }]}>
                      <Text style={styles.badgeText}>{t(level.labelKey)}</Text>
                    </View>
                    {clip.duration_seconds > 0 && (
                      <View style={styles.metaItem}>
                        <Clock size={13} color={COLORS.muted} />
                        <Text style={styles.metaText}>
                          {t('topicSpeakingSeconds').replace('{s}', String(clip.duration_seconds))}
                        </Text>
                      </View>
                    )}
                    <View style={styles.metaItem}>
                      <Users size={13} color={COLORS.muted} />
                      <Text style={styles.metaText}>
                        {t('videoClipsCharacters').replace('{n}', String(clip.speaker_count))}
                      </Text>
                    </View>
                    {clip.attempts > 0 && (
                      <View style={styles.metaItem}>
                        <Trophy size={13} color={COLORS.warning} />
                        <Text style={styles.metaText}>
                          {t('topicSpeakingBest').replace('{score}', String(clip.best_score))}
                        </Text>
                      </View>
                    )}
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
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.l,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
    ...SHADOWS.level1,
  },
  poster: {
    height: 150,
    backgroundColor: COLORS.primaryDark,
    alignItems: 'center',
    justifyContent: 'center',
  },
  posterImage: {
    ...StyleSheet.absoluteFill,
  },
  sourceBadge: {
    position: 'absolute',
    top: SPACING.s,
    left: SPACING.s,
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderRadius: BORDER_RADIUS.s,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  sourceBadgeText: {
    fontFamily: FONT_FAMILY.semiBold,
    fontSize: 11,
    color: COLORS.white,
  },
  cardBody: {
    padding: SPACING.m,
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
    flexWrap: 'wrap',
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
