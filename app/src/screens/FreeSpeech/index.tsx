import React, { useCallback, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CircleCheck, CircleX, Mic, Square, TriangleAlert } from 'lucide-react-native';

import { COLORS, SPACING, BORDER_RADIUS } from '../../theme/colors';
import { FONT_FAMILY, TEXT_STYLES } from '../../theme/typography';
import { SHADOWS } from '../../theme/elevation';
import { useLanguage } from '../../data/i18n';
import { AudioPlayer } from '../../components/AudioPlayer';
import { ensureMicPermission } from '../../services/micPermission';
import { analyzeFreeSpeech, type AnalyzeFreeSpeechResult } from '../../api/freespeech';

type Phase = 'idle' | 'recording' | 'analyzing' | 'result' | 'error';
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
  const { t } = useLanguage();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const scenarioId: string | undefined = route.params?.scenarioId;
  const sceneTitle: string = route.params?.sceneTitle || '';
  const sceneLines: { speaker: string; text: string }[] = route.params?.sceneLines || [];

  const [phase, setPhase] = useState<Phase>('idle');
  const [micError, setMicError] = useState<string | null>(null);
  const [retryError, setRetryError] = useState<string | null>(null);
  const [result, setResult] = useState<AnalyzeFreeSpeechResult | null>(null);
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
    bumpAndSet('stop_record');
  }, []);

  const handleRecordingStatus = useCallback(
    (status: 'recording' | 'stopped' | 'error', filePath?: string, mimeType?: string) => {
      if (status === 'recording') {
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
      setPhase('analyzing');
      analyzeFreeSpeech(scenarioId, filePath, mimeType)
        .then((res) => {
          setResult(res);
          setPhase('result');
        })
        .catch((err) => {
          setRetryError(err instanceof Error ? err.message : t('freeSpeechRetryHint'));
          setPhase('error');
        });
    },
    [scenarioId, t]
  );

  const handleDone = useCallback(() => {
    navigation.navigate('Home');
  }, [navigation]);

  const handleTryAgain = useCallback(() => {
    setResult(null);
    setRetryError(null);
    setPhase('idle');
  }, []);

  return (
    <View style={[styles.container, { paddingTop: insets.top + SPACING.s, paddingBottom: insets.bottom + SPACING.l }]}>
      <AudioPlayer
        uri={null}
        shouldPlay={false}
        actionCommand={actionCommand}
        actionNonce={actionNonce}
        onRecordingStatusUpdate={handleRecordingStatus}
      />

      <View style={styles.header}>
        <Text style={styles.headerTitle}>{t('freeSpeechTitle')}</Text>
        {!!sceneTitle && <Text style={styles.headerSub}>{sceneTitle}</Text>}
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {phase !== 'result' && (
          <>
            <Text style={styles.promptText}>{t('freeSpeechPrompt')}</Text>
            {sceneLines.length > 0 && (
              <View style={styles.recapCard}>
                <Text style={styles.recapLabel}>{t('freeSpeechRecapLabel')}</Text>
                {sceneLines.map((line, idx) => (
                  <Text key={idx} style={styles.recapLine}>
                    <Text style={styles.recapSpeaker}>{line.speaker}: </Text>
                    {line.text}
                  </Text>
                ))}
              </View>
            )}
          </>
        )}

        {phase === 'analyzing' && (
          <View style={styles.centerBlock}>
            <ActivityIndicator size="large" color={COLORS.primary} />
          </View>
        )}

        {phase === 'error' && (
          <View style={styles.centerBlock}>
            <CircleX size={32} color={COLORS.error} />
            {!!retryError && <Text style={styles.errorText}>{retryError}</Text>}
            <TouchableOpacity style={styles.retryBtn} onPress={handleTryAgain} activeOpacity={0.85}>
              <Text style={styles.retryBtnText}>{t('freeSpeechTryAgain')}</Text>
            </TouchableOpacity>
          </View>
        )}

        {phase === 'result' && result && (
          <View style={styles.resultCard}>
            <Text style={styles.transcriptLabel}>{t('freeSpeechYourAnswer')}</Text>
            <Text style={styles.transcriptText}>{result.transcript}</Text>

            {(() => {
              const { Icon, color, labelKey } = relevanceMeta(result.relevance_answered);
              return (
                <View style={styles.relevanceRow}>
                  <Icon size={18} color={color} />
                  <Text style={[styles.relevanceLabel, { color }]}>{t(labelKey)}</Text>
                </View>
              );
            })()}
            {!!result.relevance_feedback && (
              <Text style={styles.relevanceFeedback}>{result.relevance_feedback}</Text>
            )}

            {!!result.grammar_correction && (
              <View style={styles.grammarTip}>
                <Text style={styles.grammarTipLabel}>{t('grammarTipLabel')}</Text>
                <Text style={styles.grammarTipText}>{result.grammar_correction}</Text>
                {!!result.grammar_explanation && (
                  <Text style={styles.grammarTipExplanation}>{result.grammar_explanation}</Text>
                )}
              </View>
            )}
          </View>
        )}
      </ScrollView>

      {micError && <Text style={styles.errorText}>{micError}</Text>}

      {phase === 'result' ? (
        <TouchableOpacity style={styles.confirmBtn} onPress={handleDone} activeOpacity={0.85}>
          <Text style={styles.confirmBtnText}>{t('backToHome')}</Text>
        </TouchableOpacity>
      ) : phase !== 'analyzing' && phase !== 'error' ? (
        <View style={styles.recordArea}>
          <TouchableOpacity
            style={[styles.recordBtn, phase === 'recording' && styles.recordBtnActive]}
            onPress={phase === 'recording' ? handleStopRecord : handleStartRecord}
            activeOpacity={0.85}
          >
            {phase === 'recording' ? (
              <Square size={26} color={COLORS.white} fill={COLORS.white} />
            ) : (
              <Mic size={28} color={COLORS.white} />
            )}
          </TouchableOpacity>
          <Text style={styles.recordHint}>
            {phase === 'recording' ? t('placementStopRecordBtn') : t('freeSpeechRecordHint')}
          </Text>
        </View>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    paddingHorizontal: SPACING.l,
  },
  header: {
    alignItems: 'center',
    marginBottom: SPACING.s,
  },
  headerTitle: {
    ...TEXT_STYLES.headlineSm,
    color: COLORS.text,
  },
  headerSub: {
    ...TEXT_STYLES.bodyMd,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  content: {
    flexGrow: 1,
    paddingVertical: SPACING.m,
  },
  promptText: {
    ...TEXT_STYLES.bodyLg,
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: SPACING.l,
  },
  recapCard: {
    backgroundColor: COLORS.surfaceLight,
    borderRadius: BORDER_RADIUS.l,
    padding: SPACING.m,
    marginBottom: SPACING.l,
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
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.l,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.l,
    ...SHADOWS.level1,
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
  recordBtn: {
    width: 72,
    height: 72,
    borderRadius: 36,
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
  confirmBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.l,
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
