import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View, useWindowDimensions } from 'react-native';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Video, { type VideoRef } from 'react-native-video';
import Sound from 'react-native-nitro-sound';
import {
  ArrowLeft,
  BookOpen,
  Check,
  CircleCheck,
  CircleX,
  Lightbulb,
  Mic,
  Pause,
  Play,
  RotateCcw,
  Sparkles,
  Users,
  Volume2,
  X,
} from 'lucide-react-native';

import { COLORS, SPACING, BORDER_RADIUS } from '../../theme/colors';
import { FONT_FAMILY, TEXT_STYLES } from '../../theme/typography';
import { SHADOWS } from '../../theme/elevation';
import { useLanguage } from '../../data/i18n';
import { AudioPlayer } from '../../components/AudioPlayer';
import { ProgressRing } from '../../components/ProgressRing';
import { ensureMicPermission } from '../../services/micPermission';
import { absUrl } from '../../api/config';
import { evaluateRecording, type EvaluationResult } from '../../api/shadowing';
import { getVideoClip, recordVideoClipAttempt, type VideoClip, type VideoClipLine } from '../../api/videoClips';
import { track } from '../../services/analytics';

type Step = 'watch' | 'quiz' | 'pick' | 'perform' | 'scoring' | 'result';
type SubtitleMode = 'en' | 'fa' | 'off';
type RecCommand = 'none' | 'start_record' | 'stop_record' | 'play_recording';
/** چند درصد کلمه‌های جمله‌ی کاربر سر نوبتش پنهان شود (۱۰۰ = فقط معنی فارسی). */
type HideLevel = 0 | 50 | 70 | 100;
const HIDE_LEVELS: HideLevel[] = [0, 50, 70, 100];

/** ضبط هر خط کمی زودتر شروع می‌شود (تأخیر روشن شدن میکروفن)... */
const REC_LEAD_MS = 150;
/** ...و کمی دیرتر بسته می‌شود تا آخر جمله‌ی کاربر بریده نشود. */
const REC_TAIL_MS = 450;
/** صدای ویدیو در این بازه‌ی اطراف خط کاربر قطع است (اگر کلیپ mute_padding_ms نداشت). */
const DEFAULT_MUTE_PADDING_MS = 250;

interface LineRecording {
  filePath: string;
  mimeType?: string;
  duration: number;
}

type LineScore = EvaluationResult | 'error' | 'missing';

const scoreColor = (score: number) => {
  if (score >= 75) return COLORS.success;
  if (score >= 50) return COLORS.warning;
  return COLORS.error;
};

/**
 * کلمه‌ها را یکی‌درمیان (۵۰٪) یا از هر ۱۰ تا ۷ تا (۷۰٪) با خط‌تیره می‌پوشاند؛ حرف اولِ کلمه می‌ماند
 * تا کاربر سرنخ داشته باشد. الگو ثابت است، پس هر بار همان کلمه‌ها پنهان می‌شوند.
 */
const maskLine = (text: string, percent: number) => {
  const r = percent / 100;
  let k = 0;
  return text.replace(/[A-Za-z0-9'’-]+/g, (w) => {
    const hide = Math.floor((k + 1) * r) > Math.floor(k * r);
    k += 1;
    if (!hide) return w;
    return w.length === 1 ? '_' : w[0] + '_'.repeat(w.length - 1);
  });
};

const lineAt = (lines: VideoClipLine[], ms: number) =>
  lines.findIndex((l) => ms >= l.start_ms && ms <= l.end_ms);

/**
 * «تمرین با ویدیو»: ۱) دیدن کلیپ (با زیرنویس انگلیسی/فارسی/بدون زیرنویس)،
 * ۲) سؤال‌های فهم، ۳) انتخاب شخصیت، ۴) پخش دوباره‌ی کلیپ که سر نوبت آن شخصیت
 * صدای ویدیو قطع می‌شود و صدای کاربر ضبط می‌شود، ۵) نمره‌ی تلفظ هر خط با همان
 * ارزیاب شدوئینگ، و شنیدن ضبط خود و جمله‌ی اصلی کنار هم.
 */
