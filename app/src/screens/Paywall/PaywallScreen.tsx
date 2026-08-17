import React, { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { ArrowLeft, CheckCircle2, Coins, Lock, Sparkles } from 'lucide-react-native';
import { useBazaar } from '@cafebazaar/react-native-poolakey';

import { COLORS, BORDER_RADIUS } from '../../theme/colors';
import { FONT_FAMILY } from '../../theme/typography';
import { useLanguage } from '../../data/i18n';
import { useScenes } from '../../data/ScenesContext';
import { getMyPoints } from '../../api/submissions';
import { verifyPurchase } from '../../api/billing';
import { bestTierForPoints, YEARLY_PLAN_PRICE_TOMAN } from '../../data/subscriptionTiers';
import { CAFEBAZAAR_RSA_KEY } from '../../api/config';

const formatToman = (n: number) => n.toLocaleString('en-US');

export const PaywallScreen = () => {
  const navigation = useNavigation<any>();
  const { t } = useLanguage();
  const { reload } = useScenes();
  const bazaar = useBazaar(CAFEBAZAAR_RSA_KEY || null);

  const [points, setPoints] = useState(0);
  const [phase, setPhase] = useState<'idle' | 'buying' | 'error' | 'success'>('idle');
  const [errorDetail, setErrorDetail] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    getMyPoints()
      .then((p) => active && setPoints(p))
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  const tier = bestTierForPoints(points);
  const discount = YEARLY_PLAN_PRICE_TOMAN - tier.priceToman;

  const handleBuy = async () => {
    setPhase('buying');
    setErrorDetail(null);
    try {
      const result = await bazaar.purchaseProduct(tier.productId);
      await verifyPurchase(tier.productId, result.purchaseToken);
      // مصرف‌کردن خرید توی کافه‌بازار لازمه وگرنه چون این محصول non-consumable
      // ثبت شده، دفعه‌ی بعد (مثلاً بعد از انقضای یک‌ساله) دیگه قابل خرید نیست.
      await bazaar.consumePurchase(result.purchaseToken).catch(() => {});
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

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <ArrowLeft color={COLORS.text} size={22} />
        </TouchableOpacity>

        <View style={styles.iconWrap}>
          <Lock color={COLORS.primary} size={28} />
        </View>
        <Text style={styles.title}>{t('paywallTitle')}</Text>
        <Text style={styles.subtitle}>{t('paywallSubtitle')}</Text>

        <View style={styles.pointsRow}>
          <Coins color={COLORS.secondary} size={18} />
          <Text style={styles.pointsText}>
            {t('paywallYourPoints')}: {points}
          </Text>
        </View>

        <View style={styles.priceCard}>
          <Text style={styles.priceLabel}>{t('paywallPriceLabel')}</Text>
          <Text style={styles.priceValue}>{formatToman(tier.priceToman)} تومان</Text>
          {discount > 0 && (
            <Text style={styles.discountText}>
              {t('paywallDiscountApplied')} (-{formatToman(discount)} تومان)
            </Text>
          )}
        </View>

        {phase === 'error' && (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{t('paywallErrorGeneric')}</Text>
            {errorDetail ? <Text style={styles.errorDetailText}>{errorDetail}</Text> : null}
          </View>
        )}

        <TouchableOpacity
          style={styles.buyBtn}
          activeOpacity={0.85}
          disabled={phase === 'buying'}
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
    marginBottom: 20,
  },
  pointsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  pointsText: {
    color: COLORS.text,
    fontFamily: FONT_FAMILY.medium,
    fontSize: 14,
  },
  priceCard: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.xl,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 18,
    marginBottom: 20,
  },
  priceLabel: {
    color: COLORS.textSecondary,
    fontFamily: FONT_FAMILY.medium,
    fontSize: 12,
    marginBottom: 6,
  },
  priceValue: {
    color: COLORS.text,
    fontFamily: FONT_FAMILY.bold,
    fontSize: 26,
  },
  discountText: {
    color: COLORS.tertiary,
    fontFamily: FONT_FAMILY.medium,
    fontSize: 12,
    marginTop: 8,
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
