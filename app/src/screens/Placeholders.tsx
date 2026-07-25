import React from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Lock, Play, RotateCcw, Settings } from 'lucide-react-native';
import { ScenarioCard } from '../components/ScenarioCard';
import { useScenes } from '../data/ScenesContext';
import { BORDER_RADIUS, COLORS, SPACING } from '../theme/colors';

export { HomeScreen } from './Home';

export const ScenesScreen = () => {
  const navigation = useNavigation<any>();
  const { scenes } = useScenes();

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
      <View style={styles.topBar}>
        <Text style={styles.kicker}>Journey</Text>
        <TouchableOpacity style={styles.iconButton} onPress={() => navigation.navigate('Profile')}>
          <Settings color={COLORS.text} size={20} />
        </TouchableOpacity>
      </View>
      <Text style={styles.pageTitle}>Choose Your Scenario</Text>
      <Text style={styles.pageSub}>Practice natural conversations in real places.</Text>

      <View style={styles.featuredList}>
        {scenes.map((scenario) => (
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
          />
        ))}
      </View>
    </ScrollView>
  );
};

export const ProgressScreen = () => {
  const navigation = useNavigation<any>();

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
      <Text style={styles.pageTitle}>Great Job!</Text>
      <Text style={styles.pageSub}>You did amazing on today's practice.</Text>

      <View style={styles.scoreCard}>
        <View style={styles.scoreRing}>
          <Text style={styles.scoreValue}>87</Text>
          <Text style={styles.scoreLabel}>Overall Score</Text>
        </View>
        <View style={styles.scoreRow}>
          <View style={styles.scoreMetric}>
            <Text style={styles.metricValue}>90</Text>
            <Text style={styles.metricLabel}>Pronunciation</Text>
          </View>
          <View style={styles.scoreMetric}>
            <Text style={styles.metricValue}>83</Text>
            <Text style={styles.metricLabel}>Fluency</Text>
          </View>
        </View>
      </View>

      <View style={styles.practiceCard}>
        <Text style={styles.cardTitle}>Compare</Text>
        <View style={styles.waveRow}>
          <TouchableOpacity style={styles.playCircle}>
            <Play color={COLORS.white} size={18} fill={COLORS.white} />
          </TouchableOpacity>
          <View style={styles.waveform}>
            {Array.from({ length: 34 }).map((_, index) => (
              <View
                key={index}
                style={[
                  styles.waveBar,
                  {
                    height: 8 + ((index * 7) % 30),
                    backgroundColor: index % 2 === 0 ? COLORS.pink : COLORS.cyan,
                  },
                ]}
              />
            ))}
          </View>
        </View>
      </View>

      <View style={styles.feedbackCard}>
        <Text style={styles.feedbackTitle}>Keep practicing! You're sounding more natural.</Text>
        <View style={styles.feedbackActions}>
          <TouchableOpacity style={styles.secondaryButton} onPress={() => navigation.navigate('Shadowing')}>
            <RotateCcw color={COLORS.text} size={18} />
            <Text style={styles.secondaryButtonText}>Replay</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.primaryButton} onPress={() => navigation.navigate('Shadowing')}>
            <Text style={styles.primaryButtonText}>Next Dialogue</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
};

