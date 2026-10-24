import React, { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BookOpen, Briefcase, Headphones, Mic, PenLine, Plus, Volume2, X } from 'lucide-react-native';

import { COLORS, SPACING, BORDER_RADIUS } from '../../theme/colors';
import { FONT_FAMILY, TEXT_STYLES } from '../../theme/typography';
import { SHADOWS } from '../../theme/elevation';
import { useLanguage } from '../../data/i18n';
import { useToast } from '../../data/ToastContext';
import { getSpecialtyField, type FieldContentItem, type SpecialtyFieldDetail } from '../../api/specialty';
import { getSpeakingTopics } from '../../api/topicSpeaking';
import { getWritingPrompts } from '../../api/writing';
import { addWord } from '../../api/leitner';
import { absUrl } from '../../api/config';
import { AudioPlayer } from '../../components/AudioPlayer';
import { BannerCard, levelColor } from '../../components/ContentVisuals';
import { track } from '../../services/analytics';

const KIND_ICON = { scene: BookOpen, podcast: Headphones, speaking_topic: Mic, writing_prompt: PenLine, interview: Briefcase };

/**
 * یک رشته‌ی «زبان تخصصی»: لغت‌های رشته (با صدا و مثال، قابل افزودن به لایتنر)
 * و محتوای برچسب‌خورده‌ی همان رشته (صحنه، پادکست، صحبت، نوشتن، مصاحبه).
 */
