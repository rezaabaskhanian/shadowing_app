import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { Clock, GraduationCap, Plane, Gauge, Lock, Check } from 'lucide-react-native';
import { COLORS } from '../theme/colors';
import { FONT_FAMILY } from '../theme/typography';
import { useLanguage } from '../data/i18n';

export const LEVEL_LABEL_KEY: Record<string, string> = {
  Beginner: 'levelBeginner',
  Intermediate: 'levelIntermediate',
  Advanced: 'levelAdvanced',
};

interface SceneListCardProps {
  title: string;
  level: string;
  time: string;
  imageUri: any;
  isLocked?: boolean;
  isCompleted?: boolean;
  onPress?: () => void;
}

export const LEVEL_BADGE_STYLE: Record<string, { bg: string; text: string; Icon: any }> = {
  Beginner: { bg: COLORS.levelBeginnerBg, text: COLORS.white, Icon: GraduationCap },
  Intermediate: { bg: COLORS.levelIntermediateBg, text: COLORS.white, Icon: Plane },
  Advanced: { bg: COLORS.levelAdvancedBg, text: COLORS.white, Icon: Gauge },
};

export function SceneListCard({ title, level, time, imageUri, isLocked, isCompleted, onPress }: SceneListCardProps) {
  const { t } = useLanguage();
  const levelStyle = LEVEL_BADGE_STYLE[level] || LEVEL_BADGE_STYLE.Beginner;
  const LevelIcon = levelStyle.Icon;
  const levelLabel = t(LEVEL_LABEL_KEY[level] || LEVEL_LABEL_KEY.Beginner);

  return (
    <TouchableOpacity activeOpacity={0.9} style={styles.card} onPress={onPress}>
      <Image
        source={typeof imageUri === 'string' ? { uri: imageUri } : imageUri}
        style={[styles.image, isLocked && styles.imageLocked]}
      />
      <View style={styles.scrim} />

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
          <LevelIcon size={12} color={levelStyle.text} />
          <Text style={[styles.levelBadgeText, { color: levelStyle.text }]}>{levelLabel}</Text>
        </View>
      )}

      <View style={styles.bottomRow}>
        <Text style={styles.title} numberOfLines={1}>{title}</Text>
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
    height: 170,
    borderRadius: 24,
    overflow: 'hidden',
    marginBottom: 14,
  },
  image: {
    ...StyleSheet.absoluteFill,
    resizeMode: 'cover',
  },
  imageLocked: {
    opacity: 0.5,
  },
  lockBadge: {
    position: 'absolute',
    top: 14,
    right: 14,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  completedBadge: {
    position: 'absolute',
    top: 14,
    right: 14,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.success,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrim: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '55%',
    backgroundColor: 'rgba(10, 12, 20, 0.55)',
  },
  levelBadge: {
    position: 'absolute',
    top: 14,
    right: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  levelBadgeText: {
    fontFamily: FONT_FAMILY.bold,
    fontSize: 11,
  },
  bottomRow: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 14,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  title: {
    flex: 1,
    color: COLORS.white,
    fontFamily: FONT_FAMILY.bold,
    fontSize: 18,
    marginRight: 10,
  },
  timeTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  timeText: {
    color: COLORS.white,
    fontFamily: FONT_FAMILY.semiBold,
    fontSize: 12,
  },
});
