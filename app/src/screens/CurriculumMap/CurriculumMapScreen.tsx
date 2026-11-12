import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Dimensions, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import { ArrowLeft, Check, ChevronLeft, ChevronRight, Crown, Flame, Lock, Play, Trophy, Zap } from 'lucide-react-native';
import Svg, { Circle, Defs, Path, RadialGradient, Stop } from 'react-native-svg';

import { COLORS, hexToRgba } from '../../theme/colors';
import { FONT_FAMILY } from '../../theme/typography';
import { useLanguage } from '../../data/i18n';
import { useScenes } from '../../data/ScenesContext';
import { LEVEL_LABEL_KEY, LEVEL_BADGE_STYLE } from '../../components/SceneListCard';
import type { Scenario } from '../../data/scenarios';
import { GradientFill } from '../../components/GradientFill';
import { useAuth } from '../../data/AuthContext';
import { getUserStreak, getUserSummary } from '../../api/progress';
import { getSubscriptionStatus } from '../../api/billing';
import { getMyLevel } from '../../api/assessment';
import { difficultyToLevel } from '../../api/scenes';

const toFa = (v: number | string) => String(v).replace(/\d/g, (d) => '۰۱۲۳۴۵۶۷۸۹'[Number(d)]);
const PATH_COLOR = '#E2DBD0';
// خط مسیر چقدر از وسط به طرفِ مخالفِ دایره‌ها می‌رود (نسبت به جابه‌جاییِ خود دایره).
const CURVE_RATIO = 0.6;
const HALO_SIZE = 210;

