import React, { useCallback, useState } from 'react';
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
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Copy,
  Mail,
  MessageCircleMore,
  MessageCircleReply,
  Send,
} from 'lucide-react-native';

import { COLORS } from '../../theme/colors';
import { GradientFill } from '../../components/GradientFill';
import { FONT_FAMILY } from '../../theme/typography';
import { useLanguage } from '../../data/i18n';
import { createFeedback, getMyReplies, type SupportReply } from '../../api/feedback';

const SUPPORT_EMAIL = 'rezaabaskhanian1367kash@gmail.com';

/** سقفِ طولِ پیام؛ شمارنده‌ی زیرِ کادر همین را نشان می‌دهد. */
const MAX_MESSAGE = 500;

const PrimaryButton = ({
  label,
  onPress,
  busy,
  icon,
}: {
  label: string;
  onPress: () => void;
  busy?: boolean;
  icon?: React.ReactNode;
}) => (
  <TouchableOpacity style={styles.mailBtn} onPress={onPress} disabled={busy} activeOpacity={0.85}>
    <GradientFill from="#E8572F" to="#D9542F" horizontal />
    {busy ? (
      <ActivityIndicator color={COLORS.white} />
    ) : (
      <>
        {icon}
        <Text style={styles.mailBtnText}>{label}</Text>
      </>
    )}
  </TouchableOpacity>
);

