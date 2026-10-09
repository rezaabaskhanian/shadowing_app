import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View, useWindowDimensions } from 'react-native';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Video, { type VideoRef } from 'react-native-video';
import { CircleCheck, CircleX, Mic, Pause, Play, RotateCcw, Volume2, X } from 'lucide-react-native';

import { COLORS, SPACING, BORDER_RADIUS } from '../../theme/colors';
import { FONT_FAMILY, TEXT_STYLES } from '../../theme/typography';
import { SHADOWS } from '../../theme/elevation';
import { useLanguage } from '../../data/i18n';
import { AudioPlayer } from '../../components/AudioPlayer';
import { ensureMicPermission } from '../../services/micPermission';
import { absUrl } from '../../api/config';
import { evaluateRecording, type EvaluationResult } from '../../api/shadowing';
import { getVideoClip, recordVideoClipAttempt, type VideoClip, type VideoClipLine } from '../../api/videoClips';
import { track } from '../../services/analytics';

type Step = 'watch' | 'quiz' | 'pick' | 'perform' | 'scoring' | 'result';
type SubtitleMode = 'en' | 'fa' | 'off';
type RecCommand = 'none' | 'start_record' | 'stop_record' | 'play_recording';

/** ضبط هر خط کمی زودتر شروع می‌شود (تأخیر روشن شدن میکروفن)... */
const REC_LEAD_MS = 150;
/** ...و کمی دیرتر بسته می‌شود تا آخر جمله‌ی کاربر بریده نشود. */
const REC_TAIL_MS = 450;
/** صدای ویدیو در این بازه‌ی اطراف خط کاربر قطع است. */
const MUTE_LEAD_MS = 100;
const MUTE_TAIL_MS = 200;

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

const lineAt = (lines: VideoClipLine[], ms: number) =>
  lines.findIndex((l) => ms >= l.start_ms && ms <= l.end_ms);

/**
 * «تمرین با ویدیو»: ۱) دیدن کلیپ (با زیرنویس انگلیسی/فارسی/بدون زیرنویس)،
 * ۲) سؤال‌های فهم، ۳) انتخاب شخصیت، ۴) پخش دوباره‌ی کلیپ که سر نوبت آن شخصیت
 * صدای ویدیو قطع می‌شود و صدای کاربر ضبط می‌شود، ۵) نمره‌ی تلفظ هر خط با همان
 * ارزیاب شدوئینگ، و شنیدن ضبط خود و جمله‌ی اصلی کنار هم.
 */
