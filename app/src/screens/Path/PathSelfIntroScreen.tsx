import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as RNFS from '@dr.pogodin/react-native-fs';
import { ArrowLeft, Clock, Mic, Play, RotateCcw, Sparkles, Square, X } from 'lucide-react-native';

import { COLORS, SPACING, BORDER_RADIUS } from '../../theme/colors';
import { FONT_FAMILY, TEXT_STYLES } from '../../theme/typography';
import { SHADOWS } from '../../theme/elevation';
import { useLanguage } from '../../data/i18n';
import { AudioPlayer } from '../../components/AudioPlayer';
import { ensureMicPermission } from '../../services/micPermission';
import { transcribeFreeSpeech } from '../../api/freespeech';
import {
  completePathItem,
  getSelfIntros,
  saveSelfIntro,
  type SelfIntro,
  type SelfIntroStage,
  type SelfIntros,
} from '../../api/path';
import { useRecordingLimit } from '../../hooks/useRecordingLimit';
import { Celebration } from '../../components/Celebration';
import { track } from '../../services/analytics';
import { GradientFill } from '../../components/GradientFill';

const MAX_SECONDS = 60;

type Phase = 'loading' | 'intro' | 'recording' | 'processing' | 'result';
type Command = 'none' | 'play_original' | 'start_record' | 'stop_record';

/** صدای «قبل»/«بعد» فقط روی همین گوشی نگه داشته می‌شود. */
const localPath = (level: string, stage: SelfIntroStage) =>
  `${RNFS.DocumentDirectoryPath}/self_intro/${level}-${stage}.m4a`;

const toFsPath = (value: string) => (value.startsWith('file://') ? value.slice('file://'.length) : value);

// هر الگو با معنی فارسی کوتاهش، تا کاربر مبتدی بداند هر کدام برای گفتن چیست.
const GUIDE: { en: string; fa: string }[] = [
  { en: 'My name is …', fa: 'اسم من' },
  { en: "I'm … (age)", fa: 'سن شما' },
  { en: "I'm from …", fa: 'اصالتاً اهل' },
  { en: 'I live in …', fa: 'محل زندگی' },
  { en: "I'm a … (job)", fa: 'شغل من' },
  { en: 'I like …', fa: 'علاقه‌مندی‌ها' },
];
const toFa = (v: number | string) => String(v).replace(/\d/g, (d) => '۰۱۲۳۴۵۶۷۸۹'[Number(d)]);
const WAVE = [6, 10, 14, 8, 18, 12, 22, 12, 18, 8, 14, 10, 6];

/**
 * «قبل و بعد» مسیر آموزشی: هفته‌ی اول کاربر یک معرفی کوتاه از خودش ضبط می‌کند
 * (هر چقدر بلد است)، هفته‌ی آخر همان را دوباره ضبط می‌کند و دو ضبط کنار هم
 * پخش و مقایسه می‌شوند (مدت، تعداد کلمه، کلمه‌های متفاوت). صدا روی گوشی
 * می‌ماند؛ فقط متن رونویسی‌شده و آمار به سرور می‌رود.
 */
