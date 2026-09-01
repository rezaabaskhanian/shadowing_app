import React, { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { ArrowLeft, CheckCircle2, Lock, RotateCcw, Sparkles } from 'lucide-react-native';
import { useBazaar } from '@cafebazaar/react-native-poolakey';

import { COLORS, BORDER_RADIUS } from '../../theme/colors';
import { FONT_FAMILY } from '../../theme/typography';
import { useLanguage } from '../../data/i18n';
import { useScenes } from '../../data/ScenesContext';
import { getSubscriptionPlans, verifyPurchase, SubscriptionPlan } from '../../api/billing';
import { CAFEBAZAAR_RSA_KEY } from '../../api/config';

const formatToman = (n: number) => n.toLocaleString('en-US');

type Phase = 'loading' | 'idle' | 'buying' | 'restoring' | 'error' | 'success';

export const PaywallScreen = () => {
  const navigation = useNavigation<any>();
  const { t } = useLanguage();
  const { reload } = useScenes();
  const bazaar = useBazaar(CAFEBAZAAR_RSA_KEY || null);

  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [phase, setPhase] = useState<Phase>('loading');
  const [errorDetail, setErrorDetail] = useState<string | null>(null);

  useEffect(() => {
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
    return () => {
      active = false;
    };
  }, []);

  const selectedPlan = plans.find((p) => p.id === selectedId) || null;
  const busy = phase === 'buying' || phase === 'restoring';

  const handleBuy = async () => {
    if (!selectedPlan || !selectedPlan.product_id) return;
    setPhase('buying');
    setErrorDetail(null);
    try {
      const result = await bazaar.purchaseProduct(selectedPlan.product_id);
      await verifyPurchase(selectedPlan.product_id, result.purchaseToken);
      // مصرف‌کردن خرید توی کافه‌بازار لازمه وگرنه چون این محصول non-consumable
      // ثبت شده، دفعه‌ی بعد (مثلاً بعد از انقضای اشتراک) دیگه قابل خرید نیست.
      await bazaar.consumePurchase(result.purchaseToken).catch(() => {});
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
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <ArrowLeft color={COLORS.text} size={22} />
        </TouchableOpacity>

        <View style={styles.iconWrap}>
          <Lock color={COLORS.primary} size={28} />
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
              return (
                <TouchableOpacity
                  key={p.id}
                  style={[styles.planCard, active && styles.planCardActive]}
                  activeOpacity={0.85}
                  onPress={() => setSelectedId(p.id)}
                >
                  <Text style={[styles.planName, active && styles.planNameActive]}>{p.name}</Text>
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
            <Text style={styles.errorText}>{t('paywallErrorGeneric')}</Text>
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
          style={styles.restoreBtn}
          activeOpacity={0.85}
          disabled={busy}
          onPress={handleRestore}
        >
          <RotateCcw color={COLORS.textSecondary} size={16} />
          <Text style={styles.restoreBtnText}>
            {phase === 'restoring' ? t('paywallProcessing') : t('paywallRestoreButton')}
          </Text>
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
  restoreBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 44,
    marginTop: 4,
  },
  restoreBtnText: {
    color: COLORS.textSecondary,
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
