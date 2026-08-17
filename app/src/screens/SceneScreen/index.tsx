import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { BackHandler, ScrollView, StatusBar, StyleSheet, View, useWindowDimensions } from 'react-native';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { COLORS } from '../../theme/colors';
import { AudioPlayer } from '../../components/AudioPlayer';
import { SessionResultScreen } from '../../components/SessionResultScreen';
import { expandScenarioToDialogueItems, type Scenario } from '../../data/scenarios';
import { useScenes } from '../../data/ScenesContext';
import { useLanguage } from '../../data/i18n';
import { usePracticeSettings } from '../../data/PracticeSettingsContext';
import { saveRecording } from '../../services/RecordingsService';
import { evaluateRecording, type EvaluationResult } from '../../api/shadowing';
import { SceneLockedError } from '../../api/scenes';
import { getUserStreak } from '../../api/progress';
import { useAuth } from '../../data/AuthContext';

import { SceneIntroScreen } from './SceneIntroScreen';
import { SceneCameraHero } from './SceneCameraHero';
import { SceneExploreMode } from './SceneExploreMode';
import { ShadowingPracticePanel, PlayerControlsBar, PinnedCurrentLine } from './shadowing';
import type { AudioActionCommand } from './types';

// امتیازهای پایان جلسه وقتی کاربر هیچ ضبطی نکرده باشد. اگر ضبطی ارزیابی شده
// باشد، میانگین نمره‌های واقعی جایشان می‌نشیند.
const SESSION_SCORE = 85;
const SESSION_PRONUNCIATION = 80;
const SESSION_FLUENCY = 92;
const SESSION_RHYTHM = 83;

