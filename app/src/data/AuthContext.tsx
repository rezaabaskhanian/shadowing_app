import React, { createContext, useContext, useEffect, useState } from 'react';
import * as authApi from '../api/auth';
import { getToken, clearToken } from '../api/client';

interface AuthContextType {
  isAuthenticated: boolean;
  isRestoring: boolean;
  user: authApi.UserInfo | null;
  login: (phone: string, password: string) => Promise<void>;
  register: (nickname: string, phone: string, password: string) => Promise<void>;
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
        try {
          const profile = await authApi.fetchProfile();
          setUser(profile);
        } catch (e) {
          await clearToken();
        }
      }
      setIsRestoring(false);
    })();
  }, []);

  const login = async (phone: string, password: string) => {
    const profile = await authApi.login(phone, password);
    setUser(profile);
  };

  const register = async (nickname: string, phone: string, password: string) => {
    const profile = await authApi.register(nickname, phone, password);
    setUser(profile);
  };

  const logout = async () => {
    await authApi.logout();
    setUser(null);
  };

  const refreshProfile = async () => {
    const profile = await authApi.fetchProfile();
    setUser(profile);
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated: !!user,
        isRestoring,
        user,
        login,
        register,
        logout,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
