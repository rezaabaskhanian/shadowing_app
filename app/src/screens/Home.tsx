import React from 'react';
import {
  BackHandler,
  Image,
  ImageBackground,
  Modal,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
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
  Check,
  Lock,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react-native';
import { type BentoItem } from '../components/BentoGrid';
import { HomeGroup, type HomeGroupTab } from '../components/HomeGroup';
import { HomeHeader } from '../components/home/HomeHeader';
import { HomeHeroBanner } from '../components/home/HomeHeroBanner';
import { HomeContinueCard } from '../components/home/HomeContinueCard';
import { HomeQuickAccess } from '../components/home/HomeQuickAccess';
import { HomeRecommendedShelf, type RecommendedSceneItem } from '../components/home/HomeRecommendedShelf';
import { HomeDailyPlanBanner } from '../components/home/HomeDailyPlanBanner';
import { HomeExploreCard } from '../components/home/HomeExploreCard';
import { HomeVerbNoticeCard, HomeRetestNoticeCard } from '../components/home/HomeVerbNoticeCard';
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
import { COLORS, SPACING, hexToRgba } from '../theme/colors';
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
import { getSubscriptionStatus } from '../api/billing';
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
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const { scenes, reload: reloadScenes } = useScenes();
  const { language, setLanguage, t } = useLanguage();
  // خانه در فارسی راست‌به‌چپ چیده می‌شود (تیترها راست، لینک «همه» چپ).
  const rtl = language === 'fa';
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
  const [podcastsLoaded, setPodcastsLoaded] = React.useState(false);
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
        .then((list) => {
          if (active) {
            setPodcasts(list);
            setPodcastsLoaded(true);
          }
        })
        .catch(() => {
          if (active) {
            setPodcasts([]);
            setPodcastsLoaded(true);
          }
        });
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
  const [myLevelLoaded, setMyLevelLoaded] = React.useState(false);
  const refreshMyLevel = React.useCallback(() => {
    let active = true;
    getMyLevel()
      .then((l) => {
        if (active) {
          setMyLevelState(l);
          setMyLevelLoaded(true);
        }
      })
      .catch(() => {
        if (active) {
          setMyLevelState(null);
          setMyLevelLoaded(true);
        }
      });
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

  const [isSubscribed, setIsSubscribed] = React.useState(false);
  useFocusEffect(
    React.useCallback(() => {
      if (user?.role === 'admin') {
        setIsSubscribed(true);
        return;
      }
      getSubscriptionStatus()
        .then((s) => setIsSubscribed(!!s?.active))
        .catch(() => setIsSubscribed(false));
    }, [user?.role])
  );

  const targetLevel = (myLevel?.scene_level || 'beginner').toLowerCase();
  const userLevelScenes = React.useMemo(() => {
    const list = scenes.filter((s) => s.level.toLowerCase() === targetLevel);
    return (list.length > 0 ? list : scenes).slice(0, 8);
  }, [scenes, targetLevel]);

  const isHomeSceneLocked = React.useCallback(
    (sc: { isLocked?: boolean }, idx: number) => !isSubscribed && (sc.isLocked || idx >= 4),
    [isSubscribed]
  );

  const formatSceneLevel = React.useCallback(
    (lvl?: string) => {
      const l = (lvl || '').toLowerCase();
      if (rtl) {
        if (l === 'beginner' || l === 'starter' || l === 'a1' || l === 'a2') return 'مبتدی';
        if (l === 'intermediate' || l === 'b1' || l === 'b2') return 'متوسط';
        if (l === 'advanced' || l === 'c1' || l === 'c2') return 'پیشرفته';
        if (l === 'proficient') return 'حرفه‌ای';
        return 'مبتدی';
      }
      return lvl ? lvl.toUpperCase() : 'B1';
    },
    [rtl]
  );

  const recommendedSceneItems: RecommendedSceneItem[] = React.useMemo(() => {
    return userLevelScenes.map((sc, index) => ({
      id: sc.id,
      title: sc.title,
      level: formatSceneLevel(sc.level),
      imageUri: sc.imageUri,
      isLocked: isHomeSceneLocked(sc, index),
      time: sc.time,
    }));
  }, [userLevelScenes, isHomeSceneLocked, formatSceneLevel]);

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
    navigation.navigate('Shadowing', { scenarioId: scenario.id, returnTo: 'Home' });
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
      const isFromPathStart = startPathAfterTest.current;
      startPathAfterTest.current = false;

      // بعد از تمام‌شدن (چه اولین بار، چه دوباره از Drawer)، پروفایل را
      // دوباره می‌خوانیم تا بجِ سطح و کارتِ CTA فوراً به‌روز شوند؛ لیست
      // صحنه‌ها هم به سطح وابسته است (بک‌اند بر اساسش فیلتر می‌کند).
      refreshPlacementState();
      refreshMyLevel();
      reloadScenes();

      // هدایت کاربر به رودمپ متناسب با سطح تعیین‌سطح شده (مبتدی، متوسط، پیشرفته)
      getMyLevel()
        .then((l) => {
          if (isFromPathStart) {
            const level = pathLevelFor(l.scene_level);
            if (level) {
              navigation.navigate('PathHome', { level });
              return;
            }
          }
          const targetLevel = difficultyToLevel(l.scene_level);
          navigation.navigate('CurriculumMap', { focusLevel: targetLevel });
        })
        .catch(() => {
          navigation.navigate('CurriculumMap');
        });
    },
  };

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: Math.max(insets.top, Platform.OS === 'android' ? (StatusBar.currentHeight || 0) + 6 : 14),
            paddingBottom: Math.max(insets.bottom + 104, 120),
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* 1. Header: بالا دکمه‌ی منو و کپسول‌های زبان و استریک */}
        <HomeHeader
          language={language}
          onToggleLanguage={toggleLanguage}
          streak={streak}
          onOpenStreakInfo={() => setStreakInfoVisible(true)}
          onOpenDrawer={() => setDrawerVisible(true)}
          rtl={rtl}
        />

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

        {/* 2. Hero Section: بنر اختصاصی تحریریه‌ای Learn English by Living It */}
        <HomeHeroBanner
          onContinue={() => {
            if (homePath?.started) {
              navigation.navigate('PathHome', { level: homePath.level });
            } else if (featuredScenario) {
              openScene(featuredScenario);
            } else {
              navigation.navigate('CurriculumMap');
            }
          }}
          ctaText={rtl ? 'ادامه‌ی جلسه' : 'Continue Session'}
          heroImageUri={featuredScenario?.imageUri}
          rtl={rtl}
        />

        {/* 3. Continue Learning Card: کارت در حال یادگیری با حلقه درصد پیشرفت */}
        {featuredScenario && (
          <HomeContinueCard
            title={featuredScenario.title}
            progressPercent={featuredScenario.progress || 35}
            remainingMinutes={todaysMission?.estimated_minutes || 12}
            imageUri={featuredScenario.imageUri}
            onPress={() => openScene(featuredScenario)}
            statusLabel={rtl ? 'در حال یادگیری' : 'Learning in progress'}
            rtl={rtl}
          />
        )}

        {/* 4. Quick Access Row: چهار کارت پاستلی دسترسی سریع */}
        <HomeQuickAccess
          onOpenShadowing={() => navigation.navigate('CurriculumMap')}
          onOpenVocabulary={() => navigation.navigate('Leitner')}
          onOpenPractice={() => navigation.navigate('LanguageHabit')}
          onOpenProgress={() => setXpInfoVisible(true)}
          rtl={rtl}
        />

        {/* 5. Recommended Scenarios: ویترین افقی سناریوهای پیشنهادی */}
        {recommendedSceneItems.length > 0 && (
          <HomeRecommendedShelf
            title={rtl ? 'سناریوهای پیشنهادی' : 'Recommended Scenarios'}
            scenes={recommendedSceneItems}
            onOpenScene={(sc) => {
              if (sc.isLocked) {
                navigation.navigate('Paywall');
              } else {
                openScene(sc);
              }
            }}
            onViewAll={() => navigation.navigate('CurriculumMap')}
            rtl={rtl}
          />
        )}

        {/* 6. Daily Plan / Habit Banner: بنر برنامه روزانه ۱۵ دقیقه‌ای */}
        <HomeDailyPlanBanner
          goalMinutes={15}
          completedMinutes={6}
          onPress={() => navigation.navigate('GoalPlan')}
          onContinue={() => {
            if (featuredScenario) {
              openScene(featuredScenario);
            } else {
              navigation.navigate('GoalPlan');
            }
          }}
          rtl={rtl}
        />

        {/* کارت‌های تعاملی پایش پیشرفت و چالش افعال چندمعنایی */}
        {retestDue && (
          <HomeRetestNoticeCard
            onPress={() => {
              track('retest_card_tap');
              setPlacementModalVisible(true);
            }}
            rtl={rtl}
          />
        )}

        {pendingVerb && (
          <HomeVerbNoticeCard
            verb={pendingVerb}
            onPress={() => navigation.navigate('VerbQuiz', { verbId: pendingVerb.verb_id })}
            rtl={rtl}
          />
        )}

        {/* 7. Dedicated Content Library & Explore Gateway:
            به‌جای نمایش کاتالوگ طولانی و شلوغ در خانه، کتابخانه مستقل با ۴ دسترسی سریع و لینک به دراور فراهم شده است */}
        <HomeExploreCard
          onOpenPodcasts={() => navigation.navigate('PodcastList')}
          onOpenStories={() => navigation.navigate('StoryList')}
          onOpenVideos={() => navigation.navigate('VideoClipList')}
          onOpenSongs={() => navigation.navigate('SongList')}
          onOpenAll={() => setDrawerVisible(true)}
          rtl={rtl}
        />
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

