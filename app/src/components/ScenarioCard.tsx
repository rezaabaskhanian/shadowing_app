import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { ChevronRight, Check } from 'lucide-react-native';
import { COLORS, BORDER_RADIUS } from '../theme/colors';

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
  onPress,
}) => {
  const imageSource = typeof imageUri === 'string' ? { uri: imageUri } : imageUri;

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      style={styles.card}
    >
      {/* THUMBNAIL */}
      <Image source={imageSource} style={styles.thumbnail} />

      {/* CONTENT INFO */}
      <View style={styles.content}>
        <View style={styles.titleRow}>
          <Text style={styles.title} numberOfLines={1}>{title}</Text>
          <View style={styles.levelBadge}>
            <Text style={styles.levelText}>{level}</Text>
          </View>
        </View>

        <Text style={styles.subtitle} numberOfLines={1}>
          {subtitle || title}
        </Text>

        <Text style={styles.metaText}>
          {sentencesCount} sentences · {time}
        </Text>
      </View>

      {/* ACTION RIGHT */}
      <View style={styles.actionRight}>
        {isCompleted || progress >= 100 ? (
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
  content: {
    flex: 1,
    marginLeft: 14,
    justifyContent: 'center',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '700',
    marginRight: 6,
  },
  levelBadge: {
    backgroundColor: COLORS.surfaceLight,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  levelText: {
    color: COLORS.textSecondary,
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
    backgroundColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
