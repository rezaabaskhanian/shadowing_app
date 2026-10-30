import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Coins,
  ImageIcon,
  Lightbulb,
  Plus,
  XCircle,
} from 'lucide-react-native';
import { COLORS, BORDER_RADIUS } from '../theme/colors';
import { FONT_FAMILY } from '../theme/typography';
import { useLanguage } from '../data/i18n';
import { listMySceneSubmissions, SceneSubmission } from '../api/submissions';

type StatusFilter = 'all' | SceneSubmission['status'];

const statusMeta = (status: SceneSubmission['status']) => {
  switch (status) {
    case 'approved':
      return { color: COLORS.success, bg: COLORS.successLight, icon: CheckCircle2, key: 'statusApproved' as const };
    case 'rejected':
      return { color: COLORS.error, bg: COLORS.errorLight, icon: XCircle, key: 'statusRejected' as const };
    default:
      return { color: COLORS.warningDeep, bg: COLORS.warningLight, icon: Clock, key: 'statusPending' as const };
  }
};

const FILTERS: { id: StatusFilter; key: string }[] = [
  { id: 'all', key: 'submissionsTabAll' },
  { id: 'pending', key: 'statusPending' },
  { id: 'approved', key: 'statusApproved' },
  { id: 'rejected', key: 'statusRejected' },
];

