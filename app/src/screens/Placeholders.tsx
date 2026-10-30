import React from 'react';
import {
  Alert,
  FlatList,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import { getPaths } from '../api/path';
import { formatSubscriptionEnd, getSubscriptionStatus, type SubscriptionStatus } from '../api/billing';
import { useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, ArrowRight, Award, CheckCircle2, ChevronLeft, ChevronRight, Flame, HelpCircle, Languages, Lightbulb, Map as MapIcon, Search, Settings, TrendingUp, Trophy, User as UserIcon, X, Zap } from 'lucide-react-native';
import { ProgressRing } from '../components/ProgressRing';
import { SceneListCard, LEVEL_LABEL_KEY } from '../components/SceneListCard';
import { SceneListCardSkeleton } from '../components/SceneListCardSkeleton';
import { StreakInfoModal } from '../components/StreakInfoModal';
import { XpInfoModal } from '../components/XpInfoModal';
import { sceneKeys, useScenes } from '../data/ScenesContext';
import { useVocab, isDue } from '../data/VocabContext';
import { SCENE_CATEGORY_LABEL_KEY, type ScenarioCategory } from '../data/scenarios';
import { COLORS, hexToRgba } from '../theme/colors';
import { FONT_FAMILY } from '../theme/typography';
import { useLanguage } from '../data/i18n';
import { useAuth } from '../data/AuthContext';
import { useToast } from '../data/ToastContext';
import {
  getUserSummary,
  getUserStreak,
  getUserAchievements,
  getWeeklyActivity,
  getSkillsBreakdown,
  getProgressTrend,
  type Achievement,
  type DayActivity,
  type SkillsBreakdown,
  type WeekTrend,
} from '../api/progress';

export { HomeScreen } from './Home';

type CategoryFilter = ScenarioCategory | 'all';
type LevelFilter = string | 'all';

// دسته‌بندی‌های قدیمی متن آزاد بودند؛ «Shop» و «shop » باید یک دسته حساب شوند.
const categoryKey = (c?: string) => (c || '').trim().toLowerCase();

const SceneGap = () => <View style={{ height: 4 }} />;

/** یک ردیف چیپ افقی؛ در فارسی از راست شروع می‌شود. */
const FilterRow: React.FC<{
  rtl: boolean;
  items: { id: string; label: string }[];
  active: string;
  onPick: (id: string) => void;
}> = ({ rtl, items, active, onPick }) => {
  const ref = React.useRef<ScrollView>(null);
  return (
    <ScrollView
      ref={ref}
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.categoryRowWrapper}
      contentContainerStyle={[styles.categoryRow, rtl && styles.rowReverse, styles.filterGrow]}
      onContentSizeChange={() => rtl && ref.current?.scrollToEnd({ animated: false })}
    >
      {items.map((it) => {
        const on = active === it.id;
        return (
          <TouchableOpacity
            key={it.id}
            style={[styles.categoryChip, on && styles.categoryChipActive]}
            onPress={() => onPick(it.id)}
          >
            {on && <View style={styles.chipDot} />}
            <Text style={[styles.categoryChipText, on && styles.categoryChipTextActive]}>{it.label}</Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
};

export const ScenesScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const queryClient = useQueryClient();
  const { scenes, loading } = useScenes();
  const { t, language } = useLanguage();
  const rtl = language === 'fa';
  const [activeCategory, setActiveCategory] = React.useState<CategoryFilter>('all');
  const [activeLevel, setActiveLevel] = React.useState<LevelFilter>('all');
  const [searchQuery, setSearchQuery] = React.useState('');

  // هر بار که این تب باز می‌شود، لیستی که کهنه (بیش از staleTime) شده دوباره
  // گرفته می‌شود؛ وگرنه دسته‌بندی/ترتیبی که ادمین تازه عوض کرده تا بستن اپ
  // دیده نمی‌شد.
  useFocusEffect(
    React.useCallback(() => {
      queryClient.refetchQueries({ queryKey: sceneKeys.list, stale: true });
    }, [queryClient])
  );

  // رسیدن از جای دیگر اپ (مثلاً زدن روی دسته‌ی کارت خانه) با دسته‌ی از پیش
  // انتخاب‌شده.
  const paramCategory: string | undefined = route.params?.category;
  React.useEffect(() => {
    if (paramCategory) {
      setActiveCategory(categoryKey(paramCategory));
      setActiveLevel('all');
      setSearchQuery('');
      // پارامتر مصرف شد؛ پاکش می‌کنیم تا زدن دوباره‌ی همان دسته هم اثر کند.
      navigation.setParams({ category: undefined });
    }
  }, [paramCategory, navigation]);

  // فقط دسته‌هایی که واقعاً صحنه دارند چیپ می‌گیرند، به ترتیب ثابت لیست
  // دسته‌بندی‌ها؛ دسته‌ی قدیمیِ خارج از لیست (تا ادمین اصلاحش کند) آخر می‌آید.
  // موضوع‌ها فقط از صحنه‌های سطحِ انتخاب‌شده ساخته می‌شوند تا چیپی که نتیجه‌ای ندارد دیده نشود.
  const categories: { id: CategoryFilter; label: string }[] = React.useMemo(() => {
    const pool = activeLevel === 'all' ? scenes : scenes.filter((s) => s.level === activeLevel);
    const present = new Set(pool.map((s) => categoryKey(s.category)).filter(Boolean));
    const known = Object.keys(SCENE_CATEGORY_LABEL_KEY).filter((c) => present.has(c));
    const legacy = Array.from(present).filter((c) => !SCENE_CATEGORY_LABEL_KEY[c]);
    return [
      { id: 'all', label: t('all') },
      ...known.map((id) => ({ id, label: t(SCENE_CATEGORY_LABEL_KEY[id]) })),
      ...legacy.map((id) => ({ id, label: id })),
    ];
  }, [scenes, t, activeLevel]);

  // اگر موضوعِ انتخاب‌شده در سطح جدید صحنه‌ای ندارد، فیلتر موضوع برمی‌گردد به «همه».
  React.useEffect(() => {
    if (activeCategory !== 'all' && !categories.some((c) => c.id === activeCategory)) setActiveCategory('all');
  }, [categories, activeCategory]);

  // سطح‌ها هم مثل دسته‌بندی از روی داده‌ی واقعی صحنه‌ها ساخته می‌شوند، ولی
  // ترتیبشان ثابت (مبتدی→متوسط→پیشرفته) است، نه ترتیب برخورد در لیست.
  const levels: { id: LevelFilter; label: string }[] = React.useMemo(() => {
    const present = new Set(scenes.map((s) => s.level).filter(Boolean));
    const ordered = Object.keys(LEVEL_LABEL_KEY).filter((lvl) => present.has(lvl));
    return [
      { id: 'all', label: t('all') },
      ...ordered.map((lvl) => ({ id: lvl, label: t(LEVEL_LABEL_KEY[lvl]) })),
    ];
  }, [scenes, t]);

  const filteredScenes = scenes.filter((scenario) => {
    if (activeCategory !== 'all' && categoryKey(scenario.category) !== activeCategory) return false;
    if (activeLevel !== 'all' && scenario.level !== activeLevel) return false;
    const q = searchQuery.trim().toLowerCase();
    if (q && !scenario.title.toLowerCase().includes(q) && !(scenario.description || '').toLowerCase().includes(q)) {
      return false;
    }
    return true;
  });

  return (
    // FlatList به‌جای ScrollView: با صدها صحنه، ساختن همه‌ی کارت‌ها (هر کدام با عکس) در یک
    // ScrollView باز شدن تب را چند ثانیه کند می‌کرد؛ حالا فقط کارت‌های نزدیک صفحه ساخته می‌شوند.
    <FlatList
      style={styles.screen}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      data={loading ? [] : filteredScenes}
      keyExtractor={(item) => item.id}
      initialNumToRender={6}
      maxToRenderPerBatch={6}
      windowSize={7}
      removeClippedSubviews
      ItemSeparatorComponent={SceneGap}
      ListHeaderComponent={
        <>
          {/* سربرگ یک‌ردیفه: دکمه‌ها چپ، عنوان راست؛ زیرعنوان و تیتر دوم حذف شد تا صحنه‌ها زودتر دیده شوند. */}
          <View style={[styles.topBar, !rtl && styles.rowReverse]}>
            <View style={styles.topBarActions}>
              <TouchableOpacity style={styles.iconButton} onPress={() => navigation.navigate('Profile')}>
                <Settings color={COLORS.text} size={18} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.iconButton} onPress={() => navigation.navigate('CurriculumMap')}>
                <MapIcon color={COLORS.text} size={18} />
              </TouchableOpacity>
            </View>
            <Text style={[styles.topTitle, !rtl && styles.textLeft]}>{t('worlds')}</Text>
          </View>

          <View style={[styles.searchBox, rtl && styles.rowReverse]}>
            <Search color={COLORS.muted} size={17} />
            <TextInput
              style={[styles.searchInput, { textAlign: rtl ? 'right' : 'left' }]}
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder={t('searchScenesPlaceholder')}
              placeholderTextColor={COLORS.muted}
              returnKeyType="search"
            />
            {!!searchQuery && (
              <TouchableOpacity onPress={() => setSearchQuery('')} hitSlop={8}>
                <X color={COLORS.muted} size={16} />
              </TouchableOpacity>
            )}
          </View>

          {/* دو ردیف فیلتر: بالا سطح، زیرش موضوع؛ هر ردیف «همه» دارد و فقط یک انتخاب. */}
          {!loading && levels.length > 2 && (
            <FilterRow
              rtl={rtl}
              items={levels}
              active={activeLevel}
              onPick={(id) => setActiveLevel(id)}
            />
          )}
          {!loading && categories.length > 2 && (
            <FilterRow
              rtl={rtl}
              items={categories}
              active={activeCategory}
              onPick={(id) => setActiveCategory(id as CategoryFilter)}
            />
          )}
        </>
      }
      ListEmptyComponent={
        loading ? (
          <View style={styles.featuredList}>
            {Array.from({ length: 6 }).map((_, i) => (
              <SceneListCardSkeleton key={i} />
            ))}
          </View>
        ) : (
          <Text style={styles.emptyCategoryText}>{t('noScenariosMatch')}</Text>
        )
      }
      renderItem={({ item: scenario }) => (
        <SceneListCard
          title={scenario.title}
          level={scenario.level}
          time={scenario.time}
          imageUri={scenario.imageUri}
          subtitle={
            scenario.category && SCENE_CATEGORY_LABEL_KEY[categoryKey(scenario.category)]
              ? t(SCENE_CATEGORY_LABEL_KEY[categoryKey(scenario.category)])
              : undefined
          }
          isLocked={scenario.isLocked}
          isCompleted={scenario.isCompleted}
          onPress={() => {
            if (scenario.isLocked) {
              navigation.navigate('Paywall');
              return;
            }
            navigation.navigate('Shadowing', { scenarioId: scenario.id, returnTo: 'Scenes' });
          }}
        />
      )}
    />
  );
};

// نام کوتاه هر روز هفته بر اساس Date.getDay() (۰=یکشنبه..۶=شنبه) — چون
// تاریخ‌ها واقعی از بک‌اند می‌آیند، نه ثابت.
const WEEKDAY_LABELS: Record<number, { en: string; fa: string }> = {
  0: { en: 'Sun', fa: 'ج' },
  1: { en: 'Mon', fa: 'ش' },
  2: { en: 'Tue', fa: 'ی' },
  3: { en: 'Wed', fa: 'د' },
  4: { en: 'Thu', fa: 'س' },
  5: { en: 'Fri', fa: 'چ' },
  6: { en: 'Sat', fa: 'پ' },
};

const SKILL_COLORS: Record<'pronunciation' | 'fluency' | 'vocabulary' | 'grammar', string> = {
  pronunciation: COLORS.primary,
  fluency: COLORS.tertiary,
  vocabulary: COLORS.info,
  grammar: COLORS.audioMine,
};

export const ProgressScreen = () => {
  const { t, language } = useLanguage();
  const rtl = language === 'fa';
  // در فارسی همه‌ی عددهای این صفحه با رقم فارسی و «٪» فارسی نوشته می‌شوند.
  const num = (n: number | string) => (rtl ? String(n).replace(/\d/g, (d) => '۰۱۲۳۴۵۶۷۸۹'[Number(d)]) : String(n));
  const pct = (n: number) => (rtl ? `${num(n)}٪` : `${n}%`);
  const navigation = useNavigation<any>();
  // «ادامه‌ی یادگیری»: اگر مسیری شروع شده، جلسه‌ی بعدی همان؛ وگرنه لیست صحنه‌ها.
  const [startedPathLevel, setStartedPathLevel] = React.useState<string | null>(null);
  const { user } = useAuth();
  const [overallProgress, setOverallProgress] = React.useState(0);
  const [streak, setStreak] = React.useState(0);
  const [streakFreezes, setStreakFreezes] = React.useState<number | undefined>(undefined);
  const [streakInfoVisible, setStreakInfoVisible] = React.useState(false);
  const [xpInfoVisible, setXpInfoVisible] = React.useState(false);
  const [totalXP, setTotalXP] = React.useState(0);
  const [levelName, setLevelName] = React.useState('');
  const [achievements, setAchievements] = React.useState<Achievement[]>([]);
  const [weeklyActivity, setWeeklyActivity] = React.useState<DayActivity[]>([]);
  const [skills, setSkills] = React.useState<SkillsBreakdown>({ pronunciation: 0, fluency: 0, vocabulary: 0, grammar: 0 });
  const [trend, setTrend] = React.useState<WeekTrend[]>([]);

  useFocusEffect(
    React.useCallback(() => {
      if (!user?.id) return;
      let active = true;
      getUserSummary(user.id)
        .then((s) => {
          if (!active) return;
          setOverallProgress(s.overall_progress);
          setStreak(s.streak);
          setTotalXP(s.total_xp);
          setLevelName(s.level_name);
        })
        .catch(() => {});
      getUserStreak(user.id)
        .then((s) => active && setStreakFreezes(s.freezes))
        .catch(() => {});
      getUserAchievements(user.id)
        .then((list) => active && setAchievements(list))
        .catch(() => {});
      getWeeklyActivity()
        .then((days) => active && setWeeklyActivity(days))
        .catch(() => {});
      getSkillsBreakdown()
        .then((s) => active && setSkills(s))
        .catch(() => {});
      getProgressTrend()
        .then((weeks) => active && setTrend(weeks))
        .catch(() => {});
      getPaths()
        .then((list) => active && setStartedPathLevel(list.find((p) => p.started)?.level ?? null))
        .catch(() => {});
      return () => {
        active = false;
      };
    }, [user?.id])
  );

  const skillItems: { key: 'pronunciation' | 'fluency' | 'vocabulary' | 'grammar'; percent: number; color: string }[] = [
    { key: 'pronunciation', percent: skills.pronunciation, color: SKILL_COLORS.pronunciation },
    { key: 'fluency', percent: skills.fluency, color: SKILL_COLORS.fluency },
    { key: 'vocabulary', percent: skills.vocabulary, color: SKILL_COLORS.vocabulary },
    { key: 'grammar', percent: skills.grammar, color: SKILL_COLORS.grammar },
  ];
  const weeklyActivityMax = Math.max(1, ...weeklyActivity.map((d) => d.minutes));
  const todayStr = new Date().toISOString().slice(0, 10);
  const trendHasData = trend.some((w) => w.sessions > 0);

  // پیشنهاد عملی بر اساس ضعیف‌ترین مهارت گفتاری واقعیِ کاربر (فقط وقتی داده دارد).
  const weakest =
    skills.pronunciation > 0 || skills.fluency > 0
      ? skills.pronunciation <= skills.fluency
        ? { key: 'pronunciation', pct: skills.pronunciation }
        : { key: 'fluency', pct: skills.fluency }
      : null;
  const tipKey = weakest && weakest.pct < 70 ? (weakest.key === 'pronunciation' ? 'progressTipPronunciation' : 'progressTipFluency') : null;

  const continueLearning = () =>
    startedPathLevel ? navigation.navigate('PathHome', { level: startedPathLevel }) : navigation.navigate('Scenes');

  // نوار روزهای هفته‌ی جاری (شنبه تا جمعه): روز با فعالیت تیک سبز، امروز حلقه‌ی نارنجی، آینده خط تیره.
  const minutesByDate = new Map(weeklyActivity.map((d) => [d.date, d.minutes]));
  const today = new Date();
  const weekStart = new Date(today);
  weekStart.setDate(today.getDate() - ((today.getDay() + 1) % 7)); // شنبه
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(weekStart.getDate() + i);
    const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    return { iso, weekday: d.getDay(), future: d > today && iso !== todayStr, active: (minutesByDate.get(iso) || 0) > 0 };
  });
    // رشد: آخرین هفته‌ی دارای داده نسبت به هفته‌ی دارای داده‌ی قبلی.
  const trendWithData = trend.filter((w) => w.sessions > 0);
  const growth =
    trendWithData.length >= 2
      ? trendWithData[trendWithData.length - 1].speaking - trendWithData[trendWithData.length - 2].speaking
      : 0;
  const row = rtl ? styles.rowReverse : null;
  const ta = rtl ? styles.textRight : styles.textLeft;

  return (
    <View style={styles.screen}>
    <ScrollView style={styles.screen} contentContainerStyle={[styles.scrollContent, styles.scrollWithCta]} showsVerticalScrollIndicator={false}>
      <View style={styles.heroHeader}>
        <View style={styles.heroIcon}>
          <Trophy size={26} color={COLORS.primary} />
        </View>
        <Text style={styles.heroTitle}>{t('greatJobTitle')}</Text>
        <Text style={styles.heroSub}>{t('greatJobSub')}</Text>
      </View>

      {/* Streak/Level/XP — لمس بج استریک و بج XP توضیح می‌دهد از کجا می‌آیند. */}
      <View style={[styles.statsCard, row]}>
        {/* استریک صفر پیام موفقیت را ضعیف می‌کرد؛ فقط وقتی بیشتر از صفر است دیده می‌شود. */}
        {streak > 0 && (
          <>
            <TouchableOpacity style={styles.statsTile} onPress={() => setStreakInfoVisible(true)}>
              <View style={[styles.statsIcon, { backgroundColor: '#FFF4DE' }]}>
                <Flame size={18} color={COLORS.secondary} fill={COLORS.secondary} />
              </View>
              <Text style={styles.statsValue}>{num(streak)}</Text>
              <Text style={styles.statsLabel}>{t('statsStreakLabel')}</Text>
            </TouchableOpacity>
            <View style={styles.statsDivider} />
          </>
        )}
        <TouchableOpacity style={styles.statsTile} onPress={() => setXpInfoVisible(true)}>
          <View style={[styles.statsIcon, { backgroundColor: '#E6F6EE' }]}>
            <Zap size={18} color={COLORS.tertiary} />
          </View>
          <Text style={styles.statsValue}>{num(totalXP)}</Text>
          <Text style={styles.statsLabel}>{t('statsXPLabel')}</Text>
        </TouchableOpacity>
        <View style={styles.statsDivider} />
        <View style={styles.statsTile}>
          <View style={[styles.statsIcon, { backgroundColor: '#FFF0E8' }]}>
            <Award size={18} color={COLORS.primary} />
          </View>
          <Text style={styles.statsValue} numberOfLines={1}>
            {levelName || '—'}
          </Text>
          <Text style={styles.statsLabel}>{t('statsLevelLabel')}</Text>
        </View>
      </View>

      <StreakInfoModal
        visible={streakInfoVisible}
        onClose={() => setStreakInfoVisible(false)}
        streak={streak}
        freezes={streakFreezes}
      />
      <XpInfoModal
        visible={xpInfoVisible}
        onClose={() => setXpInfoVisible(false)}
        totalXP={totalXP}
        levelName={levelName}
      />

      <View style={styles.scoreCard}>
        <ProgressRing percent={overallProgress} size={150} strokeWidth={10} color={COLORS.primary} trackColor="#EEF0F4">
          <Text style={styles.scoreValue}>{num(overallProgress)}</Text>
          <Text style={styles.scoreLabel}>{t('overallScore')}</Text>
        </ProgressRing>
        <View style={styles.scoreDivider} />
        <View style={[styles.scoreRow, row]}>
          <View style={styles.scoreMetric}>
            <Text style={[styles.metricValue, { color: COLORS.tertiary }]}>{pct(skills.fluency)}</Text>
            <Text style={styles.metricLabel}>{t('fluency')}</Text>
          </View>
          <View style={styles.scoreMetric}>
            <Text style={[styles.metricValue, { color: COLORS.primary }]}>{pct(skills.pronunciation)}</Text>
            <Text style={styles.metricLabel}>{t('pronunciation')}</Text>
          </View>
        </View>
        {!!tipKey && (
          <View style={[styles.tipBox, row]}>
            <View style={styles.tipIcon}>
              <Lightbulb size={16} color={COLORS.secondary} />
            </View>
            <Text style={[styles.progressTip, ta]}>{t(tipKey)}</Text>
          </View>
        )}
      </View>

      {/* Weekly Activity */}
      <View style={styles.settingCard}>
        <View style={[styles.cardHeadRow, row]}>
          <View style={[styles.titleWithDot, row]}>
            <View style={styles.titleDot} />
            <Text style={styles.settingCardTitle}>{t('weeklyActivity')}</Text>
          </View>
          <Text style={styles.cardHeadMeta}>{t('last7Days')}</Text>
        </View>
        <Text style={[styles.optionSub, ta]}>{t('weeklyActivitySub')}</Text>

        <View style={[styles.weekChartRow, row]}>
          {weeklyActivity.map((day) => {
            const heightPct = Math.max(12, (day.minutes / weeklyActivityMax) * 100);
            const isToday = day.date === todayStr;
            const weekday = new Date(day.date + 'T00:00:00').getDay();
            const label = WEEKDAY_LABELS[weekday] || WEEKDAY_LABELS[0];
            return (
              <View key={day.date} style={styles.weekBarCol}>
                <View style={styles.weekBarTrack}>
                  <View
                    style={[
                      styles.weekBarFill,
                      { height: `${heightPct}%`, backgroundColor: day.minutes > 0 ? '#D95D39' : '#EEF0F4' },
                    ]}
                  />
                </View>
                <Text style={[styles.weekBarLabel, isToday && styles.weekBarLabelActive]}>
                  {language === 'fa' ? label.fa : label.en}
                </Text>
              </View>
            );
          })}
        </View>
      </View>

      {/* روزهای هفته‌ی جاری */}
      <View style={[styles.weekStrip, row]}>
        {weekDays.map((d) => {
          const isToday = d.iso === todayStr;
          const label = WEEKDAY_LABELS[d.weekday] || WEEKDAY_LABELS[0];
          return (
            <View key={d.iso} style={styles.weekStripCol}>
              <Text style={[styles.weekStripLabel, isToday && styles.weekBarLabelActive]}>
                {language === 'fa' ? label.fa : label.en}
              </Text>
              <View
                style={[
                  styles.weekStripDot,
                  d.active && styles.weekStripDotDone,
                  isToday && styles.weekStripDotToday,
                ]}
              >
                {isToday ? (
                  <View style={styles.weekStripTodayInner} />
                ) : d.active ? (
                  <Check size={14} color={COLORS.tertiary} strokeWidth={3} />
                ) : (
                  <Text style={styles.weekStripDash}>–</Text>
                )}
              </View>
            </View>
          );
        })}
      </View>

      {/* Progress Over Time */}
      <View style={styles.settingCard}>
        <View style={[styles.cardHeadRow, row]}>
          <View style={[styles.titleWithDot, row]}>
            <View style={[styles.cardIcon, { backgroundColor: '#E6F6EE' }]}>
              <TrendingUp color={COLORS.tertiary} size={16} />
            </View>
            <Text style={styles.settingCardTitle}>{t('progressTrend')}</Text>
          </View>
          {growth > 0 && (
            <View style={styles.growthChip}>
              <Text style={styles.growthChipText}>{t('progressGrowth').replace('{n}', num(growth))}</Text>
            </View>
          )}
        </View>
        <Text style={[styles.optionSub, ta]}>{t('progressTrendSub')}</Text>

        {trendHasData ? (
          <View style={[styles.weekChartRow, styles.trendChartRow, row]}>
            {trend.map((week, i) => {
              const heightPct = Math.max(8, week.speaking);
              const hasData = week.sessions > 0;
              const isLast = i === trend.length - 1;
              const d = new Date(week.week_start + 'T00:00:00');
              const label = num(`${d.getMonth() + 1}/${d.getDate()}`);
              return (
                <View key={week.week_start} style={styles.weekBarCol}>
                  <View style={[styles.weekBarTrack, styles.trendBarTrack]}>
                    <View
                      style={[
                        styles.weekBarFill,
                        {
                          height: `${heightPct}%`,
                          backgroundColor: !hasData ? '#D9DCE3' : isLast ? '#D95D39' : '#5BB8A4',
                        },
                      ]}
                    />
                  </View>
                  <Text style={[styles.weekBarLabel, isLast && styles.weekBarLabelActive]}>{label}</Text>
                </View>
              );
            })}
          </View>
        ) : (
          <Text style={[styles.optionSub, ta]}>{t('progressTrendEmpty')}</Text>
        )}
      </View>

      {/* Skill Breakdown */}
      <View style={styles.settingCard}>
        <View style={[styles.sectionHeaderRow, row]}>
          <View style={[styles.cardIcon, { backgroundColor: '#E6F6EE' }]}>
            <CheckCircle2 color={COLORS.tertiary} size={16} />
          </View>
          <Text style={styles.settingCardTitle}>{t('skillBreakdown')}</Text>
        </View>

        {skillItems.map((skill) => (
          <View key={skill.key} style={styles.skillRow}>
            <View style={[styles.skillLabelRow, row]}>
              <Text style={styles.skillLabel}>{t(skill.key)}</Text>
              <Text style={styles.skillPercent}>{pct(skill.percent)}</Text>
            </View>
            <View style={[styles.skillTrack, row]}>
              <View style={[styles.skillFill, { width: `${skill.percent}%`, backgroundColor: skill.color }]} />
            </View>
          </View>
        ))}
      </View>

      {/* Achievements */}
      <View style={[styles.settingCard, { marginBottom: 20 }]}>
        <View style={[styles.sectionHeaderRow, row]}>
          <View style={[styles.cardIcon, { backgroundColor: '#FFF6E0' }]}>
            <Award color={COLORS.secondary} size={16} />
          </View>
          <Text style={styles.settingCardTitle}>{t('achievementsTitle')}</Text>
        </View>

        {achievements.length === 0 ? (
          <Text style={[styles.optionSub, ta]}>{t('achievementsEmpty')}</Text>
        ) : (
          <View style={styles.achievementList}>
            {achievements.map((a) => (
              <View key={a.id} style={[styles.achievementCard, row]}>
                <View style={styles.achievementBadge}>
                  <Text style={{ fontSize: 20 }}>{a.icon || '🏆'}</Text>
                </View>
                <View style={[styles.flex1, rtl ? styles.alignEnd : styles.alignStart]}>
                  <Text style={[styles.achievementTitle, ta]}>{a.name}</Text>
                  <Text style={[styles.achievementSub, ta]}>{a.description}</Text>
                </View>
                <View style={styles.doneChip}>
                  <Text style={styles.doneChipText}>{t('achievementDone')}</Text>
                </View>
              </View>
            ))}
          </View>
        )}
      </View>
    </ScrollView>
    {/* اقدام اصلی صفحه، بالای نوار پایین: صفحه‌ی نتیجه باید به قدم بعدی ببرد. */}
    <View style={styles.ctaFloat} pointerEvents="box-none">
      <TouchableOpacity style={[styles.ctaBtn, row]} onPress={continueLearning} activeOpacity={0.88}>
        <Text style={styles.ctaText}>{t('continueLearning')}</Text>
        {rtl ? <ArrowLeft size={18} color={COLORS.white} /> : <ArrowRight size={18} color={COLORS.white} />}
      </TouchableOpacity>
    </View>
    </View>
  );
};

import {
  useNotifications,
  ReminderTime,
  ContentSource,
  MAX_REMINDER_TIMES,
} from '../data/NotificationContext';
import { Switch } from 'react-native';
import { Bell, BookOpen, Check, Clock, Crown, MessageSquare, Mic, Pencil, Plus, Repeat, Sparkles } from 'lucide-react-native';
import { usePracticeSettings, REPEAT_OPTIONS, HIGHLIGHT_COLOR_OPTIONS } from '../data/PracticeSettingsContext';

/**
 * TimePickerModal انتخاب ساعت دلخواه برای یادآوری روزانه. عمداً با ScrollView
 * ساده نوشته شده (نه @react-native-community/datetimepicker) تا وابستگی نیتیو
 * جدید و rebuild لازم نشود. دقیقه‌ها با گام ۵ دقیقه‌ای‌اند.
 */
const HOUR_OPTIONS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));
const MINUTE_OPTIONS = Array.from({ length: 12 }, (_, i) => String(i * 5).padStart(2, '0'));

