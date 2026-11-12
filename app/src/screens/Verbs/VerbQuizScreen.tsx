import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import { useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Play,
  RotateCcw,
  Sparkles,
  Volume2,
  X,
} from 'lucide-react-native';

import { COLORS, SPACING } from '../../theme/colors';
import { FONT_FAMILY } from '../../theme/typography';
import { SHADOWS } from '../../theme/elevation';
import { useLanguage } from '../../data/i18n';
import { AudioPlayer } from '../../components/AudioPlayer';
import { verbKeys } from '../../components/VerbList';
import { absUrl } from '../../api/config';
import { answerVerbQuiz, getVerbQuiz, type VerbQuizQuestion } from '../../api/verbs';
import type { AudioActionCommand } from '../SceneScreen/types';
import { SentenceWithForm } from './VerbDetailScreen';

/**
 * آزمون تشخیص کاربردی افعال چندمعنایی
 * بازطراحی‌شده با زبان بصری ادیتوریال و گرم لینگوفلو
 */
export const VerbQuizScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const verbId: string = route.params?.verbId;
  const { t, language } = useLanguage();
  const rtl = language === 'fa';
  const rr = rtl ? styles.rowReverse : null;
  const ta = rtl ? styles.textRight : styles.textLeft;
  const num = (n: number) =>
    rtl ? String(n).replace(/\d/g, (d) => '۰۱۲۳۴۵۶۷۸۹'[Number(d)]) : String(n);
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();

  const [questions, setQuestions] = useState<VerbQuizQuestion[] | null>(null);
  const [index, setIndex] = useState(0);
  const [chosen, setChosen] = useState<string | null>(null);
  const [picked, setPicked] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ correct: boolean; meaning: string } | null>(null);
  const [correctCount, setCorrectCount] = useState(0);

  const [audioUri, setAudioUri] = useState<string | null>(null);
  const [actionCommand, setActionCommand] = useState<AudioActionCommand>('none');
  const [actionNonce, setActionNonce] = useState(0);

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
      setFeedback({
        correct,
        meaning: q.options.find((o) => o.meaning_id === q.meaning_id)?.meaning_fa || '',
      });
      if (correct) setCorrectCount((c) => c + 1);
    }
  };

  const next = () => {
    setChosen(null);
    setPicked(null);
    setFeedback(null);
    setIndex((i) => i + 1);
  };

  const splitMeaning = (m: string) => {
    const i = m.indexOf(':');
    return i > 0 && /^[A-Za-z' ]+$/.test(m.slice(0, i).trim())
      ? { en: m.slice(0, i).trim(), fa: m.slice(i + 1).trim() }
      : { en: '', fa: m };
  };

  const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F'];
  const total = questions?.length ?? 0;
  const ChevronIcon = rtl ? ArrowLeft : ArrowRight;

  return (
    <View style={[styles.screen, { paddingTop: insets.top + 8 }]}>
      <AudioPlayer
        uri={audioUri}
        shouldPlay={false}
        actionCommand={actionCommand}
        actionNonce={actionNonce}
      />

      {/* سربرگ مدرن: دکمه بستن، شمارنده شیک و نوار پیشرفت */}
      <View style={[styles.topRow, rr]}>
        <TouchableOpacity style={styles.closeBtn} onPress={exit} activeOpacity={0.8}>
          <X color="#191C21" size={19} />
        </TouchableOpacity>

        {total > 0 && !done && (
          <View style={styles.stepChip}>
            <Text style={styles.stepChipText}>
              {t('verbQuizStep')} {num(Math.min(index + 1, total))} از {num(total)}
            </Text>
          </View>
        )}

        <View style={styles.closeSpacer} />
      </View>

      {total > 0 && !done && (
        <View style={[styles.progressTrack, rr]}>
          <View
            style={[
              styles.progressFill,
              { width: `${((index + (chosen ? 1 : 0)) / total) * 100}%` },
            ]}
          />
        </View>
      )}

      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 120 }]}>
        {questions === null ? (
          <ActivityIndicator color="#FF6422" style={{ marginTop: 60 }} />
        ) : questions.length === 0 ? (
          <View style={styles.center}>
            <Text style={styles.message}>{t('verbQuizEmpty')}</Text>
            <TouchableOpacity style={styles.primaryBtn} onPress={exit} activeOpacity={0.85}>
              <Text style={styles.primaryBtnText}>{t('verbBackToVerb')}</Text>
            </TouchableOpacity>
          </View>
        ) : done ? (
          <View style={styles.center}>
            <View style={styles.doneIconWrap}>
              <Sparkles size={36} color="#FF6422" />
            </View>
            <Text style={styles.doneTitle}>
              {rtl ? 'آفرین! کوئیز را به پایان رساندی' : 'Quiz Completed!'}
            </Text>
            <Text style={styles.doneText}>
              {t('verbQuizDone')
                .replace('{correct}', num(correctCount))
                .replace('{total}', num(questions.length))}
            </Text>
            <TouchableOpacity style={styles.primaryBtn} onPress={exit} activeOpacity={0.88}>
              <Text style={styles.primaryBtnText}>{t('verbBackToVerb')}</Text>
            </TouchableOpacity>
          </View>
        ) : q ? (
          <>
            {/* کارت جمله نمونه از مکالمه */}
            <View style={[styles.sentenceCard, rr]}>
              {!!q.audio_url && (
                <TouchableOpacity
                  style={styles.playBtn}
                  onPress={() => play(q.audio_url)}
                  activeOpacity={0.85}
                >
                  <Volume2 size={20} color="#FF6422" />
                </TouchableOpacity>
              )}
              <SentenceWithForm sentence={q.sentence} form={q.form} style={styles.sentence} />
            </View>

            {/* سوال کوئیز */}
            <View style={[styles.questionWrap, { alignItems: rtl ? 'flex-end' : 'flex-start' }]}>
              <Text style={[styles.question, ta]}>
                {t('verbQuizQuestion').split('{form}')[0].replace('«', '')}
                <Text style={styles.formChip}> {q.form} </Text>
                {t('verbQuizQuestion').split('{form}')[1].replace('»', '')}
              </Text>
              <Text style={[styles.questionHint, ta]}>{t('verbQuizHint')}</Text>
            </View>

            {/* گزینه‌های پاسخ */}
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
                  activeOpacity={0.88}
                >
                  {/* دایره رادیویی یا آیکون درست/غلط */}
                  <View
                    style={[
                      styles.radio,
                      isPicked && styles.radioOn,
                      showRight && styles.radioRight,
                      showWrong && styles.radioWrong,
                    ]}
                  >
                    {showRight ? (
                      <Check size={12} color="#FFFFFF" strokeWidth={3} />
                    ) : showWrong ? (
                      <X size={12} color="#EF4444" strokeWidth={3} />
                    ) : isPicked ? (
                      <View style={styles.radioDot} />
                    ) : null}
                  </View>

                  <View style={[styles.optionBody, rr]}>
                    <Text
                      style={[
                        styles.optionText,
                        showRight && styles.textRightColor,
                        showWrong && styles.textWrongColor,
                      ]}
                    >
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
                      <View
                        style={[
                          styles.tag,
                          { backgroundColor: showRight ? '#ECFDF5' : '#FEF2F2' },
                        ]}
                      >
                        <Text
                          style={[
                            styles.tagText,
                            showRight ? styles.textRightColor : styles.textWrongColor,
                          ]}
                        >
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
              <View style={styles.correctionBox}>
                <Text style={styles.correction}>
                  {t('verbQuizWrong').split('{meaning}')[0]}
                  <Text style={styles.correctionMeaning}>{feedback.meaning}</Text>
                </Text>
              </View>
            )}
          </>
        ) : null}
      </ScrollView>

      {/* نوار فوتر ثابت پایین: بازخورد + دکمه بررسی یا بعدی */}
      {q && !done && (
        <View style={[styles.footer, { paddingBottom: insets.bottom + 14 }]}>
          {feedback && (
            <View
              style={[
                styles.feedbackCard,
                rr,
                feedback.correct ? styles.feedbackGood : styles.feedbackBad,
              ]}
            >
              <View
                style={[
                  styles.feedbackIcon,
                  { backgroundColor: feedback.correct ? '#059669' : '#EF4444' },
                ]}
              >
                {feedback.correct ? (
                  <Check size={18} color="#FFFFFF" strokeWidth={3} />
                ) : (
                  <X size={18} color="#FFFFFF" strokeWidth={3} />
                )}
              </View>
              <View style={[styles.flex1, rtl ? styles.alignEnd : styles.alignStart]}>
                <Text
                  style={[
                    styles.feedbackTitle,
                    { color: feedback.correct ? '#059669' : '#DC2626' },
                  ]}
                >
                  {t(feedback.correct ? 'verbQuizCorrect' : 'verbQuizNoWorries')}
                </Text>
                <Text style={styles.feedbackSub}>
                  {t(feedback.correct ? 'verbQuizCorrectSub' : 'verbQuizNoWorriesSub')}
                </Text>
              </View>
            </View>
          )}

          <TouchableOpacity
            style={[styles.primaryBtn, rr, !feedback && !picked && styles.btnDisabled]}
            disabled={!feedback && !picked}
            onPress={() => (feedback ? next() : picked && choose(picked))}
            activeOpacity={0.88}
          >
            <Text style={[styles.primaryBtnText, !feedback && !picked && styles.btnDisabledText]}>
              {t(feedback ? 'verbQuizNext' : 'verbQuizCheck')}
            </Text>
            <ChevronIcon size={18} color={!feedback && !picked ? '#A09B90' : '#FFFFFF'} />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#FDFBF7',
  },
  rowReverse: {
    flexDirection: 'row-reverse',
  },
  textRight: {
    textAlign: 'right',
  },
  textLeft: {
    textAlign: 'left',
  },
  alignEnd: {
    alignItems: 'flex-end',
  },
  alignStart: {
    alignItems: 'flex-start',
  },
  flex1: {
    flex: 1,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 6,
  },
  closeBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.2,
    borderColor: '#F0EBE3',
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.level1,
    shadowColor: '#2C2014',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  closeSpacer: {
    width: 40,
  },
  stepChip: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 14,
    backgroundColor: '#FFF3ED',
  },
  stepChipText: {
    fontFamily: FONT_FAMILY.bold,
    fontSize: 12,
    color: '#FF6422',
  },
  progressTrack: {
    flexDirection: 'row',
    height: 6,
    borderRadius: 3,
    backgroundColor: '#F0EBE3',
    marginHorizontal: 20,
    marginTop: 10,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
    backgroundColor: '#FF6422',
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 18,
  },
  center: {
    alignItems: 'center',
    gap: 16,
    marginTop: 40,
  },
  doneIconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#FFF3ED',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  doneTitle: {
    fontFamily: FONT_FAMILY.bold,
    fontSize: 18,
    color: '#191C21',
  },
  message: {
    color: '#697082',
    fontFamily: FONT_FAMILY.medium,
    fontSize: 15,
    textAlign: 'center',
  },
  doneText: {
    color: '#697082',
    fontFamily: FONT_FAMILY.medium,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 22,
  },
  sentenceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1.2,
    borderColor: '#F0EBE3',
    padding: 16,
    ...SHADOWS.level1,
    shadowColor: '#2C2014',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
    marginBottom: 16,
  },
  playBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#FFF3ED',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sentence: {
    flex: 1,
    color: '#191C21',
    fontFamily: FONT_FAMILY.semiBold,
    fontSize: 17,
    lineHeight: 26,
    writingDirection: 'ltr',
    textAlign: 'left',
  },
  questionWrap: {
    marginBottom: 14,
    gap: 4,
  },
  question: {
    color: '#191C21',
    fontFamily: FONT_FAMILY.bold,
    fontSize: 16.5,
    lineHeight: 25,
  },
  formChip: {
    color: '#FF6422',
    backgroundColor: '#FFF3ED',
  },
  questionHint: {
    color: '#8E95A5',
    fontFamily: FONT_FAMILY.regular,
    fontSize: 12,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1.2,
    borderColor: '#F0EBE3',
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 10,
    ...SHADOWS.level1,
    shadowColor: '#2C2014',
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
  },
  optionPicked: {
    borderColor: '#FF6422',
    backgroundColor: '#FFF8F4',
  },
  optionCorrect: {
    borderColor: '#059669',
    backgroundColor: '#F0FDF4',
  },
  optionWrong: {
    borderColor: '#EF4444',
    backgroundColor: '#FEF2F2',
  },
  optionBody: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  optionText: {
    color: '#191C21',
    fontFamily: FONT_FAMILY.bold,
    fontSize: 14.5,
  },
  textRightColor: {
    color: '#059669',
  },
  textWrongColor: {
    color: '#DC2626',
  },
  enChip: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 8,
    backgroundColor: '#F5F1E8',
  },
  enChipText: {
    fontFamily: FONT_FAMILY.semiBold,
    fontSize: 12,
    color: '#697082',
  },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: '#D4CEBF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioOn: {
    borderColor: '#FF6422',
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#FF6422',
  },
  radioRight: {
    backgroundColor: '#059669',
    borderColor: '#059669',
  },
  radioWrong: {
    backgroundColor: '#EF4444',
    borderColor: '#EF4444',
  },
  letter: {
    width: 26,
    height: 26,
    borderRadius: 8,
    backgroundColor: '#F5F1E8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  letterText: {
    fontFamily: FONT_FAMILY.bold,
    fontSize: 12,
    color: '#8E95A5',
  },
  tag: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  tagText: {
    fontFamily: FONT_FAMILY.bold,
    fontSize: 11,
  },
  correctionBox: {
    padding: 12,
    backgroundColor: '#FEF2F2',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#FEE2E2',
    marginTop: 6,
  },
  correction: {
    textAlign: 'center',
    fontFamily: FONT_FAMILY.medium,
    fontSize: 13,
    color: '#DC2626',
  },
  correctionMeaning: {
    textDecorationLine: 'underline',
    fontFamily: FONT_FAMILY.bold,
  },
  footer: {
    paddingHorizontal: 20,
    paddingTop: 12,
    gap: 12,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderTopWidth: 1.2,
    borderColor: '#F0EBE3',
    ...SHADOWS.level2,
    shadowColor: '#2C2014',
    shadowOpacity: 0.08,
    shadowRadius: 14,
    elevation: 8,
  },
  feedbackCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 18,
    borderWidth: 1,
  },
  feedbackGood: {
    backgroundColor: '#F0FDF4',
    borderColor: '#BBF7D0',
  },
  feedbackBad: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
  },
  feedbackIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  feedbackTitle: {
    fontFamily: FONT_FAMILY.bold,
    fontSize: 14,
  },
  feedbackSub: {
    fontFamily: FONT_FAMILY.regular,
    fontSize: 12,
    color: '#697082',
  },
  primaryBtn: {
    flexDirection: 'row',
    gap: 8,
    backgroundColor: '#FF6422',
    borderRadius: 18,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'stretch',
    shadowColor: '#FF6422',
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 3,
  },
  btnDisabled: {
    backgroundColor: '#EAE6DD',
    shadowOpacity: 0,
    elevation: 0,
  },
  btnDisabledText: {
    color: '#A09B90',
  },
  primaryBtnText: {
    color: '#FFFFFF',
    fontFamily: FONT_FAMILY.bold,
    fontSize: 15,
  },
});
