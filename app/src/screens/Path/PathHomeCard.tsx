import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Compass, Play } from 'lucide-react-native';

import { COLORS, SPACING, BORDER_RADIUS } from '../../theme/colors';
import { FONT_FAMILY, TEXT_STYLES } from '../../theme/typography';
import { useLanguage } from '../../data/i18n';
import { GradientFill } from '../../components/GradientFill';
import type { PathSummary } from '../../api/path';

/**
 * کارت «جلسه‌ی بعدی من» در خانه. اگر کاربر هنوز مسیر را شروع نکرده، دعوت به
 * شروع؛ وگرنه هفته و جلسه‌ی بعدی و پیشرفت هفته‌ها. در فارسی راست‌به‌چپ چیده می‌شود.
 */
export const PathHomeCard: React.FC<{ path: PathSummary; onPress: () => void }> = ({ path, onPress }) => {
  const { t, language } = useLanguage();
  const rtl = language === 'fa';
  const align = rtl ? styles.alignEnd : styles.alignStart;
  const textAlign = rtl ? styles.textRight : styles.textLeft;
  const next = path.next;
  const percent = path.weeks_total ? Math.round((path.weeks_done / path.weeks_total) * 100) : 0;

  // عنوان اصلی = اسم خود جلسه (چیزی که کاربر الان تمرین می‌کند)؛ «هفته ۱ · جلسه ۲» در
  // برچسبِ کپسولی بالای آن است. دکمه‌ی «ادامه» نشان می‌دهد کل کارت قابل لمس است.
  const weekLabel =
    path.started && next
      ? next.is_checkpoint
        ? t('pathCheckpointTitle').replace('{n}', String(next.week_position))
        : `${t('pathWeekN').replace('{n}', String(next.week_position))}، ${t('pathSessionN').replace('{n}', String(next.session_no))}`
      : '';
  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.9}>
      <GradientFill from="#FFF6EE" to="#FFFFFF" />
      <View style={styles.topRow}>
        <View style={styles.iconWrap}>
          <GradientFill from="#F59E42" to="#E8572F" />
          <Compass size={22} color={COLORS.white} />
        </View>
        <View style={[styles.flex, align]}>
          <View style={[styles.chip, rtl && styles.rowReverse]}>
            <View style={styles.chipDot} />
            <Text style={styles.chipText} numberOfLines={1}>
              {path.started ? `${t('pathNextSession')}${weekLabel ? `  ·  ${weekLabel}` : ''}` : path.title_fa}
            </Text>
          </View>
          {path.started && next ? (
            <Text style={[styles.title, textAlign]} numberOfLines={2}>
              {next.is_checkpoint ? next.week_title_fa : next.session_title_fa}
            </Text>
          ) : path.started ? (
            <Text style={[styles.title, textAlign]}>{t('pathAllDone')}</Text>
          ) : (
            <>
              <Text style={[styles.title, textAlign]} numberOfLines={2}>
                {t('pathStartCta')}
              </Text>
              <Text style={[styles.sub, textAlign]} numberOfLines={2}>
                {path.description_fa}
              </Text>
            </>
          )}
        </View>
      </View>

      {path.started && (
        <View style={styles.progressBlock}>
          <View style={[styles.progressLabels, rtl && styles.rowReverse]}>
            <Text style={styles.progressLabel}>{t('pathCourseProgress')}</Text>
            <Text style={styles.progressText}>
              {t('pathWeeksProgress').replace('{done}', String(path.weeks_done)).replace('{total}', String(path.weeks_total))}
            </Text>
          </View>
          <View style={[styles.track, rtl && styles.rowReverse]}>
            {/* حداقل یک تکه‌ی کوچک دیده می‌شود تا نوار «شروع‌شده» به نظر برسد. */}
            <View style={[styles.fill, { width: `${Math.max(percent, 4)}%` }]}>
              <GradientFill from="#F59E42" to="#E8572F" horizontal />
            </View>
          </View>
        </View>
      )}

      {!(path.started && !next) && (
        <View style={styles.cta}>
          <GradientFill from="#E8572F" to="#F2A541" horizontal />
          <Play size={14} color={COLORS.white} fill={COLORS.white} />
          <Text style={styles.ctaText}>{path.started ? t('pathContinueCta') : t('pathStartButton')}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    gap: 14,
    borderRadius: BORDER_RADIUS.xl,
    padding: 18,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#FBE3D3',
    backgroundColor: COLORS.white,
    overflow: 'hidden',
    shadowColor: '#E8572F',
    shadowOpacity: 0.08,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2,
  },
  topRow: { flexDirection: 'row', alignItems: 'flex-start', gap: SPACING.m },
  rowReverse: { flexDirection: 'row-reverse' },
  alignEnd: { alignItems: 'flex-end' },
  alignStart: { alignItems: 'flex-start' },
  textRight: { textAlign: 'right' },
  textLeft: { textAlign: 'left' },
  iconWrap: {
    width: 52,
    height: 52,
    borderRadius: 16,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  flex: { flex: 1, gap: 8 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: '#FDEBDD',
    borderWidth: 1,
    borderColor: '#F9D9C2',
  },
  chipDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: COLORS.primary },
  chipText: { fontFamily: FONT_FAMILY.medium, fontSize: 11, color: '#9A3412' },
  title: { fontFamily: FONT_FAMILY.bold, fontSize: 24, lineHeight: 32, color: COLORS.text },
  sub: { ...TEXT_STYLES.bodyMd, color: COLORS.textSecondary },
  progressBlock: { gap: 8 },
  progressLabels: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  progressLabel: { fontFamily: FONT_FAMILY.regular, fontSize: 12, color: COLORS.muted },
  progressText: { fontFamily: FONT_FAMILY.semiBold, fontSize: 12, color: COLORS.text },
  track: { flexDirection: 'row', height: 6, borderRadius: BORDER_RADIUS.full, backgroundColor: '#ECEEF2', overflow: 'hidden' },
  fill: { height: '100%', borderRadius: BORDER_RADIUS.full, overflow: 'hidden' },
  cta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 52,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#E8572F',
    shadowOpacity: 0.25,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  ctaText: { fontFamily: FONT_FAMILY.bold, fontSize: 15, color: COLORS.white },
});
