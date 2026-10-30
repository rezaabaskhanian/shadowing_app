import React, { useCallback, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, Lock, Sprout, Star, Target } from 'lucide-react-native';
import { HubHeader } from '../../components/HubHeader';
import { GradientFill } from '../../components/GradientFill';

import { COLORS, SPACING } from '../../theme/colors';
import { FONT_FAMILY, TEXT_STYLES } from '../../theme/typography';
import { useLanguage } from '../../data/i18n';
import { getCourse, type CourseUnit } from '../../api/course';

export const Stars: React.FC<{ count: number; size?: number }> = ({ count, size = 14 }) => (
  <View style={styles.starsRow}>
    {[0, 1, 2].map((i) => (
      <Star
        key={i}
        size={size}
        color={i < count ? COLORS.warning : COLORS.border}
        fill={i < count ? COLORS.warning : 'transparent'}
      />
    ))}
  </View>
);

/**
 * نقشه‌ی «دوره‌ی شروع»: فصل‌ها و درس‌ها به شکل یک مسیر قدم‌به‌قدم (مثل کتاب
 * آموزش کودک). درس بعدی فقط وقتی باز می‌شود که قبلی تمام شده باشد.
 */
export const CourseHomeScreen: React.FC = () => {
  const { t } = useLanguage();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const [units, setUnits] = useState<CourseUnit[] | null>(null);
  const [error, setError] = useState(false);

  const load = useCallback(() => {
    setError(false);
    getCourse()
      .then(setUnits)
      .catch(() => setError(true));
  }, []);

  useFocusEffect(load);

  const toFa = (v: number | string) => String(v).replace(/\d/g, (d) => '۰۱۲۳۴۵۶۷۸۹'[Number(d)]);
  const totalStars = units?.reduce((n, u) => n + u.lessons.reduce((m, l) => m + l.stars, 0), 0) ?? 0;
  const lessonCount = units?.reduce((n, u) => n + u.lessons.length, 0) ?? 0;
  const allLessons = units?.flatMap((u) => u.lessons) ?? [];
  // درس بعدی: اولین درس باز و تمام‌نشده؛ اگر همه تمام شده، اولین درس.
  const nextLesson = allLessons.find((l) => l.unlocked && !l.completed) ?? allLessons[0];
  const started = allLessons.some((l) => l.completed);
  const openLesson = (id: string) => navigation.navigate('CourseLesson', { lessonId: id, openedAt: Date.now() });

  return (
    <View style={[styles.container, { paddingTop: insets.top + SPACING.s }]}>
      <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
        <HubHeader
          tag={t('courseLevelTag')}
          tagColor="#C98A12"
          onClose={() => navigation.goBack()}
          icon={<Sprout size={32} color="#2F8A5B" />}
          tile={['#F1FAF4', '#DCF1E4']}
          round
          title={
            <View style={styles.titleRow}>
              <View style={styles.preChip}>
                <Text style={styles.preChipText}>Pre-A1</Text>
              </View>
              <Text style={styles.headerTitle}>{t('courseTitle')}</Text>
            </View>
          }
          subtitle={t('courseSubtitle')}
        >
          <View style={styles.readyChip}>
            <Text style={styles.readyText}>{t('courseReadyTag')}</Text>
            <View style={styles.readyDot} />
          </View>
        </HubHeader>

        {units === null && !error && <ActivityIndicator color={COLORS.primary} style={styles.loader} />}
        {error && (
          <View style={styles.center}>
            <Text style={styles.mutedText}>{t('courseLoadError')}</Text>
            <TouchableOpacity onPress={load} activeOpacity={0.8}>
              <Text style={styles.linkText}>{t('topicSpeakingRetry')}</Text>
            </TouchableOpacity>
          </View>
        )}
        {units && units.length === 0 && <Text style={[styles.mutedText, styles.loader]}>{t('courseEmpty')}</Text>}

        {units && units.length > 0 && (
          <>
            <View style={styles.stats}>
              {[
                { v: `${toFa(totalStars)}/${toFa(lessonCount * 3)}`, l: t('courseStatStars'), hot: false },
                { v: toFa(lessonCount), l: t('courseStatLessons'), hot: true },
                { v: toFa(units.length), l: t('courseStatUnits'), hot: false },
              ].map((x, i) => (
                <View key={i} style={[styles.stat, i > 0 && styles.statBorder]}>
                  <Text style={[styles.statValue, x.hot && styles.statValueHot]}>{x.v}</Text>
                  <Text style={styles.statLabel}>{x.l}</Text>
                </View>
              ))}
            </View>

            <View style={styles.goal}>
              <View style={styles.goalText}>
                <Text style={styles.goalTitle}>{t('courseGoalTitle')}</Text>
                <Text style={styles.goalBody}>{t('courseGoalText')}</Text>
              </View>
              <View style={styles.goalIcon}>
                <Target size={18} color={COLORS.primary} />
              </View>
            </View>

            <View style={styles.sectionRow}>
              <Text style={styles.sectionTitle}>{t('coursePathTitle')}</Text>
              <Text style={styles.sectionCount}>{t('courseUnitsCount').replace('{n}', toFa(units.length))}</Text>
            </View>

            {units.map((unit, ui) => {
              const locked = !unit.lessons.some((l) => l.unlocked);
              const done = unit.lessons.length > 0 && unit.lessons.every((l) => l.completed);
              const current = !!nextLesson && unit.lessons.some((l) => l.id === nextLesson.id) && !done;
              return (
                <View key={unit.id} style={[styles.unit, current && styles.unitCurrent, locked && styles.unitLocked]}>
                  <View style={styles.unitHeader}>
                    <View style={[styles.unitNum, current && styles.unitNumOn]}>
                      <Text style={[styles.unitNumText, current && styles.unitNumTextOn]}>{toFa(ui + 1)}</Text>
                    </View>
                    <Text style={styles.unitTitle} numberOfLines={1}>
                      {unit.title_fa}
                    </Text>
                    {current ? (
                      <View style={[styles.unitTag, styles.unitTagStart]}>
                        <Text style={[styles.unitTagText, styles.unitTagTextStart]}>{t('courseStartHere')}</Text>
                      </View>
                    ) : done ? (
                      <View style={[styles.unitTag, styles.unitTagStart]}>
                        <Text style={[styles.unitTagText, styles.unitTagTextStart]}>{t('courseDoneTag')}</Text>
                      </View>
                    ) : locked ? (
                      <View style={styles.unitTagLock}>
                        <Text style={styles.unitTagText}>{t('courseLocked')}</Text>
                        <Lock size={11} color={COLORS.muted} />
                      </View>
                    ) : (
                      <View style={[styles.unitTag, styles.unitTagReady]}>
                        <Text style={[styles.unitTagText, styles.unitTagTextReady]}>{t('courseReady')}</Text>
                      </View>
                    )}
                  </View>
                  {!!unit.description_fa && <Text style={styles.unitDesc}>{unit.description_fa}</Text>}
                  {!locked && unit.lessons.length > 0 && (
                    <View style={styles.lessons}>
                      {unit.lessons.map((lesson) => (
                        <TouchableOpacity
                          key={lesson.id}
                          style={[styles.lessonChip, !lesson.unlocked && styles.lessonChipLocked, lesson.completed && styles.lessonChipDone]}
                          onPress={() => openLesson(lesson.id)}
                          disabled={!lesson.unlocked}
                          activeOpacity={0.85}
                        >
                          {lesson.completed ? (
                            <Stars count={lesson.stars} size={10} />
                          ) : lesson.unlocked ? (
                            <Text style={styles.lessonEmoji}>{lesson.emoji || '⭐️'}</Text>
                          ) : (
                            <Lock size={10} color={COLORS.muted} />
                          )}
                          <Text style={styles.lessonChipText}>{lesson.title_en || lesson.title_fa}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </View>
              );
            })}
          </>
        )}
      </ScrollView>

      {!!nextLesson && (
        <View style={[styles.footer, { paddingBottom: insets.bottom + SPACING.m }]}>
          <TouchableOpacity style={styles.cta} onPress={() => openLesson(nextLesson.id)} activeOpacity={0.85}>
            <GradientFill from="#F07A4A" to="#E8572F" horizontal />
            <View style={styles.ctaInner}>
              <ArrowLeft size={18} color={COLORS.white} />
              <Text style={styles.ctaText} numberOfLines={1}>
                {started
                  ? t('courseContinueCta').replace('{t}', nextLesson.title_fa)
                  : t('courseStartCta')}
              </Text>
            </View>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAF8F4', paddingHorizontal: SPACING.l },
  list: { gap: 12, paddingBottom: SPACING.l },
  loader: { marginTop: SPACING.xl },
  center: { alignItems: 'center', justifyContent: 'center', gap: SPACING.s, marginTop: SPACING.xl },
  mutedText: { ...TEXT_STYLES.bodyMd, color: COLORS.textSecondary, textAlign: 'center' },
  linkText: { ...TEXT_STYLES.labelMd, color: COLORS.primary, fontFamily: FONT_FAMILY.semiBold },
  starsRow: { flexDirection: 'row', gap: 1 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerTitle: { fontFamily: FONT_FAMILY.bold, fontSize: 24, color: COLORS.text },
  preChip: { paddingHorizontal: 7, paddingVertical: 1, borderRadius: 6, backgroundColor: '#E3F1E8' },
  preChipText: { fontFamily: FONT_FAMILY.bold, fontSize: 10, color: '#2F8A5B' },
  readyChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 10,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: 'rgba(46,158,107,0.10)',
  },
  readyText: { fontFamily: FONT_FAMILY.semiBold, fontSize: 11, color: '#2F8A5B' },
  readyDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: COLORS.success },
  stats: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#EEEAE3',
    paddingVertical: 16,
    marginTop: SPACING.s,
  },
  stat: { flex: 1, alignItems: 'center', gap: 4, paddingHorizontal: 4 },
  statBorder: { borderLeftWidth: 1, borderLeftColor: '#F1EDE6' },
  statValue: { fontFamily: FONT_FAMILY.bold, fontSize: 18, color: COLORS.text },
  statValueHot: { color: COLORS.primary },
  statLabel: { fontFamily: FONT_FAMILY.regular, fontSize: 10, color: COLORS.textSecondary, textAlign: 'center' },
  goal: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 14,
    borderRadius: 18,
    backgroundColor: '#FFF8E8',
    borderWidth: 1,
    borderColor: '#F3E3BC',
  },
  goalText: { flex: 1, alignItems: 'flex-end', gap: 3 },
  goalTitle: { fontFamily: FONT_FAMILY.bold, fontSize: 12, color: COLORS.text },
  goalBody: { fontFamily: FONT_FAMILY.regular, fontSize: 12, lineHeight: 20, color: COLORS.textSecondary, textAlign: 'right' },
  goalIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionRow: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between', marginTop: SPACING.s },
  sectionTitle: { fontFamily: FONT_FAMILY.bold, fontSize: 15, color: COLORS.text },
  sectionCount: { fontFamily: FONT_FAMILY.medium, fontSize: 11, color: COLORS.muted },
  unit: {
    backgroundColor: COLORS.white,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#EEEAE3',
    padding: 14,
    gap: 8,
  },
  unitCurrent: { borderColor: COLORS.primary, borderWidth: 1.5 },
  unitLocked: { backgroundColor: '#F7F5F1' },
  unitHeader: { flexDirection: 'row-reverse', alignItems: 'center', gap: 8 },
  unitNum: { width: 24, height: 24, borderRadius: 8, backgroundColor: '#F1EEE8', alignItems: 'center', justifyContent: 'center' },
  unitNumOn: { backgroundColor: '#FDEDE8' },
  unitNumText: { fontFamily: FONT_FAMILY.bold, fontSize: 11, color: COLORS.textSecondary },
  unitNumTextOn: { color: COLORS.primary },
  unitTitle: { flex: 1, fontFamily: FONT_FAMILY.bold, fontSize: 14, color: COLORS.text, textAlign: 'right' },
  unitTag: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
  unitTagStart: { backgroundColor: 'rgba(46,158,107,0.12)' },
  unitTagReady: { backgroundColor: 'rgba(59,110,240,0.10)' },
  unitTagLock: { flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8, backgroundColor: '#EEEBE5' },
  unitTagText: { fontFamily: FONT_FAMILY.bold, fontSize: 10, color: COLORS.muted },
  unitTagTextStart: { color: '#2F8A5B' },
  unitTagTextReady: { color: '#3B6EF0' },
  unitDesc: { fontFamily: FONT_FAMILY.regular, fontSize: 12, lineHeight: 20, color: COLORS.textSecondary, textAlign: 'right' },
  lessons: { flexDirection: 'row-reverse', flexWrap: 'wrap', gap: 6 },
  lessonChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: '#E7E2D9',
  },
  lessonChipDone: { backgroundColor: '#FFF8E8', borderColor: '#F3E3BC' },
  lessonChipLocked: { opacity: 0.5 },
  lessonEmoji: { fontSize: 11 },
  lessonChipText: { fontFamily: FONT_FAMILY.semiBold, fontSize: 11, color: COLORS.text },
  footer: { paddingTop: SPACING.s },
  cta: {
    height: 54,
    borderRadius: 18,
    overflow: 'hidden',
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    elevation: 6,
    shadowColor: COLORS.primary,
    shadowOpacity: 0.35,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
  },
  ctaInner: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  ctaText: { flexShrink: 1, fontFamily: FONT_FAMILY.bold, fontSize: 15, color: COLORS.white },
});
