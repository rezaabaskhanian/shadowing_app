import React, { createContext, useCallback, useContext, useRef, useState } from 'react';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface ToastItem {
  id: number;
  type: ToastType;
  title?: string;
  message: string;
  duration: number;
}

interface ShowOptions {
  title?: string;
  duration?: number;
}

interface ToastContextValue {
  /** توست فعلی که باید نمایش داده شود؛ null یعنی چیزی در صف نیست. */
  current: ToastItem | null;
  show: (message: string, type?: ToastType, options?: ShowOptions) => void;
  success: (message: string, options?: ShowOptions) => void;
  error: (message: string, options?: ShowOptions) => void;
  info: (message: string, options?: ShowOptions) => void;
  warning: (message: string, options?: ShowOptions) => void;
  /** توست فعلی را زودتر از موعد می‌بندد و اگر صف داشت، بعدی را نشان می‌دهد. */
  dismiss: () => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

const DEFAULT_DURATION = 3000;

/**
 * صف‌بندی ساده: هر لحظه فقط یک توست دیده می‌شود؛ اگر توست جدیدی وقتی یکی روی
 * صفحه‌ست فراخوانی شود، توی صف می‌رود و بعد از بسته‌شدنِ فعلی نوبتش می‌رسد —
 * وگرنه با فراخوانی‌های پشت‌سرهم (مثلاً چند خطای شبکه‌ی نزدیک به هم) قبلی وسط
 * انیمیشن خروج قطع و جایگزین می‌شد که بی‌ثبات به‌نظر می‌رسید.
 */
export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [current, setCurrent] = useState<ToastItem | null>(null);
  const queueRef = useRef<ToastItem[]>([]);
  const idRef = useRef(0);

  const showNext = useCallback(() => {
    const next = queueRef.current.shift() ?? null;
    setCurrent(next);
  }, []);

  const dismiss = useCallback(() => {
    showNext();
  }, [showNext]);

  const show = useCallback<ToastContextValue['show']>(
    (message, type = 'info', options) => {
      const item: ToastItem = {
        id: ++idRef.current,
        type,
        message,
        title: options?.title,
        duration: options?.duration ?? DEFAULT_DURATION,
      };
      setCurrent((prevCurrent) => {
        if (prevCurrent) {
          queueRef.current.push(item);
          return prevCurrent;
        }
        return item;
      });
    },
    [],
  );

  const success = useCallback<ToastContextValue['success']>(
    (message, options) => show(message, 'success', options),
    [show],
  );
  const error = useCallback<ToastContextValue['error']>(
    (message, options) => show(message, 'error', options),
    [show],
  );
  const info = useCallback<ToastContextValue['info']>(
    (message, options) => show(message, 'info', options),
    [show],
  );
  const warning = useCallback<ToastContextValue['warning']>(
    (message, options) => show(message, 'warning', options),
    [show],
  );

  return (
    <ToastContext.Provider value={{ current, show, success, error, info, warning, dismiss }}>
      {children}
    </ToastContext.Provider>
  );
};

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast باید داخل ToastProvider استفاده شود');
  return ctx;
}
