import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View, type ImageSourcePropType } from 'react-native';
import { CheckCircle2, Clock, Info, Play } from 'lucide-react-native';
import { GradientFill } from './GradientFill';

import { COLORS, SPACING, BORDER_RADIUS, hexToRgba } from '../theme/colors';
import { FONT_FAMILY, TEXT_STYLES } from '../theme/typography';
import { useLanguage } from '../data/i18n';

/**
 * کارت‌ها و سربرگ‌های تصویری مشترکِ بخش‌های محتوایی (پادکست، داستان، صحبت
 * درباره‌ی موضوع، نوشتن) تا همه یک زبانِ بصریِ رنگی داشته باشند: بنرِ عکس (یا
 * نوار رنگیِ سطح وقتی عکس نیست) بالای کارت و رنگِ سطح زیر عنوان.
 */

/** رنگ‌هایی که چیپ‌ها و بولت‌ها به نوبت می‌گیرند. */
export const ACCENT_CYCLE = [COLORS.primary, COLORS.audioMine, COLORS.pink, COLORS.levelBeginnerBg, COLORS.levelIntermediateBg];

const LEVEL_COLOR: Record<string, string> = {
  starter: COLORS.levelStarterBg,
  beginner: COLORS.levelBeginnerBg,
  intermediate: COLORS.levelIntermediateBg,
  advanced: COLORS.levelAdvancedBg,
  proficient: COLORS.levelProficientBg,
};

/** رنگِ هر سطح (همان رنگ نشان سطح در کل اپ). */
export const levelColor = (level?: string) => LEVEL_COLOR[level ?? ''] ?? COLORS.primary;

export interface BannerMeta {
  icon: React.ReactNode;
  text: string;
}

interface BannerCardProps {
  image?: ImageSourcePropType | null;
  /** رنگِ سطح؛ پسزمینه‌ی بنر بدون عکس و خط زیر بنر. */
  accent: string;
  /** آیکنِ وسط بنر (روی عکس نیمه‌شفاف، بدون عکس سفید و بزرگ). */
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  badgeLabel?: string;
  /** برچسب گوشه‌ی بنر (مثل مدت یا «فصل ۲»). */
  cornerLabel?: string;
  metas?: BannerMeta[];
  done?: boolean;
  onPress: () => void;
}

