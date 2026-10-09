import React from 'react';
import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Snowflake } from 'lucide-react-native';
import { Celebration } from './Celebration';

import { COLORS } from '../theme/colors';
import { FONT_FAMILY } from '../theme/typography';
import { useLanguage } from '../data/i18n';

interface StreakInfoModalProps {
  visible: boolean;
  onClose: () => void;
  streak: number;
  /** وقتی نامشخص است (مثلاً صفحه‌ای که هنوز این را نگرفته) نمایش داده نمی‌شود. */
  freezes?: number;
}

/**
 * توضیح ساده‌ی معنای «استریک» — چون بج شعله در کل اپ فقط یک عدد خام است و
 * هیچ توضیحی ندارد، با لمس آن این باکس باز می‌شود.
 */
export const StreakInfoModal: React.FC<StreakInfoModalProps> = ({
  visible,
  onClose,
  streak,
  freezes,
}) => {
  const { t, language } = useLanguage();

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose}>
        <TouchableOpacity style={styles.card} activeOpacity={1} onPress={() => {}}>
          {/* شعله‌ی استریک (Lottie اگر فایلش اضافه شده باشد، وگرنه Reanimated) */}
          {visible && <Celebration kind="streak" size={96} />}

          <Text style={styles.streakValue}>
            {language === 'fa' ? `${streak} روز متوالی` : `${streak}-day streak`}
          </Text>

          <Text style={styles.body}>{t('streakInfoBody')}</Text>

          {typeof freezes === 'number' && (
            <View style={styles.freezeRow}>
              <Snowflake size={16} color={COLORS.info} />
              <Text style={styles.freezeText}>
                {language === 'fa'
                  ? `${freezes} فریز رایگان باقی‌مانده`
                  : `${freezes} free freeze${freezes === 1 ? '' : 's'} left`}
              </Text>
            </View>
          )}

          <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
            <Text style={styles.closeBtnText}>{t('close')}</Text>
          </TouchableOpacity>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
};

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
  },
  streakValue: {
    color: COLORS.text,
    fontFamily: FONT_FAMILY.bold,
    fontSize: 18,
    marginBottom: 8,
  },
  body: {
    color: COLORS.textSecondary,
    fontFamily: FONT_FAMILY.regular,
    fontSize: 13,
    lineHeight: 20,
    textAlign: 'center',
  },
  freezeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 12,
  },
  freezeText: {
    color: COLORS.textSecondary,
    fontFamily: FONT_FAMILY.semiBold,
    fontSize: 12,
  },
  closeBtn: {
    marginTop: 18,
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 14,
    backgroundColor: COLORS.primary,
  },
  closeBtnText: {
    color: '#fff',
    fontFamily: FONT_FAMILY.semiBold,
    fontSize: 13,
  },
});
