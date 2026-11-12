import React from 'react';
import { ActivityIndicator, Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { COLORS, SPACING, BORDER_RADIUS, hexToRgba } from '../theme/colors';
import { FONT_FAMILY, TEXT_STYLES } from '../theme/typography';
import { SHADOWS } from '../theme/elevation';
import { useLanguage } from '../data/i18n';

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
}) => {
  const { language } = useLanguage();
  const rtl = language === 'fa';

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={busy ? undefined : onCancel}>
        <TouchableOpacity style={styles.card} activeOpacity={1} onPress={() => {}}>
          <View style={[styles.halo, { backgroundColor: hexToRgba(color, 0.12) }]}>
            <View style={[styles.iconCircle, { backgroundColor: color }]}>{icon}</View>
          </View>
          <Text style={styles.title}>{title}</Text>
          {!!body && <Text style={styles.body}>{body}</Text>}
          <View style={[styles.actions, rtl && styles.rowReverse]}>
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
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 20, 30, 0.65)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  rowReverse: {
    flexDirection: 'row-reverse',
  },
  card: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    borderWidth: 1.5,
    borderColor: '#F0EBE3',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 8,
  },
  halo: {
    width: 76,
    height: 76,
    borderRadius: 38,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  iconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },
  title: {
    fontFamily: FONT_FAMILY.bold,
    fontSize: 18,
    color: '#1A1D26',
    textAlign: 'center',
  },
  body: {
    fontFamily: FONT_FAMILY.regular,
    fontSize: 13.5,
    lineHeight: 22,
    color: '#716B62',
    textAlign: 'center',
    marginTop: 8,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 22,
    alignSelf: 'stretch',
  },
  cancelBtn: {
    flex: 1,
    height: 48,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#F0EBE3',
    backgroundColor: '#F3EFE6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelText: {
    fontFamily: FONT_FAMILY.semiBold,
    fontSize: 14,
    color: '#1A1D26',
  },
  confirmBtn: {
    flex: 1,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  confirmText: {
    fontFamily: FONT_FAMILY.bold,
    fontSize: 14,
    color: '#FFFFFF',
  },
});
