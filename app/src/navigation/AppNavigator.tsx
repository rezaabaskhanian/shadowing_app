import React from 'react';
import { useRoute } from '@react-navigation/native';
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
import { AudioLines, CircleUserRound, House, Layers, TrendingUp } from 'lucide-react-native';
import Animated, {
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { COLORS, hexToRgba } from '../theme/colors';
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
import { LanguageHabitScreen } from '../screens/LanguageHabit/LanguageHabitScreen';
import { HabitMissionPracticeScreen } from '../screens/LanguageHabit/HabitMissionPracticeScreen';
import { HabitMissionResultScreen } from '../screens/LanguageHabit/HabitMissionResultScreen';
import { VerbDetailScreen } from '../screens/Verbs/VerbDetailScreen';
import { VerbQuizScreen } from '../screens/Verbs/VerbQuizScreen';
import { VerbSpeakScreen } from '../screens/Verbs/VerbSpeakScreen';
import { TopicSuggestionScreen } from '../screens/TopicSuggestion/TopicSuggestionScreen';
import { ContactUsScreen } from '../screens/ContactUs/ContactUsScreen';
import { HelpFaqScreen } from '../screens/HelpFaq/HelpFaqScreen';
import { CurriculumMapScreen } from '../screens/CurriculumMap/CurriculumMapScreen';
import { QuizScreen } from '../screens/Quiz/QuizScreen';
import { PaywallScreen } from '../screens/Paywall/PaywallScreen';
import { TokenTopupScreen } from '../screens/TokenTopup/TokenTopupScreen';
import { AIConversationScreen } from '../screens/AIConversation';
import { FreeSpeechScreen } from '../screens/FreeSpeech';
import { TopicListScreen } from '../screens/TopicSpeaking/TopicListScreen';
import { TopicSpeakingScreen } from '../screens/TopicSpeaking/TopicSpeakingScreen';
import { VideoClipListScreen } from '../screens/VideoClips/VideoClipListScreen';
import { VideoClipScreen } from '../screens/VideoClips/VideoClipScreen';
import { WritingListScreen } from '../screens/Writing/WritingListScreen';
import { WritingScreen } from '../screens/Writing/WritingScreen';
import { CourseHomeScreen } from '../screens/Course/CourseHomeScreen';
import { CourseLessonScreen } from '../screens/Course/CourseLessonScreen';
import { PathHomeScreen } from '../screens/Path/PathHomeScreen';
import { PathWeakLinesScreen } from '../screens/Path/PathWeakLinesScreen';
import { PathCheckpointScreen } from '../screens/Path/PathCheckpointScreen';
import { PodcastListScreen } from '../screens/Podcast/PodcastListScreen';
import { PodcastScreen } from '../screens/Podcast/PodcastScreen';
import { PodcastMyVersionScreen } from '../screens/Podcast/PodcastMyVersionScreen';
import { ToastDemoScreen } from '../screens/ToastDemoScreen';
import { RealtimePoCScreen } from '../screens/RealtimePoC';
import { useLanguage } from '../data/i18n';

const Tab = createBottomTabNavigator();

/**
 * تب‌ها بعد از ترک صفحه unmount نمی‌شوند و navigate دوباره فقط params را عوض
 * می‌کند؛ برای صفحه‌های تمرینیِ تک‌موضوعی (موضوع/کلیپ/درس/پادکست) این یعنی
 * نتیجه‌ی موضوع قبلی روی موضوع تازه می‌ماند. هر بار باز شدن (openedAt در params)
 * یک نمونه‌ی تازه‌ی صفحه می‌سازد.
 */
function freshPerOpen<P extends object>(Screen: React.ComponentType<P>): React.FC<P> {
  const Fresh: React.FC<P> = (props) => {
    const route = useRoute<any>();
    return <Screen key={String(route.params?.openedAt ?? '')} {...props} />;
  };
  return Fresh;
}

const FreshTopicSpeaking = freshPerOpen(TopicSpeakingScreen);
const FreshVideoClip = freshPerOpen(VideoClipScreen);
const FreshWriting = freshPerOpen(WritingScreen);
const FreshCourseLesson = freshPerOpen(CourseLessonScreen);
const FreshPathWeakLines = freshPerOpen(PathWeakLinesScreen);
const FreshPathCheckpoint = freshPerOpen(PathCheckpointScreen);
const FreshPodcast = freshPerOpen(PodcastScreen);
const FreshPodcastMyVersion = freshPerOpen(PodcastMyVersionScreen);

// روت‌های جزئیات که تب‌بار پایین باید در آن‌ها مخفی شود
const HIDDEN_TAB_BAR_ROUTES = [
  'Shadowing',
  'SubmitScene',
  'MySubmissions',
  'MyRecordings',
  'LanguageHabit',
  'HabitMissionPractice',
  'HabitMissionResult',
  'VerbDetail',
  'VerbQuiz',
  'VerbSpeak',
  'TopicSuggestion',
  'ContactUs',
  'HelpFaq',
  'CurriculumMap',
  'SceneQuiz',
  'AIConversation',
  'FreeSpeech',
  'TopicList',
  'TopicSpeaking',
  'VideoClipList',
  'VideoClip',
  'WritingList',
  'Writing',
  'CourseHome',
  'CourseLesson',
  'PathHome',
  'PathWeakLines',
  'PathCheckpoint',
  'PodcastList',
  'Podcast',
  'PodcastMyVersion',
  'Paywall',
  'TokenTopup',
  'ToastDemo',
  'RealtimePoC',
];

// هر تب رنگ خودش را دارد؛ وقتی انتخاب می‌شود، آیکون و پس‌زمینه‌ی کم‌رنگش به
// همین رنگ درمی‌آیند (خانه همان بنفشِ اصلی اپ است).
const TAB_META: Record<string, { Icon: typeof House; color: string }> = {
  Progress: { Icon: TrendingUp, color: COLORS.tertiary },
  Leitner: { Icon: Layers, color: COLORS.info },
  Home: { Icon: House, color: COLORS.primary },
  Scenes: { Icon: AudioLines, color: COLORS.warning },
  Profile: { Icon: CircleUserRound, color: COLORS.pink },
};

/** یک تبِ معمولی: با انتخاب شدن، پس‌زمینه‌ی رنگی نرم ظاهر و آیکون کمی بزرگ می‌شود. */
const TabButton = ({
  routeName,
  label,
  isFocused,
  onPress,
}: {
  routeName: string;
  label: string;
  isFocused: boolean;
  onPress: () => void;
}) => {
  const { Icon, color } = TAB_META[routeName] || TAB_META.Home;
  const focus = useSharedValue(isFocused ? 1 : 0);
  React.useEffect(() => {
    focus.value = withTiming(isFocused ? 1 : 0, { duration: 220 });
  }, [isFocused, focus]);

  const pillStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(focus.value, [0, 1], ['transparent', hexToRgba(color, 0.14)]),
    transform: [{ scale: 0.9 + focus.value * 0.1 }],
  }));

  return (
    <TouchableOpacity onPress={onPress} style={styles.tabItem} activeOpacity={0.7}>
      <Animated.View style={[styles.iconContainer, pillStyle]}>
        <Icon
          color={isFocused ? color : COLORS.textSecondary}
          size={21}
          strokeWidth={isFocused ? 2.4 : 1.8}
        />
      </Animated.View>
      <Text
        style={[styles.tabLabel, isFocused && styles.activeLabel, isFocused && { color }]}
        numberOfLines={1}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
};