export const VideoClipScreen: React.FC = () => {
  const { t } = useLanguage();
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
  const [correctCount, setCorrectCount] = useState(0);

  // ---- انتخاب شخصیت و اجرا ----
  const [speaker, setSpeaker] = useState<string | null>(null);
  const [showText, setShowText] = useState(true);
  const [recordings, setRecordings] = useState<Record<number, LineRecording>>({});
  const [recCommand, setRecCommand] = useState<RecCommand>('none');
  const [recNonce, setRecNonce] = useState(0);
  const [playPath, setPlayPath] = useState<string | null>(null);
  const recStateRef = useRef<'idle' | 'starting' | 'recording' | 'stopping'>('idle');
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
    const inMyWindow = myLineIdx.some(
      (i) => ms >= lines[i].start_ms - MUTE_LEAD_MS && ms <= lines[i].end_ms + MUTE_TAIL_MS
    );
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

  const videoHeight = Math.round((width * 9) / 16);
  const showVideo = step === 'watch' || step === 'perform' || step === 'result';
  const currentIdx = lineAt(lines, positionMs);
  const currentLine = currentIdx >= 0 ? lines[currentIdx] : null;
  const isMyTurn = step === 'perform' && currentLine !== null && currentLine.speaker === speaker;
  const question = clip.questions[qIndex];

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

      <View style={styles.topRow}>
        <TouchableOpacity
          style={styles.closeBtn}
          onPress={() => navigation.goBack()}
          disabled={step === 'perform' || step === 'scoring'}
          activeOpacity={0.8}
        >
          <X size={20} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.topTitle} numberOfLines={1}>
          {clip.title}
        </Text>
      </View>

      <View style={[styles.videoWrap, { height: videoHeight }, !showVideo && styles.hidden]}>
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
        {step === 'perform' && muted && (
          <View style={styles.micBadge}>
            <Mic size={16} color={COLORS.white} />
            <Text style={styles.micBadgeText}>{t('videoClipYourTurn')}</Text>
          </View>
        )}
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + SPACING.l }]}
        showsVerticalScrollIndicator={false}
      >
        {/* ---------- ۱) دیدن ---------- */}
        {step === 'watch' && (
          <>
            <View style={styles.subtitleBox}>
              {currentLine && subtitleMode !== 'off' ? (
                <>
                  <Text style={styles.subtitleSpeaker}>{currentLine.speaker}</Text>
                  <Text style={styles.subtitleText}>
                    {subtitleMode === 'en' ? currentLine.text : currentLine.translation_fa || currentLine.text}
                  </Text>
                </>
              ) : (
                <Text style={styles.subtitleMuted}>
                  {subtitleMode === 'off' ? t('videoClipSubtitlesOffHint') : '…'}
                </Text>
              )}
            </View>
            <View style={styles.segment}>
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
            {!!clip.description_fa && <Text style={styles.desc}>{clip.description_fa}</Text>}
            <Text style={styles.hint}>{t('videoClipWatchHint')}</Text>
            <View style={styles.row}>
              <TouchableOpacity style={[styles.secondaryBtn, styles.flex]} onPress={() => restartVideo(true)} activeOpacity={0.85}>
                <RotateCcw size={16} color={COLORS.text} />
                <Text style={styles.secondaryBtnText}>{t('videoClipReplay')}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.primaryBtn, styles.flex]} onPress={goAfterWatch} activeOpacity={0.85}>
                <Text style={styles.primaryBtnText}>
                  {t(clip.questions.length > 0 ? 'videoClipToQuiz' : 'videoClipToPick')}
                </Text>
              </TouchableOpacity>
            </View>
          </>
        )}

        {/* ---------- ۲) سؤال‌های فهم ---------- */}
        {step === 'quiz' && question && (
          <View style={styles.card}>
            <Text style={styles.cardLabel}>
              {t('videoClipQuestionN')
                .replace('{n}', String(qIndex + 1))
                .replace('{total}', String(clip.questions.length))}
            </Text>
            <Text style={styles.questionText}>{question.question_fa}</Text>
            {question.options.map((opt, i) => {
              const isAnswer = i === question.answer_index;
              const picked = chosen === i;
              return (
                <TouchableOpacity
                  key={i}
                  style={[
                    styles.option,
                    chosen !== null && isAnswer && styles.optionRight,
                    picked && !isAnswer && styles.optionWrong,
                  ]}
                  onPress={() => answer(i)}
                  disabled={chosen !== null}
                  activeOpacity={0.85}
                >
                  <Text style={styles.optionText}>{opt}</Text>
                  {chosen !== null && isAnswer && <CircleCheck size={18} color={COLORS.success} />}
                  {picked && !isAnswer && <CircleX size={18} color={COLORS.error} />}
                </TouchableOpacity>
              );
            })}
            {chosen !== null && (
              <TouchableOpacity style={styles.primaryBtn} onPress={nextQuestion} activeOpacity={0.85}>
                <Text style={styles.primaryBtnText}>{t('videoClipNext')}</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {step === 'quiz' && !question && (
          <View style={[styles.card, styles.centerCard]}>
            <Text style={styles.bigScore}>
              {correctCount} / {clip.questions.length}
            </Text>
            <Text style={styles.mutedText}>
              {t(correctCount === clip.questions.length ? 'videoClipQuizPerfect' : 'videoClipQuizDone')}
            </Text>
            <View style={styles.row}>
              <TouchableOpacity
                style={[styles.secondaryBtn, styles.flex]}
                onPress={() => {
                  setStep('watch');
                  restartVideo(true);
                }}
                activeOpacity={0.85}
              >
                <Text style={styles.secondaryBtnText}>{t('videoClipWatchAgain')}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.primaryBtn, styles.flex]} onPress={() => setStep('pick')} activeOpacity={0.85}>
                <Text style={styles.primaryBtnText}>{t('videoClipToPick')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* ---------- ۳) انتخاب شخصیت ---------- */}
        {step === 'pick' && (
          <View style={styles.card}>
            <Text style={styles.questionText}>{t('videoClipPickTitle')}</Text>
            <Text style={styles.mutedText}>{t('videoClipPickHint')}</Text>
            {speakers.map((sp) => (
              <TouchableOpacity
                key={sp.name}
                style={[styles.option, speaker === sp.name && styles.optionPicked]}
                onPress={() => setSpeaker(sp.name)}
                activeOpacity={0.85}
              >
                <Text style={styles.optionText}>{sp.name}</Text>
                <Text style={styles.mutedSmall}>{t('videoClipLinesCount').replace('{n}', String(sp.count))}</Text>
              </TouchableOpacity>
            ))}
            <View style={styles.switchRow}>
              <Text style={styles.switchLabel}>{t('videoClipShowText')}</Text>
              <Switch value={showText} onValueChange={setShowText} trackColor={{ true: COLORS.primary }} />
            </View>
            <Text style={styles.mutedSmall}>{t(showText ? 'videoClipShowTextOn' : 'videoClipShowTextOff')}</Text>
            <TouchableOpacity
              style={[styles.primaryBtn, !speaker && styles.disabled]}
              onPress={startPerform}
              disabled={!speaker}
              activeOpacity={0.85}
            >
              <Mic size={18} color={COLORS.white} />
              <Text style={styles.primaryBtnText}>{t('videoClipStartPerform')}</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ---------- ۴) اجرا ---------- */}
        {step === 'perform' && (
          <View style={[styles.subtitleBox, isMyTurn && styles.myTurnBox]}>
            {currentLine ? (
              isMyTurn ? (
                <>
                  <Text style={styles.myTurnLabel}>🎙 {t('videoClipYourTurn')}</Text>
                  <Text style={styles.myTurnText}>
                    {showText ? currentLine.text : currentLine.translation_fa || '…'}
                  </Text>
                </>
              ) : (
                <>
                  <Text style={styles.subtitleSpeaker}>{currentLine.speaker}</Text>
                  <Text style={styles.subtitleText}>{showText ? currentLine.text : '…'}</Text>
                </>
              )
            ) : (
              <Text style={styles.subtitleMuted}>{t('videoClipPerformHint')}</Text>
            )}
          </View>
        )}

        {/* ---------- ۵) نمره‌دهی و نتیجه ---------- */}
        {step === 'scoring' && (
          <View style={[styles.card, styles.centerCard]}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={styles.mutedText}>
              {t('videoClipScoring')
                .replace('{done}', String(scoringDone))
                .replace('{total}', String(myLineIdx.length))}
            </Text>
          </View>
        )}

        {step === 'result' && (
          <>
            <View style={[styles.card, styles.centerCard]}>
              <Text style={[styles.bigScore, { color: scoreColor(overallScore) }]}>{overallScore}</Text>
              <Text style={styles.mutedText}>
                {t('videoClipResultAs').replace('{speaker}', speaker ?? '')}
              </Text>
            </View>
            {myLineIdx.map((i) => {
              const line = lines[i];
              const r = scores[i];
              return (
                <View key={i} style={styles.card}>
                  <View style={styles.lineHeader}>
                    <Text style={styles.lineText}>{line.text}</Text>
                    {typeof r === 'object' ? (
                      <Text style={[styles.lineScore, { color: scoreColor(r.overall_score) }]}>
                        {Math.round(r.overall_score)}
                      </Text>
                    ) : (
                      <Text style={styles.mutedSmall}>
                        {t(r === 'missing' ? 'videoClipLineMissing' : 'videoClipLineError')}
                      </Text>
                    )}
                  </View>
                  {!!line.translation_fa && <Text style={styles.mutedSmall}>{line.translation_fa}</Text>}
                  {typeof r === 'object' && !!r.transcript && (
                    <Text style={styles.heardText}>
                      {t('videoClipHeard')}: {r.transcript}
                    </Text>
                  )}
                  <View style={styles.row}>
                    <TouchableOpacity style={styles.smallBtn} onPress={() => playOriginal(line)} activeOpacity={0.85}>
                      <Volume2 size={15} color={COLORS.primary} />
                      <Text style={styles.smallBtnText}>{t('videoClipPlayOriginal')}</Text>
                    </TouchableOpacity>
                    {!!recordings[i] && (
                      <TouchableOpacity style={styles.smallBtn} onPress={() => playMine(i)} activeOpacity={0.85}>
                        <Mic size={15} color={COLORS.primary} />
                        <Text style={styles.smallBtnText}>{t('videoClipPlayMine')}</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              );
            })}
            <View style={styles.row}>
              <TouchableOpacity style={[styles.primaryBtn, styles.flex]} onPress={startPerform} activeOpacity={0.85}>
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
                <Text style={styles.secondaryBtnText}>{t('videoClipOtherCharacter')}</Text>
              </TouchableOpacity>
            </View>
          </>
        )}

        {step === 'perform' && (
          <TouchableOpacity
            style={styles.secondaryBtn}
            onPress={() => {
              setPaused((p) => !p);
            }}
            activeOpacity={0.85}
          >
            {paused ? <Play size={16} color={COLORS.text} /> : <Pause size={16} color={COLORS.text} />}
            <Text style={styles.secondaryBtnText}>{t(paused ? 'videoClipResume' : 'videoClipPause')}</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  center: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.s,
  },
  hidden: {
    height: 0,
    overflow: 'hidden',
  },
  flex: {
    flex: 1,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.s,
    paddingHorizontal: SPACING.l,
    paddingVertical: SPACING.s,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topTitle: {
    flex: 1,
    fontFamily: FONT_FAMILY.bold,
    fontSize: 16,
    color: COLORS.text,
  },
  videoWrap: {
    backgroundColor: COLORS.black,
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
  micBadge: {
    position: 'absolute',
    top: SPACING.s,
    right: SPACING.s,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.error,
    borderRadius: BORDER_RADIUS.full,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  micBadgeText: {
    fontFamily: FONT_FAMILY.semiBold,
    fontSize: 12,
    color: COLORS.white,
  },
  content: {
    padding: SPACING.l,
    gap: SPACING.m,
  },
  subtitleBox: {
    minHeight: 84,
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.l,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.m,
    justifyContent: 'center',
    gap: 4,
  },
  myTurnBox: {
    borderColor: COLORS.error,
    backgroundColor: COLORS.errorLight,
  },
  subtitleSpeaker: {
    fontFamily: FONT_FAMILY.semiBold,
    fontSize: 12,
    color: COLORS.primary,
  },
  subtitleText: {
    ...TEXT_STYLES.bodyLg,
    color: COLORS.text,
  },
  subtitleMuted: {
    ...TEXT_STYLES.bodyMd,
    color: COLORS.muted,
    textAlign: 'center',
  },
  myTurnLabel: {
    fontFamily: FONT_FAMILY.bold,
    fontSize: 13,
    color: COLORS.error,
  },
  myTurnText: {
    fontFamily: FONT_FAMILY.bold,
    fontSize: 20,
    color: COLORS.text,
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
    paddingVertical: 8,
    borderRadius: BORDER_RADIUS.m,
  },
  segmentBtnActive: {
    backgroundColor: COLORS.surface,
    ...SHADOWS.level1,
  },
  segmentText: {
    ...TEXT_STYLES.labelMd,
    color: COLORS.textSecondary,
  },
  segmentTextActive: {
    color: COLORS.text,
    fontFamily: FONT_FAMILY.semiBold,
  },
  desc: {
    ...TEXT_STYLES.bodyMd,
    color: COLORS.textSecondary,
  },
  hint: {
    ...TEXT_STYLES.labelMd,
    color: COLORS.muted,
    textAlign: 'center',
  },
  row: {
    flexDirection: 'row',
    gap: SPACING.s,
    flexWrap: 'wrap',
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.l,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.m,
    gap: SPACING.s,
    ...SHADOWS.level1,
  },
  centerCard: {
    alignItems: 'center',
  },
  cardLabel: {
    ...TEXT_STYLES.labelSm,
    color: COLORS.muted,
  },
  questionText: {
    fontFamily: FONT_FAMILY.bold,
    fontSize: 16,
    color: COLORS.text,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: SPACING.s,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.m,
    padding: SPACING.m,
  },
  optionRight: {
    borderColor: COLORS.success,
    backgroundColor: COLORS.successLight,
  },
  optionWrong: {
    borderColor: COLORS.error,
    backgroundColor: COLORS.errorLight,
  },
  optionPicked: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primaryLight,
  },
  optionText: {
    ...TEXT_STYLES.bodyMd,
    color: COLORS.text,
    flex: 1,
  },
  bigScore: {
    fontFamily: FONT_FAMILY.bold,
    fontSize: 40,
    color: COLORS.text,
  },
  mutedText: {
    ...TEXT_STYLES.bodyMd,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  mutedSmall: {
    ...TEXT_STYLES.labelSm,
    color: COLORS.muted,
  },
  linkText: {
    ...TEXT_STYLES.labelMd,
    color: COLORS.primary,
    fontFamily: FONT_FAMILY.semiBold,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: SPACING.s,
  },
  switchLabel: {
    ...TEXT_STYLES.bodyMd,
    color: COLORS.text,
  },
  lineHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.s,
  },
  lineText: {
    ...TEXT_STYLES.bodyMd,
    color: COLORS.text,
    flex: 1,
    fontFamily: FONT_FAMILY.semiBold,
  },
  lineScore: {
    fontFamily: FONT_FAMILY.bold,
    fontSize: 20,
  },
  heardText: {
    ...TEXT_STYLES.labelMd,
    color: COLORS.textSecondary,
  },
  smallBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.full,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  smallBtnText: {
    ...TEXT_STYLES.labelMd,
    color: COLORS.primary,
  },
  primaryBtn: {
    flexDirection: 'row',
    gap: 8,
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.l,
    paddingVertical: SPACING.m,
    paddingHorizontal: SPACING.l,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBtnText: {
    color: COLORS.white,
    fontFamily: FONT_FAMILY.bold,
    fontSize: 15,
  },
  secondaryBtn: {
    flexDirection: 'row',
    gap: 8,
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.l,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingVertical: SPACING.m,
    paddingHorizontal: SPACING.l,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryBtnText: {
    color: COLORS.text,
    fontFamily: FONT_FAMILY.semiBold,
    fontSize: 15,
  },
  disabled: {
    opacity: 0.5,
  },
});
