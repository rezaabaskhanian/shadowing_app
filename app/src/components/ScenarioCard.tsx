import React from 'react';
import { View, Text, StyleSheet, ImageBackground, TouchableOpacity } from 'react-native';
import { Clock, LucideIcon } from 'lucide-react-native';
import { COLORS, SPACING, BORDER_RADIUS } from '../theme/colors';

interface ScenarioCardProps {
  title: string;
  level: string;
  progress: number;
  time: string;
  imageUri: any;
  color?: string;
  Icon?: LucideIcon;
  onPress?: () => void;
  isSmall?: boolean;
}

export const ScenarioCard = ({
  title,
  level,
  progress,
  time,
  imageUri,
  color = COLORS.primary,
  Icon,
  onPress,
  isSmall = false,
}: ScenarioCardProps) => {
  return (
    <TouchableOpacity
      activeOpacity={0.86}
      onPress={onPress}
      style={[styles.card, isSmall ? styles.smallCard : styles.largeCard]}
    >
      <ImageBackground
        source={imageUri}
        style={styles.image}
        imageStyle={styles.imageStyle}
      >
        <View style={styles.scrim} />
        <View style={[styles.iconBox, { backgroundColor: color }]}>
          {Icon ? <Icon color={COLORS.white} size={isSmall ? 22 : 26} /> : null}
        </View>

        <View style={styles.content}>
          <Text style={styles.title} numberOfLines={1}>{title}</Text>
          <View style={styles.metaRow}>
            <View style={styles.badge}>
              <View style={styles.levelDot} />
              <Text style={styles.badgeText}>{level}</Text>
            </View>
            <View style={[styles.progressRing, { borderColor: progress > 0 ? color : COLORS.border }]}>
              <Text style={styles.progressText}>{progress}%</Text>
            </View>
          </View>
          <View style={styles.timeRow}>
            <Clock size={12} color={COLORS.textSecondary} />
            <Text style={styles.timeText}>{time}</Text>
          </View>
        </View>
      </ImageBackground>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.m,
    overflow: 'hidden',
    marginBottom: SPACING.m,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  largeCard: {
    width: '100%',
    height: 210,
  },
  smallCard: {
    width: '48%',
    height: 176,
  },
  image: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  imageStyle: {
    borderRadius: BORDER_RADIUS.m,
  },
  scrim: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(2, 8, 20, 0.5)',
  },
  iconBox: {
    position: 'absolute',
    left: 14,
    top: 14,
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    padding: 14,
  },
  title: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 8,
  },
  metaRow: {
    minHeight: 42,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  badge: {
    backgroundColor: 'rgba(17, 26, 44, 0.86)',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  levelDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.accent,
    marginRight: 6,
  },
  badgeText: {
    color: COLORS.text,
    fontSize: 12,
    fontWeight: '600',
  },
  progressRing: {
    width: 46,
    height: 46,
    borderRadius: 23,
    borderWidth: 4,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(5, 11, 24, 0.74)',
  },
  progressText: {
    color: COLORS.text,
    fontSize: 12,
    fontWeight: '800',
  },
  timeRow: {
    alignSelf: 'flex-end',
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  timeText: {
    color: COLORS.textSecondary,
    fontSize: 12,
    marginLeft: 4,
  },
});