/**
 * دکمه‌ی وسطِ خانه: انتخاب‌نشده سفید با آیکون بنفش، انتخاب‌شده بنفشِ پُر با
 * آیکون سفید و کمی بزرگ‌تر (با فنر).
 */
const HomeTabButton = ({ label, isFocused, onPress }: { label: string; isFocused: boolean; onPress: () => void }) => {
  const focus = useSharedValue(isFocused ? 1 : 0);
  React.useEffect(() => {
    focus.value = withSpring(isFocused ? 1 : 0, { damping: 14, stiffness: 180 });
  }, [isFocused, focus]);

  const circleStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(focus.value, [0, 1], [COLORS.surface, COLORS.primary]),
    borderColor: interpolateColor(focus.value, [0, 1], [COLORS.primary, COLORS.background]),
    transform: [{ scale: 0.94 + focus.value * 0.12 }],
  }));

  return (
    <TouchableOpacity onPress={onPress} style={styles.centerTabItem} activeOpacity={0.85}>
      <Animated.View style={[styles.centerCircle, circleStyle]}>
        <House
          color={isFocused ? COLORS.white : COLORS.primary}
          size={24}
          strokeWidth={isFocused ? 2.4 : 2}
          fill={isFocused ? hexToRgba(COLORS.white, 0.25) : 'transparent'}
        />
      </Animated.View>
      <Text style={[styles.tabLabel, styles.centerLabel, !isFocused && styles.centerLabelIdle]}>{label}</Text>
    </TouchableOpacity>
  );
};

