import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Volume2, X } from 'lucide-react-native';

import { COLORS, SPACING, BORDER_RADIUS } from '../../theme/colors';
import { FONT_FAMILY, TEXT_STYLES } from '../../theme/typography';
import { SHADOWS } from '../../theme/elevation';
import { useLanguage } from '../../data/i18n';
import { AudioPlayer } from '../../components/AudioPlayer';
import { fetchScene } from '../../api/scenes';
import { completePathItem } from '../../api/path';
import { Celebration } from '../../components/Celebration';

/** چند جمله با گوش دادن نوشته می‌شود و چند جمله از روی فارسی. */
const DICTATION_COUNT = 4;
const TRANSLATE_COUNT = 2;
const MAX_WORDS = 7;

interface Line {
  mode: 'listen' | 'translate';
  english: string;
  persian: string;
  audioUrl: string;
  image: any;
}

type Command = 'none' | 'play_original';

const CONTRACTIONS: Record<string, string> = {
  "i'm": 'i am', "you're": 'you are', "he's": 'he is', "she's": 'she is', "it's": 'it is',
  "we're": 'we are', "they're": 'they are', "that's": 'that is', "what's": 'what is',
  "where's": 'where is', "how's": 'how is', "who's": 'who is', "there's": 'there is',
  "here's": 'here is', "isn't": 'is not', "aren't": 'are not', "don't": 'do not',
  "doesn't": 'does not', "can't": 'can not', cannot: 'can not', "i'd": 'i would',
  "let's": 'let us', "i've": 'i have', "you'll": 'you will', "i'll": 'i will',
};

const NUMBERS = [
  'zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten',
  'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen', 'twenty',
];

