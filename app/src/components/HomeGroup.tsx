import React, { useState } from 'react';
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Check, ChevronLeft, Lock } from 'lucide-react-native';

import { COLORS, hexToRgba } from '../theme/colors';
import { FONT_FAMILY } from '../theme/typography';
import type { BentoItem } from './BentoGrid';

export interface HomeGroupTab {
  key: string;
  label: string;
  accent: string;
  items: BentoItem[];
  /** مقصد «همه» وقتی همین زبانه انتخاب است. */
  onAll: () => void;
  emptyText?: string;
  /** متن لینک «همه» برای همین زبانه (مثلاً «مسیر کامل»)؛ پیش‌فرض allLabel دسته. */
  allLabel?: string;
}

const CARD_W = 148;
const IMG_H = 92;

/**
 * یک دسته در خانه (مثلاً «کتابخانه»): تیتر، یک لینک «همه» برای کل دسته، زبانه‌های
 * کوچک برای نوع محتوا (پادکست / داستان / آهنگ ...) و یک ردیف افقی کارت.
 * به‌جای چند بخش پشت سر هم با شبکه‌ی کارت، صفحه کوتاه و قابل اسکن می‌ماند.
 */
export const HomeGroup: React.FC<{
  title: string;
  tabs: HomeGroupTab[];
  allLabel: string;
}> = ({ title, tabs, allLabel }) => {
  const visible = tabs.filter((tb) => tb.items.length > 0 || !!tb.emptyText);
  const [activeKey, setActiveKey] = useState<string | null>(null);
  if (visible.length === 0) return null;
  const active = visible.find((tb) => tb.key === activeKey) ?? visible[0];

  return (
    <View style={styles.group}>
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
        <TouchableOpacity onPress={active.onAll} hitSlop={10} style={styles.all}>
          <Text style={styles.allText}>{active.allLabel ?? allLabel}</Text>
          <ChevronLeft size={15} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

      {visible.length > 1 && (
        // زبانه‌ها در چند ردیف می‌شکنند (نه اسکرول افقی) تا آخری نیمه‌بریده نماند؛ حالت فعال
        // در همه‌ی دسته‌ها یکی است (کادر و متن مرجانی روی پس‌زمینه‌ی کم‌رنگ).
        <View style={styles.tabs}>
          {visible.map((tb) => {
            const on = tb.key === active.key;
            return (
              <TouchableOpacity
                key={tb.key}
                style={[styles.tab, on && styles.tabOn]}
                onPress={() => setActiveKey(tb.key)}
                activeOpacity={0.85}
              >
                <Text style={[styles.tabText, on && styles.tabTextOn]}>{tb.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      )}

      {active.items.length === 0 && active.emptyText ? (
        <Text style={styles.empty}>{active.emptyText}</Text>
      ) : (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.rail}>
          {active.items.map((it) => (
            <TouchableOpacity
              key={it.key}
              style={styles.card}
              onPress={it.onPress}
              disabled={!it.onPress}
              activeOpacity={0.85}
            >
              <View style={[styles.imgWrap, { backgroundColor: hexToRgba(active.accent, 0.12) }]}>
                {it.image ? (
                  <Image source={it.image} style={styles.img} resizeMode="cover" />
                ) : (
                  <Text style={styles.emoji}>{it.emoji ?? '•'}</Text>
                )}
                {it.completed && (
                  <View style={[styles.corner, { backgroundColor: COLORS.success }]}>
                    <Check size={12} color={COLORS.white} strokeWidth={3} />
                  </View>
                )}
                {it.locked && !it.completed && (
                  <View style={[styles.corner, { backgroundColor: hexToRgba(COLORS.black, 0.55) }]}>
                    <Lock size={11} color={COLORS.white} />
                  </View>
                )}
                {!!it.progress && it.progress > 0 && !it.completed && (
                  <View style={styles.progressTrack}>
                    <View style={[styles.progressFill, { width: `${Math.min(100, it.progress)}%` }]} />
                  </View>
                )}
              </View>
              <Text style={styles.cardTitle} numberOfLines={1}>
                {it.title}
              </Text>
              <View style={styles.metaRow}>
                {!!it.badge && (
                  <Text style={[styles.badge, { color: it.badge.color, backgroundColor: hexToRgba(it.badge.color, 0.12) }]}>
                    {it.badge.label}
                  </Text>
                )}
                {!!it.meta && (
                  <Text style={styles.meta} numberOfLines={1}>
                    {it.meta}
                  </Text>
                )}
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  group: { marginBottom: 22 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  title: { fontFamily: FONT_FAMILY.bold, fontSize: 15, color: COLORS.text },
  all: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  allText: { fontFamily: FONT_FAMILY.semiBold, fontSize: 12, color: COLORS.primary },
  tabs: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, paddingBottom: 10 },
  tabOn: { backgroundColor: COLORS.primaryLight, borderColor: COLORS.primary },
  tabTextOn: { color: COLORS.primary, fontFamily: FONT_FAMILY.bold },
  tab: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    backgroundColor: COLORS.surface,
  },
  tabText: { fontFamily: FONT_FAMILY.medium, fontSize: 12, color: COLORS.textSecondary },
  rail: { gap: 10, paddingRight: 2 },
  card: { width: CARD_W },
  imgWrap: {
    width: CARD_W,
    height: IMG_H,
    borderRadius: 12,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  img: { width: '100%', height: '100%' },
  emoji: { fontSize: 30 },
  corner: {
    position: 'absolute',
    top: 6,
    left: 6,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressTrack: { position: 'absolute', left: 0, right: 0, bottom: 0, height: 4, backgroundColor: hexToRgba(COLORS.black, 0.25) },
  progressFill: { height: '100%', backgroundColor: COLORS.success },
  cardTitle: { fontFamily: FONT_FAMILY.semiBold, fontSize: 13, lineHeight: 20, color: COLORS.text, marginTop: 6 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 1 },
  badge: { fontFamily: FONT_FAMILY.semiBold, fontSize: 10, paddingHorizontal: 6, paddingVertical: 1, borderRadius: 6, overflow: 'hidden' },
  meta: { flexShrink: 1, fontFamily: FONT_FAMILY.regular, fontSize: 11, color: COLORS.textSecondary },
  empty: { fontFamily: FONT_FAMILY.regular, fontSize: 12, color: COLORS.textSecondary, paddingVertical: 8 },
});
