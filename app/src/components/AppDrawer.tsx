import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { useIsFocused, useNavigation } from '@react-navigation/native';
import {
  ChevronRight,
  Coins,
  HelpCircle,
  Lightbulb,
  LogOut,
  Mail,
  Target,
  User as UserIcon,
  Zap,
} from 'lucide-react-native';
import { COLORS, BORDER_RADIUS, SPACING } from '../theme/colors';
import { FONT_FAMILY } from '../theme/typography';
import { useLanguage } from '../data/i18n';
import { useAuth } from '../data/AuthContext';
import { getMyPoints } from '../api/submissions';

const DRAWER_WIDTH = Math.min(320, Dimensions.get('window').width * 0.82);

interface AppDrawerProps {
  visible: boolean;
  onClose: () => void;
}

// کشوی کناری (راست) شامل خلاصه کاربر، عادت زبانی، راهنما و خروج از حساب.
export const AppDrawer = ({ visible, onClose }: AppDrawerProps) => {
  const navigation = useNavigation<any>();
  const isFocused = useIsFocused();
  const { t } = useLanguage();
  const { user, logout } = useAuth();
  const [points, setPoints] = useState(0);
  const translateX = useRef(new Animated.Value(DRAWER_WIDTH)).current;

  // مودال فقط وقتی صفحه‌ی میزبان (مثلاً Home) فوکوس داره نمایش داده میشه؛
  // با رفتن به صفحه‌ی دیگه مخفی میشه ولی state باز بودنش (visible) دست‌نخورده می‌مونه
  // تا با برگشت به این صفحه، دراور خودکار دوباره باز بشه.
  const modalVisible = visible && isFocused;

  useEffect(() => {
    if (modalVisible) {
      getMyPoints()
        .then(setPoints)
        .catch(() => {});
      Animated.timing(translateX, {
        toValue: 0,
        duration: 260,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(translateX, {
        toValue: DRAWER_WIDTH,
        duration: 220,
        useNativeDriver: true,
      }).start();
    }
  }, [modalVisible, translateX]);

  // ناوبری از دراور، خودِ visible رو نمی‌بنده؛ فقط چون فوکوس این صفحه از دست میره
  // مودال مخفی میشه و با برگشت به این صفحه دوباره باز میشه.
  const go = (screen: string, params?: object) => {
    navigation.navigate(screen, params);
  };

  return (
    <Modal visible={modalVisible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <TouchableWithoutFeedback onPress={onClose}>
          <View style={StyleSheet.absoluteFill} />
        </TouchableWithoutFeedback>

        <Animated.View style={[styles.drawer, { transform: [{ translateX }] }]}>
          {/* <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
            <X color={COLORS.text} size={20} />
          </TouchableOpacity> */}

          {/* User summary */}
          <View style={styles.userIdentity}>
            <View style={styles.avatarCircle}>
              <UserIcon size={22} color={COLORS.primary} />
            </View>
            <Text style={styles.userName} numberOfLines={1}>
              {user?.nickname || ''}
            </Text>
          </View>

          {/* My Points banner */}
          <TouchableOpacity
            style={styles.pointsCard}
            activeOpacity={0.85}
            onPress={() => go('MySubmissions')}
          >
            <View style={styles.pointsIconWrap}>
              <Coins color={COLORS.secondary} size={22} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.pointsValue}>
                {points} · {t('myPoints')}
              </Text>
              <Text style={styles.pointsSub}>{t('myPointsSub')}</Text>
            </View>
            <ChevronRight color={COLORS.muted} size={18} />
          </TouchableOpacity>

          <View style={styles.dividerLine} />

          {/* Language Habit */}

          <View style={{flex:1,justifyContent:'space-between',}}>
          <View style={styles.sectionHeaderRow}>
            <Zap color={COLORS.primary} size={18} />
            <Text style={styles.sectionTitle}>{t('habitCardTitle')}</Text>
          </View>

          <TouchableOpacity
            style={styles.row}
            activeOpacity={0.7}
            onPress={() => go('LanguageHabit')}
          >
            <Target color={COLORS.primary} size={18} />
            <Text style={styles.rowText}>{t('habitRealSituations')}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.row}
            activeOpacity={0.7}
            onPress={() => go('TopicSuggestion')}
          >
            <Lightbulb color={COLORS.primary} size={18} />
            <Text style={styles.rowText}>{t('habitSuggestTopic')}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.row}
            activeOpacity={0.7}
            onPress={() => go('ContactUs')}
          >
            <Mail color={COLORS.primary} size={18} />
            <Text style={styles.rowText}>{t('habitContactUs')}</Text>
          </TouchableOpacity>

          </View>

          <View style={{ flex: 1 }} />

          <View style={styles.dividerLine} />

          <TouchableOpacity style={styles.row} activeOpacity={0.7}>
            <HelpCircle color={COLORS.primary} size={18} />
            <Text style={styles.rowText}>{t('helpFaq')}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.row}
            activeOpacity={0.7}
            onPress={() => {
              onClose();
              logout();
            }}
          >
            <LogOut color={COLORS.error} size={18} />
            <Text style={[styles.rowText, { color: COLORS.error }]}>{t('logout')}</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  drawer: {
    width: DRAWER_WIDTH,
    height: '100%',
    backgroundColor: COLORS.surface,
    paddingTop: 56,
    paddingHorizontal: SPACING.m,
    paddingBottom: SPACING.l,
  },
  closeBtn: {
    position: 'absolute',
    top: 16,
    left: 16,
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.backgroundSoft,
  },
  userIdentity: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
  },
  avatarCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  userName: {
    color: COLORS.text,
    fontFamily: FONT_FAMILY.bold,
    fontSize: 15,
    flexShrink: 1,
  },
  pointsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: COLORS.backgroundSoft,
    borderRadius: BORDER_RADIUS.l,
    padding: 14,
    marginBottom: 16,
  },
  pointsIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pointsValue: {
    color: COLORS.text,
    fontFamily: FONT_FAMILY.bold,
    fontSize: 14,
  },
  pointsSub: {
    color: COLORS.textSecondary,
    fontFamily: FONT_FAMILY.regular,
    fontSize: 11,
    marginTop: 2,
  },
  dividerLine: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: 12,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  sectionTitle: {
    color: COLORS.text,
    fontFamily: FONT_FAMILY.bold,
    fontSize: 14,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
  },
  rowText: {
    color: COLORS.text,
    fontFamily: FONT_FAMILY.medium,
    fontSize: 14,
  },
});
