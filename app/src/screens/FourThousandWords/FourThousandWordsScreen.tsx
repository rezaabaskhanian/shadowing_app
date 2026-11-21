import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  BookmarkPlus,
  BookMarked,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Clock,
  Crown,
  Headphones,
  Layers,
  Lock,
  Mic,
  PenLine,
  Play,
  Search,
  Sparkles,
  X,
  Zap,
} from 'lucide-react-native';

import { COLORS, SPACING, BORDER_RADIUS, hexToRgba } from '../../theme/colors';
import { FONT_FAMILY } from '../../theme/typography';
import { useLanguage } from '../../data/i18n';
import { useAuth } from '../../data/AuthContext';
import { getSubscriptionStatus, type SubscriptionStatus } from '../../api/billing';
import { absUrl } from '../../api/config';
import { getPodcastSeriesDetail, type Podcast, type PodcastSeries } from '../../api/podcasts';
import { addWordsBatch } from '../../api/leitner';
import { useToast } from '../../data/ToastContext';
import { formatDuration } from '../Podcast/PodcastListScreen';

interface BookMeta {
  id: number;
  seriesId: string;
  titleFa: string;
  titleEn: string;
  level: string;
  levelLabelFa: string;
  color: string;
  bg: string;
}

const BOOKS: BookMeta[] = [
  {
    id: 1,
    seriesId: '40000000-0001-0000-0000-000000000001',
    titleFa: 'کتاب ۱ (مقدماتی)',
    titleEn: 'Book 1',
    level: 'beginner',
    levelLabelFa: 'سطح A2 - پایه',
    color: '#059669',
    bg: '#ECFDF5',
  },
  {
    id: 2,
    seriesId: '40000000-0002-0000-0000-000000000002',
    titleFa: 'کتاب ۲ (متوسط)',
    titleEn: 'Book 2',
    level: 'intermediate',
    levelLabelFa: 'سطح B1 - متوسط',
    color: '#2563EB',
    bg: '#EFF6FF',
  },
  {
    id: 3,
    seriesId: '40000000-0003-0000-0000-000000000003',
    titleFa: 'کتاب ۳ (رو به بالا)',
    titleEn: 'Book 3',
    level: 'intermediate',
    levelLabelFa: 'سطح B1+ - متوسط',
    color: '#D97706',
    bg: '#FFFBEB',
  },
  {
    id: 4,
    seriesId: '40000000-0004-0000-0000-000000000004',
    titleFa: 'کتاب ۴ (پیشرفته)',
    titleEn: 'Book 4',
    level: 'advanced',
    levelLabelFa: 'سطح B2 - پیشرفته',
    color: '#7C3AED',
    bg: '#F5F3FF',
  },
  {
    id: 5,
    seriesId: '40000000-0005-0000-0000-000000000005',
    titleFa: 'کتاب ۵ (حرفه‌ای)',
    titleEn: 'Book 5',
    level: 'advanced',
    levelLabelFa: 'سطح C1 - حرفه‌ای',
    color: '#E11D48',
    bg: '#FFF1F2',
  },
  {
    id: 6,
    seriesId: '40000000-0006-0000-0000-000000000006',
    titleFa: 'کتاب ۶ (تسلط کامل)',
    titleEn: 'Book 6',
    level: 'proficient',
    levelLabelFa: 'سطح C2 - نیتیو',
    color: '#DC2626',
    bg: '#FEF2F2',
  },
];

