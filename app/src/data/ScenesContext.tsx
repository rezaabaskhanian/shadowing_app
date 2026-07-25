import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import { fetchScene, fetchScenes } from '../api/scenes';
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

export const ScenesProvider = ({ children }: { children: React.ReactNode }) => {
  // با داده‌ی محلی مقداردهی می‌شود تا اگر بک‌اند در دسترس نبود اپ همچنان کار کند
  const [scenes, setScenes] = useState<Scenario[]>(SCENARIOS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const detailCache = useRef<Map<string, Scenario>>(new Map());

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchScenes();
      if (data.length > 0) {
        setScenes(data);
        detailCache.current.clear();
      }
    } catch (e: any) {
      // در صورت خطا، همان داده‌ی محلی نمایش داده می‌شود
      setError(e?.message || 'خطا در دریافت صحنه‌ها');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const getScene = useCallback(
    async (id: string): Promise<Scenario | undefined> => {
      const cached = detailCache.current.get(id);
      if (cached) return cached;
      try {
        const full = await fetchScene(id);
        detailCache.current.set(id, full);
        return full;
      } catch {
        // fallback: صحنه از لیست جاری یا داده‌ی محلی
        return (
          scenes.find((s) => s.id === id) ??
          SCENARIOS.find((s) => s.id === id)
        );
      }
    },
    [scenes]
  );

  return (
    <ScenesContext.Provider
      value={{ scenes, loading, error, reload: load, getScene }}
    >
      {children}
    </ScenesContext.Provider>
  );
};

export const useScenes = () => useContext(ScenesContext);
