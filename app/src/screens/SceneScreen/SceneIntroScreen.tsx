import React from 'react';
import {
  ActivityIndicator,
  ImageBackground,
  Share,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { BookOpen, ChevronDown, ChevronLeft, ChevronRight, ChevronUp, Lightbulb, Lock, MapPin, MessageCircle, Pause, Play, Share2, Volume2, X } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { COLORS } from '../../theme/colors';
import { FONT_FAMILY } from '../../theme/typography';
import { LEVEL_BADGE_STYLE, LEVEL_LABEL_KEY } from '../../components/SceneListCard';
import { AudioPlayer } from '../../components/AudioPlayer';
import type { DialogueItem, Scenario, WordEntry } from '../../data/scenarios';

/** چند واژه‌ی هر هات‌اسپات قبل از «+N تا دیگه» نشان داده می‌شود. */
const WORDS_PREVIEW_COUNT = 6;

interface SceneIntroScreenProps {
  scenario: Scenario | null;
  dialogueItems: DialogueItem[];
  coverImage: any;
  screenHeight: number;
  showAllDialogues: boolean;
  onShowAllDialogues: () => void;
  onClose: () => void;
  onEnterScene: () => void;
  /** وضعیت دانلود صدای جمله‌ها؛ تا finished نشده دکمه‌ی ورود منتظر می‌ماند. */
  audioPrep: { done: number; total: number; failed: number; finished: boolean };
  onRetryAudio: () => void;
  /** خودِ صحنه از سرور نیامد؛ به‌جای چرخش بی‌پایان، پیام و تلاش دوباره. */
  loadFailed: boolean;
  onRetryLoad: () => void;
  isLocked?: boolean;
  lockMessage?: string;
  onOpenPaywall?: () => void;
  /** فارسی: چیدمان راست‌به‌چپ. */
  rtl?: boolean;
  t: (key: string) => string;
}

/**
 * صفحه‌ی معرفیِ صحنه (قبل از ورود): بنر تصویر، عنوان/سطح/توضیح، آمار
 * هات‌اسپات‌ها/جملات/دقیقه، بنر روش ۴مرحله‌ای، پیش‌نمایش دیالوگ‌ها و دکمه‌ی
 * ورود به صحنه.
 */
const SCENE_REAL_PHOTOS = [
  'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?auto=format&fit=crop&w=800&q=80', // Airport
  'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=800&q=80', // Cafe
  'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?auto=format&fit=crop&w=800&q=80', // City
  'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80', // Hotel
  'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=800&q=80', // Shopping
  'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&q=80', // Restaurant
];

export const SceneIntroScreen: React.FC<SceneIntroScreenProps> = ({
  scenario,
  dialogueItems,
  coverImage,
  screenHeight,
  showAllDialogues,
  onShowAllDialogues,
  onClose,
  onEnterScene,
  audioPrep,
  onRetryAudio,
  loadFailed,
  onRetryLoad,
  isLocked = false,
  lockMessage,
  onOpenPaywall,
  rtl = false,
  t,
}) => {
  const insets = useSafeAreaInsets();
  const row = rtl && styles.rowReverse;
  const tr = rtl && styles.textRight;
  const levelInfo = LEVEL_BADGE_STYLE[scenario?.level || 'Beginner'] || LEVEL_BADGE_STYLE.Beginner;
  const LevelIcon = levelInfo.Icon;
  const levelLabel = t(LEVEL_LABEL_KEY[scenario?.level || 'Beginner'] || LEVEL_LABEL_KEY.Beginner);
  const hotspotsCount = scenario?.hotspots?.length || 0;
  const sentencesTotal = dialogueItems.length;
  const minutesCount = parseInt(scenario?.time || '0', 10) || 0;
  const previewDialogues = showAllDialogues ? dialogueItems : dialogueItems.slice(0, 2);
  const moreSentencesCount = Math.max(0, sentencesTotal - previewDialogues.length);

  // واژه‌های انتخاب‌شده‌ی هر هات‌اسپات (یکتا، به ترتیب دیالوگ‌ها)؛ هات‌اسپاتِ بدون واژه نشان داده نمی‌شود.
  const hotspotWordGroups = (scenario?.hotspots || [])
    .map((h) => {
      const seen = new Set<string>();
      const words: WordEntry[] = [];
      for (const d of h.conversation?.dialogues || []) {
        for (const w of d.words || []) {
          const key = (w.word || '').trim().toLowerCase();
          if (!key || seen.has(key)) continue;
          seen.add(key);
          words.push(w);
        }
      }
      return { id: h.id, name: h.conversation?.title || '', words };
    })
    .filter((g) => g.words.length > 0);

  const grammarNote = scenario?.grammarNote;
  const [grammarOpen, setGrammarOpen] = React.useState(true);
  const [expandedWordGroups, setExpandedWordGroups] = React.useState<Record<string, boolean>>({});

  // پخشِ صدای نکته‌ی گرامری (اگر ادمین از پنل ساخته باشد) — عیناً هم‌الگویِ
  // playAudio در AIConversation: هر بار actionNonce عوض می‌شود تا AudioPlayer
  // بداند دستورِ تازه‌ای (نه تکرارِ همان قبلی) صادر شده.
  const [grammarAudioPlaying, setGrammarAudioPlaying] = React.useState(false);
  const [grammarActionCommand, setGrammarActionCommand] = React.useState<'none' | 'play_original'>('none');
  const [grammarActionNonce, setGrammarActionNonce] = React.useState(0);

  const toggleGrammarAudio = () => {
    if (!grammarNote?.audioUrl) return;
    setGrammarActionCommand('play_original');
    setGrammarActionNonce((n) => n + 1);
    setGrammarAudioPlaying(true);
  };

  const handleShare = () => {
    Share.share({ message: scenario?.title || 'Shadow' }).catch(() => {});
  };

  const resolvedCoverSource = React.useMemo(() => {
    if (coverImage && typeof coverImage === 'object' && (coverImage as any).uri && (coverImage as any).uri.startsWith('http')) {
      return coverImage;
    }
    const title = (scenario?.title || '').toLowerCase();
    if (title.includes('airport') || title.includes('flight') || title.includes('plane') || title.includes('فرودگاه')) {
      return { uri: SCENE_REAL_PHOTOS[0] };
    }
    if (title.includes('cafe') || title.includes('coffee') || title.includes('کافه')) {
      return { uri: SCENE_REAL_PHOTOS[1] };
    }
    if (title.includes('city') || title.includes('london') || title.includes('street') || title.includes('شهر')) {
      return { uri: SCENE_REAL_PHOTOS[2] };
    }
    if (title.includes('hotel') || title.includes('reception') || title.includes('هتل')) {
      return { uri: SCENE_REAL_PHOTOS[3] };
    }
    if (title.includes('shop') || title.includes('clothes') || title.includes('خرید')) {
      return { uri: SCENE_REAL_PHOTOS[4] };
    }
    if (title.includes('restaur') || title.includes('food') || title.includes('رستوران')) {
      return { uri: SCENE_REAL_PHOTOS[5] };
    }
    return coverImage || { uri: SCENE_REAL_PHOTOS[1] };
  }, [coverImage, scenario?.title]);

  return (
    <View style={styles.container}>
      <AudioPlayer
        uri={grammarNote?.audioUrl || null}
        shouldPlay={false}
        actionCommand={grammarActionCommand}
        actionNonce={grammarActionNonce}
        onPlaybackStatusUpdate={(status) => {
          if (status === 'finished' || status === 'error' || status === 'no_audio') {
            setGrammarAudioPlaying(false);
          }
        }}
      />
      {/* Floating Top Navigation Header — همیشه بالای نوار وضعیت و حتی حین اسکرول در دسترس است */}
      <View
        style={[
          styles.floatingHeader,
          { top: Math.max(insets.top, 16) + 4 },
          rtl && styles.rowReverse,
        ]}
      >
        <TouchableOpacity
          style={styles.headerBtn}
          onPress={onClose}
          hitSlop={{ top: 14, bottom: 14, left: 14, right: 14 }}
          activeOpacity={0.8}
        >
          {rtl ? <ChevronRight size={22} color={COLORS.white} /> : <ChevronLeft size={22} color={COLORS.white} />}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.headerBtn}
          onPress={handleShare}
          hitSlop={{ top: 14, bottom: 14, left: 14, right: 14 }}
          activeOpacity={0.8}
        >
          <Share2 size={18} color={COLORS.white} />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={[styles.introScroll, { paddingTop: Math.max(insets.top, 16) + 54 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Cover Hero Banner */}
        <View style={[styles.introCoverWrapper, { height: screenHeight / 3 }]}>
          <ImageBackground source={resolvedCoverSource} style={styles.introCover}>
            <View style={styles.introCoverScrim} />
          </ImageBackground>
        </View>

        {/* Scenario Meta Header */}
        <View style={styles.introHeader}>
          <View style={[styles.introTitleRow, row]}>
            <Text style={[styles.introTitle, tr]}>{scenario?.title ?? ''}</Text>
            <View style={[styles.introLevelBadge, row, { backgroundColor: levelInfo.bg }]}>
              <LevelIcon size={12} color={levelInfo.text} />
              <Text style={[styles.introLevelBadgeText, { color: levelInfo.text }]}>
                {levelLabel}
              </Text>
            </View>
          </View>
          <Text style={styles.introDesc}>
            {scenario?.description ||
              'Maya has ten dollars and a hungry roommate. Walk the aisles, ask for prices, and get to the checkout before it closes.'}
          </Text>
        </View>

        {/* 3 Metric Pills Row */}
        <View style={[styles.statsRow, row]}>
          <View style={styles.statPill}>
            <Text style={styles.statNumber}>{hotspotsCount}</Text>
            <Text style={styles.statLabel}>{t('hotspots')}</Text>
          </View>

          <View style={styles.statPill}>
            <Text style={styles.statNumber}>{sentencesTotal}</Text>
            <Text style={styles.statLabel}>{t('sentencesCount')}</Text>
          </View>

          <View style={styles.statPill}>
            <Text style={styles.statNumber}>{minutesCount}</Text>
            <Text style={styles.statLabel}>{t('minutesCount')}</Text>
          </View>
        </View>

        {/* Grammar Note (optional, per scene) */}
        {!!grammarNote && (
          <View style={styles.infoCard}>
            <TouchableOpacity
              activeOpacity={0.8}
              style={[styles.infoCardHeader, row]}
              onPress={() => setGrammarOpen((v) => !v)}
            >
              <View style={styles.infoIconCircle}>
                <BookOpen size={16} color={COLORS.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.infoCardTitle, tr]}>{t('sceneGrammarTitle')}</Text>
                {!!grammarNote.topic && <Text style={[styles.grammarTopic, tr]}>{grammarNote.topic}</Text>}
              </View>
              {grammarOpen ? (
                <ChevronUp size={18} color={COLORS.textSecondary} />
              ) : (
                <ChevronDown size={18} color={COLORS.textSecondary} />
              )}
            </TouchableOpacity>

            {grammarOpen && (
              <View style={styles.infoCardBody}>
                {!!grammarNote.explanation && (
                  <View style={[styles.grammarExplanationRow, row]}>
                    <Text style={[styles.grammarExplanation, tr]}>{grammarNote.explanation}</Text>
                    {!!grammarNote.audioUrl && (
                      <TouchableOpacity
                        activeOpacity={0.8}
                        style={styles.grammarAudioBtn}
                        onPress={toggleGrammarAudio}
                      >
                        {grammarAudioPlaying ? (
                          <Pause size={16} color={COLORS.primary} />
                        ) : (
                          <Volume2 size={16} color={COLORS.primary} />
                        )}
                      </TouchableOpacity>
                    )}
                  </View>
                )}
                {grammarNote.examples.length > 0 && (
                  <>
                    <Text style={[styles.grammarExamplesLabel, tr]}>{t('sceneGrammarExamples')}</Text>
                    {grammarNote.examples.map((ex, i) => (
                      <View key={i} style={styles.grammarExample}>
                        <Text style={[styles.grammarExampleText, tr]}>{ex.text}</Text>
                        {!!ex.translation && (
                          <Text style={[styles.grammarExampleTranslation, tr]}>{ex.translation}</Text>
                        )}
                      </View>
                    ))}
                  </>
                )}
              </View>
            )}
          </View>
        )}

        {/* Words per hotspot */}
        {hotspotWordGroups.length > 0 && (
          <View style={styles.infoCard}>
            <View style={[styles.infoCardHeader, row]}>
              <View style={styles.infoIconCircle}>
                <MessageCircle size={16} color={COLORS.primary} />
              </View>
              <Text style={styles.infoCardTitle}>{t('sceneWordsTitle')}</Text>
            </View>

            <View style={styles.infoCardBody}>
              {hotspotWordGroups.map((group) => {
                const expanded = !!expandedWordGroups[group.id];
                const visible = expanded ? group.words : group.words.slice(0, WORDS_PREVIEW_COUNT);
                const hiddenCount = group.words.length - visible.length;
                return (
                  <View key={group.id} style={styles.wordGroup}>
                    {!!group.name && (
                      <View style={[styles.wordGroupHeader, row]}>
                        <MapPin size={13} color={COLORS.textSecondary} />
                        <Text style={styles.wordGroupName}>{group.name}</Text>
                      </View>
                    )}
                    <View style={[styles.wordChips, row]}>
                      {visible.map((w) => (
                        <View key={w.word} style={styles.wordChip}>
                          <Text style={styles.wordChipWord}>{w.word}</Text>
                          {!!w.meaning && <Text style={styles.wordChipMeaning}>{w.meaning}</Text>}
                        </View>
                      ))}
                    </View>
                    {(hiddenCount > 0 || expanded) && group.words.length > WORDS_PREVIEW_COUNT && (
                      <TouchableOpacity
                        onPress={() =>
                          setExpandedWordGroups((prev) => ({ ...prev, [group.id]: !expanded }))
                        }
                        hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                      >
                        <Text style={[styles.wordsToggle, tr]}>
                          {expanded
                            ? t('sceneWordsLess')
                            : t('sceneWordsMore').replace('{count}', String(hiddenCount))}
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {/* 4-Step Method Tip Banner */}
        <View style={[styles.tipBanner, row]}>
          <View style={styles.tipIconCircle}>
            <Lightbulb size={18} color="#F5A623" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.tipTitle, tr]}>{t('fourStepMethodTitle')}</Text>
            <Text style={[styles.tipText, tr]}>{t('sceneRuleTip')}</Text>
          </View>
        </View>

        {/* Dialogue Preview */}
        <Text style={[styles.conversationsLabel, tr]}>{t('dialoguePreview')}</Text>

        <View style={styles.conversationsList}>
          {previewDialogues.map((item, index) => (
            <TouchableOpacity
              key={item.id || index}
              activeOpacity={0.8}
              style={[styles.convCard, row]}
              onPress={onEnterScene}
              disabled={!audioPrep.finished}
            >
              <View style={styles.convNumCircle}>
                <MessageCircle size={16} color={COLORS.primary} />
              </View>

              <View style={{ flex: 1 }}>
                <Text style={[styles.convTitle, tr]}>{item.dialogue}</Text>
                <Text style={[styles.convFaTitle, tr]}>{item.translation}</Text>
              </View>
            </TouchableOpacity>
          ))}

          {moreSentencesCount > 0 && (
            <TouchableOpacity style={[styles.moreSentencesRow, row]} onPress={onShowAllDialogues}>
              <Text style={styles.moreSentencesText}>
                {moreSentencesCount} {t('moreSentencesSuffix')}
              </Text>
              {rtl ? (
                <ChevronLeft size={16} color={COLORS.textSecondary} />
              ) : (
                <ChevronRight size={16} color={COLORS.textSecondary} />
              )}
            </TouchableOpacity>
          )}
        </View>

        {isLocked && (
          <View style={styles.lockedCard}>
            <View style={styles.lockIconCircle}>
              <Lock size={22} color={COLORS.white} />
            </View>
            <Text style={styles.lockedCardTitle}>این صحنه قفل است</Text>
            <Text style={styles.lockedCardDesc}>
              {lockMessage || 'برای تمرین این صحنه و دسترسی به تمام امکانات، اشتراک فعال لازم است.'}
            </Text>
            <TouchableOpacity
              style={styles.lockedCardBtn}
              activeOpacity={0.88}
              onPress={onOpenPaywall}
            >
              <Text style={styles.lockedCardBtnText}>مشاهده پلن‌ها و خرید اشتراک</Text>
            </TouchableOpacity>
          </View>
        )}

        {!isLocked && loadFailed && (
          <View style={styles.audioFailRow}>
            <Text style={styles.audioFailText}>{t('sceneLoadFailed')}</Text>
            <TouchableOpacity onPress={onRetryLoad} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Text style={styles.audioRetryText}>{t('sceneAudioRetry')}</Text>
            </TouchableOpacity>
          </View>
        )}
        {!isLocked && audioPrep.finished && audioPrep.failed > 0 && (
          <View style={styles.audioFailRow}>
            <Text style={styles.audioFailText}>
              {t('sceneAudioFailed').replace('{n}', String(audioPrep.failed))}
            </Text>
            <TouchableOpacity onPress={onRetryAudio} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Text style={styles.audioRetryText}>{t('sceneAudioRetry')}</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={{ height: 24 }} />
      </ScrollView>
      {/* دکمه‌ی ورود همیشه پایین صفحه دیده می‌شود؛ قبلاً ته اسکرول بود و کاربر بعد از
          خواندن توضیح و گرامر راه شروع را پیدا نمی‌کرد. */}
      <View style={[styles.ctaBar, { paddingBottom: Math.max(insets.bottom, 12) + 4 }]}>
        {isLocked ? (
          <TouchableOpacity
            activeOpacity={0.88}
            style={[styles.enterCtaBtn, styles.enterCtaBtnLocked, row]}
            onPress={onOpenPaywall}
          >
            <Lock size={20} color={COLORS.white} />
            <Text style={styles.enterCtaText}>
              قفل است · ارتقا به اشتراک ویژه
            </Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            activeOpacity={0.88}
            style={[styles.enterCtaBtn, row, !audioPrep.finished && styles.enterCtaBtnWaiting]}
            onPress={onEnterScene}
            disabled={!audioPrep.finished}
            accessibilityState={{ disabled: !audioPrep.finished, busy: !audioPrep.finished }}
          >
            {audioPrep.finished ? (
              <View style={rtl ? styles.flipX : undefined}>
                <Play size={20} color={COLORS.white} fill={COLORS.white} />
              </View>
            ) : (
              <ActivityIndicator size="small" color={COLORS.white} />
            )}
            <Text style={styles.enterCtaText}>
              {audioPrep.finished
                ? t('enterScene')
                : t('sceneAudioPreparing')
                    .replace('{done}', String(audioPrep.done))
                    .replace('{total}', String(audioPrep.total))}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  rowReverse: { flexDirection: 'row-reverse' },
  textRight: { textAlign: 'right' },
  // مثلث پخش در فارسی رو به چپ (جهت «جلو»).
  flipX: { transform: [{ scaleX: -1 }] },
  infoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#F0EBE3',
    padding: 16,
    marginBottom: 16,
    shadowColor: '#1A1D26',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  infoCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  infoIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFF1EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoCardTitle: {
    fontFamily: FONT_FAMILY.bold,
    fontSize: 15,
    color: '#191C21',
  },
  infoCardBody: {
    marginTop: 12,
    gap: 10,
  },
  grammarTopic: {
    fontFamily: FONT_FAMILY.semiBold,
    fontSize: 13,
    color: '#FF6422',
    marginTop: 1,
  },
  grammarExplanationRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  grammarExplanation: {
    flex: 1,
    fontFamily: FONT_FAMILY.regular,
    fontSize: 14,
    lineHeight: 22,
    color: '#697082',
  },
  grammarAudioBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FFF1EB',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  grammarExamplesLabel: {
    fontFamily: FONT_FAMILY.semiBold,
    fontSize: 12,
    color: '#8E95A5',
    marginTop: 2,
  },
  grammarExample: {
    backgroundColor: '#FAF7F2',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#F2EDE4',
  },
  grammarExampleText: {
    fontFamily: FONT_FAMILY.semiBold,
    fontSize: 14,
    color: '#191C21',
  },
  grammarExampleTranslation: {
    fontFamily: FONT_FAMILY.regular,
    fontSize: 13,
    color: '#697082',
    marginTop: 2,
  },
  wordGroup: {
    gap: 8,
  },
  wordGroupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  wordGroupName: {
    fontFamily: FONT_FAMILY.semiBold,
    fontSize: 13,
    color: '#697082',
  },
  wordChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  wordChip: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#F0EBE3',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  wordChipWord: {
    fontFamily: FONT_FAMILY.semiBold,
    fontSize: 13,
    color: '#191C21',
  },
  wordChipMeaning: {
    fontFamily: FONT_FAMILY.regular,
    fontSize: 12,
    color: '#697082',
    marginTop: 1,
  },
  wordsToggle: {
    fontFamily: FONT_FAMILY.semiBold,
    fontSize: 12,
    color: '#FF6422',
  },
  container: {
    flex: 1,
    backgroundColor: '#FDFBF7',
  },
  introScroll: {
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  floatingHeader: {
    position: 'absolute',
    left: 20,
    right: 20,
    zIndex: 99,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(25, 28, 33, 0.7)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
  introCoverWrapper: {
    height: 240,
    borderRadius: 26,
    overflow: 'hidden',
    marginTop: 8,
    marginBottom: 20,
  },
  introCover: {
    width: '100%',
    height: '100%',
  },
  introCoverScrim: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(12, 16, 23, 0.25)',
  },
  closeBtn: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(15, 20, 28, 0.75)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  shareBtn: {
    left: 16,
    right: undefined,
  },
  introHeader: {
    marginBottom: 20,
  },
  introTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    marginBottom: 10,
  },
  introLevelBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  introLevelBadgeText: {
    fontFamily: FONT_FAMILY.bold,
    fontSize: 11,
  },
  introTitle: {
    flex: 1,
    color: '#191C21',
    fontFamily: FONT_FAMILY.bold,
    fontSize: 27,
    letterSpacing: -0.5,
  },
  introDesc: {
    color: '#697082',
    fontFamily: FONT_FAMILY.regular,
    fontSize: 14,
    lineHeight: 22,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 24,
  },
  statPill: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#F0EBE3',
    shadowColor: '#1A1D26',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  statNumber: {
    color: '#191C21',
    fontFamily: FONT_FAMILY.bold,
    fontSize: 21,
  },
  statLabel: {
    color: '#8E95A5',
    fontFamily: FONT_FAMILY.medium,
    fontSize: 11.5,
    marginTop: 2,
  },
  conversationsLabel: {
    color: '#697082',
    fontFamily: FONT_FAMILY.bold,
    fontSize: 13,
    marginBottom: 12,
  },
  conversationsList: {
    gap: 10,
    marginBottom: 20,
  },
  convCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 14,
    borderWidth: 1,
    borderColor: '#F0EBE3',
    shadowColor: '#1A1D26',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  convNumCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#FFF1EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  convTitle: {
    color: '#191C21',
    fontFamily: FONT_FAMILY.bold,
    fontSize: 14,
    marginBottom: 4,
  },
  convFaTitle: {
    color: '#697082',
    fontFamily: FONT_FAMILY.regular,
    fontSize: 13,
  },
  moreSentencesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
  },
  moreSentencesText: {
    color: '#697082',
    fontFamily: FONT_FAMILY.semiBold,
    fontSize: 13,
  },
  tipBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FFF9F5',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#FFEADF',
    gap: 12,
    marginBottom: 24,
  },
  tipIconCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#FFE5D6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tipTitle: {
    color: '#191C21',
    fontFamily: FONT_FAMILY.bold,
    fontSize: 14,
    marginBottom: 4,
  },
  tipText: {
    color: '#697082',
    fontFamily: FONT_FAMILY.regular,
    fontSize: 13,
    lineHeight: 20,
    flex: 1,
  },
  ctaBar: {
    paddingHorizontal: 20,
    paddingTop: 10,
    backgroundColor: '#FDFBF7',
    borderTopWidth: 1,
    borderTopColor: '#F0EBE3',
  },
  enterCtaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FF6422',
    borderRadius: 28,
    height: 56,
    gap: 10,
    shadowColor: '#FF6422',
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 5,
  },
  enterCtaText: {
    color: '#FFFFFF',
    fontFamily: FONT_FAMILY.bold,
    fontSize: 16,
  },
  enterCtaBtnWaiting: {
    opacity: 0.75,
  },
  audioFailRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginTop: 10,
  },
  audioFailText: {
    color: '#697082',
    fontFamily: FONT_FAMILY.regular,
    fontSize: 13,
  },
  audioRetryText: {
    color: '#FF6422',
    fontFamily: FONT_FAMILY.bold,
    fontSize: 13,
  },
  enterCtaBtnLocked: {
    backgroundColor: '#FF6422',
  },
  lockedCard: {
    backgroundColor: '#FFF7F2',
    borderWidth: 1.5,
    borderColor: '#FCD7C7',
    borderRadius: 20,
    padding: 20,
    marginHorizontal: 20,
    marginBottom: 16,
    alignItems: 'center',
    gap: 8,
  },
  lockIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FF6422',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  lockedCardTitle: {
    fontFamily: FONT_FAMILY.bold,
    fontSize: 17,
    color: '#191C21',
    textAlign: 'center',
  },
  lockedCardDesc: {
    fontFamily: FONT_FAMILY.regular,
    fontSize: 13,
    color: '#7C2D12',
    textAlign: 'center',
    lineHeight: 21,
    paddingHorizontal: 8,
  },
  lockedCardBtn: {
    marginTop: 8,
    backgroundColor: '#FF6422',
    paddingHorizontal: 20,
    paddingVertical: 11,
    borderRadius: 24,
  },
  lockedCardBtnText: {
    fontFamily: FONT_FAMILY.bold,
    fontSize: 13,
    color: '#FFFFFF',
  },
});
