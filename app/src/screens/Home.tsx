// import React from 'react';
// import {
//   Image,
//   ImageBackground,
//   ScrollView,
//   StyleSheet,
//   Text,
//   TouchableOpacity,
//   View,
// } from 'react-native';
// import { useNavigation } from '@react-navigation/native';
// import { Award, CalendarDays, ChevronRight, Clock, Flame, Play } from 'lucide-react-native';
// import { ScenarioCard } from '../components/ScenarioCard';
// import { CURRENT_SCENARIO, SCENARIOS } from '../data/scenarios';
// import { BORDER_RADIUS, COLORS, SPACING } from '../theme/colors';

// const avatarUri =
//   'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=200&auto=format&fit=crop';

// export const HomeScreen = () => {
//   const navigation = useNavigation<any>();
//   const ContinueIcon = CURRENT_SCENARIO.icon;

//   return (
 
//     <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer} showsVerticalScrollIndicator={false}>
//       <View style={styles.header}>
//         <Image source={{ uri: avatarUri }} style={styles.avatar} />
//         <View style={styles.headerCopy}>
//           <Text style={styles.greeting}>Good Evening, Reza</Text>
//           <Text style={styles.subGreeting}>Keep practicing, great things come with <Text style={styles.highlight}>consistency</Text>!</Text>
//         </View>
//       </View>

//       <View style={styles.quickStats}>
//         <View style={styles.statCard}>
//           <Flame color={COLORS.orange} size={30} fill={COLORS.orange} />
//           <Text style={styles.statNumber}>5</Text>
//           <Text style={styles.statLabel}>Streak</Text>
//         </View>
//         <View style={styles.statCard}>
//           <Award color={COLORS.primary} size={34} />
//           <Text style={styles.statLabel}>Achievements</Text>
//         </View>
//       </View>

//       <View style={styles.journeyCard}>
//         <View style={styles.journeyTop}>
//           <View style={styles.journeyIcon}>
//             <CalendarDays color={COLORS.cyan} size={24} />
//           </View>
//           <View style={styles.journeyCopy}>
//             <Text style={styles.journeyTitle}>7-Day Shadow Journey</Text>
//             <Text style={styles.journeySub}>Day 3 of 7</Text>
//           </View>
//           <View style={styles.bigProgress}>
//             <Text style={styles.bigProgressText}>70%</Text>
//             <Text style={styles.bigProgressLabel}>Progress</Text>
//           </View>
//         </View>
//         <View style={styles.segments}>
//           {[0, 1, 2, 3, 4, 5].map((index) => (
//             <View key={index} style={[styles.segment, index < 4 ? styles.segmentActive : null]} />
//           ))}
//         </View>
//         <View style={styles.journeyDivider} />
//         <View style={styles.journeyBottom}>
//           <Text style={styles.encourage}>You're doing amazing! Keep going!</Text>
//           <TouchableOpacity style={styles.planButton} onPress={() => navigation.navigate('Progress')}>
//             <Text style={styles.planText}>View Plan</Text>
//             <ChevronRight color={COLORS.text} size={18} />
//           </TouchableOpacity>
//         </View>
//       </View>

//       <View style={styles.sectionHeader}>
//         <Text style={styles.sectionTitle}>Continue Learning</Text>
//         <TouchableOpacity onPress={() => navigation.navigate('Scenes')}>
//           <Text style={styles.linkText}>View All</Text>
//         </TouchableOpacity>
//       </View>

