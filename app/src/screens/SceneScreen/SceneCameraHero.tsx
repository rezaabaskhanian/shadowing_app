import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { ArrowRight, Flame } from 'lucide-react-native';

import { COLORS } from '../../theme/colors';
import { FONT_FAMILY } from '../../theme/typography';

// بازه‌ی مجاز زوم دوربین. برای هات‌اسپات‌های نزدیک وسط تصویر همان حداقل کافی
// است؛ برای هات‌اسپات‌های نزدیک لبه/گوشه، زوم به‌صورت پویا تا همین سقف بالا
// می‌رود تا نقطه واقعاً وسط صفحه بیفتد (نه اینکه فقط pan محدود شود و نقطه
// همان‌جای لبه بماند). سقف را زیاد بالا نمی‌بریم تا حس نامعقول «چسبیدن به
// تصویر» ایجاد نشود.
const MIN_CAMERA_SCALE = 1.15;
const MAX_CAMERA_SCALE = 1.9;

interface ActiveCameraTarget {
  x: number;
  y: number;
  hotspotId: string;
}

interface SceneCamera {
  scale: number;
  panX: number;
  panY: number;
}

/**
 * زوم + جابه‌جایی (pan) لازم برای وسط‌چین‌کردن دقیق یک نقطه. برخلاف نسخه‌ی
 * قبلی (زوم ثابت + pan محدودشده)، اینجا اول می‌بینیم با چه زومی می‌شود نقطه
 * را دقیقاً وسط آورد (بدون افتادن فضای خالی کنار تصویر)، و همان زوم را تا
 * سقف MAX_CAMERA_SCALE استفاده می‌کنیم — یعنی هات‌اسپات‌های نزدیک لبه/گوشه
 * بیشتر زوم می‌شوند تا واقعاً به وسط برسند، نه اینکه کنار لبه بمانند. فقط
 * برای نقاط خیلی‌خیلی نزدیک به خودِ لبه (که زومِ لازم غیرمعقول زیاد می‌شود)
 * با همین سقف، حداکثر ممکن به وسط نزدیک می‌شوند (نه صد‌درصد دقیق).
 * هم انیمیشن دوربین و هم محاسبه‌ی موقعیت حباب دیالوگ از همین تابع استفاده
 * می‌کنند تا همیشه با هم هماهنگ بمانند.
 */
function computeSceneCamera(
  target: { x: number; y: number },
  screenWidth: number,
  topViewHeight: number
): SceneCamera {
  const offsetX = target.x * screenWidth - screenWidth / 2;
  const offsetY = target.y * topViewHeight - topViewHeight / 2;

  // زومی که این‌قدر جابه‌جایی را (بدون فضای خالی کنار تصویر) ممکن می‌کند:
  // |offset| <= (dim/2)*(1-1/scale)  →  scale >= 1 / (1 - 2*|offset|/dim)
  const requiredScale = (offset: number, dim: number) => {
    const ratio = Math.min(Math.abs(offset) / (dim / 2), 0.97); // سقف نزدیک ۱ برای جلوگیری از زوم بی‌نهایت دقیقاً روی خودِ لبه
    return 1 / (1 - ratio);
  };

  const scale = Math.min(
    MAX_CAMERA_SCALE,
    Math.max(MIN_CAMERA_SCALE, requiredScale(offsetX, screenWidth), requiredScale(offsetY, topViewHeight))
  );

  const maxPanX = (screenWidth / 2) * (1 - 1 / scale);
  const maxPanY = (topViewHeight / 2) * (1 - 1 / scale);
  const rawPanX = -offsetX;
  const rawPanY = -offsetY;

  return {
    scale,
    panX: Math.max(-maxPanX, Math.min(maxPanX, rawPanX)),
    panY: Math.max(-maxPanY, Math.min(maxPanY, rawPanY)),
  };
}