export const VideoClipScreen: React.FC = () => {
  const { t, language } = useLanguage();
  const rtl = language === 'fa';
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const clipId: string | undefined = route.params?.clipId;

  const [clip, setClip] = useState<VideoClip | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [step, setStep] = useState<Step>('watch');

  // ---- پخش ویدیو ----
  const videoRef = useRef<VideoRef>(null);
  const [paused, setPaused] = useState(true);
  const [muted, setMuted] = useState(false);
  const [positionMs, setPositionMs] = useState(0);
  const [subtitleMode, setSubtitleMode] = useState<SubtitleMode>('en');
  /** پخش جمله‌ی اصلی در صفحه‌ی نتیجه: در این لحظه می‌ایستد. */
  const stopAtMsRef = useRef<number | null>(null);

  // ---- سؤال‌های فهم ----
  const [qIndex, setQIndex] = useState(0);
  const [chosen, setChosen] = useState<number | null>(null);
  /** گزینه‌ای که کاربر زده ولی هنوز «بررسی پاسخ» نکرده. */
  const [selected, setSelected] = useState<number | null>(null);
  const [correctCount, setCorrectCount] = useState(0);

  // ---- انتخاب شخصیت و اجرا ----
  const [speaker, setSpeaker] = useState<string | null>(null);
  const [hideLevel, setHideLevel] = useState<HideLevel>(0);
  const [recordings, setRecordings] = useState<Record<number, LineRecording>>({});
  const [recCommand, setRecCommand] = useState<RecCommand>('none');
  const [recNonce, setRecNonce] = useState(0);
  const [playPath, setPlayPath] = useState<string | null>(null);
  const recStateRef = useRef<'idle' | 'starting' | 'recording' | 'stopping'>('idle');
  /** فقط برای نمایش «در حال ضبط»؛ منطق ضبط با recStateRef است. */
  const [recording, setRecording] = useState(false);
  const recLineRef = useRef<number | null>(null);
  const recStartedAtRef = useRef(0);
  const doneLinesRef = useRef<Set<number>>(new Set());
  const endedRef = useRef(false);

  // ---- نمره ----
  const [scores, setScores] = useState<Record<number, LineScore>>({});
  const [scoringDone, setScoringDone] = useState(0);

  // تب‌ها بعد از خروج mount می‌مانند؛ ویدیو نباید در پس‌زمینه ادامه پیدا کند.
  useFocusEffect(
    useCallback(
      () => () => {
        setPaused(true);
        // خروج وسط ضبط (ضربدر یا دکمه‌ی برگشت گوشی): AudioPlayer ضبط را خودش نمی‌بندد.
        if (recStateRef.current !== 'idle') {
          recStateRef.current = 'idle';
          Sound.stopRecorder().catch(() => {});
        }
      },
      []
    )
  );

  useEffect(() => {
    if (!clipId) {
      setLoadError(true);
      return;
    }
    let active = true;
    getVideoClip(clipId)
      .then((c) => {
        if (!active) return;
        setClip(c);
        track('video_clip_opened', c.id);
      })
      .catch(() => active && setLoadError(true));
    return () => {
      active = false;
    };
  }, [clipId]);

  const lines = useMemo(() => clip?.lines ?? [], [clip]);
  const speakers = useMemo(() => {
    const counts = new Map<string, number>();
    lines.forEach((l) => counts.set(l.speaker, (counts.get(l.speaker) ?? 0) + 1));
    return [...counts.entries()].map(([name, count]) => ({ name, count }));
  }, [lines]);
  // نقش پیشنهادی: پرحرف‌ترین شخصیت به‌جز راوی (راوی جمله‌های بلند و یکنواخت دارد).
  const suggestedSpeaker = useMemo(() => {
    const pool = speakers.filter((sp) => sp.name.toLowerCase() !== 'narrator');
    const list = pool.length ? pool : speakers;
    return list.reduce<string | null>(
      (best, sp) => (best === null || sp.count > (speakers.find((x) => x.name === best)?.count ?? 0) ? sp.name : best),
      null
    );
  }, [speakers]);
  useEffect(() => {
    if (step === 'pick' && !speaker && suggestedSpeaker) setSpeaker(suggestedSpeaker);
  }, [step, speaker, suggestedSpeaker]);
  const myLineIdx = useMemo(
    () => lines.map((l, i) => (l.speaker === speaker ? i : -1)).filter((i) => i >= 0),
    [lines, speaker]
  );

  const sendRec = (cmd: RecCommand) => {
    setRecCommand(cmd);
    setRecNonce((n) => n + 1);
  };

  const restartVideo = (play: boolean) => {
    stopAtMsRef.current = null;
    videoRef.current?.seek(0);
    setPositionMs(0);
    setPaused(!play);
  };

  // ---------- مرحله‌ها ----------

  const goAfterWatch = () => {
    setPaused(true);
    setMuted(false);
    if (clip && clip.questions.length > 0) {
      setQIndex(0);
      setChosen(null);
      setSelected(null);
      setCorrectCount(0);
      setStep('quiz');
    } else {
      setStep('pick');
    }
  };

  const answer = (idx: number) => {
    if (chosen !== null || !clip) return;
    setChosen(idx);
    if (idx === clip.questions[qIndex].answer_index) setCorrectCount((n) => n + 1);
  };

  const nextQuestion = () => {
    if (!clip) return;
    setSelected(null);
    if (qIndex + 1 < clip.questions.length) {
      setQIndex(qIndex + 1);
      setChosen(null);
    } else {
      track('video_clip_quiz_done', clip.id);
      setQIndex(clip.questions.length); // صفحه‌ی خلاصه‌ی سؤال‌ها
    }
  };

  const startPerform = async () => {
    if (!speaker) return;
    const granted = await ensureMicPermission();
    if (!granted) return;
    setRecordings({});
    setScores({});
    doneLinesRef.current = new Set();
    recStateRef.current = 'idle';
    recLineRef.current = null;
    endedRef.current = false;
    setMuted(false);
    setStep('perform');
    restartVideo(true);
  };

  const finishPerform = useCallback(() => {
    setPaused(true);
    setMuted(false);
    setStep('scoring');
  }, []);

  // ---------- پیشرفت ویدیو: زیرنویس، قطع صدا و ضبط سر نوبت کاربر ----------

  const onProgress = (e: { currentTime: number }) => {
    const ms = Math.round(e.currentTime * 1000);
    setPositionMs(ms);

    if (stopAtMsRef.current !== null && ms >= stopAtMsRef.current) {
      stopAtMsRef.current = null;
      setPaused(true);
      return;
    }
    if (step !== 'perform') return;

    // صدای ویدیو فقط در بازه‌ی خطوط شخصیت انتخابی قطع است.
    const pad = clip?.mute_padding_ms ?? DEFAULT_MUTE_PADDING_MS;
    const inMyWindow = myLineIdx.some((i) => ms >= lines[i].start_ms - pad && ms <= lines[i].end_ms + pad);
    if (inMyWindow !== muted) setMuted(inMyWindow);

    // پایان ضبط خط فعلی (یا زودتر، اگر خط بعدی خودش بلافاصله شروع می‌شود).
    const cur = recLineRef.current;
    if (cur !== null && recStateRef.current === 'recording') {
      const nextMine = myLineIdx.find((i) => i > cur);
      const stopAt = Math.min(
        lines[cur].end_ms + REC_TAIL_MS,
        nextMine !== undefined ? lines[nextMine].start_ms - REC_LEAD_MS : Infinity
      );
      if (ms >= stopAt) {
        recStateRef.current = 'stopping';
        sendRec('stop_record');
      }
      return;
    }

    // شروع ضبط خط بعدی کاربر.
    if (recStateRef.current === 'idle') {
      const due = myLineIdx.find(
        (i) => !doneLinesRef.current.has(i) && ms >= lines[i].start_ms - REC_LEAD_MS && ms < lines[i].end_ms
      );
      if (due !== undefined) {
        doneLinesRef.current.add(due);
        recLineRef.current = due;
        recStateRef.current = 'starting';
        sendRec('start_record');
      }
    }
  };

  const onEnd = () => {
    if (step === 'perform') {
      endedRef.current = true;
      if (recStateRef.current === 'recording' || recStateRef.current === 'starting') {
        recStateRef.current = 'stopping';
        sendRec('stop_record');
      } else if (recStateRef.current === 'idle') {
        finishPerform();
      }
      return;
    }
    setPaused(true);
  };

  const handleRecordingStatus = useCallback(
    (status: 'recording' | 'stopped' | 'error', filePath?: string, mimeType?: string) => {
      setRecording(status === 'recording');
      if (status === 'recording') {
        recStartedAtRef.current = Date.now();
        // اگر توقف همین حالا درخواست شده (ویدیو تمام شد)، ضبط باز نمی‌ماند.
        if (recStateRef.current === 'stopping') {
          sendRec('stop_record');
        } else {
          recStateRef.current = 'recording';
        }
        return;
      }
      const line = recLineRef.current;
      recLineRef.current = null;
      recStateRef.current = 'idle';
      setRecCommand('none');
      if (status === 'stopped' && filePath && line !== null) {
        const duration = Math.max(1, (Date.now() - recStartedAtRef.current) / 1000);
        setRecordings((prev) => ({ ...prev, [line]: { filePath, mimeType, duration } }));
      }
      if (endedRef.current) finishPerform();
    },
    [finishPerform]
  );

  // ---------- نمره‌دهی (پشت‌سرهم، تا سرور تک‌هسته‌ای زیر فشار نرود) ----------

  useEffect(() => {
    if (step !== 'scoring' || !clip || !speaker) return;
    let cancelled = false;
    (async () => {
      const result: Record<number, LineScore> = {};
      let done = 0;
      setScoringDone(0);
      for (const i of myLineIdx) {
        const rec = recordings[i];
        if (!rec) {
          result[i] = 'missing';
        } else {
          try {
            result[i] = await evaluateRecording({
              filePath: rec.filePath,
              mimeType: rec.mimeType,
              targetText: lines[i].text,
              duration: rec.duration,
              expectedDuration: Math.max(1, (lines[i].end_ms - lines[i].start_ms) / 1000),
            });
          } catch {
            result[i] = 'error';
          }
        }
        if (cancelled) return;
        done += 1;
        setScoringDone(done);
      }
      const values = myLineIdx.map((i) => {
        const r = result[i];
        return typeof r === 'object' ? r.overall_score : 0;
      });
      const overall = values.length ? values.reduce((a, b) => a + b, 0) / values.length : 0;
      setScores(result);
      setStep('result');
      track('video_clip_performed', clip.id);
      recordVideoClipAttempt(clip.id, speaker, overall).catch(() => {});
    })();
    return () => {
      cancelled = true;
    };
    // فقط با ورود به مرحله‌ی scoring اجرا می‌شود.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  const overallScore = useMemo(() => {
    if (!myLineIdx.length) return 0;
    const sum = myLineIdx.reduce((acc, i) => {
      const r = scores[i];
      return acc + (typeof r === 'object' ? r.overall_score : 0);
    }, 0);
    return Math.round(sum / myLineIdx.length);
  }, [scores, myLineIdx]);

  const playOriginal = (line: VideoClipLine) => {
    setMuted(false);
    videoRef.current?.seek(line.start_ms / 1000);
    stopAtMsRef.current = line.end_ms + 150;
    setPaused(false);
  };

  const playMine = (i: number) => {
    const rec = recordings[i];
    if (!rec) return;
    setPaused(true);
    setPlayPath(rec.filePath);
    sendRec('play_recording');
  };

  // ---------- رندر ----------

  const row = rtl && styles.rowReverse;
  const align = rtl && styles.textRight;
  const num = (n: number) => n.toLocaleString(rtl ? 'fa-IR' : 'en-US');

  if (loadError) {
    return (
      <View style={[styles.container, styles.center, { paddingTop: insets.top }]}>
        <Text style={styles.mutedText}>{t('videoClipsLoadError')}</Text>
        <TouchableOpacity onPress={() => navigation.goBack()} activeOpacity={0.8}>
          <Text style={styles.linkText}>{t('topicSpeakingOtherTopics')}</Text>
        </TouchableOpacity>
      </View>
    );
  }
  if (!clip) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator color={COLORS.primary} />
      </View>
    );
  }

  const inset = step === 'perform' ? 0 : SPACING.m;
  const videoHeight = Math.round(((width - inset * 2) * 9) / 16);
  const showVideo = step === 'watch' || step === 'perform' || step === 'result';
  const currentIdx = lineAt(lines, positionMs);
  const currentLine = currentIdx >= 0 ? lines[currentIdx] : null;
  const isMyTurn = step === 'perform' && currentLine !== null && currentLine.speaker === speaker;
  const question = clip.questions[qIndex];
  const quizTotal = clip.questions.length;
  const levelLabel = t(LEVEL_LABEL_KEY[clip.level] ?? 'levelBeginner');
  const episodeLabel = clip.episode
    ? t('videoClipEpisode').replace('{s}', num(clip.season || 1)).replace('{e}', num(clip.episode))
    : '';
  const sourceLine = [clip.movie_title, episodeLabel, levelLabel].filter(Boolean).join(' · ');

  // نوبت بعدی کاربر در اجرا: شمارش معکوس ۳ ثانیه‌ای و نوار پیشرفت جمله‌ها.
  const nextMine = myLineIdx.find((i) => !recordings[i] && lines[i].start_ms > positionMs);
  const msToTurn = nextMine !== undefined ? lines[nextMine].start_ms - positionMs : Infinity;
  const showCountdown = step === 'perform' && !isMyTurn && msToTurn > 0 && msToTurn <= 3000;
  const doneCount = myLineIdx.filter((i) => recordings[i]).length;

  // نتیجه: میانگین تلفظ/روانی و ضعیف‌ترین کلمه برای نکته‌ی پایانی.
  const evaluated = myLineIdx.map((i) => scores[i]).filter((r): r is EvaluationResult => typeof r === 'object');
  const avg = (pick: (r: EvaluationResult) => number) =>
    evaluated.length ? Math.round(evaluated.reduce((a, r) => a + pick(r), 0) / evaluated.length) : 0;
  const weakestWord = evaluated
    .filter((r) => !r.is_estimated)
    .flatMap((r) => r.words ?? [])
    .filter((w) => w.status !== 'ok')
    .sort((a, b) => a.score - b.score)[0];

  const header = (label: string, pill?: React.ReactNode) => (
    <View style={[styles.header, row]}>
      <TouchableOpacity style={styles.closeBtn} onPress={() => navigation.goBack()} hitSlop={8} activeOpacity={0.8}>
        <X size={20} color={COLORS.text} />
      </TouchableOpacity>
      <View style={styles.headerCenter}>
        <Text style={styles.headerLabel}>{label}</Text>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {clip.title}
        </Text>
      </View>
      <View style={styles.headerSide}>{pill}</View>
    </View>
  );

  const pill = (text: string, tone: 'primary' | 'amber' = 'primary') => (
    <View style={[styles.pill, tone === 'amber' && styles.pillAmber]}>
      <Text style={[styles.pillText, tone === 'amber' && styles.pillTextAmber]} numberOfLines={1}>
        {text}
      </Text>
    </View>
  );

  const tipCard = (text: string) => (
    <View style={[styles.tipCard, row]}>
      <Lightbulb size={18} color={COLORS.warning} />
      <Text style={[styles.tipText, align]}>{text}</Text>
    </View>
  );

  /** کلمه‌های ضعیف/جاافتاده‌ی یک جمله رنگی می‌شوند (فقط وقتی نمره واقعی است). */
  const coloredLine = (line: VideoClipLine, r: LineScore | undefined) => {
    const words = typeof r === 'object' && !r.is_estimated ? r.words ?? [] : [];
    if (!words.length) return <Text style={styles.resultLineText}>{line.text}</Text>;
    const bad = new Set(words.filter((w) => w.status !== 'ok').map((w) => w.index));
    let k = 0;
    const parts = line.text.split(/(\s+)/);
    return (
      <Text style={styles.resultLineText}>
        {parts.map((part, j) => {
          if (/^\s+$/.test(part) || !part) return part;
          const idx = k++;
          return bad.has(idx) ? (
            <Text key={j} style={styles.weakWord}>
              {part}
            </Text>
          ) : (
            part
          );
        })}
      </Text>
    );
  };

  const footer = (children: React.ReactNode, note?: string) => (
    <View style={[styles.footer, { paddingBottom: insets.bottom + SPACING.s }]}>
      {children}
      {!!note && <Text style={styles.footerNote}>{note}</Text>}
    </View>
  );

  const stepLabel: Record<Step, string> = {
    watch: sourceLine,
    quiz: t('videoClipStepQuiz'),
    pick: sourceLine,
    perform: t('videoClipStepPerform'),
    scoring: t('videoClipStepPerform'),
    result: t('videoClipStepResult'),
  };
  const headerPill =
    step === 'quiz' && question
      ? pill(t('videoClipQuestionN').replace('{n}', num(qIndex + 1)).replace('{total}', num(quizTotal)), 'amber')
      : (step === 'perform' || step === 'result') && speaker
        ? pill(t('videoClipRole').replace('{name}', speaker))
        : undefined;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <AudioPlayer
        uri={null}
        shouldPlay={false}
        actionCommand={recCommand}
        actionNonce={recNonce}
        loadedRecordingPath={playPath}
        recordingProfile="speech"
        onRecordingStatusUpdate={handleRecordingStatus}
      />

      {step === 'quiz' && question && (
        <View style={styles.quizTrack}>
          <View style={[styles.quizFill, { width: `${((qIndex + (chosen !== null ? 1 : 0)) / quizTotal) * 100}%` }]} />
        </View>
      )}
      {header(stepLabel[step], headerPill)}

      {/* یک پخش‌کننده برای همه‌ی مرحله‌ها؛ در مرحله‌های بی‌ویدیو فقط پنهان می‌شود. */}
      <View
        style={[
          styles.videoWrap,
          { height: videoHeight, marginHorizontal: inset },
          step !== 'perform' && styles.videoCard,
          !showVideo && styles.hidden,
        ]}
      >
        <Video
          ref={videoRef}
          source={{ uri: absUrl(clip.video_url) }}
          style={StyleSheet.absoluteFill}
          resizeMode="contain"
          paused={paused || !showVideo}
          muted={muted}
          progressUpdateInterval={100}
          onProgress={onProgress}
          onEnd={onEnd}
          onError={() => setLoadError(true)}
        />
        {step === 'watch' && (
          <TouchableOpacity style={styles.playOverlay} onPress={() => setPaused((p) => !p)} activeOpacity={0.9}>
            {paused && (
              <View style={styles.playCircle}>
                <Play size={30} color={COLORS.white} fill={COLORS.white} />
              </View>
            )}
          </TouchableOpacity>
        )}
        {step === 'perform' && currentLine && !isMyTurn && (
          <View style={[styles.statusPill, rtl ? styles.statusPillRight : styles.statusPillLeft]}>
            <View style={styles.statusDot} />
            <Text style={styles.statusPillText}>{t('videoClipSpeaking').replace('{name}', currentLine.speaker)}</Text>
          </View>
        )}
        {showCountdown && (
          <View style={styles.countdown}>
            <Text style={styles.countdownLabel}>{t('videoClipTurnIn')}</Text>
            <Text style={styles.countdownNum}>{num(Math.ceil(msToTurn / 1000))}s</Text>
          </View>
        )}
        {step === 'perform' && muted && (
          <View style={styles.micBadge}>
            <Mic size={16} color={COLORS.white} />
            <Text style={styles.micBadgeText}>{t('videoClipYourTurn')}</Text>
          </View>
        )}
        {showVideo && clip.duration_seconds > 0 && (
          <View style={styles.videoTrack}>
            <View
              style={[
                styles.videoFill,
                { width: `${Math.min(100, (positionMs / (clip.duration_seconds * 1000)) * 100)}%` },
              ]}
            />
          </View>
        )}
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* ---------- ۱) دیدن ---------- */}
        {step === 'watch' && (
          <>
            <View style={styles.card}>
              <View style={[styles.cardTop, row]}>
                <View style={[styles.liveDotRow, row]}>
                  <View style={styles.liveDot} />
                  <Text style={styles.cardLabel}>{t('videoClipCurrentLine')}</Text>
                </View>
                {!!currentLine?.speaker && <Text style={styles.speakerTag}>{currentLine.speaker}</Text>}
              </View>
              {currentLine && subtitleMode !== 'off' ? (
                subtitleMode === 'en' ? (
                  <>
                    <Text style={styles.enLine}>{currentLine.text}</Text>
                    {!!currentLine.translation_fa && (
                      <Text style={[styles.faLine, styles.textRight]}>{currentLine.translation_fa}</Text>
                    )}
                  </>
                ) : (
                  <Text style={[styles.faLineBig, styles.textRight]}>
                    {currentLine.translation_fa || currentLine.text}
                  </Text>
                )
              ) : (
                <Text style={[styles.subtitleMuted, align]}>
                  {subtitleMode === 'off' ? t('videoClipSubtitlesOffHint') : t('videoClipTapPlay')}
                </Text>
              )}
            </View>

            <View style={[styles.segment, row]}>
              {(['en', 'fa', 'off'] as SubtitleMode[]).map((m) => (
                <TouchableOpacity
                  key={m}
                  style={[styles.segmentBtn, subtitleMode === m && styles.segmentBtnActive]}
                  onPress={() => setSubtitleMode(m)}
                  activeOpacity={0.85}
                >
                  <Text style={[styles.segmentText, subtitleMode === m && styles.segmentTextActive]}>
                    {t(m === 'en' ? 'videoClipSubEn' : m === 'fa' ? 'videoClipSubFa' : 'videoClipSubOff')}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* راهنمای مسیر: کاربر از اول بداند بعد از دیدن، جای یک شخصیت حرف می‌زند. */}
            <View style={[styles.card, styles.guideCard]}>
              <View style={[styles.guideHead, row]}>
                <View style={styles.guideIcon}>
                  <Sparkles size={16} color={COLORS.secondary} />
                </View>
                <Text style={styles.guideTitle}>{t('videoClipGuideTitle')}</Text>
              </View>
              {[
                ['videoClipGuideWatch', 'videoClipGuideWatchSub'],
                ...(quizTotal > 0 ? [['videoClipGuideQuiz', 'videoClipGuideQuizSub']] : []),
                ['videoClipGuideSpeak', 'videoClipGuideSpeakSub'],
              ].map(([key, sub], i) => (
                <View key={key} style={[styles.guideRow, row]}>
                  <View style={[styles.guideNum, i === 0 && styles.guideNumActive]}>
                    <Text style={[styles.guideNumText, i === 0 && styles.guideNumTextActive]}>{num(i + 1)}</Text>
                  </View>
                  <View style={styles.flex}>
                    <Text style={[styles.guideText, align, i === 0 && styles.guideTextActive]}>{t(key)}</Text>
                    <Text style={[styles.guideSub, align]}>{t(sub)}</Text>
                  </View>
                </View>
              ))}
            </View>

            {!!clip.description_fa && (
              <View style={styles.card}>
                <View style={[styles.guideHead, row]}>
                  <BookOpen size={16} color={COLORS.info} />
                  <Text style={styles.cardTitle}>{t('videoClipSummary')}</Text>
                </View>
                <Text style={[styles.bodyText, styles.textRight]}>{clip.description_fa}</Text>
              </View>
            )}
            {tipCard(t('videoClipWatchHint'))}
          </>
        )}

        {/* ---------- ۲) سؤال‌های فهم ---------- */}
        {step === 'quiz' && question && (
          <>
            <View style={styles.card}>
              <View style={[styles.chip, rtl && styles.selfEnd]}>
                <Text style={styles.chipText}>{t('videoClipComprehension')}</Text>
              </View>
              <Text style={[styles.questionText, styles.textRight]}>{question.question_fa}</Text>
            </View>
            {question.options.map((opt, i) => {
              const isAnswer = i === question.answer_index;
              const revealed = chosen !== null;
              const active = revealed ? i === chosen || isAnswer : i === selected;
              return (
                <TouchableOpacity
                  key={i}
                  style={[
                    styles.option,
                    row,
                    active && styles.optionPicked,
                    revealed && isAnswer && styles.optionRight,
                    revealed && i === chosen && !isAnswer && styles.optionWrong,
                  ]}
                  onPress={() => setSelected(i)}
                  disabled={revealed}
                  activeOpacity={0.85}
                >
                  <View style={[styles.letter, active && styles.letterActive]}>
                    <Text style={[styles.letterText, active && styles.letterTextActive]}>
                      {(rtl ? OPTION_LETTERS_FA : OPTION_LETTERS_EN)[i] ?? num(i + 1)}
                    </Text>
                  </View>
                  <Text style={[styles.optionText, align]}>{opt}</Text>
                  {revealed && isAnswer ? (
                    <CircleCheck size={20} color={COLORS.success} />
                  ) : revealed && i === chosen ? (
                    <CircleX size={20} color={COLORS.error} />
                  ) : (
                    <View style={[styles.radio, i === selected && styles.radioOn]}>
                      {i === selected && <View style={styles.radioDot} />}
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </>
        )}

        {step === 'quiz' && !question && (
          <View style={[styles.card, styles.centerCard]}>
            <ProgressRing
              percent={quizTotal ? (correctCount / quizTotal) * 100 : 0}
              size={132}
              strokeWidth={10}
              trackColor={COLORS.primaryLight}
            >
              <Text style={styles.ringBig}>
                {num(correctCount)} / {num(quizTotal)}
              </Text>
              <Text style={styles.ringSub}>{t('videoClipCorrectAnswers')}</Text>
            </ProgressRing>
            <Text style={styles.doneTitle}>
              {t(correctCount === quizTotal ? 'videoClipQuizPerfect' : 'videoClipQuizDoneTitle')}
            </Text>
            <Text style={[styles.mutedText, styles.textCenter]}>{t('videoClipQuizDoneSub')}</Text>
            <View style={[styles.statRow, row]}>
              <View style={styles.statBox}>
                <Text style={styles.statLabel}>{t('videoClipAccuracy')}</Text>
                <Text style={styles.statValue}>
                  {num(quizTotal ? Math.round((correctCount / quizTotal) * 100) : 0)}٪
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* ---------- ۳) انتخاب شخصیت ---------- */}
        {step === 'pick' && (
          <>
            <View style={[styles.card, row, styles.introCard]}>
              <View style={styles.introIcon}>
                <Mic size={18} color={COLORS.primary} />
              </View>
              <View style={styles.flex}>
                <Text style={[styles.cardTitle, align]}>{t('videoClipPickTitle')}</Text>
                <Text style={[styles.bodyText, align]}>{t('videoClipPickHint')}</Text>
              </View>
            </View>
            <View style={[styles.cardTop, row]}>
              <Text style={styles.sectionLabel}>{t('videoClipPickSection')}</Text>
              {pill(t('videoClipCharacters').replace('{n}', num(speakers.length)))}
            </View>
            {speakers.map((sp, i) => {
              const on = speaker === sp.name;
              const suggested = sp.name === suggestedSpeaker;
              const palette = AVATAR_COLORS[i % AVATAR_COLORS.length];
              return (
                <TouchableOpacity
                  key={sp.name}
                  style={[styles.option, styles.charRow, row, on && styles.optionPicked]}
                  onPress={() => setSpeaker(sp.name)}
                  activeOpacity={0.85}
                >
                  {suggested && (
                    <View style={[styles.suggestBadge, rtl ? styles.suggestRight : styles.suggestLeft]}>
                      <Text style={styles.suggestText}>★ {t('videoClipSuggested')}</Text>
                    </View>
                  )}
                  <View style={[styles.avatar, { backgroundColor: palette }]}>
                    <Text style={styles.avatarText}>{sp.name.charAt(0).toUpperCase()}</Text>
                  </View>
                  <Text style={[styles.charName, align]} numberOfLines={1}>
                    {sp.name}
                  </Text>
                  <View style={[styles.countPill, on && styles.countPillOn]}>
                    <Text style={[styles.countText, on && styles.countTextOn]}>
                      {t('videoClipLinesCount').replace('{n}', num(sp.count))}
                    </Text>
                  </View>
                  <View style={[styles.radio, on && styles.radioOn]}>{on && <Check size={12} color={COLORS.white} />}</View>
                </TouchableOpacity>
              );
            })}

            <Text style={[styles.sectionLabel, align, styles.mtS]}>{t('videoClipHideTitle')}</Text>
            <View style={[styles.segment, row]}>
              {HIDE_LEVELS.map((h) => (
                <TouchableOpacity
                  key={h}
                  style={[styles.segmentBtn, hideLevel === h && styles.segmentBtnActive]}
                  onPress={() => setHideLevel(h)}
                  activeOpacity={0.85}
                >
                  <Text style={[styles.segmentText, hideLevel === h && styles.segmentTextActive]}>
                    {t(`videoClipHide${h}`)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text style={[styles.mutedSmall, align]}>{t(`videoClipHide${hideLevel}Hint`)}</Text>
          </>
        )}

        {/* ---------- ۴) اجرا ---------- */}
        {step === 'perform' && (
          <>
            <View style={[styles.card, isMyTurn && styles.turnCard]}>
              <View style={[styles.cardTop, row]}>
                <View style={[styles.liveDotRow, row]}>
                  <View style={[styles.turnIcon, isMyTurn && styles.turnIconOn]}>
                    <Mic size={14} color={isMyTurn ? COLORS.white : COLORS.muted} />
                  </View>
                  <View>
                    <Text style={[styles.turnTitle, align, isMyTurn && styles.turnTitleOn]}>
                      {isMyTurn ? t('videoClipYourTurn') : currentLine ? currentLine.speaker : t('videoClipPerformHint')}
                    </Text>
                    {isMyTurn && <Text style={[styles.mutedSmall, align]}>{t('videoClipSayIt')}</Text>}
                  </View>
                </View>
              </View>
              {currentLine && (
                <View style={styles.lineBox}>
                  <Text style={[styles.turnLine, !isMyTurn && styles.turnLineOther]}>
                    {isMyTurn
                      ? hideLevel === 100
                        ? currentLine.translation_fa || '…'
                        : hideLevel
                          ? maskLine(currentLine.text, hideLevel)
                          : currentLine.text
                      : hideLevel < 100
                        ? currentLine.text
                        : '…'}
                  </Text>
                  {isMyTurn && hideLevel < 100 && !!currentLine.translation_fa && (
                    <Text style={[styles.faLine, styles.textRight]}>{currentLine.translation_fa}</Text>
                  )}
                </View>
              )}
              {isMyTurn && recording && (
                <View style={[styles.recBar, row]}>
                  <View style={styles.recDot} />
                  <Text style={styles.recText}>{t('videoClipRecording')}</Text>
                </View>
              )}
            </View>
            {hideLevel > 0 && tipCard(t(`videoClipHide${hideLevel}Hint`))}
          </>
        )}

        {/* ---------- ۵) نمره‌دهی و نتیجه ---------- */}
        {step === 'scoring' && (
          <View style={[styles.card, styles.centerCard]}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={styles.mutedText}>
              {t('videoClipScoring').replace('{done}', num(scoringDone)).replace('{total}', num(myLineIdx.length))}
            </Text>
          </View>
        )}

        {step === 'result' && (
          <>
            <View style={styles.card}>
              <View style={[styles.scoreHead, row]}>
                <ProgressRing
                  percent={overallScore}
                  size={96}
                  strokeWidth={9}
                  color={scoreColor(overallScore)}
                  trackColor={COLORS.surfaceHigh}
                >
                  <Text style={[styles.ringScore, { color: scoreColor(overallScore) }]}>{num(overallScore)}</Text>
                  <Text style={styles.ringSub}>{t('videoClipOf100')}</Text>
                </ProgressRing>
                <View style={styles.flex}>
                  <View style={[styles.verdict, rtl && styles.selfEnd, { backgroundColor: scoreTint(overallScore) }]}>
                    <Text style={[styles.verdictText, { color: scoreColor(overallScore) }]}>
                      {t(scoreVerdictKey(overallScore))}
                    </Text>
                  </View>
                  <Text style={[styles.mutedText, align]}>{t('videoClipScoreAs')}</Text>
                  <Text style={[styles.scoreSpeaker, align]}>{speaker}</Text>
                </View>
              </View>
              <View style={[styles.statRow, row]}>
                {[
                  ['videoClipPron', avg((r) => r.pronunciation_score)],
                  ['videoClipFluency', avg((r) => r.fluency_score)],
                  ['videoClipSaid', myLineIdx.length ? Math.round((doneCount / myLineIdx.length) * 100) : 0],
                ].map(([key, value]) => (
                  <View key={key as string} style={styles.statBox}>
                    <Text style={styles.statLabel}>{t(key as string)}</Text>
                    <Text style={styles.statValue}>{num(value as number)}٪</Text>
                  </View>
                ))}
              </View>
            </View>

            <View style={[styles.cardTop, row]}>
              <Text style={styles.sectionLabel}>{t('videoClipLineAnalysis')}</Text>
              <Text style={styles.recCount}>{t('videoClipRecordedN').replace('{n}', num(doneCount))}</Text>
            </View>
            {myLineIdx.map((i) => {
              const line = lines[i];
              const r = scores[i];
              return (
                <View key={i} style={styles.card}>
                  <View style={styles.resultLineRow}>
                    {typeof r === 'object' ? (
                      <View style={[styles.lineBadge, { borderColor: scoreColor(r.overall_score) }]}>
                        <Text style={[styles.lineBadgeNum, { color: scoreColor(r.overall_score) }]}>
                          {num(Math.round(r.overall_score))}
                        </Text>
                        <Text style={[styles.lineBadgeSub, { color: scoreColor(r.overall_score) }]}>
                          {t(scoreVerdictKey(r.overall_score))}
                        </Text>
                      </View>
                    ) : (
                      <View style={styles.lineBadge}>
                        <Text style={styles.lineBadgeSub}>
                          {t(r === 'missing' ? 'videoClipLineMissing' : 'videoClipLineError')}
                        </Text>
                      </View>
                    )}
                    <View style={styles.flex}>{coloredLine(line, r)}</View>
                  </View>
                  {!!line.translation_fa && <Text style={[styles.faLine, styles.textRight]}>{line.translation_fa}</Text>}
                  {typeof r === 'object' && !!r.transcript && (
                    <Text style={styles.heardText}>
                      {t('videoClipHeard')}: {r.transcript}
                    </Text>
                  )}
                  <View style={[styles.row, row]}>
                    <TouchableOpacity style={[styles.smallBtn, styles.flex]} onPress={() => playOriginal(line)} activeOpacity={0.85}>
                      <Volume2 size={15} color={COLORS.primary} />
                      <Text style={styles.smallBtnText}>{t('videoClipPlayOriginal')}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.smallBtn, styles.flex, !recordings[i] && styles.disabled]}
                      onPress={() => playMine(i)}
                      disabled={!recordings[i]}
                      activeOpacity={0.85}
                    >
                      <Mic size={15} color={COLORS.primary} />
                      <Text style={styles.smallBtnText}>{t('videoClipPlayMine')}</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}
            {!!weakestWord && tipCard(t('videoClipTipWord').replace('{word}', weakestWord.word))}
          </>
        )}
      </ScrollView>

      {/* ---------- دکمه‌های پایین هر مرحله ---------- */}
      {step === 'watch' &&
        footer(
          <View style={[styles.row, row]}>
            <TouchableOpacity style={[styles.primaryBtn, styles.flex2, row]} onPress={goAfterWatch} activeOpacity={0.85}>
              <Text style={styles.primaryBtnText}>{t(quizTotal > 0 ? 'videoClipToQuiz' : 'videoClipToPick')}</Text>
              <ArrowLeft size={18} color={COLORS.white} />
            </TouchableOpacity>
            <TouchableOpacity style={[styles.secondaryBtn, styles.flex]} onPress={() => restartVideo(true)} activeOpacity={0.85}>
              <RotateCcw size={16} color={COLORS.text} />
              <Text style={styles.secondaryBtnText}>{t('videoClipReplay')}</Text>
            </TouchableOpacity>
          </View>
        )}

      {step === 'quiz' &&
        question &&
        footer(
          <>
            <TouchableOpacity
              style={[styles.primaryBtn, row, chosen === null && selected === null && styles.disabled]}
              disabled={chosen === null && selected === null}
              onPress={() => (chosen === null ? selected !== null && answer(selected) : nextQuestion())}
              activeOpacity={0.85}
            >
              <Text style={styles.primaryBtnText}>{t(chosen === null ? 'videoClipCheck' : 'videoClipNext')}</Text>
              <ArrowLeft size={18} color={COLORS.white} />
            </TouchableOpacity>
            {chosen === null && (
              <TouchableOpacity onPress={nextQuestion} hitSlop={8}>
                <Text style={styles.skipText}>{t('videoClipSkipQuestion')}</Text>
              </TouchableOpacity>
            )}
          </>
        )}

      {step === 'quiz' &&
        !question &&
        footer(
          <>
            <TouchableOpacity style={[styles.primaryBtn, row]} onPress={() => setStep('pick')} activeOpacity={0.85}>
              <Mic size={18} color={COLORS.white} />
              <Text style={styles.primaryBtnText}>{t('videoClipToPickSpeak')}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.secondaryBtn}
              onPress={() => {
                setStep('watch');
                restartVideo(true);
              }}
              activeOpacity={0.85}
            >
              <RotateCcw size={16} color={COLORS.text} />
              <Text style={styles.secondaryBtnText}>{t('videoClipWatchAgain')}</Text>
            </TouchableOpacity>
          </>
        )}

      {step === 'pick' &&
        footer(
          <TouchableOpacity
            style={[styles.primaryBtn, row, !speaker && styles.disabled]}
            onPress={startPerform}
            disabled={!speaker}
            activeOpacity={0.85}
          >
            <Mic size={18} color={COLORS.white} />
            <Text style={styles.primaryBtnText}>
              {speaker ? t('videoClipStartAs').replace('{name}', speaker) : t('videoClipStartPerform')}
            </Text>
          </TouchableOpacity>,
          t('videoClipMicNote')
        )}

      {step === 'perform' &&
        footer(
          <>
            <TouchableOpacity style={[styles.darkBtn, row]} onPress={() => setPaused((p) => !p)} activeOpacity={0.85}>
              {paused ? <Play size={16} color={COLORS.white} /> : <Pause size={16} color={COLORS.white} />}
              <Text style={styles.darkBtnText}>{t(paused ? 'videoClipResume' : 'videoClipPause')}</Text>
            </TouchableOpacity>
            <View style={[styles.cardTop, row]}>
              <Text style={styles.mutedSmall}>
                {t('videoClipLineProgress').replace('{n}', num(doneCount)).replace('{total}', num(myLineIdx.length))}
              </Text>
              {recording && (
                <View style={[styles.liveDotRow, row]}>
                  <View style={styles.recDot} />
                  <Text style={styles.recSmall}>{t('videoClipRecShort')}</Text>
                </View>
              )}
            </View>
            <View style={[styles.segTrack, row]}>
              {myLineIdx.map((i) => (
                <View
                  key={i}
                  style={[
                    styles.segPiece,
                    recordings[i] ? styles.segDone : recLineRefCurrent(i, isMyTurn, currentIdx) && styles.segNow,
                  ]}
                />
              ))}
            </View>
          </>
        )}

      {step === 'result' &&
        footer(
          <View style={[styles.row, row]}>
            <TouchableOpacity style={[styles.primaryBtn, styles.flex, row]} onPress={startPerform} activeOpacity={0.85}>
              <RotateCcw size={16} color={COLORS.white} />
              <Text style={styles.primaryBtnText}>{t('videoClipPerformAgain')}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.secondaryBtn, styles.flex]}
              onPress={() => {
                setPaused(true);
                setStep('pick');
              }}
              activeOpacity={0.85}
            >
              <Users size={16} color={COLORS.text} />
              <Text style={styles.secondaryBtnText}>{t('videoClipOtherCharacter')}</Text>
            </TouchableOpacity>
          </View>
        )}
    </View>
  );
};

/** خطی که همین حالا نوبت کاربر است، در نوار پیشرفت قرمز می‌شود. */
const recLineRefCurrent = (i: number, isMyTurn: boolean, currentIdx: number) => isMyTurn && i === currentIdx;

const LEVEL_LABEL_KEY: Record<string, string> = {
  starter: 'levelStarter',
  beginner: 'levelBeginner',
  intermediate: 'levelIntermediate',
  advanced: 'levelAdvanced',
  proficient: 'levelProficient',
};
const OPTION_LETTERS_FA = ['الف', 'ب', 'ج', 'د', 'ه'];
const OPTION_LETTERS_EN = ['A', 'B', 'C', 'D', 'E'];
const AVATAR_COLORS = ['#F59E0B', '#EC4899', '#F97316', '#3B82F6', '#10B981', '#8B5CF6'];

const scoreVerdictKey = (score: number) =>
  score >= 85 ? 'videoClipVerdictGreat' : score >= 70 ? 'videoClipVerdictGood' : score >= 50 ? 'videoClipVerdictOk' : 'videoClipVerdictWork';
const scoreTint = (score: number) =>
  score >= 75 ? COLORS.successLight : score >= 50 ? COLORS.warningLight : COLORS.errorLight;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.backgroundSoft,
  },
  center: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.s,
  },
  hidden: {
    height: 0,
    overflow: 'hidden',
    marginBottom: 0,
  },
  flex: {
    flex: 1,
  },
  flex2: {
    flex: 2,
  },
  rowReverse: {
    flexDirection: 'row-reverse',
  },
  textRight: {
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  textCenter: {
    textAlign: 'center',
  },
  selfEnd: {
    alignSelf: 'flex-end',
  },
  mtS: {
    marginTop: SPACING.s,
  },

  // ---- سرتیتر ----
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.s,
    paddingHorizontal: SPACING.m,
    paddingVertical: SPACING.s,
  },
  closeBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: COLORS.surfaceHigh,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerLabel: {
    fontFamily: FONT_FAMILY.medium,
    fontSize: 11,
    color: COLORS.primary,
  },
  headerTitle: {
    fontFamily: FONT_FAMILY.bold,
    fontSize: 16,
    color: COLORS.text,
  },
  headerSide: {
    minWidth: 38,
    maxWidth: 120,
    alignItems: 'center',
  },
  pill: {
    backgroundColor: COLORS.primaryLight,
    borderRadius: BORDER_RADIUS.full,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  pillAmber: {
    backgroundColor: COLORS.secondaryLight,
  },
  pillText: {
    fontFamily: FONT_FAMILY.semiBold,
    fontSize: 11,
    color: COLORS.primary,
  },
  pillTextAmber: {
    color: COLORS.warningDeep,
  },
  quizTrack: {
    height: 4,
    backgroundColor: COLORS.surfaceHigh,
    marginHorizontal: SPACING.m,
    marginTop: SPACING.s,
    borderRadius: 2,
    overflow: 'hidden',
  },
  quizFill: {
    height: 4,
    backgroundColor: COLORS.primary,
    borderRadius: 2,
  },

  // ---- ویدیو ----
  videoWrap: {
    backgroundColor: COLORS.black,
    overflow: 'hidden',
  },
  videoCard: {
    borderRadius: BORDER_RADIUS.xl,
    marginBottom: SPACING.xs,
    ...SHADOWS.level2,
  },
  playOverlay: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  videoTrack: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.25)',
  },
  videoFill: {
    height: 4,
    backgroundColor: COLORS.primary,
  },
  statusPill: {
    position: 'absolute',
    top: SPACING.s,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderRadius: BORDER_RADIUS.full,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  statusPillLeft: {
    left: SPACING.s,
  },
  statusPillRight: {
    right: SPACING.s,
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#34D399',
  },
  statusPillText: {
    fontFamily: FONT_FAMILY.medium,
    fontSize: 11,
    color: COLORS.white,
  },
  countdown: {
    position: 'absolute',
    alignSelf: 'center',
    top: '28%',
    backgroundColor: 'rgba(17,24,39,0.8)',
    borderRadius: BORDER_RADIUS.l,
    paddingHorizontal: SPACING.l,
    paddingVertical: SPACING.s,
    alignItems: 'center',
  },
  countdownLabel: {
    fontFamily: FONT_FAMILY.medium,
    fontSize: 12,
    color: COLORS.secondary,
  },
  countdownNum: {
    fontFamily: FONT_FAMILY.bold,
    fontSize: 30,
    color: COLORS.white,
  },
  micBadge: {
    position: 'absolute',
    bottom: SPACING.m,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.error,
    borderRadius: BORDER_RADIUS.full,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  micBadgeText: {
    fontFamily: FONT_FAMILY.bold,
    fontSize: 13,
    color: COLORS.white,
  },

  // ---- محتوا ----
  content: {
    padding: SPACING.m,
    gap: SPACING.s + 4,
    paddingBottom: SPACING.l,
  },
  card: {
    backgroundColor: COLORS.background,
    borderRadius: BORDER_RADIUS.xl,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    padding: SPACING.m,
    gap: SPACING.s,
    ...SHADOWS.level1,
  },
  centerCard: {
    alignItems: 'center',
    paddingVertical: SPACING.l,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: SPACING.s,
  },
  cardLabel: {
    fontFamily: FONT_FAMILY.medium,
    fontSize: 12,
    color: COLORS.muted,
  },
  cardTitle: {
    fontFamily: FONT_FAMILY.bold,
    fontSize: 15,
    color: COLORS.text,
  },
  sectionLabel: {
    fontFamily: FONT_FAMILY.semiBold,
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  liveDotRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  liveDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: COLORS.primary,
  },
  speakerTag: {
    fontFamily: FONT_FAMILY.semiBold,
    fontSize: 12,
    color: COLORS.primary,
  },
  enLine: {
    fontFamily: FONT_FAMILY.semiBold,
    fontSize: 17,
    lineHeight: 25,
    color: COLORS.text,
  },
  faLine: {
    ...TEXT_STYLES.bodyMd,
    color: COLORS.muted,
  },
  faLineBig: {
    ...TEXT_STYLES.bodyLg,
    color: COLORS.text,
  },
  subtitleMuted: {
    ...TEXT_STYLES.bodyMd,
    color: COLORS.muted,
  },
  bodyText: {
    ...TEXT_STYLES.bodyMd,
    color: COLORS.textSecondary,
    lineHeight: 24,
  },
  segment: {
    flexDirection: 'row',
    backgroundColor: COLORS.surfaceHigh,
    borderRadius: BORDER_RADIUS.l,
    padding: 3,
  },
  segmentBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 9,
    borderRadius: BORDER_RADIUS.m,
  },
  segmentBtnActive: {
    backgroundColor: COLORS.background,
    ...SHADOWS.level1,
  },
  segmentText: {
    fontFamily: FONT_FAMILY.medium,
    fontSize: 12,
    color: COLORS.muted,
  },
  segmentTextActive: {
    fontFamily: FONT_FAMILY.bold,
    color: COLORS.text,
  },

  // ---- راهنما و نکته ----
  guideCard: {
    gap: SPACING.s + 4,
  },
  guideHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.s,
  },
  guideIcon: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: COLORS.secondaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  guideTitle: {
    fontFamily: FONT_FAMILY.bold,
    fontSize: 15,
    color: COLORS.text,
  },
  guideRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.s + 2,
  },
  guideNum: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.surfaceHigh,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  guideNumActive: {
    backgroundColor: COLORS.primary,
  },
  guideNumText: {
    fontFamily: FONT_FAMILY.bold,
    fontSize: 12,
    color: COLORS.muted,
  },
  guideNumTextActive: {
    color: COLORS.white,
  },
  guideText: {
    fontFamily: FONT_FAMILY.semiBold,
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  guideTextActive: {
    color: COLORS.text,
    fontFamily: FONT_FAMILY.bold,
  },
  guideSub: {
    fontFamily: FONT_FAMILY.regular,
    fontSize: 12,
    color: COLORS.muted,
    marginTop: 2,
  },
  tipCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.s,
    backgroundColor: '#FFF8E6',
    borderWidth: 1,
    borderColor: '#F6E3B4',
    borderRadius: BORDER_RADIUS.l,
    padding: SPACING.m,
  },
  tipText: {
    flex: 1,
    ...TEXT_STYLES.bodyMd,
    color: COLORS.warningDeep,
  },

  // ---- سؤال ----
  chip: {
    alignSelf: 'flex-start',
    backgroundColor: COLORS.primaryLight,
    borderRadius: BORDER_RADIUS.full,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  chipText: {
    fontFamily: FONT_FAMILY.semiBold,
    fontSize: 11,
    color: COLORS.primary,
  },
  questionText: {
    fontFamily: FONT_FAMILY.bold,
    fontSize: 18,
    lineHeight: 28,
    color: COLORS.text,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.s + 2,
    backgroundColor: COLORS.background,
    borderWidth: 1.5,
    borderColor: COLORS.borderLight,
    borderRadius: BORDER_RADIUS.l,
    padding: SPACING.m - 2,
  },
  optionPicked: {
    borderColor: COLORS.primary,
    backgroundColor: '#FFF4F0',
  },
  optionRight: {
    borderColor: COLORS.success,
    backgroundColor: COLORS.successLight,
  },
  optionWrong: {
    borderColor: COLORS.error,
    backgroundColor: COLORS.errorLight,
  },
  optionText: {
    flex: 1,
    ...TEXT_STYLES.bodyMd,
    color: COLORS.text,
  },
  letter: {
    minWidth: 30,
    height: 30,
    paddingHorizontal: 4,
    borderRadius: BORDER_RADIUS.m,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  letterActive: {
    backgroundColor: COLORS.primary,
  },
  letterText: {
    fontFamily: FONT_FAMILY.bold,
    fontSize: 12,
    color: COLORS.muted,
  },
  letterTextActive: {
    color: COLORS.white,
  },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioOn: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary,
  },
  radioDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.white,
  },
  ringBig: {
    fontFamily: FONT_FAMILY.bold,
    fontSize: 30,
    color: COLORS.text,
  },
  ringScore: {
    fontFamily: FONT_FAMILY.bold,
    fontSize: 28,
  },
  ringSub: {
    fontFamily: FONT_FAMILY.regular,
    fontSize: 11,
    color: COLORS.muted,
  },
  doneTitle: {
    fontFamily: FONT_FAMILY.bold,
    fontSize: 18,
    color: COLORS.text,
    marginTop: SPACING.s,
  },
  statRow: {
    flexDirection: 'row',
    gap: SPACING.s,
    alignSelf: 'stretch',
    marginTop: SPACING.s,
  },
  statBox: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.l,
    paddingVertical: SPACING.s + 2,
    alignItems: 'center',
    gap: 2,
  },
  statLabel: {
    fontFamily: FONT_FAMILY.regular,
    fontSize: 11,
    color: COLORS.muted,
  },
  statValue: {
    fontFamily: FONT_FAMILY.bold,
    fontSize: 16,
    color: COLORS.text,
  },

  // ---- انتخاب شخصیت ----
  introCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  introIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  charRow: {
    paddingVertical: SPACING.m,
  },
  suggestBadge: {
    position: 'absolute',
    top: -10,
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.full,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  suggestLeft: {
    left: SPACING.m,
  },
  suggestRight: {
    right: SPACING.m,
  },
  suggestText: {
    fontFamily: FONT_FAMILY.bold,
    fontSize: 10,
    color: COLORS.white,
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: BORDER_RADIUS.l,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontFamily: FONT_FAMILY.bold,
    fontSize: 18,
    color: COLORS.white,
  },
  charName: {
    flex: 1,
    fontFamily: FONT_FAMILY.bold,
    fontSize: 15,
    color: COLORS.text,
  },
  countPill: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.full,
    paddingHorizontal: 9,
    paddingVertical: 3,
  },
  countPillOn: {
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  countText: {
    fontFamily: FONT_FAMILY.semiBold,
    fontSize: 11,
    color: COLORS.muted,
  },
  countTextOn: {
    color: COLORS.primary,
  },

  // ---- اجرا ----
  turnCard: {
    borderColor: COLORS.error,
    borderWidth: 1.5,
  },
  turnIcon: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  turnIconOn: {
    backgroundColor: COLORS.error,
  },
  turnTitle: {
    fontFamily: FONT_FAMILY.bold,
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  turnTitleOn: {
    color: COLORS.error,
  },
  lineBox: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.l,
    padding: SPACING.m,
    gap: 6,
  },
  turnLine: {
    fontFamily: FONT_FAMILY.bold,
    fontSize: 20,
    lineHeight: 30,
    color: COLORS.text,
  },
  turnLineOther: {
    fontFamily: FONT_FAMILY.medium,
    fontSize: 16,
    color: COLORS.textSecondary,
  },
  recBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.s,
    backgroundColor: COLORS.errorLight,
    borderRadius: BORDER_RADIUS.m,
    paddingHorizontal: SPACING.m,
    paddingVertical: SPACING.s,
  },
  recDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.error,
  },
  recText: {
    fontFamily: FONT_FAMILY.semiBold,
    fontSize: 13,
    color: COLORS.error,
  },
  recSmall: {
    fontFamily: FONT_FAMILY.medium,
    fontSize: 11,
    color: COLORS.error,
  },
  segTrack: {
    flexDirection: 'row',
    gap: 3,
  },
  segPiece: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.surfaceHigh,
  },
  segDone: {
    backgroundColor: COLORS.success,
  },
  segNow: {
    backgroundColor: COLORS.error,
  },

  // ---- نتیجه ----
  scoreHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.m,
  },
  verdict: {
    alignSelf: 'flex-start',
    borderRadius: BORDER_RADIUS.full,
    paddingHorizontal: 10,
    paddingVertical: 3,
    marginBottom: 4,
  },
  verdictText: {
    fontFamily: FONT_FAMILY.bold,
    fontSize: 11,
  },
  scoreSpeaker: {
    fontFamily: FONT_FAMILY.bold,
    fontSize: 20,
    color: COLORS.primary,
  },
  recCount: {
    fontFamily: FONT_FAMILY.semiBold,
    fontSize: 12,
    color: COLORS.primary,
  },
  resultLineRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.s + 2,
  },
  lineBadge: {
    minWidth: 46,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.m,
    paddingVertical: 4,
    paddingHorizontal: 4,
    alignItems: 'center',
  },
  lineBadgeNum: {
    fontFamily: FONT_FAMILY.bold,
    fontSize: 16,
  },
  lineBadgeSub: {
    fontFamily: FONT_FAMILY.regular,
    fontSize: 9,
    color: COLORS.muted,
    textAlign: 'center',
  },
  resultLineText: {
    fontFamily: FONT_FAMILY.bold,
    fontSize: 16,
    lineHeight: 24,
    color: COLORS.text,
  },
  weakWord: {
    color: COLORS.error,
    textDecorationLine: 'underline',
  },
  heardText: {
    fontFamily: FONT_FAMILY.regular,
    fontSize: 12,
    color: COLORS.muted,
  },

  // ---- دکمه‌ها ----
  footer: {
    backgroundColor: COLORS.background,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
    paddingHorizontal: SPACING.m,
    paddingTop: SPACING.s + 4,
    gap: SPACING.s,
  },
  footerNote: {
    fontFamily: FONT_FAMILY.regular,
    fontSize: 11,
    color: COLORS.muted,
    textAlign: 'center',
  },
  row: {
    flexDirection: 'row',
    gap: SPACING.s,
  },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.s,
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.l,
    paddingVertical: 15,
    ...SHADOWS.level2,
  },
  primaryBtnText: {
    fontFamily: FONT_FAMILY.bold,
    fontSize: 15,
    color: COLORS.white,
  },
  secondaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.l,
    paddingVertical: 14,
  },
  secondaryBtnText: {
    fontFamily: FONT_FAMILY.semiBold,
    fontSize: 14,
    color: COLORS.text,
  },
  darkBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.s,
    backgroundColor: COLORS.text,
    borderRadius: BORDER_RADIUS.l,
    paddingVertical: 14,
  },
  darkBtnText: {
    fontFamily: FONT_FAMILY.bold,
    fontSize: 14,
    color: COLORS.white,
  },
  smallBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: COLORS.primaryLight,
    borderRadius: BORDER_RADIUS.full,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  smallBtnText: {
    fontFamily: FONT_FAMILY.semiBold,
    fontSize: 12,
    color: COLORS.primary,
  },
  skipText: {
    fontFamily: FONT_FAMILY.medium,
    fontSize: 12,
    color: COLORS.muted,
    textAlign: 'center',
    paddingVertical: 2,
  },
  disabled: {
    opacity: 0.45,
  },
  mutedText: {
    ...TEXT_STYLES.bodyMd,
    color: COLORS.muted,
  },
  mutedSmall: {
    fontFamily: FONT_FAMILY.regular,
    fontSize: 12,
    color: COLORS.muted,
  },
  linkText: {
    color: COLORS.primary,
    fontFamily: FONT_FAMILY.semiBold,
  },
});
