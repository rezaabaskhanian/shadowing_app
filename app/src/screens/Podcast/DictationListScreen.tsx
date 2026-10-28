import React, { useCallback, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PenLine, X } from 'lucide-react-native';

import { COLORS, SPACING } from '../../theme/colors';
import { FONT_FAMILY, TEXT_STYLES } from '../../theme/typography';
import { useLanguage } from '../../data/i18n';
import { absUrl } from '../../api/config';
import { atOrBelowLevel, getPodcasts, type Podcast } from '../../api/podcasts';
import { getMyLevel } from '../../api/assessment';
import { BannerCard, levelColor } from '../../components/ContentVisuals';
import { formatDuration } from './PodcastListScreen';

const LEVEL_LABEL: Record<string, string> = {
  starter: 'levelStarter',
  beginner: 'levelBeginner',
  intermediate: 'levelIntermediate',
  advanced: 'levelAdvanced',
  proficient: 'levelProficient',
};
const LEVEL_RANK = ['starter', 'beginner', 'intermediate', 'advanced', 'proficient'];

/**
 * بخش «دیکته»: پادکست‌های منتخب (غیر درسی) تا سطح کاربر؛ هر کدام کامل و بدون متن
 * پخش می‌شود و کاربر هر چه می‌شنود می‌نویسد (PodcastDictationScreen).
 */
export const DictationListScreen: React.FC = () => {
  const { t } = useLanguage();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const [list, setList] = useState<Podcast[] | null>(null);
  const [error, setError] = useState(false);

  const load = useCallback(() => {
    setError(false);
    Promise.all([getPodcasts(), getMyLevel().catch(() => null)])
      .then(([all, lvl]) =>
        setList(
          atOrBelowLevel(
            all.filter((p) => p.kind === 'featured'),
            lvl?.scene_level,
          ).sort((a, b) => LEVEL_RANK.indexOf(b.level) - LEVEL_RANK.indexOf(a.level)),
        ),
      )
      .catch(() => setError(true));
  }, []);
  useFocusEffect(load);

  return (
    <View style={[styles.container, { paddingTop: insets.top + SPACING.s }]}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.closeBtn} onPress={() => navigation.goBack()} activeOpacity={0.8}>
          <X size={20} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.title}>{t('dictationTitle')}</Text>
      </View>
      <Text style={styles.sub}>{t('dictationSubtitle')}</Text>

      {list === null && !error && (
        <View style={styles.center}>
          <ActivityIndicator color={COLORS.primary} />
        </View>
      )}
      {error && (
        <View style={styles.center}>
          <Text style={styles.muted}>{t('podcastLoadError')}</Text>
          <TouchableOpacity onPress={load} activeOpacity={0.8}>
            <Text style={styles.link}>{t('topicSpeakingRetry')}</Text>
          </TouchableOpacity>
        </View>
      )}
      {list && list.length === 0 && (
        <View style={styles.center}>
          <Text style={styles.muted}>{t('podcastEmpty')}</Text>
        </View>
      )}
      {list && list.length > 0 && (
        <ScrollView contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + SPACING.l }]} showsVerticalScrollIndicator={false}>
          {list.map((p) => (
            <BannerCard
              key={p.id}
              image={p.cover_url ? { uri: absUrl(p.cover_url) } : null}
              accent={levelColor(p.level)}
              icon={<PenLine size={18} color={COLORS.white} />}
              title={p.title}
              badgeLabel={t(LEVEL_LABEL[p.level] ?? 'levelBeginner')}
              cornerLabel={formatDuration(p.duration_seconds)}
              onPress={() => navigation.navigate('PodcastDictation', { podcastId: p.id, openedAt: Date.now() })}
            />
          ))}
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background, paddingHorizontal: SPACING.l },
  header: { flexDirection: 'row', alignItems: 'center', gap: SPACING.s },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { flex: 1, fontFamily: FONT_FAMILY.bold, fontSize: 18, lineHeight: 28, color: COLORS.text, textAlign: 'right' },
  sub: {
    fontFamily: FONT_FAMILY.regular,
    fontSize: 12,
    lineHeight: 20,
    color: COLORS.textSecondary,
    textAlign: 'right',
    marginTop: 4,
    marginBottom: SPACING.m,
  },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: SPACING.s },
  muted: { ...TEXT_STYLES.bodyMd, color: COLORS.textSecondary, textAlign: 'center' },
  link: { ...TEXT_STYLES.labelMd, color: COLORS.primary, fontFamily: FONT_FAMILY.semiBold },
  list: { gap: SPACING.m },
});
