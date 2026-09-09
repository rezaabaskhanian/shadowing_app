import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { ArrowLeft, Check, Lock, Play } from 'lucide-react-native';
import Svg, { Line } from 'react-native-svg';

import { COLORS } from '../../theme/colors';
import { FONT_FAMILY } from '../../theme/typography';
import { useLanguage } from '../../data/i18n';
import { useScenes } from '../../data/ScenesContext';
import { useToast } from '../../data/ToastContext';
import type { Scenario } from '../../data/scenarios';

const NODE_SIZE = 68;
const ROW_HEIGHT = 116;
// الگوی زیگزاگ افقی هر ردیف نسبت به مرکز — برای حس «مسیر پیچ‌درپیچ»، نه یک
// ستون صاف کسل‌کننده.
const OFFSET_PATTERN = [0, 72, 0, -72];

type NodeState = 'completed' | 'current' | 'sequenceLocked' | 'subLocked';

// بک‌اند تضمین می‌کند حداکثر یک صحنه‌ی «باز و ناتمام» به‌ازای هر سطح دشواری
// وجود دارد (زنجیره‌ی قفل ترتیبی جدا برای هر سطح است)، پس نیازی به پیداکردن
// «اولین» صحنه در کلِ لیست نیست — هر صحنه‌ی باز-و-ناتمام خودش «فعلیِ» همان
// سطح است.
function nodeState(scenario: Scenario): NodeState {
  if (scenario.isLocked) return 'subLocked';
  if (scenario.isSequenceLocked) return 'sequenceLocked';
  if (scenario.isCompleted) return 'completed';
  return 'current';
}

export const CurriculumMapScreen = () => {
  const navigation = useNavigation<any>();
  const { t } = useLanguage();
  const { scenes } = useScenes();
  const toast = useToast();

  // صحنه‌ها از بک‌اند بر اساس "order" مرتب می‌آیند؛ فقط برای اطمینان اینجا
  // هم صریح مرتب می‌کنیم (اگر fallback محلی بدون order استفاده شد).
  const ordered = [...scenes].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  const completedCount = ordered.filter((s) => s.isCompleted).length;

  const openScene = (scenario: Scenario) => {
    if (scenario.isLocked) {
      navigation.navigate('Paywall');
      return;
    }
    if (scenario.isSequenceLocked) {
      toast.info(t('sequenceLockedMsg'));
      return;
    }
    navigation.navigate('Shadowing', { scenarioId: scenario.id });
  };

  const pathHeight = Math.max(ordered.length * ROW_HEIGHT, ROW_HEIGHT);

  return (
    <View style={styles.screen}>
      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
        <ArrowLeft color={COLORS.text} size={22} />
      </TouchableOpacity>

      <Text style={styles.title}>{t('curriculumMapTitle')}</Text>
      <Text style={styles.sub}>
        {t('curriculumMapSub').replace('{done}', String(completedCount)).replace('{total}', String(ordered.length))}
      </Text>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={[styles.pathArea, { height: pathHeight }]}>
          <Svg style={StyleSheet.absoluteFill} width="100%" height={pathHeight}>
            {ordered.slice(1).map((_, i) => {
              const fromX = OFFSET_PATTERN[i % OFFSET_PATTERN.length];
              const toX = OFFSET_PATTERN[(i + 1) % OFFSET_PATTERN.length];
              const fromY = i * ROW_HEIGHT + ROW_HEIGHT / 2;
              const toY = (i + 1) * ROW_HEIGHT + ROW_HEIGHT / 2;
              return (
                <Line
                  key={i}
                  x1={`${50 + fromX / 3.6}%`}
                  y1={fromY}
                  x2={`${50 + toX / 3.6}%`}
                  y2={toY}
                  stroke={COLORS.border}
                  strokeWidth={4}
                  strokeDasharray="2 10"
                  strokeLinecap="round"
                />
              );
            })}
          </Svg>

          {ordered.map((scenario, index) => {
            const state = nodeState(scenario);
            const offsetX = OFFSET_PATTERN[index % OFFSET_PATTERN.length];
            return (
              <View
                key={scenario.id}
                style={[styles.row, { top: index * ROW_HEIGHT, transform: [{ translateX: offsetX }] }]}
              >
                <NodeBubble state={state} onPress={() => openScene(scenario)} />
                <View style={[styles.label, offsetX > 0 ? styles.labelLeft : offsetX < 0 ? styles.labelRight : styles.labelCenter]}>
                  <Text style={styles.labelTitle} numberOfLines={1}>{scenario.title}</Text>
                  <Text style={styles.labelLevel}>{scenario.level}</Text>
                </View>
              </View>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
};

const NodeBubble: React.FC<{ state: NodeState; onPress: () => void }> = ({ state, onPress }) => {
  const bg =
    state === 'completed'
      ? COLORS.tertiary
      : state === 'current'
      ? COLORS.primary
      : state === 'sequenceLocked'
      ? COLORS.warningLight
      : COLORS.surfaceHigh;
  const iconColor = state === 'completed' || state === 'current' ? COLORS.white : state === 'sequenceLocked' ? COLORS.warningDeep : COLORS.muted;

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      style={[styles.node, { backgroundColor: bg }, state === 'current' && styles.nodeCurrent]}
    >
      {state === 'completed' ? (
        <Check color={iconColor} size={26} />
      ) : state === 'current' ? (
        <Play color={iconColor} size={24} fill={iconColor} />
      ) : (
        <Lock color={iconColor} size={22} />
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.background,
    paddingTop: 54,
    paddingHorizontal: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    color: COLORS.text,
    fontFamily: FONT_FAMILY.bold,
    fontSize: 24,
    marginBottom: 6,
  },
  sub: {
    color: COLORS.textSecondary,
    fontFamily: FONT_FAMILY.regular,
    fontSize: 14,
    marginBottom: 12,
  },
  scrollContent: {
    paddingBottom: 60,
    paddingTop: 16,
  },
  pathArea: {
    width: '100%',
    position: 'relative',
  },
  row: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  node: {
    width: NODE_SIZE,
    height: NODE_SIZE,
    borderRadius: NODE_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: COLORS.surface,
    elevation: 3,
    shadowColor: COLORS.black,
    shadowOpacity: 0.12,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
  },
  nodeCurrent: {
    borderColor: COLORS.primaryLight,
    borderWidth: 4,
  },
  label: {
    marginTop: 6,
    maxWidth: 140,
  },
  labelCenter: { alignItems: 'center' },
  labelLeft: { alignItems: 'center' },
  labelRight: { alignItems: 'center' },
  labelTitle: {
    color: COLORS.text,
    fontFamily: FONT_FAMILY.semiBold,
    fontSize: 13,
    textAlign: 'center',
  },
  labelLevel: {
    color: COLORS.muted,
    fontFamily: FONT_FAMILY.regular,
    fontSize: 11,
    textAlign: 'center',
  },
});
