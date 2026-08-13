import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { ArrowLeft, CheckCircle2, Clock, Plus, XCircle } from 'lucide-react-native';
import { COLORS, BORDER_RADIUS } from '../theme/colors';
import { FONT_FAMILY } from '../theme/typography';
import { useLanguage } from '../data/i18n';
import { listMySceneSubmissions, SceneSubmission } from '../api/submissions';

const statusMeta = (status: SceneSubmission['status']) => {
  switch (status) {
    case 'approved':
      return { color: COLORS.tertiary, icon: CheckCircle2, key: 'statusApproved' as const };
    case 'rejected':
      return { color: COLORS.error, icon: XCircle, key: 'statusRejected' as const };
    default:
      return { color: COLORS.secondary, icon: Clock, key: 'statusPending' as const };
  }
};

export const MySubmissionsScreen = () => {
  const navigation = useNavigation<any>();
  const { t } = useLanguage();
  const [submissions, setSubmissions] = useState<SceneSubmission[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      setLoading(true);
      listMySceneSubmissions()
        .then((list) => active && setSubmissions(list))
        .catch(() => active && setSubmissions([]))
        .finally(() => active && setLoading(false));
      return () => {
        active = false;
      };
    }, [])
  );

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <ArrowLeft color={COLORS.text} size={22} />
        </TouchableOpacity>

        <View style={styles.headerRow}>
          <Text style={styles.title}>{t('mySubmissionsTitle')}</Text>
          <TouchableOpacity
            style={styles.ctaBtn}
            onPress={() => navigation.navigate('SubmitScene')}
          >
            <Plus color={COLORS.white} size={16} />
            <Text style={styles.ctaBtnText}>{t('mySubmissionsCta')}</Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <ActivityIndicator color={COLORS.primary} style={{ marginTop: 40 }} />
        ) : submissions.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>{t('mySubmissionsEmpty')}</Text>
          </View>
        ) : (
          submissions.map((s) => {
            const meta = statusMeta(s.status);
            const Icon = meta.icon;
            return (
              <View key={s.id} style={styles.card}>
                <View style={styles.cardHeaderRow}>
                  <Text style={styles.situationText} numberOfLines={2}>
                    {s.situation_text}
                  </Text>
                  <View style={[styles.statusBadge, { borderColor: meta.color }]}>
                    <Icon color={meta.color} size={12} />
                    <Text style={[styles.statusText, { color: meta.color }]}>{t(meta.key)}</Text>
                  </View>
                </View>
                {s.status === 'approved' && s.points_awarded ? (
                  <Text style={styles.pointsText}>
                    +{s.points_awarded} {t('pointsEarned')}
                  </Text>
                ) : null}
                {s.status === 'rejected' && s.admin_note ? (
                  <Text style={styles.noteText}>{s.admin_note}</Text>
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
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  title: {
    color: COLORS.text,
    fontFamily: FONT_FAMILY.bold,
    fontSize: 24,
  },
  ctaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.primary,
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  ctaBtnText: {
    color: COLORS.white,
    fontFamily: FONT_FAMILY.semiBold,
    fontSize: 12,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 24,
    padding: 32,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginTop: 12,
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
  situationText: {
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
  pointsText: {
    color: COLORS.tertiary,
    fontFamily: FONT_FAMILY.bold,
    fontSize: 13,
    marginTop: 8,
  },
  noteText: {
    color: COLORS.textSecondary,
    fontFamily: FONT_FAMILY.regular,
    fontSize: 12,
    marginTop: 8,
    fontStyle: 'italic',
  },
});