//       <TouchableOpacity activeOpacity={0.9} style={styles.continueCard} onPress={() => navigation.navigate('Shadowing')}>
//         <ImageBackground
//           source={{ uri: CURRENT_SCENARIO.imageUri }}
//           style={styles.continueImage}
//           imageStyle={styles.continueImageStyle}
//         >
//           <View style={styles.continueScrim} />
//           <View style={[styles.continueIcon, { backgroundColor: CURRENT_SCENARIO.color }]}>
//             <ContinueIcon color={COLORS.white} size={30} />
//           </View>
//           <View style={styles.continueProgress}>
//             <Text style={styles.continueProgressText}>{CURRENT_SCENARIO.progress}%</Text>
//           </View>
//           <View style={styles.continueDetails}>
//             <Text style={styles.continueTitle}>{CURRENT_SCENARIO.title}</Text>
//             <Text style={styles.continueSub}>{CURRENT_SCENARIO.lesson}</Text>
//             <View style={styles.continueMetaRow}>
//               <View style={styles.badge}>
//                 <View style={styles.levelDot} />
//                 <Text style={styles.badgeText}>{CURRENT_SCENARIO.level}</Text>
//               </View>
//               <View style={styles.timePill}>
//                 <Clock color={COLORS.text} size={15} />
//                 <Text style={styles.timePillText}>{CURRENT_SCENARIO.time}</Text>
//               </View>
//             </View>
//             <View style={styles.lessonTrack}>
//               {[0, 1, 2, 3, 4, 5, 6].map((index) => (
//                 <View key={index} style={[styles.trackNode, index < 3 ? styles.trackDone : null]} />
//               ))}
//             </View>
//             <TouchableOpacity style={styles.continueButton} onPress={() => navigation.navigate('Shadowing')}>
//               <Play color={COLORS.white} size={18} fill={COLORS.white} />
//               <Text style={styles.continueButtonText}>Continue</Text>
//             </TouchableOpacity>
//           </View>
//         </ImageBackground>
//       </TouchableOpacity>

//       <View style={styles.sectionHeader}>
//         <Text style={styles.sectionTitle}>Your Scenarios</Text>
//         <TouchableOpacity onPress={() => navigation.navigate('Scenes')}>
//           <Text style={styles.linkText}>See All</Text>
//         </TouchableOpacity>
//       </View>

