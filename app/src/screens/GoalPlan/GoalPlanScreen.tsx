import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Briefcase, CalendarDays, Check, ChevronDown, ChevronLeft, ChevronUp, GraduationCap, Headphones, Home, Lock, Mic, PenLine, Pencil, Plane, Play, Target, Trash2, X } from 'lucide-react-native';

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
import { absUrl } from '../../api/config';
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
// چند موقعیت اول فهرست کامل که بدون باز کردنِ کشو دیده می‌شوند.
const SITUATIONS_PREVIEW = 4;

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
  // فهرست کامل موقعیت‌ها جمع است و فقط چند تای اول دیده می‌شود؛ با لمس باز می‌شود.
  const [showAllSituations, setShowAllSituations] = useState(false);

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

  // ---------- برنامه‌ی من (چیدمان «سینما»: زمینه‌ی تیره، عکس صحنه‌ی امروز ستاره‌ی صفحه) ----------
  const f = view.forecast;
  const today = view.situations.find((s) => s.id === view.today_id);
  const nextLabel = f?.next_level ? t(LEVEL_KEY[f.next_level] || 'levelBeginner') : '';
  const goalMeta = GOALS.find((g) => g.id === view.plan.goal) || GOALS[0];
  const goalLabel = t(goalMeta.labelKey);
  const inPlan = view.situations.filter((s) => s.in_plan);
  const openScene = (sceneId?: string) =>
    sceneId && navigation.navigate('Shadowing', { scenarioId: sceneId, returnTo: 'GoalPlan' });
  const todayExtra = view.today_extra;
  const todayExtraMeta = todayExtra ? EXTRA_KINDS.find((k) => k.kind === todayExtra.kind) ?? EXTRA_KINDS[0] : null;

  return (
    <View style={[cine.container, { paddingTop: insets.top + SPACING.s }]}>
      <View style={cine.topBar}>
        <View style={styles.flex1}>
          <Text style={cine.kicker}>{t('goalPlanTitle')}</Text>
          <Text style={cine.goalTitle}>{goalLabel}</Text>
        </View>
        <View style={cine.pill}>
          <CalendarDays size={14} color={CINE.gold} />
          <Text style={cine.pillText}>{f ? t('goalPlanDaysLeft').replace('{n}', num(f.days_left)) : t('goalPlanNoDate')}</Text>
        </View>
        <TouchableOpacity
          style={cine.iconBtn}
          onPress={() => navigation.navigate('Home')}
          activeOpacity={0.8}
          accessibilityLabel={t('close')}
        >
          <X size={20} color={CINE.text} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: SPACING.l, paddingBottom: insets.bottom + SPACING.xl, gap: SPACING.l }}>
        {/* کار امروز: عکس بزرگ صحنه با دکمه‌ی پخش */}
        {today ? (
          <TouchableOpacity
            style={cine.heroCard}
            activeOpacity={0.9}
            onPress={() => {
              track('goal_situation_open', today.id);
              openScene(today.scene_id);
            }}
          >
            <View>
              {today.scene_image_url ? (
                <Image source={{ uri: absUrl(today.scene_image_url) }} style={cine.heroImage} resizeMode="cover" />
              ) : (
                <View style={[cine.heroImage, cine.heroImageEmpty]}>
                  <goalMeta.icon size={44} color={CINE.dim} />
                </View>
              )}
              <View style={cine.heroBadge}>
                <Text style={cine.heroBadgeText}>{t('goalPlanToday')}</Text>
              </View>
              <View style={cine.playFab}>
                <Play size={22} color={CINE.bg} fill={CINE.bg} />
              </View>
            </View>
            <View style={cine.heroBody}>
              <Text style={cine.heroTitle}>{today.title_fa}</Text>
              <Text style={cine.heroSub}>
                {t('goalPlanReadyOf').replace('{a}', num(view.ready)).replace('{b}', num(view.in_plan_count))}
                {' · '}
                {t('goalPlanMinuteOption').replace('{n}', num(view.plan.minutes_per_day))}
              </Text>
            </View>
          </TouchableOpacity>
        ) : (
          view.ready >= view.in_plan_count &&
          view.in_plan_count > 0 && (
            <View style={cine.doneCard}>
              <Check size={22} color={CINE.success} />
              <Text style={[cine.bodyText, styles.flex1]}>{t('goalPlanAllDone')}</Text>
            </View>
          )
        )}

        {/* تمرین دوم امروز */}
        {todayExtra && todayExtraMeta && (
          <TouchableOpacity style={cine.extraToday} activeOpacity={0.85} onPress={() => openExtra(todayExtra)}>
            {todayExtra.image_url ? (
              <Image source={{ uri: absUrl(todayExtra.image_url) }} style={cine.extraTodayImg} />
            ) : (
              <View style={[cine.extraTodayImg, cine.heroImageEmpty]}>
                <todayExtraMeta.icon size={22} color={CINE.dim} />
              </View>
            )}
            <View style={styles.flex1}>
              <Text style={cine.accentLabel}>{t('goalPlanTodayExtra').replace('{kind}', t(todayExtraMeta.labelKey))}</Text>
              <Text style={cine.cardTitle} numberOfLines={2}>{todayExtra.title}</Text>
            </View>
            <todayExtraMeta.icon size={20} color={CINE.accent} />
          </TouchableOpacity>
        )}

        {/* مسیر: هر موقعیت برنامه یک خانه؛ پر = آماده، دور رنگی = امروز */}
        <View style={cine.section}>
          <View style={cine.sectionHead}>
            <Text style={cine.sectionTitle}>{t('goalPlanSituations')}</Text>
            <Text style={cine.sectionMeta}>
              {t('goalPlanReadyOf').replace('{a}', num(view.ready)).replace('{b}', num(view.in_plan_count))}
            </Text>
          </View>
          <View style={cine.strip}>
            {inPlan.map((s, i) => {
              const isToday = s.id === view.today_id;
              const open = s.has_content && !!s.scene_id;
              return (
                <TouchableOpacity
                  key={s.id}
                  style={[cine.stripCell, s.ready && cine.stripDone, isToday && cine.stripToday, !open && cine.stripLocked]}
                  disabled={!open}
                  onPress={() => openScene(s.scene_id)}
                  activeOpacity={0.85}
                  accessibilityLabel={s.title_fa}
                >
                  {s.ready ? (
                    <Check size={14} color={CINE.bg} />
                  ) : (
                    <Text style={[cine.stripText, isToday && { color: CINE.accentText }]}>{num(i + 1)}</Text>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
          {f && (
            <Text style={cine.forecast}>
              {f.situations_target < f.situations_total
                ? t('goalPlanHonestPartial').replace('{n}', num(f.situations_target)).replace('{m}', num(f.situations_total))
                : t('goalPlanHonestAll').replace('{n}', num(f.situations_total))}
              {nextLabel
                ? ' ' +
                  (f.level_reachable
                    ? t('goalPlanLevelReachable').replace('{level}', nextLabel)
                    : t('goalPlanLevelPartial').replace('{level}', nextLabel).replace('{pct}', num(f.level_progress_pct)))
                : ''}
            </Text>
          )}
          {!f && <Text style={cine.forecast}>{t('goalPlanNoDateNote')}</Text>}
        </View>

        {/* شنیدن / صحبت / نوشتن برای هدف: ردیف افقی کارت‌های عکس‌دار */}
        {EXTRA_KINDS.map((k) => {
          const items = (view.extras ?? []).filter((x) => x.kind === k.kind);
          if (items.length === 0) return null;
          return (
            <View key={k.kind} style={cine.section}>
              <Text style={cine.sectionTitle}>{t(k.sectionKey)}</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={cine.rail}>
                {items.map((x) => (
                  <TouchableOpacity key={x.id} style={cine.railCard} activeOpacity={0.85} onPress={() => openExtra(x)}>
                    <View>
                      {x.image_url ? (
                        <Image source={{ uri: absUrl(x.image_url) }} style={cine.railImg} />
                      ) : (
                        <View style={[cine.railImg, cine.heroImageEmpty]}>
                          <k.icon size={26} color={CINE.dim} />
                        </View>
                      )}
                      {x.done && (
                        <View style={cine.doneBadge}>
                          <Check size={12} color={CINE.bg} />
                        </View>
                      )}
                    </View>
                    <Text style={cine.accentLabel}>
                      {t(k.labelKey)}
                      {LEVEL_KEY[x.level] ? ` · ${t(LEVEL_KEY[x.level])}` : ''}
                    </Text>
                    <Text style={cine.cardTitle} numberOfLines={2}>{x.title}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          );
        })}

        {/* همه‌ی موقعیت‌ها، با اسم: کشویی؛ پیش‌فرض فقط چند تای اول */}
        <View style={cine.section}>
          {(showAllSituations ? view.situations : view.situations.slice(0, SITUATIONS_PREVIEW)).map((s, i) => {
            const open = s.has_content && !!s.scene_id;
            const isToday = s.id === view.today_id;
            return (
              <TouchableOpacity
                key={s.id}
                style={[cine.row, isToday && { borderColor: CINE.accent }, !s.in_plan && styles.dimmed]}
                disabled={!open}
                activeOpacity={0.85}
                onPress={() => openScene(s.scene_id)}
              >
                <View style={[cine.rowDot, s.ready && { backgroundColor: CINE.success }, isToday && { backgroundColor: CINE.accent }]}>
                  {s.ready ? (
                    <Check size={13} color={CINE.bg} />
                  ) : !open ? (
                    <Lock size={12} color={CINE.dim} />
                  ) : (
                    <Text style={[cine.rowNum, isToday && { color: CINE.bg }]}>{num(i + 1)}</Text>
                  )}
                </View>
                <View style={styles.flex1}>
                  <Text style={cine.rowTitle}>{s.title_fa}</Text>
                  {!open && <Text style={cine.rowSub}>{t('goalPlanComingSoon')}</Text>}
                  {open && !s.in_plan && <Text style={cine.rowSub}>{t('goalPlanOutOfPlan')}</Text>}
                </View>
                {open && !s.ready && <ChevronLeft size={18} color={isToday ? CINE.accent : CINE.muted} />}
              </TouchableOpacity>
            );
          })}
          {view.situations.length > SITUATIONS_PREVIEW && (
            <TouchableOpacity
              style={cine.moreBtn}
              onPress={() => setShowAllSituations((v) => !v)}
              activeOpacity={0.85}
              accessibilityState={{ expanded: showAllSituations }}
            >
              <Text style={cine.moreText}>
                {showAllSituations
                  ? t('goalPlanShowLess')
                  : t('goalPlanShowAll').replace('{n}', num(view.situations.length - SITUATIONS_PREVIEW))}
              </Text>
              {showAllSituations ? <ChevronUp size={18} color={CINE.accentText} /> : <ChevronDown size={18} color={CINE.accentText} />}
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.actionsRow}>
          <TouchableOpacity style={cine.actionBtn} onPress={() => setEditing(true)} activeOpacity={0.85}>
            <Pencil size={16} color={CINE.text} />
            <Text style={cine.actionText}>{t('goalPlanEdit')}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={cine.actionBtn} onPress={() => setConfirmDelete(true)} activeOpacity={0.85}>
            <Trash2 size={16} color={CINE.accentText} />
            <Text style={[cine.actionText, { color: CINE.accentText }]}>{t('goalPlanDelete')}</Text>
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

// چیدمان «سینما» (docs/design/ui-directions/Cinema.dc.html) با زمینه‌ی روشن؛ فعلاً فقط برای همین صفحه.
const CINE = {
  bg: '#FFFFFF',
  surface: '#F7F5F1',
  border: '#E7E2D9',
  strip: '#EEEAE3',
  text: '#1A1D26',
  muted: '#5F6573',
  dim: '#9AA0AC',
  accent: '#FF7A59',
  // متنِ مرجانی روی سفید با accent خوانا نیست (کنتراست کم)؛ برای نوشته این تیره‌تر.
  accentText: '#C2412D',
  gold: '#C98A12',
  success: '#2E9E6B',
};

const cine = StyleSheet.create({
  container: { flex: 1, backgroundColor: CINE.bg },
  topBar: { flexDirection: 'row', alignItems: 'center', gap: SPACING.s, paddingHorizontal: SPACING.l, paddingBottom: SPACING.m },
  kicker: { ...TEXT_STYLES.labelSm, color: CINE.muted },
  goalTitle: { fontFamily: FONT_FAMILY.bold, fontSize: 24, color: CINE.text },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: CINE.surface,
    borderColor: CINE.border,
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  pillText: { ...TEXT_STYLES.labelSm, color: CINE.text },
  iconBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: CINE.surface,
    borderColor: CINE.border,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroCard: { backgroundColor: CINE.surface, borderRadius: 22, borderWidth: 1, borderColor: CINE.border, overflow: 'hidden' },
  heroImage: { width: '100%', height: 230 },
  heroImageEmpty: { backgroundColor: CINE.strip, alignItems: 'center', justifyContent: 'center' },
  heroBadge: { position: 'absolute', top: 14, right: 14, backgroundColor: CINE.bg, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5 },
  heroBadgeText: { fontFamily: FONT_FAMILY.bold, fontSize: 12, color: CINE.text },
  playFab: {
    position: 'absolute',
    bottom: -26,
    left: 18,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: CINE.accent,
    borderWidth: 4,
    borderColor: CINE.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroBody: { paddingHorizontal: 18, paddingTop: 16, paddingBottom: 18, gap: 4 },
  heroTitle: { fontFamily: FONT_FAMILY.bold, fontSize: 22, lineHeight: 32, color: CINE.text },
  heroSub: { ...TEXT_STYLES.bodyMd, color: CINE.muted },
  doneCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.m,
    backgroundColor: CINE.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: CINE.border,
    padding: SPACING.l,
  },
  bodyText: { ...TEXT_STYLES.bodyMd, color: CINE.text },
  extraToday: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.m,
    backgroundColor: CINE.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: CINE.border,
    padding: 10,
  },
  extraTodayImg: { width: 72, height: 56, borderRadius: 12 },
  accentLabel: { fontFamily: FONT_FAMILY.bold, fontSize: 12, color: CINE.accentText },
  cardTitle: { fontFamily: FONT_FAMILY.medium, fontSize: 14, lineHeight: 22, color: CINE.text },
  section: { gap: SPACING.s },
  sectionHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  sectionTitle: { fontFamily: FONT_FAMILY.bold, fontSize: 16, color: CINE.text },
  sectionMeta: { ...TEXT_STYLES.labelSm, color: CINE.muted },
  strip: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  stripCell: {
    width: 40,
    height: 34,
    borderRadius: 8,
    backgroundColor: CINE.strip,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stripDone: { backgroundColor: CINE.accent },
  stripToday: { backgroundColor: 'transparent', borderWidth: 2, borderColor: CINE.accent },
  stripLocked: { opacity: 0.45 },
  stripText: { fontFamily: FONT_FAMILY.bold, fontSize: 12, color: CINE.dim },
  forecast: { ...TEXT_STYLES.bodyMd, color: CINE.muted, lineHeight: 24 },
  rail: { gap: 12, paddingRight: 2 },
  railCard: { width: 150, gap: 6 },
  railImg: { width: 150, height: 96, borderRadius: 14 },
  doneBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: CINE.success,
    alignItems: 'center',
    justifyContent: 'center',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.m,
    backgroundColor: CINE.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: CINE.border,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  rowDot: { width: 28, height: 28, borderRadius: 14, backgroundColor: CINE.strip, alignItems: 'center', justifyContent: 'center' },
  rowNum: { fontFamily: FONT_FAMILY.bold, fontSize: 12, color: CINE.muted },
  rowTitle: { ...TEXT_STYLES.bodyLg, color: CINE.text },
  rowSub: { ...TEXT_STYLES.labelSm, color: CINE.dim },
  moreBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    minHeight: 44,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: CINE.border,
    borderStyle: 'dashed',
  },
  moreText: { fontFamily: FONT_FAMILY.bold, fontSize: 14, color: CINE.accentText },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 48,
    borderRadius: 14,
    backgroundColor: CINE.surface,
    borderWidth: 1,
    borderColor: CINE.border,
  },
  actionText: { fontFamily: FONT_FAMILY.bold, fontSize: 14, color: CINE.text },
});

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
