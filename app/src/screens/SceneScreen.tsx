import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  BackHandler,
  ImageBackground,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Flame,
  Lightbulb,
  MessageCircle,
  Mic,
  Play,
  Pause,
  RotateCcw,
  Share2,
  Sparkles,
  X,
  Plus,
} from 'lucide-react-native';
import { Share } from 'react-native';

import { COLORS } from '../theme/colors';
import { FONT_FAMILY } from '../theme/typography';
import { SHADOWS } from '../theme/elevation';
import { AudioPlayer } from '../components/AudioPlayer';
import { LEVEL_BADGE_STYLE } from '../components/SceneListCard';
import { WordsSheet } from '../components/WordsSheet';
import { SessionResultScreen } from '../components/SessionResultScreen';
import { expandScenarioToDialogueItems, type Scenario } from '../data/scenarios';
import { useScenes } from '../data/ScenesContext';
import { useLanguage } from '../data/i18n';

// امتیازهای پایان جلسه هنوز از تحلیل صوتی واقعی نمی‌آیند و مانند بقیه‌ی
// معیارهای اپ (مثل Home) مقادیر ثابت نمایشی هستند.
const SESSION_SCORE = 85;
const SESSION_PRONUNCIATION = 80;
const SESSION_FLUENCY = 92;
const SESSION_RHYTHM = 83;

// دوربین دیگر زوم نمی‌کند؛ فقط با pan، هات‌اسپات فعلی را وسط صفحه قرار
// می‌دهد. این مقدار یک بزرگ‌نماییِ ثابت (نه انیمیشنی) است که فقط برای اینکه
// حین pan لبه‌های خالی تصویر دیده نشود لازم است.
const CAMERA_SCALE = 1.8;

