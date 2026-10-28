import React, { useMemo, useRef, useState } from 'react';
import { Dimensions, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { ArrowLeft, Check, Crown, Play, Trophy } from 'lucide-react-native';
import Svg, { Path } from 'react-native-svg';

import { COLORS, hexToRgba } from '../../theme/colors';
import { FONT_FAMILY } from '../../theme/typography';
import { useLanguage } from '../../data/i18n';
import { useScenes } from '../../data/ScenesContext';
import { LEVEL_LABEL_KEY, LEVEL_BADGE_STYLE } from '../../components/SceneListCard';
import type { Scenario } from '../../data/scenarios';

const NODE_SIZE = 68;
const ROW_HEIGHT = 116;
const HEADER_HEIGHT = 74;
// فضای اضافه بعد از یک بخشِ کاملاً تمام‌شده، فقط برای جا شدن نشانِ جام —
// وگرنه با تیترِ بخشِ بعدی روی هم می‌افتاد.
const TROPHY_GAP = 40;
// زیگزاگِ خالص چپ/راست (بدون توقف در وسط) — تا مسیر واقعاً مارپیچ دیده
// بشه، نه یه ردیف با چند تا انحراف جزئی.
const OFFSET_PATTERN = [-68, 68];
// عرض واقعیِ ناحیه‌ی مسیر (عرض صفحه منهای padding افقی صفحه) — برای این‌که
// منحنیِ SVG دقیقاً از وسطِ همون نودی رد بشه که با translateX پیکسلی جابه‌جا
// شده، باید خط هم با همون واحدِ پیکسلی (نه درصد) رسم بشه.
const SCREEN_PADDING = 20;
const CONTENT_WIDTH = Dimensions.get('window').width - SCREEN_PADDING * 2;
// فقط ردیف‌های نزدیک به صفحه ساخته می‌شوند: با صدها صحنه، ساختن همه‌ی نودها و
// تکه‌های Svg با هم چند ثانیه طول می‌کشید تا صفحه باز شود.
const VIEW_H = Dimensions.get('window').height;
const WINDOW_ABOVE = VIEW_H * 1.5;
const WINDOW_BELOW = VIEW_H * 2.5;
// تا اسکرول کمتر از این جابه‌جا نشده، پنجره‌ی ساخته‌شده عوض نمی‌شود.
const WINDOW_STEP = VIEW_H * 0.5;

// ترتیب نمایش سطح‌ها روی نقشه: همیشه از آسان به سخت، صرف‌نظر از اینکه
// ادمین چه عددی برای "order" هر صحنه گذاشته — چون خودِ درخواست کاربر این
// بود که نقشه بر اساس سختی مرتب باشه، نه ترتیب خام ادمین.
const LEVEL_RANK: Record<string, number> = { Starter: 0, Beginner: 1, Intermediate: 2, Advanced: 3 };

type LayoutItem =
  | { kind: 'header'; level: string; top: number }
  | { kind: 'node'; scenario: Scenario; top: number; offsetX: number };

interface SectionBand {
  level: string;
  top: number;
  bottom: number;
  color: string;
  allCompleted: boolean;
}

// فقط یک «فعلی» داریم (اولین صحنه‌ی باز و ناتمام از آسان به سخت)؛ بقیه‌ی ناتمام‌ها «بعدی»اند.
// قبلاً همه‌ی ناتمام‌ها دکمه‌ی پخش نارنجی داشتند و کاربر نمی‌فهمید از کجا ادامه دهد.
type NodeState = 'completed' | 'current' | 'upcoming' | 'subLocked';

// هر صحنه‌ی باز-و-ناتمام «فعلی» حساب می‌شود (قفل ترتیبی وجود ندارد؛ فقط
// قفلِ اشتراک).
function baseState(scenario: Scenario): Exclude<NodeState, 'current'> {
  if (scenario.isLocked) return 'subLocked';
  if (scenario.isCompleted) return 'completed';
  return 'upcoming';
}

export const CurriculumMapScreen = () => {
  const navigation = useNavigation<any>();
  const { t } = useLanguage();
  const { scenes } = useScenes();
  const scrollRef = useRef<ScrollView>(null);

  // نقشه همیشه از آسان به سخت مرتب می‌شود (نه بر اساس "order" خام ادمین)؛
  // داخل هر سطح هم بر اساس order همان‌جا مرتب می‌مانند.
  const ordered = [...scenes].sort((a, b) => {
    const ra = LEVEL_RANK[a.level] ?? 99;
    const rb = LEVEL_RANK[b.level] ?? 99;
    if (ra !== rb) return ra - rb;
    return (a.order ?? 0) - (b.order ?? 0);
  });
  const completedCount = ordered.filter((s) => s.isCompleted).length;
  const currentId = ordered.find((s) => baseState(s) === 'upcoming')?.id;

  // چیدمانِ ردیف‌ها: هر بار که سطح عوض می‌شود یک تیترِ بخش («مبتدی»/«متوسط»/
  // «پیشرفته») اضافه می‌شود و شمارنده‌ی زیگزاگ از نو شروع می‌شود — تا مسیر هر
  // سطح بصری هم از سطح قبلی جدا به‌نظر برسد.
  const layout: LayoutItem[] = [];
  const sections: SectionBand[] = [];
  let y = 0;
  let lastLevel: string | null = null;
  let nodeIndexInSection = 0;
  for (const scenario of ordered) {
    if (scenario.level !== lastLevel) {
      // اگه بخشِ قبلی کامل تموم شده، یه فاصله‌ی اضافه براش می‌ذاریم تا نشانِ
      // جامِ آن بخش زیرِ آخرین نودش جا بشه، بدون این‌که با تیترِ بخشِ بعدی
      // قاطی بشه.
      const prevSection = sections[sections.length - 1];
      if (prevSection?.allCompleted) y += TROPHY_GAP;

      layout.push({ kind: 'header', level: scenario.level, top: y });
      const levelColor = (LEVEL_BADGE_STYLE[scenario.level] || LEVEL_BADGE_STYLE.Beginner).bg;
      sections.push({ level: scenario.level, top: y, bottom: y, color: levelColor, allCompleted: true });
      y += HEADER_HEIGHT;
      lastLevel = scenario.level;
      nodeIndexInSection = 0;
    }
    const offsetX = OFFSET_PATTERN[nodeIndexInSection % OFFSET_PATTERN.length];
    layout.push({ kind: 'node', scenario, top: y, offsetX });
    const section = sections[sections.length - 1];
    if (!scenario.isCompleted) section.allCompleted = false;
    y += ROW_HEIGHT;
    section.bottom = y;
    nodeIndexInSection++;
  }
  // اگه آخرین بخش (سخت‌ترین سطح) هم کامل شده، بالای صفحه یه فضای اضافه لازم
  // داره تا جامش جا بشه — چون بعد از فلیپ، همین «آخر مسیر» بالای صفحه
  // می‌افتد.
  if (sections[sections.length - 1]?.allCompleted) y += TROPHY_GAP;
  const pathHeight = Math.max(y, ROW_HEIGHT);

  // جهتِ مسیر برعکس شد: پایین = شروع (مبتدی)، بالا = پیشرفته‌ترین —
  // «هرچی جلوتر می‌ری، بالاتر می‌ری». به‌جای بازنویسیِ کل منطقِ چیدمان (که
  // از پیش با فرضِ بالا→پایین نوشته شده)، همون مختصات را عمودی آینه می‌کنیم:
  // بلوکی که در حالت عادی روی [top, top+height) می‌نشست، حالا روی
  // [pathHeight-top-height, pathHeight-top) می‌نشیند — یعنی ترتیب داخلی هر
  // بخش (و ترتیب خودِ بخش‌ها نسبت به هم) دقیقاً حفظ می‌شود، فقط جهت نمایش
  // برعکس می‌شود.
  const flip = (top: number, height: number) => pathHeight - top - height;

  const flippedLayout: LayoutItem[] = layout.map((item) =>
    item.kind === 'header' ? { ...item, top: flip(item.top, HEADER_HEIGHT) } : { ...item, top: flip(item.top, ROW_HEIGHT) }
  );
  const flippedSections: SectionBand[] = sections.map((s) => ({
    ...s,
    top: flip(s.top, s.bottom - s.top),
    bottom: pathHeight - s.top,
  }));

  const nodeItems = flippedLayout.filter((l): l is Extract<LayoutItem, { kind: 'node' }> => l.kind === 'node');

  // با مسیرهای بلند (مثلاً صدها صحنه)، کاربر نباید هر بار از بالای مسیر
  // (سطح مبتدی) دستی اسکرول کنه تا برسه به جایی که الان هست — همون لحظه‌ی
  // باز شدن صفحه، خودکار می‌ره سراغ اولین نودِ «فعلی».
  // جای شروع یک بار حساب می‌شود و اسکرول از همان‌جا باز می‌شود (contentOffset)،
  // تا پنجره‌ی ردیف‌های ساخته‌شده هم از اول همان‌جا باشد.
  const startY = useMemo(() => {
    const current = nodeItems.find((item) => item.scenario.id === currentId);
    return current ? Math.max(0, current.top - 180) : 0;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ordered.length > 0]);
  const [winTop, setWinTop] = useState(startY);
  const startedRef = useRef(false);
  const inWindow = (top: number, height: number) => top + height >= winTop - WINDOW_ABOVE && top <= winTop + WINDOW_BELOW;

  const openScene = (scenario: Scenario) => {
    if (scenario.isLocked) {
      navigation.navigate('Paywall');
      return;
    }
    navigation.navigate('Shadowing', { scenarioId: scenario.id, returnTo: 'CurriculumMap' });
  };

  return (
    <View style={styles.screen}>
      <View style={styles.headerRow}>
        <TouchableOpacity style={styles.backButton} onPress={() => (navigation.canGoBack() ? navigation.goBack() : navigation.navigate('Home'))}>
          <ArrowLeft color={COLORS.text} size={20} />
        </TouchableOpacity>
        <Text style={styles.title}>{t('curriculumMapTitle')}</Text>
      </View>
      <Text style={styles.sub}>
        {t('curriculumMapSub').replace('{done}', String(completedCount)).replace('{total}', String(ordered.length))}
      </Text>
      <View style={styles.progressTrack}>
        <View
          style={[
            styles.progressFill,
            { width: `${ordered.length > 0 ? (completedCount / ordered.length) * 100 : 0}%` },
          ]}
        />
      </View>

      <ScrollView
        ref={scrollRef}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        contentOffset={{ x: 0, y: startY }}
        scrollEventThrottle={100}
        onScroll={(e) => {
          const offY = e.nativeEvent.contentOffset.y;
          if (Math.abs(offY - winTop) > WINDOW_STEP) setWinTop(offY);
        }}
        // contentOffset روی همه‌ی نسخه‌های اندروید قابل اعتماد نیست؛ بار اولی که اندازه‌ی
        // محتوا معلوم شد، یک بار هم دستی به همان‌جا می‌رویم.
        onContentSizeChange={() => {
          if (startedRef.current || startY === 0) return;
          startedRef.current = true;
          scrollRef.current?.scrollTo({ y: startY, animated: false });
        }}
      >
        <View style={[styles.pathArea, { height: pathHeight }]}>
          {/* یه ناحیه‌ی رنگیِ خیلی کم‌رنگ پشت هر سطح — تا هر بخش حتی از دور
              هم یه «قلمرو»ی بصری جدا حس بشه، نه فقط یه خط جداکننده. */}
          {flippedSections.map((section) => (
            <View
              key={`zone-${section.level}`}
              style={[
                styles.sectionZone,
                {
                  top: section.top,
                  height: section.bottom - section.top,
                  backgroundColor: hexToRgba(section.color, 0.035),
                  borderColor: hexToRgba(section.color, 0.12),
                },
              ]}
            />
          ))}

          {/* هر تکه‌ی مسیر یه Svg کوچیکِ جدا دارد، نه یک Svg به ارتفاع کل نقشه:
              اندروید Svg را به یک bitmap تبدیل می‌کند و با صدها صحنه آن bitmap
              از سقف حافظه‌ی Canvas رد می‌شد و اپ کرش می‌کرد. */}
          {nodeItems.slice(1).map((item, i) => {
              const prev = nodeItems[i];
              if (!inWindow(Math.min(prev.top, item.top), Math.abs(prev.top - item.top) + ROW_HEIGHT)) return null;
              // بین دو سطح مختلف خطی رسم نمی‌شود — هر سطح مسیر جدای خودش است.
              if (prev.scenario.level !== item.scenario.level) return null;
              const fromX = CONTENT_WIDTH / 2 + prev.offsetX;
              const toX = CONTENT_WIDTH / 2 + item.offsetX;
              const segTop = Math.min(prev.top, item.top) + ROW_HEIGHT / 2 - 4;
              const segHeight = Math.abs(prev.top - item.top) + 8;
              const fromY = prev.top + ROW_HEIGHT / 2 - segTop;
              const toY = item.top + ROW_HEIGHT / 2 - segTop;
              const midY = (fromY + toY) / 2;
              const levelColor = (LEVEL_BADGE_STYLE[item.scenario.level] || LEVEL_BADGE_STYLE.Beginner).bg;
              // بخشی از مسیر که کاربر واقعاً پشت سر گذاشته (صحنه‌ی قبلی
              // کامل شده) با یه خط سبزِ توپر پررنگ‌تر نشون داده می‌شه — تا
              // خودِ نقشه هم بگه «تا اینجا اومدی»، نه فقط رنگ سطح.
              const traveled = prev.scenario.isCompleted;
              // یه منحنیِ نرم (نه خط راست شکسته) بین دو نود — همون حسی که تو
              // نمونه‌ی مرجع بود: مسیر جاری و پیوسته، نه زیگزاگِ تیز.
              const d = `M ${fromX} ${fromY} C ${fromX} ${midY}, ${toX} ${midY}, ${toX} ${toY}`;
              return (
                <Svg
                  key={`seg-${item.scenario.id}`}
                  style={{ position: 'absolute', left: 0, top: segTop }}
                  width={CONTENT_WIDTH}
                  height={segHeight}
                  pointerEvents="none"
                >
                  <Path
                    d={d}
                    fill="none"
                    stroke={traveled ? COLORS.tertiary : hexToRgba(levelColor, 0.45)}
                    strokeWidth={traveled ? 6 : 5}
                    strokeDasharray={traveled ? undefined : '1 11'}
                    strokeLinecap="round"
                  />
                </Svg>
              );
            })}

          {flippedLayout.map((item) => {
            if (!inWindow(item.top, item.kind === 'header' ? HEADER_HEIGHT : ROW_HEIGHT)) return null;
            if (item.kind === 'header') {
              const levelStyle = LEVEL_BADGE_STYLE[item.level] || LEVEL_BADGE_STYLE.Beginner;
              const LevelIcon = levelStyle.Icon;
              return (
                <View key={`header-${item.level}`} style={[styles.sectionHeader, { top: item.top }]}>
                  <View style={[styles.sectionHeaderPill, { borderColor: hexToRgba(levelStyle.bg, 0.4), backgroundColor: hexToRgba(levelStyle.bg, 0.08) }]}>
                    <LevelIcon color={levelStyle.bg} size={13} />
                    <Text style={[styles.sectionHeaderText, { color: levelStyle.bg }]}>{t(LEVEL_LABEL_KEY[item.level] || LEVEL_LABEL_KEY.Beginner)}</Text>
                  </View>
                </View>
              );
            }

            const state: NodeState = item.scenario.id === currentId ? 'current' : baseState(item.scenario);
            const levelStyle = LEVEL_BADGE_STYLE[item.scenario.level] || LEVEL_BADGE_STYLE.Beginner;
            const LevelIcon = levelStyle.Icon;
            return (
              <View
                key={item.scenario.id}
                style={[styles.row, { top: item.top, transform: [{ translateX: item.offsetX }] }]}
              >
                <NodeBubble state={state} onPress={() => openScene(item.scenario)} />
                <View
                  style={[
                    styles.label,
                    item.offsetX > 0 ? styles.labelLeft : item.offsetX < 0 ? styles.labelRight : styles.labelCenter,
                  ]}
                >
                  <LevelIcon color={levelStyle.bg} size={11} />
                  <Text style={styles.labelTitle} numberOfLines={1}>{item.scenario.title}</Text>
                </View>
              </View>
            );
          })}

          {/* پرچمِ اتمام بخش — فقط وقتی همه‌ی صحنه‌های همون سطح تمام شده؛ چون
              جهت مسیر برعکس شد، این نشان الان درست بالای همون بخش می‌نشیند
              (جایی که با رفتن به بالا از آن سطح خارج می‌شوی). */}
          {flippedSections
            .filter((s) => s.allCompleted)
            .map((s) => (
              <View key={`trophy-${s.level}`} style={[styles.trophyRow, { top: s.top - 37 }]}>
                <View style={[styles.trophyBadge, { backgroundColor: s.color }]}>
                  <Trophy color={COLORS.white} size={18} />
                </View>
              </View>
            ))}
        </View>
      </ScrollView>
    </View>
  );
};

// قفلِ اشتراک (subLocked) طلایی با تاج — چون معنیش «محتوای ویژه»ست.
const NodeBubble: React.FC<{ state: NodeState; onPress: () => void }> = ({ state, onPress }) => {
  const look = {
    completed: { bg: COLORS.success, border: COLORS.surface, icon: COLORS.white },
    current: { bg: COLORS.primary, border: COLORS.primaryLight, icon: COLORS.white },
    upcoming: { bg: COLORS.surface, border: COLORS.borderLight, icon: COLORS.muted },
    subLocked: { bg: hexToRgba(COLORS.secondary, 0.16), border: COLORS.surface, icon: COLORS.secondaryContainer },
  }[state];
  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      style={[
        styles.node,
        state !== 'current' && styles.nodeSmall,
        { backgroundColor: look.bg, borderColor: look.border },
        state === 'current' && styles.nodeCurrent,
      ]}
      accessibilityLabel={state}
    >
      {state === 'completed' ? (
        <Check color={look.icon} size={22} strokeWidth={3} />
      ) : state === 'current' ? (
        <Play color={look.icon} size={26} fill={look.icon} />
      ) : state === 'upcoming' ? (
        // باز است ولی هنوز نوبتش نرسیده؛ قفل نیست، فقط کم‌رنگ.
        <View style={[styles.upcomingDot, { backgroundColor: look.icon }]} />
      ) : (
        <Crown color={look.icon} size={20} />
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.background,
    paddingTop: 54,
    paddingHorizontal: 20,
  },
  // دکمه‌ی برگشت چپ، عنوان راست؛ توضیح و نوار پیشرفت زیر هر دو.
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 6,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    flex: 1,
    color: COLORS.text,
    fontFamily: FONT_FAMILY.bold,
    fontSize: 18,
    lineHeight: 28,
    textAlign: 'right',
  },
  sub: {
    color: COLORS.textSecondary,
    fontFamily: FONT_FAMILY.regular,
    fontSize: 12,
    lineHeight: 19,
    textAlign: 'right',
    marginBottom: 10,
  },
  progressTrack: {
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.borderLight,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
    backgroundColor: COLORS.tertiary,
  },
  scrollContent: {
    paddingBottom: 60,
    paddingTop: 24,
  },
  pathArea: {
    width: '100%',
    position: 'relative',
  },
  sectionZone: {
    position: 'absolute',
    left: -20,
    right: -20,
    borderRadius: 28,
    borderWidth: 1,
  },
  trophyRow: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  trophyBadge: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: COLORS.surface,
    elevation: 2,
    shadowColor: COLORS.black,
    shadowOpacity: 0.15,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  row: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  node: {
    width: NODE_SIZE,
    height: NODE_SIZE,
    borderRadius: NODE_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: COLORS.surface,
    elevation: 3,
    shadowColor: COLORS.black,
    shadowOpacity: 0.12,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
  },
  nodeCurrent: {
    borderWidth: 5,
  },
  upcomingDot: { width: 12, height: 12, borderRadius: 6, opacity: 0.6 },
  // فقط «فعلی» بزرگ است تا یک نقطه‌ی اصلی روی مسیر باشد.
  nodeSmall: {
    transform: [{ scale: 0.8 }],
    elevation: 0,
    shadowOpacity: 0,
  },
  label: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 8,
    maxWidth: 150,
    backgroundColor: COLORS.surface,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  labelCenter: { alignItems: 'center' },
  labelLeft: { alignItems: 'center' },
  labelRight: { alignItems: 'center' },
  labelTitle: {
    color: COLORS.text,
    fontFamily: FONT_FAMILY.semiBold,
    fontSize: 12,
    textAlign: 'center',
  },
  sectionHeader: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
    height: HEADER_HEIGHT,
  },
  // تیتر سطح باید برچسب باشد، نه دکمه: بدون سایه و پس‌زمینه‌ی پر.
  sectionHeaderPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 10,
    borderWidth: 1,
  },
  sectionHeaderText: {
    fontFamily: FONT_FAMILY.bold,
    fontSize: 12,
  },
});
