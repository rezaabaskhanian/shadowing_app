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
  Flag,
  Sprout,
  TrendingUp,
  X,
  Layers,
  Music,
  ChevronLeft,
} from 'lucide-react-native';
import { type BentoItem } from '../components/BentoGrid';
import { HomeGroup, type HomeGroupTab } from '../components/HomeGroup';
import { LEVEL_BADGE_STYLE, LEVEL_LABEL_KEY as SCENE_LEVEL_LABEL_KEY } from '../components/SceneListCard';
import { ProgressRing } from '../components/ProgressRing';
import { AppDrawer } from '../components/AppDrawer';
import { StreakInfoModal } from '../components/StreakInfoModal';
import { XpInfoModal } from '../components/XpInfoModal';
import { useScenes } from '../data/ScenesContext';
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
import { COLORS, hexToRgba } from '../theme/colors';
import { SHADOWS } from '../theme/elevation';
import { FONT_FAMILY } from '../theme/typography';
import { difficultyToLevel } from '../api/scenes';
import { getPendingVerbPractice, type VerbPending } from '../api/verbs';
import { SCENE_CATEGORY_LABEL_KEY } from '../data/scenarios';
import { absUrl } from '../api/config';
import { getVideoClips, type VideoClipListItem } from '../api/videoClips';
import { getGoalPlan, type GoalPlanView } from '../api/goalPlan';
import { getPodcasts, getStories, atOrBelowLevel, type Podcast } from '../api/podcasts';
import { getSongs, type Song } from '../api/songs';
import { getReadChapters, groupStories } from '../services/storyProgress';
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
// هر بخش خانه فقط دو کارت کوچک کنار هم نشان می‌دهد؛ بقیه با «همه را ببین».
const HOME_SECTION_PREVIEW_COUNT = 2;
const HOME_SHORT_SECTION_COUNT = HOME_SECTION_PREVIEW_COUNT;

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
  const [stories, setStories] = React.useState<Podcast[]>([]);
  const [songs, setSongs] = React.useState<Song[]>([]);
  const [readChapters, setReadChapters] = React.useState<Set<string>>(new Set());
  const [courseLessons, setCourseLessons] = React.useState<CourseLesson[]>([]);
  // null = هنوز نیامده؛ تا معلوم نشده کاربر مسیر را شروع کرده یا نه، کارت مأموریت را نشان
  // نمی‌دهیم (وگرنه یک لحظه دیده می‌شد و بعد غیب می‌شد).
  const [paths, setPaths] = React.useState<PathSummary[] | null>(null);
  useFocusEffect(
    React.useCallback(() => {
      let active = true;
      getVideoClips()
        .then((list) => active && setClips(list))
        .catch(() => active && setClips([]));
      getPodcasts()
        .then((list) => active && setPodcasts(list))
        .catch(() => active && setPodcasts([]));
      // فهرست کامل نگه داشته می‌شود و موقع نمایش به سطح کاربر (و پایین‌تر) محدود می‌شود.
      getSpeakingTopics()
        .then((list) => active && setTopics(list))
        .catch(() => active && setTopics([]));
      getWritingPrompts()
        .then((list) => active && setPrompts(list))
        .catch(() => active && setPrompts([]));
      getStories()
        .then((list) => active && setStories(list))
        .catch(() => active && setStories([]));
      getReadChapters().then((read) => active && setReadChapters(read));
      getSongs()
        .then((list) => active && setSongs(list))
        .catch(() => active && setSongs([]));
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

  // بعد از ۲۸ روز از آخرین تست، پیشنهاد تست دوباره (پیشرفت قابل‌دیدن)
  const retestDue = React.useMemo(() => {
    if (!speakingProfile?.assessed_at || !(placementItems || placementV2)) return false;
    const ageDays = (Date.now() - new Date(speakingProfile.assessed_at).getTime()) / 86400000;
    return ageDays >= 28;
  }, [speakingProfile, placementItems, placementV2]);

  // برنامه‌ی هدف‌محور (کارت «برنامه‌ی من»)
  const [goalPlan, setGoalPlan] = React.useState<GoalPlanView | null>(null);
  useFocusEffect(
    React.useCallback(() => {
      let active = true;
      getGoalPlan()
        .then((p) => active && setGoalPlan(p))
        .catch(() => {});
      return () => {
        active = false;
      };
    }, [])
  );

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
        setPlacementItems(!items || items.length === 0 ? null : items);
      })
      .catch(() => {
        if (active) setPlacementItems(null);
      });
    // پروفایل مستقل از محتوای نسخه‌ی ۱ خوانده می‌شود (تاریخ آخرین تست برای کارت تست دوباره)
    getSpeakingProfile()
      .then((profile) => {
        if (active) setSpeakingProfile(profile);
      })
      .catch(() => {
        if (active) setSpeakingProfile(null);
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

  // برچسب سطح فقط وقتی سطح محتوا با سطح کاربر فرق دارد؛ برچسب «مبتدی» روی همه‌ی کارت‌ها تکرار بی‌فایده بود.
  const contentBadge = (level?: string) =>
    level && level.toLowerCase() === (myLevel?.scene_level || '').toLowerCase()
      ? undefined
      : {
          label: levelLabel(level),
          color: CONTENT_LEVEL_BG[level || ''] || CONTENT_LEVEL_BG.beginner,
        };
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
  // همه‌ی محتوای خانه فقط تا سطحِ کاربر؛ سطحِ بالاتر هرگز (پایین‌تر اشکالی ندارد).
  const userLevel = myLevel?.scene_level;
  const levelPodcasts = atOrBelowLevel(podcasts, userLevel);
  const lessonPodcasts = levelPodcasts.filter((p) => p.kind !== 'featured').slice(0, HOME_SECTION_PREVIEW_COUNT);
  const allFeaturedPodcasts = levelPodcasts.filter((p) => p.kind === 'featured');
  const levelTopics = atOrBelowLevel(topics, userLevel).slice(0, HOME_SECTION_PREVIEW_COUNT);
  const levelPrompts = atOrBelowLevel(prompts, userLevel).slice(0, HOME_SECTION_PREVIEW_COUNT);
  // هر داستان یک کارت: فصلِ بعدیِ نخوانده؛ داستان‌های تمام‌شده آخر می‌روند.
  const allStorySeries = groupStories(atOrBelowLevel(stories, userLevel), readChapters).sort(
    (a, b) => Number(a.readCount === a.chapters.length) - Number(b.readCount === b.chapters.length)
  );
  // «برای امروز»: یک پادکست و یک داستان هم‌سطح کاربر (منتخب جلوتر از درسی؛ داستانِ تمام‌نشده جلوتر).
  const todayPodcast = allFeaturedPodcasts[0] ?? lessonPodcasts[0];
  const todayStory = allStorySeries.find((st) => st.readCount < st.chapters.length) ?? allStorySeries[0];
  // بخش‌های خانه همان‌هایی را که در «برای امروز» آمده تکرار نمی‌کنند.
  const featuredPodcasts = allFeaturedPodcasts.filter((p) => p.id !== todayPodcast?.id).slice(0, HOME_SHORT_SECTION_COUNT);
  const storySeries = allStorySeries.filter((st) => st !== todayStory).slice(0, HOME_SHORT_SECTION_COUNT);
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
        badge:
          level.toLowerCase() === (myLevel?.scene_level || '').toLowerCase()
            ? undefined
            : {
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
  const pathList = paths ?? [];
  const homePath =
    pathList.find((p) => p.started) ||
    pathList.find((p) => p.level === myLevel?.scene_level) ||
    pathList.find((p) => p.level === 'starter') ||
    pathList[0];
  const pathLevels = pathList.map((p) => p.level);

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
      key: 'stories',
      title: t('homeStories'),
      icon: <BookOpen size={16} color={COLORS.white} />,
      accent: COLORS.levelIntermediateBg,
      actionLabel: t('homeSeeAll'),
      onAction: () => navigation.navigate('StoryList'),
      items: storySeries.map((st) => ({
        key: st.title,
        title: st.title,
        subtitle: `${t('storyChapterN').replace('{n}', String(st.next.chapter_no || 1))} · ${st.next.title}`,
        meta: `📖 ${t('storyChaptersProgress')
          .replace('{done}', String(st.readCount))
          .replace('{total}', String(st.chapters.length))}`,
        image: uriImage(st.cover_url),
        emoji: '📖',
        badge: contentBadge(st.level),
        completed: st.readCount === st.chapters.length,
        onPress: () => navigation.navigate('Story', { storyId: st.next.id, openedAt: Date.now() }),
      })),
    },
    {
      key: 'songs',
      title: t('homeSongs'),
      icon: <Music size={16} color={COLORS.white} />,
      accent: COLORS.pink,
      actionLabel: t('homeSeeAll'),
      onAction: () => navigation.navigate('SongList'),
      items: atOrBelowLevel(songs, userLevel)
        .slice(0, HOME_SHORT_SECTION_COUNT)
        .map((song) => ({
          key: song.id,
          title: song.title,
          subtitle: song.artist || song.description_fa || undefined,
          meta: song.instrumental_url ? `🎤 ${t('songSingAlongBadge')}` : '🎵',
          image: uriImage(song.cover_url),
          emoji: '🎵',
          badge: contentBadge(song.level),
          onPress: () => navigation.navigate('Song', { songId: song.id, openedAt: Date.now() }),
        })),
    },
    {
      key: 'topics',
      title: t('topicSpeakingTitle'),
      icon: <Mic size={16} color={COLORS.white} />,
      accent: COLORS.warning,
      actionLabel: t('homeSeeAll'),
      onAction: () => navigation.navigate('TopicList'),
      items: levelTopics.map((topic) => ({
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
      items: levelPrompts.map((prompt) => ({
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
  // بخش‌ها در سه دسته: ادامه‌ی یادگیری، کتابخانه (شنیدن و خواندن)، تمرین (صحبت و نوشتن).
  // هر دسته یک لینک «همه» دارد که به همان نوعِ انتخاب‌شده در زبانه‌ها می‌رود.
  const toTab = (sec: HomeSection, allLabel?: string): HomeGroupTab => ({
    key: sec.key,
    label: sec.title,
    accent: sec.accent,
    items: sec.items,
    onAll: sec.onAction,
    emptyText: sec.emptyText,
    allLabel,
  });
  const byKey = (k: string) => allHomeSections.find((sec) => sec.key === k);
  const pick = (keys: string[]) => keys.map(byKey).filter((x): x is HomeSection => !!x);
  const learnTabs = [
    ...(isBeginner ? [toTab(courseSection)] : []),
    toTab(worldsSection, t('viewFullPath')),
  ];
  const libraryTabs = pick(['podcast', 'featuredPodcast', 'stories', 'songs', 'flow', 'movie']).map((sec) => toTab(sec));
  const practiceTabs = pick(['topics', 'writing']).map((sec) => toTab(sec));

  // «برای امروز»: یک پادکست و یک داستان هم‌سطح کاربر (منتخب جلوتر از درسی؛ داستانِ تمام‌نشده جلوتر).


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

            {/* نشان XP از سربرگ برداشته شد تا سربرگ خلوت شود (XP در صفحه‌ی پیشرفت هست). */}

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

        {/* TODAY'S MISSION / CONTINUE STORY SECTION — همان کارتِ همیشگی، فقط
            وقتی /v1/mission/today چیزی برگردانده باشد شخصی‌سازی می‌شود؛ وگرنه
            دقیقاً همان «ادامه داستان»ِ قدیمی (scenes[0]) است. */}
        {/* کارت «مأموریت امروز» فقط برای کسی که هنوز مسیر را شروع نکرده؛ وگرنه با «جلسه‌ی
            بعدی من» رقابت می‌کرد و کاربر نمی‌دانست کدام را بزند. */}
        {featuredScenario && paths !== null && !homePath?.started && (
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

        {/* کارت «تمرین آزاد» موقتاً برداشته شد؛ بخش‌های پایین خانه همین دسترسی را می‌دهند (برای برگرداندن، کامنت را باز کن).
        <View style={styles.freePracticeCard}>
          <Text style={styles.homeCardTitle}>{t('homeFreePractice')}</Text>
          <View style={styles.freePracticeRow}>
            {[
              { key: 'shadow', label: t('shadowing'), Icon: Mic, color: COLORS.primary, onPress: () => navigation.navigate('Scenes') },
              { key: 'podcast', label: t('homePickPodcast'), Icon: Headphones, color: COLORS.secondary, onPress: () => navigation.navigate('PodcastList') },
              { key: 'story', label: t('homePickStory'), Icon: BookOpen, color: COLORS.levelIntermediateBg, onPress: () => navigation.navigate('StoryList') },
              { key: 'writing', label: t('homePickWriting'), Icon: PenLine, color: COLORS.levelAdvancedBg, onPress: () => navigation.navigate('WritingList') },
            ].map((tile) => (
              <TouchableOpacity key={tile.key} style={styles.freeTile} onPress={tile.onPress} activeOpacity={0.85}>
                <View style={[styles.freeTileIcon, { backgroundColor: hexToRgba(tile.color, 0.12) }]}>
                  <tile.Icon size={24} color={tile.color} />
                </View>
                <Text style={styles.freeTileLabel} numberOfLines={1}>
                  {tile.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
        */}

        {/* کارت «سایه‌زنی امروز» موقتاً برداشته شد تا خانه بدون آن دیده شود (برای برگرداندن، این کامنت را باز کن).
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
        */}

        {/* مسیرهای فرعی (برنامه‌ی هدف، تست دوباره، تمرین فعل) لینک‌های متنی کوچک زیر کارت اصلی‌اند،
            نه کارت‌های هم‌وزن آن؛ تا «ادامه‌ی جلسه» تنها اقدام اصلی صفحه بماند. */}
        <View style={styles.sideLinks}>
          <TouchableOpacity style={styles.sideLink} onPress={() => navigation.navigate('GoalPlan')} hitSlop={6}>
            <Flag size={15} color={COLORS.textSecondary} />
            <Text style={styles.sideLinkText} numberOfLines={1}>
              {goalPlan
                ? `${t('goalPlanTitle')} · ${t('goalPlanReadyOf')
                    .replace('{a}', String(goalPlan.ready))
                    .replace('{b}', String(goalPlan.in_plan_count))}`
                : t('goalPlanHomeTitle')}
            </Text>
            <ChevronLeft size={15} color={COLORS.primary} />
          </TouchableOpacity>
          {retestDue && (
            <TouchableOpacity
              style={styles.sideLink}
              onPress={() => {
                track('retest_card_tap');
                setPlacementModalVisible(true);
              }}
              hitSlop={6}
            >
              <TrendingUp size={15} color={COLORS.textSecondary} />
              <Text style={styles.sideLinkText} numberOfLines={1}>{t('retestLink')}</Text>
              <ChevronLeft size={15} color={COLORS.primary} />
            </TouchableOpacity>
          )}
          {pendingVerb && (
            <TouchableOpacity
              style={styles.sideLink}
              onPress={() => navigation.navigate('VerbQuiz', { verbId: pendingVerb.verb_id })}
              hitSlop={6}
            >
              <Layers size={15} color={COLORS.textSecondary} />
              <Text style={styles.sideLinkText} numberOfLines={1}>
                {t('verbPendingTitle').replace('{verb}', pendingVerb.lemma)}
              </Text>
              <ChevronLeft size={15} color={COLORS.primary} />
            </TouchableOpacity>
          )}
        </View>

        {/* کارت‌های سریع «سایه‌زنی» و «لایتنر» برداشته شدند؛ هر دو در نوار پایین هستند. */}
        {/* ادامه‌ی یادگیری: صحنه‌های سطح (و قدم اول برای مبتدی)، با یک لینک «مسیر کامل». */}
        <HomeGroup title={t('homeGroupLearn')} tabs={learnTabs} allLabel={t('homeSeeAll')} />

        {/* برای امروز: یک پادکست و یک داستان با عکس */}
        {(todayPodcast || todayStory) && (
          <View style={styles.todayPicksCard}>
            <Text style={styles.homeCardTitle}>{t('homeForToday')}</Text>
            <View style={styles.todayPicksRow}>
              {todayPodcast && (
                <TouchableOpacity
                  style={styles.todayPick}
                  activeOpacity={0.85}
                  onPress={() => navigation.navigate('Podcast', { podcastId: todayPodcast.id, openedAt: Date.now() })}
                >
                  <ImageBackground
                    source={uriImage(todayPodcast.cover_url) ?? undefined}
                    style={styles.todayPickImage}
                    imageStyle={styles.todayPickImageRadius}
                  >
                    <View style={styles.todayPickKind}>
                      <Headphones size={13} color={COLORS.white} />
                      <Text style={styles.todayPickKindText}>{t('homePickPodcast')}</Text>
                    </View>
                  </ImageBackground>
                  <Text style={styles.todayPickTitle} numberOfLines={2}>
                    {todayPodcast.title}
                  </Text>
                </TouchableOpacity>
              )}
              {todayStory && (
                <TouchableOpacity
                  style={styles.todayPick}
                  activeOpacity={0.85}
                  onPress={() => navigation.navigate('Story', { storyId: todayStory.next.id, openedAt: Date.now() })}
                >
                  <ImageBackground
                    source={uriImage(todayStory.cover_url) ?? undefined}
                    style={styles.todayPickImage}
                    imageStyle={styles.todayPickImageRadius}
                  >
                    <View style={styles.todayPickKind}>
                      <BookOpen size={13} color={COLORS.white} />
                      <Text style={styles.todayPickKindText}>{t('homePickStory')}</Text>
                    </View>
                    {/* اسم داستان روی خودِ عکس، روی نوار تیره تا خوانا بماند */}
                    <View style={styles.todayPickOverlay}>
                      <Text style={styles.todayPickOverlayTitle} numberOfLines={2}>
                        {todayStory.title}
                      </Text>
                    </View>
                  </ImageBackground>
                  <Text style={styles.todayPickSub} numberOfLines={1}>
                    {t('storyChapterN').replace('{n}', String(todayStory.next.chapter_no || 1))} · {todayStory.next.title}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}

        <HomeGroup title={t('homeGroupLibrary')} tabs={libraryTabs} allLabel={t('homeSeeAll')} />
        <HomeGroup title={t('homeGroupPractice')} tabs={practiceTabs} allLabel={t('homeSeeAll')} />

        {/* Bottom padding for tab bar */}
        {/* نوار شناور پایین (۷۰ + فاصله‌ی ۱۶ + لبه‌ی گوشی) نباید روی کارت آخر بیفتد. */}
        <View style={{ height: 170 }} />
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
  // بدون پس‌زمینه و سایه، هم‌خانواده‌ی بقیه‌ی دسته‌های خانه.
  todayPicksCard: {
    gap: 10,
    marginBottom: 22,
  },
  homeCardTitle: { fontFamily: FONT_FAMILY.bold, fontSize: 15, color: COLORS.text },
  todayPicksRow: { flexDirection: 'row', gap: 12 },
  todayPick: { flex: 1, gap: 6 },
  todayPickImage: { height: 120, justifyContent: 'space-between', backgroundColor: COLORS.surfaceHigh, borderRadius: 16 },
  todayPickImageRadius: { borderRadius: 16 },
  todayPickKind: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    margin: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    backgroundColor: 'rgba(16, 18, 24, 0.7)',
  },
  todayPickKindText: { fontFamily: FONT_FAMILY.bold, fontSize: 11, color: COLORS.white },
  todayPickOverlay: {
    backgroundColor: 'rgba(16, 18, 24, 0.62)',
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  todayPickOverlayTitle: { fontFamily: FONT_FAMILY.bold, fontSize: 14, lineHeight: 21, color: COLORS.white },
  todayPickTitle: { fontFamily: FONT_FAMILY.semiBold, fontSize: 14, lineHeight: 21, color: COLORS.text },
  todayPickSub: { fontFamily: FONT_FAMILY.regular, fontSize: 12, lineHeight: 18, color: COLORS.textSecondary },
  freePracticeCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 22,
    padding: 16,
    gap: 12,
    marginBottom: 20,
    ...SHADOWS.level1,
  },
  freePracticeRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
  freeTile: { flex: 1, alignItems: 'center', gap: 6, minHeight: 44 },
  freeTileIcon: { width: 58, height: 58, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  freeTileLabel: { fontFamily: FONT_FAMILY.medium, fontSize: 13, color: COLORS.text },
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
    fontSize: 12,
  },
  headerTitle: {
    color: COLORS.text,
    fontFamily: FONT_FAMILY.bold,
    fontSize: 19,
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
  // کنترل‌های سربرگ بدون کپسول و کادر؛ لمس‌پذیر می‌مانند ولی از سلام و کارت اصلی توجه نمی‌گیرند.
  langBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 6,
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
    paddingHorizontal: 6,
    paddingVertical: 6,
    gap: 4,
  },
  sideLinks: { gap: 2, marginBottom: 20, marginTop: -4 },
  sideLink: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 8 },
  sideLinkText: { flex: 1, fontFamily: FONT_FAMILY.medium, fontSize: 13, color: COLORS.textSecondary, textAlign: 'right' },
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
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
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
