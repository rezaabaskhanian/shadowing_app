import React, { useCallback, useRef, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import { useQueryClient } from '@tanstack/react-query';
import { CheckCircle2, ChevronLeft, ChevronRight, Info, Mic, Square, X, XCircle } from 'lucide-react-native';

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
import Animated, { FadeInUp } from 'react-native-reanimated';
import { useFeedbackPop } from '../../components/FeedbackPop';

type Phase = 'idle' | 'recording' | 'checking' | 'result' | 'error' | 'no_subscription' | 'quota';

/**
 * تمرین صوتی یک معنا: یک موقعیت فارسی، کاربر یک جمله با همان فعل و همان معنا
 * می‌گوید، AI بررسی می‌کند. فقط با اشتراک (و از سقف روزانه‌ی AI کم می‌کند).
 */
export const VerbSpeakScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { meaningId, lemma, meaningFa, promptFa } = route.params || {};
  const { t, language } = useLanguage();
  const pop = useFeedbackPop();
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
        pop.show(res.passed ? 'correct' : 'wrong', t(res.passed ? 'verbSpeakPassed' : 'verbSpeakNotYet'));
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
    // pop/t پایدارند (useCallback/context)؛ فقط meaningId سؤال را عوض می‌کند.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [meaningId]
  );

  const exit = () => {
    exitingRef.current = true;
    if (phase === 'recording') command('stop_record');
    queryClient.invalidateQueries({ queryKey: verbKeys.list });
    navigation.goBack();
  };

  const rtl = language === 'fa';
  const row = rtl && styles.rowReverse;
  const align = rtl && styles.textRight;
  const blocked = phase === 'no_subscription' || phase === 'quota';

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

      <View style={[styles.topBar, row]}>
        <TouchableOpacity style={styles.closeBtn} onPress={exit} hitSlop={10}>
          <X color={COLORS.text} size={20} />
        </TouchableOpacity>
        <View style={styles.badge}>
          <Mic size={12} color={COLORS.primaryDark} />
          <Text style={styles.badgeText}>{t('verbSpeakBadge')}</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.card}>
          <View style={[styles.verbRow, row]}>
            <Text style={styles.verb}>"{lemma}"</Text>
            <View style={styles.verbChip}>
              <Text style={styles.verbChipText}>{t('verbSpeakTitle')}</Text>
            </View>
          </View>
          <Text style={[styles.instruction, align]}>
            {t('verbSpeakInstruction').replace('{verb}', lemma || '').replace('{meaning}', meaningFa || '')}
          </Text>
          <View style={styles.promptCard}>
            <Text style={[styles.prompt, align]}>
              <Text style={styles.promptLabel}>{t('verbSpeakMission')} </Text>
              {promptFa}
            </Text>
          </View>
        </View>

        {blocked ? (
          <View style={[styles.card, styles.center]}>
            <Text style={styles.message}>
              {phase === 'quota' ? t('verbSpeakQuotaReached') : t('verbSpeakSubscriptionOnly')}
            </Text>
            <TouchableOpacity
              style={styles.primaryBtn}
              onPress={() => navigation.navigate(phase === 'quota' ? 'TokenTopup' : 'Paywall')}
            >
              <Text style={styles.primaryBtnText}>
                {phase === 'quota' ? t('tokenTopupTitle') : t('aiConversationSubscribeBtn')}
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.card}>
            <View style={[styles.transcriptHead, row]}>
              <View style={[styles.transcriptTitleRow, row]}>
                <View style={styles.dot} />
                <Text style={styles.transcriptTitle}>{t('verbSpeakTranscriptTitle')}</Text>
              </View>
              <View style={styles.langChip}>
                <Text style={styles.langChipText}>{t('verbSpeakEnglish')}</Text>
              </View>
            </View>

            {phase === 'checking' ? (
              <View style={[styles.checkingRow, row]}>
                <ActivityIndicator color={COLORS.primary} />
                <Text style={styles.message}>{t('verbSpeakChecking')}</Text>
              </View>
            ) : phase === 'result' && result ? (
              <Animated.View entering={FadeInUp.springify().damping(14)}>
                <Text style={styles.english}>{result.transcript}</Text>
                <View style={[styles.resultHeader, row]}>
                  {result.passed ? (
                    <CheckCircle2 size={18} color={COLORS.success} />
                  ) : (
                    <XCircle size={18} color={COLORS.warningDeep} />
                  )}
                  <Text style={[styles.resultTitle, { color: result.passed ? COLORS.success : COLORS.warningDeep }]}>
                    {result.passed ? t('verbSpeakPassed') : t('verbSpeakNotYet')}
                  </Text>
                </View>
                {!!result.feedback_fa && <Text style={[styles.feedback, align]}>{result.feedback_fa}</Text>}
                {!!result.better_sentence && (
                  <View style={styles.betterBox}>
                    <Text style={[styles.label, align]}>{t('verbSpeakBetter')}</Text>
                    <Text style={styles.english}>{result.better_sentence}</Text>
                  </View>
                )}
              </Animated.View>
            ) : (
              <>
                <Text style={[styles.placeholder, align]}>
                  {phase === 'recording' ? t('placementStopRecordBtn') : t('verbSpeakPlaceholder')}
                </Text>
                {phase === 'error' && <Text style={[styles.errorText, align]}>{t('verbSpeakFailed')}</Text>}
              </>
            )}

            <View style={[styles.infoRow, row]}>
              <Info size={13} color={COLORS.muted} />
              <Text style={[styles.infoText, align]}>{t('verbSpeakInfo')}</Text>
            </View>
          </View>
        )}

        {!blocked && phase !== 'checking' && (
          <View style={styles.recordArea}>
            <View style={styles.wave}>
              {WAVE_BARS.map((h, i) => (
                <View key={i} style={[styles.waveBar, { height: h }, phase === 'recording' && styles.waveBarActive]} />
              ))}
            </View>
            <View style={[styles.recordRing, phase === 'recording' && styles.recordRingActive]}>
              <TouchableOpacity
                style={[styles.recordBtn, phase === 'recording' && styles.recordBtnActive]}
                onPress={phase === 'recording' ? stop : start}
                activeOpacity={0.85}
              >
                {phase === 'recording' ? (
                  <Square color={COLORS.white} size={26} fill={COLORS.white} />
                ) : (
                  <Mic color={COLORS.white} size={32} />
                )}
              </TouchableOpacity>
            </View>
            <Text style={styles.recordHint}>
              {phase === 'result' ? t('verbSpeakTryAgain') : t('verbSpeakTapToRecord')}
            </Text>
          </View>
        )}

        <TouchableOpacity style={[styles.skipBtn, row]} onPress={exit} activeOpacity={0.85}>
          <Text style={styles.skipText}>{t('verbSpeakSkip')}</Text>
          {rtl ? <ChevronLeft size={16} color={COLORS.primaryDark} /> : <ChevronRight size={16} color={COLORS.primaryDark} />}
        </TouchableOpacity>
      </ScrollView>
      {pop.element}
    </View>
  );
};

