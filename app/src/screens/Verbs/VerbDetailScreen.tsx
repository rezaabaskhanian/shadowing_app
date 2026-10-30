import React, { useCallback, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { BookOpen, CheckCircle2, ChevronLeft, ChevronRight, Lightbulb, Mic, Play, Target } from 'lucide-react-native';

import { COLORS, BORDER_RADIUS } from '../../theme/colors';
import { FONT_FAMILY } from '../../theme/typography';
import { useLanguage } from '../../data/i18n';
import { useScenes } from '../../data/ScenesContext';
import { useVocab } from '../../data/VocabContext';
import { AudioPlayer } from '../../components/AudioPlayer';
import { verbKeys } from '../../components/VerbList';
import { absUrl } from '../../api/config';
import { getVerb, type VerbMeaningView } from '../../api/verbs';
import type { AudioActionCommand } from '../SceneScreen/types';

/** جمله را با شکل فعل پررنگ نشان می‌دهد. */
export const SentenceWithForm: React.FC<{ sentence: string; form: string; style?: any }> = ({ sentence, form, style }) => {
  if (!form) return <Text style={style}>{sentence}</Text>;
  const parts = sentence.split(new RegExp(`\\b(${form})\\b`, 'i'));
  return (
    <Text style={style}>
      {parts.map((p, i) =>
        p.toLowerCase() === form.toLowerCase() ? (
          <Text key={i} style={styles.formHighlight}>
            {p}
          </Text>
        ) : (
          p
        )
      )}
    </Text>
  );
};

/**
 * صفحه‌ی یک فعل چندمعنایی: هر معنا با جمله‌های واقعی درس‌ها (صدای همان درس)،
 * وضعیت یادگیری، افزودن به لایتنر، تمرین صوتی، و دکمه‌ی آزمون تشخیص.
 */
export const VerbDetailScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const verbId: string = route.params?.verbId;
  const { t, language } = useLanguage();
  const { scenes } = useScenes();
  const { add } = useVocab();
  const queryClient = useQueryClient();

  const { data: verb, isLoading, refetch } = useQuery({
    queryKey: verbKeys.detail(verbId),
    queryFn: () => getVerb(verbId),
    enabled: !!verbId,
  });
  // بعد از برگشت از آزمون/تمرین صوتی، وضعیت‌ها تازه شوند.
  useFocusEffect(
    useCallback(() => {
      if (verbId) refetch();
    }, [verbId, refetch])
  );

  const [audioUri, setAudioUri] = useState<string | null>(null);
  const [actionCommand, setActionCommand] = useState<AudioActionCommand>('none');
  const [actionNonce, setActionNonce] = useState(0);
  const play = (url: string) => {
    setAudioUri(absUrl(url));
    setActionCommand('play_original');
    setActionNonce((n) => n + 1);
  };

  const openLesson = (sceneId: string) => {
    const scene = scenes.find((s) => s.id === sceneId);
    if (!scene) return;
    if (scene.isLocked) navigation.navigate('Paywall');
    else navigation.navigate('Shadowing', { scenarioId: sceneId, returnTo: 'VerbDetail', returnParams: route.params });
  };

  const addToLeitner = (m: VerbMeaningView) => {
    const sentence = m.examples[0]?.sentence || m.fallback_example;
    if (!verb || !sentence) return;
    add({ word: sentence, meaning: `${verb.lemma} = ${m.meaning_fa}`, verbMeaningId: m.id });
    // کارت سمت سرور هم‌زمان ساخته می‌شود؛ کمی بعد وضعیت را دوباره می‌خوانیم.
    setTimeout(() => {
      queryClient.invalidateQueries({ queryKey: verbKeys.detail(verbId) });
      queryClient.invalidateQueries({ queryKey: verbKeys.list });
    }, 800);
  };

  const rtl = language === 'fa';
  const row = rtl && styles.rowReverse;
  const align = rtl && styles.textRight;
  const num = (n: number) => n.toLocaleString(rtl ? 'fa-IR' : 'en-US');

  const learnedCount = verb ? verb.meanings.filter((m) => m.learned).length : 0;
  const total = verb ? verb.meanings.length : 0;

  return (
    <View style={styles.screen}>
      <AudioPlayer uri={audioUri} shouldPlay={false} actionCommand={actionCommand} actionNonce={actionNonce} />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={[styles.topBar, row]}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => (navigation.canGoBack() ? navigation.goBack() : navigation.navigate('Home'))}
          >
            {rtl ? <ChevronRight color={COLORS.text} size={22} /> : <ChevronLeft color={COLORS.text} size={22} />}
          </TouchableOpacity>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{t('verbBadge')}</Text>
          </View>
          <View style={styles.topBarSpacer} />
        </View>

        {isLoading || !verb ? (
          <ActivityIndicator color={COLORS.primary} style={styles.loader} />
        ) : (
          <>
            <Text style={[styles.lemma, align]}>{verb.lemma}</Text>
            <View style={[styles.progressRow, row]}>
              <View style={styles.progressDot} />
              <Text style={styles.sub}>
                {t('verbLearnedOf').replace('{learned}', num(learnedCount)).replace('{total}', num(total))}
              </Text>
              <View style={styles.progressTrack}>
                <View
                  style={[
                    styles.progressFill,
                    rtl && styles.progressFillRtl,
                    { width: `${total ? Math.max(4, (learnedCount / total) * 100) : 0}%` },
                  ]}
                />
              </View>
            </View>

            <TouchableOpacity
              style={[styles.quizBtn, row]}
              activeOpacity={0.85}
              onPress={() => navigation.navigate('VerbQuiz', { verbId, lemma: verb.lemma })}
            >
              <View style={styles.quizIcon}>
                <Target size={18} color={COLORS.white} />
              </View>
              <Text style={[styles.quizBtnText, align]}>{t('verbStartQuiz')}</Text>
              {rtl ? <ChevronLeft size={20} color={COLORS.white} /> : <ChevronRight size={20} color={COLORS.white} />}
            </TouchableOpacity>

            <View style={[styles.ruleCard, row]}>
              <View style={styles.ruleIcon}>
                <Lightbulb size={16} color={COLORS.warningDeep} />
              </View>
              <Text style={[styles.rule, align]}>{t('verbLearnedRule')}</Text>
            </View>

            <Text style={[styles.sectionTitle, align]}>{t('verbMeaningsTitle')}</Text>
            {verb.meanings.map((m, idx) => (
              <View key={m.id} style={[styles.card, !m.seen && m.examples.length > 0 && styles.cardUnseen]}>
                <View style={[styles.cardHeader, row]}>
                  <View style={styles.indexCircle}>
                    <Text style={styles.indexText}>{num(idx + 1)}</Text>
                  </View>
                  <Text style={[styles.meaning, align]}>{m.meaning_fa}</Text>
                  {m.learned && (
                    <View style={[styles.learnedBadge, row]}>
                      <CheckCircle2 size={12} color={COLORS.success} />
                      <Text style={styles.learnedBadgeText}>{t('verbStatusLearned')}</Text>
                    </View>
                  )}
                </View>
                {!!m.explanation_fa && <Text style={[styles.explanation, align]}>{m.explanation_fa}</Text>}

                {m.examples.length > 0 ? (
                  m.examples.slice(0, 2).map((ex, i) => (
                    <View key={i} style={styles.example}>
                      <View style={styles.exampleRow}>
                        <SentenceWithForm sentence={ex.sentence} form={ex.form} style={styles.sentence} />
                        {!!ex.audio_url && (
                          <TouchableOpacity style={styles.playBtn} onPress={() => play(ex.audio_url)} hitSlop={8}>
                            <Play size={13} color={COLORS.primary} fill={COLORS.primary} />
                          </TouchableOpacity>
                        )}
                      </View>
                      {!!ex.translation && <Text style={[styles.translation, align]}>{ex.translation}</Text>}
                      <View style={[styles.exampleFooter, row]}>
                        <Text style={[styles.sceneTitle, align]} numberOfLines={1}>
                          {t('verbHeardIn').replace('{scene}', ex.scene_title)}
                        </Text>
                        {scenes.some((s) => s.id === ex.scene_id) && (
                          <TouchableOpacity style={[styles.linkRow, row]} onPress={() => openLesson(ex.scene_id)} hitSlop={8}>
                            <Text style={styles.link}>{t('verbGoToLesson')}</Text>
                            {rtl ? <ChevronLeft size={14} color={COLORS.primaryDark} /> : <ChevronRight size={14} color={COLORS.primaryDark} />}
                          </TouchableOpacity>
                        )}
                      </View>
                    </View>
                  ))
                ) : (
                  <View style={styles.example}>
                    {!!m.fallback_example && (
                      <SentenceWithForm sentence={m.fallback_example} form={verb.lemma} style={styles.sentence} />
                    )}
                    <Text style={[styles.sceneTitle, align]}>{t('verbNoLessonExample')}</Text>
                  </View>
                )}

                <View style={[styles.statusRow, row]}>
                  <Text style={styles.statusLabel}>{t('verbStatusTitle')}</Text>
                  <View style={[styles.statusChips, row]}>
                    <View style={styles.statusChip}>
                      <Text style={styles.statusChipText}>
                        {t('verbStatusRecognition')
                          .replace('{n}', num(Math.min(m.recognition_correct, m.recognition_target)))
                          .replace('{target}', num(m.recognition_target))}
                      </Text>
                    </View>
                    {m.spoken_ok && (
                      <View style={[styles.statusChip, styles.statusChipDone]}>
                        <Text style={[styles.statusChipText, styles.statusChipTextDone]}>{t('verbStatusSpoken')}</Text>
                      </View>
                    )}
                  </View>
                </View>

                <View style={[styles.actions, row]}>
                  <TouchableOpacity
                    style={[styles.actionBtn, row, m.in_leitner && styles.actionBtnDone]}
                    disabled={m.in_leitner}
                    onPress={() => addToLeitner(m)}
                  >
                    <BookOpen size={15} color={m.in_leitner ? COLORS.muted : COLORS.text} />
                    <Text style={[styles.actionText, m.in_leitner && styles.actionTextDone]}>
                      {m.in_leitner ? t('verbInLeitner') : t('verbAddToLeitner')}
                    </Text>
                  </TouchableOpacity>
                  {!!m.practice_prompt_fa && (
                    <TouchableOpacity
                      style={[styles.actionBtn, row]}
                      onPress={() =>
                        navigation.navigate('VerbSpeak', {
                          meaningId: m.id,
                          lemma: verb.lemma,
                          meaningFa: m.meaning_fa,
                          promptFa: m.practice_prompt_fa,
                        })
                      }
                    >
                      <Mic size={15} color={COLORS.primary} />
                      <Text style={styles.actionText}>{t('verbSpeakPractice')}</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            ))}
          </>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  rowReverse: { flexDirection: 'row-reverse' },
  textRight: { textAlign: 'right' },
  screen: { flex: 1, backgroundColor: COLORS.backgroundSoft },
  content: { paddingHorizontal: 20, paddingTop: 48, paddingBottom: 60 },
  loader: { marginTop: 40 },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 },
  topBarSpacer: { width: 40 },
  backButton: {
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
    backgroundColor: COLORS.surfaceLight,
    borderRadius: BORDER_RADIUS.full,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  badgeText: { color: COLORS.textSecondary, fontFamily: FONT_FAMILY.medium, fontSize: 11 },
  // خودِ فعل انگلیسی است ولی مثل ماکاپ در فارسی سمت راست می‌نشیند.
  lemma: { color: COLORS.text, fontFamily: FONT_FAMILY.bold, fontSize: 44, lineHeight: 54 },
  progressRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6 },
  progressDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.primary },
  sub: { color: COLORS.textSecondary, fontFamily: FONT_FAMILY.medium, fontSize: 12 },
  progressTrack: {
    flex: 1,
    height: 5,
    borderRadius: 3,
    backgroundColor: COLORS.surfaceHigh,
    overflow: 'hidden',
  },
  progressFill: { height: '100%', borderRadius: 3, backgroundColor: COLORS.primary },
  progressFillRtl: { alignSelf: 'flex-end' },
  quizBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: COLORS.primary,
    borderRadius: 18,
    paddingHorizontal: 14,
    height: 60,
    marginTop: 20,
  },
  quizIcon: {
    width: 34,
    height: 34,
    borderRadius: 11,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  quizBtnText: { flex: 1, color: COLORS.white, fontFamily: FONT_FAMILY.bold, fontSize: 15 },
  ruleCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: '#FFF8E6',
    borderWidth: 1,
    borderColor: '#F6E7BE',
    borderRadius: 16,
    padding: 12,
    marginTop: 12,
  },
  ruleIcon: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: COLORS.secondaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rule: { flex: 1, color: COLORS.textSecondary, fontFamily: FONT_FAMILY.regular, fontSize: 12, lineHeight: 20 },
  sectionTitle: { color: COLORS.text, fontFamily: FONT_FAMILY.bold, fontSize: 18, marginTop: 24, marginBottom: 12 },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    padding: 16,
    marginBottom: 12,
  },
  cardUnseen: { borderColor: COLORS.primary },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  indexCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: COLORS.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  indexText: { color: COLORS.textSecondary, fontFamily: FONT_FAMILY.bold, fontSize: 12 },
  meaning: { color: COLORS.text, fontFamily: FONT_FAMILY.bold, fontSize: 18, flex: 1 },
  learnedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.successLight,
    borderRadius: BORDER_RADIUS.full,
    paddingHorizontal: 9,
    paddingVertical: 3,
  },
  learnedBadgeText: { color: COLORS.success, fontFamily: FONT_FAMILY.semiBold, fontSize: 11 },
  explanation: { color: COLORS.textSecondary, fontFamily: FONT_FAMILY.regular, fontSize: 13, lineHeight: 21, marginTop: 8 },
  example: {
    backgroundColor: COLORS.backgroundSoft,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    borderRadius: 16,
    padding: 12,
    marginTop: 12,
    gap: 6,
  },
  exampleRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  playBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sentence: {
    flex: 1,
    color: COLORS.text,
    fontFamily: FONT_FAMILY.medium,
    fontSize: 15,
    lineHeight: 23,
    writingDirection: 'ltr',
    textAlign: 'left',
  },
  formHighlight: { color: COLORS.primary, fontFamily: FONT_FAMILY.bold, textDecorationLine: 'underline' },
  translation: { color: COLORS.textSecondary, fontFamily: FONT_FAMILY.regular, fontSize: 12, lineHeight: 20 },
  exampleFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
    paddingTop: 8,
    marginTop: 2,
  },
  sceneTitle: { color: COLORS.muted, fontFamily: FONT_FAMILY.regular, fontSize: 11, flex: 1 },
  linkRow: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  link: { color: COLORS.primaryDark, fontFamily: FONT_FAMILY.semiBold, fontSize: 12 },
  statusRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginTop: 14 },
  statusLabel: { color: COLORS.muted, fontFamily: FONT_FAMILY.regular, fontSize: 11 },
  statusChips: { flexDirection: 'row', gap: 6 },
  statusChip: {
    backgroundColor: COLORS.surfaceLight,
    borderRadius: BORDER_RADIUS.full,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  statusChipDone: { backgroundColor: COLORS.successLight },
  statusChipText: { color: COLORS.text, fontFamily: FONT_FAMILY.semiBold, fontSize: 11 },
  statusChipTextDone: { color: COLORS.success },
  actions: { flexDirection: 'row', gap: 8, marginTop: 12 },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.white,
    borderRadius: 14,
    height: 42,
  },
  actionBtnDone: { backgroundColor: COLORS.surfaceLight, borderColor: COLORS.surfaceLight },
  actionText: { color: COLORS.text, fontFamily: FONT_FAMILY.semiBold, fontSize: 12 },
  actionTextDone: { color: COLORS.muted },
});
