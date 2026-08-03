import React from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Award, BarChart2, CheckCircle2, Play, Settings, User as UserIcon } from 'lucide-react-native';
import { ScenarioCard } from '../components/ScenarioCard';
import { useScenes } from '../data/ScenesContext';
import { COLORS } from '../theme/colors';
import { useLanguage } from '../data/i18n';

export { HomeScreen } from './Home';

export const ScenesScreen = () => {
  const navigation = useNavigation<any>();
  const { scenes } = useScenes();
  const { t } = useLanguage();

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
      <View style={styles.topBar}>
        <Text style={styles.kicker}>{t('worlds')}</Text>
        <TouchableOpacity style={styles.iconButton} onPress={() => navigation.navigate('Profile')}>
          <Settings color={COLORS.text} size={20} />
        </TouchableOpacity>
      </View>
      <Text style={styles.pageTitle}>{t('chooseScenarioTitle')}</Text>
      <Text style={styles.pageSub}>{t('chooseScenarioSub')}</Text>

      <View style={styles.featuredList}>
        {scenes.map((scenario) => (
          <ScenarioCard
            key={scenario.id}
            title={scenario.title}
            level={scenario.level}
            progress={scenario.progress}
            time={scenario.time}
            imageUri={scenario.imageUri}
            color={scenario.color}
            subtitle={scenario.lesson}
            onPress={() => navigation.navigate('Shadowing', { scenarioId: scenario.id })}
          />
        ))}
      </View>
    </ScrollView>
  );
};

export const ProgressScreen = () => {
  const { t } = useLanguage();

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
      <Text style={styles.pageTitle}>{t('greatJobTitle')}</Text>
      <Text style={styles.pageSub}>{t('greatJobSub')}</Text>

      <View style={styles.scoreCard}>
        <View style={styles.scoreRing}>
          <Text style={styles.scoreValue}>87</Text>
          <Text style={styles.scoreLabel}>{t('overallScore')}</Text>
        </View>
        <View style={styles.scoreRow}>
          <View style={styles.scoreMetric}>
            <Text style={styles.metricValue}>90%</Text>
            <Text style={styles.metricLabel}>{t('pronunciation')}</Text>
          </View>
          <View style={styles.scoreMetric}>
            <Text style={styles.metricValue}>83%</Text>
            <Text style={styles.metricLabel}>{t('fluency')}</Text>
          </View>
        </View>
      </View>

      <View style={styles.practiceCard}>
        <Text style={styles.cardTitle}>{t('compareAudio')}</Text>
        <View style={styles.waveRow}>
          <TouchableOpacity style={styles.playCircle}>
            <Play color={COLORS.black} size={18} fill={COLORS.black} />
          </TouchableOpacity>
          <View style={styles.waveform}>
            {Array.from({ length: 28 }).map((_, index) => (
              <View
                key={index}
                style={[
                  styles.waveBar,
                  {
                    height: 8 + ((index * 7) % 24),
                    backgroundColor: index % 2 === 0 ? COLORS.amber : COLORS.teal,
                  },
                ]}
              />
            ))}
          </View>
        </View>
      </View>
    </ScrollView>
  );
};

export const ProfileScreen = () => {
  const { language, setLanguage, t } = useLanguage();

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
      <Text style={styles.pageTitle}>{t('profileTitle')}</Text>
      <Text style={styles.pageSub}>{t('profileSub')}</Text>

      <View style={styles.profileHeader}>
        <View style={styles.avatarCircle}>
          <UserIcon size={36} color={COLORS.amber} />
        </View>
        <Text style={styles.profileName}>Maya</Text>
        <Text style={styles.profileSub}>{t('learnerLevel')}</Text>
      </View>

      <View style={styles.settingCard}>
        <Text style={styles.settingLabel}>{t('appLanguage')}</Text>
        <View style={styles.langToggleRow}>
          <TouchableOpacity
            style={[styles.langBtn, language === 'en' ? styles.langBtnActive : null]}
            onPress={() => setLanguage('en')}
          >
            <Text style={[styles.langBtnText, language === 'en' ? styles.langBtnTextActive : null]}>English</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.langBtn, language === 'fa' ? styles.langBtnActive : null]}
            onPress={() => setLanguage('fa')}
          >
            <Text style={[styles.langBtnText, language === 'fa' ? styles.langBtnTextActive : null]}>فارسی</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 54,
    paddingBottom: 90,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  kicker: {
    color: COLORS.amber,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1,
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pageTitle: {
    color: COLORS.text,
    fontSize: 26,
    fontWeight: '800',
    marginBottom: 4,
  },
  pageSub: {
    color: COLORS.textSecondary,
    fontSize: 14,
    marginBottom: 24,
  },
  featuredList: {
    gap: 4,
  },
  scoreCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 20,
  },
  scoreRing: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 4,
    borderColor: COLORS.amber,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  scoreValue: {
    color: COLORS.text,
    fontSize: 32,
    fontWeight: '800',
  },
  scoreLabel: {
    color: COLORS.textSecondary,
    fontSize: 11,
  },
  scoreRow: {
    flexDirection: 'row',
    gap: 40,
  },
  scoreMetric: {
    alignItems: 'center',
  },
  metricValue: {
    color: COLORS.teal,
    fontSize: 20,
    fontWeight: '800',
  },
  metricLabel: {
    color: COLORS.textSecondary,
    fontSize: 12,
    marginTop: 2,
  },
  practiceCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 24,
    padding: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cardTitle: {
    color: COLORS.text,
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 12,
  },
  waveRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  playCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.amber,
    alignItems: 'center',
    justifyContent: 'center',
  },
  waveform: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    height: 32,
  },
  waveBar: {
    width: 3,
    borderRadius: 1.5,
  },
  profileHeader: {
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 20,
  },
  avatarCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: COLORS.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  profileName: {
    color: COLORS.text,
    fontSize: 20,
    fontWeight: '800',
  },
  profileSub: {
    color: COLORS.textSecondary,
    fontSize: 13,
    marginTop: 2,
  },
  settingCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 24,
    padding: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  settingLabel: {
    color: COLORS.text,
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 12,
  },
  langToggleRow: {
    flexDirection: 'row',
    backgroundColor: COLORS.surfaceLight,
    borderRadius: 14,
    padding: 4,
  },
  langBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 10,
  },
  langBtnActive: {
    backgroundColor: COLORS.amber,
  },
  langBtnText: {
    color: COLORS.textSecondary,
    fontSize: 13,
    fontWeight: '700',
  },
  langBtnTextActive: {
    color: COLORS.black,
  },
});
