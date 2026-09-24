import React, { useCallback, useRef, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import { useQueryClient } from '@tanstack/react-query';
import { CheckCircle2, Mic, Square, X, XCircle } from 'lucide-react-native';

import { COLORS, BORDER_RADIUS } from '../../theme/colors';
import { FONT_FAMILY } from '../../theme/typography';
import { useLanguage } from '../../data/i18n';
import { AudioPlayer } from '../../components/AudioPlayer';
import { verbKeys } from '../../components/VerbList';
import { ensureMicPermission } from '../../services/micPermission';
import { ForbiddenError } from '../../api/client';
import { getAIUsageStatus } from '../../api/aiUsage';
import { speakVerbMeaning, type VerbSpeakResult } from '../../api/verbs';
import type { AudioActionCommand } from '../SceneScreen/types';

type Phase = 'idle' | 'recording' | 'checking' | 'result' | 'error' | 'no_subscription' | 'quota';

/**
 * تمرین صوتی یک معنا: یک موقعیت فارسی، کاربر یک جمله با همان فعل و همان معنا
 * می‌گوید، AI بررسی می‌کند. فقط با اشتراک (و از سقف روزانه‌ی AI کم می‌کند).
 */
export const VerbSpeakScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { meaningId, lemma, meaningFa, promptFa } = route.params || {};
  const { t } = useLanguage();
  const queryClient = useQueryClient();

  const [phase, setPhase] = useState<Phase>('idle');
  const [result, setResult] = useState<VerbSpeakResult | null>(null);
  const [actionCommand, setActionCommand] = useState<AudioActionCommand>('none');
  const [actionNonce, setActionNonce] = useState(0);
  const exitingRef = useRef(false);

  useFocusEffect(
    useCallback(() => {
      exitingRef.current = false;
      setPhase('idle');
      setResult(null);
      setActionCommand('none');
    }, [])
  );

  const command = (c: AudioActionCommand) => {
    setActionCommand(c);
    setActionNonce((n) => n + 1);
  };

  const start = async () => {
    if (!(await ensureMicPermission())) return;
    setResult(null);
    setPhase('recording');
    command('start_record');
  };

  const stop = () => command('stop_record');

  const handleRecordingStatus = useCallback(
    async (status: 'recording' | 'stopped' | 'error', filePath?: string, mimeType?: string) => {
      if (exitingRef.current) return;
      if (status === 'error') {
        setPhase('error');
        return;
      }
      if (status !== 'stopped' || !filePath) return;
      setPhase('checking');
      try {
        const res = await speakVerbMeaning(meaningId, filePath, mimeType || 'audio/m4a');
        setResult(res);
        setPhase('result');
      } catch (err) {
        if (err instanceof ForbiddenError) {
          // ۴۰۳ هم برای «بدون اشتراک» هم «سقف روزانه تمام» است؛ جدا می‌پرسیم.
          try {
            const usage = await getAIUsageStatus();
            setPhase(usage.has_active_subscription ? 'quota' : 'no_subscription');
          } catch {
            setPhase('no_subscription');
          }
          return;
        }
        setPhase('error');
      }
    },
    [meaningId]
  );

  const exit = () => {
    exitingRef.current = true;
    if (phase === 'recording') command('stop_record');
    queryClient.invalidateQueries({ queryKey: verbKeys.list });
    navigation.goBack();
  };

  return (
    <View style={styles.screen}>
      <AudioPlayer
        uri={null}
        shouldPlay={false}
        actionCommand={actionCommand}
        actionNonce={actionNonce}
        recordingProfile="speech"
        onRecordingStatusUpdate={handleRecordingStatus}
      />
      <TouchableOpacity style={styles.closeBtn} onPress={exit} hitSlop={10}>
        <X color={COLORS.text} size={22} />
      </TouchableOpacity>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>{t('verbSpeakTitle')}</Text>
        <Text style={styles.instruction}>
          {t('verbSpeakInstruction').replace('{verb}', lemma || '').replace('{meaning}', meaningFa || '')}
        </Text>
        <View style={styles.promptCard}>
          <Text style={styles.prompt}>{promptFa}</Text>
        </View>

        {phase === 'no_subscription' || phase === 'quota' ? (
          <View style={styles.center}>
            <Text style={styles.message}>
              {phase === 'quota' ? t('verbSpeakQuotaReached') : t('verbSpeakSubscriptionOnly')}
            </Text>
            <TouchableOpacity
              style={styles.primaryBtn}
              onPress={() => navigation.navigate(phase === 'quota' ? 'TokenTopup' : 'Paywall')}
            >
              <Text style={styles.primaryBtnText}>{phase === 'quota' ? t('tokenTopupTitle') : t('aiConversationSubscribeBtn')}</Text>
            </TouchableOpacity>
          </View>
        ) : phase === 'checking' ? (
          <View style={styles.center}>
            <ActivityIndicator color={COLORS.primary} size="large" />
            <Text style={styles.message}>{t('verbSpeakChecking')}</Text>
          </View>
        ) : phase === 'result' && result ? (
          <View style={styles.resultCard}>
            <View style={styles.resultHeader}>
              {result.passed ? (
                <CheckCircle2 size={22} color={COLORS.tertiary} />
              ) : (
                <XCircle size={22} color={COLORS.warningDeep} />
              )}
              <Text style={[styles.resultTitle, { color: result.passed ? COLORS.tertiary : COLORS.warningDeep }]}>
                {result.passed ? t('verbSpeakPassed') : t('verbSpeakNotYet')}
              </Text>
            </View>
            <Text style={styles.label}>{t('verbSpeakYouSaid')}</Text>
            <Text style={styles.english}>{result.transcript}</Text>
            {!!result.feedback_fa && <Text style={styles.feedback}>{result.feedback_fa}</Text>}
            {!!result.better_sentence && (
              <>
                <Text style={styles.label}>{t('verbSpeakBetter')}</Text>
                <Text style={styles.english}>{result.better_sentence}</Text>
              </>
            )}
            <TouchableOpacity style={[styles.primaryBtn, { marginTop: 16 }]} onPress={start}>
              <Text style={styles.primaryBtnText}>{t('verbSpeakTryAgain')}</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.center}>
            {phase === 'error' && <Text style={[styles.message, { color: COLORS.error }]}>{t('verbSpeakFailed')}</Text>}
            <TouchableOpacity
              style={[styles.recordBtn, phase === 'recording' && styles.recordBtnActive]}
              onPress={phase === 'recording' ? stop : start}
              activeOpacity={0.85}
            >
              {phase === 'recording' ? (
                <Square color={COLORS.white} size={28} fill={COLORS.white} />
              ) : (
                <Mic color={COLORS.white} size={32} />
              )}
            </TouchableOpacity>
            <Text style={styles.message}>{t('verbSpeakTapToRecord')}</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.background },
  closeBtn: {
    position: 'absolute',
    top: 54,
    left: 20,
    zIndex: 1,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: { paddingHorizontal: 20, paddingTop: 110, paddingBottom: 60 },
  title: { color: COLORS.text, fontFamily: FONT_FAMILY.bold, fontSize: 22 },
  instruction: { color: COLORS.textSecondary, fontFamily: FONT_FAMILY.medium, fontSize: 14, marginTop: 6 },
  promptCard: {
    backgroundColor: COLORS.primaryLight,
    borderRadius: BORDER_RADIUS.l,
    padding: 16,
    marginTop: 12,
  },
  prompt: { color: COLORS.text, fontFamily: FONT_FAMILY.bold, fontSize: 17, lineHeight: 28 },
  center: { alignItems: 'center', gap: 18, marginTop: 40 },
  message: { color: COLORS.textSecondary, fontFamily: FONT_FAMILY.medium, fontSize: 14, textAlign: 'center' },
  recordBtn: {
    width: 92,
    height: 92,
    borderRadius: 46,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recordBtnActive: { backgroundColor: COLORS.error },
  resultCard: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.l,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 16,
    marginTop: 24,
  },
  resultHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  resultTitle: { fontFamily: FONT_FAMILY.bold, fontSize: 16 },
  label: { color: COLORS.muted, fontFamily: FONT_FAMILY.semiBold, fontSize: 12, marginTop: 10 },
  english: {
    color: COLORS.text,
    fontFamily: FONT_FAMILY.medium,
    fontSize: 15,
    marginTop: 2,
    writingDirection: 'ltr',
    textAlign: 'left',
  },
  feedback: { color: COLORS.textSecondary, fontFamily: FONT_FAMILY.regular, fontSize: 14, lineHeight: 22, marginTop: 10 },
  primaryBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.l,
    height: 48,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'stretch',
  },
  primaryBtnText: { color: COLORS.white, fontFamily: FONT_FAMILY.bold, fontSize: 15 },
});
