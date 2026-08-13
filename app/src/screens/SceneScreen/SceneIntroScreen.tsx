import React from 'react';
import {
  ImageBackground,
  Share,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { ChevronRight, Lightbulb, MessageCircle, Play, Share2, X } from 'lucide-react-native';

import { COLORS } from '../../theme/colors';
import { FONT_FAMILY } from '../../theme/typography';
import { LEVEL_BADGE_STYLE } from '../../components/SceneListCard';
import type { DialogueItem, Scenario } from '../../data/scenarios';

interface SceneIntroScreenProps {
  scenario: Scenario | null;
  dialogueItems: DialogueItem[];
  coverImage: any;
  screenHeight: number;
  showAllDialogues: boolean;
  onShowAllDialogues: () => void;
  onClose: () => void;
  onEnterScene: () => void;
  t: (key: string) => string;
}

/**
 * صفحه‌ی معرفیِ صحنه (قبل از ورود): بنر تصویر، عنوان/سطح/توضیح، آمار
 * هات‌اسپات‌ها/جملات/دقیقه، بنر روش ۴مرحله‌ای، پیش‌نمایش دیالوگ‌ها و دکمه‌ی
 * ورود به صحنه.
 */
export const SceneIntroScreen: React.FC<SceneIntroScreenProps> = ({
  scenario,
  dialogueItems,
  coverImage,
  screenHeight,
  showAllDialogues,
  onShowAllDialogues,
  onClose,
  onEnterScene,
  t,
}) => {
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
            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
              <X size={20} color={COLORS.white} />
            </TouchableOpacity>
            <TouchableOpacity style={[styles.closeBtn, styles.shareBtn]} onPress={handleShare}>
              <Share2 size={18} color={COLORS.white} />
            </TouchableOpacity>
          </ImageBackground>
        </View>

        {/* Scenario Meta Header */}
        <View style={styles.introHeader}>
          <View style={styles.introTitleRow}>
            <Text style={styles.introTitle}>{scenario?.title || 'The Last Can of Tuna'}</Text>
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
        <Text style={styles.conversationsLabel}>{t('dialoguePreview')}</Text>

        <View style={styles.conversationsList}>
          {previewDialogues.map((item, index) => (
            <TouchableOpacity
              key={item.id || index}
              activeOpacity={0.8}
              style={styles.convCard}
              onPress={onEnterScene}
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
            <TouchableOpacity style={styles.moreSentencesRow} onPress={onShowAllDialogues}>
              <Text style={styles.moreSentencesText}>
                {moreSentencesCount} {t('moreSentencesSuffix')}
              </Text>
              <ChevronRight size={16} color={COLORS.textSecondary} />
            </TouchableOpacity>
          )}
        </View>

        {/* Enter Scene CTA Button */}
        <TouchableOpacity activeOpacity={0.88} style={styles.enterCtaBtn} onPress={onEnterScene}>
          <Play size={20} color={COLORS.white} fill={COLORS.white} />
          <Text style={styles.enterCtaText}>{t('enterScene')}</Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
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
});