interface SceneCameraHeroProps {
  coverImage: any;
  onCoverLoad: (event: any) => void;
  topViewHeight: number;
  screenWidth: number;
  insetsTop: number;
  activeTarget: ActiveCameraTarget | undefined;
  sceneFinished: boolean;
  /**
   * هر بار این مقدار عوض شود، دوربین دوباره روی هات‌اسپات فعلی زوم می‌کند —
   * حتی اگر هات‌اسپات تغییر نکرده باشد. برای اجرای دوباره‌ی انیمیشن با تعویض
   * مرحله‌ی تمرین استفاده می‌شود.
   */
  refocusKey?: string | number;
  isShadowingMode: boolean;
  streakCount: number;
  onForward: () => void;
  /** حباب دیالوگ بالای سر گوینده‌ی فعلی — متن/گوینده‌ی خط جاری. */
  bubbleSpeaker?: string;
  bubbleText?: string;
  /**
   * محتوای غنی‌تر برای داخل حباب (مثلاً جمله‌ی هایلایت‌شده‌ی کلمه‌به‌کلمه) —
   * وقتی داده شود به‌جای bubbleText رندر می‌شود. اگر نه این و نه bubbleText
   * چیزی نداشته باشند، حباب اصلاً نمایش داده نمی‌شود (همان راهی که حالت
   * «کارت پایین» را از تکرارِ هم‌زمانِ متن آزاد می‌کند).
   */
  bubbleContent?: React.ReactNode;
  /** فقط وقتی true است حباب نمایش داده می‌شود (با پایان صدای هر خط، بسته می‌شود). */
  bubbleVisible: boolean;
}

/**
 * ناحیه‌ی تصویر بالای صفحه‌ی صحنه: عکس صحنه + دوربینی که با زوم و pan روی
 * هات‌اسپات فعال وسط‌چین می‌شود + کنترل‌های شناور روی تصویر (استریک و دکمه‌ی
 * مرحله‌ی بعد). تمام منطق انیمیشن دوربین همین‌جا کپسوله شده.
 */
