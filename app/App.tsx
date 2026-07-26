import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { AppNavigator } from './src/navigation/AppNavigator';
import { StatusBar } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SplashScreen } from './src/screens/SplashScreen';
import { AuthScreens } from './src/screens/AuthScreens';
import { ScenesProvider } from './src/data/ScenesContext';
import { VocabProvider } from './src/data/VocabContext';

export default function App() {
  const [showSplash, setShowSplash] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const splashTimer = setTimeout(() => {
      setShowSplash(false);
    }, 1900);

    console.log("sdfsdfsdf∂")

    return () => clearTimeout(splashTimer);
  }, []);

  if (showSplash) {
    return (
      <GestureHandlerRootView style={{ flex: 1 }}>
        <StatusBar barStyle="light-content" />
        <SplashScreen />
      </GestureHandlerRootView>
    );
  }

  if (!isAuthenticated) {
    return (
      <GestureHandlerRootView style={{ flex: 1 }}>
        <StatusBar barStyle="light-content" />
        <AuthScreens onComplete={() => setIsAuthenticated(true)} />
      </GestureHandlerRootView>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ScenesProvider>
        <VocabProvider>
          <NavigationContainer>
            <StatusBar barStyle="light-content" />
            <AppNavigator />
          </NavigationContainer>
        </VocabProvider>
      </ScenesProvider>
    </GestureHandlerRootView>
  );
}