// فقط مرحله‌های ورودی (Listen و Shadow) دور خودکار دارند: چند دور کامل پخش
// می‌شوند و بعد خودکار مرحله‌ی بعد. این اجبار نیست — کاربر هر لحظه می‌تواند با
// تب یا دکمه‌ی «مرحله بعد» جلو برود، و تعداد دور را هم در تنظیمات عوض کند.
// مرحله‌های ضبط و مقایسه همیشه با سرعت خودِ کاربر پیش می‌روند (نه دور خودکار،
// نه پرش خودکار)، چون آنجا کاربر تصمیم می‌گیرد کِی راضی شده — رفتار رایج
// اپ‌های شدوئینگ.
const AUTO_REPEAT_STEPS = [0, 1];

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
  const { language, t } = useLanguage();
  const { repeatsPerStep } = usePracticeSettings();
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
  const [audioUri, setAudioUri] = useState<string | null>(null);
  const [actionCommand, setActionCommand] = useState<AudioActionCommand>('none');
  // شمارنده‌ای که فقط برای «دوباره فرستادن همان دستور» به AudioPlayer بالا
  // می‌رود؛ لازم است چون شروع دوباره‌ی دور، همان دیالوگ اول را دوباره می‌خواهد.
  const [audioNonce, setAudioNonce] = useState(0);
  // چندمین دور پخش دیالوگ‌ها در مرحله‌ی فعلی هستیم (۱ تا targetRepeats).
  const [repeatCount, setRepeatCount] = useState(1);
  // وضعیت ذخیره‌ی صدای ضبط‌شده روی گوشی + نام فایلی که ساخته شد.
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [savedFileName, setSavedFileName] = useState<string | null>(null);
  // نتیجه‌ی نمره‌دهی تلفظ برای هر جمله، کلید = اندیس جمله در dialogueItems.
  // به‌ازای جمله نگه می‌داریم (نه یک مقدار واحد) تا با جابه‌جا شدن بین جمله‌ها
  // بازخورد جمله‌ی قبلی روی جمله‌ی جدید نماند.
  const [evaluations, setEvaluations] = useState<Record<number, EvaluationResult>>({});
  const [evalState, setEvalState] = useState<'idle' | 'scoring' | 'done' | 'error'>('idle');
  const [evalError, setEvalError] = useState<string | null>(null);
  // کدام جمله وضعیت نمره‌دهی بالا مال اوست. بدون این، اگر کاربر وسط
  // نمره‌دهی جمله را عوض کند، حالتِ «در حال بررسی» یا خطا روی جمله‌ی اشتباه
  // نشان داده می‌شود.
  const [evalLineIndex, setEvalLineIndex] = useState<number | null>(null);
  // زمان شروع ضبط، برای اینکه مدت واقعی ضبط را به سرور بدهیم؛ نمره‌ی روانی
  // بدون آن قابل محاسبه نیست.
  const recordStartedAtRef = useRef<number>(0);

  // ضبط کاربر برای هر جمله (کلید = اندیس جمله). در حافظه نگه داشته می‌شود تا
  // بشود هر جمله را جدا یا همه را پشت‌سرهم پخش کرد؛ نسخه‌ی ماندگارش هم روی
  // گوشی ذخیره می‌شود.
  const [recordings, setRecordings] = useState<Record<number, LineRecording>>({});
  // ضبطی که همین حالا باید پخش شود؛ به AudioPlayer داده می‌شود.
  const [playingRecordingUrl, setPlayingRecordingUrl] = useState<string | null>(null);
  // صفِ پخشِ پشت‌سرهم؛ خالی یعنی پخش دنباله‌ای در جریان نیست.
  const [playAllQueue, setPlayAllQueue] = useState<number[]>([]);
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
  const isAutoStep = AUTO_REPEAT_STEPS.includes(activeStepIndex);
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

  // وضعیت نمره‌دهی فقط وقتی به این جمله مربوط است که برای خودش شروع شده
  // باشد؛ در غیر این صورت انگار هیچ نمره‌دهی‌ای در جریان نیست.
  const currentEvalState = evalLineIndex === activeIndex ? evalState : 'idle';

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
      const target = dialogueItems[idx];
      if (!target) return;
      setSceneFinished(false);
      // نوار «ذخیره شد» مال جمله‌ی قبلی است؛ با عوض‌شدن جمله باید برود.
      setSaveState('idle');
      setSavedFileName(null);
      setActiveIndex(idx);
      setAudioUri(target.audioUrl || null);
      setActionCommand('play_original');
      setPlaying(true);
      // حتی اگر همان دیالوگ قبلی باشد، این عدد باعث می‌شود دستور پخش دوباره
      // به پلیر برسد و صدا از اول شروع شود.
      setAudioNonce((n) => n + 1);
    },
    [dialogueItems]
  );

  const handleEnterScene = () => {
    setInScene(true);
    setRepeatCount(1);
    playDialogueAt(0);
  };

  // رفتن به مرحله‌ی بعدی تمرین؛ روی مرحله‌ی آخر، جلسه تمام‌شده تلقی می‌شود.
  // `markDone` فقط وقتی true است که مرحله واقعاً تمام شده باشد (دورها کامل شده
  // یا خود کاربر دکمه‌ی «مرحله بعد» را زده)، نه وقتی صرفاً روی تب دیگری پریده.
  const goToNextStep = useCallback(
    (markDone = true) => {
      if (markDone) {
        setCompletedSteps((prev) =>
          prev.includes(activeStepIndex) ? prev : [...prev, activeStepIndex]
        );
      }
      if (activeStepIndex < 3) {
        setActiveStepIndex(activeStepIndex + 1);
      } else {
        setShowResult(true);
      }
    },
    [activeStepIndex]
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
      setSceneFinished(true);
      return;
    }

    // مرحله‌های دست‌کاربر (ضبط/مقایسه): نه دور خودکار، نه پرش خودکار — همین‌جا
    // می‌ایستیم تا خودش تصمیم بگیرد.
    if (!isAutoStep) {
      setSceneFinished(true);
      return;
    }

    // داخل حالت تمرین: تا targetRepeats بار دوباره از اولین هات‌اسپات شروع
    // می‌کنیم و بعد از آن خودکار به مرحله‌ی بعد می‌رویم. targetRepeats صفر یعنی
    // کاربر «بی‌نهایت» را انتخاب کرده و پرش خودکاری در کار نیست.
    if (targetRepeats === 0 || repeatCount < targetRepeats) {
      setRepeatCount(repeatCount + 1);
      playDialogueAt(0);
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
      setEvalState('idle');
      setEvalError(null);

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

  /** پخش ضبط یک جمله‌ی مشخص (یا جمله‌ی جاری). */
  const playRecordingOfLine = useCallback(
    (lineIndex: number) => {
      const rec = recordings[lineIndex];
      if (!rec) return;
      setPlaying(false);
      setPlayingRecordingUrl(rec.filePath);
      setActionCommand('play_recording');
      setAudioNonce((n) => n + 1);
    },
    [recordings]
  );

  /** پخش صدای مرجع همین جمله (بدون تغییر مرحله). */
  const playOriginalOfLine = useCallback(() => {
    setPlayingRecordingUrl(null);
    setActionCommand('play_original');
    setAudioNonce((n) => n + 1);
  }, []);

  /** پخش پشت‌سرهمِ همه‌ی ضبط‌های این صحنه، به ترتیب جمله‌ها. */
  const playAllRecordings = useCallback(() => {
    const recorded = dialogueItems
      .map((_, idx) => idx)
      .filter((idx) => recordings[idx]);
    if (recorded.length === 0) return;

    setPlaying(false);
    // اولی را همین حالا پخش می‌کنیم و بقیه در صف می‌مانند تا با پایان هرکدام
    // نوبت بعدی برسد.
    setPlayAllQueue(recorded.slice(1));
    playRecordingOfLine(recorded[0]);
  }, [dialogueItems, recordings, playRecordingOfLine]);

  const stopPlayAll = useCallback(() => {
    setPlayAllQueue([]);
    // دستور 'none' با playing=false در AudioPlayer به pause ترجمه می‌شود.
    setPlaying(false);
    setActionCommand('none');
    setAudioNonce((n) => n + 1);
  }, []);

  /**
   * فرستادن ضبط جمله‌ی جاری به بک‌اند برای نمره‌دهی تلفظ. از مرحله‌ی مقایسه
   * دستی صدا زده می‌شود.
   */
  const scoreCurrentLine = useCallback(() => {
    const rec = recordings[activeIndex];
    if (!rec || evalState === 'scoring') return;

    // اندیس را همین‌جا می‌بندیم: تا وقتی پاسخ سرور برسد ممکن است کاربر جمله
    // را عوض کرده باشد، و نتیجه باید به جمله‌ی درست بچسبد.
    const lineIndex = activeIndex;
    const dialogue = dialogueItems[lineIndex];

    setEvalState('scoring');
    setEvalLineIndex(lineIndex);
    setEvalError(null);
    evaluateRecording({
      filePath: rec.filePath,
      mimeType: rec.mimeType,
      dialogueId: dialogue?.id,
      targetText: dialogue?.dialogue,
      duration: rec.duration,
      expectedDuration: DEFAULT_LINE_SECONDS,
    })
      .then((result) => {
        setEvaluations((prev) => ({ ...prev, [lineIndex]: result }));
        setEvalState('done');
      })
      .catch((err) => {
        console.warn('[SceneScreen] pronunciation scoring failed:', err);
        setEvalError(err?.message || null);
        setEvalState('error');
      });
  }, [recordings, activeIndex, dialogueItems, evalState]);

  /**
   * انتخاب یک جمله از لیست ضبط‌ها. عمداً پخش را شروع نمی‌کند: کاربر آمده که
   * دوباره ضبط کند، نه اینکه صدای مرجع پخش شود.
   */
  const selectLine = useCallback(
    (lineIndex: number) => {
      if (lineIndex < 0 || lineIndex >= dialogueItems.length) return;
      setPlaying(false);
      setPlayAllQueue([]);
      setActiveIndex(lineIndex);
    },
    [dialogueItems.length]
  );

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
    setRecordings({});
    setEvaluations({});
    setTextRevealed(false);
    setPlayAllQueue([]);
    setPlayingRecordingUrl(null);
    setEvalState('idle');
    setEvalLineIndex(null);
    setEvalError(null);
    setSaveState('idle');
    setSavedFileName(null);
  }, [scenarioId]);

  /** با پایان هر ضبط، اگر صفی هست نوبت بعدی را پخش می‌کند. */
  const handleRecordedPlaybackEnd = useCallback(() => {
    setPlayAllQueue((queue) => {
      if (queue.length === 0) return queue;
      const [next, ...rest] = queue;
      // خودِ پخش نمی‌تواند داخل setState انجام شود؛ به تیک بعدی موکولش می‌کنیم.
      setTimeout(() => playRecordingOfLine(next), 350);
      return rest;
    });
  }, [playRecordingOfLine]);

  // با ورود به تمرین و با هر تعویض مرحله (چه دستی با تب/فلش، چه خودکار بعد از
  // پایان دورها)، همه‌چیز از اول شروع می‌شود: دیالوگ اول، هات‌اسپات اول،
  // دوربین دوباره روی همان زوم می‌کند و شمارنده‌ی دور صفر می‌شود.
  useEffect(() => {
    if (!isShadowingMode) return;
    setRepeatCount(1);
    playDialogueAt(0);
  }, [isShadowingMode, activeStepIndex, playDialogueAt]);

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
        onPlaybackStatusUpdate={(status) => {
          // در مرحله‌های دست‌کاربر (ضبط/مقایسه) بعد از پایان صدای اصلی خودکار
          // نمی‌پریم؛ کاربر باید فرصت ضبط و گوش‌دادن داشته باشد.
          const autoAdvance = !isShadowingMode || isAutoStep;
          if (status === 'finished' && autoMode && autoAdvance) {
            if (autoTimeoutRef.current) clearTimeout(autoTimeoutRef.current);
            autoTimeoutRef.current = setTimeout(() => {
              handleNextDialogue();
            }, 2200);
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
              onOpenLeitner={() => navigation.navigate('Leitner')}
              onOpenRecordings={() => navigation.navigate('MyRecordings')}
              saveState={saveState}
              savedFileName={savedFileName}
              evaluation={currentEvaluation}
              evalState={currentEvalState}
              evalError={evalError}
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
            setActionCommand={setActionCommand}
            setPlaying={setPlaying}
            playbackRate={playbackRate}
            toggleSpeed={toggleSpeed}
            togglePlay={togglePlay}
            onPrevDialogue={handlePrevDialogue}
            onNextDialogue={handleNextDialogue}
            onReplay={handleReplay}
            hasRecordingForCurrentLine={!!recordings[activeIndex]}
            onPlayMyRecording={() => playRecordingOfLine(activeIndex)}
          />
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