/** ارتفاع میله‌های موجِ تزئینیِ بالای دکمه‌ی ضبط. */
const WAVE_BARS = [8, 14, 22, 16, 26, 18, 12, 20, 10];

const styles = StyleSheet.create({
  rowReverse: { flexDirection: 'row-reverse' },
  textRight: { textAlign: 'right' },
  screen: { flex: 1, backgroundColor: COLORS.backgroundSoft },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 48,
    paddingBottom: 12,
  },
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
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: COLORS.primaryLight,
    borderRadius: BORDER_RADIUS.full,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  badgeText: { color: COLORS.primaryDark, fontFamily: FONT_FAMILY.semiBold, fontSize: 11 },
  content: { paddingHorizontal: 20, paddingBottom: 60, gap: 12 },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    padding: 16,
  },
  verbRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  verb: { color: COLORS.primary, fontFamily: FONT_FAMILY.bold, fontSize: 30 },
  verbChip: {
    backgroundColor: COLORS.surfaceLight,
    borderRadius: BORDER_RADIUS.full,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  verbChipText: { color: COLORS.textSecondary, fontFamily: FONT_FAMILY.medium, fontSize: 11 },
  instruction: { color: COLORS.textSecondary, fontFamily: FONT_FAMILY.medium, fontSize: 13, marginTop: 4 },
  promptCard: {
    backgroundColor: '#FFF6F2',
    borderWidth: 1,
    borderColor: 'rgba(232, 87, 47, 0.25)',
    borderRadius: 16,
    padding: 14,
    marginTop: 12,
  },
  promptLabel: { color: COLORS.primaryDark, fontFamily: FONT_FAMILY.bold },
  prompt: { color: COLORS.text, fontFamily: FONT_FAMILY.semiBold, fontSize: 15, lineHeight: 26 },
  center: { alignItems: 'center', gap: 14 },
  message: { color: COLORS.textSecondary, fontFamily: FONT_FAMILY.medium, fontSize: 14, textAlign: 'center' },
  transcriptHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  transcriptTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: COLORS.primary },
  transcriptTitle: { color: COLORS.text, fontFamily: FONT_FAMILY.bold, fontSize: 13 },
  langChip: { backgroundColor: COLORS.surfaceLight, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 2 },
  langChipText: { color: COLORS.muted, fontFamily: FONT_FAMILY.medium, fontSize: 10 },
  checkingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 12 },
  placeholder: {
    color: COLORS.muted,
    fontFamily: FONT_FAMILY.regular,
    fontSize: 14,
    lineHeight: 24,
    fontStyle: 'italic',
    paddingVertical: 6,
  },
  errorText: { color: COLORS.error, fontFamily: FONT_FAMILY.medium, fontSize: 13, marginTop: 4 },
  resultHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 10 },
  resultTitle: { fontFamily: FONT_FAMILY.bold, fontSize: 14 },
  label: { color: COLORS.muted, fontFamily: FONT_FAMILY.semiBold, fontSize: 11 },
  english: {
    color: COLORS.text,
    fontFamily: FONT_FAMILY.medium,
    fontSize: 16,
    lineHeight: 24,
    writingDirection: 'ltr',
    textAlign: 'left',
  },
  feedback: { color: COLORS.textSecondary, fontFamily: FONT_FAMILY.regular, fontSize: 13, lineHeight: 22, marginTop: 6 },
  betterBox: {
    backgroundColor: COLORS.backgroundSoft,
    borderRadius: 14,
    padding: 12,
    marginTop: 10,
    gap: 4,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
    paddingTop: 10,
    marginTop: 12,
  },
  infoText: { flex: 1, color: COLORS.muted, fontFamily: FONT_FAMILY.regular, fontSize: 11, lineHeight: 18 },
  recordArea: { alignItems: 'center', gap: 10, marginTop: 8 },
  wave: { flexDirection: 'row', alignItems: 'center', gap: 4, height: 28 },
  waveBar: { width: 3, borderRadius: 2, backgroundColor: COLORS.surfaceHighest },
  waveBarActive: { backgroundColor: COLORS.primary },
  recordRing: {
    width: 112,
    height: 112,
    borderRadius: 56,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recordRingActive: { backgroundColor: COLORS.errorLight },
  recordBtn: {
    width: 86,
    height: 86,
    borderRadius: 43,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recordBtnActive: { backgroundColor: COLORS.error },
  recordHint: { color: COLORS.text, fontFamily: FONT_FAMILY.semiBold, fontSize: 14 },
  skipBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    backgroundColor: '#FFF6F2',
    borderWidth: 1,
    borderColor: 'rgba(232, 87, 47, 0.2)',
    borderRadius: 16,
    height: 48,
    marginTop: 12,
  },
  skipText: { color: COLORS.primaryDark, fontFamily: FONT_FAMILY.bold, fontSize: 14 },
  primaryBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 16,
    height: 48,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'stretch',
  },
  primaryBtnText: { color: COLORS.white, fontFamily: FONT_FAMILY.bold, fontSize: 15 },
});
