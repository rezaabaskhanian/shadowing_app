import React, { useMemo, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Check, X } from 'lucide-react-native';

import { COLORS, SPACING, BORDER_RADIUS } from '../../theme/colors';
import { FONT_FAMILY, TEXT_STYLES } from '../../theme/typography';
import { SHADOWS } from '../../theme/elevation';
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
  const { t } = useLanguage();
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

  return (
    <View style={[styles.container, { paddingTop: insets.top + SPACING.l, paddingBottom: insets.bottom + SPACING.l }]}>
      <View style={{ gap: SPACING.s }}>
        <Text style={styles.kicker}>{t('placementV2VocabKicker')}</Text>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${Math.min(100, (done / Math.max(1, total)) * 100)}%` }]} />
        </View>
        <Text style={styles.hint}>{t('placementV2VocabHint')}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.word}>{current.word}</Text>
      </View>

      <View style={styles.buttons}>
        <TouchableOpacity style={[styles.btn, styles.btnNo]} onPress={() => answer(false)} activeOpacity={0.85}>
          <X size={22} color={COLORS.error} />
          <Text style={[styles.btnText, { color: COLORS.error }]}>{t('placementV2VocabNo')}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.btn, styles.btnYes]} onPress={() => answer(true)} activeOpacity={0.85}>
          <Check size={22} color={COLORS.white} />
          <Text style={[styles.btnText, { color: COLORS.white }]}>{t('placementV2VocabYes')}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    paddingHorizontal: SPACING.l,
    justifyContent: 'space-between',
  },
  kicker: {
    ...TEXT_STYLES.labelMd,
    color: COLORS.primary,
    textAlign: 'center',
  },
  hint: {
    ...TEXT_STYLES.labelSm,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  progressTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.border,
    overflow: 'hidden',
  },
  progressFill: {
    height: 6,
    backgroundColor: COLORS.secondary,
  },
  card: {
    backgroundColor: COLORS.primaryLight,
    borderRadius: BORDER_RADIUS.l,
    borderWidth: 2,
    borderColor: COLORS.primary,
    paddingVertical: SPACING.xl * 2,
    alignItems: 'center',
    ...SHADOWS.level1,
  },
  word: {
    fontFamily: FONT_FAMILY.bold,
    fontSize: 34,
    color: COLORS.primary,
  },
  buttons: {
    flexDirection: 'row',
    gap: SPACING.m,
  },
  btn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.xs,
    paddingVertical: SPACING.m,
    borderRadius: BORDER_RADIUS.l,
  },
  btnNo: {
    backgroundColor: COLORS.errorLight,
    borderWidth: 1.5,
    borderColor: COLORS.error,
  },
  btnYes: {
    backgroundColor: COLORS.success,
  },
  btnText: {
    fontFamily: FONT_FAMILY.bold,
    fontSize: 15,
  },
});
