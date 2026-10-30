import React from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { ChevronLeft, ChevronRight, Lock, Mic, Pause, Play, Trash2 } from 'lucide-react-native';

import { AudioPlayer } from '../components/AudioPlayer';
import { useLanguage } from '../data/i18n';
import { deleteRecording, listRecordings, type RecordingMeta } from '../services/RecordingsService';
import { BORDER_RADIUS, COLORS } from '../theme/colors';
import { FONT_FAMILY } from '../theme/typography';

/**
 * فهرست صداهایی که کاربر در مرحله‌ی «ضبط» روی گوشی ذخیره کرده، با امکان
 * پخش دوباره و حذف. پخش مستقیم از مسیر فایل روی دیسک انجام می‌شود
 * (`react-native-nitro-sound` داخل `AudioPlayer`) — نیازی به خواندن و
 * base64-کردن فایل نیست.
 */
export const MyRecordingsScreen = () => {
  const navigation = useNavigation<any>();
  const { t, language } = useLanguage();

  const [items, setItems] = React.useState<RecordingMeta[] | null>(null);
  const [playingId, setPlayingId] = React.useState<string | null>(null);
  const [loadedPath, setLoadedPath] = React.useState<string | null>(null);
  const [playCommand, setPlayCommand] = React.useState<'none' | 'play_recording'>('none');
  const [playNonce, setPlayNonce] = React.useState(0);

  // صف پخشِ کل مکالمه؛ خالی یعنی پخش دنباله‌ای در جریان نیست.
  const [conversationQueue, setConversationQueue] = React.useState<RecordingMeta[]>([]);
  const [playingSceneId, setPlayingSceneId] = React.useState<string | null>(null);

  const load = React.useCallback(() => {
    listRecordings()
      .then(setItems)
      .catch(() => setItems([]));
  }, []);

  React.useEffect(load, [load]);

  /**
   * ضبط‌ها را بر اساس صحنه دسته می‌کند و در هر صحنه فقط **آخرین** ضبط هر جمله
   * را نگه می‌دارد.
   *
   * چرا فقط آخرین: لیست تختِ زمانی یعنی اگر کاربر یک صحنه را دو بار تمرین کند،
   * ضبط‌های دو دور در هم قاطی می‌شوند و نه پیدا کردن جمله ممکن است نه پخش
   * پشت‌سرهمِ معنادار. آخرین تلاشِ هر جمله همان چیزی است که کاربر می‌خواهد
   * بشنود.
   */
  const scenes = React.useMemo(() => {
    if (!items) return null;

    const byScene = new Map<
      string,
      { sceneId: string; sceneTitle: string; latestAt: number; lines: Map<number, RecordingMeta> }
    >();

    for (const item of items) {
      let group = byScene.get(item.sceneId);
      if (!group) {
        group = {
          sceneId: item.sceneId,
          sceneTitle: item.sceneTitle,
          latestAt: item.createdAt,
          lines: new Map(),
        };
        byScene.set(item.sceneId, group);
      }
      group.latestAt = Math.max(group.latestAt, item.createdAt);

      const existing = group.lines.get(item.lineNumber);
      if (!existing || item.createdAt > existing.createdAt) {
        group.lines.set(item.lineNumber, item);
      }
    }

    return Array.from(byScene.values())
      .map((g) => ({
        sceneId: g.sceneId,
        sceneTitle: g.sceneTitle,
        latestAt: g.latestAt,
        lines: Array.from(g.lines.values()).sort((a, b) => a.lineNumber - b.lineNumber),
      }))
      .sort((a, b) => b.latestAt - a.latestAt);
  }, [items]);

  /** پخش پشت‌سرهم ضبط‌های یک صحنه، به ترتیب شماره‌ی جمله. */
  const playConversation = async (sceneId: string, lines: RecordingMeta[]) => {
    if (playingSceneId === sceneId) {
      setConversationQueue([]);
      setPlayingSceneId(null);
      setPlayingId(null);
      setPlayCommand('none');
      return;
    }
    if (lines.length === 0) return;

    setPlayingSceneId(sceneId);
    setConversationQueue(lines.slice(1));
    startPlaying(lines[0]);
  };

  const startPlaying = (item: RecordingMeta) => {
    setLoadedPath(item.path);
    setPlayingId(item.id);
    setPlayCommand('play_recording');
    setPlayNonce((n) => n + 1);
  };

  /** با پایان هر ضبط، اگر صف مکالمه پر است نوبت بعدی را پخش می‌کند. */
  const handleRecordedEnd = () => {
    setConversationQueue((queue) => {
      if (queue.length === 0) {
        setPlayingId(null);
        setPlayCommand('none');
        setPlayingSceneId(null);
        return queue;
      }
      const [next, ...rest] = queue;
      // پخش نمی‌تواند داخل setState انجام شود؛ به تیک بعدی موکولش می‌کنیم.
      setTimeout(() => startPlaying(next), 350);
      return rest;
    });
  };

  const handlePlay = async (item: RecordingMeta) => {
    // زدن روی یک جمله، پخشِ کل مکالمه را قطع می‌کند؛ کاربر الان همین یکی را
    // خواسته است.
    setConversationQueue([]);
    setPlayingSceneId(null);

    if (playingId === item.id) {
      setPlayCommand('none');
      setPlayingId(null);
      return;
    }
    startPlaying(item);
  };

  const handleDelete = (item: RecordingMeta) => {
    Alert.alert(t('deleteRecording'), item.fileName, [
      { text: t('cancel'), style: 'cancel' },
      {
        text: t('delete'),
        style: 'destructive',
        onPress: () => {
          if (playingId === item.id) {
            setPlayCommand('none');
            setPlayingId(null);
          }
          deleteRecording(item.id).then(load);
        },
      },
    ]);
  };

  const rtl = language === 'fa';
  const row = rtl && styles.rowReverse;
  const align = rtl && styles.textRight;
  const locale = rtl ? 'fa-IR' : 'en-US';
  const num = (n: number) => n.toLocaleString(locale);

  const formatDate = (ms: number) =>
    new Date(ms).toLocaleString(locale, { dateStyle: 'short', timeStyle: 'short' });
  const formatDay = (ms: number) => new Date(ms).toLocaleDateString(locale, { dateStyle: 'medium' });

  const totalLines = scenes ? scenes.reduce((sum, s) => sum + s.lines.length, 0) : 0;

  return (
    <View style={styles.screen}>
      {/* موتور صدا: کاملاً imperative، خودش چیزی پخش نمی‌کند مگر دستور
          play_recording برسد. */}
      <AudioPlayer
        uri={null}
        shouldPlay={false}
        actionCommand={playCommand}
        actionNonce={playNonce}
        loadedRecordingPath={loadedPath}
        onRecordedPlaybackEnd={handleRecordedEnd}
      />

      <View style={[styles.topBar, row]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          {rtl ? <ChevronRight color={COLORS.text} size={22} /> : <ChevronLeft color={COLORS.text} size={22} />}
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={[styles.pageTitle, align]}>{t('myRecordings')}</Text>
        <Text style={[styles.pageSub, align]}>{t('myRecordingsSub')}</Text>

        {scenes === null ? (
          <ActivityIndicator color={COLORS.primary} style={{ marginTop: 32 }} />
        ) : scenes.length === 0 ? (
          <View style={styles.emptyBox}>
            <View style={styles.emptyIcon}>
              <Mic color={COLORS.primary} size={28} />
            </View>
            <Text style={styles.emptyText}>{t('noRecordingsYet')}</Text>
          </View>
        ) : (
          <>
            <View style={[styles.statsCard, row]}>
              <View style={styles.statsIcon}>
                <Mic color={COLORS.primary} size={18} />
              </View>
              <View style={styles.statCol}>
                <Text style={[styles.statLabel, align]}>{t('recordingsStatTotal')}</Text>
                <Text style={[styles.statValue, align]}>
                  {t('recordingsStatTotalValue')
                    .replace('{scenes}', num(scenes.length))
                    .replace('{lines}', num(totalLines))}
                </Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statCol}>
                <Text style={[styles.statLabel, align]}>{t('recordingsStatLast')}</Text>
                <Text style={[styles.statValue, align]}>{formatDay(scenes[0].latestAt)}</Text>
              </View>
            </View>

            {scenes.map((scene) => {
              const scenePlaying = playingSceneId === scene.sceneId;
              return (
                <View key={scene.sceneId} style={styles.sceneCard}>
                  <View style={[styles.sceneHeader, row]}>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.sceneTitle, align]} numberOfLines={1}>
                        {scene.sceneTitle}
                      </Text>
                      <Text style={[styles.sceneMeta, align]}>
                        {num(scene.lines.length)} {t('lineLabel')} · {formatDate(scene.latestAt)}
                      </Text>
                    </View>

                    <TouchableOpacity
                      style={[styles.playAllBtn, row, scenePlaying ? styles.playAllBtnActive : null]}
                      onPress={() => playConversation(scene.sceneId, scene.lines)}
                      activeOpacity={0.85}
                    >
                      {scenePlaying ? (
                        <Pause size={13} color={COLORS.white} fill={COLORS.white} />
                      ) : (
                        <Play size={13} color={COLORS.white} fill={COLORS.white} />
                      )}
                      <Text style={styles.playAllText}>
                        {scenePlaying ? t('stopPlayAll') : t('playConversation')}
                      </Text>
                    </TouchableOpacity>
                  </View>

                  {scene.lines.map((item) => {
                    const isPlaying = playingId === item.id;
                    return (
                      <View
                        key={item.id}
                        style={[styles.recordingRow, row, isPlaying ? styles.recordingRowActive : null]}
                      >
                        <TouchableOpacity
                          style={[styles.playBtn, isPlaying ? styles.playBtnActive : null]}
                          onPress={() => handlePlay(item)}
                          activeOpacity={0.85}
                        >
                          {isPlaying ? (
                            <Pause size={15} color={COLORS.white} fill={COLORS.white} />
                          ) : (
                            <Play size={15} color={COLORS.white} fill={COLORS.white} />
                          )}
                        </TouchableOpacity>

                        <View style={{ flex: 1 }}>
                          <Text style={[styles.recordingText, align]} numberOfLines={2}>
                            <Text style={styles.recordingLineNum}>{item.lineNumber}. </Text>
                            {item.text}
                          </Text>
                          {isPlaying && (
                            <View style={[styles.wave, row]}>
                              {WAVE_BARS.map((h, i) => (
                                <View key={i} style={[styles.waveBar, { height: h }]} />
                              ))}
                            </View>
                          )}
                        </View>

                        <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDelete(item)}>
                          <Trash2 size={15} color={COLORS.muted} />
                        </TouchableOpacity>
                      </View>
                    );
                  })}
                </View>
              );
            })}

            <View style={[styles.privacyNote, row]}>
              <Lock color={COLORS.muted} size={15} />
              <Text style={[styles.privacyText, align]}>{t('recordingsPrivacyNote')}</Text>
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
};

