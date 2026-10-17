import React, { useState } from 'react';
import { Image, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { Check, X } from 'lucide-react-native';

import { COLORS, SPACING, BORDER_RADIUS } from '../../theme/colors';
import { FONT_FAMILY } from '../../theme/typography';
import { absUrl } from '../../api/config';

const GAP = 10;

/**
 * عکس‌های «داستان تصویری»، شماره‌دار و ورق‌خور (با انگشت). کارت بعدی کمی
 * پیداست تا کاربر بفهمد عکس‌های بیشتری هست. در نتیجه (covered) روی هر عکس
 * تیک یا ضربدر می‌آید: این عکس در داستان گفته شد یا نه.
 */
export const StoryPictures: React.FC<{
  images: { url: string }[];
  horizontalPadding: number;
  covered?: number[];
}> = ({ images, horizontalPadding, covered }) => {
  const { width } = useWindowDimensions();
  const cardWidth = Math.round((width - horizontalPadding * 2) * 0.86);
  const [page, setPage] = useState(0);

  return (
    <View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        snapToInterval={cardWidth + GAP}
        decelerationRate="fast"
        contentContainerStyle={{ gap: GAP }}
        onScroll={(e) => setPage(Math.round(e.nativeEvent.contentOffset.x / (cardWidth + GAP)))}
        scrollEventThrottle={32}
      >
        {images.map((img, i) => {
          const done = covered?.includes(i + 1);
          return (
            <View key={`${img.url}-${i}`} style={[styles.card, { width: cardWidth, height: cardWidth * 0.66 }]}>
              <Image source={{ uri: absUrl(img.url) }} style={StyleSheet.absoluteFill} resizeMode="cover" />
              <View style={styles.number}>
                <Text style={styles.numberText}>{i + 1}</Text>
              </View>
              {covered && (
                <View style={[styles.state, { backgroundColor: done ? COLORS.success : COLORS.error }]}>
                  {done ? <Check size={14} color={COLORS.white} strokeWidth={3} /> : <X size={14} color={COLORS.white} strokeWidth={3} />}
                </View>
              )}
            </View>
          );
        })}
      </ScrollView>
      {images.length > 1 && (
        <View style={styles.dots}>
          {images.map((_, i) => (
            <View key={i} style={[styles.dot, i === page && styles.dotActive]} />
          ))}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: BORDER_RADIUS.l,
    overflow: 'hidden',
    backgroundColor: COLORS.surfaceLight,
  },
  number: {
    position: 'absolute',
    top: 10,
    left: 10,
    minWidth: 28,
    height: 28,
    borderRadius: 14,
    paddingHorizontal: 8,
    backgroundColor: 'rgba(12, 16, 23, 0.65)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  numberText: {
    color: COLORS.white,
    fontFamily: FONT_FAMILY.bold,
    fontSize: 14,
  },
  state: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
    marginTop: SPACING.s,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.border,
  },
  dotActive: {
    width: 16,
    backgroundColor: COLORS.primary,
  },
});
