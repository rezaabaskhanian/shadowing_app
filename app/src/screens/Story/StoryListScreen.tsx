import React, { useCallback, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BookOpen, Layers, X } from 'lucide-react-native';

import { COLORS, SPACING } from '../../theme/colors';
import { FONT_FAMILY, TEXT_STYLES } from '../../theme/typography';
import { useLanguage } from '../../data/i18n';
import { absUrl } from '../../api/config';
import { atOrBelowLevel, getStories } from '../../api/podcasts';
import { getMyLevel } from '../../api/assessment';
import { getReadChapters, groupStories, type StorySeries } from '../../services/storyProgress';
import { BannerCard, ListHero, levelColor } from '../../components/ContentVisuals';

const LEVEL_LABEL: Record<string, string> = {
  starter: 'levelStarter',
  beginner: 'levelBeginner',
  intermediate: 'levelIntermediate',
  advanced: 'levelAdvanced',
  proficient: 'levelProficient',
};

/**
 * بخش خواندن: داستان‌های کوتاهِ چندفصلی، فقط تا سطحِ کاربر (سطح بالاتر هرگز).
 * هر کارت یک داستان است و لمسش اولین فصلِ نخوانده را باز می‌کند.
 */
export const StoryListScreen: React.FC = () => {
  const { t } = useLanguage();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const [series, setSeries] = useState<StorySeries[] | null>(null);
  const [error, setError] = useState(false);

  const load = useCallback(() => {
    setError(false);
    Promise.all([getStories(), getMyLevel().catch(() => null), getReadChapters()])
      .then(([chapters, lvl, read]) => setSeries(groupStories(atOrBelowLevel(chapters, lvl?.scene_level), read)))
      .catch(() => setError(true));
  }, []);

  // بعد از خواندن یک فصل، پیشرفتِ کارت‌ها تازه شود.
  useFocusEffect(load);

  return (
    <View style={[styles.container, { paddingTop: insets.top + SPACING.s }]}>
      <TouchableOpacity style={styles.closeBtn} onPress={() => navigation.goBack()} activeOpacity={0.8}>
        <X size={20} color={COLORS.text} />
      </TouchableOpacity>
      <ListHero
        icon={<BookOpen size={26} color={COLORS.white} />}
        color={COLORS.levelIntermediateBg}
        title={t('storyTitle')}
        subtitle={t('storySubtitle')}
      />

      {series === null && !error && (
        <View style={styles.center}>
          <ActivityIndicator color={COLORS.primary} />
        </View>
      )}
      {error && (
        <View style={styles.center}>
          <Text style={styles.mutedText}>{t('storyLoadError')}</Text>
          <TouchableOpacity onPress={load} activeOpacity={0.8}>
            <Text style={styles.linkText}>{t('topicSpeakingRetry')}</Text>
          </TouchableOpacity>
        </View>
      )}
      {series && series.length === 0 && (
        <View style={styles.center}>
          <Text style={styles.mutedText}>{t('storyEmpty')}</Text>
        </View>
      )}

      {series && series.length > 0 && (
        <ScrollView
          contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + SPACING.l }]}
          showsVerticalScrollIndicator={false}
        >
          {series.map((s) => {
            const done = s.readCount === s.chapters.length;
            return (
              <BannerCard
                key={s.title}
                image={s.cover_url ? { uri: absUrl(s.cover_url) } : null}
                accent={levelColor(s.level)}
                icon={<BookOpen size={20} color={COLORS.white} />}
                title={s.title}
                subtitle={s.description_fa}
                badgeLabel={t(LEVEL_LABEL[s.level] ?? 'levelBeginner')}
                cornerLabel={t('storyChaptersProgress')
                  .replace('{done}', String(s.readCount))
                  .replace('{total}', String(s.chapters.length))}
                metas={[
                  {
                    icon: <Layers size={13} color={COLORS.muted} />,
                    text: done
                      ? t('storyAllRead')
                      : `${t('storyChapterN').replace('{n}', String(s.next.chapter_no || 1))} · ${s.next.title}`,
                  },
                ]}
                done={done}
                onPress={() => navigation.navigate('Story', { storyId: s.next.id, openedAt: Date.now() })}
              />
            );
          })}
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
