import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import TrackPlayer, { Event, State } from 'react-native-track-player';
import { Pause, Play, RotateCcw, Snail, X } from 'lucide-react-native';

import { COLORS, SPACING, BORDER_RADIUS } from '../../theme/colors';
import { FONT_FAMILY, TEXT_STYLES } from '../../theme/typography';
import { useLanguage } from '../../data/i18n';
import { absUrl } from '../../api/config';
import { getPodcast, type Podcast } from '../../api/podcasts';
import { ensureTrackPlayerSetup } from '../../services/audio/trackPlayerSetup';
import { matchBoth, tokens } from '../../services/dictation';
import { track } from '../../services/analytics';
import { formatDuration } from './PodcastListScreen';

const TRACK_ID = 'podcast-dictation';
const BACK_SECONDS = 5;
const SLOW_RATE = 0.75;

interface Word {
  text: string;
  ok: boolean;
}

/** کلمه‌ها را به توکن‌های مقایسه‌ای تبدیل می‌کند و برای هر توکن می‌گوید مال کدام کلمه است. */
function flatten(words: string[]) {
  const toks: string[] = [];
  const owner: number[] = [];
  words.forEach((w, i) =>
    tokens(w).forEach((tk) => {
      toks.push(tk);
      owner.push(i);
    }),
  );
  return { toks, owner };
}

/** یک کلمه درست است اگر همه‌ی توکن‌هایش (مثلاً I'm → i am) جور شده باشند. */
function markWords(words: string[], owner: number[], ok: boolean[]): Word[] {
  return words.map((text, i) => {
    const mine = owner.flatMap((o, k) => (o === i ? [ok[k]] : []));
    return { text, ok: mine.length > 0 && mine.every(Boolean) };
  });
}

/**
 * دیکته از پادکست: کل پادکست پشت سر هم پخش می‌شود و متنش هیچ‌جا دیده نمی‌شود.
 * کاربر هر جا خواست مکث می‌کند، چند ثانیه عقب می‌رود یا آهسته‌اش می‌کند و هر چه
 * می‌شنود می‌نویسد. فقط با «بررسی» متن اصلی (تا جایی که گوش داده) با نوشته‌ی او
 * مقایسه و نشان داده می‌شود.
 */
