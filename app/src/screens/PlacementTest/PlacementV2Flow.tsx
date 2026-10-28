import React, { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { CircleX } from 'lucide-react-native';

import { COLORS, SPACING, BORDER_RADIUS } from '../../theme/colors';
import { FONT_FAMILY, TEXT_STYLES } from '../../theme/typography';
import { useLanguage } from '../../data/i18n';
import {
  submitAssessmentV2,
  type AssessmentItem,
  type AssessmentTestV2,
  type SubmitAssessmentItem,
  type SubmitAssessmentV2Result,
} from '../../api/assessment';
import { PlacementTestIntroScreen } from './PlacementTestIntroScreen';
import { PlacementVocabScreen } from './PlacementVocabScreen';
import { PlacementListeningScreen } from './PlacementListeningScreen';
import { PlacementTestRecordScreen } from './PlacementTestRecordScreen';
import { PlacementResultV2Screen } from './PlacementResultV2Screen';

type Step = 'intro' | 'vocab' | 'listening' | 'speaking' | 'submitting' | 'error' | 'result';

interface Props {
  test: AssessmentTestV2;
  onSkip: () => void;
  onDone: () => void;
}

/**
 * فلوی تست نسخه‌ی ۲: معرفی → لغت → شنیدن → تکرار جمله (+ معرفی خود اختیاری)
 * → ارسال یک‌جا → نتیجه‌ی دوبخشی.
 */
export const PlacementV2Flow: React.FC<Props> = ({ test, onSkip, onDone }) => {
  const { t } = useLanguage();
  const [step, setStep] = useState<Step>('intro');
  const [vocab, setVocab] = useState<{ item_id: string; known: boolean }[]>([]);
  const [listening, setListening] = useState<{ item_id: string; choice: number }[]>([]);
  const [recordings, setRecordings] = useState<SubmitAssessmentItem[]>([]);
  const [result, setResult] = useState<SubmitAssessmentV2Result | null>(null);

  // جمله‌های تکرار با همان صفحه‌ی ضبط نسخه‌ی ۱ اجرا می‌شوند (kind=shadow یعنی
  // «اول گوش بده، بعد ضبط کن»)؛ متن جمله نمایش داده نمی‌شود.
  const speakingItems: AssessmentItem[] = useMemo(() => {
    const list: AssessmentItem[] = test.imitation.map((it) => ({
      id: it.id,
      kind: 'shadow',
      prompt_text: t('placementV2ImitationPrompt'),
      audio_url: it.audio_url,
    }));
    if (test.intro) list.push(test.intro);
    return list;
  }, [test, t]);

  const submit = useCallback(
    async (recs: SubmitAssessmentItem[]) => {
      setRecordings(recs);
      setStep('submitting');
      try {
        setResult(await submitAssessmentV2({ vocab, listening, recordings: recs }));
        setStep('result');
      } catch {
        setStep('error');
      }
    },
    [vocab, listening]
  );

  if (step === 'intro') {
    return (
      <PlacementTestIntroScreen
        onStart={() => setStep('vocab')}
        onSkip={onSkip}
        bullets={[t('placementV2IntroBullet1'), t('placementV2IntroBullet2'), t('placementV2IntroBullet3')]}
        timeEstimate={t('placementV2IntroTime')}
        body={t('placementV2IntroBody')}
      />
    );
  }

  if (step === 'vocab') {
    return (
      <PlacementVocabScreen
        items={test.vocab}
        onDone={(a) => {
          setVocab(a);
          setStep('listening');
        }}
      />
    );
  }

  if (step === 'listening') {
    return (
      <PlacementListeningScreen
        items={test.listening}
        onDone={(a) => {
          setListening(a);
          setStep('speaking');
        }}
      />
    );
  }

  if (step === 'speaking') {
    return <PlacementTestRecordScreen items={speakingItems} onCollected={submit} allowSkip maxReferencePlays={1} />;
  }

  if (step === 'result' && result) {
    return <PlacementResultV2Screen result={result} onContinue={onDone} />;
  }

  return (
    <View style={styles.center}>
      {step === 'submitting' ? (
        <>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.text}>{t('placementSubmitting')}</Text>
        </>
      ) : (
        <>
          <CircleX size={40} color={COLORS.error} />
          <Text style={styles.text}>{t('placementSubmitFailed')}</Text>
          <TouchableOpacity style={styles.btn} onPress={() => submit(recordings)} activeOpacity={0.85}>
            <Text style={styles.btnText}>{t('placementRetryBtn')}</Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.m,
    backgroundColor: COLORS.background,
    padding: SPACING.l,
  },
  text: {
    ...TEXT_STYLES.bodyMd,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  btn: {
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.l,
    paddingHorizontal: SPACING.l,
    paddingVertical: SPACING.s,
  },
  btnText: {
    color: COLORS.white,
    fontFamily: FONT_FAMILY.bold,
    fontSize: 15,
  },
});