//       <View style={styles.grid}>
//         {SCENARIOS.filter((scenario) => scenario.id !== CURRENT_SCENARIO.id).map((scenario) => (
//           <ScenarioCard
//             key={scenario.id}
//             title={scenario.title}
//             level={scenario.level}
//             progress={scenario.progress}
//             time={scenario.time}
//             imageUri={scenario.imageUri}
//             color={scenario.color}
//             Icon={scenario.icon}
//             onPress={() => navigation.navigate('Shadowing')}
//             isSmall
//           />
//         ))}
//       </View>
//     </ScrollView>
//   );
// };

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: COLORS.background,
//   },
//   contentContainer: {
//     paddingTop: 52,
//     paddingHorizontal: SPACING.m,
//     paddingBottom: 118,
//   },
//   header: {
//     flexDirection: 'row',
//     alignItems: 'center',
//   },
//   avatar: {
//     width: 74,
//     height: 74,
//     borderRadius: 37,
//     borderWidth: 2,
//     borderColor: COLORS.border,
//   },
//   headerCopy: {
//     flex: 1,
//     marginLeft: 16,
//   },
//   greeting: {
//     color: COLORS.text,
//     fontSize: 26,
//     fontWeight: '900',
//   },
//   subGreeting: {
//     color: COLORS.textSecondary,
//     fontSize: 17,
//     lineHeight: 25,
//     marginTop: 6,
//   },
//   highlight: {
//     color: COLORS.primary,
//     fontWeight: '800',
//   },
//   quickStats: {
//     position: 'absolute',
//     right: SPACING.m,
//     top: 112,
//     flexDirection: 'row',
//     gap: 12,
//   },
//   statCard: {
//     width: 108,
//     minHeight: 96,
//     borderRadius: 20,
//     backgroundColor: 'rgba(17, 26, 44, 0.78)',
//     borderWidth: 1,
//     borderColor: COLORS.border,
//     alignItems: 'center',
//     justifyContent: 'center',
//     padding: 10,
//   },
//   statNumber: {
//     position: 'absolute',
//     right: 18,
//     top: 34,
//     color: COLORS.text,
//     fontSize: 20,
//     fontWeight: '800',
//   },
//   statLabel: {
//     color: COLORS.text,
//     fontSize: 14,
//     marginTop: 8,
//     textAlign: 'center',
//   },
//   journeyCard: {
//     marginTop: 34,
//     borderRadius: BORDER_RADIUS.l,
//     backgroundColor: COLORS.surface,
//     borderWidth: 1,
//     borderColor: COLORS.border,
//     padding: 22,
//   },
//   journeyTop: {
//     flexDirection: 'row',
//     alignItems: 'center',
//   },
//   journeyIcon: {
//     width: 42,
//     height: 42,
//     borderRadius: 12,
//     backgroundColor: 'rgba(55, 199, 255, 0.14)',
//     alignItems: 'center',
//     justifyContent: 'center',
//   },
//   journeyCopy: {
//     flex: 1,
//     marginLeft: 14,
//   },
//   journeyTitle: {
//     color: COLORS.text,
//     fontSize: 21,
//     fontWeight: '900',
//   },
//   journeySub: {
//     color: COLORS.textSecondary,
//     fontSize: 16,
//     marginTop: 6,
//   },
//   bigProgress: {
//     width: 106,
//     height: 106,
//     borderRadius: 53,
//     borderWidth: 8,
//     borderColor: COLORS.primary,
//     alignItems: 'center',
//     justifyContent: 'center',
//     backgroundColor: COLORS.backgroundSoft,
//   },
//   bigProgressText: {
//     color: COLORS.text,
//     fontSize: 28,
//     fontWeight: '900',
//   },
//   bigProgressLabel: {
//     color: COLORS.textSecondary,
//     fontSize: 13,
//   },
//   segments: {
//     flexDirection: 'row',
//     gap: 5,
//     marginTop: 22,
//   },
//   segment: {
//     flex: 1,
//     height: 12,
//     borderRadius: 8,
//     backgroundColor: COLORS.border,
//   },
//   segmentActive: {
//     backgroundColor: COLORS.primary,
//   },
//   journeyDivider: {
//     height: 1,
//     backgroundColor: COLORS.border,
//     marginVertical: 22,
//   },
//   journeyBottom: {
//     flexDirection: 'row',
//     alignItems: 'center',
//   },
//   encourage: {
//     flex: 1,
//     color: COLORS.text,
//     fontSize: 17,
//   },
//   planButton: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     borderRadius: 16,
//     backgroundColor: COLORS.surfaceLight,
//     paddingHorizontal: 16,
//     paddingVertical: 12,
//   },
//   planText: {
//     color: '#C7B4FF',
//     fontSize: 16,
//     fontWeight: '700',
//     marginRight: 6,
//   },
//   sectionHeader: {
//     marginTop: 30,
//     marginBottom: 14,
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'space-between',
//   },
//   sectionTitle: {
//     color: COLORS.text,
//     fontSize: 24,
//     fontWeight: '900',
//   },
//   linkText: {
//     color: COLORS.primary,
//     fontSize: 17,
//     fontWeight: '800',
//   },
//   continueCard: {
//     height: 360,
//     borderRadius: BORDER_RADIUS.l,
//     overflow: 'hidden',
//     borderWidth: 1,
//     borderColor: COLORS.border,
//   },
//   continueImage: {
//     flex: 1,
//   },
//   continueImageStyle: {
//     borderRadius: BORDER_RADIUS.l,
//   },
//   continueScrim: {
//     ...StyleSheet.absoluteFill,
//     backgroundColor: 'rgba(2, 8, 20, 0.42)',
//   },
//   continueIcon: {
//     position: 'absolute',
//     top: 94,
//     left: 32,
//     width: 64,
//     height: 64,
//     borderRadius: 18,
//     alignItems: 'center',
//     justifyContent: 'center',
//   },
//   continueProgress: {
//     position: 'absolute',
//     right: 28,
//     top: 126,
//     width: 64,
//     height: 64,
//     borderRadius: 32,
//     borderWidth: 4,
//     borderColor: COLORS.accent,
//     backgroundColor: 'rgba(5, 11, 24, 0.7)',
//     alignItems: 'center',
//     justifyContent: 'center',
//   },
//   continueProgressText: {
//     color: COLORS.text,
//     fontSize: 18,
//     fontWeight: '900',
//   },
//   continueDetails: {
//     flex: 1,
//     justifyContent: 'flex-end',
//     padding: 32,
//   },
//   continueTitle: {
//     color: COLORS.text,
//     fontSize: 30,
//     fontWeight: '900',
//   },
//   continueSub: {
//     color: COLORS.text,
//     fontSize: 19,
//     marginTop: 8,
//   },
//   continueMetaRow: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     marginTop: 20,
//   },
//   badge: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     borderRadius: 10,
//     backgroundColor: 'rgba(17, 26, 44, 0.86)',
//     paddingHorizontal: 12,
//     paddingVertical: 8,
//   },
//   levelDot: {
//     width: 10,
//     height: 10,
//     borderRadius: 5,
//     backgroundColor: COLORS.accent,
//     marginRight: 8,
//   },
//   badgeText: {
//     color: COLORS.text,
//     fontSize: 14,
//     fontWeight: '700',
//   },
//   timePill: {
//     flexDirection: 'row',
//     alignItems: 'center',
//   },
//   timePillText: {
//     color: COLORS.text,
//     fontSize: 16,
//     marginLeft: 6,
//     fontWeight: '700',
//   },
//   lessonTrack: {
//     flexDirection: 'row',
//     gap: 10,
//     marginTop: 28,
//     marginBottom: 22,
//   },
//   trackNode: {
//     flex: 1,
//     height: 9,
//     borderRadius: 10,
//     backgroundColor: COLORS.border,
//   },
//   trackDone: {
//     backgroundColor: COLORS.accent,
//   },
//   continueButton: {
//     position: 'absolute',
//     right: 28,
//     bottom: 66,
//     flexDirection: 'row',
//     alignItems: 'center',
//     backgroundColor: COLORS.primary,
//     borderRadius: 16,
//     paddingHorizontal: 22,
//     paddingVertical: 15,
//   },
//   continueButtonText: {
//     color: COLORS.white,
//     fontSize: 18,
//     fontWeight: '800',
//     marginLeft: 8,
//   },
//   grid: {
//     flexDirection: 'row',
//     flexWrap: 'wrap',
//     justifyContent: 'space-between',
//   },
// });