// دراور قبلاً یک ردیف جدای «پیشنهادات و انتقادات» هم داشت؛ چون هر دو در نهایت
// یک راه ارتباطی با تیم‌اند، اینجا زیر همین صفحه یکی شدند.
export const ContactUsScreen = () => {
  const navigation = useNavigation<any>();
  const { t, language } = useLanguage();
  const [copied, setCopied] = useState(false);

  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [feedbackError, setFeedbackError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [replies, setReplies] = useState<SupportReply[]>([]);

  // جواب‌های ادمین (از ربات تلگرام/بله یا پنل) هر بار که صفحه باز می‌شود؛ اگر
  // نوتیف جواب نرسیده باشد، کاربر اینجا می‌بیندش.
  useFocusEffect(
    useCallback(() => {
      getMyReplies()
        .then(setReplies)
        .catch(() => {});
    }, [])
  );

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

  const rtl = language === 'fa';
  const row = rtl && styles.rowReverse;
  const align = rtl && styles.textRight;

  return (
    <View style={styles.screen}>
      <View style={[styles.topBar, row]}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          {rtl ? <ChevronRight color={COLORS.text} size={22} /> : <ChevronLeft color={COLORS.text} size={22} />}
        </TouchableOpacity>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{t('faqSupportBadge')}</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={[styles.titleRow, row]}>
          <Text style={styles.title}>{t('contactUsTitle')}</Text>
          <MessageCircleMore color={COLORS.muted} size={22} />
        </View>
        <Text style={[styles.sub, align]}>{t('contactUsSub')}</Text>

        {replies.length > 0 && (
          <View style={styles.repliesBox}>
            <Text style={[styles.sectionTitle, align]}>{t('supportRepliesTitle')}</Text>
            {replies.map((r) => (
              <View key={r.id} style={styles.replyCard}>
                <View style={[styles.replyHeader, row]}>
                  <MessageCircleReply color={COLORS.primary} size={16} />
                  <Text style={[styles.replyKind, align]}>{t(`supportReplyKind_${r.kind}`)}</Text>
                  <Text style={styles.replyDate}>{new Date(r.created_at).toLocaleDateString('fa-IR')}</Text>
                </View>
                {!!r.original && (
                  <Text style={[styles.replyOriginal, align]} numberOfLines={3}>
                    «{r.original}»
                  </Text>
                )}
                <Text style={[styles.replyText, align]}>{r.reply}</Text>
              </View>
            ))}
          </View>
        )}

        <View style={[styles.card, row]}>
          <View style={styles.iconWrap}>
            <Mail color={COLORS.info} size={20} />
          </View>
          <View style={styles.flex1}>
            <Text style={[styles.emailLabel, align]}>{t('contactUsEmailLabel')}</Text>
            <Text style={[styles.emailValue, align]} numberOfLines={1}>
              {SUPPORT_EMAIL}
            </Text>
          </View>
          <TouchableOpacity style={[styles.copyBtn, row]} onPress={handleCopy}>
            <Text style={styles.copyBtnText}>{copied ? t('contactUsCopied') : t('contactUsCopy')}</Text>
            <Copy color={COLORS.primary} size={14} />
          </TouchableOpacity>
        </View>

        <PrimaryButton
          label={t('contactUsOpenEmail')}
          icon={<Mail color={COLORS.white} size={18} />}
          onPress={() => Linking.openURL(`mailto:${SUPPORT_EMAIL}`)}
        />

        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>{t('contactUsDirectDivider')}</Text>
          <View style={styles.dividerLine} />
        </View>

        <Text style={[styles.sectionTitle, align]}>{t('feedbackTitle')}</Text>
        <Text style={[styles.sub, styles.feedbackSub, align]}>{t('feedbackNote')}</Text>

        {sent ? (
          <View style={styles.successContainer}>
            <CheckCircle2 color={COLORS.tertiary} size={28} />
            <Text style={styles.successText}>{t('feedbackSuccess')}</Text>
            <View style={styles.successBtn}>
              <PrimaryButton label={t('feedbackSubmit')} onPress={() => setSent(false)} />
            </View>
          </View>
        ) : (
          <>
            <View style={styles.inputBox}>
              <TextInput
                style={[styles.input, align]}
                placeholder={t('feedbackPlaceholder')}
                placeholderTextColor="#A8A6A0"
                value={message}
                onChangeText={setMessage}
                maxLength={MAX_MESSAGE}
                multiline
                numberOfLines={6}
              />
              <Text style={[styles.counter, align]}>
                {message.length.toLocaleString(rtl ? 'fa-IR' : 'en-US')} / {MAX_MESSAGE.toLocaleString(rtl ? 'fa-IR' : 'en-US')}
              </Text>
            </View>

            {feedbackError ? <Text style={[styles.errorText, align]}>{feedbackError}</Text> : null}

            <PrimaryButton
              label={t('feedbackSubmit')}
              icon={<Send color={COLORS.white} size={17} />}
              onPress={handleSubmitFeedback}
              busy={submitting}
            />
          </>
        )}
      </ScrollView>
    </View>
  );
};

const PAGE_BG = '#FAF8F4';
const SOFT_BG = '#F3F1EC';
const SOFT_BORDER = '#E9E6DF';

const styles = StyleSheet.create({
  rowReverse: { flexDirection: 'row-reverse' },
  flex1: { flex: 1 },
  textRight: { textAlign: 'right' },
  repliesBox: { marginBottom: 20 },
  replyCard: {
    backgroundColor: COLORS.white,
    borderRadius: 18,
    padding: 14,
    marginTop: 10,
    borderWidth: 1,
    borderColor: SOFT_BORDER,
  },
  replyHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
  replyKind: { color: COLORS.primary, fontFamily: FONT_FAMILY.semiBold, fontSize: 13, flex: 1 },
  replyDate: { color: COLORS.muted, fontFamily: FONT_FAMILY.regular, fontSize: 12 },
  replyOriginal: { color: COLORS.textSecondary, fontFamily: FONT_FAMILY.regular, fontSize: 13, marginBottom: 6 },
  replyText: { color: COLORS.text, fontFamily: FONT_FAMILY.regular, fontSize: 15, lineHeight: 24 },
  screen: { flex: 1, backgroundColor: PAGE_BG, paddingTop: 48, paddingHorizontal: 20 },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 },
  badge: { backgroundColor: COLORS.primaryLight, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 5 },
  badgeText: { color: COLORS.primaryDark, fontFamily: FONT_FAMILY.semiBold, fontSize: 11, letterSpacing: 0.5 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: SOFT_BORDER,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: { paddingBottom: 40 },
  title: { color: COLORS.text, fontFamily: FONT_FAMILY.bold, fontSize: 26 },
  sub: { color: COLORS.textSecondary, fontFamily: FONT_FAMILY.regular, fontSize: 13, lineHeight: 22, marginBottom: 22 },
  feedbackSub: { marginBottom: 18 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: COLORS.white,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: SOFT_BORDER,
    padding: 14,
    marginBottom: 14,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: COLORS.infoLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emailLabel: { color: COLORS.textSecondary, fontFamily: FONT_FAMILY.medium, fontSize: 11 },
  emailValue: { color: COLORS.text, fontFamily: FONT_FAMILY.bold, fontSize: 13, marginTop: 2 },
  copyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 12,
    backgroundColor: SOFT_BG,
  },
  copyBtnText: { color: COLORS.text, fontFamily: FONT_FAMILY.semiBold, fontSize: 12 },
  mailBtn: {
    borderRadius: 18,
    height: 52,
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    backgroundColor: '#E8572F',
  },
  mailBtnText: { color: COLORS.white, fontFamily: FONT_FAMILY.bold, fontSize: 14 },
  divider: { flexDirection: 'row', alignItems: 'center', gap: 10, marginVertical: 26 },
  dividerLine: { flex: 1, height: 1, backgroundColor: SOFT_BORDER },
  dividerText: { color: COLORS.muted, fontFamily: FONT_FAMILY.regular, fontSize: 11 },
  sectionTitle: { color: COLORS.text, fontFamily: FONT_FAMILY.bold, fontSize: 18, marginBottom: 8 },
  inputBox: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: SOFT_BORDER,
    padding: 16,
    marginBottom: 26,
  },
  input: {
    color: COLORS.text,
    fontFamily: FONT_FAMILY.regular,
    fontSize: 14,
    minHeight: 120,
    textAlignVertical: 'top',
    padding: 0,
  },
  counter: {
    color: COLORS.muted,
    fontFamily: FONT_FAMILY.regular,
    fontSize: 11,
    borderTopWidth: 1,
    borderTopColor: SOFT_BORDER,
    paddingTop: 8,
    marginTop: 8,
  },
  errorText: { color: COLORS.error, fontFamily: FONT_FAMILY.medium, fontSize: 12, marginTop: -16, marginBottom: 12 },
  successContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 24,
    padding: 28,
    borderWidth: 1,
    borderColor: SOFT_BORDER,
    gap: 12,
  },
  successBtn: { alignSelf: 'stretch' },
  successText: { color: COLORS.text, fontFamily: FONT_FAMILY.medium, fontSize: 14, textAlign: 'center' },
});