export const SceneCameraHero: React.FC<SceneCameraHeroProps> = ({
  coverImage,
  onCoverLoad,
  topViewHeight,
  screenWidth,
  insetsTop,
  activeTarget,
  sceneFinished,
  refocusKey,
  isShadowingMode,
  streakCount,
  onForward,
  bubbleSpeaker,
  bubbleText,
  bubbleContent,
  bubbleVisible,
}) => {
  const zoomAnim = useRef(new Animated.Value(1)).current;
  const panXAnim = useRef(new Animated.Value(0)).current;
  const panYAnim = useRef(new Animated.Value(0)).current;
  // فید این/اوت حباب دیالوگ — با شروع هر خط باز، با پایان صدایش بسته می‌شود.
  const bubbleAnim = useRef(new Animated.Value(0)).current;
  const showBubble =
    bubbleVisible && !sceneFinished && !!activeTarget && (!!bubbleText || !!bubbleContent);

  // اندازه‌ی واقعی جعبه‌ی حباب (طول متن هر جمله فرق می‌کند) — تا وقتی اندازه‌
  // گیری نشده یک تخمین منطقی استفاده می‌شود که خیلی از واقعیت دور نیست.
  const [bubbleSize, setBubbleSize] = useState({ width: 160, height: 56 });

  // موقعیت واقعیِ روی‌صفحه‌ی نقطه‌ی هات‌اسپات، با همان زوم+pan که دوربین
  // واقعاً به آن رسیده — با زوم پویا، اکثر هات‌اسپات‌ها (حتی نزدیک لبه) دقیقاً
  // وسط صفحه می‌افتند، پس حباب هم همان‌جا لنگر می‌شود.
  const anchor = useMemo(() => {
    if (!activeTarget) return null;
    const { scale, panX, panY } = computeSceneCamera(activeTarget, screenWidth, topViewHeight);
    const offsetX = activeTarget.x * screenWidth - screenWidth / 2;
    const offsetY = activeTarget.y * topViewHeight - topViewHeight / 2;
    return {
      x: screenWidth / 2 + scale * (offsetX + panX),
      y: topViewHeight / 2 + scale * (offsetY + panY),
    };
  }, [activeTarget, screenWidth, topViewHeight]);

  // موقعیت نهایی جعبه‌ی حباب: نوکِ حباب دقیقاً روی خودِ هات‌اسپات می‌نشیند
  // (بدون هیچ جابه‌جایی مصنوعی)؛ فقط افقی کمی محدود می‌شود که جعبه از لبه‌ی
  // چپ/راست صفحه بیرون نزند و کامل خوانا بماند.
  const EDGE_MARGIN = 12;
  const bubbleLeft = anchor
    ? Math.max(
        EDGE_MARGIN,
        Math.min(anchor.x - bubbleSize.width / 2, screenWidth - EDGE_MARGIN - bubbleSize.width)
      )
    : 0;
  const bubbleAnchorY = anchor ? anchor.y : topViewHeight * 0.5;
  const bubbleBottom = topViewHeight - bubbleAnchorY;

  useEffect(() => {
    Animated.timing(bubbleAnim, {
      toValue: showBubble ? 1 : 0,
      duration: showBubble ? 220 : 160,
      useNativeDriver: true,
    }).start();
  }, [showBubble, bubbleAnim]);
  // آخرین حالتی که دوربین رویش زوم کرده: ترکیب هات‌اسپات و refocusKey. تا وقتی
  // همین ترکیب فعال است (مثلاً چند خط دیالوگ پشت‌سرهم در یک هات‌اسپات و بدون
  // تعویض مرحله)، دوربین دست‌نخورده می‌ماند.
  const lastZoomedKeyRef = useRef<string | null>(null);

  useEffect(() => {
    const zoomOutAnim = () =>
      Animated.parallel([
        Animated.timing(zoomAnim, { toValue: 1, duration: 450, useNativeDriver: true }),
        Animated.timing(panXAnim, { toValue: 0, duration: 450, useNativeDriver: true }),
        Animated.timing(panYAnim, { toValue: 0, duration: 450, useNativeDriver: true }),
      ]);

    // وقتی صحنه تمام شده یا هدفی برای زوم نداریم، دوربین کامل زوم اوت می‌کند
    // و دیگر زوم نمی‌کند (تا هدف جدیدی مشخص شود).
    if (sceneFinished || !activeTarget) {
      lastZoomedKeyRef.current = null;
      zoomOutAnim().start();
      return;
    }

    // اگر هم هات‌اسپات و هم refocusKey همان قبلی باشند (یعنی فقط خط دیالوگِ
    // داخل همین هات‌اسپات عوض شده)، دوربین زوم‌شده و دست‌نخورده می‌ماند. با
    // تغییر هات‌اسپات یا تعویض مرحله‌ی تمرین، انیمیشن زوم‌اوت→زوم‌این دوباره
    // اجرا می‌شود.
    const zoomKey = `${activeTarget.hotspotId}|${refocusKey ?? ''}`;
    if (zoomKey === lastZoomedKeyRef.current) {
      return;
    }
    lastZoomedKeyRef.current = zoomKey;

    // همان تابع مشترکی که موقعیت حباب دیالوگ هم از آن استفاده می‌کند — تا
    // دوربین و حباب همیشه دقیقاً روی یک نقطه هماهنگ بمانند. زوم اینجا پویاست:
    // هرچه هات‌اسپات به لبه نزدیک‌تر باشد، برای رساندنش به وسط، زوم بیشتری
    // لازم است.
    const { scale: targetScale, panX: targetPanX, panY: targetPanY } = computeSceneCamera(
      activeTarget,
      screenWidth,
      topViewHeight
    );

    // اول کامل از حالت زوم خارج شو (بازگشت به نمای عادی)، بعد به هات‌اسپات
    // بعدی زوم کن — همان جلوه‌ی «زوم اوت بعد زوم این» برای هر جابه‌جایی بین
    // هات‌اسپات‌ها.
    Animated.sequence([
      zoomOutAnim(),
      Animated.parallel([
        Animated.timing(zoomAnim, { toValue: targetScale, duration: 550, useNativeDriver: true }),
        Animated.timing(panXAnim, { toValue: targetPanX, duration: 550, useNativeDriver: true }),
        Animated.timing(panYAnim, { toValue: targetPanY, duration: 550, useNativeDriver: true }),
      ]),
    ]).start();
  }, [
    activeTarget,
    sceneFinished,
    refocusKey,
    screenWidth,
    topViewHeight,
    zoomAnim,
    panXAnim,
    panYAnim,
  ]);

  return (
    <View style={[styles.playerTopView, { height: topViewHeight }]}>
      <View style={styles.zoomContainer}>
        <Animated.Image
          source={coverImage}
          onLoad={onCoverLoad}
          style={[
            styles.topSceneImage,
            {
              transform: [
                { scale: zoomAnim },
                { translateX: panXAnim },
                { translateY: panYAnim },
              ],
            },
          ]}
          // contain تضمین می‌کند حتی اگر ارتفاع کادر دقیقاً با نسبت تصویر
          // یکی نشود، باز هم کل عرض تصویر دیده شود و از طرفین بریده نشود.
          resizeMode="contain" 
        />
      </View>

      {/* حباب دیالوگ — بالای سر گوینده‌ی فعلی. موقعیتش دقیقاً همان نقطه‌ی
          واقعی روی‌صفحه‌ی هات‌اسپات است (نه فرضِ «همیشه وسط»)، چون برای
          هات‌اسپات‌های نزدیک لبه/گوشه دوربین نمی‌تواند نقطه را کامل وسط
          بیاورد. با «bottom» (نه «top») لنگر می‌کنیم تا با رشد متن، حباب به
          سمت بالا بزرگ شود و نوکش دقیقاً روی همان نقطه بماند؛ افقی هم طوری
          محدود می‌شود که از لبه‌های صفحه بیرون نزند. */}
      <Animated.View
        pointerEvents="none"
        onLayout={(e) => {
          const { width, height } = e.nativeEvent.layout;
          if (Math.abs(width - bubbleSize.width) > 1 || Math.abs(height - bubbleSize.height) > 1) {
            setBubbleSize({ width, height });
          }
        }}
        style={[
          styles.bubbleWrap,
          {
            left: bubbleLeft,
            bottom: bubbleBottom,
            opacity: bubbleAnim,
            transform: [
              {
                translateY: bubbleAnim.interpolate({ inputRange: [0, 1], outputRange: [10, 0] }),
              },
              {
                scale: bubbleAnim.interpolate({ inputRange: [0, 1], outputRange: [0.9, 1] }),
              },
            ],
          },
        ]}
      >
        <View style={[styles.bubbleBox, { maxWidth: screenWidth * 0.78 }]}>
          {bubbleSpeaker ? (
            <Text style={styles.bubbleSpeaker} numberOfLines={1}>
              {bubbleSpeaker.toUpperCase()}
            </Text>
          ) : null}
          {bubbleContent ?? (
            <Text style={styles.bubbleText} numberOfLines={4}>
              {bubbleText}
            </Text>
          )}
        </View>
        <View style={styles.bubbleTail} />
      </Animated.View>

      {/* Overlay Header: streak · (shadowing mode) next-step */}
      {/* تصویر زیر نوار وضعیت کشیده شده، پس دکمه‌ها باید پایین‌تر از آن بنشینند */}
      <View style={[styles.imageHeaderOverlay, { top: insetsTop + 8 }]}>
        <View style={styles.streakOverlayBadge}>
          <Text style={styles.streakOverlayText}>{streakCount}</Text>
          <Flame size={14} color={COLORS.secondary} fill={COLORS.secondary} />
        </View>

        {isShadowingMode && (
          <TouchableOpacity activeOpacity={0.85} style={styles.overlayIconBtn} onPress={onForward}>
            <ArrowRight size={18} color={COLORS.text} />
          </TouchableOpacity>
        )}
      </View>

    </View>
  );
};

