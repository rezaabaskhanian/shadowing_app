import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { BookOpen, Check, Clock, Sparkles, Trash2, X } from 'lucide-react-native';
import { COLORS, BORDER_RADIUS } from '../theme/colors';
import { FONT_FAMILY } from '../theme/typography';
import { SHADOWS } from '../theme/elevation';
import { ProgressRing } from '../components/ProgressRing';
import { useVocab, MAX_LEVEL, isDue, dueLabel, BoxWord } from '../data/VocabContext';
import { useLanguage } from '../data/i18n';

const SWIPE_THRESHOLD = 120;

export const LeitnerScreen = () => {
  const { box, promote, demote, remove } = useVocab();
  const { t, language } = useLanguage();
  const [dueOnly, setDueOnly] = useState(true);
  const [index, setIndex] = useState(0);

  const dueCount = box.filter(isDue).length;
  const list = (dueOnly ? box.filter(isDue) : box).sort(
    (a, b) => a.level - b.level || a.nextReview - b.nextReview
  );

  useEffect(() => {
    setIndex(0);
  }, [dueOnly, box.length]);

  const current = list[index];
  const isDone = list.length > 0 && index >= list.length;

  const handleAdvance = (direction: 'know' | 'forgot') => {
    if (!current) return;
    if (direction === 'know') promote(current.word);
    else demote(current.word);
    setIndex((i) => i + 1);
  };

  return (
    <View style={styles.screen}>
      <View style={styles.scrollContent}>
        {/* Top Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.kicker}>LEITNER SYSTEM</Text>
            <Text style={styles.headerTitle}>{t('leitnerBoxTitle')}</Text>
          </View>
          <View style={styles.badge}>
            <BookOpen size={16} color={COLORS.primary} />
            <Text style={styles.badgeText}>{box.length} {t('wordsUnit')}</Text>
          </View>
        </View>

        <Text style={styles.subtitle}>{t('leitnerSubtitle')}</Text>

        {/* Today vs All Filter Tabs */}
        <View style={styles.filterRow}>
          <TouchableOpacity
            style={[styles.filterTab, dueOnly && styles.filterTabActive]}
            onPress={() => setDueOnly(true)}
            activeOpacity={0.8}
          >
            <Clock size={14} color={dueOnly ? COLORS.white : COLORS.primary} />
            <Text style={[styles.filterTabText, dueOnly && styles.filterTabTextActive]}>
              {t('today')} ({dueCount})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterTab, !dueOnly && styles.filterTabActive]}
            onPress={() => setDueOnly(false)}
            activeOpacity={0.8}
          >
            <Sparkles size={14} color={!dueOnly ? COLORS.white : COLORS.tertiary} />
            <Text style={[styles.filterTabText, !dueOnly && styles.filterTabTextActive]}>
              {t('all')} ({box.length})
            </Text>
          </TouchableOpacity>
        </View>

        {/* Body */}
        {box.length === 0 ? (
          <EmptyState
            icon={<BookOpen size={44} color={COLORS.muted} />}
            title={t('leitnerEmptyTitle')}
            text={t('leitnerEmptyText')}
          />
        ) : list.length === 0 ? (
          <EmptyState
            icon={<Sparkles size={44} color={COLORS.tertiary} />}
            title={t('leitnerNoDueTitle')}
            text={t('leitnerNoDueText')}
          />
        ) : isDone ? (
          <View style={styles.doneWrap}>
            <EmptyState
              icon={<Sparkles size={44} color={COLORS.tertiary} />}
              title={t('leitnerDoneTitle')}
              text={t('leitnerDoneText')}
            />
            <TouchableOpacity style={styles.reviewAgainBtn} onPress={() => setIndex(0)}>
              <Text style={styles.reviewAgainText}>{t('reviewAgain')}</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <View style={styles.progressRow}>
              <ProgressRing percent={(index / list.length) * 100} size={44} strokeWidth={5}>
                <Text style={styles.progressRingText}>
                  {index + 1}/{list.length}
                </Text>
              </ProgressRing>
              <TouchableOpacity
                style={styles.removeLink}
                onPress={() => {
                  remove(current.word);
                  setIndex((i) => Math.min(i, Math.max(0, list.length - 2)));
                }}
              >
                <Trash2 color={COLORS.muted} size={14} />
                <Text style={styles.removeLinkText}>{t('removeWord')}</Text>
              </TouchableOpacity>
            </View>

            <Flashcard
              key={current.word}
              item={current}
              language={language}
              onSwipeKnow={() => handleAdvance('know')}
              onSwipeForgot={() => handleAdvance('forgot')}
            />

            <View style={styles.actionsRow}>
              <TouchableOpacity
                style={[styles.actionBtn, styles.forgotBtn]}
                onPress={() => handleAdvance('forgot')}
                activeOpacity={0.85}
              >
                <X color={COLORS.white} size={20} />
                <Text style={styles.actionText}>{t('forgotIt')}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionBtn, styles.knewBtn]}
                onPress={() => handleAdvance('know')}
                activeOpacity={0.85}
              >
                <Check color={COLORS.white} size={20} />
                <Text style={styles.actionText}>{t('knewIt')}</Text>
              </TouchableOpacity>
            </View>
          </>
        )}
      </View>
    </View>
  );
};

