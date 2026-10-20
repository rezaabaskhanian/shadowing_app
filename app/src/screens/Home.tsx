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
  Clapperboard,
  Clock,
  Film,
  Flame,
  Globe,
  Headphones,
  Menu,
  Mic,
  PenLine,
  Play,
  Radio,
  Repeat,
  Sparkles,
  Sprout,
  X,
  Zap,
  Layers,
} from 'lucide-react-native';
import { BENTO_ITEM_COUNT, BENTO_PATTERNS, BentoGrid, BentoSectionHeader, type BentoItem } from '../components/BentoGrid';
import { LEVEL_BADGE_STYLE, LEVEL_LABEL_KEY as SCENE_LEVEL_LABEL_KEY } from '../components/SceneListCard';
import { ProgressRing } from '../components/ProgressRing';
import { AppDrawer } from '../components/AppDrawer';
import { StreakInfoModal } from '../components/StreakInfoModal';
import { XpInfoModal } from '../components/XpInfoModal';
import { useScenes } from '../data/ScenesContext';
import { useVocab, isDue } from '../data/VocabContext';
import { useLanguage } from '../data/i18n';
import { useAuth } from '../data/AuthContext';
import { getUserStreak, getUserSummary, getWeeklyActivity, getSkillsBreakdown } from '../api/progress';
import {
  getAssessmentTest,
  getAssessmentTestV2,
  getMyLevel,
  getSpeakingProfile,
  setMyLevel,
  type AssessmentItem,
  type AssessmentTestV2,
  type MyLevel,
  type SceneLevel,
  type SpeakingProfile,
} from '../api/assessment';
import { getTodaysMission, type TodaysMission } from '../api/mission';
import { PlacementTestFlow } from './PlacementTest';
import { PlacementV2Flow } from './PlacementTest/PlacementV2Flow';
import { COLORS } from '../theme/colors';
import { FONT_FAMILY } from '../theme/typography';
import { difficultyToLevel } from '../api/scenes';
import { getPendingVerbPractice, type VerbPending } from '../api/verbs';
import { SCENE_CATEGORY_LABEL_KEY } from '../data/scenarios';
import { absUrl } from '../api/config';
import { getVideoClips, type VideoClipListItem } from '../api/videoClips';
import { getPodcasts, type Podcast } from '../api/podcasts';
import { getSpeakingTopics, type SpeakingTopic } from '../api/topicSpeaking';
import { getWritingPrompts, type WritingPrompt } from '../api/writing';
import { getCourse, type CourseLesson } from '../api/course';
import { getPaths, type PathSummary } from '../api/path';
import { PathHomeCard } from './Path/PathHomeCard';
import { PathStartSheet } from './Path/PathStartSheet';
import { track } from '../services/analytics';
import { formatDuration } from './Podcast/PodcastListScreen';

// هر بخشِ محتوایی در خانه فقط چند موردِ اول را در یک شبکه‌ی ناهمگون (مستطیل +
// مربع‌ها) نشان می‌دهد؛ بقیه از دکمه‌ی «همه».
const HOME_SECTION_PREVIEW_COUNT = BENTO_ITEM_COUNT;

// رنگِ سطحِ محتواهای غیرصحنه (ویدیو، پادکست، ...) برای بجِ روی کارت.
const CONTENT_LEVEL_BG: Record<string, string> = {
  starter: COLORS.levelStarterBg,
  beginner: COLORS.levelBeginnerBg,
  intermediate: COLORS.levelIntermediateBg,
  advanced: COLORS.levelAdvancedBg,
  proficient: COLORS.levelProficientBg,
};

const LEVEL_LABEL_KEY: Record<string, string> = {
  starter: 'levelStarter',
  beginner: 'levelBeginner',
  intermediate: 'levelIntermediate',
  advanced: 'levelAdvanced',
  proficient: 'levelProficient',
};

