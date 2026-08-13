import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { BackHandler, ScrollView, StatusBar, StyleSheet, View, useWindowDimensions } from 'react-native';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { COLORS } from '../../theme/colors';
import { AudioPlayer } from '../../components/AudioPlayer';
import { WordsSheet } from '../../components/WordsSheet';
import { SessionResultScreen } from '../../components/SessionResultScreen';
import { expandScenarioToDialogueItems, type Scenario } from '../../data/scenarios';
import { useScenes } from '../../data/ScenesContext';
import { useLanguage } from '../../data/i18n';

import { SceneIntroScreen } from './SceneIntroScreen';
import { SceneCameraHero } from './SceneCameraHero';
import { SceneExploreMode } from './SceneExploreMode';
import { ShadowingPracticePanel } from './ShadowingPracticePanel';
import type { AudioActionCommand } from './types';

// امتیازهای پایان جلسه هنوز از تحلیل صوتی واقعی نمی‌آیند و مانند بقیه‌ی
// معیارهای اپ (مثل Home) مقادیر ثابت نمایشی هستند.
const SESSION_SCORE = 85;
const SESSION_PRONUNCIATION = 80;
const SESSION_FLUENCY = 92;
const SESSION_RHYTHM = 83;

// عدد استریک هنوز از بک‌اند نمی‌آید؛ مثل Home مقدار نمایشی ثابت است.
const STREAK_COUNT = 14;

// تصویرهای صحنه landscape هستند؛ تا وقتی ابعاد واقعی تصویر لود نشده از این
// نسبت استفاده می‌شود تا فریم اول هم تقریباً درست باشد و تصویر نپرد.
const DEFAULT_SCENE_ASPECT = 16 / 9;

/**
 * صفحه‌ی صحنه (Scene). این فایل فقط هماهنگ‌کننده‌ی state/داده است؛ بخش‌های
 * بصری هرکدام کامپوننت جدای خودشان را دارند:
 *  - SceneIntroScreen      → معرفی صحنه قبل از ورود
 *  - SceneCameraHero       → تصویر بالای صفحه + دوربین زوم/pan + هدر شناور
 *  - SceneExploreMode      → مرور هات‌اسپات‌ها قبل از شروع تمرین
 *  - ShadowingPracticePanel→ تمرین تعاملی ۴مرحله‌ای
 *  - SessionResultScreen   → نتیجه‌ی پایان جلسه (کامپوننت مجزای موجود)
 */
