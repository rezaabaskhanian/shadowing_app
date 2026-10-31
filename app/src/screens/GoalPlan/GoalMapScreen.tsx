import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  LayoutChangeEvent,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  cancelAnimation,
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { ArrowLeft, Check, ChevronLeft, Hand, Lock, MapPin, Maximize2, Minimize2, Pause, Volume2, X } from 'lucide-react-native';

import { SPACING } from '../../theme/colors';
import { FONT_FAMILY } from '../../theme/typography';
import { useLanguage } from '../../data/i18n';
import { track } from '../../services/analytics';
import { absUrl } from '../../api/config';
import {
  exploreGoalMap,
  getGoalMap,
  getGoalMaps,
  getGoalPlan,
  type GoalId,
  type GoalMap,
  type GoalMapSummary,
  type GoalPlanView,
  type GoalSituation,
} from '../../api/goalPlan';
import { getMyLevel } from '../../api/assessment';
import { useScenes } from '../../data/ScenesContext';
import {
  expandScenarioToDialogueItems,
  type DialogueItem,
} from '../../data/scenarios';
import { AudioPlayer } from '../../components/AudioPlayer';
import { GradientFill } from '../../components/GradientFill';

// همان پالت «سینما»ی برنامه‌ی من.
const CINE = {
  bg: '#FFFFFF',
  surface: '#F7F5F1',
  border: '#E7E2D9',
  text: '#1A1D26',
  muted: '#5F6573',
  accent: '#FF7A59',
  accentText: '#C2412D',
  success: '#2E9E6B',
  locked: '#9AA0AC',
};

const MIN_SCALE = 1;
// بدون کاشی فقط نمای کلی هست و بیشتر از این زوم تار می‌شود؛ با کاشی‌های پرجزئیات تا ۴ برابر.
const MAX_SCALE_PLAIN = 2.5;
const MAX_SCALE_TILED = 4;
// از این زوم به بالا کاشی‌های پرجزئیات روی نمای کلی بار می‌شوند.
const TILE_FROM_SCALE = 1.3;
const OPEN_SCALE = 1.6; // زوم اولیه روی «جای امروز»
const MARKER = 34;
const HIT_RADIUS = 30; // شعاع لمس هر نقطه روی صفحه (پیکسل)
// نشانه مثل پین روی زمین می‌نشیند: سایه‌ی بیضی دقیقاً روی نقطه و دایره کمی بالاتر،
// تا تخت و چسبیده روی عکس به نظر نرسد. LIFT فاصله‌ی مرکز دایره تا نقطه روی صفحه است.
const PIN_SHADOW = 8;
const LIFT = MARKER / 2 + PIN_SHADOW / 2;
const PREVIEW_LINES = 2;
// نقشه در حالت عادی کارتی است که ۸۰٪ ارتفاع صفحه را از پایین می‌گیرد، با ۱۰ پیکسل فاصله.
const CARD_HEIGHT = 0.8;
const CARD_GAP = 10;
// گشت آرام بین نقطه‌ها بعد از باز شدن، تا اولین لمس کاربر.
const TOUR_STOPS = 4;
const TOUR_EVERY_MS = 3200;
const TOUR_MOVE_MS = 2200;
const LABEL_W = 170;

const GOAL_LABEL_KEY: Record<string, string> = {
  migration: 'goalMigration',
  travel: 'goalTravel',
  work: 'goalWork',
  study: 'goalStudy',
};

const LEVEL_KEY: Record<string, string> = {
  starter: 'levelStarter',
  beginner: 'levelBeginner',
  intermediate: 'levelIntermediate',
  advanced: 'levelAdvanced',
  proficient: 'levelProficient',
};

interface MapPoint {
  position: number;
  x: number; // درصد
  y: number; // درصد
  situation: GoalSituation;
}

type PointState = 'today' | 'done' | 'open' | 'empty';

const pointState = (p: MapPoint, todayId?: string): PointState => {
  if (!p.situation.scene_id) return 'empty';
  if (p.situation.ready) return 'done';
  if (p.situation.id === todayId) return 'today';
  return 'open';
};

/**
 * نقشه‌ی شهرِ هدف: یک عکس بزرگ که با دو انگشت زوم و با یک انگشت جابه‌جا می‌شود.
 * هر نقطه یک موقعیت از بسته‌ی هدف است؛ لمسش کارتی با دو جمله‌ی اول دیالوگ (با صدا)
 * باز می‌کند و دکمه‌ی ورود، همان صحنه‌ی هم‌سطحی را باز می‌کند که «برنامه‌ی من» انتخاب کرده.
 */
