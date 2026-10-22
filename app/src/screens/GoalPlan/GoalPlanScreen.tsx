import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Briefcase, Check, Clock, GraduationCap, Home, Lock, Plane, X } from 'lucide-react-native';

import { COLORS, SPACING, BORDER_RADIUS } from '../../theme/colors';
import { FONT_FAMILY, TEXT_STYLES } from '../../theme/typography';
import { SHADOWS } from '../../theme/elevation';
import { useLanguage } from '../../data/i18n';
import { track } from '../../services/analytics';
import { getMyLevel } from '../../api/assessment';
import {
  deleteGoalPlan,
  getGoalPlan,
  saveGoalPlan,
  type GoalId,
  type GoalPlanView,
} from '../../api/goalPlan';

const GOALS: {
  id: GoalId;
  icon: React.ComponentType<{ size?: number; color?: string }>;
  labelKey: string;
  color: string;
  light: string;
}[] = [
  { id: 'travel', icon: Plane, labelKey: 'goalTravel', color: COLORS.info, light: COLORS.infoLight },
  { id: 'migration', icon: Home, labelKey: 'goalMigration', color: COLORS.tertiary, light: COLORS.tertiaryLight },
  { id: 'study', icon: GraduationCap, labelKey: 'goalStudy', color: COLORS.primary, light: COLORS.primaryLight },
  { id: 'work', icon: Briefcase, labelKey: 'goalWork', color: COLORS.warning, light: COLORS.warningLight },
];
// null = تاریخ ندارم
const DATE_CHOICES: (number | null)[] = [1, 2, 3, 6, 12, null];
const MINUTES = [15, 30, 45, 60];
const LEVEL_KEY: Record<string, string> = {
  starter: 'levelStarter',
  beginner: 'levelBeginner',
  intermediate: 'levelIntermediate',
  advanced: 'levelAdvanced',
  proficient: 'levelProficient',
};

const isoInMonths = (months: number) => {
  const d = new Date();
  d.setDate(d.getDate() + months * 30);
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
};

/**
 * «برنامه‌ی من»: پرسش هدف ← تاریخ ← دقیقه در روز، و بعد از ساختن، پیش‌بینی
 * صادقانه و فهرست موقعیت‌های بسته‌ی هدف با وضعیت (آماده / امروز / به‌زودی).
 */
