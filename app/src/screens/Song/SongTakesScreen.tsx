import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Check, Download, Music, Play, Trash2, X } from 'lucide-react-native';

import { COLORS, SPACING, BORDER_RADIUS } from '../../theme/colors';
import { FONT_FAMILY, TEXT_STYLES } from '../../theme/typography';
import { useLanguage } from '../../data/i18n';
import { absUrl } from '../../api/config';
import { deleteTake, exportTake, listTakes, type SongTake } from '../../services/songTakes';

const mmss = (ms: number) => {
  const s = Math.round(ms / 1000);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
};

/** «ضبط‌های من»: همه‌ی دفعه‌هایی که کاربر با آهنگ خوانده؛ فقط روی همین گوشی. */
export const SongTakesScreen: React.FC = () => {
  const { t, language } = useLanguage();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const [takes, setTakes] = useState<SongTake[] | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(() => {
    listTakes().then(setTakes);
  }, []);
  useFocusEffect(load);

  const save = async (tk: SongTake) => {
    setBusyId(tk.id);
    try {
      await exportTake(tk);
      load();
    } catch {
      Alert.alert(t('songSaveFailed'));
    } finally {
      setBusyId(null);
    }
  };

  const remove = (tk: SongTake) =>
    Alert.alert(t('songDeleteTakeTitle'), tk.title, [
      { text: t('cancel'), style: 'cancel' },
      {
        text: t('delete'),
        style: 'destructive',
        onPress: async () => {
          await deleteTake(tk.id);
          load();
        },
      },
    ]);

  const dateText = (ms: number) =>
    new Date(ms).toLocaleDateString(language === 'fa' ? 'fa-IR' : 'en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

  return (
    <View style={[styles.container, { paddingTop: insets.top + SPACING.s }]}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.closeBtn} onPress={() => navigation.goBack()} activeOpacity={0.8}>
          <X size={20} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.title}>{t('songMyTakes')}</Text>
      </View>

      {takes === null ? (
        <View style={styles.center}>
          <ActivityIndicator color={COLORS.primary} />
        </View>
      ) : takes.length === 0 ? (
        <View style={styles.center}>
          <Music size={32} color={COLORS.muted} />
          <Text style={styles.muted}>{t('songNoTakes')}</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + SPACING.l }]} showsVerticalScrollIndicator={false}>
          {takes.map((tk) => (
            <View key={tk.id} style={styles.row}>
              <TouchableOpacity
                style={styles.main}
                activeOpacity={0.85}
                onPress={() => navigation.navigate('Song', { songId: tk.songId, takeId: tk.id, openedAt: Date.now() })}
              >
                {tk.coverUrl ? (
                  <Image source={{ uri: absUrl(tk.coverUrl) }} style={styles.thumb} />
                ) : (
                  <View style={[styles.thumb, styles.thumbEmpty]}>
                    <Music size={18} color={COLORS.muted} />
                  </View>
                )}
                <View style={styles.flex}>
                  <Text style={styles.songTitle} numberOfLines={1}>
                    {tk.title}
                  </Text>
                  <Text style={styles.meta}>
                    {dateText(tk.createdAt)} · {mmss(tk.durationMs)}
                  </Text>
                </View>
                <View style={styles.play}>
                  <Play size={14} color={COLORS.white} fill={COLORS.white} />
                </View>
              </TouchableOpacity>
              <View style={styles.actions}>
                <TouchableOpacity style={styles.action} onPress={() => save(tk)} disabled={busyId === tk.id} activeOpacity={0.8}>
                  {busyId === tk.id ? (
                    <ActivityIndicator size="small" color={COLORS.text} />
                  ) : tk.exportedPath ? (
                    <Check size={15} color={COLORS.success} />
                  ) : (
                    <Download size={15} color={COLORS.text} />
                  )}
                  <Text style={styles.actionText}>{tk.exportedPath ? t('songSavedToPhone') : t('songSaveToPhone')}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.action} onPress={() => remove(tk)} activeOpacity={0.8}>
                  <Trash2 size={15} color={COLORS.error} />
                  <Text style={[styles.actionText, { color: COLORS.error }]}>{t('delete')}</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background, paddingHorizontal: SPACING.l },
  header: { flexDirection: 'row', alignItems: 'center', gap: SPACING.s, marginBottom: SPACING.m },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { flex: 1, fontFamily: FONT_FAMILY.bold, fontSize: 18, lineHeight: 28, color: COLORS.text, textAlign: 'right' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: SPACING.s },
  muted: { ...TEXT_STYLES.bodyMd, color: COLORS.textSecondary, textAlign: 'center', paddingHorizontal: SPACING.l },
  list: { gap: SPACING.s },
  row: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.l,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    padding: 10,
    gap: 8,
  },
  main: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  thumb: { width: 52, height: 52, borderRadius: 10 },
  thumbEmpty: { backgroundColor: COLORS.surfaceHigh, alignItems: 'center', justifyContent: 'center' },
  flex: { flex: 1 },
  songTitle: { fontFamily: FONT_FAMILY.bold, fontSize: 14, color: COLORS.text },
  meta: { fontFamily: FONT_FAMILY.regular, fontSize: 11, color: COLORS.textSecondary, marginTop: 2 },
  play: { width: 32, height: 32, borderRadius: 16, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center' },
  actions: { flexDirection: 'row', gap: 8 },
  action: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 34,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  actionText: { fontFamily: FONT_FAMILY.medium, fontSize: 12, color: COLORS.text },
});