export const GoalMapScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const insets = useSafeAreaInsets();
  const { height: winH } = useWindowDimensions();
  const { t } = useLanguage();
  const { getScene } = useScenes();

  // هدفی که کاربر از دراور/انتخاب‌گر باز کرده؛ بدون آن، نقشه‌ی برنامه‌اش (یا انتخاب‌گر).
  const routeGoal: GoalId | undefined = route.params?.goal;
  const [pickedGoal, setPickedGoal] = useState<GoalId | null>(routeGoal ?? null);
  // نقشه‌های قابل انتخاب، وقتی کاربر برنامه ندارد و هدفی هم انتخاب نکرده.
  const [pickerMaps, setPickerMaps] = useState<GoalMapSummary[] | null>(null);
  const [fullscreen, setFullscreen] = useState(false);

  const [plan, setPlan] = useState<GoalPlanView | null>(null);
  const [map, setMap] = useState<GoalMap | null | undefined>(undefined); // undefined = در حال بارگیری
  const [error, setError] = useState(false);
  const [box, setBox] = useState<{ w: number; h: number } | null>(null);
  const [selected, setSelected] = useState<MapPoint | null>(null);
  // کاشی‌هایی که الان روی صفحه‌اند (اندیس ردیف‌به‌ردیف)؛ بقیه از حافظه آزاد می‌شوند.
  const [visibleTiles, setVisibleTiles] = useState<number[]>([]);

  const load = useCallback(() => {
    setError(false);
    (async () => {
      const saved = await getGoalPlan();
      if (saved && (!pickedGoal || pickedGoal === saved.plan.goal)) {
        const m = await getGoalMap();
        setPlan(saved);
        setMap(m);
        return;
      }
      if (!pickedGoal) {
        setPickerMaps(await getGoalMaps());
        setPlan(null);
        setMap(null);
        return;
      }
      // بدون برنامه (یا هدفی غیر از هدف برنامه): همان نقشه با سطح کاربر، بدون ساختن برنامه.
      const lvl = await getMyLevel().catch(() => null);
      const r = await exploreGoalMap(pickedGoal, lvl?.scene_level || undefined);
      setPlan(r.plan);
      setMap(r.map);
    })().catch(() => setError(true));
  }, [pickedGoal]);
  useFocusEffect(
    useCallback(() => {
      load();
      // این صفحه یک تب است و با رفتن به صحنه mount می‌ماند؛ پخش‌کننده‌ی صدا سراسری است
      // و کارتِ باز رویداد «تمام شد» صحنه را هم می‌گرفت و جمله‌ی بعدیِ خودش را
      // وسط تمرین پخش می‌کرد. با ترک صفحه کارت (و پخش‌کننده‌اش) بسته می‌شود.
      return () => setSelected(null);
    }, [load]),
  );

  useEffect(() => {
    track('goal_map_open');
  }, []);

  const points = useMemo<MapPoint[]>(() => {
    if (!map || !plan) return [];
    const byPos = new Map(
      plan.situations
        .filter(s => s.position)
        .map(s => [s.position as number, s]),
    );
    return map.spots
      .map(sp => ({ ...sp, situation: byPos.get(sp.position) }))
      .filter((p): p is MapPoint => !!p.situation);
  }, [map, plan]);

  // اندازه‌ی پایه‌ی عکس: ارتفاعِ کادر را پر می‌کند (نقشه افقی است و از عرض بیرون می‌زند).
  const base = useMemo(() => {
    if (!map || !box) return null;
    const aspect = map.width / map.height;
    let h = box.h;
    let w = h * aspect;
    if (w < box.w) {
      w = box.w;
      h = w / aspect;
    }
    return { w, h };
  }, [map, box]);

  // ---------- زوم و جابه‌جایی ----------
  const scale = useSharedValue(1);
  const tx = useSharedValue(0);
  const ty = useSharedValue(0);
  const startScale = useSharedValue(1);
  const startTx = useSharedValue(0);
  const startTy = useSharedValue(0);
  const maxScale = useSharedValue(MAX_SCALE_PLAIN);
  const bw = useSharedValue(0);
  const bh = useSharedValue(0);
  const cw = useSharedValue(0);
  const ch = useSharedValue(0);

  // جابه‌جایی را طوری محدود می‌کند که لبه‌ی نقشه هیچ‌وقت از لبه‌ی کادر جدا نشود.
  const clampT = (v: number, s: number, baseLen: number, boxLen: number) => {
    'worklet';
    const half = (baseLen * s) / 2;
    const center = baseLen / 2;
    const max = half - center;
    const min = boxLen - center - half;
    if (min > max) return (min + max) / 2;
    return Math.min(max, Math.max(min, v));
  };

  // بعد از هر زوم/جابه‌جایی: کدام کاشی‌ها در کادر دیده می‌شوند (با کمی حاشیه).
  const updateTiles = useCallback(
    (s: number, ttx: number, tty: number) => {
      const tl = map?.tiles;
      if (!tl || !base || !box || s < TILE_FROM_SCALE) {
        setVisibleTiles(v => (v.length ? [] : v));
        return;
      }
      const toLocal = (p: number, t0: number, baseLen: number) =>
        baseLen / 2 + (p - baseLen / 2 - t0) / s;
      const margin = 48 / s;
      const fx0 = ((toLocal(0, ttx, base.w) - margin) / base.w) * tl.full_width;
      const fx1 =
        ((toLocal(box.w, ttx, base.w) + margin) / base.w) * tl.full_width;
      const fy0 =
        ((toLocal(0, tty, base.h) - margin) / base.h) * tl.full_height;
      const fy1 =
        ((toLocal(box.h, tty, base.h) + margin) / base.h) * tl.full_height;
      const c0 = Math.max(0, Math.floor(fx0 / tl.tile_size));
      const c1 = Math.min(tl.cols - 1, Math.floor(fx1 / tl.tile_size));
      const r0 = Math.max(0, Math.floor(fy0 / tl.tile_size));
      const r1 = Math.min(tl.rows - 1, Math.floor(fy1 / tl.tile_size));
      const next: number[] = [];
      for (let r = r0; r <= r1; r++)
        for (let c = c0; c <= c1; c++) next.push(r * tl.cols + c);
      setVisibleTiles(v =>
        v.length === next.length && v.every((x, i) => x === next[i]) ? v : next,
      );
    },
    [map, base, box],
  );

  // نقطه‌ی (درصدی) نقشه را وسط کادر می‌آورد.
  const focusOn = useCallback(
    (xPct: number, yPct: number, s: number, animate: boolean, duration = 450) => {
      if (!base || !box) return;
      const lx = (xPct / 100) * base.w;
      const ly = (yPct / 100) * base.h;
      const nx = clampT(
        box.w / 2 - base.w / 2 - s * (lx - base.w / 2),
        s,
        base.w,
        box.w,
      );
      const ny = clampT(
        box.h / 2 - base.h / 2 - s * (ly - base.h / 2),
        s,
        base.h,
        box.h,
      );
      const cfg = { duration, easing: duration > 450 ? Easing.inOut(Easing.quad) : Easing.out(Easing.cubic) };
      scale.value = animate ? withTiming(s, cfg) : s;
      tx.value = animate ? withTiming(nx, cfg) : nx;
      ty.value = animate ? withTiming(ny, cfg) : ny;
      updateTiles(s, nx, ny);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [base, box, updateTiles],
  );

  // با باز شدن صفحه، دوربین روی «جای امروز» زوم می‌کند (کاربر باید بداند از کجا شروع کند).
  useEffect(() => {
    if (!base || !box) return;
    bw.value = base.w;
    bh.value = base.h;
    cw.value = box.w;
    ch.value = box.h;
    maxScale.value = map?.tiles ? MAX_SCALE_TILED : MAX_SCALE_PLAIN;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [base, box, map]);

  const [focused, setFocused] = useState(false);
  const todayPoint = useMemo(
    () => points.find(p => p.situation.id === plan?.today_id) ?? points[0],
    [points, plan?.today_id],
  );
  // اولین لمس کاربر گشت خودکار را برای همیشه (در این باز شدن) متوقف می‌کند.
  const touchedRef = useRef(false);
  useEffect(() => {
    if (!base || !box || !todayPoint) return;
    if (!focused) {
      focusOn(todayPoint.x, todayPoint.y, OPEN_SCALE, false);
      // بدون گشت (یک نقطه) کارت جای امروز مثل قبل باز می‌شود.
      if (points.length < 2) setSelected(todayPoint);
      setFocused(true);
      return;
    }
    // تغییر اندازه‌ی کادر (تمام‌صفحه/کارت): همان نقطه وسط بماند.
    const p = selected ?? todayPoint;
    focusOn(p.x, p.y, scale.value, false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [base, box, todayPoint]);

  // گشت آرام: دوربین بین «جای امروز» و چند جای نزدیکش جابه‌جا می‌شود تا کاربر بفهمد
  // نقشه زنده است و جاهای دیگری هم هست؛ با اولین لمس می‌ایستد.
  useEffect(() => {
    if (!focused || touchedRef.current || !todayPoint || points.length < 2) return;
    const near = points
      .filter(p => p.position !== todayPoint.position)
      .sort(
        (a, b) =>
          Math.hypot(a.x - todayPoint.x, a.y - todayPoint.y) -
          Math.hypot(b.x - todayPoint.x, b.y - todayPoint.y),
      )
      .slice(0, TOUR_STOPS - 1);
    const stops = [todayPoint, ...near];
    let i = 0;
    const id = setInterval(() => {
      if (touchedRef.current) {
        clearInterval(id);
        return;
      }
      i = (i + 1) % stops.length;
      focusOn(stops[i].x, stops[i].y, OPEN_SCALE, true, TOUR_MOVE_MS);
    }, TOUR_EVERY_MS);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focused, todayPoint, points]);

  // هر بار باز شدن از دراور (openedAt تازه): از نو، با هدف همان مسیر یا انتخاب‌گر.
  const openedAt = route.params?.openedAt;
  const firstOpen = useRef(true);
  useEffect(() => {
    if (firstOpen.current) {
      firstOpen.current = false;
      return;
    }
    setSelected(null);
    setFocused(false);
    setFullscreen(false);
    touchedRef.current = false;
    setMap(undefined);
    setPickedGoal(route.params?.goal ?? null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openedAt]);

  const stopTour = useCallback(() => {
    if (touchedRef.current) return;
    touchedRef.current = true;
    updateTiles(scale.value, tx.value, ty.value);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [updateTiles]);

  const openPoint = useCallback((p: MapPoint) => {
    setSelected(p);
    track('goal_map_spot', String(p.position));
  }, []);

  // لمس روی نقشه: نزدیک‌ترین نقطه در شعاع لمس پیدا می‌شود (روی خود نشانه‌ها دکمه نمی‌گذاریم
  // تا با جابه‌جا کردن نقشه تداخل نکند).
  const onTapAt = useCallback(
    (sx: number, sy: number, s: number, ttx: number, tty: number) => {
      if (!base) return;
      let best: MapPoint | null = null;
      let bestD = HIT_RADIUS;
      for (const p of points) {
        const lx = (p.x / 100) * base.w;
        const ly = (p.y / 100) * base.h;
        const px = base.w / 2 + ttx + s * (lx - base.w / 2);
        const py = base.h / 2 + tty + s * (ly - base.h / 2) - LIFT;
        const d = Math.hypot(px - sx, py - sy);
        if (d < bestD) {
          bestD = d;
          best = p;
        }
      }
      setHintGone(true);
      if (best) openPoint(best);
      else setSelected(null);
    },
    [base, points, openPoint],
  );

  // تپش «جای امروز» هر فریم اجرا می‌شود؛ وسط زوم/جابه‌جایی متوقفش می‌کنیم تا
  // گوشی فقط یک کار داشته باشد، و بعد از رها کردن دوباره شروع می‌شود.
  const pulse = useSharedValue(0);
  // راهنمای «زوم کن · روی یه جا بزن» فقط تا اولین لمس/زوم دیده می‌شود.
  const [hintGone, setHintGone] = useState(false);
  const hideHint = useCallback(() => setHintGone(true), []);

  const startPulse = () => {
    'worklet';
    pulse.value = 0;
    pulse.value = withRepeat(
      withTiming(1, { duration: 1100, easing: Easing.out(Easing.quad) }),
      -1,
      false,
    );
  };
  const stopPulse = () => {
    'worklet';
    cancelAnimation(pulse);
    pulse.value = 1; // هاله پنهان
  };
  useEffect(() => {
    startPulse();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const haltCamera = () => {
    'worklet';
    cancelAnimation(scale);
    cancelAnimation(tx);
    cancelAnimation(ty);
    runOnJS(stopTour)();
  };

  const pinch = Gesture.Pinch()
    .onBegin(() => {
      haltCamera();
      stopPulse();
      runOnJS(hideHint)();
    })
    .onFinalize(startPulse)
    .onStart(() => {
      startScale.value = scale.value;
      startTx.value = tx.value;
      startTy.value = ty.value;
    })
    .onUpdate(e => {
      const s = Math.min(
        maxScale.value,
        Math.max(MIN_SCALE, startScale.value * e.scale),
      );
      const k = s / startScale.value;
      const fx = e.focalX - bw.value / 2;
      const fy = e.focalY - bh.value / 2;
      scale.value = s;
      tx.value = clampT(fx - (fx - startTx.value) * k, s, bw.value, cw.value);
      ty.value = clampT(fy - (fy - startTy.value) * k, s, bh.value, ch.value);
    })
    .onEnd(() => {
      runOnJS(updateTiles)(scale.value, tx.value, ty.value);
    });

  const pan = Gesture.Pan()
    .minDistance(6)
    .onBegin(() => {
      haltCamera();
      stopPulse();
      runOnJS(hideHint)();
    })
    .onFinalize(startPulse)
    .onStart(() => {
      startTx.value = tx.value;
      startTy.value = ty.value;
    })
    .onUpdate(e => {
      tx.value = clampT(
        startTx.value + e.translationX,
        scale.value,
        bw.value,
        cw.value,
      );
      ty.value = clampT(
        startTy.value + e.translationY,
        scale.value,
        bh.value,
        ch.value,
      );
    })
    .onEnd(() => {
      runOnJS(updateTiles)(scale.value, tx.value, ty.value);
    });

  const doubleTap = Gesture.Tap()
    .numberOfTaps(2)
    .onBegin(haltCamera)
    .onEnd(e => {
      const s = scale.value > 1.3 ? 1 : 2;
      const k = s / scale.value;
      const fx = e.x - bw.value / 2;
      const fy = e.y - bh.value / 2;
      const nx = clampT(fx - (fx - tx.value) * k, s, bw.value, cw.value);
      const ny = clampT(fy - (fy - ty.value) * k, s, bh.value, ch.value);
      scale.value = withTiming(s, { duration: 250 });
      tx.value = withTiming(nx, { duration: 250 });
      ty.value = withTiming(ny, { duration: 250 });
      runOnJS(updateTiles)(s, nx, ny);
    });

  const singleTap = Gesture.Tap()
    .maxDistance(10)
    .onBegin(haltCamera)
    .onEnd(e => {
      runOnJS(onTapAt)(e.x, e.y, scale.value, tx.value, ty.value);
    });

  const gesture = Gesture.Simultaneous(
    pinch,
    pan,
    Gesture.Exclusive(doubleTap, singleTap),
  );

  const mapStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: tx.value },
      { translateY: ty.value },
      { scale: scale.value },
    ],
  }));
  // نشانه‌ها با زوم بزرگ نمی‌شوند: مقیاس معکوس.
  const markerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 1 / scale.value }],
  }));

  const haloStyle = useAnimatedStyle(() => ({
    opacity: 0.55 * (1 - pulse.value),
    transform: [{ scale: 1 + pulse.value * 1.2 }],
  }));

  const onLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    if (!box || box.w !== width || box.h !== height)
      setBox({ w: width, h: height });
  };

  // بستن: اگر از انتخاب‌گر وارد نقشه شده، برمی‌گردد به انتخاب‌گر.
  const close = () => {
    if (pickedGoal && !routeGoal && pickerMaps) {
      setSelected(null);
      setFocused(false);
      setFullscreen(false);
      touchedRef.current = false;
      setMap(undefined);
      setPickedGoal(null);
      return;
    }
    if (navigation.canGoBack()) navigation.goBack();
    else navigation.navigate('GoalPlan');
  };

  const pickGoal = (goal: GoalId) => {
    setSelected(null);
    setFocused(false);
    touchedRef.current = false;
    setHintGone(false);
    setMap(undefined);
    setPickedGoal(goal);
    track('goal_map_open', goal);
  };

  // ---------- حالت‌های بارگیری ----------
  if (error) {
    return (
      <View style={[styles.center, { paddingTop: insets.top }]}>
        <Text style={styles.msg}>{t('networkError')}</Text>
        <TouchableOpacity style={styles.retry} onPress={load}>
          <Text style={styles.retryText}>{t('sceneAudioRetry')}</Text>
        </TouchableOpacity>
      </View>
    );
  }
  if (map === undefined) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={CINE.accent} />
      </View>
    );
  }
  if (!map && !plan && !pickedGoal && pickerMaps) {
    return (
      <View style={[styles.pickerScreen, { paddingTop: insets.top + SPACING.s }]}>
        <View style={styles.pickerTop}>
          <TouchableOpacity style={styles.pickerClose} onPress={close} accessibilityLabel={t('close')}>
            <X size={20} color={CINE.text} />
          </TouchableOpacity>
        </View>
        <Text style={styles.pickerTitle}>{t('goalMapPickTitle')}</Text>
        <Text style={styles.pickerSub}>{t('goalMapPickSub')}</Text>
        <ScrollView
          contentContainerStyle={[styles.pickerList, { paddingBottom: insets.bottom + SPACING.l }]}
          showsVerticalScrollIndicator={false}
        >
          {pickerMaps.map(m => (
            <TouchableOpacity
              key={m.goal}
              style={styles.pickerCard}
              onPress={() => pickGoal(m.goal)}
              activeOpacity={0.9}
            >
              <Image source={{ uri: absUrl(m.image_url) }} style={styles.pickerImg} resizeMode="cover" />
              <View style={styles.pickerRow}>
                <MapPin size={16} color={CINE.accent} />
                <Text style={styles.pickerLabel}>
                  {t('goalMapPickCity').replace('{goal}', t(GOAL_LABEL_KEY[m.goal] || 'goalTravel'))}
                </Text>
                <ChevronLeft size={18} color={CINE.muted} />
              </View>
            </TouchableOpacity>
          ))}
          <TouchableOpacity onPress={() => navigation.navigate('GoalPlan')} activeOpacity={0.8}>
            <Text style={styles.pickerLink}>{t('goalMapPickPlan')}</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    );
  }
  if (!map || !plan) {
    return (
      <View style={[styles.center, { paddingTop: insets.top }]}>
        <Text style={styles.msg}>{t('goalMapNone')}</Text>
        <TouchableOpacity
          style={styles.retry}
          onPress={() => navigation.navigate('GoalPlan')}
        >
          <Text style={styles.retryText}>{t('goalPlanTitle')}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const headerPill = (
    <View style={[styles.headerPill, !fullscreen && styles.headerPillLight]}>
      {!!plan.plan.start_level && (
        <View style={styles.headerLevel}>
          <Text style={styles.headerLevelText}>
            {t(LEVEL_KEY[plan.plan.start_level] || 'levelBeginner')}
          </Text>
        </View>
      )}
      <Text style={[styles.headerText, !fullscreen && styles.headerTextDark]} numberOfLines={1}>
        {t('goalMapHeader').replace('{goal}', t(GOAL_LABEL_KEY[plan.plan.goal] || 'goalMigration'))}
      </Text>
      <View style={styles.headerDot} />
    </View>
  );
  // کارت نقشه: ۸۰٪ ارتفاع از پایین، ولی اگر صفحه کوتاه بود جای سرتیتر می‌ماند.
  const cardH = Math.min(
    Math.round(winH * CARD_HEIGHT),
    winH - insets.top - insets.bottom - 56 - CARD_GAP * 3,
  );

  return (
    <View style={[styles.container, !fullscreen && styles.containerFramed]}>
      {!fullscreen && (
        <View style={[styles.frameHeader, { paddingTop: insets.top + SPACING.s }]}>
          {headerPill}
          <TouchableOpacity style={styles.frameClose} onPress={close} accessibilityLabel={t('close')}>
            <X size={20} color={CINE.text} />
          </TouchableOpacity>
        </View>
      )}
      <View
        style={
          fullscreen
            ? styles.mapFull
            : [styles.mapCard, { height: cardH, marginBottom: insets.bottom + CARD_GAP }]
        }
      >
      <View style={styles.mapBox} onLayout={onLayout}>
        {base && (
          <GestureDetector gesture={gesture}>
            <View style={StyleSheet.absoluteFill}>
              <Animated.View
                style={[{ width: base.w, height: base.h }, mapStyle]}
              >
                <Image
                  source={{ uri: absUrl(map.image_url) }}
                  style={{ width: base.w, height: base.h }}
                  resizeMode="cover"
                />
                {map.tiles &&
                  visibleTiles.map(i => {
                    const tl = map.tiles!;
                    const r = Math.floor(i / tl.cols);
                    const c = i % tl.cols;
                    const k = base.w / tl.full_width;
                    const tw = Math.min(
                      tl.tile_size,
                      tl.full_width - c * tl.tile_size,
                    );
                    const th = Math.min(
                      tl.tile_size,
                      tl.full_height - r * tl.tile_size,
                    );
                    return (
                      <Image
                        key={i}
                        source={{ uri: absUrl(tl.urls[i]) }}
                        fadeDuration={0}
                        style={[
                          styles.tile,
                          {
                            left: c * tl.tile_size * k,
                            top: r * tl.tile_size * (base.h / tl.full_height),
                            width: tw * k,
                            height: th * (base.h / tl.full_height),
                          },
                        ]}
                      />
                    );
                  })}
                {points.map(p => {
                  const st = pointState(p, plan.today_id);
                  return (
                    <Animated.View
                      key={p.position}
                      pointerEvents="none"
                      style={[
                        styles.markerWrap,
                        {
                          left: (p.x / 100) * base.w - MARKER / 2,
                          top: (p.y / 100) * base.h - MARKER - PIN_SHADOW / 2,
                        },
                        markerStyle,
                      ]}
                    >
                      <View style={styles.pinShadow} />
                      {st === 'today' && (
                        <Animated.View style={[styles.halo, haloStyle]} />
                      )}
                      <View
                        style={[
                          styles.marker,
                          st === 'today' && styles.markerToday,
                          st === 'done' && styles.markerDone,
                          st === 'empty' && styles.markerEmpty,
                          st !== 'today' &&
                            selected?.position === p.position &&
                            styles.markerSelected,
                        ]}
                      >
                        {st === 'done' ? (
                          <Check size={16} color="#FFFFFF" strokeWidth={3} />
                        ) : st === 'empty' ? (
                          <Lock size={14} color="#FFFFFF" />
                        ) : (
                          // شماره‌ی داخلی موقعیت معنایی برای کاربر نداشت؛ اسمش با لمس دیده می‌شود.
                          <View
                            style={[
                              styles.markerDot,
                              st === 'today' && styles.markerDotToday,
                            ]}
                          />
                        )}
                      </View>
                      {st === 'today' && (
                        <View style={styles.calloutWrap}>
                          <View style={styles.callout}>
                            <View style={styles.calloutDot} />
                            <Text style={styles.calloutText} numberOfLines={1}>
                              {p.situation.title_fa} · {t('goalMapReady')}
                            </Text>
                          </View>
                        </View>
                      )}
                      {st !== 'today' && (
                        <View style={styles.labelWrap}>
                          <View
                            style={[
                              styles.label,
                              selected?.position === p.position && styles.labelSelected,
                            ]}
                          >
                            <Text style={styles.labelText} numberOfLines={1}>
                              {p.situation.title_fa}
                            </Text>
                          </View>
                        </View>
                      )}
                    </Animated.View>
                  );
                })}
              </Animated.View>
            </View>
          </GestureDetector>
        )}
      </View>

      {/* نوار بالا روی نقشه: تمام‌صفحه = سرتیتر + بستن + کوچک کردن؛ کارت = فقط دکمه‌ی تمام‌صفحه. */}
      <View
        style={[styles.topBar, { paddingTop: fullscreen ? insets.top + SPACING.s : SPACING.s }]}
        pointerEvents="box-none"
      >
        {fullscreen ? headerPill : <View style={styles.flex1} />}
        <TouchableOpacity
          style={styles.iconBtn}
          onPress={() => setFullscreen(f => !f)}
          accessibilityLabel={t(fullscreen ? 'goalMapExitFullscreen' : 'goalMapFullscreen')}
        >
          {fullscreen ? <Minimize2 size={18} color="#FFFFFF" /> : <Maximize2 size={18} color="#FFFFFF" />}
        </TouchableOpacity>
        {fullscreen && (
          <TouchableOpacity style={styles.iconBtn} onPress={close} accessibilityLabel={t('close')}>
            <X size={20} color="#FFFFFF" />
          </TouchableOpacity>
        )}
      </View>

      <View
        style={[styles.bottomStack, { paddingBottom: fullscreen ? insets.bottom + SPACING.m : SPACING.m }]}
        pointerEvents="box-none"
      >
      {!hintGone && (
        <View style={styles.hint} pointerEvents="none">
          <Text style={styles.hintText}>{t('goalMapHint2')}</Text>
          <Hand size={14} color="#FFB08F" />
        </View>
      )}

      {selected && (
        <SpotCard
          key={selected.position}
          point={selected}
          todayId={plan.today_id}
          getScene={getScene}
          onClose={() => setSelected(null)}
          onEnter={sceneId => {
            setSelected(null);
            navigation.navigate('Shadowing', {
              scenarioId: sceneId,
              returnTo: 'GoalMap',
            });
          }}
          t={t}
        />
      )}
      </View>
      </View>
    </View>
  );
};

/** کارت پایین صفحه برای نقطه‌ی انتخاب‌شده: عکس، عنوان، دو جمله‌ی اول با صدا و دکمه‌ی ورود. */
const SpotCard = ({
  point,
  todayId,
  getScene,
  onClose,
  onEnter,
  t,
}: {
  point: MapPoint;
  todayId?: string;
  getScene: (id: string) => Promise<any>;
  onClose: () => void;
  onEnter: (sceneId: string) => void;
  t: (k: string) => string;
}) => {
  const s = point.situation;
  const st = pointState(point, todayId);
  const [lines, setLines] = useState<DialogueItem[] | null>(null);
  const [playIdx, setPlayIdx] = useState<number | null>(null);
  const [nonce, setNonce] = useState(0);

  useEffect(() => {
    let alive = true;
    if (!s.scene_id) return;
    getScene(s.scene_id)
      .then((sc: any) => {
        if (alive && sc)
          setLines(expandScenarioToDialogueItems(sc).slice(0, PREVIEW_LINES));
      })
      .catch(() => alive && setLines([]));
    return () => {
      alive = false;
    };
  }, [s.scene_id, getScene]);

  // کارتِ «جای امروز» با باز شدن صفحه خودش باز است؛ برای همین صدا خودکار پخش
  // نمی‌شود و فقط با دکمه‌ی بلندگو دو جمله‌ی اول شنیده می‌شوند.

  const togglePlay = () => {
    if (playIdx !== null) {
      setPlayIdx(null);
      return;
    }
    if (lines?.length) {
      setPlayIdx(0);
      setNonce(n => n + 1);
    }
  };

  const playing = playIdx !== null && lines?.[playIdx];

  return (
    <View style={styles.card}>
      <AudioPlayer
        uri={playing ? lines![playIdx!].audioUrl : null}
        shouldPlay={false}
        actionCommand={playing ? 'play_original' : 'none'}
        actionNonce={nonce}
        onPlaybackStatusUpdate={status => {
          if (status === 'finished') {
            const next = (playIdx ?? 0) + 1;
            if (lines && next < lines.length && lines[next].audioUrl) {
              setPlayIdx(next);
              setNonce(n => n + 1);
            } else {
              setPlayIdx(null);
            }
          } else if (status === 'error' || status === 'no_audio') {
            setPlayIdx(null);
          }
        }}
      />
      <View style={styles.cardHead}>
        <View style={styles.cardIcon}>
          {s.scene_image_url ? (
            <Image source={{ uri: absUrl(s.scene_image_url) }} style={styles.cardImg} />
          ) : (
            <MapPin size={22} color={CINE.accentText} />
          )}
        </View>
        <View style={styles.cardText}>
          <View style={styles.cardTitleRow}>
            <Text style={styles.cardTitle} numberOfLines={2}>
              {s.title_fa}
            </Text>
            {st !== 'empty' && (
              <View style={[styles.statusChip, st === 'done' && styles.statusChipDone]}>
                <Text style={[styles.statusChipText, st === 'done' && styles.statusChipTextDone]}>
                  {st === 'done' ? t('goalMapDone') : t('goalMapActive')}
                </Text>
              </View>
            )}
          </View>
          {!s.scene_id ? (
            <Text style={styles.cardSub}>{t('goalMapSoon')}</Text>
          ) : (
            <Text style={styles.cardSub} numberOfLines={1}>
              {playing ? lines![playIdx!].dialogue : s.scene_level ? t(LEVEL_KEY[s.scene_level] || 'levelBeginner') : ''}
            </Text>
          )}
        </View>
        <TouchableOpacity onPress={onClose} style={styles.cardClose} accessibilityLabel={t('close')}>
          <X size={16} color={CINE.muted} />
        </TouchableOpacity>
      </View>

      {!!s.scene_id && (
        <View style={styles.cardActions}>
          <TouchableOpacity style={styles.enterBtn} onPress={() => onEnter(s.scene_id!)} activeOpacity={0.9}>
            <GradientFill from="#F07A4A" to="#E8572F" horizontal />
            <View style={styles.enterInner}>
              <Text style={styles.enterText}>
                {st === 'done' ? t('goalMapPracticeAgain') : t('goalMapEnter')}
              </Text>
              <ArrowLeft size={18} color="#FFFFFF" />
            </View>
          </TouchableOpacity>
          <TouchableOpacity style={styles.playBtn} onPress={togglePlay} disabled={!lines?.length}>
            {lines === null ? (
              <ActivityIndicator size="small" color={CINE.accent} />
            ) : playIdx !== null ? (
              <Pause size={18} color={CINE.accentText} />
            ) : (
              <Volume2 size={18} color={CINE.accentText} />
            )}
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#E9E4DA' },
  containerFramed: { backgroundColor: '#FAF8F4', justifyContent: 'space-between' },
  frameHeader: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: CARD_GAP,
    paddingBottom: CARD_GAP,
  },
  frameClose: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: CINE.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mapCard: {
    marginHorizontal: CARD_GAP,
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: '#E9E4DA',
  },
  mapFull: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  headerPillLight: { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: CINE.border },
  headerTextDark: { color: CINE.text },
  pickerScreen: { flex: 1, backgroundColor: '#FAF8F4', paddingHorizontal: SPACING.l },
  pickerTop: { flexDirection: 'row', justifyContent: 'flex-start', marginBottom: SPACING.s },
  pickerClose: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: CINE.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pickerTitle: { fontFamily: FONT_FAMILY.bold, fontSize: 22, color: CINE.text, textAlign: 'right' },
  pickerSub: { fontFamily: FONT_FAMILY.regular, fontSize: 13, lineHeight: 21, color: CINE.muted, textAlign: 'right', marginTop: 4 },
  pickerList: { gap: SPACING.m, paddingTop: SPACING.l },
  pickerCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: CINE.border,
    overflow: 'hidden',
  },
  pickerImg: { width: '100%', aspectRatio: 2.4 },
  pickerRow: { flexDirection: 'row-reverse', alignItems: 'center', gap: 8, paddingHorizontal: 14, paddingVertical: 12 },
  pickerLabel: { flex: 1, fontFamily: FONT_FAMILY.bold, fontSize: 15, color: CINE.text, textAlign: 'right' },
  pickerLink: { fontFamily: FONT_FAMILY.bold, fontSize: 13, color: CINE.accentText, textAlign: 'center', paddingVertical: SPACING.s },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: CINE.bg,
    gap: SPACING.m,
    padding: SPACING.l,
  },
  msg: {
    fontFamily: FONT_FAMILY.medium,
    fontSize: 15,
    lineHeight: 24,
    color: CINE.muted,
    textAlign: 'center',
  },
  retry: {
    backgroundColor: CINE.accent,
    borderRadius: 999,
    paddingHorizontal: 22,
    paddingVertical: 10,
  },
  retryText: { fontFamily: FONT_FAMILY.bold, fontSize: 14, color: '#FFFFFF' },
  flex1: { flex: 1 },
  mapBox: { flex: 1, overflow: 'hidden' },
  tile: { position: 'absolute' },

  markerWrap: {
    position: 'absolute',
    width: MARKER,
    height: MARKER + PIN_SHADOW,
    alignItems: 'center',
    justifyContent: 'flex-start',
    // مقیاس معکوس حول نوک پین، تا با زوم روی همان نقطه‌ی عکس بماند.
    transformOrigin: '50% 100%',
  },
  pinShadow: {
    position: 'absolute',
    bottom: 0,
    width: 18,
    height: PIN_SHADOW,
    borderRadius: PIN_SHADOW,
    backgroundColor: 'rgba(0,0,0,0.28)',
  },
  markerDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: CINE.accent },
  markerDotToday: { backgroundColor: CINE.accent },
  halo: {
    position: 'absolute',
    top: 0,
    width: MARKER,
    height: MARKER,
    borderRadius: MARKER / 2,
    backgroundColor: CINE.accent,
  },
  marker: {
    width: MARKER,
    height: MARKER,
    borderRadius: MARKER / 2,
    backgroundColor: '#FFFFFF',
    borderWidth: 3,
    borderColor: CINE.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // جای امروز: حلقه‌ی پهن نارنجی با مرکز سفید، کمی بزرگ‌تر از بقیه.
  markerToday: {
    backgroundColor: '#FFFFFF',
    borderColor: CINE.accent,
    borderWidth: 7,
    transform: [{ scale: 1.35 }],
  },
  // کامل‌شده: توپُر سبز با تیک و کمی بزرگ‌تر؛ باز: توخالی سفید با شماره.
  markerDone: {
    backgroundColor: CINE.success,
    borderColor: '#FFFFFF',
    transform: [{ scale: 1.12 }],
  },
  markerEmpty: { backgroundColor: CINE.locked, borderColor: '#FFFFFF' },
  markerSelected: { borderColor: CINE.text },
  markerNum: {
    fontFamily: FONT_FAMILY.bold,
    fontSize: 13,
    color: CINE.accentText,
  },
  markerNumToday: { color: '#FFFFFF' },
  // برچسب در کادری پهن‌تر از خودِ نشانه وسط‌چین می‌شود؛ قبلاً هم‌عرضِ دایره بود و اسم «م...» بریده می‌شد.
  labelWrap: {
    position: 'absolute',
    top: MARKER + 4,
    left: (MARKER - LABEL_W) / 2,
    width: LABEL_W,
    alignItems: 'center',
  },
  label: {
    backgroundColor: 'rgba(26,29,38,0.78)',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  labelSelected: { backgroundColor: CINE.accent },
  labelText: {
    fontFamily: FONT_FAMILY.semiBold,
    fontSize: 11,
    lineHeight: 17,
    color: '#FFFFFF',
  },
  calloutWrap: {
    position: 'absolute',
    bottom: MARKER + PIN_SHADOW + 10,
    left: (MARKER - 240) / 2,
    width: 240,
    alignItems: 'center',
  },
  callout: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFFFFF',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 5,
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  calloutDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: CINE.accent },
  calloutText: { fontFamily: FONT_FAMILY.bold, fontSize: 11, color: CINE.text },

  topBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 10,
    paddingHorizontal: SPACING.l,
  },
  headerPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 40,
    borderRadius: 20,
    paddingHorizontal: 14,
    backgroundColor: 'rgba(26,29,38,0.62)',
  },
  headerDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: CINE.accent },
  headerText: { flexShrink: 1, fontFamily: FONT_FAMILY.bold, fontSize: 13, color: '#FFFFFF' },
  headerLevel: {
    paddingHorizontal: 7,
    paddingVertical: 1,
    borderRadius: 6,
    backgroundColor: 'rgba(255,122,89,0.25)',
  },
  headerLevelText: { fontFamily: FONT_FAMILY.bold, fontSize: 10, color: '#FFB08F' },
  // دکمه‌ی بستن کم‌رنگ و نیمه‌شفاف، تا تمرکز روی خود نقشه بماند.
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(26,29,38,0.62)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomStack: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: SPACING.m,
    gap: 10,
  },
  hint: {
    alignSelf: 'center',
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(26,29,38,0.78)',
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  hintText: {
    fontFamily: FONT_FAMILY.medium,
    fontSize: 12,
    lineHeight: 18,
    color: '#FFFFFF',
  },

  card: {
    backgroundColor: '#FBF9F6',
    borderRadius: 24,
    padding: SPACING.m,
    gap: SPACING.m,
    elevation: 10,
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
  },
  cardHead: { flexDirection: 'row-reverse', alignItems: 'center', gap: SPACING.m },
  cardIcon: {
    width: 52,
    height: 52,
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: 'rgba(255,122,89,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255,122,89,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardImg: { width: '100%', height: '100%' },
  cardText: { flex: 1, alignItems: 'flex-end' },
  cardTitleRow: { flexDirection: 'row-reverse', alignItems: 'center', gap: 8 },
  cardTitle: {
    flexShrink: 1,
    fontFamily: FONT_FAMILY.bold,
    fontSize: 16,
    lineHeight: 25,
    color: CINE.text,
    textAlign: 'right',
  },
  statusChip: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    backgroundColor: 'rgba(46,158,107,0.12)',
  },
  statusChipDone: { backgroundColor: 'rgba(46,158,107,0.2)' },
  statusChipText: { fontFamily: FONT_FAMILY.bold, fontSize: 10, color: CINE.success },
  statusChipTextDone: { color: CINE.success },
  cardSub: {
    fontFamily: FONT_FAMILY.regular,
    fontSize: 12,
    lineHeight: 19,
    color: CINE.muted,
    textAlign: 'right',
  },
  cardClose: { alignSelf: 'flex-start', padding: 4 },
  cardActions: { flexDirection: 'row', alignItems: 'center', gap: SPACING.s },
  playBtn: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: '#F1EDE6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  enterBtn: {
    flex: 1,
    height: 52,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: CINE.accent,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
    shadowColor: CINE.accent,
    shadowOpacity: 0.35,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
  },
  enterInner: { flexDirection: 'row-reverse', alignItems: 'center', gap: 8 },
  enterText: { fontFamily: FONT_FAMILY.bold, fontSize: 15, color: '#FFFFFF' },
});
