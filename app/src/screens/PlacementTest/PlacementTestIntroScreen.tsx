import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Mic, Headphones, MessageCircle, TrendingUp, Clock } from 'lucide-react-native';
import { GradientFill } from '../../components/GradientFill';
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

const ICON_CIRCLE_SIZE = 72;

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
  const { t, language } = useLanguage();
  // فارسی: آیکون مرحله سمت راست، شماره سمت چپ.
  const rtl = language === 'fa';
  const insets = useSafeAreaInsets();

  const bullets = customBullets ?? [
    t('placementIntroBullet1'),
    t('placementIntroBullet2'),
    t('placementIntroBullet3'),
  ];

  return (
    <View style={styles.screen}>
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: insets.top + SPACING.l, paddingBottom: insets.bottom + SPACING.m },
        ]}
        showsVerticalScrollIndicator={false}
        bounces={true}
      >
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
              <Mic size={28} color={COLORS.white} />
            </View>
          </View>

          <Text style={styles.title}>{t('placementIntroTitle')}</Text>
          <Text style={styles.body}>{body ?? t('placementIntroBody')}</Text>

          <View style={styles.timePill}>
            <Clock size={13} color={COLORS.textSecondary} />
            <Text style={styles.timePillText}>{timeEstimate ?? t('placementIntroTimeEstimate')}</Text>
          </View>

          <View style={styles.bulletList}>
            {bullets.map((bullet, index) => {
              const { Icon, color } = BULLET_META[index % BULLET_META.length];
              return (
                <View
                  key={index}
                  // پس‌زمینه‌ی یکسان و خنثی برای همه‌ی مرحله‌ها؛ رنگ فقط روی آیکون می‌ماند.
                  style={[styles.bulletRow, styles.bulletRowNeutral, rtl && styles.rowReverse]}
                >
                  <View style={[styles.bulletIconWrap, { backgroundColor: color }]}>
                    <Icon size={16} color={COLORS.white} />
                  </View>
                  {/* بخشِ قبل از «:» (اسم مرحله) پررنگ. */}
                  <Text style={[styles.bulletText, { textAlign: rtl ? 'right' : 'left' }]}>
                    {bullet.includes(':') ? (
                      <>
                        <Text style={styles.bulletLead}>{bullet.slice(0, bullet.indexOf(':') + 1)}</Text>
                        {bullet.slice(bullet.indexOf(':') + 1)}
                      </>
                    ) : (
                      bullet
                    )}
                  </Text>
                  <Text style={[styles.stepNum, { color }]}>{index + 1}</Text>
                </View>
              );
            })}
          </View>
        </View>

        <View style={styles.footer}>
          <TouchableOpacity style={styles.startBtn} onPress={onStart} activeOpacity={0.85}>
            <GradientFill from="#E8572F" to="#E9774A" horizontal />
            <Text style={styles.startBtnText}>{t('placementStartBtn')}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.skipBtn} onPress={onSkip} activeOpacity={0.7}>
            <Text style={styles.skipBtnText}>{t('placementSkipBtn')}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#FAF9F6',
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: SPACING.l,
    justifyContent: 'space-between',
  },
  rowReverse: { flexDirection: 'row-reverse' },
  bulletLead: { fontFamily: FONT_FAMILY.bold, fontSize: 13, color: COLORS.text },
  bulletRowNeutral: { backgroundColor: '#F4F3EF', borderColor: '#ECEAE4' },
  content: {
    alignItems: 'center',
    marginTop: SPACING.s,
  },
  iconCircle: {
    width: ICON_CIRCLE_SIZE,
    height: ICON_CIRCLE_SIZE,
    borderRadius: ICON_CIRCLE_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.primaryDark,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.22,
    shadowRadius: 14,
    elevation: 5,
  },
  title: {
    fontSize: 20,
    fontFamily: FONT_FAMILY.bold,
    lineHeight: 28,
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: SPACING.xs,
  },
  body: {
    fontSize: 13.5,
    fontFamily: FONT_FAMILY.regular,
    lineHeight: 21,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: SPACING.s,
    paddingHorizontal: SPACING.xs,
  },
  timePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    backgroundColor: '#ECEAE4',
    paddingHorizontal: SPACING.m,
    paddingVertical: 4,
    borderRadius: BORDER_RADIUS.full,
    marginBottom: SPACING.l,
  },
  timePillText: {
    fontSize: 12,
    fontFamily: FONT_FAMILY.medium,
    color: COLORS.textSecondary,
  },
  halo: {
    width: ICON_CIRCLE_SIZE + 44,
    height: ICON_CIRCLE_SIZE + 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.s,
  },
  haloRing: {
    position: 'absolute',
    borderRadius: 999,
  },
  haloOuter: {
    width: ICON_CIRCLE_SIZE + 44,
    height: ICON_CIRCLE_SIZE + 44,
    backgroundColor: hexToRgba(COLORS.primary, 0.06),
  },
  haloInner: {
    width: ICON_CIRCLE_SIZE + 20,
    height: ICON_CIRCLE_SIZE + 20,
    backgroundColor: hexToRgba(COLORS.primary, 0.12),
  },
  bulletList: {
    alignSelf: 'stretch',
    gap: 8,
    marginBottom: SPACING.m,
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.m,
    borderRadius: 14,
    borderWidth: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  stepNum: {
    fontFamily: FONT_FAMILY.bold,
    fontSize: 14,
  },
  bulletIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bulletText: {
    fontSize: 13,
    lineHeight: 19,
    fontFamily: FONT_FAMILY.regular,
    color: COLORS.text,
    flex: 1,
  },
  footer: {
    gap: 6,
    paddingTop: SPACING.s,
  },
  startBtn: {
    borderRadius: 14,
    height: 48,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    ...SHADOWS.level2,
  },
  startBtnText: {
    color: COLORS.white,
    fontFamily: FONT_FAMILY.bold,
    fontSize: 15,
  },
  skipBtn: {
    paddingVertical: 6,
    alignItems: 'center',
  },
  skipBtnText: {
    color: COLORS.textSecondary,
    fontFamily: FONT_FAMILY.medium,
    fontSize: 13.5,
  },
});
