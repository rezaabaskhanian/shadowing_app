import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Eye, Mic, Square, Volume2, X } from 'lucide-react-native';

import { COLORS, SPACING, BORDER_RADIUS } from '../../theme/colors';
import { FONT_FAMILY, TEXT_STYLES } from '../../theme/typography';
import { SHADOWS } from '../../theme/elevation';
import { useLanguage } from '../../data/i18n';
import { AudioPlayer } from '../../components/AudioPlayer';
import { ensureMicPermission } from '../../services/micPermission';
import { evaluateRecording } from '../../api/shadowing';
import { fetchScene } from '../../api/scenes';
import { completePathItem } from '../../api/path';
import { useRecordingLimit } from '../../hooks/useRecordingLimit';
import { Celebration } from '../../components/Celebration';

/** چند جمله در هر مرور. */
const LINE_COUNT = 6;
const MAX_RECORD_SECONDS = 10;

interface Line {
  english: string;
  persian: string;
  audioUrl: string;
  score?: number;
}

type CardState = 'ready' | 'recording' | 'scoring' | 'feedback';
type Command = 'none' | 'play_original' | 'start_record' | 'stop_record';

/**
 * انتخاب جمله‌ها: اول جمله‌هایی که کاربر قبلاً ضبط کرده و کمترین نمره را گرفته،
 * بعد (اگر کم بود) از بقیه به‌صورت تصادفی. جمله‌های خیلی کوتاه (یک کلمه) حذف
 * می‌شوند چون «گفتن از روی فارسی» برایشان معنا ندارد.
 */
function pickLines(all: Line[]): Line[] {
  const usable = all.filter((l) => l.english.trim().split(/\s+/).length >= 2 && l.persian.trim());
  const scored = usable.filter((l) => (l.score ?? 0) > 0).sort((a, b) => (a.score ?? 0) - (b.score ?? 0));
  const rest = usable.filter((l) => !((l.score ?? 0) > 0)).sort(() => Math.random() - 0.5);
  return [...scored, ...rest].slice(0, LINE_COUNT);
}

/**
 * «جمله‌های سخت» مسیر آموزشی: جمله‌های صحنه‌های همین هفته فقط با ترجمه‌ی فارسی
 * نشان داده می‌شوند و کاربر باید خودش انگلیسی‌اش را بگوید (تولید، نه تکرار).
 * اگر گیر کرد، می‌تواند متن را ببیند یا صدایش را بشنود.
 */
