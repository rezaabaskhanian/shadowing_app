import React, { useEffect, useRef, useState } from 'react';
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  Award,
  Check,
  ChevronLeft,
  ChevronRight,
  Flame,
  Pause,
  Play,
  RotateCcw,
  Sparkles,
  Volume2,
  X,
  Zap,
} from 'lucide-react-native';

import { COLORS } from '../../../theme/colors';
import { FONT_FAMILY } from '../../../theme/typography';
import { SHADOWS } from '../../../theme/elevation';

export interface WarmUpStep {
  id: string;
  emoji: string;
  titleFa: string;
  titleEn: string;
  targetMuscleFa: string;
  durationSec: number;
  color: string;
  bgColor: string;
  instructionFa: string;
  whyFa: string;
  proTipFa: string;
}

export const WARM_UP_STEPS: WarmUpStep[] = [
  {
    id: 'jaw_release',
    emoji: '😮',
    titleFa: '۱. رهایی و کشش فک (Jaw Drop)',
    titleEn: '1. Jaw Drop & Release',
    targetMuscleFa: 'مفصل فک (TMJ)',
    durationSec: 8,
    color: '#059669',
    bgColor: 'rgba(5, 150, 105, 0.1)',
    instructionFa:
      'دهان خود را به آرامی به شکل یک بیضی عمودی باز کنید. فک پایین را شل رها کنید و ۲ بار آرام به چپ و راست تکان دهید.',
    whyFa: 'فارسی‌زبانان اغلب با فک بسته صحبت می‌کنند؛ این کشش تنش و انقباض اولیه را رفع می‌کند.',
    proTipFa: 'هیچ فشاری نیاورید؛ فرض کنید فک پایین بدون وزن آویزان است.',
  },
  {
    id: 'lip_trill',
    emoji: '💨',
    titleFa: '۲. لرزش لب‌ها یا موتورقایقی (Lip Trills)',
    titleEn: '2. Lip Trills (Motorboat)',
    targetMuscleFa: 'عضلات لب و کنترل بازدم',
    durationSec: 8,
    color: '#2563EB',
    bgColor: 'rgba(37, 99, 235, 0.1)',
    instructionFa:
      'لب‌ها را آرام بدون انقباض روی هم بگذارید و هوا را با صدای لرزان «بِررررر» (Brrr) به بیرون بدمید تا لب‌ها بلرزند.',
    whyFa: 'خون‌رسانی به لب‌ها را افزایش داده و خشکی و گرفتگی کلام را از بین می‌برد.',
    proTipFa: 'اگر لرزش سخت بود، با دو انگشت گوشه‌های گونه را آرام به بالا نگه دارید.',
  },
  {
    id: 'tongue_circle',
    emoji: '👅',
    titleFa: '۳. چرخش زبان دور دندان‌ها (Tongue Circles)',
    titleEn: '3. Tongue Circles',
    targetMuscleFa: 'نوک زبان و تارهای صوتی',
    durationSec: 8,
    color: '#D97706',
    bgColor: 'rgba(217, 119, 6, 0.1)',
    instructionFa:
      'با دهان بسته، نوک زبان را روی دیواره بیرونی دندان‌ها بچرخانید. ۳ دور در جهت ساعت‌گرد و ۳ دور پادساعت‌گرد.',
    whyFa: 'آمادگی حیاتی عضلات زبان برای ادای دقیق و سریع حروف چالشی مانند /r/ و /l/.',
    proTipFa: 'چرخش را پیوسته و با لمس تمام دندان‌ها انجام دهید.',
  },
  {
    id: 'vowel_shapes',
    emoji: '🗣️',
    titleFa: '۴. فرم‌دهی اغراق‌آمیز واکه‌ها (O - E - A - U)',
    titleEn: '4. Exaggerated Vowel Shapes',
    targetMuscleFa: 'دامنه حرکتی گونه و دهان',
    durationSec: 8,
    color: '#7C3AED',
    bgColor: 'rgba(124, 58, 237, 0.1)',
    instructionFa:
      'حروف «O - E - A - U» را با باز کردن کامل و اغراق‌آمیز دهان و تغییر واضح فرم لب‌ها به ترتیب ادا کنید.',
    whyFa: 'جلوگیری از مِن‌مِن کردن (Mumbling) و ارتقای چشم‌گیر وضوح لهجه در شادوئینگ.',
    proTipFa: 'تصور کنید برای فردی که لب‌خوانی می‌کند صحبت می‌کنید!',
  },
];

