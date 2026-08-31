import React, { createContext, useCallback, useContext, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';

import { fetchScene, fetchScenes, SceneLockedError } from '../api/scenes';
import { SCENARIOS, type Scenario } from './scenarios';

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

  const { data, isLoading, error } = useQuery({
    queryKey: sceneKeys.list,
    queryFn: fetchScenes,
  });

  // اگر بک‌اند در دسترس نبود یا لیست خالی برگرداند، همان داده‌ی محلی نمایش
  // داده می‌شود تا اپ بدون شبکه هم کار کند.
  const scenes = data && data.length > 0 ? data : SCENARIOS;

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
        // بقیه‌ی خطاها (مثلاً قطعی شبکه): fallback به صحنه‌ی لیست جاری یا داده‌ی محلی
        return scenes.find((s) => s.id === id) ?? SCENARIOS.find((s) => s.id === id);
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

  return <ScenesContext.Provider value={value}>{children}</ScenesContext.Provider>;
};

export const useScenes = () => useContext(ScenesContext);