const EmptyState = ({
  icon,
  title,
  text,
}: {
  icon: React.ReactNode;
  title: string;
  text: string;
}) => (
  <View style={styles.emptyContainer}>
    <View style={{ marginBottom: 12 }}>{icon}</View>
    <Text style={styles.emptyTitle}>{title}</Text>
    <Text style={styles.emptyText}>{text}</Text>
  </View>
);

// SINGLE FLASHCARD: tap to flip word/meaning, swipe right = knew it, swipe left = forgot
const Flashcard = ({
  item,
  language,
  onSwipeKnow,
  onSwipeForgot,
}: {
  item: BoxWord;
  language: 'en' | 'fa';
  onSwipeKnow: () => void;
  onSwipeForgot: () => void;
}) => {
  const { t } = useLanguage();
  const translateX = useSharedValue(0);
  const flip = useSharedValue(0);

  const toggleFlip = () => {
    flip.value = withTiming(flip.value === 0 ? 1 : 0, { duration: 320 });
  };

  const pan = Gesture.Pan()
    .onUpdate((e) => {
      translateX.value = e.translationX;
    })
    .onEnd((e) => {
      if (e.translationX > SWIPE_THRESHOLD) {
        translateX.value = withTiming(600, { duration: 220 }, () => {
          runOnJS(onSwipeKnow)();
        });
      } else if (e.translationX < -SWIPE_THRESHOLD) {
        translateX.value = withTiming(-600, { duration: 220 }, () => {
          runOnJS(onSwipeForgot)();
        });
      } else {
        translateX.value = withSpring(0);
      }
    });

  const tap = Gesture.Tap().onEnd(() => {
    runOnJS(toggleFlip)();
  });

  const gesture = Gesture.Race(pan, tap);

  const cardStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      {
        rotate: `${interpolate(translateX.value, [-300, 0, 300], [-12, 0, 12])}deg`,
      },
    ],
  }));

  const frontStyle = useAnimatedStyle(() => ({
    transform: [
      { perspective: 1200 },
      { rotateY: `${interpolate(flip.value, [0, 1], [0, 180])}deg` },
    ],
    opacity: flip.value < 0.5 ? 1 : 0,
  }));

  const backStyle = useAnimatedStyle(() => ({
    transform: [
      { perspective: 1200 },
      { rotateY: `${interpolate(flip.value, [0, 1], [-180, 0])}deg` },
    ],
    opacity: flip.value >= 0.5 ? 1 : 0,
  }));

  const knowLabelStyle = useAnimatedStyle(() => ({
    opacity: interpolate(translateX.value, [10, SWIPE_THRESHOLD], [0, 1]),
  }));

  const forgotLabelStyle = useAnimatedStyle(() => ({
    opacity: interpolate(translateX.value, [-SWIPE_THRESHOLD, -10], [1, 0]),
  }));

  return (
    <GestureDetector gesture={gesture}>
      <Animated.View style={[styles.cardWrap, cardStyle]}>
        <Animated.View style={[styles.swipeLabel, styles.knowLabel, knowLabelStyle]}>
          <Text style={styles.swipeLabelText}>{t('knewIt')}</Text>
        </Animated.View>
        <Animated.View style={[styles.swipeLabel, styles.forgotLabel, forgotLabelStyle]}>
          <Text style={styles.swipeLabelText}>{t('forgotIt')}</Text>
        </Animated.View>

        <Animated.View style={[styles.card, styles.cardFace, frontStyle]}>
          <View style={styles.levelBadge}>
            <Text style={styles.levelText}>
              {t('level')} {item.level}/{MAX_LEVEL}
            </Text>
          </View>
          <Text style={styles.word}>{item.word}</Text>
          <View style={[styles.dueBadge, isDue(item) && styles.dueBadgeNow]}>
            <Clock color={isDue(item) ? COLORS.primary : COLORS.textSecondary} size={11} />
            <Text style={[styles.dueText, isDue(item) && styles.dueTextNow]}>
              {dueLabel(item, language)}
            </Text>
          </View>
          <Text style={styles.tapHint}>{t('tapToReveal')}</Text>
        </Animated.View>

        <Animated.View style={[styles.card, styles.cardFace, styles.cardBack, backStyle]}>
          <Text style={styles.meaning}>{item.meaning}</Text>
        </Animated.View>
      </Animated.View>
    </GestureDetector>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 54,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  kicker: {
    color: COLORS.primary,
    fontFamily: FONT_FAMILY.bold,
    fontSize: 12,
    letterSpacing: 1,
  },
  headerTitle: {
    color: COLORS.text,
    fontFamily: FONT_FAMILY.bold,
    fontSize: 26,
    marginTop: 2,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 6,
  },
  badgeText: {
    color: COLORS.text,
    fontFamily: FONT_FAMILY.semiBold,
    fontSize: 13,
  },
  subtitle: {
    color: COLORS.textSecondary,
    fontFamily: FONT_FAMILY.regular,
    fontSize: 13,
    marginBottom: 20,
    lineHeight: 20,
  },
  filterRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  filterTab: {
    flex: 1,
    height: 42,
    borderRadius: 21,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  filterTabActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  filterTabText: {
    color: COLORS.textSecondary,
    fontFamily: FONT_FAMILY.bold,
    fontSize: 13,
  },
  filterTabTextActive: {
    color: COLORS.white,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 24,
    padding: 32,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginTop: 12,
  },
  emptyTitle: {
    color: COLORS.text,
    fontFamily: FONT_FAMILY.bold,
    fontSize: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyText: {
    color: COLORS.textSecondary,
    fontFamily: FONT_FAMILY.regular,
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 20,
  },
  doneWrap: {
    alignItems: 'center',
  },
  reviewAgainBtn: {
    marginTop: 20,
    backgroundColor: COLORS.primary,
    borderRadius: 28,
    height: 52,
    paddingHorizontal: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reviewAgainText: {
    color: COLORS.white,
    fontFamily: FONT_FAMILY.bold,
    fontSize: 15,
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  progressRingText: {
    color: COLORS.text,
    fontFamily: FONT_FAMILY.bold,
    fontSize: 11,
  },
  removeLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  removeLinkText: {
    color: COLORS.muted,
    fontFamily: FONT_FAMILY.medium,
    fontSize: 12,
  },
  cardWrap: {
    flex: 1,
    minHeight: 340,
  },
  card: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.xl,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 28,
    alignItems: 'center',
    justifyContent: 'center',
    backfaceVisibility: 'hidden',
    ...SHADOWS.level1,
  },
  cardFace: {
    gap: 14,
  },
  cardBack: {
    backgroundColor: COLORS.primaryLight,
    borderColor: COLORS.primary,
  },
  word: {
    color: COLORS.text,
    fontFamily: FONT_FAMILY.bold,
    fontSize: 30,
    textAlign: 'center',
  },
  meaning: {
    color: COLORS.primary,
    fontFamily: FONT_FAMILY.bold,
    fontSize: 24,
    textAlign: 'center',
  },
  tapHint: {
    color: COLORS.muted,
    fontFamily: FONT_FAMILY.regular,
    fontSize: 12,
    position: 'absolute',
    bottom: 20,
  },
  levelBadge: {
    position: 'absolute',
    top: 20,
    backgroundColor: COLORS.backgroundSoft,
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  levelText: {
    color: COLORS.primary,
    fontFamily: FONT_FAMILY.bold,
    fontSize: 11,
  },
  dueBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.backgroundSoft,
  },
  dueBadgeNow: {
    borderColor: COLORS.primary,
  },
  dueText: {
    color: COLORS.textSecondary,
    fontFamily: FONT_FAMILY.medium,
    fontSize: 11,
  },
  dueTextNow: {
    color: COLORS.primary,
  },
  swipeLabel: {
    position: 'absolute',
    top: 24,
    zIndex: 10,
    borderRadius: 12,
    borderWidth: 2,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  knowLabel: {
    right: 20,
    borderColor: COLORS.tertiary,
    backgroundColor: COLORS.tertiaryLight,
    transform: [{ rotate: '12deg' }],
  },
  forgotLabel: {
    left: 20,
    borderColor: COLORS.error,
    backgroundColor: 'rgba(186,26,26,0.1)',
    transform: [{ rotate: '-12deg' }],
  },
  swipeLabelText: {
    fontFamily: FONT_FAMILY.bold,
    fontSize: 14,
    color: COLORS.text,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginTop: 20,
    marginBottom: 24,
  },
  actionBtn: {
    flex: 1,
    height: 56,
    borderRadius: 28,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  knewBtn: {
    backgroundColor: COLORS.tertiary,
  },
  forgotBtn: {
    backgroundColor: COLORS.error,
  },
  actionText: {
    color: COLORS.white,
    fontFamily: FONT_FAMILY.bold,
    fontSize: 14,
  },
});
