import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  LayoutChangeEvent,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
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
import { Check, ChevronLeft, Lock, Pause, Play, X } from 'lucide-react-native';

import { SPACING } from '../../theme/colors';
import { FONT_FAMILY } from '../../theme/typography';
import { useLanguage } from '../../data/i18n';
import { track } from '../../services/analytics';
import { absUrl } from '../../api/config';
import {
  getGoalMap,
  getGoalPlan,
  type GoalMap,
  type GoalPlanView,
  type GoalSituation,
} from '../../api/goalPlan';
import { useScenes } from '../../data/ScenesContext';
import {
  expandScenarioToDialogueItems,
  type DialogueItem,
} from '../../data/scenarios';
import { AudioPlayer } from '../../components/AudioPlayer';

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
const PREVIEW_LINES = 2;

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
  const insets = useSafeAreaInsets();
  const { t } = useLanguage();
  const { getScene } = useScenes();

  const [plan, setPlan] = useState<GoalPlanView | null>(null);
  const [map, setMap] = useState<GoalMap | null | undefined>(undefined); // undefined = در حال بارگیری
  const [error, setError] = useState(false);
  const [box, setBox] = useState<{ w: number; h: number } | null>(null);
  const [selected, setSelected] = useState<MapPoint | null>(null);
  // کاشی‌هایی که الان روی صفحه‌اند (اندیس ردیف‌به‌ردیف)؛ بقیه از حافظه آزاد می‌شوند.
  const [visibleTiles, setVisibleTiles] = useState<number[]>([]);

  const load = useCallback(() => {
    setError(false);
    Promise.all([getGoalPlan(), getGoalMap()])
      .then(([p, m]) => {
        setPlan(p);
        setMap(m);
      })
      .catch(() => setError(true));
  }, []);
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
    (xPct: number, yPct: number, s: number, animate: boolean) => {
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
      const cfg = { duration: 450, easing: Easing.out(Easing.cubic) };
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
  useEffect(() => {
    if (!base || !box || focused || !points.length) return;
    const today =
      points.find(p => p.situation.id === plan?.today_id) ?? points[0];
    focusOn(today.x, today.y, OPEN_SCALE, false);
    setFocused(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [base, box, points]);

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
        const py = base.h / 2 + tty + s * (ly - base.h / 2);
        const d = Math.hypot(px - sx, py - sy);
        if (d < bestD) {
          bestD = d;
          best = p;
        }
      }
      if (best) openPoint(best);
      else setSelected(null);
    },
    [base, points, openPoint],
  );

  // تپش «جای امروز» هر فریم اجرا می‌شود؛ وسط زوم/جابه‌جایی متوقفش می‌کنیم تا
  // گوشی فقط یک کار داشته باشد، و بعد از رها کردن دوباره شروع می‌شود.
  const pulse = useSharedValue(0);
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

  const pinch = Gesture.Pinch()
    .onBegin(stopPulse)
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
    .onBegin(stopPulse)
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

  return (
    <View style={styles.container}>
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
                          top: (p.y / 100) * base.h - MARKER / 2,
                        },
                        markerStyle,
                      ]}
                    >
                      {st === 'today' && (
                        <Animated.View style={[styles.halo, haloStyle]} />
                      )}
                      <View
                        style={[
                          styles.marker,
                          st === 'today' && styles.markerToday,
                          st === 'done' && styles.markerDone,
                          st === 'empty' && styles.markerEmpty,
                          selected?.position === p.position &&
                            styles.markerSelected,
                        ]}
                      >
                        {st === 'done' ? (
                          <Check size={16} color="#FFFFFF" strokeWidth={3} />
                        ) : st === 'empty' ? (
                          <Lock size={14} color="#FFFFFF" />
                        ) : (
                          <Text
                            style={[
                              styles.markerNum,
                              st === 'today' && styles.markerNumToday,
                            ]}
                          >
                            {p.position}
                          </Text>
                        )}
                      </View>
                      {(st === 'today' ||
                        selected?.position === p.position) && (
                        <View style={styles.label}>
                          <Text style={styles.labelText} numberOfLines={1}>
                            {p.situation.title_fa}
                          </Text>
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

      {/* نوار بالا روی نقشه */}
      <View
        style={[styles.topBar, { paddingTop: insets.top + SPACING.s }]}
        pointerEvents="box-none"
      >
        <TouchableOpacity
          style={styles.iconBtn}
          onPress={() =>
            navigation.canGoBack()
              ? navigation.goBack()
              : navigation.navigate('GoalPlan')
          }
          accessibilityLabel={t('close')}
        >
          <X size={20} color={CINE.text} />
        </TouchableOpacity>
      </View>

      {!selected && (
        <View
          style={[styles.hint, { bottom: insets.bottom + SPACING.l }]}
          pointerEvents="none"
        >
          <Text style={styles.hintText}>{t('goalMapHint')}</Text>
        </View>
      )}

      {selected && (
        <SpotCard
          key={selected.position}
          point={selected}
          todayId={plan.today_id}
          bottomInset={insets.bottom}
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
  );
};

/** کارت پایین صفحه برای نقطه‌ی انتخاب‌شده: عکس، عنوان، دو جمله‌ی اول با صدا و دکمه‌ی ورود. */
const SpotCard = ({
  point,
  todayId,
  bottomInset,
  getScene,
  onClose,
  onEnter,
  t,
}: {
  point: MapPoint;
  todayId?: string;
  bottomInset: number;
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

  // با باز شدن کارت، دو جمله‌ی اول خودکار پشت هم پخش می‌شوند.
  useEffect(() => {
    if (lines && lines.length && lines[0].audioUrl) {
      setPlayIdx(0);
      setNonce(n => n + 1);
    }
  }, [lines]);

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
    <View style={[styles.card, { paddingBottom: bottomInset + SPACING.m }]}>
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
        {s.scene_image_url ? (
          <Image
            source={{ uri: absUrl(s.scene_image_url) }}
            style={styles.cardImg}
          />
        ) : (
          <View style={[styles.cardImg, styles.cardImgEmpty]} />
        )}
        <View style={styles.flex1}>
          {st === 'today' && (
            <Text style={styles.todayTag}>{t('goalMapToday')}</Text>
          )}
          <Text style={styles.cardTitle} numberOfLines={2}>
            {s.title_fa}
          </Text>
          {!!s.scene_level && (
            <Text style={styles.cardSub}>
              {t(LEVEL_KEY[s.scene_level] || 'levelBeginner')}
            </Text>
          )}
        </View>
        <TouchableOpacity
          onPress={onClose}
          style={styles.cardClose}
          accessibilityLabel={t('close')}
        >
          <X size={18} color={CINE.muted} />
        </TouchableOpacity>
      </View>

      {!s.scene_id ? (
        <Text style={styles.soon}>{t('goalMapSoon')}</Text>
      ) : (
        <>
          <View style={styles.lines}>
            {lines === null ? (
              <ActivityIndicator color={CINE.accent} />
            ) : (
              lines.map((l, i) => (
                <View
                  key={l.id}
                  style={[styles.line, playIdx === i && styles.lineActive]}
                >
                  <Text style={styles.lineEn}>{l.dialogue}</Text>
                  <Text style={styles.lineFa}>{l.translation}</Text>
                </View>
              ))
            )}
          </View>
          <View style={styles.cardActions}>
            <TouchableOpacity
              style={styles.playBtn}
              onPress={togglePlay}
              disabled={!lines?.length}
            >
              {playIdx !== null ? (
                <Pause size={18} color={CINE.accentText} />
              ) : (
                <Play size={18} color={CINE.accentText} />
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.enterBtn}
              onPress={() => onEnter(s.scene_id!)}
              activeOpacity={0.9}
            >
              <Text style={styles.enterText}>
                {st === 'done' ? t('goalMapPracticeAgain') : t('enterScene')}
              </Text>
              <ChevronLeft size={18} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#E9E4DA' },
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
    height: MARKER,
    alignItems: 'center',
    justifyContent: 'center',
  },
  halo: {
    position: 'absolute',
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
  markerToday: { backgroundColor: CINE.accent, borderColor: '#FFFFFF' },
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
  label: {
    position: 'absolute',
    top: MARKER + 4,
    backgroundColor: CINE.text,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
    maxWidth: 170,
  },
  labelText: {
    fontFamily: FONT_FAMILY.medium,
    fontSize: 11,
    lineHeight: 17,
    color: '#FFFFFF',
  },

  topBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingHorizontal: SPACING.l,
  },
  iconBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.94)',
    borderWidth: 1,
    borderColor: CINE.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hint: {
    position: 'absolute',
    alignSelf: 'center',
    backgroundColor: 'rgba(26,29,38,0.82)',
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  hintText: {
    fontFamily: FONT_FAMILY.medium,
    fontSize: 13,
    lineHeight: 20,
    color: '#FFFFFF',
  },

  card: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: CINE.bg,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderColor: CINE.border,
    paddingHorizontal: SPACING.l,
    paddingTop: SPACING.l,
    gap: SPACING.m,
  },
  cardHead: { flexDirection: 'row', alignItems: 'center', gap: SPACING.m },
  cardImg: { width: 84, height: 56, borderRadius: 12 },
  cardImgEmpty: { backgroundColor: CINE.surface },
  todayTag: {
    fontFamily: FONT_FAMILY.bold,
    fontSize: 11,
    lineHeight: 17,
    color: CINE.accentText,
  },
  cardTitle: {
    fontFamily: FONT_FAMILY.bold,
    fontSize: 16,
    lineHeight: 25,
    color: CINE.text,
  },
  cardSub: {
    fontFamily: FONT_FAMILY.medium,
    fontSize: 12,
    lineHeight: 18,
    color: CINE.muted,
  },
  cardClose: { padding: 6 },
  soon: {
    fontFamily: FONT_FAMILY.medium,
    fontSize: 14,
    lineHeight: 22,
    color: CINE.muted,
    paddingBottom: SPACING.s,
  },
  lines: { gap: SPACING.s, minHeight: 60, justifyContent: 'center' },
  line: {
    backgroundColor: CINE.surface,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: CINE.surface,
  },
  lineActive: { borderColor: CINE.accent },
  lineEn: {
    fontFamily: FONT_FAMILY.medium,
    fontSize: 15,
    lineHeight: 22,
    color: CINE.text,
    textAlign: 'left',
    writingDirection: 'ltr',
  },
  lineFa: {
    fontFamily: FONT_FAMILY.regular,
    fontSize: 13,
    lineHeight: 21,
    color: CINE.muted,
  },
  cardActions: { flexDirection: 'row', alignItems: 'center', gap: SPACING.m },
  playBtn: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 1.5,
    borderColor: CINE.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  enterBtn: {
    flex: 1,
    height: 50,
    borderRadius: 25,
    backgroundColor: CINE.accent,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  enterText: { fontFamily: FONT_FAMILY.bold, fontSize: 15, color: '#FFFFFF' },
});
