import React from 'react';
import { View } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Home, Compass, Mic, BarChart2, User } from 'lucide-react-native';
import { COLORS } from '../theme/colors';
import { HomeScreen } from '../screens/Home';

import { ScenesScreen, ProgressScreen, ProfileScreen } from '../screens/Placeholders';
import { SceneScreen } from '../screens/SceneScreen';

const Tab = createBottomTabNavigator();

export const AppNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: COLORS.surface,
          borderTopWidth: 1,
          borderTopColor: COLORS.border,
          height: 84,
          paddingBottom: 14,
          paddingTop: 8,
          marginHorizontal: 16,
          marginBottom: 12,
          borderRadius: 24,
          position: 'absolute',
        },
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.textSecondary,
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '700',
        },
      }}
    >
      <Tab.Screen 
        name="Home" 
        component={HomeScreen} 
        options={{
          tabBarLabel: 'Home',
          tabBarIcon: ({ color, size }) => <Home color={color} size={size} />,
        }}
      />
      <Tab.Screen 
        name="Scenes" 
        component={ScenesScreen} 
        options={{
          tabBarLabel: 'Scenes',
          tabBarIcon: ({ color, size }) => <Compass color={color} size={size} />,
        }}
      />
      <Tab.Screen
        name="Shadowing"
        component={SceneScreen}
        options={{
          // در صفحه‌ی صحنه تب‌بار مخفی شود
          tabBarStyle: { display: 'none' },
          tabBarLabel: '',
          tabBarIcon: ({ color, size }) => (
            <View style={{
              backgroundColor: COLORS.primary,
              width: 74,
              height: 74,
              borderRadius: 35,
              top: -15,
              alignItems: 'center',
              justifyContent: 'center',
              elevation: 8,
              shadowColor: COLORS.primary,
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.42,
              shadowRadius: 10,
            }}>
              <Mic color={COLORS.white} size={34} />
            </View>
          ),
        }}
      /> 
       <Tab.Screen 
        name="Progress" 
        component={ProgressScreen} 
        options={{
          tabBarLabel: 'Progress',
          tabBarIcon: ({ color, size }) => <BarChart2 color={color} size={size} />,
        }}
      />
      <Tab.Screen 
        name="Profile" 
        component={ProfileScreen} 
        options={{
          tabBarLabel: 'Profile',
          tabBarIcon: ({ color, size }) => <User color={color} size={size} />,
        }}
      />
    </Tab.Navigator>
  );
};
