import React, { useCallback, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Mic, RotateCcw, Square, Volume2, CircleX } from 'lucide-react-native';

import { COLORS, SPACING, BORDER_RADIUS } from '../../theme/colors';
import { FONT_FAMILY, TEXT_STYLES } from '../../theme/typography';
import { SHADOWS } from '../../theme/elevation';
import { useLanguage } from '../../data/i18n';
import { AudioPlayer } from '../../components/AudioPlayer';
import { ensureMicPermission } from '../../services/micPermission';
import { absUrl } from '../../api/config';
import {
  submitAssessment,
  type AssessmentItem,
  type SubmitAssessmentItem,
  type SubmitAssessmentResult,
} from '../../api/assessment';

interface PlacementTestRecordScreenProps {
  items: AssessmentItem[];
  onSubmitted: (result: SubmitAssessmentResult) => void;
}

type ItemPhase = 'idle' | 'recording' | 'recorded';
type SubmitPhase = 'recording' | 'submitting' | 'submit_error';
type PlaybackState = 'idle' | 'loading' | 'playing';

/**
 * قدم به قدمِ سه آیتم تست: برای آیتم Shadow، صدای مرجع را پخش می‌کند و بعد
 * ضبط می‌گیرد؛ برای دو آیتم Free Speech فقط متن پرامپت و ضبط. بعد از سومین
 * ضبط، هر سه را یک‌جا با submitAssessment می‌فرستد.
 */
