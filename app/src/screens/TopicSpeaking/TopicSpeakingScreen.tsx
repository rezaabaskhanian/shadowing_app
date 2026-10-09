import React, { useCallback, useRef, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CircleCheck, CircleX, Lock, Mic, Square, TriangleAlert, X } from 'lucide-react-native';

import { COLORS, SPACING, BORDER_RADIUS } from '../../theme/colors';
import { FONT_FAMILY, TEXT_STYLES } from '../../theme/typography';
import { SHADOWS } from '../../theme/elevation';
import { useLanguage } from '../../data/i18n';
import { AudioPlayer } from '../../components/AudioPlayer';
import { ensureMicPermission } from '../../services/micPermission';
import { ForbiddenError } from '../../api/client';
import { getAIUsageStatus } from '../../api/aiUsage';
import { submitTopicSpeaking, type SpeakingTopic, type TopicSpeakingResult } from '../../api/topicSpeaking';
import { useRecordingLimit } from '../../hooks/useRecordingLimit';
import { track } from '../../services/analytics';

type Phase = 'idle' | 'recording' | 'analyzing' | 'result' | 'error' | 'locked';
type ActionCommand = 'none' | 'start_record' | 'stop_record';

/** کمتر از این صحبتی برای بررسی نیست — با minSpeakSeconds در بک‌اند یکی است. */
const MIN_SPEAK_SECONDS = 15;

const onTopicMeta = (value: string) => {
  if (value === 'yes') return { Icon: CircleCheck, color: COLORS.success, labelKey: 'placementRelevanceYes' };
  if (value === 'partial') return { Icon: TriangleAlert, color: COLORS.warning, labelKey: 'placementRelevancePartial' };
  return { Icon: CircleX, color: COLORS.muted, labelKey: 'placementRelevanceNo' };
};

const scoreColor = (score: number) => {
  if (score >= 75) return COLORS.success;
  if (score >= 50) return COLORS.warning;
  return COLORS.error;
};

/**
 * «صحبت درباره‌ی یک موضوع»: کاربر سؤال‌های راهنما و عبارت‌های پیشنهادی را
 * می‌بیند، تا سقف مدت موضوع (۱ تا ۲ دقیقه) صحبت می‌کند و بعد بازخورد کامل
 * می‌گیرد: امتیاز، ربط به موضوع، نقاط قوت، اشتباه‌ها با توضیح گرامری،
 * عبارت‌های طبیعی‌تر و نسخه‌ی بهترشده‌ی صحبتش.
 */
