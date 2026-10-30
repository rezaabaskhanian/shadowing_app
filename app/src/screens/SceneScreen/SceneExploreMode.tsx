import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Mic, Volume2 } from 'lucide-react-native';

import { COLORS } from '../../theme/colors';
import { FONT_FAMILY } from '../../theme/typography';
import { GradientFill } from '../../components/GradientFill';
import type { DialogueItem, Hotspot } from '../../data/scenarios';

interface SceneExploreModeProps {
  currentDialogue: DialogueItem;
  sceneHotspots: Hotspot[];
  activeHotspotIndex: number;
  onGoToHotspot: (hotspotIdx: number) => void;
  onStartShadowing: () => void;
  /** پخش دوباره‌ی جمله‌ی نمایش‌داده‌شده. */
  onPlayLine: () => void;
  rtl: boolean;
  t: (key: string) => string;
}

const toFa = (s: string) => s.replace(/\d/g, (d) => '۰۱۲۳۴۵۶۷۸۹'[Number(d)]);

/**
 * حالت «اکسپلور»: قبل از شروع تمرین ۴مرحله‌ای، کاربر بین شخصیت‌های صحنه
 * جابه‌جا می‌شود، جمله‌ی اول هر کدام را می‌بیند/می‌شنود و نقشش را انتخاب می‌کند.
 */
export const SceneExploreMode: React.FC<SceneExploreModeProps> = ({
  currentDialogue,
  sceneHotspots,
  activeHotspotIndex,
  onGoToHotspot,
  onStartShadowing,
  onPlayLine,
  rtl,
  t,
}) => {
  const row = rtl && styles.rowReverse;
  const count = String(sceneHotspots.length);
  return (
    <View style={styles.exploreModeContainer}>
      <View style={styles.lineCard}>
        <View style={[styles.cardHeader, row]}>
          <View style={[styles.speakerGroup, row]}>
            <View style={styles.speakerPill}>
              <Text style={styles.speakerText}>{(currentDialogue.speaker || 'SPEAKER').toUpperCase()}</Text>
            </View>
            <Text style={styles.firstLineLabel}>{t('exploreFirstLine')}</Text>
          </View>
          <TouchableOpacity style={styles.speakerBtn} onPress={onPlayLine} activeOpacity={0.8}>
            <Volume2 size={18} color={COLORS.primary} fill={COLORS.primary} />
          </TouchableOpacity>
        </View>

        <Text style={styles.englishText}>{currentDialogue.dialogue}</Text>
        <Text style={[styles.translationText, rtl && styles.textRight]}>{currentDialogue.translation}</Text>
      </View>

      <View>
        <View style={[styles.roleHeader, row]}>
          <Text style={styles.roleTitle}>{t('exploreChooseRole')}</Text>
          <Text style={styles.roleCount}>
            {t('exploreCharacters').replace('{n}', rtl ? toFa(count) : count)}
          </Text>
        </View>
        <View style={[styles.roleRow, row]}>
          {sceneHotspots.map((hs, i) => {
            const on = activeHotspotIndex === i;
            return (
              <TouchableOpacity
                key={hs.id || i}
                style={[styles.roleBtn, on && styles.roleBtnActive]}
                onPress={() => onGoToHotspot(i)}
                activeOpacity={0.85}
              >
                <Text style={[styles.roleBtnText, on && styles.roleBtnTextActive]} numberOfLines={1}>
                  #{i + 1} {hs.speaker}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      <TouchableOpacity activeOpacity={0.88} style={styles.startShadowingCtaBtn} onPress={onStartShadowing}>
        <GradientFill from="#E8572F" to="#E2703F" horizontal />
        <View style={[styles.ctaInner, row]}>
          <Mic size={20} color={COLORS.white} />
          <Text style={styles.startShadowingCtaText}>{t('startFourStepPractice')}</Text>
        </View>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  rowReverse: { flexDirection: 'row-reverse' },
  textRight: { textAlign: 'right' },
  exploreModeContainer: {
    flex: 1,
    paddingTop: 6,
    gap: 28,
  },
  lineCard: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#EEECE8',
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  speakerGroup: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  speakerPill: {
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 8,
  },
  speakerText: {
    color: COLORS.primary,
    fontFamily: FONT_FAMILY.bold,
    fontSize: 12,
    letterSpacing: 0.8,
  },
  firstLineLabel: { color: COLORS.muted, fontFamily: FONT_FAMILY.regular, fontSize: 11 },
  speakerBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  englishText: {
    color: COLORS.text,
    fontFamily: FONT_FAMILY.bold,
    fontSize: 22,
    lineHeight: 30,
    textAlign: 'left',
    writingDirection: 'ltr',
    marginBottom: 2,
  },
  translationText: {
    color: COLORS.textSecondary,
    fontFamily: FONT_FAMILY.regular,
    fontSize: 14,
  },
  roleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  roleTitle: { color: COLORS.text, fontFamily: FONT_FAMILY.bold, fontSize: 12 },
  roleCount: { color: COLORS.muted, fontFamily: FONT_FAMILY.regular, fontSize: 11 },
  roleRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  roleBtn: {
    flexGrow: 1,
    flexBasis: '28%',
    height: 40,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E4E1DB',
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  // انتخاب‌شده با کادر نارنجی، نه پس‌زمینه‌ی پر؛ تا با دکمه‌ی اصلی تمرین رقابت نکند.
  roleBtnActive: {
    backgroundColor: COLORS.primaryLight,
    borderColor: COLORS.primary,
    borderWidth: 1.5,
  },
  roleBtnText: { color: COLORS.textSecondary, fontFamily: FONT_FAMILY.semiBold, fontSize: 13 },
  roleBtnTextActive: { color: COLORS.primary, fontFamily: FONT_FAMILY.bold },
  startShadowingCtaBtn: {
    marginTop: 'auto',
    height: 52,
    borderRadius: 18,
    overflow: 'hidden',
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
    shadowColor: COLORS.primary,
    shadowOpacity: 0.35,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
  },
  ctaInner: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  startShadowingCtaText: { color: COLORS.white, fontFamily: FONT_FAMILY.bold, fontSize: 15 },
});
