import React, { useCallback, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Briefcase, CalendarDays, Check, ChevronLeft, Clock, GraduationCap, Headphones, Home, Lock, Mic, PenLine, Pencil, Plane, Target, Timer, Trash2, X } from 'lucide-react-native';

import { COLORS, SPACING, BORDER_RADIUS, hexToRgba } from '../../theme/colors';
import { FONT_FAMILY, TEXT_STYLES } from '../../theme/typography';
import { SHADOWS } from '../../theme/elevation';
import { useLanguage } from '../../data/i18n';
import { track } from '../../services/analytics';
import { getMyLevel } from '../../api/assessment';
import { ConfirmModal } from '../../components/ConfirmModal';
import {
  deleteGoalPlan,
  getGoalPlan,
  saveGoalPlan,
  type GoalExtra,
  type GoalId,
  type GoalPlanView,
} from '../../api/goalPlan';
import { getSpeakingTopics } from '../../api/topicSpeaking';
import { getWritingPrompts } from '../../api/writing';

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
// تمرین‌های غیرصحنه‌ای هدف، به همین ترتیب زیر موقعیت‌ها نشان داده می‌شوند.
const EXTRA_KINDS: {
  kind: GoalExtra['kind'];
  icon: React.ComponentType<{ size?: number; color?: string }>;
  labelKey: string;
  sectionKey: string;
}[] = [
  { kind: 'podcast', icon: Headphones, labelKey: 'goalPlanKindListen', sectionKey: 'goalPlanListenSection' },
  { kind: 'topic', icon: Mic, labelKey: 'goalPlanKindSpeak', sectionKey: 'goalPlanSpeakSection' },
  { kind: 'writing', icon: PenLine, labelKey: 'goalPlanKindWrite', sectionKey: 'goalPlanWriteSection' },
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

  // پادکست با شناسه باز می‌شود؛ صفحه‌ی صحبت و نوشتن خود موضوع را می‌خواهند، پس از فهرست پیدایش می‌کنیم.
  const openExtra = async (x: GoalExtra) => {
    track('goal_extra_open', `${x.kind}:${x.id}`);
    if (x.kind === 'podcast') navigation.navigate('Podcast', { podcastId: x.id, openedAt: Date.now() });
    else if (x.kind === 'topic') {
      const topic = (await getSpeakingTopics().catch(() => [])).find((it) => it.id === x.id);
      if (topic) navigation.navigate('TopicSpeaking', { topic, openedAt: Date.now() });
    } else {
      const prompt = (await getWritingPrompts().catch(() => [])).find((it) => it.id === x.id);
      if (prompt) navigation.navigate('Writing', { prompt, openedAt: Date.now() });
    }
  };
  const num = (n: number | string) =>
    language === 'fa' ? String(n).replace(/\d/g, (d) => '۰۱۲۳۴۵۶۷۸۹'[Number(d)]) : String(n);

  const [view, setView] = useState<GoalPlanView | null | undefined>(undefined); // undefined = در حال بارگیری
  const [error, setError] = useState(false);
  const [editing, setEditing] = useState(false);
  const [goal, setGoal] = useState<GoalId | null>(null);
  const [months, setMonths] = useState<number | null | undefined>(undefined);
  const [minutes, setMinutes] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

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

  const remove = () => {
    setDeleting(true);
    deleteGoalPlan()
      .then(() => {
        setView(null);
        setGoal(null);
        setMonths(undefined);
        setMinutes(null);
        setConfirmDelete(false);
      })
      .catch(() => setError(true))
      .finally(() => setDeleting(false));
  };

  // «برنامه‌ی من» فقط از خانه باز می‌شود؛ goBack بعد از برگشتن از صحنه (که ناوبری را
  // ریست می‌کند) جایی برای برگشت نداشت یا به صحنه‌ی قبلی می‌رفت.
  const header = (
    <View style={styles.topRow}>
      <TouchableOpacity style={styles.closeBtn} onPress={() => navigation.navigate('Home')} activeOpacity={0.8}>
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
    // رنگ انتخاب‌ها از هدفِ انتخاب‌شده می‌آید تا کل فرم هم‌رنگ هدف شود.
    const pickColor = GOALS.find((g) => g.id === goal)?.color ?? COLORS.primary;
    const selectedStyle = { borderColor: pickColor, backgroundColor: hexToRgba(pickColor, 0.12) };
    const step = (n: number, label: string, done: boolean) => (
      <View style={styles.stepRow}>
        <View style={[styles.stepBadge, { backgroundColor: done ? COLORS.success : pickColor }]}>
          {done ? <Check size={14} color={COLORS.white} /> : <Text style={styles.stepBadgeText}>{num(n)}</Text>}
        </View>
        <Text style={styles.stepLabel}>{label}</Text>
      </View>
    );
    return (
      <View style={[styles.container, { paddingTop: insets.top + SPACING.s }]}>
        {header}
        <ScrollView contentContainerStyle={{ padding: SPACING.l, paddingBottom: insets.bottom + SPACING.xl, gap: SPACING.m }}>
          <View style={[styles.introHero, { backgroundColor: hexToRgba(pickColor, 0.1) }]}>
            <View style={[styles.bannerIcon, { backgroundColor: pickColor }]}>
              <Target size={28} color={COLORS.white} />
            </View>
            <Text style={styles.title}>{t('goalPlanTitle')}</Text>
            <Text style={styles.sub}>{t('goalPlanIntro')}</Text>
          </View>

          {step(1, t('goalPlanPickGoal'), !!goal)}
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

          {step(2, t('goalPlanWhen'), months !== undefined)}
          <View style={styles.wrap}>
            {DATE_CHOICES.map((m) => (
              <TouchableOpacity
                key={String(m)}
                style={[styles.chip, months === m && selectedStyle]}
                onPress={() => setMonths(m)}
                activeOpacity={0.85}
              >
                <Text style={styles.chipText}>
                  {m === null ? t('goalPlanNoDate') : t('goalPlanMonths').replace('{n}', num(m))}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {step(3, t('goalPlanMinutes'), !!minutes)}
          <View style={styles.wrap}>
            {MINUTES.map((m) => (
              <TouchableOpacity
                key={m}
                style={[styles.chip, minutes === m && selectedStyle]}
                onPress={() => setMinutes(m)}
                activeOpacity={0.85}
              >
                <Text style={styles.chipText}>{t('goalPlanMinuteOption').replace('{n}', num(m))}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {error && <Text style={styles.errorText}>{t('goalPlanLoadError')}</Text>}
          <TouchableOpacity
            style={[styles.primaryBtn, { backgroundColor: pickColor }, (!ready || busy) && styles.btnDisabled]}
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
        {/* سربرگ: رنگِ هدف، حلقه‌ی پیشرفت (موقعیت‌های آماده) و دو برچسب زمان. */}
        <View style={[styles.hero, { backgroundColor: goalMeta.color }]}>
          <View style={styles.heroTop}>
            <View style={styles.flex1}>
              <View style={styles.heroIconRow}>
                <View style={styles.heroIcon}>
                  <goalMeta.icon size={22} color={COLORS.white} />
                </View>
                <Text style={styles.heroTitle}>{goalLabel}</Text>
              </View>
              <Text style={styles.heroSub}>
                {t('goalPlanReadyOf').replace('{a}', num(view.ready)).replace('{b}', num(view.in_plan_count))}
              </Text>
            </View>
            <ProgressRing pct={pct} label={`${num(pct)}${language === 'fa' ? '٪' : '%'}`} />
          </View>
          <View style={styles.pills}>
            <View style={styles.pill}>
              <CalendarDays size={14} color={COLORS.white} />
              <Text style={styles.pillText}>
                {f ? t('goalPlanDaysLeft').replace('{n}', num(f.days_left)) : t('goalPlanNoDate')}
              </Text>
            </View>
            <View style={styles.pill}>
              <Timer size={14} color={COLORS.white} />
              <Text style={styles.pillText}>{t('goalPlanMinuteOption').replace('{n}', num(view.plan.minutes_per_day))}</Text>
            </View>
          </View>
        </View>

        {today ? (
          <TouchableOpacity
            style={[styles.todayCard, { borderColor: goalMeta.color, backgroundColor: hexToRgba(goalMeta.color, 0.08) }]}
            activeOpacity={0.85}
            onPress={() => {
              track('goal_situation_open', today.id);
              navigation.navigate('Shadowing', { scenarioId: today.scene_id, returnTo: 'GoalPlan' });
            }}
          >
            <View style={[styles.todayIcon, { backgroundColor: goalMeta.color }]}>
              <Clock size={20} color={COLORS.white} />
            </View>
            <View style={styles.flex1}>
              <Text style={[styles.todayLabel, { color: goalMeta.color }]}>{t('goalPlanToday')}</Text>
              <Text style={styles.todayTitle}>{today.title_fa}</Text>
            </View>
            <ChevronLeft size={20} color={goalMeta.color} />
          </TouchableOpacity>
        ) : (
          view.ready >= view.in_plan_count &&
          view.in_plan_count > 0 && (
            <View style={[styles.doneCard, { backgroundColor: COLORS.successLight }]}>
              <Check size={20} color={COLORS.success} />
              <Text style={[styles.honest, styles.flex1]}>{t('goalPlanAllDone')}</Text>
            </View>
          )
        )}

        {view.today_extra && (() => {
          const x = view.today_extra;
          const meta = EXTRA_KINDS.find((k) => k.kind === x.kind) ?? EXTRA_KINDS[0];
          return (
            <TouchableOpacity
              style={[styles.todayCard, { borderColor: hexToRgba(goalMeta.color, 0.4) }]}
              activeOpacity={0.85}
              onPress={() => openExtra(x)}
            >
              <View style={[styles.todayIcon, { backgroundColor: hexToRgba(goalMeta.color, 0.85) }]}>
                <meta.icon size={20} color={COLORS.white} />
              </View>
              <View style={styles.flex1}>
                <Text style={[styles.todayLabel, { color: goalMeta.color }]}>
                  {t('goalPlanTodayExtra').replace('{kind}', t(meta.labelKey))}
                </Text>
                <Text style={styles.todayTitle}>{x.title}</Text>
              </View>
              <ChevronLeft size={20} color={goalMeta.color} />
            </TouchableOpacity>
          );
        })()}

        {f && (
          <View style={[styles.card, { borderColor: hexToRgba(goalMeta.color, 0.25) }]}>
            <Text style={styles.cardTitle}>🎯 {t('goalPlanForecastTitle')}</Text>
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
          </View>
        )}
        {!f && <Text style={styles.sub}>{t('goalPlanNoDateNote')}</Text>}

        <Text style={styles.sectionLabel}>{t('goalPlanSituations')}</Text>
        {view.situations.map((s, i) => {
          const open = s.has_content && !!s.scene_id;
          const isToday = s.id === view.today_id;
          const tint = s.ready ? COLORS.success : open ? goalMeta.color : COLORS.muted;
          return (
            <TouchableOpacity
              key={s.id}
              style={[
                styles.row,
                { borderColor: isToday ? goalMeta.color : hexToRgba(tint, 0.25) },
                s.ready && { backgroundColor: COLORS.successLight },
                !s.in_plan && styles.dimmed,
              ]}
              disabled={!open}
              activeOpacity={0.85}
              onPress={() => navigation.navigate('Shadowing', { scenarioId: s.scene_id, returnTo: 'GoalPlan' })}
            >
              <View style={[styles.statusDot, { backgroundColor: open || s.ready ? tint : COLORS.surfaceHigh }]}>
                {s.ready ? (
                  <Check size={14} color={COLORS.white} />
                ) : !open ? (
                  <Lock size={12} color={COLORS.muted} />
                ) : (
                  <Text style={styles.stepBadgeText}>{num(i + 1)}</Text>
                )}
              </View>
              <View style={styles.flex1}>
                <Text style={styles.rowTitle}>{s.title_fa}</Text>
                {!open && <Text style={styles.rowSub}>{t('goalPlanComingSoon')}</Text>}
                {open && !s.in_plan && <Text style={styles.rowSub}>{t('goalPlanOutOfPlan')}</Text>}
              </View>
              {open && !s.ready && <ChevronLeft size={18} color={tint} />}
            </TouchableOpacity>
          );
        })}

        {EXTRA_KINDS.map((k) => {
          const items = (view.extras ?? []).filter((x) => x.kind === k.kind);
          if (items.length === 0) return null;
          return (
            <View key={k.kind} style={styles.extraSection}>
              <Text style={styles.sectionLabel}>{t(k.sectionKey)}</Text>
              {items.map((x) => {
                const tint = x.done ? COLORS.success : goalMeta.color;
                return (
                  <TouchableOpacity
                    key={x.id}
                    style={[styles.row, { borderColor: hexToRgba(tint, 0.25) }, x.done && { backgroundColor: COLORS.successLight }]}
                    activeOpacity={0.85}
                    onPress={() => openExtra(x)}
                  >
                    <View style={[styles.statusDot, { backgroundColor: tint }]}>
                      {x.done ? <Check size={14} color={COLORS.white} /> : <k.icon size={14} color={COLORS.white} />}
                    </View>
                    <View style={styles.flex1}>
                      <Text style={styles.rowTitle}>{x.title}</Text>
                      {!!LEVEL_KEY[x.level] && <Text style={styles.rowSub}>{t(LEVEL_KEY[x.level])}</Text>}
                    </View>
                    <ChevronLeft size={18} color={tint} />
                  </TouchableOpacity>
                );
              })}
            </View>
          );
        })}

        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={[styles.actionBtn, { borderColor: goalMeta.color }]}
            onPress={() => setEditing(true)}
            activeOpacity={0.85}
          >
            <Pencil size={16} color={goalMeta.color} />
            <Text style={[styles.actionText, { color: goalMeta.color }]}>{t('goalPlanEdit')}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionBtn, { borderColor: hexToRgba(COLORS.error, 0.4), backgroundColor: COLORS.errorLight }]}
            onPress={() => setConfirmDelete(true)}
            activeOpacity={0.85}
          >
            <Trash2 size={16} color={COLORS.error} />
            <Text style={[styles.actionText, { color: COLORS.error }]}>{t('goalPlanDelete')}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <ConfirmModal
        visible={confirmDelete}
        icon={<Trash2 size={26} color={COLORS.white} />}
        color={COLORS.error}
        title={t('goalPlanDeleteTitle')}
        body={t('goalPlanDeleteBody')}
        confirmLabel={t('goalPlanDelete')}
        cancelLabel={t('cancel')}
        busy={deleting}
        onConfirm={remove}
        onCancel={() => setConfirmDelete(false)}
      />
    </View>
  );
};

/** حلقه‌ی پیشرفتِ دایره‌ای (سفید روی رنگِ هدف). */
const ProgressRing: React.FC<{ pct: number; label: string }> = ({ pct, label }) => {
  const size = 76;
  const stroke = 8;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  return (
    <View style={styles.ring}>
      <Svg width={size} height={size} style={StyleSheet.absoluteFill}>
        <Circle cx={size / 2} cy={size / 2} r={r} stroke={hexToRgba(COLORS.white, 0.25)} strokeWidth={stroke} fill="none" />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={COLORS.white}
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={`${(c * Math.max(0, Math.min(100, pct))) / 100} ${c}`}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
      <Text style={styles.ringText}>{label}</Text>
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
  extraSection: { gap: SPACING.s },
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
    borderWidth: 1.5,
    borderRadius: BORDER_RADIUS.l,
    padding: SPACING.m,
  },
  todayLabel: { ...TEXT_STYLES.labelSm, fontFamily: FONT_FAMILY.semiBold },
  todayTitle: { ...TEXT_STYLES.bodyLg, color: COLORS.text, fontFamily: FONT_FAMILY.bold },
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
  flex1: { flex: 1 },
  dimmed: { opacity: 0.55 },
  introHero: { alignItems: 'center', gap: SPACING.s, borderRadius: BORDER_RADIUS.l, padding: SPACING.l },
  stepRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.s, marginTop: SPACING.s },
  stepBadge: { width: 26, height: 26, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  stepBadgeText: { color: COLORS.white, fontFamily: FONT_FAMILY.bold, fontSize: 12 },
  stepLabel: { ...TEXT_STYLES.bodyLg, color: COLORS.text, fontFamily: FONT_FAMILY.semiBold },
  hero: { borderRadius: BORDER_RADIUS.l, padding: SPACING.l, gap: SPACING.m, ...SHADOWS.level2 },
  heroTop: { flexDirection: 'row', alignItems: 'center', gap: SPACING.m },
  heroIconRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.s },
  heroIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.22)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroTitle: { fontFamily: FONT_FAMILY.bold, fontSize: 22, color: COLORS.white },
  heroSub: { ...TEXT_STYLES.bodyMd, color: 'rgba(255,255,255,0.9)', marginTop: SPACING.s },
  pills: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.s },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: BORDER_RADIUS.full,
    paddingHorizontal: SPACING.m,
    paddingVertical: 6,
  },
  pillText: { ...TEXT_STYLES.labelMd, color: COLORS.white, fontFamily: FONT_FAMILY.semiBold },
  ring: { width: 76, height: 76, alignItems: 'center', justifyContent: 'center' },
  ringText: { fontFamily: FONT_FAMILY.bold, fontSize: 16, color: COLORS.white },
  todayIcon: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  doneCard: { flexDirection: 'row', alignItems: 'center', gap: SPACING.s, borderRadius: BORDER_RADIUS.l, padding: SPACING.m },
  actionsRow: { flexDirection: 'row', gap: SPACING.s, marginTop: SPACING.m },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderWidth: 1.5,
    borderRadius: BORDER_RADIUS.l,
    paddingVertical: 12,
  },
  actionText: { fontFamily: FONT_FAMILY.bold, fontSize: 15 },
});
