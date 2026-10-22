import React, { useCallback, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Clock, Mic, Trophy, X } from 'lucide-react-native';

import { COLORS, SPACING } from '../../theme/colors';
import { FONT_FAMILY, TEXT_STYLES } from '../../theme/typography';
import { useLanguage } from '../../data/i18n';
import { getSpeakingTopics, type SpeakingTopic, type TopicLevel } from '../../api/topicSpeaking';
import { getMyLevel } from '../../api/assessment';
import { atOrBelowLevel } from '../../api/podcasts';
import { absUrl } from '../../api/config';
import { BannerCard, ListHero } from '../../components/ContentVisuals';

const LEVEL_META: Record<TopicLevel, { labelKey: string; bg: string }> = {
  starter: { labelKey: 'levelStarter', bg: COLORS.levelStarterBg },
  beginner: { labelKey: 'levelBeginner', bg: COLORS.levelBeginnerBg },
  intermediate: { labelKey: 'levelIntermediate', bg: COLORS.levelIntermediateBg },
  advanced: { labelKey: 'levelAdvanced', bg: COLORS.levelAdvancedBg },
  proficient: { labelKey: 'levelProficient', bg: COLORS.levelProficientBg },
};

/**
 * لیست موضوع‌های «صحبت درباره‌ی یک موضوع» که ادمین ساخته، با بهترین امتیاز
 * همین کاربر روی هر موضوع. ورودی از منوی کناری.
 */
export const TopicListScreen: React.FC = () => {
  const { t } = useLanguage();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const [topics, setTopics] = useState<SpeakingTopic[] | null>(null);
  const [error, setError] = useState(false);

  const load = useCallback(() => {
    setError(false);
    // فقط موضوع‌های سطح کاربر و پایین‌تر؛ سطح بالاتر نشان داده نمی‌شود.
    Promise.all([getSpeakingTopics(), getMyLevel().catch(() => null)])
      .then(([list, lvl]) => setTopics(atOrBelowLevel(list, lvl?.scene_level)))
      .catch(() => setError(true));
  }, []);

  // هر بار برگشت به این صفحه (بعد از یک تلاش) بهترین امتیازها تازه شوند.
  useFocusEffect(load);

  return (
    <View style={[styles.container, { paddingTop: insets.top + SPACING.s }]}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.closeBtn} onPress={() => navigation.goBack()} activeOpacity={0.8}>
          <X size={20} color={COLORS.text} />
        </TouchableOpacity>
        <ListHero
          icon={<Mic size={26} color={COLORS.white} />}
          color={COLORS.warning}
          title={t('topicSpeakingTitle')}
          subtitle={t('topicSpeakingSubtitle')}
        />
      </View>

      {topics === null && !error && (
        <View style={styles.center}>
          <ActivityIndicator color={COLORS.primary} />
        </View>
      )}

      {error && (
        <View style={styles.center}>
          <Text style={styles.mutedText}>{t('topicSpeakingLoadError')}</Text>
          <TouchableOpacity onPress={load} activeOpacity={0.8}>
            <Text style={styles.linkText}>{t('topicSpeakingRetry')}</Text>
          </TouchableOpacity>
        </View>
      )}

      {topics && topics.length === 0 && (
        <View style={styles.center}>
          <Text style={styles.mutedText}>{t('topicSpeakingEmpty')}</Text>
        </View>
      )}

      {topics && topics.length > 0 && (
        <ScrollView
          contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + SPACING.l }]}
          showsVerticalScrollIndicator={false}
        >
          {topics.map((topic) => {
            const level = LEVEL_META[topic.level] ?? LEVEL_META.beginner;
            const picture = topic.image_url || topic.images?.find((img) => !!img.url)?.url;
            const metas = [
              {
                icon: <Clock size={13} color={COLORS.muted} />,
                text: `${topic.images?.length ? `🖼 ${t('pictureStoryBadge')} · ` : ''}${t('topicSpeakingSeconds').replace(
                  '{s}',
                  String(topic.duration_seconds)
                )}`,
              },
            ];
            if (topic.attempts > 0) {
              metas.push({
                icon: <Trophy size={13} color={COLORS.warning} />,
                text: t('topicSpeakingBest').replace('{score}', String(topic.best_score)),
              });
            }
            return (
              <BannerCard
                key={topic.id}
                image={picture ? { uri: absUrl(picture) } : null}
                accent={level.bg}
                icon={<Mic size={22} color={COLORS.white} />}
                title={topic.title}
                subtitle={topic.prompt_fa}
                badgeLabel={t(level.labelKey)}
                metas={metas}
                done={topic.attempts > 0}
                onPress={() => navigation.navigate('TopicSpeaking', { topic, openedAt: Date.now() })}
              />
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
});
