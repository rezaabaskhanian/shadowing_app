import React from 'react';
import {
  ImageBackground,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
  type ImageSourcePropType,
} from 'react-native';
import { Check, ChevronLeft, ChevronRight, Lock } from 'lucide-react-native';
import { COLORS } from '../theme/colors';
import { FONT_FAMILY } from '../theme/typography';

/** یک مورد در شبکه‌ی ناهمگونِ خانه (صحنه، ویدیو، پادکست، ...). */
export interface BentoItem {
  key: string;
  title: string;
  subtitle?: string;
  meta?: string;
  image?: ImageSourcePropType;
  /** وقتی عکس ندارد، بزرگ و کم‌رنگ روی رنگِ بخش نشان داده می‌شود. */
  emoji?: string;
  badge?: { label: string; color: string };
  locked?: boolean;
  completed?: boolean;
  /** ۰ تا ۱۰۰؛ فقط روی کارت بزرگ نوار پیشرفت دارد. */
  progress?: number;
  onPress?: () => void;
}

/**
 * چیدمانِ هر بخش؛ بخش‌ها به نوبت این‌ها را می‌گیرند تا صفحه تکراری نشود:
 *  - wideTop:   یک مستطیلِ پهن، زیرش دو مربع
 *  - tallLeft:  یک کارتِ بلند، کنارش دو کارتِ کوتاه روی هم
 *  - wideBottom: دو مربع، زیرشان یک مستطیلِ پهن
 */
export type BentoPattern = 'wideTop' | 'tallLeft' | 'wideBottom';
export const BENTO_PATTERNS: BentoPattern[] = ['wideTop', 'tallLeft', 'wideBottom'];

/** هر بخش این تعداد مورد را نشان می‌دهد؛ بقیه از «همه». */
export const BENTO_ITEM_COUNT = 3;

const GAP = 12;
const H_PADDING = 20; // همان paddingHorizontal صفحه‌ی خانه

type CardSize = 'wide' | 'square' | 'tall' | 'small';

const BentoCard: React.FC<{
  item: BentoItem;
  size: CardSize;
  width: number;
  height: number;
  accent: string;
}> = ({ item, size, width, height, accent }) => {
  const big = size === 'wide' || size === 'tall';
  const content = (
    <>
      {!item.image && !!item.emoji && (
        <Text style={[styles.bgEmoji, { fontSize: big ? 96 : 56 }]} allowFontScaling={false}>
          {item.emoji}
        </Text>
      )}
      <View style={[styles.scrim, !item.image && styles.scrimLight]} />

      <View style={styles.topRow}>
        {item.badge ? (
          <View style={[styles.badge, { backgroundColor: item.badge.color }]}>
            <Text style={styles.badgeText} numberOfLines={1}>
              {item.badge.label}
            </Text>
          </View>
        ) : (
          <View />
        )}
        {item.locked ? (
          <View style={styles.stateDot}>
            <Lock size={12} color={COLORS.white} />
          </View>
        ) : item.completed ? (
          <View style={[styles.stateDot, { backgroundColor: COLORS.success }]}>
            <Check size={12} color={COLORS.white} strokeWidth={3} />
          </View>
        ) : null}
      </View>

      <View style={styles.textBlock}>
        <Text style={[styles.title, big ? styles.titleBig : styles.titleSmall]} numberOfLines={2}>
          {item.title}
        </Text>
        {!!item.subtitle && size !== 'small' && (
          <Text style={styles.subtitle} numberOfLines={big ? 2 : 1}>
            {item.subtitle}
          </Text>
        )}
        {!!item.meta && (
          <Text style={styles.meta} numberOfLines={1}>
            {item.meta}
          </Text>
        )}
        {big && item.progress !== undefined && item.progress > 0 && (
          <View style={styles.progressBg}>
            <View style={[styles.progressFill, { width: `${Math.min(100, item.progress)}%` }]} />
          </View>
        )}
      </View>
    </>
  );

  return (
    <TouchableOpacity
      activeOpacity={0.88}
      onPress={item.onPress}
      disabled={!item.onPress}
      style={[styles.card, { width, height, backgroundColor: accent }, item.locked && styles.cardLocked]}
    >
      {item.image ? (
        <ImageBackground source={item.image} style={styles.fill} imageStyle={styles.cardImage}>
          {content}
        </ImageBackground>
      ) : (
        <View style={styles.fill}>{content}</View>
      )}
    </TouchableOpacity>
  );
};

interface GridProps {
  items: BentoItem[];
  pattern: BentoPattern;
  /** رنگ پس‌زمینه‌ی کارت‌های بی‌عکس (رنگ همان بخش). */
  accent: string;
}

