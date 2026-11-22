import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import {
  Sparkles,
  Play,
  Trash2,
  BookOpen,
  CheckCircle2,
  FileText,
  Lightbulb,
  ChevronRight,
  Crown,
  Lock,
  AlertCircle,
} from 'lucide-react-native';
import { COLORS, SPACING, BORDER_RADIUS } from '../../theme/colors';
import { FONT_FAMILY } from '../../theme/typography';
import { useLanguage } from '../../data/i18n';
import { useToast } from '../../data/ToastContext';
import { getSubscriptionStatus } from '../../api/billing';
import {
  generateCustomScene,
  fetchUserCustomScenes,
  deleteUserCustomScene,
} from '../../api/customScene';
import type { Scenario } from '../../data/scenarios';

const QUICK_TOPIC_IDEAS = [
  { id: '1', label: '🤝 مصاحبه کاری', prompt: 'یک مصاحبه کاری رسمی به زبان انگلیسی برای موقعیت شغلی جدید' },
  { id: '2', label: '☕ سفارش در کافه', prompt: 'گفتگوی دوستانه هنگام سفارش قهوه و شیرینی در یک کافه دنج' },
  { id: '3', label: '✈️ چک‌این فرودگاه', prompt: 'مکالمه با مسئول پرواز در فرودگاه برای تحویل بار و گرفتن کارت پرواز' },
  { id: '4', label: '🛒 خرید و چانه‌زنی', prompt: 'خرید لباس و پرسیدن قیمت و تخفیف از فروشنده در فروشگاه' },
  { id: '5', label: '🩺 ویزیت پزشک', prompt: 'توضیح علائم بیماری سرماخوردگی و گفتگو با دکتر در درمانگاه' },
  { id: '6', label: '💻 جلسه فنی و اسکرام', prompt: 'جلسه اسپرینت استارتاپی پیرامون توسعه ویژگی جدید نرم‌افزار و ددلاین‌ها' },
  { id: '7', label: '🏨 رزرو و پذیرش هتل', prompt: 'تحویل گرفتن اتاق در هتل، پرسیدن رمز وای‌فای و خدمات صبحانه' },
  { id: '8', label: '🍽️ شام کاری رستوران', prompt: 'صرف شام با شریک تجاری، پیشنهاد غذای محلی و بحث پیرامون همکاری' },
  { id: '9', label: '🎓 جلسه دانشگاهی', prompt: 'گفتگو با استاد راهنما در مورد بازخورد مقاله و انتخاب موضوع پایان‌نامه' },
  { id: '10', label: '🚗 کرایه خودرو در سفر', prompt: 'مراجعه به آژانس کرایه اتومبیل در سفر و توافق روی بیمه و کیلومتر مجاز' },
];

const DIFFICULTY_LEVELS = [
  { id: 'Starter', label: 'مبتدی (A1)' },
  { id: 'Beginner', label: 'مقدماتی (A2)' },
  { id: 'Intermediate', label: 'متوسط (B1-B2)' },
  { id: 'Advanced', label: 'پیشرفته (C1)' },
];

