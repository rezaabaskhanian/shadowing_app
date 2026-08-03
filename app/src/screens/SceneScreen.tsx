import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  BackHandler,
  Dimensions,
  Image,
  ImageBackground,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import {
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Mic,
  Play,
  Pause,
  RotateCcw,
  SkipBack,
  SkipForward,
  Sparkles,
  X,
  Check,
  Plus,
} from 'lucide-react-native';

import { COLORS } from '../theme/colors';
import { AudioPlayer } from '../components/AudioPlayer';
import { expandScenarioToDialogueItems, type Scenario } from '../data/scenarios';
import { useScenes } from '../data/ScenesContext';
import { useLanguage } from '../data/i18n';
import { useVocab } from '../data/VocabContext';

const SCREEN_HEIGHT = Dimensions.get('window').height;

export const SceneScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { scenarioId } = route.params || {};
  const { getScene } = useScenes();
  const { language, t } = useLanguage();

  const [scenario, setScenario] = useState<Scenario | null>(null);
  const [inScene, setInScene] = useState(false); // false = Intro overview, true = Active player

  // Animated Camera Zoom Scale and Pan Translation for image
  const zoomAnim = useRef(new Animated.Value(1)).current;
  const panXAnim = useRef(new Animated.Value(0)).current;
  const panYAnim = useRef(new Animated.Value(0)).current;

  const hotspots = scenario ? expandScenarioToDialogueItems(scenario) : [];

  useEffect(() => {
    let mounted = true;
    getScene(scenarioId).then((s) => {
      if (mounted) setScenario(s ?? null);
    });
    return () => {
      mounted = false;
    };
  }, [scenarioId, getScene]);

  const [activeIndex, setActiveIndex] = useState(0);
  const [activeStepIndex, setActiveStepIndex] = useState(0); // 0..4 steps
  const [playing, setPlaying] = useState(true);
  const [playbackRate, setPlaybackRate] = useState(1.0);
  const [autoMode, setAutoMode] = useState(true);
  const [repsCount, setRepsCount] = useState(0);
  const [isShadowingMode, setIsShadowingMode] = useState(false);

  // Smooth camera zoom & pan to current hotspot coordinates
  useEffect(() => {
    if (!inScene) {
      Animated.parallel([
        Animated.timing(zoomAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
        Animated.timing(panXAnim, { toValue: 0, duration: 600, useNativeDriver: true }),
        Animated.timing(panYAnim, { toValue: 0, duration: 600, useNativeDriver: true }),
      ]).start();
      return;
    }

    const currentItem = hotspots[activeIndex];
    const itemX = currentItem?.x ?? 0.5;
    const itemY = currentItem?.y ?? 0.5;

    // Pan camera smoothly towards current hotspot, clamped within container bounds
    const maxPanX = 30;
    const maxPanY = 20;
    const rawPanX = (0.5 - itemX) * 60;
    const rawPanY = (0.5 - itemY) * 40;

    const targetPanX = Math.max(-maxPanX, Math.min(maxPanX, rawPanX));
    const targetPanY = Math.max(-maxPanY, Math.min(maxPanY, rawPanY));

    Animated.parallel([
      Animated.timing(zoomAnim, { toValue: 1.22, duration: 800, useNativeDriver: true }),
      Animated.timing(panXAnim, { toValue: targetPanX, duration: 800, useNativeDriver: true }),
      Animated.timing(panYAnim, { toValue: targetPanY, duration: 800, useNativeDriver: true }),
    ]).start();
  }, [inScene, activeIndex, hotspots, zoomAnim, panXAnim, panYAnim]);
  const [audioUri, setAudioUri] = useState<string | null>(null);
  const [actionCommand, setActionCommand] = useState<
    'none' | 'start_record' | 'stop_record' | 'play_recording' | 'play_original'
  >('none');

  const currentDialogue = hotspots[activeIndex] || {
    dialogue: 'Great. Can I pay by card?',
    translation: 'عالی. می‌توانم با کارت پرداخت کنم؟',
    speaker: 'CU CUSTOMER',
    audioUrl: '',
  };

  const { has, add: addVocab, remove: removeVocab } = useVocab();

  const resetToHome = useCallback(() => {
    navigation.reset({
      index: 0,
      routes: [{ name: 'Home' }],
    });
  }, [navigation]);

  // Intercept physical phone back button on hardware press to return to Home
  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        resetToHome();
        return true;
      };
      const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
      return () => subscription.remove();
    }, [resetToHome])
  );

  const handleEnterScene = () => {
    setInScene(true);
    if (currentDialogue.audioUrl) {
      setAudioUri(currentDialogue.audioUrl);
      setActionCommand('play_original');
      setPlaying(true);
    }
  };

  const autoTimeoutRef = useRef<any>(null);

  useEffect(() => {
    return () => {
      if (autoTimeoutRef.current) clearTimeout(autoTimeoutRef.current);
    };
  }, []);

  const handleNextDialogue = useCallback(() => {
    if (autoTimeoutRef.current) clearTimeout(autoTimeoutRef.current);
    setActiveIndex((prevIdx) => {
      const nextIdx = prevIdx + 1 < hotspots.length ? prevIdx + 1 : 0;
      const nextDialogue = hotspots[nextIdx];
      if (nextDialogue?.audioUrl) {
        setAudioUri(nextDialogue.audioUrl);
        setActionCommand('play_original');
        setPlaying(true);
      }
      return nextIdx;
    });
  }, [hotspots]);

  const handlePrevDialogue = useCallback(() => {
    if (autoTimeoutRef.current) clearTimeout(autoTimeoutRef.current);
    setActiveIndex((prevIdx) => {
      const nextIdx = prevIdx > 0 ? prevIdx - 1 : 0;
      const nextDialogue = hotspots[nextIdx];
      if (nextDialogue?.audioUrl) {
        setAudioUri(nextDialogue.audioUrl);
        setActionCommand('play_original');
        setPlaying(true);
      }
      return nextIdx;
    });
  }, [hotspots]);

  const handleReplay = useCallback(() => {
    if (autoTimeoutRef.current) clearTimeout(autoTimeoutRef.current);
    setActionCommand('play_original');
    setPlaying(true);
  }, []);

  const toggleSpeed = () => {
    const speeds = [1.0, 0.75, 1.25, 1.5];
    const nextSpeedIdx = (speeds.indexOf(playbackRate) + 1) % speeds.length;
    setPlaybackRate(speeds[nextSpeedIdx]);
  };

  const togglePlay = () => {
    setPlaying(!playing);
    setActionCommand(playing ? 'none' : 'play_original');
  };

  const defaultCoverUri =
    'https://images.unsplash.com/photo-1542838132-92c53300491e?q=80&w=1000&auto=format&fit=crop';
  const coverImage = scenario?.imageUri
    ? typeof scenario.imageUri === 'string'
      ? { uri: scenario.imageUri }
      : scenario.imageUri
    : { uri: defaultCoverUri };

  // ================= SCENE OVERVIEW INTRO SCREEN (SCREENSHOT #2) =================
  if (!inScene) {
    return (
      <View style={styles.container}>
        <ScrollView contentContainerStyle={styles.introScroll} showsVerticalScrollIndicator={false}>
          {/* Cover Hero Banner */}
          <View style={[styles.introCoverWrapper, { height: SCREEN_HEIGHT / 3 }]}>
            <ImageBackground source={coverImage} style={styles.introCover}>
              <View style={styles.introCoverScrim} />
              <TouchableOpacity
                style={styles.closeBtn}
                onPress={resetToHome}
              >
                <X size={20} color={COLORS.white} />
              </TouchableOpacity>
            </ImageBackground>
          </View>

          {/* Scenario Meta Header */}
          <View style={styles.introHeader}>
            <Text style={styles.introCategory}>
              📍 SUPERMARKET · LEVEL {scenario?.level || 'A2'}
            </Text>
            <Text style={styles.introTitle}>
              {scenario?.title || 'The Last Can of Tuna'}
            </Text>
            <Text style={styles.introDesc}>
              {scenario?.description ||
                'Maya has ten dollars and a hungry roommate. Walk the aisles, ask for prices, and get to the checkout before it closes.'}
            </Text>
          </View>

          {/* 3 Metric Pills Row */}
          <View style={styles.statsRow}>
            <View style={styles.statPill}>
              <Text style={styles.statNumber}>5</Text>
              <Text style={styles.statLabel}>{t('hotspots')}</Text>
            </View>

            <View style={styles.statPill}>
              <Text style={styles.statNumber}>24</Text>
              <Text style={styles.statLabel}>{t('sentencesCount')}</Text>
            </View>

            <View style={styles.statPill}>
              <Text style={styles.statNumber}>12</Text>
              <Text style={styles.statLabel}>{t('minutesCount')}</Text>
            </View>
          </View>

          {/* Conversations In This Scene */}
          <Text style={styles.conversationsLabel}>
            {t('conversationsInScene')}
          </Text>

          <View style={styles.conversationsList}>
            {[
              { num: 1, en: 'Checkout', fa: 'صندوق', micCount: 5 },
              { num: 2, en: 'Dairy fridge', fa: 'لبنیات', micCount: 3 },
              { num: 3, en: 'Fruit stand', fa: 'میوه', micCount: 2 },
              { num: 4, en: 'Drinks cooler', fa: 'نوشیدنی', micCount: 2 },
              { num: 5, en: 'Shopping basket', fa: 'سبد خرید', micCount: 2 },
            ].map((item) => (
              <TouchableOpacity
                key={item.num}
                activeOpacity={0.8}
                style={styles.convCard}
                onPress={handleEnterScene}
              >
                <View style={styles.convNumCircle}>
                  <Text style={styles.convNumText}>{item.num}</Text>
                </View>

                <Text style={styles.convTitle}>{item.en}</Text>

                <View style={styles.convRight}>
                  <Text style={styles.convFaTitle}>{item.fa}</Text>
                  <View style={styles.convMicTag}>
                    <Mic size={12} color={COLORS.textSecondary} />
                    <Text style={styles.convMicCount}>{item.micCount}</Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>

          {/* Rule Tip Banner */}
          <View style={styles.tipBanner}>
            <Sparkles size={18} color={COLORS.teal} style={{ marginTop: 2 }} />
            <Text style={styles.tipText}>{t('sceneRuleTip')}</Text>
          </View>

          {/* Enter Scene CTA Button */}
          <TouchableOpacity
            activeOpacity={0.88}
            style={styles.enterCtaBtn}
            onPress={handleEnterScene}
          >
            <Play size={20} color={COLORS.black} fill={COLORS.black} />
            <Text style={styles.enterCtaText}>{t('enterScene')}</Text>
          </TouchableOpacity>

          <View style={{ height: 40 }} />
        </ScrollView>
      </View>
    );
  }

  // ================= ACTIVE PRACTICE PLAYER SHEET (100% PURE ENGLISH UI & SCROLLABLE) =================
  const stepTitles = [
    { num: 1, label: 'Step 1: Listen' },
    { num: 2, label: 'Step 2: Vocabulary' },
    { num: 3, label: 'Step 3: Practice' },
    { num: 4, label: 'Step 4: AI Score' },
  ];

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent={true} />

      {/* Audio Engine */}
      <AudioPlayer
        uri={audioUri}
        shouldPlay={playing}
        playbackRate={playbackRate}
        textHint={currentDialogue.dialogue}
        actionCommand={actionCommand}
        onPlaybackStatusUpdate={(status) => {
          if (status === 'finished' && autoMode) {
            if (autoTimeoutRef.current) clearTimeout(autoTimeoutRef.current);
            autoTimeoutRef.current = setTimeout(() => {
              handleNextDialogue();
            }, 2200);
          }
        }}
      />

      <ScrollView
        contentContainerStyle={styles.scrollablePlayerContainer}
        showsVerticalScrollIndicator={false}
        bounces={true}
      >
        {/* Top Header Bar OUTSIDE & ABOVE the Scene Image */}
        <View style={styles.topHeaderBar}>
          <TouchableOpacity
            activeOpacity={0.8}
            style={styles.backHeaderBtn}
            onPress={resetToHome}
          >
            <ChevronRight size={22} color={COLORS.text} />
            <Text style={styles.backHeaderText}>Back to Home</Text>
          </TouchableOpacity>

          {/* Level Difficulty Badge */}
          <View style={styles.levelHeaderBadge}>
            <Sparkles size={13} color={COLORS.amber} />
            <Text style={styles.levelHeaderBadgeText}>
              {(scenario?.level || 'Beginner').toUpperCase()}
            </Text>
          </View>
        </View>

        {/* Top Scene Camera Zoom View (Clean without overlapping buttons) */}
        <View style={styles.playerTopView}>
          <View style={styles.zoomContainer}>
            <Animated.Image
              source={coverImage}
              style={[
                styles.topSceneImage,
                {
                  transform: [
                    { scale: zoomAnim },
                    { translateX: panXAnim },
                    { translateY: panYAnim },
                  ],
                },
              ]}
              resizeMode="cover"
            />
          </View>
        </View>

        {/* Bottom Sheet Dialogue Card */}
        <View style={styles.playerSheet}>
          {/* Top Drag Handle */}
          <View style={styles.dragHandle} />

          {!isShadowingMode ? (
            /* ================= MODE 1: EXPLORE SCENE MODE ================= */
            <View style={styles.exploreModeContainer}>
              <View style={styles.exploreHeaderRow}>
                <View style={styles.speakerPill}>
                  <Text style={styles.speakerText}>
                    {(currentDialogue.speaker || 'SPEAKER').toUpperCase()}
                  </Text>
                </View>

                {/* Mode Pill Indicator */}
                <View style={styles.exploreModeBadge}>
                  <Text style={styles.exploreModeBadgeText}>Explore Mode</Text>
                </View>
              </View>

              <Text style={styles.englishText}>
                {currentDialogue.dialogue || 'Great. Can I pay by card?'}
              </Text>

              {/* Audio Waveform Visualizer */}
              <View style={styles.waveformRow}>
                {Array.from({ length: 24 }).map((_, idx) => (
                  <View
                    key={idx}
                    style={[
                      styles.waveBar,
                      {
                        height: playing ? 8 + ((idx * 7) % 20) : 8,
                        backgroundColor: COLORS.amber,
                      },
                    ]}
                  />
                ))}
              </View>

              {/* Hotspots Selector Row */}
              <Text style={styles.hotspotSelectTitle}>Hotspots ({hotspots.length}):</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.hotspotChipScroll}>
                {hotspots.map((hs, i) => (
                  <TouchableOpacity
                    key={hs.id || i}
                    style={[styles.hotspotChip, activeIndex === i ? styles.hotspotChipActive : null]}
                    onPress={() => setActiveIndex(i)}
                  >
                    <Text style={[styles.hotspotChipText, activeIndex === i ? styles.hotspotChipTextActive : null]}>
                      #{i + 1} {hs.speaker}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              {/* Primary CTA: Start 4-Step Shadowing Practice */}
              <TouchableOpacity
                activeOpacity={0.88}
                style={styles.startShadowingCtaBtn}
                onPress={() => setIsShadowingMode(true)}
              >
                <Mic size={20} color={COLORS.black} />
                <Text style={styles.startShadowingCtaText}>Start 4-Step Shadowing Practice 🎙️</Text>
              </TouchableOpacity>
            </View>
          ) : (
            /* ================= MODE 2: 4-STEP INTERACTIVE SHADOWING MODE ================= */
            <View>
              {/* Exit Shadowing Mode Row */}
              <View style={styles.shadowingHeaderRow}>
                <TouchableOpacity
                  style={styles.exitShadowingBtn}
                  onPress={() => setIsShadowingMode(false)}
                >
                  <Text style={styles.exitShadowingText}>← Exit Practice</Text>
                </TouchableOpacity>

                <View style={styles.stepTitleBadge}>
                  <Text style={styles.stepTitleBadgeText}>
                    {stepTitles[activeStepIndex]?.label}
                  </Text>
                </View>
              </View>

              {/* 4 Step Progress Segments Header */}
              <View style={styles.stepHeaderRow}>
                {stepTitles.map((st, idx) => (
                  <TouchableOpacity
                    key={st.num}
                    activeOpacity={0.7}
                    style={[
                      styles.stepTab,
                      activeStepIndex === idx ? styles.stepTabActive : null,
                    ]}
                    onPress={() => setActiveStepIndex(idx)}
                  >
                    <Text
                      style={[
                        styles.stepTabText,
                        activeStepIndex === idx ? styles.stepTabTextActive : null,
                      ]}
                    >
                      Step {st.num}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Dialogue Speaker & Sentences Box */}
              <View style={styles.dialogueBox}>
                <View style={styles.speakerPill}>
                  <Text style={styles.speakerText}>
                    {(currentDialogue.speaker || 'SPEAKER').toUpperCase()}
                  </Text>
                </View>

                {/* STEP 1: LISTEN */}
                <Text style={styles.englishText}>
                  {currentDialogue.dialogue || 'Great. Can I pay by card?'}
                </Text>

            {activeStepIndex === 1 && currentDialogue.words && currentDialogue.words.length > 0 && (
              <View style={styles.wordPillsContainer}>
                {currentDialogue.words.map((w, i) => {
                  const isSaved = has(w.word);
                  return (
                    <TouchableOpacity
                      key={i}
                      activeOpacity={0.8}
                      style={[styles.wordCardPill, isSaved ? styles.wordCardPillSaved : null]}
                      onPress={() => {
                        if (isSaved) {
                          removeVocab(w.word);
                        } else {
                          addVocab({ word: w.word, meaning: w.meaning });
                        }
                      }}
                    >
                      <View style={{ flex: 1 }}>
                        <Text style={styles.wordCardEnglish}>{w.word}</Text>
                        <Text style={styles.wordCardMeaning}>{w.meaning}</Text>
                      </View>

                      <View style={[styles.leitnerTag, isSaved ? styles.leitnerTagSaved : null]}>
                        {isSaved ? (
                          <Check size={12} color={COLORS.black} />
                        ) : (
                          <Plus size={12} color={COLORS.amber} />
                        )}
                        <Text style={[styles.leitnerTagText, isSaved ? styles.leitnerTagTextSaved : null]}>
                          {isSaved ? 'Saved' : 'Leitner'}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}

            {/* Audio Waveform Visualizer */}
            <View style={styles.waveformRow}>
              {Array.from({ length: 24 }).map((_, idx) => (
                <View
                  key={idx}
                  style={[
                    styles.waveBar,
                    {
                      height: playing ? 8 + ((idx * 7) % 20) : 8,
                      backgroundColor: COLORS.amber,
                    },
                  ]}
                />
              ))}
            </View>
          </View>

          {/* STEP 3: RECORD SHADOWING MIC BUTTON */}
          {activeStepIndex === 2 && (
            <View style={styles.recordSection}>
              <TouchableOpacity
                activeOpacity={0.8}
                style={[
                  styles.micRecordBtn,
                  actionCommand === 'start_record' ? styles.micRecordActive : null,
                ]}
                onPress={() => {
                  if (actionCommand === 'start_record') {
                    setActionCommand('stop_record');
                  } else {
                    setActionCommand('start_record');
                  }
                }}
              >
                <Mic size={22} color={COLORS.black} />
                <Text style={styles.micRecordText}>
                  {actionCommand === 'start_record' ? 'Recording Voice...' : 'Record Your Voice 🎤'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.playRecordingBtn}
                onPress={() => setActionCommand('play_recording')}
              >
                <Play size={16} color={COLORS.teal} />
                <Text style={styles.playRecordingText}>Play Your Recording 🔊</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* STEP 4: AI EVALUATION SCORE BADGES */}
          {activeStepIndex === 3 && (
            <View style={styles.evalScoreSection}>
              <View style={styles.evalScoreBadge}>
                <Sparkles size={16} color={COLORS.amber} />
                <Text style={styles.evalScoreTitle}>Fluency Score</Text>
                <Text style={styles.evalScoreValue}>94%</Text>
              </View>
              <View style={styles.evalScoreBadge}>
                <Check size={16} color={COLORS.teal} />
                <Text style={styles.evalScoreTitle}>Pronunciation Score</Text>
                <Text style={styles.evalScoreValue}>88%</Text>
              </View>
            </View>
          )}

          {/* Player Controls Bar */}
          <View style={styles.controlsBar}>
            {/* Speed Toggle */}
            <TouchableOpacity style={styles.controlPillBtn} onPress={toggleSpeed}>
              <Text style={styles.controlPillText}>{playbackRate}x</Text>
            </TouchableOpacity>

            {/* Auto Mode Toggle */}
            <TouchableOpacity
              style={[
                styles.autoPillBtn,
                autoMode ? styles.autoPillActive : null,
              ]}
              onPress={() => setAutoMode(!autoMode)}
            >
              <Text
                style={[
                  styles.autoPillText,
                  autoMode ? styles.autoPillTextActive : null,
                ]}
              >
                Auto {autoMode ? '✓' : ''}
              </Text>
            </TouchableOpacity>

            {/* Skip Prev */}
            <TouchableOpacity style={styles.iconCtrlBtn} onPress={handlePrevDialogue}>
              <SkipBack size={18} color={COLORS.white} />
            </TouchableOpacity>

            {/* Replay */}
            <TouchableOpacity style={styles.iconCtrlBtn} onPress={handleReplay}>
              <RotateCcw size={18} color={COLORS.white} />
            </TouchableOpacity>

            {/* Play/Pause Orange Circle */}
            <TouchableOpacity style={styles.mainPlayBtn} onPress={togglePlay}>
              {playing ? (
                <Pause size={22} color={COLORS.black} fill={COLORS.black} />
              ) : (
                <Play size={22} color={COLORS.black} fill={COLORS.black} />
              )}
            </TouchableOpacity>

            {/* Skip Next */}
            <TouchableOpacity style={styles.iconCtrlBtn} onPress={handleNextDialogue}>
              <SkipForward size={18} color={COLORS.white} />
            </TouchableOpacity>

            {/* Step Advancement CTA */}
            <TouchableOpacity
              style={styles.nextStepCtaBtn}
              onPress={() => {
                if (activeStepIndex < 3) {
                  setActiveStepIndex(activeStepIndex + 1);
                } else {
                  handleNextDialogue();
                  setActiveStepIndex(0);
                }
              }}
            >
              <Text style={styles.nextStepCtaText}>
                {activeStepIndex === 3 ? 'Next Line ➔' : `Step ${activeStepIndex + 2} ➔`}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  // Intro Screen Styles
  introScroll: {
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  introCoverWrapper: {
    height: 240,
    borderRadius: 28,
    overflow: 'hidden',
    marginTop: 20,
    marginBottom: 20,
  },
  introCover: {
    width: '100%',
    height: '100%',
  },
  introCoverScrim: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(12, 16, 23, 0.25)',
  },
  closeBtn: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(15, 20, 28, 0.75)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  introHeader: {
    marginBottom: 20,
  },
  introCategory: {
    color: COLORS.amber,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  introTitle: {
    color: COLORS.text,
    fontSize: 28,
    fontWeight: '800',
    marginBottom: 10,
    letterSpacing: -0.5,
  },
  introDesc: {
    color: COLORS.textSecondary,
    fontSize: 14,
    lineHeight: 22,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 24,
  },
  statPill: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: 24,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  statNumber: {
    color: COLORS.text,
    fontSize: 20,
    fontWeight: '800',
  },
  statLabel: {
    color: COLORS.textSecondary,
    fontSize: 12,
    marginTop: 2,
  },
  conversationsLabel: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 12,
  },
  conversationsList: {
    gap: 10,
    marginBottom: 20,
  },
  convCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  convNumCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: COLORS.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  convNumText: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: '700',
  },
  convTitle: {
    color: COLORS.text,
    fontSize: 15,
    fontWeight: '700',
    flex: 1,
  },
  convRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  convFaTitle: {
    color: COLORS.textSecondary,
    fontSize: 13,
  },
  convMicTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  convMicCount: {
    color: COLORS.textSecondary,
    fontSize: 12,
  },
  tipBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(20, 184, 166, 0.08)',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(20, 184, 166, 0.25)',
    gap: 12,
    marginBottom: 24,
  },
  tipText: {
    color: COLORS.textSecondary,
    fontSize: 13,
    lineHeight: 20,
    flex: 1,
  },
  enterCtaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.amber,
    borderRadius: 28,
    height: 56,
    gap: 10,
  },
  enterCtaText: {
    color: COLORS.black,
    fontSize: 16,
    fontWeight: '800',
  },

  // Active Player Styles
  scrollablePlayerContainer: {
    flexGrow: 1,
    backgroundColor: COLORS.background,
  },
  topHeaderBar: {
    paddingTop: StatusBar.currentHeight ? StatusBar.currentHeight + 8 : 44,
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: COLORS.background,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 20,
  },
  backHeaderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 6,
  },
  backHeaderText: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: '700',
  },
  levelHeaderBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 160, 28, 0.12)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 160, 28, 0.3)',
    gap: 6,
  },
  levelHeaderBadgeText: {
    color: COLORS.amber,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  exploreModeContainer: {
    paddingVertical: 4,
  },
  exploreHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  exploreModeBadge: {
    backgroundColor: COLORS.surfaceLight,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  exploreModeBadgeText: {
    color: COLORS.textSecondary,
    fontSize: 11,
    fontWeight: '700',
  },
  hotspotSelectTitle: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontWeight: '700',
    marginTop: 12,
    marginBottom: 6,
  },
  hotspotChipScroll: {
    marginBottom: 16,
  },
  hotspotChip: {
    backgroundColor: COLORS.surfaceLight,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    marginRight: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  hotspotChipActive: {
    backgroundColor: COLORS.amber,
    borderColor: COLORS.amber,
  },
  hotspotChipText: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontWeight: '700',
  },
  hotspotChipTextActive: {
    color: COLORS.black,
    fontWeight: '800',
  },
  startShadowingCtaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.amber,
    paddingVertical: 14,
    borderRadius: 22,
    gap: 8,
    marginTop: 6,
    shadowColor: COLORS.amber,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  startShadowingCtaText: {
    color: COLORS.black,
    fontSize: 15,
    fontWeight: '800',
  },
  shadowingHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  exitShadowingBtn: {
    backgroundColor: COLORS.surfaceLight,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  exitShadowingText: {
    color: COLORS.teal,
    fontSize: 12,
    fontWeight: '700',
  },
  playerTopView: {
    height: Math.round(SCREEN_HEIGHT * 0.38),
    width: '100%',
    position: 'relative',
    overflow: 'hidden',
    backgroundColor: '#000',
  },
  zoomContainer: {
    width: '100%',
    height: '100%',
    overflow: 'hidden',
  },
  topSceneImage: {
    width: '100%',
    height: '100%',
  },
  playerSheet: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 16,
    borderTopWidth: 1,
    borderColor: COLORS.border,
    justifyContent: 'flex-start',
  },
  dragHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.border,
    alignSelf: 'center',
    marginBottom: 8,
  },
  stepSegmentsRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 12,
  },
  stepSegment: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.surfaceLight,
  },
  stepSegmentActive: {
    backgroundColor: COLORS.amber,
  },
  dialogueBox: {
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  speakerPill: {
    backgroundColor: 'rgba(255, 160, 28, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginBottom: 6,
  },
  speakerText: {
    color: COLORS.amber,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  englishText: {
    color: COLORS.text,
    fontSize: 19,
    fontWeight: '800',
    lineHeight: 26,
    marginBottom: 4,
  },
  persianText: {
    color: COLORS.textSecondary,
    fontSize: 13,
    textAlign: 'right',
    alignSelf: 'flex-end',
    marginBottom: 8,
  },
  waveformRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    width: '100%',
    height: 28,
    marginVertical: 4,
  },
  waveBar: {
    width: 3,
    borderRadius: 1.5,
  },
  controlsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginVertical: 10,
  },
  controlPillBtn: {
    backgroundColor: COLORS.surfaceLight,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
  },
  controlPillText: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontWeight: '700',
  },
  iconCtrlBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mainPlayBtn: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.amber,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.amber,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 6,
  },
  autoPillBtn: {
    backgroundColor: COLORS.surfaceLight,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
  },
  autoPillActive: {
    backgroundColor: 'rgba(20, 184, 166, 0.2)',
    borderWidth: 1,
    borderColor: COLORS.teal,
  },
  autoPillText: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontWeight: '700',
  },
  autoPillTextActive: {
    color: COLORS.teal,
  },
  shadowActionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.surfaceLight,
    borderRadius: 24,
    paddingHorizontal: 18,
    paddingVertical: 14,
  },
  shadowActionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  shadowActionText: {
    color: COLORS.text,
    fontSize: 15,
    fontWeight: '700',
  },
  shadowRepsText: {
    color: COLORS.textSecondary,
    fontSize: 13,
    fontWeight: '600',
  },

  // 4-Step Interactive Shadowing Styles
  stepHeaderRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 8,
  },
  stepTab: {
    flex: 1,
    paddingVertical: 6,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    backgroundColor: COLORS.surfaceLight,
  },
  stepTabActive: {
    backgroundColor: COLORS.amber,
  },
  stepTabText: {
    color: COLORS.textSecondary,
    fontSize: 11,
    fontWeight: '700',
  },
  stepTabTextActive: {
    color: COLORS.black,
    fontWeight: '800',
  },
  stepTitleBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255, 160, 28, 0.12)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    marginBottom: 10,
  },
  stepTitleBadgeText: {
    color: COLORS.amber,
    fontSize: 12,
    fontWeight: '700',
  },
  wordPillsContainer: {
    gap: 8,
    marginVertical: 8,
    width: '100%',
  },
  wordCardPill: {
    backgroundColor: COLORS.surfaceLight,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    width: '100%',
  },
  wordCardPillSaved: {
    backgroundColor: 'rgba(20, 184, 166, 0.12)',
    borderColor: COLORS.teal,
  },
  wordCardEnglish: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: '800',
  },
  wordCardMeaning: {
    color: COLORS.textSecondary,
    fontSize: 12,
    marginTop: 2,
  },
  leitnerTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.surface,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.amber,
  },
  leitnerTagSaved: {
    backgroundColor: COLORS.teal,
    borderColor: COLORS.teal,
  },
  leitnerTagText: {
    color: COLORS.amber,
    fontSize: 11,
    fontWeight: '700',
  },
  leitnerTagTextSaved: {
    color: COLORS.black,
    fontWeight: '800',
  },
  recordSection: {
    marginVertical: 8,
    gap: 8,
  },
  micRecordBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.amber,
    paddingVertical: 12,
    borderRadius: 20,
    gap: 8,
  },
  micRecordActive: {
    backgroundColor: '#EF4444',
  },
  micRecordText: {
    color: COLORS.black,
    fontSize: 14,
    fontWeight: '800',
  },
  playRecordingBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.surfaceLight,
    paddingVertical: 8,
    borderRadius: 14,
    gap: 6,
  },
  playRecordingText: {
    color: COLORS.teal,
    fontSize: 13,
    fontWeight: '700',
  },
  evalScoreSection: {
    flexDirection: 'row',
    gap: 10,
    marginVertical: 8,
  },
  evalScoreBadge: {
    flex: 1,
    backgroundColor: COLORS.surfaceLight,
    padding: 10,
    borderRadius: 14,
    alignItems: 'center',
    gap: 4,
  },
  evalScoreTitle: {
    color: COLORS.textSecondary,
    fontSize: 11,
    fontWeight: '600',
  },
  evalScoreValue: {
    color: COLORS.teal,
    fontSize: 18,
    fontWeight: '800',
  },
  nextStepCtaBtn: {
    backgroundColor: COLORS.teal,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 16,
  },
  nextStepCtaText: {
    color: COLORS.black,
    fontSize: 13,
    fontWeight: '800',
  },
});