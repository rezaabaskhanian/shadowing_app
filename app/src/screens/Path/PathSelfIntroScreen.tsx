import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as RNFS from '@dr.pogodin/react-native-fs';
import { Mic, Play, RotateCcw, Square, X } from 'lucide-react-native';

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

const MAX_SECONDS = 60;

type Phase = 'loading' | 'intro' | 'recording' | 'processing' | 'result';
type Command = 'none' | 'play_original' | 'start_record' | 'stop_record';

/** صدای «قبل»/«بعد» فقط روی همین گوشی نگه داشته می‌شود. */
const localPath = (level: string, stage: SelfIntroStage) =>
  `${RNFS.DocumentDirectoryPath}/self_intro/${level}-${stage}.m4a`;

const toFsPath = (value: string) => (value.startsWith('file://') ? value.slice('file://'.length) : value);

const GUIDE = ['My name is …', "I'm … (age)", "I'm from …", 'I live in …', "I'm a … (job)", 'I like …'];

/**
 * «قبل و بعد» مسیر آموزشی: هفته‌ی اول کاربر یک معرفی کوتاه از خودش ضبط می‌کند
 * (هر چقدر بلد است)، هفته‌ی آخر همان را دوباره ضبط می‌کند و دو ضبط کنار هم
 * پخش و مقایسه می‌شوند (مدت، تعداد کلمه، کلمه‌های متفاوت). صدا روی گوشی
 * می‌ماند؛ فقط متن رونویسی‌شده و آمار به سرور می‌رود.
 */
export const PathSelfIntroScreen: React.FC = () => {
  const { t } = useLanguage();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const weekId: string = route.params?.weekId;
  const itemKey: string = route.params?.itemKey;
  const level: string = route.params?.level || 'starter';
  const stage: SelfIntroStage = route.params?.stage === 'after' ? 'after' : 'before';

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

      <View style={styles.topRow}>
        <TouchableOpacity
          style={styles.closeBtn}
          onPress={() => navigation.goBack()}
          disabled={phase === 'recording' || phase === 'processing'}
          activeOpacity={0.8}
        >
          <X size={20} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.topTitle}>{t(stage === 'before' ? 'pathSelfIntroBeforeTitle' : 'pathSelfIntroAfterTitle')}</Text>
      </View>

      {phase === 'loading' && (
        <View style={styles.center}>
          <ActivityIndicator color={COLORS.primary} />
        </View>
      )}

      {(phase === 'intro' || phase === 'recording' || phase === 'processing') && (
        <>
          <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
            <Text style={styles.headline}>{t('pathSelfIntroPrompt')}</Text>
            <Text style={styles.muted}>
              {t(stage === 'before' ? 'pathSelfIntroBeforeNote' : before ? 'pathSelfIntroAfterNote' : 'pathSelfIntroNoBefore')}
            </Text>
            <View style={styles.guide}>
              {GUIDE.map((g) => (
                <View key={g} style={styles.chip}>
                  <Text style={styles.chipText}>{g}</Text>
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
                <TouchableOpacity
                  style={[styles.micBtn, phase === 'recording' && styles.micBtnActive]}
                  onPress={phase === 'recording' ? stopRecord : startRecord}
                  activeOpacity={0.85}
                >
                  {phase === 'recording' ? (
                    <Square size={28} color={COLORS.white} fill={COLORS.white} />
                  ) : (
                    <Mic size={32} color={COLORS.white} />
                  )}
                </TouchableOpacity>
                <Text style={styles.muted}>
                  {phase === 'recording'
                    ? `${elapsed} / ${MAX_SECONDS} · ${t('courseTapWhenDone')}`
                    : t('pathSelfIntroTapToStart')}
                </Text>
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
  container: { flex: 1, backgroundColor: COLORS.background, paddingHorizontal: SPACING.m },
  topRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.m },
  topTitle: { ...TEXT_STYLES.bodyLg, fontFamily: FONT_FAMILY.semiBold, color: COLORS.text, flex: 1 },
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
  guide: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: SPACING.xs },
  chip: {
    backgroundColor: COLORS.primaryLight,
    borderRadius: BORDER_RADIUS.full,
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.m,
  },
  chipText: { ...TEXT_STYLES.labelMd, color: COLORS.primary, writingDirection: 'ltr' },
  micArea: { alignItems: 'center', gap: SPACING.s, paddingTop: SPACING.s },
  micBtn: {
    width: 84,
    height: 84,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.level1,
  },
  micBtnActive: { backgroundColor: COLORS.error },
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
