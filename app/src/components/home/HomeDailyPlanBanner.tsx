import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Circle,
  Clock,
  Flame,
  Headphones,
  Mic,
  Play,
  Sparkles,
  Target,
} from 'lucide-react-native';
import { ProgressRing } from '../ProgressRing';
import { COLORS, SPACING } from '../../theme/colors';
import { FONT_FAMILY } from '../../theme/typography';
import { SHADOWS } from '../../theme/elevation';

interface HomeDailyPlanBannerProps {
  goalMinutes?: number;
  completedMinutes?: number;
  onPress: () => void;
  onContinue?: () => void;
  rtl?: boolean;
}

/**
 * ویجت مربی شخصی: برنامه یادگیری امروز (Daily Learning Coach)
 * شفاف، معنادار و تعاملی — راهنمایی دقیق کاربر برای اینکه امروز چه چیزی یاد بگیرد و چقدر باقی مانده است.
 */
export const HomeDailyPlanBanner: React.FC<HomeDailyPlanBannerProps> = ({
  goalMinutes = 15,
  completedMinutes = 6,
  onPress,
  onContinue,
  rtl = true,
}) => {
  const remaining = Math.max(0, goalMinutes - completedMinutes);
  const percent = Math.min(100, Math.round((completedMinutes / goalMinutes) * 100));
  const isDone = remaining === 0;

  const handleAction = onContinue || onPress;
  const ChevronIcon = rtl ? ChevronLeft : ChevronRight;

  return (
    <View style={styles.card}>
      {/* 1. Header: Coach Badge + Target Tag */}
      <View style={[styles.headerRow, rtl && styles.rowReverse]}>
        <View style={[styles.titleGroup, rtl && styles.rowReverse]}>
          <View style={styles.iconCircle}>
            <Target size={15} color="#FF6422" strokeWidth={2.4} />
          </View>
          <Text style={styles.titleText}>
            {rtl ? 'برنامه روزانه مربی' : 'Daily Coach Plan'}
          </Text>
        </View>

        <View style={[styles.streakBadge, rtl && styles.rowReverse]}>
          <Flame size={12} color="#FF6422" fill="#FF6422" />
          <Text style={styles.streakBadgeText}>
            {rtl ? 'حفظ استریک روزانه' : 'Keep Streak'}
          </Text>
        </View>
      </View>

      {/* 2. Main Progress Section: Circular Ring + Motivation Message */}
      <View style={[styles.mainSection, rtl && styles.rowReverse]}>
        {/* Progress Ring with minutes done inside */}
        <View style={styles.ringWrap}>
          <ProgressRing
            percent={percent}
            size={62}
            strokeWidth={6}
            color="#FF6422"
            trackColor="#F5F1E8"
          >
            <View style={styles.ringCenter}>
              <Text style={styles.ringNumber}>{completedMinutes}</Text>
              <Text style={styles.ringUnit}>{rtl ? 'دقیقه' : 'min'}</Text>
            </View>
          </ProgressRing>
        </View>

        {/* Motivational Coaching Text */}
        <View style={[styles.textWrap, { alignItems: rtl ? 'flex-end' : 'flex-start' }]}>
          <Text style={[styles.headline, { textAlign: rtl ? 'right' : 'left' }]}>
            {isDone
              ? (rtl ? '🎉 هدف ۱۵ دقیقه‌ای امروز تکمیل شد!' : '🎉 Today’s 15-min goal reached!')
              : (rtl ? `فقط ${remaining} دقیقه تا تکمیل هدف امروز` : `Only ${remaining} min left to finish goal`)}
          </Text>
          <Text style={[styles.subtext, { textAlign: rtl ? 'right' : 'left' }]}>
            {isDone
              ? (rtl ? 'عالی پیش رفتی! برای تسلط بیشتر می‌تونی ادامه بدی.' : 'Great job! You can practice more anytime.')
              : (rtl ? 'تمرین روزانه پیوسته، مکالمه را در حافظه فعال تثبیت می‌کند.' : 'Daily steady practice cements spoken fluency.')}
          </Text>
        </View>
      </View>

      {/* 3. Daily 3-Step Routine Checklist */}
      <View style={[styles.stepsRow, rtl && styles.rowReverse]}>
        {/* Step 1: Scenario listening */}
        <View style={[styles.stepPill, styles.stepPillDone, rtl && styles.rowReverse]}>
          <CheckCircle2 size={13} color="#059669" strokeWidth={2.4} />
          <Text style={[styles.stepText, styles.stepTextDone]}>
            {rtl ? 'شنیداری' : 'Listening'}
          </Text>
        </View>

        {/* Step 2: Shadowing & Recording */}
        <View style={[styles.stepPill, styles.stepPillCurrent, rtl && styles.rowReverse]}>
          <Mic size={13} color="#FF6422" strokeWidth={2.4} />
          <Text style={[styles.stepText, styles.stepTextCurrent]}>
            {rtl ? 'شدویینگ' : 'Shadowing'}
          </Text>
        </View>

        {/* Step 3: Leitner Vocab */}
        <View style={[styles.stepPill, rtl && styles.rowReverse]}>
          <Circle size={11} color="#A09B90" strokeWidth={2.2} />
          <Text style={styles.stepText}>
            {rtl ? 'مرور واژگان' : 'Leitner'}
          </Text>
        </View>
      </View>

      {/* 4. Action CTA Button */}
      <TouchableOpacity
        style={[styles.actionBtn, rtl && styles.rowReverse]}
        onPress={handleAction}
        activeOpacity={0.88}
      >
        <Play size={13} color="#FFFFFF" fill="#FFFFFF" style={{ marginLeft: 2 }} />
        <Text style={styles.actionBtnText}>
          {isDone
            ? (rtl ? 'مرور و تمرین اضافه' : 'Practice More')
            : (rtl ? 'ادامه تمرین روزانه' : 'Continue Today’s Practice')}
        </Text>
        <ChevronIcon size={14} color="#FFFFFF" strokeWidth={2.4} />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    marginHorizontal: SPACING.l,
    marginVertical: 10,
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    borderWidth: 1.2,
    borderColor: '#F0EBE3',
    padding: 16,
    gap: 14,
    ...SHADOWS.level1,
    shadowColor: '#2C2014',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  rowReverse: {
    flexDirection: 'row-reverse',
  },
  titleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#FFF3ED',
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleText: {
    fontFamily: FONT_FAMILY.bold,
    fontSize: 14,
    color: '#191C21',
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFF3ED',
    paddingHorizontal: 9,
    paddingVertical: 3.5,
    borderRadius: 12,
  },
  streakBadgeText: {
    fontFamily: FONT_FAMILY.bold,
    fontSize: 11,
    color: '#FF6422',
  },
  mainSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  ringWrap: {
    width: 62,
    height: 62,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringCenter: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringNumber: {
    fontFamily: FONT_FAMILY.bold,
    fontSize: 16,
    color: '#191C21',
    lineHeight: 18,
  },
  ringUnit: {
    fontFamily: FONT_FAMILY.medium,
    fontSize: 9.5,
    color: '#8E95A5',
    lineHeight: 12,
  },
  textWrap: {
    flex: 1,
    gap: 3,
  },
  headline: {
    fontFamily: FONT_FAMILY.bold,
    fontSize: 13.5,
    color: '#191C21',
    lineHeight: 19,
  },
  subtext: {
    fontFamily: FONT_FAMILY.regular,
    fontSize: 11.5,
    color: '#697082',
    lineHeight: 17,
  },
  stepsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: '#F6F2EC',
  },
  stepPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: 6,
    paddingHorizontal: 6,
    borderRadius: 12,
    backgroundColor: '#F8F6F1',
  },
  stepPillDone: {
    backgroundColor: '#ECFDF5',
  },
  stepPillCurrent: {
    backgroundColor: '#FFF3ED',
    borderWidth: 1,
    borderColor: '#FFD9C7',
  },
  stepText: {
    fontFamily: FONT_FAMILY.medium,
    fontSize: 11,
    color: '#8E95A5',
  },
  stepTextDone: {
    fontFamily: FONT_FAMILY.bold,
    color: '#059669',
  },
  stepTextCurrent: {
    fontFamily: FONT_FAMILY.bold,
    color: '#FF6422',
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#FF6422',
    paddingVertical: 11,
    paddingHorizontal: 16,
    borderRadius: 16,
    shadowColor: '#FF6422',
    shadowOpacity: 0.28,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  actionBtnText: {
    fontFamily: FONT_FAMILY.bold,
    fontSize: 13,
    color: '#FFFFFF',
  },
});
