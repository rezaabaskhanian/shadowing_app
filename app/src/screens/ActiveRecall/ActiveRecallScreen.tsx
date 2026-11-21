import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ArrowLeft,
  ArrowRight,
  Award,
  BookOpen,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Compass,
  Eye,
  Flame,
  HelpCircle,
  MessageSquare,
  Play,
  RotateCcw,
  Sparkles,
  Volume2,
  X,
  Zap,
} from 'lucide-react-native';

import { COLORS } from '../../theme/colors';
import { FONT_FAMILY } from '../../theme/typography';
import { useLanguage } from '../../data/i18n';
import { useScenes } from '../../data/ScenesContext';
import { AudioPlayer } from '../../components/AudioPlayer';
import { expandScenarioToDialogueItems, type DialogueItem, type Scenario } from '../../data/scenarios';

const COUNTDOWN_SECONDS = 5;
const INTRO_STORAGE_KEY = '@active_learning_intro_seen_v1';

/**
 * تولید هوشمند سوالات هدفمند به زبان انگلیسی پیرامون موضوع سناریو
 */
function getEnglishQuestionPrompt(
  item: DialogueItem | undefined,
  index: number,
  topicTitle?: string,
): { enQuestion: string; contextFa: string } {
  if (!item) return { enQuestion: '', contextFa: '' };
  const text = item.dialogue?.trim() || '';
  const isQuestion = text.endsWith('?');
  const cleanTopic = topicTitle || 'the conversation';

  let enQuestion = '';
  if (isQuestion) {
    if (/^how/i.test(text)) {
      enQuestion = `Regarding "${cleanTopic}", how do you ask about the method or status in English?`;
    } else if (/^where/i.test(text)) {
      enQuestion = `In this situation, what English question do you ask to find the location?`;
    } else if (/^what/i.test(text)) {
      enQuestion = `What question would you ask in English to find out more details?`;
    } else if (/^(can|could|would|may)/i.test(text)) {
      enQuestion = `How would you make this polite request to the other person in English?`;
    } else if (/^(do|does|did|is|are|was|were)/i.test(text)) {
      enQuestion = `How do you ask in English to confirm this information?`;
    } else {
      enQuestion = `What question would you ask in English in this situation?`;
    }
  } else {
    if (index === 0) {
      enQuestion = `To start the conversation about "${cleanTopic}", how do you say in English:`;
    } else if (index === 1) {
      enQuestion = `In response to the speaker, what natural English sentence do you say?`;
    } else if (index === 2) {
      enQuestion = `Continuing the conversation on "${cleanTopic}", how do you explain:`;
    } else if (index === 3) {
      enQuestion = `How do you express this specific point fluently in English?`;
    } else {
      enQuestion = `To conclude this conversation naturally, what do you say in English:`;
    }
  }

  return {
    enQuestion,
    contextFa: item.translation || '',
  };
}