export const ProfileScreen = () => (
  <ScrollView style={styles.screen} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
    <Text style={styles.pageTitle}>Profile</Text>
    <Text style={styles.pageSub}>Your learning stats and achievements.</Text>

    <View style={styles.profileCard}>
      <View style={styles.profileAvatar}>
        <Text style={styles.profileInitial}>R</Text>
      </View>
      <View>
        <Text style={styles.profileName}>Reza</Text>
        <Text style={styles.profileLevel}>Beginner - 5 day streak</Text>
      </View>
    </View>

    <View style={styles.profileGrid}>
      <View style={styles.profileTile}>
        <Text style={styles.tileValue}>18</Text>
        <Text style={styles.tileLabel}>Lessons</Text>
      </View>
      <View style={styles.profileTile}>
        <Text style={styles.tileValue}>7</Text>
        <Text style={styles.tileLabel}>Badges</Text>
      </View>
      <View style={styles.profileTile}>
        <Text style={styles.tileValue}>4.2h</Text>
        <Text style={styles.tileLabel}>Practice</Text>
      </View>
      <View style={styles.profileTile}>
        <Text style={styles.tileValue}>87</Text>
        <Text style={styles.tileLabel}>Best Score</Text>
      </View>
    </View>

    <View style={styles.lockedCard}>
      <Lock color={COLORS.primary} size={22} />
      <View style={styles.lockedCopy}>
        <Text style={styles.cardTitle}>Next Achievement</Text>
        <Text style={styles.pageSub}>Complete two more lessons to unlock Fluent Starter.</Text>
      </View>
    </View>
  </ScrollView>
);

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    paddingTop: 56,
    paddingHorizontal: SPACING.m,
    paddingBottom: 116,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  kicker: {
    color: COLORS.primary,
    fontSize: 16,
    fontWeight: '800',
  },
  iconButton: {
    width: 42,
    height: 42,
    borderRadius: 16,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pageTitle: {
    color: COLORS.text,
    fontSize: 30,
    fontWeight: '900',
    marginTop: 12,
  },
  pageSub: {
    color: COLORS.textSecondary,
    fontSize: 16,
    lineHeight: 23,
    marginTop: 8,
  },
  featuredList: {
    marginTop: 24,
  },
  scoreCard: {
    marginTop: 28,
    borderRadius: BORDER_RADIUS.l,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 24,
    alignItems: 'center',
  },
  scoreRing: {
    width: 166,
    height: 166,
    borderRadius: 83,
    borderWidth: 9,
    borderColor: COLORS.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.backgroundSoft,
  },
  scoreValue: {
    color: COLORS.text,
    fontSize: 42,
    fontWeight: '900',
  },
  scoreLabel: {
    color: COLORS.textSecondary,
    fontSize: 13,
  },
  scoreRow: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 24,
  },
  scoreMetric: {
    alignItems: 'center',
  },
  metricValue: {
    color: COLORS.accent,
    fontSize: 24,
    fontWeight: '900',
  },
  metricLabel: {
    color: COLORS.textSecondary,
    fontSize: 13,
    marginTop: 4,
  },
  practiceCard: {
    marginTop: 18,
    borderRadius: BORDER_RADIUS.m,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 18,
  },
  cardTitle: {
    color: COLORS.text,
    fontSize: 17,
    fontWeight: '800',
  },
  waveRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
  },
  playCircle: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  waveform: {
    flex: 1,
    height: 58,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginLeft: 14,
  },
  waveBar: {
    width: 4,
    borderRadius: 4,
  },
  feedbackCard: {
    marginTop: 18,
    borderRadius: BORDER_RADIUS.m,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 18,
  },
  feedbackTitle: {
    color: COLORS.text,
    fontSize: 17,
    fontWeight: '800',
    lineHeight: 24,
  },
  feedbackActions: {
    flexDirection: 'row',
    marginTop: 20,
    gap: 12,
  },
  secondaryButton: {
    flex: 1,
    height: 50,
    borderRadius: 16,
    backgroundColor: COLORS.surfaceLight,
    borderWidth: 1,
    borderColor: COLORS.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButtonText: {
    color: COLORS.text,
    fontSize: 15,
    fontWeight: '800',
    marginLeft: 8,
  },
  primaryButton: {
    flex: 1.35,
    height: 50,
    borderRadius: 16,
    backgroundColor: COLORS.pink,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    color: COLORS.white,
    fontSize: 15,
    fontWeight: '800',
  },
  profileCard: {
    marginTop: 28,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: BORDER_RADIUS.l,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 20,
  },
  profileAvatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  profileInitial: {
    color: COLORS.white,
    fontSize: 30,
    fontWeight: '900',
  },
  profileName: {
    color: COLORS.text,
    fontSize: 24,
    fontWeight: '900',
  },
  profileLevel: {
    color: COLORS.textSecondary,
    fontSize: 15,
    marginTop: 4,
  },
  profileGrid: {
    marginTop: 18,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  profileTile: {
    width: '48%',
    borderRadius: BORDER_RADIUS.m,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 18,
    marginBottom: 14,
  },
  tileValue: {
    color: COLORS.text,
    fontSize: 28,
    fontWeight: '900',
  },
  tileLabel: {
    color: COLORS.textSecondary,
    fontSize: 14,
    marginTop: 4,
  },
  lockedCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: BORDER_RADIUS.m,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 18,
  },
  lockedCopy: {
    flex: 1,
    marginLeft: 14,
  },
});
