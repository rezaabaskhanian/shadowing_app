import React from 'react';
import {
  BackHandler,
  ImageBackground,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import {
  BookOpen,
  Clock,
  Flame,
  Globe,
  Mic,
  Play,
  Sparkles,
} from 'lucide-react-native';
import { ScenarioCard } from '../components/ScenarioCard';
import { useScenes } from '../data/ScenesContext';
import { useVocab, isDue } from '../data/VocabContext';
import { useLanguage } from '../data/i18n';
import { COLORS } from '../theme/colors';

export const HomeScreen = () => {
  const navigation = useNavigation<any>();
  const { scenes } = useScenes();
  const { language, setLanguage, t } = useLanguage();
  const { box } = useVocab();
  const dueCount = box.filter(isDue).length;

  // Exit app when pressing hardware back button on Home screen
  useFocusEffect(
    React.useCallback(() => {
      const onBackPress = () => {
        BackHandler.exitApp();
        return true;
      };

      const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
      return () => subscription.remove();
    }, [])
  );

  const primaryScenario = scenes[0] || {
    id: 'supermarket',
    title: 'The Last Can of Tuna',
    category: 'SUPERMARKET · CHAPTER 2',
    level: 'A2',
    time: '12 min',
    imageUri: 'https://images.unsplash.com/photo-1542838132-92c53300491e?q=80&w=1000&auto=format&fit=crop',
  };

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'fa' : 'en');
  };

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* HEADER TOP ROW */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>{t('goodEvening')}</Text>
            <Text style={styles.headerTitle}>{t('readyToStepIn')}</Text>
          </View>

          <View style={styles.headerActions}>
            {/* Language Selector */}
            <TouchableOpacity style={styles.langBadge} onPress={toggleLanguage}>
              <Globe size={14} color={COLORS.amber} />
              <Text style={styles.langBadgeText}>{language.toUpperCase()}</Text>
            </TouchableOpacity>

            {/* Streak Badge */}
            <View style={styles.streakBadge}>
              <Flame size={16} color={COLORS.amber} fill={COLORS.amber} />
              <Text style={styles.streakText}>14</Text>
            </View>
          </View>
        </View>

        {/* TODAY'S SHADOWING PROGRESS CARD */}
        <View style={styles.progressCard}>
          <View style={styles.progressCardHeader}>
            <View style={styles.progressTitleRow}>
              <Mic size={18} color={COLORS.teal} />
              <Text style={styles.progressCardTitle}>{t('todaysShadowing')}</Text>
            </View>
            <Text style={styles.repsText}>
              38 / 60 <Text style={styles.repsUnit}>{t('repsCount')}</Text>
            </Text>
          </View>

          {/* Teal Progress Bar */}
          <View style={styles.progressBarBg}>
            <View style={[styles.progressBarFill, { width: '63%' }]} />
          </View>

          <View style={styles.progressCardFooter}>
            <View style={styles.statInfoItem}>
              <Clock size={14} color={COLORS.textSecondary} />
              <Text style={styles.statInfoText}>11 {t('min')}</Text>
            </View>
            <View style={styles.statInfoItem}>
              <Sparkles size={14} color={COLORS.teal} />
              <Text style={styles.statInfoText}>{t('fluency')} 72%</Text>
            </View>
          </View>
        </View>

        {/* QUICK ACCESS: SHADOWING & LEITNER BOX */}
        <View style={styles.quickActionsRow}>
          <TouchableOpacity
            style={styles.quickCard}
            onPress={() => navigation.navigate('Shadowing', { scenarioId: primaryScenario.id })}
            activeOpacity={0.85}
          >
            <View style={[styles.quickIconCircle, { backgroundColor: COLORS.amber }]}>
              <Mic size={20} color={COLORS.black} />
            </View>
            <View style={styles.quickTextContainer}>
              <Text style={styles.quickCardTitle}>{t('shadowing')}</Text>
              <Text style={styles.quickCardSub}>{t('continueStory')}</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickCard}
            onPress={() => navigation.navigate('Leitner')}
            activeOpacity={0.85}
          >
            <View style={[styles.quickIconCircle, { backgroundColor: COLORS.teal }]}>
              <BookOpen size={20} color={COLORS.black} />
            </View>
            <View style={styles.quickTextContainer}>
              <Text style={styles.quickCardTitle}>{t('leitner')}</Text>
              <Text style={styles.quickCardSub}>
                {dueCount > 0
                  ? `${dueCount} ${t('wordsDue')}`
                  : `${box.length} ${t('wordsSaved')}`}
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* CONTINUE STORY SECTION */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionLabel}>{t('continueStory')}</Text>
        </View>

        <TouchableOpacity
          activeOpacity={0.9}
          style={styles.storyCard}
          onPress={() => navigation.navigate('Shadowing', { scenarioId: primaryScenario.id })}
        >
          <ImageBackground
            source={
              typeof primaryScenario.imageUri === 'string'
                ? { uri: primaryScenario.imageUri }
                : primaryScenario.imageUri
            }
            style={styles.storyImage}
            imageStyle={styles.storyImageStyle}
          >
            <View style={styles.storyScrim} />

            <View style={styles.storyContent}>
              <Text style={styles.storyCategory}>
                SUPERMARKET · CHAPTER 2
              </Text>
              <Text style={styles.storyTitle}>{primaryScenario.title}</Text>

              {/* Progress Line */}
              <View style={styles.storyProgressBg}>
                <View style={[styles.storyProgressFill, { width: '35%' }]} />
              </View>
            </View>

            {/* Play Circle CTA Overlay */}
            <View style={styles.playOverlayBtn}>
              <Play size={22} color={COLORS.black} fill={COLORS.black} />
            </View>
          </ImageBackground>
        </TouchableOpacity>

        {/* WORLDS SECTION */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionLabel}>{t('worlds')}</Text>
        </View>

        <View style={styles.worldsList}>
          {scenes.map((scenario, index) => (
            <ScenarioCard
              key={scenario.id || index}
              title={scenario.title}
              level={scenario.level || 'A2'}
              progress={scenario.progress || (index === 1 ? 100 : 0)}
              time={scenario.time || '12 min'}
              imageUri={scenario.imageUri}
              subtitle={scenario.lesson || scenario.title}
              sentencesCount={scenario.sentencesCount || 24}
              isCompleted={index === 1}
              onPress={() => navigation.navigate('Shadowing', { scenarioId: scenario.id })}
            />
          ))}
        </View>

        {/* Bottom padding for tab bar */}
        <View style={{ height: 90 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 54,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  greeting: {
    color: COLORS.textSecondary,
    fontSize: 14,
    fontWeight: '500',
  },
  headerTitle: {
    color: COLORS.text,
    fontSize: 26,
    fontWeight: '800',
    marginTop: 2,
    letterSpacing: -0.5,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  langBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 4,
  },
  langBadgeText: {
    color: COLORS.text,
    fontSize: 12,
    fontWeight: '700',
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 6,
  },
  streakText: {
    color: COLORS.text,
    fontSize: 15,
    fontWeight: '700',
  },
  progressCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 24,
    padding: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 24,
  },
  progressCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  progressTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  progressCardTitle: {
    color: COLORS.text,
    fontSize: 15,
    fontWeight: '700',
  },
  repsText: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: '700',
  },
  repsUnit: {
    color: COLORS.textSecondary,
    fontWeight: '400',
    fontSize: 12,
  },
  progressBarBg: {
    height: 8,
    backgroundColor: COLORS.surfaceLight,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 12,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: COLORS.teal,
    borderRadius: 4,
  },
  progressCardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  statInfoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statInfoText: {
    color: COLORS.textSecondary,
    fontSize: 13,
  },
  sectionHeader: {
    marginBottom: 12,
  },
  sectionLabel: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.1,
  },
  storyCard: {
    height: 200,
    borderRadius: 28,
    overflow: 'hidden',
    marginBottom: 28,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  storyImage: {
    width: '100%',
    height: '100%',
    justifyContent: 'flex-end',
  },
  storyImageStyle: {
    borderRadius: 28,
  },
  storyScrim: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(12, 16, 23, 0.45)',
  },
  storyContent: {
    padding: 20,
    paddingRight: 80,
  },
  storyCategory: {
    color: COLORS.amber,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  storyTitle: {
    color: COLORS.text,
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 14,
  },
  storyProgressBg: {
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    borderRadius: 2,
    overflow: 'hidden',
    width: '100%',
  },
  storyProgressFill: {
    height: '100%',
    backgroundColor: COLORS.amber,
    borderRadius: 2,
  },
  playOverlayBtn: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: COLORS.amber,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.amber,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 6,
  },
  worldsList: {
    gap: 4,
  },
  quickActionsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  quickCard: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 10,
  },
  quickIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickTextContainer: {
    flex: 1,
  },
  quickCardTitle: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: '800',
  },
  quickCardSub: {
    color: COLORS.textSecondary,
    fontSize: 11,
    fontWeight: '500',
    marginTop: 2,
  },
});