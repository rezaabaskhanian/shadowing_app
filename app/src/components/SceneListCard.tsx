import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { Clock, GraduationCap, Plane, Gauge } from 'lucide-react-native';
import { COLORS } from '../theme/colors';
import { FONT_FAMILY } from '../theme/typography';

interface SceneListCardProps {
  title: string;
  level: string;
  time: string;
  imageUri: any;
  onPress?: () => void;
}

export const LEVEL_BADGE_STYLE: Record<string, { bg: string; text: string; Icon: any }> = {
  Beginner: { bg: COLORS.tertiary, text: COLORS.white, Icon: GraduationCap },
  Intermediate: { bg: COLORS.secondary, text: COLORS.secondaryContainer, Icon: Plane },
  Advanced: { bg: COLORS.error, text: COLORS.white, Icon: Gauge },
};

export function SceneListCard({ title, level, time, imageUri, onPress }: SceneListCardProps) {
  const levelStyle = LEVEL_BADGE_STYLE[level] || LEVEL_BADGE_STYLE.Beginner;
  const LevelIcon = levelStyle.Icon;

  return (
    <TouchableOpacity activeOpacity={0.9} style={styles.card} onPress={onPress}>
      <Image
        source={typeof imageUri === 'string' ? { uri: imageUri } : imageUri}
        style={styles.image}
      />
      <View style={styles.scrim} />

      <View style={[styles.levelBadge, { backgroundColor: levelStyle.bg }]}>
        <LevelIcon size={12} color={levelStyle.text} />
        <Text style={[styles.levelBadgeText, { color: levelStyle.text }]}>{level}</Text>
      </View>

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
