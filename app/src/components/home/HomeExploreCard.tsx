import React from 'react';
import {
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Clapperboard,
  Compass,
  Headphones,
  Music,
  Sparkles,
} from 'lucide-react-native';
import { COLORS, SPACING } from '../../theme/colors';
import { FONT_FAMILY } from '../../theme/typography';
import { SHADOWS } from '../../theme/elevation';

interface HomeExploreCardProps {
  onOpenPodcasts: () => void;
  onOpenStories: () => void;
  onOpenVideos: () => void;
  onOpenSongs: () => void;
  onOpenAll: () => void;
  rtl: boolean;
}

const EXPLORE_COVER_IMAGE = require('../../assets/home/explore_cover.jpg');

/**
 * کارت ادیتوریال و تصویری کاوش در کتابخانه محتوا
 * جایگزین گرید ۴ رنگ تکراری: دارای یک ورودی بصری قوی، تصویر باکیفیت و دسترسی سریع به پادکست‌ها، داستان‌ها، کلیپ‌ها و ترانه‌ها
 */
export const HomeExploreCard: React.FC<HomeExploreCardProps> = ({
  onOpenPodcasts,
  onOpenStories,
  onOpenVideos,
  onOpenSongs,
  onOpenAll,
  rtl,
}) => {
  const ChevronIcon = rtl ? ChevronLeft : ChevronRight;

  return (
    <View style={styles.container}>
      {/* Editorial Image Banner Card */}
      <TouchableOpacity
        style={styles.bannerCard}
        onPress={onOpenAll}
        activeOpacity={0.9}
      >
        <Image
          source={EXPLORE_COVER_IMAGE}
          style={styles.bannerImage}
          resizeMode="cover"
        />

        {/* Dark Gradient Overlay for rich contrast */}
        <View style={styles.bannerOverlay} />

        <View style={styles.bannerContent}>
          {/* Top Pill: Category tag */}
          <View style={[styles.tagRow, rtl && styles.rowReverse]}>
            <View style={styles.tagPill}>
              <Compass size={12} color="#FFFFFF" strokeWidth={2.4} />
              <Text style={styles.tagText}>
                {rtl ? 'کتابخانه جامع' : 'Content Library'}
              </Text>
            </View>

            <TouchableOpacity
              style={[styles.allLink, rtl && styles.rowReverse]}
              onPress={onOpenAll}
              activeOpacity={0.8}
            >
              <Text style={styles.allLinkText}>
                {rtl ? 'مشاهده همه' : 'Explore All'}
              </Text>
              <ChevronIcon size={13} color="#FFFFFF" strokeWidth={2.4} />
            </TouchableOpacity>
          </View>

          {/* Title & Subtitle */}
          <View style={[styles.textGroup, { alignItems: rtl ? 'flex-end' : 'flex-start' }]}>
            <Text style={[styles.bannerTitle, { textAlign: rtl ? 'right' : 'left' }]}>
              {rtl ? 'کاوش در دنیای محتوای انگلیسی' : 'Explore English Media Library'}
            </Text>
            <Text style={[styles.bannerSub, { textAlign: rtl ? 'right' : 'left' }]}>
              {rtl
                ? 'پادکست‌های تعاملی، داستان‌های مرحله‌ای، ویدیوکلیپ‌ها و ترانه‌ها'
                : 'Interactive podcasts, graded stories, movie clips, and songs'}
            </Text>
          </View>
        </View>
      </TouchableOpacity>

      {/* Quick Category Chips Row: Preserving all direct navigation entry points */}
      <View style={[styles.chipsRow, rtl && styles.rowReverse]}>
        <TouchableOpacity
          style={[styles.chip, rtl && styles.rowReverse]}
          onPress={onOpenPodcasts}
          activeOpacity={0.8}
        >
          <Headphones size={13} color="#FF6422" strokeWidth={2.2} />
          <Text style={styles.chipText}>{rtl ? 'پادکست‌ها' : 'Podcasts'}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.chip, rtl && styles.rowReverse]}
          onPress={onOpenStories}
          activeOpacity={0.8}
        >
          <BookOpen size={13} color="#2563EB" strokeWidth={2.2} />
          <Text style={styles.chipText}>{rtl ? 'داستان‌ها' : 'Stories'}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.chip, rtl && styles.rowReverse]}
          onPress={onOpenVideos}
          activeOpacity={0.8}
        >
          <Clapperboard size={13} color="#059669" strokeWidth={2.2} />
          <Text style={styles.chipText}>{rtl ? 'کلیپ‌ها' : 'Clips'}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.chip, rtl && styles.rowReverse]}
          onPress={onOpenSongs}
          activeOpacity={0.8}
        >
          <Music size={13} color="#D97706" strokeWidth={2.2} />
          <Text style={styles.chipText}>{rtl ? 'آهنگ‌ها' : 'Songs'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: SPACING.l,
    marginVertical: 12,
    gap: 10,
  },
  rowReverse: {
    flexDirection: 'row-reverse',
  },
  bannerCard: {
    height: 140,
    borderRadius: 22,
    overflow: 'hidden',
    position: 'relative',
    justifyContent: 'flex-end',
    padding: 16,
    ...SHADOWS.level2,
    shadowColor: '#2C2014',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 3,
  },
  bannerImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
  },
  bannerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(18, 22, 32, 0.55)',
  },
  bannerContent: {
    flex: 1,
    justifyContent: 'space-between',
  },
  tagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  tagPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(255, 100, 34, 0.85)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  tagText: {
    fontFamily: FONT_FAMILY.bold,
    fontSize: 10.5,
    color: '#FFFFFF',
  },
  allLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  allLinkText: {
    fontFamily: FONT_FAMILY.semiBold,
    fontSize: 11,
    color: '#FFFFFF',
  },
  textGroup: {
    gap: 3,
  },
  bannerTitle: {
    fontFamily: FONT_FAMILY.bold,
    fontSize: 15.5,
    color: '#FFFFFF',
    textShadowColor: 'rgba(0, 0, 0, 0.6)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  bannerSub: {
    fontFamily: FONT_FAMILY.regular,
    fontSize: 11.5,
    color: '#E0E3EA',
    lineHeight: 16,
  },
  chipsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  chip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    backgroundColor: '#FFFFFF',
    paddingVertical: 9,
    paddingHorizontal: 6,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#F0EBE3',
    ...SHADOWS.level1,
    shadowColor: '#2C2014',
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
  },
  chipText: {
    fontFamily: FONT_FAMILY.semiBold,
    fontSize: 11,
    color: '#191C21',
  },
});
