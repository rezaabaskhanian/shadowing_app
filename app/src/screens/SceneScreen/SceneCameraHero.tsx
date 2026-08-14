import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { ArrowRight, Flame } from 'lucide-react-native';

import { COLORS } from '../../theme/colors';
import { FONT_FAMILY } from '../../theme/typography';

// میزان زوم دوربین روی هر هات‌اسپات. با هر تعویض هات‌اسپات، دوربین اول تا ۱
// زوم اوت می‌کند و بعد تا این مقدار روی نقطه‌ی جدید زوم می‌کند.
const CAMERA_SCALE = 1.8;

interface ActiveCameraTarget {
  x: number;
  y: number;
  hotspotId: string;
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
}) => {
  const zoomAnim = useRef(new Animated.Value(1)).current;
  const panXAnim = useRef(new Animated.Value(0)).current;
  const panYAnim = useRef(new Animated.Value(0)).current;
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

    // برای مرکز کردن دقیق نقطه‌ی هات‌اسپات، جابه‌جایی باید بر حسب ابعاد واقعی
    // ناحیه‌ی تصویر باشد (نه یک عدد ثابت دلخواه)، وگرنه نقاط نزدیک لبه‌ها اصلاً
    // به مرکز نمی‌رسند.
    const rawPanX = (0.5 - activeTarget.x) * screenWidth;
    const rawPanY = (0.5 - activeTarget.y) * topViewHeight;

    // حداکثر جابه‌جایی مجازی که با این میزان زوم، بدون نمایش فضای خالی اطراف
    // تصویر امکان‌پذیر است (مشتق‌شده از هندسه‌ی scale+translate).
    const maxPanX = (screenWidth / 2) * (1 - 1 / CAMERA_SCALE) * 0.7;
    const maxPanY = (topViewHeight / 2) * (1 - 1 / CAMERA_SCALE) * 0.7;

    const targetPanX = Math.max(-maxPanX, Math.min(maxPanX, rawPanX));
    const targetPanY = Math.max(-maxPanY, Math.min(maxPanY, rawPanY));

    // اول کامل از حالت زوم خارج شو (بازگشت به نمای عادی)، بعد به هات‌اسپات
    // بعدی زوم کن — همان جلوه‌ی «زوم اوت بعد زوم این» برای هر جابه‌جایی بین
    // هات‌اسپات‌ها.
    Animated.sequence([
      zoomOutAnim(),
      Animated.parallel([
        Animated.timing(zoomAnim, { toValue: CAMERA_SCALE, duration: 550, useNativeDriver: true }),
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
