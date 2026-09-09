import React, { useState } from 'react';
import {
  ActivityIndicator,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { ArrowLeft, CheckCircle2, Copy, Mail } from 'lucide-react-native';

import { COLORS, BORDER_RADIUS } from '../../theme/colors';
import { FONT_FAMILY } from '../../theme/typography';
import { useLanguage } from '../../data/i18n';
import { createFeedback } from '../../api/feedback';

// TODO: placeholder — no real support channel exists anywhere in the codebase yet.
const SUPPORT_EMAIL = 'support@example.com';

// دراور قبلاً یک ردیف جدای «پیشنهادات و انتقادات» هم داشت؛ چون هر دو در نهایت
// یک راه ارتباطی با تیم‌اند، اینجا زیر همین صفحه یکی شدند.
export const ContactUsScreen = () => {
  const navigation = useNavigation<any>();
  const { t } = useLanguage();
  const [copied, setCopied] = useState(false);

  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [feedbackError, setFeedbackError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const handleCopy = () => {
    // بدون افزودن وابستگی جدید (مثل clipboard) کپی واقعی ممکن نیست؛ فعلاً
    // فقط بازخورد بصری می‌دهیم و اپ ایمیل را باز می‌کنیم.
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const handleSubmitFeedback = async () => {
    if (!message.trim()) {
      setFeedbackError(t('feedbackFillField'));
      return;
    }
    setFeedbackError(null);
    setSubmitting(true);
    try {
      await createFeedback(message.trim());
      setMessage('');
      setSent(true);
    } catch {
      setFeedbackError(t('feedbackFillField'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.screen}>
      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
        <ArrowLeft color={COLORS.text} size={22} />
      </TouchableOpacity>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>{t('contactUsTitle')}</Text>
        <Text style={styles.sub}>{t('contactUsSub')}</Text>

        <View style={styles.card}>
          <View style={[styles.iconWrap, { backgroundColor: COLORS.infoLight }]}>
            <Mail color={COLORS.info} size={22} />
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

        <View style={styles.dividerLine} />

        <Text style={styles.sectionTitle}>{t('feedbackTitle')}</Text>
        <Text style={styles.sub}>{t('feedbackNote')}</Text>

        {sent ? (
          <View style={styles.successContainer}>
            <CheckCircle2 color={COLORS.tertiary} size={28} />
            <Text style={styles.successText}>{t('feedbackSuccess')}</Text>
            <TouchableOpacity style={styles.mailBtn} onPress={() => setSent(false)}>
              <Text style={styles.mailBtnText}>{t('feedbackSubmit')}</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <TextInput
              style={styles.input}
              placeholder={t('feedbackPlaceholder')}
              placeholderTextColor={COLORS.muted}
              value={message}
              onChangeText={setMessage}
              multiline
              numberOfLines={6}
            />

            {feedbackError ? <Text style={styles.errorText}>{feedbackError}</Text> : null}

            <TouchableOpacity
              style={styles.mailBtn}
              onPress={handleSubmitFeedback}
              disabled={submitting}
              activeOpacity={0.85}
            >
              {submitting ? (
                <ActivityIndicator color={COLORS.white} />
              ) : (
                <Text style={styles.mailBtnText}>{t('feedbackSubmit')}</Text>
              )}
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
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
    paddingBottom: 40,
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
  dividerLine: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: 24,
  },
  sectionTitle: {
    color: COLORS.text,
    fontFamily: FONT_FAMILY.bold,
    fontSize: 18,
    marginBottom: 6,
  },
  input: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.l,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 14,
    color: COLORS.text,
    fontFamily: FONT_FAMILY.regular,
    fontSize: 14,
    minHeight: 140,
    textAlignVertical: 'top',
    marginBottom: 14,
  },
  errorText: {
    color: COLORS.error,
    fontFamily: FONT_FAMILY.medium,
    fontSize: 12,
    marginBottom: 8,
  },
  successContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 24,
    padding: 32,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 12,
  },
  successText: {
    color: COLORS.text,
    fontFamily: FONT_FAMILY.medium,
    fontSize: 14,
    textAlign: 'center',
  },
});
