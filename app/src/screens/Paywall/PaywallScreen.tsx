import React, { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { CheckCircle2, ChevronLeft, ChevronRight, Coins, Lock, RotateCcw, Sparkles } from 'lucide-react-native';
import { useBazaar } from '@cafebazaar/react-native-poolakey';

import { COLORS, BORDER_RADIUS } from '../../theme/colors';
import { FONT_FAMILY } from '../../theme/typography';
import { useLanguage } from '../../data/i18n';
import { useScenes } from '../../data/ScenesContext';
import { getSubscriptionPlans, verifyPurchase, bonusDaysForPoints, SubscriptionPlan } from '../../api/billing';
import { getMyPoints } from '../../api/submissions';
import { CAFEBAZAAR_RSA_KEY } from '../../api/config';
import { track } from '../../services/analytics';

const formatNumber = (n: number, lang: 'en' | 'fa') => n.toLocaleString(lang === 'fa' ? 'fa-IR' : 'en-US');

/** پلن‌هایی با این طول یا بیشتر «دائمی» حساب می‌شوند و زیرنویسِ روز/ماه نمی‌گیرند. */
const LIFETIME_DAYS = 3650;

type Phase = 'loading' | 'idle' | 'buying' | 'restoring' | 'error' | 'success';

export const PaywallScreen = () => {
  const navigation = useNavigation<any>();
  const { t, language } = useLanguage();
  const { reload } = useScenes();
  const bazaar = useBazaar(CAFEBAZAAR_RSA_KEY || null);

  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [phase, setPhase] = useState<Phase>('loading');
  const [errorDetail, setErrorDetail] = useState<string | null>(null);
  const [points, setPoints] = useState(0);
  const [redeemPoints, setRedeemPoints] = useState(false);

  useEffect(() => {
    track('paywall_viewed');
    let active = true;
    getSubscriptionPlans()
      .then((list) => {
        if (!active) return;
        setPlans(list);
        // پیش‌فرض طولانی‌ترین پلن (معمولاً به‌صرفه‌ترین) انتخاب می‌شود.
        const longest = [...list].sort((a, b) => b.duration_days - a.duration_days)[0];
        setSelectedId(longest ? longest.id : null);
        setPhase('idle');
      })
      .catch((err) => {
        if (!active) return;
        setErrorDetail(err instanceof Error ? err.message : String(err));
        setPhase('error');
      });
    getMyPoints()
      .then((p) => active && setPoints(p))
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  const selectedPlan = plans.find((p) => p.id === selectedId) || null;
  const busy = phase === 'buying' || phase === 'restoring';
  const bonusDays = bonusDaysForPoints(points);

  // صرفه‌جویی هر پلن نسبت به قیمتِ روزانه‌ی کوتاه‌ترین پلن؛ از قیمت‌های واقعیِ
  // سرور حساب می‌شود، نه عدد ثابت، تا با تغییر قیمت در پنل غلط نشود.
  const shortest = [...plans].sort((a, b) => a.duration_days - b.duration_days)[0];
  const basePerDay = shortest && shortest.duration_days > 0 ? shortest.price_toman / shortest.duration_days : 0;
  const savingPercent = (p: SubscriptionPlan) => {
    if (!basePerDay || p.duration_days <= 0 || p.duration_days >= LIFETIME_DAYS) return 0;
    const pct = Math.round((1 - p.price_toman / p.duration_days / basePerDay) * 100);
    return pct >= 5 ? pct : 0;
  };
  const planSubtitle = (p: SubscriptionPlan) => {
    if (p.duration_days >= LIFETIME_DAYS) return t('paywallPlanForever');
    if (p.duration_days >= 60) {
      const perMonth = Math.round((p.price_toman / p.duration_days) * 30 / 1000) * 1000;
      return t('paywallPlanPerMonth').replace('{price}', formatNumber(perMonth, language));
    }
    return t('paywallPlanDays').replace('{days}', formatNumber(p.duration_days, language));
  };

  const rtl = language === 'fa';
  const row = rtl && styles.rowReverse;
  const align = rtl && styles.textRight;

  const handleBuy = async () => {
    if (!selectedPlan || !selectedPlan.product_id) return;
    track('paywall_tapped', selectedPlan.product_id);
    setPhase('buying');
    setErrorDetail(null);
    try {
      const result = await bazaar.purchaseProduct(selectedPlan.product_id);
      await verifyPurchase(selectedPlan.product_id, result.purchaseToken, redeemPoints ? points : 0);
      // مصرف‌کردن خرید توی کافه‌بازار لازمه وگرنه چون این محصول non-consumable
      // ثبت شده، دفعه‌ی بعد (مثلاً بعد از انقضای اشتراک) دیگه قابل خرید نیست.
      await bazaar.consumePurchase(result.purchaseToken).catch(() => {});
      track('purchase_completed', selectedPlan.product_id);
      await reload();
      setPhase('success');
    } catch (err) {
      setErrorDetail(err instanceof Error ? err.message : String(err));
      setPhase('error');
    }
  };

  const handleRestore = async () => {
    setPhase('restoring');
    setErrorDetail(null);
    try {
      const purchased = await bazaar.getPurchasedProducts();
      if (purchased.length === 0) {
        setErrorDetail(t('paywallRestoreNotFound'));
        setPhase('error');
        return;
      }
      for (const p of purchased) {
        await verifyPurchase(p.productId, p.purchaseToken);
      }
      await reload();
      setPhase('success');
    } catch (err) {
      setErrorDetail(err instanceof Error ? err.message : String(err));
      setPhase('error');
    }
  };

  if (phase === 'success') {
    return (
      <View style={styles.screen}>
        <View style={styles.centerArea}>
          <CheckCircle2 color={COLORS.tertiary} size={56} />
          <Text style={styles.successTitle}>{t('paywallSuccessTitle')}</Text>
          <Text style={styles.successSub}>{t('paywallSuccessSub')}</Text>
          <TouchableOpacity
            style={styles.buyBtn}
            activeOpacity={0.85}
            onPress={() => navigation.navigate('Scenes')}
          >
            <Text style={styles.buyBtnText}>{t('paywallSuccessBtn')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (phase === 'loading') {
    return (
      <View style={styles.screen}>
        <View style={styles.centerArea}>
          <ActivityIndicator color={COLORS.primary} />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={[styles.topBar, row]}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            {rtl ? <ChevronRight color={COLORS.text} size={22} /> : <ChevronLeft color={COLORS.text} size={22} />}
          </TouchableOpacity>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{t('paywallBadge')}</Text>
          </View>
        </View>

        <View style={styles.iconWrap}>
          <Lock color={COLORS.primary} size={26} />
        </View>
        <Text style={styles.title}>{t('paywallTitle')}</Text>
        <Text style={styles.subtitle}>{t('paywallSubtitle')}</Text>

        {plans.length === 0 ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{t('paywallPlansLoadError')}</Text>
          </View>
        ) : (
          <View style={styles.plansList}>
            {plans.map((p) => {
              const active = p.id === selectedId;
              const saving = savingPercent(p);
              return (
                <TouchableOpacity
                  key={p.id}
                  style={[styles.planCard, row, active && styles.planCardActive]}
                  activeOpacity={0.85}
                  onPress={() => setSelectedId(p.id)}
                >
                  <View style={[styles.radio, active && styles.radioActive]}>
                    {active && <View style={styles.radioDot} />}
                  </View>
                  <View style={styles.planInfo}>
                    <View style={[styles.planNameRow, row]}>
                      <Text style={[styles.planName, active && styles.planNameActive]}>{p.name}</Text>
                      {saving > 0 && (
                        <View style={styles.saveChip}>
                          <Text style={styles.saveChipText}>
                            {t('paywallPlanSave').replace('{n}', formatNumber(saving, language))}
                          </Text>
                        </View>
                      )}
                    </View>
                    <Text style={[styles.planSub, align]}>{planSubtitle(p)}</Text>
                  </View>
                  <View style={styles.priceCol}>
                    <Text style={[styles.planPrice, active && styles.planNameActive]}>
                      {formatNumber(p.price_toman, language)}
                    </Text>
                    <Text style={styles.planCurrency}>{t('paywallToman')}</Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {bonusDays > 0 && (
          <View style={[styles.pointsCard, row]}>
            <View style={styles.pointsIconWrap}>
              <Coins color={COLORS.secondary} size={20} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.pointsTitle, align]}>{t('paywallRedeemPointsTitle')}</Text>
              <Text style={[styles.pointsSub, align]}>
                {t('paywallRedeemPointsSub')
                  .replace('{points}', formatNumber(points, language))
                  .replace('{days}', formatNumber(bonusDays, language))}
              </Text>
            </View>
            <Switch
              value={redeemPoints}
              onValueChange={setRedeemPoints}
              trackColor={{ true: COLORS.primary }}
            />
          </View>
        )}

        {phase === 'error' && (
          <View style={styles.errorBox}>
            <Text style={[styles.errorText, align]}>{t('paywallErrorGeneric')}</Text>
            {errorDetail ? <Text style={[styles.errorDetailText, align]}>{errorDetail}</Text> : null}
          </View>
        )}

        <TouchableOpacity
          style={[styles.buyBtn, row, (busy || !selectedPlan) && styles.buyBtnDisabled]}
          activeOpacity={0.85}
          disabled={busy || !selectedPlan}
          onPress={handleBuy}
        >
          {phase === 'buying' ? (
            <>
              <ActivityIndicator color={COLORS.white} />
              <Text style={styles.buyBtnText}>{t('paywallProcessing')}</Text>
            </>
          ) : (
            <>
              <Sparkles color={COLORS.white} size={18} />
              <Text style={styles.buyBtnText}>{t('paywallBuyButton')}</Text>
            </>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.restoreBtn, row]}
          activeOpacity={0.85}
          disabled={busy}
          onPress={handleRestore}
        >
          <RotateCcw color={COLORS.textSecondary} size={15} />
          <Text style={styles.restoreBtnText}>
            {phase === 'restoring' ? t('paywallProcessing') : t('paywallRestoreButton')}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  rowReverse: { flexDirection: 'row-reverse' },
  textRight: { textAlign: 'right' },
  screen: {
    flex: 1,
    backgroundColor: '#FDFBF7',
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 48,
    paddingBottom: 60,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#F0EBE3',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#1A1D26',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  badge: {
    backgroundColor: '#F3EFE6',
    borderRadius: BORDER_RADIUS.full,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  badgeText: {
    color: '#716B62',
    fontFamily: FONT_FAMILY.medium,
    fontSize: 11,
  },
  iconWrap: {
    alignSelf: 'center',
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: '#FFF4EE',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    color: '#1A1D26',
    fontFamily: FONT_FAMILY.bold,
    fontSize: 22,
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    color: '#716B62',
    fontFamily: FONT_FAMILY.regular,
    fontSize: 13,
    lineHeight: 22,
    textAlign: 'center',
    paddingHorizontal: 8,
    marginBottom: 24,
  },
  plansList: {
    gap: 10,
    marginBottom: 16,
  },
  planCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#F0EBE3',
    paddingVertical: 16,
    paddingHorizontal: 16,
    shadowColor: '#1A1D26',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  planCardActive: {
    borderColor: '#FF6422',
    borderWidth: 1.5,
    backgroundColor: '#FFFDF9',
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#D3CEC5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioActive: {
    borderColor: '#FF6422',
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#FF6422',
  },
  planInfo: {
    flex: 1,
  },
  planNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  planName: {
    color: '#1A1D26',
    fontFamily: FONT_FAMILY.bold,
    fontSize: 15,
  },
  planNameActive: {
    color: '#FF6422',
  },
  planSub: {
    color: '#9AA0AC',
    fontFamily: FONT_FAMILY.regular,
    fontSize: 11,
    marginTop: 2,
  },
  saveChip: {
    backgroundColor: '#E8F5E9',
    borderRadius: BORDER_RADIUS.full,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  saveChipText: {
    color: '#059669',
    fontFamily: FONT_FAMILY.semiBold,
    fontSize: 10,
  },
  priceCol: {
    alignItems: 'center',
  },
  planPrice: {
    color: '#1A1D26',
    fontFamily: FONT_FAMILY.bold,
    fontSize: 15,
  },
  planCurrency: {
    color: '#9AA0AC',
    fontFamily: FONT_FAMILY.regular,
    fontSize: 10,
  },
  pointsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#F0EBE3',
    padding: 14,
    marginBottom: 16,
    shadowColor: '#1A1D26',
    shadowOpacity: 0.04,
    elevation: 2,
  },
  pointsIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#FFF8E8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pointsTitle: {
    color: '#1A1D26',
    fontFamily: FONT_FAMILY.semiBold,
    fontSize: 13,
  },
  pointsSub: {
    color: '#716B62',
    fontFamily: FONT_FAMILY.regular,
    fontSize: 11,
    lineHeight: 18,
    marginTop: 2,
  },
  errorBox: {
    backgroundColor: '#FEE2E2',
    borderRadius: BORDER_RADIUS.l,
    padding: 12,
    marginBottom: 16,
  },
  errorText: {
    color: COLORS.error,
    fontFamily: FONT_FAMILY.medium,
    fontSize: 13,
  },
  errorDetailText: {
    color: '#716B62',
    fontFamily: FONT_FAMILY.regular,
    fontSize: 11,
    marginTop: 4,
  },
  buyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#FF6422',
    borderRadius: 18,
    height: 54,
    paddingHorizontal: 28,
    marginTop: 4,
    shadowColor: '#FF6422',
    shadowOpacity: 0.28,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  buyBtnDisabled: {
    opacity: 0.6,
  },
  buyBtnText: {
    color: '#FFFFFF',
    fontFamily: FONT_FAMILY.bold,
    fontSize: 15,
  },
  restoreBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 44,
    marginTop: 4,
  },
  restoreBtnText: {
    color: '#716B62',
    fontFamily: FONT_FAMILY.medium,
    fontSize: 13,
  },
  centerArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 30,
    gap: 10,
  },
  successTitle: {
    color: COLORS.text,
    fontFamily: FONT_FAMILY.bold,
    fontSize: 20,
    marginTop: 8,
  },
  successSub: {
    color: COLORS.textSecondary,
    fontFamily: FONT_FAMILY.regular,
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 16,
  },
});
