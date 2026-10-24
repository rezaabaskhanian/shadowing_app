import React, { useCallback, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BookMarked, Lock, X } from 'lucide-react-native';

import { COLORS, SPACING, BORDER_RADIUS } from '../../theme/colors';
import { FONT_FAMILY, TEXT_STYLES } from '../../theme/typography';
import { SHADOWS } from '../../theme/elevation';
import { useLanguage } from '../../data/i18n';
import { getSpecialtyFields, type SpecialtyField } from '../../api/specialty';
import { getMyLevel } from '../../api/assessment';
import { ListHero, levelColor } from '../../components/ContentVisuals';

const LEVEL_ORDER = ['starter', 'beginner', 'intermediate', 'advanced', 'proficient'];
const levelKey = (l: string) => `level${l.charAt(0).toUpperCase()}${l.slice(1)}`;

/**
 * فهرست رشته‌های «زبان تخصصی». رشته‌ای که سطح کاربر هنوز به min_level آن نرسیده
 * قفل نشان داده می‌شود (نه پنهان)، تا کاربر بداند با پیشرفت در مسیر باز می‌شود.
 */
export const SpecialtyHubScreen: React.FC = () => {
  const { t } = useLanguage();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const [fields, setFields] = useState<SpecialtyField[] | null>(null);
  const [userRank, setUserRank] = useState(-1);
  const [error, setError] = useState(false);

  const load = useCallback(() => {
    setError(false);
    Promise.all([getSpecialtyFields(), getMyLevel().catch(() => null)])
      .then(([list, lvl]) => {
        setFields(list);
        setUserRank(LEVEL_ORDER.indexOf(lvl?.scene_level ?? ''));
      })
      .catch(() => setError(true));
  }, []);

  useFocusEffect(load);

  return (
    <View style={[styles.container, { paddingTop: insets.top + SPACING.s }]}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.closeBtn} onPress={() => navigation.goBack()} activeOpacity={0.8}>
          <X size={20} color={COLORS.text} />
        </TouchableOpacity>
        <ListHero
          icon={<BookMarked size={26} color={COLORS.white} />}
          color={COLORS.levelAdvancedBg}
          title={t('specialtyTitle')}
          subtitle={t('specialtySubtitle')}
        />
      </View>

      {fields === null && !error && (
        <View style={styles.center}>
          <ActivityIndicator color={COLORS.primary} />
        </View>
      )}
      {error && (
        <View style={styles.center}>
          <Text style={styles.mutedText}>{t('topicSpeakingLoadError')}</Text>
          <TouchableOpacity onPress={load} activeOpacity={0.8}>
            <Text style={styles.linkText}>{t('topicSpeakingRetry')}</Text>
          </TouchableOpacity>
        </View>
      )}
      {fields && fields.length === 0 && (
        <View style={styles.center}>
          <Text style={styles.mutedText}>{t('specialtyEmpty')}</Text>
        </View>
      )}

      {fields && fields.length > 0 && (
        <ScrollView contentContainerStyle={[styles.grid, { paddingBottom: insets.bottom + SPACING.l }]} showsVerticalScrollIndicator={false}>
          {fields.map((f) => {
            // سطح نامعلوم = باز (مثل بقیه‌ی فیلترهای سطح در اپ).
            const locked = userRank >= 0 && userRank < LEVEL_ORDER.indexOf(f.min_level);
            return (
              <TouchableOpacity
                key={f.key}
                style={[styles.tile, locked && styles.tileLocked]}
                activeOpacity={0.85}
                disabled={locked}
                onPress={() => navigation.navigate('SpecialtyField', { fieldKey: f.key, openedAt: Date.now() })}
              >
                <View style={[styles.tileIcon, { backgroundColor: levelColor(f.min_level) }]}>
                  {locked ? <Lock size={20} color={COLORS.white} /> : <Text style={styles.emoji}>{f.icon || '📘'}</Text>}
                </View>
                <Text style={styles.tileTitle}>{f.title_fa}</Text>
                {!!f.title_en && <Text style={styles.tileSub}>{f.title_en}</Text>}
                <Text style={styles.tileSub}>
                  {locked
                    ? t('specialtyLocked').replace('{level}', t(levelKey(f.min_level)))
                    : t('specialtyWordCount').replace('{n}', String(f.word_count))}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background, paddingHorizontal: SPACING.l },
  header: { alignItems: 'center', marginBottom: SPACING.m },
  closeBtn: {
    alignSelf: 'flex-start',
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.s,
  },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: SPACING.s },
  mutedText: { ...TEXT_STYLES.bodyMd, color: COLORS.textSecondary, textAlign: 'center' },
  linkText: { ...TEXT_STYLES.labelMd, color: COLORS.primary, fontFamily: FONT_FAMILY.semiBold },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.m, justifyContent: 'space-between' },
  tile: {
    width: '47%',
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.l,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.m,
    alignItems: 'center',
    gap: 4,
    ...SHADOWS.level1,
  },
  tileLocked: { opacity: 0.6 },
  tileIcon: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  emoji: { fontSize: 24 },
  tileTitle: { ...TEXT_STYLES.bodyMd, color: COLORS.text, fontFamily: FONT_FAMILY.bold, textAlign: 'center' },
  tileSub: { ...TEXT_STYLES.labelSm, color: COLORS.textSecondary, textAlign: 'center' },
});
