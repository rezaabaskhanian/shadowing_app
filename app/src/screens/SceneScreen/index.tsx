import React, { useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react';
import { Alert, BackHandler, ScrollView, StatusBar, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { COLORS } from '../../theme/colors';
import { FONT_FAMILY } from '../../theme/typography';
import { AudioPlayer } from '../../components/AudioPlayer';
import { SessionResultScreen } from '../../components/SessionResultScreen';
import { expandScenarioToDialogueItems, type Scenario } from '../../data/scenarios';
import { useScenes, sceneKeys } from '../../data/ScenesContext';
import { useLanguage } from '../../data/i18n';
import { useToast } from '../../data/ToastContext';
import { usePracticeSettings } from '../../data/PracticeSettingsContext';
import { saveRecording } from '../../services/RecordingsService';
import { evaluateRecording, type EvaluationResult } from '../../api/shadowing';
import { SceneLockedError } from '../../api/scenes';
import { getUserStreak, recordDialogueProgress } from '../../api/progress';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../data/AuthContext';

import { SceneIntroScreen } from './SceneIntroScreen';
import { SceneCameraHero } from './SceneCameraHero';
import { SceneExploreMode } from './SceneExploreMode';
import { ShadowingPracticePanel, PlayerControlsBar, PinnedCurrentLine } from './shadowing';
import { DialogueSentenceContent } from './shadowing/DialogueSentenceContent';
import { playbackReducer, initialPlaybackState, isAutoStep as stepIsAuto } from './playbackReducer';

// امتیازهای پایان جلسه وقتی کاربر هیچ ضبطی نکرده باشد. اگر ضبطی ارزیابی شده
// باشد، میانگین نمره‌های واقعی جایشان می‌نشیند.
const SESSION_SCORE = 85;
const SESSION_PRONUNCIATION = 80;
const SESSION_FLUENCY = 92;
const SESSION_RHYTHM = 83;

// AUTO_REPEAT_STEPS در playbackReducer تعریف شده تا خودِ reducer هم بداند
// کدام مرحله با تعویضِ مرحله باید پخش را شروع کند و کدام نه:
// فقط مرحله‌های ورودی (Listen و Shadow) دور خودکار دارند. این اجبار نیست —
// کاربر هر لحظه می‌تواند با تب یا دکمه‌ی «مرحله بعد» جلو برود. مرحله‌های ضبط و
// مقایسه همیشه با سرعت خودِ کاربر پیش می‌روند، چون آنجا کاربر تصمیم می‌گیرد کِی
// راضی شده — رفتار رایج اپ‌های شدوئینگ.

// تصویرهای صحنه landscape هستند؛ تا وقتی ابعاد واقعی تصویر لود نشده از این
// نسبت استفاده می‌شود تا فریم اول هم تقریباً درست باشد و تصویر نپرد.
const DEFAULT_SCENE_ASPECT = 16 / 9;

// مدت تقریبی یک جمله‌ی دیالوگ به ثانیه. مبنای سنجش روانی گفتار است: اگر کاربر
// خیلی کندتر یا تندتر از این بگوید نمره‌ی روانی پایین می‌آید. مقدار واقعی هر
// جمله در بک‌اند (`wait_duration`) هست و وقتی dialogue_id بفرستیم همان
// استفاده می‌شود؛ این فقط پشتیبان است.
const DEFAULT_LINE_SECONDS = 3;

/** ضبط کاربر برای یک جمله، همان‌طور که در حافظه‌ی این صفحه نگه داشته می‌شود. */
interface LineRecording {
  /** مسیر فایل روی دیسک (همان چیزی که در «ضبط‌های من» هم ذخیره شده). */
  filePath: string;
  mimeType?: string;
  /** مدت واقعی ضبط به ثانیه؛ ورودی نمره‌دهی روانی است. */
  duration: number;
}

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
  const queryClient = useQueryClient();

  /**
   * ثبت یک جمله‌ی کامل‌شده. وقتی این جمله صحنه را تمام کند، کش صحنه‌ها
   * بی‌اعتبار می‌شود تا تیکِ صحنه در لیست خانه خودش تازه شود — به‌جای اینکه
   * هرجا لازم شد یادمان باشد دستی reload صدا بزنیم.
   *
   * شکستش عمداً بی‌صداست: نباید نمره‌ای که کاربر همین حالا گرفته را خراب کند.
   */
  const progressMutation = useMutation({
    mutationFn: recordDialogueProgress,
    onSuccess: (res) => {
      if (res?.is_completed) {
        queryClient.invalidateQueries({ queryKey: sceneKeys.list });
      }
    },
    onError: (err) => console.warn('[SceneScreen] failed to record scene progress:', err),
  });
  const { language, t } = useLanguage();
  const toast = useToast();
  const { repeatsPerStep, textDisplayMode, setTextDisplayMode } = usePracticeSettings();
  const { user } = useAuth();
  const [streakCount, setStreakCount] = useState(0);

  useFocusEffect(
    useCallback(() => {
      if (!user?.id) return;
      let active = true;
      getUserStreak(user.id)
        .then((s) => active && setStreakCount(s.current_streak))
        .catch(() => {});
      return () => {
        active = false;
      };
    }, [user?.id])
  );
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
  const topViewHeight = Math.min(
    Math.round(screenWidth / imageAspectRatio),
    Math.round(screenHeight * 0.6)
  );

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
    getScene(scenarioId)
      .then((s) => {
        if (mounted) setScenario(s ?? null);
      })
      .catch((e) => {
        if (!mounted) return;
        if (e instanceof SceneLockedError) {
          navigation.replace('Paywall');
          return;
        }
        setScenario(null);
      });
    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scenarioId, getScene]);

  /**
   * ماشین حالتِ پخش و مرحله. این مقادیر به هم وابسته‌اند و هر گذارشان باید
   * اتمیک باشد، پس با یک reducer اداره می‌شوند نه چند useState پراکنده —
   * جزئیاتِ چرایی در playbackReducer.ts.
   */
  const [pb, dispatch] = useReducer(playbackReducer, initialPlaybackState);
  const {
    activeIndex,
    step: activeStepIndex,
    shadowing: isShadowingMode,
    playing,
    audioUri,
    command: actionCommand,
    nonce: audioNonce,
    bubbleVisible,
    sceneFinished,
    lineAudioMissing,
    repeatCount,
    playingRecordingUrl,
    playAllQueue,
  } = pb;

  const [playbackRate, setPlaybackRate] = useState(1.0);
  const autoMode = true;
  const [showResult, setShowResult] = useState(false);
  // موقعیتِ زنده‌ی پخش (ثانیه)، برای هایلایتِ کلمه‌به‌کلمه‌ی هم‌زمان با صدا؛
  // مرجع و ضبطِ کاربر جدا نگه داشته می‌شوند چون هرکدام جای متفاوتی هایلایت می‌شوند.
  const [masterPositionSeconds, setMasterPositionSeconds] = useState(0);
  const [recordingPositionSeconds, setRecordingPositionSeconds] = useState(0);
  // وضعیت ذخیره‌ی صدای ضبط‌شده روی گوشی + نام فایلی که ساخته شد.
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [savedFileName, setSavedFileName] = useState<string | null>(null);
  // نتیجه‌ی نمره‌دهی تلفظ برای هر جمله، کلید = اندیس جمله در dialogueItems.
  // به‌ازای جمله نگه می‌داریم (نه یک مقدار واحد) تا با جابه‌جا شدن بین جمله‌ها
  // بازخورد جمله‌ی قبلی روی جمله‌ی جدید نماند.
  const [evaluations, setEvaluations] = useState<Record<number, EvaluationResult>>({});
  // وضعیت/خطای نمره‌دهی به‌ازای هر جمله جداست (نه یک مقدار سراسری) چون همه‌ی
  // جمله‌های ضبط‌شده هم‌زمان و موازی نمره‌دهی می‌شوند (پایین‌تر، ورود به
  // Compare) — با یک مقدار واحد، وضعیتِ «در حال بررسی»ی یک جمله روی بقیه هم
  // نشان داده می‌شد.
  const [evalStates, setEvalStates] = useState<Record<number, 'idle' | 'scoring' | 'done' | 'error'>>({});
  const [evalErrors, setEvalErrors] = useState<Record<number, string | null>>({});
  // زمان شروع ضبط، برای اینکه مدت واقعی ضبط را به سرور بدهیم؛ نمره‌ی روانی
  // بدون آن قابل محاسبه نیست.
  const recordStartedAtRef = useRef<number>(0);

  // ضبط کاربر برای هر جمله (کلید = اندیس جمله). در حافظه نگه داشته می‌شود تا
  // بشود هر جمله را جدا یا همه را پشت‌سرهم پخش کرد؛ نسخه‌ی ماندگارش هم روی
  // گوشی ذخیره می‌شود.
  const [recordings, setRecordings] = useState<Record<number, LineRecording>>({});
  // در مرحله‌ی ضبط، متن پیش‌فرض مخفی است تا کاربر از حفظ بگوید. یک‌بار که
  // کاربر «نمایش متن» را بزند، دیگر برای همه‌ی جمله‌های این صحنه آشکار
  // می‌ماند — لازم نیست هر جمله را دوباره جدا آشکار کند.
  const [textRevealed, setTextRevealed] = useState(false);
  // false فقط بعد از یک شکست واقعی در native module (مثلاً مجوز میکروفن رد
  // شده) می‌شود؛ تا آن لحظه فرض می‌کنیم ضبط ممکن است.
  const [canRecord, setCanRecord] = useState(true);
  // مرحله‌هایی که کاربر تا آخر رفته (دورهای پیشنهادی را کامل کرده یا خودش
  // اعلام پایان کرده). فقط برای نشان‌دادن تیک روی تب است، نه قفل‌کردن مسیر.
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);

  // آیا مرحله‌ی فعلی دور خودکار دارد یا دست خود کاربر است.
  const isAutoStep = stepIsAuto(activeStepIndex);
  // تعداد دور پیشنهادی مرحله‌ی فعلی (از تنظیمات کاربر)؛ ۰ یعنی بی‌نهایت.
  const targetRepeats = repeatsPerStep;

  const currentDialogue = dialogueItems[activeIndex] || {
    dialogue: 'Great. Can I pay by card?',
    translation: 'عالی. می‌توانم با کارت پرداخت کنم؟',
    speaker: 'CU CUSTOMER',
    audioUrl: '',
  };

  // نتیجه‌ی نمره‌دهی همین جمله (اگر ضبطی ارزیابی شده باشد).
  const currentEvaluation = evaluations[activeIndex];

  const currentEvalState = evalStates[activeIndex] ?? 'idle';
  const currentEvalError = evalErrors[activeIndex] ?? null;

  // اندیس جمله‌هایی که ضبط دارند — برای علامت‌زدن در لیست ضبط‌ها.
  const recordedLineNumbers = useMemo(
    () => Object.keys(recordings).map(Number),
    [recordings]
  );

  // برچسب کوتاه هر جمله برای لیست؛ خودِ متن‌ها ممکن است بلند باشند و لیست را
  // شلوغ کنند، پس در همان‌جا کوتاه می‌شوند.
  const dialogueLineLabels = useMemo(
    () => dialogueItems.map((d) => d.dialogue),
    [dialogueItems]
  );

  /**
   * نمره‌ی پایان جلسه = میانگین نمره‌های واقعی همه‌ی جمله‌هایی که کاربر ضبط
   * کرده. نمره‌های تخمینی (وقتی سرویس تشخیص گفتار در دسترس نبوده) کنار
   * گذاشته می‌شوند، چون میانگین‌گرفتن از حدس، حدسِ دقیق‌تری نمی‌سازد.
   *
   * اگر هیچ ضبط ارزیابی‌شده‌ای نباشد، همان مقادیر نمایشی قبلی می‌مانند تا
   * صفحه‌ی نتیجه خالی نباشد.
   */
  const sessionScores = useMemo(() => {
    const real = Object.values(evaluations).filter((e) => !e.is_estimated);
    if (real.length === 0) {
      return {
        score: SESSION_SCORE,
        pronunciation: SESSION_PRONUNCIATION,
        fluency: SESSION_FLUENCY,
        rhythm: SESSION_RHYTHM,
      };
    }

    const avg = (pick: (e: EvaluationResult) => number) =>
      Math.round(real.reduce((sum, e) => sum + pick(e), 0) / real.length);

    const fluency = avg((e) => e.fluency_score);
    return {
      score: avg((e) => e.overall_score),
      pronunciation: avg((e) => e.pronunciation_score),
      fluency,
      // «ریتم» معیار جدایی در بک‌اند ندارد؛ روانی از روی مکث‌ها و سرعت گفتار
      // حساب می‌شود که همان چیزی است که ریتم را می‌سنجد.
      rhythm: fluency,
    };
  }, [evaluations]);

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

  const autoTimeoutRef = useRef<any>(null);

  useEffect(() => {
    return () => {
      if (autoTimeoutRef.current) clearTimeout(autoTimeoutRef.current);
    };
  }, []);

  /**
   * تنها نقطه‌ای که خط دیالوگ فعال را عوض و صدایش را پخش می‌کند. همه‌ی مسیرها
   * (بعدی، قبلی، پرش به هات‌اسپات، شروع دوباره‌ی دور) از همین‌جا رد می‌شوند تا
   * رفتار پخش همه‌جا یکسان بماند.
   */
  const playDialogueAt = useCallback(
    (idx: number) => {
      if (autoTimeoutRef.current) clearTimeout(autoTimeoutRef.current);
      if (!dialogueItems[idx]) return;
      // نوار «ذخیره شد» مال جمله‌ی قبلی است؛ با عوض‌شدن جمله باید برود.
      setSaveState('idle');
      setSavedFileName(null);
      dispatch({ type: 'PLAY_LINE', index: idx, items: dialogueItems });
    },
    [dialogueItems]
  );

  const handleEnterScene = () => {
    setInScene(true);
    playDialogueAt(0);
  };

  // ورود به مرحله‌ی «مقایسه» (idx 3) بدون هیچ ضبطی توی کل صحنه معنی نداره —
  // چیزی برای مقایسه نیست. لازم نیست دقیقاً خطِ فعلی ضبط داشته باشد؛ کافی است
  // حداقل یک جمله ضبط شده باشد، چون توی خودِ Compare هم (مثل Record) می‌شود
  // با دایره‌های بالا بین جمله‌ها جابه‌جا شد. اگر خطِ فعلی ضبط نداشت ولی جای
  // دیگری داشت، مستقیم به همان جمله‌ی ضبط‌شده می‌پریم تا کاربر با یک صفحه‌ی
  // خالی روبه‌رو نشود.
  const jumpToCompare = useCallback(() => {
    // اگر جمله‌ی فعلی ضبط ندارد، اولین جمله‌ی ضبط‌شده را به reducer تحمیل
    // می‌کنیم؛ وگرنه خودش تصمیم می‌گیرد (جمله‌ی به‌خاطرمانده یا فعلی).
    const forceIndex = recordings[activeIndex]
      ? undefined
      : Object.keys(recordings)
          .map(Number)
          .sort((a, b) => a - b)[0];

    dispatch({
      type: 'CHANGE_STEP',
      step: 3,
      items: dialogueItems,
      forceIndex,
      hasRecording: (idx) => !!recordings[idx],
    });
  }, [recordings, activeIndex, dialogueItems]);

  const requestStepChange = useCallback(
    (targetIdx: number) => {
      if (targetIdx === 3 && Object.keys(recordings).length === 0) {
        toast.warning(t('recordingRequiredMessage'), { title: t('recordingRequiredTitle') });
        return;
      }
      if (targetIdx === 3) {
        jumpToCompare();
        return;
      }
      dispatch({ type: 'CHANGE_STEP', step: targetIdx, items: dialogueItems });
    },
    [recordings, t, toast, jumpToCompare, dialogueItems]
  );

  // رفتن به مرحله‌ی بعدی تمرین؛ روی مرحله‌ی آخر، جلسه تمام‌شده تلقی می‌شود.
  // `markDone` فقط وقتی true است که مرحله واقعاً تمام شده باشد (دورها کامل شده
  // یا خود کاربر دکمه‌ی «مرحله بعد» را زده)، نه وقتی صرفاً روی تب دیگری پریده.
  const goToNextStep = useCallback(
    (markDone = true) => {
      if (activeStepIndex === 2 && Object.keys(recordings).length === 0) {
        toast.warning(t('recordingRequiredMessage'), { title: t('recordingRequiredTitle') });
        return;
      }
      if (markDone) {
        setCompletedSteps((prev) =>
          prev.includes(activeStepIndex) ? prev : [...prev, activeStepIndex]
        );
      }
      if (activeStepIndex === 2) {
        jumpToCompare();
      } else if (activeStepIndex < 3) {
        dispatch({ type: 'CHANGE_STEP', step: activeStepIndex + 1, items: dialogueItems });
      } else {
        setShowResult(true);
      }
    },
    [activeStepIndex, recordings, t, toast, jumpToCompare, dialogueItems]
  );

  const handleNextDialogue = useCallback(() => {
    const nextIdx = activeIndex + 1;
    if (nextIdx < dialogueItems.length) {
      playDialogueAt(nextIdx);
      return;
    }

    // ——— یک دور کامل دیالوگ‌ها تمام شد ———
    if (autoTimeoutRef.current) clearTimeout(autoTimeoutRef.current);

    // بیرون از حالت تمرین، فقط اعلام می‌کنیم صحنه تمام شده تا دوربین زوم اوت
    // کند و دیگر تکرار نشود.
    if (!isShadowingMode) {
      dispatch({ type: 'SCENE_FINISHED' });
      return;
    }

    // مرحله‌های دست‌کاربر (ضبط/مقایسه): نه دور خودکار، نه پرش خودکار — همین‌جا
    // می‌ایستیم تا خودش تصمیم بگیرد.
    if (!isAutoStep) {
      dispatch({ type: 'SCENE_FINISHED' });
      return;
    }

    // داخل حالت تمرین: تا targetRepeats بار دوباره از اولین هات‌اسپات شروع
    // می‌کنیم و بعد از آن خودکار به مرحله‌ی بعد می‌رویم. targetRepeats صفر یعنی
    // کاربر «بی‌نهایت» را انتخاب کرده و پرش خودکاری در کار نیست.
    if (targetRepeats === 0 || repeatCount < targetRepeats) {
      if (autoTimeoutRef.current) clearTimeout(autoTimeoutRef.current);
      dispatch({ type: 'NEXT_REPEAT', items: dialogueItems });
    } else {
      goToNextStep();
    }
  }, [
    activeIndex,
    dialogueItems,
    isShadowingMode,
    isAutoStep,
    repeatCount,
    targetRepeats,
    playDialogueAt,
    goToNextStep,
  ]);

  const handlePrevDialogue = useCallback(() => {
    playDialogueAt(activeIndex > 0 ? activeIndex - 1 : 0);
  }, [activeIndex, playDialogueAt]);

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
      playDialogueAt(firstIdx);
    },
    [sceneHotspots, dialogueItems, playDialogueAt]
  );

  const handleReplay = useCallback(() => {
    playDialogueAt(activeIndex);
  }, [activeIndex, playDialogueAt]);

  /**
   * پایان ضبط: صدا در حافظه‌ی صفحه (برای پخش دوباره) و روی گوشی (برای
   * «ضبط‌های من») می‌نشیند.
   *
   * نمره‌دهی اینجا انجام *نمی‌شود* — کاربر در مرحله‌ی مقایسه خودش دکمه‌اش را
   * می‌زند. این‌طور مرحله‌ی ضبط سریع و آفلاین می‌ماند و ضبط‌های پشت‌سرهم،
   * درخواست‌های بی‌مصرف به سرور نمی‌فرستند.
   */
  const handleRecordingStatus = useCallback(
    (status: 'recording' | 'stopped' | 'error', filePath?: string, mimeType?: string) => {
      if (status === 'recording') {
        recordStartedAtRef.current = Date.now();
        setSaveState('idle');
        return;
      }
      if (status === 'error') {
        // اگر native module اصلاً نتوانسته ضبط کند (مثلاً مجوز میکروفن رد
        // شده)، به کاربر بگوییم به‌جای اینکه دکمه بی‌صدا کار نکند.
        setCanRecord(false);
        return;
      }
      if (status !== 'stopped' || !filePath) return;

      // مدت واقعی ضبط؛ اگر به هر دلیل شروع را از دست دادیم، سراغ مدت مرجع
      // جمله می‌رویم تا نمره‌ی روانی از یک عدد بی‌معنی حساب نشود.
      const elapsedSeconds = recordStartedAtRef.current
        ? (Date.now() - recordStartedAtRef.current) / 1000
        : 0;
      const duration = Math.max(1, Math.round(elapsedSeconds || DEFAULT_LINE_SECONDS));

      const lineIndex = activeIndex;
      setRecordings((prev) => ({ ...prev, [lineIndex]: { filePath, mimeType, duration } }));
      // ضبط دوباره یعنی نمره‌ی قبلی این جمله دیگر معتبر نیست.
      setEvaluations((prev) => {
        if (!(lineIndex in prev)) return prev;
        const next = { ...prev };
        delete next[lineIndex];
        return next;
      });
      setEvalStates((prev) => ({ ...prev, [lineIndex]: 'idle' }));
      setEvalErrors((prev) => ({ ...prev, [lineIndex]: null }));

      setSaveState('saving');
      saveRecording({
        sourcePath: filePath,
        mimeType,
        sceneId: String(scenarioId ?? scenario?.id ?? 'scene'),
        sceneTitle: scenario?.title || 'scene',
        lineNumber: lineIndex + 1,
        text: currentDialogue.dialogue,
      })
        .then((meta) => {
          setSavedFileName(meta.fileName);
          setSaveState('saved');
          // بعد از move شدن فایل به مسیر نهایی، حافظه‌ی این جمله هم باید
          // مسیر جدید را بداند وگرنه پخش/نمره‌دهی سراغ فایلی می‌رود که دیگر
          // آنجا نیست.
          setRecordings((prev) =>
            prev[lineIndex]?.filePath === filePath
              ? { ...prev, [lineIndex]: { ...prev[lineIndex], filePath: meta.path } }
              : prev
          );
        })
        .catch((err) => {
          console.warn('[SceneScreen] failed to save recording:', err);
          setSaveState('error');
        });
    },
    [scenarioId, scenario, activeIndex, currentDialogue.dialogue]
  );

  /**
   * پخش ضبط یک جمله‌ی مشخص (یا جمله‌ی جاری). اندیس فعال را هم روی همین جمله
   * می‌گذارد تا دوربین و کادرِ هایلایت‌شده در لیست ضبط‌ها با «پخش همه» هم‌گام
   * جلو بروند، نه اینکه روی جمله‌ی قبل از شروعِ پخش ثابت بمانند.
   */
  const playRecordingOfLine = useCallback(
    (lineIndex: number) => {
      const rec = recordings[lineIndex];
      if (!rec) return;
      // audioUri هم همین‌جا به این جمله می‌رود، تا اگر بعداً کاربر «صدای
      // مرجع» را زد صدای همین جمله پخش شود نه جمله‌ای که قبلاً پخش شده بود.
      dispatch({
        type: 'PLAY_RECORDING',
        index: lineIndex,
        items: dialogueItems,
        filePath: rec.filePath,
      });
    },
    [recordings, dialogueItems]
  );

  /** پخش صدای مرجع همین جمله (بدون تغییر مرحله). */
  const playOriginalOfLine = useCallback(() => {
    dispatch({ type: 'PLAY_ORIGINAL' });
  }, []);

  /** پخش پشت‌سرهمِ همه‌ی ضبط‌های این صحنه، به ترتیب جمله‌ها. */
  const playAllRecordings = useCallback(() => {
    const recorded = dialogueItems
      .map((_, idx) => idx)
      .filter((idx) => recordings[idx]);
    if (recorded.length === 0) return;

    // اولی را همین حالا پخش می‌کنیم و بقیه در صف می‌مانند تا با پایان هرکدام
    // نوبت بعدی برسد.
    dispatch({ type: 'PLAY_ALL', queue: recorded.slice(1) });
    playRecordingOfLine(recorded[0]);
  }, [dialogueItems, recordings, playRecordingOfLine]);

  const stopPlayAll = useCallback(() => {
    // دستور 'none' با playing=false در AudioPlayer به pause ترجمه می‌شود.
    dispatch({ type: 'STOP_PLAY_ALL' });
  }, []);

  /**
   * فرستادن ضبطِ یک جمله‌ی مشخص به بک‌اند برای نمره‌دهی گفتار. هم از مرحله‌ی
   * مقایسه دستی (برای جمله‌ی جاری) صدا زده می‌شود، هم خودکار برای همه‌ی
   * جمله‌های ضبط‌شده وقتی وارد Compare می‌شویم (پایین‌تر) — چند تا هم‌زمان و
   * موازی، برای همین وضعیت/خطا به‌ازای هر جمله جداست، نه یک مقدار سراسری.
   */
  const scoreLine = useCallback(
    (lineIndex: number) => {
      const rec = recordings[lineIndex];
      if (!rec || evalStates[lineIndex] === 'scoring') return;

      const dialogue = dialogueItems[lineIndex];

      setEvalStates((prev) => ({ ...prev, [lineIndex]: 'scoring' }));
      setEvalErrors((prev) => ({ ...prev, [lineIndex]: null }));
      evaluateRecording({
        filePath: rec.filePath,
        mimeType: rec.mimeType,
        dialogueId: dialogue?.dialogueId,
        targetText: dialogue?.dialogue,
        duration: rec.duration,
        expectedDuration: DEFAULT_LINE_SECONDS,
      })
        .then((result) => {
          setEvaluations((prev) => ({ ...prev, [lineIndex]: result }));
          setEvalStates((prev) => ({ ...prev, [lineIndex]: 'done' }));

          // این جمله کامل شد؛ به بک‌اند خبر می‌دهیم تا وقتی همه‌ی جمله‌های
          // صحنه تمام شدند، صحنه در لیست خانه تیک بخورد.
          const sceneId = scenarioId ?? scenario?.id;
          if (sceneId && dialogue?.dialogueId) {
            progressMutation.mutate({
              sceneId: String(sceneId),
              dialogueId: dialogue.dialogueId,
              score: result.overall_score,
            });
          }
        })
        .catch((err) => {
          console.warn('[SceneScreen] pronunciation scoring failed:', err);
          setEvalErrors((prev) => ({ ...prev, [lineIndex]: err?.message || null }));
          setEvalStates((prev) => ({ ...prev, [lineIndex]: 'error' }));
        });
    },
    [recordings, dialogueItems, evalStates, scenarioId, scenario, progressMutation]
  );

  const scoreCurrentLine = useCallback(() => {
    scoreLine(activeIndex);
  }, [scoreLine, activeIndex]);

  /**
   * ورودِ به Compare یعنی کاربر می‌خواهد نتیجه ببیند — به‌جای مجبورکردنش به
   * زدن دکمه‌ی «بررسی گفتارم» برای تک‌تک جمله‌ها، همه‌ی جمله‌های ضبط‌شده‌ای
   * که هنوز نمره ندارند را همین‌جا و موازی می‌فرستیم؛ هرکدام که جواب آمد،
   * همان لحظه (چه کاربر رویش باشد چه نه) توی evaluations می‌نشیند. جمله‌های
   * قبلاً نمره‌گرفته یا در حالِ نمره‌گیری یا شکست‌خورده دوباره فرستاده
   * نمی‌شوند — برای خطا عمداً retry خودکار نداریم تا با یک مشکل مداوم شبکه
   * پشت‌سرهم درخواستِ ناموفق نزنیم؛ retry دستی همان دکمه‌ی «تلاش دوباره» است.
   */
  useEffect(() => {
    if (activeStepIndex !== 3) return;
    Object.keys(recordings)
      .map(Number)
      // جمله‌ی بدون ردیف دیالوگ اصلاً قابل نمره‌دهی نیست؛ فرستادنش فقط یک
      // درخواست ناموفق است.
      .filter((idx) => dialogueItems[idx]?.dialogueId)
      .forEach((idx) => {
        const state = evalStates[idx] ?? 'idle';
        if (!evaluations[idx] && state === 'idle') {
          scoreLine(idx);
        }
      });
  }, [activeStepIndex, recordings, evaluations, evalStates, scoreLine, dialogueItems]);

  /**
   * انتخاب یک جمله از لیست ضبط‌ها/دایره‌های بالا. عمداً خودش پخش را شروع
   * نمی‌کند: کاربر آمده که دوباره ضبط کند یا مقایسه کند، نه اینکه صدای مرجع
   * همین الان پخش شود. ولی `audioUri` را همین‌جا به‌روز می‌کنیم — وگرنه با
   * زدن دکمه‌ی پخش، چون `audioUri` هنوز از آخرین `playDialogueAt` مانده،
   * صدای جمله‌ی قبلی پخش می‌شد نه جمله‌ی تازه‌انتخاب‌شده. `bubbleVisible` هم
   * همین‌جا باز می‌شود — وگرنه اگر صدای جمله‌ی قبلی تا آخر پخش شده بود (که
   * حباب را می‌بندد)، با انتخاب جمله‌ی بعدی حباب همچنان بسته می‌ماند تا
   * کاربر دکمه‌ی پخش را بزند.
   */
  const selectLine = useCallback(
    (lineIndex: number) => {
      if (lineIndex < 0 || lineIndex >= dialogueItems.length) return;
      dispatch({ type: 'SELECT_LINE', index: lineIndex, items: dialogueItems });
    },
    [dialogueItems]
  );

  /**
   * جمله‌هایی که واقعاً می‌شود مقایسه‌شان کرد: باید ردیف دیالوگ در دیتابیس
   * داشته باشند، وگرنه نه نمره‌ی سرور می‌گیرند نه پیشرفتشان ثبت می‌شود. یک
   * هات‌اسپاتِ بی‌دیالوگ نباید درس را برای همیشه ناتمام نگه دارد.
   */
  const gradableIndexes = useMemo(
    () =>
      dialogueItems
        .map((item, idx) => (item.dialogueId ? idx : -1))
        .filter((idx) => idx !== -1),
    [dialogueItems]
  );

  /**
   * تعداد جمله‌هایی که چرخه‌شان کامل شده: هم ضبط شده‌اند هم نمره‌ی مقایسه
   * گرفته‌اند. معیارِ «درس تمام شد» همین است — نه صرفاً ضبط‌شدن، چون خودِ
   * مقایسه بخشی از تمرین است.
   */
  const comparedCount = useMemo(
    () => gradableIndexes.reduce((n, idx) => (evaluations[idx] ? n + 1 : n), 0),
    [gradableIndexes, evaluations]
  );

  /**
   * شروع دوباره‌ی همین صحنه از مرحله‌ی اول و جمله‌ی اول.
   *
   * ضبط‌ها و نمره‌ها عمداً پاک نمی‌شوند: درس همچنان تمام‌شده حساب می‌شود و
   * کاربر فقط دارد دوباره تمرین می‌کند.
   */
  const restartLesson = useCallback(() => {
    setShowResult(false);
    dispatch({ type: 'RESTART_LESSON', items: dialogueItems });
  }, [dialogueItems]);

  /**
   * دکمه‌ی پایان درس در صفحه‌ی نتیجه.
   *
   * اگر همه‌ی جمله‌ها مقایسه شده باشند، درس تمام‌شده اعلام و کاربر به خانه
   * برگردانده می‌شود. وگرنه به‌جای اینکه بی‌صدا رد شود، می‌گوییم چقدر مانده و
   * می‌بریمش سرِ اولین جمله‌ی ناتمام — مرحله‌ی ضبط اگر هنوز ضبطی ندارد، وگرنه
   * مرحله‌ی مقایسه (که خودش ضبط‌های بی‌نمره را نمره می‌دهد).
   */
  const handleFinishLesson = useCallback(() => {
    const total = gradableIndexes.length;
    if (total > 0 && comparedCount === total) {
      // تیکِ صحنه از پیشرفتی می‌آید که با هر نمره ثبت شده؛ کش را بی‌اعتبار
      // می‌کنیم تا کاربر همان لحظه ببیندش، نه دفعه‌ی بعد.
      queryClient.invalidateQueries({ queryKey: sceneKeys.list });
      Alert.alert(
        t('lessonCompleteTitle'),
        t('lessonCompleteMessage'),
        [
          { text: t('shadowAgain'), onPress: restartLesson },
          { text: t('backToHome'), onPress: resetToHome },
        ],
        { cancelable: false }
      );
      return;
    }

    toast.warning(`${t('lessonIncompleteMessage')} (${comparedCount}/${total})`, {
      title: t('lessonIncompleteTitle'),
    });
    setShowResult(false);

    const firstUndone = gradableIndexes.find((idx) => !evaluations[idx]);
    if (firstUndone === undefined) return;
    // forceIndex یعنی این پرشِ عمدی بر حافظه‌ی مرحله اولویت دارد.
    dispatch({
      type: 'CHANGE_STEP',
      step: recordings[firstUndone] ? 3 : 2,
      items: dialogueItems,
      forceIndex: firstUndone,
    });
  }, [
    dialogueItems,
    gradableIndexes,
    comparedCount,
    evaluations,
    recordings,
    resetToHome,
    restartLesson,
    queryClient,
    toast,
    t,
  ]);

  const toggleRevealText = useCallback(() => {
    setTextRevealed((prev) => !prev);
  }, []);

  /**
   * با عوض شدن صحنه، هرچه به «اندیس جمله» کلید خورده باید پاک شود.
   *
   * بدون این، اگر بدون unmount شدن صفحه صحنه عوض شود، ضبط و نمره‌ی جمله‌ی
   * سوم صحنه‌ی قبلی روی جمله‌ی سوم صحنه‌ی جدید می‌نشیند — یعنی کاربر صدای
   * یک جمله‌ی دیگر را زیر جمله‌ی فعلی می‌بیند و می‌شنود.
   */
  useEffect(() => {
    dispatch({ type: 'RESET_SCENE' });
    setRecordings({});
    setEvaluations({});
    setTextRevealed(false);
    setEvalStates({});
    setEvalErrors({});
    setSaveState('idle');
    setSavedFileName(null);
  }, [scenarioId]);

  /** فاصله‌ی مکث بین پایان یک ضبط و شروع پخش ضبطِ بعدی در «پخش همه». */
  const PLAY_ALL_GAP_MS = 1000;

  /** با پایان هر ضبط، اگر صفی هست نوبت بعدی را پخش می‌کند. */
  const handleRecordedPlaybackEnd = useCallback(() => {
    const next = playAllQueue[0];
    if (next === undefined) return;
    dispatch({ type: 'SHIFT_PLAY_ALL' });
    // مکث عمدی تا بین دو ضبط فاصله باشد.
    setTimeout(() => playRecordingOfLine(next), PLAY_ALL_GAP_MS);
  }, [playAllQueue, playRecordingOfLine]);

  // افکتِ همگام‌سازیِ مرحله (و دو ref کمکی‌اش) اینجا بود و حذف شد: تعویض
  // مرحله حالا یک گذارِ اتمیک داخل reducer است (CHANGE_STEP)، پس دیگر لازم
  // نیست افکتی بعد از رندر از روی state حدس بزند مرحله عوض شده و جمله‌ی
  // درست کدام است.

  const toggleSpeed = () => {
    const speeds = [1.0, 0.75, 1.25, 1.5];
    const nextSpeedIdx = (speeds.indexOf(playbackRate) + 1) % speeds.length;
    setPlaybackRate(speeds[nextSpeedIdx]);
  };

  // مکث و ادامه دو نیتِ متفاوت‌اند و باید دو action جدا باشند: با یک دستورِ
  // مشترک، پلیر نمی‌فهمید باید سر جایش بایستد یا از اول پخش کند.
  const togglePlay = () => {
    dispatch({ type: playing ? 'PAUSE' : 'RESUME' });
  };

  // دکمه‌ی فلش روی تصویر: مرحله‌ی بعدی را باز می‌کند؛ روی آخرین مرحله، از
  // صحنه خارج شده و نتیجه‌ی جلسه نمایش داده می‌شود.
  const handleHeaderForwardPress = () => {
    goToNextStep();
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
        score={sessionScores.score}
        pronunciation={sessionScores.pronunciation}
        fluency={sessionScores.fluency}
        rhythm={sessionScores.rhythm}
        englishText={currentDialogue.dialogue}
        translation={currentDialogue.translation}
        words={currentDialogue.words}
        onPracticeAgain={restartLesson}
        onFinishLesson={handleFinishLesson}
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

      {/* موتور صدا — کاملاً imperative، هیچ UI ای رندر نمی‌کند. */}
      <AudioPlayer
        uri={audioUri}
        shouldPlay={playing}
        playbackRate={playbackRate}
        actionCommand={actionCommand}
        actionNonce={audioNonce}
        loadedRecordingPath={playingRecordingUrl}
        onRecordingStatusUpdate={handleRecordingStatus}
        onRecordedPlaybackEnd={handleRecordedPlaybackEnd}
        onProgress={(positionSeconds, source) => {
          if (source === 'original') setMasterPositionSeconds(positionSeconds);
          else setRecordingPositionSeconds(positionSeconds);
        }}
        onPlaybackStatusUpdate={(status) => {
          // صدای این خط تمام شد؛ حباب دیالوگ بالای سرش بسته شود — چه قرار
          // باشد خودکار برویم خط بعد چه نه.
          if (status === 'finished') {
            dispatch({ type: 'AUDIO_FINISHED' });
          }
          // در مرحله‌های دست‌کاربر (ضبط/مقایسه) بعد از پایان صدای اصلی خودکار
          // نمی‌پریم؛ کاربر باید فرصت ضبط و گوش‌دادن داشته باشد.
          const autoAdvance = !isShadowingMode || isAutoStep;
          if (status === 'finished' && autoMode && autoAdvance) {
            if (autoTimeoutRef.current) clearTimeout(autoTimeoutRef.current);
            autoTimeoutRef.current = setTimeout(() => {
              handleNextDialogue();
            }, 2200);
          }
          // این جمله فایل صدا ندارد: به کاربر می‌گوییم چرا ساکت است و در
          // مرحله‌های خودکار می‌رویم جمله‌ی بعد، وگرنه روی یک جمله‌ی بی‌صدا
          // گیر می‌کردیم و به‌نظر می‌رسید کل پخش خراب شده.
          if (status === 'no_audio') {
            dispatch({ type: 'AUDIO_MISSING' });
            if (autoMode && autoAdvance) {
              if (autoTimeoutRef.current) clearTimeout(autoTimeoutRef.current);
              autoTimeoutRef.current = setTimeout(() => {
                handleNextDialogue();
              }, 1200);
            }
          }
        }}
      />

      <ScrollView
        style={styles.scrollView}
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
          // با تعویض مرحله‌ی تمرین و همچنین شروع هر دور تکرار، دوربین دوباره
          // روی هات‌اسپات زوم می‌کند.
          refocusKey={isShadowingMode ? `${activeStepIndex}-${repeatCount}` : undefined}
          isShadowingMode={isShadowingMode}
          streakCount={streakCount}
          onForward={handleHeaderForwardPress}
          bubbleSpeaker={currentDialogue.speaker}
          bubbleText={!isShadowingMode ? currentDialogue.dialogue : undefined}
          bubbleContent={
            isShadowingMode && textDisplayMode === 'bubble' ? (
              <DialogueSentenceContent
                compact
                activeStepIndex={activeStepIndex}
                currentDialogue={currentDialogue}
                textRevealed={textRevealed}
                masterPositionSeconds={masterPositionSeconds}
              />
            ) : undefined
          }
          bubbleVisible={bubbleVisible}
        />

        {/* Bottom Sheet Dialogue Card */}
        <View
          style={[
            styles.playerSheet,
            // در حالت اکسپلور (قبل از ورود به تمرین) نوار ثابت پایین وجود ندارد،
            // پس خودِ کارت باید فاصله‌ی امن پایین صفحه (دکمه‌ی خانه/نوار حرکتی) را
            // رعایت کند وگرنه دکمه‌ی «شروع تمرین» زیرش پنهان می‌شود.
            !isShadowingMode && { paddingBottom: Math.max(insets.bottom, 16) + 16 },
          ]}
        >
          <View style={styles.dragHandle} />

          {!isShadowingMode ? (
            <SceneExploreMode
              currentDialogue={currentDialogue}
              sceneHotspots={sceneHotspots}
              activeHotspotIndex={activeHotspotIndex}
              onGoToHotspot={goToHotspot}
              onStartShadowing={() => dispatch({ type: 'START_SHADOWING', items: dialogueItems })}
              t={t}
            />
          ) : (
            <ShadowingPracticePanel
              language={language}
              t={t}
              activeStepIndex={activeStepIndex}
              onChangeStep={requestStepChange}
              currentDialogue={currentDialogue}
              playing={playing}
              actionCommand={actionCommand}
              onOpenLeitner={() => navigation.navigate('Leitner')}
              onOpenRecordings={() => navigation.navigate('MyRecordings')}
              saveState={saveState}
              savedFileName={savedFileName}
              evaluation={currentEvaluation}
              evalState={currentEvalState}
              evalError={currentEvalError}
              onScoreCurrentLine={scoreCurrentLine}
              // ---- ضبط‌ها ----
              recordedLines={recordedLineNumbers}
              hasRecordingForCurrentLine={!!recordings[activeIndex]}
              onPlayMyRecording={() => playRecordingOfLine(activeIndex)}
              onPlayRecordingOfLine={playRecordingOfLine}
              onPlayOriginal={playOriginalOfLine}
              onPlayAllRecordings={playAllRecordings}
              onStopPlayAll={stopPlayAll}
              isPlayingAll={playAllQueue.length > 0}
              dialogueLines={dialogueLineLabels}
              activeLineIndex={activeIndex}
              onSelectLine={selectLine}
              // ---- مخفی‌کردن متن ----
              textRevealed={textRevealed}
              onToggleRevealText={toggleRevealText}
              recordingUnavailable={!canRecord}
              repeatCount={repeatCount}
              totalRepeats={targetRepeats}
              autoRepeat={isAutoStep}
              completedSteps={completedSteps}
              onNextStep={() => goToNextStep(true)}
              masterPositionSeconds={masterPositionSeconds}
              recordingPositionSeconds={recordingPositionSeconds}
              textDisplayMode={textDisplayMode}
              onChangeTextDisplayMode={setTextDisplayMode}
            />
          )}
        </View>
      </ScrollView>

      {/* نوار ثابت پایین: هیچ‌وقت با اسکرول‌شدنِ لیست جمله‌ها ناپدید نمی‌شود. */}
      {isShadowingMode && (
        <View style={[styles.stickyFooter, { paddingBottom: Math.max(insets.bottom, 10) }]}>
          {activeStepIndex === 2 && (
            <PinnedCurrentLine
              currentDialogue={currentDialogue}
              textRevealed={textRevealed}
            />
          )}
          <PlayerControlsBar
            activeStepIndex={activeStepIndex}
            playing={playing}
            actionCommand={actionCommand}
            onStartRecord={(withReference) =>
              dispatch({ type: 'START_RECORD', withReference })
            }
            onStopRecord={() => dispatch({ type: 'STOP_RECORD' })}
            playbackRate={playbackRate}
            toggleSpeed={toggleSpeed}
            togglePlay={togglePlay}
            onPrevDialogue={handlePrevDialogue}
            onNextDialogue={handleNextDialogue}
            onReplay={handleReplay}
            hasRecordingForCurrentLine={!!recordings[activeIndex]}
            onPlayMyRecording={() => playRecordingOfLine(activeIndex)}
          />
          {lineAudioMissing && <Text style={styles.noAudioHint}>{t('lineHasNoAudio')}</Text>}
          {activeStepIndex === 2 && canRecord && (
            <Text style={styles.recordHint}>
              {actionCommand === 'start_record' ? t('tapToStopRecord') : t('tapToRecord')}
            </Text>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollablePlayerContainer: {
    flexGrow: 1,
    backgroundColor: COLORS.background,
  },
  stickyFooter: {
    backgroundColor: COLORS.surface,
    borderTopWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 20,
    paddingTop: 4,
  },
  noAudioHint: {
    color: COLORS.error,
    fontFamily: FONT_FAMILY.regular,
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 4,
  },
  recordHint: {
    color: COLORS.primary,
    fontFamily: FONT_FAMILY.semiBold,
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 4,
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
});
