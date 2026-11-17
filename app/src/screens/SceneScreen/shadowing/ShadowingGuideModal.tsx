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
  Check,
  Headphones,
  HelpCircle,
  Layers,
  Mic,
  Sparkles,
  Volume2,
  X,
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
}) => {
  const isRtl = language === 'fa';
  const [activeTab, setActiveTab] = useState<PracticeFlowMode>(initialMode);

  useEffect(() => {
    if (visible) {
      setActiveTab(initialMode || 'smart_flow');
    }
  }, [visible, initialMode]);

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
      titleFa: '۲. پخش جمله و اعلام آمادگی',
      titleEn: '2. Sentence & Get Ready',
      descFa:
        'هر جمله جداگانه پخش می‌شود. پس از پایان، دکمه «آماده‌ام! 🚀» ظاهر شده و با ۳ ثانیه شمارش معکوس به شما زمان آماده‌شدن می‌دهد.',
      descEn:
        'Each sentence plays separately. Tap "I\'m Ready! 🚀" to trigger a 3-second countdown before speaking.',
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

  const handleTabChange = (mode: PracticeFlowMode) => {
    setActiveTab(mode);
    onSelectMode?.(mode);
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
          </View>

          {/* Steps List */}
          <ScrollView
            style={styles.scrollList}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            {currentSteps.map((item) => {
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
            })}
          </ScrollView>

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
  tabBtnText: {
    fontFamily: FONT_FAMILY.bold,
    fontSize: 12.5,
    color: '#6B7280',
  },
  tabBtnTextActiveSmart: {
    color: '#059669',
  },
  tabBtnTextActiveClassic: {
    color: '#2563EB',
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