// تصویرهای صحنه landscape هستند؛ تا وقتی ابعاد واقعی تصویر لود نشده از این
// نسبت استفاده می‌شود تا فریم اول هم تقریباً درست باشد و تصویر نپرد.
const DEFAULT_SCENE_ASPECT = 16 / 9;

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
  // ناوبری تب‌ها (و edge-to-edge اندروید) بالای صفحه فضای امن اضافه می‌کند؛
  // برای اینکه تصویر واقعاً به بالاترین نقطه‌ی صفحه بچسبد این فضا خنثی می‌شود.
  const insets = useSafeAreaInsets();
  // نسبت واقعی ابعاد تصویر صحنه. ارتفاع ناحیه‌ی بالای صفحه دقیقاً از روی همین
  // نسبت ساخته می‌شود تا کادر با خود تصویر هم‌شکل باشد و هیچ بخشی از عرض آن
  // بریده نشود؛ فقط برای تصویرهای خیلی کشیده‌ی عمودی یک سقف می‌گذاریم که کل
  // صفحه را نبلعند.
  const [imageAspectRatio, setImageAspectRatio] = useState(DEFAULT_SCENE_ASPECT);
  const topViewHeight = Math.min(
    Math.round(screenWidth / imageAspectRatio),
    Math.round(screenHeight * 0.5)
  );

  const [scenario, setScenario] = useState<Scenario | null>(null);
  const [inScene, setInScene] = useState(false); // false = Intro overview, true = Active player
  const [showAllDialogues, setShowAllDialogues] = useState(false); // پیش‌نمایش دیالوگ‌ها در صفحه‌ی اینترو

  // Animated Camera Zoom Scale and Pan Translation for image
  const zoomAnim = useRef(new Animated.Value(1)).current;
  const panXAnim = useRef(new Animated.Value(0)).current;
  const panYAnim = useRef(new Animated.Value(0)).current;
  // آخرین هات‌اسپاتی که دوربین رویش وسط‌چین شده؛ تا وقتی همین هات‌اسپات فعاله
  // (حتی اگر چند خط دیالوگ پشت‌سرهم داشته باشد)، دوربین دست‌نخورده می‌ماند.
  const lastZoomedHotspotIdRef = useRef<string | null>(null);

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
  const [activeStepIndex, setActiveStepIndex] = useState(0); // 0..4 steps
  const [playing, setPlaying] = useState(true);
  const [playbackRate, setPlaybackRate] = useState(1.0);
  const autoMode = true;
  const [repsCount, setRepsCount] = useState(0);
  const [isShadowingMode, setIsShadowingMode] = useState(false);
  // true فقط وقتی که آخرین هات‌اسپات هم تمام شده باشد؛ در این حالت دیگر زوم
  // نباید دوباره تکرار شود و صحنه باید در حالت خارج از زوم بماند.
  const [sceneFinished, setSceneFinished] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [wordsSheetVisible, setWordsSheetVisible] = useState(false);

  // Smooth camera zoom & pan to current hotspot coordinates
  useEffect(() => {
    const zoomOutAnim = () =>
      Animated.parallel([
        Animated.timing(zoomAnim, { toValue: 1, duration: 450, useNativeDriver: true }),
        Animated.timing(panXAnim, { toValue: 0, duration: 450, useNativeDriver: true }),
        Animated.timing(panYAnim, { toValue: 0, duration: 450, useNativeDriver: true }),
      ]);

    // دوربین در هر دو حالت (اکسپلور و تمرین ۴مرحله‌ای) روی هات‌اسپات فعلی
    // زوم و وسط‌چین می‌شود؛ فقط خارج از صحنه ثابت و بدون زوم می‌ماند.
    if (!inScene) {
      lastZoomedHotspotIdRef.current = null;
      zoomOutAnim().start();
      return;
    }

    // وقتی همه‌ی هات‌اسپات‌ها تمام شدند، دوربین یک‌بار کامل زوم اوت می‌کند و
    // دیگر زوم نمی‌کند (تا وقتی کاربر صحنه‌ی جدیدی را باز نکرده).
    if (sceneFinished) {
      lastZoomedHotspotIdRef.current = null;
      zoomOutAnim().start();
      return;
    }

    const currentItem = dialogueItems[activeIndex];
    const currentHotspotId = currentItem?.hotspotId ?? null;

    // اگر هنوز روی همون هات‌اسپاتِ قبلی هستیم (فقط خط دیالوگ داخل همین
    // هات‌اسپات عوض شده)، دوربین زوم‌شده و دست‌نخورده می‌ماند تا همه‌ی
    // دیالوگ‌های این نقطه تمام شوند؛ فقط با تغییر واقعیِ هات‌اسپات، دوربین
    // زوم‌اوت کرده و به نقطه‌ی جدید زوم می‌کند.
    if (currentHotspotId !== null && currentHotspotId === lastZoomedHotspotIdRef.current) {
      return;
    }
    lastZoomedHotspotIdRef.current = currentHotspotId;

    const itemX = currentItem?.x ?? 0.5;
    const itemY = currentItem?.y ?? 0.5;

    // برای مرکز کردن دقیق نقطه‌ی هات‌اسپات، جابه‌جایی باید بر حسب ابعاد واقعی
    // ناحیه‌ی تصویر باشد (نه یک عدد ثابت دلخواه)، وگرنه نقاط نزدیک لبه‌ها اصلاً
    // به مرکز نمی‌رسند.
    const rawPanX = (0.5 - itemX) * screenWidth;
    const rawPanY = (0.5 - itemY) * topViewHeight;

    // حداکثر جابه‌جایی مجازی که با این میزان زوم، بدون نمایش فضای خالی اطراف
    // تصویر امکان‌پذیر است (مشتق‌شده از هندسه‌ی scale+translate).
    const maxPanX = (screenWidth / 2) * (1 - 1 / CAMERA_SCALE);
    const maxPanY = (topViewHeight / 2) * (1 - 1 / CAMERA_SCALE);

    const targetPanX = Math.max(-maxPanX, Math.min(maxPanX, rawPanX));
    const targetPanY = Math.max(-maxPanY, Math.min(maxPanY, rawPanY));

    // اول کامل از حالت زوم خارج شو (بازگشت به نمای عادی)، بعد به هات‌اسپات
    // بعدی زوم کن — همان جلوه‌ی «زوم اوت بعد زوم این» برای هر جابه‌جایی بین
    // هات‌اسپات‌ها.
    Animated.sequence([
      zoomOutAnim(),
      Animated.parallel([
        Animated.timing(zoomAnim, { toValue: CAMERA_SCALE, duration: 550, useNativeDriver: true }),
        Animated.timing(panXAnim, { toValue: targetPanX, duration: 550, useNativeDriver: true }),
        Animated.timing(panYAnim, { toValue: targetPanY, duration: 550, useNativeDriver: true }),
      ]),
    ]).start();
  }, [
    inScene,
    sceneFinished,
    activeIndex,
    dialogueItems,
    screenWidth,
    topViewHeight,
    zoomAnim,
    panXAnim,
    panYAnim,
  ]);
  const [audioUri, setAudioUri] = useState<string | null>(null);
  const [actionCommand, setActionCommand] = useState<
    'none' | 'start_record' | 'stop_record' | 'play_recording' | 'play_original'
  >('none');

  const currentDialogue = dialogueItems[activeIndex] || {
    dialogue: 'Great. Can I pay by card?',
    translation: 'عالی. می‌توانم با کارت پرداخت کنم؟',
    speaker: 'CU CUSTOMER',
    audioUrl: '',
  };

  // متن انگلیسی را می‌شکند تا اولین کلمه‌ی هدف (اگر وجود داشت) به‌صورت پیل
  // هایلایت‌شده رندر شود، دقیقاً مطابق طرح.
  const renderHighlightedDialogue = (text: string, words?: { word: string }[]) => {
    const targetWord = words && words.length > 0 ? words[0].word : null;
    if (!targetWord) return <Text style={styles.dialogueText}>{text}</Text>;

    const matchIdx = text.toLowerCase().indexOf(targetWord.toLowerCase());
    if (matchIdx === -1) return <Text style={styles.dialogueText}>{text}</Text>;

    const before = text.slice(0, matchIdx);
    const match = text.slice(matchIdx, matchIdx + targetWord.length);
    const after = text.slice(matchIdx + targetWord.length);

    return (
      <Text style={styles.dialogueText}>
        {before}
        <Text style={styles.dialogueHighlightWord}>{match}</Text>
        {after}
      </Text>
    );
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

  // ================= SCENE OVERVIEW INTRO SCREEN (SCREENSHOT #2) =================
  if (!inScene) {
    const levelInfo = LEVEL_BADGE_STYLE[scenario?.level || 'Beginner'] || LEVEL_BADGE_STYLE.Beginner;
    const LevelIcon = levelInfo.Icon;
    const hotspotsCount = scenario?.hotspots?.length || 0;
    const sentencesTotal = dialogueItems.length;
    const minutesCount = parseInt(scenario?.time || '0', 10) || 0;
    const previewDialogues = showAllDialogues ? dialogueItems : dialogueItems.slice(0, 2);
    const moreSentencesCount = Math.max(0, sentencesTotal - previewDialogues.length);
    const handleShare = () => {
      Share.share({ message: scenario?.title || 'Shadow' }).catch(() => {});
    };

    return (
      <View style={styles.container}>
        <ScrollView contentContainerStyle={styles.introScroll} showsVerticalScrollIndicator={false}>
          {/* Cover Hero Banner */}
          <View style={[styles.introCoverWrapper, { height: screenHeight / 3 }]}>
            <ImageBackground source={coverImage} style={styles.introCover}>
              <View style={styles.introCoverScrim} />
              <TouchableOpacity
                style={styles.closeBtn}
                onPress={resetToHome}
              >
                <X size={20} color={COLORS.white} />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.closeBtn, styles.shareBtn]}
                onPress={handleShare}
              >
                <Share2 size={18} color={COLORS.white} />
              </TouchableOpacity>
            </ImageBackground>
          </View>

          {/* Scenario Meta Header */}
          <View style={styles.introHeader}>
            <View style={styles.introTitleRow}>
              <Text style={styles.introTitle}>
                {scenario?.title || 'The Last Can of Tuna'}
              </Text>
              <View style={[styles.introLevelBadge, { backgroundColor: levelInfo.bg }]}>
                <LevelIcon size={12} color={levelInfo.text} />
                <Text style={[styles.introLevelBadgeText, { color: levelInfo.text }]}>
                  {scenario?.level || 'Beginner'}
                </Text>
              </View>
            </View>
            <Text style={styles.introDesc}>
              {scenario?.description ||
                'Maya has ten dollars and a hungry roommate. Walk the aisles, ask for prices, and get to the checkout before it closes.'}
            </Text>
          </View>

          {/* 3 Metric Pills Row */}
          <View style={styles.statsRow}>
            <View style={styles.statPill}>
              <Text style={styles.statNumber}>{hotspotsCount}</Text>
              <Text style={styles.statLabel}>{t('hotspots')}</Text>
            </View>

            <View style={styles.statPill}>
              <Text style={styles.statNumber}>{sentencesTotal}</Text>
              <Text style={styles.statLabel}>{t('sentencesCount')}</Text>
            </View>

            <View style={styles.statPill}>
              <Text style={styles.statNumber}>{minutesCount}</Text>
              <Text style={styles.statLabel}>{t('minutesCount')}</Text>
            </View>
          </View>

          {/* 4-Step Method Tip Banner */}
          <View style={styles.tipBanner}>
            <View style={styles.tipIconCircle}>
              <Lightbulb size={18} color={COLORS.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.tipTitle}>{t('fourStepMethodTitle')}</Text>
              <Text style={styles.tipText}>{t('sceneRuleTip')}</Text>
            </View>
          </View>

          {/* Dialogue Preview */}
          <Text style={styles.conversationsLabel}>
            {t('dialoguePreview')}
          </Text>

          <View style={styles.conversationsList}>
            {previewDialogues.map((item, index) => (
              <TouchableOpacity
                key={item.id || index}
                activeOpacity={0.8}
                style={styles.convCard}
                onPress={handleEnterScene}
              >
                <View style={styles.convNumCircle}>
                  <MessageCircle size={16} color={COLORS.primary} />
                </View>

                <View style={{ flex: 1 }}>
                  <Text style={styles.convTitle}>{item.dialogue}</Text>
                  <Text style={styles.convFaTitle}>{item.translation}</Text>
                </View>
              </TouchableOpacity>
            ))}

            {moreSentencesCount > 0 && (
              <TouchableOpacity
                style={styles.moreSentencesRow}
                onPress={() => setShowAllDialogues(true)}
              >
                <Text style={styles.moreSentencesText}>
                  {moreSentencesCount} {t('moreSentencesSuffix')}
                </Text>
                <ChevronRight size={16} color={COLORS.textSecondary} />
              </TouchableOpacity>
            )}
          </View>

          {/* Enter Scene CTA Button */}
          <TouchableOpacity
            activeOpacity={0.88}
            style={styles.enterCtaBtn}
            onPress={handleEnterScene}
          >
            <Play size={20} color={COLORS.white} fill={COLORS.white} />
            <Text style={styles.enterCtaText}>{t('enterScene')}</Text>
          </TouchableOpacity>

          <View style={{ height: 40 }} />
        </ScrollView>
      </View>
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

  // ================= ACTIVE PRACTICE PLAYER SHEET (100% PURE ENGLISH UI & SCROLLABLE) =================
  const stepTabs: { num: 1 | 2 | 3 | 4; key: 'tabListen' | 'tabShadow' | 'tabRecord' | 'tabCompare' }[] = [
    { num: 1, key: 'tabListen' },
    { num: 2, key: 'tabShadow' },
    { num: 3, key: 'tabRecord' },
    { num: 4, key: 'tabCompare' },
  ];
  const orderedStepTabs = language === 'fa' ? [...stepTabs].reverse() : stepTabs;

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
        {/* Top Scene Camera Zoom View with header controls overlaid ON the image */}
        <View style={[styles.playerTopView, { height: topViewHeight, marginTop: -insets.top }]}>
          <View style={styles.zoomContainer}>
            <Animated.Image
              source={coverImage}
              onLoad={handleCoverLoad}
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
              // contain تضمین می‌کند حتی اگر ارتفاع کادر دقیقاً با نسبت تصویر
              // یکی نشود، باز هم کل عرض تصویر دیده شود و از طرفین بریده نشود.
              resizeMode="contain"
            />
          </View>

          {/* Overlay Header: back-to-home · streak · (shadowing mode) forward */}
          {/* تصویر زیر نوار وضعیت کشیده شده، پس دکمه‌ها باید پایین‌تر از آن بنشینند */}
          <View style={[styles.imageHeaderOverlay, { top: insets.top + 8 }]}>
            <TouchableOpacity
              activeOpacity={0.85}
              style={styles.overlayIconBtn}
              onPress={resetToHome}
            >
              <ChevronRight size={20} color={COLORS.text} />
            </TouchableOpacity>

            <View style={styles.streakOverlayBadge}>
              <Text style={styles.streakOverlayText}>14</Text>
              <Flame size={14} color={COLORS.secondary} fill={COLORS.secondary} />
            </View>

            {isShadowingMode && (
              <TouchableOpacity
                activeOpacity={0.85}
                style={styles.overlayIconBtn}
                onPress={handleHeaderForwardPress}
              >
                <ArrowRight size={18} color={COLORS.text} />
              </TouchableOpacity>
            )}
          </View>

          {isShadowingMode && currentDialogue.words && currentDialogue.words.length > 0 && (
            <TouchableOpacity
              style={styles.addToLeitnerPill}
              onPress={() => setWordsSheetVisible(true)}
            >
              <Plus size={14} color={COLORS.white} />
              <Text style={styles.addToLeitnerPillText}>{t('addToLeitner')}</Text>
            </TouchableOpacity>
          )}
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
              <Text style={styles.translationText}>{currentDialogue.translation}</Text>

              {/* Hotspot Prev/Next Navigation */}
              <View style={styles.hotspotNavRow}>
                <TouchableOpacity
                  style={styles.hotspotNavBtn}
                  disabled={activeHotspotIndex === 0}
                  onPress={() => goToHotspot(activeHotspotIndex - 1)}
                >
                  <ChevronLeft
                    size={18}
                    color={activeHotspotIndex === 0 ? COLORS.border : COLORS.text}
                  />
                </TouchableOpacity>

                <Text style={styles.hotspotSelectTitle}>
                  {t('hotspots')} {activeHotspotIndex + 1} / {sceneHotspots.length}
                </Text>

                <TouchableOpacity
                  style={styles.hotspotNavBtn}
                  disabled={activeHotspotIndex >= sceneHotspots.length - 1}
                  onPress={() => goToHotspot(activeHotspotIndex + 1)}
                >
                  <ChevronRight
                    size={18}
                    color={
                      activeHotspotIndex >= sceneHotspots.length - 1 ? COLORS.border : COLORS.text
                    }
                  />
                </TouchableOpacity>
              </View>

              {/* Hotspots Selector Row */}
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.hotspotChipScroll}>
                {sceneHotspots.map((hs, i) => (
                  <TouchableOpacity
                    key={hs.id || i}
                    style={[styles.hotspotChip, activeHotspotIndex === i ? styles.hotspotChipActive : null]}
                    onPress={() => goToHotspot(i)}
                  >
                    <Text
                      style={[
                        styles.hotspotChipText,
                        activeHotspotIndex === i ? styles.hotspotChipTextActive : null,
                      ]}
                    >
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
                <Mic size={20} color={COLORS.white} />
                <Text style={styles.startShadowingCtaText}>Start 4-Step Shadowing Practice 🎙️</Text>
              </TouchableOpacity>
            </View>
          ) : (
            /* ================= MODE 2: 4-STEP INTERACTIVE SHADOWING MODE (matches design) ================= */
            <View>
              {/* Continuous 4-Step Segmented Tabs */}
              <View style={styles.segmentedTabsRow}>
                {orderedStepTabs.map((st) => {
                  const stepIdx = st.num - 1;
                  const active = activeStepIndex === stepIdx;
                  return (
                    <TouchableOpacity
                      key={st.num}
                      activeOpacity={0.7}
                      style={styles.segmentedTab}
                      onPress={() => setActiveStepIndex(stepIdx)}
                    >
                      <Text style={[styles.segmentedTabText, active ? styles.segmentedTabTextActive : null]}>
                        {t(st.key)}
                      </Text>
                      {active && <View style={styles.segmentedTabIndicator} />}
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Dialogue Sentence with vocab-word highlight + translation */}
              <View style={styles.dialogueBox}>
                {renderHighlightedDialogue(
                  currentDialogue.dialogue || 'Great. Can I pay by card?',
                  currentDialogue.words
                )}
                <Text style={styles.translationText}>{currentDialogue.translation}</Text>

                {activeStepIndex === 1 && (
                  <View style={styles.shadowBannerPill}>
                    <Sparkles size={14} color={COLORS.secondaryContainer} />
                    <Text style={styles.shadowBannerText}>{t('repeatAlongBanner')}</Text>
                  </View>
                )}

                {activeStepIndex === 3 && currentDialogue.words && currentDialogue.words.length > 0 && (
                  <View style={styles.checkWordChip}>
                    <Text style={styles.checkWordChipText}>
                      {t('checkWordPrefix')} '{currentDialogue.words[0].word}'
                    </Text>
                  </View>
                )}
              </View>

              {/* Waveform Card with centered playhead (matches design) */}
              <View style={styles.waveformCard}>
                {activeStepIndex === 1 ? (
                  <>
                    <View style={styles.waveformRow}>
                      {Array.from({ length: 24 }).map((_, idx) => (
                        <View
                          key={idx}
                          style={[styles.waveBar, { height: 8 + ((idx * 7) % 20), backgroundColor: COLORS.primary }]}
                        />
                      ))}
                    </View>
                    <View style={styles.waveformDivider} />
                    <View style={styles.waveformRow}>
                      {Array.from({ length: 24 }).map((_, idx) => (
                        <View
                          key={idx}
                          style={[
                            styles.waveBar,
                            {
                              height: actionCommand === 'start_record' ? 8 + ((idx * 5) % 18) : 8,
                              backgroundColor: COLORS.secondary,
                            },
                          ]}
                        />
                      ))}
                    </View>
                  </>
                ) : activeStepIndex === 3 ? (
                  <>
                    <Text style={styles.compareLabel}>{t('masterAudio')}</Text>
                    <View style={styles.waveformRow}>
                      {Array.from({ length: 24 }).map((_, idx) => (
                        <View
                          key={idx}
                          style={[styles.waveBar, { height: 8 + ((idx * 7) % 20), backgroundColor: COLORS.primary }]}
                        />
                      ))}
                    </View>
                    <Text style={[styles.compareLabel, { marginTop: 10 }]}>{t('yourRecording')}</Text>
                    <View style={styles.waveformRow}>
                      {Array.from({ length: 24 }).map((_, idx) => (
                        <View
                          key={idx}
                          style={[styles.waveBar, { height: 8 + ((idx * 5) % 16), backgroundColor: COLORS.secondary }]}
                        />
                      ))}
                    </View>
                  </>
                ) : (
                  <View style={styles.waveformRow}>
                    {Array.from({ length: 24 }).map((_, idx) => (
                      <View
                        key={idx}
                        style={[
                          styles.waveBar,
                          {
                            height:
                              (activeStepIndex === 0 && playing) || (activeStepIndex === 2 && actionCommand === 'start_record')
                                ? 8 + ((idx * 7) % 20)
                                : 8,
                            backgroundColor: COLORS.primary,
                          },
                        ]}
                      />
                    ))}
                    <View style={styles.waveformPlayhead} />
                  </View>
                )}
              </View>

              {activeStepIndex === 2 && (
                <Text style={styles.holdToRecordHint}>{t('holdToRecord')}</Text>
              )}

              {/* Unified Player Controls: prev · speed · main action · secondary · next */}
              <View style={styles.controlsBar}>
                <TouchableOpacity style={styles.chevronBtn} onPress={handlePrevDialogue}>
                  <ChevronLeft size={20} color={COLORS.textSecondary} />
                </TouchableOpacity>

                <TouchableOpacity style={styles.speedPillBtn} onPress={toggleSpeed}>
                  <Text style={styles.speedPillText}>{playbackRate}x</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  activeOpacity={0.85}
                  style={[
                    styles.centerMicBtn,
                    actionCommand === 'start_record' ? styles.centerMicBtnActive : null,
                  ]}
                  onPress={() => {
                    if (activeStepIndex === 1) {
                      if (actionCommand === 'start_record') {
                        setActionCommand('stop_record');
                      } else {
                        setActionCommand('start_record');
                        setPlaying(true);
                      }
                    } else {
                      // Steps 0 (Listen) and 3 (Compare) share a simple play/pause toggle.
                      togglePlay();
                    }
                  }}
                  onPressIn={activeStepIndex === 2 ? () => setActionCommand('start_record') : undefined}
                  onPressOut={activeStepIndex === 2 ? () => setActionCommand('stop_record') : undefined}
                >
                  {activeStepIndex === 1 || activeStepIndex === 2 ? (
                    <Mic size={24} color={COLORS.white} />
                  ) : playing ? (
                    <Pause size={22} color={COLORS.white} fill={COLORS.white} />
                  ) : (
                    <Play size={22} color={COLORS.white} fill={COLORS.white} />
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.smallPlayBtn}
                  onPress={
                    activeStepIndex === 2
                      ? () => setActionCommand('play_recording')
                      : activeStepIndex === 3
                      ? () => setActionCommand('start_record')
                      : handleReplay
                  }
                >
                  {activeStepIndex === 3 ? (
                    <RotateCcw size={16} color={COLORS.primary} />
                  ) : (
                    <Play size={16} color={COLORS.primary} />
                  )}
                </TouchableOpacity>

                <TouchableOpacity style={styles.chevronBtn} onPress={handleNextDialogue}>
                  <ChevronRight size={20} color={COLORS.textSecondary} />
                </TouchableOpacity>
              </View>
            </View>
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
  shareBtn: {
    left: 16,
    right: undefined,
  },
  introHeader: {
    marginBottom: 20,
  },
  introTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    marginBottom: 10,
  },
  introLevelBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  introLevelBadgeText: {
    fontFamily: FONT_FAMILY.bold,
    fontSize: 11,
  },
  introTitle: {
    flex: 1,
    color: COLORS.text,
    fontFamily: FONT_FAMILY.bold,
    fontSize: 28,
    letterSpacing: -0.5,
  },
  introDesc: {
    color: COLORS.textSecondary,
    fontFamily: FONT_FAMILY.regular,
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
    fontFamily: FONT_FAMILY.bold,
    fontSize: 20,
  },
  statLabel: {
    color: COLORS.textSecondary,
    fontFamily: FONT_FAMILY.regular,
    fontSize: 12,
    marginTop: 2,
  },
  conversationsLabel: {
    color: COLORS.textSecondary,
    fontFamily: FONT_FAMILY.semiBold,
    fontSize: 12,
    letterSpacing: 1,
    marginBottom: 12,
  },
  conversationsList: {
    gap: 10,
    marginBottom: 20,
  },
  convCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
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
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  convTitle: {
    color: COLORS.text,
    fontFamily: FONT_FAMILY.semiBold,
    fontSize: 14,
    marginBottom: 4,
  },
  convFaTitle: {
    color: COLORS.textSecondary,
    fontFamily: FONT_FAMILY.regular,
    fontSize: 13,
  },
  moreSentencesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
  },
  moreSentencesText: {
    color: COLORS.textSecondary,
    fontFamily: FONT_FAMILY.semiBold,
    fontSize: 13,
  },
  tipBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: COLORS.primaryLight,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.primaryLight,
    gap: 12,
    marginBottom: 24,
  },
  tipIconCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tipTitle: {
    color: COLORS.text,
    fontFamily: FONT_FAMILY.bold,
    fontSize: 14,
    marginBottom: 4,
  },
  tipText: {
    color: COLORS.textSecondary,
    fontFamily: FONT_FAMILY.regular,
    fontSize: 13,
    lineHeight: 20,
    flex: 1,
  },
  enterCtaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    borderRadius: 28,
    height: 56,
    gap: 10,
  },
  enterCtaText: {
    color: COLORS.white,
    fontFamily: FONT_FAMILY.bold,
    fontSize: 16,
  },

  // Active Player Styles
  scrollablePlayerContainer: {
    flexGrow: 1,
    backgroundColor: COLORS.background,
  },
  addToLeitnerPill: {
    position: 'absolute',
    top: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
  },
  addToLeitnerPillText: {
    color: COLORS.white,
    fontFamily: FONT_FAMILY.semiBold,
    fontSize: 12,
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
    fontFamily: FONT_FAMILY.semiBold,
    fontSize: 11,
  },
  hotspotNavRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    marginTop: 12,
  },
  hotspotNavBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hotspotSelectTitle: {
    color: COLORS.textSecondary,
    fontFamily: FONT_FAMILY.semiBold,
    fontSize: 12,
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
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  hotspotChipText: {
    color: COLORS.textSecondary,
    fontFamily: FONT_FAMILY.semiBold,
    fontSize: 12,
  },
  hotspotChipTextActive: {
    color: COLORS.white,
  },
  startShadowingCtaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    borderRadius: 22,
    gap: 8,
    marginTop: 6,
  },
  startShadowingCtaText: {
    color: COLORS.white,
    fontFamily: FONT_FAMILY.bold,
    fontSize: 15,
  },
  playerTopView: {
    width: '100%',
    position: 'relative',
    overflow: 'hidden',
    // هم‌رنگ پس‌زمینه تا اگر جایی نوار خالی کنار تصویر ماند، به‌جای مشکیِ تو
    // ذوق‌زن با بقیه‌ی صفحه یکدست شود.
    backgroundColor: COLORS.background,
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
  imageHeaderOverlay: {
    position: 'absolute',
    left: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 20,
  },
  overlayIconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  streakOverlayBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 18,
  },
  streakOverlayText: {
    color: COLORS.text,
    fontFamily: FONT_FAMILY.bold,
    fontSize: 13,
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
  dialogueBox: {
    alignItems: 'center',
    marginBottom: 10,
  },
  speakerPill: {
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginBottom: 6,
  },
  speakerText: {
    color: COLORS.primary,
    fontFamily: FONT_FAMILY.bold,
    fontSize: 11,
    letterSpacing: 0.8,
  },
  englishText: {
    color: COLORS.text,
    fontFamily: FONT_FAMILY.bold,
    fontSize: 19,
    lineHeight: 26,
    marginBottom: 4,
  },
  dialogueText: {
    color: COLORS.text,
    fontFamily: FONT_FAMILY.bold,
    fontSize: 20,
    lineHeight: 28,
    textAlign: 'center',
    marginBottom: 6,
  },
  dialogueHighlightWord: {
    color: COLORS.primary,
    backgroundColor: COLORS.primaryLight,
    borderRadius: 6,
    textDecorationLine: 'underline',
    textDecorationStyle: 'dashed',
    textDecorationColor: COLORS.primary,
  },
  translationText: {
    color: COLORS.textSecondary,
    fontFamily: FONT_FAMILY.regular,
    fontSize: 14,
    textAlign: 'center',
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
  waveformCard: {
    width: '100%',
    backgroundColor: COLORS.backgroundSoft,
    borderRadius: 18,
    paddingVertical: 12,
    paddingHorizontal: 10,
    marginVertical: 10,
  },
  waveformPlayhead: {
    position: 'absolute',
    top: 4,
    bottom: 4,
    left: '50%',
    width: 2,
    borderRadius: 1,
    backgroundColor: COLORS.primary,
  },
  controlsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginVertical: 10,
  },
  chevronBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  speedPillBtn: {
    backgroundColor: COLORS.surfaceLight,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
  },
  speedPillText: {
    color: COLORS.textSecondary,
    fontFamily: FONT_FAMILY.semiBold,
    fontSize: 12,
  },
  centerMicBtn: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.level1,
  },
  centerMicBtnActive: {
    backgroundColor: COLORS.error,
  },
  smallPlayBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // 4-Step Interactive Shadowing Styles
  segmentedTabsRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    marginBottom: 14,
  },
  segmentedTab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentedTabText: {
    color: COLORS.textSecondary,
    fontFamily: FONT_FAMILY.semiBold,
    fontSize: 12,
  },
  segmentedTabTextActive: {
    color: COLORS.primary,
    fontFamily: FONT_FAMILY.bold,
  },
  segmentedTabIndicator: {
    marginTop: 6,
    height: 3,
    width: '70%',
    borderRadius: 2,
    backgroundColor: COLORS.primary,
  },
  shadowBannerPill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    gap: 6,
    backgroundColor: COLORS.secondaryLight,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    marginBottom: 8,
  },
  shadowBannerText: {
    color: COLORS.secondaryContainer,
    fontFamily: FONT_FAMILY.semiBold,
    fontSize: 12,
  },
  waveformDivider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: 4,
  },
  holdToRecordHint: {
    color: COLORS.textSecondary,
    fontFamily: FONT_FAMILY.regular,
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 6,
  },
  checkWordChip: {
    alignSelf: 'center',
    backgroundColor: 'rgba(186, 26, 26, 0.10)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginBottom: 10,
  },
  checkWordChipText: {
    color: COLORS.error,
    fontFamily: FONT_FAMILY.semiBold,
    fontSize: 12,
  },
  compareLabel: {
    color: COLORS.textSecondary,
    fontFamily: FONT_FAMILY.semiBold,
    fontSize: 12,
    marginBottom: 4,
  },
});