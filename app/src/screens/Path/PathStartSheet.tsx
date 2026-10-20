import React, { useState } from 'react';
import { ActivityIndicator, Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { ChevronLeft, ListChecks, Mic, Play, Sprout } from 'lucide-react-native';

import { COLORS, SPACING, BORDER_RADIUS } from '../../theme/colors';
import { FONT_FAMILY, TEXT_STYLES } from '../../theme/typography';
import { useLanguage } from '../../data/i18n';
import type { MyLevel, SceneLevel } from '../../api/assessment';

const LEVELS: { id: SceneLevel; labelKey: string }[] = [
  { id: 'starter', labelKey: 'levelStarter' },
  { id: 'beginner', labelKey: 'levelBeginner' },
  { id: 'intermediate', labelKey: 'levelIntermediate' },
  { id: 'advanced', labelKey: 'levelAdvanced' },
  { id: 'proficient', labelKey: 'levelProficient' },
];

interface PathStartSheetProps {
  visible: boolean;
  onClose: () => void;
  /** سطح‌هایی که مسیر فعال دارند؛ فقط همین‌ها قابل انتخاب‌اند. */
  pathLevels: string[];
  myLevel: MyLevel | null;
  /** null یعنی ادمین تست نساخته و گزینه‌ی تست نشان داده نمی‌شود. */
  onTakeTest: (() => void) | null;
  /** manual=true یعنی سطح را کاربر خودش انتخاب کرده و باید ذخیره شود. */
  onStart: (level: SceneLevel, manual: boolean) => Promise<void> | void;
}

/**
 * پیش از شروع مسیر آموزشی: تعیین سطح دیگر بعد از ورود اجباری نیست و اینجا
 * پیشنهاد می‌شود — تست کوتاه، انتخاب دستی سطح، یا شروع از اول.
 */
export const PathStartSheet: React.FC<PathStartSheetProps> = ({
  visible,
  onClose,
  pathLevels,
  myLevel,
  onTakeTest,
  onStart,
}) => {
  const { t } = useLanguage();
  const [picking, setPicking] = useState(false);
  const [busy, setBusy] = useState(false);

  const available = LEVELS.filter((l) => pathLevels.includes(l.id));
  const firstLevel = available[0]?.id;
  // سطح فعلی فقط وقتی پیشنهاد می‌شود که واقعاً معلوم باشد (تست یا انتخاب دستی).
  const current = myLevel && myLevel.source !== 'default' && pathLevels.includes(myLevel.scene_level)
    ? LEVELS.find((l) => l.id === myLevel.scene_level)
    : undefined;

  const close = () => {
    setPicking(false);
    onClose();
  };

  const start = async (level: SceneLevel, manual: boolean) => {
    setBusy(true);
    try {
      await onStart(level, manual);
      setPicking(false);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={close}>
      <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={close}>
        <TouchableOpacity style={styles.card} activeOpacity={1} onPress={() => {}}>
          <Text style={styles.title}>{t('pathStartSheetTitle')}</Text>
          <Text style={styles.sub}>{t('pathStartSheetSub')}</Text>

          {busy ? (
            <ActivityIndicator color={COLORS.primary} style={{ marginVertical: SPACING.l }} />
          ) : picking ? (
            <View style={styles.list}>
              {available.map((l) => (
                <TouchableOpacity key={l.id} style={styles.levelRow} onPress={() => start(l.id, true)}>
                  <Text style={styles.levelText}>{t(l.labelKey)}</Text>
                  <ChevronLeft size={18} color={COLORS.muted} />
                </TouchableOpacity>
              ))}
              <TouchableOpacity onPress={() => setPicking(false)}>
                <Text style={styles.back}>{t('pathStartBack')}</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.list}>
              {current && (
                <Option
                  icon={<Play size={20} color={COLORS.primary} />}
                  title={t('pathStartContinue').replace('{level}', t(current.labelKey))}
                  onPress={() => start(current.id, false)}
                />
              )}
              {onTakeTest && (
                <Option
                  icon={<Mic size={20} color={COLORS.primary} />}
                  title={t('pathStartTest')}
                  sub={t('pathStartTestSub')}
                  onPress={onTakeTest}
                />
              )}
              {available.length > 1 && (
                <Option
                  icon={<ListChecks size={20} color={COLORS.primary} />}
                  title={t('pathStartPick')}
                  onPress={() => setPicking(true)}
                />
              )}
              {firstLevel && (
                <Option
                  icon={<Sprout size={20} color={COLORS.primary} />}
                  title={t('pathStartFromScratch')}
                  onPress={() => start(firstLevel, true)}
                />
              )}
            </View>
          )}
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
};

const Option: React.FC<{ icon: React.ReactNode; title: string; sub?: string; onPress: () => void }> = ({
  icon,
  title,
  sub,
  onPress,
}) => (
  <TouchableOpacity style={styles.option} onPress={onPress} activeOpacity={0.85}>
    <View style={styles.optionIcon}>{icon}</View>
    <View style={{ flex: 1 }}>
      <Text style={styles.optionTitle}>{title}</Text>
      {!!sub && <Text style={styles.optionSub}>{sub}</Text>}
    </View>
    <ChevronLeft size={18} color={COLORS.muted} />
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  title: { ...TEXT_STYLES.headlineSm, color: COLORS.text, fontFamily: FONT_FAMILY.bold, textAlign: 'center' },
  sub: { ...TEXT_STYLES.bodyMd, color: COLORS.textSecondary, textAlign: 'center', marginTop: SPACING.xs },
  list: { marginTop: SPACING.m, gap: SPACING.s },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.m,
    padding: SPACING.m,
    borderRadius: BORDER_RADIUS.l,
    backgroundColor: COLORS.surfaceHigh,
  },
  optionIcon: {
    width: 38,
    height: 38,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionTitle: { ...TEXT_STYLES.bodyLg, color: COLORS.text, fontFamily: FONT_FAMILY.semiBold },
  optionSub: { ...TEXT_STYLES.bodyMd, color: COLORS.textSecondary },
  levelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SPACING.m,
    borderRadius: BORDER_RADIUS.l,
    backgroundColor: COLORS.surfaceHigh,
  },
  levelText: { ...TEXT_STYLES.bodyLg, color: COLORS.text, fontFamily: FONT_FAMILY.semiBold },
  back: { ...TEXT_STYLES.bodyMd, color: COLORS.primary, textAlign: 'center', marginTop: SPACING.xs },
});