export const PathWeakLinesScreen: React.FC = () => {
  const { t } = useLanguage();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const weekId: string = route.params?.weekId;
  const itemKey: string = route.params?.itemKey;
  const sceneIds: string[] = route.params?.sceneIds || [];

  const [lines, setLines] = useState<Line[] | null>(null);
  const [index, setIndex] = useState(0);
  const [state, setState] = useState<CardState>('ready');
  const [showText, setShowText] = useState(false);
  const [lastScore, setLastScore] = useState<number | null>(null);
  const [scores, setScores] = useState<number[]>([]);
  const [done, setDone] = useState(false);
  const [micError, setMicError] = useState(false);

  const [command, setCommand] = useState<Command>('none');
  const [nonce, setNonce] = useState(0);
  const recStartedAtRef = useRef(0);
  const stopRequestedRef = useRef(false);
  const send = (c: Command) => {
    setCommand(c);
    setNonce((n) => n + 1);
  };

  useEffect(() => {
    let active = true;
    Promise.all(sceneIds.map((id) => fetchScene(id).catch(() => null)))
      .then((scenes) => {
        const all: Line[] = [];
        for (const sc of scenes) {
          for (const h of sc?.hotspots || []) {
            for (const d of h.conversation?.dialogues || []) {
              all.push({ english: d.english_text, persian: d.persian_text, audioUrl: d.audio_url, score: d.score });
            }
          }
        }
        if (active) setLines(pickLines(all));
      })
      .catch(() => active && setLines([]));
    return () => {
      active = false;
    };
  }, [sceneIds]);

  const line = lines?.[index];

  const startRecord = async () => {
    setMicError(false);
    if (!(await ensureMicPermission())) {
      setMicError(true);
      return;
    }
    send('start_record');
  };

  const stopRecord = useCallback(() => {
    stopRequestedRef.current = true;
    send('stop_record');
  }, []);

  useRecordingLimit(state === 'recording', MAX_RECORD_SECONDS, () => {
    if (!stopRequestedRef.current) stopRecord();
  });

  const handleRecordingStatus = useCallback(
    (status: 'recording' | 'stopped' | 'error', filePath?: string, mimeType?: string) => {
      if (status === 'recording') {
        stopRequestedRef.current = false;
        recStartedAtRef.current = Date.now();
        setState('recording');
        return;
      }
      setCommand('none');
      if (status === 'error' || !filePath || !line) {
        setMicError(status === 'error');
        setState('ready');
        return;
      }
      setState('scoring');
      const duration = Math.max(1, (Date.now() - recStartedAtRef.current) / 1000);
      const words = line.english.trim().split(/\s+/).length;
      evaluateRecording({
        filePath,
        mimeType,
        targetText: line.english,
        duration,
        expectedDuration: Math.max(1, Math.round(words * 0.5 + 0.5)),
      })
        .then((r) => Math.round(r.overall_score))
        .catch(() => 60)
        .then((score) => {
          setLastScore(score);
          setScores((prev) => {
            const next = [...prev];
            next[index] = Math.max(next[index] ?? 0, score);
            return next;
          });
          setShowText(true);
          setState('feedback');
        });
    },
    [line, index]
  );

  const next = () => {
    if (lines && index + 1 < lines.length) {
      setIndex(index + 1);
      setState('ready');
      setShowText(false);
      setLastScore(null);
      return;
    }
    setDone(true);
    if (weekId && itemKey) completePathItem(weekId, itemKey).catch(() => {});
  };

  const avg = scores.length ? Math.round(scores.reduce((a, b) => a + (b || 0), 0) / scores.length) : 0;

  return (
    <View style={[styles.container, { paddingTop: insets.top + SPACING.s, paddingBottom: insets.bottom + SPACING.l }]}>
      <AudioPlayer
        uri={line?.audioUrl || null}
        shouldPlay={false}
        actionCommand={command}
        actionNonce={nonce}
        onRecordingStatusUpdate={handleRecordingStatus}
      />

      <View style={styles.topRow}>
        <TouchableOpacity
          style={styles.closeBtn}
          onPress={() => navigation.goBack()}
          disabled={state === 'recording' || state === 'scoring'}
          activeOpacity={0.8}
        >
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
          <ScrollView contentContainerStyle={styles.cardWrap} showsVerticalScrollIndicator={false}>
            <Text style={styles.instruction}>{t('pathWeakInstruction')}</Text>
            <View style={styles.card}>
              <Text style={styles.persian}>{line.persian}</Text>
              {showText ? (
                <Text style={styles.english}>{line.english}</Text>
              ) : (
                <TouchableOpacity style={styles.hintBtn} onPress={() => setShowText(true)} activeOpacity={0.85}>
                  <Eye size={16} color={COLORS.primary} />
                  <Text style={styles.hintText}>{t('pathWeakShowText')}</Text>
                </TouchableOpacity>
              )}
              {!!line.audioUrl && (
                <TouchableOpacity
                  style={styles.hintBtn}
                  onPress={() => send('play_original')}
                  disabled={state === 'recording'}
                  activeOpacity={0.85}
                >
                  <Volume2 size={16} color={COLORS.primary} />
                  <Text style={styles.hintText}>{t('pathWeakListen')}</Text>
                </TouchableOpacity>
              )}
            </View>
            {state === 'feedback' && lastScore !== null && (
              <View style={styles.feedback}>
                <Text style={styles.score}>{lastScore}</Text>
                <Text style={styles.muted}>
                  {t(lastScore >= 80 ? 'courseFeedbackGreat' : lastScore >= 60 ? 'courseFeedbackGood' : 'courseFeedbackTry')}
                </Text>
              </View>
            )}
            {state === 'scoring' && <ActivityIndicator color={COLORS.primary} style={{ marginTop: SPACING.m }} />}
            {micError && <Text style={styles.error}>{t('placementMicDenied')}</Text>}
          </ScrollView>

          <View style={styles.bottom}>
            {state === 'feedback' ? (
              <View style={styles.row}>
                <TouchableOpacity style={[styles.secondaryBtn, styles.flex]} onPress={startRecord} activeOpacity={0.85}>
                  <Mic size={18} color={COLORS.text} />
                  <Text style={styles.secondaryBtnText}>{t('courseSayAgain')}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.primaryBtn, styles.flex]} onPress={next} activeOpacity={0.85}>
                  <Text style={styles.primaryBtnText}>
                    {t(index + 1 < lines!.length ? 'courseNext' : 'courseFinish')}
                  </Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.micArea}>
                <TouchableOpacity
                  style={[styles.micBtn, state === 'recording' && styles.micBtnActive]}
                  onPress={state === 'recording' ? stopRecord : startRecord}
                  disabled={state === 'scoring'}
                  activeOpacity={0.85}
                >
                  {state === 'recording' ? (
                    <Square size={28} color={COLORS.white} fill={COLORS.white} />
                  ) : (
                    <Mic size={32} color={COLORS.white} />
                  )}
                </TouchableOpacity>
                <Text style={styles.muted}>
                  {t(state === 'recording' ? 'courseTapWhenDone' : 'pathWeakSayIt')}
                </Text>
              </View>
            )}
          </View>
        </>
      )}

      {done && (
        <View style={styles.center}>
          <Celebration kind="courseDone" size={160} />
          <Text style={styles.doneTitle}>{t('pathWeakDone')}</Text>
          <Text style={styles.muted}>{t('pathWeakAverage').replace('{n}', String(avg))}</Text>
          <TouchableOpacity style={styles.primaryBtn} onPress={() => navigation.goBack()} activeOpacity={0.85}>
            <Text style={styles.primaryBtnText}>{t('pathBack')}</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FDFBF7', paddingHorizontal: SPACING.m },
  topRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.m },
  closeBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#F0EBE3',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#1A1D26',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  progressTrack: { flex: 1, height: 8, borderRadius: BORDER_RADIUS.full, backgroundColor: '#F3EFE6', overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: '#FF6422', borderRadius: BORDER_RADIUS.full },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: SPACING.m },
  muted: { ...TEXT_STYLES.bodyMd, color: '#716B62', textAlign: 'center' },
  error: { ...TEXT_STYLES.bodyMd, color: COLORS.error, textAlign: 'center', marginTop: SPACING.s },
  cardWrap: { paddingVertical: SPACING.l, gap: SPACING.m },
  instruction: { ...TEXT_STYLES.bodyMd, color: '#716B62', textAlign: 'center' },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#F0EBE3',
    padding: SPACING.l,
    alignItems: 'center',
    gap: SPACING.m,
    shadowColor: '#1A1D26',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  persian: { ...TEXT_STYLES.headlineSm, color: '#1A1D26', fontFamily: FONT_FAMILY.bold, textAlign: 'center' },
  english: { ...TEXT_STYLES.headlineSm, color: '#FF6422', fontFamily: FONT_FAMILY.bold, textAlign: 'center', writingDirection: 'ltr' },
  hintBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    paddingVertical: 7,
    paddingHorizontal: SPACING.m,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: '#FFF4EE',
  },
  hintText: { ...TEXT_STYLES.labelMd, color: '#FF6422' },
  feedback: { alignItems: 'center', gap: SPACING.xs },
  score: { fontFamily: FONT_FAMILY.bold, fontSize: 40, color: '#FF6422' },
  bottom: { paddingTop: SPACING.s },
  row: { flexDirection: 'row', gap: SPACING.s },
  flex: { flex: 1 },
  micArea: { alignItems: 'center', gap: SPACING.s },
  micBtn: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: '#FF6422',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#FF6422',
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 4,
  },
  micBtnActive: { backgroundColor: '#EF4444' },
  primaryBtn: {
    backgroundColor: '#FF6422',
    borderRadius: 16,
    paddingVertical: SPACING.m,
    paddingHorizontal: SPACING.l,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#FF6422',
    shadowOpacity: 0.28,
    elevation: 4,
  },
  primaryBtnText: { ...TEXT_STYLES.bodyMd, fontFamily: FONT_FAMILY.bold, color: '#FFFFFF' },
  secondaryBtn: {
    flexDirection: 'row',
    gap: SPACING.xs,
    borderRadius: 16,
    paddingVertical: SPACING.m,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#F0EBE3',
  },
  secondaryBtnText: { ...TEXT_STYLES.bodyMd, fontFamily: FONT_FAMILY.semiBold, color: '#1A1D26' },
  doneTitle: { ...TEXT_STYLES.headlineSm, color: '#1A1D26', fontFamily: FONT_FAMILY.bold, textAlign: 'center' },
});