export const SpecialtyFieldScreen: React.FC = () => {
  const { t } = useLanguage();
  const toast = useToast();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const fieldKey: string = route.params?.fieldKey;
  const [field, setField] = useState<SpecialtyFieldDetail | null>(null);
  const [error, setError] = useState(false);
  const [adding, setAdding] = useState(false);
  const [playUri, setPlayUri] = useState<string | null>(null);
  const [nonce, setNonce] = useState(0);

  useEffect(() => {
    getSpecialtyField(fieldKey)
      .then((f) => {
        setField(f);
        track('specialty_field_opened', f.key);
      })
      .catch(() => setError(true));
  }, [fieldKey]);

  const addAll = async () => {
    if (!field) return;
    setAdding(true);
    let n = 0;
    for (const w of field.words) {
      try {
        await addWord(w.word, w.meaning_fa);
        n++;
      } catch {
        // تکراری یا خطای شبکه: بقیه‌ی لغت‌ها اضافه شوند.
      }
    }
    setAdding(false);
    toast.success(t('specialtyAdded').replace('{n}', String(n)));
  };

  const open = async (item: FieldContentItem) => {
    if (item.kind === 'scene') navigation.navigate('Shadowing', { scenarioId: item.id, returnTo: 'SpecialtyField', returnParams: route.params });
    else if (item.kind === 'podcast') navigation.navigate('Podcast', { podcastId: item.id, openedAt: Date.now() });
    else if (item.kind === 'interview') navigation.navigate('InterviewSession', { setId: item.id, openedAt: Date.now() });
    else if (item.kind === 'speaking_topic') {
      const topic = (await getSpeakingTopics().catch(() => [])).find((x) => x.id === item.id);
      if (topic) navigation.navigate('TopicSpeaking', { topic, openedAt: Date.now() });
    } else if (item.kind === 'writing_prompt') {
      const prompt = (await getWritingPrompts().catch(() => [])).find((x) => x.id === item.id);
      if (prompt) navigation.navigate('Writing', { prompt, openedAt: Date.now() });
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top + SPACING.s }]}>
      <AudioPlayer uri={playUri} shouldPlay={false} actionCommand={playUri ? 'play_original' : 'none'} actionNonce={nonce} />
      <View style={styles.topRow}>
        <TouchableOpacity style={styles.closeBtn} onPress={() => (navigation.canGoBack() ? navigation.goBack() : navigation.navigate('Home'))} activeOpacity={0.8}>
          <X size={20} color={COLORS.text} />
        </TouchableOpacity>
        {!!field && (
          <Text style={styles.title}>
            {field.icon} {field.title_fa}
          </Text>
        )}
      </View>

      {!field && !error && (
        <View style={styles.center}>
          <ActivityIndicator color={COLORS.primary} />
        </View>
      )}
      {error && (
        <View style={styles.center}>
          <Text style={styles.mutedText}>{t('topicSpeakingLoadError')}</Text>
        </View>
      )}

      {field && (
        <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + SPACING.l }]} showsVerticalScrollIndicator={false}>
          {field.content.length > 0 && (
            <>
              <Text style={styles.sectionTitle}>{t('specialtyPractice')}</Text>
              {field.content.map((item) => {
                const Icon = KIND_ICON[item.kind] ?? BookOpen;
                return (
                  <BannerCard
                    key={`${item.kind}-${item.id}`}
                    image={item.image_url ? { uri: absUrl(item.image_url) } : null}
                    accent={levelColor(item.level)}
                    icon={<Icon size={22} color={COLORS.white} />}
                    title={item.title}
                    badgeLabel={t(`specialtyContent_${item.kind}`)}
                    onPress={() => open(item)}
                  />
                );
              })}
            </>
          )}

          {field.words.length > 0 && (
            <>
              <View style={styles.wordsHead}>
                <Text style={styles.sectionTitle}>
                  {t('specialtyWords')} · {t('specialtyWordCount').replace('{n}', String(field.words.length))}
                </Text>
                <TouchableOpacity style={styles.addBtn} onPress={addAll} disabled={adding} activeOpacity={0.85}>
                  {adding ? <ActivityIndicator size="small" color={COLORS.white} /> : <Plus size={14} color={COLORS.white} />}
                  <Text style={styles.addBtnText}>{t('specialtyAddAll')}</Text>
                </TouchableOpacity>
              </View>
              {field.words.map((w) => (
                <View key={w.id} style={styles.wordCard}>
                  <View style={styles.wordRow}>
                    <Text style={styles.word}>{w.word}</Text>
                    {!!w.audio_url && (
                      <TouchableOpacity
                        onPress={() => {
                          setPlayUri(absUrl(w.audio_url));
                          setNonce((n) => n + 1);
                        }}
                        activeOpacity={0.8}
                      >
                        <Volume2 size={18} color={COLORS.primary} />
                      </TouchableOpacity>
                    )}
                  </View>
                  <Text style={styles.meaning}>{w.meaning_fa}</Text>
                  {!!w.example && <Text style={styles.example}>{w.example}</Text>}
                  {!!w.example_fa && <Text style={styles.meaning}>{w.example_fa}</Text>}
                </View>
              ))}
            </>
          )}
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background, paddingHorizontal: SPACING.l },
  topRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.m, marginBottom: SPACING.s },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { ...TEXT_STYLES.headlineSm, color: COLORS.text, flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  mutedText: { ...TEXT_STYLES.bodyMd, color: COLORS.textSecondary, textAlign: 'center' },
  content: { gap: SPACING.m, paddingTop: SPACING.s },
  sectionTitle: { ...TEXT_STYLES.labelMd, color: COLORS.textSecondary, fontFamily: FONT_FAMILY.semiBold },
  wordsHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: SPACING.s },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.full,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  addBtnText: { ...TEXT_STYLES.labelSm, color: COLORS.white, fontFamily: FONT_FAMILY.semiBold },
  wordCard: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.l,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.m,
    gap: 2,
    ...SHADOWS.level1,
  },
  wordRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  word: { ...TEXT_STYLES.bodyLg, color: COLORS.text, fontFamily: FONT_FAMILY.bold },
  meaning: { ...TEXT_STYLES.bodyMd, color: COLORS.textSecondary },
  example: { ...TEXT_STYLES.bodyMd, color: COLORS.text, fontStyle: 'italic' },
});
