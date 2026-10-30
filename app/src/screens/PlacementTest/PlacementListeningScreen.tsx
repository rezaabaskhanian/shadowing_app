import React, { useCallback, useMemo, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Volume2 } from 'lucide-react-native';

import { COLORS, SPACING } from '../../theme/colors';
import { FONT_FAMILY, TEXT_STYLES } from '../../theme/typography';
import { useLanguage } from '../../data/i18n';
import { AudioPlayer } from '../../components/AudioPlayer';
import { absUrl } from '../../api/config';
import { CEFR_LEVELS, type CefrLevel, type ListenTestItem } from '../../api/assessment';

const MAX_PLAYS = 2;
const OPTION_COLORS = ['#3B6EF0', '#2F8A5B', '#E9A23B'];
const START_LEVEL: CefrLevel = 'A2';

interface Props {
  items: ListenTestItem[];
  onDone: (answers: { item_id: string; choice: number }[]) => void;
}

type PlaybackState = 'idle' | 'loading' | 'playing';

/**
 * بخش ۲ تست نسخه‌ی ۲: یک جمله پخش می‌شود (حداکثر دو بار) و کاربر معنی درست
 * را از سه گزینه انتخاب می‌کند. تطبیقی: از A2 شروع می‌شود؛ با ۲ از ۳ درست یک
 * سطح بالا می‌رود، وگرنه یک سطح پایین؛ وقتی جهت عوض شود یا به سقف/کف برسد
 * تمام می‌شود.
 */
