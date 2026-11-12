import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Flame, Globe, Menu } from 'lucide-react-native';
import { COLORS, SPACING } from '../../theme/colors';
import { FONT_FAMILY } from '../../theme/typography';
import { SHADOWS } from '../../theme/elevation';

interface HomeHeaderProps {
  language: string;
  onToggleLanguage: () => void;
  streak: number;
  onOpenStreakInfo: () => void;
  onOpenDrawer: () => void;
  rtl: boolean;
}

export const HomeHeader: React.FC<HomeHeaderProps> = ({
  language,
  onToggleLanguage,
  streak,
  onOpenStreakInfo,
  onOpenDrawer,
  rtl,
}) => {
  return (
    <View style={[styles.container, rtl && styles.rowReverse]}>
      {/* Menu Hamburger */}
      <TouchableOpacity
        style={styles.menuBtn}
        onPress={onOpenDrawer}
        activeOpacity={0.75}
        accessibilityLabel="Menu"
      >
        <Menu size={20} color={COLORS.text} strokeWidth={2.2} />
      </TouchableOpacity>

      {/* Right side pills: Language & Streak */}
      <View style={[styles.pillsRow, rtl && styles.rowReverse]}>
        {/* Language selector pill */}
        <TouchableOpacity
          style={styles.pill}
          onPress={onToggleLanguage}
          activeOpacity={0.75}
          accessibilityLabel="Toggle language"
        >
          <Text style={styles.pillText}>{language.toUpperCase()}</Text>
          <Globe size={13} color={COLORS.textSecondary} />
        </TouchableOpacity>

        {/* Streak counter pill */}
        <TouchableOpacity
          style={styles.pill}
          onPress={onOpenStreakInfo}
          activeOpacity={0.75}
          accessibilityLabel="Streak information"
        >
          <Text style={styles.streakText}>{streak}</Text>
          <Flame size={15} color="#FF7A00" fill="#FF7A00" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.l,
    paddingTop: SPACING.xs,
    paddingBottom: SPACING.s,
  },
  rowReverse: {
    flexDirection: 'row-reverse',
  },
  menuBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#F0EBE3',
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.level1,
  },
  pillsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  pill: {
    height: 38,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#F0EBE3',
    borderRadius: 20,
    paddingHorizontal: 12,
    ...SHADOWS.level1,
  },
  pillText: {
    fontFamily: FONT_FAMILY.bold,
    fontSize: 12.5,
    color: COLORS.text,
  },
  streakText: {
    fontFamily: FONT_FAMILY.bold,
    fontSize: 13,
    color: COLORS.text,
  },
});

