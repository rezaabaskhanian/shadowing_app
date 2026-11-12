import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  BackHandler,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { ChevronLeft, ChevronRight, Clock, Flame, Info, MessageSquare, Star, Zap } from 'lucide-react-native';
import { GradientFill } from '../../components/GradientFill';

import { COLORS } from '../../theme/colors';
import { FONT_FAMILY } from '../../theme/typography';
import { useLanguage } from '../../data/i18n';
import { HabitActivityIcon } from '../../components/HabitActivityIcon';
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
  const [doneToday, setDoneToday] = useState(false);

  const handleBack = useCallback(() => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      navigation.navigate('Home');
    }
  }, [navigation]);

  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        handleBack();
        return true;
      };
      const sub = BackHandler.addEventListener('hardwareBackPress', onBackPress);
      return () => sub.remove();
    }, [handleBack])
  );

  const load = useCallback(() => {
    let active = true;
    setLoading(true);
    Promise.all([getTodayMission(), getHabitHistory()])
      .then(([m, h]) => {
        if (!active) return;
        setDoneToday(!!m?.completed_today);
        setMission(m?.completed_today ? null : m);
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

  const toFa = (v: number | string) => String(v).replace(/\d/g, (d) => '۰۱۲۳۴۵۶۷۸۹'[Number(d)]);
  const num = (v: number | string) => (language === 'fa' ? toFa(v) : String(v));
  const steps = [
    { title: 'habitStep1', desc: 'habitHowItWorks1', color: '#E9A23B' },
    { title: 'habitStep2', desc: 'habitHowItWorks2', color: '#2F8A5B' },
    { title: 'habitStep3', desc: 'habitHowItWorks3', color: '#3B6EF0' },
  ];
  const streakDays = Math.min(7, history?.current_streak ?? 0);

  const BackIcon = language === 'fa' ? ChevronRight : ChevronLeft;

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.topRow}>
          <View style={styles.infoBtn}>
            <Info color={COLORS.textSecondary} size={18} />
          </View>
          <View style={styles.tag}>
            <Text style={styles.tagText}>{t('habitTag')}</Text>
            <View style={styles.tagDot} />
          </View>
          <TouchableOpacity
            style={styles.backButton}
            onPress={handleBack}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            activeOpacity={0.7}
          >
            <BackIcon color={COLORS.text} size={20} />
          </TouchableOpacity>
        </View>

        <Text style={styles.title}>{t('habitScreenTitle')}</Text>
        <Text style={styles.subtitle}>{t('habitScreenSub')}</Text>

        {loading ? (
          <ActivityIndicator color={COLORS.primary} style={styles.loader} />
        ) : (
          <>
            {mission ? (
              <View style={styles.missionCard}>
                <View style={styles.missionHeaderRow}>
                  <View style={styles.missionHeadText}>
                    <View style={styles.dailyChip}>
                      <Text style={styles.dailyChipText}>{t('habitDailyChip')}</Text>
                      <Star size={11} color={COLORS.primary} fill={COLORS.primary} />
                    </View>
                    <Text style={styles.missionActivityName}>{activityName(mission.activity)}</Text>
                  </View>
                  <View style={styles.activityIconWrap}>
                    <HabitActivityIcon name={mission.activity?.icon} size={24} color={COLORS.tertiary} />
                    <View style={styles.iconDot} />
                  </View>
                </View>

                <Text style={styles.missionPurpose}>
                  {t('habitPracticeWhile').replace('{activity}', activityName(mission.activity).toLowerCase())}
                  {'. '}
                  {t('habitPurposeText')}
                </Text>

                <View style={styles.metaRow}>
                  <View style={styles.metaPill}>
                    <Text style={styles.metaText}>
                      {t('habitDuration').replace(
                        '{n}',
                        num(Math.max(1, Math.round((mission.estimated_duration_seconds || 0) / 60)))
                      )}
                    </Text>
                    <Clock color={COLORS.success} size={13} />
                  </View>
                  <View style={styles.metaPill}>
                    <Text style={styles.metaText}>{t('habitLines').replace('{n}', num(mission.dialogues?.length || 0))}</Text>
                    <MessageSquare color={COLORS.primary} size={13} />
                  </View>
                </View>

                <View style={styles.stepsBox}>
                  <View style={styles.stepsHead}>
                    <Text style={styles.stepsTitle}>{t('habitHowItWorksTitle')}</Text>
                    <View style={styles.stepsBar} />
                  </View>
                  {steps.map((st, i) => (
                    <View key={st.title} style={styles.step}>
                      <View style={[styles.stepNum, { backgroundColor: `${st.color}1F` }]}>
                        <Text style={[styles.stepNumText, { color: st.color }]}>{num(i + 1)}</Text>
                      </View>
                      <View style={styles.stepText}>
                        <Text style={styles.stepTitle}>{t(st.title)}</Text>
                        <Text style={styles.stepDesc}>{t(st.desc)}</Text>
                      </View>
                    </View>
                  ))}
                </View>

                {countdown !== null ? (
                  <View style={styles.countdownWrap}>
                    <Text style={styles.countdownText}>{countdown > 0 ? num(countdown) : '🎬'}</Text>
                  </View>
                ) : (
                  <TouchableOpacity
                    style={styles.startBtn}
                    disabled={starting}
                    onPress={() => setCountdown(3)}
                    activeOpacity={0.85}
                  >
                    <GradientFill from="#F07A4A" to="#E8572F" horizontal />
                    {starting ? (
                      <ActivityIndicator color={COLORS.white} />
                    ) : (
                      <View style={styles.startInner}>
                        <Text style={styles.startBtnText}>{t('habitStartDaily')}</Text>
                        <Zap color={COLORS.white} size={18} />
                      </View>
                    )}
                  </TouchableOpacity>
                )}
              </View>
            ) : (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>{t(doneToday ? 'habitDoneForToday' : 'habitNoMissionToday')}</Text>
              </View>
            )}

            {history ? (
              <View style={styles.historyCard}>
                <View style={styles.historyHead}>
                  <View style={styles.liveChip}>
                    <Text style={styles.liveText}>{t('habitLive')}</Text>
                  </View>
                  <View style={styles.historyTitleRow}>
                    <Text style={styles.historyTitle}>{t('habitHistoryTitle')}</Text>
                    <Flame color={COLORS.primary} size={20} fill={COLORS.primary} />
                  </View>
                </View>
                <View style={styles.statsRow}>
                  <View style={styles.statTile}>
                    <Text style={styles.statValue}>{formatDuration(history.total_duration_seconds)}</Text>
                    <Text style={styles.statLabel}>{t('habitTotalPracticeTime')}</Text>
                  </View>
                  <View style={styles.statTile}>
                    <Text style={styles.statValue}>{num(history.completed_count)}</Text>
                    <Text style={styles.statLabel}>{t('habitCompletedMissions')}</Text>
                  </View>
                  <View style={[styles.statTile, styles.statTileHot]}>
                    <Text style={[styles.statValue, styles.statValueHot]}>{num(history.current_streak)}🔥</Text>
                    <Text style={styles.statLabel}>{t('habitCurrentStreak')}</Text>
                  </View>
                </View>
                <View style={styles.levelRow}>
                  <Text style={styles.levelPct}>{num(Math.round((streakDays / 7) * 100))}٪</Text>
                  <Text style={styles.levelLabel}>{t('habitHabitLevel').replace('{d}', num(Math.max(1, streakDays)))}</Text>
                </View>
                <View style={styles.levelTrack}>
                  <View style={[styles.levelFill, { width: `${Math.max(4, (streakDays / 7) * 100)}%` }]}>
                    <GradientFill from="#F5A15A" to="#E8572F" horizontal />
                  </View>
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
  screen: { flex: 1, backgroundColor: '#FDFBF7' },
  content: { paddingHorizontal: 20, paddingTop: 48, paddingBottom: 60 },
  loader: { marginTop: 40 },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 },
  infoBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#F0EBE3',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#1A1D26',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#F0EBE3',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#1A1D26',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: 'rgba(5, 150, 105, 0.10)',
    borderWidth: 1,
    borderColor: 'rgba(5, 150, 105, 0.25)',
  },
  tagText: { fontFamily: FONT_FAMILY.bold, fontSize: 10, color: '#059669' },
  tagDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#059669' },
  title: { color: '#1A1D26', fontFamily: FONT_FAMILY.bold, fontSize: 24, textAlign: 'right' },
  subtitle: { color: '#716B62', fontFamily: FONT_FAMILY.regular, fontSize: 12, textAlign: 'right', marginTop: 4, marginBottom: 18 },
  missionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#F0EBE3',
    padding: 18,
    marginBottom: 16,
    gap: 14,
    shadowColor: '#1A1D26',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  missionHeaderRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  missionHeadText: { flex: 1, alignItems: 'flex-end', gap: 8 },
  dailyChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    backgroundColor: '#FFF4EE',
  },
  dailyChipText: { fontFamily: FONT_FAMILY.bold, fontSize: 10, color: '#FF6422' },
  missionActivityName: { color: '#1A1D26', fontFamily: FONT_FAMILY.bold, fontSize: 22, textAlign: 'right' },
  activityIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: '#FFF4EE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconDot: {
    position: 'absolute',
    bottom: -3,
    left: -3,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#FF6422',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  missionPurpose: { color: '#716B62', fontFamily: FONT_FAMILY.regular, fontSize: 12, lineHeight: 22, textAlign: 'right' },
  metaRow: { flexDirection: 'row', gap: 8, justifyContent: 'flex-end' },
  metaPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: '#F8F5EE',
    borderWidth: 1,
    borderColor: '#F0EBE3',
  },
  metaText: { color: '#1A1D26', fontFamily: FONT_FAMILY.semiBold, fontSize: 11 },
  stepsBox: { backgroundColor: '#F8F5EE', borderRadius: 20, padding: 12, gap: 10, borderWidth: 1, borderColor: '#F0EBE3' },
  stepsHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 6 },
  stepsTitle: { fontFamily: FONT_FAMILY.bold, fontSize: 12, color: '#1A1D26' },
  stepsBar: { width: 4, height: 14, borderRadius: 2, backgroundColor: '#FF6422' },
  step: {
    flexDirection: 'row-reverse',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: '#F0EBE3',
    shadowColor: '#1A1D26',
    shadowOpacity: 0.03,
    elevation: 1,
  },
  stepNum: { width: 24, height: 24, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  stepNumText: { fontFamily: FONT_FAMILY.bold, fontSize: 11 },
  stepText: { flex: 1, alignItems: 'flex-end', gap: 3 },
  stepTitle: { fontFamily: FONT_FAMILY.bold, fontSize: 12, color: '#1A1D26' },
  stepDesc: { fontFamily: FONT_FAMILY.regular, fontSize: 11, lineHeight: 18, color: '#716B62', textAlign: 'right' },
  startBtn: {
    height: 54,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: '#FF6422',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#FF6422',
    shadowOpacity: 0.28,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  startInner: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  startBtnText: { color: '#FFFFFF', fontFamily: FONT_FAMILY.bold, fontSize: 15 },
  countdownWrap: { alignItems: 'center', justifyContent: 'center', height: 54 },
  countdownText: { color: '#FF6422', fontFamily: FONT_FAMILY.bold, fontSize: 36 },
  emptyContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#F0EBE3',
    padding: 24,
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyText: { color: '#716B62', fontFamily: FONT_FAMILY.medium, fontSize: 14, lineHeight: 24, textAlign: 'center' },
  historyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#F0EBE3',
    padding: 16,
    gap: 14,
    shadowColor: '#1A1D26',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  historyHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  historyTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  historyTitle: { color: '#1A1D26', fontFamily: FONT_FAMILY.bold, fontSize: 17 },
  liveChip: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, backgroundColor: '#F3EFE6' },
  liveText: { fontFamily: FONT_FAMILY.medium, fontSize: 10, color: '#716B62' },
  statsRow: { flexDirection: 'row', gap: 8 },
  statTile: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
    paddingVertical: 14,
    paddingHorizontal: 6,
    borderRadius: 16,
    backgroundColor: '#F8F5EE',
    borderWidth: 1,
    borderColor: '#F0EBE3',
  },
  statTileHot: { backgroundColor: '#FFF4EE', borderColor: '#FAD8C7' },
  statValue: { fontFamily: FONT_FAMILY.bold, fontSize: 18, color: '#1A1D26' },
  statValueHot: { color: '#FF6422' },
  statLabel: { fontFamily: FONT_FAMILY.regular, fontSize: 10, color: '#716B62', textAlign: 'center' },
  levelRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  levelPct: { fontFamily: FONT_FAMILY.bold, fontSize: 11, color: '#FF6422' },
  levelLabel: { fontFamily: FONT_FAMILY.medium, fontSize: 11, color: '#716B62' },
  levelTrack: { height: 8, borderRadius: 4, backgroundColor: '#F3EFE6', overflow: 'hidden', flexDirection: 'row-reverse' },
  levelFill: { height: '100%', borderRadius: 4, overflow: 'hidden' },
});
