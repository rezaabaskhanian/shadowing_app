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
import { ChevronLeft, Mic, Pause, Play, Trash2 } from 'lucide-react-native';

import { AudioPlayer } from '../components/AudioPlayer';
import { useLanguage } from '../data/i18n';
import { deleteRecording, listRecordings, type RecordingMeta } from '../services/RecordingsService';
import { COLORS } from '../theme/colors';
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

  const formatDate = (ms: number) =>
    new Date(ms).toLocaleString(language === 'fa' ? 'fa-IR' : 'en-US', {
      dateStyle: 'short',
      timeStyle: 'short',
    });

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

      <View style={styles.topBar}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <ChevronLeft color={COLORS.text} size={20} />
        </TouchableOpacity>
        <Text style={styles.pageTitle}>{t('myRecordings')}</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={styles.pageSub}>{t('myRecordingsSub')}</Text>

        {scenes === null ? (
          <ActivityIndicator color={COLORS.primary} style={{ marginTop: 32 }} />
        ) : scenes.length === 0 ? (
          <View style={styles.emptyBox}>
            <Mic color={COLORS.muted} size={28} />
            <Text style={styles.emptyText}>{t('noRecordingsYet')}</Text>
          </View>
        ) : (
          scenes.map((scene) => {
            const scenePlaying = playingSceneId === scene.sceneId;
            return (
              <View key={scene.sceneId} style={styles.sceneGroup}>
                <View style={styles.sceneHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.sceneTitle} numberOfLines={1}>
                      {scene.sceneTitle}
                    </Text>
                    <Text style={styles.sceneMeta}>
                      {scene.lines.length} {t('lineLabel')} · {formatDate(scene.latestAt)}
                    </Text>
                  </View>

                  <TouchableOpacity
                    style={[styles.playAllBtn, scenePlaying ? styles.playAllBtnActive : null]}
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
                      style={[styles.recordingCard, isPlaying ? styles.recordingCardActive : null]}
                    >
                      <TouchableOpacity
                        style={[styles.playBtn, isPlaying ? styles.playBtnActive : null]}
                        onPress={() => handlePlay(item)}
                        activeOpacity={0.85}
                      >
                        {isPlaying ? (
                          <Pause size={16} color={COLORS.white} fill={COLORS.white} />
                        ) : (
                          <Play size={16} color={COLORS.white} fill={COLORS.white} />
                        )}
                      </TouchableOpacity>

                      <View style={{ flex: 1 }}>
                        <Text style={styles.recordingText} numberOfLines={2}>
                          <Text style={styles.recordingLineNum}>{item.lineNumber}. </Text>
                          {item.text}
                        </Text>
                      </View>

                      <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDelete(item)}>
                        <Trash2 size={15} color={COLORS.error} />
                      </TouchableOpacity>
                    </View>
                  );
                })}
              </View>
            );
          })
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 20,
    paddingTop: 56,
    paddingBottom: 8,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pageTitle: {
    color: COLORS.text,
    fontFamily: FONT_FAMILY.bold,
    fontSize: 22,
  },
  pageSub: {
    color: COLORS.textSecondary,
    fontFamily: FONT_FAMILY.regular,
    fontSize: 13,
    marginBottom: 16,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 120,
  },
  emptyBox: {
    alignItems: 'center',
    gap: 10,
    paddingVertical: 48,
  },
  emptyText: {
    color: COLORS.textSecondary,
    fontFamily: FONT_FAMILY.regular,
    fontSize: 13,
    textAlign: 'center',
  },
  recordingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 18,
    padding: 12,
    marginBottom: 10,
  },
  playBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playBtnActive: {
    backgroundColor: COLORS.secondary,
  },
  recordingText: {
    color: COLORS.textSecondary,
    fontFamily: FONT_FAMILY.regular,
    fontSize: 12,
    marginTop: 2,
  },
  deleteBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: COLORS.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ---- گروه‌بندی بر اساس صحنه ----
  sceneGroup: {
    marginBottom: 22,
  },
  sceneHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  sceneTitle: {
    color: COLORS.text,
    fontFamily: FONT_FAMILY.bold,
    fontSize: 15,
  },
  sceneMeta: {
    color: COLORS.muted,
    fontFamily: FONT_FAMILY.regular,
    fontSize: 10,
    marginTop: 2,
  },
  playAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 999,
    backgroundColor: COLORS.primary,
  },
  playAllBtnActive: {
    backgroundColor: COLORS.error,
  },
  playAllText: {
    color: COLORS.white,
    fontFamily: FONT_FAMILY.semiBold,
    fontSize: 11,
  },
  recordingCardActive: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primaryLight,
  },
  recordingLineNum: {
    color: COLORS.primary,
    fontFamily: FONT_FAMILY.bold,
  },
});