/** درس‌های بعدیِ دوره: از اولین درسِ تمام‌نشده به بعد (درس‌های بدون کارت حذف). */
const upcomingLessons = (lessons: CourseLesson[]) => {
  const playable = lessons.filter((l) => l.item_count > 0);
  const firstOpen = playable.findIndex((l) => !l.completed);
  const start = firstOpen === -1 ? 0 : firstOpen;
  return playable.slice(start, start + HOME_SECTION_PREVIEW_COUNT);
};

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
  const { scenes, reload: reloadScenes } = useScenes();
  const { language, setLanguage, t } = useLanguage();
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

  // بخش‌های محتوایی خانه: شکستِ واکشی یا خالی‌بودنِ هر کدام فقط همان بخش را
  // پنهان می‌کند (ورودی‌شان در دراور همیشه هست).
  const [clips, setClips] = React.useState<VideoClipListItem[]>([]);
  const [podcasts, setPodcasts] = React.useState<Podcast[]>([]);
  const [topics, setTopics] = React.useState<SpeakingTopic[]>([]);
  const [prompts, setPrompts] = React.useState<WritingPrompt[]>([]);
  const [courseLessons, setCourseLessons] = React.useState<CourseLesson[]>([]);
  const [paths, setPaths] = React.useState<PathSummary[]>([]);
  useFocusEffect(
    React.useCallback(() => {
      let active = true;
      getVideoClips()
        .then((list) => active && setClips(list))
        .catch(() => active && setClips([]));
      getPodcasts()
        .then((list) => active && setPodcasts(list))
        .catch(() => active && setPodcasts([]));
      getSpeakingTopics()
        .then((list) => active && setTopics(list.slice(0, HOME_SECTION_PREVIEW_COUNT)))
        .catch(() => active && setTopics([]));
      getWritingPrompts()
        .then((list) => active && setPrompts(list.slice(0, HOME_SECTION_PREVIEW_COUNT)))
        .catch(() => active && setPrompts([]));
      getCourse()
        .then((units) => active && setCourseLessons(upcomingLessons(units.flatMap((u) => u.lessons))))
        .catch(() => active && setCourseLessons([]));
      getPaths()
        .then((list) => active && setPaths(list))
        .catch(() => active && setPaths([]));
      return () => {
        active = false;
      };
    }, [])
  );

  // آیتم‌های تست: فقط وقتی ادمین محتوا ساخته باشد پر می‌شوند (وگرنه null، یعنی
  // کل فیچر نامرئی است). برخلاف قبل، مستقل از داشتن/نداشتنِ پروفایلِ فعلی
  // نگه‌داشته می‌شوند — چون هم کارتِ CTA (فقط برای کسی که هنوز نداده) و هم
  // ردیفِ Drawer (برای گرفتنِ دوباره‌ی تست حتی بعد از داشتنِ پروفایل) به این
  // نیاز دارند.
  const [placementItems, setPlacementItems] = React.useState<AssessmentItem[] | null>(null);
  // تست نسخه‌ی ۲ (لغت + شنیدن + تکرار)؛ اگر محتوایش در پنل آماده باشد جای
  // نسخه‌ی ۱ را می‌گیرد، وگرنه null و همان نسخه‌ی ۱ اجرا می‌شود.
  const [placementV2, setPlacementV2] = React.useState<AssessmentTestV2 | null>(null);
  const [speakingProfile, setSpeakingProfile] = React.useState<SpeakingProfile | null>(null);
  const [placementModalVisible, setPlacementModalVisible] = React.useState(false);
  // انتخاب نقطه‌ی شروع مسیر؛ اگر از اینجا به تست رفت، بعد از تست مستقیم وارد مسیر می‌شود.
  const [pathStartVisible, setPathStartVisible] = React.useState(false);
  const startPathAfterTest = React.useRef(false);

  const refreshPlacementState = React.useCallback(() => {
    let active = true;
    getAssessmentTestV2()
      .then((test) => {
        if (active) setPlacementV2(test);
      })
      .catch(() => {
        if (active) setPlacementV2(null);
      });
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

  // سطح مؤثر کاربر (انتخاب دستی در Drawer، وگرنه نتیجه‌ی تست) — همان سطحی
  // که بک‌اند با آن صحنه‌ها را فیلتر می‌کند.
  const [myLevel, setMyLevelState] = React.useState<MyLevel | null>(null);
  const refreshMyLevel = React.useCallback(() => {
    let active = true;
    getMyLevel()
      .then((l) => active && setMyLevelState(l))
      .catch(() => active && setMyLevelState(null));
    return () => {
      active = false;
    };
  }, []);
  useFocusEffect(refreshMyLevel);

  // یادآوری افعال چندمعنایی: فقط وقتی کاربر معنای تازه‌ای در درس‌ها دیده ولی
  // هنوز تمرینش نکرده؛ در غیر این صورت کارتی نشان داده نمی‌شود.
  const [pendingVerb, setPendingVerb] = React.useState<VerbPending | null>(null);
  useFocusEffect(
    React.useCallback(() => {
      let active = true;
      getPendingVerbPractice()
        .then((p) => active && setPendingVerb(p))
        .catch(() => active && setPendingVerb(null));
      return () => {
        active = false;
      };
    }, [])
  );

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

  // بک‌اند از قبل فقط صحنه‌های مجاز برای سطح کاربر را برمی‌گرداند (به‌علاوه‌ی
  // دو پیش‌نمایشِ هر سطح بالاتر)؛ خانه از این هم فشرده‌تر است: فقط صحنه‌های
  // ناتمامِ دقیقاً همان سطح کاربر.
  // تا سطح لود نشده چیزی حدس نمی‌زنیم (وگرنه کاربر متوسط لحظه‌ای صحنه‌های
  // مبتدی را می‌دید).
  const myUpcomingScenes = myLevel
    ? scenes.filter((s) => s.level === difficultyToLevel(myLevel.scene_level) && !s.isCompleted)
    : [];
  const primaryScenario = myUpcomingScenes[0] || scenes[0] || null;

  // تصویر/عنوان/قفل‌بودن از روی صحنه‌ی از قبل بارگذاری‌شده گرفته می‌شود؛
  // فقط برچسب‌های سطح/زمان/مهارت از پاسخِ /v1/mission/today می‌آید. اگر
  // صحنه‌ی پیشنهادی هنوز در لیستِ محلی نباشد (تازه اضافه شده و کش نشده)
  // بی‌سروصدا به همان «ادامه داستان»ِ قدیمی برمی‌گردیم.
  const missionScene = todaysMission
    ? scenes.find((s) => s.id === todaysMission.scene_id) || null
    : null;
  const featuredScenario = missionScene || primaryScenario;

  // پیش‌نمایش خانه: فقط چند صحنه‌ی ناتمامِ سطح کاربر، نه کل مسیر — دیدن
  // همه (با تیکِ تمام‌شده‌ها) از دکمه‌ی «مسیر کامل» به نقشه می‌ره.
  const HOME_PREVIEW_COUNT = HOME_SECTION_PREVIEW_COUNT;
  const homePreviewScenes = myUpcomingScenes.slice(0, HOME_PREVIEW_COUNT);

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'fa' : 'en');
  };

  // اگه صحنه قفله (خارج از سقف رایگان و بدون اشتراک فعال)، به‌جای رفتن
  // مستقیم به تمرین، پی‌وال (Paywall) باز میشه.
  const openScene = (scenario: { id: string; isLocked?: boolean }) => {
    if (scenario.isLocked) {
      navigation.navigate('Paywall');
      return;
    }
    navigation.navigate('Shadowing', { scenarioId: scenario.id });
  };

  // ویدیوها دو بخشِ جدا دارند: ساخته‌ی خودمان (Google Flow) و تکه‌هایی از فیلم‌ها.
  const flowClips = clips.filter((c) => c.source !== 'movie').slice(0, HOME_SECTION_PREVIEW_COUNT);
  const movieClips = clips.filter((c) => c.source === 'movie').slice(0, HOME_SECTION_PREVIEW_COUNT);
  // دوره‌ی شروع برای کاربرِ مبتدی بالای «دنیای مکالمات» می‌آید؛ برای بقیه آخرِ صفحه.
  const isBeginner = myLevel ? ['Starter', 'Beginner'].includes(difficultyToLevel(myLevel.scene_level)) : false;

  const levelLabel = (level?: string) => t(LEVEL_LABEL_KEY[level || ''] || LEVEL_LABEL_KEY.beginner);
  const seconds = (s: number) => t('topicSpeakingSeconds').replace('{s}', String(s));
  const best = (attempts: number, score: number) =>
    attempts > 0 ? ` · ${t('topicSpeakingBest').replace('{score}', String(score))}` : '';

  const contentBadge = (level?: string) => ({
    label: levelLabel(level),
    color: CONTENT_LEVEL_BG[level || ''] || CONTENT_LEVEL_BG.beginner,
  });
  const uriImage = (path?: string) => (path ? { uri: absUrl(path) } : undefined);

  const clipItems = (list: VideoClipListItem[], source: 'flow' | 'movie'): BentoItem[] =>
    list.map((clip) => ({
      key: clip.id,
      title: clip.title,
      subtitle: source === 'movie' && clip.movie_title ? `🎞 ${clip.movie_title}` : clip.description_fa || undefined,
      meta:
        (clip.duration_seconds > 0 ? `${seconds(clip.duration_seconds)} · ` : '') +
        t('videoClipsCharacters').replace('{n}', String(clip.speaker_count)) +
        best(clip.attempts, clip.best_score),
      image: uriImage(clip.poster_url),
      emoji: source === 'movie' ? '🍿' : '🎬',
      badge: contentBadge(clip.level),
      completed: clip.attempts > 0,
      onPress: () => navigation.navigate('VideoClip', { clipId: clip.id, openedAt: Date.now() }),
    }));

  // پادکست‌ها دو بخشِ جدا دارند: درسی (درباره‌ی صحنه/موضوعِ درس‌ها) و منتخب (موضوعِ آزاد).
  const lessonPodcasts = podcasts.filter((p) => p.kind !== 'featured').slice(0, HOME_SECTION_PREVIEW_COUNT);
  const featuredPodcasts = podcasts.filter((p) => p.kind === 'featured').slice(0, HOME_SECTION_PREVIEW_COUNT);
  const podcastItems = (list: Podcast[], emoji: string): BentoItem[] =>
    list.map((p) => ({
      key: p.id,
      title: p.title,
      subtitle: p.description_fa || undefined,
      meta: `🎧 ${formatDuration(p.duration_seconds)}`,
      image: uriImage(p.cover_url),
      emoji,
      badge: contentBadge(p.level),
      onPress: () => navigation.navigate('Podcast', { podcastId: p.id, openedAt: Date.now() }),
    }));

  // بخش‌های خانه به ترتیب نمایش؛ بخشِ خالی کلاً حذف می‌شود و چیدمانِ شبکه
  // (مستطیل بالا / کارت بلند / مستطیل پایین) بین بخش‌های باقی‌مانده نوبتی است.
  type HomeSection = {
    key: string;
    title: string;
    icon: React.ReactNode;
    accent: string;
    actionLabel: string;
    onAction: () => void;
    items: BentoItem[];
    emptyText?: string;
  };

  const courseSection: HomeSection = {
    key: 'course',
    title: t('courseTitle'),
    icon: <Sprout size={16} color={COLORS.white} />,
    accent: COLORS.success,
    actionLabel: t('homeSeeAll'),
    onAction: () => navigation.navigate('CourseHome'),
    items: courseLessons.map((lesson) => ({
      key: lesson.id,
      title: lesson.title_fa || lesson.title_en,
      subtitle: lesson.goal_fa || lesson.title_en || undefined,
      meta: lesson.completed ? '⭐'.repeat(Math.max(1, lesson.stars)) : undefined,
      emoji: lesson.emoji || '🌱',
      completed: lesson.completed,
      locked: !lesson.unlocked,
      onPress: lesson.unlocked
        ? () => navigation.navigate('CourseLesson', { lessonId: lesson.id, openedAt: Date.now() })
        : undefined,
    })),
  };

  const worldsSection: HomeSection = {
    key: 'worlds',
    title: t('worlds'),
    icon: <Globe size={16} color={COLORS.white} />,
    accent: COLORS.primary,
    actionLabel: t('viewFullPath'),
    onAction: () => navigation.navigate('CurriculumMap'),
    emptyText: myLevel && scenes.length > 0 ? t('homeLevelAllDone') : undefined,
    items: homePreviewScenes.map((scenario, index) => {
      const level = scenario.level || 'Beginner';
      return {
        key: scenario.id || String(index),
        title: scenario.title,
        subtitle: scenario.category && SCENE_CATEGORY_LABEL_KEY[scenario.category]
          ? t(SCENE_CATEGORY_LABEL_KEY[scenario.category])
          : undefined,
        meta: scenario.time || undefined,
        image: typeof scenario.imageUri === 'string' ? { uri: scenario.imageUri } : scenario.imageUri,
        emoji: '🌍',
        badge: {
          label: t(SCENE_LEVEL_LABEL_KEY[level] || SCENE_LEVEL_LABEL_KEY.Beginner),
          color: (LEVEL_BADGE_STYLE[level] || LEVEL_BADGE_STYLE.Beginner).bg,
        },
        progress: scenario.progress || 0,
        completed: !!scenario.isCompleted,
        locked: scenario.isLocked,
        onPress: () => openScene(scenario),
      };
    }),
  };

  // مسیری که کاربر شروع کرده؛ وگرنه مسیر سطح خودش (یا اولین مسیر) به‌عنوان دعوت.
  const homePath =
    paths.find((p) => p.started) ||
    paths.find((p) => p.level === myLevel?.scene_level) ||
    paths.find((p) => p.level === 'starter') ||
    paths[0];
  const pathLevels = paths.map((p) => p.level);

  /** نزدیک‌ترین مسیر موجود هم‌سطح یا پایین‌تر از سطح کاربر. */
  const pathLevelFor = (level: string): string | undefined => {
    const order = ['starter', 'beginner', 'intermediate', 'advanced', 'proficient'];
    for (let i = order.indexOf(level); i >= 0; i--) {
      if (pathLevels.includes(order[i])) return order[i];
    }
    return pathLevels[0];
  };

  const startPath = async (level: SceneLevel, manual: boolean) => {
    if (manual) {
      try {
        const updated = await setMyLevel(level);
        setMyLevelState(updated);
        reloadScenes();
      } catch {
        // ذخیره‌ی سطح نشد؛ مسیر را باز هم باز می‌کنیم.
      }
    }
    track('path_start_choice', manual ? 'manual' : 'continue');
    setPathStartVisible(false);
    navigation.navigate('PathHome', { level });
  };

  const allHomeSections: HomeSection[] = [
    ...(isBeginner ? [courseSection] : []),
    worldsSection,
    {
      key: 'flow',
      title: t('homeFlowVideos'),
      icon: <Clapperboard size={16} color={COLORS.white} />,
      accent: COLORS.levelIntermediateBg,
      actionLabel: t('homeSeeAll'),
      onAction: () => navigation.navigate('VideoClipList', { source: 'flow' }),
      items: clipItems(flowClips, 'flow'),
    },
    {
      key: 'movie',
      title: t('homeMovieClips'),
      icon: <Film size={16} color={COLORS.white} />,
      accent: COLORS.error,
      actionLabel: t('homeSeeAll'),
      onAction: () => navigation.navigate('VideoClipList', { source: 'movie' }),
      items: clipItems(movieClips, 'movie'),
    },
    {
      key: 'podcast',
      title: featuredPodcasts.length > 0 ? t('podcastLessonsTitle') : t('podcastTitle'),
      icon: <Headphones size={16} color={COLORS.white} />,
      accent: COLORS.audioMine,
      actionLabel: t('homeSeeAll'),
      onAction: () => navigation.navigate('PodcastList', { kind: 'lesson' }),
      items: podcastItems(lessonPodcasts, '🎧'),
    },
    {
      key: 'featuredPodcast',
      title: t('podcastFeaturedTitle'),
      icon: <Radio size={16} color={COLORS.white} />,
      accent: COLORS.pink,
      actionLabel: t('homeSeeAll'),
      onAction: () => navigation.navigate('PodcastList', { kind: 'featured' }),
      items: podcastItems(featuredPodcasts, '⭐'),
    },
    {
      key: 'topics',
      title: t('topicSpeakingTitle'),
      icon: <Mic size={16} color={COLORS.white} />,
      accent: COLORS.warning,
      actionLabel: t('homeSeeAll'),
      onAction: () => navigation.navigate('TopicList'),
      items: topics.map((topic) => ({
        key: topic.id,
        title: topic.title,
        subtitle: topic.prompt_fa || undefined,
        meta: `${topic.images?.length ? `🖼 ${t('pictureStoryBadge')} · ` : '🎤 '}${seconds(topic.duration_seconds)}${best(
          topic.attempts,
          topic.best_score
        )}`,
        image: uriImage(topic.image_url),
        emoji: '🗣️',
        badge: contentBadge(topic.level),
        completed: topic.attempts > 0,
        onPress: () => navigation.navigate('TopicSpeaking', { topic, openedAt: Date.now() }),
      })),
    },
    {
      key: 'writing',
      title: t('writingTitle'),
      icon: <PenLine size={16} color={COLORS.white} />,
      accent: COLORS.levelAdvancedBg,
      actionLabel: t('homeSeeAll'),
      onAction: () => navigation.navigate('WritingList'),
      items: prompts.map((prompt) => ({
        key: prompt.id,
        title: prompt.title,
        subtitle: prompt.prompt_fa || undefined,
        meta: `✍️ ${t('writingWords').replace('{n}', `${prompt.min_words}–${prompt.max_words}`)}${best(
          prompt.attempts,
          prompt.best_score
        )}`,
        image: uriImage(prompt.image_url),
        emoji: '✍️',
        badge: contentBadge(prompt.level),
        completed: prompt.attempts > 0,
        onPress: () => navigation.navigate('Writing', { prompt, openedAt: Date.now() }),
      })),
    },
    ...(!isBeginner ? [courseSection] : []),
  ];
  const homeSections = allHomeSections.filter((section) => section.items.length > 0 || !!section.emptyText);

  const todayPercent = Math.min(100, Math.round((todaySessions / DAILY_SESSIONS_GOAL) * 100));

  // اسمِ کاربر واقعی؛ اگر ثبت نشده بود، بدون اسم («عصر بخیر!») نشان می‌دهیم
  // نه یک اسمِ ثابت جعلی.
  const nameSuffix = user?.nickname
    ? language === 'fa'
      ? `، ${user.nickname}`
      : `, ${user.nickname}`
    : '';

  // مشترک بین فلوی نسخه‌ی ۱ و ۲
  const placementFlowHandlers = {
    onSkip: () => {
      setPlacementModalVisible(false);
      // از تست صرف‌نظر کرد؛ دوباره گزینه‌های شروع مسیر را نشان بده.
      if (startPathAfterTest.current) {
        startPathAfterTest.current = false;
        setPathStartVisible(true);
      }
    },
    onDone: () => {
      track('placement_completed');
      setPlacementModalVisible(false);
      if (startPathAfterTest.current) {
        startPathAfterTest.current = false;
        getMyLevel()
          .then((l) => {
            const level = pathLevelFor(l.scene_level);
            if (level) navigation.navigate('PathHome', { level });
          })
          .catch(() => {});
      }
      // بعد از تمام‌شدن (چه اولین بار، چه دوباره از Drawer)، پروفایل را
      // دوباره می‌خوانیم تا بجِ سطح و کارتِ CTA فوراً به‌روز شوند؛ لیست
      // صحنه‌ها هم به سطح وابسته است (بک‌اند بر اساسش فیلتر می‌کند).
      refreshPlacementState();
      refreshMyLevel();
      reloadScenes();
    },
  };

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
          onOpenPlacementTest={placementItems || placementV2 ? () => setPlacementModalVisible(true) : undefined}
          speakingLevel={speakingProfile?.level}
          myLevel={myLevel}
          onLevelChange={(level) => {
            setMyLevelState(level);
            reloadScenes();
          }}
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

        {/* مسیر آموزشی: «جلسه‌ی بعدی من» برای کسی که شروع کرده، و دعوت به شروع برای مبتدی‌ها */}
        {homePath && (
          <PathHomeCard
            path={homePath}
            onPress={() =>
              homePath.started
                ? navigation.navigate('PathHome', { level: homePath.level })
                : setPathStartVisible(true)
            }
          />
        )}

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

        {pendingVerb && (
          <TouchableOpacity
            style={styles.placementCtaCard}
            activeOpacity={0.85}
            onPress={() => navigation.navigate('VerbQuiz', { verbId: pendingVerb.verb_id })}
          >
            <View style={styles.placementCtaIconCircle}>
              <Layers size={20} color={COLORS.primary} />
            </View>
            <View style={styles.placementCtaTextContainer}>
              <Text style={styles.placementCtaTitle}>
                {t('verbPendingTitle').replace('{verb}', pendingVerb.lemma)}
              </Text>
              <Text style={styles.placementCtaSub}>{t('verbPendingSub')}</Text>
            </View>
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
                  {featuredScenario.category ? (
                    // زدن روی دسته → تب صحنه‌ها با همین دسته فیلتر می‌شود
                    <TouchableOpacity
                      hitSlop={8}
                      onPress={() => navigation.navigate('Scenes', { category: featuredScenario.category })}
                    >
                      <Text style={styles.storyCategory}>
                        {SCENE_CATEGORY_LABEL_KEY[featuredScenario.category]
                          ? t(SCENE_CATEGORY_LABEL_KEY[featuredScenario.category])
                          : featuredScenario.category.toString().toUpperCase()}
                      </Text>
                    </TouchableOpacity>
                  ) : null}
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

        {homeSections.map((section, index) => (
          <View key={section.key}>
            <BentoSectionHeader
              title={section.title}
              icon={section.icon}
              accent={section.accent}
              actionLabel={section.actionLabel}
              onAction={section.onAction}
            />
            {section.items.length === 0 && section.emptyText ? (
              <Text style={styles.allDoneText}>{section.emptyText}</Text>
            ) : (
              <BentoGrid
                items={section.items}
                pattern={BENTO_PATTERNS[index % BENTO_PATTERNS.length]}
                accent={section.accent}
              />
            )}
          </View>
        ))}

        {/* Bottom padding for tab bar */}
        <View style={{ height: 90 }} />
      </ScrollView>

      <PathStartSheet
        visible={pathStartVisible}
        onClose={() => setPathStartVisible(false)}
        pathLevels={pathLevels}
        myLevel={myLevel}
        onTakeTest={
          placementItems || placementV2
            ? () => {
                track('path_start_choice', 'test');
                startPathAfterTest.current = true;
                setPathStartVisible(false);
                setPlacementModalVisible(true);
              }
            : null
        }
        onStart={startPath}
      />

      <Modal
        visible={placementModalVisible}
        animationType="slide"
        onRequestClose={() => setPlacementModalVisible(false)}
      >
        {placementV2 ? (
          <PlacementV2Flow test={placementV2} {...placementFlowHandlers} />
        ) : (
          <PlacementTestFlow items={placementItems} {...placementFlowHandlers} />
        )}
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
  sectionLabel: {
    color: COLORS.textSecondary,
    fontFamily: FONT_FAMILY.semiBold,
    fontSize: 12,
    letterSpacing: 1.1,
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
  allDoneText: {
    color: COLORS.textSecondary,
    fontFamily: FONT_FAMILY.medium,
    fontSize: 14,
    textAlign: 'center',
    paddingVertical: 16,
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
