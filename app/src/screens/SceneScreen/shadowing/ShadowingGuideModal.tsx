import React, { useEffect, useState } from 'react';
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  Calendar,
  Check,
  Headphones,
  HelpCircle,
  Layers,
  Mic,
  Sparkles,
  Volume2,
  X,
  Activity,
  Award,
  Flame,
} from 'lucide-react-native';

import { COLORS } from '../../../theme/colors';
import { FONT_FAMILY } from '../../../theme/typography';
import { SHADOWS } from '../../../theme/elevation';
import type { PracticeFlowMode } from '../../../data/PracticeSettingsContext';

interface ShadowingGuideModalProps {
  visible: boolean;
  onClose: () => void;
  language: string;
  initialMode?: PracticeFlowMode;
  onSelectMode?: (mode: PracticeFlowMode) => void;
  onOpenWarmUp?: () => void;
}

interface GuideStep {
  num: number;
  icon: typeof Headphones;
  color: string;
  bgColor: string;
  titleFa: string;
  titleEn: string;
  descFa: string;
  descEn: string;
}

export const ShadowingGuideModal: React.FC<ShadowingGuideModalProps> = ({
  visible,
  onClose,
  language,
  initialMode = 'smart_flow',
  onSelectMode,
  onOpenWarmUp,
}) => {
  const isRtl = language === 'fa';
  const [activeTab, setActiveTab] = useState<PracticeFlowMode | 'routine_challenge'>(initialMode);

  useEffect(() => {
    if (visible) {
      setActiveTab(initialMode || 'smart_flow');
    }
  }, [visible, initialMode]);

  const challengeWeeks = [
    {
      week: 1,
      titleFa: 'هفته ۱: پی‌ریزی و درک صداها (Mumbling)',
      titleEn: 'Week 1: Sound Catching & Mumbling',
      speedBadge: '🪜 0.85x',
      focusFa: 'تمرین با سرعت ۰.۸۵x و زمزمه آرام برای کشف ریتم طبیعی، بدون وسواس روی تک‌تک کلمات.',
      descFa: 'روزانه ۱۰ دقیقه به سناریو گوش دهید و بلافاصله با گوینده زیر لب زمزمه کنید. هدف این هفته تنظیم گوش با سرعت گفتار پیوسته است.',
      icon: Activity,
      color: '#6366F1',
      bgColor: 'rgba(99, 102, 241, 0.1)',
    },
    {
      week: 2,
      titleFa: 'هفته ۲: هم‌خوانی با متن و استرس (Shadow Reading)',
      titleEn: 'Week 2: Shadow Reading & Stress',
      speedBadge: '🪜 0.85x ➔ 1.0x',
      focusFa: 'دنبال کردن متن با راهنمای ریتم (🎵)، تکیه روی کلمات کلیدی و اتصال صامت به مصوت (‿).',
      descFa: 'با فعال‌سازی دکمه «ریتم و لحن»، کلمات برجسته (بولد) را پرانرژی بگویید و اتصال کلمات را بدون مکث ادا کنید.',
      icon: Volume2,
      color: '#0EA5E9',
      bgColor: 'rgba(14, 165, 233, 0.1)',
    },
    {
      week: 3,
      titleFa: 'هفته ۳: شادوئینگ بدون متن (Blind Shadowing)',
      titleEn: 'Week 3: Blind Shadowing by Ear',
      speedBadge: '1.0x',
      focusFa: 'پنهان کردن متن با دکمه (👁️) و اتکای صددرصد به گوش برای تشخیص واج‌ها در لحظه.',
      descFa: 'متن را بپوشانید تا چشم نتواند به مغز کمک کند. فقط به گوش اعتماد کنید؛ در صورت خطا، با دکمه تکرار یک‌بار دیگر گوش دهید.',
      icon: Headphones,
      color: '#F59E0B',
      bgColor: 'rgba(245, 158, 11, 0.1)',
    },
    {
      week: 4,
      titleFa: 'هفته ۴: تسلط، روانی و سرعت طبیعی (Fluency)',
      titleEn: 'Week 4: Full Fluency & Mastery',
      speedBadge: '1.0x 🚀',
      focusFa: 'سایه‌زنی هم‌زمان با ۱ ثانیه تاخیر، ضبط مستقل و دریافت نمره کامل مکث، استرس و لحن.',
      descFa: 'با سرعت طبیعی ۱.۰x صحبت کنید و بازخورد هوش مصنوعی در کارت مکث، تکیه و ملودی را بررسی کنید تا نمره‌تان بالای ۸۵٪ تثبیت شود.',
      icon: Award,
      color: '#10B981',
      bgColor: 'rgba(16, 185, 129, 0.1)',
    },
  ];

  const smartSteps: GuideStep[] = [
    {
      num: 1,
      icon: Headphones,
      color: '#2563EB',
      bgColor: 'rgba(37, 99, 235, 0.1)',
      titleFa: '۱. شنیدن داستان (Listen)',
      titleEn: '1. Listen to Story',
      descFa:
        'ابتدا سناریو را پیوسته بشنوید تا گوش شما با ریتم، لحن و مکث‌های طبیعی گویندگان هماهنگ شود.',
      descEn:
        'Listen to the scene continuously to familiarize your ears with natural pronunciation, pace, and pauses.',
    },
    {
      num: 2,
      icon: Volume2,
      color: '#F97316',
      bgColor: 'rgba(249, 115, 22, 0.1)',
      titleFa: '۲. پخش جمله و آماده‌سازی (با زمزمه)',
      titleEn: '2. Sentence & Warm-up (Mumbling)',
      descFa:
        'هر جمله جداگانه پخش می‌شود. می‌توانید با دکمه «🗣️ گرم‌کردن با زمزمه» ابتدا بدون استرس زیر لب ریتم جمله را زمزمه کنید، یا مستقیماً «آماده‌ام! 🚀» را لمس کنید.',
      descEn:
        'Each sentence plays separately. Tap "Mumbling Warm-up" to quietly murmur along first, or tap "I\'m Ready! 🚀" to start countdown.',
    },
    {
      num: 3,
      icon: Mic,
      color: '#DC2626',
      bgColor: 'rgba(220, 38, 38, 0.1)',
      titleFa: '۳. سایه‌زنی و ضبط هم‌زمان',
      titleEn: '3. Shadow & Speak',
      descFa:
        'بدون نیاز به فشردن دکمه ضبط، جمله را با صدای رسا، ریتم و لحن گوینده تکرار کنید.',
      descEn:
        'Recording starts automatically; speak aloud matching the native speaker\'s tone, stress, and cadence.',
    },
    {
      num: 4,
      icon: Sparkles,
      color: '#059669',
      bgColor: 'rgba(5, 150, 105, 0.1)',
      titleFa: '۴. کارنامه و تحلیل آنی کلمات',
      titleEn: '4. Instant Word Feedback',
      descFa:
        'هوش مصنوعی کلمات را با رنگ‌های سبز، زرد و قرمز بررسی کرده و سپس به طور روان به جمله بعدی می‌رود.',
      descEn:
        'AI evaluates your pronunciation word-by-word with colored highlights, then advances smoothly to the next sentence.',
    },
  ];

  const classicSteps: GuideStep[] = [
    {
      num: 1,
      icon: Headphones,
      color: '#2563EB',
      bgColor: 'rgba(37, 99, 235, 0.1)',
      titleFa: '۱. شنیدن (Listen)',
      titleEn: '1. Listen',
      descFa:
        'فقط به صدا، لحن و مکث‌های گوینده گوش دهید تا ریتم طبیعی مکالمه در ذهن شما شکل بگیرد.',
      descEn:
        'Carefully listen to native rhythm, pitch, and phrasing to build auditory awareness.',
    },
    {
      num: 2,
      icon: Volume2,
      color: '#F97316',
      bgColor: 'rgba(249, 115, 22, 0.1)',
      titleFa: '۲. سایه‌زنی هم‌زمان بدون ضبط (Shadow)',
      titleEn: '2. Shadow Aloud (No Recording)',
      descFa:
        'هم‌زمان با پخش صدای گوینده، با صدای بلند تکرار کنید. در این مرحله صدایی ضبط نمی‌شود تا عضلات گفتاری شما بدون استرس گرم شوند.',
      descEn:
        'Repeat aloud alongside the speaker. Audio is NOT recorded here so you can practice freely without stress.',
    },
    {
      num: 3,
      icon: Mic,
      color: '#DC2626',
      bgColor: 'rgba(220, 38, 38, 0.1)',
      titleFa: '۳. ضبط مستقل (Record)',
      titleEn: '3. Record Solo',
      descFa:
        'صدای گوینده قطع شده و متن تار می‌شود؛ حالا بدون چرخ کمکی و از حفظ، صدای خود را ضبط کنید.',
      descEn:
        'The native voice is muted and text blurred; recall from memory and record your solo voice.',
    },
    {
      num: 4,
      icon: Sparkles,
      color: '#059669',
      bgColor: 'rgba(5, 150, 105, 0.1)',
      titleFa: '۴. مقایسه و نمره هوش مصنوعی (Compare)',
      titleEn: '4. Compare & AI Score',
      descFa:
        'صدای خود را با گوینده مقایسه کرده، امواج صوتی را تطبیق دهید و نمره دقیق دریافت کنید.',
      descEn:
        'Compare your recording with the native speaker, review soundwaves, and inspect your AI score.',
    },
  ];

  const currentSteps = activeTab === 'smart_flow' ? smartSteps : classicSteps;

  const handleTabChange = (mode: PracticeFlowMode | 'routine_challenge') => {
    setActiveTab(mode);
    if (mode !== 'routine_challenge') {
      onSelectMode?.(mode);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.cardContainer}>
          {/* Header */}
          <View style={[styles.headerRow, isRtl && styles.rowReverse]}>
            <View style={[styles.headerTexts, isRtl && { alignItems: 'flex-end' }]}>
              <View style={[styles.titleBadge, isRtl && styles.rowReverse]}>
                <HelpCircle size={15} color={COLORS.primary} />
                <Text style={styles.titleBadgeText}>
                  {isRtl ? 'راهنمای تمرین شادوئینگ' : 'Shadowing Practice Guide'}
                </Text>
              </View>
              <Text style={styles.mainTitle}>
                {isRtl ? 'روش‌های یادگیری شادوئینگ' : 'How Shadowing Works'}
              </Text>
            </View>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose} activeOpacity={0.8}>
              <X size={18} color="#6B7280" />
            </TouchableOpacity>
          </View>

          {/* Mode Switcher Tabs */}
          <View style={[styles.tabBar, isRtl && styles.rowReverse]}>
            <TouchableOpacity
              activeOpacity={0.8}
              style={[
                styles.tabBtn,
                activeTab === 'smart_flow' && styles.tabBtnActiveSmart,
              ]}
              onPress={() => handleTabChange('smart_flow')}
            >
              <Sparkles
                size={14}
                color={activeTab === 'smart_flow' ? '#059669' : '#6B7280'}
              />
              <Text
                style={[
                  styles.tabBtnText,
                  activeTab === 'smart_flow' && styles.tabBtnTextActiveSmart,
                ]}
                numberOfLines={1}
              >
                {isRtl ? 'سایه‌زنی هوشمند ✨' : 'Smart Flow ✨'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.8}
              style={[
                styles.tabBtn,
                activeTab === 'classic_steps' && styles.tabBtnActiveClassic,
              ]}
              onPress={() => handleTabChange('classic_steps')}
            >
              <Layers
                size={14}
                color={activeTab === 'classic_steps' ? '#2563EB' : '#6B7280'}
              />
              <Text
                style={[
                  styles.tabBtnText,
                  activeTab === 'classic_steps' && styles.tabBtnTextActiveClassic,
                ]}
                numberOfLines={1}
              >
                {isRtl ? 'روش ۴ مرحله‌ای' : '4-Step Classic'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.8}
              style={[
                styles.tabBtn,
                activeTab === 'routine_challenge' && styles.tabBtnActiveChallenge,
              ]}
              onPress={() => handleTabChange('routine_challenge')}
            >
              <Calendar
                size={14}
                color={activeTab === 'routine_challenge' ? '#6366F1' : '#6B7280'}
              />
              <Text
                style={[
                  styles.tabBtnText,
                  activeTab === 'routine_challenge' && styles.tabBtnTextActiveChallenge,
                ]}
                numberOfLines={1}
              >
                {isRtl ? 'برنامه ۴ هفته‌ای' : '4-Week Plan'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Steps / Routine List */}
          <ScrollView
            style={styles.scrollList}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            {activeTab === 'routine_challenge' ? (
              <View style={styles.challengeContainer}>
                <View style={[styles.challengeHeaderTip, isRtl && styles.rowReverse]}>
                  <Text style={[styles.challengeTipText, isRtl && { textAlign: 'right' }]}>
                    🔬 طبق پژوهش‌های علمی شادوئینگ: رعایت توالی ۴ هفته‌ای، تشخیص آوایی و تسلط عضلانی گفتار را تا ۳ برابر سریع‌تر تثبیت می‌کند.
                  </Text>
                </View>
                {challengeWeeks.map((w) => {
                  const IconComp = w.icon;
                  return (
                    <View key={w.week} style={[styles.stepItem, isRtl && styles.rowReverse]}>
                      <View style={[styles.stepIconWrap, { backgroundColor: w.bgColor }]}>
                        <IconComp size={20} color={w.color} />
                      </View>
                      <View style={[styles.stepTexts, isRtl && { alignItems: 'flex-end' }]}>
                        <View style={[styles.weekTitleRow, isRtl && styles.rowReverse]}>
                          <Text style={[styles.stepTitle, { color: w.color }]}>
                            {isRtl ? w.titleFa : w.titleEn}
                          </Text>
                          <View style={styles.speedBadgePill}>
                            <Text style={styles.speedBadgeText}>{w.speedBadge}</Text>
                          </View>
                        </View>
                        <Text style={[styles.weekFocusText, isRtl && { textAlign: 'right' }]}>
                          🎯 {w.focusFa}
                        </Text>
                        <Text style={[styles.stepDesc, isRtl && { textAlign: 'right' }]}>
                          {w.descFa}
                        </Text>
                      </View>
                    </View>
                  );
                })}
              </View>
            ) : (
              currentSteps.map((item) => {
                const IconComp = item.icon;
                return (
                  <View
                    key={item.num}
                    style={[styles.stepItem, isRtl && styles.rowReverse]}
                  >
                    <View style={[styles.stepIconWrap, { backgroundColor: item.bgColor }]}>
                      <IconComp size={20} color={item.color} />
                    </View>
                    <View style={[styles.stepTexts, isRtl && { alignItems: 'flex-end' }]}>
                      <Text style={[styles.stepTitle, { color: item.color }]}>
                        {isRtl ? item.titleFa : item.titleEn}
                      </Text>
                      <Text style={[styles.stepDesc, isRtl && { textAlign: 'right' }]}>
                        {isRtl ? item.descFa : item.descEn}
                      </Text>
                    </View>
                  </View>
                );
              })
            )}
          </ScrollView>

          {/* Quick Warm-up Button */}
          {onOpenWarmUp && (
            <TouchableOpacity
              style={[styles.warmUpGuideBtn, isRtl && styles.rowReverse]}
              activeOpacity={0.85}
              onPress={() => {
                onClose();
                onOpenWarmUp();
              }}
            >
              <Flame size={16} color="#EA580C" />
              <Text style={styles.warmUpGuideBtnText}>
                {isRtl ? '🔥 گرم کردن ۳۰ ثانیه‌ای فک و دهان' : '🔥 30s Vocal & Jaw Warm-up'}
              </Text>
            </TouchableOpacity>
          )}

          {/* Action button */}
          <TouchableOpacity
            style={styles.confirmBtn}
            onPress={onClose}
            activeOpacity={0.85}
          >
            <Check size={18} color="#FFF" />
            <Text style={styles.confirmBtnText}>
              {isRtl ? 'متوجه شدم! شروع تمرین 🚀' : 'Got it! Start Practice 🚀'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  cardContainer: {
    width: '100%',
    maxWidth: 390,
    maxHeight: '85%',
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    ...SHADOWS.level2,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  headerTexts: {
    flex: 1,
  },
  titleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  titleBadgeText: {
    fontFamily: FONT_FAMILY.bold,
    fontSize: 12,
    color: COLORS.primary,
  },
  mainTitle: {
    fontFamily: FONT_FAMILY.bold,
    fontSize: 16,
    color: '#1F2937',
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#F3F4F6',
    borderRadius: 14,
    padding: 4,
    gap: 6,
    marginBottom: 14,
  },
  tabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 9,
    borderRadius: 11,
  },
  tabBtnActiveSmart: {
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: 'rgba(5, 150, 105, 0.25)',
    ...SHADOWS.level1,
  },
  tabBtnActiveClassic: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: 'rgba(37, 99, 235, 0.25)',
    ...SHADOWS.level1,
  },
  tabBtnActiveChallenge: {
    backgroundColor: '#EEF2FF',
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.25)',
    ...SHADOWS.level1,
  },
  tabBtnText: {
    fontFamily: FONT_FAMILY.bold,
    fontSize: 11.5,
    color: '#6B7280',
  },
  tabBtnTextActiveSmart: {
    color: '#059669',
  },
  tabBtnTextActiveClassic: {
    color: '#2563EB',
  },
  tabBtnTextActiveChallenge: {
    color: '#4F46E5',
  },
  challengeContainer: {
    gap: 10,
  },
  challengeHeaderTip: {
    backgroundColor: '#F5F3FF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#DDD6FE',
    padding: 10,
    marginBottom: 4,
  },
  challengeTipText: {
    fontFamily: FONT_FAMILY.regular,
    fontSize: 11.5,
    lineHeight: 18,
    color: '#5B21B6',
  },
  weekTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 3,
  },
  speedBadgePill: {
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#C7D2FE',
  },
  speedBadgeText: {
    fontFamily: FONT_FAMILY.bold,
    fontSize: 10.5,
    color: '#4338CA',
  },
  weekFocusText: {
    fontFamily: FONT_FAMILY.medium,
    fontSize: 11.5,
    color: '#1E293B',
    marginBottom: 3,
    lineHeight: 16,
  },
  scrollList: {
    maxHeight: 340,
  },
  scrollContent: {
    gap: 10,
    paddingBottom: 8,
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  stepIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  stepTexts: {
    flex: 1,
  },
  stepTitle: {
    fontFamily: FONT_FAMILY.bold,
    fontSize: 13,
    marginBottom: 3,
  },
  stepDesc: {
    fontFamily: FONT_FAMILY.regular,
    fontSize: 11.5,
    color: '#4B5563',
    lineHeight: 17,
  },
  warmUpGuideBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#FFF7ED',
    borderWidth: 1,
    borderColor: '#FED7AA',
    borderRadius: 14,
    paddingVertical: 10,
    marginTop: 10,
  },
  warmUpGuideBtnText: {
    fontFamily: FONT_FAMILY.bold,
    fontSize: 12.5,
    color: '#EA580C',
  },
  confirmBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: COLORS.primary,
    borderRadius: 16,
    paddingVertical: 13,
    marginTop: 14,
    ...SHADOWS.level1,
  },
  confirmBtnText: {
    fontFamily: FONT_FAMILY.bold,
    fontSize: 14,
    color: '#FFFFFF',
  },
  rowReverse: {
    flexDirection: 'row-reverse',
  },
});
