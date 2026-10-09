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
import { CircleCheck, CircleX, Lock, TriangleAlert, X } from 'lucide-react-native';

import { COLORS, SPACING, BORDER_RADIUS } from '../../theme/colors';
import { FONT_FAMILY, TEXT_STYLES } from '../../theme/typography';
import { SHADOWS } from '../../theme/elevation';
import { useLanguage } from '../../data/i18n';
import { ForbiddenError } from '../../api/client';
import { getAIUsageStatus } from '../../api/aiUsage';
import { submitWriting, type WritingPrompt, type WritingResult } from '../../api/writing';
import { track } from '../../services/analytics';

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
  const { t } = useLanguage();
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
      <View style={styles.topRow}>
        <TouchableOpacity
          style={styles.closeBtn}
          onPress={() => navigation.goBack()}
          disabled={phase === 'checking'}
          activeOpacity={0.8}
        >
          <X size={20} color={COLORS.text} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>{prompt.title}</Text>
        {!!prompt.prompt_fa && <Text style={styles.prompt}>{prompt.prompt_fa}</Text>}

        {phase === 'write' && (
          <>
            {prompt.guide_questions.length > 0 && (
              <View style={styles.card}>
                <Text style={styles.cardLabel}>{t('writingIdeasTitle')}</Text>
                {prompt.guide_questions.map((q, i) => (
                  <Text key={i} style={styles.listItem}>
                    • {q}
                  </Text>
                ))}
              </View>
            )}
            {prompt.useful_phrases.length > 0 && (
              <View style={styles.card}>
                <Text style={styles.cardLabel}>{t('writingPhrasesTitle')}</Text>
                <View style={styles.chips}>
                  {prompt.useful_phrases.map((p, i) => (
                    <TouchableOpacity key={i} style={styles.chip} onPress={() => insertPhrase(p)} activeOpacity={0.8}>
                      <Text style={styles.chipText}>{p}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <Text style={styles.mutedSmall}>{t('writingPhrasesHint')}</Text>
              </View>
            )}
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
            <Text style={[styles.wordCount, words > maxWords && styles.wordCountOver]}>
              {t('writingWordCount')
                .replace('{n}', String(words))
                .replace('{min}', String(minWords))
                .replace('{max}', String(maxWords))}
            </Text>
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
            <View style={[styles.card, styles.scoreCard]}>
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
            </View>

            {result.strengths_fa.length > 0 && (
              <View style={styles.card}>
                <Text style={styles.cardLabel}>{t('topicSpeakingStrengths')}</Text>
                {result.strengths_fa.map((s, i) => (
                  <Text key={i} style={styles.listItem}>
                    ✓ {s}
                  </Text>
                ))}
              </View>
            )}

            <View style={styles.card}>
              <Text style={styles.cardLabel}>{t('topicSpeakingMistakes')}</Text>
              {result.mistakes.length === 0 ? (
                <Text style={styles.listItem}>{t('topicSpeakingNoMistakes')}</Text>
              ) : (
                result.mistakes.map((m, i) => (
                  <View key={i} style={[styles.fixItem, i > 0 && styles.fixDivider]}>
                    <Text style={styles.wrongText}>{m.original}</Text>
                    <Text style={styles.rightText}>{m.corrected}</Text>
                    {!!m.explanation_fa && <Text style={styles.explain}>{m.explanation_fa}</Text>}
                  </View>
                ))
              )}
            </View>

            {result.structures.length > 0 && (
              <View style={styles.card}>
                <Text style={styles.cardLabel}>{t('writingStructures')}</Text>
                {result.structures.map((st, i) => (
                  <View key={i} style={[styles.fixItem, i > 0 && styles.fixDivider]}>
                    <Text style={styles.structureText}>{st.structure}</Text>
                    {!!st.example && <Text style={styles.exampleText}>{st.example}</Text>}
                    {!!st.note_fa && <Text style={styles.explain}>{st.note_fa}</Text>}
                  </View>
                ))}
              </View>
            )}

            {result.better_phrases.length > 0 && (
              <View style={styles.card}>
                <Text style={styles.cardLabel}>{t('topicSpeakingBetter')}</Text>
                {result.better_phrases.map((p, i) => (
                  <View key={i} style={[styles.fixItem, i > 0 && styles.fixDivider]}>
                    <Text style={styles.explain}>
                      {t('topicSpeakingInsteadOf')}: <Text style={styles.plainEn}>{p.instead_of}</Text>
                    </Text>
                    <Text style={styles.rightText}>
                      {t('writingWrite')}: {p.try}
                    </Text>
                    {!!p.note_fa && <Text style={styles.explain}>{p.note_fa}</Text>}
                  </View>
                ))}
              </View>
            )}

            {result.used_phrases.length > 0 && (
              <View style={styles.card}>
                <Text style={styles.cardLabel}>{t('topicSpeakingUsedPhrases')}</Text>
                <View style={styles.chips}>
                  {result.used_phrases.map((p, i) => (
                    <View key={i} style={[styles.chip, styles.chipDone]}>
                      <Text style={styles.chipText}>{p}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {!!result.improved_version && (
              <View style={styles.card}>
                <Text style={styles.cardLabel}>{t('writingImproved')}</Text>
                <Text style={styles.paragraph}>{result.improved_version}</Text>
              </View>
            )}
          </>
        )}
      </ScrollView>

      {phase === 'write' && (
        <TouchableOpacity
          style={[styles.primaryBtn, !canSubmit && styles.disabled]}
          onPress={handleSubmit}
          disabled={!canSubmit}
          activeOpacity={0.85}
        >
          <Text style={styles.primaryBtnText}>{t('writingSubmit')}</Text>
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    paddingHorizontal: SPACING.l,
  },
  center: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  flex: {
    flex: 1,
  },
  topRow: {
    flexDirection: 'row',
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
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
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.l,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.m,
    gap: 6,
    ...SHADOWS.level1,
  },
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
  chip: {
    backgroundColor: COLORS.primaryLight,
    borderRadius: BORDER_RADIUS.full,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  chipDone: {
    backgroundColor: COLORS.successLight,
  },
  chipText: {
    ...TEXT_STYLES.labelMd,
    color: COLORS.text,
  },
  input: {
    minHeight: 200,
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.l,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.m,
    ...TEXT_STYLES.bodyLg,
    color: COLORS.text,
    textAlign: 'left',
    writingDirection: 'ltr',
  },
  wordCount: {
    ...TEXT_STYLES.labelSm,
    color: COLORS.muted,
    textAlign: 'right',
  },
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
