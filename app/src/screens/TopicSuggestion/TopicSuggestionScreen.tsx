import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { ArrowLeft, ArrowRight, CheckCircle2, Clock, Lightbulb, XCircle } from 'lucide-react-native';

import { COLORS } from '../../theme/colors';
import { FONT_FAMILY } from '../../theme/typography';
import { useLanguage } from '../../data/i18n';
import {
  createTopicSuggestion,
  listMyTopicSuggestions,
  type TopicSuggestion,
} from '../../api/topicSuggestions';

const statusMeta = (status: TopicSuggestion['status']) => {
  switch (status) {
    case 'approved':
      return { color: COLORS.tertiary, icon: CheckCircle2, key: 'statusApproved' as const };
    case 'rejected':
      return { color: COLORS.error, icon: XCircle, key: 'statusRejected' as const };
    default:
      return { color: COLORS.warningDeep, icon: Clock, key: 'statusPending' as const };
  }
};

export const TopicSuggestionScreen = () => {
  const navigation = useNavigation<any>();
  const { t, language } = useLanguage();
  // فارسی: دکمه‌ی برگشت و آیکون سمت راست، متن‌ها راست‌چین.
  const rtl = language === 'fa';
  const ta = rtl ? styles.textRight : styles.textLeft;

  const [topicText, setTopicText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [suggestions, setSuggestions] = useState<TopicSuggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadSuggestions = useCallback(() => {
    let active = true;
    setLoading(true);
    listMyTopicSuggestions()
      .then((list) => active && setSuggestions(list))
      .catch(() => active && setSuggestions([]))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, []);

  useFocusEffect(useCallback(() => loadSuggestions(), [loadSuggestions]));

  const handleSubmit = async () => {
    if (!topicText.trim()) {
      setError(t('topicSuggestionFillField'));
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      await createTopicSuggestion(topicText.trim());
      setTopicText('');
      loadSuggestions();
    } catch {
      setError(t('topicSuggestionFillField'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <TouchableOpacity style={[styles.backButton, rtl && styles.selfEnd]} onPress={() => navigation.goBack()}>
          {rtl ? <ArrowRight color={COLORS.text} size={20} /> : <ArrowLeft color={COLORS.text} size={20} />}
        </TouchableOpacity>

        <View style={[styles.iconWrap, rtl && styles.selfEnd]}>
          <Lightbulb color={COLORS.primary} size={22} />
        </View>
        <Text style={[styles.title, ta]}>{t('topicSuggestionTitle')}</Text>
        <Text style={[styles.note, ta]}>{t('topicSuggestionNote')}</Text>

        <TextInput
          style={[styles.input, ta]}
          placeholder={t('topicSuggestionPlaceholder')}
          placeholderTextColor={COLORS.muted}
          value={topicText}
          onChangeText={setTopicText}
          multiline
          numberOfLines={4}
        />

        {error ? <Text style={[styles.errorText, ta]}>{error}</Text> : null}

        <TouchableOpacity
          style={styles.submitBtn}
          onPress={handleSubmit}
          disabled={submitting}
          activeOpacity={0.85}
        >
          {submitting ? (
            <ActivityIndicator color={COLORS.white} />
          ) : (
            <Text style={styles.submitBtnText}>{t('topicSuggestionSubmit')}</Text>
          )}
        </TouchableOpacity>

        <Text style={[styles.mineTitle, ta]}>{t('topicSuggestionMineTitle')}</Text>

        {loading ? (
          <ActivityIndicator color={COLORS.primary} style={{ marginTop: 20 }} />
        ) : suggestions.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>{t('topicSuggestionEmpty')}</Text>
          </View>
        ) : (
          suggestions.map((s) => {
            const meta = statusMeta(s.status);
            const Icon = meta.icon;
            return (
              <View key={s.id} style={styles.card}>
                <View style={[styles.cardHeaderRow, rtl && styles.rowReverse]}>
                  <Text style={[styles.topicText, ta]} numberOfLines={3}>
                    {s.topic_text}
                  </Text>
                  <View style={[styles.statusBadge, { borderColor: meta.color }]}>
                    <Icon color={meta.color} size={12} />
                    <Text style={[styles.statusText, { color: meta.color }]}>{t(meta.key)}</Text>
                  </View>
                </View>
                {s.status === 'rejected' && s.admin_note ? (
                  <Text style={styles.adminNote}>{s.admin_note}</Text>
                ) : null}
              </View>
            );
          })
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  rowReverse: { flexDirection: 'row-reverse' },
  textRight: { textAlign: 'right' },
  textLeft: { textAlign: 'left' },
  selfEnd: { alignSelf: 'flex-end' },

  screen: { flex: 1, backgroundColor: COLORS.white },
  content: {
    paddingHorizontal: 20,
    paddingTop: 54,
    paddingBottom: 60,
  },
  backButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#F2F2F5', alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  iconWrap: { width: 46, height: 46, borderRadius: 23, backgroundColor: '#FFEFE6', alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  title: {
    color: COLORS.text,
    fontFamily: FONT_FAMILY.bold,
    fontSize: 24,
    marginBottom: 6,
  },
  note: {
    color: COLORS.textSecondary,
    fontFamily: FONT_FAMILY.regular,
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 18,
  },
  input: { backgroundColor: '#F7F6F2', borderWidth: 1, borderColor: '#ECEAE4', borderRadius: 16, padding: 14, color: COLORS.text, fontFamily: FONT_FAMILY.regular, fontSize: 14, minHeight: 110, textAlignVertical: 'top' },
  errorText: {
    color: COLORS.error,
    fontFamily: FONT_FAMILY.medium,
    fontSize: 12,
    marginTop: 8,
  },
  submitBtn: { backgroundColor: '#E2643A', borderRadius: 16, height: 50, alignItems: 'center', justifyContent: 'center', marginTop: 16, marginBottom: 28 },
  submitBtnText: {
    color: COLORS.white,
    fontFamily: FONT_FAMILY.bold,
    fontSize: 14,
  },
  mineTitle: {
    color: COLORS.text,
    fontFamily: FONT_FAMILY.bold,
    fontSize: 16,
    marginBottom: 12,
  },
  emptyContainer: { alignItems: 'center', justifyContent: 'center', backgroundColor: '#F7F6F2', borderWidth: 1, borderColor: '#ECEAE4', borderRadius: 16, padding: 28 },
  emptyText: { color: COLORS.muted, fontFamily: FONT_FAMILY.regular, fontSize: 13, textAlign: 'center' },
  card: { backgroundColor: '#F7F6F2', borderWidth: 1, borderColor: '#ECEAE4', borderRadius: 16, padding: 16, marginBottom: 12 },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  topicText: {
    flex: 1,
    color: COLORS.text,
    fontFamily: FONT_FAMILY.semiBold,
    fontSize: 14,
    lineHeight: 20,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  statusText: {
    fontFamily: FONT_FAMILY.semiBold,
    fontSize: 11,
  },
  adminNote: {
    color: COLORS.textSecondary,
    fontFamily: FONT_FAMILY.regular,
    fontSize: 12,
    marginTop: 8,
    fontStyle: 'italic',
  },
});
