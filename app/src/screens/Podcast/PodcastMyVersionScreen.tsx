import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import TrackPlayer from 'react-native-track-player';
import { Check, ChevronLeft, ChevronRight, Info, Layers, Mic, Pause, Play, RotateCcw, Square, Volume2, X } from 'lucide-react-native';

import { COLORS, SPACING, BORDER_RADIUS } from '../../theme/colors';
import { FONT_FAMILY, TEXT_STYLES } from '../../theme/typography';
import { useLanguage } from '../../data/i18n';
import { AudioPlayer } from '../../components/AudioPlayer';
import { ensureMicPermission } from '../../services/micPermission';
import { ensureTrackPlayerSetup } from '../../services/audio/trackPlayerSetup';
import { absUrl } from '../../api/config';
import { getPodcast, type Podcast } from '../../api/podcasts';
import { evaluateRecording } from '../../api/shadowing';
import { track } from '../../services/analytics';

type Step = 'pick' | 'record' | 'result';
type RecCommand = 'none' | 'start_record' | 'stop_record' | 'play_recording';
type Take = { path: string; score: number | null };

const ALL_LINES = '__all__';
const storageKey = (podcastId: string) => `podcast_my_version_${podcastId}`;
const MY_VERSION_TRACK_ID = 'podcast-my-version';

const scoreColor = (s: number) => (s >= 80 ? COLORS.success : s >= 60 ? COLORS.warning : COLORS.error);

/**
 * «نسخه‌ی من» از یک پادکست: کاربر یکی از مجری‌ها (یا همه‌ی جمله‌ها) را انتخاب
 * می‌کند، هر جمله را اول از صدای اصلی می‌شنود، بعد خودش می‌خواند و ضبط می‌کند
 * و نمره‌ی تلفظ می‌گیرد. آخر کار، پادکست با صدای خودش پخش می‌شود: جمله‌های او
 * با ضبط‌های خودش و بقیه با صدای اصلی. ضبط‌ها فقط روی گوشی می‌مانند (هزینه‌ی AI
 * جز همان نمره‌ی تلفظ ندارد) و برای دفعه‌ی بعد نگه داشته می‌شوند.
 */
