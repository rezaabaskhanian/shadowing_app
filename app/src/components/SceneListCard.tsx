import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { Clock, GraduationCap, Plane, Gauge, Lock, Check, Sprout, Play } from 'lucide-react-native';
import { COLORS } from '../theme/colors';
import { FONT_FAMILY } from '../theme/typography';
import { useLanguage } from '../data/i18n';
import { GradientFill } from './GradientFill';

// ترتیب کلیدها همان ترتیب نمایش سطح‌ها (آسان به سخت) در فیلترهاست.
export const LEVEL_LABEL_KEY: Record<string, string> = {
  Starter: 'levelStarter',
  Beginner: 'levelBeginner',
  Intermediate: 'levelIntermediate',
  Advanced: 'levelAdvanced',
  Proficient: 'levelProficient',
};

interface SceneListCardProps {
  title: string;
  level: string;
  time: string;
  imageUri: any;
  /** خط کوچک بالای عنوان (مثلاً دسته‌ی صحنه). */
  subtitle?: string;
  isLocked?: boolean;
  isCompleted?: boolean;
  onPress?: () => void;
}

export const LEVEL_BADGE_STYLE: Record<string, { bg: string; text: string; Icon: any }> = {
  Starter: { bg: COLORS.levelStarterBg, text: COLORS.white, Icon: Sprout },
  Beginner: { bg: COLORS.levelBeginnerBg, text: COLORS.white, Icon: GraduationCap },
  Intermediate: { bg: '#4F7CF7', text: COLORS.white, Icon: Plane },
  Advanced: { bg: COLORS.levelAdvancedBg, text: COLORS.white, Icon: Gauge },
};

/**
 * کارت صحنه در «دنیای مکالمات»: عکس تمام‌قد با سایه‌ی تیره‌ی پایین، دکمه‌ی پخش و
 * برچسب سطح بالا، دسته + عنوان + زمان پایین. در فارسی متن‌ها راست‌چین‌اند.
 */
export function SceneListCard({ title, level, time, imageUri, subtitle, isLocked, isCompleted, onPress }: SceneListCardProps) {
  const { t, language } = useLanguage();
  const rtl = language === 'fa';
  const levelStyle = LEVEL_BADGE_STYLE[level] || LEVEL_BADGE_STYLE.Beginner;
  const levelLabel = t(LEVEL_LABEL_KEY[level] || LEVEL_LABEL_KEY.Beginner);

  return (
    <TouchableOpacity activeOpacity={0.9} style={styles.card} onPress={onPress}>
      <Image
        source={typeof imageUri === 'string' ? { uri: imageUri } : imageUri}
        style={[styles.image, isLocked && styles.imageLocked]}
      />
      <View style={styles.scrim}>
        <GradientFill from="rgba(10,12,20,0)" to="rgba(10,12,20,0.82)" vertical />
      </View>

      <View style={[styles.topRow, rtl && styles.rowReverse]}>
        {isLocked ? (
          <View style={styles.lockBadge}>
            <Lock size={14} color={COLORS.white} />
          </View>
        ) : isCompleted ? (
          <View style={styles.completedBadge}>
            <Check size={14} color={COLORS.white} />
          </View>
        ) : (
          <View style={[styles.levelBadge, { backgroundColor: levelStyle.bg }]}>
            {/* فقط متن سطح؛ آیکون‌ها (مثل هواپیما برای «متوسط») به موضوع صحنه ربطی نداشتند. */}
            <Text style={[styles.levelBadgeText, { color: levelStyle.text }]}>{levelLabel}</Text>
          </View>
        )}
        <View style={styles.playBadge}>
          <Play size={12} color={COLORS.white} fill={COLORS.white} />
        </View>
      </View>

      <View style={[styles.bottomRow, rtl && styles.rowReverse]}>
        <View style={[styles.titleCol, rtl ? styles.alignEnd : styles.alignStart]}>
          {!!subtitle && (
            <Text style={styles.subtitle} numberOfLines={1}>
              {subtitle}
            </Text>
          )}
          <Text style={[styles.title, { textAlign: rtl ? 'right' : 'left' }]} numberOfLines={2}>
            {title}
          </Text>
        </View>
        <View style={styles.timeTag}>
          <Clock size={12} color={COLORS.white} />
          <Text style={styles.timeText}>{time}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    height: 186,
    borderRadius: 22,
    overflow: 'hidden',
    marginBottom: 14,
    backgroundColor: COLORS.surfaceHigh,
  },
  image: {
    ...StyleSheet.absoluteFill,
    resizeMode: 'cover',
  },
  imageLocked: {
    opacity: 0.5,
  },
  scrim: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '65%',
  },
  rowReverse: { flexDirection: 'row-reverse' },
  alignEnd: { alignItems: 'flex-end' },
  alignStart: { alignItems: 'flex-start' },
  topRow: {
    position: 'absolute',
    top: 12,
    left: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  playBadge: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(255,255,255,0.28)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  lockBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  completedBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.success,
    alignItems: 'center',
    justifyContent: 'center',
  },
  levelBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  levelBadgeText: {
    fontFamily: FONT_FAMILY.bold,
    fontSize: 11,
  },
  bottomRow: {
    position: 'absolute',
    left: 14,
    right: 14,
    bottom: 12,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: 10,
  },
  titleCol: { flex: 1, gap: 2 },
  subtitle: {
    color: 'rgba(255,255,255,0.85)',
    fontFamily: FONT_FAMILY.medium,
    fontSize: 11,
  },
  title: {
    color: COLORS.white,
    fontFamily: FONT_FAMILY.bold,
    fontSize: 18,
    lineHeight: 26,
  },
  timeTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingBottom: 3,
  },
  timeText: {
    color: COLORS.white,
    fontFamily: FONT_FAMILY.semiBold,
    fontSize: 12,
  },
});
