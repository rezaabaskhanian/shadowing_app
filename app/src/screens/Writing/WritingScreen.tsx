import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CircleCheck, CircleX, Lock, PenLine, TriangleAlert, X } from 'lucide-react-native';

import { COLORS, SPACING, BORDER_RADIUS, hexToRgba } from '../../theme/colors';
import { FONT_FAMILY, TEXT_STYLES } from '../../theme/typography';
import { useLanguage } from '../../data/i18n';
import { ForbiddenError } from '../../api/client';
import { getAIUsageStatus } from '../../api/aiUsage';
import { submitWriting, type WritingPrompt, type WritingResult } from '../../api/writing';
import { track } from '../../services/analytics';
import { RiseIn } from '../../components/RiseIn';
import { absUrl } from '../../api/config';
import { ACCENT_CYCLE, PromptHero, levelColor } from '../../components/ContentVisuals';

type Phase = 'write' | 'checking' | 'result' | 'locked';

const onTopicMeta = (value: string) => {
  if (value === 'yes') return { Icon: CircleCheck, color: COLORS.success, labelKey: 'placementRelevanceYes' };
  if (value === 'partial') return { Icon: TriangleAlert, color: COLORS.warning, labelKey: 'placementRelevancePartial' };
  return { Icon: CircleX, color: COLORS.muted, labelKey: 'placementRelevanceNo' };
};

const scoreColor = (score: number) => {
  if (score >= 75) return COLORS.success;
  if (score >= 50) return COLORS.warning;
  return COLORS.error;
};

const countWords = (text: string) => (text.trim() ? text.trim().split(/\s+/).length : 0);

/**
 * «تمرین نوشتن»: کاربر ایده‌ها و ساختارهای پیشنهادی را می‌بیند (لمس هر عبارت
 * آن را به متن اضافه می‌کند)، داستانش را می‌نویسد و تصحیح کامل می‌گیرد: امتیاز،
 * اشتباه‌ها با توضیح گرامری، عبارت‌های بهتر، ساختارهایی که بهتر است استفاده کند
 * و نسخه‌ی بهترشده. با «ویرایش و ارسال دوباره» همان متن برمی‌گردد تا درستش کند.
 */
