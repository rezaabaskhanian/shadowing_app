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
import { HomeScreen } from '../screens/Home';
import {
  ProgressScreen,
  ProfileScreen,
  ScenesScreen,
} from '../screens/Placeholders';
import { LeitnerScreen } from '../screens/LeitnerScreen';
import { SceneScreen } from '../screens/SceneScreen';
import { useLanguage } from '../data/i18n';

const Tab = createBottomTabNavigator();

const CustomTabBar = ({ state, descriptors, navigation }: BottomTabBarProps) => {
  const { t } = useLanguage();

  // Hide tab bar on scene practice detail screen
  const currentRouteName = state.routes[state.index]?.name;
  if (currentRouteName === 'Shadowing') {
    return null;
  }

  return (
    <View style={styles.tabBarWrapper}>
      <View style={styles.tabBarContainer}>
        {state.routes.map((route, index) => {
          if (route.name === 'Shadowing') return null;

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
                  <HomeIcon color={COLORS.black} size={24} fill={COLORS.black} />
                </View>
                <Text style={[styles.tabLabel, styles.centerLabel, isFocused && styles.activeLabel]}>
                  {labelText}
                </Text>
              </TouchableOpacity>
            );
          }

          const renderIcon = () => {
            const color = isFocused ? COLORS.amber : COLORS.textSecondary;
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.45,
    shadowRadius: 16,
    elevation: 12,
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
    backgroundColor: COLORS.amber,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.amber,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 8,
    borderWidth: 3,
    borderColor: COLORS.background,
  },
  centerCircleActive: {
    backgroundColor: COLORS.amber,
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
    backgroundColor: 'rgba(255, 160, 28, 0.12)',
  },
  tabLabel: {
    color: COLORS.textSecondary,
    fontSize: 10,
    fontWeight: '700',
    marginTop: 2,
  },
  centerLabel: {
    color: COLORS.amber,
    fontWeight: '800',
    marginTop: 3,
  },
  activeLabel: {
    color: COLORS.amber,
    fontWeight: '800',
  },
});
