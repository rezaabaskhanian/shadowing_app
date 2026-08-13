import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { BookOpen, Mic, X } from 'lucide-react-native';
import { useNotifications } from '../data/NotificationContext';
import { COLORS } from '../theme/colors';
import { FONT_FAMILY } from '../theme/typography';
import { SHADOWS } from '../theme/elevation';
import { useLanguage } from '../data/i18n';

export const NotificationBanner: React.FC = () => {
  const { activeBanner, dismissBanner } = useNotifications();
  const { t } = useLanguage();

  if (!activeBanner) return null;

  return (
    <View style={styles.container}>
      <View style={styles.bannerCard}>
        {/* Header Row */}
        <View style={styles.headerRow}>
          <View style={styles.iconWrap}>
            {activeBanner.type === 'leitner' ? (
              <BookOpen color={COLORS.secondary} size={18} />
            ) : (
              <Mic color={COLORS.tertiary} size={18} />
            )}
          </View>
          <View style={styles.titleWrap}>
            <Text style={styles.bannerTitle}>{activeBanner.title}</Text>
            {activeBanner.sourceLabel && (
              <Text style={styles.sourceBadge}>{activeBanner.sourceLabel}</Text>
            )}
          </View>
          <TouchableOpacity style={styles.closeBtn} onPress={dismissBanner}>
            <X color={COLORS.textSecondary} size={18} />
          </TouchableOpacity>
        </View>

        {/* Content Body */}
        <Text style={styles.bodyText}>{activeBanner.body}</Text>
        {activeBanner.translation && (
          <Text style={styles.translationText}>{activeBanner.translation}</Text>
        )}

        {/* Action Button */}
        <TouchableOpacity style={styles.actionBtn} onPress={dismissBanner}>
          <Text style={styles.actionBtnText}>{t('viewContent')}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 50,
    left: 16,
    right: 16,
    zIndex: 9999,
  },
  bannerCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    ...SHADOWS.level2,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  titleWrap: {
    flex: 1,
  },
  bannerTitle: {
    color: COLORS.text,
    fontFamily: FONT_FAMILY.bold,
    fontSize: 13,
  },
  sourceBadge: {
    color: COLORS.primary,
    fontFamily: FONT_FAMILY.semiBold,
    fontSize: 10,
    marginTop: 2,
  },
  closeBtn: {
    padding: 4,
  },
  bodyText: {
    color: COLORS.text,
    fontFamily: FONT_FAMILY.bold,
    fontSize: 15,
    marginBottom: 4,
    lineHeight: 20,
  },
  translationText: {
    color: COLORS.textSecondary,
    fontFamily: FONT_FAMILY.regular,
    fontSize: 13,
    marginBottom: 12,
    fontStyle: 'italic',
  },
  actionBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionBtnText: {
    color: COLORS.white,
    fontFamily: FONT_FAMILY.bold,
    fontSize: 13,
  },
});
