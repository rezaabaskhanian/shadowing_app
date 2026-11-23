import React, { useEffect, useState } from 'react';
import {
  Dimensions,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  Award,
  Calendar,
  Check,
  ChevronLeft,
  ChevronRight,
  EyeOff,
  Flame,
  Headphones,
  Lock,
  Play,
  RotateCcw,
  Sparkles,
  Trophy,
  Volume2,
  X,
  Zap,
} from 'lucide-react-native';

import { COLORS } from '../../theme/colors';
import { FONT_FAMILY } from '../../theme/typography';
import { SHADOWS } from '../../theme/elevation';

export interface ChallengeProgress {
  startDate: string;
  completedDays: number[]; // 1..28
  lastCompletedAt: string | null;
  currentDay: number; // 1..28
  isFinished: boolean;
}

export const STORAGE_KEY = '@shadowing_28day_challenge_v1';
export const CHALLENGE_STORAGE_KEY = STORAGE_KEY;

/**
 * ثبت خودکار روز جاری چالش ۲۸ روزه به عنوان انجام‌شده (هنگام اتمام موفقیت‌آمیز درس شادوئینگ)
 * این تابع فقط توسط خود اپلیکیشن پس از اتمام ارزیابی و مقایسه تمام جملات درس فراخوانی می‌شود.
 */
export const markTodayChallengeCompleted = async (): Promise<{
  updated: ChallengeProgress;
  dayCompleted: number;
  isFirstTimeToday: boolean;
} | null> => {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    const progress: ChallengeProgress = raw
      ? JSON.parse(raw)
      : {
          startDate: new Date().toISOString(),
          completedDays: [],
          lastCompletedAt: null,
          currentDay: 1,
          isFinished: false,
        };

    const targetDay = progress.currentDay;
    const isFirstTimeToday = !progress.completedDays.includes(targetDay);
    if (isFirstTimeToday) {
      const nextCompleted = [...progress.completedDays, targetDay].sort((a, b) => a - b);
      const nextCurrent = Math.min(28, targetDay + 1);
      const nextFinished = nextCompleted.length >= 28;
      const updated: ChallengeProgress = {
        ...progress,
        completedDays: nextCompleted,
        lastCompletedAt: new Date().toISOString(),
        currentDay: nextFinished ? 28 : nextCurrent,
        isFinished: nextFinished,
      };
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return { updated, dayCompleted: targetDay, isFirstTimeToday: true };
    }
    return { updated: progress, dayCompleted: targetDay, isFirstTimeToday: false };
  } catch {
    return null;
  }
};

