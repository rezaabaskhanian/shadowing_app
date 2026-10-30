import React, { useMemo, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Check, Info, X } from 'lucide-react-native';

import { COLORS, SPACING } from '../../theme/colors';
import { FONT_FAMILY, TEXT_STYLES } from '../../theme/typography';
import { useLanguage } from '../../data/i18n';
import type { VocabTestItem } from '../../api/assessment';

/** اگر کاربر در لایه‌ی ۳ دست‌کم این سهم را بداند، دور دوم (لایه‌های ۴ و ۵) هم نشان داده می‌شود. */
const STAGE_TWO_THRESHOLD = 0.7;

interface Props {
  items: VocabTestItem[];
  onDone: (answers: { item_id: string; known: boolean }[]) => void;
}

/**
 * بخش ۱ تست نسخه‌ی ۲: «این کلمه را می‌شناسی؟». یک کلمه در هر صفحه، دو دکمه.
 * کلمه‌های ساختگی بین کلمه‌های واقعی پخش شده‌اند و کاربر از آن‌ها خبر ندارد.
 */
export const PlacementVocabScreen: React.FC<Props> = ({ items, onDone }) => {
  const { t, language } = useLanguage();
  const rtl = language === 'fa';
  const insets = useSafeAreaInsets();

  const stageOne = useMemo(() => items.filter((i) => i.stage === 1), [items]);
  const stageTwo = useMemo(() => items.filter((i) => i.stage === 2), [items]);

  const [queue, setQueue] = useState<VocabTestItem[]>(stageOne);
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<{ item_id: string; known: boolean }[]>([]);
  const [stage, setStage] = useState(1);

  const current = queue[index];
  // تعداد کل تخمینی برای نوار پیشرفت؛ دور دوم ممکن است اصلاً نیاید.
  const total = stage === 1 ? stageOne.length : stageOne.length + stageTwo.length;
  const done = answers.length;

  const answer = (known: boolean) => {
    if (!current) return;
    const next = [...answers, { item_id: current.id, known }];
    setAnswers(next);

    if (index + 1 < queue.length) {
      setIndex(index + 1);
      return;
    }
    if (stage === 1 && stageTwo.length > 0) {
      const band3 = stageOne.filter((i) => i.band === 3);
      const knownIds = new Set(next.filter((a) => a.known).map((a) => a.item_id));
      const rate = band3.length ? band3.filter((i) => knownIds.has(i.id)).length / band3.length : 0;
      if (rate >= STAGE_TWO_THRESHOLD) {
        setStage(2);
        setQueue(stageTwo);
        setIndex(0);
        return;
      }
    }
    onDone(next);
  };

  if (!current) return null;

  const [partLabel, partName] = t('placementV2VocabKicker').split(' · ');

  return (
    <View style={[styles.container, { paddingTop: insets.top + SPACING.l, paddingBottom: insets.bottom + SPACING.l }]}>
      <View style={styles.header}>
        {/* «بخش ۱ از ۳» در کپسول نارنجی، اسم بخش کنارش */}
        <View style={[styles.kickerRow, rtl && styles.rowReverse]}>
          <View style={styles.partChip}>
            <Text style={styles.partChipText}>{partLabel}</Text>
          </View>
          {!!partName && <Text style={styles.partName}>• {partName}</Text>}
        </View>
        <View style={[styles.progressTrack, rtl && styles.rowReverse]}>
          <View style={[styles.progressFill, { width: `${Math.max(6, Math.min(100, (done / Math.max(1, total)) * 100))}%` }]} />
        </View>
        <Text style={styles.hint}>{t('placementV2VocabHint')}</Text>
      </View>

      <View style={styles.cardOuter}>
        <View style={styles.card}>
          <Text style={styles.word}>{current.word}</Text>
          <Text style={styles.wordLabel}>TARGET WORD</Text>
        </View>
      </View>

      <View style={styles.footerBlock}>
        <View style={[styles.noteRow, rtl && styles.rowReverse]}>
          <Info size={13} color={COLORS.muted} />
          <Text style={styles.note}>{t('placementV2VocabNote')}</Text>
        </View>
        <View style={[styles.buttons, rtl && styles.rowReverse]}>
          <TouchableOpacity style={[styles.btn, styles.btnNo]} onPress={() => answer(false)} activeOpacity={0.85}>
            <X size={20} color={COLORS.error} />
            <Text style={[styles.btnText, { color: COLORS.error }]}>{t('placementV2VocabNo')}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.btn, styles.btnYes]} onPress={() => answer(true)} activeOpacity={0.85}>
            <Check size={20} color={COLORS.white} />
            <Text style={[styles.btnText, { color: COLORS.white }]}>{t('placementV2VocabYes')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAF8F4', paddingHorizontal: SPACING.l, justifyContent: 'space-between' },
  rowReverse: { flexDirection: 'row-reverse' },
  header: { gap: 12, alignItems: 'center' },
  kickerRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  partChip: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 10, backgroundColor: '#FDEBE4' },
  partChipText: { fontFamily: FONT_FAMILY.bold, fontSize: 12, color: COLORS.primary },
  partName: { fontFamily: FONT_FAMILY.medium, fontSize: 12, color: COLORS.muted },
  hint: { ...TEXT_STYLES.labelSm, color: COLORS.textSecondary, textAlign: 'center', lineHeight: 20 },
  progressTrack: { flexDirection: 'row', alignSelf: 'stretch', marginHorizontal: SPACING.l, height: 6, borderRadius: 3, backgroundColor: '#ECE8E0', overflow: 'hidden' },
  progressFill: { height: 6, borderRadius: 3, backgroundColor: COLORS.primary },
  cardOuter: {
    marginHorizontal: SPACING.m,
    padding: 10,
    borderRadius: 26,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: '#EFEAE2',
    shadowColor: '#1A1D26',
    shadowOpacity: 0.07,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },
  card: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#F1ECE4',
    backgroundColor: '#FFFDFB',
    paddingVertical: SPACING.xl * 1.6,
    alignItems: 'center',
    gap: 6,
  },
  word: { fontFamily: FONT_FAMILY.bold, fontSize: 36, color: '#C24A28' },
  wordLabel: { fontFamily: FONT_FAMILY.semiBold, fontSize: 11, letterSpacing: 1.5, color: COLORS.muted },
  footerBlock: { gap: SPACING.l },
  noteRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  note: { fontFamily: FONT_FAMILY.regular, fontSize: 11, color: COLORS.muted },
  buttons: { flexDirection: 'row', gap: SPACING.m },
  btn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, height: 54, borderRadius: 16 },
  btnNo: { backgroundColor: '#FDF1EE', borderWidth: 1.5, borderColor: '#F3C5B8' },
  btnYes: { backgroundColor: '#2F6B4F', borderBottomWidth: 3, borderBottomColor: '#245640' },
  btnText: { fontFamily: FONT_FAMILY.bold, fontSize: 15 },
});
