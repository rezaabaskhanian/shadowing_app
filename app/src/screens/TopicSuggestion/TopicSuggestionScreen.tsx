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
import { ArrowLeft, CheckCircle2, Clock, XCircle } from 'lucide-react-native';

import { COLORS, BORDER_RADIUS } from '../../theme/colors';
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
      return { color: COLORS.secondary, icon: Clock, key: 'statusPending' as const };
  }
};

export const TopicSuggestionScreen = () => {
  const navigation = useNavigation<any>();
  const { t } = useLanguage();

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
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <ArrowLeft color={COLORS.text} size={22} />
        </TouchableOpacity>

        <Text style={styles.title}>{t('topicSuggestionTitle')}</Text>
        <Text style={styles.note}>{t('topicSuggestionNote')}</Text>

        <TextInput
          style={styles.input}
          placeholder={t('topicSuggestionPlaceholder')}
          placeholderTextColor={COLORS.muted}
          value={topicText}
          onChangeText={setTopicText}
          multiline
          numberOfLines={4}
        />

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

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

        <Text style={styles.mineTitle}>{t('topicSuggestionMineTitle')}</Text>

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
                <View style={styles.cardHeaderRow}>
                  <Text style={styles.topicText} numberOfLines={3}>
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
  screen: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 54,
    paddingBottom: 60,
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
  input: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.l,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 14,
    color: COLORS.text,
    fontFamily: FONT_FAMILY.regular,
    fontSize: 14,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  errorText: {
    color: COLORS.error,
    fontFamily: FONT_FAMILY.medium,
    fontSize: 12,
    marginTop: 8,
  },
  submitBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 16,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 14,
    marginBottom: 28,
  },
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
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 24,
    padding: 32,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  emptyText: {
    color: COLORS.textSecondary,
    fontFamily: FONT_FAMILY.regular,
    fontSize: 14,
    textAlign: 'center',
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.l,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 16,
    marginBottom: 12,
  },
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
