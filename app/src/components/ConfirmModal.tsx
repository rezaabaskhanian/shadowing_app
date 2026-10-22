import React from 'react';
import { ActivityIndicator, Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { COLORS, SPACING, BORDER_RADIUS, hexToRgba } from '../theme/colors';
import { FONT_FAMILY, TEXT_STYLES } from '../theme/typography';
import { SHADOWS } from '../theme/elevation';

interface ConfirmModalProps {
  visible: boolean;
  /** آیکنِ بالای کارت (رنگش را خودِ صدازننده می‌دهد). */
  icon: React.ReactNode;
  /** رنگِ حلقه‌ی آیکن و دکمه‌ی تأیید؛ برای کار خطرناک (حذف) COLORS.error. */
  color: string;
  title: string;
  body?: string;
  confirmLabel: string;
  cancelLabel: string;
  busy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

/**
 * پنجره‌ی تأییدِ هم‌شکلِ بقیه‌ی مودال‌های اپ (کارت وسط صفحه روی پس‌زمینه‌ی تیره)
 * به‌جای Alert خامِ سیستم؛ لمس بیرون کارت یعنی انصراف.
 */
export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  visible,
  icon,
  color,
  title,
  body,
  confirmLabel,
  cancelLabel,
  busy,
  onConfirm,
  onCancel,
}) => (
  <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
    <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={busy ? undefined : onCancel}>
      <TouchableOpacity style={styles.card} activeOpacity={1} onPress={() => {}}>
        <View style={[styles.halo, { backgroundColor: hexToRgba(color, 0.12) }]}>
          <View style={[styles.iconCircle, { backgroundColor: color }]}>{icon}</View>
        </View>
        <Text style={styles.title}>{title}</Text>
        {!!body && <Text style={styles.body}>{body}</Text>}
        <View style={styles.actions}>
          <TouchableOpacity style={styles.cancelBtn} onPress={onCancel} disabled={busy} activeOpacity={0.8}>
            <Text style={styles.cancelText}>{cancelLabel}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.confirmBtn, { backgroundColor: color }]}
            onPress={onConfirm}
            disabled={busy}
            activeOpacity={0.85}
          >
            {busy ? <ActivityIndicator color={COLORS.white} /> : <Text style={styles.confirmText}>{confirmLabel}</Text>}
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </TouchableOpacity>
  </Modal>
);

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    padding: 22,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    ...SHADOWS.level2,
  },
  halo: {
    width: 84,
    height: 84,
    borderRadius: 42,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.m,
  },
  iconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontFamily: FONT_FAMILY.bold,
    fontSize: 18,
    color: COLORS.text,
    textAlign: 'center',
  },
  body: {
    ...TEXT_STYLES.bodyMd,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: SPACING.s,
  },
  actions: {
    flexDirection: 'row',
    gap: SPACING.s,
    marginTop: SPACING.l,
    alignSelf: 'stretch',
  },
  cancelBtn: {
    flex: 1,
    borderRadius: BORDER_RADIUS.l,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surfaceHigh,
    paddingVertical: 12,
    alignItems: 'center',
  },
  cancelText: {
    fontFamily: FONT_FAMILY.semiBold,
    fontSize: 15,
    color: COLORS.text,
  },
  confirmBtn: {
    flex: 1,
    borderRadius: BORDER_RADIUS.l,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmText: {
    fontFamily: FONT_FAMILY.bold,
    fontSize: 15,
    color: COLORS.white,
  },
});
