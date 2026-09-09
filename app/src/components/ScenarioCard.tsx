import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { ChevronRight, Check, Lock } from 'lucide-react-native';
import { COLORS } from '../theme/colors';
import { useLanguage } from '../data/i18n';
import { LEVEL_LABEL_KEY } from './SceneListCard';

/** رمپ رنگی اختصاصی سطح صحنه (theme/colors.ts) — قبلاً تعریف شده بود ولی این
 * بج تا الان همیشه خاکستری خنثی بود؛ استفاده از آن باعث می‌شود سطح از همون
 * نگاه اول با رنگ هم قابل‌تشخیص باشد، نه فقط با متن. */
const LEVEL_COLOR: Record<string, string> = {
  Beginner: COLORS.levelBeginnerBg,
  Intermediate: COLORS.levelIntermediateBg,
  Advanced: COLORS.levelAdvancedBg,
};

interface ScenarioCardProps {
  title: string;
  level: string;
  progress: number;
  time: string;
  imageUri: any;
  color?: string;
  subtitle?: string;
  sentencesCount?: number;
  isCompleted?: boolean;
  isLocked?: boolean;
  // جدا از isLocked (اشتراک): صحنه‌ی قبلیِ مسیر آموزشی هنوز کامل نشده.
  // همون آیکن قفل رو نشون می‌دیم ولی رنگ متفاوت (کهربایی نه خاکستری) تا با
  // قفل اشتراک اشتباه گرفته نشه.
  isSequenceLocked?: boolean;
  onPress?: () => void;
  isSmall?: boolean;
}

export const ScenarioCard: React.FC<ScenarioCardProps> = ({
  title,
  level,
  progress,
  time,
  imageUri,
  subtitle,
  sentencesCount = 24,
  isCompleted = false,
  isLocked = false,
  isSequenceLocked = false,
  onPress,
}) => {
  const { t } = useLanguage();
  const imageSource = typeof imageUri === 'string' ? { uri: imageUri } : imageUri;
  const levelLabel = t(LEVEL_LABEL_KEY[level] || LEVEL_LABEL_KEY.Beginner);
  const levelColor = LEVEL_COLOR[level] || LEVEL_COLOR.Beginner;
  const dimmed = isLocked || isSequenceLocked;
  const lockTint = isLocked ? COLORS.muted : COLORS.warningDeep;

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      style={styles.card}
    >
      {/* THUMBNAIL */}
      <View>
        <Image source={imageSource} style={[styles.thumbnail, dimmed && styles.thumbnailLocked]} />
        {dimmed && (
          <View style={styles.lockOverlay}>
            <Lock size={18} color={isLocked ? COLORS.white : COLORS.warningDeep} />
          </View>
        )}
      </View>

      {/* CONTENT INFO */}
      <View style={styles.content}>
        <View style={styles.titleRow}>
          <Text style={styles.title} numberOfLines={1}>{title}</Text>
          <View style={[styles.levelBadge, { backgroundColor: levelColor }]}>
            <Text style={styles.levelText}>{levelLabel}</Text>
          </View>
        </View>

        <Text style={styles.subtitle} numberOfLines={1}>
          {isSequenceLocked && !isLocked ? t('sequenceLockedMsg') : subtitle || title}
        </Text>

        <Text style={styles.metaText}>
          {sentencesCount} sentences · {time}
        </Text>
      </View>

      {/* ACTION RIGHT */}
      <View style={styles.actionRight}>
        {dimmed ? (
          <Lock size={20} color={lockTint} />
        ) : isCompleted || progress >= 100 ? (
          <View style={styles.completedBadge}>
            <Check size={16} color={COLORS.white} />
          </View>
        ) : (
          <ChevronRight size={20} color={COLORS.textSecondary} />
        )}
      </View>
    </TouchableOpacity>
  );
};

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
  },
  thumbnailLocked: {
    opacity: 0.4,
  },
  lockOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
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
    fontWeight: '700',
    marginRight: 6,
  },
  levelBadge: {
    flexShrink: 0,
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  levelText: {
    color: COLORS.white,
    fontSize: 11,
    fontWeight: '600',
  },
  subtitle: {
    color: COLORS.textSecondary,
    fontSize: 13,
    marginTop: 2,
  },
  metaText: {
    color: COLORS.muted,
    fontSize: 12,
    marginTop: 4,
  },
  actionRight: {
    marginLeft: 8,
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
});