export const WritingScreen: React.FC = () => {
  const { t, language } = useLanguage();
  // فارسی: بستن سمت راست و برچسب‌ها راست‌چین؛ پرسش‌ها و عبارت‌های انگلیسی چپ‌چین می‌مانند.
  const rtl = language === 'fa';
  const ta = rtl ? styles.textRight : styles.textLeft;
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const prompt: WritingPrompt | undefined = route.params?.prompt;

  const [phase, setPhase] = useState<Phase>('write');
  const [text, setText] = useState('');
  const [result, setResult] = useState<WritingResult | null>(null);
  const [errorText, setErrorText] = useState<string | null>(null);
  const [hasActiveSubscription, setHasActiveSubscription] = useState(true);

  const words = countWords(text);
  const minWords = prompt?.min_words ?? 30;
  const maxWords = prompt?.max_words ?? 150;
  const canSubmit = words >= Math.floor(minWords * 0.8);

  const insertPhrase = (phrase: string) => {
    // «...» در عبارت‌های پیشنهادی جای خالی است؛ بدون آن اضافه می‌شود تا کاربر کامل کند.
    const clean = phrase.replace(/\s*(\.\.\.|…)\s*$/, ' ').replace(/(\.\.\.|…)/g, '');
    setText((prev) => (prev && !/\s$/.test(prev) ? `${prev} ${clean}` : prev + clean));
  };

  const handleSubmit = useCallback(() => {
    if (!prompt || !canSubmit) return;
    setErrorText(null);
    setPhase('checking');
    track('writing_submitted', prompt.id);
    submitWriting(prompt.id, text)
      .then((res) => {
        setResult(res);
        setPhase('result');
      })
      .catch(async (err) => {
        if (err instanceof ForbiddenError) {
          try {
            const s = await getAIUsageStatus();
            setHasActiveSubscription(s.has_active_subscription);
          } catch {
            setHasActiveSubscription(false);
          }
          setPhase('locked');
          return;
        }
        setErrorText(err instanceof Error ? err.message : null);
        setPhase('write');
      });
  }, [prompt, text, canSubmit]);

  if (!prompt) {
    return (
      <View style={[styles.container, styles.center, { paddingTop: insets.top }]}>
        <Text style={styles.mutedText}>{t('topicSpeakingLoadError')}</Text>
      </View>
    );
  }

  const meta = result ? onTopicMeta(result.on_topic) : null;

  return (
    <KeyboardAvoidingView
      style={[styles.container, { paddingTop: insets.top + SPACING.s, paddingBottom: insets.bottom + SPACING.m }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={[styles.topRow, rtl && styles.rowReverse]}>
        <TouchableOpacity
          style={styles.closeBtn}
          onPress={() => navigation.goBack()}
          disabled={phase === 'checking'}
          activeOpacity={0.8}
        >
          <X size={18} color={COLORS.text} />
        </TouchableOpacity>
        <View style={styles.topChip}>
          <Text style={styles.topChipText}>{t('writingPracticeChip')}</Text>
        </View>
        <View style={styles.closeBtnSpacer} />
      </View>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <PromptHero
          image={prompt.image_url ? { uri: absUrl(prompt.image_url) } : null}
          accent={levelColor(prompt.level)}
          icon={<PenLine size={14} color={COLORS.white} />}
          title={prompt.title}
          prompt={prompt.prompt_fa}
          badgeLabel={LEVEL_LABEL[prompt.level] ? t('levelBadge').replace('{level}', t(LEVEL_LABEL[prompt.level])) : undefined}
        />

        {phase === 'write' && (
          <>
            {prompt.guide_questions.length > 0 && (
              <View style={[styles.card, styles.ideasCard]}>
                <Text style={[styles.cardLabel, styles.cardLabelStrong, ta]}>💡 {t('writingIdeasTitle')}</Text>
                {prompt.guide_questions.map((q, i) => (
                  <View key={i} style={[styles.numberedRow, rtl && styles.rowReverse]}>
                    <View style={[styles.numDot, { backgroundColor: ACCENT_CYCLE[i % ACCENT_CYCLE.length] }]}>
                      <Text style={styles.numDotText}>{i + 1}</Text>
                    </View>
                    <Text style={[styles.listItem, styles.flex1, styles.ltrText, ta]}>{q}</Text>
                  </View>
                ))}
              </View>
            )}
            {prompt.useful_phrases.length > 0 && (
              <View style={[styles.card, styles.phrasesCard]}>
                <Text style={[styles.cardLabel, styles.cardLabelAccent, ta]}>✨ {t('writingPhrasesTitle')}</Text>
                <View style={[styles.chips, rtl && styles.rowReverse]}>
                  {prompt.useful_phrases.map((p, i) => {
                    const c = ACCENT_CYCLE[i % ACCENT_CYCLE.length];
                    return (
                      <TouchableOpacity
                        key={i}
                        style={[styles.chip, { backgroundColor: hexToRgba(c, 0.1), borderColor: hexToRgba(c, 0.35) }]}
                        onPress={() => insertPhrase(p)}
                        activeOpacity={0.8}
                      >
                        <Text style={[styles.chipText, { color: c }]}>+ {p}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
                <Text style={[styles.mutedSmall, ta]}>{t('writingPhrasesHint')}</Text>
              </View>
            )}
            <View style={styles.inputCard}>
            <TextInput
              style={styles.input}
              value={text}
              onChangeText={setText}
              multiline
              textAlignVertical="top"
              placeholder={t('writingPlaceholder')}
              placeholderTextColor={COLORS.muted}
              autoCorrect={false}
              spellCheck={false}
            />
            <View style={[styles.inputFooter, rtl && styles.rowReverse]}>
              <View style={[styles.wordCountRow, rtl && styles.rowReverse]}>
              <View style={[styles.wordDot, words >= minWords && styles.wordDotOk]} />
              <Text style={[styles.wordCount, words > maxWords && styles.wordCountOver]}>
                {t('writingWordCount')
                  .replace('{n}', String(words))
                  .replace('{min}', String(minWords))
                  .replace('{max}', String(maxWords))}
              </Text>
              </View>
              <TouchableOpacity onPress={() => setText('')} disabled={!text} hitSlop={8}>
                <Text style={styles.clearText}>{t('writingClear')}</Text>
              </TouchableOpacity>
            </View>
            </View>
            {!!errorText && <Text style={styles.errorText}>{errorText}</Text>}
          </>
        )}

        {phase === 'checking' && (
          <View style={styles.centerBlock}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={styles.mutedText}>{t('writingChecking')}</Text>
          </View>
        )}

        {phase === 'locked' && (
          <View style={styles.centerBlock}>
            <Lock size={28} color={COLORS.textSecondary} />
            <Text style={styles.mutedText}>
              {t(hasActiveSubscription ? 'topicSpeakingLockedQuota' : 'writingLockedNoSub')}
            </Text>
            <TouchableOpacity
              style={styles.primaryBtn}
              onPress={() => navigation.navigate(hasActiveSubscription ? 'TokenTopup' : 'Paywall')}
              activeOpacity={0.85}
            >
              <Text style={styles.primaryBtnText}>
                {t(hasActiveSubscription ? 'aiConversationBuyTokensBtn' : 'aiConversationSubscribeBtn')}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {phase === 'result' && result && meta && (
          <>
            <RiseIn i={0} style={[styles.card, styles.scoreCard]}>
              <View style={[styles.scoreCircle, { borderColor: scoreColor(result.score) }]}>
                <Text style={[styles.scoreValue, { color: scoreColor(result.score) }]}>{result.score}</Text>
                <Text style={styles.mutedSmall}>{t('topicSpeakingScore')}</Text>
              </View>
              <View style={styles.flex}>
                <View style={styles.onTopicRow}>
                  <meta.Icon size={16} color={meta.color} />
                  <Text style={[styles.onTopicText, { color: meta.color }]}>{t(meta.labelKey)}</Text>
                </View>
                <Text style={styles.mutedSmall}>{t('writingWords').replace('{n}', String(result.word_count))}</Text>
                {!!result.summary_fa && <Text style={styles.summary}>{result.summary_fa}</Text>}
              </View>
            </RiseIn>

            {result.strengths_fa.length > 0 && (
              <RiseIn i={1} style={styles.card}>
                <Text style={styles.cardLabel}>{t('topicSpeakingStrengths')}</Text>
                {result.strengths_fa.map((s, i) => (
                  <Text key={i} style={styles.listItem}>
                    ✓ {s}
                  </Text>
                ))}
              </RiseIn>
            )}

            <RiseIn i={2} style={styles.card}>
              <Text style={styles.cardLabel}>{t('topicSpeakingMistakes')}</Text>
              {result.mistakes.length === 0 ? (
                <Text style={styles.listItem}>{t('topicSpeakingNoMistakes')}</Text>
              ) : (
                result.mistakes.map((m, i) => (
                  <RiseIn key={i} i={3 + i} style={[styles.fixItem, i > 0 && styles.fixDivider]}>
                    <Text style={styles.wrongText}>{m.original}</Text>
                    <Text style={styles.rightText}>{m.corrected}</Text>
                    {!!m.explanation_fa && <Text style={styles.explain}>{m.explanation_fa}</Text>}
                  </RiseIn>
                ))
              )}
            </RiseIn>

            {result.structures.length > 0 && (
              <RiseIn i={3} style={styles.card}>
                <Text style={styles.cardLabel}>{t('writingStructures')}</Text>
                {result.structures.map((st, i) => (
                  <RiseIn key={i} i={4 + i} style={[styles.fixItem, i > 0 && styles.fixDivider]}>
                    <Text style={styles.structureText}>{st.structure}</Text>
                    {!!st.example && <Text style={styles.exampleText}>{st.example}</Text>}
                    {!!st.note_fa && <Text style={styles.explain}>{st.note_fa}</Text>}
                  </RiseIn>
                ))}
              </RiseIn>
            )}

            {result.better_phrases.length > 0 && (
              <RiseIn i={4} style={styles.card}>
                <Text style={styles.cardLabel}>{t('topicSpeakingBetter')}</Text>
                {result.better_phrases.map((p, i) => (
                  <RiseIn key={i} i={5 + i} style={[styles.fixItem, i > 0 && styles.fixDivider]}>
                    <Text style={styles.explain}>
                      {t('topicSpeakingInsteadOf')}: <Text style={styles.plainEn}>{p.instead_of}</Text>
                    </Text>
                    <Text style={styles.rightText}>
                      {t('writingWrite')}: {p.try}
                    </Text>
                    {!!p.note_fa && <Text style={styles.explain}>{p.note_fa}</Text>}
                  </RiseIn>
                ))}
              </RiseIn>
            )}

            {result.used_phrases.length > 0 && (
              <RiseIn i={5} style={styles.card}>
                <Text style={styles.cardLabel}>{t('topicSpeakingUsedPhrases')}</Text>
                <View style={styles.chips}>
                  {result.used_phrases.map((p, i) => (
                    <View key={i} style={[styles.chip, styles.chipDone]}>
                      <Text style={styles.chipText}>{p}</Text>
                    </View>
                  ))}
                </View>
              </RiseIn>
            )}

            {!!result.improved_version && (
              <RiseIn i={6} style={styles.card}>
                <Text style={styles.cardLabel}>{t('writingImproved')}</Text>
                <Text style={styles.paragraph}>{result.improved_version}</Text>
              </RiseIn>
            )}
          </>
        )}
      </ScrollView>

      {phase === 'write' && (
        <TouchableOpacity
          style={[styles.primaryBtn, styles.submitBtn, rtl && styles.rowReverse, !canSubmit && styles.disabled]}
          onPress={handleSubmit}
          disabled={!canSubmit}
          activeOpacity={0.85}
        >
          <Text style={styles.primaryBtnText}>{t('writingSubmit')}</Text>
          <CircleCheck size={18} color={COLORS.white} />
        </TouchableOpacity>
      )}

      {phase === 'result' && (
        <View style={styles.bottomRow}>
          <TouchableOpacity style={[styles.primaryBtn, styles.flex]} onPress={() => setPhase('write')} activeOpacity={0.85}>
            <Text style={styles.primaryBtnText}>{t('writingEditAgain')}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.secondaryBtn, styles.flex]} onPress={() => navigation.goBack()} activeOpacity={0.85}>
            <Text style={styles.secondaryBtnText}>{t('topicSpeakingOtherTopics')}</Text>
          </TouchableOpacity>
        </View>
      )}
    </KeyboardAvoidingView>
  );
};

const LEVEL_LABEL: Record<string, string> = {
  starter: 'levelStarter',
  beginner: 'levelBeginner',
  intermediate: 'levelIntermediate',
  advanced: 'levelAdvanced',
  proficient: 'levelProficient',
};

const styles = StyleSheet.create({
  rowReverse: { flexDirection: 'row-reverse' },
  ltrText: { writingDirection: 'ltr' },
  wordCountRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  wordDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#C9CCD4' },
  wordDotOk: { backgroundColor: COLORS.success },
  textRight: { textAlign: 'right' },
  textLeft: { textAlign: 'left' },
  closeBtnSpacer: { width: 36 },
  topChip: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 10, backgroundColor: '#FDEBE4' },
  topChipText: { fontFamily: FONT_FAMILY.bold, fontSize: 11, color: COLORS.primary },
  cardLabelStrong: { color: COLORS.text, fontFamily: FONT_FAMILY.bold },
  cardLabelAccent: { color: '#C2410C', fontFamily: FONT_FAMILY.bold },
  phrasesCard: { backgroundColor: '#FFFBF3', borderColor: '#F6EAD3' },
  inputCard: { backgroundColor: COLORS.white, borderRadius: 18, borderWidth: 1, borderColor: '#EEEEF2', padding: SPACING.m, gap: 10 },
  inputFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: '#F2F2F5', paddingTop: 8 },
  clearText: { fontFamily: FONT_FAMILY.medium, fontSize: 11, color: COLORS.muted },
  submitBtn: { flexDirection: 'row', justifyContent: 'center', gap: 8, borderRadius: 16, backgroundColor: '#E2643A' },
  container: { flex: 1, backgroundColor: '#FAF9F6', paddingHorizontal: SPACING.l },
  center: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  flex: {
    flex: 1,
  },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  closeBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#EEF0F4', alignItems: 'center', justifyContent: 'center' },
  content: {
    flexGrow: 1,
    paddingVertical: SPACING.m,
    gap: SPACING.m,
  },
  title: {
    ...TEXT_STYLES.headlineSm,
    color: COLORS.text,
    textAlign: 'center',
  },
  prompt: {
    ...TEXT_STYLES.bodyMd,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  card: { backgroundColor: COLORS.white, borderRadius: 18, borderWidth: 1, borderColor: '#EEEEF2', padding: SPACING.m, gap: 8 },
  cardLabel: {
    fontFamily: FONT_FAMILY.semiBold,
    fontSize: 13,
    color: COLORS.textSecondary,
    marginBottom: 2,
  },
  listItem: {
    ...TEXT_STYLES.bodyMd,
    color: COLORS.text,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  chip: { backgroundColor: COLORS.primaryLight, borderRadius: 14, borderWidth: 1, borderColor: 'transparent', paddingHorizontal: 10, paddingVertical: 5 },
  ideasCard: { backgroundColor: COLORS.white },
  numberedRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.s,
  },
  numDot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  numDotText: {
    color: COLORS.white,
    fontFamily: FONT_FAMILY.bold,
    fontSize: 11,
  },
  flex1: {
    flex: 1,
  },
  chipDone: {
    backgroundColor: COLORS.successLight,
  },
  chipText: {
    ...TEXT_STYLES.labelMd,
    fontSize: 12,
    color: COLORS.text,
  },
  input: { minHeight: 160, ...TEXT_STYLES.bodyLg, color: COLORS.text, padding: 0 },
  wordCount: { ...TEXT_STYLES.labelSm, color: COLORS.muted },
  wordCountOver: {
    color: COLORS.warning,
  },
  centerBlock: {
    alignItems: 'center',
    gap: SPACING.s,
    paddingVertical: SPACING.l,
  },
  mutedText: {
    ...TEXT_STYLES.bodyMd,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  mutedSmall: {
    ...TEXT_STYLES.labelSm,
    color: COLORS.muted,
  },
  errorText: {
    ...TEXT_STYLES.labelMd,
    color: COLORS.error,
    textAlign: 'center',
  },
  scoreCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.m,
  },
  scoreCircle: {
    width: 76,
    height: 76,
    borderRadius: 38,
    borderWidth: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreValue: {
    fontFamily: FONT_FAMILY.bold,
    fontSize: 24,
  },
  onTopicRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  onTopicText: {
    fontFamily: FONT_FAMILY.semiBold,
    fontSize: 13,
  },
  summary: {
    ...TEXT_STYLES.labelMd,
    color: COLORS.text,
    marginTop: 4,
  },
  fixItem: {
    gap: 2,
    paddingVertical: 4,
  },
  fixDivider: {
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: SPACING.s,
  },
  wrongText: {
    ...TEXT_STYLES.bodyMd,
    color: COLORS.error,
    textDecorationLine: 'line-through',
  },
  rightText: {
    ...TEXT_STYLES.bodyMd,
    color: COLORS.success,
    fontFamily: FONT_FAMILY.semiBold,
  },
  structureText: {
    ...TEXT_STYLES.bodyMd,
    color: COLORS.primary,
    fontFamily: FONT_FAMILY.semiBold,
  },
  exampleText: {
    ...TEXT_STYLES.bodyMd,
    color: COLORS.text,
    fontStyle: 'italic',
  },
  plainEn: {
    color: COLORS.text,
  },
  explain: {
    ...TEXT_STYLES.labelMd,
    color: COLORS.textSecondary,
  },
  paragraph: {
    ...TEXT_STYLES.bodyMd,
    color: COLORS.text,
    lineHeight: 22,
  },
  bottomRow: {
    flexDirection: 'row',
    gap: SPACING.s,
    paddingTop: SPACING.s,
  },
  primaryBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.l,
    paddingVertical: SPACING.m,
    paddingHorizontal: SPACING.l,
    alignItems: 'center',
  },
  primaryBtnText: {
    color: COLORS.white,
    fontFamily: FONT_FAMILY.bold,
    fontSize: 15,
  },
  secondaryBtn: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.l,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingVertical: SPACING.m,
    paddingHorizontal: SPACING.l,
    alignItems: 'center',
  },
  secondaryBtnText: {
    color: COLORS.text,
    fontFamily: FONT_FAMILY.semiBold,
    fontSize: 15,
  },
  disabled: {
    opacity: 0.5,
  },
});