export const CHALLENGE_WEEKS = [
  {
    week: 1,
    titleFa: 'هفته اول: زمزمه ملایم و کشف ریتم (Mumbling)',
    titleEn: 'Week 1: Sound Catching & Mumbling',
    days: [1, 2, 3, 4, 5, 6, 7],
    targetSpeed: '0.85x',
    badgeTitle: 'آغازگر شادوئینگ 🥉',
    color: '#6366F1',
    bgColor: 'rgba(99, 102, 241, 0.1)',
    goalFa: 'روزانه ۱۰ دقیقه زمزمه آرام با سرعت ۰.۸۵x برای شکستن یخ عضلات گفتاری و سازگاری با ریتم گفتار پیوسته.',
    ruleFa: 'وسواس روی تک‌تک کلمات نداشته باشید؛ فقط صدای گوینده را مثل سایه دنبال کنید.',
  },
  {
    week: 2,
    titleFa: 'هفته دوم: هم‌خوانی با متن و استرس کلمات (Shadow Reading)',
    titleEn: 'Week 2: Shadow Reading & Stress',
    days: [8, 9, 10, 11, 12, 13, 14],
    targetSpeed: '0.85x ➔ 1.0x',
    badgeTitle: 'ریتم‌شناس ماهر 🥈',
    color: '#0EA5E9',
    bgColor: 'rgba(14, 165, 233, 0.1)',
    goalFa: 'هم‌خوانی هم‌زمان با متن و فعال‌سازی راهنمای ریتم (🎵). تکیه قوی روی کلمات محتوایی و اتصال کلمات (‿).',
    ruleFa: 'کلمات پررنگ (استرس‌دار) را با انرژی بالاتر و کلمات ربطی را سریع و پیوسته ادا کنید.',
  },
  {
    week: 3,
    titleFa: 'هفته سوم: شادوئینگ نابینا فقط با گوش (Blind Shadowing)',
    titleEn: 'Week 3: Blind Shadowing by Ear',
    days: [15, 16, 17, 18, 19, 20, 21],
    targetSpeed: '1.0x',
    badgeTitle: 'گوش طلایی شادوئینگ 🥇',
    color: '#F59E0B',
    bgColor: 'rgba(245, 158, 11, 0.1)',
    goalFa: 'پنهان کردن متن با دکمه (👁️) و اتکای ۱۰۰٪ به گوش؛ مغز بدون کمک چشم کلمات را در لحظه دریافت و ادا می‌کند.',
    ruleFa: 'اگر در جمله‌ای جا ماندید، با دکمه تکرار یک بار دیگر گوش دهید تا گوش تقویت شود.',
  },
  {
    week: 4,
    titleFa: 'هفته چهارم: روانی گفتار و سرعت نیتیو (Fluency & Mastery)',
    titleEn: 'Week 4: Full Fluency & Mastery',
    days: [22, 23, 24, 25, 26, 27, 28],
    targetSpeed: '1.0x 🚀',
    badgeTitle: 'استاد روانی شادوئینگ 🏆',
    color: '#10B981',
    bgColor: 'rgba(16, 185, 129, 0.1)',
    goalFa: 'سرعت طبیعی ۱.۰x با ضبط مستقل و تحلیل ۳ فاکتوره هوش مصنوعی (مکث، استرس و ملودی لحن) بالای ۸۵٪.',
    ruleFa: 'همانند یک نیتیو صحبت کنید و گزارش کارنامه هوش مصنوعی خود را جشن بگیرید.',
  },
];

interface ShadowingChallengeModalProps {
  visible: boolean;
  onClose: () => void;
  onStartTodayPractice: (weekNumber: number, dayNumber: number) => void;
  rtl?: boolean;
}

