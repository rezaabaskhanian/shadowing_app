import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View, type ImageSourcePropType } from 'react-native';
import { CheckCircle2 } from 'lucide-react-native';

import { COLORS, SPACING, BORDER_RADIUS, hexToRgba } from '../theme/colors';
import { FONT_FAMILY, TEXT_STYLES } from '../theme/typography';
import { SHADOWS } from '../theme/elevation';

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
}) => (
  <TouchableOpacity style={styles.card} activeOpacity={0.85} onPress={onPress}>
    <View style={[styles.banner, { backgroundColor: accent }]}>
      {!!image && <Image source={image} style={styles.bannerImage} resizeMode="cover" />}
      <View style={[styles.bannerIcon, !!image && styles.bannerIconOnImage]}>{icon}</View>
      {!!cornerLabel && (
        <View style={styles.corner}>
          <Text style={styles.cornerText}>{cornerLabel}</Text>
        </View>
      )}
      {done && (
        <View style={styles.doneBadge}>
          <CheckCircle2 size={18} color={COLORS.white} />
        </View>
      )}
    </View>
    <View style={[styles.body, { borderTopColor: accent }]}>
      <View style={styles.titleRow}>
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>
        {!!badgeLabel && (
          <View style={[styles.badge, { backgroundColor: accent }]}>
            <Text style={styles.badgeText}>{badgeLabel}</Text>
          </View>
        )}
      </View>
      {!!subtitle && (
        <Text style={styles.subtitle} numberOfLines={2}>
          {subtitle}
        </Text>
      )}
      {!!metas?.length && (
        <View style={styles.metaRow}>
          {metas.map((m, i) => (
            <View key={i} style={styles.metaItem}>
              {m.icon}
              <Text style={styles.metaText}>{m.text}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  </TouchableOpacity>
);

/** سربرگِ رنگیِ بالای لیست‌ها: آیکن در دایره‌ی رنگی، عنوان و زیرعنوان. */
export const ListHero: React.FC<{ icon: React.ReactNode; color: string; title: string; subtitle?: string }> = ({
  icon,
  color,
  title,
  subtitle,
}) => (
  <View style={styles.hero}>
    <View style={[styles.heroIcon, { backgroundColor: color }]}>{icon}</View>
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
}> = ({ image, accent, icon, title, prompt }) => (
  <View style={styles.promptWrap}>
    <View style={[styles.promptBanner, { backgroundColor: accent }, !image && styles.promptBannerPlain]}>
      {!!image && <Image source={image} style={styles.bannerImage} resizeMode="cover" />}
      {!!image && <View style={styles.promptShade} />}
      <View style={styles.promptTitleRow}>
        <View style={styles.promptIcon}>{icon}</View>
        <Text style={styles.promptTitle} numberOfLines={2}>
          {title}
        </Text>
      </View>
    </View>
    {!!prompt && (
      <View style={[styles.promptTextBox, { borderColor: hexToRgba(accent, 0.3), backgroundColor: hexToRgba(accent, 0.06) }]}>
        <Text style={styles.promptText}>{prompt}</Text>
      </View>
    )}
  </View>
);

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.l,
    overflow: 'hidden',
    ...SHADOWS.level1,
  },
  banner: {
    height: 120,
    alignItems: 'center',
    justifyContent: 'center',
  },
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
  bannerIconOnImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: hexToRgba(COLORS.black, 0.45),
    borderWidth: 2,
    borderColor: hexToRgba(COLORS.white, 0.85),
  },
  corner: {
    position: 'absolute',
    bottom: SPACING.s,
    right: SPACING.s,
    backgroundColor: hexToRgba(COLORS.black, 0.55),
    borderRadius: BORDER_RADIUS.full,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  cornerText: {
    ...TEXT_STYLES.labelSm,
    color: COLORS.white,
  },
  doneBadge: {
    position: 'absolute',
    top: SPACING.s,
    left: SPACING.s,
    backgroundColor: COLORS.success,
    borderRadius: BORDER_RADIUS.full,
    padding: 3,
  },
  body: {
    padding: SPACING.m,
    borderTopWidth: 3,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.s,
  },
  title: {
    flex: 1,
    fontFamily: FONT_FAMILY.bold,
    fontSize: 16,
    color: COLORS.text,
  },
  subtitle: {
    ...TEXT_STYLES.labelMd,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  badge: {
    borderRadius: BORDER_RADIUS.s,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
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
    ...SHADOWS.level2,
  },
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
  promptBanner: {
    height: 180,
    borderRadius: BORDER_RADIUS.l,
    overflow: 'hidden',
    justifyContent: 'flex-end',
  },
  promptBannerPlain: {
    height: 96,
  },
  promptShade: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 72,
    backgroundColor: hexToRgba(COLORS.black, 0.45),
  },
  promptTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.s,
    padding: SPACING.m,
  },
  promptIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: hexToRgba(COLORS.white, 0.22),
    alignItems: 'center',
    justifyContent: 'center',
  },
  promptTitle: {
    flex: 1,
    fontFamily: FONT_FAMILY.bold,
    fontSize: 18,
    color: COLORS.white,
  },
  promptTextBox: {
    borderRadius: BORDER_RADIUS.m,
    borderWidth: 1,
    padding: SPACING.m,
  },
  promptText: {
    ...TEXT_STYLES.bodyMd,
    color: COLORS.text,
  },
});
