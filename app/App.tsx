import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { AppNavigator } from './src/navigation/AppNavigator';
import { StatusBar } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SplashScreen } from './src/screens/SplashScreen';
import { AuthScreens } from './src/screens/AuthScreens';
import { ScenesProvider } from './src/data/ScenesContext';
import { VocabProvider } from './src/data/VocabContext';
import { LanguageProvider } from './src/data/i18n';
import { AuthProvider, useAuth } from './src/data/AuthContext';
import { PracticeSettingsProvider } from './src/data/PracticeSettingsContext';

import { NotificationProvider } from './src/data/NotificationContext';
import { NotificationBanner } from './src/components/NotificationBanner';

function AppContent({ showSplash }: { showSplash: boolean }) {
  const { isAuthenticated, isRestoring } = useAuth();

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
        <AuthScreens onComplete={() => {}} />
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
    <GestureHandlerRootView style={{ flex: 1 }}>
      <LanguageProvider>
        <AuthProvider>
          <AppContent showSplash={showSplash} />
        </AuthProvider>
      </LanguageProvider>
    </GestureHandlerRootView>
  );
}
