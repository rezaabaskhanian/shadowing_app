import React, { useEffect, useState } from 'react';
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Check, Trash2, X, RotateCcw, Eye, Clock } from 'lucide-react-native';
import { COLORS, BORDER_RADIUS, SPACING } from '../theme/colors';
import { useVocab, MAX_LEVEL, isDue, dueLabel } from '../data/VocabContext';

interface LeitnerBoxModalProps {
  visible: boolean;
  onClose: () => void;
}

// نمای کامل جعبه‌ی لایتنر (فلش‌کارت): معنی هر واژه پیش‌فرض مخفی است؛
// با دکمه‌ی کوچک «معنی» نمایش داده می‌شود. هر بار که جعبه باز شود همه دوباره مخفی می‌شوند.
export const LeitnerBoxModal = ({ visible, onClose }: LeitnerBoxModalProps) => {
  const { box, promote, demote, remove } = useVocab();
  const [revealed, setRevealed] = useState<Record<string, boolean>>({});
  const [dueOnly, setDueOnly] = useState(true);

  // هر بار باز شدن جعبه، همه‌ی معانی دوباره مخفی و حالت «امروز» فعال شود
  useEffect(() => {
    if (visible) {
      setRevealed({});
      setDueOnly(true);
    }
  }, [visible]);

  const toggleReveal = (word: string) =>
    setRevealed((prev) => ({ ...prev, [word]: !prev[word] }));

  const dueCount = box.filter(isDue).length;
  const list = (dueOnly ? box.filter(isDue) : box).sort(
    (a, b) => a.level - b.level || a.nextReview - b.nextReview
  );

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={styles.screen}>
        <View style={styles.topBar}>
          <Text style={styles.title}>جعبه‌ی لایتنر</Text>
          <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
            <X color={COLORS.text} size={20} />
          </TouchableOpacity>
        </View>

        <Text style={styles.subtitle}>
          {box.length} واژه — با «بلد بودم» سطح بالا می‌رود و مرور بعدی دیرتر می‌شود؛ با «بلد نبودم» به سطح ۱ و مرور زودتر برمی‌گردد.
        </Text>

        {/* فیلتر امروز / همه */}
        <View style={styles.tabs}>
          <TouchableOpacity
            style={[styles.tab, dueOnly ? styles.tabActive : null]}
            onPress={() => setDueOnly(true)}
          >
            <Text style={[styles.tabText, dueOnly ? styles.tabTextActive : null]}>
              امروز ({dueCount})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, !dueOnly ? styles.tabActive : null]}
            onPress={() => setDueOnly(false)}
          >
            <Text style={[styles.tabText, !dueOnly ? styles.tabTextActive : null]}>
              همه ({box.length})
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.listContent} showsVerticalScrollIndicator={false}>
          {box.length === 0 ? (
            <Text style={styles.empty}>
              هنوز واژه‌ای اضافه نکرده‌ای. از داخل هر دیالوگ روی «واژه‌ها» بزن و واژه‌ها را به جعبه اضافه کن.
            </Text>
          ) : list.length === 0 ? (
            <Text style={styles.empty}>
              🎉 امروز واژه‌ای برای مرور نداری! از تب «همه» می‌توانی بقیه را ببینی.
            </Text>
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
                        <Text style={styles.revealText}>معنی</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                  <View style={styles.badges}>
                    <View style={styles.levelBadge}>
                      <Text style={styles.levelText}>
                        سطح {item.level}/{MAX_LEVEL}
                      </Text>
                    </View>
                    <View style={[styles.dueBadge, isDue(item) ? styles.dueBadgeNow : null]}>
                      <Clock
                        color={isDue(item) ? COLORS.orange : COLORS.textSecondary}
                        size={11}
                      />
                      <Text
                        style={[styles.dueText, isDue(item) ? styles.dueTextNow : null]}
                      >
                        {dueLabel(item)}
                      </Text>
                    </View>
                  </View>
                </View>

                <View style={styles.actions}>
                  <TouchableOpacity
                    style={[styles.actionBtn, styles.knewBtn]}
                    onPress={() => promote(item.word)}
                  >
                    <Check color={COLORS.white} size={16} />
                    <Text style={styles.actionText}>بلد بودم</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.actionBtn, styles.forgotBtn]}
                    onPress={() => demote(item.word)}
                  >
                    <RotateCcw color={COLORS.white} size={16} />
                    <Text style={styles.actionText}>بلد نبودم</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.removeBtn} onPress={() => remove(item.word)}>
                    <Trash2 color={COLORS.error} size={18} />
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}
        </ScrollView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.background,
    paddingTop: 56,
    paddingHorizontal: SPACING.m,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    color: COLORS.text,
    fontSize: 22,
    fontWeight: '900',
  },
  closeBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  subtitle: {
    color: COLORS.textSecondary,
    fontSize: 13,
    marginTop: 8,
    marginBottom: 16,
    lineHeight: 20,
  },
  listContent: {
    gap: 12,
    paddingBottom: 40,
  },
  empty: {
    color: COLORS.textSecondary,
    textAlign: 'center',
    paddingVertical: 40,
    lineHeight: 22,
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.l,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 16,
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
  badges: {
    alignItems: 'flex-end',
    gap: 6,
  },
  levelBadge: {
    backgroundColor: COLORS.backgroundSoft,
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  levelText: {
    color: COLORS.primary,
    fontSize: 12,
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
  tabs: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  tab: {
    flex: 1,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  tabActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  tabText: {
    color: COLORS.textSecondary,
    fontSize: 13,
    fontWeight: '800',
  },
  tabTextActive: {
    color: COLORS.white,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 14,
  },
  actionBtn: {
    flex: 1,
    height: 44,
    borderRadius: 22,
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
    fontSize: 14,
    fontWeight: '800',
  },
  removeBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
});