const TimePickerModal: React.FC<{
  visible: boolean;
  onCancel: () => void;
  onConfirm: (time: ReminderTime) => void;
}> = ({ visible, onCancel, onConfirm }) => {
  const { t } = useLanguage();
  const [hour, setHour] = React.useState('20');
  const [minute, setMinute] = React.useState('00');

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={styles.timeModalBackdrop}>
        <View style={styles.timeModalCard}>
          <Text style={styles.timeModalTitle}>{t('pickReminderTime')}</Text>
          <Text style={styles.timeModalPreview}>{`${hour}:${minute}`}</Text>

          <View style={styles.timeColumnRow}>
            <View style={styles.timeColumn}>
              <Text style={styles.subOptionLabel}>{t('hour')}</Text>
              <ScrollView style={styles.timeColumnScroll} showsVerticalScrollIndicator={false}>
                {HOUR_OPTIONS.map((h) => (
                  <TouchableOpacity
                    key={h}
                    style={[styles.timeCell, hour === h && styles.timeCellActive]}
                    onPress={() => setHour(h)}
                  >
                    <Text style={[styles.pillText, hour === h && styles.pillTextActive]}>{h}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            <View style={styles.timeColumn}>
              <Text style={styles.subOptionLabel}>{t('minute')}</Text>
              <ScrollView style={styles.timeColumnScroll} showsVerticalScrollIndicator={false}>
                {MINUTE_OPTIONS.map((m) => (
                  <TouchableOpacity
                    key={m}
                    style={[styles.timeCell, minute === m && styles.timeCellActive]}
                    onPress={() => setMinute(m)}
                  >
                    <Text style={[styles.pillText, minute === m && styles.pillTextActive]}>{m}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>

          <View style={styles.timeModalActions}>
            <TouchableOpacity style={[styles.pillBtn]} onPress={onCancel}>
              <Text style={styles.pillText}>{t('cancel')}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.pillBtn, styles.pillBtnActive]}
              onPress={() => onConfirm(`${hour}:${minute}`)}
            >
              <Text style={[styles.pillText, styles.pillTextActive]}>{t('addReminderTime')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const displayName = (name: string) => name.replace(/\b[a-z]/g, (c) => c.toUpperCase());

export const ProfileScreen = () => {
  const navigation = useNavigation<any>();
  const { language, setLanguage, t } = useLanguage();
  const { user } = useAuth();
  const {
    studyReminderEnabled,
    setStudyReminderEnabled,
    studyReminderTimes,
    addStudyReminderTime,
    removeStudyReminderTime,
    contentNotificationEnabled,
    setContentNotificationEnabled,
    contentSource,
    setContentSource,
    triggerTestNotification,
  } = useNotifications();
  const { repeatsPerStep, setRepeatsPerStep, highlightColor, setHighlightColor } = usePracticeSettings();
  const toast = useToast();
  const [timePickerOpen, setTimePickerOpen] = React.useState(false);

  // ساعتِ انتخاب‌شده در مودال اضافه می‌شود؛ اگر تکراری بود یا به سقف رسیده
  // بودیم، به‌جای اضافه‌کردنِ بی‌صدا به کاربر پیام می‌دهیم.
  const handleAddReminderTime = (time: ReminderTime) => {
    setTimePickerOpen(false);
    if (studyReminderTimes.includes(time)) {
      toast.info(t('reminderTimeDuplicate'));
      return;
    }
    if (!addStudyReminderTime(time)) {
      toast.warning(t('reminderTimeLimitReached'));
    }
  };
  const { box } = useVocab();
  const { scenes } = useScenes();
  // سطح کاربر برای برچسب زیر اسم.
  const [levelName, setLevelName] = React.useState('');
  const [subscription, setSubscription] = React.useState<SubscriptionStatus | null>(null);
  useFocusEffect(
    React.useCallback(() => {
      if (!user?.id) return;
      let active = true;
      getUserSummary(user.id)
        .then((sum) => active && setLevelName(sum.level_name))
        .catch(() => {});
      getSubscriptionStatus()
        .then((s) => active && setSubscription(s))
        .catch(() => {});
      return () => {
        active = false;
      };
    }, [user?.id])
  );

  // یه آیتم واقعی (کلمه‌ی سررسیده‌ی جعبه‌ی لایتنر یا جمله‌ی یکی از صحنه‌ها)
  // انتخاب می‌کند تا دکمه‌ی «ارسال نوتیفیکیشن آزمایشی» دقیقاً همون چیزی که
  // نوتیف واقعی نشون می‌ده رو پیش‌نمایش بده، نه یه نمونه‌ی ثابت.
  const handleSendTestNotification = () => {
    const source = contentSource;
    let type: 'leitner' | 'sentence' =
      source === 'leitner' ? 'leitner' : source === 'sentences' ? 'sentence' : Math.random() > 0.5 ? 'leitner' : 'sentence';

    const sentencePool = scenes.flatMap((s) =>
      (s.hotspots || [])
        .filter((h) => h.dialogue && h.translation)
        .map((h) => ({ text: h.dialogue, translation: h.translation, scene: s.title }))
    );

    if (type === 'leitner' && box.length === 0) type = 'sentence';
    if (type === 'sentence' && sentencePool.length === 0) type = 'leitner';

    if (type === 'leitner' && box.length === 0) {
      Alert.alert(t('noContentForTestNotification'));
      return;
    }
    if (type === 'sentence' && sentencePool.length === 0) {
      Alert.alert(t('noContentForTestNotification'));
      return;
    }

    if (type === 'leitner') {
      const dueWords = box.filter(isDue);
      const word = (dueWords.length > 0 ? dueWords : box)[Math.floor(Math.random() * (dueWords.length > 0 ? dueWords.length : box.length))];
      triggerTestNotification({
        id: Date.now().toString(),
        type: 'leitner',
        title: `📚 Leitner Word Review (Level ${word.level})`,
        body: word.word,
        translation: word.meaning,
        sourceLabel: 'Leitner Box',
      });
    } else {
      const sentence = sentencePool[Math.floor(Math.random() * sentencePool.length)];
      triggerTestNotification({
        id: Date.now().toString(),
        type: 'sentence',
        title: `🎙 Lesson Shadowing (${sentence.scene})`,
        body: `"${sentence.text}"`,
        translation: sentence.translation,
        sourceLabel: 'Lesson Scenario',
      });
    }
  };

  const rtl = language === 'fa';
  const row = rtl ? styles.rowReverse : null;
  const ta = rtl ? styles.textRight : styles.textLeft;
  const Chevron = rtl ? ChevronLeft : ChevronRight;
  // دکمه‌ی چرخ‌دنده‌ی سربرگ به بخش تنظیمات تمرین پایین صفحه می‌پرد.
  const scrollRef = React.useRef<ScrollView>(null);
  const [settingsY, setSettingsY] = React.useState(0);

  const menuRow = (opts: {
    key: string;
    icon: React.ReactNode;
    iconBg: string;
    title: string;
    sub: string;
    onPress: () => void;
    tag?: string;
    dev?: boolean;
  }) => (
    <TouchableOpacity
      key={opts.key}
      style={[styles.pointsCard, row, opts.dev && styles.pointsCardDev]}
      onPress={opts.onPress}
      activeOpacity={0.85}
    >
      <View style={[styles.pointsIconWrap, { backgroundColor: opts.iconBg }]}>{opts.icon}</View>
      <View style={[styles.flex1, rtl ? styles.alignEnd : styles.alignStart]}>
        <View style={[styles.menuTitleRow, row]}>
          <Text style={styles.pointsValue}>{opts.title}</Text>
          {!!opts.tag && (
            <View style={styles.menuTag}>
              <Text style={styles.menuTagText}>{opts.tag}</Text>
            </View>
          )}
        </View>
        <Text style={[styles.pointsSub, ta]} numberOfLines={1}>
          {opts.sub}
        </Text>
      </View>
      <Chevron color={COLORS.muted} size={18} />
    </TouchableOpacity>
  );

  return (
    <ScrollView ref={scrollRef} style={styles.screen} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
      <View style={[styles.pageHeadRow, row]}>
        <View style={rtl ? styles.alignEnd : styles.alignStart}>
          <Text style={[styles.pageTitle, ta]}>{t('profileTitle')}</Text>
          <Text style={[styles.pageSubTight, ta]}>{t('profileSub')}</Text>
        </View>
        <TouchableOpacity
          style={styles.iconButton}
          onPress={() => scrollRef.current?.scrollTo({ y: settingsY, animated: true })}
        >
          <Settings color={COLORS.text} size={18} />
        </TouchableOpacity>
      </View>

      <View style={styles.profileHeader}>
        <View style={styles.avatarCircle}>
          <UserIcon size={34} color={COLORS.primary} />
          <View style={styles.avatarCheck}>
            <Check size={11} color={COLORS.white} strokeWidth={3} />
          </View>
        </View>
        {/* فقط نمایش: حرف اول هر بخش اسم لاتین بزرگ؛ اسم ذخیره‌شده دست نمی‌خورد. */}
        <Text style={styles.profileName}>{displayName(user?.nickname || '')}</Text>
        <Text style={styles.profileSub}>{user?.phone || t('learnerLevel')}</Text>
        {!!levelName && (
          <View style={styles.levelChip}>
            <Text style={styles.levelChipText}>{t('profileLevelChip').replace('{level}', levelName)}</Text>
          </View>
        )}
      </View>

      {/* زبان اپ در یک ردیف جمع‌وجور: آیکون و برچسب، و کلید دوگزینه‌ای. */}
      <View style={[styles.settingCard, styles.langCardRow, row]}>
        <View style={[styles.langLabelGroup, row]}>
          <View style={[styles.pointsIconWrapSm, { backgroundColor: '#EEF2FF' }]}>
            <Languages size={16} color="#5B6CF0" />
          </View>
          <Text style={[styles.settingLabel, styles.langLabelInline]}>{t('appLanguage')}</Text>
        </View>
        <View style={[styles.langToggleRow, styles.langToggleCompact]}>
          <TouchableOpacity
            style={[styles.langBtn, language === 'en' ? styles.langBtnActive : null]}
            onPress={() => setLanguage('en')}
          >
            <Text style={[styles.langBtnText, language === 'en' ? styles.langBtnTextActive : null]}>English</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.langBtn, language === 'fa' ? styles.langBtnActive : null]}
            onPress={() => setLanguage('fa')}
          >
            <Text style={[styles.langBtnText, language === 'fa' ? styles.langBtnTextActive : null]}>فارسی</Text>
          </TouchableOpacity>
        </View>
      </View>

      {menuRow({
        key: 'edit',
        icon: <Pencil color={COLORS.primary} size={20} />,
        iconBg: COLORS.primaryLight,
        title: t('profileEditMenu'),
        sub: t('profileEditMenuSub'),
        onPress: () => navigation.navigate('ProfileEdit'),
      })}
      {menuRow({
        key: 'sub',
        icon: <Crown color={COLORS.secondary} size={20} />,
        iconBg: COLORS.secondaryLight,
        title: subscription?.active ? t('subscriptionActive') : t('subscriptionBuy'),
        sub: subscription?.active
          ? t('subscriptionUntil').replace('{date}', formatSubscriptionEnd(subscription, language))
          : t('subscriptionBuySub'),
        // با اشتراک فعال هم صفحه‌ی خرید باز می‌شود تا تمدید و بازیابی خرید در دسترس باشد.
        onPress: () => navigation.navigate('Paywall'),
      })}
      {menuRow({
        key: 'rec',
        icon: <Mic color={COLORS.audioMine} size={20} />,
        iconBg: hexToRgba(COLORS.audioMine, 0.12),
        title: t('myRecordings'),
        sub: t('myRecordingsSub'),
        onPress: () => navigation.navigate('MyRecordings'),
      })}
      {menuRow({
        key: 'help',
        icon: <HelpCircle color={COLORS.error} size={20} />,
        iconBg: COLORS.errorLight,
        title: t('helpFaq'),
        sub: t('helpFaqSub'),
        onPress: () => navigation.navigate('HelpFaq'),
      })}

      {/* ابزارهای فقط-توسعه (پیش‌نمایش توست + PoC مکالمه‌ی زنده) — در بیلد
          ریلیز برای کاربر نمایش داده نمی‌شوند؛ کادر خط‌چین نشان می‌دهد قابلیت واقعی نیستند. */}
      {__DEV__ && (
        <>
          {menuRow({
            key: 'toast',
            icon: <MessageSquare color={COLORS.tertiary} size={20} />,
            iconBg: '#E6F6EE',
            title: t('toastDemoMenuLabel'),
            sub: t('toastDemoMenuSub'),
            onPress: () => navigation.navigate('ToastDemo'),
            tag: 'Dev',
            dev: true,
          })}
          {menuRow({
            key: 'rt',
            icon: <Sparkles color={COLORS.secondary} size={20} />,
            iconBg: '#FFF6E0',
            title: t('realtimePoCMenuLabel'),
            sub: t('realtimePoCMenuSub'),
            onPress: () => navigation.navigate('RealtimePoC'),
            tag: 'Gemini',
            dev: true,
          })}
        </>
      )}

      {/* Practice Card: تعداد دورهای خودکار در مرحله‌های گوش‌دادن و سایه‌زنی */}
      <View style={[styles.settingCard, { marginTop: 4 }]} onLayout={(e) => setSettingsY(e.nativeEvent.layout.y - 12)}>
        <View style={[styles.sectionHeaderRow, row]}>
          <View style={[styles.cardIcon, { backgroundColor: '#E6F6EE' }]}>
            <Repeat color={COLORS.tertiary} size={16} />
          </View>
          <Text style={styles.settingCardTitle}>{t('practiceSettingsTitle')}</Text>
        </View>

        <Text style={[styles.optionTitle, ta]}>{t('repeatsPerStepLabel')}</Text>
        <Text style={[styles.optionSub, ta]}>{t('repeatsPerStepSub')}</Text>

        <View style={[styles.segmented, row]}>
          {REPEAT_OPTIONS.map((option) => (
            <TouchableOpacity
              key={option}
              style={[styles.segment, repeatsPerStep === option && styles.segmentActive]}
              onPress={() => setRepeatsPerStep(option)}
            >
              <Text style={[styles.segmentText, repeatsPerStep === option && styles.pillTextActive]}>
                {option === 0 ? '∞' : `${option}×`}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.dividerLine} />

        <Text style={[styles.optionTitle, ta]}>{t('highlightColorLabel')}</Text>
        <Text style={[styles.optionSub, ta]}>{t('highlightColorSub')}</Text>

        <View style={[styles.colorSwatchRow, row, { marginTop: 12 }]}>
          {HIGHLIGHT_COLOR_OPTIONS.map((color) => (
            <TouchableOpacity
              key={color}
              style={[styles.colorSwatchRing, highlightColor === color && { borderColor: color }]}
              onPress={() => setHighlightColor(color)}
              accessibilityRole="radio"
              accessibilityState={{ selected: highlightColor === color }}
            >
              <View style={[styles.colorSwatch, { backgroundColor: color }]}>
                {highlightColor === color && <Check color={COLORS.white} size={16} strokeWidth={3} />}
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* پیش‌نمایش زنده: همان هایلایتی که روی جمله‌ی در حال پخش می‌نشیند. */}
        <View style={styles.highlightPreview}>
          <Text style={styles.highlightPreviewEn}>
            <Text style={{ backgroundColor: hexToRgba(highlightColor, 0.28), color: highlightColor }}>Nice to meet</Text> you.
          </Text>
          <Text style={styles.highlightPreviewFa}>{t('highlightPreviewFa')}</Text>
        </View>
      </View>

      {/* Notifications & Reminders Card */}
      <View style={[styles.settingCard, { marginTop: 16 }]}>
        <View style={[styles.sectionHeaderRow, row]}>
          <View style={[styles.cardIcon, { backgroundColor: '#FFF6E0' }]}>
            <Bell color={COLORS.secondary} size={16} />
          </View>
          <Text style={styles.settingCardTitle}>{t('notificationsTitle')}</Text>
        </View>

        {/* Option 1: Daily Study Reminder */}
        <View style={[styles.toggleRow, row]}>
          <View style={[styles.flex1, rtl ? styles.alignEnd : styles.alignStart]}>
            <Text style={[styles.optionTitle, ta]}>{t('studyReminder')}</Text>
            <Text style={[styles.optionSub, ta]}>{t('studyReminderSub')}</Text>
          </View>
          <Switch
            value={studyReminderEnabled}
            onValueChange={setStudyReminderEnabled}
            trackColor={{ false: '#E3E5EA', true: COLORS.tertiary }}
            thumbColor={COLORS.white}
          />
        </View>

        {studyReminderEnabled && (
          <View style={styles.subOptionGroup}>
            <View style={[styles.subOptionHead, row]}>
              <Clock color={COLORS.textSecondary} size={14} />
              <Text style={styles.subOptionLabel}>{t('reminderTime')}</Text>
            </View>

            {studyReminderTimes.length === 0 ? (
              <Text style={[styles.optionSub, ta]}>{t('reminderTimesEmpty')}</Text>
            ) : (
              <View style={[styles.timeChipRow, row]}>
                {studyReminderTimes.map((time) => (
                  <View key={time} style={styles.timeChip}>
                    <Text style={styles.timeChipText}>{time}</Text>
                    <TouchableOpacity
                      onPress={() => removeStudyReminderTime(time)}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <X color={COLORS.white} size={13} />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}

            {studyReminderTimes.length < MAX_REMINDER_TIMES && (
              <TouchableOpacity
                style={[styles.addTimeBtn, rtl && styles.selfEnd]}
                onPress={() => setTimePickerOpen(true)}
              >
                <Plus color={COLORS.primary} size={14} />
                <Text style={styles.addTimeText}>{t('addReminderTime')}</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        <View style={styles.dividerLine} />

        {/* Option 2: Leitner & Lesson Sentences Alerts */}
        <View style={[styles.toggleRow, row]}>
          <View style={[styles.flex1, rtl ? styles.alignEnd : styles.alignStart]}>
            <Text style={[styles.optionTitle, ta]}>{t('contentNotification')}</Text>
            <Text style={[styles.optionSub, ta]}>{t('contentNotificationSub')}</Text>
          </View>
          <Switch
            value={contentNotificationEnabled}
            onValueChange={setContentNotificationEnabled}
            trackColor={{ false: '#E3E5EA', true: COLORS.tertiary }}
            thumbColor={COLORS.white}
          />
        </View>

        {contentNotificationEnabled && (
          <View style={styles.subOptionGroup}>
            <View style={[styles.subOptionHead, row]}>
              <BookOpen color={COLORS.tertiary} size={14} />
              <Text style={styles.subOptionLabel}>{t('notificationSource')}</Text>
            </View>
            <View style={styles.pillGroupVertical}>
              {(
                [
                  { id: 'leitner', label: t('sourceLeitner') },
                  { id: 'sentences', label: t('sourceSentences') },
                  { id: 'mixed', label: t('sourceMixed') },
                ] as { id: ContentSource; label: string }[]
              ).map((src) => (
                <TouchableOpacity
                  key={src.id}
                  style={[styles.pillBtnWide, contentSource === src.id && styles.pillBtnWideActive]}
                  onPress={() => setContentSource(src.id)}
                >
                  <Text style={[styles.pillText, contentSource === src.id && styles.pillTextActive]}>
                    {src.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* دکمه‌ی ثانویه و خنثی؛ نارنجی پر برای اقدام‌های اصلی کاربر می‌ماند. */}
        <TouchableOpacity style={[styles.testBtn, row]} onPress={handleSendTestNotification}>
          <Sparkles color={COLORS.tertiary} size={16} />
          <Text style={styles.testBtnText}>{t('sendTestNotification')}</Text>
        </TouchableOpacity>

        <TimePickerModal
          visible={timePickerOpen}
          onCancel={() => setTimePickerOpen(false)}
          onConfirm={handleAddReminderTime}
        />
      </View>
    </ScrollView>
  );
};

// رنگ‌های طرح جدید: پس‌زمینه‌ی خاکستریِ خیلی روشن و کارت‌های سفید با کادر و سایه‌ی نرم.
const PAGE_BG = '#F7F7F9';
const CARD_BORDER = '#EEEEF2';
const CARD_SHADOW = {
  shadowColor: '#1A1D26',
  shadowOpacity: 0.05,
  shadowRadius: 10,
  shadowOffset: { width: 0, height: 3 },
  elevation: 1,
};

const styles = StyleSheet.create({
  rowReverse: { flexDirection: 'row-reverse' },
  textRight: { textAlign: 'right' },
  textLeft: { textAlign: 'left' },
  alignEnd: { alignItems: 'flex-end' },
  alignStart: { alignItems: 'flex-start' },
  selfEnd: { alignSelf: 'flex-end' },
  flex1: { flex: 1 },
  chipDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: COLORS.primary },
  filterGrow: { flexGrow: 1 },
  heroHeader: { alignItems: 'center', gap: 6, marginBottom: 18 },
  heroIcon: { width: 56, height: 56, borderRadius: 18, backgroundColor: '#FFEFE6', alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  heroTitle: { color: COLORS.text, fontFamily: FONT_FAMILY.bold, fontSize: 24, lineHeight: 34 },
  heroSub: { color: COLORS.muted, fontFamily: FONT_FAMILY.regular, fontSize: 13 },
  statsIcon: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  scoreDivider: { alignSelf: 'stretch', height: 1, backgroundColor: CARD_BORDER, marginVertical: 18 },
  tipBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    alignSelf: 'stretch',
    marginTop: 14,
    padding: 12,
    borderRadius: 14,
    backgroundColor: '#FFF9EB',
    borderWidth: 1,
    borderColor: '#F7E7BE',
  },
  tipIcon: { width: 32, height: 32, borderRadius: 10, backgroundColor: '#FFEFC7', alignItems: 'center', justifyContent: 'center' },
  cardHeadRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
  titleWithDot: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  titleDot: { width: 10, height: 18, borderRadius: 5, backgroundColor: '#D95D39' },
  cardHeadMeta: { color: COLORS.muted, fontFamily: FONT_FAMILY.regular, fontSize: 11 },
  cardIcon: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  growthChip: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, backgroundColor: '#E6F6EE' },
  growthChipText: { color: COLORS.tertiary, fontFamily: FONT_FAMILY.bold, fontSize: 11 },
  trendChartRow: { height: 170 },
  trendBarTrack: { width: 22 },
  weekStrip: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 12,
    marginBottom: 14,
    borderRadius: 20,
    backgroundColor: '#F0F1F4',
  },
  weekStripCol: { alignItems: 'center', gap: 6, flex: 1 },
  weekStripLabel: { color: COLORS.muted, fontFamily: FONT_FAMILY.medium, fontSize: 11 },
  weekStripDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: CARD_BORDER,
    alignItems: 'center',
    justifyContent: 'center',
  },
  weekStripDotDone: { backgroundColor: '#E3F4EB', borderColor: '#BFE3CF' },
  weekStripDotToday: { backgroundColor: '#D95D39', borderColor: '#F6C9B8', borderWidth: 3 },
  weekStripTodayInner: { width: 10, height: 10, borderRadius: 5, backgroundColor: COLORS.white },
  weekStripDash: { color: COLORS.muted, fontSize: 12 },
  achievementList: { gap: 10 },
  doneChip: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, backgroundColor: '#FCEFC7' },
  doneChipText: { color: '#9A6A00', fontFamily: FONT_FAMILY.bold, fontSize: 10 },
  pageHeadRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 },
  pageSubTight: { color: COLORS.muted, fontFamily: FONT_FAMILY.regular, fontSize: 12 },
  avatarCheck: {
    position: 'absolute',
    right: 0,
    bottom: 2,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#3DAE74',
    borderWidth: 2,
    borderColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  levelChip: { marginTop: 10, paddingHorizontal: 12, paddingVertical: 4, borderRadius: 10, backgroundColor: '#FFF6DE', borderWidth: 1, borderColor: '#F6E3AE' },
  levelChipText: { color: '#9A6A00', fontFamily: FONT_FAMILY.bold, fontSize: 11 },
  langLabelGroup: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  pointsIconWrapSm: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  pointsCardDev: { borderStyle: 'dashed', borderColor: '#DADCE3', shadowOpacity: 0, elevation: 0 },
  menuTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  menuTag: { paddingHorizontal: 6, paddingVertical: 1, borderRadius: 6, backgroundColor: '#F2F2F5' },
  menuTagText: { color: COLORS.textSecondary, fontFamily: FONT_FAMILY.bold, fontSize: 9 },
  segmented: { flexDirection: 'row', marginTop: 12, padding: 4, borderRadius: 14, backgroundColor: '#F2F2F5' },
  segment: { flex: 1, paddingVertical: 9, borderRadius: 10, alignItems: 'center' },
  segmentActive: { backgroundColor: '#2F6B4F' },
  segmentText: { color: COLORS.textSecondary, fontFamily: FONT_FAMILY.bold, fontSize: 13 },
  colorSwatchRing: { width: 42, height: 42, borderRadius: 21, borderWidth: 2, borderColor: 'transparent', alignItems: 'center', justifyContent: 'center' },
  subOptionHead: { flexDirection: 'row', alignItems: 'center', marginBottom: 8, gap: 6 },
  screen: { flex: 1, backgroundColor: PAGE_BG },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 54,
    // تب‌بار پایین شناور و absolute است (AppNavigator: bottom 24/16 + ارتفاع
    // 70) و بخشی از جریان عادی صفحه نیست، پس هر ScrollView باید خودش فضای
    // کافی برایش کنار بگذارد؛ ۹۰ تقریباً هم‌اندازه‌ی خودِ تب‌بار بود (روی iOS
    // حتی کمتر) و آخرین آیتم (مثلاً دکمه‌ی تست نوتیفیکیشن در پروفایل) درست
    // زیرش گم می‌شد.
    paddingBottom: 130,
  },
  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  kicker: {
    color: COLORS.primary,
    fontFamily: FONT_FAMILY.bold,
    fontSize: 12,
    letterSpacing: 1,
  },
  iconButton: { width: 38, height: 38, borderRadius: 19, backgroundColor: COLORS.white, borderWidth: 1, borderColor: CARD_BORDER, alignItems: 'center', justifyContent: 'center' },
  topBarActions: {
    flexDirection: 'row',
    gap: 8,
  },
  topTitle: { flex: 1, color: COLORS.text, fontFamily: FONT_FAMILY.bold, fontSize: 22, lineHeight: 32, textAlign: 'right' },
  // عنوان و زیرعنوان صفحه هر دو راست‌چین، زیرعنوان در خط بعد.
  pageTitle: { color: COLORS.text, fontFamily: FONT_FAMILY.bold, fontSize: 22, lineHeight: 32 },
  filterDivider: { width: 1, alignSelf: 'stretch', marginVertical: 6, backgroundColor: COLORS.border },
  pageSub: {
    color: COLORS.textSecondary,
    fontFamily: FONT_FAMILY.regular,
    fontSize: 13,
    textAlign: 'right',
    marginBottom: 20,
  },
  featuredList: {
    gap: 4,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: COLORS.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: CARD_BORDER,
    paddingHorizontal: 14,
    paddingVertical: 11,
    marginBottom: 14,
  },
  searchInput: {
    flex: 1,
    color: COLORS.text,
    fontFamily: FONT_FAMILY.regular,
    fontSize: 14,
    padding: 0,
  },
  categoryRowWrapper: {
    marginBottom: 10,
  },
  categoryRow: {
    flexDirection: 'row',
    gap: 8,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 18,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: CARD_BORDER,
  },
  categoryChipActive: { backgroundColor: '#FFF0E8', borderColor: COLORS.primary },
  categoryChipText: { color: COLORS.textSecondary, fontFamily: FONT_FAMILY.semiBold, fontSize: 13 },
  categoryChipTextActive: { color: COLORS.primary },
  emptyCategoryText: {
    color: COLORS.textSecondary,
    fontFamily: FONT_FAMILY.regular,
    fontSize: 14,
    textAlign: 'center',
    marginTop: 40,
  },
  suggestSceneCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: COLORS.primaryLight,
    borderRadius: 20,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.primary,
    marginBottom: 20,
  },
  suggestSceneIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  suggestSceneTitle: {
    color: COLORS.text,
    fontFamily: FONT_FAMILY.semiBold,
    fontSize: 14,
  },
  suggestSceneSub: {
    color: COLORS.textSecondary,
    fontFamily: FONT_FAMILY.regular,
    fontSize: 12,
    marginTop: 2,
  },
  statsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: CARD_BORDER,
    ...CARD_SHADOW,
    paddingVertical: 16,
    marginBottom: 14,
  },
  // فضای اضافه برای دکمه‌ی ثابت «ادامه‌ی یادگیری» بالای نوار پایین.
  scrollWithCta: { paddingBottom: 210 },
  ctaFloat: { position: 'absolute', left: 20, right: 20, bottom: Platform.OS === 'ios' ? 106 : 98 },
  ctaBtn: { flexDirection: 'row', gap: 10, height: 54, borderRadius: 16, backgroundColor: '#E2643A', alignItems: 'center', justifyContent: 'center', shadowColor: COLORS.primary, shadowOpacity: 0.3, shadowRadius: 12, shadowOffset: { width: 0, height: 5 }, elevation: 4 },
  ctaText: { fontFamily: FONT_FAMILY.bold, fontSize: 15, color: COLORS.white },
  progressTip: { flex: 1, fontFamily: FONT_FAMILY.medium, fontSize: 12, lineHeight: 21, color: COLORS.text },
  statsTile: { flex: 1, alignItems: 'center', gap: 6 },
  statsDivider: { width: 1, height: 56, backgroundColor: CARD_BORDER },
  statsValue: { color: COLORS.text, fontFamily: FONT_FAMILY.bold, fontSize: 17 },
  statsLabel: { color: COLORS.muted, fontFamily: FONT_FAMILY.regular, fontSize: 11 },
  scoreCard: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: CARD_BORDER,
    ...CARD_SHADOW,
    padding: 20,
    alignItems: 'center',
    marginBottom: 14,
  },
  scoreRing: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 4,
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  scoreValue: { color: COLORS.text, fontFamily: FONT_FAMILY.bold, fontSize: 40, lineHeight: 50 },
  scoreLabel: { color: COLORS.muted, fontFamily: FONT_FAMILY.regular, fontSize: 12 },
  scoreRow: { flexDirection: 'row', gap: 12, alignSelf: 'stretch' },
  scoreMetric: { flex: 1, alignItems: 'center', paddingVertical: 14, borderRadius: 14, backgroundColor: '#F7F8FA' },
  metricValue: { fontFamily: FONT_FAMILY.bold, fontSize: 22 },
  metricLabel: { color: COLORS.muted, fontFamily: FONT_FAMILY.regular, fontSize: 12, marginTop: 2 },
  profileHeader: {
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: CARD_BORDER,
    ...CARD_SHADOW,
    padding: 22,
    marginBottom: 14,
  },
  avatarCircle: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: '#FFEFE6',
    borderWidth: 3,
    borderColor: '#FFE1D2',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  profileName: {
    color: COLORS.text,
    fontFamily: FONT_FAMILY.bold,
    fontSize: 20,
  },
  profileSub: {
    color: COLORS.textSecondary,
    fontFamily: FONT_FAMILY.regular,
    fontSize: 13,
    marginTop: 2,
  },
  pointsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: COLORS.white,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: CARD_BORDER,
    ...CARD_SHADOW,
    padding: 14,
    marginBottom: 12,
  },
  pointsIconWrap: { width: 44, height: 44, borderRadius: 12, backgroundColor: '#F2F2F5', alignItems: 'center', justifyContent: 'center' },
  pointsValue: {
    color: COLORS.text,
    fontFamily: FONT_FAMILY.bold,
    fontSize: 15,
  },
  pointsSub: { color: COLORS.muted, fontFamily: FONT_FAMILY.regular, fontSize: 12, marginTop: 2 },
  settingCard: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: CARD_BORDER,
    ...CARD_SHADOW,
    padding: 18,
    marginBottom: 14,
  },
  settingLabel: { color: COLORS.text, fontFamily: FONT_FAMILY.semiBold, fontSize: 14, marginBottom: 12 },
  langCardRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12 },
  langLabelInline: { marginBottom: 0 },
  langToggleCompact: { width: 170 },
  langToggleRow: { flexDirection: 'row', backgroundColor: '#F2F2F5', borderRadius: 14, padding: 4 },
  langBtn: {
    flex: 1,
    paddingVertical: 7,
    alignItems: 'center',
    borderRadius: 10,
  },
  langBtnActive: {
    backgroundColor: COLORS.primary,
  },
  langBtnText: {
    color: COLORS.textSecondary,
    fontFamily: FONT_FAMILY.semiBold,
    fontSize: 13,
  },
  langBtnTextActive: {
    color: COLORS.white,
  },
  sectionHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 16 },
  settingCardTitle: { color: COLORS.text, fontFamily: FONT_FAMILY.bold, fontSize: 16 },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  optionTitle: {
    color: COLORS.text,
    fontFamily: FONT_FAMILY.semiBold,
    fontSize: 14,
    marginBottom: 2,
  },
  optionSub: {
    color: COLORS.textSecondary,
    fontFamily: FONT_FAMILY.regular,
    fontSize: 12,
    lineHeight: 16,
  },
  subOptionGroup: { marginTop: 10, marginBottom: 10 },
  subOptionLabel: {
    color: COLORS.textSecondary,
    fontFamily: FONT_FAMILY.medium,
    fontSize: 12,
  },
  pillGroup: {
    flexDirection: 'row',
    gap: 8,
  },
  pillGroupVertical: {
    gap: 8,
  },
  pillBtn: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: COLORS.surfaceLight,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  pillBtnActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  pillBtnWide: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 14,
    backgroundColor: COLORS.surfaceLight,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  // همه‌ی انتخاب‌های تنظیمات سبز تیره (مثل تعداد تکرار)؛ نارنجی فقط برای اقدام اصلی.
  pillBtnWideActive: {
    backgroundColor: COLORS.tertiary,
    borderColor: COLORS.tertiary,
  },
  pillText: {
    color: COLORS.textSecondary,
    fontFamily: FONT_FAMILY.semiBold,
    fontSize: 12,
  },
  pillTextActive: {
    color: COLORS.white,
  },
  timeChipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  timeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: COLORS.primary,
  },
  timeChipText: {
    color: COLORS.white,
    fontFamily: FONT_FAMILY.semiBold,
    fontSize: 12,
  },
  addTimeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    marginTop: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  addTimeText: {
    color: COLORS.primary,
    fontFamily: FONT_FAMILY.semiBold,
    fontSize: 12,
  },
  timeModalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  timeModalCard: {
    width: '100%',
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  timeModalTitle: {
    color: COLORS.text,
    fontFamily: FONT_FAMILY.semiBold,
    fontSize: 15,
    textAlign: 'center',
  },
  timeModalPreview: {
    color: COLORS.primary,
    fontFamily: FONT_FAMILY.semiBold,
    fontSize: 28,
    textAlign: 'center',
    marginVertical: 10,
  },
  timeColumnRow: {
    flexDirection: 'row',
    gap: 12,
  },
  timeColumn: {
    flex: 1,
    gap: 6,
  },
  timeColumnScroll: {
    maxHeight: 180,
  },
  timeCell: {
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
    backgroundColor: COLORS.surfaceLight,
    marginBottom: 6,
  },
  timeCellActive: {
    backgroundColor: COLORS.primary,
  },
  timeModalActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 16,
  },
  dividerLine: { height: 1, backgroundColor: CARD_BORDER, marginVertical: 16 },
  colorSwatchRow: { flexDirection: 'row', gap: 10 },
  colorSwatch: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  highlightPreview: { marginTop: 14, padding: 14, borderRadius: 14, backgroundColor: '#FFF9EE', borderWidth: 1, borderColor: '#F7ECD3', gap: 4 },
  highlightPreviewEn: { fontFamily: FONT_FAMILY.bold, fontSize: 17, color: COLORS.text },
  highlightPreviewFa: { fontFamily: FONT_FAMILY.regular, fontSize: 12, color: COLORS.textSecondary, textAlign: 'right' },
  testBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: CARD_BORDER,
    borderRadius: 16,
    height: 46,
    marginTop: 16,
    gap: 8,
  },
  testBtnText: { color: COLORS.text, fontFamily: FONT_FAMILY.bold, fontSize: 13 },
  helpRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  helpRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  helpRowText: {
    color: COLORS.text,
    fontFamily: FONT_FAMILY.semiBold,
    fontSize: 14,
  },
  weekChartRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', height: 130, marginTop: 18 },
  weekBarCol: {
    alignItems: 'center',
    flex: 1,
    height: '100%',
  },
  weekBarTrack: { flex: 1, width: 20, borderRadius: 10, backgroundColor: '#F2F3F6', justifyContent: 'flex-end', overflow: 'hidden' },
  weekBarFill: { width: '100%', borderRadius: 10 },
  weekBarLabel: {
    color: COLORS.muted,
    fontFamily: FONT_FAMILY.medium,
    fontSize: 11,
    marginTop: 8,
  },
  weekBarLabelActive: {
    color: COLORS.primary,
    fontFamily: FONT_FAMILY.bold,
  },
  skillRow: { marginTop: 14 },
  skillLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  skillLabel: { color: COLORS.text, fontFamily: FONT_FAMILY.semiBold, fontSize: 13 },
  skillPercent: { color: COLORS.text, fontFamily: FONT_FAMILY.bold, fontSize: 13 },
  skillTrack: { flexDirection: 'row', height: 8, borderRadius: 4, backgroundColor: '#F0F1F4', overflow: 'hidden' },
  skillFill: {
    height: '100%',
    borderRadius: 4,
  },
  achievementGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  achievementCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#FFFBEF',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#F6EBCB',
  },
  achievementBadge: { width: 48, height: 48, borderRadius: 14, backgroundColor: '#FBC549', alignItems: 'center', justifyContent: 'center' },
  achievementTitle: { color: COLORS.text, fontFamily: FONT_FAMILY.bold, fontSize: 14, marginBottom: 2 },
  achievementSub: { color: COLORS.muted, fontFamily: FONT_FAMILY.regular, fontSize: 12, lineHeight: 18 },
});