const NODE_SIZE = 68;
const ROW_HEIGHT = 150;
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
  | { kind: 'node'; scenario: Scenario; top: number; offsetX: number; session: number };

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
  const route = useRoute<any>();
  const { t, language } = useLanguage();
  const rtl = language === 'fa';
  const num = (v: number | string) => (rtl ? toFa(v) : String(v));
  const { scenes } = useScenes();
  const { user } = useAuth();
  const [streak, setStreak] = useState<number | null>(null);
  const [xp, setXp] = useState<number | null>(null);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [userLevel, setUserLevel] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      if (user?.role === 'admin') {
        setIsSubscribed(true);
      } else {
        getSubscriptionStatus()
          .then((s) => setIsSubscribed(!!s?.active))
          .catch(() => setIsSubscribed(false));
      }
      if (!user?.id) return;
      let active = true;
      getUserStreak(user.id)
        .then((r) => active && setStreak(r.current_streak))
        .catch(() => {});
      getUserSummary(user.id)
        .then((r) => active && setXp(r.total_xp))
        .catch(() => {});
      getMyLevel()
        .then((lvl) => {
          if (active && lvl?.scene_level) {
            setUserLevel(difficultyToLevel(lvl.scene_level));
          }
        })
        .catch(() => {});
      return () => {
        active = false;
      };
    }, [user?.id, user?.role])
  );
  const scrollRef = useRef<ScrollView>(null);

  const FREE_SCENES_PER_LEVEL = 4;
  const isSceneLocked = useCallback(
    (scenario: Scenario, session: number) => {
      if (isSubscribed) return false;
      return scenario.isLocked || session > FREE_SCENES_PER_LEVEL;
    },
    [isSubscribed]
  );

  // نقشه همیشه از آسان به سخت مرتب می‌شود (نه بر اساس "order" خام ادمین)؛
  // داخل هر سطح هم بر اساس order همان‌جا مرتب می‌مانند.
  const ordered = [...scenes].sort((a, b) => {
    const ra = LEVEL_RANK[a.level] ?? 99;
    const rb = LEVEL_RANK[b.level] ?? 99;
    if (ra !== rb) return ra - rb;
    return (a.order ?? 0) - (b.order ?? 0);
  });
  const completedCount = ordered.filter((s) => s.isCompleted).length;

  // سطح مؤثر کاربر (از پارامتر یا نتیجه‌ی تست تعیین سطح)
  const effectiveLevel = route.params?.focusLevel || userLevel || 'Beginner';
  const targetRank = LEVEL_RANK[effectiveLevel] ?? 1;

  // پیدا کردن اولین صحنه‌ی فعال متناسب با سطح تعیین سطح کاربر
  // صحنه‌های قبل هرگز حذف نمی‌شوند؛ فقط نقطه شروع و فوکوس کاربر تنظیم می‌شود
  const candidateScenes = ordered.filter((s) => (LEVEL_RANK[s.level] ?? 0) >= targetRank);
  const currentInTargetLevel = candidateScenes.find((s) => baseState(s) === 'upcoming')?.id;
  const currentId =
    currentInTargetLevel ||
    candidateScenes[0]?.id ||
    ordered.find((s) => baseState(s) === 'upcoming')?.id ||
    ordered[0]?.id;

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
    layout.push({ kind: 'node', scenario, top: y, offsetX, session: nodeIndexInSection + 1 });
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
  }, [currentId, nodeItems]);
  const [winTop, setWinTop] = useState(startY);
  const startedRef = useRef(false);
  const inWindow = (top: number, height: number) => top + height >= winTop - WINDOW_ABOVE && top <= winTop + WINDOW_BELOW;

  // هدایت خودکار اسکرول به سطح تعیین شده کاربر
  useEffect(() => {
    if (startY > 0) {
      setWinTop(startY);
      const tm = setTimeout(() => {
        scrollRef.current?.scrollTo({ y: startY, animated: true });
      }, 150);
      return () => clearTimeout(tm);
    }
  }, [startY]);

  const currentScene = ordered.find((sc) => sc.id === currentId);
  const currentLevel = currentScene?.level || effectiveLevel || 'Starter';
  const currentLevelScenes = ordered.filter((sc) => sc.level === currentLevel);
  const currentLevelDone = currentLevelScenes.filter((sc) => sc.isCompleted).length;
  const currentLevelTotal = currentLevelScenes.length;
  const currentLevelLabel = t(LEVEL_LABEL_KEY[currentLevel] || LEVEL_LABEL_KEY.Beginner);
  const CurrentLevelIcon = (LEVEL_BADGE_STYLE[currentLevel] || LEVEL_BADGE_STYLE.Beginner).Icon;
  const currentSession = nodeItems.find((n) => n.scenario.id === currentId)?.session ?? 1;

  // پرش نرم به یک سطح خاص بدون حذف سایر صحنه‌های نقشه
  const jumpToLevel = (targetLvl: string) => {
    const targetNode = nodeItems.find((item) => {
      if (targetLvl === 'Beginner') {
        return item.scenario.level === 'Starter' || item.scenario.level === 'Beginner';
      }
      return item.scenario.level.toLowerCase() === targetLvl.toLowerCase();
    });
    if (targetNode) {
      const targetY = Math.max(0, targetNode.top - 180);
      setWinTop(targetY);
      scrollRef.current?.scrollTo({ y: targetY, animated: true });
    }
  };

  const openScene = (scenario: Scenario, locked = false) => {
    if (locked) {
      navigation.navigate('Paywall');
      return;
    }
    navigation.navigate('Shadowing', { scenarioId: scenario.id, returnTo: 'CurriculumMap' });
  };

  return (
    <View style={styles.screen}>
      <View style={styles.top}>
        <View style={[styles.headerRow, rtl && styles.rowReverse]}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => (navigation.canGoBack() ? navigation.goBack() : navigation.navigate('Home'))}
          >
            {rtl ? <ChevronRight color={COLORS.text} size={20} /> : <ChevronLeft color={COLORS.text} size={20} />}
          </TouchableOpacity>
          <View style={[styles.headerText, rtl && styles.alignEnd]}>
            <Text style={styles.title}>{t('curriculumMapTitle')}</Text>
            <View style={[styles.subRow, rtl && styles.rowReverse]}>
              <View style={styles.subDot} />
              <Text style={styles.sub}>
                {t('curriculumMapSub').replace('{done}', num(completedCount)).replace('{total}', num(ordered.length))}
              </Text>
            </View>
          </View>
          <View style={[styles.chips, rtl && styles.rowReverse]}>
            {streak !== null && (
              <View style={[styles.chip, styles.chipStreak, rtl && styles.rowReverse]}>
                <Flame size={13} color="#E8572F" fill="#E8572F" />
                <Text style={[styles.chipText, styles.chipStreakText]}>
                  {t('curriculumStreakDays').replace('{n}', num(streak))}
                </Text>
              </View>
            )}
            {xp !== null && (
              <View style={[styles.chip, styles.chipXp, rtl && styles.rowReverse]}>
                <Zap size={13} color="#E9A23B" fill="#E9A23B" />
                <Text style={[styles.chipText, styles.chipXpText]}>{num(xp)}</Text>
              </View>
            )}
          </View>
        </View>
        <View style={[styles.progressTrack, rtl && styles.rowReverse]}>
          <View
            style={[
              styles.progressFill,
              { width: `${ordered.length > 0 ? Math.max(2, (completedCount / ordered.length) * 100) : 0}%` },
            ]}
          />
        </View>
      </View>

      {currentScene && (
        <View style={[styles.levelBanner, rtl && styles.rowReverse]}>
          <GradientFill from="#FFF6E2" to="#FFFDF7" horizontal />
          <View style={styles.levelIconBox}>
            <CurrentLevelIcon size={20} color={COLORS.white} />
          </View>
          <View style={[styles.levelBannerText, rtl && styles.alignEnd]}>
            <View style={[styles.levelChipRow, rtl && styles.rowReverse]}>
              <View style={styles.levelChip}>
                <Text style={styles.levelChipText}>{t('curriculumLevelChip').replace('{level}', currentLevelLabel)}</Text>
              </View>
              <Text style={styles.levelKicker}>{t('curriculumSpokenEnglish')}</Text>
            </View>
            <Text style={styles.levelTitle} numberOfLines={1}>
              {t('curriculumLevelProgress')
                .replace('{done}', num(currentLevelDone))
                .replace('{total}', num(currentLevelTotal))}
            </Text>
          </View>
        </View>
      )}

      {/* انتخاب سریع سطح در رودمپ برای جابجایی بدون حذف هیچ‌یک از صحنه‌ها */}
      <View style={[styles.levelTabsRow, rtl && styles.rowReverse]}>
        {[
          { id: 'Beginner', label: 'مبتدی' },
          { id: 'Intermediate', label: 'متوسط' },
          { id: 'Advanced', label: 'پیشرفته' },
        ].map((lvlTab) => {
          const isUserAssessed = userLevel
            ? (lvlTab.id === 'Beginner' && (userLevel === 'Starter' || userLevel === 'Beginner')) ||
              userLevel.toLowerCase() === lvlTab.id.toLowerCase()
            : lvlTab.id === 'Beginner';
          const isCurrentActive =
            currentLevel.toLowerCase() === lvlTab.id.toLowerCase() ||
            (lvlTab.id === 'Beginner' && (currentLevel === 'Starter' || currentLevel === 'Beginner'));

          return (
            <TouchableOpacity
              key={lvlTab.id}
              style={[
                styles.levelTabItem,
                isCurrentActive && styles.levelTabItemActive,
                rtl && styles.rowReverse,
              ]}
              onPress={() => jumpToLevel(lvlTab.id)}
              activeOpacity={0.7}
            >
              <Text style={[styles.levelTabText, isCurrentActive && styles.levelTabTextActive]}>
                {lvlTab.label}
              </Text>
              {isUserAssessed && <View style={styles.myLevelDot} />}
            </TouchableOpacity>
          );
        })}
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
          {/* هر تکه‌ی مسیر یه Svg کوچیکِ جدا دارد، نه یک Svg به ارتفاع کل نقشه:
              اندروید Svg را به یک bitmap تبدیل می‌کند و با صدها صحنه آن bitmap
              از سقف حافظه‌ی Canvas رد می‌شد و اپ کرش می‌کرد. */}
          {/* ابتدای هر سطح: یک قوس کوتاه زیرِ اولین دایره تا خط بی‌هدف قطع نشود؛
              اگر کاربر همین‌جاست یا ردش کرده، نارنجی. */}
          {nodeItems.map((item, i) => {
            if (i > 0 && nodeItems[i - 1].scenario.level === item.scenario.level) return null;
            if (!inWindow(item.top, ROW_HEIGHT)) return null;
            const startX = CONTENT_WIDTH / 2 - item.offsetX * CURVE_RATIO;
            // رو به بیرون (دور از دایره و برچسبش) خم می‌شود.
            const endX = startX - item.offsetX * 0.9;
            const h = 120;
            const active = item.scenario.id === currentId || item.scenario.isCompleted;
            return (
              <Svg
                key={`tail-${item.scenario.id}`}
                style={[styles.segment, { top: item.top + NODE_SIZE / 2 - 4 }]}
                width={CONTENT_WIDTH}
                height={h + 8}
                pointerEvents="none"
              >
                <Path
                  d={`M ${startX} 4 C ${startX} ${h * 0.6}, ${endX} ${h * 0.45}, ${endX} ${h}`}
                  fill="none"
                  stroke={active ? COLORS.primary : PATH_COLOR}
                  strokeWidth={5}
                  strokeDasharray="8 10"
                  strokeLinecap="round"
                />
              </Svg>
            );
          })}

          {nodeItems.slice(1).map((item, i) => {
              const prev = nodeItems[i];
              if (!inWindow(Math.min(prev.top, item.top), Math.abs(prev.top - item.top) + ROW_HEIGHT)) return null;
              // بین دو سطح مختلف خطی رسم نمی‌شود — هر سطح مسیر جدای خودش است.
              if (prev.scenario.level !== item.scenario.level) return null;
              // خط از روی دایره‌ها رد نمی‌شود: هم‌ارتفاعِ هر دایره، طرفِ مقابلش
              // می‌نشیند و بین دو دایره با یک قوس نرم به طرف دیگر می‌رود.
              const fromX = CONTENT_WIDTH / 2 - prev.offsetX * CURVE_RATIO;
              const toX = CONTENT_WIDTH / 2 - item.offsetX * CURVE_RATIO;
              const segTop = Math.min(prev.top, item.top) + NODE_SIZE / 2 - 4;
              const segHeight = Math.abs(prev.top - item.top) + 8;
              const fromY = prev.top + NODE_SIZE / 2 - segTop;
              const toY = item.top + NODE_SIZE / 2 - segTop;
              // قوس زود (بین برچسبِ بالایی و دایره‌ی پایینی) به طرف دیگر می‌رود و بعد
              // صاف بالا می‌رود؛ این‌طوری از زیر برچسب‌ها و روی دایره‌ها رد نمی‌شود.
              const bendY = Math.max(fromY, toY) - 44;
              // بخشی از مسیر که کاربر واقعاً پشت سر گذاشته (صحنه‌ی قبلی
              // کامل شده) با یه خط سبزِ توپر پررنگ‌تر نشون داده می‌شه — تا
              // خودِ نقشه هم بگه «تا اینجا اومدی»، نه فقط رنگ سطح.
              const traveled = prev.scenario.isCompleted;
              // یه منحنیِ نرم (نه خط راست شکسته) بین دو نود — همون حسی که تو
              // نمونه‌ی مرجع بود: مسیر جاری و پیوسته، نه زیگزاگِ تیز.
              const d = `M ${fromX} ${fromY} C ${fromX} ${bendY}, ${toX} ${bendY}, ${toX} ${toY}`;
              return (
                <Svg
                  key={`seg-${item.scenario.id}`}
                  style={[styles.segment, { top: segTop }]}
                  width={CONTENT_WIDTH}
                  height={segHeight}
                  pointerEvents="none"
                >
                  <Path
                    d={d}
                    fill="none"
                    stroke={traveled ? COLORS.primary : PATH_COLOR}
                    strokeWidth={5}
                    strokeDasharray="8 10"
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
                  <View
                    style={[
                      styles.sectionHeaderPill,
                      rtl && styles.rowReverse,
                      { borderColor: hexToRgba(levelStyle.bg, 0.35), backgroundColor: hexToRgba(levelStyle.bg, 0.1) },
                    ]}
                  >
                    <LevelIcon color={levelStyle.bg} size={14} />
                    <Text style={[styles.sectionHeaderText, { color: levelStyle.bg }]}>{t(LEVEL_LABEL_KEY[item.level] || LEVEL_LABEL_KEY.Beginner)}</Text>
                  </View>
                </View>
              );
            }

            const locked = isSceneLocked(item.scenario, item.session);
            let state: NodeState;
            if (item.scenario.isCompleted) {
              state = 'completed';
            } else if (locked) {
              state = 'subLocked';
            } else if (item.scenario.id === currentId) {
              state = 'current';
            } else {
              state = 'upcoming';
            }
            const levelStyle = LEVEL_BADGE_STYLE[item.scenario.level] || LEVEL_BADGE_STYLE.Beginner;
            const LevelIcon = levelStyle.Icon;
            return (
              <View
                key={item.scenario.id}
                style={[styles.row, { top: item.top, transform: [{ translateX: item.offsetX }] }]}
              >
                <NodeBubble state={state} onPress={() => openScene(item.scenario, locked)} />
                <View style={[styles.label, rtl && styles.rowReverse, state === 'current' && styles.labelCurrent]}>
                  {state === 'current' ? (
                    <View style={styles.labelDot} />
                  ) : (
                    <LevelIcon color={levelStyle.bg} size={12} />
                  )}
                  <Text style={styles.labelTitle} numberOfLines={1}>
                    {item.scenario.title}
                  </Text>
                  {locked && (
                    <View style={[styles.subLockedChip, rtl && styles.rowReverse]}>
                      <Lock size={10} color={COLORS.primary} />
                      <Text style={styles.subLockedChipText}>{t('locked') || 'قفل'}</Text>
                    </View>
                  )}
                  {state === 'current' ? (
                    <View style={styles.learningChip}>
                      <Text style={styles.learningChipText}>
                        {t('curriculumSessionN').replace('{n}', num(item.session))} {t('curriculumLearningNow')}
                      </Text>
                    </View>
                  ) : (
                    <Text style={styles.labelSession}>
                      ({t('curriculumSessionN').replace('{n}', num(item.session))})
                    </Text>
                  )}
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

      {currentScene && (
        <View style={[styles.bottomBar, rtl && styles.rowReverse]}>
          <View style={[styles.bottomText, rtl && styles.alignEnd]}>
            <View style={[styles.subRow, rtl && styles.rowReverse]}>
              <View style={styles.bottomDot} />
              <Text style={styles.bottomTitle} numberOfLines={1}>
                {t('curriculumSessionN').replace('{n}', num(currentSession))}: {'\u2066' + currentScene.title + '\u2069'}
              </Text>
            </View>
            {!!parseInt(currentScene.time || '0', 10) && (
              <Text style={styles.bottomSub}>
                {t('curriculumDuration').replace('{n}', num(parseInt(currentScene.time || '0', 10)))}
              </Text>
            )}
          </View>
          <TouchableOpacity
            style={styles.startBtn}
            activeOpacity={0.85}
            onPress={() => openScene(currentScene, isSceneLocked(currentScene, currentSession))}
          >
            <GradientFill from="#F07A4A" to="#E8572F" horizontal />
            <View style={[styles.startBtnInner, rtl && styles.rowReverse]}>
              <Text style={styles.startBtnText}>
                {isSceneLocked(currentScene, currentSession)
                  ? 'قفل است · ارتقا به اشتراک ویژه'
                  : t('curriculumStartPractice')}
              </Text>
              {isSceneLocked(currentScene, currentSession) ? (
                <Lock size={16} color={COLORS.white} />
              ) : rtl ? (
                <ArrowLeft size={18} color={COLORS.white} />
              ) : (
                <Play size={16} color={COLORS.white} fill={COLORS.white} />
              )}
            </View>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

// قفلِ اشتراک (subLocked) با رنگ نارنجی تم اصلی
const NodeBubble: React.FC<{ state: NodeState; onPress: () => void }> = ({ state, onPress }) => {
  if (state === 'current') {
    return (
      <View style={styles.currentWrap}>
        {/* هاله‌ی نرم (محو در لبه‌ها)، نه یک دایره‌ی لبه‌دار */}
        <Svg width={HALO_SIZE} height={HALO_SIZE} style={styles.currentHalo} pointerEvents="none">
          <Defs>
            <RadialGradient id="curHalo" cx="50%" cy="50%" r="50%">
              <Stop offset="0" stopColor="#FF6422" stopOpacity={0.28} />
              <Stop offset="0.45" stopColor="#FF6422" stopOpacity={0.12} />
              <Stop offset="1" stopColor="#FF6422" stopOpacity={0} />
            </RadialGradient>
          </Defs>
          <Circle cx={HALO_SIZE / 2} cy={HALO_SIZE / 2} r={HALO_SIZE / 2} fill="url(#curHalo)" />
        </Svg>
        <TouchableOpacity activeOpacity={0.85} onPress={onPress} style={styles.currentNode} accessibilityLabel={state}>
          <GradientFill from="#FF7A3D" to="#FF6422" />
          <Play color={COLORS.white} size={28} fill={COLORS.white} />
        </TouchableOpacity>
        <View style={styles.currentBadge} />
      </View>
    );
  }
  const look = {
    completed: { bg: '#059669', icon: COLORS.white },
    upcoming: { bg: '#F3EFE6', icon: '#9C9488' },
    subLocked: { bg: '#FFF7F2', icon: '#FF6422' },
  }[state];
  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      style={[styles.node, { backgroundColor: look.bg }]}
      accessibilityLabel={state}
    >
      {state === 'completed' ? (
        <Check color={look.icon} size={22} strokeWidth={3} />
      ) : state === 'subLocked' ? (
        <Lock color={look.icon} size={20} />
      ) : (
        <Lock color={look.icon} size={20} />
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  rowReverse: { flexDirection: 'row-reverse' },
  alignEnd: { alignItems: 'flex-end' },
  screen: {
    flex: 1,
    backgroundColor: '#FDFBF7',
    paddingTop: 48,
    paddingHorizontal: 20,
  },
  top: {
    marginHorizontal: -20,
    paddingHorizontal: 20,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F0EBE3',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#F0EBE3',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#1A1D26',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  headerText: { flex: 1 },
  title: {
    color: '#1A1D26',
    fontFamily: FONT_FAMILY.bold,
    fontSize: 18,
    lineHeight: 28,
  },
  subRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  subDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#059669' },
  sub: {
    color: '#716B62',
    fontFamily: FONT_FAMILY.regular,
    fontSize: 11,
  },
  chips: { flexDirection: 'row', gap: 6 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    borderWidth: 1,
  },
  chipStreak: { backgroundColor: '#FFF4EE', borderColor: '#FAD8C7' },
  chipXp: { backgroundColor: '#F0FDF4', borderColor: '#DCFCE7' },
  chipText: { fontFamily: FONT_FAMILY.bold, fontSize: 11 },
  chipStreakText: { color: '#FF6422' },
  chipXpText: { color: '#059669' },
  progressTrack: {
    flexDirection: 'row',
    height: 6,
    borderRadius: 3,
    backgroundColor: '#EAE5DC',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
    backgroundColor: '#FF6422',
  },
  levelBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 14,
    padding: 14,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#F0EBE3',
    backgroundColor: '#FFFFFF',
    shadowColor: '#1A1D26',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  levelIconBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#FF6422',
    alignItems: 'center',
    justifyContent: 'center',
  },
  levelBannerText: { flex: 1 },
  levelChipRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  levelChip: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, backgroundColor: '#ECFDF5' },
  levelChipText: { color: '#059669', fontFamily: FONT_FAMILY.bold, fontSize: 10 },
  levelKicker: { color: '#716B62', fontFamily: FONT_FAMILY.regular, fontSize: 11 },
  levelTitle: { color: '#1A1D26', fontFamily: FONT_FAMILY.bold, fontSize: 14 },
  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginHorizontal: -20,
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 26,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F0EBE3',
  },
  bottomText: { flex: 1 },
  bottomDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#FF6422' },
  bottomTitle: { flexShrink: 1, color: '#1A1D26', fontFamily: FONT_FAMILY.bold, fontSize: 13 },
  bottomSub: { color: '#716B62', fontFamily: FONT_FAMILY.regular, fontSize: 11, marginTop: 3 },
  startBtn: {
    height: 50,
    paddingHorizontal: 22,
    borderRadius: 18,
    overflow: 'hidden',
    backgroundColor: '#FF6422',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#FF6422',
    shadowOpacity: 0.28,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  startBtnInner: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  startBtnText: { color: '#FFFFFF', fontFamily: FONT_FAMILY.bold, fontSize: 14 },
  scrollContent: {
    paddingBottom: 60,
    paddingTop: 24,
  },
  pathArea: {
    width: '100%',
    position: 'relative',
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
  segment: { position: 'absolute', left: 0 },
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
    borderWidth: 4,
    borderColor: COLORS.white,
    elevation: 2,
    shadowColor: COLORS.black,
    shadowOpacity: 0.08,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
  },
  currentWrap: {
    width: NODE_SIZE + 16,
    height: NODE_SIZE + 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  currentHalo: {
    position: 'absolute',
    left: (NODE_SIZE + 16 - HALO_SIZE) / 2,
    top: (NODE_SIZE + 16 - HALO_SIZE) / 2,
  },
  currentNode: {
    width: NODE_SIZE + 16,
    height: NODE_SIZE + 16,
    borderRadius: (NODE_SIZE + 16) / 2,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 5,
    borderColor: COLORS.white,
    backgroundColor: COLORS.primary,
    elevation: 8,
    shadowColor: COLORS.primary,
    shadowOpacity: 0.4,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
  },
  currentBadge: {
    position: 'absolute',
    top: 2,
    right: 2,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: COLORS.primary,
    borderWidth: 3,
    borderColor: COLORS.white,
  },
  label: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
    maxWidth: 220,
    backgroundColor: '#FFFFFF',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#F0EBE3',
    shadowColor: '#1A1D26',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  labelCurrent: {
    borderColor: '#FF6422',
    borderWidth: 1.5,
    backgroundColor: '#FFF7F2',
    paddingVertical: 7,
  },
  labelDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#FF6422' },
  labelTitle: {
    flexShrink: 1,
    color: '#1A1D26',
    fontFamily: FONT_FAMILY.bold,
    fontSize: 12,
  },
  labelSession: { color: '#716B62', fontFamily: FONT_FAMILY.regular, fontSize: 10 },
  learningChip: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 999, backgroundColor: '#FDEBE4' },
  learningChipText: { color: '#FF6422', fontFamily: FONT_FAMILY.semiBold, fontSize: 10 },
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
  subLockedChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#FFF7F2',
    borderWidth: 1,
    borderColor: '#FAD8C7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  subLockedChipText: {
    fontFamily: FONT_FAMILY.bold,
    fontSize: 10,
    color: '#FF6422',
  },
  levelTabsRow: {
    flexDirection: 'row',
    padding: 4,
    gap: 4,
    marginVertical: 10,
    backgroundColor: '#F3EFE6',
    borderRadius: 16,
    zIndex: 10,
  },
  levelTabItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 12,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  levelTabItemActive: {
    backgroundColor: '#FFFFFF',
    borderColor: '#F0EBE3',
    shadowColor: '#1A1D26',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  levelTabText: {
    fontFamily: FONT_FAMILY.medium,
    fontSize: 12,
    color: '#716B62',
  },
  levelTabTextActive: {
    fontFamily: FONT_FAMILY.bold,
    color: '#FF6422',
  },
  myLevelDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#16a34a',
  },
});
