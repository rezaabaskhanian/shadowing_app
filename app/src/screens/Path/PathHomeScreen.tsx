import React, { useCallback, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  BookOpen,
  Check,
  ChevronDown,
  ChevronUp,
  Film,
  Flag,
  Headphones,
  Layers,
  Lock,
  Mic,
  Repeat,
  X,
} from 'lucide-react-native';

import { COLORS, SPACING, BORDER_RADIUS } from '../../theme/colors';
import { FONT_FAMILY, TEXT_STYLES } from '../../theme/typography';
import { SHADOWS } from '../../theme/elevation';
import { useLanguage } from '../../data/i18n';
import { completePathItem, getPath, type LearningPath, type PathItem, type PathWeek } from '../../api/path';
import { track } from '../../services/analytics';

const KIND_ICON: Record<string, React.ComponentType<{ size?: number; color?: string }>> = {
  scene: BookOpen,
  podcast: Headphones,
  video_clip: Film,
  speaking_topic: Mic,
  leitner_review: Layers,
  weak_lines: Repeat,
  checkpoint: Flag,
};

/** هفته‌ای که الان باید رویش کار کرد: اولین هفته‌ی بازِ تمام‌نشده (یا آخرین هفته). */
function currentWeekIndex(weeks: PathWeek[]): number {
  const i = weeks.findIndex((w) => w.unlocked && !w.done);
  return i >= 0 ? i : Math.max(0, weeks.length - 1);
}

/**
 * «مسیر آموزشی» یک سطح: هفته‌ها، جلسه‌های هر هفته و قدم‌های هر جلسه. جلسه‌ها
 * با انجام دادن باز می‌شوند (نه با گذشت روز). صحنه‌ها خودکار تیک می‌خورند؛
 * قدم‌های اختیاری (پادکست، لایتنر) با باز کردنشان تمام‌شده حساب می‌شوند.
 */
