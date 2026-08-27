import React, { useEffect, useRef } from 'react';
import { Animated, PanResponder, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AlertTriangle, CheckCircle2, Info, X, XCircle } from 'lucide-react-native';

import { useToast, type ToastType } from '../data/ToastContext';
import { COLORS } from '../theme/colors';
import { FONT_FAMILY } from '../theme/typography';
import { SHADOWS } from '../theme/elevation';

const VARIANT_STYLE: Record<ToastType, { icon: React.ComponentType<any>; accent: string; iconBg: string }> = {
  success: { icon: CheckCircle2, accent: COLORS.success, iconBg: COLORS.successLight },
  error: { icon: XCircle, accent: COLORS.error, iconBg: COLORS.errorLight },
  info: { icon: Info, accent: COLORS.info, iconBg: COLORS.infoLight },
  warning: { icon: AlertTriangle, accent: COLORS.warning, iconBg: COLORS.warningLight },
};

const SWIPE_DISMISS_THRESHOLD = -24;

/**
 * یک توست در یک لحظه (صف‌بندی در ToastContext انجام می‌شود). با ورود از بالا
 * (اسلاید + فید) ظاهر می‌شود، بعد از `duration` خودش با انیمیشنِ خروج می‌رود،
 * و با کشیدن به بالا یا لمس هم زودتر بسته می‌شود.
 */
export const Toast: React.FC = () => {
  const { current, dismiss } = useToast();
  const insets = useSafeAreaInsets();

  const translateY = useRef(new Animated.Value(-120)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const dragY = useRef(new Animated.Value(0)).current;
  const dismissTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const animateOutAndDismiss = React.useCallback(() => {
    if (dismissTimer.current) {
      clearTimeout(dismissTimer.current);
      dismissTimer.current = null;
    }
    Animated.parallel([
      Animated.timing(translateY, { toValue: -120, duration: 220, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 0, duration: 180, useNativeDriver: true }),
    ]).start(() => dismiss());
  }, [translateY, opacity, dismiss]);

  useEffect(() => {
    if (!current) return;

    translateY.setValue(-120);
    opacity.setValue(0);
    dragY.setValue(0);

    Animated.parallel([
      Animated.spring(translateY, { toValue: 0, useNativeDriver: true, damping: 16, mass: 0.9, stiffness: 180 }),
      Animated.timing(opacity, { toValue: 1, duration: 220, useNativeDriver: true }),
    ]).start();

    dismissTimer.current = setTimeout(animateOutAndDismiss, current.duration);
    return () => {
      if (dismissTimer.current) clearTimeout(dismissTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current?.id]);

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gesture) => Math.abs(gesture.dy) > 4,
      onPanResponderMove: (_, gesture) => {
        if (gesture.dy < 0) dragY.setValue(gesture.dy);
      },
      onPanResponderRelease: (_, gesture) => {
        if (gesture.dy < SWIPE_DISMISS_THRESHOLD) {
          animateOutAndDismiss();
        } else {
          Animated.spring(dragY, { toValue: 0, useNativeDriver: true }).start();
        }
      },
    }),
  ).current;

  if (!current) return null;

  const variant = VARIANT_STYLE[current.type];
  const Icon = variant.icon;

  return (
    <Animated.View
      pointerEvents="box-none"
      style={[styles.wrap, { top: insets.top + 8 }]}
    >
      <Animated.View
        {...panResponder.panHandlers}
        style={[
          styles.card,
          { borderLeftColor: variant.accent },
          { opacity, transform: [{ translateY: Animated.add(translateY, dragY) }] },
        ]}
      >
        <View style={[styles.iconWrap, { backgroundColor: variant.iconBg }]}>
          <Icon size={18} color={variant.accent} />
        </View>
        <View style={styles.textWrap}>
          {!!current.title && <Text style={styles.title}>{current.title}</Text>}
          <Text style={styles.message} numberOfLines={3}>
            {current.message}
          </Text>
        </View>
        <TouchableOpacity style={styles.closeBtn} onPress={animateOutAndDismiss} hitSlop={8}>
          <X size={16} color={COLORS.muted} />
        </TouchableOpacity>
      </Animated.View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: 16,
    right: 16,
    zIndex: 9999,
    alignItems: 'center',
  },
  card: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: COLORS.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderLeftWidth: 4,
    paddingVertical: 12,
    paddingHorizontal: 12,
    gap: 10,
    ...SHADOWS.level2,
  },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textWrap: {
    flex: 1,
  },
  title: {
    color: COLORS.text,
    fontFamily: FONT_FAMILY.semiBold,
    fontSize: 13,
    marginBottom: 2,
  },
  message: {
    color: COLORS.textSecondary,
    fontFamily: FONT_FAMILY.regular,
    fontSize: 13,
    lineHeight: 19,
  },
  closeBtn: {
    padding: 2,
  },
});
