import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { Award, ArrowLeft, Clock, EyeOff, Flame, Mic, Sparkles, Target } from 'lucide-react-native';

import { COLORS, BORDER_RADIUS } from '../../theme/colors';
import { FONT_FAMILY } from '../../theme/typography';
import { useLanguage } from '../../data/i18n';
import {
  getHabitHistory,
  getTodayMission,
  startMission,
  type HabitHistory,
  type HabitMission,
} from '../../api/habit';

/** مدت به ثانیه را به «Xm Ys» تبدیل می‌کند. */
const formatDuration = (totalSeconds: number) => {
  const m = Math.floor(totalSeconds / 60);
  const s = Math.round(totalSeconds % 60);
  return `${m}m ${s}s`;
};

export const LanguageHabitScreen = () => {
  const navigation = useNavigation<any>();
  const { t, language } = useLanguage();

  const [mission, setMission] = useState<HabitMission | null>(null);
  const [history, setHistory] = useState<HabitHistory | null>(null);
  const [loading, setLoading] = useState(true);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [starting, setStarting] = useState(false);

  const load = useCallback(() => {
    let active = true;
    setLoading(true);
    Promise.all([getTodayMission(), getHabitHistory()])
      .then(([m, h]) => {
        if (!active) return;
        setMission(m);
        setHistory(h);
      })
      .catch(() => {
        if (!active) return;
        setMission(null);
        setHistory(null);
      })
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, []);

  useFocusEffect(useCallback(() => load(), [load]));

  useEffect(() => {
    if (countdown === null) return;
    if (countdown <= 0) {
      setCountdown(null);
      confirmStart();
      return;
    }
    const timer = setTimeout(() => setCountdown((c) => (c ?? 1) - 1), 800);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [countdown]);

  const confirmStart = async () => {
    if (!mission) return;
    setStarting(true);
    try {
      await startMission(mission.mission_id);
      navigation.navigate('HabitMissionPractice', {
        missionId: mission.mission_id,
        missionType: mission.mission_type,
        activity: mission.activity,
        dialogueLines: mission.dialogues,
      });
    } catch {
      // اگر شروع ماموریت ناموفق بود همینجا می‌مانیم؛ کاربر می‌تواند دوباره بزند.
    } finally {
      setStarting(false);
    }
  };

  const activityName = (name: { name_en: string; name_fa: string } | undefined) =>
    !name ? '' : language === 'fa' ? name.name_fa : name.name_en;

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <ArrowLeft color={COLORS.text} size={22} />
        </TouchableOpacity>

        <Text style={styles.title}>{t('habitScreenTitle')}</Text>

        {loading ? (
          <ActivityIndicator color={COLORS.primary} style={{ marginTop: 40 }} />
        ) : (
          <>
            {mission ? (
              <View style={styles.missionCard}>
                <View style={styles.missionHeaderRow}>
                  <View style={styles.activityIconWrap}>
                    <Text style={styles.activityIconText}>{mission.activity?.icon || '🎯'}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.missionKicker}>{t('habitMissionKicker')}</Text>
                    <Text style={styles.missionActivityName}>{activityName(mission.activity)}</Text>
                  </View>
                </View>

                <Text style={styles.missionSentence}>
                  {t('habitPracticeWhile')} {activityName(mission.activity).toLowerCase()}
                </Text>

                <Text style={styles.missionPurpose}>{t('habitPurposeText')}</Text>

                <View style={styles.missionMetaRow}>
                  <View style={styles.missionMetaItem}>
                    <Target color={COLORS.primary} size={14} />
                    <Text style={styles.missionMetaText}>
                      {mission.dialogues?.length || 0} {t('sentences')}
                    </Text>
                  </View>
                  <View style={styles.missionMetaItem}>
                    <Clock color={COLORS.primary} size={14} />
                    <Text style={styles.missionMetaText}>
                      {Math.max(1, Math.round((mission.estimated_duration_seconds || 0) / 60))} {t('min')}
                    </Text>
                  </View>
                </View>

                <View style={styles.howItWorksBox}>
                  <Text style={styles.howItWorksTitle}>{t('habitHowItWorksTitle')}</Text>
                  <View style={styles.howItWorksRow}>
                    <EyeOff color={COLORS.textSecondary} size={14} />
                    <Text style={styles.howItWorksText}>{t('habitHowItWorks1')}</Text>
                  </View>
                  <View style={styles.howItWorksRow}>
                    <Mic color={COLORS.textSecondary} size={14} />
                    <Text style={styles.howItWorksText}>{t('habitHowItWorks2')}</Text>
                  </View>
                  <View style={styles.howItWorksRow}>
                    <Award color={COLORS.textSecondary} size={14} />
                    <Text style={styles.howItWorksText}>{t('habitHowItWorks3')}</Text>
                  </View>
                </View>

                {countdown !== null ? (
                  <View style={styles.countdownWrap}>
                    <Text style={styles.countdownText}>{countdown > 0 ? countdown : '🎬'}</Text>
                  </View>
                ) : (
                  <TouchableOpacity
                    style={styles.startBtn}
                    disabled={starting}
                    onPress={() => setCountdown(3)}
                    activeOpacity={0.85}
                  >
                    {starting ? (
                      <ActivityIndicator color={COLORS.white} />
                    ) : (
                      <>
                        <Sparkles color={COLORS.white} size={18} />
                        <Text style={styles.startBtnText}>{t('habitStartMission')}</Text>
                      </>
                    )}
                  </TouchableOpacity>
                )}
              </View>
            ) : (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>{t('habitNoMissionToday')}</Text>
              </View>
            )}

            {history ? (
              <View style={styles.historyCard}>
                <View style={styles.sectionHeaderRow}>
                  <Flame color={COLORS.secondary} size={20} />
                  <Text style={styles.historyTitle}>{t('habitHistoryTitle')}</Text>
                </View>

                <View style={styles.historyRow}>
                  <Text style={styles.historyLabel}>{t('habitCompletedMissions')}</Text>
                  <Text style={styles.historyValue}>{history.completed_count}</Text>
                </View>
                <View style={styles.historyRow}>
                  <Text style={styles.historyLabel}>{t('habitCurrentStreak')}</Text>
                  <Text style={styles.historyValue}>
                    {history.current_streak} 🔥
                  </Text>
                </View>
                <View style={styles.historyRow}>
                  <Text style={styles.historyLabel}>{t('habitTotalPracticeTime')}</Text>
                  <Text style={styles.historyValue}>
                    {formatDuration(history.total_duration_seconds)}
                  </Text>
                </View>
              </View>
            ) : null}
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
    marginBottom: 20,
  },
  missionCard: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.xl,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 18,
    marginBottom: 16,
  },
  missionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 14,
  },
  activityIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activityIconText: {
    fontSize: 22,
  },
  missionKicker: {
    color: COLORS.primary,
    fontFamily: FONT_FAMILY.bold,
    fontSize: 11,
    letterSpacing: 0.5,
  },
  missionActivityName: {
    color: COLORS.text,
    fontFamily: FONT_FAMILY.bold,
    fontSize: 17,
    marginTop: 2,
  },
  missionSentence: {
    color: COLORS.textSecondary,
    fontFamily: FONT_FAMILY.regular,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 14,
  },
  missionPurpose: {
    color: COLORS.primary,
    fontFamily: FONT_FAMILY.medium,
    fontSize: 12,
    lineHeight: 18,
    marginTop: -10,
    marginBottom: 14,
  },
  howItWorksBox: {
    backgroundColor: COLORS.backgroundSoft,
    borderRadius: BORDER_RADIUS.l,
    padding: 12,
    marginBottom: 16,
    gap: 8,
  },
  howItWorksTitle: {
    color: COLORS.text,
    fontFamily: FONT_FAMILY.bold,
    fontSize: 12,
    marginBottom: 2,
  },
  howItWorksRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  howItWorksText: {
    flex: 1,
    color: COLORS.textSecondary,
    fontFamily: FONT_FAMILY.regular,
    fontSize: 12,
    lineHeight: 17,
  },
  missionMetaRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 18,
  },
  missionMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  missionMetaText: {
    color: COLORS.textSecondary,
    fontFamily: FONT_FAMILY.medium,
    fontSize: 12,
  },
  startBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: COLORS.primary,
    borderRadius: 16,
    height: 50,
  },
  startBtnText: {
    color: COLORS.white,
    fontFamily: FONT_FAMILY.bold,
    fontSize: 15,
  },
  countdownWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 50,
  },
  countdownText: {
    color: COLORS.primary,
    fontFamily: FONT_FAMILY.bold,
    fontSize: 32,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 24,
    padding: 32,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 16,
  },
  emptyText: {
    color: COLORS.textSecondary,
    fontFamily: FONT_FAMILY.regular,
    fontSize: 14,
    textAlign: 'center',
  },
  historyCard: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.xl,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 18,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 14,
  },
  historyTitle: {
    color: COLORS.text,
    fontFamily: FONT_FAMILY.bold,
    fontSize: 16,
  },
  historyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  historyLabel: {
    color: COLORS.textSecondary,
    fontFamily: FONT_FAMILY.regular,
    fontSize: 13,
  },
  historyValue: {
    color: COLORS.text,
    fontFamily: FONT_FAMILY.bold,
    fontSize: 14,
  },
});