export const PlacementListeningScreen: React.FC<Props> = ({ items, onDone }) => {
  const { t, language } = useLanguage();
  // فارسی: حرف گزینه سمت راست؛ جمله‌ها راست‌چین.
  const rtl = language === 'fa';
  const insets = useSafeAreaInsets();

  const byLevel = useMemo(() => {
    const m: Record<string, ListenTestItem[]> = {};
    for (const it of items) (m[it.cefr] ||= []).push(it);
    return m;
  }, [items]);
  const available = useMemo(() => CEFR_LEVELS.filter((l) => byLevel[l]?.length), [byLevel]);
  const firstLevel = available.includes(START_LEVEL) ? START_LEVEL : available[0];

  const [level, setLevel] = useState<CefrLevel>(firstLevel);
  const [index, setIndex] = useState(0);
  const [levelCorrect, setLevelCorrect] = useState(0);
  const [direction, setDirection] = useState<'up' | 'down' | null>(null);
  const [answers, setAnswers] = useState<{ item_id: string; choice: number }[]>([]);
  const [plays, setPlays] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);

  const [uri, setUri] = useState<string | null>(null);
  const [actionCommand, setActionCommand] = useState<'none' | 'play_original'>('none');
  const [actionNonce, setActionNonce] = useState(0);
  const [playback, setPlayback] = useState<PlaybackState>('idle');

  const levelItems = byLevel[level] || [];
  const current = levelItems[index];
  const totalLevels = available.length;

  const play = useCallback(() => {
    if (!current || plays >= MAX_PLAYS) return;
    setPlays((n) => n + 1);
    setUri(absUrl(current.audio_url));
    setActionCommand('play_original');
    setActionNonce((n) => n + 1);
  }, [current, plays]);

  const handleStatus = useCallback((s: 'loading' | 'playing' | 'paused' | 'finished' | 'error' | 'no_audio') => {
    if (s === 'playing') setPlayback('playing');
    else if (s === 'loading') setPlayback('loading');
    else setPlayback('idle');
  }, []);

  const confirm = () => {
    if (!current || selected === null) return;
    const next = [...answers, { item_id: current.id, choice: selected }];
    const correct = levelCorrect + (selected === current.correct_index ? 1 : 0);
    setAnswers(next);
    setSelected(null);
    setPlays(0);
    setUri(null);
    setActionCommand('none');

    if (index + 1 < levelItems.length) {
      setIndex(index + 1);
      setLevelCorrect(correct);
      return;
    }

    // سطح تمام شد: تصمیم تطبیقی
    const passed = correct / levelItems.length >= 2 / 3 - 1e-9;
    const pos = available.indexOf(level);
    let nextLevel: CefrLevel | null = null;
    if (passed && direction !== 'down' && pos + 1 < available.length) {
      nextLevel = available[pos + 1];
      setDirection('up');
    } else if (!passed && direction !== 'up' && pos > 0) {
      nextLevel = available[pos - 1];
      setDirection('down');
    }
    if (!nextLevel) {
      onDone(next);
      return;
    }
    setLevel(nextLevel);
    setIndex(0);
    setLevelCorrect(0);
  };

  if (!current) return null;

  return (
    <View style={[styles.container, { paddingTop: insets.top + SPACING.l, paddingBottom: insets.bottom + SPACING.l }]}>
      <AudioPlayer
        uri={uri}
        shouldPlay={false}
        actionCommand={actionCommand}
        actionNonce={actionNonce}
        onPlaybackStatusUpdate={handleStatus}
      />

      <View style={styles.header}>
        {/* نوار پیشرفت سه‌بخشی: لغت تمام، شنیدن در حال انجام */}
        <View style={[styles.partsTrack, rtl && styles.rowReverse]}>
          <View style={[styles.partSeg, styles.partDone]} />
          <View style={[styles.partSeg, styles.partActive]} />
          <View style={styles.partSeg} />
        </View>
        <Text style={styles.kicker}>{t('placementV2ListenKicker').replace(' · ', ' • ')}</Text>
        <Text style={styles.hint}>
          {t('placementV2ListenStep')
            .replace('{current}', String(available.indexOf(level) + 1))
            .replace('{total}', String(totalLevels))}
        </Text>
      </View>

      <View style={styles.card}>
        <TouchableOpacity
          style={[styles.playBtn, plays >= MAX_PLAYS && styles.playBtnDisabled]}
          onPress={play}
          disabled={plays >= MAX_PLAYS || playback === 'loading'}
          activeOpacity={0.85}
        >
          <Volume2 size={30} color={COLORS.white} />
        </TouchableOpacity>
        <Text style={styles.playHint}>
          <Text style={styles.playDot}>● </Text>
          {playback === 'playing'
            ? t('placementV2Playing')
            : t('placementV2PlaysLeft').replace('{n}', String(MAX_PLAYS - plays))}
        </Text>
        <Text style={styles.prompt}>{current.prompt || t('placementV2ListenPrompt')}</Text>
      </View>

      <View style={{ gap: SPACING.s }}>
        {current.options.map((o, i) => (
          <TouchableOpacity
            key={i}
            style={[styles.option, rtl && styles.rowReverse, selected === i && styles.optionSelected]}
            onPress={() => setSelected(i)}
            disabled={plays === 0}
            activeOpacity={0.85}
          >
            <View style={[styles.badge, { backgroundColor: OPTION_COLORS[i % OPTION_COLORS.length] }]}>
              <Text style={styles.badgeText}>{String.fromCharCode(65 + i)}</Text>
            </View>
            <Text style={[styles.optionText, { textAlign: rtl ? 'right' : 'left' }, plays === 0 && { opacity: 0.4 }]}>{o}</Text>
          </TouchableOpacity>
        ))}
        <TouchableOpacity
          style={[styles.confirmBtn, selected === null && styles.confirmBtnDisabled]}
          onPress={confirm}
          disabled={selected === null}
          activeOpacity={0.85}
        >
          <Text style={styles.confirmBtnText}>{t('placementConfirmNextBtn')}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F7F8FB', paddingHorizontal: SPACING.l, justifyContent: 'space-between' },
  rowReverse: { flexDirection: 'row-reverse' },
  header: { gap: 8, alignItems: 'center' },
  partsTrack: { flexDirection: 'row', gap: 6, width: '62%', marginBottom: 6 },
  partSeg: { flex: 1, height: 4, borderRadius: 2, backgroundColor: '#E3E6ED' },
  partDone: { backgroundColor: '#B9C8F5' },
  partActive: { backgroundColor: '#3B6EF0' },
  kicker: { fontFamily: FONT_FAMILY.bold, fontSize: 15, color: '#2F5BD8', textAlign: 'center' },
  hint: { ...TEXT_STYLES.labelSm, color: COLORS.textSecondary, textAlign: 'center' },
  card: {
    backgroundColor: '#EEF3FE',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#D7E2FB',
    padding: SPACING.l,
    alignItems: 'center',
    gap: SPACING.s,
  },
  playBtn: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: '#3B6EF0',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#3B6EF0',
    shadowOpacity: 0.35,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 5 },
    elevation: 5,
  },
  playBtnDisabled: { backgroundColor: '#C7CEDC', shadowOpacity: 0 },
  playHint: { ...TEXT_STYLES.labelSm, color: COLORS.textSecondary, marginTop: 4 },
  playDot: { color: '#3B6EF0', fontSize: 9 },
  prompt: { fontFamily: FONT_FAMILY.bold, fontSize: 16, color: COLORS.text, textAlign: 'center' },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.m,
    backgroundColor: COLORS.white,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#ECEEF3',
    paddingVertical: 14,
    paddingHorizontal: 14,
  },
  optionSelected: { borderColor: COLORS.primary, backgroundColor: '#FFF6F1' },
  badge: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  badgeText: { color: COLORS.white, fontFamily: FONT_FAMILY.bold, fontSize: 13 },
  optionText: { flex: 1, fontFamily: FONT_FAMILY.semiBold, fontSize: 14, color: COLORS.text },
  confirmBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 16,
    height: 54,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: SPACING.s,
  },
  confirmBtnDisabled: { backgroundColor: '#E6E3DC' },
  confirmBtnText: { color: COLORS.white, fontFamily: FONT_FAMILY.bold, fontSize: 15 },
});
