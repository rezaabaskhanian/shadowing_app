import React, { useState } from 'react';
import { Linking, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { ArrowLeft, Copy, Mail } from 'lucide-react-native';

import { COLORS, BORDER_RADIUS } from '../../theme/colors';
import { FONT_FAMILY } from '../../theme/typography';
import { useLanguage } from '../../data/i18n';

// TODO: placeholder — no real support channel exists anywhere in the codebase yet.
const SUPPORT_EMAIL = 'support@example.com';

export const ContactUsScreen = () => {
  const navigation = useNavigation<any>();
  const { t } = useLanguage();
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    // بدون افزودن وابستگی جدید (مثل clipboard) کپی واقعی ممکن نیست؛ فعلاً
    // فقط بازخورد بصری می‌دهیم و اپ ایمیل را باز می‌کنیم.
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <View style={styles.screen}>
      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
        <ArrowLeft color={COLORS.text} size={22} />
      </TouchableOpacity>

      <View style={styles.content}>
        <Text style={styles.title}>{t('contactUsTitle')}</Text>
        <Text style={styles.sub}>{t('contactUsSub')}</Text>

        <View style={styles.card}>
          <View style={styles.iconWrap}>
            <Mail color={COLORS.primary} size={22} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.emailLabel}>{t('contactUsEmailLabel')}</Text>
            <Text style={styles.emailValue}>{SUPPORT_EMAIL}</Text>
          </View>
          <TouchableOpacity style={styles.copyBtn} onPress={handleCopy}>
            <Copy color={COLORS.primary} size={16} />
            <Text style={styles.copyBtnText}>{copied ? t('contactUsCopied') : t('contactUsCopy')}</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.mailBtn}
          onPress={() => Linking.openURL(`mailto:${SUPPORT_EMAIL}`)}
          activeOpacity={0.85}
        >
          <Text style={styles.mailBtnText}>{t('contactUsOpenEmail')}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.background,
    paddingTop: 54,
    paddingHorizontal: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  content: {
    flex: 1,
  },
  title: {
    color: COLORS.text,
    fontFamily: FONT_FAMILY.bold,
    fontSize: 24,
    marginBottom: 6,
  },
  sub: {
    color: COLORS.textSecondary,
    fontFamily: FONT_FAMILY.regular,
    fontSize: 14,
    marginBottom: 24,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.xl,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 16,
    marginBottom: 16,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emailLabel: {
    color: COLORS.textSecondary,
    fontFamily: FONT_FAMILY.medium,
    fontSize: 12,
  },
  emailValue: {
    color: COLORS.text,
    fontFamily: FONT_FAMILY.bold,
    fontSize: 14,
    marginTop: 2,
  },
  copyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: COLORS.primaryLight,
  },
  copyBtnText: {
    color: COLORS.primary,
    fontFamily: FONT_FAMILY.semiBold,
    fontSize: 12,
  },
  mailBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 16,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mailBtnText: {
    color: COLORS.white,
    fontFamily: FONT_FAMILY.bold,
    fontSize: 14,
  },
});
