import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Modal,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { useIsFocused, useNavigation } from '@react-navigation/native';
import {
  Bell,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Clapperboard,
  BookMarked,
  Briefcase,
  Coins,
  Compass,
  GraduationCap,
  Headphones,
  HelpCircle,
  Lightbulb,
  LogOut,
  Mail,
  MessageCircle,
  Mic,
  Flag,
  PenLine,
  Sprout,
  Target,
  TrendingUp,
  User as UserIcon,
  Music,
  PlusCircle,
  SpellCheck,
} from 'lucide-react-native';
import { COLORS, BORDER_RADIUS, SPACING } from '../theme/colors';
import { FONT_FAMILY } from '../theme/typography';
import { useLanguage } from '../data/i18n';
import { useAuth } from '../data/AuthContext';
import { useNotifications } from '../data/NotificationContext';
import { useScenes } from '../data/ScenesContext';
import { useToast } from '../data/ToastContext';
import { getMyPoints } from '../api/submissions';
import type { LearningGoal } from '../api/notifications';
import { setMyLevel, type MyLevel, type SceneLevel } from '../api/assessment';
import { getCachedAvailability, loadContentAvailability } from '../data/contentAvailability';

const DRAWER_WIDTH = Math.min(320, Dimensions.get('window').width * 0.82);

interface AppDrawerProps {
  visible: boolean;
  onClose: () => void;
  /**
   * وقتی داده شود یعنی ادمین محتوای تست تعیین سطح را ساخته — یک ردیف «تست
   * تعیین سطح» نشان داده می‌شود که همیشه در دسترس است، چه کاربر هنوز پروفایل
   * نداشته باشد (اولین بار) چه داشته باشد (برای گرفتنِ دوباره‌ی تست). اگر
   * ندهی (یعنی ادمین هنوز محتوایی نساخته)، این ردیف اصلاً رندر نمی‌شود.
   */
  onOpenPlacementTest?: () => void;
  /** سطح گفتاری فعلی کاربر (مثلاً "B1")؛ اگر هنوز تست نداده باشد undefined است. */
  speakingLevel?: string;
  /** سطح مؤثر کاربر (دستی یا از تست) برای بخش «سطح من»؛ تا لود نشده null. */
  myLevel?: MyLevel | null;
  /** بعد از تغییر سطح صدا زده می‌شود تا خانه/لیست صحنه‌ها به‌روز شوند. */
  onLevelChange?: (level: MyLevel) => void;
}

const SCENE_LEVELS: { id: SceneLevel; labelKey: string }[] = [
  { id: 'starter', labelKey: 'levelStarter' },
  { id: 'beginner', labelKey: 'levelBeginner' },
  { id: 'intermediate', labelKey: 'levelIntermediate' },
  { id: 'advanced', labelKey: 'levelAdvanced' },
  { id: 'proficient', labelKey: 'levelProficient' },
];
const SCENE_LEVEL_RANK: Record<string, number> = { starter: 0, beginner: 1, intermediate: 2, advanced: 3, proficient: 4 };

