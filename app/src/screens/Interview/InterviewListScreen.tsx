import React, { useCallback, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Briefcase, GraduationCap, Info, Mic, Play, Plane, Trophy } from 'lucide-react-native';

import { COLORS, SPACING } from '../../theme/colors';
import { FONT_FAMILY, TEXT_STYLES } from '../../theme/typography';
import { useLanguage } from '../../data/i18n';
import { getInterviewSets, type InterviewKind, type InterviewSet } from '../../api/interviews';
import { getMyLevel } from '../../api/assessment';
import { atOrBelowLevel } from '../../api/podcasts';
import { levelColor } from '../../components/ContentVisuals';
import { HubHeader } from '../../components/HubHeader';
import { GradientFill } from '../../components/GradientFill';

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

  const toFa = (v: number | string) => String(v).replace(/\d/g, (d) => '۰۱۲۳۴۵۶۷۸۹'[Number(d)]);
  const open = (id: string) => navigation.navigate('InterviewSession', { setId: id, openedAt: Date.now() });

  return (
    <View style={[styles.container, { paddingTop: insets.top + SPACING.s }]}>
      <ScrollView
        contentContainerStyle={[styles.list, { paddingBottom: SPACING.l }]}
        showsVerticalScrollIndicator={false}
      >
        <HubHeader
          tag={t('interviewTag')}
          onClose={() => navigation.goBack()}
          icon={<Briefcase size={30} color={COLORS.white} />}
          badge="AI"
          title={t('interviewTitle')}
          subtitle={t('interviewHubSub')}
        />

        {sets === null && !error && <ActivityIndicator color={COLORS.primary} style={styles.loader} />}

        {error && (
          <View style={styles.center}>
            <Text style={styles.mutedText}>{t('interviewLoadError')}</Text>
            <TouchableOpacity onPress={load} activeOpacity={0.8}>
              <Text style={styles.linkText}>{t('topicSpeakingRetry')}</Text>
            </TouchableOpacity>
          </View>
        )}

        {sets && sets.length === 0 && <Text style={[styles.mutedText, styles.loader]}>{t('interviewEmpty')}</Text>}

        {sets && sets.length > 0 && (
          <>
            <View style={styles.sectionRow}>
              <Text style={styles.sectionTitle}>{t('interviewSuggested')}</Text>
              <Text style={styles.sectionCount}>{t('interviewActiveCount').replace('{n}', toFa(sets.length))}</Text>
            </View>
            {sets.map((set) => {
              const kind = INTERVIEW_KIND_META[set.kind] ?? INTERVIEW_KIND_META.job;
              const color = levelColor(set.level);
              const done = (set.attempts ?? 0) > 0;
              return (
                <TouchableOpacity key={set.id} style={styles.card} onPress={() => open(set.id)} activeOpacity={0.85}>
                  <View style={[styles.cardIcon, { backgroundColor: `${kind.color}1A` }]}>
                    <kind.Icon size={20} color={kind.color} />
                  </View>
                  <View style={styles.cardBody}>
                    <View style={styles.cardMeta}>
                      <View style={[styles.levelChip, { backgroundColor: `${color}1F` }]}>
                        <Text style={[styles.levelChipText, { color }]}>
                          {t(`level${set.level.charAt(0).toUpperCase()}${set.level.slice(1)}`)}
                        </Text>
                      </View>
                      <Text style={styles.metaText}>
                        {done
                          ? t('interviewBest').replace('{s}', toFa(set.best_score ?? 0))
                          : t('interviewQuestionCount').replace('{n}', toFa(set.question_count))}
                      </Text>
                    </View>
                    <Text style={styles.cardTitle} numberOfLines={1}>
                      {set.title_fa || set.title}
                    </Text>
                    {!!set.description_fa && (
                      <Text style={styles.cardDesc} numberOfLines={2}>
                        {set.description_fa}
                      </Text>
                    )}
                  </View>
                  <View style={[styles.playBtn, done && styles.playBtnDone]}>
                    {done ? (
                      <Trophy size={14} color={COLORS.warning} />
                    ) : (
                      <Play size={14} color={COLORS.text} fill={COLORS.text} />
                    )}
                  </View>
                </TouchableOpacity>
              );
            })}
            <View style={styles.note}>
              <Info size={14} color={COLORS.primary} />
              <Text style={styles.noteText}>{t('interviewFootnote')}</Text>
            </View>
          </>
        )}
      </ScrollView>

      {sets && sets.length > 0 && (
        <View style={[styles.footer, { paddingBottom: insets.bottom + SPACING.m }]}>
          <TouchableOpacity style={styles.cta} onPress={() => open(sets[0].id)} activeOpacity={0.85}>
            <GradientFill from="#F07A4A" to="#E8572F" horizontal />
            <View style={styles.ctaInner}>
              <Mic size={18} color={COLORS.white} />
              <Text style={styles.ctaText}>{t('interviewStartNow')}</Text>
            </View>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAF8F4', paddingHorizontal: SPACING.l },
  loader: { marginTop: SPACING.xl },
  center: { alignItems: 'center', justifyContent: 'center', gap: SPACING.s, marginTop: SPACING.xl },
  mutedText: { ...TEXT_STYLES.bodyMd, color: COLORS.textSecondary, textAlign: 'center' },
  linkText: { ...TEXT_STYLES.labelMd, color: COLORS.primary, fontFamily: FONT_FAMILY.semiBold },
  list: { gap: 12 },
  sectionRow: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between', marginTop: SPACING.m },
  sectionTitle: { fontFamily: FONT_FAMILY.bold, fontSize: 14, color: COLORS.text },
  sectionCount: { fontFamily: FONT_FAMILY.semiBold, fontSize: 11, color: COLORS.primary },
  card: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 12,
    backgroundColor: COLORS.white,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#EEEAE3',
    padding: 14,
  },
  cardIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  cardBody: { flex: 1, alignItems: 'flex-end', gap: 3 },
  cardMeta: { flexDirection: 'row-reverse', alignItems: 'center', gap: 6 },
  levelChip: { paddingHorizontal: 7, paddingVertical: 1, borderRadius: 6 },
  levelChipText: { fontFamily: FONT_FAMILY.bold, fontSize: 10 },
  metaText: { fontFamily: FONT_FAMILY.regular, fontSize: 10, color: COLORS.muted },
  cardTitle: { fontFamily: FONT_FAMILY.bold, fontSize: 14, color: COLORS.text, textAlign: 'right' },
  cardDesc: { fontFamily: FONT_FAMILY.regular, fontSize: 11, lineHeight: 18, color: COLORS.textSecondary, textAlign: 'right' },
  playBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1EEE8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  playBtnDone: { backgroundColor: 'rgba(233,162,59,0.14)' },
  note: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 14,
    backgroundColor: '#FDF1EC',
    borderWidth: 1,
    borderColor: '#F6D9CC',
  },
  noteText: { flex: 1, fontFamily: FONT_FAMILY.regular, fontSize: 11, color: COLORS.textSecondary, textAlign: 'right' },
  footer: { paddingTop: SPACING.s },
  cta: {
    height: 54,
    borderRadius: 18,
    overflow: 'hidden',
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
    shadowColor: COLORS.primary,
    shadowOpacity: 0.35,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
  },
  ctaInner: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  ctaText: { fontFamily: FONT_FAMILY.bold, fontSize: 15, color: COLORS.white },
});
