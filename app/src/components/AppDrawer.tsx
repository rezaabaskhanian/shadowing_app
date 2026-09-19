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
  ChevronRight,
  Coins,
  Compass,
  HelpCircle,
  Lightbulb,
  LogOut,
  Mail,
  MessageCircle,
  Mic,
  Target,
  TrendingUp,
  User as UserIcon,
  Zap,
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
}

// کشوی کناری (راست) شامل خلاصه کاربر، عادت زبانی، راهنما و خروج از حساب.
export const AppDrawer = ({ visible, onClose, onOpenPlacementTest, speakingLevel }: AppDrawerProps) => {
  const navigation = useNavigation<any>();
  const isFocused = useIsFocused();
  const { t } = useLanguage();
  const { user, logout } = useAuth();
  const { scenes } = useScenes();
  const toast = useToast();
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
          <View style={styles.userIdentity}>
            <View style={styles.avatarCircle}>
              <UserIcon size={22} color={COLORS.primary} />
            </View>
            <View style={{ flex: 1 }}>
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
            style={styles.pointsCard}
            activeOpacity={0.85}
            onPress={() => go('MySubmissions')}
          >
            <View style={styles.pointsIconWrap}>
              <Coins color={COLORS.secondary} size={22} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.pointsValue}>
                {points} · {t('myPoints')}
              </Text>
              <Text style={styles.pointsSub}>{t('myPointsSub')}</Text>
            </View>
            <ChevronRight color={COLORS.muted} size={18} />
          </TouchableOpacity>

          <View style={styles.dividerLine} />

          {/* Language Habit */}

          {/* بدنه‌ی قابل‌اسکرول: تعداد ردیف‌ها ممکنه با اضافه‌شدن فیچرهای بعدی
              زیاد بشه، و روی گوشی‌های صفحه‌کوچیک (مثل Galaxy J5) بدون اسکرول
              ردیف‌ها روی هم می‌ریزن یا از صفحه بیرون می‌زنن. */}
          <ScrollView style={styles.menuScroll} showsVerticalScrollIndicator={false}>
          <View style={styles.sectionHeaderRow}>
            <Zap color={COLORS.secondary} size={18} />
            <Text style={styles.sectionTitle}>{t('habitCardTitle')}</Text>
          </View>

          {/* هر ردیف رنگ اختصاصی خودش را دارد — هم برای تشخیص سریع‌تر، هم تا
              وقتی از این ردیف وارد صفحه‌اش می‌شوی، همون رنگ آنجا هم ادامه پیدا
              کند (زبانه سبز → صفحه‌ی عادت زبانی هم لهجه‌ی سبز دارد، و…). */}
          <TouchableOpacity
            style={styles.row}
            activeOpacity={0.7}
            onPress={() => go('LanguageHabit')}
          >
            <View style={[styles.rowIconWrap, { backgroundColor: COLORS.tertiaryLight }]}>
              <Target color={COLORS.tertiary} size={18} />
            </View>
            <Text style={styles.rowText}>{t('habitRealSituations')}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.row}
            activeOpacity={0.7}
            onPress={handleOpenConversation}
          >
            <View style={[styles.rowIconWrap, { backgroundColor: COLORS.primaryLight }]}>
              <MessageCircle color={COLORS.primary} size={18} />
            </View>
            <Text style={styles.rowText}>{t('drawerConversationTitle')}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.row}
            activeOpacity={0.7}
            onPress={() => go('TopicSuggestion')}
          >
            <View style={[styles.rowIconWrap, { backgroundColor: COLORS.warningLight }]}>
              <Lightbulb color={COLORS.warning} size={18} />
            </View>
            <Text style={styles.rowText}>{t('habitSuggestTopic')}</Text>
          </TouchableOpacity>

          {/* پیشنهادات/انتقادات قبلاً ردیف جدا داشت؛ چون هر دو یک راه ارتباط
              با تیم‌اند، حالا زیر همین «ارتباط با ما» یکی شدند. */}
          <TouchableOpacity
            style={styles.row}
            activeOpacity={0.7}
            onPress={() => go('ContactUs')}
          >
            <View style={[styles.rowIconWrap, { backgroundColor: COLORS.infoLight }]}>
              <Mail color={COLORS.info} size={18} />
            </View>
            <Text style={styles.rowText}>{t('habitContactUs')}</Text>
          </TouchableOpacity>

          {onOpenPlacementTest && (
            <TouchableOpacity
              style={styles.row}
              activeOpacity={0.7}
              onPress={() => {
                onClose();
                onOpenPlacementTest();
              }}
            >
              <View style={[styles.rowIconWrap, { backgroundColor: COLORS.primaryLight }]}>
                <Mic color={COLORS.primary} size={18} />
              </View>
              <Text style={styles.rowText}>{t('placementDrawerTitle')}</Text>
            </TouchableOpacity>
          )}

          <View style={styles.dividerLine} />

          {/* رضایت صریح کاربر برای پوش یادآوری استریک — پیش‌فرض خاموش. طلایی
              چون هم‌رنگ شعله‌ی استریکه، نه چون CTA اصلیه. */}
          <View style={styles.streakReminderRow}>
            <View style={[styles.rowIconWrap, { backgroundColor: COLORS.secondaryLight }]}>
              <Bell color={COLORS.secondary} size={18} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.rowText}>{t('streakReminderTitle')}</Text>
              <Text style={styles.streakReminderSub}>{t('streakReminderSub')}</Text>
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
          <View style={styles.streakReminderRow}>
            <View style={[styles.rowIconWrap, { backgroundColor: COLORS.infoLight }]}>
              <BookOpen color={COLORS.info} size={18} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.rowText}>{t('vocabReminderTitle')}</Text>
              <Text style={styles.streakReminderSub}>{t('vocabReminderSub')}</Text>
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
          <View style={styles.streakReminderRow}>
            <View style={[styles.rowIconWrap, { backgroundColor: COLORS.tertiaryLight }]}>
              <TrendingUp color={COLORS.tertiary} size={18} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.rowText}>{t('weeklyDigestTitle')}</Text>
              <Text style={styles.streakReminderSub}>{t('weeklyDigestSub')}</Text>
            </View>
            <Switch
              value={weeklyDigestEnabled}
              onValueChange={setWeeklyDigestEnabled}
              trackColor={{ true: COLORS.primary }}
            />
          </View>

          <View style={styles.dividerLine} />

          {/* هدف یادگیری اختیاری — فقط برای اولویت‌دهیِ نرم به انتخاب صحنه در
              Today's Mission، نه فیلتر. توگل نیست چون تک‌انتخابی از چند
              گزینه‌ی ثابت است، عیناً هم‌الگوی contentSource در تنظیمات نوتیف. */}
          <View style={styles.goalRow}>
            <View style={styles.streakReminderRow}>
              <View style={[styles.rowIconWrap, { backgroundColor: COLORS.tertiaryLight }]}>
                <Compass color={COLORS.tertiary} size={18} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.rowText}>{t('learningGoalTitle')}</Text>
                <Text style={styles.streakReminderSub}>{t('learningGoalSub')}</Text>
              </View>
            </View>
            <View style={styles.goalPillGroup}>
              {(
                [
                  { id: '', label: t('learningGoalNone') },
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

          <TouchableOpacity style={styles.row} activeOpacity={0.7} onPress={() => go('HelpFaq')}>
            <View style={[styles.rowIconWrap, { backgroundColor: COLORS.primaryLight }]}>
              <HelpCircle color={COLORS.primary} size={18} />
            </View>
            <Text style={styles.rowText}>{t('helpFaq')}</Text>
          </TouchableOpacity>
          </ScrollView>

          <TouchableOpacity
            style={styles.row}
            activeOpacity={0.7}
            onPress={() => {
              onClose();
              logout();
            }}
          >
            <LogOut color={COLORS.error} size={18} />
            <Text style={[styles.rowText, { color: COLORS.error }]}>{t('logout')}</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  drawer: {
    width: DRAWER_WIDTH,
    height: '100%',
    backgroundColor: COLORS.surface,
    paddingTop: 56,
    paddingHorizontal: SPACING.m,
    paddingBottom: SPACING.l,
  },
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
  avatarCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  userName: {
    color: COLORS.text,
    fontFamily: FONT_FAMILY.bold,
    fontSize: 15,
    flexShrink: 1,
  },
  levelChip: {
    alignSelf: 'flex-start',
    backgroundColor: COLORS.primaryLight,
    borderRadius: BORDER_RADIUS.full,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginTop: 4,
  },
  levelChipText: {
    color: COLORS.primary,
    fontFamily: FONT_FAMILY.semiBold,
    fontSize: 11,
  },
  pointsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: COLORS.backgroundSoft,
    borderRadius: BORDER_RADIUS.l,
    padding: 14,
    marginBottom: 16,
  },
  pointsIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
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
  dividerLine: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: 12,
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
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
  },
  rowText: {
    color: COLORS.text,
    fontFamily: FONT_FAMILY.medium,
    fontSize: 14,
  },
  rowIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
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
  goalPillGroup: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  goalPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: BORDER_RADIUS.full,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
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