export const PathHomeScreen: React.FC = () => {
  const { t } = useLanguage();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const level: string = route.params?.level || 'starter';

  const [path, setPath] = useState<LearningPath | null>(null);
  const [error, setError] = useState(false);
  const [openWeek, setOpenWeek] = useState<number | null>(null);

  const load = useCallback(() => {
    setError(false);
    getPath(level)
      .then((p) => {
        setPath(p);
        setOpenWeek((prev) => (prev === null ? currentWeekIndex(p.weeks || []) : prev));
      })
      .catch(() => setError(true));
  }, [level]);

  useFocusEffect(load);

  const weeks = path?.weeks || [];
  const weeksDone = weeks.filter((w) => w.done).length;

  const openItem = (week: PathWeek, item: PathItem) => {
    track('path_item_opened', item.kind);
    // قدم‌های اختیاری با باز کردن تمام‌شده حساب می‌شوند؛ صحنه از پیشرفت خودِ صحنه،
    // جمله‌های سخت و Checkpoint از پایان صفحه‌ی خودشان ثبت می‌شوند.
    const markOnOpen = !['scene', 'weak_lines', 'checkpoint'].includes(item.kind);
    if (markOnOpen && !item.done) completePathItem(week.id, item.key).catch(() => {});

    switch (item.kind) {
      case 'scene':
        navigation.navigate('Shadowing', { scenarioId: item.ref_id });
        break;
      case 'podcast':
        navigation.navigate('Podcast', { podcastId: item.ref_id, openedAt: Date.now() });
        break;
      case 'video_clip':
        navigation.navigate('VideoClip', { clipId: item.ref_id, openedAt: Date.now() });
        break;
      case 'speaking_topic':
        navigation.navigate('TopicList');
        break;
      case 'leitner_review':
        navigation.navigate('Leitner');
        break;
      case 'weak_lines': {
        const sceneIds = week.sessions.flatMap((s) =>
          s.items.filter((i) => i.kind === 'scene' && i.ref_id).map((i) => i.ref_id as string)
        );
        navigation.navigate('PathWeakLines', { weekId: week.id, itemKey: item.key, sceneIds, openedAt: Date.now() });
        break;
      }
      case 'checkpoint':
        navigation.navigate('PathCheckpoint', {
          weekId: week.id,
          weekTitle: week.title_fa,
          weekPosition: week.position,
          openedAt: Date.now(),
        });
        break;
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top + SPACING.s }]}>
      <View style={styles.topRow}>
        <TouchableOpacity style={styles.closeBtn} onPress={() => navigation.goBack()} activeOpacity={0.8}>
          <X size={20} color={COLORS.text} />
        </TouchableOpacity>
      </View>

      {error && (
        <View style={styles.center}>
          <Text style={styles.muted}>{t('pathLoadError')}</Text>
          <TouchableOpacity onPress={load} activeOpacity={0.8}>
            <Text style={styles.link}>{t('retry')}</Text>
          </TouchableOpacity>
        </View>
      )}
      {!path && !error && (
        <View style={styles.center}>
          <ActivityIndicator color={COLORS.primary} />
        </View>
      )}

      {path && (
        <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + SPACING.xl }} showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <Text style={styles.headerEmoji}>🧭</Text>
            <Text style={styles.headerTitle}>{path.title_fa}</Text>
            {!!path.goal_fa && <Text style={styles.headerGoal}>{path.goal_fa}</Text>}
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${weeks.length ? (weeksDone / weeks.length) * 100 : 0}%` }]} />
            </View>
            <Text style={styles.progressText}>
              {t('pathWeeksProgress').replace('{done}', String(weeksDone)).replace('{total}', String(weeks.length))}
            </Text>
          </View>

          {weeks.map((week, wi) => {
            const open = openWeek === wi;
            return (
              <View key={week.id} style={[styles.weekCard, !week.unlocked && styles.dim]}>
                <TouchableOpacity
                  style={styles.weekHeader}
                  onPress={() => setOpenWeek(open ? null : wi)}
                  activeOpacity={0.85}
                >
                  <View style={[styles.weekBadge, week.done && styles.weekBadgeDone]}>
                    {week.done ? (
                      <Check size={16} color={COLORS.white} />
                    ) : week.unlocked ? (
                      <Text style={styles.weekBadgeText}>{week.position}</Text>
                    ) : (
                      <Lock size={14} color={COLORS.muted} />
                    )}
                  </View>
                  <View style={styles.flex}>
                    <Text style={styles.weekLabel}>
                      {t('pathWeekN').replace('{n}', String(week.position))}
                      {week.is_free ? `  ·  ${t('pathFree')}` : ''}
                    </Text>
                    <Text style={styles.weekTitle}>{week.title_fa}</Text>
                    {week.best_score !== undefined && (
                      <Text style={styles.weekScore}>
                        {t('pathCheckpointScore').replace('{n}', String(week.best_score))}
                      </Text>
                    )}
                  </View>
                  {open ? <ChevronUp size={18} color={COLORS.muted} /> : <ChevronDown size={18} color={COLORS.muted} />}
                </TouchableOpacity>

                {open && (
                  <View style={styles.weekBody}>
                    {week.can_do.length > 0 && (
                      <View style={styles.canDo}>
                        <Text style={styles.canDoTitle}>{t('pathCanDoTitle')}</Text>
                        {week.can_do.map((c) => (
                          <Text key={c} style={styles.canDoItem}>
                            {week.done ? '✅' : '•'} {c}
                          </Text>
                        ))}
                      </View>
                    )}

                    {week.sessions.map((session) => (
                      <View key={session.no} style={[styles.session, !session.unlocked && styles.dim]}>
                        <View style={styles.sessionHeader}>
                          <Text style={styles.sessionNo}>
                            {t('pathSessionN').replace('{n}', String(session.no))}
                          </Text>
                          <Text style={styles.sessionTitle} numberOfLines={1}>
                            {session.title_fa}
                          </Text>
                          {session.done && <Check size={16} color={COLORS.success} />}
                          {!session.unlocked && <Lock size={14} color={COLORS.muted} />}
                        </View>
                        {session.items.map((item) => {
                          const Icon = KIND_ICON[item.kind] || BookOpen;
                          return (
                            <TouchableOpacity
                              key={item.key}
                              style={[styles.item, item.done && styles.itemDone]}
                              onPress={() => openItem(week, item)}
                              disabled={!session.unlocked}
                              activeOpacity={0.85}
                            >
                              <Icon size={16} color={item.done ? COLORS.success : COLORS.primary} />
                              <View style={styles.flex}>
                                <Text style={styles.itemKind}>
                                  {t(`pathKind_${item.kind}`)}
                                  {!item.required ? `  ·  ${t('pathOptional')}` : ''}
                                  {item.minutes ? `  ·  ${t('pathMinutes').replace('{n}', String(item.minutes))}` : ''}
                                </Text>
                                {!!item.title && item.kind !== 'checkpoint' && (
                                  <Text style={styles.itemTitle} numberOfLines={1}>
                                    {item.title}
                                  </Text>
                                )}
                              </View>
                              {item.done && <Check size={16} color={COLORS.success} />}
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                    ))}
                  </View>
                )}
              </View>
            );
          })}
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background, paddingHorizontal: SPACING.m },
  topRow: { flexDirection: 'row', justifyContent: 'flex-start' },
  closeBtn: {
    width: 40,
    height: 40,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.level1,
  },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: SPACING.s },
  muted: { ...TEXT_STYLES.bodyMd, color: COLORS.muted, textAlign: 'center' },
  link: { ...TEXT_STYLES.bodyMd, color: COLORS.primary, fontFamily: FONT_FAMILY.semiBold },
  header: { alignItems: 'center', paddingVertical: SPACING.m, gap: SPACING.xs },
  headerEmoji: { fontSize: 40 },
  headerTitle: { ...TEXT_STYLES.headlineSm, color: COLORS.text, textAlign: 'center' },
  headerGoal: { ...TEXT_STYLES.bodyMd, color: COLORS.textSecondary, textAlign: 'center', lineHeight: 24 },
  progressTrack: {
    alignSelf: 'stretch',
    height: 8,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.surfaceHigh,
    marginTop: SPACING.s,
    overflow: 'hidden',
  },
  progressFill: { height: '100%', backgroundColor: COLORS.success, borderRadius: BORDER_RADIUS.full },
  progressText: { ...TEXT_STYLES.labelMd, color: COLORS.muted },
  weekCard: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.l,
    marginBottom: SPACING.s,
    ...SHADOWS.level1,
  },
  dim: { opacity: 0.55 },
  weekHeader: { flexDirection: 'row', alignItems: 'center', gap: SPACING.s, padding: SPACING.m },
  weekBadge: {
    width: 32,
    height: 32,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  weekBadgeDone: { backgroundColor: COLORS.success },
  weekBadgeText: { fontFamily: FONT_FAMILY.bold, color: COLORS.primary, fontSize: 15 },
  flex: { flex: 1 },
  weekLabel: { ...TEXT_STYLES.labelMd, color: COLORS.muted },
  weekTitle: { ...TEXT_STYLES.bodyLg, fontFamily: FONT_FAMILY.semiBold, color: COLORS.text },
  weekScore: { ...TEXT_STYLES.labelMd, color: COLORS.success },
  weekBody: { paddingHorizontal: SPACING.m, paddingBottom: SPACING.m, gap: SPACING.s },
  canDo: { backgroundColor: COLORS.backgroundSoft, borderRadius: BORDER_RADIUS.m, padding: SPACING.s, gap: 2 },
  canDoTitle: { ...TEXT_STYLES.labelMd, fontFamily: FONT_FAMILY.semiBold, color: COLORS.text },
  canDoItem: { ...TEXT_STYLES.bodyMd, color: COLORS.textSecondary },
  session: { borderWidth: 1, borderColor: COLORS.borderLight, borderRadius: BORDER_RADIUS.m, padding: SPACING.s, gap: SPACING.xs },
  sessionHeader: { flexDirection: 'row', alignItems: 'center', gap: SPACING.s },
  sessionNo: { ...TEXT_STYLES.labelMd, color: COLORS.primary, fontFamily: FONT_FAMILY.semiBold },
  sessionTitle: { ...TEXT_STYLES.bodyMd, color: COLORS.text, flex: 1 },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.s,
    paddingVertical: SPACING.s,
    paddingHorizontal: SPACING.s,
    borderRadius: BORDER_RADIUS.m,
    backgroundColor: COLORS.backgroundSoft,
  },
  itemDone: { backgroundColor: COLORS.successLight },
  itemKind: { ...TEXT_STYLES.labelMd, color: COLORS.textSecondary },
  itemTitle: { ...TEXT_STYLES.bodyMd, color: COLORS.text },
});