export const ActiveRecallScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const insets = useSafeAreaInsets();
  const { t, language } = useLanguage();
  const rtl = language === 'fa';
  const row = rtl && styles.rowReverse;
  const tr = rtl ? styles.textRight : styles.textLeft;

  const { scenarioId } = route.params || {};
  const { scenes, getScene } = useScenes();

  // وضعیت‌های صفحه: 'select_scene' | 'thinking' (شمارش معکوس ۵ ثانیه) | 'reveal' (پخش صدا و متن انگلیسی) | 'completed'
  const [phase, setPhase] = useState<'select_scene' | 'thinking' | 'reveal' | 'completed'>('select_scene');
  const [selectedScenario, setSelectedScenario] = useState<Scenario | null>(null);
  const [dialogueList, setDialogueList] = useState<DialogueItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(COUNTDOWN_SECONDS);
  const [knownCount, setKnownCount] = useState(0);
  const [retryQueue, setRetryQueue] = useState<DialogueItem[]>([]);
  const [loadingScene, setLoadingScene] = useState(false);
  const [showGuideModal, setShowGuideModal] = useState(false);

  // بررسی اولین بار ورود کاربر جهت نمایش خودکار مودال راهنما
  useEffect(() => {
    AsyncStorage.getItem(INTRO_STORAGE_KEY)
      .then((seen) => {
        if (!seen) {
          setShowGuideModal(true);
        }
      })
      .catch(() => {});
  }, []);

  const handleDismissGuide = useCallback(async () => {
    setShowGuideModal(false);
    await AsyncStorage.setItem(INTRO_STORAGE_KEY, 'true').catch(() => {});
  }, []);

  // کنترل صوتی
  const [audioUri, setAudioUri] = useState<string | null>(null);
  const [actionCommand, setActionCommand] = useState<'none' | 'play_original'>('none');
  const [actionNonce, setActionNonce] = useState(0);

  // انیمیشن تایمر دایره‌ای یا نواری
  const timerAnim = useRef(new Animated.Value(1)).current;

  // ۱. شروع با یک صحنه مشخص (طرح ۴ تا ۵ سوال هدفمند در مورد موضوع بحث)
  const startWithScenario = useCallback(async (sc: Scenario) => {
    setLoadingScene(true);
    try {
      let full = sc;
      if (!sc.hotspots || sc.hotspots.length === 0) {
        const fetched = await getScene(sc.id);
        if (fetched) full = fetched;
      }
      const items = expandScenarioToDialogueItems(full).filter(
        (d) => d.dialogue && d.translation && d.audioUrl
      );
      if (items.length > 0) {
        // انتخاب ۴ تا ۵ سوال پیرامون موضوع صحنه
        let questions = items;
        if (items.length > 5) {
          questions = items.slice(0, 5);
        } else if (items.length < 4) {
          const sameLevel = scenes.filter((s) => s.id !== full.id && s.level === full.level);
          for (const s of sameLevel) {
            if (questions.length >= 5) break;
            const sItems = expandScenarioToDialogueItems(s).filter(
              (d) => d.dialogue && d.translation && d.audioUrl
            );
            for (const item of sItems) {
              if (questions.length >= 5) break;
              questions.push(item);
            }
          }
        }

        setSelectedScenario(full);
        setDialogueList(questions);
        setCurrentIndex(0);
        setKnownCount(0);
        setRetryQueue([]);
        setSecondsLeft(COUNTDOWN_SECONDS);
        setPhase('thinking');
      }
    } finally {
      setLoadingScene(false);
    }
  }, [scenes, getScene]);

  // ۲. شروع با چالش میکس روزانه از کل صحنه‌های سطح کاربر (۵ سوال کاربردی)
  const startQuickMix = useCallback(async () => {
    setLoadingScene(true);
    try {
      const candidates: DialogueItem[] = [];
      const shuffledScenes = [...scenes].sort(() => 0.5 - Math.random()).slice(0, 4);

      for (const sc of shuffledScenes) {
        let full = sc;
        if (!sc.hotspots || sc.hotspots.length === 0) {
          const fetched = await getScene(sc.id);
          if (fetched) full = fetched;
        }
        const items = expandScenarioToDialogueItems(full).filter(
          (d) => d.dialogue && d.translation && d.audioUrl
        );
        candidates.push(...items);
      }

      // دقیقا ۵ سوال هدفمند در چالش سریع
      const mixed = candidates.sort(() => 0.5 - Math.random()).slice(0, 5);
      if (mixed.length > 0) {
        setSelectedScenario(null);
        setDialogueList(mixed);
        setCurrentIndex(0);
        setKnownCount(0);
        setRetryQueue([]);
        setSecondsLeft(COUNTDOWN_SECONDS);
        setPhase('thinking');
      }
    } finally {
      setLoadingScene(false);
    }
  }, [scenes, getScene]);

  // اگر صفحه با scenarioId باز شده بود، مستقیم همان صحنه را باز کن
  useEffect(() => {
    if (scenarioId && scenes.length > 0) {
      const target = scenes.find((s) => s.id === scenarioId);
      if (target) {
        startWithScenario(target);
      }
    }
  }, [scenarioId, scenes, startWithScenario]);

  // تایمر ۵ ثانیه‌ای تفکر (Thinking Window)
  // طبق درخواست: بعد از ۵ ثانیه پاسخ خودکار نشان داده نمی‌شود، بلکه دکمه «نمایش جواب» باقی می‌ماند تا کاربر خودش پاسخ را باز کند
  useEffect(() => {
    if (phase !== 'thinking') return;

    timerAnim.setValue(1);
    Animated.timing(timerAnim, {
      toValue: 0,
      duration: COUNTDOWN_SECONDS * 1000,
      useNativeDriver: false,
    }).start();

    const interval = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          // زمان ۵ ثانیه تمام شد؛ جواب خودکار نشان داده نمی‌شود تا کاربر دکمه را بزند
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [phase, currentIndex]);

  // افشای پاسخ و پخش صدای نیتیو
  const revealAnswer = useCallback(() => {
    setPhase('reveal');
    const currentItem = dialogueList[currentIndex];
    if (currentItem?.audioUrl) {
      setAudioUri(currentItem.audioUrl);
      setActionCommand('play_original');
      setActionNonce((n) => n + 1);
    }
  }, [dialogueList, currentIndex]);

  // پخش مجدد صدای دیالوگ
  const replayAudio = () => {
    const currentItem = dialogueList[currentIndex];
    if (currentItem?.audioUrl) {
      setAudioUri(currentItem.audioUrl);
      setActionCommand('play_original');
      setActionNonce((n) => n + 1);
    }
  };

  // خروج از تمرین جاری و بازگشت به لیست صحنه‌ها
  const handleExitPractice = useCallback(() => {
    if (scenarioId) {
      navigation.goBack();
    } else {
      setPhase('select_scene');
      setSelectedScenario(null);
      setDialogueList([]);
      setCurrentIndex(0);
      setKnownCount(0);
      setRetryQueue([]);
      setSecondsLeft(COUNTDOWN_SECONDS);
      setActionCommand('none');
    }
  }, [scenarioId, navigation]);

  // وقتی کاربر به صفحه برمی‌گردد، اگر سناریوی خاصی پاس داده نشده بود همیشه لیست آماده نمایش باشد
  useFocusEffect(
    useCallback(() => {
      if (!scenarioId) {
        setPhase('select_scene');
        setSelectedScenario(null);
        setDialogueList([]);
        setCurrentIndex(0);
        setKnownCount(0);
        setRetryQueue([]);
        setSecondsLeft(COUNTDOWN_SECONDS);
      }
    }, [scenarioId]),
  );

  // ثبت خودارزیابی و رفتن به سوال بعدی
  const handleAnswerReview = (isKnown: boolean) => {
    const currentItem = dialogueList[currentIndex];
    if (isKnown) {
      setKnownCount((k) => k + 1);
    } else if (currentItem) {
      setRetryQueue((q) => [...q, currentItem]);
    }

    if (currentIndex < dialogueList.length - 1) {
      setCurrentIndex((i) => i + 1);
      setSecondsLeft(COUNTDOWN_SECONDS);
      setPhase('thinking');
    } else if (retryQueue.length > 0) {
      // مرور دیالوگ‌هایی که بلد نبود
      setDialogueList(retryQueue);
      setRetryQueue([]);
      setCurrentIndex(0);
      setSecondsLeft(COUNTDOWN_SECONDS);
      setPhase('thinking');
    } else {
      setPhase('completed');
    }
  };

  const currentDialogue = dialogueList[currentIndex];
  const progressPercent = dialogueList.length > 0 ? ((currentIndex + 1) / dialogueList.length) * 100 : 0;
  const questionData = getEnglishQuestionPrompt(currentDialogue, currentIndex, selectedScenario?.title);

  // مودال جامع راهنما و متدولوژی یادگیری فعال (Active Recall)
  const renderGuideModal = () => (
    <Modal
      visible={showGuideModal}
      transparent
      animationType="fade"
      onRequestClose={handleDismissGuide}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalCard}>
          {/* هدر مودال */}
          <View style={[styles.modalHeader, row]}>
            <View style={styles.modalIconWrap}>
              <Zap size={22} color="#D97706" />
            </View>
            <View style={[styles.flex1, rtl ? styles.alignEnd : styles.alignStart]}>
              <Text style={[styles.modalTitle, tr]}>
                {rtl ? 'متد اکتیو لرنینگ (Active Recall) 🧠' : 'Active Recall Guide 🧠'}
              </Text>
              <Text style={[styles.modalSub, tr]}>
                {rtl ? 'تکنیک علمی پیمزلر برای مکالمه ناخودآگاه' : 'Spontaneous speech methodology'}
              </Text>
            </View>
            <TouchableOpacity style={styles.modalCloseBtn} onPress={handleDismissGuide}>
              <X size={18} color="#64748B" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
            {/* کارت ۱: سوالات انگلیسی پیرامون موضوع */}
            <View style={[styles.guideStepCard, row]}>
              <View style={styles.stepNumBadge}>
                <Text style={styles.stepNumText}>۱</Text>
              </View>
              <View style={[styles.flex1, rtl ? styles.alignEnd : styles.alignStart]}>
                <Text style={[styles.guideStepTitle, tr]}>
                  {rtl ? 'طرح سوال به زبان انگلیسی پیرامون موضوع:' : 'Questions Asked in English:'}
                </Text>
                <Text style={[styles.guideStepDesc, tr]}>
                  {rtl
                    ? 'در هر مرحله یک سوال به زبان انگلیسی بر اساس موضوع سناریو پرسیده می‌شود تا ذهن شما فوراً در حالت زبان انگلیسی قرار گیرد.'
                    : 'In each step, targeted questions are presented in English based on the topic so your brain actively thinks in English.'}
                </Text>
              </View>
            </View>

            {/* کارت ۲: ۵ ثانیه فرصت پاسخ به انگلیسی */}
            <View style={[styles.guideStepCard, row]}>
              <View style={styles.stepNumBadge}>
                <Text style={styles.stepNumText}>۲</Text>
              </View>
              <View style={[styles.flex1, rtl ? styles.alignEnd : styles.alignStart]}>
                <Text style={[styles.guideStepTitle, tr]}>
                  {rtl ? '۵ ثانیه فرصت تفکر و گفتن به انگلیسی:' : '5 Seconds to Answer in English:'}
                </Text>
                <Text style={[styles.guideStepDesc, tr]}>
                  {rtl
                    ? 'طبق متد پیمزلر، قبل از شنیدن پاسخ نیتیو ۵ ثانیه فرصت دارید تا جواب را با صدای بلند به انگلیسی بگویید یا در ذهن بسازید.'
                    : 'You have 5 seconds of thinking time to formulate and say the English answer out loud before seeing the response.'}
                </Text>
              </View>
            </View>

            {/* کارت ۳: تطبیق با صدای نیتیو */}
            <View style={[styles.guideStepCard, row]}>
              <View style={styles.stepNumBadge}>
                <Text style={styles.stepNumText}>۳</Text>
              </View>
              <View style={[styles.flex1, rtl ? styles.alignEnd : styles.alignStart]}>
                <Text style={[styles.guideStepTitle, tr]}>
                  {rtl ? 'افشای پاسخ نیتیو و تطبیق گفتار:' : 'Native Reveal & Evaluation:'}
                </Text>
                <Text style={[styles.guideStepDesc, tr]}>
                  {rtl
                    ? 'دکمه «نمایش جواب» را بزنید؛ پاسخ دقیق انگلیسی به همراه تلفظ نیتیو پخش می‌شود تا درستی پاسخ خود را ارزیابی کنید.'
                    : 'Tap reveal to see the native sentence and hear the exact pronunciation to check your accuracy.'}
                </Text>
              </View>
            </View>

            {/* کارت ۴: مرور هوشمند اشتباهات */}
            <View style={[styles.guideStepCard, row]}>
              <View style={styles.stepNumBadge}>
                <Text style={styles.stepNumText}>۴</Text>
              </View>
              <View style={[styles.flex1, rtl ? styles.alignEnd : styles.alignStart]}>
                <Text style={[styles.guideStepTitle, tr]}>
                  {rtl ? 'تکرار هوشمند تا تسلط کامل:' : 'Smart Repetition:'}
                </Text>
                <Text style={[styles.guideStepDesc, tr]}>
                  {rtl
                    ? 'جملاتی که بلد نبودید در پایان چالش دوباره تکرار می‌شوند تا مطمئن شوید ملکه ذهنتان شده‌اند.'
                    : 'Any sentence you need to review will be repeated at the end until fully mastered.'}
                </Text>
              </View>
            </View>
          </ScrollView>

          {/* دکمه شروع */}
          <TouchableOpacity style={styles.modalCtaBtn} onPress={handleDismissGuide} activeOpacity={0.85}>
            <Text style={styles.modalCtaText}>
              {rtl ? 'متوجه شدم، شروع تمرین 🚀' : 'Got it, Let\'s Start! 🚀'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  // -------------------------------------------------------------
  // نمای انتخاب صحنه یا چالش سریع (اگر بدون سناریو باز شده باشد)
  // -------------------------------------------------------------
  if (phase === 'select_scene') {
    return (
      <View style={[styles.screen, { paddingTop: insets.top + 10 }]}>
        <View style={[styles.headerRow, row]}>
          <TouchableOpacity style={styles.iconBtn} onPress={() => navigation.goBack()} activeOpacity={0.8}>
            {rtl ? <ChevronRight size={22} color={COLORS.text} /> : <ChevronLeft size={22} color={COLORS.text} />}
          </TouchableOpacity>
          <View style={styles.flex1}>
            <Text style={[styles.headerTitle, tr]}>{t('activeRecallTitle') || 'اکتیو لرنینگ (Active Recall)'}</Text>
            <Text style={[styles.headerSub, tr]}>{t('activeRecallSubtitle') || 'روش پیمزلر: بگو قبل از شنیدن پاسخ نیتیو'}</Text>
          </View>
          <TouchableOpacity style={styles.guideBtn} onPress={() => setShowGuideModal(true)} activeOpacity={0.8}>
            <HelpCircle size={22} color="#D97706" />
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* بنر چالش سریع */}
          <TouchableOpacity style={styles.quickMixCard} onPress={startQuickMix} activeOpacity={0.85} disabled={loadingScene}>
            <View style={styles.quickMixBadge}>
              <Zap size={24} color="#FFF" />
            </View>
            <View style={styles.quickMixTextWrap}>
              <Text style={[styles.quickMixTitle, tr]}>
                {t('activeRecallStartMix') || '🔥 شروع چالش سریع روزانه'}
              </Text>
              <Text style={[styles.quickMixDesc, tr]}>
                میکس ۵ جمله تصادفی از سطحت؛ ۵ ثانیه فرصت پاسخ، بعد پخش نیتیو!
              </Text>
            </View>
            <ChevronLeft size={20} color="#D97706" style={rtl ? undefined : { transform: [{ rotate: '180deg' }] }} />
          </TouchableOpacity>

          <Text style={[styles.sectionTitle, tr]}>
            {t('activeRecallPickScene') || 'یا یک صحنه را برای تمرین انتخاب کن:'}
          </Text>

          {loadingScene ? (
            <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 40 }} />
          ) : (
            scenes.map((sc) => (
              <TouchableOpacity
                key={sc.id}
                style={[styles.sceneCard, row]}
                onPress={() => startWithScenario(sc)}
                activeOpacity={0.8}
              >
                {sc.imageUri ? (
                  <Image
                    source={typeof sc.imageUri === 'string' ? { uri: sc.imageUri } : sc.imageUri}
                    style={styles.sceneImg}
                  />
                ) : (
                  <View style={[styles.sceneImg, styles.scenePlaceholder]}>
                    <Sparkles size={20} color={COLORS.primary} />
                  </View>
                )}
                <View style={[styles.sceneInfo, rtl ? styles.alignEnd : styles.alignStart]}>
                  <Text style={[styles.sceneTitle, tr]} numberOfLines={1}>
                    {sc.title}
                  </Text>
                  <Text style={[styles.sceneMeta, tr]}>
                    {sc.level} • {sc.sentencesCount || 6} جمله کاربردی
                  </Text>
                </View>
                <ChevronLeft size={18} color={COLORS.muted} style={rtl ? undefined : { transform: [{ rotate: '180deg' }] }} />
              </TouchableOpacity>
            ))
          )}
        </ScrollView>
        {renderGuideModal()}
      </View>
    );
  }

  // -------------------------------------------------------------
  // نمای نتیجه نهایی پایان چالش
  // -------------------------------------------------------------
  if (phase === 'completed') {
    return (
      <View style={[styles.screen, styles.centerWrap, { paddingTop: insets.top, paddingBottom: insets.bottom + 20 }]}>
        <View style={styles.resultBadge}>
          <Award size={48} color="#D97706" />
        </View>
        <Text style={styles.resultTitle}>{t('activeRecallDoneTitle') || 'آفرین! چالش کامل شد 🏆'}</Text>
        <Text style={styles.resultDesc}>
          {t('activeRecallDoneSub') || 'جملات به حافظه فعال شما منتقل شدند. تمرین پیمزلر تسلط زبانی‌ات را سریع‌تر می‌کند.'}
        </Text>

        <View style={styles.scoreCard}>
          <Text style={styles.scoreText}>
            {knownCount} از {dialogueList.length} جمله کاملاً مسلط ✅
          </Text>
        </View>

        <TouchableOpacity
          style={styles.actionBtnPrimary}
          onPress={() => {
            if (selectedScenario) {
              startWithScenario(selectedScenario);
            } else {
              startQuickMix();
            }
          }}
          activeOpacity={0.85}
        >
          <RotateCcw size={18} color="#FFF" />
          <Text style={styles.actionBtnText}>{t('activeRecallRestart') || 'تمرین دوباره'}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionBtnSecondary} onPress={handleExitPractice} activeOpacity={0.8}>
          <Text style={styles.actionBtnSecondaryText}>
            {selectedScenario ? (rtl ? 'بازگشت به لیست صحنه‌ها' : 'Back to Scenes List') : (t('activeRecallBackHome') || 'بازگشت به لیست')}
          </Text>
        </TouchableOpacity>
        {renderGuideModal()}
      </View>
    );
  }

  // -------------------------------------------------------------
  // نمای چالش تعاملی ۵ ثانیه‌ای (Thinking & Reveal)
  // -------------------------------------------------------------
  return (
    <View style={[styles.screen, { paddingTop: insets.top + 8, paddingBottom: insets.bottom + 16 }]}>
      <AudioPlayer
        uri={audioUri}
        shouldPlay={false}
        actionCommand={actionCommand}
        actionNonce={actionNonce}
      />

      {/* هدر بالا: بستن + نوار پیشرفت + دکمه راهنما */}
      <View style={[styles.topBar, row]}>
        <TouchableOpacity style={styles.iconBtn} onPress={handleExitPractice} activeOpacity={0.8}>
          <X size={20} color={COLORS.text} />
        </TouchableOpacity>
        <View style={styles.progressTrack}>
          <View style={[styles.progressBar, { width: `${progressPercent}%` }]} />
        </View>
        <Text style={styles.stepCounter}>
          {currentIndex + 1}/{dialogueList.length}
        </Text>
        <TouchableOpacity style={styles.guideSmallBtn} onPress={() => setShowGuideModal(true)} activeOpacity={0.8}>
          <HelpCircle size={20} color="#D97706" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.practiceContent} showsVerticalScrollIndicator={false}>
        {/* ۱. کارت صورت سوال انگلیسی پیرامون موضوع */}
        <View style={styles.challengeCard}>
          {/* نشانگر موضوع بحث و موقعیت */}
          <View style={[styles.topicBadgeRow, row]}>
            <Sparkles size={14} color="#D97706" />
            <Text style={styles.topicBadgeText} numberOfLines={1}>
              {selectedScenario
                ? (rtl ? `موضوع: ${selectedScenario.title}` : `Topic: ${selectedScenario.title}`)
                : (rtl ? 'موضوع: مکالمه موضوعی' : 'Topic: Everyday Conversation')}
            </Text>
            <View style={styles.questionIndexPill}>
              <Text style={styles.questionIndexText}>
                {rtl ? `سوال ${currentIndex + 1} از ${dialogueList.length}` : `Q ${currentIndex + 1}/${dialogueList.length}`}
              </Text>
            </View>
          </View>

          {/* سوال انگلیسی مطرح شده بر اساس موضوع سناریو */}
          <View style={styles.enQuestionBox}>
            <View style={[styles.enQuestionHeader, row]}>
              <MessageSquare size={16} color="#2563EB" />
              <Text style={styles.enQuestionTag}>
                {rtl ? 'سوال به انگلیسی (Question in English):' : 'Question in English:'}
              </Text>
            </View>
            <Text style={styles.enQuestionText}>
              {questionData.enQuestion}
            </Text>
          </View>

          {/* مفهوم و پیامی که باید به انگلیسی گفته شود */}
          <View style={styles.targetConceptBox}>
            <Text style={styles.targetConceptLabel}>
              {rtl ? '🎯 مفهوم و پاسخی که باید به انگلیسی بگویید:' : '🎯 Target English statement to produce:'}
            </Text>
            <Text style={[styles.persianPromptText, tr]}>
              «{currentDialogue?.translation}»
            </Text>
          </View>

          {/* راهنمای پاسخ به انگلیسی */}
          <View style={[styles.speakHintRow, row]}>
            <Text style={styles.speakHintText}>
              {rtl ? '🗣️ جواب را با صدای بلند به انگلیسی بگو یا در ذهنت مرور کن...' : '🗣️ Say the answer in English out loud...'}
            </Text>
          </View>
        </View>

        {/* ۲. فاز تفکر ۵ ثانیه‌ای */}
        {phase === 'thinking' && (
          <View style={styles.thinkingContainer}>
            {/* شمارشگر ۵ ثانیه با جلوه دایره‌ای */}
            <View style={[styles.timerCircleWrap, secondsLeft === 0 && styles.timerCircleDone]}>
              <Text style={[styles.timerNumber, secondsLeft === 0 && styles.timerNumberDone]}>
                {secondsLeft > 0 ? secondsLeft : '۰'}
              </Text>
              <Text style={[styles.timerSecLabel, secondsLeft === 0 && styles.timerSecLabelDone]}>
                {secondsLeft > 0 ? (rtl ? 'ثانیه' : 'sec') : (rtl ? 'پایان زمان' : 'Time up')}
              </Text>
            </View>

            <Text style={[styles.thinkingHint, secondsLeft === 0 && styles.thinkingHintDone]}>
              {secondsLeft > 0
                ? (t('activeRecallThinkingHint') || 'با صدای بلند یا در ذهنت به انگلیسی بگو... 🗣️')
                : (rtl ? '⏱️ ۵ ثانیه زمان تفکر تمام شد! آیا جمله انگلیسی را گفتی؟' : '⏱️ 5 seconds are up! Did you say it in English?')}
            </Text>

            {secondsLeft === 0 && (
              <Text style={styles.thinkingSubHint}>
                {rtl
                  ? 'برای دیدن متن انگلیسی و شنیدن صدای نیتیو دکمه زیر را لمس کن:'
                  : 'Tap below to reveal the native answer and audio:'}
              </Text>
            )}

            {/* دکمه اختصاصی «نمایش جواب» */}
            <TouchableOpacity
              style={[
                styles.revealNowBtn,
                secondsLeft === 0 && styles.revealNowBtnHighlight,
                row,
              ]}
              onPress={revealAnswer}
              activeOpacity={0.85}
            >
              <Eye size={18} color={secondsLeft === 0 ? '#FFFFFF' : '#92400E'} />
              <Text
                style={[
                  styles.revealNowText,
                  secondsLeft === 0 && styles.revealNowTextHighlight,
                ]}
              >
                {secondsLeft === 0
                  ? (rtl ? 'نمایش جواب و شنیدن پاسخ نیتیو 👁️' : 'Reveal Answer & Audio 👁️')
                  : (rtl ? 'نمایش جواب 👁️' : 'Reveal Answer 👁️')}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ۳. فاز افشای پاسخ نیتیو (Reveal) */}
        {phase === 'reveal' && (
          <View style={styles.revealContainer}>
            <View style={styles.englishCard}>
              <View style={[styles.revealHeaderRow, row]}>
                <View style={styles.speakerTag}>
                  <CheckCircle2 size={16} color="#059669" />
                  <Text style={styles.speakerTagText}>
                    {rtl ? 'پاسخ صحیح انگلیسی (Native English):' : 'Native English Response:'}
                  </Text>
                </View>
                <TouchableOpacity style={styles.replaySmallBtn} onPress={replayAudio} activeOpacity={0.8}>
                  <Volume2 size={15} color="#047857" />
                  <Text style={styles.replaySmallText}>{rtl ? 'پخش صدا 🎧' : 'Play Audio'}</Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.englishText}>{currentDialogue?.dialogue}</Text>

              {/* لغات کلیدی اگر موجود باشد */}
              {currentDialogue?.words && currentDialogue.words.length > 0 && (
                <View style={styles.vocabRow}>
                  {currentDialogue.words.map((w, i) => (
                    <View key={i} style={styles.vocabChip}>
                      <Text style={styles.vocabWord}>{w.word}</Text>
                      {w.meaning ? <Text style={styles.vocabMeaning}>: {w.meaning}</Text> : null}
                    </View>
                  ))}
                </View>
              )}
            </View>

            {/* خودارزیابی کاربر: آیا انگلیسی درست گفتی؟ */}
            <Text style={styles.selfAssessPrompt}>
              {rtl ? 'آیا توانستید پاسخ را به انگلیسی درست بگویید؟' : 'Did you answer correctly in English?'}
            </Text>
            <View style={[styles.assessBtnRow, row]}>
              <TouchableOpacity
                style={[styles.assessBtn, styles.assessKnownBtn]}
                onPress={() => handleAnswerReview(true)}
                activeOpacity={0.85}
              >
                <CheckCircle2 size={20} color="#10B981" />
                <Text style={styles.assessKnownText}>{t('activeRecallIKnewIt') || '✅ درست به انگلیسی گفتم'}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.assessBtn, styles.assessRetryBtn]}
                onPress={() => handleAnswerReview(false)}
                activeOpacity={0.85}
              >
                <RotateCcw size={18} color="#EF4444" />
                <Text style={styles.assessRetryText}>{t('activeRecallRepeatLater') || '🔄 اشتباه گفتم / نیاز به تکرار'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>
      {renderGuideModal()}
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  flex1: {
    flex: 1,
  },
  rowReverse: {
    flexDirection: 'row-reverse',
  },
  textRight: {
    textAlign: 'right',
  },
  textLeft: {
    textAlign: 'left',
  },
  alignEnd: {
    alignItems: 'flex-end',
  },
  alignStart: {
    alignItems: 'flex-start',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 14,
    gap: 12,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: FONT_FAMILY.bold,
    color: COLORS.text,
  },
  headerSub: {
    fontSize: 12,
    fontFamily: FONT_FAMILY.regular,
    color: COLORS.muted,
    marginTop: 2,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  quickMixCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1.5,
    borderColor: '#FDE68A',
    marginBottom: 24,
    gap: 12,
  },
  quickMixBadge: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#F59E0B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickMixTextWrap: {
    flex: 1,
  },
  quickMixTitle: {
    fontSize: 15,
    fontFamily: FONT_FAMILY.bold,
    color: '#92400E',
  },
  quickMixDesc: {
    fontSize: 12,
    fontFamily: FONT_FAMILY.regular,
    color: '#B45309',
    marginTop: 4,
    lineHeight: 18,
  },
  sectionTitle: {
    fontSize: 14,
    fontFamily: FONT_FAMILY.bold,
    color: COLORS.text,
    marginBottom: 12,
  },
  sceneCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 12,
  },
  sceneImg: {
    width: 52,
    height: 52,
    borderRadius: 12,
  },
  scenePlaceholder: {
    backgroundColor: COLORS.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sceneInfo: {
    flex: 1,
  },
  sceneTitle: {
    fontSize: 14,
    fontFamily: FONT_FAMILY.bold,
    color: COLORS.text,
  },
  sceneMeta: {
    fontSize: 12,
    fontFamily: FONT_FAMILY.regular,
    color: COLORS.muted,
    marginTop: 4,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 10,
    gap: 12,
  },
  progressTrack: {
    flex: 1,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.border,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#F59E0B',
    borderRadius: 4,
  },
  stepCounter: {
    fontSize: 13,
    fontFamily: FONT_FAMILY.medium,
    color: COLORS.muted,
  },
  practiceContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 32,
  },
  challengeCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1.5,
    borderColor: '#FDE68A',
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  topicBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FEF3C7',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 10,
    alignSelf: 'flex-start',
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  topicBadgeText: {
    fontSize: 12,
    fontFamily: FONT_FAMILY.bold,
    color: '#92400E',
  },
  promptBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
  },
  promptBadgeText: {
    fontSize: 13,
    fontFamily: FONT_FAMILY.medium,
    color: '#D97706',
  },
  persianPromptText: {
    fontSize: 20,
    fontFamily: FONT_FAMILY.bold,
    color: COLORS.text,
    lineHeight: 32,
  },
  thinkingContainer: {
    alignItems: 'center',
    marginTop: 36,
  },
  timerCircleWrap: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 4,
    borderColor: '#F59E0B',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFBEB',
  },
  timerCircleDone: {
    borderColor: '#10B981',
    backgroundColor: '#ECFDF5',
  },
  timerNumber: {
    fontSize: 38,
    fontFamily: FONT_FAMILY.bold,
    color: '#D97706',
    lineHeight: 42,
  },
  timerNumberDone: {
    color: '#059669',
  },
  timerSecLabel: {
    fontSize: 11,
    fontFamily: FONT_FAMILY.medium,
    color: '#B45309',
    marginTop: -2,
  },
  timerSecLabelDone: {
    color: '#047857',
  },
  thinkingHint: {
    fontSize: 15,
    fontFamily: FONT_FAMILY.medium,
    color: COLORS.textSecondary,
    marginTop: 20,
    textAlign: 'center',
    paddingHorizontal: 16,
  },
  thinkingHintDone: {
    color: '#B45309',
    fontFamily: FONT_FAMILY.bold,
  },
  thinkingSubHint: {
    fontSize: 13,
    fontFamily: FONT_FAMILY.regular,
    color: COLORS.textSecondary,
    marginTop: 8,
    textAlign: 'center',
    paddingHorizontal: 24,
  },
  revealNowBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 24,
    marginTop: 24,
    gap: 8,
    borderWidth: 1.5,
    borderColor: '#FDE68A',
  },
  revealNowBtnHighlight: {
    backgroundColor: '#FF6422',
    borderColor: '#FF6422',
    shadowColor: '#FF6422',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  revealNowText: {
    fontSize: 14,
    fontFamily: FONT_FAMILY.bold,
    color: '#92400E',
  },
  revealNowTextHighlight: {
    color: '#FFFFFF',
  },
  revealContainer: {
    marginTop: 24,
  },
  englishCard: {
    backgroundColor: '#ECFDF5',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1.5,
    borderColor: '#A7F3D0',
  },
  revealHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  speakerTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  speakerTagText: {
    fontSize: 12,
    fontFamily: FONT_FAMILY.bold,
    color: '#065F46',
  },
  replaySmallBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#D1FAE5',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 12,
  },
  replaySmallText: {
    fontSize: 11,
    fontFamily: FONT_FAMILY.medium,
    color: '#047857',
  },
  englishText: {
    fontSize: 19,
    fontFamily: FONT_FAMILY.bold,
    color: '#064E3B',
    lineHeight: 28,
  },
  vocabRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#A7F3D0',
  },
  vocabChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  vocabWord: {
    fontSize: 12,
    fontFamily: FONT_FAMILY.bold,
    color: COLORS.primary,
  },
  vocabMeaning: {
    fontSize: 12,
    fontFamily: FONT_FAMILY.regular,
    color: COLORS.muted,
  },
  selfAssessPrompt: {
    fontSize: 13,
    fontFamily: FONT_FAMILY.medium,
    color: COLORS.muted,
    textAlign: 'center',
    marginTop: 24,
    marginBottom: 12,
  },
  assessBtnRow: {
    flexDirection: 'row',
    gap: 12,
  },
  assessBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 16,
    gap: 8,
  },
  assessKnownBtn: {
    backgroundColor: '#ECFDF5',
    borderWidth: 1.5,
    borderColor: '#10B981',
  },
  assessKnownText: {
    fontSize: 14,
    fontFamily: FONT_FAMILY.bold,
    color: '#065F46',
  },
  assessRetryBtn: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1.5,
    borderColor: '#EF4444',
  },
  assessRetryText: {
    fontSize: 14,
    fontFamily: FONT_FAMILY.bold,
    color: '#991B1B',
  },
  centerWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  resultBadge: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  resultTitle: {
    fontSize: 22,
    fontFamily: FONT_FAMILY.bold,
    color: COLORS.text,
    textAlign: 'center',
  },
  resultDesc: {
    fontSize: 14,
    fontFamily: FONT_FAMILY.regular,
    color: COLORS.muted,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 22,
  },
  scoreCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginVertical: 24,
  },
  scoreText: {
    fontSize: 15,
    fontFamily: FONT_FAMILY.bold,
    color: '#10B981',
  },
  actionBtnPrimary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F59E0B',
    width: '100%',
    paddingVertical: 15,
    borderRadius: 16,
    gap: 8,
    marginBottom: 12,
  },
  actionBtnText: {
    fontSize: 15,
    fontFamily: FONT_FAMILY.bold,
    color: '#FFF',
  },
  actionBtnSecondary: {
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionBtnSecondaryText: {
    fontSize: 14,
    fontFamily: FONT_FAMILY.medium,
    color: COLORS.muted,
  },
  guideBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FEF3C7',
    borderWidth: 1.5,
    borderColor: '#FDE68A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  guideSmallBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FDE68A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  questionIndexPill: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FDE68A',
    marginLeft: 6,
  },
  questionIndexText: {
    fontSize: 11,
    fontFamily: FONT_FAMILY.bold,
    color: '#D97706',
  },
  enQuestionBox: {
    backgroundColor: '#EFF6FF',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1.5,
    borderColor: '#BFDBFE',
    marginBottom: 14,
    gap: 6,
  },
  enQuestionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  enQuestionTag: {
    fontSize: 12,
    fontFamily: FONT_FAMILY.bold,
    color: '#1D4ED8',
  },
  enQuestionText: {
    fontSize: 15,
    fontFamily: FONT_FAMILY.bold,
    color: '#1E40AF',
    lineHeight: 22,
  },
  targetConceptBox: {
    backgroundColor: '#FFFBEB',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#FDE68A',
    marginBottom: 10,
    gap: 6,
  },
  targetConceptLabel: {
    fontSize: 11,
    fontFamily: FONT_FAMILY.medium,
    color: '#B45309',
  },
  speakHintRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 4,
  },
  speakHintText: {
    fontSize: 12,
    fontFamily: FONT_FAMILY.medium,
    color: '#D97706',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 18,
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    width: '100%',
    maxHeight: '85%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 8,
    gap: 12,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  modalIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#FDE68A',
  },
  modalTitle: {
    fontSize: 15,
    fontFamily: FONT_FAMILY.bold,
    color: '#0F172A',
  },
  modalSub: {
    fontSize: 11,
    fontFamily: FONT_FAMILY.regular,
    color: '#64748B',
    marginTop: 2,
  },
  modalCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalBody: {
    paddingVertical: 6,
  },
  guideStepCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 10,
    gap: 12,
  },
  stepNumBadge: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#FF6422',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  stepNumText: {
    fontSize: 12,
    fontFamily: FONT_FAMILY.bold,
    color: '#FFFFFF',
  },
  guideStepTitle: {
    fontSize: 13,
    fontFamily: FONT_FAMILY.bold,
    color: '#1E293B',
    marginBottom: 3,
  },
  guideStepDesc: {
    fontSize: 11,
    fontFamily: FONT_FAMILY.regular,
    color: '#64748B',
    lineHeight: 18,
  },
  modalCtaBtn: {
    backgroundColor: '#FF6422',
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
    shadowColor: '#FF6422',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
  modalCtaText: {
    fontSize: 14,
    fontFamily: FONT_FAMILY.bold,
    color: '#FFFFFF',
  },
});
