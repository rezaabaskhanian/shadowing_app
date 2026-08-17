import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { CommonActions, useNavigation, useRoute } from '@react-navigation/native';
import { CheckCircle2 } from 'lucide-react-native';

import { COLORS, BORDER_RADIUS } from '../../theme/colors';
import { FONT_FAMILY } from '../../theme/typography';
import { useLanguage } from '../../data/i18n';
import type { HabitMissionResult } from '../../api/habit';

const formatDuration = (totalSeconds: number) => {
  const m = Math.floor(totalSeconds / 60);
  const s = Math.round(totalSeconds % 60);
  return `${m}m ${s}s`;
};

export const HabitMissionResultScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { t } = useLanguage();

  const result: HabitMissionResult = route.params?.result;
  const missionType: string | undefined = route.params?.missionType;
  const missionId: string | undefined = route.params?.missionId;
  const activity = route.params?.activity;
  const dialogueLines = route.params?.dialogueLines;

  const goDone = () => {
    navigation.dispatch(
      CommonActions.reset({
        index: 0,
        routes: [{ name: 'LanguageHabit' }],
      })
    );
  };

  // به‌جای برگشت به هاب و زدن دوباره‌ی Start، همان دیالوگ/فعالیت را بی‌درنگ
  // از نو تمرین می‌کند — تکرار خودش بخشی از رسیدن به خودکارسازی است.
  const practiceAgain = () => {
    navigation.navigate('HabitMissionPractice', { missionId, missionType, activity, dialogueLines });
  };

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.headerRow}>
          <CheckCircle2 color={COLORS.tertiary} size={30} />
          <Text style={styles.title}>{t('habitMissionComplete')}</Text>
        </View>

        {result ? (
          <View style={styles.card}>
            <View style={styles.row}>
              <Text style={styles.rowLabel}>{t('habitYouRemembered')}</Text>
              <Text style={styles.rowValue}>
                {result.matched_sentences} / {result.total_sentences} {t('sentences')}
              </Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.rowLabel}>{t('habitWordsLabel')}</Text>
              <Text style={styles.rowValue}>
                {result.matched_words} / {result.total_words}
              </Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.rowLabel}>{t('habitAccuracyLabel')}</Text>
              <Text style={styles.rowValue}>{Math.round(result.accuracy)}%</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.rowLabel}>{t('habitYouPracticed')}</Text>
              <Text style={styles.rowValue}>{formatDuration(result.duration_seconds)}</Text>
            </View>
            <View style={styles.streakBanner}>
              <Text style={styles.streakText}>
                {result.streak} {t('habitDaysStreakSuffix')} 🔥
              </Text>
            </View>
          </View>
        ) : null}

        {missionId ? (
          <TouchableOpacity style={styles.againBtn} onPress={practiceAgain} activeOpacity={0.85}>
            <Text style={styles.againBtnText}>{t('habitPracticeAgainBtn')}</Text>
          </TouchableOpacity>
        ) : null}

        <TouchableOpacity
          style={[styles.doneBtn, styles.doneBtnSecondary]}
          onPress={goDone}
          activeOpacity={0.85}
        >
          <Text style={[styles.doneBtnText, styles.doneBtnTextSecondary]}>{t('habitDoneBtn')}</Text>
        </TouchableOpacity>
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
    paddingTop: 70,
    paddingBottom: 60,
  },
  headerRow: {
    alignItems: 'center',
    gap: 10,
    marginBottom: 24,
  },
  title: {
    color: COLORS.text,
    fontFamily: FONT_FAMILY.bold,
    fontSize: 24,
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.xl,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 18,
    marginBottom: 24,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
  },
  rowLabel: {
    color: COLORS.textSecondary,
    fontFamily: FONT_FAMILY.regular,
    fontSize: 14,
  },
  rowValue: {
    color: COLORS.text,
    fontFamily: FONT_FAMILY.bold,
    fontSize: 15,
  },
  streakBanner: {
    marginTop: 10,
    backgroundColor: COLORS.secondaryLight,
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
  },
  streakText: {
    color: COLORS.secondary,
    fontFamily: FONT_FAMILY.bold,
    fontSize: 15,
  },
  doneBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 16,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  doneBtnSecondary: {
    backgroundColor: 'transparent',
    marginTop: 10,
  },
  doneBtnText: {
    color: COLORS.white,
    fontFamily: FONT_FAMILY.bold,
    fontSize: 15,
  },
  doneBtnTextSecondary: {
    color: COLORS.textSecondary,
  },
  againBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 16,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  againBtnText: {
    color: COLORS.white,
    fontFamily: FONT_FAMILY.bold,
    fontSize: 15,
  },
});