export const FourThousandWordsScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const { language } = useLanguage();
  const { user } = useAuth();
  const rtl = language === 'fa';
  const row = rtl && styles.rowReverse;
  const ta = rtl ? styles.textRight : styles.textLeft;
  const toast = useToast();

  const [selectedBook, setSelectedBook] = useState<number>(1);
  const [activeTab, setActiveTab] = useState<'scenes' | 'podcasts'>('scenes');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [seriesData, setSeriesData] = useState<PodcastSeries | null>(null);
  const [addingLeitnerId, setAddingLeitnerId] = useState<string | null>(null);
  const [isSubscribed, setIsSubscribed] = useState(false);

  const currentBook = BOOKS.find((b) => b.id === selectedBook) || BOOKS[0];

  const checkSubscription = useCallback(() => {
    if (user?.role === 'admin') {
      setIsSubscribed(true);
      return;
    }
    getSubscriptionStatus()
      .then((s: SubscriptionStatus) => setIsSubscribed(!!s?.active))
      .catch(() => setIsSubscribed(false));
  }, [user?.role]);

  const loadBookData = useCallback(async (bookId: number) => {
    const book = BOOKS.find((b) => b.id === bookId);
    if (!book) return;

    setLoading(true);
    try {
      const res = await getPodcastSeriesDetail(book.seriesId);
      setSeriesData(res);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      checkSubscription();
      loadBookData(selectedBook);
    }, [selectedBook, loadBookData, checkSubscription]),
  );

  // درس‌های ۱ و ۲ از کتاب اول نمونه رایگان هستند؛ سایر دروس و بقیه کتاب‌ها نیازمند اشتراک ویژه
  const isUnitLocked = useCallback(
    (index: number) => {
      if (isSubscribed) return false;
      return selectedBook > 1 || index >= 2;
    },
    [isSubscribed, selectedBook],
  );

  const episodes = seriesData?.episodes || [];

  const filteredEpisodes = episodes.filter((ep) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.trim().toLowerCase();
    const titleMatch = ep.title.toLowerCase().includes(q) || (ep.description_fa || '').includes(q);
    const vocabMatch = ep.vocabulary?.some(
      (v) => v.word.toLowerCase().includes(q) || v.meaning_fa.includes(q),
    );
    return titleMatch || vocabMatch;
  });

  const handleAddAllToLeitner = async (ep: Podcast, isLocked: boolean) => {
    if (isLocked) {
      navigation.navigate('Paywall');
      return;
    }
    if (!ep.vocabulary || ep.vocabulary.length === 0) return;
    setAddingLeitnerId(ep.id);
    try {
      await addWordsBatch(
        ep.vocabulary.map((v) => ({
          word: v.word,
          meaning: v.meaning_fa,
        })),
      );
      toast.success(
        rtl
          ? `✓ تمام ۲۰ واژه درس به جعبه لایتنر شما افزوده شدند`
          : `Added vocabulary to Leitner box`,
      );
    } catch {
      toast.error(rtl ? 'خطا در ثبت واژگان در لایتنر' : 'Failed to add words to Leitner');
    } finally {
      setAddingLeitnerId(null);
    }
  };

  const renderSceneItem = ({ item, index }: { item: Podcast; index: number }) => {
    const unitNo = item.episode_no || index + 1;
    const sceneId = item.scene_id || `4000${selectedBook}000-0000-0000-0000-000${unitNo < 10 ? '0' + unitNo : unitNo}00000001`;
    const isLocked = isUnitLocked(index);

    return (
      <View style={[styles.card, isLocked && styles.cardLocked]}>
        <View style={[styles.cardHeader, row]}>
          <View style={[styles.unitNumberBadge, { backgroundColor: currentBook.bg, borderColor: currentBook.color }]}>
            <Text style={[styles.unitNumberText, { color: currentBook.color }]}>
              {rtl ? `درس ${unitNo}` : `Unit ${unitNo}`}
            </Text>
          </View>
          <View style={styles.flex1}>
            <Text style={[styles.cardTitle, ta]} numberOfLines={1}>
              {item.title}
            </Text>
            <Text style={[styles.cardSubtitle, ta]} numberOfLines={1}>
              {item.description_fa || 'تمرین شادوئینگ و تثبیت مکالمه نیتیو'}
            </Text>
          </View>
          {isLocked ? (
            <View style={[styles.vipBadge, row]}>
              <Lock size={10} color="#B45309" />
              <Text style={styles.vipBadgeText}>{rtl ? 'ویژه VIP' : 'VIP'}</Text>
            </View>
          ) : (
            <View style={[styles.freeBadge, row]}>
              <Sparkles size={10} color="#059669" />
              <Text style={styles.freeBadgeText}>{rtl ? 'رایگان' : 'Free'}</Text>
            </View>
          )}
        </View>

        {/* پیش‌نمایش تصویر سناریو */}
        {item.cover_url ? (
          <View style={styles.cardImageWrap}>
            <Image
              source={{ uri: absUrl(item.cover_url) }}
              style={styles.cardImage}
              resizeMode="cover"
            />
            {isLocked && (
              <View style={styles.imageLockOverlay}>
                <Lock size={20} color="#FFFFFF" />
              </View>
            )}
          </View>
        ) : null}

        {/* چیپ‌های واژگان کلیدی این درس */}
        {item.vocabulary && item.vocabulary.length > 0 && (
          <View style={styles.vocabSnippetBox}>
            <View style={[styles.vocabSnippetHeader, row]}>
              <Sparkles size={12} color="#D97706" />
              <Text style={styles.vocabSnippetHeaderText}>
                {rtl
                  ? `واژگان کلیدی این درس (${item.vocabulary.length} واژه):`
                  : `Key Target Words (${item.vocabulary.length}):`}
              </Text>
            </View>
            <View style={[styles.vocabPillsRow, row]}>
              {item.vocabulary.slice(0, 6).map((v, vi) => (
                <View key={vi} style={styles.vocabPill}>
                  <Text style={styles.vocabPillWord}>{v.word}</Text>
                  <Text style={styles.vocabPillMeaning}>({v.meaning_fa})</Text>
                </View>
              ))}
              {item.vocabulary.length > 6 && (
                <View style={[styles.vocabPill, styles.vocabPillMore]}>
                  <Text style={styles.vocabPillMoreText}>+{item.vocabulary.length - 6}</Text>
                </View>
              )}
            </View>
          </View>
        )}

        {/* دکمه‌های عملیات */}
        <View style={[styles.cardActionsRow, row]}>
          <TouchableOpacity
            style={[
              styles.primaryActionBtn,
              styles.flex1,
              row,
              isLocked && styles.lockedActionBtn,
            ]}
            activeOpacity={0.85}
            onPress={() => {
              if (isLocked) {
                navigation.navigate('Paywall');
              } else {
                navigation.navigate('Shadowing', {
                  scenarioId: sceneId,
                  returnTo: 'FourThousandWords',
                });
              }
            }}
          >
            {isLocked ? (
              <>
                <Lock size={15} color="#FFFFFF" />
                <Text style={styles.primaryActionBtnText}>
                  {rtl ? 'باز کردن با اشتراک ویژه 🔒' : 'Unlock with VIP 🔒'}
                </Text>
              </>
            ) : (
              <>
                <Layers size={16} color="#FFFFFF" />
                <Text style={styles.primaryActionBtnText}>
                  {rtl ? 'تمرین شادوئینگ این درس 🎧' : 'Start Shadowing Scene'}
                </Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.secondaryActionBtn, row, isLocked && styles.lockedSecondaryBtn]}
            activeOpacity={0.8}
            onPress={() => {
              if (isLocked) {
                navigation.navigate('Paywall');
              } else {
                navigation.navigate('PodcastDictation', {
                  podcastId: item.id,
                  openedAt: Date.now(),
                });
              }
            }}
          >
            {isLocked ? (
              <Lock size={14} color="#64748B" />
            ) : (
              <PenLine size={15} color="#D97706" />
            )}
            <Text style={[styles.secondaryActionBtnText, isLocked && styles.lockedSecondaryBtnText]}>
              {rtl ? 'دیکته ✍️' : 'Dictation'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderPodcastItem = ({ item, index }: { item: Podcast; index: number }) => {
    const unitNo = item.episode_no || index + 1;
    const isAdding = addingLeitnerId === item.id;
    const isLocked = isUnitLocked(index);

    return (
      <View style={[styles.card, isLocked && styles.cardLocked]}>
        <View style={[styles.cardHeader, row]}>
          <View style={[styles.podcastCoverWrap, { backgroundColor: currentBook.bg }]}>
            {item.cover_url ? (
              <Image source={{ uri: absUrl(item.cover_url) }} style={styles.podcastCoverImg} />
            ) : (
              <Headphones size={24} color={currentBook.color} />
            )}
            {isLocked && (
              <View style={styles.podcastLockOverlay}>
                <Lock size={14} color="#FFFFFF" />
              </View>
            )}
          </View>

          <View style={styles.flex1}>
            <View style={[styles.epMetaHeader, row]}>
              <View style={[styles.epNumberBadge, { backgroundColor: currentBook.bg }]}>
                <Text style={[styles.epNumberText, { color: currentBook.color }]}>
                  {rtl ? `قسمت ${unitNo}` : `Ep ${unitNo}`}
                </Text>
              </View>
              <View style={[styles.durationBadge, row]}>
                <Clock size={11} color="#8E95A5" />
                <Text style={styles.durationText}>{formatDuration(item.duration_seconds || 300)}</Text>
              </View>
              {isLocked ? (
                <View style={[styles.vipBadge, row]}>
                  <Lock size={10} color="#B45309" />
                  <Text style={styles.vipBadgeText}>{rtl ? 'VIP' : 'VIP'}</Text>
                </View>
              ) : (
                <View style={[styles.freeBadge, row]}>
                  <Sparkles size={10} color="#059669" />
                  <Text style={styles.freeBadgeText}>{rtl ? 'رایگان' : 'Free'}</Text>
                </View>
              )}
            </View>

            <Text style={[styles.cardTitle, ta]} numberOfLines={1}>
              {item.title}
            </Text>
            <Text style={[styles.cardSubtitle, ta]} numberOfLines={2}>
              {item.description_fa || 'پادکست آموزشی همراه با دیالوگ‌های نیتیو و داستان کوتاه'}
            </Text>
          </View>
        </View>

        {/* کالوکیشن‌های برگزیده درس */}
        {item.vocabulary && item.vocabulary.length > 0 && (
          <View style={styles.collocationsBox}>
            <Text style={[styles.collocationsTitle, ta]}>
              {rtl ? 'هات‌اسپات کالوکیشن‌ها (Collocations):' : 'Key Collocations:'}
            </Text>
            <View style={[styles.collocationsGrid, row]}>
              {item.vocabulary.slice(0, 4).map((v, idx) => (
                <View key={idx} style={styles.collocationItem}>
                  <Text style={styles.collocationWord}>{v.collocation || `${v.word} phrase`}</Text>
                  <Text style={styles.collocationMeaning}>{v.meaning_fa}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* دکمه‌های اقدام: گوش دادن + دیکته + لایتنر */}
        <View style={[styles.podcastActionsRow, row]}>
          <TouchableOpacity
            style={[
              styles.primaryActionBtn,
              styles.flex1,
              row,
              isLocked && styles.lockedActionBtn,
            ]}
            activeOpacity={0.85}
            onPress={() => {
              if (isLocked) {
                navigation.navigate('Paywall');
              } else {
                navigation.navigate('Podcast', {
                  podcastId: item.id,
                  openedAt: Date.now(),
                });
              }
            }}
          >
            {isLocked ? (
              <>
                <Lock size={15} color="#FFFFFF" />
                <Text style={styles.primaryActionBtnText}>
                  {rtl ? 'پخش با اشتراک ویژه 🔒' : 'Unlock with VIP 🔒'}
                </Text>
              </>
            ) : (
              <>
                <Play size={16} color="#FFFFFF" fill="#FFFFFF" />
                <Text style={styles.primaryActionBtnText}>
                  {rtl ? 'شنیدن پادکست درس 🎧' : 'Listen Podcast'}
                </Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.secondaryActionBtn, row, isLocked && styles.lockedSecondaryBtn]}
            activeOpacity={0.8}
            onPress={() => {
              if (isLocked) {
                navigation.navigate('Paywall');
              } else {
                navigation.navigate('PodcastDictation', {
                  podcastId: item.id,
                  openedAt: Date.now(),
                });
              }
            }}
          >
            {isLocked ? (
              <Lock size={14} color="#64748B" />
            ) : (
              <PenLine size={15} color="#D97706" />
            )}
            <Text style={[styles.secondaryActionBtnText, isLocked && styles.lockedSecondaryBtnText]}>
              {rtl ? 'دیکته ✍️' : 'Dictation'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.leitnerActionBtn, row, isLocked && styles.lockedSecondaryBtn]}
            activeOpacity={0.8}
            disabled={isAdding}
            onPress={() => handleAddAllToLeitner(item, isLocked)}
          >
            {isLocked ? (
              <Lock size={13} color="#64748B" />
            ) : (
              <BookmarkPlus size={15} color="#059669" />
            )}
            <Text style={[styles.leitnerActionBtnText, isLocked && styles.lockedSecondaryBtnText]}>
              {isAdding ? '...' : rtl ? 'لایتنر' : 'Leitner'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top + 8 }]}>
      {/* نوار بالای صفحه */}
      <View style={[styles.topBar, row]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.8}>
          {rtl ? <ChevronRight size={22} color={COLORS.text} /> : <ChevronLeft size={22} color={COLORS.text} />}
        </TouchableOpacity>
        <View style={styles.flex1}>
          <View style={[styles.topTitleWrap, row]}>
            <BookMarked size={20} color="#D97706" />
            <Text style={styles.topTitle}>{rtl ? 'آموزش ۴۰۰۰ کلمه ضروری' : '4000 Essential Words'}</Text>
          </View>
          <Text style={styles.topSubtitle}>
            {rtl ? '۶ کتاب استاندارد • ۱۸۰ درس شادوئینگ و پادکست' : '6 Books • 180 Complete Lessons'}
          </Text>
        </View>
      </View>

      {/* انتخاب کتاب ۱ تا ۶ */}
      <View style={styles.bookSelectorWrap}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={[styles.bookScrollContent, rtl && styles.rowReverse]}
        >
          {BOOKS.map((b) => {
            const isSelected = b.id === selectedBook;
            return (
              <TouchableOpacity
                key={b.id}
                style={[
                  styles.bookChip,
                  isSelected && { backgroundColor: b.color, borderColor: b.color },
                ]}
                activeOpacity={0.8}
                onPress={() => setSelectedBook(b.id)}
              >
                <Text style={[styles.bookChipTitle, isSelected && styles.bookChipTitleActive]}>
                  {b.titleFa}
                </Text>
                <Text style={[styles.bookChipSub, isSelected && styles.bookChipSubActive]}>
                  {b.levelLabelFa}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* تب‌های دوگانه: صحنه‌های شادوئینگ vs پادکست‌ها */}
      <View style={styles.tabBarContainer}>
        <View style={[styles.tabBarInner, row]}>
          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'scenes' && styles.tabButtonActive]}
            activeOpacity={0.85}
            onPress={() => setActiveTab('scenes')}
          >
            <Layers size={16} color={activeTab === 'scenes' ? COLORS.primary : COLORS.muted} />
            <Text style={[styles.tabButtonText, activeTab === 'scenes' && styles.tabButtonTextActive]}>
              {rtl ? 'صحنه‌های شادوئینگ (۳۰ درس)' : 'Shadowing Scenes (30)'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'podcasts' && styles.tabButtonActive]}
            activeOpacity={0.85}
            onPress={() => setActiveTab('podcasts')}
          >
            <Headphones size={16} color={activeTab === 'podcasts' ? COLORS.primary : COLORS.muted} />
            <Text style={[styles.tabButtonText, activeTab === 'podcasts' && styles.tabButtonTextActive]}>
              {rtl ? 'پادکست‌ها و دیکته صوتی' : 'Podcasts & Dictation'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* فیلد جستجوی سریع در بین واژگان یا دروس */}
      <View style={[styles.searchBoxWrap, row]}>
        <Search size={16} color="#8E95A5" />
        <TextInput
          style={[styles.searchInput, ta]}
          placeholder={rtl ? 'جستجوی کلمه، کالوکیشن یا عنوان درس...' : 'Search word, collocation, unit...'}
          placeholderTextColor="#8E95A5"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <X size={16} color="#8E95A5" />
          </TouchableOpacity>
        )}
      </View>

      {/* بنر ارتقا به نسخه ویژه (برای کاربران غیراشتراکی) */}
      {!isSubscribed && (
        <TouchableOpacity
          style={[styles.vipBanner, row]}
          activeOpacity={0.85}
          onPress={() => navigation.navigate('Paywall')}
        >
          <View style={styles.vipBannerIconWrap}>
            <Crown size={20} color="#D97706" />
          </View>
          <View style={[styles.flex1, rtl ? styles.alignEnd : styles.alignStart]}>
            <Text style={[styles.vipBannerTitle, ta]}>
              {rtl ? 'دوره ویژه ۴۰۰۰ واژه ضروری 🎓' : '4000 Words VIP Access'}
            </Text>
            <Text style={[styles.vipBannerDesc, ta]}>
              {rtl
                ? 'درس‌های ۱ و ۲ رایگان هستند؛ برای دسترسی کامل به ۱۸۰ درس، شادوئینگ و پادکست‌ها اشتراک تهیه کنید.'
                : 'Units 1 & 2 are free. Subscribe to unlock all 180 units, shadowing & audio.'}
            </Text>
          </View>
          <View style={styles.vipBannerBtn}>
            <Text style={styles.vipBannerBtnText}>{rtl ? 'خرید اشتراک' : 'Upgrade'}</Text>
          </View>
        </TouchableOpacity>
      )}

      {/* لیست آیتم‌ها */}
      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={currentBook.color} />
          <Text style={styles.loadingText}>
            {rtl ? `در حال بارگذاری دروس ${currentBook.titleFa}...` : 'Loading lessons...'}
          </Text>
        </View>
      ) : filteredEpisodes.length === 0 ? (
        <View style={styles.centerContainer}>
          <Text style={styles.emptyText}>
            {searchQuery
              ? rtl
                ? 'موردی با این عبارت جستجو یافت نشد'
                : 'No results found'
              : rtl
                ? 'دروسی برای این کتاب یافت نشد'
                : 'No lessons found'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredEpisodes}
          keyExtractor={(item) => item.id}
          renderItem={activeTab === 'scenes' ? renderSceneItem : renderPodcastItem}
          contentContainerStyle={[
            styles.listContainer,
            { paddingBottom: insets.bottom + SPACING.xl },
          ]}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  flex1: {
    flex: 1,
  },
  rowReverse: {
    flexDirection: 'row-reverse',
  },
  textRight: {
    textAlign: 'right',
  },
  textLeft: {
    textAlign: 'left',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 10,
    gap: 12,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  topTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  topTitle: {
    fontFamily: FONT_FAMILY.bold,
    fontSize: 17,
    color: '#0F172A',
  },
  topSubtitle: {
    fontFamily: FONT_FAMILY.regular,
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  bookSelectorWrap: {
    paddingVertical: 6,
  },
  bookScrollContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  bookChip: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    alignItems: 'center',
  },
  bookChipTitle: {
    fontFamily: FONT_FAMILY.bold,
    fontSize: 12,
    color: '#334155',
  },
  bookChipTitleActive: {
    color: '#FFFFFF',
  },
  bookChipSub: {
    fontFamily: FONT_FAMILY.regular,
    fontSize: 10,
    color: '#94A3B8',
    marginTop: 2,
  },
  bookChipSubActive: {
    color: 'rgba(255, 255, 255, 0.9)',
  },
  tabBarContainer: {
    paddingHorizontal: 16,
    paddingVertical: 6,
  },
  tabBarInner: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: 14,
    padding: 4,
    gap: 4,
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 10,
    gap: 6,
  },
  tabButtonActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  tabButtonText: {
    fontFamily: FONT_FAMILY.medium,
    fontSize: 12,
    color: '#64748B',
  },
  tabButtonTextActive: {
    fontFamily: FONT_FAMILY.bold,
    color: COLORS.primary,
  },
  searchBoxWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginVertical: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontFamily: FONT_FAMILY.regular,
    fontSize: 13,
    color: '#0F172A',
    padding: 0,
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingTop: 8,
    gap: 12,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 14,
    gap: 10,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  unitNumberBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
  },
  unitNumberText: {
    fontFamily: FONT_FAMILY.bold,
    fontSize: 12,
  },
  cardTitle: {
    fontFamily: FONT_FAMILY.bold,
    fontSize: 14,
    color: '#0F172A',
  },
  cardSubtitle: {
    fontFamily: FONT_FAMILY.regular,
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  cardImage: {
    width: '100%',
    height: 120,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
  },
  vocabSnippetBox: {
    backgroundColor: '#FFFBEB',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FDE68A',
    padding: 8,
    gap: 6,
  },
  vocabSnippetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  vocabSnippetHeaderText: {
    fontFamily: FONT_FAMILY.bold,
    fontSize: 11,
    color: '#B45309',
  },
  vocabPillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  vocabPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#FCD34D',
    paddingHorizontal: 6,
    paddingVertical: 2,
    gap: 3,
  },
  vocabPillWord: {
    fontFamily: FONT_FAMILY.bold,
    fontSize: 10,
    color: '#92400E',
  },
  vocabPillMeaning: {
    fontFamily: FONT_FAMILY.regular,
    fontSize: 9,
    color: '#78350F',
  },
  vocabPillMore: {
    backgroundColor: '#FEF3C7',
  },
  vocabPillMoreText: {
    fontFamily: FONT_FAMILY.bold,
    fontSize: 10,
    color: '#B45309',
  },
  cardActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 2,
  },
  primaryActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FF6422',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    gap: 6,
  },
  primaryActionBtnText: {
    fontFamily: FONT_FAMILY.bold,
    fontSize: 12,
    color: '#FFFFFF',
  },
  secondaryActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FDE68A',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    gap: 4,
  },
  secondaryActionBtnText: {
    fontFamily: FONT_FAMILY.bold,
    fontSize: 12,
    color: '#B45309',
  },
  podcastCoverWrap: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  podcastCoverImg: {
    width: '100%',
    height: '100%',
  },
  epMetaHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 2,
  },
  epNumberBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  epNumberText: {
    fontFamily: FONT_FAMILY.bold,
    fontSize: 10,
  },
  durationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  durationText: {
    fontFamily: FONT_FAMILY.medium,
    fontSize: 11,
    color: '#8E95A5',
  },
  collocationsBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 8,
    gap: 4,
  },
  collocationsTitle: {
    fontFamily: FONT_FAMILY.bold,
    fontSize: 10,
    color: '#475569',
  },
  collocationsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  collocationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    gap: 4,
  },
  collocationWord: {
    fontFamily: FONT_FAMILY.bold,
    fontSize: 10,
    color: '#1E293B',
  },
  collocationMeaning: {
    fontFamily: FONT_FAMILY.regular,
    fontSize: 9,
    color: '#64748B',
  },
  podcastActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  leitnerActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: 12,
    gap: 4,
  },
  leitnerActionBtnText: {
    fontFamily: FONT_FAMILY.bold,
    fontSize: 11,
    color: '#065F46',
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    gap: 10,
  },
  loadingText: {
    fontFamily: FONT_FAMILY.medium,
    fontSize: 13,
    color: '#64748B',
  },
  emptyText: {
    fontFamily: FONT_FAMILY.medium,
    fontSize: 13,
    color: '#94A3B8',
  },
  alignStart: {
    alignItems: 'flex-start',
  },
  alignEnd: {
    alignItems: 'flex-end',
  },
  cardLocked: {
    borderColor: '#FDE68A',
  },
  cardImageWrap: {
    position: 'relative',
  },
  imageLockOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  podcastLockOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.4)',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  vipBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    borderRadius: 8,
    paddingHorizontal: 7,
    paddingVertical: 3,
    gap: 3,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  vipBadgeText: {
    fontFamily: FONT_FAMILY.bold,
    fontSize: 10,
    color: '#B45309',
  },
  freeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    borderRadius: 8,
    paddingHorizontal: 7,
    paddingVertical: 3,
    gap: 3,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  freeBadgeText: {
    fontFamily: FONT_FAMILY.bold,
    fontSize: 10,
    color: '#059669',
  },
  lockedActionBtn: {
    backgroundColor: '#D97706',
  },
  lockedSecondaryBtn: {
    borderColor: '#CBD5E1',
    backgroundColor: '#F1F5F9',
  },
  lockedSecondaryBtnText: {
    color: '#64748B',
  },
  vipBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFBEB',
    borderWidth: 1.5,
    borderColor: '#FCD34D',
    borderRadius: 16,
    marginHorizontal: 16,
    marginTop: 6,
    marginBottom: 8,
    padding: 12,
    gap: 10,
  },
  vipBannerIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  vipBannerTitle: {
    fontFamily: FONT_FAMILY.bold,
    fontSize: 13,
    color: '#92400E',
  },
  vipBannerDesc: {
    fontFamily: FONT_FAMILY.regular,
    fontSize: 11,
    color: '#B45309',
    marginTop: 2,
    lineHeight: 16,
  },
  vipBannerBtn: {
    backgroundColor: '#D97706',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  vipBannerBtnText: {
    fontFamily: FONT_FAMILY.bold,
    fontSize: 11,
    color: '#FFFFFF',
  },
});