export const PodcastMyVersionScreen: React.FC = () => {
  const { t, language } = useLanguage();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const podcastId: string | undefined = route.params?.podcastId;

  const [podcast, setPodcast] = useState<Podcast | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [step, setStep] = useState<Step>('pick');
  const [speaker, setSpeaker] = useState<string>(ALL_LINES);
  // انتخابِ نقش در مرحله‌ی pick؛ تا دکمه‌ی شروع زده نشود، ضبط‌های قبلی دست نمی‌خورند.
  const [picked, setPicked] = useState<string | null>(null);
  const [cursor, setCursor] = useState(0); // اندیسِ جمله در myLines
  const [takes, setTakes] = useState<Record<number, Take>>({});
  const [recState, setRecState] = useState<'idle' | 'recording' | 'scoring'>('idle');
  const [recCommand, setRecCommand] = useState<RecCommand>('none');
  const [recNonce, setRecNonce] = useState(0);
  const [playPath, setPlayPath] = useState<string | null>(null);
  const [playingLine, setPlayingLine] = useState<number | null>(null); // جمله‌ی در حال پخش در «نسخه‌ی من»
  const recStartRef = useRef(0);
  const segmentTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const sequenceRef = useRef<{ active: boolean; index: number }>({ active: false, index: 0 });

  // ---------- بارگذاری ----------
  useEffect(() => {
    if (!podcastId) {
      setLoadError(true);
      return;
    }
    let active = true;
    getPodcast(podcastId)
      .then(async (p) => {
        if (!active) return;
        setPodcast(p);
        const saved = await AsyncStorage.getItem(storageKey(p.id)).catch(() => null);
        if (saved && active) {
          try {
            const data = JSON.parse(saved) as { speaker: string; takes: Record<number, Take> };
            setSpeaker(data.speaker);
            setTakes(data.takes || {});
          } catch {
            // نسخه‌ی خراب = از اول
          }
        }
        await ensureTrackPlayerSetup();
        await TrackPlayer.reset();
        await TrackPlayer.add({ id: MY_VERSION_TRACK_ID, url: absUrl(p.audio_url), title: p.title });
      })
      .catch(() => active && setLoadError(true));
    return () => {
      active = false;
    };
  }, [podcastId]);

  const stopAll = useCallback(() => {
    sequenceRef.current.active = false;
    if (segmentTimer.current) clearInterval(segmentTimer.current);
    segmentTimer.current = null;
    setPlayingLine(null);
    TrackPlayer.pause().catch(() => {});
  }, []);

  useFocusEffect(useCallback(() => () => stopAll(), [stopAll]));

  const lines = useMemo(() => podcast?.lines ?? [], [podcast]);
  const speakers = useMemo(() => [...new Set(lines.map((l) => l.speaker))], [lines]);
  const myLines = useMemo(
    () => lines.map((l, i) => ({ l, i })).filter(({ l }) => speaker === ALL_LINES || l.speaker === speaker).map((x) => x.i),
    [lines, speaker]
  );

  const persist = useCallback(
    (next: Record<number, Take>) => {
      if (!podcast) return;
      AsyncStorage.setItem(storageKey(podcast.id), JSON.stringify({ speaker, takes: next })).catch(() => {});
    },
    [podcast, speaker]
  );

  // ---------- پخش یک تکه از صدای اصلی ----------
  const playSegment = useCallback(
    async (lineIndex: number, onDone?: () => void) => {
      const line = lines[lineIndex];
      if (!line) return;
      if (segmentTimer.current) clearInterval(segmentTimer.current);
      await TrackPlayer.seekTo(line.start_ms / 1000);
      await TrackPlayer.play();
      segmentTimer.current = setInterval(async () => {
        const { position } = await TrackPlayer.getProgress();
        if (position * 1000 >= line.end_ms) {
          if (segmentTimer.current) clearInterval(segmentTimer.current);
          segmentTimer.current = null;
          await TrackPlayer.pause();
          onDone?.();
        }
      }, 60);
    },
    [lines]
  );

  // ---------- ضبط ----------
  const currentLine = myLines[cursor];

  const startRecording = async () => {
    stopAll();
    if (!(await ensureMicPermission())) return;
    recStartRef.current = Date.now();
    setRecState('recording');
    setRecCommand('start_record');
    setRecNonce((n) => n + 1);
  };

  const stopRecording = () => {
    setRecCommand('stop_record');
    setRecNonce((n) => n + 1);
  };

  const handleRecordingStatus = async (status: 'recording' | 'stopped' | 'error', filePath?: string, mimeType?: string) => {
    if (status === 'error') {
      setRecState('idle');
      return;
    }
    if (status !== 'stopped' || !filePath || currentLine === undefined) return;
    const line = lines[currentLine];
    const duration = Math.max(0.5, (Date.now() - recStartRef.current) / 1000);
    setRecState('scoring');
    let score: number | null = null;
    try {
      const res = await evaluateRecording({
        filePath,
        mimeType,
        targetText: line.text,
        duration,
        expectedDuration: Math.max(1, (line.end_ms - line.start_ms) / 1000),
      });
      score = Math.round(res.overall_score);
    } catch {
      // بدون اینترنت هم ضبط برای «نسخه‌ی من» می‌ماند، فقط نمره ندارد.
    }
    const next = { ...takes, [currentLine]: { path: filePath, score } };
    setTakes(next);
    persist(next);
    setRecState('idle');
  };

  const playMyTake = (lineIndex: number) => {
    const take = takes[lineIndex];
    if (!take) return;
    stopAll();
    setPlayPath(take.path);
    setRecCommand('play_recording');
    setRecNonce((n) => n + 1);
  };

  // ---------- پخشِ کاملِ «نسخه‌ی من» ----------
  const playNextInSequence = useCallback(() => {
    const seq = sequenceRef.current;
    if (!seq.active) return;
    if (seq.index >= lines.length) {
      seq.active = false;
      setPlayingLine(null);
      return;
    }
    const i = seq.index;
    seq.index += 1;
    setPlayingLine(i);
    const take = takes[i];
    if (myLines.includes(i) && take) {
      setPlayPath(take.path);
      setRecCommand('play_recording');
      setRecNonce((n) => n + 1);
    } else {
      playSegment(i, () => playNextInSequence());
    }
  }, [lines.length, takes, myLines, playSegment]);

  const toggleMyVersion = () => {
    if (sequenceRef.current.active) {
      stopAll();
      return;
    }
    if (podcast) track('podcast_my_version_played', podcast.id);
    sequenceRef.current = { active: true, index: 0 };
    playNextInSequence();
  };

  // ---------- مرحله‌ها ----------
  const recordedCount = myLines.filter((i) => takes[i]).length;
  const scored = myLines.map((i) => takes[i]?.score).filter((s): s is number => typeof s === 'number');
  const average = scored.length ? Math.round(scored.reduce((a, b) => a + b, 0) / scored.length) : null;

  const choose = (sp: string) => {
    if (sp !== speaker) {
      setTakes({});
      if (podcast) AsyncStorage.removeItem(storageKey(podcast.id)).catch(() => {});
    }
    setSpeaker(sp);
    setCursor(0);
    setStep('record');
    if (podcast) track('podcast_my_version_started', podcast.id);
  };

  if (loadError) {
    return (
      <View style={[styles.container, styles.center, { paddingTop: insets.top }]}>
        <Text style={styles.muted}>{t('podcastLoadError')}</Text>
      </View>
    );
  }
  if (!podcast) {
    return (
      <View style={[styles.container, styles.center, { paddingTop: insets.top }]}>
        <ActivityIndicator color={COLORS.primary} />
      </View>
    );
  }

  const rtl = language === 'fa';
  const row = rtl && styles.rowReverse;
  const align = rtl && styles.textRight;
  const num = (n: number) => n.toLocaleString(rtl ? 'fa-IR' : 'en-US');
  const selected = picked ?? speaker;
  const roleOptions = [
    ...speakers.map((sp) => ({ id: sp, name: sp, count: lines.filter((l) => l.speaker === sp).length })),
    { id: ALL_LINES, name: t('myVersionAllLines'), count: lines.length },
  ];

  const line = currentLine !== undefined ? lines[currentLine] : null;
  const take = currentLine !== undefined ? takes[currentLine] : undefined;
  const busy = recState !== 'idle';

  return (
    <View style={[styles.container, { paddingTop: insets.top + SPACING.s }]}>
      <AudioPlayer
        uri={null}
        shouldPlay={false}
        actionCommand={recCommand}
        actionNonce={recNonce}
        loadedRecordingPath={playPath}
        onRecordingStatusUpdate={handleRecordingStatus}
        onRecordedPlaybackEnd={() => {
          if (sequenceRef.current.active) playNextInSequence();
        }}
      />

      <View style={[styles.header, row]}>
        <TouchableOpacity style={styles.closeBtn} onPress={() => navigation.goBack()} disabled={busy}>
          <X size={20} color={COLORS.text} />
        </TouchableOpacity>
        <View style={styles.headerText}>
          <Text style={[styles.headerTitle, align]}>{t('myVersionTitle')}</Text>
          <Text style={[styles.muted, align]} numberOfLines={1}>
            {podcast.title}
          </Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + SPACING.l }]}>
        {step === 'pick' && (
          <>
            <View style={[styles.hintCard, row]}>
              <View style={styles.hintIcon}>
                <Mic size={20} color={COLORS.white} />
              </View>
              <Text style={[styles.hintText, align]}>{t('myVersionPickHint')}</Text>
            </View>

            <Text style={[styles.sectionTitle, align]}>{t('myVersionPickTitle')}</Text>
            {roleOptions.map((opt) => {
              const active = selected === opt.id;
              const isAll = opt.id === ALL_LINES;
              return (
                <TouchableOpacity
                  key={opt.id}
                  style={[styles.choice, row, active && styles.choiceActive]}
                  onPress={() => setPicked(opt.id)}
                  activeOpacity={0.85}
                >
                  <View style={[styles.avatar, isAll && styles.avatarAll]}>
                    {isAll ? (
                      <Layers size={20} color={COLORS.warningDeep} />
                    ) : (
                      <Text style={styles.avatarText}>{opt.name.slice(0, 1).toUpperCase()}</Text>
                    )}
                  </View>
                  <View style={styles.choiceBody}>
                    <Text style={[styles.choiceText, align]}>{opt.name}</Text>
                    <Text style={[styles.muted, align]}>
                      {t('myVersionLines').replace('{n}', num(opt.count))}
                    </Text>
                  </View>
                  <View style={[styles.radio, active && styles.radioActive]}>
                    {active && <Check size={14} color={COLORS.white} />}
                  </View>
                </TouchableOpacity>
              );
            })}

            <View style={[styles.noteRow, row]}>
              <Info size={13} color={COLORS.muted} />
              <Text style={[styles.noteText, align]}>{t('myVersionRetakeNote')}</Text>
            </View>

            <TouchableOpacity style={[styles.primaryBtn, row]} onPress={() => choose(selected)} activeOpacity={0.85}>
              <Mic size={18} color={COLORS.white} />
              <Text style={styles.primaryBtnText}>{t('myVersionStart')}</Text>
            </TouchableOpacity>
            {Object.keys(takes).length > 0 && (
              <TouchableOpacity style={styles.secondaryBtn} onPress={() => setStep('result')}>
                <Text style={styles.secondaryBtnText}>{t('myVersionOpenSaved')}</Text>
              </TouchableOpacity>
            )}
          </>
        )}

        {step === 'record' && line && (
          <>
            <Text style={styles.muted}>
              {t('myVersionProgress').replace('{i}', String(cursor + 1)).replace('{n}', String(myLines.length))}
              {' · '}
              {line.speaker}
            </Text>
            <View style={styles.lineCard}>
              <Text style={styles.lineText}>{line.text}</Text>
              {!!line.translation_fa && <Text style={styles.lineFa}>{line.translation_fa}</Text>}
            </View>

            <View style={styles.row}>
              <TouchableOpacity style={styles.roundBtn} onPress={() => playSegment(currentLine)} disabled={busy}>
                <Volume2 size={20} color={COLORS.primary} />
                <Text style={styles.roundLabel}>{t('myVersionListen')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.recBtn, recState === 'recording' && styles.recBtnActive]}
                onPress={recState === 'recording' ? stopRecording : startRecording}
                disabled={recState === 'scoring'}
              >
                {recState === 'scoring' ? (
                  <ActivityIndicator color={COLORS.white} />
                ) : recState === 'recording' ? (
                  <Square size={26} color={COLORS.white} fill={COLORS.white} />
                ) : (
                  <Mic size={28} color={COLORS.white} />
                )}
              </TouchableOpacity>
              <TouchableOpacity style={styles.roundBtn} onPress={() => playMyTake(currentLine)} disabled={busy || !take}>
                <Play size={20} color={take ? COLORS.primary : COLORS.muted} />
                <Text style={styles.roundLabel}>{t('myVersionMine')}</Text>
              </TouchableOpacity>
            </View>
            <Text style={[styles.muted, styles.centerText]}>
              {recState === 'recording' ? t('myVersionRecording') : t('myVersionRecordHint')}
            </Text>

            {take && (
              <View style={styles.scoreRow}>
                {take.score !== null ? (
                  <Text style={[styles.score, { color: scoreColor(take.score) }]}>{take.score}</Text>
                ) : (
                  <Text style={styles.muted}>{t('myVersionNoScore')}</Text>
                )}
                <TouchableOpacity onPress={startRecording} disabled={busy} style={styles.inlineBtn}>
                  <RotateCcw size={16} color={COLORS.primary} />
                  <Text style={styles.link}>{t('myVersionRetry')}</Text>
                </TouchableOpacity>
              </View>
            )}

            <View style={styles.navRow}>
              <TouchableOpacity
                style={styles.inlineBtn}
                onPress={() => setCursor((c) => Math.max(0, c - 1))}
                disabled={busy || cursor === 0}
              >
                <ChevronLeft size={18} color={cursor === 0 ? COLORS.muted : COLORS.primary} />
                <Text style={[styles.link, cursor === 0 && { color: COLORS.muted }]}>{t('myVersionPrev')}</Text>
              </TouchableOpacity>
              {cursor < myLines.length - 1 ? (
                <TouchableOpacity style={styles.inlineBtn} onPress={() => setCursor((c) => c + 1)} disabled={busy}>
                  <Text style={styles.link}>{take ? t('myVersionNext') : t('myVersionSkip')}</Text>
                  <ChevronRight size={18} color={COLORS.primary} />
                </TouchableOpacity>
              ) : (
                <TouchableOpacity style={styles.primaryBtnSmall} onPress={() => setStep('result')} disabled={busy}>
                  <Text style={styles.primaryBtnText}>{t('myVersionFinish')}</Text>
                </TouchableOpacity>
              )}
            </View>
          </>
        )}

        {step === 'result' && (
          <>
            <View style={styles.resultCard}>
              <Text style={styles.muted}>
                {t('myVersionRecorded').replace('{i}', String(recordedCount)).replace('{n}', String(myLines.length))}
              </Text>
              {average !== null && (
                <Text style={[styles.bigScore, { color: scoreColor(average) }]}>{average}</Text>
              )}
              <TouchableOpacity style={styles.primaryBtn} onPress={toggleMyVersion} disabled={recordedCount === 0}>
                {playingLine !== null ? (
                  <Pause size={20} color={COLORS.white} fill={COLORS.white} />
                ) : (
                  <Play size={20} color={COLORS.white} fill={COLORS.white} />
                )}
                <Text style={styles.primaryBtnText}>{t('myVersionPlay')}</Text>
              </TouchableOpacity>
              <Text style={[styles.muted, styles.centerText]}>{t('myVersionPlayHint')}</Text>
            </View>

            {lines.map((l, i) => {
              const mine = myLines.includes(i);
              const tk = takes[i];
              return (
                <TouchableOpacity
                  key={i}
                  style={[styles.resultLine, playingLine === i && styles.resultLineActive]}
                  onPress={() => {
                    if (!mine) return;
                    setCursor(myLines.indexOf(i));
                    setStep('record');
                  }}
                  activeOpacity={mine ? 0.8 : 1}
                >
                  <Text style={styles.resultSpeaker}>
                    {l.speaker}
                    {mine ? ` · ${t('myVersionYou')}` : ''}
                  </Text>
                  <Text style={[styles.resultText, !mine && { color: COLORS.textSecondary }]}>{l.text}</Text>
                  {mine && (
                    <Text style={[styles.resultScore, tk?.score != null && { color: scoreColor(tk.score) }]}>
                      {tk ? (tk.score != null ? tk.score : '✓') : t('myVersionNotRecorded')}
                    </Text>
                  )}
                </TouchableOpacity>
              );
            })}

            <TouchableOpacity
              style={styles.secondaryBtn}
              onPress={() => {
                stopAll();
                setStep('pick');
              }}
            >
              <Text style={styles.secondaryBtnText}>{t('myVersionChangeRole')}</Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  rowReverse: { flexDirection: 'row-reverse' },
  textRight: { textAlign: 'right' },
  container: { flex: 1, backgroundColor: COLORS.backgroundSoft },
  headerText: { flex: 1 },
  hintCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#FFF6F2',
    borderWidth: 1,
    borderColor: 'rgba(232, 87, 47, 0.2)',
    borderRadius: 20,
    padding: 14,
  },
  hintIcon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hintText: { flex: 1, color: COLORS.text, fontFamily: FONT_FAMILY.medium, fontSize: 13, lineHeight: 22 },
  sectionTitle: { color: COLORS.text, fontFamily: FONT_FAMILY.bold, fontSize: 13 },
  choiceActive: { borderColor: COLORS.primary, borderWidth: 1.5, backgroundColor: '#FFF6F2' },
  choiceBody: { flex: 1, gap: 2 },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 16,
    backgroundColor: COLORS.infoLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarAll: { backgroundColor: COLORS.secondaryLight },
  avatarText: { color: COLORS.info, fontFamily: FONT_FAMILY.bold, fontSize: 18 },
  radio: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  noteRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  noteText: { color: COLORS.muted, fontFamily: FONT_FAMILY.regular, fontSize: 11 },
  center: { alignItems: 'center', justifyContent: 'center' },
  centerText: { textAlign: 'center' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.s,
    paddingHorizontal: SPACING.l,
    marginBottom: SPACING.m,
  },
  closeBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: { color: COLORS.text, fontFamily: FONT_FAMILY.bold, fontSize: 22, lineHeight: 32 },
  content: { paddingHorizontal: SPACING.l, gap: SPACING.m },
  body: { ...TEXT_STYLES.bodyMd, color: COLORS.text },
  muted: { ...TEXT_STYLES.bodyMd, color: COLORS.textSecondary, fontSize: 13 },
  link: { color: COLORS.primary, fontFamily: FONT_FAMILY.semiBold, fontSize: 14 },
  choice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: COLORS.white,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    padding: 14,
  },
  choiceText: { flex: 1, color: COLORS.text, fontFamily: FONT_FAMILY.semiBold, fontSize: 15 },
  lineCard: {
    backgroundColor: COLORS.white,
    borderRadius: 22,
    padding: SPACING.l,
    gap: SPACING.s,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  lineText: { color: COLORS.text, fontFamily: FONT_FAMILY.bold, fontSize: 20, lineHeight: 30, writingDirection: 'ltr' },
  lineFa: { color: COLORS.textSecondary, fontFamily: FONT_FAMILY.regular, fontSize: 14, lineHeight: 22 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around', marginTop: SPACING.s },
  roundBtn: { alignItems: 'center', gap: 4, width: 80 },
  roundLabel: { color: COLORS.textSecondary, fontFamily: FONT_FAMILY.medium, fontSize: 12 },
  recBtn: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recBtnActive: { backgroundColor: COLORS.error },
  scoreRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: SPACING.l },
  score: { fontFamily: FONT_FAMILY.bold, fontSize: 34 },
  inlineBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, padding: 6 },
  navRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: SPACING.m },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.s,
    backgroundColor: COLORS.primary,
    borderRadius: 16,
    paddingVertical: 15,
    paddingHorizontal: SPACING.l,
    alignSelf: 'stretch',
  },
  primaryBtnSmall: {
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.full,
    paddingVertical: 10,
    paddingHorizontal: SPACING.l,
  },
  primaryBtnText: { color: COLORS.white, fontFamily: FONT_FAMILY.bold, fontSize: 15 },
  secondaryBtn: { alignItems: 'center', padding: SPACING.m },
  secondaryBtnText: { color: COLORS.primary, fontFamily: FONT_FAMILY.semiBold, fontSize: 14 },
  resultCard: {
    alignItems: 'center',
    gap: SPACING.s,
    backgroundColor: COLORS.white,
    borderRadius: 22,
    padding: SPACING.l,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  bigScore: { fontFamily: FONT_FAMILY.bold, fontSize: 48 },
  resultLine: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: SPACING.m,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    gap: 2,
  },
  resultLineActive: { borderColor: COLORS.primary, backgroundColor: COLORS.primaryLight },
  resultSpeaker: { color: COLORS.textSecondary, fontFamily: FONT_FAMILY.semiBold, fontSize: 11 },
  resultText: { color: COLORS.text, fontFamily: FONT_FAMILY.medium, fontSize: 15, writingDirection: 'ltr' },
  resultScore: { color: COLORS.muted, fontFamily: FONT_FAMILY.bold, fontSize: 13, alignSelf: 'flex-end' },
});
