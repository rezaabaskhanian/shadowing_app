import React, { useCallback, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import { useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, ArrowRight, Check, Play, X } from 'lucide-react-native';

import { COLORS } from '../../theme/colors';
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
  const { t, language } = useLanguage();
  // فارسی: سؤال و گزینه‌ها راست‌چین، رقم‌ها فارسی؛ جمله‌ی انگلیسی چپ‌چین می‌ماند.
  const rtl = language === 'fa';
  const rr = rtl ? styles.rowReverse : null;
  const ta = rtl ? styles.textRight : styles.textLeft;
  const num = (n: number) => (rtl ? String(n).replace(/\d/g, (d) => '۰۱۲۳۴۵۶۷۸۹'[Number(d)]) : String(n));
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();

  const [questions, setQuestions] = useState<VerbQuizQuestion[] | null>(null);
  const [index, setIndex] = useState(0);
  const [chosen, setChosen] = useState<string | null>(null);
  // گزینه‌ای که کاربر علامت زده ولی هنوز «بررسی پاسخ» را نزده.
  const [picked, setPicked] = useState<string | null>(null);
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
      setPicked(null);
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
    setPicked(null);
    setFeedback(null);
    setIndex((i) => i + 1);
  };

  // «go on: ادامه دادن» → عبارت انگلیسی در یک برچسب کوچک، معنی فارسی کنارش.
  const splitMeaning = (m: string) => {
    const i = m.indexOf(':');
    return i > 0 && /^[A-Za-z' ]+$/.test(m.slice(0, i).trim()) ? { en: m.slice(0, i).trim(), fa: m.slice(i + 1).trim() } : { en: '', fa: m };
  };
  const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F'];
  const total = questions?.length ?? 0;

  return (
    <View style={[styles.screen, { paddingTop: insets.top + 8 }]}>
      <AudioPlayer uri={audioUri} shouldPlay={false} actionCommand={actionCommand} actionNonce={actionNonce} />

      {/* سربرگ: بستن، شمارنده‌ی مرحله و نوار پیشرفت */}
      <View style={[styles.topRow, rr]}>
        <TouchableOpacity style={styles.closeBtn} onPress={exit} hitSlop={10}>
          <X color={COLORS.text} size={20} />
        </TouchableOpacity>
        {total > 0 && !done && (
          <View style={styles.stepChip}>
            <Text style={styles.stepChipText}>
              {t('verbQuizStep')} {num(Math.min(index + 1, total))}/{num(total)}
            </Text>
          </View>
        )}
        <View style={styles.closeSpacer} />
      </View>
      {total > 0 && !done && (
        <View style={[styles.progressTrack, rr]}>
          <View style={[styles.progressFill, { width: `${((index + (chosen ? 1 : 0)) / total) * 100}%` }]} />
        </View>
      )}

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
              {t('verbQuizDone').replace('{correct}', num(correctCount)).replace('{total}', num(questions.length))}
            </Text>
            <TouchableOpacity style={styles.primaryBtn} onPress={exit}>
              <Text style={styles.primaryBtnText}>{t('verbBackToVerb')}</Text>
            </TouchableOpacity>
          </View>
        ) : q ? (
          <>
            <View style={[styles.sentenceCard, styles.rowReverse]}>
              {!!q.audio_url && (
                <TouchableOpacity style={styles.playBtn} onPress={() => play(q.audio_url)} hitSlop={8}>
                  <Play size={16} color={COLORS.primary} fill={COLORS.primary} />
                </TouchableOpacity>
              )}
              <SentenceWithForm sentence={q.sentence} form={q.form} style={styles.sentence} />
            </View>

            <Text style={[styles.question, ta]}>
              {/* گیومه‌ها در راست‌به‌چپ کنار کلمه‌ی انگلیسی جابه‌جا می‌شوند؛ برچسب رنگی جایشان را می‌گیرد. */}
              {t('verbQuizQuestion').split('{form}')[0].replace('«', '')}
              <Text style={styles.formChip}> {q.form} </Text>
              {t('verbQuizQuestion').split('{form}')[1].replace('»', '')}
            </Text>
            <Text style={[styles.questionHint, ta]}>{t('verbQuizHint')}</Text>

            {q.options.map((o, oi) => {
              const isCorrect = o.meaning_id === q.meaning_id;
              const isChosen = chosen === o.meaning_id;
              const isPicked = !chosen && picked === o.meaning_id;
              const { en, fa } = splitMeaning(o.meaning_fa);
              const showRight = !!chosen && isCorrect;
              const showWrong = isChosen && !isCorrect;
              return (
                <TouchableOpacity
                  key={o.meaning_id}
                  style={[
                    styles.option,
                    rr,
                    isPicked && styles.optionPicked,
                    showRight && styles.optionCorrect,
                    showWrong && styles.optionWrong,
                  ]}
                  disabled={!!chosen}
                  onPress={() => setPicked(o.meaning_id)}
                  activeOpacity={0.85}
                >
                  {/* دایره‌ی انتخاب / تیک درست / ضربدر اشتباه */}
                  <View
                    style={[
                      styles.radio,
                      isPicked && styles.radioOn,
                      showRight && styles.radioRight,
                      showWrong && styles.radioWrong,
                    ]}
                  >
                    {showRight ? (
                      <Check size={13} color={COLORS.white} strokeWidth={3} />
                    ) : showWrong ? (
                      <X size={12} color={COLORS.error} strokeWidth={3} />
                    ) : isPicked ? (
                      <View style={styles.radioDot} />
                    ) : null}
                  </View>
                  <View style={[styles.optionBody, rr]}>
                    <Text style={[styles.optionText, showRight && styles.textRightColor, showWrong && styles.textWrongColor]}>
                      {fa}
                    </Text>
                    {!!en && (
                      <View style={styles.enChip}>
                        <Text style={styles.enChipText}>{en}:</Text>
                      </View>
                    )}
                  </View>
                  {chosen ? (
                    (showRight || showWrong) && (
                      <View style={styles.tag}>
                        <Text style={[styles.tagText, showRight ? styles.textRightColor : styles.textWrongColor]}>
                          {t(showRight ? 'verbQuizRightTag' : 'verbQuizYourTag')}
                        </Text>
                      </View>
                    )
                  ) : (
                    <View style={styles.letter}>
                      <Text style={styles.letterText}>{LETTERS[oi]}</Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}

            {feedback && !feedback.correct && (
              <Text style={styles.correction}>
                {t('verbQuizWrong').split('{meaning}')[0]}
                <Text style={styles.correctionMeaning}>{feedback.meaning}</Text>
              </Text>
            )}
          </>
        ) : null}
      </ScrollView>

      {/* پایین: قبل از جواب «بررسی پاسخ»، بعدش کارت بازخورد و «بعدی» */}
      {q && !done && (
        <View style={[styles.footer, { paddingBottom: insets.bottom + 12 }, feedback && styles.footerRaised]}>
          {feedback && (
            <View style={[styles.feedbackCard, rr, feedback.correct ? styles.feedbackGood : styles.feedbackBad]}>
              <View style={[styles.feedbackIcon, { backgroundColor: feedback.correct ? '#3DAE74' : '#E8572F' }]}>
                {feedback.correct ? <Check size={18} color={COLORS.white} strokeWidth={3} /> : <X size={18} color={COLORS.white} strokeWidth={3} />}
              </View>
              <View style={[styles.flex1, rtl ? styles.alignEnd : styles.alignStart]}>
                <Text style={[styles.feedbackTitle, { color: feedback.correct ? '#2E8B5C' : '#C2410C' }]}>
                  {t(feedback.correct ? 'verbQuizCorrect' : 'verbQuizNoWorries')}
                </Text>
                <Text style={styles.feedbackSub}>{t(feedback.correct ? 'verbQuizCorrectSub' : 'verbQuizNoWorriesSub')}</Text>
              </View>
            </View>
          )}
          <TouchableOpacity
            style={[styles.primaryBtn, rr, !feedback && !picked && styles.btnDisabled]}
            disabled={!feedback && !picked}
            onPress={() => (feedback ? next() : picked && choose(picked))}
            activeOpacity={0.85}
          >
            <Text style={[styles.primaryBtnText, !feedback && !picked && styles.btnDisabledText]}>
              {t(feedback ? 'verbQuizNext' : 'verbQuizCheck')}
            </Text>
            {rtl ? (
              <ArrowLeft size={18} color={!feedback && !picked ? COLORS.muted : COLORS.white} />
            ) : (
              <ArrowRight size={18} color={!feedback && !picked ? COLORS.muted : COLORS.white} />
            )}
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#FAF8F4' },
  rowReverse: { flexDirection: 'row-reverse' },
  textRight: { textAlign: 'right' },
  textLeft: { textAlign: 'left' },
  alignEnd: { alignItems: 'flex-end' },
  alignStart: { alignItems: 'flex-start' },
  flex1: { flex: 1 },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20 },
  closeBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: '#ECEAE4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeSpacer: { width: 40 },
  stepChip: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12, backgroundColor: '#EFECE6' },
  stepChipText: { fontFamily: FONT_FAMILY.bold, fontSize: 12, color: COLORS.textSecondary },
  progressTrack: { flexDirection: 'row', height: 5, borderRadius: 3, backgroundColor: '#E8E4DC', marginHorizontal: 20, marginTop: 14, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 3, backgroundColor: COLORS.primary },
  content: { paddingHorizontal: 20, paddingTop: 18, paddingBottom: 30 },
  center: { alignItems: 'center', gap: 20, marginTop: 40 },
  message: { color: COLORS.textSecondary, fontFamily: FONT_FAMILY.medium, fontSize: 15, textAlign: 'center' },
  doneText: { color: COLORS.text, fontFamily: FONT_FAMILY.bold, fontSize: 20, textAlign: 'center' },
  sentenceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: COLORS.white,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ECEAE4',
    padding: 16,
    shadowColor: '#1A1D26',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
    elevation: 1,
  },
  playBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#FDEBE4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sentence: {
    flex: 1,
    color: COLORS.text,
    fontFamily: FONT_FAMILY.semiBold,
    fontSize: 17,
    lineHeight: 26,
    writingDirection: 'ltr',
    textAlign: 'left',
  },
  question: { color: COLORS.text, fontFamily: FONT_FAMILY.bold, fontSize: 17, marginTop: 22 },
  formChip: { color: COLORS.primary, backgroundColor: '#FDEBE4' },
  questionHint: { color: COLORS.muted, fontFamily: FONT_FAMILY.regular, fontSize: 12, marginTop: 4, marginBottom: 14 },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: COLORS.white,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#ECEAE4',
    borderBottomWidth: 3,
    paddingVertical: 13,
    paddingHorizontal: 14,
    marginBottom: 10,
  },
  optionPicked: { borderColor: COLORS.primary, backgroundColor: '#FFF6F1' },
  optionCorrect: { borderColor: '#8FD0AE', backgroundColor: '#EEF8F2' },
  optionWrong: { borderColor: '#F0B3A3', backgroundColor: '#FDEFEA' },
  optionBody: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 },
  optionText: { color: COLORS.text, fontFamily: FONT_FAMILY.bold, fontSize: 15 },
  textRightColor: { color: '#2E8B5C' },
  textWrongColor: { color: '#C2410C' },
  enChip: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, backgroundColor: '#F2F2F5' },
  enChipText: { fontFamily: FONT_FAMILY.semiBold, fontSize: 13, color: COLORS.textSecondary },
  radio: { width: 22, height: 22, borderRadius: 11, borderWidth: 1.5, borderColor: '#C9CCD4', alignItems: 'center', justifyContent: 'center' },
  radioOn: { borderColor: COLORS.primary },
  radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: COLORS.primary },
  radioRight: { backgroundColor: '#3DAE74', borderColor: '#3DAE74' },
  radioWrong: { backgroundColor: '#FBD9CF', borderColor: '#FBD9CF' },
  letter: { width: 26, height: 26, borderRadius: 8, backgroundColor: '#F2F2F5', alignItems: 'center', justifyContent: 'center' },
  letterText: { fontFamily: FONT_FAMILY.bold, fontSize: 12, color: COLORS.textSecondary },
  tag: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8, backgroundColor: COLORS.white },
  tagText: { fontFamily: FONT_FAMILY.semiBold, fontSize: 10 },
  correction: { textAlign: 'center', fontFamily: FONT_FAMILY.semiBold, fontSize: 13, color: '#C2410C', marginTop: 6 },
  correctionMeaning: { textDecorationLine: 'underline', fontFamily: FONT_FAMILY.bold },
  footer: { paddingHorizontal: 20, paddingTop: 12, gap: 12 },
  footerRaised: { backgroundColor: COLORS.white, borderTopLeftRadius: 22, borderTopRightRadius: 22 },
  feedbackCard: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderRadius: 16, borderWidth: 1 },
  feedbackGood: { backgroundColor: '#EEF8F2', borderColor: '#CDEBDA' },
  feedbackBad: { backgroundColor: '#FDF1EC', borderColor: '#F8D5C8' },
  feedbackIcon: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  feedbackTitle: { fontFamily: FONT_FAMILY.bold, fontSize: 14 },
  feedbackSub: { fontFamily: FONT_FAMILY.regular, fontSize: 12, color: COLORS.textSecondary },
  primaryBtn: {
    flexDirection: 'row',
    gap: 10,
    backgroundColor: '#E2643A',
    borderRadius: 16,
    borderBottomWidth: 3,
    borderBottomColor: '#B8481F',
    height: 54,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'stretch',
  },
  btnDisabled: { backgroundColor: '#E8E4DC', borderBottomColor: '#DAD5CB' },
  btnDisabledText: { color: COLORS.muted },
  primaryBtnText: { color: COLORS.white, fontFamily: FONT_FAMILY.bold, fontSize: 15 },
});
