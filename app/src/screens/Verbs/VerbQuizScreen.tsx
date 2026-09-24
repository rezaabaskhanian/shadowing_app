import React, { useCallback, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import { useQueryClient } from '@tanstack/react-query';
import { Play, X } from 'lucide-react-native';

import { COLORS, BORDER_RADIUS } from '../../theme/colors';
import { FONT_FAMILY } from '../../theme/typography';
import { useLanguage } from '../../data/i18n';
import { AudioPlayer } from '../../components/AudioPlayer';
import { verbKeys } from '../../components/VerbList';
import { absUrl } from '../../api/config';
import { answerVerbQuiz, getVerbQuiz, type VerbQuizQuestion } from '../../api/verbs';
import type { AudioActionCommand } from '../SceneScreen/types';
import { SentenceWithForm } from './VerbDetailScreen';

/**
 * آزمون تشخیص: جمله‌ای از درس‌ها + «این‌جا فعل یعنی چه؟» با ۴ گزینه که همه
 * معناهای همین فعل‌اند. جواب را سرور بررسی و ثبت می‌کند (حداکثر یک جواب درست
 * در روز برای هر معنا شمرده می‌شود). بدون امتیاز.
 */
export const VerbQuizScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const verbId: string = route.params?.verbId;
  const { t } = useLanguage();
  const queryClient = useQueryClient();

  const [questions, setQuestions] = useState<VerbQuizQuestion[] | null>(null);
  const [index, setIndex] = useState(0);
  const [chosen, setChosen] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ correct: boolean; meaning: string } | null>(null);
  const [correctCount, setCorrectCount] = useState(0);

  const [audioUri, setAudioUri] = useState<string | null>(null);
  const [actionCommand, setActionCommand] = useState<AudioActionCommand>('none');
  const [actionNonce, setActionNonce] = useState(0);

  // این صفحه در Tab.Navigator است و unmount نمی‌شود؛ هر بار ورود = آزمون تازه.
  useFocusEffect(
    useCallback(() => {
      let active = true;
      setQuestions(null);
      setIndex(0);
      setChosen(null);
      setFeedback(null);
      setCorrectCount(0);
      getVerbQuiz(verbId)
        .then((q) => active && setQuestions(q))
        .catch(() => active && setQuestions([]));
      return () => {
        active = false;
      };
    }, [verbId])
  );

  const play = (url: string) => {
    setAudioUri(absUrl(url));
    setActionCommand('play_original');
    setActionNonce((n) => n + 1);
  };

  const exit = () => {
    queryClient.invalidateQueries({ queryKey: verbKeys.detail(verbId) });
    queryClient.invalidateQueries({ queryKey: verbKeys.list });
    navigation.goBack();
  };

  const q = questions?.[index];
  const done = !!questions && questions.length > 0 && index >= questions.length;

  const choose = async (optionId: string) => {
    if (!q || chosen) return;
    setChosen(optionId);
    try {
      const res = await answerVerbQuiz(q.meaning_id, optionId);
      setFeedback({ correct: res.correct, meaning: res.correct_meaning_fa });
      if (res.correct) setCorrectCount((c) => c + 1);
    } catch {
      const correct = optionId === q.meaning_id;
      setFeedback({ correct, meaning: q.options.find((o) => o.meaning_id === q.meaning_id)?.meaning_fa || '' });
      if (correct) setCorrectCount((c) => c + 1);
    }
  };

  const next = () => {
    setChosen(null);
    setFeedback(null);
    setIndex((i) => i + 1);
  };

  return (
    <View style={styles.screen}>
      <AudioPlayer uri={audioUri} shouldPlay={false} actionCommand={actionCommand} actionNonce={actionNonce} />
      <TouchableOpacity style={styles.closeBtn} onPress={exit} hitSlop={10}>
        <X color={COLORS.text} size={22} />
      </TouchableOpacity>

      <ScrollView contentContainerStyle={styles.content}>
        {questions === null ? (
          <ActivityIndicator color={COLORS.primary} style={{ marginTop: 60 }} />
        ) : questions.length === 0 ? (
          <View style={styles.center}>
            <Text style={styles.message}>{t('verbQuizEmpty')}</Text>
            <TouchableOpacity style={styles.primaryBtn} onPress={exit}>
              <Text style={styles.primaryBtnText}>{t('verbBackToVerb')}</Text>
            </TouchableOpacity>
          </View>
        ) : done ? (
          <View style={styles.center}>
            <Text style={styles.doneText}>
              {t('verbQuizDone').replace('{correct}', String(correctCount)).replace('{total}', String(questions.length))}
            </Text>
            <TouchableOpacity style={styles.primaryBtn} onPress={exit}>
              <Text style={styles.primaryBtnText}>{t('verbBackToVerb')}</Text>
            </TouchableOpacity>
          </View>
        ) : q ? (
          <>
            <Text style={styles.progress}>
              {index + 1} / {questions.length}
            </Text>
            <View style={styles.sentenceCard}>
              {!!q.audio_url && (
                <TouchableOpacity style={styles.playBtn} onPress={() => play(q.audio_url)} hitSlop={8}>
                  <Play size={16} color={COLORS.primary} fill={COLORS.primary} />
                </TouchableOpacity>
              )}
              <SentenceWithForm sentence={q.sentence} form={q.form} style={styles.sentence} />
            </View>
            <Text style={styles.question}>{t('verbQuizQuestion').replace('{form}', q.form)}</Text>

            {q.options.map((o) => {
              const isCorrect = o.meaning_id === q.meaning_id;
              const isChosen = chosen === o.meaning_id;
              return (
                <TouchableOpacity
                  key={o.meaning_id}
                  style={[
                    styles.option,
                    chosen && isCorrect && styles.optionCorrect,
                    isChosen && !isCorrect && styles.optionWrong,
                  ]}
                  disabled={!!chosen}
                  onPress={() => choose(o.meaning_id)}
                  activeOpacity={0.85}
                >
                  <Text style={styles.optionText}>{o.meaning_fa}</Text>
                </TouchableOpacity>
              );
            })}

            {feedback && (
              <>
                <Text style={[styles.feedback, { color: feedback.correct ? COLORS.tertiary : COLORS.error }]}>
                  {feedback.correct ? t('verbQuizCorrect') : t('verbQuizWrong').replace('{meaning}', feedback.meaning)}
                </Text>
                <TouchableOpacity style={styles.primaryBtn} onPress={next}>
                  <Text style={styles.primaryBtnText}>{t('verbQuizNext')}</Text>
                </TouchableOpacity>
              </>
            )}
          </>
        ) : null}
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
  center: { alignItems: 'center', gap: 20, marginTop: 40 },
  message: { color: COLORS.textSecondary, fontFamily: FONT_FAMILY.medium, fontSize: 15, textAlign: 'center' },
  doneText: { color: COLORS.text, fontFamily: FONT_FAMILY.bold, fontSize: 20, textAlign: 'center' },
  progress: { color: COLORS.textSecondary, fontFamily: FONT_FAMILY.medium, fontSize: 13, marginBottom: 10 },
  sentenceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.l,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 16,
  },
  playBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sentence: {
    flex: 1,
    color: COLORS.text,
    fontFamily: FONT_FAMILY.medium,
    fontSize: 17,
    lineHeight: 26,
    writingDirection: 'ltr',
    textAlign: 'left',
  },
  question: { color: COLORS.text, fontFamily: FONT_FAMILY.bold, fontSize: 16, marginTop: 20, marginBottom: 12 },
  option: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.l,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  optionCorrect: { borderColor: COLORS.tertiary, backgroundColor: COLORS.tertiaryLight },
  optionWrong: { borderColor: COLORS.error, backgroundColor: COLORS.errorLight },
  optionText: { color: COLORS.text, fontFamily: FONT_FAMILY.semiBold, fontSize: 15 },
  feedback: { fontFamily: FONT_FAMILY.bold, fontSize: 15, marginTop: 6, marginBottom: 12, textAlign: 'center' },
  primaryBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.l,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'stretch',
  },
  primaryBtnText: { color: COLORS.white, fontFamily: FONT_FAMILY.bold, fontSize: 15 },
});
