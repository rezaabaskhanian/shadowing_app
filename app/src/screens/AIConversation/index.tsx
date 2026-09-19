import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CircleX, Lightbulb, Mic, PartyPopper, Square, Volume2, X } from 'lucide-react-native';

import { COLORS, SPACING, BORDER_RADIUS, hexToRgba } from '../../theme/colors';
import { FONT_FAMILY, TEXT_STYLES } from '../../theme/typography';
import { SHADOWS } from '../../theme/elevation';
import { useLanguage } from '../../data/i18n';
import { AudioPlayer } from '../../components/AudioPlayer';
import { ensureMicPermission } from '../../services/micPermission';
import { absUrl } from '../../api/config';
import {
  startConversation,
  sendConversationTurn,
  getConversationSuggestions,
  getSuggestionAudio,
  type ConversationRole,
  type ConversationSuggestion,
} from '../../api/conversation';

interface Message {
  role: ConversationRole;
  text: string;
  audioUrl?: string;
  grammarCorrection?: string;
  grammarExplanation?: string;
}

interface HintState {
  hintId: string;
  suggestions: ConversationSuggestion[];
}

type LoadPhase = 'loading' | 'ready' | 'load_error';
type RecordPhase = 'idle' | 'recording' | 'sending';
type ActionCommand = 'none' | 'start_record' | 'stop_record' | 'play_original';

/**
 * گفتگوی آزادِ صوتی با AI، بعد از تمام‌شدنِ همه‌ی دیالوگ‌های یک صحنه —
 * ورودی از دکمه‌ی چهارمِ Alert تکمیل درس در SceneScreen (scenarioId به‌عنوان
 * پارامتر مسیر). هر نوبت: کاربر ضبط می‌کند → رونویسی+پاسخ AI برمی‌گردد →
 * صدای AI (اگر ElevenLabs تنظیم شده باشد) پخش می‌شود. حداکثر ۶ تا ۸ نوبت.
 *
 * دکمه‌ی «پیشنهاد جواب»: وقتی کاربر نمی‌داند به آخرین پیامِ AI چه بگوید،
 * ۲ جمله‌ی انگلیسی + ترجمه‌ی فارسی می‌گیرد و می‌تواند صدای هر کدام را
 * بشنود و تکرار کند (سقفِ تعدادش سمتِ سرور اعمال می‌شود). پیشنهاد فقط برای
 * نوبتِ فعلی معتبر است و با رسیدنِ پاسخِ بعدیِ AI پاک می‌شود.
 */
