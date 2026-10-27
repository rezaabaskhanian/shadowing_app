import React, { useCallback, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Mic, Music, X } from 'lucide-react-native';

import { COLORS, SPACING } from '../../theme/colors';
import { FONT_FAMILY, TEXT_STYLES } from '../../theme/typography';
import { useLanguage } from '../../data/i18n';
import { absUrl } from '../../api/config';
import { atOrBelowLevel } from '../../api/podcasts';
import { getMyLevel } from '../../api/assessment';
import { getSongs, type Song } from '../../api/songs';
import { BannerCard, ListHero, levelColor } from '../../components/ContentVisuals';

const LEVEL_LABEL: Record<string, string> = {
  starter: 'levelStarter',
  beginner: 'levelBeginner',
  intermediate: 'levelIntermediate',
  advanced: 'levelAdvanced',
  proficient: 'levelProficient',
};

const duration = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

/** بخش آهنگ: آهنگ‌های منتشرشده تا سطح کاربر؛ لمس هر کارت صفحه‌ی آهنگ را باز می‌کند. */
export const SongListScreen: React.FC = () => {
  const { t } = useLanguage();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const [songs, setSongs] = useState<Song[] | null>(null);
  const [error, setError] = useState(false);

  const load = useCallback(() => {
    setError(false);
    Promise.all([getSongs(), getMyLevel().catch(() => null)])
      .then(([list, lvl]) => setSongs(atOrBelowLevel(list, lvl?.scene_level)))
      .catch(() => setError(true));
  }, []);
  useFocusEffect(load);

  return (
    <View style={[styles.container, { paddingTop: insets.top + SPACING.s }]}>
      <TouchableOpacity style={styles.closeBtn} onPress={() => navigation.goBack()} activeOpacity={0.8}>
        <X size={20} color={COLORS.text} />
      </TouchableOpacity>
      <ListHero
        icon={<Music size={26} color={COLORS.white} />}
        color={COLORS.pink}
        title={t('songTitle')}
        subtitle={t('songSubtitle')}
      />

      {songs === null && !error && (
        <View style={styles.center}>
          <ActivityIndicator color={COLORS.primary} />
        </View>
      )}
      {error && (
        <View style={styles.center}>
          <Text style={styles.mutedText}>{t('songLoadError')}</Text>
          <TouchableOpacity onPress={load} activeOpacity={0.8}>
            <Text style={styles.linkText}>{t('topicSpeakingRetry')}</Text>
          </TouchableOpacity>
        </View>
      )}
      {songs && songs.length === 0 && (
        <View style={styles.center}>
          <Text style={styles.mutedText}>{t('songEmpty')}</Text>
        </View>
      )}

      {songs && songs.length > 0 && (
        <ScrollView
          contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + SPACING.l }]}
          showsVerticalScrollIndicator={false}
        >
          {songs.map((s) => (
            <BannerCard
              key={s.id}
              image={s.cover_url ? { uri: absUrl(s.cover_url) } : null}
              accent={levelColor(s.level)}
              icon={<Music size={20} color={COLORS.white} />}
              title={s.title}
              subtitle={s.artist || s.description_fa}
              badgeLabel={t(LEVEL_LABEL[s.level] ?? 'levelBeginner')}
              cornerLabel={s.duration_seconds > 0 ? duration(s.duration_seconds) : undefined}
              metas={
                s.instrumental_url
                  ? [{ icon: <Mic size={13} color={COLORS.muted} />, text: t('songSingAlongBadge') }]
                  : []
              }
              onPress={() => navigation.navigate('Song', { songId: s.id, openedAt: Date.now() })}
            />
          ))}
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background, paddingHorizontal: SPACING.l },
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
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: SPACING.s },
  mutedText: { ...TEXT_STYLES.bodyMd, color: COLORS.textSecondary, textAlign: 'center' },
  linkText: { ...TEXT_STYLES.labelMd, color: COLORS.primary, fontFamily: FONT_FAMILY.semiBold },
  list: { gap: SPACING.m, paddingTop: SPACING.m },
});