export const PathSelfIntroScreen: React.FC = () => {
  const { t, language } = useLanguage();
  const rtl = language === 'fa';
  const num = (v: number | string) => (rtl ? toFa(v) : String(v));
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const weekId: string = route.params?.weekId;
  const itemKey: string = route.params?.itemKey;
  const level: string = route.params?.level || 'starter';
  const stage: SelfIntroStage = route.params?.stage === 'after' ? 'after' : 'before';
  const weekPosition: number | undefined = route.params?.weekPosition;
  const weekCount: number | undefined = route.params?.weekCount;

  const [phase, setPhase] = useState<Phase>('loading');
  const [intros, setIntros] = useState<SelfIntros>({});
  const [hasAudio, setHasAudio] = useState<Record<SelfIntroStage, boolean>>({ before: false, after: false });
  const [error, setError] = useState('');
  const [playUri, setPlayUri] = useState<string | null>(null);
  const [command, setCommand] = useState<Command>('none');
  const [nonce, setNonce] = useState(0);
  const startedAtRef = useRef(0);
  const stopRequestedRef = useRef(false);

  const send = (c: Command) => {
    setCommand(c);
    setNonce((n) => n + 1);
  };

  const refreshAudio = useCallback(async () => {
    const [b, a] = await Promise.all([
      RNFS.exists(localPath(level, 'before')).catch(() => false),
      RNFS.exists(localPath(level, 'after')).catch(() => false),
    ]);
    setHasAudio({ before: b, after: a });
  }, [level]);

  useEffect(() => {
    let active = true;
    Promise.all([getSelfIntros(level).catch(() => ({})), refreshAudio()]).then(([res]) => {
      if (!active) return;
      setIntros(res as SelfIntros);
      setPhase((res as SelfIntros)[stage] ? 'result' : 'intro');
    });
    return () => {
      active = false;
    };
  }, [level, stage, refreshAudio]);

  const startRecord = async () => {
    setError('');
    if (!(await ensureMicPermission())) {
      setError(t('placementMicDenied'));
      return;
    }
    send('start_record');
  };

  const stopRecord = useCallback(() => {
    stopRequestedRef.current = true;
    send('stop_record');
  }, []);

  const elapsed = useRecordingLimit(phase === 'recording', MAX_SECONDS, () => {
    if (!stopRequestedRef.current) stopRecord();
  });

  const handleRecordingStatus = useCallback(
    (status: 'recording' | 'stopped' | 'error', filePath?: string, mimeType?: string) => {
      if (status === 'recording') {
        stopRequestedRef.current = false;
        startedAtRef.current = Date.now();
        setPhase('recording');
        return;
      }
      setCommand('none');
      if (status === 'error' || !filePath) {
        setError(t('pathSelfIntroError'));
        setPhase('intro');
        return;
      }
      setPhase('processing');
      const duration = Math.max(1, (Date.now() - startedAtRef.current) / 1000);
      (async () => {
        try {
          const dest = localPath(level, stage);
          await RNFS.mkdir(`${RNFS.DocumentDirectoryPath}/self_intro`).catch(() => {});
          if (await RNFS.exists(dest)) await RNFS.unlink(dest).catch(() => {});
          await RNFS.copyFile(toFsPath(filePath), dest).catch(() => {});
          const transcript = (await transcribeFreeSpeech(filePath, mimeType)).trim();
          if (!transcript) throw new Error('empty');
          const res = await saveSelfIntro(level, stage, transcript, duration);
          setIntros(res);
          await refreshAudio();
          if (weekId && itemKey) completePathItem(weekId, itemKey).catch(() => {});
          track('path_self_intro', stage);
          setPhase('result');
        } catch {
          setError(t('pathSelfIntroError'));
          setPhase('intro');
        }
      })();
    },
    [level, stage, weekId, itemKey, refreshAudio, t]
  );

  const play = (s: SelfIntroStage) => {
    setPlayUri(`file://${localPath(level, s)}`);
    send('play_original');
  };

  const before = intros.before;
  const after = intros.after;
  const current = intros[stage];

  return (
    <View style={[styles.container, { paddingTop: insets.top + SPACING.s, paddingBottom: insets.bottom + SPACING.l }]}>
      <AudioPlayer
        uri={playUri}
        shouldPlay={false}
        actionCommand={command}
        actionNonce={nonce}
        recordingProfile="speech"
        onRecordingStatusUpdate={handleRecordingStatus}
      />

      <View style={[styles.topRow, rtl && styles.rowReverse]}>
        <TouchableOpacity
          style={styles.closeBtn}
          onPress={() => navigation.goBack()}
          disabled={phase === 'recording' || phase === 'processing'}
          activeOpacity={0.8}
        >
          <X size={20} color={COLORS.text} />
        </TouchableOpacity>
        <View style={[styles.flex, rtl && styles.alignEnd]}>
          <Text style={styles.topTitle}>{t(stage === 'before' ? 'pathSelfIntroBeforeTitle' : 'pathSelfIntroAfterTitle')}</Text>
          <Text style={styles.topSub}>{t('pathSelfIntroSub')}</Text>
        </View>
        {!!weekPosition && (
          <View style={[styles.weekChip, rtl && styles.rowReverse]}>
            <View style={styles.weekDot} />
            <Text style={styles.weekChipText}>
              {weekCount
                ? t('pathSelfIntroWeekOf').replace('{n}', num(weekPosition)).replace('{total}', num(weekCount))
                : t('pathSelfIntroWeekN').replace('{n}', num(weekPosition))}
            </Text>
          </View>
        )}
      </View>

      {phase === 'loading' && (
        <View style={styles.center}>
          <ActivityIndicator color={COLORS.primary} />
        </View>
      )}

      {(phase === 'intro' || phase === 'recording' || phase === 'processing') && (
        <>
          <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
            <View style={styles.introCard}>
              <View style={[styles.introHead, rtl && styles.rowReverse]}>
                <Text style={[styles.introTitle, rtl && styles.textRight]}>{t('pathSelfIntroHeadline')}</Text>
                <View style={styles.sparkBox}>
                  <Sparkles size={18} color="#E9A23B" />
                </View>
              </View>
              <Text style={[styles.introNote, rtl && styles.textRight]}>
                {t(stage === 'before' ? 'pathSelfIntroBeforeNote' : before ? 'pathSelfIntroAfterNote' : 'pathSelfIntroNoBefore')}
              </Text>
              <View style={[styles.timeline, rtl && styles.rowReverse]}>
                <View style={[styles.tlStep, rtl && styles.rowReverse]}>
                  <View style={[styles.tlNum, styles.tlNumOn]}>
                    <Text style={[styles.tlNumText, styles.tlNumTextOn]}>{num(1)}</Text>
                  </View>
                  <View style={[styles.flex, rtl && styles.alignEnd]}>
                    <Text style={styles.tlTitle}>{t('pathSelfIntroBaseTitle')}</Text>
                    <Text style={styles.tlSub}>{t('pathSelfIntroBaseSub')}</Text>
                  </View>
                </View>
                <ArrowLeft size={18} color={COLORS.primary} style={!rtl ? styles.flipX : undefined} />
                <View style={[styles.tlStep, rtl && styles.rowReverse]}>
                  <View style={styles.tlNum}>
                    <Text style={styles.tlNumText}>{num(weekCount || 8)}</Text>
                  </View>
                  <View style={[styles.flex, rtl && styles.alignEnd]}>
                    <Text style={styles.tlTitle}>
                      {t('pathSelfIntroAfterStep').replace('{n}', num(weekCount || 8))}
                    </Text>
                    <Text style={styles.tlSub}>{t('pathSelfIntroAfterSub')}</Text>
                  </View>
                </View>
              </View>
            </View>
            <View style={[styles.guide, rtl && styles.rowReverse]}>
              {GUIDE.map((g) => (
                <View key={g.en} style={[styles.chip, rtl && styles.rowReverse]}>
                  <Text style={styles.chipText}>{g.en}</Text>
                  {rtl && <Text style={styles.chipFa}>| {g.fa}</Text>}
                </View>
              ))}
            </View>
            {!!error && <Text style={styles.error}>{error}</Text>}
          </ScrollView>

          <View style={styles.micArea}>
            {phase === 'processing' ? (
              <>
                <ActivityIndicator color={COLORS.primary} size="large" />
                <Text style={styles.muted}>{t('pathSelfIntroProcessing')}</Text>
              </>
            ) : (
              <>
                <View style={styles.wave}>
                  {WAVE.map((h, i) => (
                    <View
                      key={i}
                      style={[
                        styles.waveBar,
                        { height: h },
                        i === 6 || phase === 'recording' ? styles.waveBarOn : null,
                      ]}
                    />
                  ))}
                </View>
                <View style={styles.micRings}>
                  <View style={styles.micRingOuter} />
                  <View style={styles.micRingInner} />
                  <TouchableOpacity
                    style={styles.micBtn}
                    onPress={phase === 'recording' ? stopRecord : startRecord}
                    activeOpacity={0.85}
                  >
                    <GradientFill
                      from={phase === 'recording' ? '#E04848' : '#F07A4A'}
                      to={phase === 'recording' ? '#BA1A1A' : '#E8572F'}
                    />
                    {phase === 'recording' ? (
                      <Square size={26} color={COLORS.white} fill={COLORS.white} />
                    ) : (
                      <Mic size={30} color={COLORS.white} />
                    )}
                  </TouchableOpacity>
                </View>
                <Text style={styles.micLabel}>
                  {phase === 'recording'
                    ? `${num(elapsed)} / ${num(MAX_SECONDS)} · ${t('courseTapWhenDone')}`
                    : t('pathSelfIntroTapShort')}
                </Text>
                {phase !== 'recording' && (
                  <View style={[styles.maxRow, rtl && styles.rowReverse]}>
                    <Clock size={13} color={COLORS.muted} />
                    <Text style={styles.maxText}>{t('pathSelfIntroMaxTime').replace('{n}', num(MAX_SECONDS))}</Text>
                  </View>
                )}
              </>
            )}
          </View>
        </>
      )}

      {phase === 'result' && current && (
        <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
          {stage === 'after' && before && after ? (
            <>
              <Celebration kind="courseDone" size={140} />
              <Text style={styles.headline}>{compareHeadline(before, after, t)}</Text>
              <View style={styles.compare}>
                <IntroColumn
                  label={t('pathSelfIntroWeek1')}
                  intro={before}
                  canPlay={hasAudio.before}
                  onPlay={() => play('before')}
                  t={t}
                />
                <IntroColumn
                  label={t('pathSelfIntroNow')}
                  intro={after}
                  canPlay={hasAudio.after}
                  onPlay={() => play('after')}
                  t={t}
                  highlight
                />
              </View>
            </>
          ) : (
            <>
              <Text style={styles.headline}>{t(stage === 'before' ? 'pathSelfIntroSaved' : 'pathSelfIntroSavedNoBefore')}</Text>
              <IntroColumn
                label={t(stage === 'before' ? 'pathSelfIntroWeek1' : 'pathSelfIntroNow')}
                intro={current}
                canPlay={hasAudio[stage]}
                onPlay={() => play(stage)}
                t={t}
                highlight
              />
            </>
          )}

          <View style={styles.row}>
            <TouchableOpacity style={[styles.secondaryBtn, styles.flex]} onPress={() => setPhase('intro')} activeOpacity={0.85}>
              <RotateCcw size={16} color={COLORS.text} />
              <Text style={styles.secondaryBtnText}>{t('pathSelfIntroAgain')}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.primaryBtn, styles.flex]} onPress={() => navigation.goBack()} activeOpacity={0.85}>
              <Text style={styles.primaryBtnText}>{t('pathBack')}</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      )}
    </View>
  );
};