const styles = StyleSheet.create({
  playerTopView: {
    width: '100%',
    position: 'relative',
    overflow: 'hidden',
    // هم‌رنگ پس‌زمینه تا اگر جایی نوار خالی کنار تصویر ماند، به‌جای مشکیِ تو
    // ذوق‌زن با بقیه‌ی صفحه یکدست شود.
    backgroundColor: COLORS.background,
  },
  zoomContainer: {
    width: '100%',
    height: '100%',
    overflow: 'hidden',
  },
  topSceneImage: {
    width: '100%',
    height: '100%',
  },
  bubbleWrap: {
    position: 'absolute',
    // بدون تعیین «right»، عرض این View خودش را با محتوایش (جعبه + دم) تنظیم
    // می‌کند؛ alignItems دم را دقیقاً زیر وسط جعبه نگه می‌دارد.
    alignItems: 'center',
    zIndex: 15,
  },
  bubbleBox: {
    backgroundColor: 'rgba(255, 255, 255, 0.97)',
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 10,
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 6,
  },
  bubbleSpeaker: {
    color: COLORS.primary,
    fontFamily: FONT_FAMILY.bold,
    fontSize: 10,
    letterSpacing: 0.6,
    marginBottom: 2,
    textAlign: 'center',
  },
  bubbleText: {
    color: '#14181F',
    fontFamily: FONT_FAMILY.semiBold,
    fontSize: 14,
    lineHeight: 19,
    textAlign: 'center',
  },
  bubbleTail: {
    width: 14,
    height: 14,
    marginTop: -7,
    backgroundColor: 'rgba(255, 255, 255, 0.97)',
    borderRadius: 2,
    transform: [{ rotate: '45deg' }],
  },
  imageHeaderOverlay: {
    position: 'absolute',
    left: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 20,
  },
  overlayIconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  streakOverlayBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 18,
  },
  streakOverlayText: {
    color: COLORS.text,
    fontFamily: FONT_FAMILY.bold,
    fontSize: 13,
  },
});
