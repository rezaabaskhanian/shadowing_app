import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Mic, Headphones, MessageCircle, TrendingUp, Clock } from 'lucide-react-native';
import Svg, { Defs, LinearGradient as SvgLinearGradient, Stop, Circle } from 'react-native-svg';

import { COLORS, SPACING, BORDER_RADIUS, hexToRgba } from '../../theme/colors';
import { FONT_FAMILY, TEXT_STYLES } from '../../theme/typography';
import { SHADOWS } from '../../theme/elevation';
import { useLanguage } from '../../data/i18n';

interface PlacementTestIntroScreenProps {
  onStart: () => void;
  onSkip: () => void;
  /** متن سه بولت؛ پیش‌فرض متن‌های نسخه‌ی ۱ */
  bullets?: string[];
  /** متن زمان تقریبی؛ پیش‌فرض نسخه‌ی ۱ */
  timeEstimate?: string;
  /** متن معرفی؛ باید با تعداد بخش‌ها و زمانِ همین نسخه‌ی تست جور باشد. */
  body?: string;
}

const ICON_CIRCLE_SIZE = 96;

/** هر بولت آیکن و رنگ خودش را دارد تا سه مرحله‌ی فلو (گوش‌دادن، گفتار آزاد،
 * نتیجه) با یک نگاه از هم متمایز باشند، نه سه ردیف یک‌شکل با تیک سبز. */
const BULLET_META = [
  { Icon: Headphones, color: COLORS.primary },
  { Icon: MessageCircle, color: COLORS.audioMine },
  { Icon: TrendingUp, color: COLORS.pink },
];

/**
 * معرفیِ تست تعیین سطح گفتاری، قبل از شروع ضبط سه آیتم. کاربر می‌تواند
 * همین‌جا رد کند (فعلاً) و بعداً از کارتِ صفحه‌ی خانه دوباره امتحان کند.
 */
export const PlacementTestIntroScreen: React.FC<PlacementTestIntroScreenProps> = ({
  onStart,
  onSkip,
  bullets: customBullets,
  timeEstimate,
  body,
}) => {
  const { t } = useLanguage();
  const insets = useSafeAreaInsets();

  const bullets = customBullets ?? [
    t('placementIntroBullet1'),
    t('placementIntroBullet2'),
    t('placementIntroBullet3'),
  ];

  return (
    <View style={[styles.container, { paddingTop: insets.top + SPACING.xl, paddingBottom: insets.bottom + SPACING.l }]}>
      <View style={styles.content}>
        {/* هاله‌های رنگی پشت آیکن تا صفحه‌ی شروع خالی و بی‌روح نباشد. */}
        <View style={styles.halo}>
          <View style={[styles.haloRing, styles.haloOuter]} />
          <View style={[styles.haloRing, styles.haloInner]} />
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
        </View>

        <Text style={styles.title}>{t('placementIntroTitle')}</Text>
        <Text style={styles.body}>{body ?? t('placementIntroBody')}</Text>

        <View style={styles.timePill}>
          <Clock size={14} color={COLORS.textSecondary} />
          <Text style={styles.timePillText}>{timeEstimate ?? t('placementIntroTimeEstimate')}</Text>
        </View>

        <View style={styles.bulletList}>
          {bullets.map((bullet, index) => {
            const { Icon, color } = BULLET_META[index % BULLET_META.length];
            return (
              <View
                key={index}
                // پس‌زمینه‌ی یکسان و خنثی برای همه‌ی مرحله‌ها؛ رنگ فقط روی آیکون می‌ماند.
                style={[styles.bulletRow, styles.bulletRowNeutral]}
              >
                <View style={[styles.bulletIconWrap, { backgroundColor: color }]}>
                  <Icon size={18} color={COLORS.white} />
                </View>
                <Text style={styles.bulletText}>{bullet}</Text>
                <Text style={[styles.stepNum, { color }]}>{index + 1}</Text>
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
  bulletRowNeutral: { backgroundColor: COLORS.surface, borderColor: COLORS.borderLight },
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
  halo: {
    width: ICON_CIRCLE_SIZE + 64,
    height: ICON_CIRCLE_SIZE + 64,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.s,
  },
  haloRing: {
    position: 'absolute',
    borderRadius: 999,
  },
  haloOuter: {
    width: ICON_CIRCLE_SIZE + 64,
    height: ICON_CIRCLE_SIZE + 64,
    backgroundColor: hexToRgba(COLORS.pink, 0.08),
  },
  haloInner: {
    width: ICON_CIRCLE_SIZE + 30,
    height: ICON_CIRCLE_SIZE + 30,
    backgroundColor: hexToRgba(COLORS.primary, 0.12),
  },
  bulletList: {
    alignSelf: 'stretch',
    gap: SPACING.s,
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.m,
    borderRadius: BORDER_RADIUS.l,
    borderWidth: 1,
    padding: SPACING.m,
  },
  stepNum: {
    fontFamily: FONT_FAMILY.bold,
    fontSize: 18,
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
