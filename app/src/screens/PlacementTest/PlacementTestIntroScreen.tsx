import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Mic, Headphones, MessageCircle, TrendingUp, Clock } from 'lucide-react-native';
import Svg, { Defs, LinearGradient as SvgLinearGradient, Stop, Circle } from 'react-native-svg';

import { COLORS, SPACING, BORDER_RADIUS } from '../../theme/colors';
import { FONT_FAMILY, TEXT_STYLES } from '../../theme/typography';
import { SHADOWS } from '../../theme/elevation';
import { useLanguage } from '../../data/i18n';

interface PlacementTestIntroScreenProps {
  onStart: () => void;
  onSkip: () => void;
}

const ICON_CIRCLE_SIZE = 96;

/** هر بولت آیکن و رنگ خودش را دارد تا سه مرحله‌ی فلو (گوش‌دادن، گفتار آزاد،
 * نتیجه) با یک نگاه از هم متمایز باشند، نه سه ردیف یک‌شکل با تیک سبز. */
const BULLET_META = [
  { Icon: Headphones, color: COLORS.primary, bg: COLORS.primaryLight },
  { Icon: MessageCircle, color: COLORS.info, bg: COLORS.infoLight },
  { Icon: TrendingUp, color: COLORS.secondary, bg: COLORS.secondaryLight },
];

/**
 * معرفیِ تست تعیین سطح گفتاری، قبل از شروع ضبط سه آیتم. کاربر می‌تواند
 * همین‌جا رد کند (فعلاً) و بعداً از کارتِ صفحه‌ی خانه دوباره امتحان کند.
 */
export const PlacementTestIntroScreen: React.FC<PlacementTestIntroScreenProps> = ({
  onStart,
  onSkip,
}) => {
  const { t } = useLanguage();
  const insets = useSafeAreaInsets();

  const bullets = [
    t('placementIntroBullet1'),
    t('placementIntroBullet2'),
    t('placementIntroBullet3'),
  ];

  return (
    <View style={[styles.container, { paddingTop: insets.top + SPACING.xl, paddingBottom: insets.bottom + SPACING.l }]}>
      <View style={styles.content}>
        <View style={styles.iconCircle}>
          <Svg width={ICON_CIRCLE_SIZE} height={ICON_CIRCLE_SIZE} style={StyleSheet.absoluteFill}>
            <Defs>
              <SvgLinearGradient id="introIconGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <Stop offset="0%" stopColor={COLORS.primaryContainer} />
                <Stop offset="100%" stopColor={COLORS.primaryDark} />
              </SvgLinearGradient>
            </Defs>
            <Circle
              cx={ICON_CIRCLE_SIZE / 2}
              cy={ICON_CIRCLE_SIZE / 2}
              r={ICON_CIRCLE_SIZE / 2}
              fill="url(#introIconGrad)"
            />
          </Svg>
          <Mic size={38} color={COLORS.white} />
        </View>

        <Text style={styles.title}>{t('placementIntroTitle')}</Text>
        <Text style={styles.body}>{t('placementIntroBody')}</Text>

        <View style={styles.timePill}>
          <Clock size={14} color={COLORS.textSecondary} />
          <Text style={styles.timePillText}>{t('placementIntroTimeEstimate')}</Text>
        </View>

        <View style={styles.bulletList}>
          {bullets.map((bullet, index) => {
            const { Icon, color, bg } = BULLET_META[index];
            return (
              <View key={index} style={styles.bulletRow}>
                <View style={[styles.bulletIconWrap, { backgroundColor: bg }]}>
                  <Icon size={18} color={color} />
                </View>
                <Text style={styles.bulletText}>{bullet}</Text>
              </View>
            );
          })}
        </View>
      </View>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.startBtn} onPress={onStart} activeOpacity={0.85}>
          <Text style={styles.startBtnText}>{t('placementStartBtn')}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.skipBtn} onPress={onSkip} activeOpacity={0.7}>
          <Text style={styles.skipBtnText}>{t('placementSkipBtn')}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    paddingHorizontal: SPACING.l,
    justifyContent: 'space-between',
  },
  content: {
    alignItems: 'center',
    marginTop: SPACING.xl,
  },
  iconCircle: {
    width: ICON_CIRCLE_SIZE,
    height: ICON_CIRCLE_SIZE,
    borderRadius: ICON_CIRCLE_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.l,
    shadowColor: COLORS.primaryDark,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.28,
    shadowRadius: 18,
    elevation: 6,
  },
  title: {
    ...TEXT_STYLES.headlineMd,
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: SPACING.s,
  },
  body: {
    ...TEXT_STYLES.bodyMd,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: SPACING.m,
  },
  timePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    backgroundColor: COLORS.surfaceHigh,
    paddingHorizontal: SPACING.m,
    paddingVertical: 6,
    borderRadius: BORDER_RADIUS.full,
    marginBottom: SPACING.l,
  },
  timePillText: {
    ...TEXT_STYLES.labelSm,
    color: COLORS.textSecondary,
  },
  bulletList: {
    alignSelf: 'stretch',
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.l,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.m,
    gap: SPACING.m,
    ...SHADOWS.level1,
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.m,
  },
  bulletIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bulletText: {
    ...TEXT_STYLES.bodyMd,
    color: COLORS.text,
    flex: 1,
  },
  footer: {
    gap: SPACING.s,
  },
  startBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.l,
    paddingVertical: SPACING.m,
    alignItems: 'center',
    ...SHADOWS.level2,
  },
  startBtnText: {
    color: COLORS.white,
    fontFamily: FONT_FAMILY.bold,
    fontSize: 16,
  },
  skipBtn: {
    paddingVertical: SPACING.s,
    alignItems: 'center',
  },
  skipBtnText: {
    color: COLORS.textSecondary,
    fontFamily: FONT_FAMILY.medium,
    fontSize: 14,
  },
});
