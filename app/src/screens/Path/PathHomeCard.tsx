import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { ChevronLeft, Compass } from 'lucide-react-native';

import { COLORS, SPACING, BORDER_RADIUS } from '../../theme/colors';
import { FONT_FAMILY, TEXT_STYLES } from '../../theme/typography';
import { SHADOWS } from '../../theme/elevation';
import { useLanguage } from '../../data/i18n';
import type { PathSummary } from '../../api/path';

/**
 * کارت «جلسه‌ی بعدی من» در خانه. اگر کاربر هنوز مسیر را شروع نکرده، دعوت به
 * شروع؛ وگرنه هفته و جلسه‌ی بعدی و پیشرفت هفته‌ها.
 */
export const PathHomeCard: React.FC<{ path: PathSummary; onPress: () => void }> = ({ path, onPress }) => {
  const { t } = useLanguage();
  const next = path.next;
  const percent = path.weeks_total ? Math.round((path.weeks_done / path.weeks_total) * 100) : 0;

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.9}>
      <View style={styles.iconWrap}>
        <Compass size={22} color={COLORS.white} />
      </View>
      <View style={styles.flex}>
        <Text style={styles.label}>{path.started ? t('pathNextSession') : path.title_fa}</Text>
        {path.started && next ? (
          <>
            <Text style={styles.title} numberOfLines={1}>
              {next.is_checkpoint
                ? t('pathCheckpointTitle').replace('{n}', String(next.week_position))
                : `${t('pathWeekN').replace('{n}', String(next.week_position))} · ${t('pathSessionN').replace('{n}', String(next.session_no))}`}
            </Text>
            <Text style={styles.sub} numberOfLines={1}>
              {next.is_checkpoint ? next.week_title_fa : next.session_title_fa}
            </Text>
          </>
        ) : path.started ? (
          <Text style={styles.title}>{t('pathAllDone')}</Text>
        ) : (
          <>
            <Text style={styles.title} numberOfLines={2}>
              {t('pathStartCta')}
            </Text>
            <Text style={styles.sub} numberOfLines={2}>
              {path.description_fa}
            </Text>
          </>
        )}
        {path.started && (
          <View style={styles.track}>
            <View style={[styles.fill, { width: `${percent}%` }]} />
          </View>
        )}
      </View>
      <ChevronLeft size={20} color={COLORS.muted} />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.m,
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.m,
    marginBottom: SPACING.m,
    borderWidth: 1,
    borderColor: COLORS.primaryLight,
    ...SHADOWS.level1,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  flex: { flex: 1, gap: 2 },
  label: { ...TEXT_STYLES.labelMd, color: COLORS.primary, fontFamily: FONT_FAMILY.semiBold },
  title: { ...TEXT_STYLES.bodyLg, color: COLORS.text, fontFamily: FONT_FAMILY.semiBold },
  sub: { ...TEXT_STYLES.bodyMd, color: COLORS.textSecondary },
  track: { height: 6, borderRadius: BORDER_RADIUS.full, backgroundColor: COLORS.surfaceHigh, marginTop: SPACING.xs, overflow: 'hidden' },
  fill: { height: '100%', backgroundColor: COLORS.success, borderRadius: BORDER_RADIUS.full },
});
