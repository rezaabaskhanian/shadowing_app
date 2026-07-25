import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  Animated,
  Easing,
  ImageBackground,
  LayoutChangeEvent,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import {
  ChevronLeft,
  Headphones,
  Lock,
  Mic,
  Pause,
  Play,
  RotateCcw,
  Settings,
  Volume2,
} from 'lucide-react-native';
import { ScenarioCard } from '../components/ScenarioCard';
import { AudioPlayer } from '../components/AudioPlayer';
import { SCENARIOS, expandScenarioToDialogueItems } from '../data/scenarios';
import { useScenes } from '../data/ScenesContext';
import { BORDER_RADIUS, COLORS, SPACING } from '../theme/colors';

export { HomeScreen } from './Home';

const AUTO_ADVANCE_MS = 1000; // 1 second interval for autoplay
const FOCUS_SCALE = 1.82;

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

export const ShadowingScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { scenarioId } = route.params || {};
  const CURRENT_SCENARIO = SCENARIOS.find((s) => s.id === scenarioId) ?? SCENARIOS[0];
  const CURRENT_SCENE_HOTSPOTS = expandScenarioToDialogueItems(CURRENT_SCENARIO);
  const uniqueHotspots = CURRENT_SCENARIO.hotspots;
  const [activeIndex, setActiveIndex] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [viewport, setViewport] = useState({ width: 0, height: 0 });
  const [audioUri, setAudioUri] = useState<string | null>(null);
  const [isAudioReady, setIsAudioReady] = useState(false);
  const scale = useRef(new Animated.Value(1)).current;
  const translateX = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(0)).current;
  const currentHotspot = CURRENT_SCENE_HOTSPOTS[activeIndex];
  const canvasWidth = viewport.width * 1.7;
  const canvasHeight = viewport.height * 1.7;
  const advanceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearAdvanceTimer = useCallback(() => {
    if (advanceTimer.current) {
      clearTimeout(advanceTimer.current);
      advanceTimer.current = null;
    }
  }, []);

  const handleAudioStatus = useCallback((status: string) => {
    if (status === 'playing') {
      setIsAudioReady(true);
    } else if (status === 'finished') {
      clearAdvanceTimer();
      if (playing) {
        advanceTimer.current = setTimeout(() => {
          setActiveIndex((prev) => {
            if (prev >= CURRENT_SCENE_HOTSPOTS.length - 1) {
              setPlaying(false);
              return prev;
            }
            return prev + 1;
          });
        }, AUTO_ADVANCE_MS);
      }
    } else if (status === 'error') {
      console.error('Audio playback error');
    }
  }, [activeIndex, playing]);

  const playAudio = useCallback((url: string) => {
    setAudioUri(url);
    setIsAudioReady(false);
  }, []);

  const stopAudio = useCallback(() => {
    setAudioUri(null);
    setIsAudioReady(false);
  }, []);

  useEffect(() => {
    if (!viewport.width || !viewport.height) return;

    const spot = CURRENT_SCENE_HOTSPOTS[activeIndex];
    const targetX = viewport.width * 0.5 - spot.x * canvasWidth * FOCUS_SCALE;
    const targetY = viewport.height * 0.42 - spot.y * canvasHeight * FOCUS_SCALE;

    Animated.parallel([
      Animated.timing(scale, {
        toValue: FOCUS_SCALE,
        duration: 620,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(translateX, {
        toValue: targetX,
        duration: 620,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: targetY,
        duration: 620,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();

    // Play audio after zoom completes
    if (spot.audioUrl) {
      setTimeout(() => {
        playAudio(spot.audioUrl);
      }, 700);
    }
  }, [activeIndex, canvasHeight, canvasWidth, scale, translateX, translateY, viewport.height, viewport.width, playAudio]);

  useEffect(() => {
    if (!playing) {
      stopAudio();
      clearAdvanceTimer();
    }
  }, [playing, stopAudio, clearAdvanceTimer]);

  useEffect(() => {
    return () => clearAdvanceTimer();
  }, [clearAdvanceTimer]);

  const handleLayout = (event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    setViewport({ width, height });
  };

  const goNext = () => {
    clearAdvanceTimer();
    stopAudio();
    if (activeIndex >= CURRENT_SCENE_HOTSPOTS.length - 1) {
      setPlaying(false);
      return;
    }

    setActiveIndex((value) => value + 1);
  };

  const goPrevious = () => {
    clearAdvanceTimer();
    stopAudio();
    setPlaying(true);
    setActiveIndex((value) => Math.max(0, value - 1));
  };

  const togglePlay = () => {
    if (playing) {
      clearAdvanceTimer();
      stopAudio();
      setPlaying(false);
    } else {
      setPlaying(true);
      if (currentHotspot.audioUrl) {
        playAudio(currentHotspot.audioUrl);
      }
    }
  };

  const onSceneBack = () => {
    clearAdvanceTimer();
    stopAudio();
    navigation.navigate('Scenes');
  };
  const Icon = CURRENT_SCENARIO.icon;

  return (
    <View style={styles.shadowScreen}>
      <AudioPlayer uri={audioUri} shouldPlay={playing} onPlaybackStatusUpdate={handleAudioStatus} />
      <View style={styles.shadowTopBar}>
        <TouchableOpacity style={styles.roundBack} onPress={onSceneBack}>
          <ChevronLeft color={COLORS.text} size={24} />
        </TouchableOpacity>
        <View style={styles.scenePill}>
          <Icon color={COLORS.text} size={16} />
          <Text style={styles.scenePillText}>{CURRENT_SCENARIO.title}</Text>
        </View>
        <View style={styles.stepPill}>
          <Text style={styles.stepText}>
            {activeIndex + 1} / {CURRENT_SCENE_HOTSPOTS.length}
          </Text>
        </View>
      </View>

      <View style={styles.sceneViewport} onLayout={handleLayout}>
        <Animated.View
          style={[
            styles.sceneCanvas,
            {
              width: canvasWidth || '100%',
              height: canvasHeight || 420,
              transform: [{ scale }, { translateX }, { translateY }],
            },
          ]}
        >
          <ImageBackground
            source={CURRENT_SCENARIO.imageUri}
            style={styles.sceneImage}
            imageStyle={styles.sceneImageStyle}
          >
            <View style={styles.sceneScrim} />
            {uniqueHotspots.map((spot) => {
              const isActive = spot.id === CURRENT_SCENE_HOTSPOTS[activeIndex]?.hotspotId;
              return (
                <View
                  key={spot.id}
                  style={[
                    styles.hotspot,
                    {
                      left: spot.x * (canvasWidth || 1),
                      top: spot.y * (canvasHeight || 1),
                    },
                    isActive ? styles.hotspotActive : null,
                  ]}
                >
                  <View style={[styles.hotspotCore, isActive ? styles.hotspotCoreActive : null]}>
                    <Volume2 color={COLORS.white} size={isActive ? 16 : 13} />
                  </View>
                </View>
              );
            })}
          </ImageBackground>
        </Animated.View>
      </View>

      <View style={styles.dialogueCard}>
        <View style={styles.dialogueHeader}>
          <View style={styles.dialogueCopy}>
            <Text style={styles.readingLabel}>{isAudioReady ? (playing ? 'Auto reading' : 'Paused') : playing ? 'Loading...' : 'Paused'}</Text>
            <Text style={styles.roleText}>{currentHotspot.speaker}</Text>
            <Text style={styles.dialogueText}>{currentHotspot.dialogue}</Text>
            <Text style={styles.translation}>{currentHotspot.translation}</Text>
          </View>
          <TouchableOpacity style={styles.speakerButton}>
            <Volume2 color={COLORS.text} size={22} />
          </TouchableOpacity>
        </View>

        <View style={styles.progressRow}>
          <View style={styles.progressTrack}>
            {CURRENT_SCENE_HOTSPOTS.map((spot, index) => (
              <View
                key={spot.id}
                style={[
                  styles.progressStep,
                  index <= activeIndex ? styles.progressStepActive : null,
                ]}
              />
            ))}
          </View>
        </View>

        <View style={styles.shadowActions}>
          <TouchableOpacity style={styles.headphoneButton} onPress={goPrevious}>
            <RotateCcw color={COLORS.text} size={20} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headphoneButton} onPress={togglePlay}>
            {playing ? <Pause color={COLORS.text} size={20} /> : <Play color={COLORS.text} size={20} fill={COLORS.text} />}
          </TouchableOpacity>
          <TouchableOpacity style={[styles.shadowButton, playing ? null : styles.shadowButtonPause]} onPress={goNext}>
            <Mic color={COLORS.white} size={20} />
            <Text style={styles.shadowButtonText}>{activeIndex >= CURRENT_SCENE_HOTSPOTS.length - 1 ? 'Finish' : 'Next Dialogue'}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
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
  shadowScreen: {
    flex: 1,
    backgroundColor: COLORS.background,
    paddingTop: 56,
  },
  shadowTopBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.m,
  },
  roundBack: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: 'rgba(5, 11, 24, 0.8)',
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scenePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(5, 11, 24, 0.7)',
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  scenePillText: {
    color: COLORS.text,
    fontSize: 15,
    fontWeight: '800',
    marginLeft: 8,
  },
  stepPill: {
    minWidth: 58,
    height: 46,
    borderRadius: 23,
    backgroundColor: 'rgba(5, 11, 24, 0.8)',
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepText: {
    color: COLORS.text,
    fontSize: 15,
    fontWeight: '900',
  },
  sceneViewport: {
    height: 430,
    marginTop: 16,
    overflow: 'hidden',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  },
  sceneCanvas: {
    flex: 1,
    transformOrigin: 'center',
  },
  sceneImage: {
    flex: 1,
    overflow: 'hidden',
  },
  sceneImageStyle: {
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
  },
  sceneScrim: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(5, 11, 24, 0.24)',
  },
  hotspot: {
    position: 'absolute',
    width: 48,
    height: 48,
    marginLeft: -24,
    marginTop: -24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hotspotActive: {
    zIndex: 3,
  },
  hotspotCore: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(5, 11, 24, 0.86)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.22)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  hotspotCoreActive: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.primary,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.6,
    shadowRadius: 14,
    elevation: 10,
  },
  dialogueCard: {
    marginHorizontal: SPACING.m,
    marginTop: -22,
    borderRadius: BORDER_RADIUS.l,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 18,
  },
  dialogueHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  dialogueCopy: {
    flex: 1,
    marginRight: 14,
  },
  readingLabel: {
    color: COLORS.cyan,
    fontSize: 13,
    fontWeight: '800',
    marginBottom: 6,
  },
  roleText: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: '900',
  },
  dialogueText: {
    color: COLORS.text,
    fontSize: 20,
    lineHeight: 28,
    fontWeight: '800',
    marginTop: 8,
  },
  translation: {
    color: COLORS.textSecondary,
    fontSize: 14,
    marginTop: 10,
  },
  speakerButton: {
    width: 46,
    height: 46,
    borderRadius: 23,
    borderWidth: 1,
    borderColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressRow: {
    marginTop: 18,
  },
  progressTrack: {
    flexDirection: 'row',
    gap: 6,
  },
  progressStep: {
    flex: 1,
    height: 8,
    borderRadius: 10,
    backgroundColor: COLORS.border,
  },
  progressStepActive: {
    backgroundColor: COLORS.accent,
  },
  shadowActions: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    gap: 12,
  },
  headphoneButton: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: COLORS.backgroundSoft,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shadowButton: {
    flex: 1,
    height: 54,
    borderRadius: 27,
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  shadowButtonPause: {
    backgroundColor: COLORS.pink,
  },
  shadowButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '900',
    marginLeft: 10,
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
