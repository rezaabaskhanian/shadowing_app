import React, { useCallback, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, BookMarked, BookOpen, ChevronLeft, Lock, RefreshCw, Search } from 'lucide-react-native';

import { COLORS, SPACING } from '../../theme/colors';
import { FONT_FAMILY, TEXT_STYLES } from '../../theme/typography';
import { useLanguage } from '../../data/i18n';
import { getSpecialtyFields, type SpecialtyField } from '../../api/specialty';
import { getMyLevel } from '../../api/assessment';
import { levelColor } from '../../components/ContentVisuals';
import { HubHeader } from '../../components/HubHeader';
import { GradientFill } from '../../components/GradientFill';

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
  const [query, setQuery] = useState('');
  // '' = همه‌ی رشته‌ها؛ با زدن یک چیپ فقط همان رشته نمایش داده می‌شود.
  const [picked, setPicked] = useState('');

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

  const toFa = (v: number | string) => String(v).replace(/\d/g, (d) => '۰۱۲۳۴۵۶۷۸۹'[Number(d)]);
  const isLocked = (f: SpecialtyField) => userRank >= 0 && userRank < LEVEL_ORDER.indexOf(f.min_level);
  const q = query.trim().toLowerCase();
  const visible = (fields ?? []).filter(
    (f) =>
      (!picked || f.key === picked) &&
      (!q || f.title_fa.toLowerCase().includes(q) || (f.title_en || '').toLowerCase().includes(q))
  );
  const firstOpen = (fields ?? []).find((f) => !isLocked(f));
  const openField = (key: string) => navigation.navigate('SpecialtyField', { fieldKey: key, openedAt: Date.now() });

  return (
    <View style={[styles.container, { paddingTop: insets.top + SPACING.s }]}>
      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <HubHeader
          tag={t('specialtyTag')}
          tagColor={COLORS.primary}
          onClose={() => navigation.goBack()}
          icon={<BookOpen size={30} color={COLORS.white} />}
          title={t('specialtyTitle')}
          subtitle={t('specialtyHubSub')}
        />

        <View style={styles.search}>
          <TextInput
            style={styles.searchInput}
            value={query}
            onChangeText={setQuery}
            placeholder={t('specialtySearch')}
            placeholderTextColor={COLORS.muted}
          />
          <Search size={18} color={COLORS.muted} />
        </View>

        {!!fields?.length && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
            {[{ key: '', label: t('specialtyAll') }, ...fields.map((f) => ({ key: f.key, label: `${f.icon || ''} ${f.title_fa}`.trim() }))].map(
              (c) => (
                <TouchableOpacity
                  key={c.key || 'all'}
                  style={[styles.chip, picked === c.key && styles.chipOn]}
                  onPress={() => setPicked(c.key)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.chipText, picked === c.key && styles.chipTextOn]}>{c.label}</Text>
                </TouchableOpacity>
              )
            )}
          </ScrollView>
        )}

        {fields === null && !error && <ActivityIndicator color={COLORS.primary} style={styles.loader} />}
        {error && (
          <View style={styles.errorBox}>
            <TouchableOpacity onPress={load} activeOpacity={0.8}>
              <Text style={styles.linkText}>{t('topicSpeakingRetry')}</Text>
            </TouchableOpacity>
            <Text style={styles.errorText}>{t('specialtyLoadingNew')}</Text>
            <RefreshCw size={15} color={COLORS.primary} />
          </View>
        )}
        {fields && fields.length === 0 && <Text style={[styles.mutedText, styles.loader]}>{t('specialtyEmpty')}</Text>}

        {visible.length > 0 && (
          <>
            <View style={styles.sectionRow}>
              <Text style={styles.sectionTitle}>{t('specialtyReady')}</Text>
              <Text style={styles.sectionCount}>{t('specialtyActiveCount').replace('{n}', toFa(fields?.length ?? 0))}</Text>
            </View>
            {visible.map((f) => {
              const locked = isLocked(f);
              const color = levelColor(f.min_level);
              return (
                <TouchableOpacity
                  key={f.key}
                  style={[styles.card, locked && styles.cardLocked]}
                  activeOpacity={0.85}
                  disabled={locked}
                  onPress={() => openField(f.key)}
                >
                  <View style={styles.cardTop}>
                    <View style={styles.cardIcon}>
                      {locked ? <Lock size={20} color={COLORS.muted} /> : <Text style={styles.emoji}>{f.icon || '📘'}</Text>}
                    </View>
                    <View style={styles.cardText}>
                      <Text style={styles.cardTitle}>{f.title_fa}</Text>
                      {!!f.title_en && <Text style={styles.cardSub}>{f.title_en}</Text>}
                    </View>
                  </View>
                  <View style={styles.cardFoot}>
                    <View style={styles.footMeta}>
                      <BookMarked size={12} color={COLORS.muted} />
                      <Text style={styles.footText}>{t('specialtyWordCount').replace('{n}', toFa(f.word_count))}</Text>
                      <Text style={styles.footDot}>•</Text>
                      <Text style={[styles.footLevel, { color }]}>
                        {locked
                          ? t('specialtyLocked').replace('{level}', t(levelKey(f.min_level)))
                          : t('specialtyLevelFrom').replace('{level}', t(levelKey(f.min_level)))}
                      </Text>
                    </View>
                    {!locked && (
                      <View style={styles.enter}>
                        <ChevronLeft size={14} color={COLORS.primary} />
                        <Text style={styles.enterText}>{t('specialtyEnter')}</Text>
                      </View>
                    )}
                  </View>
                </TouchableOpacity>
              );
            })}
          </>
        )}
      </ScrollView>

      {!!firstOpen && (
        <View style={[styles.footer, { paddingBottom: insets.bottom + SPACING.m }]}>
          <TouchableOpacity style={styles.cta} onPress={() => openField((visible.find((f) => !isLocked(f)) ?? firstOpen).key)} activeOpacity={0.85}>
            <GradientFill from="#F07A4A" to="#E8572F" horizontal />
            <View style={styles.ctaInner}>
              <ArrowLeft size={18} color={COLORS.white} />
              <Text style={styles.ctaText}>{t('specialtyStartMine')}</Text>
            </View>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FDFBF7', paddingHorizontal: SPACING.l },
  body: { gap: 12, paddingBottom: SPACING.l },
  loader: { marginTop: SPACING.xl },
  mutedText: { ...TEXT_STYLES.bodyMd, color: '#716B62', textAlign: 'center' },
  linkText: { ...TEXT_STYLES.labelMd, color: '#FF6422', fontFamily: FONT_FAMILY.bold },
  search: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    height: 48,
    paddingHorizontal: 14,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#F0EBE3',
    marginTop: SPACING.s,
    shadowColor: '#1A1D26',
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
  },
  searchInput: { flex: 1, fontFamily: FONT_FAMILY.regular, fontSize: 13, color: '#1A1D26', textAlign: 'right', paddingVertical: 0 },
  chips: { flexDirection: 'row-reverse', gap: 8, paddingVertical: 2 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: '#F3EFE6',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  chipOn: { backgroundColor: '#FF6422', borderColor: '#FF6422' },
  chipText: { fontFamily: FONT_FAMILY.semiBold, fontSize: 12, color: '#716B62' },
  chipTextOn: { color: '#FFFFFF', fontFamily: FONT_FAMILY.bold },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 14,
    backgroundColor: '#FFF6E2',
    borderWidth: 1,
    borderColor: '#F3E3BC',
  },
  errorText: { flex: 1, fontFamily: FONT_FAMILY.regular, fontSize: 12, color: '#716B62', textAlign: 'right' },
  sectionRow: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between', marginTop: SPACING.s },
  sectionTitle: { fontFamily: FONT_FAMILY.bold, fontSize: 14, color: '#1A1D26' },
  sectionCount: { fontFamily: FONT_FAMILY.semiBold, fontSize: 11, color: '#9AA0AC' },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#F0EBE3',
    padding: 16,
    gap: 12,
    shadowColor: '#1A1D26',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  cardLocked: { opacity: 0.6 },
  cardTop: { flexDirection: 'row-reverse', alignItems: 'center', gap: 12 },
  cardIcon: { width: 48, height: 48, borderRadius: 16, backgroundColor: '#F3EFE6', alignItems: 'center', justifyContent: 'center' },
  emoji: { fontSize: 24 },
  cardText: { flex: 1, alignItems: 'flex-end' },
  cardTitle: { fontFamily: FONT_FAMILY.bold, fontSize: 15, color: '#1A1D26', textAlign: 'right' },
  cardSub: { fontFamily: FONT_FAMILY.regular, fontSize: 12, color: '#716B62', marginTop: 2 },
  cardFoot: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#F0EBE3',
    paddingTop: 10,
  },
  footMeta: { flex: 1, flexDirection: 'row-reverse', alignItems: 'center', gap: 5 },
  footText: { fontFamily: FONT_FAMILY.medium, fontSize: 11, color: '#716B62' },
  footDot: { color: '#9AA0AC', fontSize: 10 },
  footLevel: { flexShrink: 1, fontFamily: FONT_FAMILY.semiBold, fontSize: 11, textAlign: 'right' },
  enter: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  enterText: { fontFamily: FONT_FAMILY.bold, fontSize: 12, color: '#FF6422' },
  footer: { paddingTop: SPACING.s },
  cta: {
    height: 54,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: '#FF6422',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#FF6422',
    shadowOpacity: 0.28,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  ctaInner: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  ctaText: { fontFamily: FONT_FAMILY.bold, fontSize: 15, color: '#FFFFFF' },
});
