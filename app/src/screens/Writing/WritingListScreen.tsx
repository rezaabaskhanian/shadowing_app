import React, { useCallback, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FileText, PenLine, Trophy, X } from 'lucide-react-native';

import { COLORS, SPACING } from '../../theme/colors';
import { FONT_FAMILY, TEXT_STYLES } from '../../theme/typography';
import { useLanguage } from '../../data/i18n';
import { getWritingPrompts, type WritingPrompt, type WritingLevel } from '../../api/writing';
import { getMyLevel } from '../../api/assessment';
import { atOrBelowLevel } from '../../api/podcasts';
import { absUrl } from '../../api/config';
import { BannerCard, ListHero } from '../../components/ContentVisuals';

const LEVEL_META: Record<WritingLevel, { labelKey: string; bg: string }> = {
  starter: { labelKey: 'levelStarter', bg: COLORS.levelStarterBg },
  beginner: { labelKey: 'levelBeginner', bg: COLORS.levelBeginnerBg },
  intermediate: { labelKey: 'levelIntermediate', bg: COLORS.levelIntermediateBg },
  advanced: { labelKey: 'levelAdvanced', bg: COLORS.levelAdvancedBg },
  proficient: { labelKey: 'levelProficient', bg: COLORS.levelProficientBg },
};

/**
 * لیست موضوع‌های «تمرین نوشتن» که ادمین ساخته، با بهترین امتیاز همین کاربر
 * روی هر موضوع. ورودی از منوی کناری.
 */
export const WritingListScreen: React.FC = () => {
  const { t } = useLanguage();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const [topics, setTopics] = useState<WritingPrompt[] | null>(null);
  const [error, setError] = useState(false);

  // فقط موضوع‌های سطح کاربر و پایین‌تر؛ سطح بالاتر نشان داده نمی‌شود.
  const load = useCallback(() => {
    setError(false);
    Promise.all([getWritingPrompts(), getMyLevel().catch(() => null)])
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
          icon={<PenLine size={26} color={COLORS.white} />}
          color={COLORS.levelAdvancedBg}
          title={t('writingTitle')}
          subtitle={t('writingSubtitle')}
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
          <Text style={styles.mutedText}>{t('writingEmpty')}</Text>
        </View>
      )}

      {topics && topics.length > 0 && (
        <ScrollView
          contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + SPACING.l }]}
          showsVerticalScrollIndicator={false}
        >
          {topics.map((topic) => {
            const level = LEVEL_META[topic.level] ?? LEVEL_META.beginner;
            const metas = [
              {
                icon: <FileText size={13} color={COLORS.muted} />,
                text: t('writingWordRange')
                  .replace('{min}', String(topic.min_words))
                  .replace('{max}', String(topic.max_words)),
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
                image={topic.image_url ? { uri: absUrl(topic.image_url) } : null}
                accent={level.bg}
                icon={<PenLine size={22} color={COLORS.white} />}
                title={topic.title}
                subtitle={topic.prompt_fa}
                badgeLabel={t(level.labelKey)}
                metas={metas}
                done={topic.attempts > 0}
                onPress={() => navigation.navigate('Writing', { prompt: topic, openedAt: Date.now() })}
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
