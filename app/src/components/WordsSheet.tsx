import React, { useMemo } from 'react';
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Check, Plus, X, Layers } from 'lucide-react-native';
import { COLORS, BORDER_RADIUS, SPACING } from '../theme/colors';
import { getDialogueWords, type VocabEntry } from '../data/vocabulary';
import { useVocab } from '../data/VocabContext';
import type { WordEntry } from '../data/scenarios';

interface WordsSheetProps {
  visible: boolean;
  onClose: () => void;
  dialogueText: string;
  // واژه‌های آمده از بک‌اند برای این دیالوگ (اگر باشد اولویت دارد)
  backendWords?: WordEntry[];
  onOpenBox: () => void;
}

// شیت پایین‌رونده که واژه‌های دیالوگ جاری را با معنی نشان می‌دهد
// و امکان افزودن هر واژه به جعبه‌ی لایتنر را می‌دهد.
// اولویت با واژه‌های بک‌اند است؛ در نبودشان به واژه‌نامه‌ی محلی برمی‌گردیم.
export const WordsSheet = ({ visible, onClose, dialogueText, backendWords, onOpenBox }: WordsSheetProps) => {
  const { has, add, remove, box } = useVocab();
  const words = useMemo<VocabEntry[]>(() => {
    if (backendWords && backendWords.length > 0) {
      return backendWords.map((w) => ({ word: w.word, meaning: w.meaning }));
    }
    return getDialogueWords(dialogueText);
  }, [backendWords, dialogueText]);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <TouchableOpacity style={styles.backdropTouch} activeOpacity={1} onPress={onClose} />
        <View style={styles.sheet}>
          <View style={styles.handle} />

          <View style={styles.header}>
            <Text style={styles.title}>واژه‌های این دیالوگ</Text>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
              <X color={COLORS.text} size={18} />
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.boxLink} onPress={onOpenBox}>
            <Layers color={COLORS.primary} size={18} />
            <Text style={styles.boxLinkText}>جعبه‌ی لایتنر من ({box.length})</Text>
          </TouchableOpacity>

          <ScrollView style={styles.list} contentContainerStyle={styles.listContent}>
            {words.length === 0 ? (
              <Text style={styles.empty}>برای این دیالوگ واژه‌ای با معنی ثبت نشده است.</Text>
            ) : (
              words.map((w) => {
                const added = has(w.word);
                return (
                  <View key={w.word} style={styles.row}>
                    <View style={styles.rowText}>
                      <Text style={styles.word}>{w.word}</Text>
                      <Text style={styles.meaning}>{w.meaning}</Text>
                    </View>
                    <TouchableOpacity
                      style={[styles.addBtn, added ? styles.addBtnDone : null]}
                      onPress={() => (added ? remove(w.word) : add(w))}
                    >
                      {added ? (
                        <Check color={COLORS.white} size={18} />
                      ) : (
                        <Plus color={COLORS.white} size={18} />
                      )}
                    </TouchableOpacity>
                  </View>
                );
              })
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  backdropTouch: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  sheet: {
    maxHeight: '75%',
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: SPACING.m,
    paddingBottom: 28,
    paddingTop: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  handle: {
    alignSelf: 'center',
    width: 44,
    height: 5,
    borderRadius: 3,
    backgroundColor: COLORS.border,
    marginBottom: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  title: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: '900',
  },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: COLORS.backgroundSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  boxLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    alignSelf: 'flex-start',
    backgroundColor: COLORS.backgroundSoft,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.m,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 14,
  },
  boxLinkText: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: '800',
  },
  list: {
    flexGrow: 0,
  },
  listContent: {
    gap: 10,
  },
  empty: {
    color: COLORS.textSecondary,
    textAlign: 'center',
    paddingVertical: 24,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.backgroundSoft,
    borderRadius: BORDER_RADIUS.m,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 14,
  },
  rowText: {
    flex: 1,
    marginRight: 12,
  },
  word: {
    color: COLORS.text,
    fontSize: 17,
    fontWeight: '900',
  },
  meaning: {
    color: COLORS.textSecondary,
    fontSize: 14,
    marginTop: 4,
  },
  addBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addBtnDone: {
    backgroundColor: COLORS.accent,
  },
});
