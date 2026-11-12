import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import {
  ChevronLeft,
  ChevronRight,
  Layers,
  Play,
  Sparkles,
  TrendingUp,
} from 'lucide-react-native';
import { type VerbPending } from '../../api/verbs';
import { COLORS, SPACING } from '../../theme/colors';
import { FONT_FAMILY } from '../../theme/typography';
import { SHADOWS } from '../../theme/elevation';

interface HomeVerbNoticeCardProps {
  verb: VerbPending;
  onPress: () => void;
  rtl: boolean;
}

interface HomeRetestNoticeCardProps {
  onPress: () => void;
  rtl: boolean;
}

/**
 * کارت تعاملی چالش افعال چندمعنایی (Polysemous Verb Challenge)
 * وقتی کاربر معنای تازه‌ای از فعل در مکالمات می‌بیند، با کوئیز کاربردی یادگیری آن را تثبیت می‌کند.
 */
export const HomeVerbNoticeCard: React.FC<HomeVerbNoticeCardProps> = ({
  verb,
  onPress,
  rtl,
}) => {
  const ChevronIcon = rtl ? ChevronLeft : ChevronRight;
  const meaningText = verb.meaning_fa ? `به معنی «${verb.meaning_fa}»` : '';

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.9}
    >
      {/* Top Header Tag */}
      <View style={[styles.topRow, rtl && styles.rowReverse]}>
        <View style={[styles.badgePill, rtl && styles.rowReverse]}>
          <Sparkles size={12} color="#059669" strokeWidth={2.4} />
          <Text style={styles.badgeText}>
            {rtl ? 'چالش فعل کاربردی' : 'Verb Challenge'}
          </Text>
        </View>

        <View style={styles.verbLemmaPill}>
          <Text style={styles.verbLemmaText}>{verb.lemma}</Text>
        </View>
      </View>

      {/* Main Body */}
      <View style={[styles.mainRow, rtl && styles.rowReverse]}>
        <View style={styles.iconCircle}>
          <Layers size={22} color="#059669" strokeWidth={2.2} />
        </View>

        <View style={[styles.textCol, { alignItems: rtl ? 'flex-end' : 'flex-start' }]}>
          <Text style={[styles.title, { textAlign: rtl ? 'right' : 'left' }]}>
            {rtl
              ? `معنای تازه‌ای از «${verb.lemma}» دیدی؟`
              : `Discovered a new meaning of "${verb.lemma}"?`}
          </Text>
          <Text style={[styles.subtitle, { textAlign: rtl ? 'right' : 'left' }]}>
            {meaningText
              ? `${meaningText} · با این آزمون کوتاه، این کاربرد جدید را در جمله تثبیت کن.`
              : rtl
              ? 'با حل ۳ سوال کوتاه، این کاربرد جدید را در مکالمه تثبیت کن.'
              : 'Consolidate this new usage in conversation with a quick quiz.'}
          </Text>
        </View>
      </View>

      {/* Action Footer */}
      <View style={[styles.footerRow, rtl && styles.rowReverse]}>
        <View style={[styles.actionBtn, rtl && styles.rowReverse]}>
          <Play size={11} color="#059669" fill="#059669" />
          <Text style={styles.actionBtnText}>
            {rtl ? 'شروع کوئیز کوتاه (۲ دقیقه)' : 'Start Quick Quiz'}
          </Text>
          <ChevronIcon size={13} color="#059669" strokeWidth={2.4} />
        </View>
      </View>
    </TouchableOpacity>
  );
};

/**
 * کارت پیشنهاد ارزیابی مجدد تعیین سطح بعد از ۲۸ روز
 */
export const HomeRetestNoticeCard: React.FC<HomeRetestNoticeCardProps> = ({
  onPress,
  rtl,
}) => {
  const ChevronIcon = rtl ? ChevronLeft : ChevronRight;

  return (
    <TouchableOpacity
      style={[styles.card, { borderColor: '#E0EEFE' }]}
      onPress={onPress}
      activeOpacity={0.9}
    >
      <View style={[styles.topRow, rtl && styles.rowReverse]}>
        <View style={[styles.badgePill, { backgroundColor: '#EFF6FF' }, rtl && styles.rowReverse]}>
          <TrendingUp size={12} color="#2563EB" strokeWidth={2.4} />
          <Text style={[styles.badgeText, { color: '#2563EB' }]}>
            {rtl ? 'ارزیابی رشد گفتاری' : 'Progress Retest'}
          </Text>
        </View>
      </View>

      <View style={[styles.mainRow, rtl && styles.rowReverse]}>
        <View style={[styles.iconCircle, { backgroundColor: '#EFF6FF' }]}>
          <TrendingUp size={22} color="#2563EB" strokeWidth={2.2} />
        </View>

        <View style={[styles.textCol, { alignItems: rtl ? 'flex-end' : 'flex-start' }]}>
          <Text style={[styles.title, { textAlign: rtl ? 'right' : 'left' }]}>
            {rtl ? 'زمان سنجش مجدد سطح گفتاری شماست' : 'Time for a Speaking Retest'}
          </Text>
          <Text style={[styles.subtitle, { textAlign: rtl ? 'right' : 'left' }]}>
            {rtl
              ? '۲۸ روز از آخرین آزمون گذشته است؛ مهارت گفتاری خود را دوباره بسنجید.'
              : '28 days since your last test; measure your speaking improvements.'}
          </Text>
        </View>
      </View>

      <View style={[styles.footerRow, rtl && styles.rowReverse]}>
        <View style={[styles.actionBtn, { backgroundColor: '#EFF6FF' }, rtl && styles.rowReverse]}>
          <Play size={11} color="#2563EB" fill="#2563EB" />
          <Text style={[styles.actionBtnText, { color: '#2563EB' }]}>
            {rtl ? 'شروع تست مجدد' : 'Start Retest'}
          </Text>
          <ChevronIcon size={13} color="#2563EB" strokeWidth={2.4} />
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    marginHorizontal: SPACING.l,
    marginVertical: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1.2,
    borderColor: '#D1F2DF',
    padding: 16,
    gap: 12,
    ...SHADOWS.level1,
    shadowColor: '#059669',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  rowReverse: {
    flexDirection: 'row-reverse',
  },
  badgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 9,
    paddingVertical: 3.5,
    borderRadius: 10,
  },
  badgeText: {
    fontFamily: FONT_FAMILY.bold,
    fontSize: 11,
    color: '#059669',
  },
  verbLemmaPill: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  verbLemmaText: {
    fontFamily: FONT_FAMILY.bold,
    fontSize: 12,
    color: '#191C21',
  },
  mainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#ECFDF5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  textCol: {
    flex: 1,
    gap: 3,
  },
  title: {
    fontFamily: FONT_FAMILY.bold,
    fontSize: 14,
    color: '#191C21',
    lineHeight: 20,
  },
  subtitle: {
    fontFamily: FONT_FAMILY.regular,
    fontSize: 12,
    color: '#697082',
    lineHeight: 18,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F5F5F7',
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#ECFDF5',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 14,
  },
  actionBtnText: {
    fontFamily: FONT_FAMILY.bold,
    fontSize: 11.5,
    color: '#059669',
  },
});

