import React from 'react';
import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Award, Zap } from 'lucide-react-native';

import { COLORS } from '../theme/colors';
import { FONT_FAMILY } from '../theme/typography';
import { useLanguage } from '../data/i18n';

interface XpInfoModalProps {
  visible: boolean;
  onClose: () => void;
  totalXP: number;
  /** اسم سطح فعلی (مثلاً «کوشا»)؛ اگر هنوز نرسیده، نمایش داده نمی‌شود. */
  levelName?: string;
}

/**
 * توضیح ساده‌ی معنای XP — درست مثل StreakInfoModal برای استریک، چون بج XP
 * هم توی هدر خانه هم توی تب پیشرفت فقط یک عدد خام است.
 */
export const XpInfoModal: React.FC<XpInfoModalProps> = ({ visible, onClose, totalXP, levelName }) => {
  const { t, language } = useLanguage();

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose}>
        <TouchableOpacity style={styles.card} activeOpacity={1} onPress={() => {}}>
          <View style={styles.iconWrap}>
            <Zap size={28} color={COLORS.tertiary} fill={COLORS.tertiary} />
          </View>

          <Text style={styles.xpValue}>
            {`${totalXP} XP`}
          </Text>

          <Text style={styles.body}>{t('xpExplain')}</Text>

          {!!levelName && (
            <View style={styles.levelRow}>
              <Award size={16} color={COLORS.primary} />
              <Text style={styles.levelText}>
                {language === 'fa' ? `سطح فعلی: ${levelName}` : `Current level: ${levelName}`}
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
  iconWrap: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: COLORS.tertiaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  xpValue: {
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
  levelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 12,
  },
  levelText: {
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