export const TopicSpeakingScreen: React.FC = () => {
  const { t } = useLanguage();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const topic: SpeakingTopic | undefined = route.params?.topic;
  const maxSeconds = topic?.duration_seconds ?? 60;

  const [phase, setPhase] = useState<Phase>('idle');
  const [micError, setMicError] = useState<string | null>(null);
  const [errorText, setErrorText] = useState<string | null>(null);
  const [result, setResult] = useState<TopicSpeakingResult | null>(null);
  const [hasActiveSubscription, setHasActiveSubscription] = useState(true);
  const [actionCommand, setActionCommand] = useState<ActionCommand>('none');
  const [actionNonce, setActionNonce] = useState(0);
  const stopRequestedRef = useRef(false);
  const startedAtRef = useRef(0);

  const bumpAndSet = (command: ActionCommand) => {
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
    bumpAndSet('start_record');
  }, [t]);

  const handleStopRecord = useCallback(() => {
    stopRequestedRef.current = true;
    bumpAndSet('stop_record');
  }, []);

  const elapsedSeconds = useRecordingLimit(phase === 'recording', maxSeconds, () => {
    if (!stopRequestedRef.current) handleStopRecord();
  });
  const canStop = elapsedSeconds >= MIN_SPEAK_SECONDS;

  const handleRecordingStatus = useCallback(
    (status: 'recording' | 'stopped' | 'error', filePath?: string, mimeType?: string) => {
      if (status === 'recording') {
        stopRequestedRef.current = false;
        startedAtRef.current = Date.now();
        setPhase('recording');
        return;
      }
      if (status === 'error') {
        setMicError(t('placementMicDenied'));
        setPhase('idle');
        setActionCommand('none');
        return;
      }
      if (status !== 'stopped' || !filePath || !topic) return;
      setActionCommand('none');
      setPhase('analyzing');
      const duration = Math.min(maxSeconds, (Date.now() - startedAtRef.current) / 1000);
      track('topic_speaking_submitted', topic.id);
      submitTopicSpeaking(topic.id, filePath, duration, mimeType)
        .then((res) => {
          setResult(res);
          setPhase('result');
        })
        .catch(async (err) => {
          if (err instanceof ForbiddenError) {
            try {
              const s = await getAIUsageStatus();
              setHasActiveSubscription(s.has_active_subscription);
            } catch {
              setHasActiveSubscription(false);
            }
            setPhase('locked');
            return;
          }
          setErrorText(err instanceof Error ? err.message : null);
          setPhase('error');
        });
    },
    [t, topic, maxSeconds]
  );

  const handleTryAgain = useCallback(() => {
    setResult(null);
    setErrorText(null);
    setPhase('idle');
  }, []);

  if (!topic) {
    return (
      <View style={[styles.container, styles.center, { paddingTop: insets.top }]}>
        <Text style={styles.mutedText}>{t('topicSpeakingLoadError')}</Text>
      </View>
    );
  }

  const meta = result ? onTopicMeta(result.on_topic) : null;

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

      <View style={styles.topRow}>
        <TouchableOpacity
          style={styles.closeBtn}
          onPress={() => navigation.goBack()}
          disabled={phase === 'recording' || phase === 'analyzing'}
          activeOpacity={0.8}
        >
          <X size={20} color={COLORS.text} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>{topic.title}</Text>
        {!!topic.prompt_fa && <Text style={styles.prompt}>{topic.prompt_fa}</Text>}

        {(phase === 'idle' || phase === 'recording') && (
          <>
            {topic.guide_questions.length > 0 && (
              <View style={styles.card}>
                <Text style={styles.cardLabel}>{t('topicSpeakingGuideTitle')}</Text>
                {topic.guide_questions.map((q, i) => (
                  <Text key={i} style={styles.listItem}>
                    • {q}
                  </Text>
                ))}
              </View>
            )}
            {topic.useful_phrases.length > 0 && (
              <View style={styles.card}>
                <Text style={styles.cardLabel}>{t('topicSpeakingPhrasesTitle')}</Text>
                <View style={styles.chips}>
                  {topic.useful_phrases.map((p, i) => (
                    <View key={i} style={styles.chip}>
                      <Text style={styles.chipText}>{p}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}
          </>
        )}

        {phase === 'analyzing' && (
          <View style={styles.centerBlock}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={styles.mutedText}>{t('topicSpeakingAnalyzing')}</Text>
          </View>
        )}

        {phase === 'error' && (
          <View style={styles.centerBlock}>
            <CircleX size={32} color={COLORS.error} />
            {!!errorText && <Text style={styles.errorText}>{errorText}</Text>}
          </View>
        )}

        {phase === 'locked' && (
          <View style={styles.centerBlock}>
            <Lock size={28} color={COLORS.textSecondary} />
            <Text style={styles.mutedText}>
              {t(hasActiveSubscription ? 'topicSpeakingLockedQuota' : 'topicSpeakingLockedNoSub')}
            </Text>
            <TouchableOpacity
              style={styles.primaryBtn}
              onPress={() => navigation.navigate(hasActiveSubscription ? 'TokenTopup' : 'Paywall')}
              activeOpacity={0.85}
            >
              <Text style={styles.primaryBtnText}>
                {t(hasActiveSubscription ? 'aiConversationBuyTokensBtn' : 'aiConversationSubscribeBtn')}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {phase === 'result' && result && meta && (
          <>
            <View style={[styles.card, styles.scoreCard]}>
              <View style={[styles.scoreCircle, { borderColor: scoreColor(result.score) }]}>
                <Text style={[styles.scoreValue, { color: scoreColor(result.score) }]}>{result.score}</Text>
                <Text style={styles.scoreLabel}>{t('topicSpeakingScore')}</Text>
              </View>
              <View style={styles.scoreBody}>
                <View style={styles.onTopicRow}>
                  <meta.Icon size={16} color={meta.color} />
                  <Text style={[styles.onTopicText, { color: meta.color }]}>{t(meta.labelKey)}</Text>
                </View>
                <Text style={styles.statsText}>
                  {t('topicSpeakingStats')
                    .replace('{words}', String(result.word_count))
                    .replace('{wpm}', String(result.words_per_minute))}
                </Text>
                {!!result.summary_fa && <Text style={styles.summary}>{result.summary_fa}</Text>}
              </View>
            </View>

            {result.strengths_fa.length > 0 && (
              <View style={styles.card}>
                <Text style={styles.cardLabel}>{t('topicSpeakingStrengths')}</Text>
                {result.strengths_fa.map((s, i) => (
                  <Text key={i} style={styles.listItem}>
                    ✓ {s}
                  </Text>
                ))}
              </View>
            )}

            <View style={styles.card}>
              <Text style={styles.cardLabel}>{t('topicSpeakingMistakes')}</Text>
              {result.mistakes.length === 0 ? (
                <Text style={styles.listItem}>{t('topicSpeakingNoMistakes')}</Text>
              ) : (
                result.mistakes.map((m, i) => (
                  <View key={i} style={[styles.fixItem, i > 0 && styles.fixDivider]}>
                    <Text style={styles.wrongText}>{m.original}</Text>
                    <Text style={styles.rightText}>{m.corrected}</Text>
                    {!!m.explanation_fa && <Text style={styles.explain}>{m.explanation_fa}</Text>}
                  </View>
                ))
              )}
            </View>

            {result.better_phrases.length > 0 && (
              <View style={styles.card}>
                <Text style={styles.cardLabel}>{t('topicSpeakingBetter')}</Text>
                {result.better_phrases.map((p, i) => (
                  <View key={i} style={[styles.fixItem, i > 0 && styles.fixDivider]}>
                    <Text style={styles.explain}>
                      {t('topicSpeakingInsteadOf')}: <Text style={styles.plainEn}>{p.instead_of}</Text>
                    </Text>
                    <Text style={styles.rightText}>
                      {t('topicSpeakingSay')}: {p.try}
                    </Text>
                    {!!p.note_fa && <Text style={styles.explain}>{p.note_fa}</Text>}
                  </View>
                ))}
              </View>
            )}

            {result.used_phrases.length > 0 && (
              <View style={styles.card}>
                <Text style={styles.cardLabel}>{t('topicSpeakingUsedPhrases')}</Text>
                <View style={styles.chips}>
                  {result.used_phrases.map((p, i) => (
                    <View key={i} style={[styles.chip, styles.chipDone]}>
                      <Text style={styles.chipText}>{p}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {!!result.improved_version && (
              <View style={styles.card}>
                <Text style={styles.cardLabel}>{t('topicSpeakingImproved')}</Text>
                <Text style={styles.paragraph}>{result.improved_version}</Text>
              </View>
            )}

            <View style={styles.card}>
              <Text style={styles.cardLabel}>{t('topicSpeakingYourTalk')}</Text>
              <Text style={[styles.paragraph, styles.mutedParagraph]}>{result.transcript}</Text>
            </View>
          </>
        )}
      </ScrollView>

      {micError && <Text style={styles.errorText}>{micError}</Text>}

      {(phase === 'idle' || phase === 'recording') && (
        <View style={styles.recordArea}>
          <TouchableOpacity
            style={[
              styles.recordBtn,
              phase === 'recording' && styles.recordBtnActive,
              phase === 'recording' && !canStop && styles.recordBtnWaiting,
            ]}
            onPress={phase === 'recording' ? handleStopRecord : handleStartRecord}
            disabled={phase === 'recording' && !canStop}
            activeOpacity={0.85}
          >
            {phase === 'recording' ? (
              <Square size={26} color={COLORS.white} fill={COLORS.white} />
            ) : (
              <Mic size={28} color={COLORS.white} />
            )}
          </TouchableOpacity>
          {phase === 'recording' ? (
            <>
              <Text style={styles.timer}>
                {t('recordTimer').replace('{elapsed}', String(elapsedSeconds)).replace('{max}', String(maxSeconds))}
              </Text>
              <Text style={styles.hint}>
                {canStop
                  ? t('topicSpeakingStopHint')
                  : t('topicSpeakingMinHint').replace('{min}', String(MIN_SPEAK_SECONDS))}
              </Text>
            </>
          ) : (
            <Text style={styles.hint}>{t('topicSpeakingStartHint')}</Text>
          )}
        </View>
      )}

      {(phase === 'result' || phase === 'error') && (
        <View style={styles.bottomRow}>
          <TouchableOpacity style={[styles.primaryBtn, styles.flex]} onPress={handleTryAgain} activeOpacity={0.85}>
            <Text style={styles.primaryBtnText}>{t('topicSpeakingTryAgain')}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.secondaryBtn, styles.flex]} onPress={() => navigation.goBack()} activeOpacity={0.85}>
            <Text style={styles.secondaryBtnText}>{t('topicSpeakingOtherTopics')}</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    paddingHorizontal: SPACING.l,
  },
  center: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  flex: {
    flex: 1,
  },
  topRow: {
    flexDirection: 'row',
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flexGrow: 1,
    paddingVertical: SPACING.m,
    gap: SPACING.m,
  },
  title: {
    ...TEXT_STYLES.headlineSm,
    color: COLORS.text,
    textAlign: 'center',
  },
  prompt: {
    ...TEXT_STYLES.bodyMd,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.l,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.m,
    gap: 6,
    ...SHADOWS.level1,
  },
  cardLabel: {
    fontFamily: FONT_FAMILY.semiBold,
    fontSize: 13,
    color: COLORS.textSecondary,
    marginBottom: 2,
  },
  listItem: {
    ...TEXT_STYLES.bodyMd,
    color: COLORS.text,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  chip: {
    backgroundColor: COLORS.primaryLight,
    borderRadius: BORDER_RADIUS.full,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  chipDone: {
    backgroundColor: COLORS.successLight,
  },
  chipText: {
    ...TEXT_STYLES.labelMd,
    color: COLORS.text,
  },
  centerBlock: {
    alignItems: 'center',
    gap: SPACING.s,
    paddingVertical: SPACING.l,
  },
  mutedText: {
    ...TEXT_STYLES.bodyMd,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  errorText: {
    ...TEXT_STYLES.labelMd,
    color: COLORS.error,
    textAlign: 'center',
    marginBottom: SPACING.s,
  },
  scoreCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.m,
  },
  scoreCircle: {
    width: 76,
    height: 76,
    borderRadius: 38,
    borderWidth: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreValue: {
    fontFamily: FONT_FAMILY.bold,
    fontSize: 24,
  },
  scoreLabel: {
    ...TEXT_STYLES.labelSm,
    color: COLORS.muted,
  },
  scoreBody: {
    flex: 1,
    gap: 4,
  },
  onTopicRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  onTopicText: {
    fontFamily: FONT_FAMILY.semiBold,
    fontSize: 13,
  },
  statsText: {
    ...TEXT_STYLES.labelSm,
    color: COLORS.muted,
  },
  summary: {
    ...TEXT_STYLES.labelMd,
    color: COLORS.text,
  },
  fixItem: {
    gap: 2,
    paddingVertical: 4,
  },
  fixDivider: {
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: SPACING.s,
  },
  wrongText: {
    ...TEXT_STYLES.bodyMd,
    color: COLORS.error,
    textDecorationLine: 'line-through',
  },
  rightText: {
    ...TEXT_STYLES.bodyMd,
    color: COLORS.success,
    fontFamily: FONT_FAMILY.semiBold,
  },
  plainEn: {
    color: COLORS.text,
  },
  explain: {
    ...TEXT_STYLES.labelMd,
    color: COLORS.textSecondary,
  },
  paragraph: {
    ...TEXT_STYLES.bodyMd,
    color: COLORS.text,
    lineHeight: 22,
  },
  mutedParagraph: {
    color: COLORS.textSecondary,
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
  recordBtnWaiting: {
    opacity: 0.6,
  },
  timer: {
    ...TEXT_STYLES.labelMd,
    color: COLORS.error,
    fontFamily: FONT_FAMILY.semiBold,
  },
  hint: {
    ...TEXT_STYLES.labelMd,
    color: COLORS.textSecondary,
  },
  bottomRow: {
    flexDirection: 'row',
    gap: SPACING.s,
    paddingTop: SPACING.s,
  },
  primaryBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.l,
    paddingVertical: SPACING.m,
    paddingHorizontal: SPACING.l,
    alignItems: 'center',
  },
  primaryBtnText: {
    color: COLORS.white,
    fontFamily: FONT_FAMILY.bold,
    fontSize: 15,
  },
  secondaryBtn: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.l,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingVertical: SPACING.m,
    paddingHorizontal: SPACING.l,
    alignItems: 'center',
  },
  secondaryBtnText: {
    color: COLORS.text,
    fontFamily: FONT_FAMILY.semiBold,
    fontSize: 15,
  },
});