/** متن را به کلمه‌های قابل مقایسه تبدیل می‌کند: حروف کوچک، بدون علامت، اختصارها باز، عدد به حروف. */
function tokens(text: string): string[] {
  const words = text
    .toLowerCase()
    .replace(/[’‘`]/g, "'")
    .replace(/[^a-z0-9'\s-]/g, ' ')
    .replace(/-/g, ' ')
    .split(/\s+/)
    .filter(Boolean);
  const out: string[] = [];
  for (const w of words) {
    const expanded = CONTRACTIONS[w] ?? (/^\d+$/.test(w) && NUMBERS[Number(w)] ? NUMBERS[Number(w)] : w);
    out.push(...expanded.split(' '));
  }
  return out;
}

/** کلمه‌های پاسخ که به ترتیب درست با جمله‌ی اصلی جورند (LCS). */
function matchAnswer(target: string[], answer: string[]): boolean[] {
  const n = target.length;
  const m = answer.length;
  const dp = Array.from({ length: n + 1 }, () => new Array<number>(m + 1).fill(0));
  for (let i = n - 1; i >= 0; i--) {
    for (let j = m - 1; j >= 0; j--) {
      dp[i][j] = target[i] === answer[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
    }
  }
  const ok = new Array<boolean>(m).fill(false);
  let i = 0;
  let j = 0;
  while (i < n && j < m) {
    if (target[i] === answer[j]) {
      ok[j] = true;
      i++;
      j++;
    } else if (dp[i + 1][j] >= dp[i][j + 1]) i++;
    else j++;
  }
  return ok;
}

function shuffle<T>(list: T[]): T[] {
  return [...list].sort(() => Math.random() - 0.5);
}

/**
 * «دیکته و نوشتن» مسیر آموزشی: چند جمله از صحنه‌های همین هفته را می‌شنود و
 * می‌نویسد، و چند جمله را از روی ترجمه‌ی فارسی خودش به انگلیسی می‌نویسد.
 * تصویر همان صحنه کنار جمله می‌آید تا موقعیت یادش بیاید. مقایسه آفلاین است
 * (بدون AI): کلمه‌های درست به ترتیب سبز می‌شوند.
 */
export const PathDictationScreen: React.FC = () => {
  const { t } = useLanguage();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const weekId: string = route.params?.weekId;
  const itemKey: string = route.params?.itemKey;
  const sceneIds: string[] = route.params?.sceneIds || [];

  const [lines, setLines] = useState<Line[] | null>(null);
  const [index, setIndex] = useState(0);
  const [answer, setAnswer] = useState('');
  const [checked, setChecked] = useState(false);
  const [scores, setScores] = useState<number[]>([]);
  const [done, setDone] = useState(false);
  const [command, setCommand] = useState<Command>('none');
  const [nonce, setNonce] = useState(0);

  const play = () => {
    setCommand('play_original');
    setNonce((n) => n + 1);
  };

  useEffect(() => {
    let active = true;
    Promise.all(sceneIds.map((id) => fetchScene(id).catch(() => null)))
      .then((scenes) => {
        const all: Omit<Line, 'mode'>[] = [];
        for (const sc of scenes) {
          if (!sc) continue;
          for (const h of sc.hotspots || []) {
            for (const d of h.conversation?.dialogues || []) {
              const words = d.english_text.trim().split(/\s+/).length;
              if (words >= 2 && words <= MAX_WORDS && d.persian_text.trim()) {
                all.push({ english: d.english_text.trim(), persian: d.persian_text.trim(), audioUrl: d.audio_url, image: sc.imageUri });
              }
            }
          }
        }
        const withAudio = shuffle(all.filter((l) => l.audioUrl));
        const listen = withAudio.slice(0, DICTATION_COUNT).map((l) => ({ ...l, mode: 'listen' as const }));
        const used = new Set(listen.map((l) => l.english));
        const translate = shuffle(all.filter((l) => !used.has(l.english)))
          .slice(0, TRANSLATE_COUNT)
          .map((l) => ({ ...l, mode: 'translate' as const }));
        if (active) setLines([...listen, ...translate]);
      })
      .catch(() => active && setLines([]));
    return () => {
      active = false;
    };
  }, [sceneIds]);

  const line = lines?.[index];

  // پخش خودکار جمله‌ی دیکته وقتی کارت عوض می‌شود.
  useEffect(() => {
    if (line?.mode === 'listen' && line.audioUrl) {
      const timer = setTimeout(play, 400);
      return () => clearTimeout(timer);
    }
  }, [line]);

  const result = useMemo(() => {
    if (!checked || !line) return null;
    const target = tokens(line.english);
    const given = tokens(answer);
    const ok = matchAnswer(target, given);
    const matched = ok.filter(Boolean).length;
    const score = target.length ? Math.round((matched / Math.max(target.length, given.length)) * 100) : 0;
    return { given, ok, score };
  }, [checked, line, answer]);

  const check = () => {
    if (!answer.trim()) return;
    setChecked(true);
  };

  const next = () => {
    const nextScores = [...scores, result?.score ?? 0];
    setScores(nextScores);
    if (lines && index + 1 < lines.length) {
      setIndex(index + 1);
      setAnswer('');
      setChecked(false);
      return;
    }
    setDone(true);
    if (weekId && itemKey) completePathItem(weekId, itemKey).catch(() => {});
  };

  const avg = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;

  return (
    <KeyboardAvoidingView
      style={[styles.container, { paddingTop: insets.top + SPACING.s, paddingBottom: insets.bottom + SPACING.l }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <AudioPlayer uri={line?.audioUrl || null} shouldPlay={false} actionCommand={command} actionNonce={nonce} />

      <View style={styles.topRow}>
        <TouchableOpacity style={styles.closeBtn} onPress={() => navigation.goBack()} activeOpacity={0.8}>
          <X size={20} color={COLORS.text} />
        </TouchableOpacity>
        {lines && lines.length > 0 && !done && (
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${((index + 1) / lines.length) * 100}%` }]} />
          </View>
        )}
      </View>

      {!lines && (
        <View style={styles.center}>
          <ActivityIndicator color={COLORS.primary} />
        </View>
      )}

      {lines && lines.length === 0 && (
        <View style={styles.center}>
          <Text style={styles.muted}>{t('pathWeakEmpty')}</Text>
          <TouchableOpacity style={styles.primaryBtn} onPress={() => navigation.goBack()} activeOpacity={0.85}>
            <Text style={styles.primaryBtnText}>{t('pathBack')}</Text>
          </TouchableOpacity>
        </View>
      )}

      {line && !done && (
        <>
          <ScrollView contentContainerStyle={styles.cardWrap} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            <Text style={styles.instruction}>
              {t(line.mode === 'listen' ? 'pathDictationListen' : 'pathDictationTranslate')}
            </Text>
            <View style={styles.card}>
              {!!line.image && <Image source={line.image} style={styles.image} resizeMode="cover" />}
              {line.mode === 'translate' && <Text style={styles.persian}>{line.persian}</Text>}
              {line.mode === 'listen' && (
                <TouchableOpacity style={styles.playBtn} onPress={play} activeOpacity={0.85}>
                  <Volume2 size={22} color={COLORS.white} />
                  <Text style={styles.playText}>{t('pathDictationPlay')}</Text>
                </TouchableOpacity>
              )}
              <TextInput
                style={styles.input}
                value={answer}
                onChangeText={setAnswer}
                editable={!checked}
                placeholder={t('pathDictationPlaceholder')}
                placeholderTextColor={COLORS.muted}
                autoCapitalize="none"
                autoCorrect={false}
                spellCheck={false}
                keyboardType="default"
                multiline
              />
            </View>

            {result && (
              <View style={styles.feedback}>
                <Text style={styles.score}>{result.score}</Text>
                <View style={styles.answerRow}>
                  {result.given.map((w, i) => (
                    <Text key={i} style={[styles.word, result.ok[i] ? styles.wordOk : styles.wordBad]}>
                      {w}
                    </Text>
                  ))}
                </View>
                <Text style={styles.correctLabel}>{t('pathDictationCorrect')}</Text>
                <Text style={styles.english}>{line.english}</Text>
                {line.mode === 'listen' && <Text style={styles.muted}>{line.persian}</Text>}
              </View>
            )}
          </ScrollView>

          <View style={styles.bottom}>
            {checked ? (
              <TouchableOpacity style={styles.primaryBtn} onPress={next} activeOpacity={0.85}>
                <Text style={styles.primaryBtnText}>{t(index + 1 < lines!.length ? 'courseNext' : 'courseFinish')}</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={[styles.primaryBtn, !answer.trim() && styles.disabled]}
                onPress={check}
                disabled={!answer.trim()}
                activeOpacity={0.85}
              >
                <Text style={styles.primaryBtnText}>{t('pathDictationCheck')}</Text>
              </TouchableOpacity>
            )}
          </View>
        </>
      )}

      {done && (
        <View style={styles.center}>
          <Celebration kind="courseDone" size={160} />
          <Text style={styles.doneTitle}>{t('pathDictationDone')}</Text>
          <Text style={styles.muted}>{t('pathWeakAverage').replace('{n}', String(avg))}</Text>
          <TouchableOpacity style={styles.primaryBtn} onPress={() => navigation.goBack()} activeOpacity={0.85}>
            <Text style={styles.primaryBtnText}>{t('pathBack')}</Text>
          </TouchableOpacity>
        </View>
      )}
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background, paddingHorizontal: SPACING.m },
  topRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.m },
  closeBtn: {
    width: 40,
    height: 40,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.level1,
  },
  progressTrack: { flex: 1, height: 8, borderRadius: BORDER_RADIUS.full, backgroundColor: COLORS.surfaceHigh, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: COLORS.primary, borderRadius: BORDER_RADIUS.full },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: SPACING.m },
  muted: { ...TEXT_STYLES.bodyMd, color: COLORS.muted, textAlign: 'center' },
  cardWrap: { paddingVertical: SPACING.l, gap: SPACING.m },
  instruction: { ...TEXT_STYLES.bodyMd, color: COLORS.textSecondary, textAlign: 'center' },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.m,
    alignItems: 'center',
    gap: SPACING.m,
    ...SHADOWS.level1,
  },
  image: { width: '100%', aspectRatio: 16 / 9, borderRadius: BORDER_RADIUS.l },
  persian: { ...TEXT_STYLES.headlineSm, color: COLORS.text, textAlign: 'center' },
  playBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.full,
    paddingVertical: SPACING.s,
    paddingHorizontal: SPACING.l,
  },
  playText: { ...TEXT_STYLES.bodyMd, fontFamily: FONT_FAMILY.semiBold, color: COLORS.white },
  input: {
    alignSelf: 'stretch',
    minHeight: 56,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.l,
    paddingHorizontal: SPACING.m,
    paddingVertical: SPACING.s,
    ...TEXT_STYLES.bodyLg,
    color: COLORS.text,
    textAlign: 'left',
    writingDirection: 'ltr',
  },
  feedback: { alignItems: 'center', gap: SPACING.xs },
  score: { fontFamily: FONT_FAMILY.bold, fontSize: 40, color: COLORS.primary },
  answerRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 6, direction: 'ltr' },
  word: { ...TEXT_STYLES.bodyLg, fontFamily: FONT_FAMILY.semiBold, paddingHorizontal: 6, borderRadius: 6, overflow: 'hidden' },
  wordOk: { color: COLORS.success, backgroundColor: COLORS.successLight },
  wordBad: { color: COLORS.error, backgroundColor: COLORS.errorLight, textDecorationLine: 'line-through' },
  correctLabel: { ...TEXT_STYLES.labelMd, color: COLORS.muted, marginTop: SPACING.s },
  english: { ...TEXT_STYLES.headlineSm, color: COLORS.primary, textAlign: 'center', writingDirection: 'ltr' },
  bottom: { paddingTop: SPACING.s },
  primaryBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.full,
    paddingVertical: SPACING.m,
    paddingHorizontal: SPACING.l,
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabled: { opacity: 0.5 },
  primaryBtnText: { ...TEXT_STYLES.bodyMd, fontFamily: FONT_FAMILY.semiBold, color: COLORS.white },
  doneTitle: { ...TEXT_STYLES.headlineSm, color: COLORS.text, textAlign: 'center' },
});