// کشوی کناری (راست) شامل خلاصه کاربر، عادت زبانی، راهنما و خروج از حساب.
export const AppDrawer = ({
  visible,
  onClose,
  onOpenPlacementTest,
  speakingLevel,
  myLevel,
  onLevelChange,
}: AppDrawerProps) => {
  const navigation = useNavigation<any>();
  const isFocused = useIsFocused();
  const { t, language } = useLanguage();
  // فارسی: آیکون‌ها و آواتار سمت راست، متن‌ها راست‌چین، فلش‌ها به چپ.
  const rtl = language === 'fa';
  const ta = rtl ? styles.textRight : styles.textLeft;
  const { user, logout } = useAuth();
  const { scenes } = useScenes();
  const toast = useToast();
  const [savingLevel, setSavingLevel] = useState(false);

  // انتخاب سطح بالاتر از نتیجه‌ی تست مجاز است (محدودیت سطح آموزشی است نه
  // پولی)، فقط یک هشدار کوتاه می‌دهیم.
  const changeLevel = async (level: SceneLevel | '') => {
    if (!myLevel || level === myLevel.scene_level) return;
    setSavingLevel(true);
    try {
      const updated = await setMyLevel(level);
      onLevelChange?.(updated);
      const baseline = updated.test_scene_level || 'beginner';
      if (level && SCENE_LEVEL_RANK[level] > SCENE_LEVEL_RANK[baseline]) {
        toast.warning(t('myLevelHarderWarning'));
      }
    } catch {
      toast.error(t('myLevelSaveFailed'));
    } finally {
      setSavingLevel(false);
    }
  };
  const {
    streakReminderEnabled,
    setStreakReminderEnabled,
    vocabReminderEnabled,
    setVocabReminderEnabled,
    learningGoal,
    setLearningGoal,
    weeklyDigestEnabled,
    setWeeklyDigestEnabled,
  } = useNotifications();
  const [points, setPoints] = useState(0);
  // بخش‌های تازه فقط وقتی در منو می‌آیند که ادمین برایشان محتوا ساخته باشد.
  const [available, setAvailable] = useState(getCachedAvailability);
  const translateX = useRef(new Animated.Value(DRAWER_WIDTH)).current;

  // مودال فقط وقتی صفحه‌ی میزبان (مثلاً Home) فوکوس داره نمایش داده میشه؛
  // با رفتن به صفحه‌ی دیگه مخفی میشه ولی state باز بودنش (visible) دست‌نخورده می‌مونه
  // تا با برگشت به این صفحه، دراور خودکار دوباره باز بشه.
  const modalVisible = visible && isFocused;

  useEffect(() => {
    if (modalVisible) {
      getMyPoints()
        .then(setPoints)
        .catch(() => {});
      loadContentAvailability()
        .then(setAvailable)
        .catch(() => {});
      Animated.timing(translateX, {
        toValue: 0,
        duration: 260,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(translateX, {
        toValue: DRAWER_WIDTH,
        duration: 220,
        useNativeDriver: true,
      }).start();
    }
  }, [modalVisible, translateX]);

  // ناوبری از دراور، خودِ visible رو نمی‌بنده؛ فقط چون فوکوس این صفحه از دست میره
  // مودال مخفی میشه و با برگشت به این صفحه دوباره باز میشه.
  const go = (screen: string, params?: object) => {
    navigation.navigate(screen, params);
  };

  // موضوعِ گفتگو انتخابِ خودِ کاربر یا AI نیست — همیشه یکی از درس‌های
  // «کامل‌شده» است که به‌صورت رندوم انتخاب می‌شود، تا محتوای تمرین‌شده مرور شود.
  const handleOpenConversation = () => {
    const completed = scenes.filter((s) => s.isCompleted);
    if (completed.length === 0) {
      // دراور یک RN Modal است و روی اندروید در یک پنجره‌ی جدای بومی رندر
      // می‌شود، بالاتر از کل درخت JS — پس توست (که Modal نیست) اگر دراور باز
      // بماند، زیرش پنهان می‌شود. باید اول دراور بسته شود، بعد توست نشان داده شود.
      onClose();
      toast.warning(t('drawerConversationNoCompletedLessons'));
      return;
    }
    const picked = completed[Math.floor(Math.random() * completed.length)];
    go('AIConversation', { scenarioId: picked.id, sceneTitle: picked.title });
  };

  return (
    <Modal visible={modalVisible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <TouchableWithoutFeedback onPress={onClose}>
          <View style={StyleSheet.absoluteFill} />
        </TouchableWithoutFeedback>

        <Animated.View style={[styles.drawer, { transform: [{ translateX }] }]}>
          {/* <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
            <X color={COLORS.text} size={20} />
          </TouchableOpacity> */}

          {/* User summary */}
          <View style={[styles.userIdentity, rtl && styles.rowReverse]}>
            <View style={styles.avatarCircle}>
              <UserIcon size={22} color={COLORS.primary} />
            </View>
            <View style={[styles.flex1, rtl ? styles.alignEnd : styles.alignStart]}>
              <Text style={styles.userName} numberOfLines={1}>
                {user?.nickname || ''}
              </Text>
              {speakingLevel && (
                <View style={styles.levelChip}>
                  <Text style={styles.levelChipText}>
                    {t('placementLevelBadge').replace('{level}', speakingLevel)}
                  </Text>
                </View>
              )}
            </View>
          </View>

          {/* My Points banner */}
          <TouchableOpacity
            style={[styles.pointsCard, rtl && styles.rowReverse]}
            activeOpacity={0.85}
            onPress={() => go('MySubmissions')}
          >
            <View style={styles.pointsIconWrap}>
              <Coins color={COLORS.secondary} size={22} />
            </View>
            <View style={[styles.flex1, rtl ? styles.alignEnd : styles.alignStart]}>
              <Text style={[styles.pointsValue, ta]}>
                {points} · {t('myPoints')}
              </Text>
              {/* با امتیاز صفر، به‌جای قانون تبدیل، راه گرفتن امتیاز را می‌گوییم. */}
              <Text style={[styles.pointsSub, ta]}>{points > 0 ? t('myPointsSub') : t('myPointsEarnHint')}</Text>
            </View>
            {rtl ? <ChevronLeft color={COLORS.muted} size={18} /> : <ChevronRight color={COLORS.muted} size={18} />}
          </TouchableOpacity>

          <View style={styles.dividerLine} />

          {/* Language Habit */}

          {/* بدنه‌ی قابل‌اسکرول: تعداد ردیف‌ها ممکنه با اضافه‌شدن فیچرهای بعدی
              زیاد بشه، و روی گوشی‌های صفحه‌کوچیک (مثل Galaxy J5) بدون اسکرول
              ردیف‌ها روی هم می‌ریزن یا از صفحه بیرون می‌زنن. */}
          <ScrollView style={styles.menuScroll} showsVerticalScrollIndicator={false}>
          {/* سه گروه با تیتر کوچک: یادگیری روزانه، تمرین بیشتر، پشتیبانی. قبلاً ۱۱ ردیف هم‌وزن
              پشت هم بود و کاربر تازه‌کار نمی‌فهمید از کجا شروع کند. */}
          <Text style={[styles.groupTitle, ta]}>{t('drawerGroupLearn')}</Text>

          {/* هر ردیف رنگ اختصاصی خودش را دارد — هم برای تشخیص سریع‌تر، هم تا
              وقتی از این ردیف وارد صفحه‌اش می‌شوی، همون رنگ آنجا هم ادامه پیدا
              کند (زبانه سبز → صفحه‌ی عادت زبانی هم لهجه‌ی سبز دارد، و…). */}
          <TouchableOpacity
            style={[styles.row, rtl && styles.rowReverse]}
            activeOpacity={0.7}
            onPress={() => go('LanguageHabit')}
          >
            <View style={[styles.rowIconWrap, { backgroundColor: COLORS.tertiaryLight }]}>
              <Target color={COLORS.tertiary} size={18} />
            </View>
            <Text style={[styles.rowText, ta]}>{t('habitRealSituations')}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.row, rtl && styles.rowReverse]} activeOpacity={0.7} onPress={() => go('GoalPlan')}>
            <View style={[styles.rowIconWrap, { backgroundColor: COLORS.warningLight }]}>
              <Flag color={COLORS.warning} size={18} />
            </View>
            <Text style={[styles.rowText, ta]}>{t('goalPlanTitle')}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.row, rtl && styles.rowReverse]}
            activeOpacity={0.7}
            onPress={handleOpenConversation}
          >
            <View style={[styles.rowIconWrap, { backgroundColor: COLORS.primaryLight }]}>
              <MessageCircle color={COLORS.primary} size={18} />
            </View>
            <Text style={[styles.rowText, ta]}>{t('drawerConversationTitle')}</Text>
          </TouchableOpacity>

          {onOpenPlacementTest && (
            <TouchableOpacity
              style={[styles.row, rtl && styles.rowReverse]}
              activeOpacity={0.7}
              onPress={() => {
                onClose();
                onOpenPlacementTest();
              }}
            >
              <View style={[styles.rowIconWrap, { backgroundColor: COLORS.primaryLight }]}>
                <Mic color={COLORS.primary} size={18} />
              </View>
              <Text style={[styles.rowText, ta]}>{t('placementDrawerTitle')}</Text>
            </TouchableOpacity>
          )}


          {available.course && (
            <TouchableOpacity
              style={[styles.row, rtl && styles.rowReverse]}
              activeOpacity={0.7}
              onPress={() => go('CourseHome')}
            >
              <View style={[styles.rowIconWrap, { backgroundColor: COLORS.successLight }]}>
                <Sprout color={COLORS.success} size={18} />
              </View>
              <Text style={[styles.rowText, ta]}>{t('courseTitle')}</Text>
            </TouchableOpacity>
          )}

          <Text style={[styles.groupTitle, ta]}>{t('drawerGroupPractice')}</Text>

          {available.videoClips && (
            <TouchableOpacity
              style={[styles.row, rtl && styles.rowReverse]}
              activeOpacity={0.7}
              onPress={() => go('VideoClipList')}
            >
              <View style={[styles.rowIconWrap, { backgroundColor: COLORS.errorLight }]}>
                <Clapperboard color={COLORS.error} size={18} />
              </View>
              <Text style={[styles.rowText, ta]}>{t('videoClipsTitle')}</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity style={[styles.row, rtl && styles.rowReverse]} activeOpacity={0.7} onPress={() => go('StoryList')}>
            <View style={[styles.rowIconWrap, { backgroundColor: COLORS.infoLight }]}>
              <BookOpen color={COLORS.levelIntermediateBg} size={18} />
            </View>
            <Text style={[styles.rowText, ta]}>{t('storyTitle')}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.row, rtl && styles.rowReverse]} activeOpacity={0.7} onPress={() => go('SongList')}>
            <View style={[styles.rowIconWrap, { backgroundColor: COLORS.errorLight }]}>
              <Music color={COLORS.pink} size={18} />
            </View>
            <Text style={[styles.rowText, ta]}>{t('songTitle')}</Text>
          </TouchableOpacity>

          {available.podcasts && (
            <TouchableOpacity
              style={[styles.row, rtl && styles.rowReverse]}
              activeOpacity={0.7}
              onPress={() => go('PodcastList')}
            >
              <View style={[styles.rowIconWrap, { backgroundColor: COLORS.primaryLight }]}>
                <Headphones color={COLORS.primary} size={18} />
              </View>
              <Text style={[styles.rowText, ta]}>{t('podcastTitle')}</Text>
            </TouchableOpacity>
          )}

          {available.podcasts && (
            <TouchableOpacity style={[styles.row, rtl && styles.rowReverse]} activeOpacity={0.7} onPress={() => go('DictationList')}>
              <View style={[styles.rowIconWrap, { backgroundColor: COLORS.successLight }]}>
                <SpellCheck color={COLORS.success} size={18} />
              </View>
              <Text style={[styles.rowText, ta]}>{t('dictationTitle')}</Text>
            </TouchableOpacity>
          )}

          {available.writing && (
            <TouchableOpacity
              style={[styles.row, rtl && styles.rowReverse]}
              activeOpacity={0.7}
              onPress={() => go('WritingList')}
            >
              <View style={[styles.rowIconWrap, { backgroundColor: COLORS.infoLight }]}>
                <PenLine color={COLORS.info} size={18} />
              </View>
              <Text style={[styles.rowText, ta]}>{t('writingTitle')}</Text>
            </TouchableOpacity>
          )}

          {available.interview && (
            <TouchableOpacity style={[styles.row, rtl && styles.rowReverse]} activeOpacity={0.7} onPress={() => go('InterviewList')}>
              <View style={[styles.rowIconWrap, { backgroundColor: COLORS.primaryLight }]}>
                <Briefcase color={COLORS.primary} size={18} />
              </View>
              <Text style={[styles.rowText, ta]}>{t('interviewTitle')}</Text>
            </TouchableOpacity>
          )}

          {available.specialty && (
            <TouchableOpacity style={[styles.row, rtl && styles.rowReverse]} activeOpacity={0.7} onPress={() => go('SpecialtyHub')}>
              <View style={[styles.rowIconWrap, { backgroundColor: COLORS.infoLight }]}>
                <BookMarked color={COLORS.levelAdvancedBg} size={18} />
              </View>
              <Text style={[styles.rowText, ta]}>{t('specialtyTitle')}</Text>
            </TouchableOpacity>
          )}

          {available.topicSpeaking && (
            <TouchableOpacity
              style={[styles.row, rtl && styles.rowReverse]}
              activeOpacity={0.7}
              onPress={() => go('TopicList')}
            >
              <View style={[styles.rowIconWrap, { backgroundColor: COLORS.secondaryLight }]}>
                <Mic color={COLORS.secondary} size={18} />
              </View>
              <Text style={[styles.rowText, ta]}>{t('topicSpeakingTitle')}</Text>
            </TouchableOpacity>
          )}

          <Text style={[styles.groupTitle, ta]}>{t('drawerGroupSupport')}</Text>

          {/* پیشنهاد یک صحنه قبلاً بنر بالای لیست صحنه‌ها بود و جلوی شروع تمرین را می‌گرفت. */}
          <TouchableOpacity style={[styles.row, rtl && styles.rowReverse]} activeOpacity={0.7} onPress={() => go('SubmitScene')}>
            <View style={[styles.rowIconWrap, { backgroundColor: COLORS.primaryLight }]}>
              <PlusCircle color={COLORS.primary} size={18} />
            </View>
            <Text style={[styles.rowText, ta]}>{t('submitSceneTitle')}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.row, rtl && styles.rowReverse]}
            activeOpacity={0.7}
            onPress={() => go('TopicSuggestion')}
          >
            <View style={[styles.rowIconWrap, { backgroundColor: COLORS.warningLight }]}>
              <Lightbulb color={COLORS.warning} size={18} />
            </View>
            <Text style={[styles.rowText, ta]}>{t('habitSuggestTopic')}</Text>
          </TouchableOpacity>

          {/* پیشنهادات/انتقادات قبلاً ردیف جدا داشت؛ چون هر دو یک راه ارتباط
              با تیم‌اند، حالا زیر همین «ارتباط با ما» یکی شدند. */}
          <TouchableOpacity
            style={[styles.row, rtl && styles.rowReverse]}
            activeOpacity={0.7}
            onPress={() => go('ContactUs')}
          >
            <View style={[styles.rowIconWrap, { backgroundColor: COLORS.infoLight }]}>
              <Mail color={COLORS.info} size={18} />
            </View>
            <Text style={[styles.rowText, ta]}>{t('habitContactUs')}</Text>
          </TouchableOpacity>


          <View style={styles.dividerLine} />

          {/* رضایت صریح کاربر برای پوش یادآوری استریک — پیش‌فرض خاموش. طلایی
              چون هم‌رنگ شعله‌ی استریکه، نه چون CTA اصلیه. */}
          <View style={[styles.streakReminderRow, rtl && styles.rowReverse]}>
            <View style={[styles.rowIconWrap, { backgroundColor: COLORS.secondaryLight }]}>
              <Bell color={COLORS.secondary} size={18} />
            </View>
            <View style={[styles.flex1, rtl ? styles.alignEnd : styles.alignStart]}>
              <Text style={[styles.rowText, ta]}>{t('streakReminderTitle')}</Text>
              <Text style={[styles.streakReminderSub, ta]}>{t('streakReminderSub')}</Text>
            </View>
            <Switch
              value={streakReminderEnabled}
              onValueChange={setStreakReminderEnabled}
              trackColor={{ true: COLORS.primary }}
            />
          </View>

          <View style={styles.dividerLine} />

          {/* رضایت صریح کاربر برای پوش یادآوری کلمه‌های سررسیده‌ی لایتنر —
              پیش‌فرض خاموش، عیناً هم‌الگوی یادآوری استریک بالا. */}
          <View style={[styles.streakReminderRow, rtl && styles.rowReverse]}>
            <View style={[styles.rowIconWrap, { backgroundColor: COLORS.infoLight }]}>
              <BookOpen color={COLORS.info} size={18} />
            </View>
            <View style={[styles.flex1, rtl ? styles.alignEnd : styles.alignStart]}>
              <Text style={[styles.rowText, ta]}>{t('vocabReminderTitle')}</Text>
              <Text style={[styles.streakReminderSub, ta]}>{t('vocabReminderSub')}</Text>
            </View>
            <Switch
              value={vocabReminderEnabled}
              onValueChange={setVocabReminderEnabled}
              trackColor={{ true: COLORS.primary }}
            />
          </View>

          <View style={styles.dividerLine} />

          {/* رضایت صریح کاربر برای پوش گزارش هفتگیِ پیشرفت گفتاری — پیش‌فرض
              خاموش، عیناً هم‌الگوی یادآوری استریک/واژگان بالا. */}
          <View style={[styles.streakReminderRow, rtl && styles.rowReverse]}>
            <View style={[styles.rowIconWrap, { backgroundColor: COLORS.tertiaryLight }]}>
              <TrendingUp color={COLORS.tertiary} size={18} />
            </View>
            <View style={[styles.flex1, rtl ? styles.alignEnd : styles.alignStart]}>
              <Text style={[styles.rowText, ta]}>{t('weeklyDigestTitle')}</Text>
              <Text style={[styles.streakReminderSub, ta]}>{t('weeklyDigestSub')}</Text>
            </View>
            <Switch
              value={weeklyDigestEnabled}
              onValueChange={setWeeklyDigestEnabled}
              trackColor={{ true: COLORS.primary }}
            />
          </View>

          <View style={styles.dividerLine} />

          {/* سطح من: کاربر می‌تواند نتیجه‌ی تست تعیین سطح را دستی عوض کند (تست
              ممکن است اشتباه کند). سطح تعیین می‌کند کدام صحنه‌ها دیده شوند. */}
          {myLevel && (
            <View style={styles.goalRow}>
              <View style={[styles.streakReminderRow, rtl && styles.rowReverse]}>
                <View style={[styles.rowIconWrap, { backgroundColor: COLORS.primaryLight }]}>
                  <GraduationCap color={COLORS.primary} size={18} />
                </View>
                <View style={[styles.flex1, rtl ? styles.alignEnd : styles.alignStart]}>
                  <Text style={[styles.rowText, ta]}>{t('myLevelTitle')}</Text>
                  <Text style={[styles.streakReminderSub, ta]}>
                    {myLevel.source === 'manual'
                      ? t('myLevelSourceManual')
                      : myLevel.source === 'test'
                      ? t('myLevelSourceTest')
                      : t('myLevelSourceDefault')}
                    {myLevel.source === 'manual' && myLevel.test_scene_level
                      ? ` · ${t('myLevelTestResult').replace(
                          '{level}',
                          t(SCENE_LEVELS.find((l) => l.id === myLevel.test_scene_level)!.labelKey)
                        )}`
                      : ''}
                  </Text>
                </View>
              </View>
              <View style={[styles.goalPillGroup, rtl && styles.rowReverse]}>
                {SCENE_LEVELS.map((opt) => (
                  <TouchableOpacity
                    key={opt.id}
                    style={[styles.goalPill, myLevel.scene_level === opt.id && styles.goalPillActive]}
                    activeOpacity={0.7}
                    disabled={savingLevel}
                    onPress={() => changeLevel(opt.id)}
                  >
                    <Text
                      style={[styles.goalPillText, myLevel.scene_level === opt.id && styles.goalPillTextActive]}
                    >
                      {t(opt.labelKey)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              {myLevel.source === 'manual' && myLevel.test_scene_level ? (
                <TouchableOpacity disabled={savingLevel} onPress={() => changeLevel('')} hitSlop={8}>
                  <Text style={[styles.levelResetLink, ta]}>{t('myLevelResetToTest')}</Text>
                </TouchableOpacity>
              ) : null}
            </View>
          )}

          <View style={styles.dividerLine} />

          {/* هدف یادگیری اختیاری — فقط برای اولویت‌دهیِ نرم به انتخاب صحنه در
              Today's Mission، نه فیلتر. توگل نیست چون تک‌انتخابی از چند
              گزینه‌ی ثابت است، عیناً هم‌الگوی contentSource در تنظیمات نوتیف. */}
          <View style={styles.goalRow}>
            <View style={[styles.streakReminderRow, rtl && styles.rowReverse]}>
              <View style={[styles.rowIconWrap, { backgroundColor: COLORS.tertiaryLight }]}>
                <Compass color={COLORS.tertiary} size={18} />
              </View>
              <View style={[styles.flex1, rtl ? styles.alignEnd : styles.alignStart]}>
                <Text style={[styles.rowText, ta]}>{t('learningGoalTitle')}</Text>
                <Text style={[styles.streakReminderSub, ta]}>{t('learningGoalSub')}</Text>
              </View>
            </View>
            <View style={[styles.goalPillGroup, rtl && styles.rowReverse]}>
              {(
                [
                  { id: '', label: t('learningGoalNone') },
                  { id: 'Migration', label: t('learningGoalMigration') },
                  { id: 'Travel', label: t('learningGoalTravel') },
                  { id: 'Work', label: t('learningGoalWork') },
                  { id: 'Daily Life', label: t('learningGoalDailyLife') },
                  { id: 'Study', label: t('learningGoalStudy') },
                ] as { id: LearningGoal; label: string }[]
              ).map((opt) => (
                <TouchableOpacity
                  key={opt.id}
                  style={[styles.goalPill, learningGoal === opt.id && styles.goalPillActive]}
                  activeOpacity={0.7}
                  onPress={() => setLearningGoal(opt.id)}
                >
                  <Text
                    style={[styles.goalPillText, learningGoal === opt.id && styles.goalPillTextActive]}
                  >
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.dividerLine} />

          <TouchableOpacity style={[styles.row, rtl && styles.rowReverse]} activeOpacity={0.7} onPress={() => go('HelpFaq')}>
            <View style={[styles.rowIconWrap, { backgroundColor: COLORS.primaryLight }]}>
              <HelpCircle color={COLORS.primary} size={18} />
            </View>
            <Text style={[styles.rowText, ta]}>{t('helpFaq')}</Text>
          </TouchableOpacity>
          </ScrollView>

          <TouchableOpacity
            style={[styles.row, rtl && styles.rowReverse]}
            activeOpacity={0.7}
            onPress={() => {
              onClose();
              logout();
            }}
          >
            <LogOut color={COLORS.error} size={18} />
            <Text style={[styles.rowText, styles.logoutText]}>{t('logout')}</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  rowReverse: { flexDirection: 'row-reverse' },
  textRight: { textAlign: 'right' },
  textLeft: { textAlign: 'left' },
  alignEnd: { alignItems: 'flex-end' },
  alignStart: { alignItems: 'flex-start' },
  flex1: { flex: 1 },
  logoutText: { color: COLORS.error },
  overlay: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  drawer: { width: DRAWER_WIDTH, height: '100%', backgroundColor: '#FBFAF7', paddingTop: 56, paddingHorizontal: SPACING.m, paddingBottom: SPACING.l },
  closeBtn: {
    position: 'absolute',
    top: 16,
    left: 16,
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.backgroundSoft,
  },
  userIdentity: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
  },
  avatarCircle: { width: 46, height: 46, borderRadius: 23, backgroundColor: '#FFEFE6', borderWidth: 2, borderColor: '#FFE1D2', alignItems: 'center', justifyContent: 'center' },
  userName: {
    color: COLORS.text,
    fontFamily: FONT_FAMILY.bold,
    fontSize: 15,
    flexShrink: 1,
  },
  levelChip: { backgroundColor: '#FDEBE4', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 2, marginTop: 4 },
  levelChipText: {
    color: COLORS.primary,
    fontFamily: FONT_FAMILY.semiBold,
    fontSize: 11,
  },
  pointsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: COLORS.white,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#EEEEF2',
    padding: 14,
    marginBottom: 16,
    shadowColor: '#1A1D26',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
    elevation: 1,
  },
  pointsIconWrap: { width: 42, height: 42, borderRadius: 12, backgroundColor: '#FFF4DE', alignItems: 'center', justifyContent: 'center' },
  pointsValue: {
    color: COLORS.text,
    fontFamily: FONT_FAMILY.bold,
    fontSize: 14,
  },
  pointsSub: {
    color: COLORS.textSecondary,
    fontFamily: FONT_FAMILY.regular,
    fontSize: 11,
    marginTop: 2,
  },
  menuScroll: {
    flex: 1,
  },
  dividerLine: { height: 1, backgroundColor: '#ECEAE4', marginVertical: 12 },
  groupTitle: {
    color: COLORS.muted,
    fontFamily: FONT_FAMILY.semiBold,
    fontSize: 11,
    marginTop: 14,
    marginBottom: 4,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  sectionTitle: {
    color: COLORS.text,
    fontFamily: FONT_FAMILY.bold,
    fontSize: 14,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10 },
  rowText: { color: COLORS.text, fontFamily: FONT_FAMILY.semiBold, fontSize: 14 },
  rowIconWrap: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  streakReminderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
  },
  streakReminderSub: {
    color: COLORS.textSecondary,
    fontFamily: FONT_FAMILY.regular,
    fontSize: 11,
    marginTop: 2,
  },
  goalRow: {
    paddingVertical: 10,
  },
  levelResetLink: {
    color: COLORS.primary,
    fontSize: 13,
    marginTop: 10,
  },
  goalPillGroup: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  goalPill: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: BORDER_RADIUS.full, borderWidth: 1, borderColor: '#E6E3DC', backgroundColor: COLORS.white },
  goalPillActive: {
    borderColor: COLORS.tertiary,
    backgroundColor: COLORS.tertiaryLight,
  },
  goalPillText: {
    color: COLORS.textSecondary,
    fontFamily: FONT_FAMILY.medium,
    fontSize: 12,
  },
  goalPillTextActive: {
    color: COLORS.tertiary,
  },
});