// رنگ‌های طرح جدید خانه: پس‌زمینه‌ی کرم/استخوانی طبیعی و کارت‌های با حاشیه گرم
const HOME_BG = '#FDFBF7';
const HOME_CARD_BORDER = '#F0EBE3';
const HOME_CARD_SHADOW = {
  shadowColor: '#1A1D26',
  shadowOpacity: 0.04,
  shadowRadius: 10,
  shadowOffset: { width: 0, height: 3 },
  elevation: 1,
};

const styles = StyleSheet.create({
  // بدون پس‌زمینه و سایه، هم‌خانواده‌ی بقیه‌ی دسته‌های خانه.
  todayPicksCard: { gap: 10, marginBottom: 20, paddingHorizontal: 20 },
  homeCardTitle: { fontFamily: FONT_FAMILY.bold, fontSize: 17, color: COLORS.text },
  todayPicksRow: { flexDirection: 'row', gap: 12 },
  todayPick: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: HOME_CARD_BORDER,
    overflow: 'hidden',
    ...HOME_CARD_SHADOW,
  },
  todayPickImage: { height: 124, justifyContent: 'space-between', backgroundColor: COLORS.surfaceHigh },
  todayPickImageRadius: { borderTopLeftRadius: 18, borderTopRightRadius: 18 },
  todayPickKind: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    margin: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    backgroundColor: 'rgba(16, 18, 24, 0.55)',
  },
  todayPickKindText: { fontFamily: FONT_FAMILY.bold, fontSize: 11, color: COLORS.white },
  todayPickTitle: { fontFamily: FONT_FAMILY.bold, fontSize: 13, lineHeight: 20, color: COLORS.text },
  todayPickBody: { paddingHorizontal: 12, paddingVertical: 10, gap: 2 },
  todayPickStoryTitle: { fontFamily: FONT_FAMILY.bold, fontSize: 12, lineHeight: 19, color: COLORS.text },
  todayPickOverlay: { paddingHorizontal: 10, paddingVertical: 8, backgroundColor: 'rgba(16, 18, 24, 0.35)' },
  todayPickOverlayTitle: { fontFamily: FONT_FAMILY.bold, fontSize: 13, lineHeight: 20, color: COLORS.white },
  rowReverse: { flexDirection: 'row-reverse' },
  textRight: { textAlign: 'right' },
  textLeft: { textAlign: 'left' },
  alignEnd: { alignItems: 'flex-end' },
  alignStart: { alignItems: 'flex-start' },
  selfEnd: { alignSelf: 'flex-end' },
  selfStart: { alignSelf: 'flex-start' },
  todayPickSub: { fontFamily: FONT_FAMILY.regular, fontSize: 11, lineHeight: 17, color: COLORS.muted },
  container: { flex: 1, backgroundColor: HOME_BG },
  scrollContent: { paddingHorizontal: 0, paddingTop: 44, paddingBottom: 115 },
  header: { marginBottom: 18 },
  greeting: { color: COLORS.muted, fontFamily: FONT_FAMILY.medium, fontSize: 12 },
  headerTitle: { color: COLORS.text, fontFamily: FONT_FAMILY.bold, fontSize: 24, marginTop: 4 },
  headerActions: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 },
  // کنترل‌های سربرگ بدون کپسول و کادر؛ لمس‌پذیر می‌مانند ولی از سلام و کارت اصلی توجه نمی‌گیرند.
  langBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    height: 32,
    paddingHorizontal: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: HOME_CARD_BORDER,
    backgroundColor: COLORS.white,
  },
  langBadgeText: { color: COLORS.text, fontFamily: FONT_FAMILY.bold, fontSize: 11 },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    height: 32,
    paddingHorizontal: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#FCE3B4',
    backgroundColor: '#FFF6E3',
  },
  sideLinks: { gap: 10, marginBottom: 22, paddingHorizontal: 20 },
  sideLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 16,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: HOME_CARD_BORDER,
    ...HOME_CARD_SHADOW,
  },
  sideLinkIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  headerPills: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  sideLinkText: { flex: 1, fontFamily: FONT_FAMILY.semiBold, fontSize: 13, color: COLORS.text },
  streakText: { color: COLORS.text, fontFamily: FONT_FAMILY.bold, fontSize: 13 },
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
  sceneShelf: {
    marginVertical: SPACING.m,
  },
  sceneShelfHeader: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.l,
    marginBottom: SPACING.s,
  },
  sceneShelfTitleRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 8,
  },
  sceneShelfTitle: {
    fontFamily: FONT_FAMILY.bold,
    fontSize: 16,
    color: COLORS.text,
  },
  sceneShelfLevelBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  sceneShelfLevelBadgeText: {
    fontFamily: FONT_FAMILY.bold,
    fontSize: 10,
    color: COLORS.white,
  },
  sceneShelfAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  sceneShelfAllText: {
    fontFamily: FONT_FAMILY.medium,
    fontSize: 12,
    color: COLORS.primary,
  },
  sceneShelfScroll: {
    flexDirection: 'row-reverse',
    gap: 12,
    paddingHorizontal: SPACING.l,
    paddingVertical: 4,
  },
  sceneShelfCard: {
    width: 155,
    backgroundColor: COLORS.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#EEEAE3',
    overflow: 'hidden',
    padding: 8,
  },
  sceneShelfImageWrapper: {
    width: '100%',
    height: 100,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#1A1D26',
  },
  sceneShelfImage: {
    width: '100%',
    height: '100%',
  },
  sceneShelfLockBadge: {
    position: 'absolute',
    top: 6,
    start: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  sceneShelfLockText: {
    fontFamily: FONT_FAMILY.bold,
    fontSize: 9,
    color: COLORS.white,
  },
  sceneShelfDoneBadge: {
    position: 'absolute',
    top: 6,
    start: 6,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: COLORS.success,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sceneShelfTimeBadge: {
    position: 'absolute',
    bottom: 6,
    end: 6,
    backgroundColor: 'rgba(0,0,0,0.65)',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 5,
  },
  sceneShelfTimeText: {
    fontFamily: FONT_FAMILY.bold,
    fontSize: 9,
    color: COLORS.white,
  },
  sceneShelfCardTitle: {
    fontFamily: FONT_FAMILY.bold,
    fontSize: 13,
    color: COLORS.text,
    textAlign: 'right',
    marginTop: 6,
  },
  sceneShelfCategory: {
    fontFamily: FONT_FAMILY.regular,
    fontSize: 11,
    color: COLORS.muted,
    textAlign: 'right',
    marginTop: 2,
  },
  sceneShelfProgressBg: {
    height: 3,
    backgroundColor: '#EEEAE3',
    borderRadius: 2,
    marginTop: 6,
    overflow: 'hidden',
  },
  sceneShelfProgressFill: {
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: 2,
  },
});