function compareHeadline(before: SelfIntro, after: SelfIntro, t: (k: string) => string): string {
  const diff = after.word_count - before.word_count;
  if (before.word_count > 0 && after.word_count >= before.word_count * 2) {
    return t('pathSelfIntroTimes').replace('{n}', String(Math.floor(after.word_count / before.word_count)));
  }
  if (diff > 0) return t('pathSelfIntroMoreWords').replace('{n}', String(diff));
  return t('pathSelfIntroKeepGoing');
}

const IntroColumn: React.FC<{
  label: string;
  intro: SelfIntro;
  canPlay: boolean;
  onPlay: () => void;
  t: (k: string) => string;
  highlight?: boolean;
}> = ({ label, intro, canPlay, onPlay, t, highlight }) => (
  <View style={[styles.column, highlight && styles.columnHighlight]}>
    <Text style={styles.columnLabel}>{label}</Text>
    <Stat value={intro.word_count} label={t('pathSelfIntroWords')} />
    <Stat value={intro.unique_words} label={t('pathSelfIntroUnique')} />
    <Stat value={intro.duration_seconds} label={t('pathSelfIntroSeconds')} />
    {canPlay && (
      <TouchableOpacity style={styles.playBtn} onPress={onPlay} activeOpacity={0.85}>
        <Play size={14} color={COLORS.white} fill={COLORS.white} />
        <Text style={styles.playText}>{t('pathSelfIntroListen')}</Text>
      </TouchableOpacity>
    )}
    <Text style={styles.transcript}>{intro.transcript || '—'}</Text>
  </View>
);

