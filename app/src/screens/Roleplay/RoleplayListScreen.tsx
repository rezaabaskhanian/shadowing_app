import React, { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Drama, Headphones, MessageCircle, Target, X } from 'lucide-react-native';

import { COLORS, SPACING } from '../../theme/colors';
import { FONT_FAMILY, TEXT_STYLES } from '../../theme/typography';
import { useLanguage } from '../../data/i18n';
import { getRoleplays, type Roleplay } from '../../api/conversation';
import { ListHero, levelColor } from '../../components/ContentVisuals';

const LEVEL_LABEL: Record<string, string> = {
  starter: 'levelStarter',
  beginner: 'levelBeginner',
  intermediate: 'levelIntermediate',
  advanced: 'levelAdvanced',
  proficient: 'levelProficient',
};

/**
 * «نقش‌آفرینی»: موقعیت‌های زندگی واقعی (دکتر، بانک، تعمیرکار…). کارت باز می‌شود و
 * نقش کاربر، مأموریت و جمله‌های کلیدی را نشان می‌دهد؛ «شروع گفتگو» همان صفحه‌ی
 * گفتگو با AI را روی این سناریو باز می‌کند.
 */
export const RoleplayListScreen: React.FC = () => {
  const { t, language } = useLanguage();
  const rtl = language === 'fa';
  const ta = rtl ? styles.textRight : styles.textLeft;
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const [items, setItems] = useState<Roleplay[] | null>(null);
  const [error, setError] = useState(false);
  const [category, setCategory] = useState('');
  const [openId, setOpenId] = useState<string | null>(null);

  const load = useCallback(() => {
    setError(false);
    getRoleplays()
      .then(setItems)
      .catch(() => setError(true));
  }, []);
  useFocusEffect(load);

  const categories = useMemo(() => Array.from(new Set((items ?? []).map((r) => r.category))), [items]);
  const shown = (items ?? []).filter((r) => !category || r.category === category);
  const catLabel = (c: string) => {
    const label = t(`roleplayCat_${c}`);
    return label === `roleplayCat_${c}` ? c : label;
  };

  const start = (r: Roleplay) =>
    navigation.navigate('AIConversation', { roleplay: r, sceneTitle: rtl ? r.title_fa || r.title : r.title, openedAt: Date.now() });

  return (
    <View style={[styles.container, { paddingTop: insets.top + SPACING.s }]}>
      <View style={[styles.topRow, rtl && styles.rowReverse]}>
        <TouchableOpacity style={styles.closeBtn} onPress={() => navigation.goBack()} activeOpacity={0.8}>
          <X size={20} color={COLORS.text} />
        </TouchableOpacity>
      </View>
      <ListHero
        icon={<Drama size={26} color={COLORS.white} />}
        color={COLORS.primary}
        title={t('roleplayTitle')}
        subtitle={t('roleplaySubtitle')}
      />

      {items === null && !error && (
        <View style={styles.center}>
          <ActivityIndicator color={COLORS.primary} />
        </View>
      )}
      {error && (
        <View style={styles.center}>
          <Text style={styles.mutedText}>{t('roleplayLoadError')}</Text>
          <TouchableOpacity onPress={load} activeOpacity={0.8}>
            <Text style={styles.linkText}>{t('topicSpeakingRetry')}</Text>
          </TouchableOpacity>
        </View>
      )}
      {items && items.length === 0 && (
        <View style={styles.center}>
          <Text style={styles.mutedText}>{t('roleplayEmpty')}</Text>
        </View>
      )}

      {items && items.length > 0 && (
        <ScrollView
          contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + SPACING.l }]}
          showsVerticalScrollIndicator={false}
        >
          {categories.length > 1 && (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={[styles.chips, rtl && styles.rowReverse]}
            >
              {['', ...categories].map((c) => (
                <TouchableOpacity
                  key={c || 'all'}
                  style={[styles.chip, category === c && styles.chipActive]}
                  onPress={() => setCategory(c)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.chipText, category === c && styles.chipTextActive]}>
                    {c ? catLabel(c) : t('roleplayAll')}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}

          {shown.map((r) => {
            const open = openId === r.id;
            return (
              <TouchableOpacity
                key={r.id}
                style={[styles.card, open && styles.cardOpen]}
                onPress={() => setOpenId(open ? null : r.id)}
                activeOpacity={0.9}
              >
                <View style={[styles.cardHead, rtl && styles.rowReverse]}>
                  <View style={styles.cardIcon}>
                    <MessageCircle size={20} color={COLORS.primary} />
                  </View>
                  <View style={styles.flex1}>
                    <Text style={[styles.cardTitle, ta]} numberOfLines={1}>
                      {r.title_fa || r.title}
                    </Text>
                    <Text style={[styles.cardTitleEn, ta]} numberOfLines={1}>
                      {r.title}
                    </Text>
                  </View>
                  <View style={[styles.levelBadge, { backgroundColor: levelColor(r.level) }]}>
                    <Text style={styles.levelBadgeText}>{t(LEVEL_LABEL[r.level] ?? 'levelBeginner')}</Text>
                  </View>
                </View>
                {!!r.situation_fa && (
                  <Text style={[styles.situation, ta]} numberOfLines={open ? undefined : 2}>
                    {r.situation_fa}
                  </Text>
                )}

                {open && (
                  <View style={styles.details}>
                    {!!r.user_role_fa && (
                      <View style={styles.block}>
                        <Text style={[styles.blockTitle, ta]}>{t('roleplayYourRole')}</Text>
                        <Text style={[styles.blockText, ta]}>{r.user_role_fa}</Text>
                      </View>
                    )}
                    {r.goals_fa.length > 0 && (
                      <View style={styles.block}>
                        <Text style={[styles.blockTitle, ta]}>{t('roleplayGoals')}</Text>
                        {r.goals_fa.map((g, i) => (
                          <View key={i} style={[styles.goalRow, rtl && styles.rowReverse]}>
                            <Target size={14} color={COLORS.primary} />
                            <Text style={[styles.blockText, styles.flex1, ta]}>{g}</Text>
                          </View>
                        ))}
                      </View>
                    )}
                    {r.key_phrases.length > 0 && (
                      <View style={styles.block}>
                        <Text style={[styles.blockTitle, ta]}>{t('roleplayKeyPhrases')}</Text>
                        {r.key_phrases.map((p, i) => (
                          <View key={i} style={styles.phrase}>
                            <Text style={styles.phraseEn}>{p.en}</Text>
                            {!!p.fa && <Text style={[styles.phraseFa, ta]}>{p.fa}</Text>}
                          </View>
                        ))}
                      </View>
                    )}

                    <TouchableOpacity style={styles.startBtn} onPress={() => start(r)} activeOpacity={0.85}>
                      <MessageCircle size={18} color={COLORS.white} />
                      <Text style={styles.startBtnText}>{t('roleplayStart')}</Text>
                    </TouchableOpacity>
                    {!!r.podcast_id && (
                      <TouchableOpacity
                        style={styles.podcastBtn}
                        onPress={() => navigation.navigate('Podcast', { podcastId: r.podcast_id, openedAt: Date.now() })}
                        activeOpacity={0.85}
                      >
                        <Headphones size={16} color={COLORS.primary} />
                        <Text style={styles.podcastBtnText}>{t('roleplayListenFirst')}</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  rowReverse: { flexDirection: 'row-reverse' },
  textRight: { textAlign: 'right' },
  textLeft: { textAlign: 'left' },
  flex1: { flex: 1 },
  container: { flex: 1, backgroundColor: COLORS.backgroundSoft, paddingHorizontal: SPACING.l },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: SPACING.s },
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
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: SPACING.s },
  mutedText: { ...TEXT_STYLES.bodyMd, color: COLORS.textSecondary, textAlign: 'center' },
  linkText: { ...TEXT_STYLES.labelMd, color: COLORS.primary, fontFamily: FONT_FAMILY.semiBold },
  list: { gap: SPACING.m, paddingTop: SPACING.m },
  chips: { gap: 8, paddingBottom: 2 },
  chip: {
    paddingHorizontal: 14,
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
  },
  chipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  chipText: { fontFamily: FONT_FAMILY.semiBold, fontSize: 13, color: COLORS.text },
  chipTextActive: { color: COLORS.white },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    padding: SPACING.m,
    gap: 10,
  },
  cardOpen: { borderColor: '#F6CDBE' },
  cardHead: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  cardIcon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: { fontFamily: FONT_FAMILY.bold, fontSize: 15, color: COLORS.text },
  cardTitleEn: { fontFamily: FONT_FAMILY.regular, fontSize: 12, color: COLORS.muted, marginTop: 2 },
  levelBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  levelBadgeText: { fontFamily: FONT_FAMILY.bold, fontSize: 11, color: COLORS.white },
  situation: { ...TEXT_STYLES.bodyMd, color: COLORS.textSecondary, lineHeight: 22 },
  details: { gap: 12, marginTop: 4 },
  block: { gap: 6 },
  blockTitle: { fontFamily: FONT_FAMILY.bold, fontSize: 13, color: COLORS.primaryDark },
  blockText: { ...TEXT_STYLES.bodyMd, color: COLORS.text, lineHeight: 22 },
  goalRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  phrase: { backgroundColor: COLORS.backgroundSoft, borderRadius: 14, paddingHorizontal: 12, paddingVertical: 8, gap: 2 },
  phraseEn: { fontFamily: FONT_FAMILY.semiBold, fontSize: 14, color: COLORS.text, textAlign: 'left', writingDirection: 'ltr' },
  phraseFa: { fontFamily: FONT_FAMILY.regular, fontSize: 12, color: COLORS.textSecondary },
  startBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 50,
    borderRadius: 25,
    backgroundColor: COLORS.primary,
    marginTop: 4,
  },
  startBtnText: { fontFamily: FONT_FAMILY.bold, fontSize: 15, color: COLORS.white },
  podcastBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, height: 40 },
  podcastBtnText: { fontFamily: FONT_FAMILY.semiBold, fontSize: 13, color: COLORS.primary },
});
