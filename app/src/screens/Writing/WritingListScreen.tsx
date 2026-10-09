import React, { useCallback, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FileText, PenLine, Trophy, X } from 'lucide-react-native';

import { COLORS, SPACING, BORDER_RADIUS } from '../../theme/colors';
import { FONT_FAMILY, TEXT_STYLES } from '../../theme/typography';
import { SHADOWS } from '../../theme/elevation';
import { useLanguage } from '../../data/i18n';
import { getWritingPrompts, type WritingPrompt, type WritingLevel } from '../../api/writing';

const LEVEL_META: Record<WritingLevel, { labelKey: string; bg: string }> = {
  beginner: { labelKey: 'levelBeginner', bg: COLORS.levelBeginnerBg },
  intermediate: { labelKey: 'levelIntermediate', bg: COLORS.levelIntermediateBg },
  advanced: { labelKey: 'levelAdvanced', bg: COLORS.levelAdvancedBg },
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

  const load = useCallback(() => {
    setError(false);
    getWritingPrompts()
      .then(setTopics)
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
        <Text style={styles.headerTitle}>{t('writingTitle')}</Text>
        <Text style={styles.headerSub}>{t('writingSubtitle')}</Text>
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
            return (
              <TouchableOpacity
                key={topic.id}
                style={styles.card}
                activeOpacity={0.85}
                onPress={() => navigation.navigate('Writing', { prompt: topic, openedAt: Date.now() })}
              >
                <View style={styles.cardIcon}>
                  <PenLine size={20} color={COLORS.primary} />
                </View>
                <View style={styles.cardBody}>
                  <Text style={styles.cardTitle}>{topic.title}</Text>
                  {!!topic.prompt_fa && (
                    <Text style={styles.cardPrompt} numberOfLines={2}>
                      {topic.prompt_fa}
                    </Text>
                  )}
                  <View style={styles.metaRow}>
                    <View style={[styles.badge, { backgroundColor: level.bg }]}>
                      <Text style={styles.badgeText}>{t(level.labelKey)}</Text>
                    </View>
                    <View style={styles.metaItem}>
                      <FileText size={13} color={COLORS.muted} />
                      <Text style={styles.metaText}>
                        {t('writingWordRange')
                          .replace('{min}', String(topic.min_words))
                          .replace('{max}', String(topic.max_words))}
                      </Text>
                    </View>
                    {topic.attempts > 0 && (
                      <View style={styles.metaItem}>
                        <Trophy size={13} color={COLORS.warning} />
                        <Text style={styles.metaText}>
                          {t('topicSpeakingBest').replace('{score}', String(topic.best_score))}
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
    flexDirection: 'row',
    gap: SPACING.m,
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.l,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.m,
    ...SHADOWS.level1,
  },
  cardIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardBody: {
    flex: 1,
  },
  cardTitle: {
    fontFamily: FONT_FAMILY.bold,
    fontSize: 16,
    color: COLORS.text,
  },
  cardPrompt: {
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