export const PlacementTestRecordScreen: React.FC<PlacementTestRecordScreenProps> = ({
  items,
  onSubmitted,
}) => {
  const { t } = useLanguage();
  const insets = useSafeAreaInsets();

  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<SubmitAssessmentItem[]>([]);

  const [itemPhase, setItemPhase] = useState<ItemPhase>('idle');
  const [recordedPath, setRecordedPath] = useState<string | null>(null);
  const [recordedMime, setRecordedMime] = useState<string | undefined>(undefined);
  const [recordedDuration, setRecordedDuration] = useState(0);
  const [micError, setMicError] = useState<string | null>(null);
  const [playbackState, setPlaybackState] = useState<PlaybackState>('idle');

  const [actionCommand, setActionCommand] = useState<
    'none' | 'start_record' | 'stop_record' | 'play_recording' | 'play_original' | 'resume'
  >('none');
  const [actionNonce, setActionNonce] = useState(0);

  const [submitPhase, setSubmitPhase] = useState<SubmitPhase>('recording');
  const [finalAnswers, setFinalAnswers] = useState<SubmitAssessmentItem[] | null>(null);

  const recordStartedAtRef = useRef<number>(0);

  const currentItem = items[currentIndex];
  const referenceUri = currentItem.kind === 'shadow' ? absUrl(currentItem.audio_url) : null;

  const bumpAndSet = (command: typeof actionCommand) => {
    setActionCommand(command);
    setActionNonce((n) => n + 1);
  };

  const handleStartRecord = useCallback(async () => {
    setMicError(null);
    const granted = await ensureMicPermission();
    if (!granted) {
      setMicError(t('placementMicDenied'));
      return;
    }
    setRecordedPath(null);
    setRecordedMime(undefined);
    setRecordedDuration(0);
    bumpAndSet('start_record');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [t]);

  const handleStopRecord = useCallback(() => {
    bumpAndSet('stop_record');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handlePlayReference = useCallback(() => {
    bumpAndSet('play_original');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handlePlayRecording = useCallback(() => {
    bumpAndSet('play_recording');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handlePlaybackStatus = useCallback(
    (status: 'loading' | 'playing' | 'paused' | 'finished' | 'error' | 'no_audio') => {
      if (status === 'playing') setPlaybackState('playing');
      else if (status === 'loading') setPlaybackState('loading');
      else setPlaybackState('idle');
    },
    []
  );

  const handleRecordingStatus = useCallback(
    (status: 'recording' | 'stopped' | 'error', filePath?: string, mimeType?: string) => {
      if (status === 'recording') {
        recordStartedAtRef.current = Date.now();
        setItemPhase('recording');
        return;
      }
      if (status === 'error') {
        setMicError(t('placementMicDenied'));
        setItemPhase('idle');
        setActionCommand('none');
        return;
      }
      if (status !== 'stopped' || !filePath) return;

      const elapsedSeconds = recordStartedAtRef.current
        ? (Date.now() - recordStartedAtRef.current) / 1000
        : 0;
      const duration = Math.max(1, Math.round(elapsedSeconds || 1));

      setRecordedPath(filePath);
      setRecordedMime(mimeType);
      setRecordedDuration(duration);
      setItemPhase('recorded');
      setActionCommand('none');
    },
    [t]
  );

  const submit = useCallback(async (allAnswers: SubmitAssessmentItem[]) => {
    setFinalAnswers(allAnswers);
    setSubmitPhase('submitting');
    try {
      const result = await submitAssessment(allAnswers);
      onSubmitted(result);
    } catch {
      setSubmitPhase('submit_error');
    }
  }, [onSubmitted]);

  const handleConfirm = useCallback(() => {
    if (!recordedPath) return;
    const entry: SubmitAssessmentItem = {
      itemId: currentItem.id,
      filePath: recordedPath,
      mimeType: recordedMime,
      duration: recordedDuration,
    };
    const nextAnswers = [...answers, entry];
    setAnswers(nextAnswers);

    if (currentIndex + 1 < items.length) {
      setCurrentIndex((i) => i + 1);
      setItemPhase('idle');
      setRecordedPath(null);
      setRecordedMime(undefined);
      setRecordedDuration(0);
      setMicError(null);
      setActionCommand('none');
    } else {
      submit(nextAnswers);
    }
  }, [answers, currentIndex, currentItem, items.length, recordedDuration, recordedMime, recordedPath, submit]);

  const handleRetry = useCallback(() => {
    if (finalAnswers) submit(finalAnswers);
  }, [finalAnswers, submit]);

  return (
    <View
      style={[
        styles.container,
        { paddingTop: insets.top + SPACING.l, paddingBottom: insets.bottom + SPACING.l },
      ]}
    >
      <AudioPlayer
        uri={referenceUri}
        shouldPlay={false}
        actionCommand={actionCommand}
        actionNonce={actionNonce}
        loadedRecordingPath={recordedPath}
        onPlaybackStatusUpdate={handlePlaybackStatus}
        onRecordingStatusUpdate={handleRecordingStatus}
      />

      {submitPhase === 'submitting' && (
        <View style={styles.centerBox}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.centerText}>{t('placementSubmitting')}</Text>
        </View>
      )}

      {submitPhase === 'submit_error' && (
        <View style={styles.centerBox}>
          <CircleX size={40} color={COLORS.error} />
          <Text style={styles.centerText}>{t('placementSubmitFailed')}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={handleRetry} activeOpacity={0.85}>
            <Text style={styles.retryBtnText}>{t('placementRetryBtn')}</Text>
          </TouchableOpacity>
        </View>
      )}

      {submitPhase === 'recording' && (
        <>
          <View style={styles.progressRow}>
            <Text style={styles.progressText}>
              {t('placementItemProgress')
                .replace('{current}', String(currentIndex + 1))
                .replace('{total}', String(items.length))}
            </Text>
            <View style={styles.progressDots}>
              {items.map((_, i) => (
                <View key={i} style={[styles.dot, i <= currentIndex && styles.dotActive]} />
              ))}
            </View>
          </View>

          <View style={styles.promptCard}>
            <Text style={styles.kicker}>
              {currentItem.kind === 'shadow'
                ? t('placementShadowKicker')
                : t('placementFreeSpeechKicker')}
            </Text>
            <Text style={styles.promptText}>{currentItem.prompt_text}</Text>

            {currentItem.kind === 'shadow' && (
              <TouchableOpacity
                style={styles.playRefBtn}
                onPress={handlePlayReference}
                activeOpacity={0.8}
                disabled={playbackState === 'loading'}
              >
                <Volume2 size={18} color={COLORS.primary} />
                <Text style={styles.playRefBtnText}>
                  {playbackState === 'playing'
                    ? t('placementRecordingLabel')
                    : t('placementPlayReference')}
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {micError && <Text style={styles.errorText}>{micError}</Text>}

          <View style={styles.recordArea}>
            {itemPhase !== 'recorded' && (
              <TouchableOpacity
                style={[styles.recordBtn, itemPhase === 'recording' && styles.recordBtnActive]}
                onPress={itemPhase === 'recording' ? handleStopRecord : handleStartRecord}
                activeOpacity={0.85}
              >
                {itemPhase === 'recording' ? (
                  <Square size={26} color={COLORS.white} fill={COLORS.white} />
                ) : (
                  <Mic size={28} color={COLORS.white} />
                )}
              </TouchableOpacity>
            )}

            <Text style={styles.recordHint}>
              {itemPhase === 'recording'
                ? t('placementStopRecordBtn')
                : itemPhase === 'idle'
                ? t('placementStartRecordBtn')
                : ''}
            </Text>

            {itemPhase === 'recorded' && (
              <View style={styles.recordedActions}>
                <TouchableOpacity
                  style={styles.secondaryBtn}
                  onPress={handlePlayRecording}
                  activeOpacity={0.8}
                >
                  <Volume2 size={16} color={COLORS.primary} />
                  <Text style={styles.secondaryBtnText}>{t('placementPlaybackBtn')}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.secondaryBtn}
                  onPress={handleStartRecord}
                  activeOpacity={0.8}
                >
                  <RotateCcw size={16} color={COLORS.textSecondary} />
                  <Text style={[styles.secondaryBtnText, { color: COLORS.textSecondary }]}>
                    {t('placementRerecordBtn')}
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          <View style={styles.footer}>
            <TouchableOpacity
              style={[styles.confirmBtn, !recordedPath && styles.confirmBtnDisabled]}
              onPress={handleConfirm}
              disabled={!recordedPath}
              activeOpacity={0.85}
            >
              <Text style={styles.confirmBtnText}>
                {currentIndex + 1 < items.length
                  ? t('placementConfirmNextBtn')
                  : t('placementConfirmFinishBtn')}
              </Text>
            </TouchableOpacity>
          </View>
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    paddingHorizontal: SPACING.l,
    justifyContent: 'space-between',
  },
  centerBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.m,
  },
  centerText: {
    ...TEXT_STYLES.bodyMd,
    color: COLORS.textSecondary,
    textAlign: 'center',
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
  progressRow: {
    alignItems: 'center',
    gap: SPACING.s,
  },
  progressText: {
    ...TEXT_STYLES.labelMd,
    color: COLORS.textSecondary,
  },
  progressDots: {
    flexDirection: 'row',
    gap: SPACING.xs,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.border,
  },
  dotActive: {
    backgroundColor: COLORS.primary,
  },
  promptCard: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.l,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.l,
    marginTop: SPACING.l,
    alignItems: 'center',
    ...SHADOWS.level1,
  },
  kicker: {
    ...TEXT_STYLES.labelSm,
    color: COLORS.primary,
    marginBottom: SPACING.s,
    textTransform: 'uppercase',
  },
  promptText: {
    ...TEXT_STYLES.headlineSm,
    color: COLORS.text,
    textAlign: 'center',
  },
  playRefBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    marginTop: SPACING.m,
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: SPACING.m,
    paddingVertical: SPACING.s,
    borderRadius: BORDER_RADIUS.full,
  },
  playRefBtnText: {
    color: COLORS.primary,
    fontFamily: FONT_FAMILY.semiBold,
    fontSize: 13,
  },
  errorText: {
    ...TEXT_STYLES.labelMd,
    color: COLORS.error,
    textAlign: 'center',
    marginTop: SPACING.m,
  },
  recordArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.m,
  },
  recordBtn: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.level2,
  },
  recordBtnActive: {
    backgroundColor: COLORS.error,
  },
  recordHint: {
    ...TEXT_STYLES.labelMd,
    color: COLORS.textSecondary,
  },
  recordedActions: {
    flexDirection: 'row',
    gap: SPACING.m,
    marginTop: SPACING.s,
  },
  secondaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: SPACING.m,
    paddingVertical: SPACING.s,
    borderRadius: BORDER_RADIUS.full,
  },
  secondaryBtnText: {
    color: COLORS.primary,
    fontFamily: FONT_FAMILY.semiBold,
    fontSize: 13,
  },
  footer: {
    gap: SPACING.s,
  },
  confirmBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.l,
    paddingVertical: SPACING.m,
    alignItems: 'center',
  },
  confirmBtnDisabled: {
    backgroundColor: COLORS.border,
  },
  confirmBtnText: {
    color: COLORS.white,
    fontFamily: FONT_FAMILY.bold,
    fontSize: 16,
  },
});
