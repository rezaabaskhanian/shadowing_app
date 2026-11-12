import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import {
  BarChart2,
  BookMarked,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Compass,
  Headphones,
  Sparkles,
  Target,
} from 'lucide-react-native';
import { COLORS, SPACING } from '../../theme/colors';
import { FONT_FAMILY } from '../../theme/typography';
import { SHADOWS } from '../../theme/elevation';

interface HomeQuickAccessProps {
  onOpenShadowing: () => void;
  onOpenVocabulary: () => void;
  onOpenPractice: () => void;
  onOpenProgress: () => void;
  rtl: boolean;
}

/**
 * بخش میانبر واژگان و دسترسی‌های کاربردی
 * ارتقایافته: کارت متمرکز لایتنر همراه با توضیح شفاف کاربرد و اکشن مشخص، به همراه چیپ‌های دسترسی تمیز
 */
export const HomeQuickAccess: React.FC<HomeQuickAccessProps> = ({
  onOpenShadowing,
  onOpenVocabulary,
  onOpenPractice,
  onOpenProgress,
  rtl,
}) => {
  const ChevronIcon = rtl ? ChevronLeft : ChevronRight;

  return (
    <View style={styles.container}>
      {/* 1. Main Clear Vocabulary / Leitner Entry Card */}
      <TouchableOpacity
        style={styles.vocabHeroCard}
        onPress={onOpenVocabulary}
        activeOpacity={0.88}
      >
        <View style={[styles.vocabRow, rtl && styles.rowReverse]}>
          {/* Icon Badge */}
          <View style={styles.vocabIconCircle}>
            <BookMarked size={19} color="#2563EB" strokeWidth={2.2} />
          </View>

          {/* Text & Explanatory Microcopy */}
          <View style={[styles.vocabTextCol, { alignItems: rtl ? 'flex-end' : 'flex-start' }]}>
            <View style={[styles.vocabTitleRow, rtl && styles.rowReverse]}>
              <Text style={styles.vocabTitle}>
                {rtl ? 'جعبه لایتنر هوشمند' : 'Smart Leitner Box'}
              </Text>
              <View style={styles.reviewBadge}>
                <Text style={styles.reviewBadgeText}>
                  {rtl ? 'مرور واژگان' : 'Review'}
                </Text>
              </View>
            </View>

            <Text style={[styles.vocabSubtext, { textAlign: rtl ? 'right' : 'left' }]}>
              {rtl
                ? 'مرور و تثبیت لغات ذخیره‌شده از سناریوها با فواصل هوشمند'
                : 'Consolidate words saved from conversations with spaced repetition'}
            </Text>
          </View>

          {/* Action Arrow */}
          <View style={styles.arrowWrap}>
            <ChevronIcon size={15} color="#2563EB" strokeWidth={2.4} />
          </View>
        </View>
      </TouchableOpacity>

      {/* 2. Minimal Secondary Functional Quick Actions (Map, Habit, Stats) */}
      <View style={[styles.subActionsRow, rtl && styles.rowReverse]}>
        <TouchableOpacity
          style={[styles.subActionBtn, rtl && styles.rowReverse]}
          onPress={onOpenShadowing}
          activeOpacity={0.8}
        >
          <Compass size={14} color="#7C3AED" strokeWidth={2.2} />
          <Text style={styles.subActionText}>{rtl ? 'نقشه مکالمات' : 'Curriculum'}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.subActionBtn, rtl && styles.rowReverse]}
          onPress={onOpenPractice}
          activeOpacity={0.8}
        >
          <Target size={14} color="#059669" strokeWidth={2.2} />
          <Text style={styles.subActionText}>{rtl ? 'عادت روزانه' : 'Daily Habit'}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.subActionBtn, rtl && styles.rowReverse]}
          onPress={onOpenProgress}
          activeOpacity={0.8}
        >
          <BarChart2 size={14} color="#D97706" strokeWidth={2.2} />
          <Text style={styles.subActionText}>{rtl ? 'آمار پیشرفت' : 'Progress'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: SPACING.l,
    marginVertical: 6,
    gap: 8,
  },
  rowReverse: {
    flexDirection: 'row-reverse',
  },
  vocabHeroCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1.2,
    borderColor: '#E6EFFE',
    paddingVertical: 10,
    paddingHorizontal: 13,
    ...SHADOWS.level1,
    shadowColor: '#2563EB',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  vocabRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
  },
  vocabIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  vocabTextCol: {
    flex: 1,
    gap: 2,
  },
  vocabTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  vocabTitle: {
    fontFamily: FONT_FAMILY.bold,
    fontSize: 13.5,
    color: '#191C21',
  },
  reviewBadge: {
    backgroundColor: '#EEF4FF',
    paddingHorizontal: 7,
    paddingVertical: 1.5,
    borderRadius: 8,
  },
  reviewBadgeText: {
    fontFamily: FONT_FAMILY.bold,
    fontSize: 10,
    color: '#2563EB',
  },
  vocabSubtext: {
    fontFamily: FONT_FAMILY.regular,
    fontSize: 11.5,
    color: '#697082',
    lineHeight: 16,
  },
  arrowWrap: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#F3F7FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  subActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  subActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#FFFFFF',
    paddingVertical: 9,
    paddingHorizontal: 8,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#F0EBE3',
  },
  subActionText: {
    fontFamily: FONT_FAMILY.semiBold,
    fontSize: 11.5,
    color: '#191C21',
  },
});
