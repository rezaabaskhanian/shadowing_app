import React, { useCallback, useEffect } from 'react';
import { BackHandler, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
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

  const goDone = useCallback(() => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      navigation.navigate('LanguageHabit');
    }
  }, [navigation]);

  useEffect(() => {
    const onBackPress = () => {
      goDone();
      return true;
    };
    const sub = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => sub.remove();
  }, [goDone]);

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

        {/* ماموریت روزی یک‌بار است، پس «دوباره تمرین کن» نداریم — فقط پایان. */}
        <TouchableOpacity style={styles.doneBtn} onPress={goDone} activeOpacity={0.85}>
          <Text style={styles.doneBtnText}>{t('habitDoneBtn')}</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#FDFBF7',
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 60,
  },
  headerRow: {
    alignItems: 'center',
    gap: 10,
    marginBottom: 24,
  },
  title: {
    color: '#1A1D26',
    fontFamily: FONT_FAMILY.bold,
    fontSize: 24,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#F0EBE3',
    padding: 18,
    marginBottom: 24,
    shadowColor: '#1A1D26',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
  },
  rowLabel: {
    color: '#716B62',
    fontFamily: FONT_FAMILY.regular,
    fontSize: 14,
  },
  rowValue: {
    color: '#1A1D26',
    fontFamily: FONT_FAMILY.bold,
    fontSize: 15,
  },
  streakBanner: {
    marginTop: 10,
    backgroundColor: '#FFF4EE',
    borderWidth: 1,
    borderColor: '#FAD8C7',
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
  },
  streakText: {
    color: '#FF6422',
    fontFamily: FONT_FAMILY.bold,
    fontSize: 15,
  },
  doneBtn: {
    backgroundColor: '#FF6422',
    borderRadius: 16,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#FF6422',
    shadowOpacity: 0.28,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  doneBtnText: {
    color: '#FFFFFF',
    fontFamily: FONT_FAMILY.bold,
    fontSize: 15,
  },
});