/** ارتفاع میله‌های موجِ تزئینی زیر جمله‌ی در حال پخش (موج واقعی فایل خوانده نمی‌شود). */
const WAVE_BARS = [6, 12, 9, 16, 11, 7, 14, 10, 5, 13, 8, 15, 9, 6, 12, 10];

const styles = StyleSheet.create({
  rowReverse: { flexDirection: 'row-reverse' },
  textRight: { textAlign: 'right' },
  screen: {
    flex: 1,
    backgroundColor: COLORS.backgroundSoft,
  },
  topBar: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingTop: 48,
    paddingBottom: 14,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pageTitle: {
    color: COLORS.text,
    fontFamily: FONT_FAMILY.bold,
    fontSize: 24,
    marginBottom: 6,
  },
  pageSub: {
    color: COLORS.textSecondary,
    fontFamily: FONT_FAMILY.regular,
    fontSize: 13,
    lineHeight: 20,
    marginBottom: 18,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 120,
  },
  emptyBox: {
    alignItems: 'center',
    gap: 14,
    backgroundColor: COLORS.white,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    paddingVertical: 36,
    paddingHorizontal: 24,
  },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    color: COLORS.textSecondary,
    fontFamily: FONT_FAMILY.regular,
    fontSize: 13,
    lineHeight: 22,
    textAlign: 'center',
  },

  // ---- کارت آمار ----
  statsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: COLORS.white,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    padding: 14,
    marginBottom: 16,
  },
  statsIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statCol: {
    flex: 1,
  },
  statLabel: {
    color: COLORS.muted,
    fontFamily: FONT_FAMILY.regular,
    fontSize: 11,
  },
  statValue: {
    color: COLORS.text,
    fontFamily: FONT_FAMILY.bold,
    fontSize: 13,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    alignSelf: 'stretch',
    backgroundColor: COLORS.borderLight,
  },

  // ---- کارت هر صحنه ----
  sceneCard: {
    backgroundColor: COLORS.white,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    padding: 14,
    marginBottom: 14,
  },
  sceneHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  sceneTitle: {
    color: COLORS.text,
    fontFamily: FONT_FAMILY.bold,
    fontSize: 15,
  },
  sceneMeta: {
    color: COLORS.muted,
    fontFamily: FONT_FAMILY.regular,
    fontSize: 11,
    marginTop: 2,
  },
  playAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.primary,
  },
  playAllBtnActive: {
    backgroundColor: COLORS.text,
  },
  playAllText: {
    color: COLORS.white,
    fontFamily: FONT_FAMILY.semiBold,
    fontSize: 11,
  },
  recordingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: COLORS.backgroundSoft,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    borderRadius: 16,
    padding: 10,
    marginTop: 8,
  },
  recordingRowActive: {
    borderColor: COLORS.primary,
    backgroundColor: '#FFF6F2',
  },
  playBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playBtnActive: {
    backgroundColor: COLORS.primaryDark,
  },
  recordingText: {
    color: COLORS.text,
    fontFamily: FONT_FAMILY.medium,
    fontSize: 13,
    lineHeight: 20,
  },
  recordingLineNum: {
    color: COLORS.primaryDark,
    fontFamily: FONT_FAMILY.bold,
  },
  wave: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    height: 18,
    marginTop: 6,
  },
  waveBar: {
    width: 3,
    borderRadius: 2,
    backgroundColor: COLORS.primary,
  },
  deleteBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
  },

  privacyNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: COLORS.surfaceLight,
    borderRadius: 16,
    padding: 12,
    marginTop: 4,
  },
  privacyText: {
    flex: 1,
    color: COLORS.textSecondary,
    fontFamily: FONT_FAMILY.regular,
    fontSize: 11,
    lineHeight: 18,
  },
});
