import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { AppNavigator } from './src/navigation/AppNavigator';
import { StatusBar } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClientProvider } from '@tanstack/react-query';
import { SplashScreen } from './src/screens/SplashScreen';
import { AuthScreens } from './src/screens/AuthScreens';
import { ScenesProvider } from './src/data/ScenesContext';
import { VocabProvider } from './src/data/VocabContext';
import { LanguageProvider } from './src/data/i18n';
import { AuthProvider, useAuth } from './src/data/AuthContext';
import { PracticeSettingsProvider } from './src/data/PracticeSettingsContext';

import { NotificationProvider } from './src/data/NotificationContext';
import { NotificationBanner } from './src/components/NotificationBanner';
import { ToastProvider } from './src/data/ToastContext';
import { queryClient } from './src/data/queryClient';
import { Toast } from './src/components/Toast';
import { getAssessmentTest, getSpeakingProfile, type AssessmentItem } from './src/api/assessment';
import { PlacementTestFlow } from './src/screens/PlacementTest';

type PlacementGateStatus = 'checking' | 'show' | 'hide';

function AppContent({ showSplash }: { showSplash: boolean }) {
  const { isAuthenticated, isRestoring } = useAuth();
  const [placementStatus, setPlacementStatus] = useState<PlacementGateStatus>('checking');
  const [placementItems, setPlacementItems] = useState<AssessmentItem[] | null>(null);

  // فقط یک‌بار به‌ازای هر ورود بررسی می‌شود: اگر ادمین محتوایی برای تست
  // نساخته باشد، کل فیچر باید نامرئی بماند و اصلاً سراغ پروفایل نمی‌رویم؛
  // اگر محتوا هست ولی کاربر قبلاً تست داده (پروفایل دارد)، هم رد می‌شویم.
  useEffect(() => {
    if (!isAuthenticated) return;
    let active = true;
    (async () => {
      try {
        const items = await getAssessmentTest();
        if (!active) return;
        if (!items || items.length === 0) {
          setPlacementStatus('hide');
          return;
        }
        const profile = await getSpeakingProfile();
        if (!active) return;
        if (profile) {
          setPlacementStatus('hide');
        } else {
          setPlacementItems(items);
          setPlacementStatus('show');
        }
      } catch {
        if (active) setPlacementStatus('hide');
      }
    })();
    return () => {
      active = false;
    };
  }, [isAuthenticated]);

  if (showSplash || isRestoring) {
    return (
      <>
        <StatusBar barStyle="light-content" />
        <SplashScreen />
      </>
    );
  }

  if (!isAuthenticated) {
    return (
      <NotificationProvider>
        <StatusBar barStyle="light-content" />
        <NotificationBanner />
        <AuthScreens />
      </NotificationProvider>
    );
  }

  if (placementStatus === 'checking') {
    return (
      <>
        <StatusBar barStyle="light-content" />
        <SplashScreen />
      </>
    );
  }

  if (placementStatus === 'show') {
    return (
      <NotificationProvider>
        <StatusBar barStyle="light-content" />
        <PlacementTestFlow
          items={placementItems}
          onSkip={() => setPlacementStatus('hide')}
          onDone={() => setPlacementStatus('hide')}
        />
      </NotificationProvider>
    );
  }

  return (
    <NotificationProvider>
      <ScenesProvider>
        <VocabProvider>
          <PracticeSettingsProvider>
            <NavigationContainer>
              <StatusBar barStyle="light-content" />
              <NotificationBanner />
              <AppNavigator />
            </NavigationContainer>
          </PracticeSettingsProvider>
        </VocabProvider>
      </ScenesProvider>
    </NotificationProvider>
  );
}

export default function App() {
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    const splashTimer = setTimeout(() => {
      setShowSplash(false);
    }, 1900);

    return () => clearTimeout(splashTimer);
  }, []);

  return (
    <SafeAreaProvider>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <QueryClientProvider client={queryClient}>
          <LanguageProvider>
            <ToastProvider>
              <AuthProvider>
                <AppContent showSplash={showSplash} />
              </AuthProvider>
              <Toast />
            </ToastProvider>
          </LanguageProvider>
        </QueryClientProvider>
      </GestureHandlerRootView>
    </SafeAreaProvider>
  );
}
