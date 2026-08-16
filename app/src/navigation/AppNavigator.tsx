import React from 'react';
import {
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  createBottomTabNavigator,
  BottomTabBarProps,
} from '@react-navigation/bottom-tabs';
import {
  Home as HomeIcon,
  BarChart2,
  BookOpen,
  Mic,
  User,
} from 'lucide-react-native';
import { COLORS } from '../theme/colors';
import { FONT_FAMILY } from '../theme/typography';
import { SHADOWS } from '../theme/elevation';
import { HomeScreen } from '../screens/Home';
import {
  ProgressScreen,
  ProfileScreen,
  ScenesScreen,
} from '../screens/Placeholders';
import { LeitnerScreen } from '../screens/LeitnerScreen';
import { SceneScreen } from '../screens/SceneScreen';
import { SubmitSceneScreen } from '../screens/SubmitSceneScreen';
import { MySubmissionsScreen } from '../screens/MySubmissionsScreen';
import { MyRecordingsScreen } from '../screens/MyRecordingsScreen';
import { useLanguage } from '../data/i18n';

const Tab = createBottomTabNavigator();

// روت‌های جزئیات که تب‌بار پایین باید در آن‌ها مخفی شود
const HIDDEN_TAB_BAR_ROUTES = ['Shadowing', 'SubmitScene', 'MySubmissions', 'MyRecordings'];

const CustomTabBar = ({ state, descriptors, navigation }: BottomTabBarProps) => {
  const { t } = useLanguage();

  // Hide tab bar on detail/flow screens (scene practice, scene submission)
  const currentRouteName = state.routes[state.index]?.name;
  if (HIDDEN_TAB_BAR_ROUTES.includes(currentRouteName)) {
    return null;
  }

  return (
    <View style={styles.tabBarWrapper}>
      <View style={styles.tabBarContainer}>
        {state.routes.map((route, index) => {
          if (HIDDEN_TAB_BAR_ROUTES.includes(route.name)) return null;

          const isFocused = state.index === index;
          const isHome = route.name === 'Home';

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          let labelText = '';
          switch (route.name) {
            case 'Progress':
              labelText = t('progress');
              break;
            case 'Leitner':
              labelText = t('leitner');
              break;
            case 'Home':
              labelText = t('home');
              break;
            case 'Scenes':
              labelText = t('shadowing');
              break;
            case 'Profile':
              labelText = t('profile');
              break;
            default:
              labelText = route.name;
          }

          if (isHome) {
            return (
              <TouchableOpacity
                key={route.key}
                onPress={onPress}
                style={styles.centerTabItem}
                activeOpacity={0.85}
              >
                <View style={[styles.centerCircle, isFocused && styles.centerCircleActive]}>
                  <HomeIcon color={COLORS.white} size={24} fill={COLORS.white} />
                </View>
                <Text style={[styles.tabLabel, styles.centerLabel, isFocused && styles.activeLabel]}>
                  {labelText}
                </Text>
              </TouchableOpacity>
            );
          }

          const renderIcon = () => {
            const color = isFocused ? COLORS.primary : COLORS.textSecondary;
            const size = 20;

            switch (route.name) {
              case 'Progress':
                return <BarChart2 color={color} size={size} />;
              case 'Leitner':
                return <BookOpen color={color} size={size} />;
              case 'Scenes':
                return <Mic color={color} size={size} />;
              case 'Profile':
                return <User color={color} size={size} />;
              default:
                return <HomeIcon color={color} size={size} />;
            }
          };

          return (
            <TouchableOpacity
              key={route.key}
              onPress={onPress}
              style={styles.tabItem}
              activeOpacity={0.7}
            >
              <View style={[styles.iconContainer, isFocused && styles.activeIconContainer]}>
                {renderIcon()}
              </View>
              <Text style={[styles.tabLabel, isFocused && styles.activeLabel]} numberOfLines={1}>
                {labelText}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

export const AppNavigator = () => {
  return (
    <Tab.Navigator
      initialRouteName="Home"
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tab.Screen name="Progress" component={ProgressScreen} />
      <Tab.Screen name="Leitner" component={LeitnerScreen} />
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Scenes" component={ScenesScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
      <Tab.Screen
        name="Shadowing"
        component={SceneScreen}
        options={{
          tabBarButton: () => null,
        }}
      />
      <Tab.Screen
        name="SubmitScene"
        component={SubmitSceneScreen}
        options={{
          tabBarButton: () => null,
        }}
      />
      <Tab.Screen
        name="MySubmissions"
        component={MySubmissionsScreen}
        options={{
          tabBarButton: () => null,
        }}
      />
      <Tab.Screen
        name="MyRecordings"
        component={MyRecordingsScreen}
        options={{
          tabBarButton: () => null,
        }}
      />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  tabBarWrapper: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 24 : 16,
    left: 14,
    right: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabBarContainer: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    borderRadius: 36,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 6,
    paddingVertical: 6,
    height: 70,
    alignItems: 'center',
    justifyContent: 'space-around',
    width: '100%',
    ...SHADOWS.level2,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
  },
  centerTabItem: {
    flex: 1.1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -14,
  },
  centerCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: COLORS.background,
    ...SHADOWS.level2,
  },
  centerCircleActive: {
    backgroundColor: COLORS.primary,
    transform: [{ scale: 1.05 }],
  },
  iconContainer: {
    width: 36,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeIconContainer: {
    backgroundColor: COLORS.primaryLight,
  },
  tabLabel: {
    color: COLORS.textSecondary,
    fontFamily: FONT_FAMILY.semiBold,
    fontSize: 10,
    marginTop: 2,
  },
  centerLabel: {
    color: COLORS.primary,
    fontFamily: FONT_FAMILY.bold,
    marginTop: 3,
  },
  activeLabel: {
    color: COLORS.primary,
    fontFamily: FONT_FAMILY.bold,
  },
});
