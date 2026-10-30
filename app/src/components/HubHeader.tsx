import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { X } from 'lucide-react-native';

import { COLORS } from '../theme/colors';
import { FONT_FAMILY } from '../theme/typography';
import { GradientFill } from './GradientFill';

/**
 * سربرگ مشترک صفحه‌های «مرکز» (مصاحبه، زبان تخصصی، دوره): برچسب کوچک بالا سمت چپ،
 * دکمه‌ی بستن سمت راست، آیکون در کاشی گرادیانی، عنوان و توضیح وسط‌چین.
 */
export const HubHeader: React.FC<{
  tag?: string;
  tagColor?: string;
  onClose: () => void;
  icon: React.ReactNode;
  /** دو رنگ گرادیان کاشی آیکون؛ پیش‌فرض نارنجی. */
  tile?: [string, string];
  /** کاشی گرد (مثل «قدم اول») به‌جای مربع گوشه‌گرد. */
  round?: boolean;
  /** نشان کوچک گوشه‌ی کاشی (مثل «AI»). */
  badge?: string;
  title: React.ReactNode;
  subtitle?: string;
  children?: React.ReactNode;
}> = ({ tag, tagColor = COLORS.success, onClose, icon, tile = ['#F28A55', '#E8572F'], round, badge, title, subtitle, children }) => (
  <View>
    <View style={styles.topRow}>
      {tag ? (
        <View style={[styles.tag, { borderColor: `${tagColor}33`, backgroundColor: `${tagColor}14` }]}>
          <Text style={[styles.tagText, { color: tagColor }]}>{tag}</Text>
          <View style={[styles.tagDot, { backgroundColor: tagColor }]} />
        </View>
      ) : (
        <View />
      )}
      <TouchableOpacity style={styles.closeBtn} onPress={onClose} activeOpacity={0.8}>
        <X size={20} color={COLORS.text} />
      </TouchableOpacity>
    </View>
    <View style={styles.center}>
      <View style={[styles.tile, round && styles.tileRound, { shadowColor: tile[1] }]}>
        <View style={[styles.tileFill, round && styles.tileRound]}>
          <GradientFill from={tile[0]} to={tile[1]} />
        </View>
        {icon}
        {!!badge && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{badge}</Text>
            <View style={styles.badgeDot} />
          </View>
        )}
      </View>
      {typeof title === 'string' ? <Text style={styles.title}>{title}</Text> : title}
      {!!subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
      {children}
    </View>
  </View>
);

const styles = StyleSheet.create({
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
  },
  tagText: { fontFamily: FONT_FAMILY.bold, fontSize: 10 },
  tagDot: { width: 6, height: 6, borderRadius: 3 },
  closeBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: '#EEEAE3',
    alignItems: 'center',
    justifyContent: 'center',
  },
  center: { alignItems: 'center' },
  tile: {
    width: 72,
    height: 72,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    elevation: 8,
    shadowOpacity: 0.35,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    backgroundColor: COLORS.primary,
  },
  tileRound: { borderRadius: 36 },
  tileFill: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, borderRadius: 20, overflow: 'hidden' },
  badge: {
    position: 'absolute',
    bottom: -6,
    left: -4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 8,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: '#F6D3C6',
  },
  badgeText: { fontFamily: FONT_FAMILY.bold, fontSize: 9, color: COLORS.primary },
  badgeDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: COLORS.primary },
  title: { fontFamily: FONT_FAMILY.bold, fontSize: 20, color: COLORS.text, textAlign: 'center' },
  subtitle: {
    fontFamily: FONT_FAMILY.regular,
    fontSize: 13,
    lineHeight: 22,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: 6,
  },
});
