import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import { Mic, Square } from 'lucide-react-native';

import { COLORS } from '../../theme/colors';
import { FONT_FAMILY } from '../../theme/typography';
import { useLanguage } from '../../data/i18n';
import { AudioPlayer } from '../../components/AudioPlayer';
import { ensureMicPermission } from '../../services/micPermission';
import { submitMissionSession, type HabitDialogueLine } from '../../api/habit';
import type { AudioActionCommand } from '../SceneScreen/types';

/** ثانیه‌ها را به «m:ss» تبدیل می‌کند. */
const formatTimer = (totalSeconds: number) => {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
};

/**
 * صفحه‌ی تمرین دست‌آزاد (hands-free): طبق تصمیم محصول، اول فرصت حفظ‌کردن
 * کامل دیالوگ داده می‌شود (فاز «study»)؛ بعد از تایید آمادگی کاربر، متن
 * کاملاً مخفی می‌شود و دیگر هیچ راهی برای دیدن دوباره‌ی آن حین ضبط نیست —
 * کاربر باید کاملاً از حفظ بگوید. فقط یک دکمه‌ی بزرگ ضبط/توقف و یک تایمر
 * ساده در فاز تمرین نشان داده می‌شود.
 */
export const HabitMissionPracticeScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { t, language } = useLanguage();

  const missionId: string = route.params?.missionId;
  const missionType: string | undefined = route.params?.missionType;
  const activity = route.params?.activity;
  const dialogueLines: HabitDialogueLine[] = route.params?.dialogueLines || [];

  const [actionCommand, setActionCommand] = useState<AudioActionCommand>('none');
  const [isRecording, setIsRecording] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [phase, setPhase] = useState<'study' | 'idle' | 'uploading' | 'error'>('study');
  const [errorDetail, setErrorDetail] = useState<string | null>(null);
  const startedAtRef = useRef<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  // این صفحه توی یک Tab.Navigator ثبت شده، پس با ناوبری دور یا نزدیک (مثلاً
  // زدن «Practice Again») هرگز unmount نمی‌شه — همون نمونه‌ی کامپوننت با
  // state قبلی باقی می‌مونه. بدون این ریست، هر بار که دوباره وارد این صفحه
  // بشیم (حتی برای شروع یک تمرین کاملاً تازه)، `phase` هنوز روی مقدار قبلی
  // (مثلاً 'uploading' بعد از موفقیت جلسه‌ی قبلی) گیر کرده و صفحه بلافاصله
  // انگار داره دوباره چیزی ارسال می‌کنه، بدون اینکه کاربر چیزی ضبط کرده باشه.
  useFocusEffect(
    useCallback(() => {
      setActionCommand('none');
      setIsRecording(false);
      setElapsedSeconds(0);
      setPhase(dialogueLines.length > 0 ? 'study' : 'idle');
      setErrorDetail(null);
      startedAtRef.current = null;
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }, [dialogueLines.length])
  );

  const activityName = activity
    ? language === 'fa'
      ? activity.name_fa
      : activity.name_en
    : '';

  const startRecording = useCallback(async () => {
    const granted = await ensureMicPermission();
    if (!granted) return;
    setActionCommand('start_record');
    setIsRecording(true);
    setElapsedSeconds(0);
    startedAtRef.current = Date.now();
    timerRef.current = setInterval(() => {
      setElapsedSeconds((s) => s + 1);
    }, 1000);
  }, []);

  const stopRecording = useCallback(() => {
    setActionCommand('stop_record');
    setIsRecording(false);
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const handleRecordingStatus = useCallback(
    (status: 'recording' | 'stopped' | 'error', filePath?: string, mimeType?: string) => {
      if (status === 'error') {
        setPhase('error');
        return;
      }
      if (status !== 'stopped' || !filePath || !missionId) return;

      const duration = startedAtRef.current
        ? Math.max(1, Math.round((Date.now() - startedAtRef.current) / 1000))
        : elapsedSeconds;

      setPhase('uploading');
      submitMissionSession(missionId, filePath, duration, mimeType || 'audio/m4a')
        .then((result) => {
          navigation.navigate('HabitMissionResult', {
            result,
            missionType,
            missionId,
            activity,
            dialogueLines,
          });
        })
        .catch((err) => {
          // پیام واقعی را لاگ می‌کنیم چون متن ثابت روی صفحه («کانکشن را چک
          // کن») همیشه علت واقعی نیست — ممکن است خطای سرور (۴۰۰/۵۰۰) باشد،
          // نه قطعی شبکه.
          console.warn('[HabitMissionPractice] submitMissionSession failed:', err);
          setErrorDetail(err instanceof Error ? err.message : String(err));
          setPhase('error');
        });
    },
    [missionId, missionType, activity, dialogueLines, elapsedSeconds, navigation]
  );

  const isBusy = phase === 'uploading';

  return (
    <View style={styles.screen}>
      <AudioPlayer
        uri={null}
        shouldPlay={false}
        actionCommand={actionCommand}
        onRecordingStatusUpdate={handleRecordingStatus}
      />

      <View style={styles.header}>
        <Text style={styles.activityIcon}>{activity?.icon || '🎯'}</Text>
        <Text style={styles.activityName}>{activityName}</Text>
      </View>

      {phase === 'study' ? (
        <View style={styles.studyArea}>
          <Text style={styles.studyTitle}>{t('habitStudyTitle')}</Text>
          <Text style={styles.studySubtitle}>{t('habitStudySubtitle')}</Text>
          <View style={styles.studyList}>
            {dialogueLines.map((line, index) => (
              <Text key={index} style={styles.studyLine}>
                {line.original_text}
              </Text>
            ))}
          </View>
          <TouchableOpacity style={styles.studyReadyBtn} onPress={() => setPhase('idle')}>
            <Text style={styles.studyReadyBtnText}>{t('habitStudyReadyBtn')}</Text>
          </TouchableOpacity>
        </View>
      ) : isBusy ? (
        <View style={styles.centerArea}>
          <ActivityIndicator color={COLORS.primary} size="large" />
          <Text style={styles.statusText}>
            {phase === 'uploading' ? t('habitUploading') : t('habitAnalyzing')}
          </Text>
        </View>
      ) : phase === 'error' ? (
        <View style={styles.centerArea}>
          <Text style={styles.errorText}>{t('habitUploadFailed')}</Text>
          {errorDetail ? <Text style={styles.errorDetailText}>{errorDetail}</Text> : null}
          <TouchableOpacity
            style={styles.retryBtn}
            onPress={() => {
              setErrorDetail(null);
              setPhase('idle');
            }}
          >
            <Text style={styles.retryBtnText}>{t('retry')}</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.centerArea}>
          <Text style={styles.timerText}>{formatTimer(elapsedSeconds)}</Text>

          <TouchableOpacity
            style={[styles.recordBtn, isRecording && styles.recordBtnActive]}
            activeOpacity={0.85}
            onPress={isRecording ? stopRecording : startRecording}
          >
            {isRecording ? (
              <Square color={COLORS.white} size={30} fill={COLORS.white} />
            ) : (
              <Mic color={COLORS.white} size={34} />
            )}
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.background,
    justifyContent: 'space-between',
    paddingTop: 70,
    paddingBottom: 50,
  },
  header: {
    alignItems: 'center',
    gap: 6,
  },
  activityIcon: {
    fontSize: 30,
  },
  activityName: {
    color: COLORS.text,
    fontFamily: FONT_FAMILY.bold,
    fontSize: 16,
  },
  centerArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 22,
    paddingHorizontal: 30,
  },
  timerText: {
    color: COLORS.textSecondary,
    fontFamily: FONT_FAMILY.medium,
    fontSize: 20,
  },
  recordBtn: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recordBtnActive: {
    backgroundColor: COLORS.error,
  },
  studyArea: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'center',
    gap: 16,
  },
  studyTitle: {
    color: COLORS.text,
    fontFamily: FONT_FAMILY.bold,
    fontSize: 20,
    textAlign: 'center',
  },
  studySubtitle: {
    color: COLORS.textSecondary,
    fontFamily: FONT_FAMILY.regular,
    fontSize: 14,
    textAlign: 'center',
  },
  studyList: {
    backgroundColor: COLORS.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 18,
    gap: 10,
  },
  studyLine: {
    color: COLORS.text,
    fontFamily: FONT_FAMILY.medium,
    fontSize: 15,
    textAlign: 'center',
  },
  studyReadyBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
  },
  studyReadyBtnText: {
    color: COLORS.white,
    fontFamily: FONT_FAMILY.bold,
    fontSize: 15,
  },
  statusText: {
    color: COLORS.textSecondary,
    fontFamily: FONT_FAMILY.medium,
    fontSize: 14,
  },
  errorText: {
    color: COLORS.error,
    fontFamily: FONT_FAMILY.medium,
    fontSize: 14,
    textAlign: 'center',
  },
  errorDetailText: {
    color: COLORS.textSecondary,
    fontFamily: FONT_FAMILY.regular,
    fontSize: 12,
    textAlign: 'center',
  },
  retryBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 14,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  retryBtnText: {
    color: COLORS.white,
    fontFamily: FONT_FAMILY.bold,
    fontSize: 14,
  },
});
