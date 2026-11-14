import React from 'react';
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';
import { ChevronLeft, ChevronRight, Clock, Lock, Play } from 'lucide-react-native';
import { COLORS, SPACING } from '../../theme/colors';
import { FONT_FAMILY } from '../../theme/typography';
import { SHADOWS } from '../../theme/elevation';

export interface RecommendedSceneItem {
  id: string;
  title: string;
  level: string;
  imageUri?: string;
  isLocked?: boolean;
  time?: string;
}

interface HomeRecommendedShelfProps {
  title?: string;
  scenes: RecommendedSceneItem[];
  onOpenScene: (scene: RecommendedSceneItem) => void;
  onViewAll: () => void;
  rtl: boolean;
}

const SCENE_REAL_PHOTOS = [
  require('../../assets/scenes/clothes_shopping.png'),
  require('../../assets/scenes/hotel_reception.png'),
  require('../../assets/scenes/driving_lesson.png'),
  require('../../assets/scenes/weight_loss.png'),
  require('../../assets/home/continue_cover.jpg'),
  require('../../assets/home/explore_cover.jpg'),
];

const getScenePhotoSource = (scene: RecommendedSceneItem, index: number) => {
  const uri = scene.imageUri;
  if (typeof uri === 'string' && uri.length > 0) {
    return { uri };
  }
  if (uri && typeof uri === 'object' && (uri as any).uri) {
    return uri;
  }
  if (typeof uri === 'number') {
    return uri;
  }
  return SCENE_REAL_PHOTOS[index % SCENE_REAL_PHOTOS.length];
};

/**
 * ویترین افقی سناریوهای پیشنهادی
 * پالایش‌شده: حذف برچسب‌های تکراری و یکنواخت، کنتراست شفاف تصویر و متن، تایپوگرافی هماهنگ
 */
export const HomeRecommendedShelf: React.FC<HomeRecommendedShelfProps> = ({
  title = 'سناریوهای پیشنهادی',
  scenes,
  onOpenScene,
  onViewAll,
  rtl,
}) => {
  if (!scenes || scenes.length === 0) return null;

  return (
    <View style={styles.container}>
      {/* Header Row: Title flush in right corner, View all in left corner */}
      <View style={[styles.headerRow, rtl && styles.rowReverse]}>
        <TouchableOpacity
          style={styles.titleBtn}
          onPress={onViewAll}
          activeOpacity={0.8}
        >
          <Text style={[styles.sectionTitle, { textAlign: rtl ? 'right' : 'left' }]}>
            {title}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.viewAllBtn, rtl && styles.rowReverse]}
          onPress={onViewAll}
          activeOpacity={0.8}
        >
          <Text style={styles.viewAllText}>{rtl ? 'مشاهده همه' : 'View all'}</Text>
          {rtl ? (
            <ChevronLeft size={13} color="#FF6422" strokeWidth={2.4} />
          ) : (
            <ChevronRight size={13} color="#FF6422" strokeWidth={2.4} />
          )}
        </TouchableOpacity>
      </View>

      {/* Horizontal Carousel */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContent, rtl && styles.rowReverse]}
      >
        {scenes.map((scene, index) => {
          const duration = scene.time || '۱۰ دقیقه';

          return (
            <TouchableOpacity
              key={scene.id}
              style={styles.card}
              onPress={() => onOpenScene(scene)}
              activeOpacity={0.88}
            >
              {/* Scene Photo */}
              <Image
                source={getScenePhotoSource(scene, index)}
                style={styles.cardImage}
                resizeMode="cover"
              />

              {/* Enhanced Depth Gradient Scrim for Outstanding Title Readability */}
              <Svg style={StyleSheet.absoluteFill} pointerEvents="none">
                <Defs>
                  <LinearGradient id={`cardScrim_${scene.id}`} x1="0" y1="0" x2="0" y2="1">
                    <Stop offset="0" stopColor="#0A0E1A" stopOpacity="0.22" />
                    <Stop offset="0.4" stopColor="#0A0E1A" stopOpacity="0.38" />
                    <Stop offset="0.75" stopColor="#0A0E1A" stopOpacity="0.86" />
                    <Stop offset="1" stopColor="#0A0E1A" stopOpacity="0.96" />
                  </LinearGradient>
                </Defs>
                <Rect x="0" y="0" width="100%" height="100%" fill={`url(#cardScrim_${scene.id})`} />
              </Svg>

              {/* Top Badges: Show Duration and Lock only, without redundant beginner labels */}
              <View style={[styles.topBadgesRow, rtl && styles.rowReverse]}>
                <View style={styles.durationPill}>
                  <Clock size={11} color="#FFFFFF" strokeWidth={2.2} />
                  <Text style={styles.durationText}>{duration}</Text>
                </View>

                {scene.isLocked && (
                  <View style={styles.lockBadge}>
                    <Lock size={11} color="#FFFFFF" />
                  </View>
                )}
              </View>

              {/* Bottom Content: Title & Play Circle */}
              <View style={[styles.cardBottomRow, rtl && styles.rowReverse]}>
                <Text
                  style={[styles.sceneTitle, { textAlign: rtl ? 'right' : 'left' }]}
                  numberOfLines={2}
                >
                  {scene.title}
                </Text>

                <View style={styles.playCircle}>
                  <Play size={13} color="#FFFFFF" fill="#FFFFFF" style={{ marginLeft: 1 }} />
                </View>
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginVertical: 12,
  },
  headerRow: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.l,
    marginBottom: 12,
  },
  rowReverse: {
    flexDirection: 'row-reverse',
  },
  titleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionTitle: {
    fontFamily: FONT_FAMILY.bold,
    fontSize: 17,
    color: '#191C21',
    textAlign: 'right',
  },
  viewAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingVertical: 4,
  },
  viewAllText: {
    fontFamily: FONT_FAMILY.bold,
    fontSize: 12.5,
    color: '#FF6422',
  },
  scrollContent: {
    paddingHorizontal: SPACING.l,
    gap: 12,
  },
  card: {
    width: 220,
    height: 154,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: '#FAF5EE',
    position: 'relative',
    justifyContent: 'space-between',
    padding: 12,
    borderWidth: 1.2,
    borderColor: '#F0EBE3',
    ...SHADOWS.level2,
    shadowColor: '#2C2014',
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
  cardImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
  },
  scrimOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(15, 20, 30, 0.38)',
  },
  topBadgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  durationPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    paddingHorizontal: 8,
    paddingVertical: 3.5,
    borderRadius: 10,
  },
  durationText: {
    fontFamily: FONT_FAMILY.medium,
    fontSize: 10.5,
    color: '#FFFFFF',
  },
  lockBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(25, 28, 33, 0.75)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardBottomRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: 8,
  },
  sceneTitle: {
    flex: 1,
    fontFamily: FONT_FAMILY.bold,
    fontSize: 14,
    color: '#FFFFFF',
    lineHeight: 21,
    minHeight: 42,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  playCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FF6422',
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.level1,
  },
});
