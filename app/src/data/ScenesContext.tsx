import React, { createContext, useCallback, useContext, useMemo } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useQuery, useQueryClient } from '@tanstack/react-query';

import { fetchScene, fetchScenes, SceneLockedError } from '../api/scenes';
import { SCENARIOS, expandScenarioToDialogueItems, type Scenario } from './scenarios';
import { useLanguage } from './i18n';
import { SplashScreen } from '../screens/SplashScreen';
import { FONT_FAMILY } from '../theme/typography';

interface ScenesContextValue {
  scenes: Scenario[];
  loading: boolean;
  error: string | null;
  reload: () => void;
  // دریافت یک صحنه با جزئیات کامل (هات‌اسپات + دیالوگ)، همراه با کش
  getScene: (id: string) => Promise<Scenario | undefined>;
}

const ScenesContext = createContext<ScenesContextValue>({
  scenes: SCENARIOS,
  loading: false,
  error: null,
  reload: () => {},
  getScene: async () => undefined,
});

/** کلیدهای کش. یک‌جا تعریف می‌شوند تا بی‌اعتبارسازی از جای دیگر هم امن باشد. */
export const sceneKeys = {
  list: ['scenes'] as const,
  detail: (id: string) => ['scene', id] as const,
};

/**
 * صحنه‌ها روی react-query نشسته‌اند، نه یک کش دست‌ساز.
 *
 * قبلاً لیست در useState و جزئیاتِ هر صحنه در یک Map داخل useRef نگه داشته
 * می‌شد: بدون سیاست انقضا، بدون ادغام درخواست‌های هم‌زمان، و با بی‌اعتبارسازیِ
 * دستی که هرجا لازم بود باید یادمان می‌ماند reload() صدا بزنیم.
 */
export const ScenesProvider = ({ children }: { children: React.ReactNode }) => {
  const queryClient = useQueryClient();

  const { t } = useLanguage();
  const { data, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: sceneKeys.list,
    queryFn: fetchScenes,
  });

  // صحنه‌های محلیِ داخل اپ دیگر نمایش داده نمی‌شوند: کاربر اول نسخه‌ی قدیمی را
  // می‌دید و چند لحظه بعد لیست واقعی جایش می‌نشست. تا لیست سرور نرسد، پایین
  // صفحه‌ی بارگذاری نشان داده می‌شود.
  const scenes = useMemo(() => data ?? [], [data]);

  const reload = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: sceneKeys.list });
  }, [queryClient]);

  const getScene = useCallback(
    async (id: string): Promise<Scenario | undefined> => {
      try {
        // fetchQuery خودش کش را می‌خواند، درخواست‌های هم‌زمانِ یک صحنه را ادغام
        // می‌کند و نتیجه را برای دفعه‌ی بعد نگه می‌دارد.
        return await queryClient.fetchQuery({
          queryKey: sceneKeys.detail(id),
          queryFn: () => fetchScene(id),
        });
      } catch (e) {
        // قفل‌بودن یعنی واقعاً نباید محتوا نشون داده بشه — به‌جای fallback
        // بی‌صدا، به صدازننده اجازه می‌دیم خودش هندلش کنه (مثلاً باز کردن Paywall).
        if (e instanceof SceneLockedError) throw e;
        // بقیه‌ی خطاها (مثلاً قطعی شبکه): fallback به صحنه‌ی لیست جاری یا داده‌ی محلی.
        // صحنه‌های لیست سبک‌اند و دیالوگ ندارند؛ نشان دادنشان صفحه‌ای بی‌جمله و
        // بی‌صدا می‌ساخت، پس فقط نسخه‌ای که دیالوگ دارد قبول است وگرنه خطا بالا می‌رود.
        const fallback = scenes.find((s) => s.id === id);
        if (fallback && expandScenarioToDialogueItems(fallback).some((d) => !!d.audioUrl)) return fallback;
        throw e;
      }
    },
    [queryClient, scenes]
  );

  const value = useMemo<ScenesContextValue>(
    () => ({
      scenes,
      loading: isLoading,
      error: error ? (error as Error).message || 'خطا در دریافت صحنه‌ها' : null,
      reload,
      getScene,
    }),
    [scenes, isLoading, error, reload, getScene]
  );

  if (!data) {
    if (isLoading || (isFetching && !error)) return <SplashScreen />;
    return (
      <View style={styles.center}>
        <Text style={styles.msg}>{t('networkError')}</Text>
        <TouchableOpacity style={styles.retry} onPress={() => refetch()}>
          <Text style={styles.retryText}>{t('sceneAudioRetry')}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return <ScenesContext.Provider value={value}>{children}</ScenesContext.Provider>;
};

export const useScenes = () => useContext(ScenesContext);

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    padding: 24,
    gap: 16,
  },
  msg: {
    fontFamily: FONT_FAMILY.medium,
    fontSize: 15,
    lineHeight: 24,
    color: '#5F6573',
    textAlign: 'center',
  },
  retry: {
    backgroundColor: '#FF7A59',
    borderRadius: 999,
    paddingHorizontal: 28,
    paddingVertical: 12,
  },
  retryText: { fontFamily: FONT_FAMILY.bold, fontSize: 15, color: '#FFFFFF' },
});