export const AIConversationScreen: React.FC = () => {
  const { t } = useLanguage();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const scenarioId: string | undefined = route.params?.scenarioId;

  const scrollRef = useRef<ScrollView>(null);
  const recordStartedAtRef = useRef<number>(0);
  // شناسه‌ی پیشنهادِ فعلی؛ تا اگر صدای یک جمله بعد از رفتن به نوبتِ بعد
  // رسید، وسط ضبط/پاسخِ جدید پخش نشود.
  const activeHintIdRef = useRef<string | null>(null);

  const [loadPhase, setLoadPhase] = useState<LoadPhase>('loading');
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [sceneTitle, setSceneTitle] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [turnNumber, setTurnNumber] = useState(0);
  const [maxUserTurns, setMaxUserTurns] = useState(8);
  const [isEnded, setIsEnded] = useState(false);
  const [maxHints, setMaxHints] = useState(3);
  const [hintsUsed, setHintsUsed] = useState(0);
  const [hint, setHint] = useState<HintState | null>(null);
  const [hintOpen, setHintOpen] = useState(false);
  const [hintLoading, setHintLoading] = useState(false);
  const [hintError, setHintError] = useState<string | null>(null);
  const [audioLoadingIndex, setAudioLoadingIndex] = useState<number | null>(null);

  const [recordPhase, setRecordPhase] = useState<RecordPhase>('idle');
  const [micError, setMicError] = useState<string | null>(null);
  const [retryError, setRetryError] = useState<string | null>(null);

  const [activeAudioUri, setActiveAudioUri] = useState<string | null>(null);
  const [actionCommand, setActionCommand] = useState<ActionCommand>('none');
  const [actionNonce, setActionNonce] = useState(0);

  const bumpAndSet = (command: ActionCommand) => {
    setActionCommand(command);
    setActionNonce((n) => n + 1);
  };

  const playAudio = useCallback((url?: string) => {
    if (!url) return;
    setActiveAudioUri(absUrl(url));
    bumpAndSet('play_original');
  }, []);

  useEffect(() => {
    if (!scenarioId) {
      setLoadPhase('load_error');
      return;
    }
    let active = true;
    startConversation(scenarioId)
      .then((res) => {
        if (!active) return;
        setConversationId(res.conversation_id);
        setSceneTitle(res.scene_title);
        setMaxUserTurns(res.max_user_turns);
        if (res.max_hints) setMaxHints(res.max_hints);
        setMessages([
          { role: res.opening_turn.role, text: res.opening_turn.text, audioUrl: res.opening_turn.audio_url },
        ]);
        setLoadPhase('ready');
        playAudio(res.opening_turn.audio_url);
      })
      .catch(() => {
        if (active) setLoadPhase('load_error');
      });
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scenarioId]);

  useEffect(() => {
    scrollRef.current?.scrollToEnd({ animated: true });
  }, [messages, hintOpen]);

  const sendTurn = useCallback(
    async (filePath: string, mimeType?: string) => {
      if (!conversationId) return;
      setRetryError(null);
      setRecordPhase('sending');
      try {
        const result = await sendConversationTurn(conversationId, filePath, mimeType);
        setMessages((prev) => [
          ...prev,
          {
            role: 'user',
            text: result.user_transcript,
            grammarCorrection: result.user_grammar_correction,
            grammarExplanation: result.user_grammar_explanation,
          },
          { role: 'assistant', text: result.assistant_text, audioUrl: result.assistant_audio_url },
        ]);
        setTurnNumber(result.turn_number);
        setIsEnded(result.is_ended);
        // پیشنهادِ قبلی برای پیامِ قبلیِ AI بود؛ برای نوبتِ جدید باید دوباره بخواهد.
        activeHintIdRef.current = null;
        setHint(null);
        setHintOpen(false);
        setHintError(null);
        playAudio(result.assistant_audio_url);
      } catch (err) {
        setRetryError(err instanceof Error ? err.message : t('aiConversationRetryHint'));
      } finally {
        setRecordPhase('idle');
      }
    },
    [conversationId, playAudio, t]
  );

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
        recordStartedAtRef.current = Date.now();
        setRecordPhase('recording');
        return;
      }
      if (status === 'error') {
        setMicError(t('placementMicDenied'));
        setRecordPhase('idle');
        setActionCommand('none');
        return;
      }
      if (status !== 'stopped' || !filePath) return;
      setActionCommand('none');
      sendTurn(filePath, mimeType);
    },
    [sendTurn, t]
  );

  const handleHint = useCallback(async () => {
    // پیشنهادِ همین نوبت قبلاً گرفته شده (فقط بسته شده): بازکردنِ دوباره
    // بدونِ درخواستِ شبکه و بدونِ کم‌شدن از سقف.
    if (hint) {
      setHintOpen(true);
      return;
    }
    if (!conversationId || hintLoading) return;
    setHintError(null);
    setHintLoading(true);
    try {
      const res = await getConversationSuggestions(conversationId);
      activeHintIdRef.current = res.hint_id;
      setHint({ hintId: res.hint_id, suggestions: res.suggestions });
      setHintsUsed(res.hints_used);
      setMaxHints(res.max_hints);
      setHintOpen(true);
    } catch {
      setHintError(t('aiConversationHintError'));
    } finally {
      setHintLoading(false);
    }
  }, [conversationId, hint, hintLoading, t]);

  const handlePlaySuggestion = useCallback(
    async (index: number) => {
      if (!hint) return;
      const suggestion = hint.suggestions[index];
      if (suggestion.audio_url) {
        playAudio(suggestion.audio_url);
        return;
      }
      const hintId = hint.hintId;
      setHintError(null);
      setAudioLoadingIndex(index);
      try {
        const url = await getSuggestionAudio(hintId, index);
        if (activeHintIdRef.current !== hintId) return;
        if (!url) {
          setHintError(t('aiConversationHintAudioError'));
          return;
        }
        setHint((prev) =>
          prev && prev.hintId === hintId
            ? {
                ...prev,
                suggestions: prev.suggestions.map((sg, i) => (i === index ? { ...sg, audio_url: url } : sg)),
              }
            : prev
        );
        playAudio(url);
      } catch {
        if (activeHintIdRef.current === hintId) setHintError(t('aiConversationHintAudioError'));
      } finally {
        setAudioLoadingIndex(null);
      }
    },
    [hint, playAudio, t]
  );

  const handleDone = useCallback(() => {
    navigation.navigate('Home');
  }, [navigation]);

  if (loadPhase === 'loading') {
    return (
      <View style={styles.centerScreen}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (loadPhase === 'load_error') {
    return (
      <View style={styles.centerScreen}>
        <CircleX size={40} color={COLORS.error} />
        <Text style={styles.centerText}>{t('aiConversationLoadError')}</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={handleDone} activeOpacity={0.85}>
          <Text style={styles.retryBtnText}>{t('backToHome')}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top + SPACING.s, paddingBottom: insets.bottom + SPACING.l }]}>
      <AudioPlayer
        uri={activeAudioUri}
        shouldPlay={false}
        actionCommand={actionCommand}
        actionNonce={actionNonce}
        onRecordingStatusUpdate={handleRecordingStatus}
      />

      <View style={styles.header}>
        <Text style={styles.headerTitle}>{t('aiConversationTitle')}</Text>
        <Text style={styles.headerSub}>{sceneTitle}</Text>
        <Text style={styles.progressText}>
          {t('aiConversationTurnProgress')
            .replace('{current}', String(turnNumber))
            .replace('{total}', String(maxUserTurns))}
        </Text>
      </View>

      <ScrollView
        ref={scrollRef}
        style={styles.messageList}
        contentContainerStyle={styles.messageListContent}
        showsVerticalScrollIndicator={false}
      >
        {messages.map((msg, i) => (
          <View
            key={i}
            style={[styles.bubble, msg.role === 'user' ? styles.bubbleUser : styles.bubbleAssistant]}
          >
            <Text style={[styles.bubbleText, msg.role === 'user' && styles.bubbleTextUser]}>{msg.text}</Text>
            {msg.role === 'user' && !!msg.grammarCorrection && (
              <View style={styles.grammarTip}>
                <Text style={styles.grammarTipLabel}>{t('grammarTipLabel')}</Text>
                <Text style={styles.grammarTipText}>{msg.grammarCorrection}</Text>
                {!!msg.grammarExplanation && (
                  <Text style={styles.grammarTipExplanation}>{msg.grammarExplanation}</Text>
                )}
              </View>
            )}
          </View>
        ))}
        {recordPhase === 'sending' && (
          <View style={[styles.bubble, styles.bubbleAssistant, styles.bubbleLoading]}>
            <ActivityIndicator size="small" color={COLORS.primary} />
          </View>
        )}
        {hint && hintOpen && recordPhase !== 'sending' && (
          <View style={styles.hintCard}>
            <View style={styles.hintCardHeader}>
              <Text style={styles.hintCardTitle}>{t('aiConversationHintTitle')}</Text>
              <TouchableOpacity
                onPress={() => setHintOpen(false)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                accessibilityLabel={t('aiConversationHintClose')}
              >
                <X size={18} color={COLORS.textSecondary} />
              </TouchableOpacity>
            </View>
            {hint.suggestions.map((sg, i) => (
              <View key={i} style={[styles.hintItem, i > 0 && styles.hintItemDivider]}>
                <View style={styles.hintItemTexts}>
                  <Text style={styles.hintItemText}>{sg.text}</Text>
                  {!!sg.translation_fa && <Text style={styles.hintItemTranslation}>{sg.translation_fa}</Text>}
                </View>
                <TouchableOpacity
                  style={styles.hintPlayBtn}
                  onPress={() => handlePlaySuggestion(i)}
                  disabled={recordPhase !== 'idle' || audioLoadingIndex !== null}
                  activeOpacity={0.8}
                >
                  {audioLoadingIndex === i ? (
                    <ActivityIndicator size="small" color={COLORS.primary} />
                  ) : (
                    <Volume2 size={18} color={COLORS.primary} />
                  )}
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {hintError && <Text style={styles.errorText}>{hintError}</Text>}
      {retryError && <Text style={styles.errorText}>{retryError}</Text>}
      {micError && <Text style={styles.errorText}>{micError}</Text>}

      {isEnded ? (
        <View style={styles.endedCard}>
          <PartyPopper size={28} color={COLORS.secondary} />
          <Text style={styles.endedTitle}>{t('aiConversationEndedTitle')}</Text>
          <Text style={styles.endedSub}>{t('aiConversationEndedMessage')}</Text>
          <TouchableOpacity style={styles.confirmBtn} onPress={handleDone} activeOpacity={0.85}>
            <Text style={styles.confirmBtnText}>{t('backToHome')}</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.recordArea}>
          {!hintOpen && (hint || hintsUsed < maxHints) && (
            <TouchableOpacity
              style={[styles.hintBtn, recordPhase !== 'idle' && styles.hintBtnDisabled]}
              onPress={handleHint}
              disabled={recordPhase !== 'idle' || hintLoading}
              activeOpacity={0.8}
            >
              {hintLoading ? (
                <ActivityIndicator size="small" color={COLORS.primary} />
              ) : (
                <Lightbulb size={16} color={COLORS.primary} />
              )}
              <Text style={styles.hintBtnText}>{t('aiConversationHintBtn')}</Text>
              {!hint && (
                <Text style={styles.hintBtnCount}>
                  {t('aiConversationHintsLeft').replace('{count}', String(maxHints - hintsUsed))}
                </Text>
              )}
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={[styles.recordBtn, recordPhase === 'recording' && styles.recordBtnActive]}
            onPress={recordPhase === 'recording' ? handleStopRecord : handleStartRecord}
            activeOpacity={0.85}
            disabled={recordPhase === 'sending'}
          >
            {recordPhase === 'recording' ? (
              <Square size={26} color={COLORS.white} fill={COLORS.white} />
            ) : (
              <Mic size={28} color={COLORS.white} />
            )}
          </TouchableOpacity>
          <Text style={styles.recordHint}>
            {recordPhase === 'recording'
              ? t('placementStopRecordBtn')
              : recordPhase === 'sending'
              ? t('aiConversationSending')
              : t('aiConversationRecordHint')}
          </Text>
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
  centerScreen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.m,
    backgroundColor: COLORS.background,
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
  progressText: {
    ...TEXT_STYLES.labelSm,
    color: COLORS.muted,
    marginTop: SPACING.xs,
  },
  messageList: {
    flex: 1,
  },
  messageListContent: {
    paddingVertical: SPACING.m,
    gap: SPACING.s,
  },
  bubble: {
    maxWidth: '80%',
    borderRadius: BORDER_RADIUS.l,
    paddingHorizontal: SPACING.m,
    paddingVertical: SPACING.s,
    marginBottom: SPACING.s,
  },
  bubbleAssistant: {
    alignSelf: 'flex-start',
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  bubbleUser: {
    alignSelf: 'flex-end',
    backgroundColor: COLORS.primary,
  },
  bubbleLoading: {
    paddingVertical: SPACING.m,
  },
  bubbleText: {
    ...TEXT_STYLES.bodyMd,
    color: COLORS.text,
  },
  bubbleTextUser: {
    color: COLORS.white,
  },
  grammarTip: {
    marginTop: SPACING.xs,
    paddingTop: SPACING.xs,
    borderTopWidth: 1,
    borderTopColor: hexToRgba(COLORS.white, 0.3),
  },
  grammarTipLabel: {
    fontFamily: FONT_FAMILY.semiBold,
    fontSize: 12,
    color: hexToRgba(COLORS.white, 0.85),
  },
  grammarTipText: {
    ...TEXT_STYLES.labelMd,
    color: COLORS.white,
    marginTop: 2,
  },
  grammarTipExplanation: {
    ...TEXT_STYLES.labelSm,
    color: hexToRgba(COLORS.white, 0.75),
    marginTop: 2,
  },
  errorText: {
    ...TEXT_STYLES.labelMd,
    color: COLORS.error,
    textAlign: 'center',
    marginBottom: SPACING.s,
  },
  recordArea: {
    alignItems: 'center',
    gap: SPACING.s,
    paddingTop: SPACING.s,
  },
  hintBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    backgroundColor: COLORS.primaryLight,
    borderRadius: BORDER_RADIUS.l,
    paddingHorizontal: SPACING.m,
    paddingVertical: SPACING.xs + 2,
  },
  hintBtnDisabled: {
    opacity: 0.5,
  },
  hintBtnText: {
    ...TEXT_STYLES.labelMd,
    color: COLORS.primary,
    fontFamily: FONT_FAMILY.semiBold,
  },
  hintBtnCount: {
    ...TEXT_STYLES.labelSm,
    color: COLORS.muted,
  },
  hintCard: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.l,
    borderWidth: 1,
    borderColor: COLORS.primary,
    padding: SPACING.m,
    ...SHADOWS.level1,
  },
  hintCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.xs,
  },
  hintCardTitle: {
    ...TEXT_STYLES.labelMd,
    color: COLORS.textSecondary,
  },
  hintItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.s,
    paddingVertical: SPACING.s,
  },
  hintItemDivider: {
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  hintItemTexts: {
    flex: 1,
  },
  hintItemText: {
    ...TEXT_STYLES.bodyMd,
    color: COLORS.text,
    fontFamily: FONT_FAMILY.semiBold,
  },
  hintItemTranslation: {
    ...TEXT_STYLES.labelMd,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  hintPlayBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
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
  endedCard: {
    alignItems: 'center',
    gap: SPACING.xs,
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.l,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.l,
    ...SHADOWS.level1,
  },
  endedTitle: {
    ...TEXT_STYLES.headlineSm,
    color: COLORS.text,
    marginTop: SPACING.xs,
  },
  endedSub: {
    ...TEXT_STYLES.bodyMd,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: SPACING.s,
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
