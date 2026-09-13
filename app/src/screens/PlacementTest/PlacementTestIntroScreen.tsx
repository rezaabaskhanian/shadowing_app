import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Mic, CircleCheck } from 'lucide-react-native';

import { COLORS, SPACING, BORDER_RADIUS } from '../../theme/colors';
import { FONT_FAMILY, TEXT_STYLES } from '../../theme/typography';
import { SHADOWS } from '../../theme/elevation';
import { useLanguage } from '../../data/i18n';

interface PlacementTestIntroScreenProps {
  onStart: () => void;
  onSkip: () => void;
}

/**
 * معرفیِ تست تعیین سطح گفتاری، قبل از شروع ضبط سه آیتم. کاربر می‌تواند
 * همین‌جا رد کند (فعلاً) و بعداً از کارتِ صفحه‌ی خانه دوباره امتحان کند.
 */
export const PlacementTestIntroScreen: React.FC<PlacementTestIntroScreenProps> = ({
  onStart,
  onSkip,
}) => {
  const { t } = useLanguage();
  const insets = useSafeAreaInsets();

  const bullets = [
    t('placementIntroBullet1'),
    t('placementIntroBullet2'),
    t('placementIntroBullet3'),
  ];

  return (
    <View style={[styles.container, { paddingTop: insets.top + SPACING.xl, paddingBottom: insets.bottom + SPACING.l }]}>
      <View style={styles.content}>
        <View style={styles.iconCircle}>
          <Mic size={36} color={COLORS.primary} />
        </View>

        <Text style={styles.title}>{t('placementIntroTitle')}</Text>
        <Text style={styles.body}>{t('placementIntroBody')}</Text>

        <View style={styles.bulletList}>
          {bullets.map((bullet, index) => (
            <View key={index} style={styles.bulletRow}>
              <CircleCheck size={18} color={COLORS.tertiary} />
              <Text style={styles.bulletText}>{bullet}</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.startBtn} onPress={onStart} activeOpacity={0.85}>
          <Text style={styles.startBtnText}>{t('placementStartBtn')}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.skipBtn} onPress={onSkip} activeOpacity={0.7}>
          <Text style={styles.skipBtnText}>{t('placementSkipBtn')}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    paddingHorizontal: SPACING.l,
    justifyContent: 'space-between',
  },
  content: {
    alignItems: 'center',
    marginTop: SPACING.xl,
  },
  iconCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.l,
  },
  title: {
    ...TEXT_STYLES.headlineMd,
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: SPACING.s,
  },
  body: {
    ...TEXT_STYLES.bodyMd,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: SPACING.l,
  },
  bulletList: {
    alignSelf: 'stretch',
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.l,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.m,
    gap: SPACING.s,
    ...SHADOWS.level1,
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.s,
  },
  bulletText: {
    ...TEXT_STYLES.bodyMd,
    color: COLORS.text,
    flex: 1,
  },
  footer: {
    gap: SPACING.s,
  },
  startBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.l,
    paddingVertical: SPACING.m,
    alignItems: 'center',
  },
  startBtnText: {
    color: COLORS.white,
    fontFamily: FONT_FAMILY.bold,
    fontSize: 16,
  },
  skipBtn: {
    paddingVertical: SPACING.s,
    alignItems: 'center',
  },
  skipBtnText: {
    color: COLORS.textSecondary,
    fontFamily: FONT_FAMILY.medium,
    fontSize: 14,
  },
});