const Stat: React.FC<{ value: number; label: string }> = ({ value, label }) => (
  <View style={styles.stat}>
    <Text style={styles.statValue}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </View>
);

const styles = StyleSheet.create({
  rowReverse: { flexDirection: 'row-reverse' },
  alignEnd: { alignItems: 'flex-end' },
  textRight: { textAlign: 'right' },
  flipX: { transform: [{ scaleX: -1 }] },
  container: { flex: 1, backgroundColor: '#FAF8F4', paddingHorizontal: SPACING.m },
  topRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.s },
  topTitle: { fontFamily: FONT_FAMILY.bold, fontSize: 16, color: COLORS.text },
  topSub: { fontFamily: FONT_FAMILY.regular, fontSize: 11, color: COLORS.muted },
  weekChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: '#E8F5EE',
    borderWidth: 1,
    borderColor: '#CDE8D8',
  },
  weekDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: COLORS.success },
  weekChipText: { fontFamily: FONT_FAMILY.bold, fontSize: 11, color: '#2F8A5B' },
  introCard: {
    backgroundColor: COLORS.white,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#EEEAE3',
    padding: SPACING.m,
    gap: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
  },
  introHead: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  introTitle: { flex: 1, fontFamily: FONT_FAMILY.bold, fontSize: 19, color: COLORS.text },
  sparkBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#FFF6E2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  introNote: { fontFamily: FONT_FAMILY.regular, fontSize: 13, lineHeight: 23, color: COLORS.textSecondary },
  timeline: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F7F5F1',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#EEEAE3',
    padding: 12,
  },
  tlStep: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 },
  tlNum: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#E8E4DC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tlNumOn: { backgroundColor: COLORS.primary },
  tlNumText: { fontFamily: FONT_FAMILY.bold, fontSize: 11, color: COLORS.textSecondary },
  tlNumTextOn: { color: COLORS.white },
  tlTitle: { fontFamily: FONT_FAMILY.bold, fontSize: 11, color: COLORS.text },
  tlSub: { fontFamily: FONT_FAMILY.regular, fontSize: 10, color: COLORS.muted, marginTop: 2 },
  closeBtn: {
    width: 40,
    height: 40,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.level1,
  },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  body: { paddingVertical: SPACING.l, gap: SPACING.m, alignItems: 'stretch' },
  headline: { ...TEXT_STYLES.headlineSm, color: COLORS.text, textAlign: 'center' },
  muted: { ...TEXT_STYLES.bodyMd, color: COLORS.muted, textAlign: 'center' },
  error: { ...TEXT_STYLES.bodyMd, color: COLORS.error, textAlign: 'center' },
  guide: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: SPACING.s },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FDF1EC',
    borderWidth: 1,
    borderColor: '#F6D9CC',
    borderRadius: 14,
    paddingVertical: 9,
    paddingHorizontal: 14,
  },
  chipText: { fontFamily: FONT_FAMILY.bold, fontSize: 14, color: COLORS.primary, writingDirection: 'ltr' },
  chipFa: { fontFamily: FONT_FAMILY.regular, fontSize: 11, color: COLORS.muted },
  micArea: { alignItems: 'center', gap: 6, paddingTop: SPACING.s },
  wave: { flexDirection: 'row', alignItems: 'center', gap: 5, height: 26, marginBottom: 4 },
  waveBar: { width: 3, borderRadius: 2, backgroundColor: '#C9CED8' },
  waveBarOn: { backgroundColor: COLORS.primary },
  micRings: { width: 120, height: 120, alignItems: 'center', justifyContent: 'center' },
  micRingOuter: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 1.5,
    borderColor: 'rgba(232, 87, 47, 0.18)',
  },
  micRingInner: {
    position: 'absolute',
    width: 104,
    height: 104,
    borderRadius: 52,
    backgroundColor: 'rgba(232, 87, 47, 0.08)',
  },
  micBtn: {
    width: 86,
    height: 86,
    borderRadius: 43,
    overflow: 'hidden',
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 8,
    shadowColor: COLORS.primary,
    shadowOpacity: 0.4,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
  },
  micLabel: { fontFamily: FONT_FAMILY.bold, fontSize: 14, color: COLORS.text },
  maxRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  maxText: { fontFamily: FONT_FAMILY.regular, fontSize: 12, color: COLORS.muted },
  compare: { flexDirection: 'row', gap: SPACING.s, alignItems: 'flex-start' },
  column: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.m,
    gap: SPACING.s,
    alignItems: 'center',
    ...SHADOWS.level1,
  },
  columnHighlight: { borderWidth: 2, borderColor: COLORS.success },
  columnLabel: { ...TEXT_STYLES.labelMd, fontFamily: FONT_FAMILY.semiBold, color: COLORS.textSecondary },
  stat: { alignItems: 'center' },
  statValue: { fontFamily: FONT_FAMILY.bold, fontSize: 28, color: COLORS.primary },
  statLabel: { ...TEXT_STYLES.labelMd, color: COLORS.muted },
  playBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.full,
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.m,
  },
  playText: { ...TEXT_STYLES.labelMd, color: COLORS.white },
  transcript: { ...TEXT_STYLES.bodyMd, color: COLORS.text, textAlign: 'left', writingDirection: 'ltr', alignSelf: 'stretch' },
  row: { flexDirection: 'row', gap: SPACING.s, marginTop: SPACING.s },
  flex: { flex: 1 },
  primaryBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.full,
    paddingVertical: SPACING.m,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBtnText: { ...TEXT_STYLES.bodyMd, fontFamily: FONT_FAMILY.semiBold, color: COLORS.white },
  secondaryBtn: {
    flexDirection: 'row',
    gap: SPACING.xs,
    borderRadius: BORDER_RADIUS.full,
    paddingVertical: SPACING.m,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  secondaryBtnText: { ...TEXT_STYLES.bodyMd, fontFamily: FONT_FAMILY.semiBold, color: COLORS.text },
});
