import React from 'react';
import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { ChevronRight, House, ListChecks, MessageCircle, Mic, PartyPopper, RotateCcw } from 'lucide-react-native';

import { COLORS } from '../theme/colors';
import { FONT_FAMILY } from '../theme/typography';
import { useLanguage } from '../data/i18n';

interface LessonCompleteModalProps {
  visible: boolean;
  onStartQuiz: () => void;
  onStartAiConversation: () => void;
  onStartFreeSpeech: () => void;
  onPracticeAgain: () => void;
  onBackHome: () => void;
}

/**
 * جایگزینِ `Alert.alert` نیتیوِ قبلی برای پایانِ درس — همان ۵ گزینه، ولی
 * هم‌استایل با بقیه‌ی مودال‌های اپ (StreakInfoModal/XpInfoModal) به‌جای
 * ظاهرِ پیش‌فرضِ سیستم‌عامل که فونت/رنگِ خودِ اپ را نداشت. عمداً backdrop و
 * دکمه‌ی بستن ندارد — طبق رفتارِ قبلی (`cancelable: false`) کاربر باید یکی
 * از گزینه‌ها را انتخاب کند.
 */
export const LessonCompleteModal: React.FC<LessonCompleteModalProps> = ({
  visible,
  onStartQuiz,
  onStartAiConversation,
  onStartFreeSpeech,
  onPracticeAgain,
  onBackHome,
}) => {
  const { t } = useLanguage();

  const options: { key: string; Icon: typeof ListChecks; label: string; onPress: () => void }[] = [
    { key: 'quiz', Icon: ListChecks, label: t('startQuiz'), onPress: onStartQuiz },
    { key: 'ai', Icon: MessageCircle, label: t('startAiConversation'), onPress: onStartAiConversation },
    { key: 'free', Icon: Mic, label: t('startFreeSpeech'), onPress: onStartFreeSpeech },
    { key: 'again', Icon: RotateCcw, label: t('shadowAgain'), onPress: onPracticeAgain },
  ];

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={() => {}}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <View style={styles.iconWrap}>
            <PartyPopper size={28} color={COLORS.secondary} fill={COLORS.secondary} />
          </View>
          <Text style={styles.title}>{t('lessonCompleteTitle')}</Text>
          <Text style={styles.message}>{t('lessonCompleteMessage')}</Text>

          <View style={styles.optionsList}>
            {options.map(({ key, Icon, label, onPress }) => (
              <TouchableOpacity key={key} style={styles.optionRow} onPress={onPress} activeOpacity={0.8}>
                <View style={styles.optionIconWrap}>
                  <Icon size={18} color={COLORS.primary} />
                </View>
                <Text style={styles.optionLabel}>{label}</Text>
                <ChevronRight color={COLORS.muted} size={18} />
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity style={styles.homeBtn} onPress={onBackHome} activeOpacity={0.7}>
            <House size={15} color={COLORS.textSecondary} />
            <Text style={styles.homeBtnText}>{t('backToHome')}</Text>
          </TouchableOpacity>
        </View>
      </View>
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
    maxWidth: 360,
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
    backgroundColor: 'rgba(254, 166, 25, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  title: {
    color: COLORS.text,
    fontFamily: FONT_FAMILY.bold,
    fontSize: 18,
    marginBottom: 4,
    textAlign: 'center',
  },
  message: {
    color: COLORS.textSecondary,
    fontFamily: FONT_FAMILY.regular,
    fontSize: 13,
    lineHeight: 20,
    textAlign: 'center',
    marginBottom: 18,
  },
  optionsList: {
    width: '100%',
    gap: 8,
  },
  optionRow: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 14,
    backgroundColor: COLORS.surfaceLight,
  },
  optionIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionLabel: {
    flex: 1,
    color: COLORS.text,
    fontFamily: FONT_FAMILY.medium,
    fontSize: 14,
  },
  homeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 16,
    paddingVertical: 8,
  },
  homeBtnText: {
    color: COLORS.textSecondary,
    fontFamily: FONT_FAMILY.medium,
    fontSize: 13,
  },
});
