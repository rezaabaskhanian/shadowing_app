import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { ChevronLeft, ChevronRight, Clock } from 'lucide-react-native';
import { ProgressRing } from '../ProgressRing';
import { COLORS, SPACING } from '../../theme/colors';
import { FONT_FAMILY } from '../../theme/typography';
import { SHADOWS } from '../../theme/elevation';

interface HomeContinueCardProps {
  title: string;
  progressPercent: number;
  remainingMinutes?: number;
  imageUri?: string;
  onPress: () => void;
  statusLabel?: string;
  rtl: boolean;
}

const REAL_CONTINUE_IMAGE = require('../../assets/home/continue_cover.jpg');

export const HomeContinueCard: React.FC<HomeContinueCardProps> = ({
  title,
  progressPercent,
  remainingMinutes = 12,
  imageUri,
  onPress,
  statusLabel = 'در حال یادگیری',
  rtl,
}) => {
  const thumbSource =
    typeof imageUri === 'string' && imageUri.startsWith('http')
      ? { uri: imageUri }
      : imageUri && typeof imageUri === 'object' && (imageUri as any).uri
      ? imageUri
      : typeof imageUri === 'number'
      ? imageUri
      : REAL_CONTINUE_IMAGE;
  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.9}
    >
      <View style={[styles.innerRow, rtl && styles.rowReverse]}>
        {/* Progress Ring */}
        <View style={styles.ringWrapper}>
          <ProgressRing
            percent={progressPercent}
            size={64}
            strokeWidth={6.5}
            color="#FF6422"
            trackColor="#F7EFE6"
          >
            <Text style={styles.percentText}>{progressPercent}%</Text>
          </ProgressRing>
        </View>

        {/* Text Details */}
        <View style={[styles.textCol, { alignItems: rtl ? 'flex-end' : 'flex-start' }]}>
          <Text style={styles.statusLabel}>{statusLabel}</Text>
          <Text style={[styles.scenarioTitle, { textAlign: rtl ? 'right' : 'left' }]} numberOfLines={1}>
            {title}
          </Text>
          <View style={[styles.metaRow, rtl && styles.rowReverse]}>
            <Clock size={12} color="#8E95A5" />
            <Text style={styles.metaText}>
              {remainingMinutes} دقیقه باقی مانده
            </Text>
          </View>
        </View>

        {/* Thumbnail Preview with Arrow Overlay */}
        <View style={styles.thumbnailWrap}>
          <Image
            source={thumbSource}
            style={styles.thumbnailImage}
            resizeMode="cover"
          />
          <View style={styles.arrowBadge}>
            {rtl ? (
              <ChevronLeft size={16} color="#191C21" strokeWidth={2.4} />
            ) : (
              <ChevronRight size={16} color="#191C21" strokeWidth={2.4} />
            )}
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    marginHorizontal: SPACING.l,
    marginVertical: SPACING.s,
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#F2ECE4',
    paddingHorizontal: 14,
    paddingVertical: 14,
    ...SHADOWS.level1,
  },
  innerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  rowReverse: {
    flexDirection: 'row-reverse',
  },
  ringWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  percentText: {
    fontFamily: FONT_FAMILY.bold,
    fontSize: 14,
    color: '#191C21',
  },
  textCol: {
    flex: 1,
    justifyContent: 'center',
  },
  statusLabel: {
    fontFamily: FONT_FAMILY.medium,
    fontSize: 11.5,
    color: '#8E95A5',
    marginBottom: 2,
  },
  scenarioTitle: {
    fontFamily: FONT_FAMILY.bold,
    fontSize: 15.5,
    color: '#191C21',
    lineHeight: 22,
    marginBottom: 4,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontFamily: FONT_FAMILY.regular,
    fontSize: 11.5,
    color: '#7B8293',
  },
  thumbnailWrap: {
    position: 'relative',
    width: 72,
    height: 56,
    borderRadius: 14,
    overflow: 'hidden',
  },
  thumbnailImage: {
    width: '100%',
    height: '100%',
  },
  arrowBadge: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(255,255,255,0.7)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

