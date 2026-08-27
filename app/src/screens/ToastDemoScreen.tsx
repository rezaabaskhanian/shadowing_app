import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { AlertTriangle, CheckCircle2, ChevronLeft, Info, Layers, XCircle } from 'lucide-react-native';

import { useToast } from '../data/ToastContext';
import { useLanguage } from '../data/i18n';
import { COLORS } from '../theme/colors';
import { FONT_FAMILY } from '../theme/typography';
import { SHADOWS } from '../theme/elevation';

/**
 * صفحه‌ی تستِ توست‌ها — از پروفایل قابل‌دسترسی است، در تب‌بار دیده نمی‌شود.
 * هر کارت دقیقاً همان پیامی را نشان می‌دهد که آن نوع توست در جاهای واقعی اپ
 * (ذخیره‌ی ضبط، نمره‌دهی، مجوز میکروفن و...) قرار است نشان دهد.
 */
export const ToastDemoScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { t } = useLanguage();
  const toast = useToast();

  const cards: {
    key: 'success' | 'error' | 'info' | 'warning' | 'queue';
    icon: React.ComponentType<any>;
    color: string;
    bg: string;
    title: string;
    sample: string;
    onPress: () => void;
  }[] = [
    {
      key: 'success',
      icon: CheckCircle2,
      color: COLORS.success,
      bg: COLORS.successLight,
      title: t('toastDemoSuccessTitle'),
      sample: t('recordingSaved'),
      onPress: () => toast.success(t('recordingSaved')),
    },
    {
      key: 'error',
      icon: XCircle,
      color: COLORS.error,
      bg: COLORS.errorLight,
      title: t('toastDemoErrorTitle'),
      sample: t('scoringFailed'),
      onPress: () => toast.error(t('scoringFailed')),
    },
    {
      key: 'info',
      icon: Info,
      color: COLORS.info,
      bg: COLORS.infoLight,
      title: t('toastDemoInfoTitle'),
      sample: t('scoringInProgress'),
      onPress: () => toast.info(t('scoringInProgress')),
    },
    {
      key: 'warning',
      icon: AlertTriangle,
      color: COLORS.warning,
      bg: COLORS.warningLight,
      title: t('toastDemoWarningTitle'),
      sample: t('recordingUnavailable'),
      onPress: () => toast.warning(t('recordingUnavailable')),
    },
    {
      key: 'queue',
      icon: Layers,
      color: COLORS.primary,
      bg: COLORS.primaryLight,
      title: t('toastDemoQueueTitle'),
      sample: t('toastDemoQueueSample'),
      onPress: () => {
        toast.success(t('recordingSaved'));
        toast.info(t('scoringInProgress'));
        toast.error(t('scoringFailed'));
      },
    },
  ];

  return (
    <View style={styles.screen}>
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <ChevronLeft color={COLORS.text} size={20} />
        </TouchableOpacity>
        <Text style={styles.pageTitle}>{t('toastDemoTitle')}</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={styles.pageSub}>{t('toastDemoSub')}</Text>

        {cards.map((card) => (
          <TouchableOpacity
            key={card.key}
            style={styles.card}
            activeOpacity={0.85}
            onPress={card.onPress}
          >
            <View style={[styles.iconWrap, { backgroundColor: card.bg }]}>
              <card.icon size={20} color={card.color} />
            </View>
            <View style={styles.cardTextWrap}>
              <Text style={styles.cardTitle}>{card.title}</Text>
              <Text style={styles.cardSample} numberOfLines={2}>
                {card.sample}
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 20,
    paddingTop: 56,
    paddingBottom: 8,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pageTitle: {
    color: COLORS.text,
    fontFamily: FONT_FAMILY.bold,
    fontSize: 22,
  },
  pageSub: {
    color: COLORS.textSecondary,
    fontFamily: FONT_FAMILY.regular,
    fontSize: 13,
    marginBottom: 16,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 60,
    gap: 12,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: COLORS.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 14,
    ...SHADOWS.level1,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTextWrap: {
    flex: 1,
  },
  cardTitle: {
    color: COLORS.text,
    fontFamily: FONT_FAMILY.semiBold,
    fontSize: 14,
    marginBottom: 2,
  },
  cardSample: {
    color: COLORS.textSecondary,
    fontFamily: FONT_FAMILY.regular,
    fontSize: 12,
  },
});
