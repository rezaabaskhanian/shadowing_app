import React, { useCallback, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Briefcase, GraduationCap, Info, Lock, Mic, Play, Plane, Trophy } from 'lucide-react-native';

import { COLORS, SPACING } from '../../theme/colors';
import { FONT_FAMILY, TEXT_STYLES } from '../../theme/typography';
import { useLanguage } from '../../data/i18n';
import { getInterviewSets, type InterviewKind, type InterviewSet } from '../../api/interviews';
import { getMyLevel } from '../../api/assessment';
import { atOrBelowLevel } from '../../api/podcasts';
import { levelColor } from '../../components/ContentVisuals';
import { HubHeader } from '../../components/HubHeader';
import { GradientFill } from '../../components/GradientFill';
import { getSubscriptionStatus } from '../../api/billing';
import { useAuth } from '../../data/AuthContext';

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
  const { user } = useAuth();
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [allSets, setAllSets] = useState<InterviewSet[] | null>(null);
  const [selectedField, setSelectedField] = useState<string>('all');
  const [selectedLevel, setSelectedLevel] = useState<string>('all');
  const [userLevel, setUserLevel] = useState<string | null>(null);
  const [error, setError] = useState(false);

  const FREE_INTERVIEW_COUNT = 1;

  const load = useCallback(() => {
    setError(false);
    if (user?.role === 'admin') {
      setIsSubscribed(true);
    } else {
      getSubscriptionStatus()
        .then((s) => setIsSubscribed(!!s?.active))
        .catch(() => setIsSubscribed(false));
    }
    Promise.all([getInterviewSets(), getMyLevel().catch(() => null)])
      .then(([list, lvl]) => {
        const forField = fieldKey ? list.filter((s) => s.field_key === fieldKey) : list;
        setAllSets(forField);
        if (lvl?.scene_level) {
          setUserLevel(lvl.scene_level);
        }
      })
      .catch(() => setError(true));
  }, [fieldKey, user?.role]);

  useFocusEffect(load);

  const toFa = (v: number | string) => String(v).replace(/\d/g, (d) => '۰۱۲۳۴۵۶۷۸۹'[Number(d)]);
  const open = (id: string, isLocked?: boolean) => {
    if (isLocked) {
      navigation.navigate('Paywall');
      return;
    }
    navigation.navigate('InterviewSession', { setId: id, openedAt: Date.now() });
  };

  const sets = (allSets || []).filter((s) => {
    // 1. Filter by Field / Category
    if (selectedField !== 'all') {
      if (s.field_key !== selectedField && s.kind !== selectedField) {
        return false;
      }
    }
    // 2. Filter by Level
    if (selectedLevel === 'all') return true;
    if (selectedLevel === 'beginner') return s.level === 'beginner' || s.level === 'starter';
    if (selectedLevel === 'intermediate') return s.level === 'intermediate';
    if (selectedLevel === 'advanced') return s.level === 'advanced' || s.level === 'proficient';
    return true;
  });

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

        {/* Level Filters */}
        {/* Field / Job Category Filters */}
        <View style={styles.filterContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
            {[
              { id: 'all', label: t('interviewFieldAll') },
              { id: 'computer', label: t('interviewFieldTech') },
              { id: 'nursing', label: t('interviewFieldNursing') },
              { id: 'admission', label: t('interviewFieldAdmission') },
              { id: 'visa', label: t('interviewFieldVisa') },
            ].map((tab) => {
              const active = selectedField === tab.id;
              return (
                <TouchableOpacity
                  key={tab.id}
                  style={[styles.filterTab, active && styles.filterTabActive]}
                  onPress={() => setSelectedField(tab.id)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.filterTabText, active && styles.filterTabTextActive]}>
                    {tab.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Level Filters */}
        <View style={[styles.filterContainer, { marginTop: 2 }]}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
            {[
              { id: 'all', label: t('interviewFilterAll') },
              { id: 'beginner', label: t('interviewFilterBeginner') },
              { id: 'intermediate', label: t('interviewFilterIntermediate') },
              { id: 'advanced', label: t('interviewFilterAdvanced') },
            ].map((tab) => {
              const active = selectedLevel === tab.id;
              return (
                <TouchableOpacity
                  key={tab.id}
                  style={[styles.filterTabSm, active && styles.filterTabSmActive]}
                  onPress={() => setSelectedLevel(tab.id)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.filterTabSmText, active && styles.filterTabSmTextActive]}>
                    {tab.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {allSets === null && !error && <ActivityIndicator color={COLORS.primary} style={styles.loader} />}

        {error && (
          <View style={styles.center}>
            <Text style={styles.mutedText}>{t('interviewLoadError')}</Text>
            <TouchableOpacity onPress={load} activeOpacity={0.8}>
              <Text style={styles.linkText}>{t('topicSpeakingRetry')}</Text>
            </TouchableOpacity>
          </View>
        )}

        {allSets && sets.length === 0 && <Text style={[styles.mutedText, styles.loader]}>{t('interviewEmpty')}</Text>}

        {sets && sets.length > 0 && (
          <>
            <View style={styles.sectionRow}>
              <Text style={styles.sectionTitle}>{t('interviewSuggested')}</Text>
              <Text style={styles.sectionCount}>{t('interviewActiveCount').replace('{n}', toFa(sets.length))}</Text>
            </View>
            {sets.map((set, index) => {
              const isLocked = !isSubscribed && index >= FREE_INTERVIEW_COUNT;
              const kind = INTERVIEW_KIND_META[set.kind] ?? INTERVIEW_KIND_META.job;
              const color = levelColor(set.level);
              const done = (set.attempts ?? 0) > 0;
              return (
                <TouchableOpacity
                  key={set.id}
                  style={[styles.card, isLocked && { borderColor: '#FCD7C7', backgroundColor: '#FFFDFC' }]}
                  onPress={() => open(set.id, isLocked)}
                  activeOpacity={0.85}
                >
                  <View style={[styles.cardIcon, { backgroundColor: isLocked ? '#FFF1E8' : `${kind.color}1A` }]}>
                    {isLocked ? (
                      <Lock size={20} color={COLORS.primary} />
                    ) : (
                      <kind.Icon size={20} color={kind.color} />
                    )}
                  </View>
                  <View style={styles.cardBody}>
                    <View style={styles.cardMeta}>
                      <View style={[styles.levelChip, { backgroundColor: `${color}1F` }]}>
                        <Text style={[styles.levelChipText, { color }]}>
                          {t(`level${set.level.charAt(0).toUpperCase()}${set.level.slice(1)}`)}
                        </Text>
                      </View>
                      {isLocked ? (
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: '#FFF1E8', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, borderWidth: 1, borderColor: '#FCD7C7' }}>
                          <Lock size={10} color={COLORS.primary} />
                          <Text style={{ fontFamily: FONT_FAMILY.bold, fontSize: 10, color: COLORS.primary }}>
                            قفل اشتراک
                          </Text>
                        </View>
                      ) : (
                        <Text style={styles.metaText}>
                          {done
                            ? t('interviewBest').replace('{s}', toFa(set.best_score ?? 0))
                            : t('interviewQuestionCount').replace('{n}', toFa(set.question_count))}
                        </Text>
                      )}
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
                  <View style={[styles.playBtn, done && styles.playBtnDone, isLocked && { backgroundColor: '#FFF1E8', borderColor: '#FCD7C7', borderWidth: 1 }]}>
                    {isLocked ? (
                      <Lock size={14} color={COLORS.primary} />
                    ) : done ? (
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
  container: { flex: 1, backgroundColor: '#FDFBF7', paddingHorizontal: SPACING.l },
  loader: { marginTop: SPACING.xl },
  center: { alignItems: 'center', justifyContent: 'center', gap: SPACING.s, marginTop: SPACING.xl },
  mutedText: { ...TEXT_STYLES.bodyMd, color: '#716B62', textAlign: 'center' },
  linkText: { ...TEXT_STYLES.labelMd, color: '#FF6422', fontFamily: FONT_FAMILY.semiBold },
  list: { gap: 12 },
  filterContainer: { marginTop: 4, marginBottom: 2 },
  filterRow: { flexDirection: 'row-reverse', gap: 8, paddingVertical: 4 },
  filterTab: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: '#F3EFE6',
  },
  filterTabActive: {
    backgroundColor: '#FF6422',
  },
  filterTabText: {
    fontFamily: FONT_FAMILY.medium,
    fontSize: 12,
    color: '#716B62',
  },
  filterTabTextActive: {
    fontFamily: FONT_FAMILY.bold,
    color: '#FFFFFF',
  },
  filterTabSm: {
    paddingHorizontal: 11,
    paddingVertical: 5,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#F0EBE3',
  },
  filterTabSmActive: {
    backgroundColor: '#2563EB',
    borderColor: '#2563EB',
  },
  filterTabSmText: {
    fontFamily: FONT_FAMILY.medium,
    fontSize: 11,
    color: '#716B62',
  },
  filterTabSmTextActive: {
    fontFamily: FONT_FAMILY.bold,
    color: '#FFFFFF',
  },
  sectionRow: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between', marginTop: SPACING.m },
  sectionTitle: { fontFamily: FONT_FAMILY.bold, fontSize: 14, color: '#1A1D26' },
  sectionCount: { fontFamily: FONT_FAMILY.semiBold, fontSize: 11, color: '#FF6422' },
  card: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#F0EBE3',
    padding: 14,
    shadowColor: '#1A1D26',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  cardIcon: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  cardBody: { flex: 1, alignItems: 'flex-end', gap: 3 },
  cardMeta: { flexDirection: 'row-reverse', alignItems: 'center', gap: 6 },
  levelChip: { paddingHorizontal: 7, paddingVertical: 1, borderRadius: 6 },
  levelChipText: { fontFamily: FONT_FAMILY.bold, fontSize: 10 },
  metaText: { fontFamily: FONT_FAMILY.regular, fontSize: 10, color: '#9AA0AC' },
  cardTitle: { fontFamily: FONT_FAMILY.bold, fontSize: 14, color: '#1A1D26', textAlign: 'right' },
  cardDesc: { fontFamily: FONT_FAMILY.regular, fontSize: 11, lineHeight: 18, color: '#716B62', textAlign: 'right' },
  playBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F3EFE6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  playBtnDone: { backgroundColor: 'rgba(217, 119, 6, 0.14)' },
  note: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 16,
    backgroundColor: '#FFF4EE',
    borderWidth: 1,
    borderColor: '#FAD8C7',
  },
  noteText: { flex: 1, fontFamily: FONT_FAMILY.regular, fontSize: 11, color: '#716B62', textAlign: 'right' },
  footer: { paddingTop: SPACING.s },
  cta: {
    height: 54,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: '#FF6422',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#FF6422',
    shadowOpacity: 0.28,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  ctaInner: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  ctaText: { fontFamily: FONT_FAMILY.bold, fontSize: 15, color: '#FFFFFF' },
});