export const MySubmissionsScreen = () => {
  const navigation = useNavigation<any>();
  const { t, language } = useLanguage();
  const [submissions, setSubmissions] = useState<SceneSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<StatusFilter>('all');

  useFocusEffect(
    useCallback(() => {
      let active = true;
      setLoading(true);
      listMySceneSubmissions()
        .then((list) => active && setSubmissions(list))
        .catch(() => active && setSubmissions([]))
        .finally(() => active && setLoading(false));
      return () => {
        active = false;
      };
    }, [])
  );

  const rtl = language === 'fa';
  const row = rtl && styles.rowReverse;
  const align = rtl && styles.textRight;
  const num = (n: number) => n.toLocaleString(rtl ? 'fa-IR' : 'en-US');

  const countOf = (f: StatusFilter) =>
    f === 'all' ? submissions.length : submissions.filter((s) => s.status === f).length;
  const visible = filter === 'all' ? submissions : submissions.filter((s) => s.status === filter);

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return isNaN(d.getTime()) ? '' : d.toLocaleDateString(rtl ? 'fa-IR' : 'en-US', { dateStyle: 'medium' });
  };

  const goSubmit = () => navigation.navigate('SubmitScene');

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={[styles.topBar, row]}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            {rtl ? <ChevronRight color={COLORS.text} size={22} /> : <ChevronLeft color={COLORS.text} size={22} />}
          </TouchableOpacity>
          <TouchableOpacity style={[styles.ctaBtn, row]} activeOpacity={0.85} onPress={goSubmit}>
            <Plus color={COLORS.white} size={16} />
            <Text style={styles.ctaBtnText}>{t('submissionsNewCta')}</Text>
          </TouchableOpacity>
        </View>

        <View style={[styles.headerRow, row]}>
          <Text style={styles.title}>{t('mySubmissionsTitle')}</Text>
          {!loading && (
            <View style={styles.countChip}>
              <Text style={styles.countChipText}>
                {t('mySubmissionsCount').replace('{n}', num(submissions.length))}
              </Text>
            </View>
          )}
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.tabsScroll}
          contentContainerStyle={[styles.tabs, row]}
        >
          {FILTERS.map((f) => {
            const active = filter === f.id;
            return (
              <TouchableOpacity
                key={f.id}
                style={[styles.tab, active && styles.tabActive]}
                activeOpacity={0.85}
                onPress={() => setFilter(f.id)}
              >
                <Text style={[styles.tabText, active && styles.tabTextActive]}>
                  {t(f.key)} ({num(countOf(f.id))})
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {loading ? (
          <ActivityIndicator color={COLORS.primary} style={{ marginTop: 40 }} />
        ) : submissions.length === 0 ? (
          <View style={styles.emptyCard}>
            <View style={styles.emptyIcon}>
              <Lightbulb color={COLORS.primary} size={30} />
            </View>
            <Text style={styles.emptyTitle}>{t('submissionsEmptyTitle')}</Text>
            <Text style={styles.emptyBody}>{t('submissionsEmptyBody')}</Text>
            <TouchableOpacity style={[styles.emptyBtn, row]} activeOpacity={0.85} onPress={goSubmit}>
              <Lightbulb color={COLORS.white} size={17} />
              <Text style={styles.emptyBtnText}>{t('submissionsEmptyCta')}</Text>
            </TouchableOpacity>
          </View>
        ) : visible.length === 0 ? (
          <Text style={styles.filterEmpty}>{t('submissionsFilterEmpty')}</Text>
        ) : (
          visible.map((s) => {
            const meta = statusMeta(s.status);
            const Icon = meta.icon;
            return (
              <View key={s.id} style={styles.card}>
                <View style={[styles.cardRow, row]}>
                  {s.image_url ? (
                    <Image source={{ uri: s.image_url }} style={styles.thumb} />
                  ) : (
                    <View style={[styles.thumb, styles.thumbEmpty]}>
                      <ImageIcon color={COLORS.muted} size={20} />
                    </View>
                  )}
                  <View style={styles.cardBody}>
                    <Text style={[styles.situationText, align]} numberOfLines={2}>
                      {s.situation_text}
                    </Text>
                    <View style={[styles.metaRow, row]}>
                      <View style={[styles.statusBadge, row, { backgroundColor: meta.bg }]}>
                        <Icon color={meta.color} size={12} />
                        <Text style={[styles.statusText, { color: meta.color }]}>{t(meta.key)}</Text>
                      </View>
                      <Text style={styles.dateText}>{formatDate(s.created_at)}</Text>
                    </View>
                  </View>
                </View>

                {s.status === 'approved' && s.points_awarded ? (
                  <View style={[styles.footer, row]}>
                    <Coins color={COLORS.secondary} size={15} />
                    <Text style={styles.pointsText}>
                      +{num(s.points_awarded)} {t('pointsEarned')}
                    </Text>
                  </View>
                ) : null}
                {s.status === 'rejected' && s.admin_note ? (
                  <View style={styles.footer}>
                    <Text style={[styles.noteText, align]}>{s.admin_note}</Text>
                  </View>
                ) : null}
              </View>
            );
          })
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  rowReverse: { flexDirection: 'row-reverse' },
  textRight: { textAlign: 'right' },
  screen: {
    flex: 1,
    backgroundColor: COLORS.backgroundSoft,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 48,
    paddingBottom: 60,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 18,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.full,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  ctaBtnText: {
    color: COLORS.white,
    fontFamily: FONT_FAMILY.bold,
    fontSize: 12,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  title: {
    color: COLORS.text,
    fontFamily: FONT_FAMILY.bold,
    fontSize: 24,
  },
  countChip: {
    backgroundColor: COLORS.surfaceLight,
    borderRadius: BORDER_RADIUS.full,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  countChipText: {
    color: COLORS.textSecondary,
    fontFamily: FONT_FAMILY.medium,
    fontSize: 11,
  },
  tabsScroll: {
    marginTop: 14,
    marginBottom: 18,
    flexGrow: 0,
  },
  tabs: {
    flexDirection: 'row',
    gap: 8,
    flexGrow: 1,
  },
  tab: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.full,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  tabActive: {
    backgroundColor: COLORS.text,
    borderColor: COLORS.text,
  },
  tabText: {
    color: COLORS.textSecondary,
    fontFamily: FONT_FAMILY.medium,
    fontSize: 12,
  },
  tabTextActive: {
    color: COLORS.white,
  },
  emptyCard: {
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    paddingHorizontal: 20,
    paddingVertical: 28,
  },
  emptyIcon: {
    width: 68,
    height: 68,
    borderRadius: 20,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    color: COLORS.text,
    fontFamily: FONT_FAMILY.bold,
    fontSize: 17,
    textAlign: 'center',
    marginBottom: 8,
  },
  emptyBody: {
    color: COLORS.textSecondary,
    fontFamily: FONT_FAMILY.regular,
    fontSize: 13,
    lineHeight: 22,
    textAlign: 'center',
    marginBottom: 20,
  },
  emptyBtn: {
    alignSelf: 'stretch',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: COLORS.text,
    borderRadius: 14,
    height: 50,
  },
  emptyBtnText: {
    color: COLORS.white,
    fontFamily: FONT_FAMILY.bold,
    fontSize: 14,
  },
  filterEmpty: {
    color: COLORS.muted,
    fontFamily: FONT_FAMILY.regular,
    fontSize: 13,
    textAlign: 'center',
    paddingVertical: 28,
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    padding: 12,
    marginBottom: 10,
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  thumb: {
    width: 56,
    height: 56,
    borderRadius: 14,
    backgroundColor: COLORS.surfaceLight,
  },
  thumbEmpty: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardBody: {
    flex: 1,
  },
  situationText: {
    color: COLORS.text,
    fontFamily: FONT_FAMILY.semiBold,
    fontSize: 14,
    lineHeight: 21,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    marginTop: 6,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: BORDER_RADIUS.full,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  statusText: {
    fontFamily: FONT_FAMILY.semiBold,
    fontSize: 11,
  },
  dateText: {
    color: COLORS.muted,
    fontFamily: FONT_FAMILY.regular,
    fontSize: 11,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
  },
  pointsText: {
    color: COLORS.warningDeep,
    fontFamily: FONT_FAMILY.bold,
    fontSize: 12,
  },
  noteText: {
    flex: 1,
    color: COLORS.textSecondary,
    fontFamily: FONT_FAMILY.regular,
    fontSize: 12,
    lineHeight: 19,
  },
});
