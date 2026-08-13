import React from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Award, BarChart2, CheckCircle2, ChevronRight, Coins, HelpCircle, Play, PlusCircle, Settings, User as UserIcon } from 'lucide-react-native';
import { SceneListCard } from '../components/SceneListCard';
import { useScenes } from '../data/ScenesContext';
import type { ScenarioCategory } from '../data/scenarios';
import { COLORS } from '../theme/colors';
import { FONT_FAMILY } from '../theme/typography';
import { useLanguage } from '../data/i18n';

export { HomeScreen } from './Home';

type CategoryFilter = ScenarioCategory | 'all';

export const ScenesScreen = () => {
  const navigation = useNavigation<any>();
  const { scenes } = useScenes();
  const { t } = useLanguage();
  const [activeCategory, setActiveCategory] = React.useState<CategoryFilter>('all');

  const categories: { id: CategoryFilter; label: string }[] = [
    { id: 'business', label: t('categoryBusiness') },
    { id: 'travel', label: t('categoryTravel') },
    { id: 'daily', label: t('categoryDaily') },
    { id: 'all', label: t('all') },
  ];

  const filteredScenes = scenes.filter(
    (scenario) => activeCategory === 'all' || scenario.category === activeCategory
  );

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
      <View style={styles.topBar}>
        <Text style={styles.kicker}>{t('worlds')}</Text>
        <TouchableOpacity style={styles.iconButton} onPress={() => navigation.navigate('Profile')}>
          <Settings color={COLORS.text} size={20} />
        </TouchableOpacity>
      </View>
      <Text style={styles.pageTitle}>{t('chooseScenarioTitle')}</Text>
      <Text style={styles.pageSub}>{t('chooseScenarioSub')}</Text>

      <View style={styles.categoryRow}>
        {categories.map((cat) => (
          <TouchableOpacity
            key={cat.id}
            style={[styles.categoryChip, activeCategory === cat.id && styles.categoryChipActive]}
            onPress={() => setActiveCategory(cat.id)}
          >
            <Text
              style={[styles.categoryChipText, activeCategory === cat.id && styles.categoryChipTextActive]}
            >
              {cat.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity
        style={styles.suggestSceneCard}
        onPress={() => navigation.navigate('SubmitScene')}
        activeOpacity={0.85}
      >
        <View style={styles.suggestSceneIcon}>
          <PlusCircle color={COLORS.primary} size={20} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.suggestSceneTitle}>{t('submitSceneTitle')}</Text>
          <Text style={styles.suggestSceneSub}>{t('submitSceneSub')}</Text>
        </View>
        <ChevronRight color={COLORS.muted} size={18} />
      </TouchableOpacity>

      {filteredScenes.length === 0 ? (
        <Text style={styles.emptyCategoryText}>{t('noScenariosInCategory')}</Text>
      ) : (
        <View style={styles.featuredList}>
          {filteredScenes.map((scenario) => (
            <SceneListCard
              key={scenario.id}
              title={scenario.title}
              level={scenario.level}
              time={scenario.time}
              imageUri={scenario.imageUri}
              onPress={() => navigation.navigate('Shadowing', { scenarioId: scenario.id })}
            />
          ))}
        </View>
      )}
    </ScrollView>
  );
};

const WEEK_DAYS: { en: string; fa: string; minutes: number }[] = [
  { en: 'Mon', fa: 'ش', minutes: 12 },
  { en: 'Tue', fa: 'ی', minutes: 18 },
  { en: 'Wed', fa: 'د', minutes: 9 },
  { en: 'Thu', fa: 'س', minutes: 24 },
  { en: 'Fri', fa: 'چ', minutes: 15 },
  { en: 'Sat', fa: 'پ', minutes: 30 },
  { en: 'Sun', fa: 'ج', minutes: 21 },
];
const WEEKLY_ACTIVITY_MAX = 30;

const SKILLS: { key: 'pronunciation' | 'fluency' | 'vocabulary' | 'listening'; percent: number; color: string }[] = [
  { key: 'pronunciation', percent: 90, color: COLORS.primary },
  { key: 'fluency', percent: 83, color: COLORS.tertiary },
  { key: 'vocabulary', percent: 76, color: COLORS.secondary },
  { key: 'listening', percent: 88, color: COLORS.primary },
];

const ACHIEVEMENTS: { titleKey: string; subKey: string; earned: boolean }[] = [
  { titleKey: 'achievementFirstScene', subKey: 'achievementFirstSceneSub', earned: true },
  { titleKey: 'achievementStreak7', subKey: 'achievementStreak7Sub', earned: true },
  { titleKey: 'achievementWords50', subKey: 'achievementWords50Sub', earned: false },
  { titleKey: 'achievementPerfectPron', subKey: 'achievementPerfectPronSub', earned: false },
];

export const ProgressScreen = () => {
  const { t, language } = useLanguage();

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
      <Text style={styles.pageTitle}>{t('greatJobTitle')}</Text>
      <Text style={styles.pageSub}>{t('greatJobSub')}</Text>

      <View style={styles.scoreCard}>
        <View style={styles.scoreRing}>
          <Text style={styles.scoreValue}>87</Text>
          <Text style={styles.scoreLabel}>{t('overallScore')}</Text>
        </View>
        <View style={styles.scoreRow}>
          <View style={styles.scoreMetric}>
            <Text style={styles.metricValue}>90%</Text>
            <Text style={styles.metricLabel}>{t('pronunciation')}</Text>
          </View>
          <View style={styles.scoreMetric}>
            <Text style={styles.metricValue}>83%</Text>
            <Text style={styles.metricLabel}>{t('fluency')}</Text>
          </View>
        </View>
      </View>

      <View style={styles.practiceCard}>
        <Text style={styles.cardTitle}>{t('compareAudio')}</Text>
        <View style={styles.waveRow}>
          <TouchableOpacity style={styles.playCircle}>
            <Play color={COLORS.white} size={18} fill={COLORS.white} />
          </TouchableOpacity>
          <View style={styles.waveform}>
            {Array.from({ length: 28 }).map((_, index) => (
              <View
                key={index}
                style={[
                  styles.waveBar,
                  {
                    height: 8 + ((index * 7) % 24),
                    backgroundColor: index % 2 === 0 ? COLORS.primary : COLORS.tertiary,
                  },
                ]}
              />
            ))}
          </View>
        </View>
      </View>

      {/* Weekly Activity */}
      <View style={[styles.settingCard, { marginTop: 16 }]}>
        <View style={styles.sectionHeaderRow}>
          <BarChart2 color={COLORS.primary} size={20} />
          <Text style={styles.settingCardTitle}>{t('weeklyActivity')}</Text>
        </View>
        <Text style={styles.optionSub}>{t('weeklyActivitySub')}</Text>

        <View style={styles.weekChartRow}>
          {WEEK_DAYS.map((day, i) => {
            const heightPct = Math.max(6, (day.minutes / WEEKLY_ACTIVITY_MAX) * 100);
            const isToday = i === WEEK_DAYS.length - 2;
            return (
              <View key={day.en} style={styles.weekBarCol}>
                <View style={styles.weekBarTrack}>
                  <View
                    style={[
                      styles.weekBarFill,
                      { height: `${heightPct}%`, backgroundColor: isToday ? COLORS.primary : COLORS.primaryLight },
                    ]}
                  />
                </View>
                <Text style={[styles.weekBarLabel, isToday && styles.weekBarLabelActive]}>
                  {language === 'fa' ? day.fa : day.en}
                </Text>
              </View>
            );
          })}
        </View>
      </View>

      {/* Skill Breakdown */}
      <View style={[styles.settingCard, { marginTop: 16 }]}>
        <View style={styles.sectionHeaderRow}>
          <CheckCircle2 color={COLORS.tertiary} size={20} />
          <Text style={styles.settingCardTitle}>{t('skillBreakdown')}</Text>
        </View>

        {SKILLS.map((skill) => (
          <View key={skill.key} style={styles.skillRow}>
            <View style={styles.skillLabelRow}>
              <Text style={styles.skillLabel}>{t(skill.key)}</Text>
              <Text style={styles.skillPercent}>{skill.percent}%</Text>
            </View>
            <View style={styles.skillTrack}>
              <View style={[styles.skillFill, { width: `${skill.percent}%`, backgroundColor: skill.color }]} />
            </View>
          </View>
        ))}
      </View>

      {/* Achievements */}
      <View style={[styles.settingCard, { marginTop: 16, marginBottom: 20 }]}>
        <View style={styles.sectionHeaderRow}>
          <Award color={COLORS.secondary} size={20} />
          <Text style={styles.settingCardTitle}>{t('achievementsTitle')}</Text>
        </View>

        <View style={styles.achievementGrid}>
          {ACHIEVEMENTS.map((a) => (
            <View
              key={a.titleKey}
              style={[styles.achievementCard, !a.earned && styles.achievementCardLocked]}
            >
              <View style={[styles.achievementBadge, !a.earned && styles.achievementBadgeLocked]}>
                <Award color={a.earned ? COLORS.white : COLORS.muted} size={20} />
              </View>
              <Text style={[styles.achievementTitle, !a.earned && styles.achievementTitleLocked]}>
                {t(a.titleKey)}
              </Text>
              <Text style={styles.achievementSub}>{t(a.subKey)}</Text>
            </View>
          ))}
        </View>
      </View>
    </ScrollView>
  );
};

import { useNotifications, ReminderTime, ContentSource } from '../data/NotificationContext';
import { Switch } from 'react-native';
import { Bell, BookOpen, Clock, LogOut, Sparkles } from 'lucide-react-native';
import { useAuth } from '../data/AuthContext';
import { useFocusEffect } from '@react-navigation/native';
import { getMyPoints } from '../api/submissions';

export const ProfileScreen = () => {
  const navigation = useNavigation<any>();
  const { language, setLanguage, t } = useLanguage();
  const { user, logout } = useAuth();
  const {
    studyReminderEnabled,
    setStudyReminderEnabled,
    studyReminderTime,
    setStudyReminderTime,
    contentNotificationEnabled,
    setContentNotificationEnabled,
    contentSource,
    setContentSource,
    triggerTestNotification,
  } = useNotifications();

  const [points, setPoints] = React.useState(0);

  useFocusEffect(
    React.useCallback(() => {
      let active = true;
      getMyPoints()
        .then((p) => active && setPoints(p))
        .catch(() => {});
      return () => {
        active = false;
      };
    }, [])
  );

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
      <Text style={styles.pageTitle}>{t('profileTitle')}</Text>
      <Text style={styles.pageSub}>{t('profileSub')}</Text>

      <View style={styles.profileHeader}>
        <View style={styles.avatarCircle}>
          <UserIcon size={36} color={COLORS.primary} />
        </View>
        <Text style={styles.profileName}>{user?.nickname || ''}</Text>
        <Text style={styles.profileSub}>{user?.phone || t('learnerLevel')}</Text>
      </View>

      {/* Points & Scene Suggestions Card */}
      <TouchableOpacity
        style={styles.pointsCard}
        onPress={() => navigation.navigate('MySubmissions')}
        activeOpacity={0.85}
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

      {/* Language Setting Card */}
      <View style={styles.settingCard}>
        <Text style={styles.settingLabel}>{t('appLanguage')}</Text>
        <View style={styles.langToggleRow}>
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

      {/* Notifications & Reminders Card */}
      <View style={[styles.settingCard, { marginTop: 16 }]}>
        <View style={styles.sectionHeaderRow}>
          <Bell color={COLORS.primary} size={20} />
          <Text style={styles.settingCardTitle}>{t('notificationsTitle')}</Text>
        </View>

        {/* Option 1: Daily Study Reminder */}
        <View style={styles.toggleRow}>
          <View style={{ flex: 1, paddingRight: 12 }}>
            <Text style={styles.optionTitle}>{t('studyReminder')}</Text>
            <Text style={styles.optionSub}>{t('studyReminderSub')}</Text>
          </View>
          <Switch
            value={studyReminderEnabled}
            onValueChange={setStudyReminderEnabled}
            trackColor={{ false: COLORS.surfaceLight, true: COLORS.primary }}
            thumbColor={studyReminderEnabled ? COLORS.white : COLORS.textSecondary}
          />
        </View>

        {studyReminderEnabled && (
          <View style={styles.subOptionGroup}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8, gap: 6 }}>
              <Clock color={COLORS.textSecondary} size={14} />
              <Text style={styles.subOptionLabel}>{t('reminderTime')}</Text>
            </View>
            <View style={styles.pillGroup}>
              {(['09:00', '14:00', '20:00'] as ReminderTime[]).map((time) => (
                <TouchableOpacity
                  key={time}
                  style={[styles.pillBtn, studyReminderTime === time && styles.pillBtnActive]}
                  onPress={() => setStudyReminderTime(time)}
                >
                  <Text style={[styles.pillText, studyReminderTime === time && styles.pillTextActive]}>
                    {time === '09:00' ? '09:00 AM' : time === '14:00' ? '02:00 PM' : '08:00 PM'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        <View style={styles.dividerLine} />

        {/* Option 2: Leitner & Lesson Sentences Alerts */}
        <View style={styles.toggleRow}>
          <View style={{ flex: 1, paddingRight: 12 }}>
            <Text style={styles.optionTitle}>{t('contentNotification')}</Text>
            <Text style={styles.optionSub}>{t('contentNotificationSub')}</Text>
          </View>
          <Switch
            value={contentNotificationEnabled}
            onValueChange={setContentNotificationEnabled}
            trackColor={{ false: COLORS.surfaceLight, true: COLORS.tertiary }}
            thumbColor={contentNotificationEnabled ? COLORS.white : COLORS.textSecondary}
          />
        </View>

        {contentNotificationEnabled && (
          <View style={styles.subOptionGroup}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8, gap: 6 }}>
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

        {/* Test Notification Trigger Button */}
        <TouchableOpacity
          style={styles.testBtn}
          onPress={() => triggerTestNotification()}
        >
          <Sparkles color={COLORS.white} size={16} />
          <Text style={styles.testBtnText}>{t('sendTestNotification')}</Text>
        </TouchableOpacity>
      </View>

      {/* Support & Actions */}
      <View style={[styles.settingCard, { marginTop: 16 }]}>
        <TouchableOpacity style={styles.helpRow} activeOpacity={0.7}>
          <View style={styles.helpRowLeft}>
            <HelpCircle color={COLORS.primary} size={20} />
            <Text style={styles.helpRowText}>{t('helpFaq')}</Text>
          </View>
          <ChevronRight color={COLORS.muted} size={18} />
        </TouchableOpacity>

        <View style={styles.dividerLine} />

        <TouchableOpacity style={styles.helpRow} activeOpacity={0.7} onPress={() => logout()}>
          <View style={styles.helpRowLeft}>
            <LogOut color={COLORS.error} size={20} />
            <Text style={[styles.helpRowText, { color: COLORS.error }]}>{t('logout')}</Text>
          </View>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 54,
    paddingBottom: 90,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  kicker: {
    color: COLORS.primary,
    fontFamily: FONT_FAMILY.bold,
    fontSize: 12,
    letterSpacing: 1,
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pageTitle: {
    color: COLORS.text,
    fontFamily: FONT_FAMILY.bold,
    fontSize: 26,
    marginBottom: 4,
  },
  pageSub: {
    color: COLORS.textSecondary,
    fontFamily: FONT_FAMILY.regular,
    fontSize: 14,
    marginBottom: 24,
  },
  featuredList: {
    gap: 4,
  },
  categoryRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 20,
  },
  categoryChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  categoryChipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  categoryChipText: {
    color: COLORS.textSecondary,
    fontFamily: FONT_FAMILY.semiBold,
    fontSize: 13,
  },
  categoryChipTextActive: {
    color: COLORS.white,
  },
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
  scoreCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 20,
  },
  scoreRing: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 4,
    borderColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  scoreValue: {
    color: COLORS.text,
    fontSize: 32,
    fontWeight: '800',
  },
  scoreLabel: {
    color: COLORS.textSecondary,
    fontSize: 11,
  },
  scoreRow: {
    flexDirection: 'row',
    gap: 40,
  },
  scoreMetric: {
    alignItems: 'center',
  },
  metricValue: {
    color: COLORS.tertiary,
    fontSize: 20,
    fontWeight: '800',
  },
  metricLabel: {
    color: COLORS.textSecondary,
    fontSize: 12,
    marginTop: 2,
  },
  practiceCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 24,
    padding: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cardTitle: {
    color: COLORS.text,
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 12,
  },
  waveRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  playCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  waveform: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    height: 32,
  },
  waveBar: {
    width: 3,
    borderRadius: 1.5,
  },
  profileHeader: {
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 20,
  },
  avatarCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: COLORS.surfaceLight,
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
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 20,
  },
  pointsIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.backgroundSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pointsValue: {
    color: COLORS.text,
    fontFamily: FONT_FAMILY.bold,
    fontSize: 15,
  },
  pointsSub: {
    color: COLORS.textSecondary,
    fontFamily: FONT_FAMILY.regular,
    fontSize: 12,
    marginTop: 2,
  },
  settingCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 24,
    padding: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  settingLabel: {
    color: COLORS.text,
    fontFamily: FONT_FAMILY.semiBold,
    fontSize: 15,
    marginBottom: 12,
  },
  langToggleRow: {
    flexDirection: 'row',
    backgroundColor: COLORS.surfaceLight,
    borderRadius: 14,
    padding: 4,
  },
  langBtn: {
    flex: 1,
    paddingVertical: 10,
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
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  settingCardTitle: {
    color: COLORS.text,
    fontFamily: FONT_FAMILY.bold,
    fontSize: 16,
  },
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
  subOptionGroup: {
    marginTop: 10,
    marginBottom: 10,
    paddingLeft: 4,
  },
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
  pillBtnWideActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  pillText: {
    color: COLORS.textSecondary,
    fontFamily: FONT_FAMILY.semiBold,
    fontSize: 12,
  },
  pillTextActive: {
    color: COLORS.white,
  },
  dividerLine: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: 14,
  },
  testBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    borderRadius: 16,
    height: 48,
    marginTop: 16,
    gap: 8,
  },
  testBtnText: {
    color: COLORS.white,
    fontFamily: FONT_FAMILY.bold,
    fontSize: 14,
  },
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
  weekChartRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 120,
    marginTop: 16,
  },
  weekBarCol: {
    alignItems: 'center',
    flex: 1,
    height: '100%',
  },
  weekBarTrack: {
    flex: 1,
    width: 14,
    borderRadius: 7,
    backgroundColor: COLORS.backgroundSoft,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  weekBarFill: {
    width: '100%',
    borderRadius: 7,
  },
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
  skillRow: {
    marginTop: 14,
  },
  skillLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  skillLabel: {
    color: COLORS.text,
    fontFamily: FONT_FAMILY.semiBold,
    fontSize: 13,
  },
  skillPercent: {
    color: COLORS.textSecondary,
    fontFamily: FONT_FAMILY.semiBold,
    fontSize: 13,
  },
  skillTrack: {
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.backgroundSoft,
    overflow: 'hidden',
  },
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
    width: '47%',
    backgroundColor: COLORS.backgroundSoft,
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  achievementCardLocked: {
    opacity: 0.55,
  },
  achievementBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  achievementBadgeLocked: {
    backgroundColor: COLORS.surfaceLight,
  },
  achievementTitle: {
    color: COLORS.text,
    fontFamily: FONT_FAMILY.bold,
    fontSize: 13,
    marginBottom: 4,
  },
  achievementTitleLocked: {
    color: COLORS.textSecondary,
  },
  achievementSub: {
    color: COLORS.textSecondary,
    fontFamily: FONT_FAMILY.regular,
    fontSize: 11,
    lineHeight: 15,
  },
});
