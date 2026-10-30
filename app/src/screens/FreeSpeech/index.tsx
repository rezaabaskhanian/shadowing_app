import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Animated, Easing, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CircleCheck, CircleX, Clock, Lock, Mic, Square, TriangleAlert, X } from 'lucide-react-native';

import { COLORS, SPACING, BORDER_RADIUS } from '../../theme/colors';
import { FONT_FAMILY, TEXT_STYLES } from '../../theme/typography';
import { useLanguage } from '../../data/i18n';
import { AudioPlayer } from '../../components/AudioPlayer';
import { ensureMicPermission } from '../../services/micPermission';
import { transcribeFreeSpeech, getFreeSpeechFeedback, type FreeSpeechFeedback } from '../../api/freespeech';
import { ForbiddenError } from '../../api/client';
import { getAIUsageStatus } from '../../api/aiUsage';
import { useRecordingLimit } from '../../hooks/useRecordingLimit';
import { track } from '../../services/analytics';

type Phase = 'idle' | 'recording' | 'transcribing' | 'result' | 'error';
// بازخوردِ ربط/گرامر بعد از نمایشِ متن، جدا لود می‌شود. forbidden یعنی بدون
// اشتراک یا سقفِ روزانه تمام‌شده (نگاه کنید به src/api/client.ForbiddenError).
type FeedbackState = 'loading' | 'done' | 'error' | 'forbidden';

/** سقفِ طولِ ضبط: صدای بلندتر یعنی آپلود و رونویسیِ کندتر. */
const MAX_RECORD_SECONDS = 20;
/** نوارِ پیشرفتِ «در حال تحلیل» تا این مدت (میلی‌ثانیه) به ~۹۰٪ می‌رسد و همان‌جا می‌ماند تا جواب برسد. */
const ANALYZING_BAR_MS = 9000;

/**
 * پیامِ انتظار + نوارِ پیشرفتِ تقریبی. تحلیل واقعاً ۵ تا ۱۰ ثانیه طول می‌کشد؛
 * به‌جای اسپینرِ بی‌توضیح، به کاربر می‌گوییم چه خبر است و چقدر صبر کند.
 */
const AnalyzingBlock: React.FC<{ message: string }> = ({ message }) => {
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(progress, {
      toValue: 0.9,
      duration: ANALYZING_BAR_MS,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [progress]);

  const width = progress.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] });

  return (
    <View style={styles.centerBlock}>
      <ActivityIndicator size="large" color={COLORS.primary} />
      <Text style={styles.analyzingText}>{message}</Text>
      <View style={styles.analyzingTrack}>
        <Animated.View style={[styles.analyzingFill, { width }]} />
      </View>
    </View>
  );
};
type ActionCommand = 'none' | 'start_record' | 'stop_record';

/** آیکن/رنگِ بازخورد ربط‌داشتن پاسخ آزاد با موضوع — عیناً هم‌الگوی
 * PlacementTestResultScreen، همان کلیدهای ترجمه هم استفاده می‌شود. */
const relevanceMeta = (answered: string) => {
  if (answered === 'yes') {
    return { Icon: CircleCheck, color: COLORS.success, labelKey: 'placementRelevanceYes' };
  }
  if (answered === 'partial') {
    return { Icon: TriangleAlert, color: COLORS.warning, labelKey: 'placementRelevancePartial' };
  }
  return { Icon: CircleX, color: COLORS.muted, labelKey: 'placementRelevanceNo' };
};

/**
 * یک بار توضیحِ آزادِ کاربر بعد از تمام‌شدنِ همه‌ی دیالوگ‌های یک صحنه —
 * ورودی از دکمه‌ی «توضیح بده چی شد» در Alert تکمیل درس در SceneScreen.
 * برخلاف AIConversation تک‌نوبتی است: کاربر یک بار ضبط می‌کند، رونویسی +
 * بازخوردِ ربط + تصحیحِ گرامری برمی‌گردد، تمام — بدون پاسخِ AI، بدون ادامه.
 */
