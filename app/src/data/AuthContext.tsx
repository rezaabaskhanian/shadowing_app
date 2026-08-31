import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as authApi from '../api/auth';
import { getToken, clearToken, AuthExpiredError } from '../api/client';

// آخرین پروفایل موفق، تا اگر اپ بدون اینترنت باز شد کاربر پشت صفحه‌ی ورود
// نماند. توکن روی دستگاه هست و معتبر است؛ فقط همین لحظه نمی‌شود چکش کرد.
const PROFILE_KEY = 'shadowing_user_profile';

async function cacheProfile(profile: authApi.UserInfo) {
  await AsyncStorage.setItem(PROFILE_KEY, JSON.stringify(profile)).catch(() => {});
}

async function readCachedProfile(): Promise<authApi.UserInfo | null> {
  try {
    const raw = await AsyncStorage.getItem(PROFILE_KEY);
    return raw ? (JSON.parse(raw) as authApi.UserInfo) : null;
  } catch {
    return null;
  }
}

interface AuthContextType {
  isAuthenticated: boolean;
  isRestoring: boolean;
  user: authApi.UserInfo | null;
  login: (phone: string, password: string) => Promise<void>;
  register: (nickname: string, phone: string, password: string, otpToken: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  isRestoring: true,
  user: null,
  login: async () => {},
  register: async () => {},
  logout: async () => {},
  refreshProfile: async () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<authApi.UserInfo | null>(null);
  const [isRestoring, setIsRestoring] = useState(true);

  useEffect(() => {
    (async () => {
      const token = await getToken();
      if (token) {
        // اول با پروفایل ذخیره‌شده کاربر را وارد نشان می‌دهیم تا با اینترنت
        // کند/قطع، صفحه‌ی ورود جلویش باز نشود؛ بعد در پس‌زمینه تازه‌اش می‌کنیم.
        const cached = await readCachedProfile();
        if (cached) setUser(cached);

        try {
          const profile = await authApi.fetchProfile();
          setUser(profile);
          await cacheProfile(profile);
        } catch (e) {
          // فقط وقتی سرور صریحاً می‌گوید نشست باطل است بیرونش می‌کنیم (و آن هم
          // بعد از اینکه authFetch یک بار با refresh token تلاش کرده). خطای
          // شبکه نباید کاربر را از حساب بیندازد — قبلاً هر خطایی توکن را پاک
          // می‌کرد و باز کردن اپ در حالت آفلاین یعنی لاگین دوباره.
          if (e instanceof AuthExpiredError) {
            await clearToken();
            await AsyncStorage.removeItem(PROFILE_KEY).catch(() => {});
            setUser(null);
          }
        }
      }
      setIsRestoring(false);
    })();
  }, []);

  const login = useCallback(async (phone: string, password: string) => {
    const profile = await authApi.login(phone, password);
    setUser(profile);
    await cacheProfile(profile);
  }, []);

  const register = useCallback(
    async (nickname: string, phone: string, password: string, otpToken: string) => {
      const profile = await authApi.register(nickname, phone, password, otpToken);
      setUser(profile);
      await cacheProfile(profile);
    },
    []
  );

  const logout = useCallback(async () => {
    await authApi.logout();
    await AsyncStorage.removeItem(PROFILE_KEY).catch(() => {});
    setUser(null);
  }, []);

  const refreshProfile = useCallback(async () => {
    const profile = await authApi.fetchProfile();
    setUser(profile);
    await cacheProfile(profile);
  }, []);

  const value = useMemo<AuthContextType>(
    () => ({
      isAuthenticated: !!user,
      isRestoring,
      user,
      login,
      register,
      logout,
      refreshProfile,
    }),
    [user, isRestoring, login, register, logout, refreshProfile]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