export const BannerCard: React.FC<BannerCardProps> = ({
  image,
  accent,
  icon,
  title,
  subtitle,
  badgeLabel,
  cornerLabel,
  metas,
  done,
  onPress,
}) => {
  // در فارسی عنوان (با نقطه‌ی رنگ سطح) سمت راست و برچسب سطح سمت چپ؛ مدت همیشه پایین-چپ عکس.
  const { language } = useLanguage();
  const rtl = language === 'fa';
  return (
    <TouchableOpacity style={styles.card} activeOpacity={0.85} onPress={onPress}>
      <View style={[styles.banner, { backgroundColor: accent }]}>
        {!!image && <Image source={image} style={styles.bannerImage} resizeMode="cover" />}
        {/* روی عکس دکمه‌ی پخشِ شیشه‌ای؛ بدون عکس، آیکون وسط نوار رنگی. */}
        {image ? (
          <View style={styles.bannerPlay}>
            <Play size={18} color={COLORS.white} fill={COLORS.white} />
          </View>
        ) : (
          <View style={styles.bannerIcon}>{icon}</View>
        )}
        {!!cornerLabel && (
          <View style={[styles.corner, styles.cornerLeft]}>
            <Clock size={11} color={COLORS.white} />
            <Text style={styles.cornerText}>{cornerLabel}</Text>
          </View>
        )}
        {done && (
          <View style={[styles.doneBadge, styles.cornerRight]}>
            <CheckCircle2 size={18} color={COLORS.white} />
          </View>
        )}
      </View>
      <View style={styles.body}>
        <View style={[styles.titleRow, rtl && styles.rowReverse]}>
          <Text style={styles.title} numberOfLines={1}>
            {title}
          </Text>
          <View style={[styles.titleDot, { backgroundColor: accent }]} />
          <View style={styles.flex1} />
          {!!badgeLabel && (
            // برچسب سطح: پس‌زمینه‌ی کم‌رنگ و متن رنگی، نه پس‌زمینه‌ی پررنگ که با عکس رقابت کند.
            <View style={[styles.badge, { backgroundColor: hexToRgba(accent, 0.12) }]}>
              <Text style={[styles.badgeText, { color: accent }]}>{badgeLabel}</Text>
            </View>
          )}
        </View>
        {!!subtitle && (
          <Text style={[styles.subtitle, rtl && styles.textRight]} numberOfLines={2}>
            {subtitle}
          </Text>
        )}
        {!!metas?.length && (
          <View style={[styles.metaRow, rtl && styles.metaRowRtl]}>
            {metas.map((m, i) => (
              <View key={i} style={[styles.metaItem, rtl && styles.rowReverse]}>
                {m.icon}
                <Text style={styles.metaText}>{m.text}</Text>
              </View>
            ))}
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};

/** سربرگِ رنگیِ بالای لیست‌ها: آیکن در دایره‌ی رنگی، عنوان و زیرعنوان. */
export const ListHero: React.FC<{ icon: React.ReactNode; color: string; title: string; subtitle?: string }> = ({
  icon,
  color,
  title,
  subtitle,
}) => (
  <View style={styles.hero}>
    <View style={[styles.heroIcon, { backgroundColor: color, shadowColor: color }]}>
      <View style={styles.heroIconFill}>
        <GradientFill from={hexToRgba(COLORS.white, 0.28)} to={hexToRgba(COLORS.white, 0)} vertical />
      </View>
      {icon}
    </View>
    <Text style={styles.heroTitle}>{title}</Text>
    {!!subtitle && <Text style={styles.heroSub}>{subtitle}</Text>}
  </View>
);

/**
 * سربرگِ صفحه‌ی یک موضوع: عکسِ موضوع با عنوان روی آن؛ بدون عکس، یک کارت رنگی
 * به رنگِ سطح. متن فارسیِ صورت سؤال زیرش می‌آید.
 */
export const PromptHero: React.FC<{
  image?: ImageSourcePropType | null;
  accent: string;
  icon: React.ReactNode;
  title: string;
  prompt?: string;
  /** برچسب کوچک گوشه‌ی عکس (مثلاً سطح). */
  badgeLabel?: string;
}> = ({ image, accent, icon, title, prompt, badgeLabel }) => {
  const { language } = useLanguage();
  // فارسی: کپسول عنوان گوشه‌ی پایین-راست، برچسب سطح پایین-چپ؛ توضیح راست‌چین با آیکون سمت راست.
  const rtl = language === 'fa';
  return (
    <View style={styles.promptWrap}>
      <View style={[styles.promptBanner, { backgroundColor: accent }, !image && styles.promptBannerPlain]}>
        {!!image && <Image source={image} style={styles.bannerImage} resizeMode="cover" />}
        {!!image && (
          <View style={styles.promptShade}>
            <GradientFill from="rgba(10,12,20,0)" to="rgba(10,12,20,0.55)" vertical />
          </View>
        )}
        <View style={[styles.promptTitleRow, rtl && styles.rowReverse]}>
          <View style={[styles.promptTitlePill, rtl && styles.rowReverse]}>
            <Text style={styles.promptTitle} numberOfLines={1}>
              {title}
            </Text>
            <View style={styles.promptIcon}>{icon}</View>
          </View>
          {!!badgeLabel && (
            <View style={styles.promptBadge}>
              <Text style={styles.promptBadgeText}>{badgeLabel}</Text>
            </View>
          )}
        </View>
      </View>
      {!!prompt && (
        <View
          style={[
            styles.promptTextBox,
            rtl && styles.rowReverse,
            { borderColor: hexToRgba(accent, 0.25), backgroundColor: hexToRgba(accent, 0.07) },
          ]}
        >
          <View style={[styles.promptInfoIcon, { backgroundColor: hexToRgba(accent, 0.15) }]}>
            <Info size={13} color={accent} />
          </View>
          <Text style={[styles.promptText, { textAlign: rtl ? 'right' : 'left' }]}>{prompt}</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#EEEEF2',
    overflow: 'hidden',
    shadowColor: '#1A1D26',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
    elevation: 1,
  },
  banner: { height: 140, alignItems: 'center', justifyContent: 'center' },
  bannerImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
  },
  bannerIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: hexToRgba(COLORS.white, 0.18),
  },
  rowReverse: { flexDirection: 'row-reverse' },
  cornerLeft: { left: SPACING.s },
  cornerRight: { right: SPACING.s },
  titleDot: { width: 7, height: 7, borderRadius: 4 },
  flex1: { flex: 1 },
  bannerPlay: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bannerIconOnImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: hexToRgba(COLORS.black, 0.45),
    borderWidth: 2,
    borderColor: hexToRgba(COLORS.white, 0.85),
  },
  corner: { position: 'absolute', bottom: SPACING.s, flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: hexToRgba(COLORS.black, 0.55), borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  cornerText: {
    ...TEXT_STYLES.labelSm,
    color: COLORS.white,
  },
  doneBadge: { position: 'absolute', top: SPACING.s, backgroundColor: COLORS.success, borderRadius: BORDER_RADIUS.full, padding: 3 },
  body: { paddingHorizontal: 14, paddingVertical: 12 },
  textRight: { textAlign: 'right' },
  metaRowRtl: { flexDirection: 'row-reverse' },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.s,
  },
  title: { flexShrink: 1, fontFamily: FONT_FAMILY.bold, fontSize: 15, color: COLORS.text },
  subtitle: {
    ...TEXT_STYLES.labelMd,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  badge: { borderRadius: 10, paddingHorizontal: 10, paddingVertical: 3 },
  badgeText: {
    fontFamily: FONT_FAMILY.semiBold,
    fontSize: 11,
    color: COLORS.white,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: SPACING.s,
    marginTop: SPACING.s,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    ...TEXT_STYLES.labelSm,
    color: COLORS.muted,
  },
  hero: {
    alignItems: 'center',
  },
  heroIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.s,
    elevation: 6,
    shadowOpacity: 0.35,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
  },
  heroIconFill: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, borderRadius: 28, overflow: 'hidden' },
  heroTitle: {
    ...TEXT_STYLES.headlineSm,
    color: COLORS.text,
  },
  heroSub: {
    ...TEXT_STYLES.bodyMd,
    color: COLORS.textSecondary,
    marginTop: 4,
    textAlign: 'center',
  },
  promptWrap: {
    gap: SPACING.s,
  },
  promptBanner: { height: 180, borderRadius: 20, overflow: 'hidden', justifyContent: 'flex-end' },
  promptTitlePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    maxWidth: '75%',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    backgroundColor: 'rgba(16,18,24,0.62)',
  },
  promptBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.25)' },
  promptBadgeText: { fontFamily: FONT_FAMILY.semiBold, fontSize: 11, color: COLORS.white },
  promptInfoIcon: { width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginTop: 1 },
  promptBannerPlain: {
    height: 96,
  },
  promptShade: { position: 'absolute', left: 0, right: 0, bottom: 0, height: 90 },
  promptTitleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: SPACING.s, padding: 10 },
  promptIcon: { width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  promptTitle: { flexShrink: 1, fontFamily: FONT_FAMILY.bold, fontSize: 14, color: COLORS.white },
  promptTextBox: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, borderRadius: 16, borderWidth: 1, padding: 12 },
  promptText: { ...TEXT_STYLES.bodyMd, flex: 1, color: COLORS.text },
});
