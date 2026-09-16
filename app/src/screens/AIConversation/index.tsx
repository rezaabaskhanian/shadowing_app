import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CircleX, Mic, PartyPopper, Square } from 'lucide-react-native';

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
  type ConversationRole,
} from '../../api/conversation';

interface Message {
  role: ConversationRole;
  text: string;
  audioUrl?: string;
  grammarCorrection?: string;
  grammarExplanation?: string;
}

type LoadPhase = 'loading' | 'ready' | 'load_error';
type RecordPhase = 'idle' | 'recording' | 'sending';
type ActionCommand = 'none' | 'start_record' | 'stop_record' | 'play_original';

/**
 * گفتگوی آزادِ صوتی با AI، بعد از تمام‌شدنِ همه‌ی دیالوگ‌های یک صحنه —
 * ورودی از دکمه‌ی چهارمِ Alert تکمیل درس در SceneScreen (scenarioId به‌عنوان
 * پارامتر مسیر). هر نوبت: کاربر ضبط می‌کند → رونویسی+پاسخ AI برمی‌گردد →
 * صدای AI (اگر ElevenLabs تنظیم شده باشد) پخش می‌شود. حداکثر ۶ تا ۸ نوبت.
 */
export const AIConversationScreen: React.FC = () => {
  const { t } = useLanguage();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const scenarioId: string | undefined = route.params?.scenarioId;

  const scrollRef = useRef<ScrollView>(null);
  const recordStartedAtRef = useRef<number>(0);

  const [loadPhase, setLoadPhase] = useState<LoadPhase>('loading');
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [sceneTitle, setSceneTitle] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [turnNumber, setTurnNumber] = useState(0);
  const [maxUserTurns, setMaxUserTurns] = useState(8);
  const [isEnded, setIsEnded] = useState(false);

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
  }, [messages]);

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
      </ScrollView>

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
