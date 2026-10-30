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
import { ChevronRight, Clock, Flame, Info, MessageSquare, Star, Zap } from 'lucide-react-native';
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
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <ChevronRight color={COLORS.text} size={20} />
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
  screen: { flex: 1, backgroundColor: '#FAF8F4' },
  content: { paddingHorizontal: 20, paddingTop: 48, paddingBottom: 60 },
  loader: { marginTop: 40 },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 },
  infoBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: '#EEEAE3',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: '#EEEAE3',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: 'rgba(46,158,107,0.10)',
    borderWidth: 1,
    borderColor: 'rgba(46,158,107,0.25)',
  },
  tagText: { fontFamily: FONT_FAMILY.bold, fontSize: 10, color: '#2F8A5B' },
  tagDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: COLORS.success },
  title: { color: COLORS.text, fontFamily: FONT_FAMILY.bold, fontSize: 24, textAlign: 'right' },
  subtitle: { color: COLORS.muted, fontFamily: FONT_FAMILY.regular, fontSize: 12, textAlign: 'right', marginTop: 4, marginBottom: 18 },
  missionCard: {
    backgroundColor: COLORS.white,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#EEEAE3',
    padding: 18,
    marginBottom: 16,
    gap: 14,
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
    backgroundColor: '#FDEDE8',
  },
  dailyChipText: { fontFamily: FONT_FAMILY.bold, fontSize: 10, color: COLORS.primary },
  missionActivityName: { color: COLORS.text, fontFamily: FONT_FAMILY.bold, fontSize: 22, textAlign: 'right' },
  activityIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: COLORS.tertiaryLight,
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
    backgroundColor: COLORS.primary,
    borderWidth: 2,
    borderColor: COLORS.white,
  },
  missionPurpose: { color: COLORS.textSecondary, fontFamily: FONT_FAMILY.regular, fontSize: 12, lineHeight: 22, textAlign: 'right' },
  metaRow: { flexDirection: 'row', gap: 8, justifyContent: 'flex-end' },
  metaPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: '#EEEAE3',
  },
  metaText: { color: COLORS.text, fontFamily: FONT_FAMILY.semiBold, fontSize: 11 },
  stepsBox: { backgroundColor: '#F7F5F1', borderRadius: 18, padding: 12, gap: 10, borderWidth: 1, borderColor: '#EEEAE3' },
  stepsHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 6 },
  stepsTitle: { fontFamily: FONT_FAMILY.bold, fontSize: 12, color: COLORS.text },
  stepsBar: { width: 4, height: 14, borderRadius: 2, backgroundColor: COLORS.primary },
  step: {
    flexDirection: 'row-reverse',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: COLORS.white,
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#EEEAE3',
  },
  stepNum: { width: 24, height: 24, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  stepNumText: { fontFamily: FONT_FAMILY.bold, fontSize: 11 },
  stepText: { flex: 1, alignItems: 'flex-end', gap: 3 },
  stepTitle: { fontFamily: FONT_FAMILY.bold, fontSize: 12, color: COLORS.text },
  stepDesc: { fontFamily: FONT_FAMILY.regular, fontSize: 11, lineHeight: 18, color: COLORS.textSecondary, textAlign: 'right' },
  startBtn: {
    height: 54,
    borderRadius: 18,
    overflow: 'hidden',
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
    shadowColor: COLORS.primary,
    shadowOpacity: 0.35,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
  },
  startInner: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  startBtnText: { color: COLORS.white, fontFamily: FONT_FAMILY.bold, fontSize: 15 },
  countdownWrap: { alignItems: 'center', justifyContent: 'center', height: 54 },
  countdownText: { color: COLORS.primary, fontFamily: FONT_FAMILY.bold, fontSize: 36 },
  emptyContainer: {
    backgroundColor: COLORS.white,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#EEEAE3',
    padding: 24,
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyText: { color: COLORS.textSecondary, fontFamily: FONT_FAMILY.medium, fontSize: 14, lineHeight: 24, textAlign: 'center' },
  historyCard: { backgroundColor: COLORS.white, borderRadius: 24, borderWidth: 1, borderColor: '#EEEAE3', padding: 16, gap: 14 },
  historyHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  historyTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  historyTitle: { color: COLORS.text, fontFamily: FONT_FAMILY.bold, fontSize: 17 },
  liveChip: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, backgroundColor: '#F1EEE8' },
  liveText: { fontFamily: FONT_FAMILY.medium, fontSize: 10, color: COLORS.textSecondary },
  statsRow: { flexDirection: 'row', gap: 8 },
  statTile: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
    paddingVertical: 14,
    paddingHorizontal: 6,
    borderRadius: 16,
    backgroundColor: '#F7F5F1',
    borderWidth: 1,
    borderColor: '#EEEAE3',
  },
  statTileHot: { backgroundColor: '#FFF4EF', borderColor: '#F6D9CC' },
  statValue: { fontFamily: FONT_FAMILY.bold, fontSize: 18, color: COLORS.text },
  statValueHot: { color: COLORS.primary },
  statLabel: { fontFamily: FONT_FAMILY.regular, fontSize: 10, color: COLORS.textSecondary, textAlign: 'center' },
  levelRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  levelPct: { fontFamily: FONT_FAMILY.bold, fontSize: 11, color: COLORS.primary },
  levelLabel: { fontFamily: FONT_FAMILY.medium, fontSize: 11, color: COLORS.textSecondary },
  levelTrack: { height: 8, borderRadius: 4, backgroundColor: '#F1EEE8', overflow: 'hidden', flexDirection: 'row-reverse' },
  levelFill: { height: '100%', borderRadius: 4, overflow: 'hidden' },
});