import React from 'react';
import {
  Image,
  ImageBackground,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Award, CalendarDays, ChevronRight, Clock, Flame, Play } from 'lucide-react-native';
import { ScenarioCard } from '../components/ScenarioCard';
import { useScenes } from '../data/ScenesContext';
import { BORDER_RADIUS, COLORS, SPACING } from '../theme/colors';

const avatarUri =
  'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=200&auto=format&fit=crop';

export const HomeScreen = () => {
  const navigation = useNavigation<any>();
  const { scenes } = useScenes();
  const CURRENT_SCENARIO = scenes[0];
  if (!CURRENT_SCENARIO) return null;
  const ContinueIcon = CURRENT_SCENARIO.icon;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Image source={{ uri: avatarUri }} style={styles.avatar} />
        <View style={styles.headerCopy}>
          <Text style={styles.greeting}>Good Evening, Reza</Text>
          <Text style={styles.subGreeting}>Keep practicing, great things come with <Text style={styles.highlight}>consistency</Text>!</Text>
        </View>
      </View>

      <View style={styles.quickStats}>
        <View style={styles.statCard}>
          <Flame color={COLORS.orange} size={30} fill={COLORS.orange} />
          <Text style={styles.statNumber}>5</Text>
          <Text style={styles.statLabel}>Streak</Text>
        </View>
        <View style={styles.statCard}>
          <Award color={COLORS.primary} size={34} />
          <Text style={styles.statLabel}>Achievements</Text>
        </View>
      </View>

      <View style={styles.journeyCard}>
        <View style={styles.journeyTop}>
          <View style={styles.journeyIcon}>
            <CalendarDays color={COLORS.cyan} size={24} />
          </View>
          <View style={styles.journeyCopy}>
            <Text style={styles.journeyTitle}>7-Day Shadow Journey</Text>
            <Text style={styles.journeySub}>Day 3 of 7</Text>
          </View>
          <View style={styles.bigProgress}>
            <Text style={styles.bigProgressText}>70%</Text>
            <Text style={styles.bigProgressLabel}>Progress</Text>
          </View>
        </View>
        <View style={styles.segments}>
          {[0, 1, 2, 3, 4, 5].map((index) => (
            <View key={index} style={[styles.segment, index < 4 ? styles.segmentActive : null]} />
          ))}
        </View>
        <View style={styles.journeyDivider} />
        <View style={styles.journeyBottom}>
          <Text style={styles.encourage}>You're doing amazing! Keep going!</Text>
          <TouchableOpacity style={styles.planButton} onPress={() => navigation.navigate('Progress')}>
            <Text style={styles.planText}>View Plan</Text>
            <ChevronRight color={COLORS.text} size={18} />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Continue Learning</Text>
        <TouchableOpacity onPress={() => navigation.navigate('Scenes')}>
          <Text style={styles.linkText}>View All</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity activeOpacity={0.9} style={styles.continueCard} onPress={() => navigation.navigate('Shadowing', { scenarioId: CURRENT_SCENARIO.id })}>
        <ImageBackground
          source={CURRENT_SCENARIO.imageUri}
          style={styles.continueImage}
          imageStyle={styles.continueImageStyle}
        >
          <View style={styles.continueScrim} />
          <View style={[styles.continueIcon, { backgroundColor: CURRENT_SCENARIO.color }]}>
            <ContinueIcon color={COLORS.white} size={30} />
          </View>
          <View style={styles.continueProgress}>
            <Text style={styles.continueProgressText}>{CURRENT_SCENARIO.progress}%</Text>
          </View>
          <View style={styles.continueDetails}>
            <Text style={styles.continueTitle}>{CURRENT_SCENARIO.title}</Text>
            <Text style={styles.continueSub}>{CURRENT_SCENARIO.lesson}</Text>
            <View style={styles.continueMetaRow}>
              <View style={styles.badge}>
                <View style={styles.levelDot} />
                <Text style={styles.badgeText}>{CURRENT_SCENARIO.level}</Text>
              </View>
              <View style={styles.timePill}>
                <Clock color={COLORS.text} size={15} />
                <Text style={styles.timePillText}>{CURRENT_SCENARIO.time}</Text>
              </View>
            </View>
            <View style={styles.lessonTrack}>
              {[0, 1, 2, 3, 4, 5, 6].map((index) => (
                <View key={index} style={[styles.trackNode, index < 3 ? styles.trackDone : null]} />
              ))}
            </View>
            <TouchableOpacity style={styles.continueButton} onPress={() => navigation.navigate('Shadowing', { scenarioId: CURRENT_SCENARIO.id })}>
              <Play color={COLORS.white} size={18} fill={COLORS.white} />
              <Text style={styles.continueButtonText}>Continue</Text>
            </TouchableOpacity>
          </View>
        </ImageBackground>
      </TouchableOpacity>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Your Scenarios</Text>
        <TouchableOpacity onPress={() => navigation.navigate('Scenes')}>
          <Text style={styles.linkText}>See All</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.grid}>
        {scenes.filter((scenario) => scenario.id !== CURRENT_SCENARIO.id).map((scenario) => (
          <ScenarioCard
            key={scenario.id}
            title={scenario.title}
            level={scenario.level}
            progress={scenario.progress}
            time={scenario.time}
            imageUri={scenario.imageUri}
            color={scenario.color}
            Icon={scenario.icon}
            onPress={() => navigation.navigate('Shadowing', { scenarioId: scenario.id })}
            isSmall
          />
        ))}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  contentContainer: {
    paddingTop: 52,
    paddingHorizontal: SPACING.m,
    paddingBottom: 118,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 74,
    height: 74,
    borderRadius: 37,
    borderWidth: 2,
    borderColor: COLORS.border,
  },
  headerCopy: {
    flex: 1,
    marginLeft: 16,
  },
  greeting: {
    color: COLORS.text,
    fontSize: 26,
    fontWeight: '900',
  },
  subGreeting: {
    color: COLORS.textSecondary,
    fontSize: 17,
    lineHeight: 25,
    marginTop: 6,
  },
  highlight: {
    color: COLORS.primary,
    fontWeight: '800',
  },
  quickStats: {
    position: 'absolute',
    right: SPACING.m,
    top: 112,
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    width: 108,
    minHeight: 96,
    borderRadius: 20,
    backgroundColor: 'rgba(17, 26, 44, 0.78)',
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
  },
  statNumber: {
    position: 'absolute',
    right: 18,
    top: 34,
    color: COLORS.text,
    fontSize: 20,
    fontWeight: '800',
  },
  statLabel: {
    color: COLORS.text,
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
  },
  journeyCard: {
    marginTop: 34,
    borderRadius: BORDER_RADIUS.l,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 22,
  },
  journeyTop: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  journeyIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: 'rgba(55, 199, 255, 0.14)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  journeyCopy: {
    flex: 1,
    marginLeft: 14,
  },
  journeyTitle: {
    color: COLORS.text,
    fontSize: 21,
    fontWeight: '900',
  },
  journeySub: {
    color: COLORS.textSecondary,
    fontSize: 16,
    marginTop: 6,
  },
  bigProgress: {
    width: 106,
    height: 106,
    borderRadius: 53,
    borderWidth: 8,
    borderColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.backgroundSoft,
  },
  bigProgressText: {
    color: COLORS.text,
    fontSize: 28,
    fontWeight: '900',
  },
  bigProgressLabel: {
    color: COLORS.textSecondary,
    fontSize: 13,
  },
  segments: {
    flexDirection: 'row',
    gap: 5,
    marginTop: 22,
  },
  segment: {
    flex: 1,
    height: 12,
    borderRadius: 8,
    backgroundColor: COLORS.border,
  },
  segmentActive: {
    backgroundColor: COLORS.primary,
  },
  journeyDivider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: 22,
  },
  journeyBottom: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  encourage: {
    flex: 1,
    color: COLORS.text,
    fontSize: 17,
  },
  planButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    backgroundColor: COLORS.surfaceLight,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  planText: {
    color: '#C7B4FF',
    fontSize: 16,
    fontWeight: '700',
    marginRight: 6,
  },
  sectionHeader: {
    marginTop: 30,
    marginBottom: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    color: COLORS.text,
    fontSize: 24,
    fontWeight: '900',
  },
  linkText: {
    color: COLORS.primary,
    fontSize: 17,
    fontWeight: '800',
  },
  continueCard: {
    height: 360,
    borderRadius: BORDER_RADIUS.l,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  continueImage: {
    flex: 1,
  },
  continueImageStyle: {
    borderRadius: BORDER_RADIUS.l,
  },
  continueScrim: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(2, 8, 20, 0.42)',
  },
  continueIcon: {
    position: 'absolute',
    top: 94,
    left: 32,
    width: 64,
    height: 64,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  continueProgress: {
    position: 'absolute',
    right: 28,
    top: 126,
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 4,
    borderColor: COLORS.accent,
    backgroundColor: 'rgba(5, 11, 24, 0.7)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  continueProgressText: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: '900',
  },
  continueDetails: {
    flex: 1,
    justifyContent: 'flex-end',
    padding: 32,
  },
  continueTitle: {
    color: COLORS.text,
    fontSize: 30,
    fontWeight: '900',
  },
  continueSub: {
    color: COLORS.text,
    fontSize: 19,
    marginTop: 8,
  },
  continueMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 20,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 10,
    backgroundColor: 'rgba(17, 26, 44, 0.86)',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  levelDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.accent,
    marginRight: 8,
  },
  badgeText: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: '700',
  },
  timePill: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timePillText: {
    color: COLORS.text,
    fontSize: 16,
    marginLeft: 6,
    fontWeight: '700',
  },
  lessonTrack: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 28,
    marginBottom: 22,
  },
  trackNode: {
    flex: 1,
    height: 9,
    borderRadius: 10,
    backgroundColor: COLORS.border,
  },
  trackDone: {
    backgroundColor: COLORS.accent,
  },
  continueButton: {
    position: 'absolute',
    right: 28,
    bottom: 66,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    borderRadius: 16,
    paddingHorizontal: 22,
    paddingVertical: 15,
  },
  continueButtonText: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: '800',
    marginLeft: 8,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
});