/** شبکه‌ی ناهمگونِ یک بخش (۱ تا ۳ مورد). */
export const BentoGrid: React.FC<GridProps> = ({ items, pattern, accent }) => {
  const { width: screenWidth } = useWindowDimensions();
  const full = screenWidth - H_PADDING * 2;
  const half = (full - GAP) / 2;
  const wideHeight = Math.round(full * 0.52);
  const tallHeight = Math.round(half * 1.4);
  const list = items.slice(0, BENTO_ITEM_COUNT);
  const card = (item: BentoItem, size: CardSize, w: number, h: number) => (
    <BentoCard key={item.key} item={item} size={size} width={w} height={h} accent={accent} />
  );

  if (list.length === 0) return null;
  if (list.length === 1) return <View style={styles.grid}>{card(list[0], 'wide', full, wideHeight)}</View>;
  if (list.length === 2) {
    return <View style={[styles.grid, styles.row]}>{list.map((it) => card(it, 'square', half, half))}</View>;
  }

  const [a, b, c] = list;
  if (pattern === 'tallLeft') {
    const smallH = (tallHeight - GAP) / 2;
    return (
      <View style={[styles.grid, styles.row]}>
        {card(a, 'tall', half, tallHeight)}
        <View style={{ gap: GAP }}>
          {card(b, 'small', half, smallH)}
          {card(c, 'small', half, smallH)}
        </View>
      </View>
    );
  }
  const squares = (
    <View style={styles.row}>
      {card(b, 'square', half, half)}
      {card(c, 'square', half, half)}
    </View>
  );
  return (
    <View style={styles.grid}>
      {pattern === 'wideBottom' && squares}
      {card(a, 'wide', full, wideHeight)}
      {pattern === 'wideTop' && squares}
    </View>
  );
};

/** تیترِ بخش: آیکون + عنوان، و «همه ›» در طرف دیگر. */
export const BentoSectionHeader: React.FC<{
  title: string;
  icon?: React.ReactNode;
  accent: string;
  actionLabel?: string;
  onAction?: () => void;
  rtl?: boolean;
}> = ({ title, icon, accent, actionLabel, onAction, rtl }) => (
  <View style={styles.header}>
    <View style={styles.headerTitleRow}>
      {!!icon && <View style={[styles.headerIcon, { backgroundColor: accent }]}>{icon}</View>}
      <Text style={styles.headerTitle}>{title}</Text>
    </View>
    {!!actionLabel && !!onAction && (
      <TouchableOpacity onPress={onAction} hitSlop={8} style={styles.headerAction}>
        <Text style={styles.headerActionText}>{actionLabel}</Text>
        {rtl ? <ChevronLeft size={16} color={COLORS.primary} /> : <ChevronRight size={16} color={COLORS.primary} />}
      </TouchableOpacity>
    )}
  </View>
);

const styles = StyleSheet.create({
  grid: {
    gap: GAP,
    marginBottom: 8,
  },
  row: {
    flexDirection: 'row',
    gap: GAP,
  },
  card: {
    borderRadius: 22,
    overflow: 'hidden',
  },
  cardLocked: {
    opacity: 0.75,
  },
  fill: {
    flex: 1,
    justifyContent: 'space-between',
  },
  cardImage: {
    borderRadius: 22,
  },
  bgEmoji: {
    position: 'absolute',
    right: -8,
    top: -6,
    opacity: 0.35,
  },
  scrim: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(12, 16, 23, 0.38)',
  },
  scrimLight: {
    backgroundColor: 'rgba(12, 16, 23, 0.12)',
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 10,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    maxWidth: '75%',
  },
  badgeText: {
    color: COLORS.white,
    fontFamily: FONT_FAMILY.semiBold,
    fontSize: 10,
  },
  stateDot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(12, 16, 23, 0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  textBlock: {
    padding: 12,
    gap: 2,
  },
  title: {
    color: COLORS.white,
    fontFamily: FONT_FAMILY.bold,
    textShadowColor: 'rgba(0,0,0,0.35)',
    textShadowRadius: 6,
  },
  titleBig: {
    fontSize: 19,
    lineHeight: 26,
  },
  titleSmall: {
    fontSize: 14,
    lineHeight: 20,
  },
  subtitle: {
    color: 'rgba(255,255,255,0.88)',
    fontFamily: FONT_FAMILY.regular,
    fontSize: 12,
    lineHeight: 18,
  },
  meta: {
    color: 'rgba(255,255,255,0.8)',
    fontFamily: FONT_FAMILY.medium,
    fontSize: 11,
    marginTop: 2,
  },
  progressBg: {
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.3)',
    marginTop: 8,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.white,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 24,
    marginBottom: 12,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexShrink: 1,
  },
  headerIcon: {
    width: 28,
    height: 28,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    color: COLORS.text,
    fontFamily: FONT_FAMILY.bold,
    fontSize: 17,
  },
  headerAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  headerActionText: {
    color: COLORS.primary,
    fontFamily: FONT_FAMILY.semiBold,
    fontSize: 13,
  },
});