export const GoalPlanScreen: React.FC = () => {
  const { t, language } = useLanguage();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const num = (n: number | string) =>
    language === 'fa' ? String(n).replace(/\d/g, (d) => '۰۱۲۳۴۵۶۷۸۹'[Number(d)]) : String(n);

  const [view, setView] = useState<GoalPlanView | null | undefined>(undefined); // undefined = در حال بارگیری
  const [error, setError] = useState(false);
  const [editing, setEditing] = useState(false);
  const [goal, setGoal] = useState<GoalId | null>(null);
  const [months, setMonths] = useState<number | null | undefined>(undefined);
  const [minutes, setMinutes] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => {
    setError(false);
    getGoalPlan()
      .then(setView)
      .catch(() => setError(true));
  }, []);
  useFocusEffect(load);

  const create = async () => {
    if (!goal || months === undefined || !minutes) return;
    setBusy(true);
    try {
      const lvl = await getMyLevel().catch(() => null);
      const next = await saveGoalPlan({
        goal,
        target_date: months ? isoInMonths(months) : undefined,
        minutes_per_day: minutes,
        start_level: lvl?.scene_level || 'beginner',
      });
      track('goal_plan_created', goal);
      setView(next);
      setEditing(false);
    } catch {
      setError(true);
    } finally {
      setBusy(false);
    }
  };

  const remove = () =>
    Alert.alert(t('goalPlanDeleteTitle'), t('goalPlanDeleteBody'), [
      { text: t('cancel'), style: 'cancel' },
      {
        text: t('goalPlanDelete'),
        style: 'destructive',
        onPress: () => {
          deleteGoalPlan()
            .then(() => {
              setView(null);
              setGoal(null);
              setMonths(undefined);
              setMinutes(null);
            })
            .catch(() => setError(true));
        },
      },
    ]);

  const header = (
    <View style={styles.topRow}>
      <TouchableOpacity style={styles.closeBtn} onPress={() => navigation.goBack()} activeOpacity={0.8}>
        <X size={20} color={COLORS.text} />
      </TouchableOpacity>
    </View>
  );

  if (view === undefined && !error) {
    return (
      <View style={[styles.container, { paddingTop: insets.top + SPACING.s }]}>
        {header}
        <View style={styles.center}>
          <ActivityIndicator color={COLORS.primary} />
        </View>
      </View>
    );
  }

  // ---------- ساختن برنامه ----------
  if (!view || editing) {
    const ready = !!goal && months !== undefined && !!minutes;
    return (
      <View style={[styles.container, { paddingTop: insets.top + SPACING.s }]}>
        {header}
        <ScrollView contentContainerStyle={{ padding: SPACING.l, paddingBottom: insets.bottom + SPACING.xl, gap: SPACING.m }}>
          <Text style={styles.title}>{t('goalPlanTitle')}</Text>
          <Text style={styles.sub}>{t('goalPlanIntro')}</Text>

          <Text style={styles.sectionLabel}>{t('goalPlanPickGoal')}</Text>
          <View style={styles.grid}>
            {GOALS.map((g) => (
              <TouchableOpacity
                key={g.id}
                style={[
                  styles.goalCard,
                  { backgroundColor: g.light, borderColor: goal === g.id ? g.color : 'transparent' },
                ]}
                onPress={() => setGoal(g.id)}
                activeOpacity={0.85}
              >
                <View style={[styles.goalIcon, { backgroundColor: g.color }]}>
                  <g.icon size={22} color={COLORS.white} />
                </View>
                <Text style={styles.goalText}>{t(g.labelKey)}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.sectionLabel}>{t('goalPlanWhen')}</Text>
          <View style={styles.wrap}>
            {DATE_CHOICES.map((m) => (
              <TouchableOpacity
                key={String(m)}
                style={[styles.chip, months === m && styles.selected]}
                onPress={() => setMonths(m)}
                activeOpacity={0.85}
              >
                <Text style={styles.chipText}>
                  {m === null ? t('goalPlanNoDate') : t('goalPlanMonths').replace('{n}', num(m))}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.sectionLabel}>{t('goalPlanMinutes')}</Text>
          <View style={styles.wrap}>
            {MINUTES.map((m) => (
              <TouchableOpacity
                key={m}
                style={[styles.chip, minutes === m && styles.selected]}
                onPress={() => setMinutes(m)}
                activeOpacity={0.85}
              >
                <Text style={styles.chipText}>{t('goalPlanMinuteOption').replace('{n}', num(m))}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {error && <Text style={styles.errorText}>{t('goalPlanLoadError')}</Text>}
          <TouchableOpacity
            style={[styles.primaryBtn, (!ready || busy) && styles.btnDisabled]}
            onPress={create}
            disabled={!ready || busy}
            activeOpacity={0.85}
          >
            {busy ? <ActivityIndicator color={COLORS.white} /> : <Text style={styles.primaryBtnText}>{t('goalPlanCreate')}</Text>}
          </TouchableOpacity>
        </ScrollView>
      </View>
    );
  }

  // ---------- برنامه‌ی من ----------
  const f = view.forecast;
  const today = view.situations.find((s) => s.id === view.today_id);
  const nextLabel = f?.next_level ? t(LEVEL_KEY[f.next_level] || 'levelBeginner') : '';
  const pct = view.in_plan_count > 0 ? Math.round((view.ready / view.in_plan_count) * 100) : 0;
  const goalMeta = GOALS.find((g) => g.id === view.plan.goal) || GOALS[0];
  const goalLabel = t(goalMeta.labelKey);

  return (
    <View style={[styles.container, { paddingTop: insets.top + SPACING.s }]}>
      {header}
      <ScrollView contentContainerStyle={{ padding: SPACING.l, paddingBottom: insets.bottom + SPACING.xl, gap: SPACING.m }}>
        <View style={[styles.banner, { backgroundColor: goalMeta.light }]}>
          <View style={[styles.bannerIcon, { backgroundColor: goalMeta.color }]}>
            <goalMeta.icon size={28} color={COLORS.white} />
          </View>
          <Text style={[styles.title, { color: goalMeta.color }]}>{goalLabel}</Text>
        </View>
        {f ? (
          <Text style={styles.sub}>
            {t('goalPlanDaysLeft').replace('{n}', num(f.days_left))} ·{' '}
            {t('goalPlanMinuteOption').replace('{n}', num(view.plan.minutes_per_day))}
          </Text>
        ) : (
          <Text style={styles.sub}>{t('goalPlanNoDateNote')}</Text>
        )}

        <View style={styles.card}>
          <Text style={styles.cardTitle}>{t('goalPlanReadyOf').replace('{a}', num(view.ready)).replace('{b}', num(view.in_plan_count))}</Text>
          <View style={styles.barTrack}>
            <View style={[styles.barFill, { width: `${pct}%`, backgroundColor: goalMeta.color }]} />
          </View>
          {f && (
            <Text style={styles.honest}>
              {f.situations_target < f.situations_total
                ? t('goalPlanHonestPartial').replace('{n}', num(f.situations_target)).replace('{m}', num(f.situations_total))
                : t('goalPlanHonestAll').replace('{n}', num(f.situations_total))}
              {nextLabel
                ? '\n' +
                  (f.level_reachable
                    ? t('goalPlanLevelReachable').replace('{level}', nextLabel)
                    : t('goalPlanLevelPartial').replace('{level}', nextLabel).replace('{pct}', num(f.level_progress_pct)))
                : ''}
            </Text>
          )}
        </View>

        {today ? (
          <TouchableOpacity
            style={[styles.todayCard, { backgroundColor: goalMeta.color }]}
            activeOpacity={0.85}
            onPress={() => {
              track('goal_situation_open', today.id);
              navigation.navigate('Shadowing', { scenarioId: today.scene_id });
            }}
          >
            <Clock size={22} color={COLORS.white} />
            <View style={{ flex: 1 }}>
              <Text style={styles.todayLabel}>{t('goalPlanToday')}</Text>
              <Text style={styles.todayTitle}>{today.title_fa}</Text>
            </View>
          </TouchableOpacity>
        ) : (
          view.ready >= view.in_plan_count &&
          view.in_plan_count > 0 && <Text style={styles.honest}>{t('goalPlanAllDone')}</Text>
        )}

        <Text style={styles.sectionLabel}>{t('goalPlanSituations')}</Text>
        {view.situations.map((s) => {
          const open = s.has_content && !!s.scene_id;
          return (
            <TouchableOpacity
              key={s.id}
              style={[styles.row, !s.in_plan && { opacity: 0.55 }]}
              disabled={!open}
              activeOpacity={0.85}
              onPress={() => navigation.navigate('Shadowing', { scenarioId: s.scene_id })}
            >
              <View style={[styles.statusDot, s.ready && { backgroundColor: COLORS.success }]}>
                {s.ready ? <Check size={14} color={COLORS.white} /> : !open ? <Lock size={12} color={COLORS.muted} /> : null}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.rowTitle}>{s.title_fa}</Text>
                {!open && <Text style={styles.rowSub}>{t('goalPlanComingSoon')}</Text>}
                {open && !s.in_plan && <Text style={styles.rowSub}>{t('goalPlanOutOfPlan')}</Text>}
              </View>
            </TouchableOpacity>
          );
        })}

        <TouchableOpacity onPress={() => setEditing(true)} activeOpacity={0.8}>
          <Text style={styles.link}>{t('goalPlanEdit')}</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={remove} activeOpacity={0.8}>
          <Text style={[styles.link, { color: COLORS.error }]}>{t('goalPlanDelete')}</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  topRow: { paddingHorizontal: SPACING.l, flexDirection: 'row' },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.surfaceHigh,
    alignItems: 'center',
    justifyContent: 'center',
  },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  title: { ...TEXT_STYLES.headlineSm, color: COLORS.text, fontFamily: FONT_FAMILY.bold, textAlign: 'center' },
  sub: { ...TEXT_STYLES.bodyMd, color: COLORS.textSecondary, textAlign: 'center' },
  sectionLabel: { ...TEXT_STYLES.labelMd, color: COLORS.textSecondary, marginTop: SPACING.s },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.s },
  goalCard: {
    flexBasis: '47%',
    flexGrow: 1,
    alignItems: 'center',
    gap: SPACING.xs,
    paddingVertical: SPACING.l,
    borderRadius: BORDER_RADIUS.l,
    backgroundColor: COLORS.surface,
    borderWidth: 1.5,
    borderColor: COLORS.border,
  },
  goalIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  banner: {
    alignItems: 'center',
    gap: SPACING.s,
    borderRadius: BORDER_RADIUS.l,
    paddingVertical: SPACING.l,
  },
  bannerIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  goalText: { ...TEXT_STYLES.bodyLg, color: COLORS.text, fontFamily: FONT_FAMILY.semiBold },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.s },
  chip: {
    paddingHorizontal: SPACING.m,
    paddingVertical: SPACING.s,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.surface,
    borderWidth: 1.5,
    borderColor: COLORS.border,
  },
  chipText: { ...TEXT_STYLES.bodyMd, color: COLORS.text },
  selected: { borderColor: COLORS.primary, backgroundColor: COLORS.primaryLight },
  primaryBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.l,
    paddingVertical: SPACING.m,
    alignItems: 'center',
    marginTop: SPACING.m,
  },
  btnDisabled: { backgroundColor: COLORS.border },
  primaryBtnText: { color: COLORS.white, fontFamily: FONT_FAMILY.bold, fontSize: 16 },
  errorText: { ...TEXT_STYLES.bodyMd, color: COLORS.error, textAlign: 'center' },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.l,
    padding: SPACING.m,
    gap: SPACING.s,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.level1,
  },
  cardTitle: { ...TEXT_STYLES.bodyLg, color: COLORS.text, fontFamily: FONT_FAMILY.semiBold },
  barTrack: { height: 8, borderRadius: 4, backgroundColor: COLORS.surfaceHigh, overflow: 'hidden' },
  barFill: { height: 8, borderRadius: 4, backgroundColor: COLORS.primary },
  honest: { ...TEXT_STYLES.bodyMd, color: COLORS.textSecondary, lineHeight: 24 },
  todayCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.m,
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.l,
    padding: SPACING.m,
  },
  todayLabel: { ...TEXT_STYLES.labelSm, color: 'rgba(255,255,255,0.8)' },
  todayTitle: { ...TEXT_STYLES.bodyLg, color: COLORS.white, fontFamily: FONT_FAMILY.bold },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.m,
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.l,
    padding: SPACING.m,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  statusDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.surfaceHigh,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowTitle: { ...TEXT_STYLES.bodyLg, color: COLORS.text },
  rowSub: { ...TEXT_STYLES.labelSm, color: COLORS.muted },
  link: { ...TEXT_STYLES.bodyMd, color: COLORS.primary, textAlign: 'center', paddingVertical: SPACING.xs },
});
