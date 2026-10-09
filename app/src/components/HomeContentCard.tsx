import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Check, ChevronRight, Lock } from 'lucide-react-native';
import { COLORS } from '../theme/colors';
import { FONT_FAMILY } from '../theme/typography';

const LEVEL_BG: Record<string, string> = {
  beginner: COLORS.levelBeginnerBg,
  intermediate: COLORS.levelIntermediateBg,
  advanced: COLORS.levelAdvancedBg,
};

interface Props {
  title: string;
  subtitle?: string;
  meta?: string;
  /** آدرسِ کاملِ تصویر؛ خالی = جای تصویر خالی می‌ماند (مثل صحنه‌ی بدون عکس). */
  imageUri?: string;
  /** به‌جای تصویر (مثلاً درس‌های دوره‌ی شروع که ایموجی دارند). */
  emoji?: string;
  level?: string;
  levelLabel?: string;
  isCompleted?: boolean;
  isLocked?: boolean;
  onPress?: () => void;
}

/**
 * کارتِ یک مورد در بخش‌های صفحه‌ی خانه (ویدیو، پادکست، نوشتن، ...) — هم‌شکلِ
 * ScenarioCard تا همه‌ی بخش‌ها مثل «دنیای مکالمات» یک‌دست دیده شوند.
 */
export const HomeContentCard: React.FC<Props> = ({
  title,
  subtitle,
  meta,
  imageUri,
  emoji,
  level,
  levelLabel,
  isCompleted,
  isLocked,
  onPress,
}) => (
  <TouchableOpacity activeOpacity={0.85} onPress={onPress} disabled={!onPress} style={styles.card}>
    <View style={[styles.thumbnail, isLocked && styles.thumbnailLocked]}>
      {imageUri ? (
        <Image source={{ uri: imageUri }} style={styles.thumbnailImage} />
      ) : emoji ? (
        <Text style={styles.emoji}>{emoji}</Text>
      ) : null}
    </View>

    <View style={styles.content}>
      <View style={styles.titleRow}>
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>
        {!!levelLabel && (
          <View style={[styles.levelBadge, { backgroundColor: LEVEL_BG[level || ''] || LEVEL_BG.beginner }]}>
            <Text style={styles.levelText}>{levelLabel}</Text>
          </View>
        )}
      </View>
      {!!subtitle && (
        <Text style={styles.subtitle} numberOfLines={1}>
          {subtitle}
        </Text>
      )}
      {!!meta && <Text style={styles.metaText}>{meta}</Text>}
    </View>

    <View style={styles.actionRight}>
      {isLocked ? (
        <Lock size={20} color={COLORS.muted} />
      ) : isCompleted ? (
        <View style={styles.completedBadge}>
          <Check size={16} color={COLORS.white} />
        </View>
      ) : (
        <ChevronRight size={20} color={COLORS.textSecondary} />
      )}
    </View>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 24,
    padding: 14,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  thumbnail: {
    width: 60,
    height: 60,
    borderRadius: 20,
    backgroundColor: COLORS.surfaceLight,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumbnailLocked: {
    opacity: 0.4,
  },
  thumbnailImage: {
    width: '100%',
    height: '100%',
  },
  emoji: {
    fontSize: 30,
  },
  content: {
    flex: 1,
    marginLeft: 14,
    justifyContent: 'center',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    flexShrink: 1,
    color: COLORS.text,
    fontSize: 16,
    fontFamily: FONT_FAMILY.bold,
    marginRight: 6,
  },
  levelBadge: {
    flexShrink: 0,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  levelText: {
    color: COLORS.white,
    fontSize: 11,
    fontFamily: FONT_FAMILY.semiBold,
  },
  subtitle: {
    color: COLORS.textSecondary,
    fontSize: 13,
    fontFamily: FONT_FAMILY.medium,
    marginTop: 2,
  },
  metaText: {
    color: COLORS.muted,
    fontSize: 12,
    fontFamily: FONT_FAMILY.regular,
    marginTop: 4,
  },
  actionRight: {
    marginLeft: 10,
  },
  completedBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.success,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