export const ShadowingChallengeModal: React.FC<ShadowingChallengeModalProps> = ({
  visible,
  onClose,
  onStartTodayPractice,
  rtl = true,
}) => {
  const [progress, setProgress] = useState<ChallengeProgress>({
    startDate: new Date().toISOString(),
    completedDays: [],
    lastCompletedAt: null,
    currentDay: 1,
    isFinished: false,
  });

  // بارگذاری پیشرفت کاربر از استوریج
  const loadProgress = async () => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed: ChallengeProgress = JSON.parse(raw);
        setProgress(parsed);
      }
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    if (visible) {
      loadProgress();
    }
  }, [visible]);

  // اطلاعات روز انتخاب شده برای نمایش بازخورد (بدون تیک دستی)
  const [selectedDayInfo, setSelectedDayInfo] = useState<{
    day: number;
    status: 'done' | 'current' | 'locked';
    message: string;
  } | null>(null);

  // پاک کردن پیام وضعیت بعد از ۳.۵ ثانیه
  useEffect(() => {
    if (selectedDayInfo) {
      const timer = setTimeout(() => setSelectedDayInfo(null), 3500);
      return () => clearTimeout(timer);
    }
  }, [selectedDayInfo]);

  // کلیک روی روزها: بدون امکان تیک زدن دستی؛ فقط نمایش وضعیت ماموریت بر اساس عملکرد واقعی کاربر در اپ
  const handleDayPress = (dayNum: number, isDone: boolean, isCurrent: boolean, isLocked: boolean) => {
    if (isDone) {
      setSelectedDayInfo({
        day: dayNum,
        status: 'done',
        message: rtl
          ? `روز ${dayNum} با پایان موفقیت‌آمیز تمرین شادوئینگ در اپ تیک خورده است ✅`
          : `Day ${dayNum} completed via shadowing practice in the app ✅`,
      });
    } else if (isCurrent) {
      setSelectedDayInfo({
        day: dayNum,
        status: 'current',
        message: rtl
          ? `ماموریت فعال امروز (روز ${dayNum}): با تکمیل یک درس شادوئینگ در اپ، تیک سبز خودکار فعال می‌شود 🎙️`
          : `Today's mission (Day ${dayNum}): Complete a shadowing lesson in the app to earn the green checkmark 🎙️`,
      });
    } else if (isLocked) {
      setSelectedDayInfo({
        day: dayNum,
        status: 'locked',
        message: rtl
          ? `روز ${dayNum} قفل است 🔒 برای رسیدن به این روز، ابتدا باید ماموریت‌های قبلی را انجام دهید.`
          : `Day ${dayNum} is locked 🔒 Finish prior missions to unlock.`,
      });
    }
  };

  // ریست چالش
  const handleResetChallenge = async () => {
    const fresh: ChallengeProgress = {
      startDate: new Date().toISOString(),
      completedDays: [],
      lastCompletedAt: null,
      currentDay: 1,
      isFinished: false,
    };
    setProgress(fresh);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(fresh)).catch(() => { });
  };

  // هفته فعال فعلی
  const activeWeekIdx = Math.min(3, Math.floor((progress.currentDay - 1) / 7));
  const activeWeek = CHALLENGE_WEEKS[activeWeekIdx];
  const percentDone = Math.round((progress.completedDays.length / 28) * 100);

  const row = rtl && styles.rowReverse;
  const ta = rtl ? styles.textRight : styles.textLeft;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Header */}
          <View style={[styles.header, row]}>
            <View style={[styles.titleRow, row]}>
              <View style={styles.headerIconCircle}>
                <Trophy size={20} color="#D97706" />
              </View>
              <View>
                <Text style={[styles.headerTitle, ta]}>
                  {rtl ? 'چالش ۲۸ روزه شادوئینگ علمی' : '28-Day Scientific Shadowing'}
                </Text>
                <Text style={[styles.headerSubtitle, ta]}>
                  {rtl
                    ? `برنامه ۴ هفته‌ای تثبیت روانی کلام • روز ${progress.currentDay} از ۲۸`
                    : `4-Week Fluency Roadmap • Day ${progress.currentDay} of 28`}
                </Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <X size={18} color="#6B7280" />
            </TouchableOpacity>
          </View>

          {/* Overall Progress Banner */}
          <View style={styles.summaryCard}>
            <View style={[styles.summaryTopRow, row]}>
              <View style={[styles.streakBadge, row]}>
                <Flame size={14} color="#EA580C" />
                <Text style={styles.streakBadgeText}>
                  {rtl
                    ? `${progress.completedDays.length} روز انجام شد`
                    : `${progress.completedDays.length} Days Done`}
                </Text>
              </View>
              <Text style={styles.percentText}>{percentDone}٪</Text>
            </View>

            <View style={styles.progressBarTrack}>
              <View style={[styles.progressBarFill, { width: `${Math.max(3, percentDone)}%` }]} />
            </View>

            <View style={[styles.targetCallout, row]}>
              <Sparkles size={14} color="#059669" />
              <Text style={[styles.targetCalloutText, ta]}>
                {rtl
                  ? `هدف این هفته: ${activeWeek.titleFa.split(':')[1] || activeWeek.titleFa} (سرعت ${activeWeek.targetSpeed})`
                  : `This Week's Goal: ${activeWeek.titleEn}`}
              </Text>
            </View>
          </View>

          {/* Weeks List & Days Grid */}
          <ScrollView contentContainerStyle={styles.scrollBody} showsVerticalScrollIndicator={false}>
            {/* پیام وضعیت روز لمس‌شده */}
            {selectedDayInfo && (
              <View style={[styles.dayStatusToast, row]}>
                <Sparkles size={14} color="#D97706" />
                <Text style={[styles.dayStatusToastText, ta]}>
                  {selectedDayInfo.message}
                </Text>
              </View>
            )}

            {CHALLENGE_WEEKS.map((w, wIdx) => {
              const isCurrentWeek = wIdx === activeWeekIdx;
              const weekCompletedCount = w.days.filter((d) => progress.completedDays.includes(d)).length;
              const isWeekAllDone = weekCompletedCount === 7;

              return (
                <View
                  key={w.week}
                  style={[
                    styles.weekCard,
                    isCurrentWeek && styles.weekCardActive,
                    isWeekAllDone && styles.weekCardCompleted,
                  ]}
                >
                  {/* Week Card Header */}
                  <View style={[styles.weekCardHeader, row]}>
                    <View style={{ flex: 1 }}>
                      <View style={[styles.weekBadgeRow, row]}>
                        <View style={[styles.weekNumberBadge, { backgroundColor: w.bgColor }]}>
                          <Text style={[styles.weekNumberBadgeText, { color: w.color }]}>
                            {rtl ? `هفته ${w.week}` : `Week ${w.week}`}
                          </Text>
                        </View>
                        <View style={styles.speedBadge}>
                          <Text style={styles.speedBadgeText}>سرعت {w.targetSpeed}</Text>
                        </View>
                        {isWeekAllDone && (
                          <View style={styles.doneBadge}>
                            <Check size={11} color="#059669" />
                            <Text style={styles.doneBadgeText}>{w.badgeTitle}</Text>
                          </View>
                        )}
                      </View>
                      <Text style={[styles.weekTitle, ta]}>{w.titleFa}</Text>
                    </View>
                  </View>

                  {/* Week Goal and Rule */}
                  <View style={styles.weekGoalBox}>
                    <Text style={[styles.weekGoalText, ta]}>{w.goalFa}</Text>
                    <Text style={[styles.weekRuleText, ta]}>💡 {w.ruleFa}</Text>
                  </View>

                  {/* 7 Days Row */}
                  <View style={[styles.daysGrid, row]}>
                    {w.days.map((dayNum) => {
                      const isDone = progress.completedDays.includes(dayNum);
                      const isCurrent = dayNum === progress.currentDay && !progress.isFinished;
                      const isLocked = dayNum > progress.currentDay && !isDone;

                      return (
                        <TouchableOpacity
                          key={dayNum}
                          activeOpacity={0.8}
                          onPress={() => handleDayPress(dayNum, isDone, isCurrent, isLocked)}
                          style={[
                            styles.dayCircle,
                            isDone && styles.dayCircleDone,
                            isCurrent && styles.dayCircleCurrent,
                            isLocked && styles.dayCircleLocked,
                          ]}
                        >
                          {isDone ? (
                            <Check size={15} color="#FFFFFF" />
                          ) : isCurrent ? (
                            <Flame size={15} color="#FFFFFF" />
                          ) : isLocked ? (
                            <Text style={styles.dayNumberTextLocked}>{dayNum}</Text>
                          ) : (
                            <Text style={styles.dayNumberText}>{dayNum}</Text>
                          )}
                          <Text
                            style={[
                              styles.daySubLabel,
                              isDone && styles.daySubLabelDone,
                              isCurrent && styles.daySubLabelCurrent,
                            ]}
                          >
                            {rtl ? `روز ${dayNum}` : `D${dayNum}`}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              );
            })}

            {/* Reset Challenge Link */}
            <View style={{ alignItems: 'center', marginTop: 10, marginBottom: 20 }}>
              <TouchableOpacity
                onPress={handleResetChallenge}
                style={[styles.resetBtn, row]}
                activeOpacity={0.7}
              >
                <RotateCcw size={13} color="#9CA3AF" />
                <Text style={styles.resetBtnText}>{rtl ? 'شروع دوباره از روز ۱' : 'Restart Challenge'}</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>

          {/* Bottom Action Bar */}
          <View style={[styles.bottomBar, row]}>
            <TouchableOpacity
              style={[styles.startPracticeBtn, row, { backgroundColor: activeWeek.color }]}
              activeOpacity={0.88}
              onPress={() => {
                onClose();
                onStartTodayPractice(activeWeek.week, progress.currentDay);
              }}
            >
              <Play size={16} color="#FFFFFF" fill="#FFFFFF" />
              <Text style={styles.startPracticeBtnText}>
                {rtl
                  ? `تمرین امروز (روز ${progress.currentDay} • ${activeWeek.targetSpeed}) 🎙️`
                  : `Start Day ${progress.currentDay} Practice 🎙️`}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 14,
  },
  container: {
    width: '100%',
    maxWidth: 440,
    maxHeight: '92%',
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    overflow: 'hidden',
    ...SHADOWS.level2,
  },
  rowReverse: {
    flexDirection: 'row-reverse',
  },
  textRight: {
    textAlign: 'right',
  },
  textLeft: {
    textAlign: 'left',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  headerIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#FEF3C7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontFamily: FONT_FAMILY.bold,
    fontSize: 15,
    color: '#111827',
  },
  headerSubtitle: {
    fontFamily: FONT_FAMILY.regular,
    fontSize: 11,
    color: '#6B7280',
    marginTop: 1,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  summaryCard: {
    paddingHorizontal: 18,
    paddingVertical: 12,
    backgroundColor: '#FAFAFA',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  summaryTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFF7ED',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  streakBadgeText: {
    fontFamily: FONT_FAMILY.bold,
    fontSize: 11,
    color: '#EA580C',
  },
  percentText: {
    fontFamily: FONT_FAMILY.bold,
    fontSize: 13,
    color: '#059669',
  },
  progressBarTrack: {
    height: 6,
    backgroundColor: '#E5E7EB',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#059669',
    borderRadius: 3,
  },
  targetCallout: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  targetCalloutText: {
    fontFamily: FONT_FAMILY.regular,
    fontSize: 11,
    color: '#047857',
    flex: 1,
  },
  scrollBody: {
    padding: 16,
    gap: 14,
  },
  weekCard: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
    padding: 14,
  },
  weekCardActive: {
    borderColor: '#2563EB',
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
  },
  weekCardCompleted: {
    borderColor: '#A7F3D0',
    backgroundColor: '#F0FDF4',
  },
  weekCardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  weekBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
    flexWrap: 'wrap',
  },
  weekNumberBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  weekNumberBadgeText: {
    fontFamily: FONT_FAMILY.bold,
    fontSize: 11,
  },
  speedBadge: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  speedBadgeText: {
    fontFamily: FONT_FAMILY.regular,
    fontSize: 10,
    color: '#4B5563',
  },
  doneBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  doneBadgeText: {
    fontFamily: FONT_FAMILY.bold,
    fontSize: 10,
    color: '#059669',
  },
  weekTitle: {
    fontFamily: FONT_FAMILY.bold,
    fontSize: 13,
    color: '#1F2937',
  },
  weekGoalBox: {
    backgroundColor: '#F9FAFB',
    borderRadius: 10,
    padding: 8,
    marginBottom: 12,
  },
  weekGoalText: {
    fontFamily: FONT_FAMILY.regular,
    fontSize: 11,
    color: '#4B5563',
    lineHeight: 16,
    marginBottom: 3,
  },
  weekRuleText: {
    fontFamily: FONT_FAMILY.regular,
    fontSize: 10.5,
    color: '#92400E',
    lineHeight: 15,
  },
  daysGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 4,
  },
  dayCircle: {
    flex: 1,
    aspectRatio: 0.9,
    borderRadius: 10,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  dayCircleDone: {
    backgroundColor: '#059669',
    borderColor: '#047857',
  },
  dayCircleCurrent: {
    backgroundColor: '#EA580C',
    borderColor: '#C2410C',
    borderWidth: 2,
  },
  dayCircleLocked: {
    backgroundColor: '#F9FAFB',
    opacity: 0.6,
  },
  dayNumberText: {
    fontFamily: FONT_FAMILY.bold,
    fontSize: 12,
    color: '#374151',
  },
  dayNumberTextLocked: {
    fontFamily: FONT_FAMILY.regular,
    fontSize: 11,
    color: '#9CA3AF',
  },
  daySubLabel: {
    fontFamily: FONT_FAMILY.regular,
    fontSize: 8.5,
    color: '#9CA3AF',
    marginTop: 1,
  },
  daySubLabelDone: {
    color: '#D1FAE5',
  },
  daySubLabelCurrent: {
    color: '#FED7AA',
    fontFamily: FONT_FAMILY.bold,
  },
  resetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    padding: 6,
  },
  resetBtnText: {
    fontFamily: FONT_FAMILY.regular,
    fontSize: 11,
    color: '#9CA3AF',
  },
  bottomBar: {
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    backgroundColor: '#FAFAFA',
  },
  startPracticeBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 13,
    borderRadius: 14,
  },
  startPracticeBtnText: {
    fontFamily: FONT_FAMILY.bold,
    fontSize: 13,
    color: '#FFFFFF',
  },
  dayStatusToast: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FEF3C7',
    paddingVertical: 9,
    paddingHorizontal: 12,
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  dayStatusToastText: {
    flex: 1,
    fontFamily: FONT_FAMILY.medium,
    fontSize: 11,
    color: '#92400E',
    lineHeight: 16,
  },
});
