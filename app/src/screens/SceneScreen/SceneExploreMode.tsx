import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { ChevronLeft, ChevronRight, Mic } from 'lucide-react-native';

import { COLORS } from '../../theme/colors';
import { FONT_FAMILY } from '../../theme/typography';
import type { DialogueItem, Hotspot } from '../../data/scenarios';

interface SceneExploreModeProps {
  currentDialogue: DialogueItem;
  sceneHotspots: Hotspot[];
  activeHotspotIndex: number;
  onGoToHotspot: (hotspotIdx: number) => void;
  onStartShadowing: () => void;
  t: (key: string) => string;
}

/**
 * حالت «اکسپلور»: قبل از شروع تمرین ۴مرحله‌ای، کاربر می‌تواند بین
 * هات‌اسپات‌های صحنه جابه‌جا شود و متن/ترجمه‌ی هر کدام را ببیند.
 */
export const SceneExploreMode: React.FC<SceneExploreModeProps> = ({
  currentDialogue,
  sceneHotspots,
  activeHotspotIndex,
  onGoToHotspot,
  onStartShadowing,
  t,
}) => {
  return (
    <View style={styles.exploreModeContainer}>
      <View style={styles.exploreHeaderRow}>
        <View style={styles.speakerPill}>
          <Text style={styles.speakerText}>{(currentDialogue.speaker || 'SPEAKER').toUpperCase()}</Text>
        </View>
      </View>

      <Text style={styles.englishText}>{currentDialogue.dialogue || 'Great. Can I pay by card?'}</Text>
      <Text style={styles.translationText}>{currentDialogue.translation}</Text>

      {/* Hotspot Prev/Next Navigation */}
      <View style={styles.hotspotNavRow}>
        <TouchableOpacity
          style={styles.hotspotNavBtn}
          disabled={activeHotspotIndex === 0}
          onPress={() => onGoToHotspot(activeHotspotIndex - 1)}
        >
          <ChevronLeft size={18} color={activeHotspotIndex === 0 ? COLORS.border : COLORS.text} />
        </TouchableOpacity>

        <Text style={styles.hotspotSelectTitle}>
          {t('hotspots')} {activeHotspotIndex + 1} / {sceneHotspots.length}
        </Text>

        <TouchableOpacity
          style={styles.hotspotNavBtn}
          disabled={activeHotspotIndex >= sceneHotspots.length - 1}
          onPress={() => onGoToHotspot(activeHotspotIndex + 1)}
        >
          <ChevronRight
            size={18}
            color={activeHotspotIndex >= sceneHotspots.length - 1 ? COLORS.border : COLORS.text}
          />
        </TouchableOpacity>
      </View>

      {/* Hotspots Selector Row */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.hotspotChipContent}
        style={styles.hotspotChipScroll}
      >
        {sceneHotspots.map((hs, i) => (
          <TouchableOpacity
            key={hs.id || i}
            style={[styles.hotspotChip, activeHotspotIndex === i ? styles.hotspotChipActive : null]}
            onPress={() => onGoToHotspot(i)}
          >
            <Text
              style={[
                styles.hotspotChipText,
                activeHotspotIndex === i ? styles.hotspotChipTextActive : null,
              ]}
            >
              #{i + 1} {hs.speaker}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Primary CTA: Start 4-Step Shadowing Practice */}
      <TouchableOpacity activeOpacity={0.88} style={styles.startShadowingCtaBtn} onPress={onStartShadowing}>
        <Mic size={20} color={COLORS.white} />
        <Text style={styles.startShadowingCtaText}>Start 4-Step Shadowing Practice 🎙️</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  exploreModeContainer: {
    flex: 1,
    paddingVertical: 4,
    justifyContent: 'space-between',
   
  },
  exploreHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  speakerPill: {
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginBottom: 6,
  },
  speakerText: {
    color: COLORS.primary,
    fontFamily: FONT_FAMILY.bold,
    fontSize: 11,
    letterSpacing: 0.8,
  },
  englishText: {
    color: COLORS.text,
    fontFamily: FONT_FAMILY.bold,
    fontSize: 19,
    lineHeight: 26,
    marginBottom: 4,
  },
  translationText: {
    color: COLORS.textSecondary,
    fontFamily: FONT_FAMILY.regular,
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 8,
  },
  hotspotNavRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    marginTop: 12,
  },
  hotspotNavBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hotspotSelectTitle: {
    color: COLORS.textSecondary,
    fontFamily: FONT_FAMILY.semiBold,
    fontSize: 12,
    marginBottom: 6,
  },
  hotspotChipScroll: {
    marginVertical: 20,
  },
  hotspotChipContent: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  hotspotChip: {
    height: 35,
    backgroundColor: COLORS.surfaceLight,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    marginRight: 8,
    borderWidth: 1,
    justifyContent: 'center',
    alignSelf: 'center',
    borderColor: COLORS.border,
  },
  hotspotChipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  hotspotChipText: {
    color: COLORS.textSecondary,
    fontFamily: FONT_FAMILY.semiBold,
    fontSize: 12,
  },
  hotspotChipTextActive: {
    color: COLORS.white,
  },
  startShadowingCtaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    borderRadius: 22,
    gap: 8,
    marginTop: 6,
  },
  startShadowingCtaText: {
    color: COLORS.white,
    fontFamily: FONT_FAMILY.bold,
    fontSize: 15,
  },
});
