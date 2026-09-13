import React from 'react';
import {
  BackHandler,
  ImageBackground,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import {
  BookOpen,
  Clock,
  Flame,
  Globe,
  Menu,
  Mic,
  Play,
  Repeat,
  Sparkles,
  X,
  Zap,
} from 'lucide-react-native';
import { ScenarioCard } from '../components/ScenarioCard';
import { ProgressRing } from '../components/ProgressRing';
import { AppDrawer } from '../components/AppDrawer';
import { StreakInfoModal } from '../components/StreakInfoModal';
import { XpInfoModal } from '../components/XpInfoModal';
import { useScenes } from '../data/ScenesContext';
import { useVocab, isDue } from '../data/VocabContext';
import { useLanguage } from '../data/i18n';
import { useAuth } from '../data/AuthContext';
import { useToast } from '../data/ToastContext';
import { getUserStreak, getUserSummary, getWeeklyActivity, getSkillsBreakdown } from '../api/progress';
import { getAssessmentTest, getSpeakingProfile, type AssessmentItem, type SpeakingProfile } from '../api/assessment';
import { getTodaysMission, type TodaysMission } from '../api/mission';
import { PlacementTestFlow } from './PlacementTest';
import { COLORS } from '../theme/colors';
import { FONT_FAMILY } from '../theme/typography';

// هدف روزانه‌ی تعداد جلسه‌های تمرین — یک مقدار طراحی‌شده‌ی ثابت (مثل «۱۰,۰۰۰
// قدم» در اپ‌های فیتنس)، نه داده‌ی جعلی کاربر؛ بقیه‌ی مقادیر کارت زیر همه از
// API واقعی می‌آیند.
const DAILY_SESSIONS_GOAL = 10;

const todayISODate = () => new Date().toISOString().slice(0, 10);

/** کلید احوال‌پرسی بر اساس ساعت واقعی دستگاه، نه یک متن ثابت. */
const getGreetingKey = (): string => {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return 'greetingMorning';
  if (hour >= 12 && hour < 17) return 'greetingAfternoon';
  if (hour >= 17 && hour < 21) return 'greetingEvening';
  return 'greetingNight';
};

export const HomeScreen = () => {
  const navigation = useNavigation<any>();
  const { scenes } = useScenes();
  const { language, setLanguage, t } = useLanguage();
  const toast = useToast();
  const { user } = useAuth();
  const { box } = useVocab();
  const dueCount = box.filter(isDue).length;
  const [drawerVisible, setDrawerVisible] = React.useState(false);
  const [streak, setStreak] = React.useState(0);
  const [streakFreezes, setStreakFreezes] = React.useState<number | undefined>(undefined);
  const [streakInfoVisible, setStreakInfoVisible] = React.useState(false);
  const [todaySessions, setTodaySessions] = React.useState(0);
  const [todayMinutes, setTodayMinutes] = React.useState(0);
  const [fluency, setFluency] = React.useState(0);
  const [totalXP, setTotalXP] = React.useState(0);
  const [levelName, setLevelName] = React.useState('');
  const [xpInfoVisible, setXpInfoVisible] = React.useState(false);

  // آیتم‌های تست: فقط وقتی ادمین محتوا ساخته باشد پر می‌شوند (وگرنه null، یعنی
  // کل فیچر نامرئی است). برخلاف قبل، مستقل از داشتن/نداشتنِ پروفایلِ فعلی
  // نگه‌داشته می‌شوند — چون هم کارتِ CTA (فقط برای کسی که هنوز نداده) و هم
  // ردیفِ Drawer (برای گرفتنِ دوباره‌ی تست حتی بعد از داشتنِ پروفایل) به این
  // نیاز دارند.
  const [placementItems, setPlacementItems] = React.useState<AssessmentItem[] | null>(null);
  const [speakingProfile, setSpeakingProfile] = React.useState<SpeakingProfile | null>(null);
  const [placementCtaDismissed, setPlacementCtaDismissed] = React.useState(false);
  const [placementModalVisible, setPlacementModalVisible] = React.useState(false);

  const refreshPlacementState = React.useCallback(() => {
    let active = true;
    getAssessmentTest()
      .then((items) => {
        if (!active) return;
        if (!items || items.length === 0) {
          setPlacementItems(null);
          setSpeakingProfile(null);
          return;
        }
        setPlacementItems(items);
        return getSpeakingProfile().then((profile) => {
          if (active) setSpeakingProfile(profile);
        });
      })
      .catch(() => {
        if (active) {
          setPlacementItems(null);
          setSpeakingProfile(null);
        }
      });
    return () => {
      active = false;
    };
  }, []);

  useFocusEffect(React.useCallback(() => refreshPlacementState(), [refreshPlacementState]));

  // ماموریتِ امروز: صحنه‌ی پیشنهادی بر اساسِ سطح/مهارتِ ضعیف‌تر کاربر.
  // مستقل از بقیه واکشی می‌شود و شکستش هیچ‌چیزِ دیگری را نمی‌شکند — کارتِ
  // «ادامه داستان»ِ قدیمی همیشه به‌عنوانِ fallback آماده است.
  const [todaysMission, setTodaysMission] = React.useState<TodaysMission | null>(null);
  useFocusEffect(
    React.useCallback(() => {
      let active = true;
      getTodaysMission()
        .then((m) => {
          if (active) setTodaysMission(m);
        })
        .catch(() => {
          if (active) setTodaysMission(null);
        });
      return () => {
        active = false;
      };
    }, [])
  );

  useFocusEffect(
    React.useCallback(() => {
      if (!user?.id) return;
      let active = true;
      getUserStreak(user.id)
        .then((s) => {
          if (!active) return;
          setStreak(s.current_streak);
          setStreakFreezes(s.freezes);
        })
        .catch(() => {});
      getUserSummary(user.id)
        .then((s) => {
          if (!active) return;
          setTotalXP(s.total_xp);
          setLevelName(s.level_name);
        })
        .catch(() => {});
      getWeeklyActivity()
        .then((days) => {
          if (!active) return;
          const today = days.find((d) => d.date === todayISODate());
          setTodaySessions(today?.sessions ?? 0);
          setTodayMinutes(today?.minutes ?? 0);
        })
        .catch(() => {});
      getSkillsBreakdown()
        .then((skills) => active && setFluency(Math.round(skills.fluency)))
        .catch(() => {});
      return () => {
        active = false;
      };
    }, [user?.id])
  );

  // Exit app when pressing hardware back button on Home screen
  useFocusEffect(
    React.useCallback(() => {
      const onBackPress = () => {
        BackHandler.exitApp();
        return true;
      };

      const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
      return () => subscription.remove();
    }, [])
  );

  const primaryScenario = scenes[0] || null;

  // تصویر/عنوان/قفل‌بودن از روی صحنه‌ی از قبل بارگذاری‌شده گرفته می‌شود؛
  // فقط برچسب‌های سطح/زمان/مهارت از پاسخِ /v1/mission/today می‌آید. اگر
  // صحنه‌ی پیشنهادی هنوز در لیستِ محلی نباشد (تازه اضافه شده و کش نشده)
  // بی‌سروصدا به همان «ادامه داستان»ِ قدیمی برمی‌گردیم.
  const missionScene = todaysMission
    ? scenes.find((s) => s.id === todaysMission.scene_id) || null
    : null;
  const featuredScenario = missionScene || primaryScenario;

  // پیش‌نمایش خانه: فقط چند صحنه‌ی «بعدی» (ناتمام) رو نشون می‌ده، نه کل
  // مسیر رو — دیدن همه از دکمه‌ی «مسیر کامل» به نقشه می‌ره.
  const HOME_PREVIEW_COUNT = 4;
  const homePreviewScenes = (() => {
    const upcoming = scenes.filter((s) => !s.isCompleted);
    return (upcoming.length > 0 ? upcoming : scenes).slice(0, HOME_PREVIEW_COUNT);
  })();

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'fa' : 'en');
  };

  // اگه صحنه قفله (خارج از سقف رایگان و بدون اشتراک فعال)، به‌جای رفتن
  // مستقیم به تمرین، پی‌وال (Paywall) باز میشه. جدا از این، اگه صحنه‌ی
  // قبلیِ مسیر آموزشی هنوز کامل نشده (isSequenceLocked)، راه‌حلش خریدن
  // اشتراک نیست — فقط یه پیام نشون می‌دیم که اول صحنه‌ی قبلی رو کامل کنه.
  const openScene = (scenario: { id: string; isLocked?: boolean; isSequenceLocked?: boolean }) => {
    if (scenario.isLocked) {
      navigation.navigate('Paywall');
      return;
    }
    if (scenario.isSequenceLocked) {
      toast.info(t('sequenceLockedMsg'));
      return;
    }
    navigation.navigate('Shadowing', { scenarioId: scenario.id });
  };

  const todayPercent = Math.min(100, Math.round((todaySessions / DAILY_SESSIONS_GOAL) * 100));

  // اسمِ کاربر واقعی؛ اگر ثبت نشده بود، بدون اسم («عصر بخیر!») نشان می‌دهیم
  // نه یک اسمِ ثابت جعلی.
  const nameSuffix = user?.nickname
    ? language === 'fa'
      ? `، ${user.nickname}`
      : `, ${user.nickname}`
    : '';

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* HEADER TOP ROW */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting} numberOfLines={2}>
              {t(getGreetingKey())}
              {nameSuffix}
            </Text>
            <Text style={styles.headerTitle}>{t('readyToStepIn')}</Text>
          </View>

          {/* روی ردیف جدا و زیر متن، نه کنارش — وگرنه با اسمِ بلند، دکمه‌ی
              باز کردنِ دراور از صفحه بیرون می‌افتاد. */}
          <View style={styles.headerActions}>
            {/* Language Selector */}
            <TouchableOpacity style={styles.langBadge} onPress={toggleLanguage}>
              <Globe size={14} color={COLORS.primary} />
              <Text style={styles.langBadgeText}>{language.toUpperCase()}</Text>
            </TouchableOpacity>

            {/* Streak Badge — لمس برای توضیح معنای استریک */}
            <TouchableOpacity style={styles.streakBadge} onPress={() => setStreakInfoVisible(true)}>
              <Flame size={16} color={COLORS.secondary} fill={COLORS.secondary} />
              <Text style={styles.streakText}>{streak}</Text>
            </TouchableOpacity>

            {/* XP Badge — لمس توضیح می‌دهد XP از کجا می‌آید (مثل بج استریک). */}
            <TouchableOpacity style={styles.xpBadge} onPress={() => setXpInfoVisible(true)}>
              <Zap size={16} color={COLORS.tertiary} fill={COLORS.tertiary} />
              <Text style={styles.xpText}>{totalXP}</Text>
            </TouchableOpacity>

            {/* Drawer Trigger */}
            <TouchableOpacity style={styles.menuBtn} onPress={() => setDrawerVisible(true)}>
              <Menu size={18} color={COLORS.text} />
            </TouchableOpacity>
          </View>
        </View>

        <AppDrawer
          visible={drawerVisible}
          onClose={() => setDrawerVisible(false)}
          onOpenPlacementTest={placementItems ? () => setPlacementModalVisible(true) : undefined}
          speakingLevel={speakingProfile?.level}
        />
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

        {/* TODAY'S SHADOWING PROGRESS CARD */}
        <View style={styles.progressCard}>
          <View style={styles.progressTopRow}>
            <ProgressRing percent={todayPercent} size={88} strokeWidth={8} color={COLORS.primary}>
              <Text style={styles.ringPercentText}>{todayPercent}%</Text>
            </ProgressRing>
            <View style={styles.progressTextCol}>
              <Text style={styles.progressCardTitle}>{t('todaysShadowing')}</Text>
              <Text style={styles.repsText}>
                {todaySessions} / {DAILY_SESSIONS_GOAL} <Text style={styles.repsUnit}>{t('repsCount')}</Text>
              </Text>
            </View>
          </View>

          <View style={styles.statChipsRow}>
            <View style={[styles.statChip, { backgroundColor: COLORS.primaryLight }]}>
              <Repeat size={16} color={COLORS.primary} />
              <Text style={styles.statChipValue}>{todaySessions}</Text>
              <Text style={styles.statChipLabel}>{t('repsCount')}</Text>
            </View>
            <View style={[styles.statChip, { backgroundColor: COLORS.infoLight }]}>
              <Clock size={16} color={COLORS.info} />
              <Text style={styles.statChipValue}>{todayMinutes}</Text>
              <Text style={styles.statChipLabel}>{t('min')}</Text>
            </View>
            <View style={[styles.statChip, { backgroundColor: COLORS.tertiaryLight }]}>
              <Sparkles size={16} color={COLORS.tertiary} />
              <Text style={styles.statChipValue}>{fluency}%</Text>
              <Text style={styles.statChipLabel}>{t('fluency')}</Text>
            </View>
          </View>
        </View>

        {/* PLACEMENT TEST CTA — فقط اگر ادمین محتوا ساخته و کاربر هنوز پروفایل ندارد؛
            بعد از داشتنِ پروفایل، راه بازگشت به تست فقط از Drawer است (برای گرفتنِ
            دوباره)، نه این کارت که مخصوصِ «هنوز نداده‌ای» است. */}
        {placementItems && !speakingProfile && !placementCtaDismissed && (
          <TouchableOpacity
            style={styles.placementCtaCard}
            activeOpacity={0.85}
            onPress={() => setPlacementModalVisible(true)}
          >
            <View style={styles.placementCtaIconCircle}>
              <Mic size={20} color={COLORS.primary} />
            </View>
            <View style={styles.placementCtaTextContainer}>
              <Text style={styles.placementCtaTitle}>{t('placementCtaTitle')}</Text>
              <Text style={styles.placementCtaSub}>{t('placementCtaSub')}</Text>
            </View>
            <TouchableOpacity
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              onPress={() => setPlacementCtaDismissed(true)}
            >
              <X size={18} color={COLORS.muted} />
            </TouchableOpacity>
          </TouchableOpacity>
        )}

        {/* QUICK ACCESS: SHADOWING & LEITNER BOX */}
        <View style={styles.quickActionsRow}>
          <TouchableOpacity
            style={[styles.quickCard, styles.quickCardPrimary]}
            onPress={() => primaryScenario && openScene(primaryScenario)}
            activeOpacity={0.85}
            disabled={!primaryScenario}
          >
            <View style={[styles.quickIconCircle, { backgroundColor: 'rgba(255,255,255,0.16)' }]}>
              <Mic size={20} color={COLORS.white} />
            </View>
            <View style={styles.quickTextContainer}>
              <Text style={[styles.quickCardTitle, { color: COLORS.white }]}>{t('shadowing')}</Text>
              <Text style={[styles.quickCardSub, { color: 'rgba(255,255,255,0.8)' }]}>
                {t('continueStory')}
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickCard}
            onPress={() => navigation.navigate('Leitner')}
            activeOpacity={0.85}
          >
            {/* آبی به‌جای بنفش تکراری — تا با کارت شدوئینگ (که خودش بنفشِ
                توپره) از همون نگاه اول جدا دیده شود. */}
            <View style={[styles.quickIconCircle, { backgroundColor: COLORS.infoLight }]}>
              <BookOpen size={20} color={COLORS.info} />
            </View>
            <View style={styles.quickTextContainer}>
              <Text style={styles.quickCardTitle}>{t('leitner')}</Text>
              <Text style={styles.quickCardSub}>
                {dueCount > 0
                  ? `${dueCount} ${t('wordsDue')}`
                  : `${box.length} ${t('wordsSaved')}`}
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* TODAY'S MISSION / CONTINUE STORY SECTION — همان کارتِ همیشگی، فقط
            وقتی /v1/mission/today چیزی برگردانده باشد شخصی‌سازی می‌شود؛ وگرنه
            دقیقاً همان «ادامه داستان»ِ قدیمی (scenes[0]) است. */}
        {featuredScenario && (
          <>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionLabel}>
                {missionScene ? t('todaysMission') : t('continueStory')}
              </Text>
            </View>

            <TouchableOpacity
              activeOpacity={0.9}
              style={styles.storyCard}
              onPress={() => openScene(featuredScenario)}
            >
              <ImageBackground
                source={
                  typeof featuredScenario.imageUri === 'string'
                    ? { uri: featuredScenario.imageUri }
                    : featuredScenario.imageUri
                }
                style={styles.storyImage}
                imageStyle={styles.storyImageStyle}
              >
                <View style={styles.storyScrim} />

                <View style={styles.storyContent}>
                  <Text style={styles.storyCategory}>
                    {(featuredScenario.category || '').toString().toUpperCase()}
                  </Text>
                  <Text style={styles.storyTitle}>{featuredScenario.title}</Text>

                  {missionScene && todaysMission && (
                    <View style={styles.missionBadgesRow}>
                      <View style={styles.missionBadge}>
                        <Text style={styles.missionBadgeText}>{todaysMission.level}</Text>
                      </View>
                      <View style={styles.missionBadge}>
                        <Clock size={12} color={COLORS.white} />
                        <Text style={styles.missionBadgeText}>
                          {todaysMission.estimated_minutes} {t('min')}
                        </Text>
                      </View>
                      <View style={styles.missionBadge}>
                        <Text style={styles.missionBadgeText}>
                          {todaysMission.focus_skill === 'pronunciation'
                            ? t('pronunciation')
                            : todaysMission.focus_skill === 'fluency'
                            ? t('fluency')
                            : t('speaking')}
                        </Text>
                      </View>
                    </View>
                  )}

                  {/* Progress Line */}
                  <View style={styles.storyProgressBg}>
                    <View
                      style={[
                        styles.storyProgressFill,
                        { width: `${featuredScenario.progress || 0}%` },
                      ]}
                    />
                  </View>
                </View>

                {/* Play Circle CTA Overlay */}
                <View style={styles.playOverlayBtn}>
                  <Play size={22} color={COLORS.white} fill={COLORS.white} />
                </View>
              </ImageBackground>
            </TouchableOpacity>
          </>
        )}

        {/* WORLDS SECTION — فقط چند مورد «بعدی» رو پیش‌نمایش می‌ده، نه کل
            مسیر رو؛ وگرنه با صدها صحنه این صفحه خودش یه اسکرول بی‌پایان
            می‌شد. دیدن کل مسیر از دکمه‌ی زیر می‌ره سراغ نقشه. */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionLabel}>{t('worlds')}</Text>
          <TouchableOpacity onPress={() => navigation.navigate('CurriculumMap')}>
            <Text style={styles.viewPathLink}>{t('viewFullPath')}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.worldsList}>
          {homePreviewScenes.map((scenario, index) => (
            <ScenarioCard
              key={scenario.id || index}
              title={scenario.title}
              level={scenario.level || 'Beginner'}
              progress={scenario.progress || 0}
              time={scenario.time || '12 min'}
              imageUri={scenario.imageUri}
              subtitle={scenario.lesson || scenario.title}
              sentencesCount={scenario.sentencesCount || 24}
              isCompleted={!!scenario.isCompleted}
              isLocked={scenario.isLocked}
              isSequenceLocked={scenario.isSequenceLocked}
              onPress={() => openScene(scenario)}
            />
          ))}
        </View>

        {/* Bottom padding for tab bar */}
        <View style={{ height: 90 }} />
      </ScrollView>

      <Modal
        visible={placementModalVisible}
        animationType="slide"
        onRequestClose={() => setPlacementModalVisible(false)}
      >
        <PlacementTestFlow
          items={placementItems}
          onSkip={() => setPlacementModalVisible(false)}
          onDone={() => {
            setPlacementModalVisible(false);
            // بعد از تمام‌شدن (چه اولین بار، چه دوباره از Drawer)، پروفایل را
            // دوباره می‌خوانیم تا بجِ سطح و کارتِ CTA فوراً به‌روز شوند.
            refreshPlacementState();
          }}
        />
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 54,
  },
  header: {
    marginBottom: 20,
  },
  greeting: {
    color: COLORS.textSecondary,
    fontFamily: FONT_FAMILY.medium,
    fontSize: 14,
  },
  headerTitle: {
    color: COLORS.text,
    fontFamily: FONT_FAMILY.bold,
    fontSize: 26,
    marginTop: 2,
    letterSpacing: -0.5,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: 12,
  },
  langBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 4,
  },
  langBadgeText: {
    color: COLORS.text,
    fontFamily: FONT_FAMILY.semiBold,
    fontSize: 12,
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 6,
  },
  streakText: {
    color: COLORS.text,
    fontFamily: FONT_FAMILY.semiBold,
    fontSize: 15,
  },
  xpBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 6,
  },
  xpText: {
    color: COLORS.text,
    fontFamily: FONT_FAMILY.semiBold,
    fontSize: 15,
  },
  menuBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  progressCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 24,
    padding: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 24,
  },
  progressTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 16,
  },
  ringPercentText: {
    color: COLORS.primary,
    fontFamily: FONT_FAMILY.bold,
    fontSize: 18,
  },
  progressTextCol: {
    flex: 1,
  },
  progressCardTitle: {
    color: COLORS.text,
    fontFamily: FONT_FAMILY.semiBold,
    fontSize: 16,
    marginBottom: 4,
  },
  repsText: {
    color: COLORS.textSecondary,
    fontFamily: FONT_FAMILY.medium,
    fontSize: 13,
  },
  repsUnit: {
    color: COLORS.textSecondary,
    fontFamily: FONT_FAMILY.regular,
    fontSize: 12,
  },
  statChipsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  statChip: {
    flex: 1,
    backgroundColor: COLORS.backgroundSoft,
    borderRadius: 14,
    paddingVertical: 10,
    alignItems: 'center',
    gap: 4,
  },
  statChipValue: {
    color: COLORS.text,
    fontFamily: FONT_FAMILY.bold,
    fontSize: 15,
  },
  statChipLabel: {
    color: COLORS.textSecondary,
    fontFamily: FONT_FAMILY.regular,
    fontSize: 11,
  },
  sectionHeader: {
    marginBottom: 12,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionLabel: {
    color: COLORS.textSecondary,
    fontFamily: FONT_FAMILY.semiBold,
    fontSize: 12,
    letterSpacing: 1.1,
  },
  viewPathLink: {
    color: COLORS.primary,
    fontFamily: FONT_FAMILY.semiBold,
    fontSize: 12,
  },
  storyCard: {
    height: 200,
    borderRadius: 28,
    overflow: 'hidden',
    marginBottom: 28,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  storyImage: {
    width: '100%',
    height: '100%',
    justifyContent: 'flex-end',
  },
  storyImageStyle: {
    borderRadius: 28,
  },
  storyScrim: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(12, 16, 23, 0.45)',
  },
  storyContent: {
    padding: 20,
    paddingRight: 80,
  },
  storyCategory: {
    color: COLORS.onPrimaryContainer,
    fontFamily: FONT_FAMILY.bold,
    fontSize: 11,
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  storyTitle: {
    color: COLORS.white,
    fontFamily: FONT_FAMILY.bold,
    fontSize: 22,
    marginBottom: 14,
  },
  missionBadgesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: -6,
    marginBottom: 14,
  },
  missionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  missionBadgeText: {
    color: COLORS.white,
    fontFamily: FONT_FAMILY.bold,
    fontSize: 11,
  },
  storyProgressBg: {
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    borderRadius: 2,
    overflow: 'hidden',
    width: '100%',
  },
  storyProgressFill: {
    height: '100%',
    backgroundColor: COLORS.primaryContainer,
    borderRadius: 2,
  },
  playOverlayBtn: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 6,
  },
  worldsList: {
    gap: 4,
  },
  quickActionsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  quickCard: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 10,
  },
  quickCardPrimary: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  quickIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickTextContainer: {
    flex: 1,
  },
  quickCardTitle: {
    color: COLORS.text,
    fontFamily: FONT_FAMILY.bold,
    fontSize: 14,
  },
  quickCardSub: {
    color: COLORS.textSecondary,
    fontFamily: FONT_FAMILY.medium,
    fontSize: 11,
    marginTop: 2,
  },
  placementCtaCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 12,
    marginBottom: 20,
  },
  placementCtaIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primaryLight,
  },
  placementCtaTextContainer: {
    flex: 1,
  },
  placementCtaTitle: {
    color: COLORS.text,
    fontFamily: FONT_FAMILY.bold,
    fontSize: 14,
  },
  placementCtaSub: {
    color: COLORS.textSecondary,
    fontFamily: FONT_FAMILY.medium,
    fontSize: 11,
    marginTop: 2,
  },
});