export const CustomSceneScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const { t } = useLanguage();
  const toast = useToast();

  const [activeTab, setActiveTab] = useState<'create' | 'list'>('create');
  const [inputMode, setInputMode] = useState<'topic' | 'text'>('topic');
  const [topic, setTopic] = useState('');
  const [customText, setCustomText] = useState('');
  const [difficulty, setDifficulty] = useState('Intermediate');

  const [myScenes, setMyScenes] = useState<Scenario[]>([]);
  const [loadingList, setLoadingList] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [hasSubscription, setHasSubscription] = useState<boolean>(false);
  const [checkingSub, setCheckingSub] = useState<boolean>(true);

  // وضعیت تولید صحنه
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStep, setGenerationStep] = useState(0);

  const checkUserSubscription = useCallback(async () => {
    try {
      setCheckingSub(true);
      const status = await getSubscriptionStatus();
      setHasSubscription(Boolean(status?.active));
    } catch {
      setHasSubscription(false);
    } finally {
      setCheckingSub(false);
    }
  }, []);

  const loadScenes = useCallback(async () => {
    try {
      setLoadingList(true);
      const [scenes] = await Promise.all([
        fetchUserCustomScenes(),
        checkUserSubscription(),
      ]);
      setMyScenes(scenes);
    } catch {
      // ignore
    } finally {
      setLoadingList(false);
      setRefreshing(false);
    }
  }, [checkUserSubscription]);

  useEffect(() => {
    loadScenes();
  }, [loadScenes]);

  const handleGenerate = async () => {
    if (!hasSubscription) {
      Alert.alert(
        '💎 اشتراک طلایی (VIP) الزامی است',
        'ساخت سناریوی شادوئینگ اختصاصی با هوش مصنوعی و صدای نیتیو فقط برای مشترکین ویژه در دسترس است.\n\nبا تهیه اشتراک می‌توانید روزانه تا ۵ سناریوی اختصاصی تولید کنید.',
        [
          { text: 'شاید بعداً', style: 'cancel' },
          {
            text: 'مشاهده پلن‌ها و خرید VIP 🚀',
            style: 'default',
            onPress: () => navigation.navigate('Paywall'),
          },
        ]
      );
      return;
    }

    const trimmedTopic = topic.trim();
    const trimmedText = customText.trim();

    if (inputMode === 'topic') {
      if (!trimmedTopic) {
        toast.error('لطفاً موضوع یا ایده سناریو را وارد کنید');
        return;
      }
      if (trimmedTopic.length > 300) {
        toast.error('موضوع نباید بیش از ۳۰۰ کاراکتر باشد');
        return;
      }
    }

    if (inputMode === 'text') {
      if (!trimmedText) {
        toast.error('لطفاً متن دیالوگ یا پاراگراف خود را وارد کنید');
        return;
      }
      if (trimmedText.length > 1000) {
        toast.error('متن ورودی حداکثر ۱۰۰۰ کاراکتر مجاز است');
        return;
      }
    }

    try {
      setIsGenerating(true);
      setGenerationStep(1);

      const stepTimer1 = setTimeout(() => setGenerationStep(2), 2500);
      const stepTimer2 = setTimeout(() => setGenerationStep(3), 5500);

      const res = await generateCustomScene({
        topic: inputMode === 'topic' ? trimmedTopic : undefined,
        text: inputMode === 'text' ? trimmedText : undefined,
        difficulty,
      });

      clearTimeout(stepTimer1);
      clearTimeout(stepTimer2);
      setGenerationStep(4);

      toast.success('🎉 صحنه شادوئینگ اختصاصی شما آماده شد!');
      setTopic('');
      setCustomText('');
      await loadScenes();

      setIsGenerating(false);

      if (res.scene && res.scene.id) {
        navigation.navigate('Shadowing', {
          scenarioId: res.scene.id,
          returnTo: 'CustomScene',
        });
      } else {
        setActiveTab('list');
      }
    } catch (err: any) {
      setIsGenerating(false);
      const errMsg = String(err?.message || '');
      if (errMsg.includes('SUBSCRIPTION_REQUIRED') || errMsg.includes('اشتراک ویژه')) {
        Alert.alert(
          'دسترسی ویژه',
          'برای ساخت سناریو نیاز به فعال‌سازی اشتراک VIP دارید.',
          [
            { text: 'انصراف', style: 'cancel' },
            { text: 'خرید اشتراک', onPress: () => navigation.navigate('Paywall') },
          ]
        );
      } else if (errMsg.includes('DAILY_LIMIT_EXCEEDED') || errMsg.includes('سقف')) {
        Alert.alert(
          'سقف روزانه',
          'شما به حداکثر مجاز ساخت سناریو در امروز (۵ سناریو) رسیده‌اید. فردا دوباره می‌توانید سناریوی جدید بسازید.'
        );
      } else {
        toast.error(errMsg || 'خطا در ساخت صحنه شادوئینگ');
      }
    }
  };

  const handleDelete = (sceneId: string, title: string) => {
    Alert.alert(
      'حذف سناریو',
      `آیا از حذف صحنه «${title}» اطمینان دارید؟`,
      [
        { text: 'انصراف', style: 'cancel' },
        {
          text: 'حذف',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteUserCustomScene(sceneId);
              toast.success('صحنه با موفقیت حذف شد');
              setMyScenes((prev) => prev.filter((s) => s.id !== sceneId));
            } catch {
              toast.error('خطا در حذف صحنه');
            }
          },
        },
      ]
    );
  };

  const renderCreateTab = () => (
    <ScrollView
      contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 80 }]}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      {/* بنر ویژه مشترکین VIP */}
      {!hasSubscription && !checkingSub && (
        <TouchableOpacity
          style={styles.vipBanner}
          activeOpacity={0.88}
          onPress={() => navigation.navigate('Paywall')}
        >
          <View style={styles.vipBannerIconWrap}>
            <Crown size={22} color="#F59E0B" />
          </View>
          <View style={styles.vipBannerTextWrap}>
            <Text style={styles.vipBannerTitle}>قابلیت ویژه مشترکین طلایی (VIP) 👑</Text>
            <Text style={styles.vipBannerSub}>
              ساخت سناریوی هوشمند با هوش مصنوعی و صدای نیتیو منحصراً برای اعضای ویژه است.
            </Text>
          </View>
          <View style={styles.vipBannerAction}>
            <Text style={styles.vipBannerActionText}>ارتقا</Text>
          </View>
        </TouchableOpacity>
      )}

      {/* کارت محدودیت و اطلاعات سهمیه روزانه */}
      <View style={styles.quotaInfoCard}>
        <AlertCircle size={16} color={COLORS.primary} />
        <Text style={styles.quotaInfoText}>
          سقف مجاز: ۵ سناریو در روز برای مشترکین VIP • حداکثر ۱۰۰۰ کاراکتر متن
        </Text>
      </View>

      {/* نوع ورودی: ایده/موضوع یا متن دیالوگ */}
      <View style={styles.inputModeRow}>
        <TouchableOpacity
          style={[
            styles.modeButton,
            inputMode === 'topic' && styles.modeButtonActive,
          ]}
          onPress={() => setInputMode('topic')}
          activeOpacity={0.8}
        >
          <Lightbulb
            size={18}
            color={inputMode === 'topic' ? COLORS.primary : COLORS.muted}
          />
          <Text
            style={[
              styles.modeButtonText,
              inputMode === 'topic' && styles.modeButtonTextActive,
            ]}
          >
            ایده یا موضوع آزاد
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.modeButton,
            inputMode === 'text' && styles.modeButtonActive,
          ]}
          onPress={() => setInputMode('text')}
          activeOpacity={0.8}
        >
          <FileText
            size={18}
            color={inputMode === 'text' ? COLORS.primary : COLORS.muted}
          />
          <Text
            style={[
              styles.modeButtonText,
              inputMode === 'text' && styles.modeButtonTextActive,
            ]}
          >
            متن یا دیالوگ دلخواه
          </Text>
        </TouchableOpacity>
      </View>

      {/* فیلد ورودی بر اساس حالت انتخابی */}
      {inputMode === 'topic' ? (
        <View style={styles.card}>
          <Text style={styles.fieldLabel}>موضوع یا سناریوی مدنظرتان را بنویسید:</Text>
          <TextInput
            style={styles.textInputTopic}
            placeholder="مثلاً: گفتگوی کاری با همکار جدید درباره اهداف سه ماهه اول..."
            placeholderTextColor={COLORS.muted}
            value={topic}
            onChangeText={setTopic}
            maxLength={300}
            multiline
            numberOfLines={3}
            textAlign="right"
          />

          <Text style={styles.quickLabel}>یا یکی از ایده‌های پرطرفدار را انتخاب کن:</Text>
          <View style={styles.chipsRow}>
            {QUICK_TOPIC_IDEAS.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={[
                  styles.chip,
                  topic === item.prompt && styles.chipActive,
                ]}
                onPress={() => setTopic(item.prompt)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.chipText,
                    topic === item.prompt && styles.chipTextActive,
                  ]}
                >
                  {item.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      ) : (
        <View style={styles.card}>
          <View style={styles.fieldLabelRow}>
            <Text style={styles.charCountText}>{customText.length} / 1000</Text>
            <Text style={styles.fieldLabel}>متن، پاراگراف یا دیالوگ مورد نظرتان:</Text>
          </View>
          <TextInput
            style={styles.textInputArea}
            placeholder="متن فارسی یا انگلیسی خود را اینجا وارد کنید (حداکثر ۱۰۰۰ کاراکتر). هوش مصنوعی آن را به جملات استاندارد شادوئینگ، واژگان کلیدی و صدای نیتیو تبدیل می‌کند..."
            placeholderTextColor={COLORS.muted}
            value={customText}
            onChangeText={setCustomText}
            maxLength={1000}
            multiline
            numberOfLines={8}
            textAlign="right"
            textAlignVertical="top"
          />
        </View>
      )}

      {/* انتخاب سطح زبان */}
      <View style={styles.card}>
        <Text style={styles.fieldLabel}>سطح گفتاری هدف:</Text>
        <View style={styles.difficultyRow}>
          {DIFFICULTY_LEVELS.map((lvl) => {
            const isSelected = difficulty === lvl.id;
            return (
              <TouchableOpacity
                key={lvl.id}
                style={[
                  styles.diffCard,
                  isSelected && styles.diffCardActive,
                ]}
                onPress={() => setDifficulty(lvl.id)}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.diffCardText,
                    isSelected && styles.diffCardTextActive,
                  ]}
                >
                  {lvl.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* دکمه ساخت سناریو */}
      <TouchableOpacity
        style={[
          styles.generateButton,
          !hasSubscription && styles.generateButtonLocked,
        ]}
        onPress={handleGenerate}
        activeOpacity={0.85}
        disabled={isGenerating}
      >
        {hasSubscription ? (
          <>
            <Sparkles size={20} color="#FFFFFF" style={{ marginLeft: 8 }} />
            <Text style={styles.generateButtonText}>
              ساخت سناریوی شادوئینگ هوشمند 🚀
            </Text>
          </>
        ) : (
          <>
            <Lock size={18} color="#FFFFFF" style={{ marginLeft: 8 }} />
            <Text style={styles.generateButtonText}>
              ارتقا به VIP جهت ساخت سناریو 👑
            </Text>
          </>
        )}
      </TouchableOpacity>
    </ScrollView>
  );

  const renderListTab = () => (
    <ScrollView
      contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 80 }]}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => {
            setRefreshing(true);
            loadScenes();
          }}
          tintColor={COLORS.primary}
        />
      }
    >
      {loadingList && myScenes.length === 0 ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>در حال دریافت سناریوهای شما...</Text>
        </View>
      ) : myScenes.length === 0 ? (
        <View style={styles.emptyContainer}>
          <BookOpen size={48} color={COLORS.muted} />
          <Text style={styles.emptyTitle}>هنوز سناریوی اختصاصی نساخته‌اید</Text>
          <Text style={styles.emptySub}>
            می‌توانید هر متن، مقاله، موضوع کاری یا دیالوگی که دوست دارید را وارد کنید تا به یک درس صوتی شادوئینگ با صدای گوینده نیتیو تبدیل شود.
          </Text>
          <TouchableOpacity
            style={styles.createNowButton}
            onPress={() => setActiveTab('create')}
            activeOpacity={0.8}
          >
            <Sparkles size={18} color="#FFFFFF" style={{ marginLeft: 6 }} />
            <Text style={styles.createNowText}>ساخت اولین سناریو ✨</Text>
          </TouchableOpacity>
        </View>
      ) : (
        myScenes.map((sc) => (
          <View key={sc.id} style={styles.sceneCard}>
            <View style={styles.sceneCardHeader}>
              <View style={styles.badgeRow}>
                <View style={styles.levelBadge}>
                  <Text style={styles.levelBadgeText}>{sc.level}</Text>
                </View>
                <View style={styles.countBadge}>
                  <Text style={styles.countBadgeText}>
                    {sc.sentencesCount || 6} جمله
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                onPress={() => handleDelete(sc.id, sc.title)}
                style={styles.deleteBtn}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Trash2 size={18} color="#EF4444" />
              </TouchableOpacity>
            </View>

            <Text style={styles.sceneTitle}>{sc.title}</Text>
            {sc.lesson ? (
              <Text style={styles.sceneDesc} numberOfLines={2}>
                {sc.lesson}
              </Text>
            ) : null}

            <View style={styles.sceneCardFooter}>
              <TouchableOpacity
                style={styles.playButton}
                activeOpacity={0.8}
                onPress={() =>
                  navigation.navigate('Shadowing', {
                    scenarioId: sc.id,
                    returnTo: 'CustomScene',
                  })
                }
              >
                <Play size={16} color="#FFFFFF" fill="#FFFFFF" style={{ marginLeft: 6 }} />
                <Text style={styles.playButtonText}>تمرین شادوئینگ</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))
      )}
    </ScrollView>
  );

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      {/* هدر صفحه */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <ChevronRight size={26} color={COLORS.text} />
        </TouchableOpacity>
        <View style={styles.headerTitleWrap}>
          <Text style={styles.headerTitle}>شادوئینگ اختصاصی من ✨</Text>
          <Text style={styles.headerSub}>تولید محتوای هوشمند با موضوع دلخواه</Text>
        </View>
      </View>

      {/* تب‌های بالای صفحه */}
      <View style={styles.tabsRow}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'create' && styles.tabActive]}
          onPress={() => setActiveTab('create')}
          activeOpacity={0.7}
        >
          <Text
            style={[styles.tabText, activeTab === 'create' && styles.tabTextActive]}
          >
            ➕ ساخت صحنه تازه
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'list' && styles.tabActive]}
          onPress={() => setActiveTab('list')}
          activeOpacity={0.7}
        >
          <Text
            style={[styles.tabText, activeTab === 'list' && styles.tabTextActive]}
          >
            📚 سناریوهای من ({myScenes.length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* محتوای تب فعال */}
      {activeTab === 'create' ? renderCreateTab() : renderListTab()}

      {/* مودال یا اورلی وضعیت تولید هوش مصنوعی */}
      {isGenerating && (
        <View style={styles.generatingOverlay}>
          <View style={styles.generatingBox}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={styles.generatingTitle}>هوش مصنوعی در حال ساخت درس شماست</Text>

            <View style={styles.stepContainer}>
              <View style={styles.stepRow}>
                <CheckCircle2
                  size={16}
                  color={generationStep >= 1 ? COLORS.tertiary : COLORS.muted}
                />
                <Text
                  style={[
                    styles.stepText,
                    generationStep >= 1 && styles.stepTextActive,
                  ]}
                >
                  تحلیل محتوا و تفکیک خطوط گفتگو
                </Text>
              </View>

              <View style={styles.stepRow}>
                <CheckCircle2
                  size={16}
                  color={generationStep >= 2 ? COLORS.tertiary : COLORS.muted}
                />
                <Text
                  style={[
                    styles.stepText,
                    generationStep >= 2 && styles.stepTextActive,
                  ]}
                >
                  استخراج واژگان کلیدی و ترجمه استاندارد
                </Text>
              </View>

              <View style={styles.stepRow}>
                <CheckCircle2
                  size={16}
                  color={generationStep >= 3 ? COLORS.tertiary : COLORS.muted}
                />
                <Text
                  style={[
                    styles.stepText,
                    generationStep >= 3 && styles.stepTextActive,
                  ]}
                >
                  سنتز صدای نیتیو (TTS) به تفکیک دیالوگ‌ها
                </Text>
              </View>

              <View style={styles.stepRow}>
                <CheckCircle2
                  size={16}
                  color={generationStep >= 4 ? COLORS.tertiary : COLORS.muted}
                />
                <Text
                  style={[
                    styles.stepText,
                    generationStep >= 4 && styles.stepTextActive,
                  ]}
                >
                  آماده‌سازی نهایی و ذخیره‌سازی در اکانت
                </Text>
              </View>
            </View>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    paddingHorizontal: SPACING.m,
    paddingVertical: SPACING.s,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
  backBtn: {
    padding: 6,
  },
  headerTitleWrap: {
    flex: 1,
    alignItems: 'flex-end',
    marginRight: 10,
  },
  headerTitle: {
    fontFamily: FONT_FAMILY.bold,
    fontSize: 18,
    color: COLORS.text,
  },
  headerSub: {
    fontFamily: FONT_FAMILY.regular,
    fontSize: 12,
    color: COLORS.muted,
    marginTop: 2,
  },
  tabsRow: {
    flexDirection: 'row-reverse',
    paddingHorizontal: SPACING.m,
    paddingVertical: SPACING.s,
    backgroundColor: COLORS.surface,
    gap: 8,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: BORDER_RADIUS.m,
    backgroundColor: COLORS.surfaceLight,
  },
  tabActive: {
    backgroundColor: COLORS.primaryLight,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  tabText: {
    fontFamily: FONT_FAMILY.medium,
    fontSize: 13,
    color: COLORS.muted,
  },
  tabTextActive: {
    fontFamily: FONT_FAMILY.bold,
    color: COLORS.primary,
  },
  scrollContent: {
    padding: SPACING.m,
  },
  inputModeRow: {
    flexDirection: 'row-reverse',
    gap: 10,
    marginBottom: SPACING.m,
  },
  modeButton: {
    flex: 1,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.m,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 6,
  },
  modeButtonActive: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primaryLight,
  },
  modeButtonText: {
    fontFamily: FONT_FAMILY.medium,
    fontSize: 13,
    color: COLORS.muted,
  },
  modeButtonTextActive: {
    fontFamily: FONT_FAMILY.bold,
    color: COLORS.primary,
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.l,
    padding: SPACING.m,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SPACING.m,
  },
  fieldLabel: {
    fontFamily: FONT_FAMILY.bold,
    fontSize: 14,
    color: COLORS.text,
    marginBottom: 8,
    textAlign: 'right',
  },
  textInputTopic: {
    backgroundColor: COLORS.surfaceLight,
    borderRadius: BORDER_RADIUS.m,
    padding: 12,
    fontFamily: FONT_FAMILY.regular,
    fontSize: 14,
    color: COLORS.text,
    borderWidth: 1,
    borderColor: COLORS.border,
    minHeight: 70,
  },
  textInputArea: {
    backgroundColor: COLORS.surfaceLight,
    borderRadius: BORDER_RADIUS.m,
    padding: 12,
    fontFamily: FONT_FAMILY.regular,
    fontSize: 14,
    color: COLORS.text,
    borderWidth: 1,
    borderColor: COLORS.border,
    minHeight: 160,
  },
  quickLabel: {
    fontFamily: FONT_FAMILY.medium,
    fontSize: 12,
    color: COLORS.muted,
    marginTop: 14,
    marginBottom: 8,
    textAlign: 'right',
  },
  chipsRow: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.surfaceLight,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  chipActive: {
    backgroundColor: COLORS.primaryLight,
    borderColor: COLORS.primary,
  },
  chipText: {
    fontFamily: FONT_FAMILY.medium,
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  chipTextActive: {
    color: COLORS.primary,
    fontFamily: FONT_FAMILY.bold,
  },
  difficultyRow: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    gap: 8,
  },
  diffCard: {
    flex: 1,
    minWidth: '45%',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: BORDER_RADIUS.m,
    backgroundColor: COLORS.surfaceLight,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
  },
  diffCardActive: {
    backgroundColor: COLORS.primaryLight,
    borderColor: COLORS.primary,
  },
  diffCardText: {
    fontFamily: FONT_FAMILY.medium,
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  diffCardTextActive: {
    fontFamily: FONT_FAMILY.bold,
    color: COLORS.primary,
  },
  generateButton: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    borderRadius: BORDER_RADIUS.l,
    marginTop: 4,
  },
  generateButtonLocked: {
    backgroundColor: '#D97706',
  },
  generateButtonText: {
    fontFamily: FONT_FAMILY.bold,
    fontSize: 15,
    color: '#FFFFFF',
  },
  vipBanner: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    borderWidth: 1.5,
    borderColor: '#F59E0B',
    borderRadius: BORDER_RADIUS.l,
    padding: SPACING.m,
    marginBottom: SPACING.m,
  },
  vipBannerIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 10,
  },
  vipBannerTextWrap: {
    flex: 1,
    alignItems: 'flex-end',
  },
  vipBannerTitle: {
    fontFamily: FONT_FAMILY.bold,
    fontSize: 14,
    color: '#D97706',
    textAlign: 'right',
  },
  vipBannerSub: {
    fontFamily: FONT_FAMILY.regular,
    fontSize: 11,
    color: COLORS.muted,
    textAlign: 'right',
    marginTop: 2,
    lineHeight: 16,
  },
  vipBannerAction: {
    backgroundColor: '#F59E0B',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: BORDER_RADIUS.m,
    marginRight: 6,
  },
  vipBannerActionText: {
    fontFamily: FONT_FAMILY.bold,
    fontSize: 12,
    color: '#FFFFFF',
  },
  quotaInfoCard: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceLight,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.m,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: SPACING.m,
    gap: 8,
  },
  quotaInfoText: {
    flex: 1,
    fontFamily: FONT_FAMILY.medium,
    fontSize: 11,
    color: COLORS.muted,
    textAlign: 'right',
  },
  fieldLabelRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  charCountText: {
    fontFamily: FONT_FAMILY.regular,
    fontSize: 11,
    color: COLORS.muted,
  },
  centerContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  loadingText: {
    fontFamily: FONT_FAMILY.medium,
    fontSize: 13,
    color: COLORS.muted,
    marginTop: 10,
  },
  emptyContainer: {
    paddingVertical: 48,
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  emptyTitle: {
    fontFamily: FONT_FAMILY.bold,
    fontSize: 16,
    color: COLORS.text,
    marginTop: 12,
  },
  emptySub: {
    fontFamily: FONT_FAMILY.regular,
    fontSize: 13,
    color: COLORS.muted,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
  },
  createNowButton: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: BORDER_RADIUS.full,
    marginTop: 20,
  },
  createNowText: {
    fontFamily: FONT_FAMILY.bold,
    fontSize: 13,
    color: '#FFFFFF',
  },
  sceneCard: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.l,
    padding: SPACING.m,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SPACING.m,
  },
  sceneCardHeader: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  badgeRow: {
    flexDirection: 'row-reverse',
    gap: 6,
  },
  levelBadge: {
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.s,
  },
  levelBadgeText: {
    fontFamily: FONT_FAMILY.medium,
    fontSize: 11,
    color: COLORS.primary,
  },
  countBadge: {
    backgroundColor: COLORS.surfaceLight,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.s,
  },
  countBadgeText: {
    fontFamily: FONT_FAMILY.medium,
    fontSize: 11,
    color: COLORS.muted,
  },
  deleteBtn: {
    padding: 4,
  },
  sceneTitle: {
    fontFamily: FONT_FAMILY.bold,
    fontSize: 15,
    color: COLORS.text,
    textAlign: 'right',
    marginBottom: 4,
  },
  sceneDesc: {
    fontFamily: FONT_FAMILY.regular,
    fontSize: 13,
    color: COLORS.muted,
    textAlign: 'right',
    lineHeight: 18,
    marginBottom: 12,
  },
  sceneCardFooter: {
    flexDirection: 'row-reverse',
    justifyContent: 'flex-start',
    marginTop: 6,
  },
  playButton: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: BORDER_RADIUS.m,
  },
  playButtonText: {
    fontFamily: FONT_FAMILY.bold,
    fontSize: 13,
    color: '#FFFFFF',
  },
  generatingOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.l,
  },
  generatingBox: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.xl,
    padding: 24,
    width: '100%',
    maxWidth: 340,
    alignItems: 'center',
  },
  generatingTitle: {
    fontFamily: FONT_FAMILY.bold,
    fontSize: 15,
    color: COLORS.text,
    marginTop: 16,
    marginBottom: 20,
    textAlign: 'center',
  },
  stepContainer: {
    width: '100%',
    gap: 12,
  },
  stepRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 8,
  },
  stepText: {
    fontFamily: FONT_FAMILY.regular,
    fontSize: 12,
    color: COLORS.muted,
  },
  stepTextActive: {
    fontFamily: FONT_FAMILY.medium,
    color: COLORS.text,
  },
});
