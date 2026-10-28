import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Compass, Play } from 'lucide-react-native';

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

  // عنوان اصلی = اسم خود جلسه (چیزی که کاربر الان تمرین می‌کند)؛ «هفته ۱ · جلسه ۲» برچسب
  // کوچک بالای آن است. دکمه‌ی «ادامه» نشان می‌دهد کل کارت قابل لمس است.
  const weekLabel =
    path.started && next
      ? next.is_checkpoint
        ? t('pathCheckpointTitle').replace('{n}', String(next.week_position))
        : `${t('pathWeekN').replace('{n}', String(next.week_position))} · ${t('pathSessionN').replace('{n}', String(next.session_no))}`
      : '';
  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.9}>
      <View style={styles.row}>
        <View style={styles.iconWrap}>
          <Compass size={20} color={COLORS.white} />
        </View>
        <View style={styles.flex}>
          <Text style={styles.label}>{path.started ? `${t('pathNextSession')}${weekLabel ? ` · ${weekLabel}` : ''}` : path.title_fa}</Text>
          {path.started && next ? (
            <Text style={styles.title} numberOfLines={2}>
              {next.is_checkpoint ? next.week_title_fa : next.session_title_fa}
            </Text>
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
        </View>
      </View>
      {path.started && (
        <View style={styles.progressRow}>
          <View style={styles.track}>
            <View style={[styles.fill, { width: `${percent}%` }]} />
          </View>
          <Text style={styles.progressText}>
            {t('pathWeeksProgress').replace('{done}', String(path.weeks_done)).replace('{total}', String(path.weeks_total))}
          </Text>
        </View>
      )}
      {!(path.started && !next) && (
        <View style={styles.cta}>
          <Play size={14} color={COLORS.white} fill={COLORS.white} />
          <Text style={styles.ctaText}>{path.started ? t('pathContinueCta') : t('pathStartButton')}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    gap: SPACING.s,
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.m,
    marginBottom: SPACING.m,
    borderWidth: 1,
    borderColor: COLORS.primaryLight,
    ...SHADOWS.level1,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: SPACING.m },
  progressRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.s },
  progressText: { fontFamily: FONT_FAMILY.medium, fontSize: 11, color: COLORS.textSecondary },
  cta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 40,
    borderRadius: BORDER_RADIUS.l,
    backgroundColor: COLORS.primary,
  },
  ctaText: { fontFamily: FONT_FAMILY.bold, fontSize: 13, color: COLORS.white },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  flex: { flex: 1, gap: 2 },
  label: { fontFamily: FONT_FAMILY.medium, fontSize: 11, lineHeight: 17, color: COLORS.primary },
  title: { fontFamily: FONT_FAMILY.bold, fontSize: 15, lineHeight: 23, color: COLORS.text },
  sub: { ...TEXT_STYLES.bodyMd, color: COLORS.textSecondary },
  track: { flex: 1, height: 6, borderRadius: BORDER_RADIUS.full, backgroundColor: COLORS.surfaceHigh, overflow: 'hidden' },
  fill: { height: '100%', backgroundColor: COLORS.success, borderRadius: BORDER_RADIUS.full },
});