interface VocalWarmUpModalProps {
  visible: boolean;
  onClose: () => void;
  onComplete?: () => void;
  rtl?: boolean;
}

export const VocalWarmUpModal: React.FC<VocalWarmUpModalProps> = ({
  visible,
  onClose,
  onComplete,
  rtl = true,
}) => {
  const [stepIdx, setStepIdx] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(8);
  const [isRunning, setIsRunning] = useState(true);
  const [isFinished, setIsFinished] = useState(false);

  const currentStep = WARM_UP_STEPS[stepIdx] || WARM_UP_STEPS[0];
  const timerRef = useRef<any>(null);

  // ریست هنگام باز شدن مجدد مودال
  useEffect(() => {
    if (visible) {
      setStepIdx(0);
      setSecondsLeft(WARM_UP_STEPS[0].durationSec);
      setIsRunning(true);
      setIsFinished(false);
    } else {
      setIsRunning(false);
    }
  }, [visible]);

  // شمارشگر معکوس زمان هر تمرین
  useEffect(() => {
    if (!visible || isFinished) return;

    if (isRunning && secondsLeft > 0) {
      timerRef.current = setTimeout(() => {
        setSecondsLeft((prev) => prev - 1);
      }, 1000);
    } else if (isRunning && secondsLeft === 0) {
      // رفتن به تمرین بعدی یا اتمام
      if (stepIdx < WARM_UP_STEPS.length - 1) {
        const nextIdx = stepIdx + 1;
        setStepIdx(nextIdx);
        setSecondsLeft(WARM_UP_STEPS[nextIdx].durationSec);
      } else {
        setIsFinished(true);
        setIsRunning(false);
      }
    }

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [visible, isRunning, secondsLeft, stepIdx, isFinished]);

  const handleNextStep = () => {
    if (stepIdx < WARM_UP_STEPS.length - 1) {
      const nextIdx = stepIdx + 1;
      setStepIdx(nextIdx);
      setSecondsLeft(WARM_UP_STEPS[nextIdx].durationSec);
      setIsRunning(true);
    } else {
      setIsFinished(true);
      setIsRunning(false);
    }
  };

  const handlePrevStep = () => {
    if (stepIdx > 0) {
      const prevIdx = stepIdx - 1;
      setStepIdx(prevIdx);
      setSecondsLeft(WARM_UP_STEPS[prevIdx].durationSec);
      setIsRunning(true);
      setIsFinished(false);
    }
  };

  const handleResetCurrent = () => {
    setSecondsLeft(currentStep.durationSec);
    setIsRunning(true);
  };

  const handleFinishAndStart = () => {
    onClose();
    if (onComplete) onComplete();
  };

  const row = rtl && styles.rowReverse;
  const ta = rtl ? styles.textRight : styles.textLeft;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Header */}
          <View style={[styles.header, row]}>
            <View style={[styles.titleGroup, row]}>
              <View style={styles.headerIconCircle}>
                <Flame size={18} color="#EA580C" />
              </View>
              <View>
                <Text style={[styles.headerTitle, ta]}>
                  {rtl ? 'آماده‌سازی عضلات گفتاری' : 'Vocal & Jaw Warm-up'}
                </Text>
                <Text style={[styles.headerSubtitle, ta]}>
                  {rtl ? 'روتین ۳۰ ثانیه‌ای تقویت فک و زبان' : '30-second articulatory warm-up'}
                </Text>
              </View>
            </View>
            <TouchableOpacity
              onPress={onClose}
              style={styles.closeBtn}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <X size={18} color="#6B7280" />
            </TouchableOpacity>
          </View>

          {/* Segmented Progress Bar */}
          <View style={styles.progressRow}>
            {WARM_UP_STEPS.map((s, idx) => {
              const active = idx === stepIdx && !isFinished;
              const completed = idx < stepIdx || isFinished;
              return (
                <View
                  key={s.id}
                  style={[
                    styles.progressSegment,
                    completed && { backgroundColor: '#059669' },
                    active && { backgroundColor: currentStep.color },
                  ]}
                />
              );
            })}
          </View>

          {/* Body Content */}
          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            {isFinished ? (
              // صفحه تبریک و اتمام گرم کردن
              <View style={styles.finishedCard}>
                <View style={styles.finishedIconCircle}>
                  <Award size={40} color="#059669" />
                </View>
                <Text style={styles.finishedTitle}>
                  {rtl ? 'عالی بود! عضلات شما آماده شدند 🎉' : 'Awesome! You are warmed up 🎉'}
                </Text>
                <Text style={styles.finishedDesc}>
                  {rtl
                    ? 'فک، لب‌ها و زبان شما اکنون در حالت ایده‌آل برای تلفظ روان، دقیق و بدون گرفتگی کلمات انگلیسی هستند.'
                    : 'Your jaw, lips, and tongue are now fully prepared for fluent and natural shadowing practice.'}
                </Text>

                <TouchableOpacity
                  style={[styles.primaryActionBtn, { backgroundColor: '#059669' }]}
                  activeOpacity={0.88}
                  onPress={handleFinishAndStart}
                >
                  <Sparkles size={18} color="#FFFFFF" />
                  <Text style={styles.primaryActionBtnText}>
                    {rtl ? 'شروع تمرین شادوئینگ 🎙️' : 'Start Shadowing Now 🎙️'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.repeatBtn} activeOpacity={0.7} onPress={handleResetCurrent}>
                  <RotateCcw size={14} color="#6B7280" />
                  <Text style={styles.repeatBtnText}>
                    {rtl ? 'تکرار مجدد تمرینات' : 'Repeat Warm-up'}
                  </Text>
                </TouchableOpacity>
              </View>
            ) : (
              // کارت تمرین فعلی
              <View style={styles.exerciseCard}>
                {/* Step Badge & Target Muscle */}
                <View style={[styles.stepMetaRow, row]}>
                  <View style={[styles.muscleBadge, { backgroundColor: currentStep.bgColor }]}>
                    <Text style={[styles.muscleBadgeText, { color: currentStep.color }]}>
                      🎯 {currentStep.targetMuscleFa}
                    </Text>
                  </View>
                  <Text style={styles.stepCounterText}>
                    {rtl
                      ? `تمرین ${stepIdx + 1} از ${WARM_UP_STEPS.length}`
                      : `Exercise ${stepIdx + 1} of ${WARM_UP_STEPS.length}`}
                  </Text>
                </View>

                {/* Big Emoji Illustration */}
                <View style={[styles.emojiWrap, { backgroundColor: currentStep.bgColor }]}>
                  <Text style={styles.emojiText}>{currentStep.emoji}</Text>
                </View>

                {/* Exercise Title */}
                <Text style={[styles.exerciseTitle, ta]}>{currentStep.titleFa}</Text>

                {/* Big Circular Timer */}
                <View style={styles.timerWrap}>
                  <View style={[styles.timerCircle, { borderColor: currentStep.color }]}>
                    <Text style={[styles.timerDigits, { color: currentStep.color }]}>
                      {secondsLeft}
                    </Text>
                    <Text style={styles.timerUnit}>{rtl ? 'ثانیه' : 'sec'}</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.timerToggleBtn}
                    onPress={() => setIsRunning((prev) => !prev)}
                    activeOpacity={0.75}
                  >
                    {isRunning ? (
                      <Pause size={16} color="#4B5563" />
                    ) : (
                      <Play size={16} color="#059669" fill="#059669" />
                    )}
                  </TouchableOpacity>
                </View>

                {/* Instruction Box */}
                <View style={styles.instructionBox}>
                  <Text style={[styles.instructionText, ta]}>{currentStep.instructionFa}</Text>
                </View>

                {/* Why it works */}
                <View style={styles.whyBox}>
                  <View style={[styles.whyHeader, row]}>
                    <Zap size={13} color="#D97706" />
                    <Text style={styles.whyHeaderText}>
                      {rtl ? 'چرا این تمرین موثر است؟' : 'Why it works:'}
                    </Text>
                  </View>
                  <Text style={[styles.whyText, ta]}>{currentStep.whyFa}</Text>
                </View>

                {/* Pro tip */}
                <View style={[styles.proTipBox, row]}>
                  <Text style={styles.proTipText}>💡 {currentStep.proTipFa}</Text>
                </View>
              </View>
            )}
          </ScrollView>

          {/* Footer Controls */}
          {!isFinished && (
            <View style={[styles.footer, row]}>
              <TouchableOpacity
                style={[styles.navBtn, stepIdx === 0 && styles.navBtnDisabled]}
                disabled={stepIdx === 0}
                onPress={handlePrevStep}
                activeOpacity={0.7}
              >
                {rtl ? <ChevronRight size={18} color="#4B5563" /> : <ChevronLeft size={18} color="#4B5563" />}
                <Text style={styles.navBtnText}>{rtl ? 'قبلی' : 'Back'}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.primaryActionBtn, styles.flex1, { backgroundColor: currentStep.color }]}
                activeOpacity={0.88}
                onPress={handleNextStep}
              >
                <Text style={styles.primaryActionBtnText}>
                  {stepIdx === WARM_UP_STEPS.length - 1
                    ? rtl
                      ? 'اتمام و آماده‌ام ✨'
                      : 'Finish ✨'
                    : rtl
                    ? 'تمرین بعدی ❯'
                    : 'Next ❯'}
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  container: {
    width: '100%',
    maxWidth: 420,
    maxHeight: '90%',
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    overflow: 'hidden',
    ...SHADOWS.level2,
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  titleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  headerIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFF7ED',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontFamily: FONT_FAMILY.bold,
    fontSize: 15,
    color: '#111827',
  },
  headerSubtitle: {
    fontFamily: FONT_FAMILY.regular,
    fontSize: 11,
    color: '#6B7280',
    marginTop: 1,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressRow: {
    flexDirection: 'row',
    gap: 4,
    paddingHorizontal: 18,
    paddingVertical: 10,
    backgroundColor: '#FAFAFA',
  },
  progressSegment: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#E5E7EB',
  },
  scrollContent: {
    padding: 18,
  },
  exerciseCard: {
    alignItems: 'center',
  },
  stepMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginBottom: 12,
  },
  muscleBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  muscleBadgeText: {
    fontFamily: FONT_FAMILY.bold,
    fontSize: 11,
  },
  stepCounterText: {
    fontFamily: FONT_FAMILY.regular,
    fontSize: 11,
    color: '#9CA3AF',
  },
  emojiWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  emojiText: {
    fontSize: 38,
  },
  exerciseTitle: {
    fontFamily: FONT_FAMILY.bold,
    fontSize: 16,
    color: '#111827',
    marginBottom: 14,
    textAlign: 'center',
  },
  timerWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  timerCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 3,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  timerDigits: {
    fontFamily: FONT_FAMILY.bold,
    fontSize: 24,
    lineHeight: 28,
  },
  timerUnit: {
    fontFamily: FONT_FAMILY.regular,
    fontSize: 10,
    color: '#6B7280',
    marginTop: -2,
  },
  timerToggleBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  instructionBox: {
    width: '100%',
    backgroundColor: '#F9FAFB',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 12,
  },
  instructionText: {
    fontFamily: FONT_FAMILY.regular,
    fontSize: 13,
    lineHeight: 22,
    color: '#1F2937',
  },
  whyBox: {
    width: '100%',
    backgroundColor: '#FFFBEB',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#FEF3C7',
    marginBottom: 10,
  },
  whyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  whyHeaderText: {
    fontFamily: FONT_FAMILY.bold,
    fontSize: 11,
    color: '#B45309',
  },
  whyText: {
    fontFamily: FONT_FAMILY.regular,
    fontSize: 12,
    lineHeight: 19,
    color: '#92400E',
  },
  proTipBox: {
    width: '100%',
    backgroundColor: '#F0FDF4',
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: '#DCFCE7',
  },
  proTipText: {
    fontFamily: FONT_FAMILY.regular,
    fontSize: 11,
    color: '#166534',
    lineHeight: 18,
  },
  finishedCard: {
    alignItems: 'center',
    paddingVertical: 14,
  },
  finishedIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#ECFDF5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  finishedTitle: {
    fontFamily: FONT_FAMILY.bold,
    fontSize: 17,
    color: '#111827',
    marginBottom: 8,
    textAlign: 'center',
  },
  finishedDesc: {
    fontFamily: FONT_FAMILY.regular,
    fontSize: 13,
    color: '#4B5563',
    lineHeight: 22,
    textAlign: 'center',
    marginBottom: 24,
    paddingHorizontal: 12,
  },
  repeatBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 16,
    padding: 8,
  },
  repeatBtnText: {
    fontFamily: FONT_FAMILY.regular,
    fontSize: 12,
    color: '#6B7280',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    backgroundColor: '#FAFAFA',
  },
  flex1: {
    flex: 1,
  },
  navBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: '#E5E7EB',
  },
  navBtnDisabled: {
    opacity: 0.35,
  },
  navBtnText: {
    fontFamily: FONT_FAMILY.bold,
    fontSize: 12,
    color: '#374151',
  },
  primaryActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 12,
  },
  primaryActionBtnText: {
    fontFamily: FONT_FAMILY.bold,
    fontSize: 13,
    color: '#FFFFFF',
  },
});