export const PodcastDictationScreen: React.FC = () => {
  const { t } = useLanguage();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const podcastId: string | undefined = route.params?.podcastId;

  const [podcast, setPodcast] = useState<Podcast | null>(null);
  const [failed, setFailed] = useState(false);
  const [ready, setReady] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [slow, setSlow] = useState(false);
  const [positionMs, setPositionMs] = useState(0);
  // دورترین جایی که کاربر گوش داده؛ بررسی فقط تا همین‌جا حساب می‌شود.
  const heardRef = useRef(0);
  const [answer, setAnswer] = useState('');
  const [result, setResult] = useState<{ answer: Word[]; target: Word[]; pct: number; missed: number } | null>(null);

  useEffect(() => {
    if (!podcastId) return;
    let active = true;
    getPodcast(podcastId)
      .then(async (p) => {
        if (!active) return;
        setPodcast(p);
        await ensureTrackPlayerSetup();
        await TrackPlayer.reset();
        await TrackPlayer.add({ id: TRACK_ID, url: absUrl(p.audio_url), title: p.title });
        if (active) setReady(true);
        track('podcast_dictation_opened', p.id);
      })
      .catch(() => active && setFailed(true));
    return () => {
      active = false;
    };
  }, [podcastId]);

  useEffect(() => {
    const progressSub = TrackPlayer.addEventListener(Event.PlaybackProgressUpdated, (d) => {
      const ms = Math.round(d.position * 1000);
      setPositionMs(ms);
      if (ms > heardRef.current) heardRef.current = ms;
    });
    const stateSub = TrackPlayer.addEventListener(Event.PlaybackState, (d) => setPlaying(d.state === State.Playing));
    const endedSub = TrackPlayer.addEventListener(Event.PlaybackQueueEnded, () => {
      setPlaying(false);
      heardRef.current = Number.MAX_SAFE_INTEGER;
    });
    return () => {
      progressSub.remove();
      stateSub.remove();
      endedSub.remove();
    };
  }, []);

  useFocusEffect(
    useCallback(
      () => () => {
        TrackPlayer.pause().catch(() => {});
        TrackPlayer.setRate(1).catch(() => {});
      },
      [],
    ),
  );

  const togglePlay = async () => {
    if (!ready) return;
    if (playing) {
      await TrackPlayer.pause();
      return;
    }
    if (podcast && positionMs >= podcast.duration_seconds * 1000 - 300) await TrackPlayer.seekTo(0);
    await TrackPlayer.play();
  };

  const back = async () => {
    const { position } = await TrackPlayer.getProgress();
    await TrackPlayer.seekTo(Math.max(0, position - BACK_SECONDS));
  };

  const toggleSlow = async () => {
    const next = !slow;
    setSlow(next);
    await TrackPlayer.setRate(next ? SLOW_RATE : 1).catch(() => {});
  };

  const check = async () => {
    if (!podcast || !answer.trim()) return;
    await TrackPlayer.pause().catch(() => {});
    // فقط جمله‌هایی که پخششان شروع شده؛ بقیه‌ی پادکست هنوز شنیده نشده.
    const heard = podcast.lines.filter((l) => l.start_ms <= heardRef.current);
    const targetWords = heard.map((l) => l.text).join(' ').split(/\s+/).filter(Boolean);
    const answerWords = answer.trim().split(/\s+/).filter(Boolean);
    const tg = flatten(targetWords);
    const an = flatten(answerWords);
    const { targetOk, answerOk } = matchBoth(tg.toks, an.toks);
    const target = markWords(targetWords, tg.owner, targetOk);
    const pct = tg.toks.length ? Math.round((targetOk.filter(Boolean).length / tg.toks.length) * 100) : 0;
    setResult({
      answer: markWords(answerWords, an.owner, answerOk),
      target,
      pct,
      missed: target.filter((w) => !w.ok).length,
    });
    track('podcast_dictation_done', podcast.id);
  };

  const duration = podcast?.duration_seconds ?? 0;
  const progress = duration > 0 ? Math.min(1, positionMs / (duration * 1000)) : 0;

  return (
    <KeyboardAvoidingView
      style={[styles.container, { paddingTop: insets.top + SPACING.s, paddingBottom: insets.bottom + SPACING.m }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.topRow}>
        <TouchableOpacity style={styles.closeBtn} onPress={() => navigation.goBack()} activeOpacity={0.8}>
          <X size={20} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.title} numberOfLines={1}>
          {t('podcastDictationTitle')}
        </Text>
      </View>

      {failed && (
        <View style={styles.center}>
          <Text style={styles.muted}>{t('podcastLoadError')}</Text>
        </View>
      )}
      {!podcast && !failed && (
        <View style={styles.center}>
          <ActivityIndicator color={COLORS.primary} />
        </View>
      )}

      {podcast && (
        <>
          <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            <Text style={styles.podcastTitle}>{podcast.title}</Text>
            {!result ? (
              <>
                <Text style={styles.instruction}>{t('podcastDictationHint')}</Text>
                <TextInput
                  style={styles.input}
                  value={answer}
                  onChangeText={setAnswer}
                  placeholder={t('pathDictationPlaceholder')}
                  placeholderTextColor={COLORS.muted}
                  autoCapitalize="none"
                  autoCorrect={false}
                  multiline
                />
              </>
            ) : (
              <>
                <View style={styles.scoreCard}>
                  <Text style={styles.score}>{result.pct}%</Text>
                  <Text style={styles.scoreSub}>{t('podcastDictationMissed').replace('{n}', String(result.missed))}</Text>
                </View>
                <Text style={styles.sectionLabel}>{t('podcastDictationYours')}</Text>
                <View style={styles.wordsBox}>
                  {result.answer.map((w, i) => (
                    <Text key={i} style={[styles.word, w.ok ? styles.wordOk : styles.wordBad]}>
                      {w.text}
                    </Text>
                  ))}
                </View>
                <Text style={styles.sectionLabel}>{t('podcastDictationCorrect')}</Text>
                <View style={styles.wordsBox}>
                  {result.target.map((w, i) => (
                    <Text key={i} style={[styles.word, w.ok ? styles.wordPlain : styles.wordMissed]}>
                      {w.text}
                    </Text>
                  ))}
                </View>
              </>
            )}
          </ScrollView>

          {/* پخش‌کننده: پخش/مکث، چند ثانیه عقب، آهسته */}
          {!result && (
            <View style={styles.player}>
              <View style={styles.progressTrack}>
                <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
              </View>
              <View style={styles.timeRow}>
                <Text style={styles.time}>{formatDuration(positionMs / 1000)}</Text>
                <Text style={styles.time}>{formatDuration(duration)}</Text>
              </View>
              <View style={styles.controls}>
                <TouchableOpacity style={styles.sideBtn} onPress={back} disabled={!ready} activeOpacity={0.8}>
                  <RotateCcw size={18} color={COLORS.text} />
                  <Text style={styles.sideText}>{BACK_SECONDS}s</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.playBtn} onPress={togglePlay} disabled={!ready} activeOpacity={0.85}>
                  {!ready ? (
                    <ActivityIndicator color={COLORS.white} />
                  ) : playing ? (
                    <Pause size={24} color={COLORS.white} fill={COLORS.white} />
                  ) : (
                    <Play size={24} color={COLORS.white} fill={COLORS.white} />
                  )}
                </TouchableOpacity>
                <TouchableOpacity style={[styles.sideBtn, slow && styles.sideBtnOn]} onPress={toggleSlow} activeOpacity={0.8}>
                  <Snail size={18} color={COLORS.text} />
                  <Text style={styles.sideText}>{t('podcastDictationSlow')}</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          <View style={styles.footer}>
            {!result ? (
              <TouchableOpacity
                style={[styles.primaryBtn, !answer.trim() && styles.btnDisabled]}
                onPress={check}
                disabled={!answer.trim()}
                activeOpacity={0.85}
              >
                <Text style={styles.primaryBtnText}>{t('podcastDictationCheck')}</Text>
              </TouchableOpacity>
            ) : (
              <>
                {/* برگشت به نوشتن؛ نوشته‌ی کاربر سر جایش می‌ماند. */}
                <TouchableOpacity style={[styles.ghostBtn, styles.flex]} onPress={() => setResult(null)} activeOpacity={0.85}>
                  <Text style={styles.ghostText}>{t('podcastDictationContinue')}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.primaryBtn, styles.flex]} onPress={() => navigation.goBack()} activeOpacity={0.85}>
                  <Text style={styles.primaryBtnText}>{t('podcastDictationFinish')}</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </>
      )}
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background, paddingHorizontal: SPACING.l },
  topRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.s },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { flex: 1, fontFamily: FONT_FAMILY.bold, fontSize: 17, lineHeight: 26, color: COLORS.text, textAlign: 'right' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  muted: { ...TEXT_STYLES.bodyMd, color: COLORS.textSecondary, textAlign: 'center' },
  body: { paddingVertical: SPACING.m, gap: SPACING.s },
  podcastTitle: { fontFamily: FONT_FAMILY.bold, fontSize: 15, color: COLORS.text },
  instruction: { fontFamily: FONT_FAMILY.regular, fontSize: 12, lineHeight: 20, color: COLORS.textSecondary, textAlign: 'right' },
  input: {
    minHeight: 220,
    borderRadius: BORDER_RADIUS.l,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
    padding: SPACING.m,
    fontFamily: FONT_FAMILY.medium,
    fontSize: 16,
    lineHeight: 24,
    color: COLORS.text,
    textAlign: 'left',
    textAlignVertical: 'top',
  },
  scoreCard: { alignItems: 'center', backgroundColor: COLORS.surface, borderRadius: BORDER_RADIUS.l, padding: SPACING.m },
  score: { fontFamily: FONT_FAMILY.bold, fontSize: 36, color: COLORS.success },
  scoreSub: { fontFamily: FONT_FAMILY.regular, fontSize: 12, color: COLORS.textSecondary },
  sectionLabel: { fontFamily: FONT_FAMILY.semiBold, fontSize: 12, color: COLORS.muted, textAlign: 'right', marginTop: SPACING.s },
  wordsBox: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.l,
    padding: SPACING.m,
  },
  word: { fontFamily: FONT_FAMILY.medium, fontSize: 15, lineHeight: 24, paddingHorizontal: 3, borderRadius: 4 },
  wordOk: { color: COLORS.success },
  wordBad: { color: COLORS.error, textDecorationLine: 'line-through' },
  wordPlain: { color: COLORS.text },
  wordMissed: { color: COLORS.error, backgroundColor: COLORS.errorLight, fontFamily: FONT_FAMILY.bold },
  player: {
    gap: 6,
    paddingTop: SPACING.s,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
  },
  progressTrack: { height: 5, borderRadius: 3, backgroundColor: COLORS.surfaceHigh, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: COLORS.primary },
  timeRow: { flexDirection: 'row', justifyContent: 'space-between' },
  time: { fontFamily: FONT_FAMILY.medium, fontSize: 11, color: COLORS.textSecondary },
  controls: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: SPACING.l },
  playBtn: { width: 52, height: 52, borderRadius: 26, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center' },
  sideBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    height: 38,
    paddingHorizontal: 12,
    borderRadius: 19,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  sideBtnOn: { backgroundColor: COLORS.surfaceHigh, borderColor: COLORS.textSecondary },
  sideText: { fontFamily: FONT_FAMILY.medium, fontSize: 12, color: COLORS.text },
  footer: { flexDirection: 'row', gap: SPACING.s, marginTop: SPACING.s },
  flex: { flex: 1 },
  primaryBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: 48,
    borderRadius: BORDER_RADIUS.l,
    backgroundColor: COLORS.primary,
  },
  primaryBtnText: { fontFamily: FONT_FAMILY.bold, fontSize: 14, color: COLORS.white },
  btnDisabled: { backgroundColor: COLORS.border },
  ghostBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 48,
    borderRadius: BORDER_RADIUS.l,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  ghostText: { fontFamily: FONT_FAMILY.bold, fontSize: 13, color: COLORS.text },
});