export const FreeSpeechScreen: React.FC = () => {
  const { t, language } = useLanguage();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const scenarioId: string | undefined = route.params?.scenarioId;
  const sceneTitle: string = route.params?.sceneTitle || '';
  const sceneLines: { speaker: string; text: string }[] = route.params?.sceneLines || [];

  const [phase, setPhase] = useState<Phase>('idle');
  const [micError, setMicError] = useState<string | null>(null);
  const [retryError, setRetryError] = useState<string | null>(null);
  const [transcript, setTranscript] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<FreeSpeechFeedback | null>(null);
  const [feedbackState, setFeedbackState] = useState<FeedbackState>('loading');
  const [hasActiveSubscription, setHasActiveSubscription] = useState(true);
  // توقفِ ضبط (دستی یا خودکار) درخواست شده ولی وضعیتِ «stopped» هنوز نرسیده.
  const stopRequestedRef = useRef(false);
  const [actionCommand, setActionCommand] = useState<ActionCommand>('none');
  const [actionNonce, setActionNonce] = useState(0);

  const bumpAndSet = (command: ActionCommand) => {
    setActionCommand(command);
    setActionNonce((n) => n + 1);
  };

  const handleStartRecord = useCallback(async () => {
    setMicError(null);
    setRetryError(null);
    const granted = await ensureMicPermission();
    if (!granted) {
      setMicError(t('placementMicDenied'));
      return;
    }
    bumpAndSet('start_record');
  }, [t]);

  const handleStopRecord = useCallback(() => {
    stopRequestedRef.current = true;
    bumpAndSet('stop_record');
  }, []);

  // در ثانیه‌ی ۲۰ ضبط خودکار بسته می‌شود (مگر کاربر همان لحظه خودش بسته باشد).
  const elapsedSeconds = useRecordingLimit(phase === 'recording', MAX_RECORD_SECONDS, () => {
    if (!stopRequestedRef.current) handleStopRecord();
  });

  const loadFeedback = useCallback(
    (text: string) => {
      if (!scenarioId) return;
      setFeedbackState('loading');
      getFreeSpeechFeedback(scenarioId, text)
        .then((fb) => {
          setFeedback(fb);
          setFeedbackState('done');
        })
        .catch(async (err) => {
          if (err instanceof ForbiddenError) {
            try {
              const status = await getAIUsageStatus();
              setHasActiveSubscription(status.has_active_subscription);
            } catch {
              // فرض محافظه‌کارانه: کاربر اشتراک ندارد.
            }
            setFeedbackState('forbidden');
            return;
          }
          setFeedbackState('error');
        });
    },
    [scenarioId]
  );

  const handleRecordingStatus = useCallback(
    (status: 'recording' | 'stopped' | 'error', filePath?: string, mimeType?: string) => {
      if (status === 'recording') {
        stopRequestedRef.current = false;
        setPhase('recording');
        return;
      }
      if (status === 'error') {
        setMicError(t('placementMicDenied'));
        setPhase('idle');
        setActionCommand('none');
        return;
      }
      if (status !== 'stopped' || !filePath || !scenarioId) return;
      setActionCommand('none');
      setPhase('transcribing');
      track('free_speech_submitted', scenarioId);
      // مرحله‌ی اول: فقط رونویسی. متن که رسید همان لحظه نشان داده می‌شود و
      // بازخوردِ ربط/گرامر جدا، بعدش می‌آید.
      transcribeFreeSpeech(filePath, mimeType)
        .then((text) => {
          setTranscript(text);
          setFeedback(null);
          setPhase('result');
          loadFeedback(text);
        })
        .catch((err) => {
          setRetryError(err instanceof Error ? err.message : t('freeSpeechRetryHint'));
          setPhase('error');
        });
    },
    [scenarioId, t, loadFeedback]
  );

  const handleDone = useCallback(() => {
    navigation.navigate('Home');
  }, [navigation]);

  const handleTryAgain = useCallback(() => {
    setTranscript(null);
    setFeedback(null);
    setRetryError(null);
    setPhase('idle');
  }, []);

  const rtl = language === 'fa';
  const row = rtl && styles.rowReverse;
  const align = rtl && styles.textRight;
  const timerSeconds = phase === 'recording' ? elapsedSeconds : MAX_RECORD_SECONDS;
  const timerLabel = `00:${String(timerSeconds).padStart(2, '0')}`;

  return (
    <View style={[styles.container, { paddingTop: insets.top + SPACING.s, paddingBottom: insets.bottom + SPACING.l }]}>
      <AudioPlayer
        uri={null}
        shouldPlay={false}
        actionCommand={actionCommand}
        actionNonce={actionNonce}
        recordingProfile="speech"
        onRecordingStatusUpdate={handleRecordingStatus}
      />

      <View style={[styles.topBar, row]}>
        <TouchableOpacity style={styles.closeBtn} onPress={() => navigation.goBack()} hitSlop={8}>
          <X size={20} color={COLORS.text} />
        </TouchableOpacity>
        <View style={[styles.timerPill, row, phase === 'recording' && styles.timerPillActive]}>
          <Text style={[styles.timerText, phase === 'recording' && styles.timerTextActive]}>{timerLabel}</Text>
          <Clock size={14} color={phase === 'recording' ? COLORS.error : COLORS.primary} />
        </View>
        <View style={styles.topBarSpacer} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{t('freeSpeechBadge')}</Text>
          </View>
          <Text style={styles.headerTitle}>{t('freeSpeechTitle')}</Text>
          {phase !== 'result' && <Text style={styles.promptText}>{t('freeSpeechPrompt')}</Text>}
        </View>

        {phase !== 'result' && (!!sceneTitle || sceneLines.length > 0) && (
          <View style={styles.situationCard}>
            {!!sceneTitle && (
              <View style={[styles.situationHead, row]}>
                <View style={styles.situationDot} />
                <Text style={[styles.situationTitle, align]} numberOfLines={2}>
                  {t('freeSpeechSituation')} {sceneTitle}
                </Text>
              </View>
            )}
            {sceneLines.length > 0 && (
              <View style={styles.recapCard}>
                <Text style={[styles.recapLabel, align]}>{t('freeSpeechRecapLabel')}</Text>
                {sceneLines.map((line, idx) => (
                  <Text key={idx} style={styles.recapLine}>
                    <Text style={styles.recapSpeaker}>{line.speaker}: </Text>
                    {line.text}
                  </Text>
                ))}
              </View>
            )}
          </View>
        )}

        {phase === 'transcribing' && <AnalyzingBlock message={t('freeSpeechAnalyzing')} />}

        {phase === 'error' && (
          <View style={styles.centerBlock}>
            <CircleX size={32} color={COLORS.error} />
            {!!retryError && <Text style={styles.errorText}>{retryError}</Text>}
            <TouchableOpacity style={styles.retryBtn} onPress={handleTryAgain} activeOpacity={0.85}>
              <Text style={styles.retryBtnText}>{t('freeSpeechTryAgain')}</Text>
            </TouchableOpacity>
          </View>
        )}

        {phase === 'result' && transcript !== null && (
          <View style={styles.resultCard}>
            <Text style={[styles.transcriptLabel, align]}>{t('freeSpeechYourAnswer')}</Text>
            <Text style={styles.transcriptText}>{transcript}</Text>

            {feedbackState === 'loading' && (
              <View style={styles.feedbackLoadingRow}>
                <ActivityIndicator size="small" color={COLORS.primary} />
                <Text style={styles.feedbackLoadingText}>{t('freeSpeechFeedbackLoading')}</Text>
              </View>
            )}

            {feedbackState === 'error' && (
              <View style={styles.feedbackLoadingRow}>
                <Text style={styles.feedbackErrorText}>{t('freeSpeechFeedbackError')}</Text>
                <TouchableOpacity onPress={() => loadFeedback(transcript)} activeOpacity={0.8}>
                  <Text style={styles.feedbackRetryText}>{t('freeSpeechFeedbackRetry')}</Text>
                </TouchableOpacity>
              </View>
            )}

            {feedbackState === 'forbidden' && (
              <View style={styles.feedbackLoadingRow}>
                <Lock size={16} color={COLORS.textSecondary} />
                <Text style={styles.feedbackErrorText}>
                  {t(hasActiveSubscription ? 'freeSpeechForbiddenQuota' : 'freeSpeechForbiddenNoSub')}
                </Text>
                <TouchableOpacity
                  onPress={() => navigation.navigate(hasActiveSubscription ? 'TokenTopup' : 'Paywall')}
                  activeOpacity={0.8}
                >
                  <Text style={styles.feedbackRetryText}>
                    {t(hasActiveSubscription ? 'aiConversationBuyTokensBtn' : 'aiConversationSubscribeBtn')}
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {feedbackState === 'done' && feedback && (
              <>
                {(() => {
                  const { Icon, color, labelKey } = relevanceMeta(feedback.relevance_answered);
                  return (
                    <View style={styles.relevanceRow}>
                      <Icon size={18} color={color} />
                      <Text style={[styles.relevanceLabel, { color }]}>{t(labelKey)}</Text>
                    </View>
                  );
                })()}
                {!!feedback.relevance_feedback && (
                  <Text style={styles.relevanceFeedback}>{feedback.relevance_feedback}</Text>
                )}

                {!!feedback.grammar_correction && (
                  <View style={styles.grammarTip}>
                    <Text style={styles.grammarTipLabel}>{t('grammarTipLabel')}</Text>
                    <Text style={styles.grammarTipText}>{feedback.grammar_correction}</Text>
                    {!!feedback.grammar_explanation && (
                      <Text style={styles.grammarTipExplanation}>{feedback.grammar_explanation}</Text>
                    )}
                  </View>
                )}
              </>
            )}
          </View>
        )}
      </ScrollView>

      {micError && <Text style={styles.errorText}>{micError}</Text>}

      {phase === 'result' ? (
        <TouchableOpacity style={styles.confirmBtn} onPress={handleDone} activeOpacity={0.85}>
          <Text style={styles.confirmBtnText}>{t('backToHome')}</Text>
        </TouchableOpacity>
      ) : phase !== 'transcribing' && phase !== 'error' ? (
        <View style={styles.recordArea}>
          <View style={styles.wave}>
            {WAVE_BARS.map((h, i) => (
              <View
                key={i}
                style={[styles.waveBar, { height: h }, phase === 'recording' && styles.waveBarActive]}
              />
            ))}
          </View>
          <View style={[styles.recordRing, phase === 'recording' && styles.recordRingActive]}>
            <TouchableOpacity
              style={[styles.recordBtn, phase === 'recording' && styles.recordBtnActive]}
              onPress={phase === 'recording' ? handleStopRecord : handleStartRecord}
              activeOpacity={0.85}
            >
              {phase === 'recording' ? (
                <Square size={26} color={COLORS.white} fill={COLORS.white} />
              ) : (
                <Mic size={30} color={COLORS.white} />
              )}
            </TouchableOpacity>
          </View>
          <Text style={styles.recordHint}>
            {phase === 'recording' ? t('placementStopRecordBtn') : t('freeSpeechRecordHint')}
          </Text>
          {phase === 'recording' ? (
            <Text style={styles.recordTimer}>
              {t('recordTimer')
                .replace('{elapsed}', String(elapsedSeconds))
                .replace('{max}', String(MAX_RECORD_SECONDS))}
            </Text>
          ) : (
            <Text style={styles.recordLimitHint}>
              {t('recordMaxDurationHint').replace('{max}', String(MAX_RECORD_SECONDS))}
            </Text>
          )}
        </View>
      ) : null}
    </View>
  );
};

/** ارتفاع میله‌های موجِ تزئینیِ بالای دکمه‌ی ضبط. */
const WAVE_BARS = [8, 14, 10, 20, 26, 18, 30, 18, 26, 20, 10, 14, 8];

const styles = StyleSheet.create({
  rowReverse: { flexDirection: 'row-reverse' },
  textRight: { textAlign: 'right' },
  container: {
    flex: 1,
    backgroundColor: COLORS.backgroundSoft,
    paddingHorizontal: SPACING.l,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: SPACING.s,
  },
  topBarSpacer: { width: 40 },
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
  timerPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    borderRadius: BORDER_RADIUS.full,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  timerPillActive: { borderColor: COLORS.error, backgroundColor: COLORS.errorLight },
  timerText: { color: COLORS.text, fontFamily: FONT_FAMILY.bold, fontSize: 14, letterSpacing: 0.5 },
  timerTextActive: { color: COLORS.error },
  header: {
    alignItems: 'center',
    marginBottom: SPACING.m,
  },
  badge: {
    backgroundColor: COLORS.primaryLight,
    borderRadius: BORDER_RADIUS.full,
    paddingHorizontal: 12,
    paddingVertical: 4,
    marginBottom: 8,
  },
  badgeText: { color: COLORS.primaryDark, fontFamily: FONT_FAMILY.semiBold, fontSize: 11 },
  headerTitle: {
    color: COLORS.text,
    fontFamily: FONT_FAMILY.bold,
    fontSize: 24,
    lineHeight: 34,
  },
  content: {
    flexGrow: 1,
    paddingVertical: SPACING.m,
  },
  promptText: {
    color: COLORS.textSecondary,
    fontFamily: FONT_FAMILY.regular,
    fontSize: 14,
    lineHeight: 23,
    textAlign: 'center',
    marginTop: 6,
    paddingHorizontal: SPACING.s,
  },
  situationCard: {
    backgroundColor: COLORS.white,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    padding: SPACING.m,
    gap: 12,
  },
  situationHead: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  situationDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.success },
  situationTitle: { flex: 1, color: COLORS.text, fontFamily: FONT_FAMILY.bold, fontSize: 14 },
  recapCard: {
    backgroundColor: COLORS.backgroundSoft,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    borderRadius: 16,
    padding: 12,
    gap: 4,
  },
  recapLabel: {
    fontFamily: FONT_FAMILY.semiBold,
    fontSize: 12,
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  recapSpeaker: {
    fontFamily: FONT_FAMILY.semiBold,
    color: COLORS.text,
  },
  recapLine: {
    ...TEXT_STYLES.labelMd,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
  centerBlock: {
    alignItems: 'center',
    gap: SPACING.s,
    paddingVertical: SPACING.l,
  },
  errorText: {
    ...TEXT_STYLES.labelMd,
    color: COLORS.error,
    textAlign: 'center',
    marginBottom: SPACING.s,
  },
  retryBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.l,
    paddingHorizontal: SPACING.l,
    paddingVertical: SPACING.s,
  },
  retryBtnText: {
    color: COLORS.white,
    fontFamily: FONT_FAMILY.bold,
    fontSize: 15,
  },
  resultCard: {
    backgroundColor: COLORS.white,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    padding: SPACING.l,
  },
  transcriptLabel: {
    ...TEXT_STYLES.labelSm,
    color: COLORS.muted,
  },
  transcriptText: {
    ...TEXT_STYLES.bodyMd,
    color: COLORS.text,
    marginTop: 4,
    marginBottom: SPACING.s,
  },
  relevanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: SPACING.xs,
  },
  relevanceLabel: {
    fontFamily: FONT_FAMILY.semiBold,
    fontSize: 13,
  },
  relevanceFeedback: {
    ...TEXT_STYLES.labelMd,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  grammarTip: {
    marginTop: SPACING.m,
    paddingTop: SPACING.s,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  grammarTipLabel: {
    fontFamily: FONT_FAMILY.semiBold,
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  grammarTipText: {
    ...TEXT_STYLES.labelMd,
    color: COLORS.text,
    marginTop: 2,
  },
  grammarTipExplanation: {
    ...TEXT_STYLES.labelSm,
    color: COLORS.muted,
    marginTop: 2,
  },
  recordArea: {
    alignItems: 'center',
    gap: SPACING.s,
    paddingTop: SPACING.s,
  },
  wave: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    height: 32,
    marginBottom: 4,
  },
  waveBar: {
    width: 3,
    borderRadius: 2,
    backgroundColor: COLORS.surfaceHighest,
  },
  waveBarActive: {
    backgroundColor: COLORS.primary,
  },
  recordRing: {
    width: 104,
    height: 104,
    borderRadius: 52,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recordRingActive: {
    backgroundColor: COLORS.errorLight,
  },
  recordBtn: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recordBtnActive: {
    backgroundColor: COLORS.error,
  },
  recordTimer: {
    ...TEXT_STYLES.labelMd,
    color: COLORS.error,
    fontFamily: FONT_FAMILY.semiBold,
  },
  recordLimitHint: {
    ...TEXT_STYLES.labelSm,
    color: COLORS.muted,
  },
  analyzingText: {
    ...TEXT_STYLES.bodyMd,
    color: COLORS.textSecondary,
    textAlign: 'center',
    paddingHorizontal: SPACING.m,
  },
  analyzingTrack: {
    alignSelf: 'stretch',
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.surfaceHigh,
    overflow: 'hidden',
    marginTop: SPACING.xs,
  },
  analyzingFill: {
    height: '100%',
    borderRadius: 3,
    backgroundColor: COLORS.primary,
  },
  feedbackLoadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.s,
    marginTop: SPACING.xs,
  },
  feedbackLoadingText: {
    ...TEXT_STYLES.labelMd,
    color: COLORS.textSecondary,
  },
  feedbackErrorText: {
    ...TEXT_STYLES.labelMd,
    color: COLORS.error,
  },
  feedbackRetryText: {
    ...TEXT_STYLES.labelMd,
    color: COLORS.primary,
    fontFamily: FONT_FAMILY.semiBold,
  },
  recordHint: {
    color: COLORS.text,
    fontFamily: FONT_FAMILY.semiBold,
    fontSize: 14,
  },
  confirmBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 16,
    paddingVertical: SPACING.m,
    paddingHorizontal: SPACING.l,
    alignItems: 'center',
  },
  confirmBtnText: {
    color: COLORS.white,
    fontFamily: FONT_FAMILY.bold,
    fontSize: 16,
  },
});
