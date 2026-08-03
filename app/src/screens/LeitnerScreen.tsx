import React, { useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Check, Trash2, RotateCcw, Eye, Clock, BookOpen, Sparkles } from 'lucide-react-native';
import { COLORS, BORDER_RADIUS, SPACING } from '../theme/colors';
import { useVocab, MAX_LEVEL, isDue, dueLabel } from '../data/VocabContext';
import { useLanguage } from '../data/i18n';

export const LeitnerScreen = () => {
  const { box, promote, demote, remove } = useVocab();
  const { t, language } = useLanguage();
  const [revealed, setRevealed] = useState<Record<string, boolean>>({});
  const [dueOnly, setDueOnly] = useState(true);

  const toggleReveal = (word: string) =>
    setRevealed((prev) => ({ ...prev, [word]: !prev[word] }));

  const dueCount = box.filter(isDue).length;
  const list = (dueOnly ? box.filter(isDue) : box).sort(
    (a, b) => a.level - b.level || a.nextReview - b.nextReview
  );

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Top Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.kicker}>LEITNER SYSTEM</Text>
            <Text style={styles.headerTitle}>{t('leitnerBoxTitle')}</Text>
          </View>
          <View style={styles.badge}>
            <BookOpen size={16} color={COLORS.amber} />
            <Text style={styles.badgeText}>{box.length} {t('wordsUnit')}</Text>
          </View>
        </View>

        <Text style={styles.subtitle}>
          {t('leitnerSubtitle')}
        </Text>

        {/* Today vs All Filter Tabs */}
        <View style={styles.filterRow}>
          <TouchableOpacity
            style={[styles.filterTab, dueOnly && styles.filterTabActive]}
            onPress={() => setDueOnly(true)}
            activeOpacity={0.8}
          >
            <Clock size={14} color={dueOnly ? COLORS.black : COLORS.amber} />
            <Text style={[styles.filterTabText, dueOnly && styles.filterTabTextActive]}>
              {t('today')} ({dueCount})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterTab, !dueOnly && styles.filterTabActive]}
            onPress={() => setDueOnly(false)}
            activeOpacity={0.8}
          >
            <Sparkles size={14} color={!dueOnly ? COLORS.black : COLORS.teal} />
            <Text style={[styles.filterTabText, !dueOnly && styles.filterTabTextActive]}>
              {t('all')} ({box.length})
            </Text>
          </TouchableOpacity>
        </View>

        {/* Word Card List */}
        {box.length === 0 ? (
          <View style={styles.emptyContainer}>
            <BookOpen size={44} color={COLORS.muted} style={{ marginBottom: 12 }} />
            <Text style={styles.emptyTitle}>{t('leitnerEmptyTitle')}</Text>
            <Text style={styles.emptyText}>
              {t('leitnerEmptyText')}
            </Text>
          </View>
        ) : list.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Sparkles size={44} color={COLORS.teal} style={{ marginBottom: 12 }} />
            <Text style={styles.emptyTitle}>{t('leitnerNoDueTitle')}</Text>
            <Text style={styles.emptyText}>
              {t('leitnerNoDueText')}
            </Text>
          </View>
        ) : (
          list.map((item) => (
            <View key={item.word} style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.word}>{item.word}</Text>
                  {revealed[item.word] ? (
                    <Text style={styles.meaning}>{item.meaning}</Text>
                  ) : (
                    <TouchableOpacity
                      style={styles.revealBtn}
                      onPress={() => toggleReveal(item.word)}
                    >
                      <Eye color={COLORS.textSecondary} size={13} />
                      <Text style={styles.revealText}>{t('showMeaning')}</Text>
                    </TouchableOpacity>
                  )}
                </View>

                <View style={styles.badgesColumn}>
                  <View style={styles.levelBadge}>
                    <Text style={styles.levelText}>
                      {t('level')} {item.level}/{MAX_LEVEL}
                    </Text>
                  </View>
                  <View style={[styles.dueBadge, isDue(item) && styles.dueBadgeNow]}>
                    <Clock
                      color={isDue(item) ? COLORS.orange : COLORS.textSecondary}
                      size={11}
                    />
                    <Text
                      style={[styles.dueText, isDue(item) && styles.dueTextNow]}
                    >
                      {dueLabel(item, language)}
                    </Text>
                  </View>
                </View>
              </View>

              <View style={styles.actionsRow}>
                <TouchableOpacity
                  style={[styles.actionBtn, styles.knewBtn]}
                  onPress={() => promote(item.word)}
                  activeOpacity={0.8}
                >
                  <Check color={COLORS.white} size={16} />
                  <Text style={styles.actionText}>{t('knewIt')}</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.actionBtn, styles.forgotBtn]}
                  onPress={() => demote(item.word)}
                  activeOpacity={0.8}
                >
                  <RotateCcw color={COLORS.white} size={16} />
                  <Text style={styles.actionText}>{t('forgotIt')}</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.removeBtn}
                  onPress={() => remove(item.word)}
                  activeOpacity={0.7}
                >
                  <Trash2 color={COLORS.error} size={18} />
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}

        <View style={{ height: 110 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 54,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  kicker: {
    color: COLORS.amber,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1,
  },
  headerTitle: {
    color: COLORS.text,
    fontSize: 26,
    fontWeight: '800',
    marginTop: 2,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 6,
  },
  badgeText: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: '700',
  },
  subtitle: {
    color: COLORS.textSecondary,
    fontSize: 13,
    marginBottom: 20,
    lineHeight: 20,
  },
  filterRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  filterTab: {
    flex: 1,
    height: 42,
    borderRadius: 21,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  filterTabActive: {
    backgroundColor: COLORS.amber,
    borderColor: COLORS.amber,
  },
  filterTabText: {
    color: COLORS.textSecondary,
    fontSize: 13,
    fontWeight: '800',
  },
  filterTabTextActive: {
    color: COLORS.black,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 24,
    padding: 32,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginTop: 12,
  },
  emptyTitle: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyText: {
    color: COLORS.textSecondary,
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 20,
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.l,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 16,
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  word: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: '900',
  },
  meaning: {
    color: COLORS.accent,
    fontSize: 15,
    fontWeight: '700',
    marginTop: 6,
  },
  revealBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    alignSelf: 'flex-start',
    marginTop: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    backgroundColor: COLORS.backgroundSoft,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  revealText: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontWeight: '700',
  },
  badgesColumn: {
    alignItems: 'flex-end',
    gap: 6,
  },
  levelBadge: {
    backgroundColor: COLORS.backgroundSoft,
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  levelText: {
    color: COLORS.primary,
    fontSize: 11,
    fontWeight: '800',
  },
  dueBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.backgroundSoft,
  },
  dueBadgeNow: {
    borderColor: COLORS.orange,
  },
  dueText: {
    color: COLORS.textSecondary,
    fontSize: 11,
    fontWeight: '700',
  },
  dueTextNow: {
    color: COLORS.orange,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 14,
  },
  actionBtn: {
    flex: 1,
    height: 42,
    borderRadius: 21,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  knewBtn: {
    backgroundColor: COLORS.accent,
  },
  forgotBtn: {
    backgroundColor: COLORS.orange,
  },
  actionText: {
    color: COLORS.white,
    fontSize: 13,
    fontWeight: '800',
  },
  removeBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
});
