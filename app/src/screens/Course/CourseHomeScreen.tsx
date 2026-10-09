import React, { useCallback, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Lock, Star, X } from 'lucide-react-native';

import { COLORS, SPACING, BORDER_RADIUS } from '../../theme/colors';
import { FONT_FAMILY, TEXT_STYLES } from '../../theme/typography';
import { SHADOWS } from '../../theme/elevation';
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

  const totalStars = units?.reduce((n, u) => n + u.lessons.reduce((m, l) => m + l.stars, 0), 0) ?? 0;
  const maxStars = units?.reduce((n, u) => n + u.lessons.length * 3, 0) ?? 0;

  return (
    <View style={[styles.container, { paddingTop: insets.top + SPACING.s }]}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.closeBtn} onPress={() => navigation.goBack()} activeOpacity={0.8}>
          <X size={20} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerEmoji}>🌱</Text>
        <Text style={styles.headerTitle}>{t('courseTitle')}</Text>
        <Text style={styles.headerSub}>{t('courseSubtitle')}</Text>
        {maxStars > 0 && (
          <View style={styles.totalStars}>
            <Star size={16} color={COLORS.warning} fill={COLORS.warning} />
            <Text style={styles.totalStarsText}>
              {totalStars} / {maxStars}
            </Text>
          </View>
        )}
      </View>

      {units === null && !error && (
        <View style={styles.center}>
          <ActivityIndicator color={COLORS.primary} />
        </View>
      )}
      {error && (
        <View style={styles.center}>
          <Text style={styles.mutedText}>{t('courseLoadError')}</Text>
          <TouchableOpacity onPress={load} activeOpacity={0.8}>
            <Text style={styles.linkText}>{t('topicSpeakingRetry')}</Text>
          </TouchableOpacity>
        </View>
      )}
      {units && units.length === 0 && (
        <View style={styles.center}>
          <Text style={styles.mutedText}>{t('courseEmpty')}</Text>
        </View>
      )}

      {units && units.length > 0 && (
        <ScrollView
          contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + SPACING.xl }]}
          showsVerticalScrollIndicator={false}
        >
          {units.map((unit, ui) => (
            <View key={unit.id} style={styles.unit}>
              <View style={styles.unitHeader}>
                <Text style={styles.unitEmoji}>{unit.emoji || '📘'}</Text>
                <View style={styles.flex}>
                  <Text style={styles.unitLabel}>{t('courseUnitN').replace('{n}', String(ui + 1))}</Text>
                  <Text style={styles.unitTitle}>{unit.title_fa}</Text>
                  {!!unit.description_fa && <Text style={styles.unitDesc}>{unit.description_fa}</Text>}
                </View>
              </View>
              {unit.lessons.map((lesson, li) => (
                <TouchableOpacity
                  key={lesson.id}
                  // مسیر زیگزاگ — حس «جاده‌ی قدم‌به‌قدم» به‌جای یک لیست خشک.
                  style={[styles.lesson, li % 2 === 1 && styles.lessonShift, !lesson.unlocked && styles.lessonLocked]}
                  onPress={() => navigation.navigate('CourseLesson', { lessonId: lesson.id, openedAt: Date.now() })}
                  disabled={!lesson.unlocked}
                  activeOpacity={0.85}
                >
                  <View style={[styles.lessonBubble, lesson.completed && styles.lessonBubbleDone]}>
                    {lesson.unlocked ? (
                      <Text style={styles.lessonEmoji}>{lesson.emoji || '⭐️'}</Text>
                    ) : (
                      <Lock size={20} color={COLORS.muted} />
                    )}
                  </View>
                  <View style={styles.flex}>
                    <Text style={styles.lessonTitle}>{lesson.title_fa}</Text>
                    {!!lesson.title_en && <Text style={styles.lessonEn}>{lesson.title_en}</Text>}
                    {lesson.completed ? (
                      <Stars count={lesson.stars} />
                    ) : (
                      <Text style={styles.lessonMeta}>
                        {lesson.unlocked
                          ? t('courseLessonCards').replace('{n}', String(lesson.item_count))
                          : t('courseLessonLocked')}
                      </Text>
                    )}
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    paddingHorizontal: SPACING.l,
  },
  flex: {
    flex: 1,
  },
  header: {
    alignItems: 'center',
    marginBottom: SPACING.m,
  },
  closeBtn: {
    alignSelf: 'flex-start',
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerEmoji: {
    fontSize: 40,
  },
  headerTitle: {
    ...TEXT_STYLES.headlineSm,
    color: COLORS.text,
  },
  headerSub: {
    ...TEXT_STYLES.bodyMd,
    color: COLORS.textSecondary,
    marginTop: 4,
    textAlign: 'center',
  },
  totalStars: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: SPACING.s,
    backgroundColor: COLORS.warningLight,
    borderRadius: BORDER_RADIUS.full,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  totalStarsText: {
    fontFamily: FONT_FAMILY.bold,
    fontSize: 14,
    color: COLORS.text,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.s,
  },
  mutedText: {
    ...TEXT_STYLES.bodyMd,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  linkText: {
    ...TEXT_STYLES.labelMd,
    color: COLORS.primary,
    fontFamily: FONT_FAMILY.semiBold,
  },
  list: {
    gap: SPACING.l,
  },
  unit: {
    gap: SPACING.s,
  },
  unitHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.m,
    backgroundColor: COLORS.primaryLight,
    borderRadius: BORDER_RADIUS.l,
    padding: SPACING.m,
  },
  unitEmoji: {
    fontSize: 32,
  },
  unitLabel: {
    ...TEXT_STYLES.labelSm,
    color: COLORS.primary,
  },
  unitTitle: {
    fontFamily: FONT_FAMILY.bold,
    fontSize: 17,
    color: COLORS.text,
  },
  unitDesc: {
    ...TEXT_STYLES.labelMd,
    color: COLORS.textSecondary,
  },
  lesson: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.m,
    width: '85%',
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.l,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.m,
    ...SHADOWS.level1,
  },
  lessonShift: {
    alignSelf: 'flex-end',
  },
  lessonLocked: {
    opacity: 0.55,
  },
  lessonBubble: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: COLORS.surfaceHigh,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lessonBubbleDone: {
    backgroundColor: COLORS.successLight,
  },
  lessonEmoji: {
    fontSize: 26,
  },
  lessonTitle: {
    fontFamily: FONT_FAMILY.bold,
    fontSize: 15,
    color: COLORS.text,
  },
  lessonEn: {
    ...TEXT_STYLES.labelSm,
    color: COLORS.muted,
  },
  lessonMeta: {
    ...TEXT_STYLES.labelSm,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  starsRow: {
    flexDirection: 'row',
    gap: 2,
    marginTop: 2,
  },
});
