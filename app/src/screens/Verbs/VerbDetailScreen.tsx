import React, { useCallback, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, BookOpen, CheckCircle2, Mic, Play, Target } from 'lucide-react-native';

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
  const { t } = useLanguage();
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
    else navigation.navigate('Shadowing', { scenarioId: sceneId });
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

  return (
    <View style={styles.screen}>
      <AudioPlayer uri={audioUri} shouldPlay={false} actionCommand={actionCommand} actionNonce={actionNonce} />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <ArrowLeft color={COLORS.text} size={22} />
        </TouchableOpacity>

        {isLoading || !verb ? (
          <ActivityIndicator color={COLORS.primary} style={{ marginTop: 40 }} />
        ) : (
          <>
            <Text style={styles.lemma}>{verb.lemma}</Text>
            <Text style={styles.sub}>
              {t('verbLearnedOf')
                .replace('{learned}', String(verb.meanings.filter((m) => m.learned).length))
                .replace('{total}', String(verb.meanings.length))}
            </Text>

            <TouchableOpacity
              style={styles.quizBtn}
              activeOpacity={0.85}
              onPress={() => navigation.navigate('VerbQuiz', { verbId, lemma: verb.lemma })}
            >
              <Target size={18} color={COLORS.white} />
              <Text style={styles.quizBtnText}>{t('verbStartQuiz')}</Text>
            </TouchableOpacity>
            <Text style={styles.rule}>{t('verbLearnedRule')}</Text>

            <Text style={styles.sectionTitle}>{t('verbMeaningsTitle')}</Text>
            {verb.meanings.map((m) => (
              <View key={m.id} style={[styles.card, !m.seen && m.examples.length > 0 && styles.cardUnseen]}>
                <View style={styles.cardHeader}>
                  <Text style={styles.meaning}>{m.meaning_fa}</Text>
                  {m.learned && (
                    <View style={styles.learnedBadge}>
                      <CheckCircle2 size={12} color={COLORS.white} />
                      <Text style={styles.learnedBadgeText}>{t('verbStatusLearned')}</Text>
                    </View>
                  )}
                </View>
                {!!m.explanation_fa && <Text style={styles.explanation}>{m.explanation_fa}</Text>}

                {m.examples.length > 0 ? (
                  m.examples.slice(0, 2).map((ex, i) => (
                    <View key={i} style={styles.example}>
                      <View style={styles.exampleRow}>
                        {!!ex.audio_url && (
                          <TouchableOpacity style={styles.playBtn} onPress={() => play(ex.audio_url)} hitSlop={8}>
                            <Play size={14} color={COLORS.primary} fill={COLORS.primary} />
                          </TouchableOpacity>
                        )}
                        <SentenceWithForm sentence={ex.sentence} form={ex.form} style={styles.sentence} />
                      </View>
                      {!!ex.translation && <Text style={styles.translation}>{ex.translation}</Text>}
                      <View style={styles.exampleFooter}>
                        <Text style={styles.sceneTitle} numberOfLines={1}>
                          {t('verbHeardIn').replace('{scene}', ex.scene_title)}
                        </Text>
                        {scenes.some((s) => s.id === ex.scene_id) && (
                          <TouchableOpacity onPress={() => openLesson(ex.scene_id)} hitSlop={8}>
                            <Text style={styles.link}>{t('verbGoToLesson')}</Text>
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
                    <Text style={styles.sceneTitle}>{t('verbNoLessonExample')}</Text>
                  </View>
                )}

                <View style={styles.statusRow}>
                  <Text style={styles.status}>
                    {t('verbStatusRecognition')
                      .replace('{n}', String(Math.min(m.recognition_correct, m.recognition_target)))
                      .replace('{target}', String(m.recognition_target))}
                  </Text>
                  {m.spoken_ok && <Text style={styles.status}>{t('verbStatusSpoken')}</Text>}
                </View>

                <View style={styles.actions}>
                  <TouchableOpacity
                    style={[styles.actionBtn, m.in_leitner && styles.actionBtnDone]}
                    disabled={m.in_leitner}
                    onPress={() => addToLeitner(m)}
                  >
                    <BookOpen size={14} color={m.in_leitner ? COLORS.muted : COLORS.info} />
                    <Text style={[styles.actionText, m.in_leitner && { color: COLORS.muted }]}>
                      {m.in_leitner ? t('verbInLeitner') : t('verbAddToLeitner')}
                    </Text>
                  </TouchableOpacity>
                  {!!m.practice_prompt_fa && (
                    <TouchableOpacity
                      style={styles.actionBtn}
                      onPress={() =>
                        navigation.navigate('VerbSpeak', {
                          meaningId: m.id,
                          lemma: verb.lemma,
                          meaningFa: m.meaning_fa,
                          promptFa: m.practice_prompt_fa,
                        })
                      }
                    >
                      <Mic size={14} color={COLORS.primary} />
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
  screen: { flex: 1, backgroundColor: COLORS.background },
  content: { paddingHorizontal: 20, paddingTop: 54, paddingBottom: 60 },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  lemma: { color: COLORS.text, fontFamily: FONT_FAMILY.bold, fontSize: 32, textAlign: 'left' },
  sub: { color: COLORS.textSecondary, fontFamily: FONT_FAMILY.regular, fontSize: 13, marginTop: 2 },
  quizBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.l,
    height: 48,
    marginTop: 16,
  },
  quizBtnText: { color: COLORS.white, fontFamily: FONT_FAMILY.bold, fontSize: 15 },
  rule: { color: COLORS.textSecondary, fontFamily: FONT_FAMILY.regular, fontSize: 11, lineHeight: 17, marginTop: 8 },
  sectionTitle: { color: COLORS.text, fontFamily: FONT_FAMILY.bold, fontSize: 16, marginTop: 20, marginBottom: 10 },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.l,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 14,
    marginBottom: 12,
  },
  cardUnseen: { borderColor: COLORS.primary },
  cardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  meaning: { color: COLORS.text, fontFamily: FONT_FAMILY.bold, fontSize: 16, flex: 1 },
  learnedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.tertiary,
    borderRadius: BORDER_RADIUS.full,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  learnedBadgeText: { color: COLORS.white, fontFamily: FONT_FAMILY.semiBold, fontSize: 11 },
  explanation: { color: COLORS.textSecondary, fontFamily: FONT_FAMILY.regular, fontSize: 13, marginTop: 4 },
  example: {
    backgroundColor: COLORS.surfaceLight,
    borderRadius: BORDER_RADIUS.m,
    padding: 10,
    marginTop: 10,
    gap: 4,
  },
  exampleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  playBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sentence: {
    flex: 1,
    color: COLORS.text,
    fontFamily: FONT_FAMILY.medium,
    fontSize: 15,
    writingDirection: 'ltr',
    textAlign: 'left',
  },
  formHighlight: { color: COLORS.primary, fontFamily: FONT_FAMILY.bold },
  translation: { color: COLORS.textSecondary, fontFamily: FONT_FAMILY.regular, fontSize: 12 },
  exampleFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  sceneTitle: { color: COLORS.muted, fontFamily: FONT_FAMILY.regular, fontSize: 11, flex: 1 },
  link: { color: COLORS.primary, fontFamily: FONT_FAMILY.semiBold, fontSize: 12 },
  statusRow: { flexDirection: 'row', gap: 12, marginTop: 10 },
  status: { color: COLORS.textSecondary, fontFamily: FONT_FAMILY.medium, fontSize: 12 },
  actions: { flexDirection: 'row', gap: 8, marginTop: 10 },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.full,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  actionBtnDone: { backgroundColor: COLORS.surfaceLight },
  actionText: { color: COLORS.text, fontFamily: FONT_FAMILY.medium, fontSize: 12 },
});
