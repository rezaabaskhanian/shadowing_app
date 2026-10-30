import React, { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { CheckCircle2, ChevronLeft, ChevronRight, Coins, ShieldCheck, Sparkles, Zap } from 'lucide-react-native';
import { useBazaar } from '@cafebazaar/react-native-poolakey';

import { COLORS, BORDER_RADIUS } from '../../theme/colors';
import { FONT_FAMILY } from '../../theme/typography';
import { useLanguage } from '../../data/i18n';
import {
  getAIUsageStatus,
  getTokenTopupPlans,
  verifyTokenTopupPurchase,
  type AIUsageStatus,
  type TokenTopupPlan,
} from '../../api/aiUsage';
import { CAFEBAZAAR_RSA_KEY } from '../../api/config';
import { track } from '../../services/analytics';

const formatNumber = (n: number, lang: 'en' | 'fa') => n.toLocaleString(lang === 'fa' ? 'fa-IR' : 'en-US');

type Phase = 'loading' | 'idle' | 'buying' | 'error' | 'success';

/**
 * خریدِ مصرفیِ توکن — برای وقتی که کاربرِ مشترک به سقفِ رایگانِ روزانه‌اش
 * رسیده و نمی‌خواهد تا فردا صبر کند. برخلافِ PaywallScreen (اشتراک،
 * non-consumable که باید consume بشه تا دوباره قابل‌خرید بمونه)، این محصولات
 * mainly consumable هستند و هر بار می‌شود دوباره خرید.
 */
export const TokenTopupScreen = () => {
  const navigation = useNavigation<any>();
  const { t, language } = useLanguage();
  const bazaar = useBazaar(CAFEBAZAAR_RSA_KEY || null);

  const [plans, setPlans] = useState<TokenTopupPlan[]>([]);
  const [usage, setUsage] = useState<AIUsageStatus | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [phase, setPhase] = useState<Phase>('loading');
  const [errorDetail, setErrorDetail] = useState<string | null>(null);

  useEffect(() => {
    track('token_topup_viewed');
    let active = true;
    Promise.all([getTokenTopupPlans(), getAIUsageStatus().catch(() => null)])
      .then(([list, status]) => {
        if (!active) return;
        setPlans(list);
        setUsage(status);
        // پیش‌فرض ارزان‌ترین بسته (اولین قدم برای کسی که فقط می‌خواهد ادامه بدهد).
        const cheapest = [...list].sort((a, b) => a.price_toman - b.price_toman)[0];
        setSelectedId(cheapest ? cheapest.id : null);
        setPhase('idle');
      })
      .catch((err) => {
        if (!active) return;
        setErrorDetail(err instanceof Error ? err.message : String(err));
        setPhase('error');
      });
    return () => {
      active = false;
    };
  }, []);

  const selectedPlan = plans.find((p) => p.id === selectedId) || null;
  const busy = phase === 'buying';

  const rtl = language === 'fa';
  const row = rtl && styles.rowReverse;
  const align = rtl && styles.textRight;
  const num = (n: number) => formatNumber(n, language);

  // صرفه‌جوییِ هر بسته نسبت به قیمتِ هر توکن در گران‌ترین (به ازای توکن) بسته؛
  // از قیمت‌های واقعیِ سرور حساب می‌شود.
  const perToken = (p: TokenTopupPlan) => (p.tokens > 0 ? p.price_toman / p.tokens : Infinity);
  const priced = plans.filter((p) => p.tokens > 0);
  const basePerToken = priced.length ? Math.max(...priced.map(perToken)) : 0;
  const bestValueId =
    priced.length > 1 ? [...priced].sort((a, b) => perToken(a) - perToken(b))[0].id : null;
  const savingPercent = (p: TokenTopupPlan) => {
    if (!basePerToken || p.tokens <= 0) return 0;
    const pct = Math.round((1 - perToken(p) / basePerToken) * 100);
    return pct >= 5 ? pct : 0;
  };

  const remainingPct =
    usage && usage.daily_limit > 0
      ? Math.max(0, Math.min(100, Math.round((usage.remaining_tokens / usage.daily_limit) * 100)))
      : 0;
  const usedPct = usage && usage.daily_limit > 0 ? Math.min(100, (usage.used_tokens / usage.daily_limit) * 100) : 0;

  const handleBuy = async () => {
    if (!selectedPlan || !selectedPlan.product_id) return;
    setPhase('buying');
    setErrorDetail(null);
    try {
      const result = await bazaar.purchaseProduct(selectedPlan.product_id);
      await verifyTokenTopupPurchase(selectedPlan.product_id, result.purchaseToken);
      // consumable: باید consume بشه تا کاربر بتونه دوباره همین بسته رو بخره.
      await bazaar.consumePurchase(result.purchaseToken).catch(() => {});
      track('token_topup_purchased', selectedPlan.product_id);
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
          <Text style={styles.successTitle}>{t('tokenTopupSuccessTitle')}</Text>
          <Text style={styles.successSub}>{t('tokenTopupSuccessSub')}</Text>
          <TouchableOpacity style={styles.buyBtn} activeOpacity={0.85} onPress={() => navigation.goBack()}>
            <Text style={styles.buyBtnText}>{t('tokenTopupSuccessBtn')}</Text>
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
          {usage && (
            <View style={[styles.badge, row]}>
              <View style={[styles.badgeDot, usage.has_active_subscription && styles.badgeDotActive]} />
              <Text style={styles.badgeText}>
                {t(usage.has_active_subscription ? 'tokenTopupSubActive' : 'tokenTopupSubNone')}
              </Text>
            </View>
          )}
        </View>

        <View style={[styles.iconWrap, rtl && styles.selfEnd]}>
          <Coins color={COLORS.primary} size={26} />
        </View>
        <Text style={[styles.title, align]}>{t('tokenTopupTitle')}</Text>
        <Text style={[styles.subtitle, align]}>{t('tokenTopupSubtitle')}</Text>

        {usage && (
          <View style={styles.usageCard}>
            <View style={[styles.usageHead, row]}>
              <View style={[styles.usageLabelRow, row]}>
                <Zap size={14} color={COLORS.muted} />
                <Text style={styles.usageLabel}>{t('tokenTopupUsageToday')}</Text>
              </View>
              <View style={styles.remainingChip}>
                <Text style={styles.remainingChipText}>
                  {t('tokenTopupRemainingPct').replace('{n}', num(remainingPct))}
                </Text>
              </View>
            </View>
            <Text style={[styles.usageValue, align]}>
              {t('tokenTopupUsedOf')
                .replace('{used}', num(usage.used_tokens))
                .replace('{limit}', num(usage.daily_limit))}
            </Text>
            <View style={styles.usageTrack}>
              <View style={[styles.usageFill, rtl && styles.selfEnd, { width: `${usedPct}%` }]} />
            </View>
            {usage.credit_balance > 0 && (
              <Text style={[styles.usageCredit, align]}>
                {t('tokenTopupCreditBalance')}: {num(usage.credit_balance)}
              </Text>
            )}
          </View>
        )}

        <View style={[styles.sectionHead, row]}>
          <Text style={styles.sectionTitle}>{t('tokenTopupPacksTitle')}</Text>
          <Text style={styles.sectionNote}>{t('tokenTopupPacksNote')}</Text>
        </View>

        {plans.length === 0 ? (
          <View style={styles.errorBox}>
            <Text style={[styles.errorText, align]}>{t('tokenTopupPlansLoadError')}</Text>
          </View>
        ) : (
          <View style={styles.plansList}>
            {plans.map((p) => {
              const active = p.id === selectedId;
              const saving = savingPercent(p);
              const best = p.id === bestValueId;
              return (
                <TouchableOpacity
                  key={p.id}
                  style={[styles.planCard, active && styles.planCardActive]}
                  activeOpacity={0.85}
                  onPress={() => setSelectedId(p.id)}
                >
                  {(best || saving > 0) && (
                    <View style={[styles.planTags, row]}>
                      {best && (
                        <View style={[styles.tag, styles.tagBest]}>
                          <Text style={[styles.tagText, styles.tagTextBest]}>{t('tokenTopupBestValue')}</Text>
                        </View>
                      )}
                      {saving > 0 && (
                        <View style={[styles.tag, styles.tagSave]}>
                          <Text style={[styles.tagText, styles.tagTextSave]}>
                            {t('paywallPlanSave').replace('{n}', num(saving))}
                          </Text>
                        </View>
                      )}
                    </View>
                  )}
                  <View style={[styles.planRow, row]}>
                    <View style={[styles.radio, active && styles.radioActive]}>
                      {active && <View style={styles.radioDot} />}
                    </View>
                    <View style={styles.planInfo}>
                      <Text style={[styles.planTokens, align, active && styles.activeText]}>
                        {num(p.tokens)} {t('tokenTopupTokensUnit')}
                      </Text>
                      <Text style={[styles.planName, align]}>{p.name}</Text>
                    </View>
                    <View style={styles.priceCol}>
                      <Text style={[styles.planPrice, active && styles.activeText]}>{num(p.price_toman)}</Text>
                      <Text style={styles.planCurrency}>{t('paywallToman')}</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        <View style={[styles.noteRow, row]}>
          <ShieldCheck size={15} color={COLORS.success} />
          <Text style={[styles.noteText, align]}>{t('tokenTopupNoReset')}</Text>
        </View>

        {phase === 'error' && (
          <View style={styles.errorBox}>
            <Text style={[styles.errorText, align]}>{t('tokenTopupErrorGeneric')}</Text>
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
              <Text style={styles.buyBtnText}>{t('tokenTopupProcessing')}</Text>
            </>
          ) : (
            <>
              <Sparkles color={COLORS.white} size={18} />
              <Text style={styles.buyBtnText}>
                {selectedPlan
                  ? t('tokenTopupBuyWithPrice').replace('{price}', num(selectedPlan.price_toman))
                  : t('tokenTopupBuyButton')}
              </Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  rowReverse: { flexDirection: 'row-reverse' },
  textRight: { textAlign: 'right' },
  selfEnd: { alignSelf: 'flex-end' },
  screen: {
    flex: 1,
    backgroundColor: COLORS.backgroundSoft,
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
    marginBottom: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    borderRadius: BORDER_RADIUS.full,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  badgeDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: COLORS.secondary },
  badgeDotActive: { backgroundColor: COLORS.success },
  badgeText: { color: COLORS.textSecondary, fontFamily: FONT_FAMILY.medium, fontSize: 11 },
  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: 18,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  title: {
    color: COLORS.text,
    fontFamily: FONT_FAMILY.bold,
    fontSize: 24,
    marginBottom: 8,
  },
  subtitle: {
    color: COLORS.textSecondary,
    fontFamily: FONT_FAMILY.regular,
    fontSize: 13,
    lineHeight: 22,
    marginBottom: 18,
  },
  usageCard: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    padding: 16,
    marginBottom: 22,
  },
  usageHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  usageLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  usageLabel: {
    color: COLORS.textSecondary,
    fontFamily: FONT_FAMILY.medium,
    fontSize: 12,
  },
  remainingChip: {
    backgroundColor: COLORS.successLight,
    borderRadius: BORDER_RADIUS.full,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  remainingChipText: { color: COLORS.success, fontFamily: FONT_FAMILY.semiBold, fontSize: 10 },
  usageValue: {
    color: COLORS.text,
    fontFamily: FONT_FAMILY.bold,
    fontSize: 18,
  },
  usageTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.surfaceHigh,
    overflow: 'hidden',
    marginTop: 10,
  },
  usageFill: { height: '100%', borderRadius: 3, backgroundColor: COLORS.primary },
  usageCredit: {
    color: COLORS.primaryDark,
    fontFamily: FONT_FAMILY.medium,
    fontSize: 12,
    marginTop: 8,
  },
  sectionHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  sectionTitle: { color: COLORS.text, fontFamily: FONT_FAMILY.bold, fontSize: 14 },
  sectionNote: { color: COLORS.primaryDark, fontFamily: FONT_FAMILY.medium, fontSize: 11 },
  plansList: {
    gap: 10,
    marginBottom: 14,
  },
  planCard: {
    backgroundColor: COLORS.white,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    paddingVertical: 14,
    paddingHorizontal: 14,
  },
  planCardActive: {
    borderColor: COLORS.primary,
    borderWidth: 1.5,
    backgroundColor: '#FFF6F2',
  },
  planTags: { flexDirection: 'row', gap: 6, marginBottom: 8 },
  tag: { borderRadius: BORDER_RADIUS.full, paddingHorizontal: 8, paddingVertical: 2 },
  tagBest: { backgroundColor: COLORS.primary },
  tagSave: { backgroundColor: COLORS.successLight },
  tagText: { fontFamily: FONT_FAMILY.semiBold, fontSize: 10 },
  tagTextBest: { color: COLORS.white },
  tagTextSave: { color: COLORS.success },
  planRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioActive: { borderColor: COLORS.primary },
  radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: COLORS.primary },
  planInfo: { flex: 1 },
  planTokens: {
    color: COLORS.text,
    fontFamily: FONT_FAMILY.bold,
    fontSize: 15,
  },
  planName: {
    color: COLORS.muted,
    fontFamily: FONT_FAMILY.regular,
    fontSize: 11,
    marginTop: 2,
  },
  priceCol: { alignItems: 'center' },
  planPrice: {
    color: COLORS.text,
    fontFamily: FONT_FAMILY.bold,
    fontSize: 15,
  },
  planCurrency: { color: COLORS.muted, fontFamily: FONT_FAMILY.regular, fontSize: 10 },
  activeText: {
    color: COLORS.primaryDark,
  },
  noteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginBottom: 16,
  },
  noteText: { color: COLORS.textSecondary, fontFamily: FONT_FAMILY.regular, fontSize: 11 },
  errorBox: {
    backgroundColor: COLORS.errorLight,
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
    color: COLORS.textSecondary,
    fontFamily: FONT_FAMILY.regular,
    fontSize: 11,
    marginTop: 4,
  },
  buyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: COLORS.primary,
    borderRadius: 16,
    height: 54,
    paddingHorizontal: 28,
  },
  buyBtnDisabled: { opacity: 0.6 },
  buyBtnText: {
    color: COLORS.white,
    fontFamily: FONT_FAMILY.bold,
    fontSize: 15,
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