export const SceneScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { scenarioId } = route.params || {};
  const { getScene } = useScenes();
  const { language, t } = useLanguage();
  // ابعاد صفحه به‌صورت زنده (نه فقط یک‌بار در زمان لود) تا با چرخش گوشی به
  // حالت عرضی، اندازه‌ی ناحیه‌ی تصویر درست محاسبه شود و تصویر کشیده/بریده
  // نمایش داده نشود.
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  // نسبت واقعی ابعاد تصویر صحنه. ارتفاع ناحیه‌ی بالای صفحه دقیقاً از روی همین
  // نسبت ساخته می‌شود تا کادر با خود تصویر هم‌شکل باشد و هیچ بخشی از عرض آن
  // بریده نشود؛ فقط برای تصویرهای خیلی کشیده‌ی عمودی یک سقف می‌گذاریم که کل
  // صفحه را نبلعند.
  const [imageAspectRatio, setImageAspectRatio] = useState(DEFAULT_SCENE_ASPECT);
  // const topViewHeight = Math.min(
  //   Math.round(screenWidth / imageAspectRatio),
  //   Math.round(screenHeight * 0.6)
  // );
  const topViewHeight = screenHeight * 0.5;

  const [scenario, setScenario] = useState<Scenario | null>(null);
  const [inScene, setInScene] = useState(false); // false = Intro overview, true = Active player
  const [showAllDialogues, setShowAllDialogues] = useState(false); // پیش‌نمایش دیالوگ‌ها در صفحه‌ی اینترو

  // خطوط دیالوگ (هر هات‌اسپات می‌تواند چند خط داشته باشد) در برابر خودِ
  // هات‌اسپات‌های صحنه — این دو تعداد متفاوتی دارند و نباید با هم اشتباه شوند.
  // memo لازم است: بدون آن این آرایه‌ها هر رندر از نو ساخته می‌شوند و افکت
  // حرکت دوربین بی‌دلیل دوباره اجرا می‌شود.
  const dialogueItems = useMemo(
    () => (scenario ? expandScenarioToDialogueItems(scenario) : []),
    [scenario]
  );
  const sceneHotspots = useMemo(() => scenario?.hotspots ?? [], [scenario]);

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
  const [activeStepIndex, setActiveStepIndex] = useState(0); // 0..3 steps
  const [playing, setPlaying] = useState(true);
  const [playbackRate, setPlaybackRate] = useState(1.0);
  const autoMode = true;
  const [isShadowingMode, setIsShadowingMode] = useState(false);
  // true فقط وقتی که آخرین هات‌اسپات هم تمام شده باشد؛ در این حالت دیگر زوم
  // نباید دوباره تکرار شود و دوربین باید در حالت خارج از زوم بماند.
  const [sceneFinished, setSceneFinished] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [wordsSheetVisible, setWordsSheetVisible] = useState(false);
  const [audioUri, setAudioUri] = useState<string | null>(null);
  const [actionCommand, setActionCommand] = useState<AudioActionCommand>('none');

  const currentDialogue = dialogueItems[activeIndex] || {
    dialogue: 'Great. Can I pay by card?',
    translation: 'عالی. می‌توانم با کارت پرداخت کنم؟',
    speaker: 'CU CUSTOMER',
    audioUrl: '',
  };

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
    setSceneFinished(false);
    setActiveIndex(0);
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
      // اگر روی آخرین هات‌اسپات هستیم، دیگر به هات‌اسپات اول برنگرد؛ فقط اعلام
      // کن که صحنه تمام شده تا افکت زوم، یک‌بار زوم اوت کند و دیگر تکرار نشود.
      if (prevIdx + 1 >= dialogueItems.length) {
        setSceneFinished(true);
        return prevIdx;
      }
      const nextIdx = prevIdx + 1;
      const nextDialogue = dialogueItems[nextIdx];
      if (nextDialogue?.audioUrl) {
        setAudioUri(nextDialogue.audioUrl);
        setActionCommand('play_original');
        setPlaying(true);
      }
      return nextIdx;
    });
  }, [dialogueItems]);

  const handlePrevDialogue = useCallback(() => {
    if (autoTimeoutRef.current) clearTimeout(autoTimeoutRef.current);
    setActiveIndex((prevIdx) => {
      const nextIdx = prevIdx > 0 ? prevIdx - 1 : 0;
      const nextDialogue = dialogueItems[nextIdx];
      if (nextDialogue?.audioUrl) {
        setAudioUri(nextDialogue.audioUrl);
        setActionCommand('play_original');
        setPlaying(true);
      }
      return nextIdx;
    });
  }, [dialogueItems]);

  // ——— ناوبری در سطح هات‌اسپات (نه تک‌تک خطوط دیالوگ) ———
  // اندیس هات‌اسپاتی که خط دیالوگ فعلی به آن تعلق دارد.
  const activeHotspotIndex = Math.max(
    0,
    sceneHotspots.findIndex((hs) => hs.id === dialogueItems[activeIndex]?.hotspotId)
  );

  // پرش به اولین خط دیالوگِ یک هات‌اسپات مشخص.
  const goToHotspot = useCallback(
    (hotspotIdx: number) => {
      const target = sceneHotspots[hotspotIdx];
      if (!target) return;
      const firstIdx = dialogueItems.findIndex((d) => d.hotspotId === target.id);
      if (firstIdx === -1) return;
      if (autoTimeoutRef.current) clearTimeout(autoTimeoutRef.current);
      setSceneFinished(false);
      setActiveIndex(firstIdx);
      const nextDialogue = dialogueItems[firstIdx];
      if (nextDialogue?.audioUrl) {
        setAudioUri(nextDialogue.audioUrl);
        setActionCommand('play_original');
        setPlaying(true);
      }
    },
    [sceneHotspots, dialogueItems]
  );

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

  // دکمه‌ی فلش روی تصویر: مرحله‌ی بعدی را باز می‌کند؛ روی آخرین مرحله، از
  // صحنه خارج شده و نتیجه‌ی جلسه نمایش داده می‌شود.
  const handleHeaderForwardPress = () => {
    if (activeStepIndex < 3) {
      setActiveStepIndex(activeStepIndex + 1);
    } else {
      setShowResult(true);
    }
  };

  const defaultCoverUri =
    'https://images.unsplash.com/photo-1542838132-92c53300491e?q=80&w=1000&auto=format&fit=crop';
  const coverImage = scenario?.imageUri
    ? typeof scenario.imageUri === 'string'
      ? { uri: scenario.imageUri }
      : scenario.imageUri
    : { uri: defaultCoverUri };

  // ابعاد واقعی تصویر از خودِ تصویرِ لودشده خوانده می‌شود (نه با Image.getSize
  // که برای آدرس‌های سرور محلی می‌تواند بی‌صدا شکست بخورد) تا ارتفاع کادر با
  // نسبت واقعی تصویر یکی شود و هیچ بخشی از عرض آن بریده نشود.
  const handleCoverLoad = useCallback((event: any) => {
    const { width, height } = event?.nativeEvent?.source ?? {};
    if (width > 0 && height > 0) setImageAspectRatio(width / height);
  }, []);

  // ================= SCENE OVERVIEW INTRO SCREEN =================
  if (!inScene) {
    return (
      <SceneIntroScreen
        scenario={scenario}
        dialogueItems={dialogueItems}
        coverImage={coverImage}
        screenHeight={screenHeight}
        showAllDialogues={showAllDialogues}
        onShowAllDialogues={() => setShowAllDialogues(true)}
        onClose={resetToHome}
        onEnterScene={handleEnterScene}
        t={t}
      />
    );
  }

  // ================= SESSION RESULT SCREEN (SHOWN AFTER "FINISH SESSION") =================
  if (showResult) {
    return (
      <SessionResultScreen
        score={SESSION_SCORE}
        pronunciation={SESSION_PRONUNCIATION}
        fluency={SESSION_FLUENCY}
        rhythm={SESSION_RHYTHM}
        englishText={currentDialogue.dialogue}
        translation={currentDialogue.translation}
        words={currentDialogue.words}
        onPracticeAgain={() => {
          setShowResult(false);
          setActiveStepIndex(0);
        }}
        onNextLesson={() => {
          setShowResult(false);
          setActiveStepIndex(0);
          handleNextDialogue();
        }}
      />
    );
  }

  // ================= ACTIVE PRACTICE PLAYER SHEET =================
  const activeCameraTarget = dialogueItems[activeIndex]
    ? {
        x: dialogueItems[activeIndex].x,
        y: dialogueItems[activeIndex].y,
        hotspotId: dialogueItems[activeIndex].hotspotId,
      }
    : undefined;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent={true} />

      {/* Audio Engine */}
      <View style={styles.audioPlayerWrapper}>
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
    </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.scrollablePlayerContainer}
        showsVerticalScrollIndicator={false}
        bounces={true}
      >
        <SceneCameraHero
          coverImage={coverImage}
          onCoverLoad={handleCoverLoad}
          topViewHeight={topViewHeight}
          screenWidth={screenWidth}
          insetsTop={insets.top}
          activeTarget={activeCameraTarget}
          sceneFinished={sceneFinished}
          isShadowingMode={isShadowingMode}
          streakCount={STREAK_COUNT}
          onBack={resetToHome}
          onForward={handleHeaderForwardPress}
          showAddToLeitner={Boolean(
            isShadowingMode && currentDialogue.words && currentDialogue.words.length > 0
          )}
          addToLeitnerLabel={t('addToLeitner')}
          onAddToLeitnerPress={() => setWordsSheetVisible(true)}
        />

        {/* Bottom Sheet Dialogue Card */}
        <View style={styles.playerSheet}>
          <View style={styles.dragHandle} />

          {!isShadowingMode ? (
            <SceneExploreMode
              currentDialogue={currentDialogue}
              sceneHotspots={sceneHotspots}
              activeHotspotIndex={activeHotspotIndex}
              onGoToHotspot={goToHotspot}
              onStartShadowing={() => setIsShadowingMode(true)}
              t={t}
            />
          ) : (
            <ShadowingPracticePanel
              language={language}
              t={t}
              activeStepIndex={activeStepIndex}
              onChangeStep={setActiveStepIndex}
              currentDialogue={currentDialogue}
              playing={playing}
              actionCommand={actionCommand}
              setActionCommand={setActionCommand}
              setPlaying={setPlaying}
              playbackRate={playbackRate}
              toggleSpeed={toggleSpeed}
              togglePlay={togglePlay}
              onPrevDialogue={handlePrevDialogue}
              onNextDialogue={handleNextDialogue}
              onReplay={handleReplay}
            />
          )}
        </View>
      </ScrollView>

      <WordsSheet
        visible={wordsSheetVisible}
        onClose={() => setWordsSheetVisible(false)}
        dialogueText={currentDialogue.dialogue}
        backendWords={currentDialogue.words}
        onOpenBox={() => {
          setWordsSheetVisible(false);
          navigation.navigate('Leitner');
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollablePlayerContainer: {
    flexGrow: 1,
    backgroundColor: COLORS.background,
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

  audioPlayerWrapper: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 0, // یا 1 برای اینکه کاملاً مخفی شود
    opacity: 0,
    zIndex: -1,
  },
});
