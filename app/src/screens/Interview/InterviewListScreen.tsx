import React, { useCallback, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Briefcase, GraduationCap, ListChecks, Plane, Trophy, X } from 'lucide-react-native';

import { COLORS, SPACING } from '../../theme/colors';
import { FONT_FAMILY, TEXT_STYLES } from '../../theme/typography';
import { useLanguage } from '../../data/i18n';
import { getInterviewSets, type InterviewKind, type InterviewSet } from '../../api/interviews';
import { getMyLevel } from '../../api/assessment';
import { atOrBelowLevel } from '../../api/podcasts';
import { absUrl } from '../../api/config';
import { BannerCard, ListHero, levelColor } from '../../components/ContentVisuals';

export const INTERVIEW_KIND_META: Record<InterviewKind, { Icon: typeof Briefcase; color: string }> = {
  job: { Icon: Briefcase, color: COLORS.primary },
  admission: { Icon: GraduationCap, color: COLORS.levelIntermediateBg },
  visa: { Icon: Plane, color: COLORS.secondary },
};

/**
 * فهرست مصاحبه‌های شبیه‌سازی‌شده تا سطح کاربر، با بهترین امتیاز همین کاربر.
 * با fieldKey (از صفحه‌ی زبان تخصصی) فقط مصاحبه‌های همان رشته نشان داده می‌شود.
 */
export const InterviewListScreen: React.FC = () => {
  const { t } = useLanguage();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const fieldKey: string | undefined = route.params?.fieldKey;
  const [sets, setSets] = useState<InterviewSet[] | null>(null);
  const [error, setError] = useState(false);

  const load = useCallback(() => {
    setError(false);
    Promise.all([getInterviewSets(), getMyLevel().catch(() => null)])
      .then(([list, lvl]) => {
        const forField = fieldKey ? list.filter((s) => s.field_key === fieldKey) : list;
        setSets(atOrBelowLevel(forField, lvl?.scene_level));
      })
      .catch(() => setError(true));
  }, [fieldKey]);

  useFocusEffect(load);

  return (
    <View style={[styles.container, { paddingTop: insets.top + SPACING.s }]}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.closeBtn} onPress={() => navigation.goBack()} activeOpacity={0.8}>
          <X size={20} color={COLORS.text} />
        </TouchableOpacity>
        <ListHero
          icon={<Briefcase size={26} color={COLORS.white} />}
          color={COLORS.primary}
          title={t('interviewTitle')}
          subtitle={t('interviewSubtitle')}
        />
      </View>

      {sets === null && !error && (
        <View style={styles.center}>
          <ActivityIndicator color={COLORS.primary} />
        </View>
      )}

      {error && (
        <View style={styles.center}>
          <Text style={styles.mutedText}>{t('interviewLoadError')}</Text>
          <TouchableOpacity onPress={load} activeOpacity={0.8}>
            <Text style={styles.linkText}>{t('topicSpeakingRetry')}</Text>
          </TouchableOpacity>
        </View>
      )}

      {sets && sets.length === 0 && (
        <View style={styles.center}>
          <Text style={styles.mutedText}>{t('interviewEmpty')}</Text>
        </View>
      )}

      {sets && sets.length > 0 && (
        <ScrollView
          contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + SPACING.l }]}
          showsVerticalScrollIndicator={false}
        >
          {sets.map((set) => {
            const kind = INTERVIEW_KIND_META[set.kind] ?? INTERVIEW_KIND_META.job;
            const metas = [
              {
                icon: <ListChecks size={13} color={COLORS.muted} />,
                text: `${t(`interviewKind_${set.kind}`)} · ${t('interviewQuestionCount').replace('{n}', String(set.question_count))}`,
              },
            ];
            if ((set.attempts ?? 0) > 0) {
              metas.push({
                icon: <Trophy size={13} color={COLORS.warning} />,
                text: t('interviewBest').replace('{s}', String(set.best_score ?? 0)),
              });
            }
            return (
              <BannerCard
                key={set.id}
                image={set.image_url ? { uri: absUrl(set.image_url) } : null}
                accent={levelColor(set.level)}
                icon={<kind.Icon size={22} color={COLORS.white} />}
                title={set.title}
                subtitle={set.title_fa || set.description_fa}
                badgeLabel={t(`level${set.level.charAt(0).toUpperCase()}${set.level.slice(1)}`)}
                metas={metas}
                done={(set.attempts ?? 0) > 0}
                onPress={() => navigation.navigate('InterviewSession', { setId: set.id, openedAt: Date.now() })}
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