const CustomTabBar = ({ state, navigation }: BottomTabBarProps) => {
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
            return <HomeTabButton key={route.key} label={labelText} isFocused={isFocused} onPress={onPress} />;
          }

          return (
            <TabButton
              key={route.key}
              routeName={route.name}
              label={labelText}
              isFocused={isFocused}
              onPress={onPress}
            />
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
      backBehavior="history"
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
      <Tab.Screen
        name="LanguageHabit"
        component={LanguageHabitScreen}
        options={{
          tabBarButton: () => null,
        }}
      />
      <Tab.Screen
        name="HabitMissionPractice"
        component={HabitMissionPracticeScreen}
        options={{
          tabBarButton: () => null,
        }}
      />
      <Tab.Screen
        name="HabitMissionResult"
        component={HabitMissionResultScreen}
        options={{
          tabBarButton: () => null,
        }}
      />
      <Tab.Screen name="VerbDetail" component={VerbDetailScreen} options={{ tabBarButton: () => null }} />
      <Tab.Screen name="VerbQuiz" component={VerbQuizScreen} options={{ tabBarButton: () => null }} />
      <Tab.Screen name="VerbSpeak" component={VerbSpeakScreen} options={{ tabBarButton: () => null }} />
      <Tab.Screen name="TopicList" component={TopicListScreen} options={{ tabBarButton: () => null }} />
      <Tab.Screen name="TopicSpeaking" component={FreshTopicSpeaking} options={{ tabBarButton: () => null }} />
      <Tab.Screen name="VideoClipList" component={VideoClipListScreen} options={{ tabBarButton: () => null }} />
      <Tab.Screen name="VideoClip" component={FreshVideoClip} options={{ tabBarButton: () => null }} />
      <Tab.Screen name="WritingList" component={WritingListScreen} options={{ tabBarButton: () => null }} />
      <Tab.Screen name="Writing" component={FreshWriting} options={{ tabBarButton: () => null }} />
      <Tab.Screen name="CourseHome" component={CourseHomeScreen} options={{ tabBarButton: () => null }} />
      <Tab.Screen name="CourseLesson" component={FreshCourseLesson} options={{ tabBarButton: () => null }} />
      <Tab.Screen name="PathHome" component={PathHomeScreen} options={{ tabBarButton: () => null }} />
      <Tab.Screen name="PathWeakLines" component={FreshPathWeakLines} options={{ tabBarButton: () => null }} />
      <Tab.Screen name="PathCheckpoint" component={FreshPathCheckpoint} options={{ tabBarButton: () => null }} />
      <Tab.Screen name="PodcastList" component={PodcastListScreen} options={{ tabBarButton: () => null }} />
      <Tab.Screen name="Podcast" component={FreshPodcast} options={{ tabBarButton: () => null }} />
      <Tab.Screen name="PodcastMyVersion" component={FreshPodcastMyVersion} options={{ tabBarButton: () => null }} />
      <Tab.Screen
        name="TopicSuggestion"
        component={TopicSuggestionScreen}
        options={{
          tabBarButton: () => null,
        }}
      />
      <Tab.Screen
        name="ContactUs"
        component={ContactUsScreen}
        options={{
          tabBarButton: () => null,
        }}
      />
      <Tab.Screen
        name="HelpFaq"
        component={HelpFaqScreen}
        options={{
          tabBarButton: () => null,
        }}
      />
      <Tab.Screen
        name="CurriculumMap"
        component={CurriculumMapScreen}
        options={{
          tabBarButton: () => null,
        }}
      />
      <Tab.Screen
        name="SceneQuiz"
        component={QuizScreen}
        options={{
          tabBarButton: () => null,
        }}
      />
      <Tab.Screen
        name="AIConversation"
        component={AIConversationScreen}
        options={{
          tabBarButton: () => null,
        }}
      />
      <Tab.Screen
        name="FreeSpeech"
        component={FreeSpeechScreen}
        options={{
          tabBarButton: () => null,
        }}
      />
      <Tab.Screen
        name="Paywall"
        component={PaywallScreen}
        options={{
          tabBarButton: () => null,
        }}
      />
      <Tab.Screen
        name="TokenTopup"
        component={TokenTopupScreen}
        options={{
          tabBarButton: () => null,
        }}
      />
      <Tab.Screen
        name="ToastDemo"
        component={ToastDemoScreen}
        options={{
          tabBarButton: () => null,
        }}
      />
      <Tab.Screen
        name="RealtimePoC"
        component={RealtimePoCScreen}
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
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    ...SHADOWS.level2,
  },
  iconContainer: {
    width: 44,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
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
    fontFamily: FONT_FAMILY.bold,
  },
  centerLabelIdle: {
    color: COLORS.textSecondary,
    fontFamily: FONT_FAMILY.semiBold,
  },
});
