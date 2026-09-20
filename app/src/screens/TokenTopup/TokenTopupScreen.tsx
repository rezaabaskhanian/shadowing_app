import React, { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { ArrowLeft, CheckCircle2, Coins, Sparkles } from 'lucide-react-native';
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

const formatToman = (n: number) => n.toLocaleString('en-US');
const formatTokens = (n: number) => n.toLocaleString('en-US');

type Phase = 'loading' | 'idle' | 'buying' | 'error' | 'success';

/**
 * خریدِ مصرفیِ توکن — برای وقتی که کاربرِ مشترک به سقفِ رایگانِ روزانه‌اش
 * رسیده و نمی‌خواهد تا فردا صبر کند. برخلافِ PaywallScreen (اشتراک،
 * non-consumable که باید consume بشه تا دوباره قابل‌خرید بمونه)، این محصولات
 * mainly consumable هستند و هر بار می‌شود دوباره خرید.
 */
export const TokenTopupScreen = () => {
  const navigation = useNavigation<any>();
  const { t } = useLanguage();
  const bazaar = useBazaar(CAFEBAZAAR_RSA_KEY || null);

  const [plans, setPlans] = useState<TokenTopupPlan[]>([]);
  const [usage, setUsage] = useState<AIUsageStatus | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [phase, setPhase] = useState<Phase>('loading');
  const [errorDetail, setErrorDetail] = useState<string | null>(null);

  useEffect(() => {
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

  const handleBuy = async () => {
    if (!selectedPlan || !selectedPlan.product_id) return;
    setPhase('buying');
    setErrorDetail(null);
    try {
      const result = await bazaar.purchaseProduct(selectedPlan.product_id);
      await verifyTokenTopupPurchase(selectedPlan.product_id, result.purchaseToken);
      // consumable: باید consume بشه تا کاربر بتونه دوباره همین بسته رو بخره.
      await bazaar.consumePurchase(result.purchaseToken).catch(() => {});
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
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <ArrowLeft color={COLORS.text} size={22} />
        </TouchableOpacity>

        <View style={styles.iconWrap}>
          <Coins color={COLORS.primary} size={28} />
        </View>
        <Text style={styles.title}>{t('tokenTopupTitle')}</Text>
        <Text style={styles.subtitle}>{t('tokenTopupSubtitle')}</Text>

        {usage && (
          <View style={styles.usageCard}>
            <Text style={styles.usageLabel}>{t('tokenTopupUsageToday')}</Text>
            <Text style={styles.usageValue}>
              {t('tokenTopupUsedOf')
                .replace('{used}', formatTokens(usage.used_tokens))
                .replace('{limit}', formatTokens(usage.daily_limit))}
            </Text>
            {usage.credit_balance > 0 && (
              <Text style={styles.usageCredit}>
                {t('tokenTopupCreditBalance')}: {formatTokens(usage.credit_balance)}
              </Text>
            )}
          </View>
        )}

        {plans.length === 0 ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{t('tokenTopupPlansLoadError')}</Text>
          </View>
        ) : (
          <View style={styles.plansList}>
            {plans.map((p) => {
              const active = p.id === selectedId;
              return (
                <TouchableOpacity
                  key={p.id}
                  style={[styles.planCard, active && styles.planCardActive]}
                  activeOpacity={0.85}
                  onPress={() => setSelectedId(p.id)}
                >
                  <View>
                    <Text style={[styles.planName, active && styles.planNameActive]}>{p.name}</Text>
                    <Text style={styles.planTokens}>{formatTokens(p.tokens)} توکن</Text>
                  </View>
                  <Text style={[styles.planPrice, active && styles.planNameActive]}>
                    {formatToman(p.price_toman)} تومان
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {phase === 'error' && (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{t('tokenTopupErrorGeneric')}</Text>
            {errorDetail ? <Text style={styles.errorDetailText}>{errorDetail}</Text> : null}
          </View>
        )}

        <TouchableOpacity
          style={styles.buyBtn}
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
              <Text style={styles.buyBtnText}>{t('tokenTopupBuyButton')}</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 54,
    paddingBottom: 60,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  title: {
    color: COLORS.text,
    fontFamily: FONT_FAMILY.bold,
    fontSize: 22,
    marginBottom: 8,
  },
  subtitle: {
    color: COLORS.textSecondary,
    fontFamily: FONT_FAMILY.regular,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16,
  },
  usageCard: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.xl,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 14,
    marginBottom: 20,
  },
  usageLabel: {
    color: COLORS.textSecondary,
    fontFamily: FONT_FAMILY.medium,
    fontSize: 12,
    marginBottom: 4,
  },
  usageValue: {
    color: COLORS.text,
    fontFamily: FONT_FAMILY.bold,
    fontSize: 16,
  },
  usageCredit: {
    color: COLORS.primary,
    fontFamily: FONT_FAMILY.medium,
    fontSize: 12,
    marginTop: 6,
  },
  plansList: {
    gap: 10,
    marginBottom: 20,
  },
  planCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.xl,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  planCardActive: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primaryLight,
  },
  planName: {
    color: COLORS.text,
    fontFamily: FONT_FAMILY.medium,
    fontSize: 15,
  },
  planTokens: {
    color: COLORS.textSecondary,
    fontFamily: FONT_FAMILY.regular,
    fontSize: 12,
    marginTop: 2,
  },
  planPrice: {
    color: COLORS.text,
    fontFamily: FONT_FAMILY.bold,
    fontSize: 15,
  },
  planNameActive: {
    color: COLORS.primary,
  },
  errorBox: {
    backgroundColor: COLORS.backgroundSoft,
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
    height: 52,
  },
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
