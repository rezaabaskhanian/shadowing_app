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
  Languages,
  Lightbulb,
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
const RECALL_MODE_STORAGE_KEY = '@active_recall_mode_v2';

export type RecallMode = 'en_to_en' | 'fa_to_en';

export interface EnToEnQuestionData {
  englishQuestion: string;
  contextHeader: string;
  partnerTextEn?: string;
  partnerSpeaker?: string;
  partnerAudioUrl?: string;
  persianHint: string;
}

/**
 * ۱. تولید هوشمند سوالات تعاملی به زبان انگلیسی بر اساس موضوع درس (English Q&A Mode)
 */
export function getEnglishToEnglishQuestion(
  item: DialogueItem | undefined,
  prevItem: DialogueItem | undefined,
  index: number,
  topicTitle?: string,
): EnToEnQuestionData {
  if (!item) {
    return {
      englishQuestion: '',
      contextHeader: '',
      persianHint: '',
    };
  }

  const cleanTopic = topicTitle || 'Everyday English';
  const text = item.dialogue?.trim() || '';
  const isQuestion = text.endsWith('?');
  const partnerDialogue = prevItem?.dialogue?.trim() || '';

  // اگر دیالوگ قبلی سوال یا صحبتی از طرف مقابل بوده است (تعامل دوطرفه طبیعی)
  if (partnerDialogue && (partnerDialogue.endsWith('?') || (prevItem?.speaker && prevItem.speaker !== item.speaker))) {
    const partnerName = prevItem?.speaker ? prevItem.speaker : 'Partner';
    let questionText = `How do you respond to ${partnerName} in English?`;
    if (isQuestion) {
      questionText = `In response to ${partnerName}, what clarifying question do you ask in English?`;
    } else if (/^(thank|thanks)/i.test(text)) {
      questionText = `How do you naturally thank ${partnerName} in English?`;
    } else if (/^(i'd like|i would like|i want|can i|could i)/i.test(text)) {
      questionText = `How do you express your request or preference to ${partnerName} in English?`;
    }

    return {
      contextHeader: `${partnerName} in "${cleanTopic}"`,
      partnerSpeaker: partnerName,
      partnerTextEn: partnerDialogue,
      partnerAudioUrl: prevItem?.audioUrl,
      englishQuestion: questionText,
      persianHint: item.translation || '',
    };
  }

  // اگر جمله هدف یک سوال باشد که کاربر باید در این سناریو مطرح کند
  if (isQuestion) {
    let qPrompt = `In this conversation about "${cleanTopic}", what question do you ask in English?`;
    if (/^where/i.test(text)) {
      qPrompt = `You need directions or location information. What question do you ask in English?`;
    } else if (/^(how much|how many|what is the price|what's the cost)/i.test(text)) {
      qPrompt = `You want to inquire about the cost or price in English. What do you ask?`;
    } else if (/^(can|could|would|may)/i.test(text)) {
      qPrompt = `How would you make this polite request to the other person in English?`;
    } else if (/^what/i.test(text)) {
      qPrompt = `You want to ask for specific information about "${cleanTopic}". What question do you ask in English?`;
    } else if (/^(when|what time)/i.test(text)) {
      qPrompt = `You need to check the time or schedule. What English question do you ask?`;
    } else if (/^how/i.test(text)) {
      qPrompt = `Regarding "${cleanTopic}", how do you ask about the method or status in English?`;
    } else if (/^(do|does|did|is|are|was|were)/i.test(text)) {
      qPrompt = `How do you ask in English to confirm this information?`;
    }

    return {
      contextHeader: `Topic: ${cleanTopic}`,
      englishQuestion: qPrompt,
      persianHint: item.translation || '',
    };
  }

  // جملات بیانی، سلام و شروع مکالمه یا اعلام نظر
  let statementPrompt = `How do you express this fluently in English?`;
  if (index === 0) {
    if (/^(hello|hi|good morning|good afternoon|good evening|excuse me)/i.test(text)) {
      statementPrompt = `You are starting a conversation about "${cleanTopic}". How do you greet and open in English?`;
    } else {
      statementPrompt = `To initiate the conversation about "${cleanTopic}", what do you say first in English?`;
    }
  } else if (/^(thank|thanks)/i.test(text)) {
    statementPrompt = `How do you express your gratitude politely in English?`;
  } else if (/^(i'd like|i would like|i want|i need)/i.test(text)) {
    statementPrompt = `How do you state your preference or request clearly in English?`;
  } else if (/^(yes|sure|absolutely|certainly|of course|no problem|ok|okay)/i.test(text)) {
    statementPrompt = `How do you naturally agree or confirm in English?`;
  } else if (/^(sorry|excuse me|pardon)/i.test(text)) {
    statementPrompt = `How do you apologize or excuse yourself politely in English?`;
  } else if (/^(i think|in my opinion|i believe)/i.test(text)) {
    statementPrompt = `How do you express your opinion about "${cleanTopic}" in English?`;
  } else {
    statementPrompt = `In this situation ("${cleanTopic}"), what English sentence do you say?`;
  }

  return {
    contextHeader: `Topic: ${cleanTopic}`,
    englishQuestion: statementPrompt,
    persianHint: item.translation || '',
  };
}

/**
 * ۲. یادآوری و برگردان سریع از فارسی به انگلیسی (Pimsleur Recall Mode)
 */
function getPersianRecallPrompt(
  item: DialogueItem | undefined,
  index: number,
  topicTitle?: string,
): { enQuestion: string; contextFa: string } {
  if (!item) return { enQuestion: '', contextFa: '' };
  const cleanTopic = topicTitle || 'Everyday English';
  return {
    enQuestion: `To express this in "${cleanTopic}", how do you say in English:`,
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

  // حالت تمرین: 'en_to_en' (سوال و جواب انگلیسی بر اساس موضوع درس) | 'fa_to_en' (یادآوری فارسی به انگلیسی)
  const [mode, setMode] = useState<RecallMode>('en_to_en');
  const [showHint, setShowHint] = useState(false);

  // بازیابی حالت پیش‌فرض ذخیره‌شده کاربر
  useEffect(() => {
    AsyncStorage.getItem(RECALL_MODE_STORAGE_KEY)
      .then((saved) => {
        if (saved === 'fa_to_en' || saved === 'en_to_en') {
          setMode(saved as RecallMode);
        }
      })
      .catch(() => {});
  }, []);

  const handleSwitchMode = useCallback((newMode: RecallMode) => {
    setMode(newMode);
    AsyncStorage.setItem(RECALL_MODE_STORAGE_KEY, newMode).catch(() => {});
  }, []);

  // ریست راهنمای فارسی با تغییر مرحله یا سوال
  useEffect(() => {
    setShowHint(false);
  }, [currentIndex, phase]);

  // کنترل صوتی
  const [audioUri, setAudioUri] = useState<string | null>(null);
  const [actionCommand, setActionCommand] = useState<'none' | 'play_original'>('none');
  const [actionNonce, setActionNonce] = useState(0);

  // پخش صدای طرف مقابل مکالمه (در صورت وجود صدای دیالوگ قبلی)
  const playPartnerAudio = useCallback((partnerAudioUrl?: string) => {
    if (partnerAudioUrl) {
      setAudioUri(partnerAudioUrl);
      setActionCommand('play_original');
      setActionNonce((n) => n + 1);
    }
  }, []);

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
  const prevDialogue = currentIndex > 0 ? dialogueList[currentIndex - 1] : undefined;
  const progressPercent = dialogueList.length > 0 ? ((currentIndex + 1) / dialogueList.length) * 100 : 0;
  const enToEnData = getEnglishToEnglishQuestion(currentDialogue, prevDialogue, currentIndex, selectedScenario?.title);
  const faToEnData = getPersianRecallPrompt(currentDialogue, currentIndex, selectedScenario?.title);

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
            {/* کارت ۱: دو حالت تمرین فعال */}
            <View style={[styles.guideStepCard, row]}>
              <View style={styles.stepNumBadge}>
                <Text style={styles.stepNumText}>۱</Text>
              </View>
              <View style={[styles.flex1, rtl ? styles.alignEnd : styles.alignStart]}>
                <Text style={[styles.guideStepTitle, tr]}>
                  {rtl ? 'انتخاب حالت تمرین (۲ حالت هوشمند):' : 'Two Smart Practice Modes:'}
                </Text>
                <Text style={[styles.guideStepDesc, tr]}>
                  {rtl
                    ? '• حالت سوال و پاسخ انگلیسی: سوالات پیرامون موضوع درس به انگلیسی مطرح می‌شوند و شما باید به انگلیسی جواب بدهید.\n• حالت یادآوری فارسی به انگلیسی: مفهوم فارسی را می‌بینید و جمله انگلیسی را به خاطر می‌آورید.'
                    : '• English Q&A: Real conversational questions in English based on the lesson topic, answer in English.\n• Persian Recall: See the Persian concept and recall the English sentence.'}
                </Text>
              </View>
            </View>

            {/* کارت ۲: ۵ ثانیه فرصت تفکر و گفتن به انگلیسی */}
            <View style={[styles.guideStepCard, row]}>
              <View style={styles.stepNumBadge}>
                <Text style={styles.stepNumText}>۲</Text>
              </View>
              <View style={[styles.flex1, rtl ? styles.alignEnd : styles.alignStart]}>
                <Text style={[styles.guideStepTitle, tr]}>
                  {rtl ? '۵ ثانیه فرصت تفکر و پاسخ به انگلیسی:' : '5 Seconds to Answer in English:'}
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
            <Text style={[styles.headerTitle, tr]}>{t('activeRecallTitle') || 'مرور فعال (Active Recall)'}</Text>
            <Text style={[styles.headerSub, tr]}>{t('activeRecallSubtitle') || 'روش پیمزلر: بگو قبل از شنیدن پاسخ نیتیو'}</Text>
          </View>
          <TouchableOpacity style={styles.guideBtn} onPress={() => setShowGuideModal(true)} activeOpacity={0.8}>
            <HelpCircle size={22} color="#D97706" />
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* انتخاب حالت تمرین اکتیو لرنینگ */}
          <View style={styles.modePickerContainer}>
            <Text style={[styles.modePickerHeader, tr]}>
              {rtl ? '🎯 انتخاب حالت تمرین و سوالات:' : '🎯 Select Practice Mode:'}
            </Text>
            <View style={[styles.modePickerRow, row]}>
              <TouchableOpacity
                style={[
                  styles.modePickerOption,
                  mode === 'en_to_en' && styles.modePickerOptionActive,
                ]}
                onPress={() => handleSwitchMode('en_to_en')}
                activeOpacity={0.85}
              >
                <View style={[styles.modePickerIconWrap, mode === 'en_to_en' && styles.modePickerIconActive]}>
                  <MessageSquare size={16} color={mode === 'en_to_en' ? '#FFF' : '#2563EB'} />
                </View>
                <Text style={[styles.modePickerTitle, mode === 'en_to_en' && styles.modePickerTitleActive, tr]}>
                  {rtl ? 'سوال و جواب انگلیسی 🇬🇧' : 'English Q&A 🇬🇧'}
                </Text>
                <Text style={[styles.modePickerSubtitle, tr]}>
                  {rtl ? 'طرح سوالات پیرامون موضوع درس و پاسخ به انگلیسی' : 'Topic questions in English, answer in English'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.modePickerOption,
                  mode === 'fa_to_en' && styles.modePickerOptionActive,
                ]}
                onPress={() => handleSwitchMode('fa_to_en')}
                activeOpacity={0.85}
              >
                <View style={[styles.modePickerIconWrap, mode === 'fa_to_en' && styles.modePickerIconActive]}>
                  <Languages size={16} color={mode === 'fa_to_en' ? '#FFF' : '#D97706'} />
                </View>
                <Text style={[styles.modePickerTitle, mode === 'fa_to_en' && styles.modePickerTitleActive, tr]}>
                  {rtl ? 'یادآوری فارسی 🇮🇷' : 'Persian Recall 🇮🇷'}
                </Text>
                <Text style={[styles.modePickerSubtitle, tr]}>
                  {rtl ? 'مشاهده مفهوم فارسی و ساخت سریع معادل انگلیسی' : 'See Persian concept, recall English in 5s'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

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
        {/* نوار تغییر حالت تمرین: سوال و جواب انگلیسی در برابر یادآوری فارسی */}
        <View style={[styles.modeToggleBar, row]}>
          <TouchableOpacity
            style={[styles.modeToggleTab, mode === 'en_to_en' && styles.modeToggleTabActive]}
            onPress={() => handleSwitchMode('en_to_en')}
            activeOpacity={0.8}
          >
            <MessageSquare size={13} color={mode === 'en_to_en' ? '#FFFFFF' : '#64748B'} />
            <Text style={[styles.modeToggleText, mode === 'en_to_en' && styles.modeToggleTextActive]}>
              {rtl ? 'سوال و جواب انگلیسی 🇬🇧' : 'English Q&A 🇬🇧'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.modeToggleTab, mode === 'fa_to_en' && styles.modeToggleTabActive]}
            onPress={() => handleSwitchMode('fa_to_en')}
            activeOpacity={0.8}
          >
            <Languages size={13} color={mode === 'fa_to_en' ? '#FFFFFF' : '#64748B'} />
            <Text style={[styles.modeToggleText, mode === 'fa_to_en' && styles.modeToggleTextActive]}>
              {rtl ? 'یادآوری فارسی 🇮🇷' : 'Persian Recall 🇮🇷'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* ۱. کارت صورت سوال و تعامل فعال */}
        <View style={styles.challengeCard}>
          {/* نشانگر موضوع بحث و موقعیت */}
          <View style={[styles.topicBadgeRow, row]}>
            <Sparkles size={14} color="#D97706" />
            <Text style={styles.topicBadgeText} numberOfLines={1}>
              {selectedScenario
                ? (rtl ? `موضوع: ${selectedScenario.title}` : `Topic: ${selectedScenario.title}`)
                : (rtl ? 'موضوع: مکالمه کاربردی' : 'Topic: Everyday Conversation')}
            </Text>
            <View style={styles.questionIndexPill}>
              <Text style={styles.questionIndexText}>
                {rtl ? `سوال ${currentIndex + 1} از ${dialogueList.length}` : `Q ${currentIndex + 1}/${dialogueList.length}`}
              </Text>
            </View>
          </View>

          {mode === 'en_to_en' ? (
            <>
              {/* حالت انگلیسی: اگر صحبت یا سوال طرف مقابل وجود دارد */}
              {enToEnData.partnerTextEn ? (
                <View style={styles.partnerBubbleBox}>
                  <View style={[styles.partnerBubbleHeader, row]}>
                    <Text style={styles.partnerSpeakerLabel}>
                      🗣️ {enToEnData.partnerSpeaker || (rtl ? 'طرف مقابل در مکالمه:' : 'Conversation Partner:')}
                    </Text>
                    {enToEnData.partnerAudioUrl ? (
                      <TouchableOpacity
                        style={[styles.partnerPlayBtn, row]}
                        onPress={() => playPartnerAudio(enToEnData.partnerAudioUrl)}
                        activeOpacity={0.8}
                      >
                        <Volume2 size={13} color="#1D4ED8" />
                        <Text style={styles.partnerPlayText}>
                          {rtl ? 'شنیدن صدا 🎧' : 'Listen 🎧'}
                        </Text>
                      </TouchableOpacity>
                    ) : null}
                  </View>
                  <Text style={styles.partnerBubbleText}>
                    "{enToEnData.partnerTextEn}"
                  </Text>
                </View>
              ) : null}

              {/* سوال انگلیسی مطرح شده بر اساس موضوع سناریو */}
              <View style={styles.enQuestionBox}>
                <View style={[styles.enQuestionHeader, row]}>
                  <MessageSquare size={16} color="#2563EB" />
                  <Text style={styles.enQuestionTag}>
                    {rtl ? 'سوال انگلیسی بر اساس موضوع درس:' : 'English Question Based on Topic:'}
                  </Text>
                </View>
                <Text style={styles.enQuestionText}>
                  {enToEnData.englishQuestion}
                </Text>
              </View>

              {/* دکمه راهنمای فارسی (اختیاری) */}
              <TouchableOpacity
                style={[styles.hintToggleBtn, row]}
                onPress={() => setShowHint((h) => !h)}
                activeOpacity={0.8}
              >
                <Lightbulb size={14} color="#D97706" />
                <Text style={styles.hintToggleText}>
                  {showHint
                    ? (rtl ? 'بستن راهنما 🔼' : 'Hide Hint 🔼')
                    : (rtl ? '💡 نیاز به راهنمایی داری؟ (نمایش معنی فارسی)' : '💡 Need a hint? (Show Persian meaning)')}
                </Text>
              </TouchableOpacity>

              {showHint && (
                <View style={styles.hintContainer}>
                  <Text style={styles.hintLabel}>
                    {rtl ? '🎯 مفهوم و پاسخ مد نظر:' : '🎯 Target Clue:'}
                  </Text>
                  <Text style={[styles.hintFaText, tr]}>
                    «{enToEnData.persianHint}»
                  </Text>
                </View>
              )}

              {/* راهنمای پاسخ به انگلیسی */}
              <View style={[styles.speakHintRow, row]}>
                <Text style={styles.speakHintText}>
                  {rtl ? '🗣️ جواب را با صدای بلند به انگلیسی بگو یا در ذهنت مرور کن...' : '🗣️ Say your answer in English out loud...'}
                </Text>
              </View>
            </>
          ) : (
            <>
              {/* حالت فارسی به انگلیسی: مفهوم و پیامی که باید به انگلیسی بازتولید شود */}
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
                  {rtl ? '🗣️ معادل انگلیسی این مفهوم را در ۵ ثانیه بگو...' : '🗣️ Say the English sentence in 5 seconds...'}
                </Text>
              </View>
            </>
          )}
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
                  <Text style={styles.replaySmallText}>{rtl ? 'پخش مجدد 🎧' : 'Play Audio'}</Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.englishText}>{currentDialogue?.dialogue}</Text>

              {/* ترجمه فارسی پاسخ جهت اطمینان و مقایسه */}
              <View style={styles.revealTranslationBox}>
                <Text style={[styles.revealTranslationText, tr]}>
                  {currentDialogue?.translation}
                </Text>
              </View>

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
              {mode === 'en_to_en'
                ? (rtl ? 'آیا توانستید به زبان انگلیسی پاسخ درستی بدهید؟' : 'Did you answer correctly in English?')
                : (rtl ? 'آیا توانستید معادل انگلیسی را درست بگویید؟' : 'Did you recall the English sentence correctly?')}
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
  modePickerContainer: {
    backgroundColor: COLORS.surface,
    borderRadius: 18,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 10,
  },
  modePickerHeader: {
    fontSize: 13,
    fontFamily: FONT_FAMILY.bold,
    color: COLORS.text,
  },
  modePickerRow: {
    flexDirection: 'row',
    gap: 10,
  },
  modePickerOption: {
    flex: 1,
    backgroundColor: COLORS.surfaceLight,
    borderRadius: 14,
    padding: 12,
    borderWidth: 1.5,
    borderColor: 'transparent',
    alignItems: 'center',
    gap: 6,
  },
  modePickerOptionActive: {
    backgroundColor: '#EFF6FF',
    borderColor: '#3B82F6',
  },
  modePickerIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#DBEAFE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modePickerIconActive: {
    backgroundColor: '#2563EB',
  },
  modePickerTitle: {
    fontSize: 12,
    fontFamily: FONT_FAMILY.bold,
    color: COLORS.text,
    textAlign: 'center',
  },
  modePickerTitleActive: {
    color: '#1D4ED8',
  },
  modePickerSubtitle: {
    fontSize: 10,
    fontFamily: FONT_FAMILY.regular,
    color: COLORS.muted,
    textAlign: 'center',
    lineHeight: 14,
  },
  modeToggleBar: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    padding: 4,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 6,
  },
  modeToggleTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 9,
    paddingHorizontal: 8,
    borderRadius: 10,
    gap: 6,
  },
  modeToggleTabActive: {
    backgroundColor: '#2563EB',
  },
  modeToggleText: {
    fontSize: 12,
    fontFamily: FONT_FAMILY.bold,
    color: COLORS.muted,
  },
  modeToggleTextActive: {
    color: '#FFFFFF',
  },
  partnerBubbleBox: {
    backgroundColor: '#F0FDF4',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#BBF7D0',
    marginBottom: 12,
    gap: 6,
  },
  partnerBubbleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  partnerSpeakerLabel: {
    fontSize: 12,
    fontFamily: FONT_FAMILY.bold,
    color: '#166534',
  },
  partnerPlayBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DCFCE7',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 8,
    gap: 4,
  },
  partnerPlayText: {
    fontSize: 11,
    fontFamily: FONT_FAMILY.medium,
    color: '#15803D',
  },
  partnerBubbleText: {
    fontSize: 14,
    fontFamily: FONT_FAMILY.medium,
    color: '#14532D',
    lineHeight: 20,
    fontStyle: 'italic',
  },
  hintToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEF3C7',
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 10,
    gap: 6,
    alignSelf: 'center',
    marginTop: 4,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  hintToggleText: {
    fontSize: 11,
    fontFamily: FONT_FAMILY.bold,
    color: '#92400E',
  },
  hintContainer: {
    backgroundColor: '#FFFBEB',
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: '#FDE68A',
    marginBottom: 10,
    gap: 4,
  },
  hintLabel: {
    fontSize: 11,
    fontFamily: FONT_FAMILY.medium,
    color: '#B45309',
  },
  hintFaText: {
    fontSize: 14,
    fontFamily: FONT_FAMILY.bold,
    color: '#78350F',
    lineHeight: 22,
  },
  revealTranslationBox: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#A7F3D0',
  },
  revealTranslationText: {
    fontSize: 14,
    fontFamily: FONT_FAMILY.medium,
    color: '#065F46',
    lineHeight: 22,
  },
});
